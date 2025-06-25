import redis.asyncio as redis
import json
import logging
from typing import Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisService:
    """Redis service matching Spring Boot patterns (async, safe, redis.asyncio)"""

    def __init__(self):
        self.redis: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis = redis.Redis.from_url(
                settings.redis_url,
                db=settings.redis_db,
                max_connections=settings.redis_max_connections,
                decode_responses=True
            )
            await self.ping()
            logger.info("✅ Connected to Redis")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            raise

    async def ping(self):
        """Test Redis connection"""
        if self.redis:
            return await self.redis.ping()
        raise RuntimeError("Redis not connected")

    async def set(self, key: str, value: Any, ex: Optional[int] = None):
        """Set a value in Redis with optional expiration"""
        try:
            serialized_value = json.dumps(value, default=str) if not isinstance(value, str) else value
            return await self.redis.set(key, serialized_value, ex=ex)
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            raise

    async def get(self, key: str) -> Optional[Any]:
        """Get a value from Redis"""
        try:
            value = await self.redis.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            raise

    async def delete(self, key: str):
        """Delete a key from Redis"""
        try:
            return await self.redis.delete(key)
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            raise

    async def close(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            logger.info("✅ Redis connection closed")
