import enum
import uuid

from sqlalchemy import Column, Enum, ForeignKey, String, Table, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class TagCategory(str, enum.Enum):
    taste = "taste"        # beer, wine, whiskey, spirits, cocktails...
    vibe = "vibe"          # good conversation, celebration, relaxed...
    logistics = "logistics"  # nearby, available now, public place, video first...


# Many-to-many association between users and tags.
user_tags = Table(
    "user_tags",
    Base.metadata,
    Column("user_id", Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Uuid, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("category", "name", name="uq_tag_category_name"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    category: Mapped[TagCategory] = mapped_column(Enum(TagCategory), nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)

    users: Mapped[list["User"]] = relationship(  # noqa: F821
        secondary=user_tags, back_populates="tags"
    )
