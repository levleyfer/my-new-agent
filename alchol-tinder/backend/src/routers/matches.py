import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.database import get_db
from src.core.deps import get_current_user
from src.models.match import Match, MatchStatus, VideoSession
from src.models.user import User
from src.schemas.match import MatchCreateRequest, MatchRead, VideoSessionRead
from src.services.safety import get_blocked_user_ids

router = APIRouter(prefix="/matches", tags=["matches"])


async def _other_user(db: AsyncSession, match: Match, current_user_id: uuid.UUID) -> User:
    other_id = match.user_b_id if match.user_a_id == current_user_id else match.user_a_id
    other = await db.scalar(select(User).options(selectinload(User.tags)).where(User.id == other_id))
    assert other is not None  # FK guarantees this
    return other


async def _to_match_read(db: AsyncSession, match: Match, current_user_id: uuid.UUID) -> MatchRead:
    other = await _other_user(db, match, current_user_id)
    return MatchRead(
        id=match.id,
        status=match.status,
        compatibility_score=match.compatibility_score,
        created_at=match.created_at,
        other_user=other,
    )


def _require_participant(match: Match, current_user_id: uuid.UUID) -> None:
    if current_user_id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")


@router.post("", response_model=MatchRead, status_code=status.HTTP_201_CREATED)
async def create_match(
    payload: MatchCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MatchRead:
    if payload.target_user_id == current_user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot match with yourself")

    target = await db.scalar(
        select(User).options(selectinload(User.tags)).where(User.id == payload.target_user_id)
    )
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    # Both sides must be age-verified before any match can exist.
    if not current_user.is_age_verified or not target.is_age_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Both users must complete age verification")

    blocked_ids = await get_blocked_user_ids(db, current_user.id)
    if target.id in blocked_ids:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    existing = await db.scalar(
        select(Match).where(
            or_(
                (Match.user_a_id == current_user.id) & (Match.user_b_id == target.id),
                (Match.user_a_id == target.id) & (Match.user_b_id == current_user.id),
            )
        )
    )
    if existing:
        return await _to_match_read(db, existing, current_user.id)

    shared = len({t.id for t in current_user.tags} & {t.id for t in target.tags})
    match = Match(user_a_id=current_user.id, user_b_id=target.id, compatibility_score=shared)
    db.add(match)
    await db.commit()
    await db.refresh(match)
    return await _to_match_read(db, match, current_user.id)


@router.get("", response_model=list[MatchRead])
async def list_my_matches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MatchRead]:
    matches = (
        await db.scalars(
            select(Match).where(
                or_(Match.user_a_id == current_user.id, Match.user_b_id == current_user.id)
            )
        )
    ).all()
    return [await _to_match_read(db, m, current_user.id) for m in matches]


@router.post("/{match_id}/video", response_model=VideoSessionRead)
async def start_virtual_cheers(
    match_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VideoSession:
    """Creates (or returns) the WebRTC room for this match's 'virtual cheers' call.

    MVP placeholder: room_name is an opaque id, not a real provider room. Wiring
    a managed WebRTC provider (LiveKit/Daily) is a follow-up.
    """
    match = await db.scalar(
        select(Match).options(selectinload(Match.video_session)).where(Match.id == match_id)
    )
    if not match:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")
    _require_participant(match, current_user.id)

    if match.video_session:
        return match.video_session

    session = VideoSession(match_id=match.id, room_name=f"cheers-{match.id}")
    match.status = MatchStatus.video
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session
