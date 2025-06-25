from abc import ABC, abstractmethod
from typing import Dict, Any
import re
import logging
from app.models.workflow_message import NodeExecutionMessage
from app.service.redis import RedisService

logger = logging.getLogger(__name__)

class BaseNodeHandler(ABC):
    """Base handler matching Spring Boot NodeHandler interface"""
    
    def __init__(self, redis_service: RedisService):
        self.redis_service = redis_service
    
    @abstractmethod
    async def execute(self, message: NodeExecutionMessage) -> Dict[str, Any]:
        """Execute the node and return the result - matches Spring Boot interface"""
        pass
    
    def substitute_template_variables(self, template: str, context: Dict[str, Any]) -> str:
        """Substitute template variables - exact match to Spring Boot TemplateUtils"""
        if not template or not context:
            return template
        
     
        pattern = re.compile(r'\{\{([^}]+)\}\}')
        
        def replace_var(match):
            var_name = match.group(1).strip()
            value = context.get(var_name)
            if value is not None:
                logger.debug(f"Substituted {match.group(0)} -> {value}")
                return str(value)
            else:
                logger.warning(f"No value found for template variable: {var_name}. Available: {list(context.keys())}")
                return match.group(0)
        
        return pattern.sub(replace_var, template)
