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

class AIDecisionHandler(BaseNodeHandler):
    """AI-powered decision making handler with execution-specific Redis API key"""
    
    def __init__(self, redis_service):
        super().__init__(redis_service)
        logger.info("🔧 Initializing AI decision handler...")
        
      
        self.client = None
        self.default_model = "gpt-3.5-turbo"
        self.max_tokens_limit = 200
        self._api_key_cache = None
        self._execution_id_cache = None 
        
        logger.info(f"✅ AI decision handler initialized - Max tokens: {self.max_tokens_limit}")

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
        """Make AI-powered decisions using OpenAI with execution-specific Redis API key"""
        start_time = time.time()
        logger.info(f"🚀 Executing ai-decision node: {message.nodeId}")

        try:
           
            execution_id = str(message.executionId)
            client = await self._get_openai_client(execution_id,message)

            node_data = message.nodeData
            context = message.context or {}

           
            raw_decision_criteria = node_data.get("decision_criteria", "Make a decision based on the provided context")
            decision_criteria = self.substitute_template_variables(raw_decision_criteria, context)
            
            options = node_data.get("options", ["yes", "no"])
            confidence_threshold = node_data.get("confidence_threshold", 0.7)

            logger.info(f"🤔 Making decision with {len(options)} options")

          
            decision_result = await self._make_decision(decision_criteria, options, confidence_threshold, client)

          
            api_key_source = await self._determine_api_key_source(execution_id)

          
            output = {
                **context,
                "decision": decision_result["decision"],
                "confidence": decision_result["confidence"],
                "reasoning": decision_result["reasoning"],
                "options_considered": options,
                "decision_criteria": decision_criteria,
                "node_type": "ai-decision",
                "node_executed_at": datetime.now().isoformat(),
                "api_key_source": api_key_source,
                "execution_id": execution_id,
                "threshold_met": decision_result["confidence"] >= confidence_threshold
            }

            processing_time = int((time.time() - start_time) * 1000)
            await self._publish_completion_event(message, output, "COMPLETED", processing_time)

            logger.info(f"✅ Decision made: {decision_result['decision']} (confidence: {decision_result['confidence']:.2f}) in {processing_time}ms")
            return output

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Decision failed: {e}")

            error_output = {
                **context,
                "error": str(e),
                "decision": None,
                "confidence": 0.0,
                "reasoning": None,
                "node_type": "ai-decision",
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

    async def _make_decision(self, criteria: str, options: list, threshold: float, client) -> Dict[str, Any]:
        """Make AI decision with provided client"""
        
        def _call_openai():
            try:
                prompt = f"""
                Decision Criteria: {criteria}
                
                Available Options: {', '.join(options)}
                
                Please make a decision and provide:
                1. Your chosen option (must be exactly one from the list)
                2. Confidence level (0.0 to 1.0)
                3. Brief reasoning
                
                Respond in this format:
                DECISION: [chosen option]
                CONFIDENCE: [0.0-1.0]
                REASONING: [your reasoning]
                """

                response = client.chat.completions.create(
                    model=self.default_model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=self.max_tokens_limit,
                    temperature=0.3,
                    timeout=30
                )
                
                return self._parse_decision_response(response.choices[0].message.content, options)
                
            except openai.RateLimitError:
                raise RuntimeError("Rate limit exceeded. Try again later.")
            except openai.AuthenticationError:
                raise RuntimeError("Invalid API key from Redis.")
            except Exception as e:
                raise RuntimeError(f"OpenAI error: {e}")

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _call_openai)

    def _parse_decision_response(self, response: str, options: list) -> Dict[str, Any]:
        """Parse the AI decision response"""
        try:
            lines = response.strip().split('\n')
            decision = None
            confidence = 0.5
            reasoning = "No reasoning provided"
            
            for line in lines:
                if line.startswith('DECISION:'):
                    decision = line.replace('DECISION:', '').strip()
                elif line.startswith('CONFIDENCE:'):
                    try:
                        confidence = float(line.replace('CONFIDENCE:', '').strip())
                    except ValueError:
                        confidence = 0.5
                elif line.startswith('REASONING:'):
                    reasoning = line.replace('REASONING:', '').strip()
            
         
            if decision not in options:
                decision = options[0]  
                confidence = 0.3
                reasoning = f"Invalid decision format, defaulted to {decision}"
            
            return {
                "decision": decision,
                "confidence": min(max(confidence, 0.0), 1.0),  
                "reasoning": reasoning
            }
            
        except Exception:
            return {
                "decision": options[0],
                "confidence": 0.3,
                "reasoning": "Failed to parse AI response"
            }

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