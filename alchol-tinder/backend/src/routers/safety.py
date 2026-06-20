import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.database import get_db
from src.core.deps import get_current_user
from src.models.safety import Block, Report, ReportReason
from src.models.user import User
from src.schemas.safety import ReportCreateRequest
from src.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["safety"])


@router.post("/{user_id}/block", status_code=status.HTTP_204_NO_CONTENT)
async def block_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    if user_id == current_user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot block yourself")

    target_exists = await db.scalar(select(User.id).where(User.id == user_id))
    if not target_exists:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    # Idempotent — blocking twice is a no-op, not an error.
    stmt = (
        pg_insert(Block)
        .values(blocker_id=current_user.id, blocked_id=user_id)
        .on_conflict_do_nothing(constraint="uq_block_pair")
    )
    await db.execute(stmt)
    await db.commit()


@router.delete("/{user_id}/block", status_code=status.HTTP_204_NO_CONTENT)
async def unblock_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    block = await db.scalar(
        select(Block).where(Block.blocker_id == current_user.id, Block.blocked_id == user_id)
    )
    if block:
        await db.delete(block)
        await db.commit()


@router.get("/me/blocked", response_model=list[UserRead])
async def list_blocked_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[User]:
    return list(
        (
            await db.scalars(
                select(User)
                .options(selectinload(User.tags))
                .join(Block, Block.blocked_id == User.id)
                .where(Block.blocker_id == current_user.id)
            )
        ).all()
    )


@router.post("/{user_id}/report", status_code=status.HTTP_201_CREATED)
async def report_user(
    user_id: uuid.UUID,
    payload: ReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    if user_id == current_user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot report yourself")

    target_exists = await db.scalar(select(User.id).where(User.id == user_id))
    if not target_exists:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    db.add(
        Report(
            reporter_id=current_user.id,
            reported_user_id=user_id,
            reason=ReportReason(payload.reason),
            details=payload.details,
        )
    )
    await db.commit()
    return {"status": "received"}
