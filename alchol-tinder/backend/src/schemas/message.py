import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageCreateRequest(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    match_id: uuid.UUID
    sender_id: uuid.UUID
    body: str
    created_at: datetime
