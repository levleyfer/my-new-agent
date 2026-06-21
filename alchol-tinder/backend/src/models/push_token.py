import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base


class PushToken(Base):
    """An Expo push token for one device belonging to one user.

    A user may have several rows here (phone + tablet, or a reinstalled app
    that got issued a new token before the old one was pruned) — pushes fan
    out to every token on file for the recipient. Tokens are opaque
    (`ExponentPushToken[...]`); never PII beyond "this device can receive
    pushes for this user," so no extra protection beyond normal auth is
    needed here.
    """

    __tablename__ = "push_tokens"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # Expo push tokens are unique per (app install, device) — registering the
    # same token again (e.g. app relaunch) should update which user it
    # belongs to rather than create a duplicate row, so it's unique on its own.
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
