from pydantic_settings import BaseSettings

class Settings(BaseSettings):

    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_group_id: str = "fastapi-node-executor"  
    kafka_node_execution_topic: str = "fastapi-nodes"
    kafka_node_completion_topic: str = "node-completion"
    kafka_auto_offset_reset: str = "earliest"
    
    redis_url: str = "redis://localhost:6379"
    redis_db: int = 0
    redis_max_connections: int = 20

    max_tokens: int = 100
    temperature: float = 0.7
    openai_api_key: str = ""
    serpapi_key: str = "d773322862390c2df6cbe62e0246d24d3710fe3b868c5ee8adb5eb4813bb8424"

    service_name: str = "fastapi-node-executor"
    log_level: str = "INFO"
    
    class Config:
        populate_by_name = True
        env_file = ".env"

settings = Settings()