import enum
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, String, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base


class ReportReason(str, enum.Enum):
    inappropriate_behavior = "inappropriate_behavior"
    fake_profile = "fake_profile"
    harassment = "harassment"
    safety_concern = "safety_concern"
    other = "other"


class ReportStatus(str, enum.Enum):
    open = "open"
    reviewed = "reviewed"
    actioned = "actioned"


class Block(Base):
    """One-directional block — see CLAUDE.md: blocking is a first-class safety
    feature. Matching/discovery must treat a block from either side as mutual."""

    __tablename__ = "blocks"
    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_block_pair"),
        CheckConstraint("blocker_id <> blocked_id", name="ck_block_distinct_users"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    blocker_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    blocked_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (CheckConstraint("reporter_id <> reported_user_id", name="ck_report_distinct_users"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    reporter_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    reason: Mapped[ReportReason] = mapped_column(Enum(ReportReason), nullable=False)
    details: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[ReportStatus] = mapped_column(Enum(ReportStatus), default=ReportStatus.open, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
