from pydantic import BaseModel, ConfigDict, Field, validator
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID
from datetime import datetime
class Priority(str, Enum):
    """Priority enum matching Spring Boot exactly"""
    HIGH = "HIGH"
    NORMAL = "NORMAL"
    LOW = "LOW"




class NodeExecutionMessage(BaseModel):
    """Exact match to Spring Boot NodeExecutionMessage"""
    executionId: UUID = Field(alias="execution_id")
    workflowId: UUID = Field(alias="workflow_id")
    nodeId: str = Field(alias="node_id")
    nodeType: str = Field(alias="node_type")
    nodeData: Dict[str, Any] = Field(alias="node_data")
    context: Dict[str, Any] = Field(default_factory=dict)
    dependencies: List[str] = Field(default_factory=list)
    timestamp: str  # ISO-8601 
    priority: Priority = Priority.NORMAL
    


    class Config:
        allow_population_by_field_name = True
        use_enum_values = True
        


    @validator('executionId', 'workflowId', pre=True)
    def parse_uuid(cls, v):
        if isinstance(v, str):
            return UUID(v)
        return v
        


    @validator('timestamp', pre=True)
    def parse_timestamp(cls, v):
        if isinstance(v, dict):
            # Handle Java Instant format if needed
            return v.get('isoString', str(v))
        return str(v)


class NodeCompletionMessage(BaseModel):
    executionId: UUID
    workflowId: UUID
    nodeId: str
    nodeType: str
    status: str 
    output: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
    timestamp: str  # ISO-8601
    processingTime: int
    service: str = "fastapi"

    model_config = ConfigDict(populate_by_name=True)  # for Pydantic v2





    @validator('executionId', 'workflowId', pre=True)
    def parse_uuid(cls, v):
        if isinstance(v, str):
            return UUID(v)
        return v




    @validator('timestamp', pre=True, always=True)
    def ensure_string_timestamp(cls, v):
        if isinstance(v, datetime):
            return v.astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
        return str(v)

