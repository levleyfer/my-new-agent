import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.database import get_db
from src.core.deps import get_current_user
from src.core.media import AVATAR_DIR
from src.core.security import hash_password
from src.models.tag import Tag
from src.models.user import User
from src.schemas.user import (
    AvailabilityUpdateRequest,
    LocationUpdateRequest,
    NotificationPreferenceUpdateRequest,
    TagsUpdateRequest,
    UserCreate,
    UserMeRead,
    UserRead,
)

router = APIRouter(prefix="/users", tags=["users"])

MAX_AVATAR_BYTES = 5 * 1024 * 1024
_AVATAR_EXTENSIONS_BY_CONTENT_TYPE = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _delete_avatar_file(avatar_url: str | None) -> None:
    if not avatar_url:
        return
    # .name strips any directory components, so this can never escape AVATAR_DIR
    # even if avatar_url were ever malformed.
    (AVATAR_DIR / Path(avatar_url).name).unlink(missing_ok=True)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    exists = await db.scalar(select(User).where(User.email == payload.email))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    # UserCreate.birth_date already rejected anything under MIN_AGE (see
    # schemas/user.py), so age is verified the moment registration succeeds —
    # no separate manual step. This is still a backend-enforced check against
    # the stored birth_date, not a client-declared flag (see CLAUDE.md: age
    # must be a verified attribute, never self-declared-only for matching).
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name,
        birth_date=payload.birth_date,
        is_age_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user, attribute_names=["tags"])
    return user


@router.get("/me", response_model=UserMeRead)
async def get_my_profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.put("/me/tags", response_model=UserMeRead)
async def update_my_tags(
    payload: TagsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    if payload.tag_ids:
        tags = (await db.scalars(select(Tag).where(Tag.id.in_(payload.tag_ids)))).all()
        if len(tags) != len(set(payload.tag_ids)):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "One or more tag_ids are invalid")
    else:
        tags = []

    current_user.tags = list(tags)
    await db.commit()
    await db.refresh(current_user, attribute_names=["tags"])
    return current_user


@router.patch("/me/location", response_model=UserMeRead)
async def update_my_location(
    payload: LocationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    current_user.latitude = payload.latitude
    current_user.longitude = payload.longitude
    await db.commit()
    await db.refresh(current_user, attribute_names=["tags"])
    return current_user


@router.patch("/me/availability", response_model=UserMeRead)
async def update_my_availability(
    payload: AvailabilityUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    current_user.is_available = payload.is_available
    await db.commit()
    await db.refresh(current_user, attribute_names=["tags"])
    return current_user


@router.patch("/me/notification-preferences", response_model=UserMeRead)
async def update_my_notification_preferences(
    payload: NotificationPreferenceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """'Show message preview in notifications' — defaults OFF (see
    models/user.py). Flipping this on is an explicit, revocable opt-in; it
    only affects what text a push notification shows, never what's stored.
    """
    current_user.notify_message_preview = payload.notify_message_preview
    await db.commit()
    await db.refresh(current_user, attribute_names=["tags"])
    return current_user


@router.post("/me/avatar", response_model=UserMeRead)
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    extension = _AVATAR_EXTENSIONS_BY_CONTENT_TYPE.get(file.content_type or "")
    if not extension:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Avatar must be a JPEG, PNG, or WebP image")

    content = await file.read()
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Avatar must be under 5MB")

    _delete_avatar_file(current_user.avatar_url)
    filename = f"{uuid.uuid4()}{extension}"
    (AVATAR_DIR / filename).write_bytes(content)
    current_user.avatar_url = f"/media/avatars/{filename}"

    await db.commit()
    await db.refresh(current_user, attribute_names=["tags"])
    return current_user


@router.delete("/me/avatar", response_model=UserMeRead)
async def delete_my_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    _delete_avatar_file(current_user.avatar_url)
    current_user.avatar_url = None
    await db.commit()
    await db.refresh(current_user, attribute_names=["tags"])
    return current_user


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await db.scalar(
        select(User).options(selectinload(User.tags)).where(User.id == user_id)
    )
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user
