import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base


class Rating(Base):
    """One rating, given by one match participant about the other, for one
    match. Never about quantity consumed — see CLAUDE.md Product & Safety
    Rules; this is a general 1-5 'how was this person to meet' signal.
    """

    __tablename__ = "ratings"
    __table_args__ = (
        UniqueConstraint("match_id", "rater_id", name="uq_rating_per_match_rater"),
        CheckConstraint("rater_id <> rated_user_id", name="ck_rating_distinct_users"),
        CheckConstraint("score >= 1 AND score <= 5", name="ck_rating_score_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    match_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    rater_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rated_user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
