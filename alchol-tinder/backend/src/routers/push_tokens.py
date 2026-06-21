from fastapi import APIRouter, Depends, status
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.models.push_token import PushToken
from src.models.user import User
from src.schemas.push_token import PushTokenRegisterRequest

router = APIRouter(prefix="/push-tokens", tags=["push-tokens"])


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
async def register_push_token(
    payload: PushTokenRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Registers this device's Expo push token for the current user.

    Called on login and whenever Expo issues a fresh token (the listener in
    mobile/src/notifications/setup.ts fires on first registration *and* on
    rotation, so this needs to be idempotent either way). The token column is
    globally unique — if the same physical token was previously registered
    to a different account on this device (e.g. user A logged out, user B
    logged in), this re-points it at the new owner rather than erroring.
    """
    stmt = (
        pg_insert(PushToken)
        .values(user_id=current_user.id, token=payload.token)
        .on_conflict_do_update(
            index_elements=[PushToken.token],
            set_={"user_id": current_user.id},
        )
    )
    await db.execute(stmt)
    await db.commit()


@router.delete("/{token}", status_code=status.HTTP_204_NO_CONTENT)
async def unregister_push_token(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Removes a token on explicit logout, so a logged-out device stops
    receiving pushes for an account it's no longer signed into. Scoped to the
    caller's own tokens — deleting someone else's token id isn't possible
    here since the row also has to match current_user.id.
    """
    await db.execute(
        delete(PushToken).where(PushToken.token == token, PushToken.user_id == current_user.id)
    )
    await db.commit()
