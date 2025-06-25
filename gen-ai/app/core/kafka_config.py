from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from app.core.config import settings
import json

BOOTSTRAP_SERVERS = settings.kafka.bootstrap_servers


async def get_kafka_producer():
    producer = AIOKafkaProducer(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        key_serializer=str.encode,
        acks=settings.kafka.producer_acks,
        max_request_size=settings.kafka.producer_max_request_size
    )
    await producer.start()
    return producer



async def get_node_execution_consumer():
    consumer = AIOKafkaConsumer(
        "fastapi-nodes",
        bootstrap_servers=BOOTSTRAP_SERVERS,
        group_id="spring-node-executor",
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        max_poll_records=settings.kafka.consumer_max_poll_records,
        max_poll_interval_ms=settings.kafka.consumer_max_poll_interval_ms
    )
    await consumer.start()
    return consumer
