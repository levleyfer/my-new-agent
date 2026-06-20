import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.schemas.user import UserRead


class MatchCreateRequest(BaseModel):
    target_user_id: uuid.UUID


class MatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    compatibility_score: int
    created_at: datetime
    other_user: UserRead


class VideoSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    match_id: uuid.UUID
    room_name: str
