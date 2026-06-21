import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from src.core.config import get_settings
from src.core.safety import is_of_age

_MIN_AGE = get_settings().MIN_AGE


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # bcrypt truncates beyond 72 bytes
    display_name: str = Field(min_length=1, max_length=80)
    birth_date: date

    @field_validator("birth_date")
    @classmethod
    def must_be_of_age(cls, value: date) -> date:
        if not is_of_age(value, _MIN_AGE):
            raise ValueError(f"Users must be at least {_MIN_AGE} years old.")
        return value


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    category: str
    name: str


class UserRead(BaseModel):
    """Public-facing user view. Deliberately omits raw coordinates (PII)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str
    verification_status: str
    rating: float
    is_available: bool
    tags: list[TagRead] = []


class UserMeRead(UserRead):
    """View of the caller's own profile — safe to include email/age-verification."""

    email: EmailStr
    is_age_verified: bool


class TagsUpdateRequest(BaseModel):
    tag_ids: list[uuid.UUID]


class LocationUpdateRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class AvailabilityUpdateRequest(BaseModel):
    is_available: bool
