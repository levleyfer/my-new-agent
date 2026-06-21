import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field, field_validator

from src.core.config import get_settings
from src.core.connections import manager
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
    avatar_url: str | None = None
    tags: list[TagRead] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_online(self) -> bool:
        """Real connection presence (has an open /ws/calls socket right now)
        — distinct from is_available, which is a manual 'looking for company
        tonight' toggle. Computed at serialization time so it works whether
        this model was built from an ORM object or constructed by hand.
        """
        return manager.is_connected(self.id)


class UserMeRead(UserRead):
    """View of the caller's own profile — safe to include email/age-verification."""

    email: EmailStr
    is_age_verified: bool
    notify_message_preview: bool


class TagsUpdateRequest(BaseModel):
    tag_ids: list[uuid.UUID]


class LocationUpdateRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class AvailabilityUpdateRequest(BaseModel):
    is_available: bool


class NotificationPreferenceUpdateRequest(BaseModel):
    """'Show message preview in notifications' toggle — see CLAUDE.md privacy
    rules. Defaults to False on the User model; this only ever flips it at
    the user's explicit request.
    """

    notify_message_preview: bool
