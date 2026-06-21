import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.schemas.user import UserRead


class MatchCreateRequest(BaseModel):
    target_user_id: uuid.UUID


class MatchRead(BaseModel):
    id: uuid.UUID
    status: str
    compatibility_score: int
    created_at: datetime
    other_user: UserRead
    my_rating: int | None = None


class RatingCreateRequest(BaseModel):
    score: int = Field(ge=1, le=5)


class VideoSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    match_id: uuid.UUID
    room_name: str
