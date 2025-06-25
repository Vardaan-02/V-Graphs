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

class ContentGenerationHandler(BaseNodeHandler):
    """Content generation handler for different content types with execution-specific Redis API key"""
    
    def __init__(self, redis_service):
        super().__init__(redis_service)
        logger.info("🔧 Initializing content generation handler...")
        
       
        self.client = None
        self.default_model = "gpt-3.5-turbo"
        self._api_key_cache = None
        self._execution_id_cache = None 
        
        logger.info("✅ Content generation handler initialized")

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
              
                error_msg = (
                    f"OpenAI API key not found for execution {execution_id}. "
                    f"Checked: execution-specific Redis ({execution_key}), "
                    f"global Redis (openai_api_key), environment (OPENAI_API_KEY), "
                    f"and settings (openai_api_key). Please ensure an API key is configured."
                )
                raise ValueError(error_msg)
            
          
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
        start_time = time.time()
        logger.info(f"✍️ Executing content-generation node: {message.nodeId}")

       
        node_data = message.nodeData or {}
        context = message.context or {}
        execution_id = str(message.executionId)

        try:
           
            
            client = await self._get_openai_client(execution_id,message)
            if client == None:
                client=message.openai

            content_type = node_data.get("content_type", "blog_post")  
            topic = self.substitute_template_variables(node_data.get("topic", ""), context)
            style = node_data.get("style", "professional")
            length = node_data.get("length", "medium") 
            model = node_data.get("model", self.default_model)

            if not topic.strip():
                raise ValueError("No topic provided for content generation")

            logger.info(f"✍️ Generating {content_type} about: {topic}")

            generated_content = await self._generate_content(content_type, topic, style, length, model, client)

        
            api_key_source = await self._determine_api_key_source(execution_id)

            output = {
                **context,
                "topic": topic,
                "generated_content": generated_content,
                "content_type": content_type,
                "style": style,
                "length": length,
                "word_count": len(generated_content.split()),
                "model_used": model,
                "node_type": "content-generation",
                "node_executed_at": datetime.now().isoformat(),
                "api_key_source": api_key_source,
                "execution_id": execution_id
            }

            processing_time = int((time.time() - start_time) * 1000)
            await self._publish_completion_event(message, output, "COMPLETED", processing_time)

            logger.info(f"✅ Generated {len(generated_content.split())} words of content")
            return output

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Content generation failed: {e}")

           
            error_output = {
                **context,  
                "error": str(e),
                "topic": node_data.get("topic", ""),
                "generated_content": None,
                "node_type": "content-generation",
                "execution_id": execution_id,
                "failed_at": datetime.now().isoformat()
            }

            await self._publish_completion_event(message, error_output, "FAILED", processing_time)
            raise

    async def _determine_api_key_source(self, execution_id: str) -> str:
        """Determine which source the API key came from for logging"""
        try:
            execution_key = f"execution:{execution_id}:openai_api_key"
            
            if await self.redis_service.get(execution_key):
                return f"execution_specific_redis:{execution_key}"
            elif await self.redis_service.get("openai_api_key"):
                return "global_redis"
            else:
                return "environment"
        except Exception as e:
            logger.warning(f"Could not determine API key source: {e}")
            return "unknown"

    async def _generate_content(self, content_type: str, topic: str, style: str, length: str, model: str, client) -> str:
        def _call_openai():
            try:
                prompts = {
                    "blog_post": f"Write a {style} {length} blog post about {topic}. Include an engaging introduction, main points, and conclusion.",
                    "email": f"Write a {style} {length} email about {topic}. Make it clear and actionable.",
                    "social_media": f"Create a {style} social media post about {topic}. Make it engaging and shareable.",
                    "article": f"Write a {style} {length} article about {topic}. Include detailed information and insights.",
                    "product_description": f"Write a {style} product description for {topic}. Highlight key features and benefits.",
                    "press_release": f"Write a {style} press release about {topic}. Follow standard press release format."
                }
                
                prompt = prompts.get(content_type, f"Write {style} {length} content about {topic}")

                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=400 if length == "long" else 300 if length == "medium" else 200,
                    temperature=0.7,
                    timeout=30
                )
                
                return response.choices[0].message.content.strip()
                
            except Exception as e:
                raise RuntimeError(f"OpenAI error: {e}")

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _call_openai)

    async def _publish_completion_event(self, message: NodeExecutionMessage,
                                      output: Dict[str, Any], status: str, processing_time: int):
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
            logger.error(f"Failed to publish completion event: {e}")

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

    async def debug_api_key_status(self, execution_id: str) -> Dict[str, Any]:
        """Debug method to check API key availability"""
        try:
            execution_key = f"execution:{execution_id}:openai_api_key"
            
     
            execution_specific = await self.redis_service.get(execution_key)
            global_redis = await self.redis_service.get("openai_api_key")
            environment = os.getenv('OPENAI_API_KEY')
            settings_key = getattr(settings, 'openai_api_key', None)
            
            return {
                "execution_id": execution_id,
                "execution_specific_key": execution_key,
                "execution_specific_found": bool(execution_specific),
                "global_redis_found": bool(global_redis),
                "environment_found": bool(environment),
                "settings_found": bool(settings_key),
                "any_key_available": bool(execution_specific or global_redis or environment or settings_key)
            }
        except Exception as e:
            return {
                "error": str(e),
                "execution_id": execution_id
            }