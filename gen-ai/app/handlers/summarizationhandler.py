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
class SummarizationHandler(BaseNodeHandler):
    """Simple OpenAI summarization handler with execution-specific Redis API key"""
    
    def __init__(self, redis_service):
        super().__init__(redis_service)
        logger.info("📥 Loading OpenAI summarization handler...")
        
        self.client = None
        self.default_model = "gpt-3.5-turbo"  
        self.max_summary_tokens = 200
        self._api_key_cache = None
        self._execution_id_cache = None
        
        logger.info(f"✅ OpenAI summarization handler initialized - Max summary tokens: {self.max_summary_tokens}")

    async def _get_openai_client(self, execution_id: str,message:NodeExecutionMessage):
        try:
            if (self.client is not None and 
                self._api_key_cache and 
                self._execution_id_cache == execution_id):
                return self.client
            
            execution_key = f"execution:{execution_id}:openai_api_key"
            api_key=message.context.get("openai")
            
            if not api_key:
                api_key = await self.redis_service.get("openai_api_key")
                if not api_key:
                    api_key = getattr(settings, 'openai_api_key', None) or os.getenv('OPENAI_API_KEY')
            
            if not api_key:
                raise ValueError("OpenAI API key not found")
            
            if (api_key != self._api_key_cache or 
                execution_id != self._execution_id_cache or 
                self.client is None):
                
                self.client = openai.OpenAI(api_key=api_key)
                self._api_key_cache = api_key
                self._execution_id_cache = execution_id
            
            return self.client
            
        except Exception as e:
            logger.error(f"❌ Failed to get OpenAI client for execution {execution_id}: {e}")
            raise

    async def execute(self, message: NodeExecutionMessage) -> Dict[str, Any]:
        start_time = time.time()
        logger.info(f"📝 Executing summarization node: {message.nodeId}")

        try:
            execution_id = str(message.executionId)
            client = await self._get_openai_client(execution_id,message)

            node_data = message.nodeData
            context = message.context or {}

            text = self.substitute_template_variables(node_data.get("text", ""), context)
            
            if not text.strip():
                raise ValueError("No text provided for summarization")

            requested_length = node_data.get("max_length", 130)
            max_summary_tokens = min(requested_length, self.max_summary_tokens)
            
            if requested_length > self.max_summary_tokens:
                logger.warning(f"⚠️ Requested {requested_length} tokens, limited to {self.max_summary_tokens}")

            min_length = node_data.get("min_length", 30)
            model = node_data.get("model", self.default_model)

            logger.info(f"📄 Summarizing {len(text)} chars with {model}")

            summary = await self._generate_summary(text, max_summary_tokens, min_length, model, client)
            api_key_source = await self._determine_api_key_source(execution_id)

            output = {
                **context,
                "summary": summary,
                "original_text": text,
                "node_type": "summarization",
                "node_executed_at": datetime.now().isoformat(),
                "model_used": model,
                "api_key_source": api_key_source,
                "execution_id": execution_id,
                "parameters": {
                    "max_length": max_summary_tokens,
                    "min_length": min_length,
                    "original_length": len(text)
                }
            }

            processing_time = int((time.time() - start_time) * 1000)
            await self._publish_completion_event(message, output, "COMPLETED", processing_time)

            logger.info(f"✅ Summarized {len(text)} chars -> {len(summary)} chars in {processing_time}ms")
            return output

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Summarization failed: {e}")

            error_output = {
                **context,
                "error": str(e),
                "summary": None,
                "original_text": node_data.get("text", ""),
                "failed_at": datetime.now().isoformat(),
                "node_type": "summarization",
                "execution_id": str(message.executionId)
            }

            await self._publish_completion_event(message, error_output, "FAILED", processing_time)
            raise

    async def _determine_api_key_source(self, execution_id: str) -> str:
        execution_key = f"execution:{execution_id}:openai_api_key"
        if await self.redis_service.get(execution_key):
            return f"execution_specific_redis:{execution_key}"
        elif await self.redis_service.get("openai_api_key"):
            return "global_redis"
        else:
            return "environment"

    async def _generate_summary(self, text: str, max_tokens: int, min_length: int, model: str, client) -> str:
        def _call_openai():
            try:
                prompt = f"""Please summarize the following text in {min_length}-{max_tokens} words. Make it concise and capture the key points:

Text to summarize:
{text}

Summary:"""

                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=0.3, 
                    timeout=30
                )
                
                summary = response.choices[0].message.content.strip()
                
                if summary.lower().startswith("summary:"):
                    summary = summary[8:].strip()
                
                return summary
                
            except openai.RateLimitError:
                raise RuntimeError("Rate limit exceeded. Try again later.")
            except openai.AuthenticationError:
                raise RuntimeError("Invalid API key.")
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
                logger.info(f"📤 Published summarization completion: {message.nodeId}")
                
        except Exception as e:
            logger.error(f"❌ Failed to publish event: {e}")

    def update_token_limit(self, new_limit: int):
        old_limit = self.max_summary_tokens
        self.max_summary_tokens = new_limit
        logger.info(f"🔧 Summary token limit updated: {old_limit} -> {new_limit}")
        return {"old_limit": old_limit, "new_limit": new_limit}

    async def update_api_key_in_redis(self, new_api_key: str, execution_id: str = None):
        try:
            if execution_id:
                execution_key = f"execution:{execution_id}:openai_api_key"
                await self.redis_service.set(execution_key, new_api_key)
            else:
                await self.redis_service.set("openai_api_key", new_api_key)
            
            self.client = None
            self._api_key_cache = None
            self._execution_id_cache = None
            
            return {"status": "success", "message": "API key updated"}
        except Exception as e:
            logger.error(f"❌ Failed to update API key: {e}")
            raise
