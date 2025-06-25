import logging
import time
import asyncio
import os
from datetime import datetime, timezone
from typing import Dict, Any
import openai
from app.handlers.basehandler import BaseNodeHandler
from app.models.workflow_message import NodeExecutionMessage, NodeCompletionMessage
from app.core.config import settings

logger = logging.getLogger(__name__)

class TextGenerationHandler(BaseNodeHandler):
    """Simple OpenAI text generation handler with execution-specific Redis API key"""
    
    def __init__(self, redis_service):
        super().__init__(redis_service)
        logger.info("🔧 Initializing OpenAI text generation handler...")
        
        self.client = None
        self.default_model = "gpt-3.5-turbo" 
        self.max_tokens_limit = 300
        self._api_key_cache = None
        self._execution_id_cache = None  
        
        logger.info(f"✅ Text generation handler initialized - Max tokens: {self.max_tokens_limit}")

    async def _get_openai_client(self, execution_id: str,message:NodeExecutionMessage):
        """Get or create OpenAI client with execution-specific API key from Redis"""
        try:
         
            if (self.client is not None and 
                self._api_key_cache and 
                self._execution_id_cache == execution_id):
                return self.client
            
         
            execution_key = f"execution:{execution_id}:openai_api_key"
            api_key=message.context.get("openai")
            
            if api_key:
                logger.info(f"📝 Using execution-specific OpenAI API key from Redis: {execution_key}")
            else:
              
                api_key = await self.redis_service.get("openai_api_key")
                if api_key:
                    logger.info("📝 Using global OpenAI API key from Redis")
                else:
                    
                    api_key = getattr(settings, 'openai_api_key', None) or os.getenv('OPENAI_API_KEY')
                    if api_key:
                        logger.info("📝 Using OpenAI API key from environment/settings")
            
            if not api_key:
                raise ValueError("OpenAI API key not found in execution-specific Redis, global Redis, environment variables, or settings")
            
          
            if (api_key != self._api_key_cache or 
                execution_id != self._execution_id_cache or 
                self.client is None):
                
                self.client = openai.OpenAI(api_key=api_key)
                self._api_key_cache = api_key
                self._execution_id_cache = execution_id
                logger.info(f"✅ OpenAI client initialized for execution: {execution_id}")
            
            return self.client
            
        except Exception as e:
            logger.error(f"❌ Failed to get OpenAI client for execution {execution_id}: {e}")
            raise

    async def execute(self, message: NodeExecutionMessage) -> Dict[str, Any]:
        """Generate text using OpenAI API with execution-specific Redis API key"""
        start_time = time.time()
        logger.info(f"🚀 Executing text-generation node: {message.nodeId}")

        try:
      
            execution_id = str(message.executionId)
            client = await self._get_openai_client(execution_id,message)

            node_data = message.nodeData
            context = message.context or {}

            raw_prompt = node_data.get("prompt", "Hello, how are you?")
            prompt = self.substitute_template_variables(raw_prompt, context)

            requested_tokens = node_data.get("max_tokens", 100)
            max_tokens = min(requested_tokens, self.max_tokens_limit)
            
            if requested_tokens > self.max_tokens_limit:
                logger.warning(f"⚠️ Requested {requested_tokens} tokens, limited to {self.max_tokens_limit}")

            temperature = node_data.get("temperature", 0.7)
            model = node_data.get("model", self.default_model)

            logger.info(f"🤖 Generating with {model}, max_tokens: {max_tokens}")

           
            generated_text = await self._generate_text(prompt, max_tokens, temperature, model, client)

            
            api_key_source = await self._determine_api_key_source(execution_id)

        
            output = {
                **context,
                "generated_text": generated_text,
                "full_text": f"{prompt} {generated_text}",
                "original_prompt": prompt,
                "node_type": "text-generation",
                "node_executed_at": datetime.now().isoformat(),
                "model_used": model,
                "api_key_source": api_key_source,
                "execution_id": execution_id,
                "parameters": {
                    "max_tokens": max_tokens,
                    "temperature": temperature
                }
            }

            processing_time = int((time.time() - start_time) * 1000)
            await self._publish_completion_event(message, output, "COMPLETED", processing_time)

            logger.info(f"✅ Generated {len(generated_text)} chars in {processing_time}ms")
            return output

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Generation failed: {e}")

            error_output = {
                **context,
                "error": str(e),
                "generated_text": None,
                "original_prompt": node_data.get("prompt", ""),
                "node_type": "text-generation",
                "execution_id": str(message.executionId)
            }

            await self._publish_completion_event(message, error_output, "FAILED", processing_time)
            raise

    async def _determine_api_key_source(self, execution_id: str) -> str:
        """Determine which source the API key came from for logging"""
        execution_key = f"execution:{execution_id}:openai_api_key"
        
        if await self.redis_service.get(execution_key):
            return f"execution_specific_redis:{execution_key}"
        elif await self.redis_service.get("openai_api_key"):
            return "global_redis"
        else:
            return "environment"

    async def _generate_text(self, prompt: str, max_tokens: int, temperature: float, model: str, client) -> str:
        """Call OpenAI API with provided client"""
        
        def _call_openai():
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout=30
                )
                return response.choices[0].message.content
                
            except openai.RateLimitError:
                raise RuntimeError("Rate limit exceeded. Try again later.")
            except openai.AuthenticationError:
                raise RuntimeError("Invalid API key from Redis.")
            except Exception as e:
                raise RuntimeError(f"OpenAI error: {e}")

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _call_openai)

    async def _publish_completion_event(self, message: NodeExecutionMessage,
                                        output: Dict[str, Any], status: str, processing_time: int):
        """Publish completion event"""
        try:
            from app.main import app
            
            completion_message = NodeCompletionMessage(
                executionId=message.executionId,
                workflowId=message.workflowId,
                nodeId=message.nodeId,
                nodeType=message.nodeType,
                status=status,
                output=output,
                error=output.get("error") if status == "FAILED" else None,
                timestamp=datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
                processingTime=processing_time
            )
            
            if hasattr(app.state, 'kafka_service'):
                await app.state.kafka_service.publish_completion(completion_message)
                
        except Exception as e:
            logger.error(f"❌ Failed to publish event: {e}")

    def update_token_limit(self, new_limit: int):
        """Update the token limit"""
        old_limit = self.max_tokens_limit
        self.max_tokens_limit = new_limit
        logger.info(f"🔧 Token limit updated: {old_limit} -> {new_limit}")
        return {"old_limit": old_limit, "new_limit": new_limit}

    async def update_api_key_in_redis(self, new_api_key: str, execution_id: str = None):
        """Helper method to update API key in Redis"""
        try:
            if execution_id:
            
                execution_key = f"execution:{execution_id}:openai_api_key"
                await self.redis_service.set(execution_key, new_api_key)
                logger.info(f"✅ OpenAI API key updated in Redis for execution: {execution_id}")
            else:
              
                await self.redis_service.set("openai_api_key", new_api_key)
                logger.info("✅ Global OpenAI API key updated in Redis")
            
           
            self.client = None
            self._api_key_cache = None
            self._execution_id_cache = None
            
            return {"status": "success", "message": "API key updated in Redis"}
        except Exception as e:
            logger.error(f"❌ Failed to update API key in Redis: {e}")
            raise