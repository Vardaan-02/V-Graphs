import json
import logging
import asyncio
from typing import Callable
from kafka import KafkaConsumer, KafkaProducer
from app.core.config import settings
from app.models.workflow_message import NodeExecutionMessage, NodeCompletionMessage

logger = logging.getLogger(__name__)

class KafkaService:
    """Kafka service matching Spring Boot configuration and patterns"""
    
    def __init__(self):
        self.consumer = None
        self.producer = None
        self.running = False
    
    def _create_consumer(self):
        """Create Kafka consumer with exact Spring Boot configuration"""

        # Same as spring booot
        return KafkaConsumer(
            settings.kafka_node_execution_topic,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=settings.kafka_group_id,
            auto_offset_reset=settings.kafka_auto_offset_reset,
            enable_auto_commit=True,
            auto_commit_interval_ms=5000, 
            session_timeout_ms=30000,    
            heartbeat_interval_ms=3000,   
            max_poll_records=500,         
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            key_deserializer=lambda x: x.decode('utf-8') if x else None,
            consumer_timeout_ms=1000
        )
    


    def _create_producer(self):
        """Create Kafka producer with exact Spring Boot configuration"""
        return KafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=lambda x: json.dumps(x, default=str).encode('utf-8'),
            key_serializer=lambda x: x.encode('utf-8') if x else None,
            acks=1,      
            retries=3,  
            batch_size=16384,     
            linger_ms=5,       
            buffer_memory=33554432 
        )
    

    
    def _normalize_message_fields(self, message_data: dict) -> dict:
        """Convert Java camelCase to Python snake_case and handle field mappings"""
        



        field_mappings = {
            'executionId': 'execution_id',
            'execution_id': 'execution_id',
            'workflowId': 'workflow_id',
            'workflow_id': 'workflow_id',
            'nodeId': 'node_id',
            'node_id': 'node_id',
            'nodeType': 'node_type',
            'node_type': 'node_type',
            'nodeData': 'node_data',
            'node_data': 'node_data',
            'context': 'context',
            'dependencies': 'dependencies',
            'timestamp': 'timestamp',
            'priority': 'priority',
            'processingTime': 'processing_time',
            'processing_time': 'processing_time'
        }
        
        normalized = {}
        for key, value in message_data.items():
            normalized_key = field_mappings.get(key, key)
            normalized[normalized_key] = value
            
        return normalized
    




    async def start_consumer(self, node_executor_callback: Callable):
        """Start consuming messages from Kafka"""
        self.running = True
        logger.info(f"🔗 Starting Kafka consumer for topic: {settings.kafka_node_execution_topic}")
        logger.info(f"🔗 Consumer group: {settings.kafka_group_id}")
        
        try:
            self.consumer = self._create_consumer()
            self.producer = self._create_producer()
            
            logger.info("✅ Kafka consumer started, waiting for messages...")
            
            while self.running:
                try:
                    message_batch = self.consumer.poll(timeout_ms=1000)
                    
                    for topic_partition, messages in message_batch.items():
                        for message in messages:
                            try:
                                logger.info(f"📨 Raw message received from {topic_partition}: {message.value}")
                                
                                normalized_data = self._normalize_message_fields(message.value)
                                
                                execution_message = NodeExecutionMessage.model_validate(normalized_data)
                                
                                logger.info(
                                    f"📨 Parsed node execution: {execution_message.nodeId} "
                                    f"of type: {execution_message.nodeType} "
                                    f"for execution: {execution_message.executionId}"
                                )
                                
                                await node_executor_callback(execution_message)
                                
                            except Exception as e:
                                logger.error(f"❌ Error processing message: {e}")
                                logger.error(f"❌ Message content: {message.value}")
                                await self._send_failure_completion(message.value, str(e))
                    
                    await asyncio.sleep(0.1)
                    
                except Exception as e:
                    logger.error(f"❌ Error in consumer loop: {e}")
                    await asyncio.sleep(5)  
                    
        except Exception as e:
            logger.error(f"❌ Failed to start Kafka consumer: {e}")
            raise
        finally:
            logger.info("🛑 Kafka consumer stopped")
    
    async def publish_completion(self, completion_message: NodeCompletionMessage):
        """Publish node completion message matching Spring Boot format"""
        try:
            if not self.producer:
                self.producer = self._create_producer()
            

            message_dict = {
                'executionId': str(completion_message.executionId),
                'workflowId': str(completion_message.workflowId),
                'nodeId': completion_message.nodeId,
                'nodeType': completion_message.nodeType,
                'status': completion_message.status,
                'output': completion_message.output,
                'error': completion_message.error,
                'timestamp': completion_message.timestamp,
                'processingTime': completion_message.processingTime,
                'service': completion_message.service or 'fastapi'
            }
            
            future = self.producer.send(
                settings.kafka_node_completion_topic,
                key=completion_message.nodeId,
                value=message_dict
            )
            
        
            record_metadata = future.get(timeout=10)
            

            logger.info(
                f"✅ Published completion for node: {completion_message.nodeId} "
                f"with status: {completion_message.status} "
                f"to partition: {record_metadata.partition}"
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to publish completion message: {e}")
            raise
    




    
    async def _send_failure_completion(self, original_message: dict, error: str):
        """Send failure completion message"""
        try:
            from datetime import datetime
            
            execution_id = original_message.get('executionId') or original_message.get('execution_id')
            workflow_id = original_message.get('workflowId') or original_message.get('workflow_id')
            node_id = original_message.get('nodeId') or original_message.get('node_id')
            node_type = original_message.get('nodeType') or original_message.get('node_type')
            
            completion = NodeCompletionMessage(
                executionId=execution_id,
                workflowId=workflow_id,
                nodeId=node_id,
                nodeType=node_type,
                status="FAILED",
                output={"error": error},
                error=error,
                timestamp=datetime.now().isoformat(),
                processingTime=0,
                service="fastapi"
            )
            await self.publish_completion(completion)
        except Exception as e:
            logger.error(f"❌ Failed to send failure completion: {e}")
    
    async def close(self):
        """Close Kafka connections"""
        self.running = False
        if self.consumer:
            self.consumer.close()
        if self.producer:
            self.producer.close()
        logger.info("✅ Kafka connections closed")