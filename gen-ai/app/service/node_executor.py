import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict
from pydantic import validator
from app.handlers.aidecisionhandler import AIDecisionHandler
from app.handlers.contentgenerationhandler import ContentGenerationHandler
from app.handlers.datanalysthandler import DataAnalystAgentHandler
from app.handlers.namedenitityhandler import NamedEntityHandler
from app.handlers.questionanswerhanlder import QuestionAnswerHandler
from app.handlers.searchagenethandler import SearchAgentHandler
from app.handlers.summarizationhandler import SummarizationHandler
from app.handlers.textclassificationhandler import TextClassificationHandler
from app.handlers.translationhandler import TranslationHandler
from app.models.workflow_message import NodeExecutionMessage, NodeCompletionMessage
from app.service.redis import RedisService
from app.handlers.textgeneration import TextGenerationHandler

logger = logging.getLogger(__name__)

class NodeExecutorService:
    """Node executor service matching Spring Boot StaticNodeExecutor pattern"""
    
    def __init__(self, redis_service: RedisService, kafka_service):
        self.redis_service = redis_service
        self.kafka_service = kafka_service
        




        self.handlers = {
            "text-generation": TextGenerationHandler(redis_service),
            "ai-decision": AIDecisionHandler(redis_service),
            "summarization": SummarizationHandler(redis_service),
            "question-answer": QuestionAnswerHandler(redis_service),
            "text-classification": TextClassificationHandler(redis_service),
            "named-entity": NamedEntityHandler(redis_service),
            "translation": TranslationHandler(redis_service),
            "content-generation": ContentGenerationHandler(redis_service),
            "search-agent": SearchAgentHandler(redis_service),
            "data-analyst-agent": DataAnalystAgentHandler(redis_service),
        }
        



        logger.info(f"🔧 Initialized node executor with handlers: {list(self.handlers.keys())}")
    
    async def execute_node(self, message: NodeExecutionMessage):
        """Execute a node - exact match to Spring Boot StaticNodeExecutor.executeNode"""
        start_time = time.time()
        node_id = message.nodeId
        node_type = message.nodeType.lower()
        execution_id = str(message.executionId)
        
        logger.info(f"🔄 Executing node: {node_id} of type: {node_type} for execution: {message.executionId}")
        try:



            await self._store_execution_context(message)
            



            handler = self._find_handler(node_type)
            if not handler:
                error = f"No handler found for node type: {node_type}"
                logger.error(error)
                await self._publish_failure_event(message, error, start_time)
                return
            # i removed output this might break somethings
            await handler.execute(message)
            processing_time = int((time.time() - start_time) * 1000)
            logger.info(f"✅ Node execution completed: {node_id} in {processing_time}ms")
            
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Node execution failed: {node_id} after {processing_time}ms", exc_info=True)
            await self._publish_failure_event(message, str(e), start_time)
    




    def _find_handler(self, node_type: str):
        """Find handler for node type - matching Spring Boot pattern"""
        handler = self.handlers.get(node_type.lower())
        if not handler:
            handler = self.handlers.get(node_type.lower().replace('_', '-'))
        return handler
    




    async def _store_execution_context(self, message: NodeExecutionMessage):
        """Store execution context in Redis - matching Spring Boot pattern"""
        try:
            execution_id = str(message.executionId)
            context_key = f"execution:{message.executionId}:node:{message.nodeId}"
            context_data = {
                "node_type": message.nodeType,
                "started_at": datetime.now().isoformat(),
                "status": "RUNNING"
            }
            await self.redis_service.set(context_key, context_data, ex=3600)  
            logger.info(f"📝 Stored execution context for {execution_id}:{message.nodeId}")
        except Exception as e:
            logger.warning(f"Failed to store execution context: {e}")
       
    




    async def _publish_failure_event(self, message: NodeExecutionMessage, error: str, start_time: float):
        """Publish failure event - exact match to Spring Boot pattern"""
        try:
            processing_time = int((time.time() - start_time) * 1000)
            
            failure_message = NodeCompletionMessage(
                executionId=message.executionId,
                workflowId=message.workflowId,
                nodeId=message.nodeId,
                nodeType=message.nodeType,
                status="FAILED",
                output={
                    "error": error,
                    "failed_at": datetime.now().isoformat(),
                    "node_type": message.nodeType
                },
                error=error,
                timestamp=datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
                processingTime=processing_time,
                service="fastapi"  
            )
            
            await self.kafka_service.publish_completion(failure_message)
            logger.info(f"Published failure event for node: {message.nodeId}")
            
        except Exception:
            logger.error(f"Failed to publish failure event for node: {message.nodeId}", exc_info=True)


      
            
    async def get_execution_api_key(self, execution_id: str) -> str:
        """Helper method to get execution-specific API key"""
        try:
            execution_key = f"execution:{execution_id}:openai_api_key"
            api_key = await self.redis_service.get(execution_key)
            
            if api_key:
                logger.info(f"✅ Found execution-specific API key for {execution_id}")
                return api_key
            else:
                global_key = await self.redis_service.get("openai_api_key")
                if global_key:
                    logger.info(f"✅ Using global API key for {execution_id}")
                    return global_key
                else:
                    logger.warning(f"⚠️ No API key found for execution {execution_id}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error retrieving API key for execution {execution_id}: {e}")
            return None

    async def set_execution_api_key(self, execution_id: str, api_key: str, ttl: int = 3600) -> bool:
        """Helper method to set execution-specific API key"""
        try:
            execution_key = f"execution:{execution_id}:openai_api_key"
            await self.redis_service.set(execution_key, api_key, ex=ttl)
            logger.info(f"✅ Set execution-specific API key for {execution_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error setting API key for execution {execution_id}: {e}")
            return False

    async def cleanup_execution_data(self, execution_id: str):
        """Clean up execution-specific data from Redis"""
        try:
            api_key_key = f"execution:{execution_id}:openai_api_key"
            await self.redis_service.delete(api_key_key)
            
            logger.info(f"🧹 Cleaned up execution data for {execution_id}")
            
        except Exception as e:
            logger.error(f"❌ Error cleaning up execution {execution_id}: {e}")

    def get_handler_debug_info(self) -> Dict[str, Any]:
        """Get debug information about all handlers"""
        debug_info = {
            "total_handlers": len(self.handlers),
            "handler_types": list(self.handlers.keys()),
            "execution_specific_support": True,
            "handlers_with_openai": []
        }
        
        for handler_type, handler in self.handlers.items():
            if hasattr(handler, '_get_openai_client'):
                debug_info["handlers_with_openai"].append(handler_type)
        
        return debug_info

@validator('timestamp', pre=True, always=True)
def ensure_string_timestamp(cls, v):
    if isinstance(v, datetime):
        return v.isoformat(timespec='milliseconds') + 'Z'
    return str(v)