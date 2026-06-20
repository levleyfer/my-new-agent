import enum
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class MatchStatus(str, enum.Enum):
    pending = "pending"   # created, awaiting virtual cheers
    video = "video"       # virtual cheers in progress / completed
    met = "met"           # both parties confirmed an in-person meetup
    closed = "closed"      # ended without meeting, or one side backed out


class Match(Base):
    __tablename__ = "matches"
    __table_args__ = (
        CheckConstraint("user_a_id <> user_b_id", name="ck_match_distinct_users"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_a_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_b_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Snapshot of shared-tag count at match creation time. Never derived from
    # or correlated with quantity consumed — see Product & Safety Rules.
    compatibility_score: Mapped[int] = mapped_column(default=0, nullable=False)
    status: Mapped[MatchStatus] = mapped_column(Enum(MatchStatus), default=MatchStatus.pending, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    video_session: Mapped["VideoSession | None"] = relationship(
        back_populates="match", uselist=False, cascade="all, delete-orphan"
    )


class VideoSession(Base):
    """A WebRTC room tied to a match — the 'virtual cheers' safety step before meeting.

    MVP placeholder: room_name is just an opaque identifier. Wiring it to a real
    managed WebRTC provider (LiveKit/Daily) is a follow-up — see VIDEO_PROVIDER_API_KEY.
    """

    __tablename__ = "video_sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    match_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("matches.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    room_name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    match: Mapped[Match] = relationship(back_populates="video_session")
