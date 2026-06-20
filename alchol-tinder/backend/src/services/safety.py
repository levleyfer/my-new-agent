import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.safety import Block


async def get_blocked_user_ids(db: AsyncSession, user_id: uuid.UUID) -> set[uuid.UUID]:
    """All user ids that should be hidden from `user_id` due to a block in
    either direction — a block is mutual in its effect on matching/discovery
    even though the underlying record is one-directional."""
    rows = await db.execute(
        select(Block.blocker_id, Block.blocked_id).where(
            or_(Block.blocker_id == user_id, Block.blocked_id == user_id)
        )
    )
    blocked_ids: set[uuid.UUID] = set()
    for blocker_id, blocked_id in rows.all():
        blocked_ids.add(blocked_id if blocker_id == user_id else blocker_id)
    return blocked_ids
