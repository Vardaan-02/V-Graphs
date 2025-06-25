import logging
import time
import asyncio
import os
from datetime import datetime, timezone
from typing import Dict, Any, List
import openai
from app.handlers.basehandler import BaseNodeHandler
from app.models.workflow_message import NodeExecutionMessage, NodeCompletionMessage
from app.core.config import settings

logger = logging.getLogger(__name__)

class NamedEntityHandler(BaseNodeHandler):
    """Named Entity Recognition handler using OpenAI with execution-specific Redis API key"""
    
    def __init__(self, redis_service):
        super().__init__(redis_service)
        logger.info("🔧 Initializing named entity handler...")
        
        self.client = None
        self.default_model = "gpt-3.5-turbo"
        self._api_key_cache = None
        self._execution_id_cache = None
        
        logger.info("✅ Named entity handler initialized")

    async def _get_openai_client(self, execution_id: str,message:NodeExecutionMessage):
        """Get or create OpenAI client with execution-specific API key from Redis"""
        try:
            if (self.client is not None and 
                self._api_key_cache and 
                self._execution_id_cache == execution_id):
                return self.client
            
            # Three-tier lookup: execution-specific -> global -> environment
            execution_key = f"execution:{execution_id}:openai_api_key"
            api_key=message.context.get("openai")
            
            if api_key:
                logger.info(f"📝 Using execution-specific OpenAI API key")
            else:
                api_key = await self.redis_service.get("openai_api_key")
                if api_key:
                    logger.info("📝 Using global OpenAI API key from Redis")
                else:
                    api_key = getattr(settings, 'openai_api_key', None) or os.getenv('OPENAI_API_KEY')
                    if api_key:
                        logger.info("📝 Using OpenAI API key from environment/settings")
            
            if not api_key:
                raise ValueError("OpenAI API key not found")
            
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
        logger.info(f"🏷️ Executing named-entity node: {message.nodeId}")

        try:
            execution_id = str(message.executionId)
            client = await self._get_openai_client(execution_id,message)

            node_data = message.nodeData
            context = message.context or {}

            text = self.substitute_template_variables(node_data.get("text", ""), context)
            entity_types = node_data.get("entity_types", ["PERSON", "ORGANIZATION", "LOCATION", "DATE"])
            model = node_data.get("model", self.default_model)

            if not text.strip():
                raise ValueError("No text provided for entity extraction")

            logger.info(f"🔍 Extracting entities: {entity_types}")

            entities = await self._extract_entities(text, entity_types, model, client)
            api_key_source = await self._determine_api_key_source(execution_id)

            output = {
                **context,
                "text": text,
                "entities": entities,
                "entity_types": entity_types,
                "num_entities": len(entities),
                "model_used": model,
                "node_type": "named-entity",
                "node_executed_at": datetime.now().isoformat(),
                "api_key_source": api_key_source,
                "execution_id": execution_id
            }

            processing_time = int((time.time() - start_time) * 1000)
            await self._publish_completion_event(message, output, "COMPLETED", processing_time)

            logger.info(f"✅ Extracted {len(entities)} entities")
            return output

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Named entity extraction failed: {e}")

            error_output = {
                **context,
                "error": str(e),
                "text": node_data.get("text", ""),
                "entities": [],
                "node_type": "named-entity",
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

    async def _extract_entities(self, text: str, entity_types: List[str], model: str, client) -> List[Dict]:
        def _call_openai():
            try:
                entity_types_str = ", ".join(entity_types)
                prompt = f"""Extract named entities from the following text. Find entities of these types: {entity_types_str}

Text: "{text}"

Return the entities in this format:
Entity: [entity_text], Type: [entity_type]

One entity per line."""

                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300,
                    temperature=0.1,
                    timeout=30
                )
                
                result = response.choices[0].message.content.strip()
                
                entities = []
                for line in result.split('\n'):
                    if 'Entity:' in line and 'Type:' in line:
                        try:
                            parts = line.split(', Type:')
                            entity_text = parts[0].replace('Entity: ', '').strip()
                            entity_type = parts[1].strip()
                            
                            entities.append({
                                "text": entity_text,
                                "type": entity_type,
                                "start": text.find(entity_text) if entity_text in text else -1
                            })
                        except:
                            continue
                
                return entities
                
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
        try:
            if execution_id:
                execution_key = f"execution:{execution_id}:openai_api_key"
                await self.redis_service.set(execution_key, new_api_key)
                logger.info(f"✅ OpenAI API key updated for execution: {execution_id}")
            else:
                await self.redis_service.set("openai_api_key", new_api_key)
                logger.info("✅ Global OpenAI API key updated")
            
            self.client = None
            self._api_key_cache = None
            self._execution_id_cache = None
            
            return {"status": "success", "message": "API key updated"}
        except Exception as e:
            logger.error(f"❌ Failed to update API key: {e}")
            raise