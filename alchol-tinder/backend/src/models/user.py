import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
from src.models.tag import Tag, user_tags


class VerificationStatus(str, enum.Enum):
    unverified = "unverified"
    pending = "pending"
    verified = "verified"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)

    # Age gate — birth_date is the source of truth; is_age_verified must be True
    # before the user is allowed into matching (enforced in service layer).
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_age_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.unverified, nullable=False
    )

    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relative path under /media (e.g. "/media/avatars/<uuid>.jpg") — never an
    # absolute host, since the frontend's API base URL changes between dev
    # setups (localhost vs. a tunnel); the client prefixes it at render time.
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Raw location is sensitive PII. Never return these fields directly to clients —
    # expose only a fuzzed distance (see core/safety.fuzz_distance_km).
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    tags: Mapped[list[Tag]] = relationship(secondary=user_tags, back_populates="users")
