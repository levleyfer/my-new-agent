import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.database import get_db
from src.core.deps import get_current_user
from src.core.security import hash_password
from src.models.tag import Tag
from src.models.user import User, VerificationStatus
from src.schemas.user import (
    AvailabilityUpdateRequest,
    LocationUpdateRequest,
    TagsUpdateRequest,
    UserCreate,
    UserMeRead,
    UserRead,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    exists = await db.scalar(select(User).where(User.email == payload.email))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name,
        birth_date=payload.birth_date,
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


@router.post("/me/verify", response_model=UserMeRead)
async def verify_my_age(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """DEV STUB — auto-approves age verification.

    This does NOT perform real identity/age verification. It exists only so the
    matching age-gate (is_age_verified) can be exercised before launch. Replace
    with a real call to a KYC provider (Onfido/Veriff, via VERIFICATION_API_KEY)
    before this app handles real users — see CLAUDE.md Product & Safety Rules.
    """
    current_user.is_age_verified = True
    current_user.verification_status = VerificationStatus.verified
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
