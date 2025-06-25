import logging
import time
import asyncio
import os
from datetime import datetime, timezone
from typing import Dict, Any
import openai
from app.core.config import settings
from app.handlers.basehandler import BaseNodeHandler
from app.models.workflow_message import NodeExecutionMessage, NodeCompletionMessage

logger = logging.getLogger(__name__)

class TranslationHandler(BaseNodeHandler):
    """Text translation handler using OpenAI with execution-specific Redis API key"""
    
    def __init__(self, redis_service):
        super().__init__(redis_service)
        logger.info("🔧 Initializing translation handler...")
        
       
        self.client = None
        self.default_model = "gpt-3.5-turbo"
        self._api_key_cache = None
        self._execution_id_cache = None  
        
        logger.info("✅ Translation handler initialized")

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
        start_time = time.time()
        logger.info(f"🌍 Executing translation node: {message.nodeId}")

        try:
           
            execution_id = str(message.executionId)
            client = await self._get_openai_client(execution_id,message)

            node_data = message.nodeData
            context = message.context or {}

            text = self.substitute_template_variables(node_data.get("text", ""), context)
            source_language = node_data.get("source_language", "auto")
            target_language = node_data.get("target_language", "English")
            model = node_data.get("model", self.default_model)

            if not text.strip():
                raise ValueError("No text provided for translation")

            logger.info(f"🌍 Translating from {source_language} to {target_language}")

            translated_text = await self._translate_text(text, source_language, target_language, model, client)

            
            api_key_source = await self._determine_api_key_source(execution_id)

            output = {
                **context,
                "original_text": text,
                "translated_text": translated_text,
                "source_language": source_language,
                "target_language": target_language,
                "model_used": model,
                "node_type": "translation",
                "node_executed_at": datetime.now().isoformat(),
                "api_key_source": api_key_source,
                "execution_id": execution_id
            }

            processing_time = int((time.time() - start_time) * 1000)
            await self._publish_completion_event(message, output, "COMPLETED", processing_time)

            logger.info(f"✅ Translation completed in {processing_time}ms")
            return output

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Translation failed: {e}")

            error_output = {
                **context,
                "error": str(e),
                "original_text": node_data.get("text", ""),
                "translated_text": None,
                "node_type": "translation",
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

    async def _translate_text(self, text: str, source_lang: str, target_lang: str, model: str, client) -> str:
        def _call_openai():
            try:
                if source_lang == "auto":
                    prompt = f"Translate the following text to {target_lang}:\n\n{text}"
                else:
                    prompt = f"Translate the following {source_lang} text to {target_lang}:\n\n{text}"

                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300,
                    temperature=0.1,
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