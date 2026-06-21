import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.connections import manager
from src.core.database import get_db
from src.core.deps import get_current_user
from src.models.match import Match, MatchStatus, VideoSession
from src.models.message import Message
from src.models.rating import Rating
from src.models.user import User
from src.schemas.match import MatchCreateRequest, MatchRead, RatingCreateRequest, VideoSessionRead
from src.schemas.message import MessageCreateRequest, MessageRead
from src.services.safety import get_blocked_user_ids

router = APIRouter(prefix="/matches", tags=["matches"])


async def _other_user(db: AsyncSession, match: Match, current_user_id: uuid.UUID) -> User:
    other_id = match.user_b_id if match.user_a_id == current_user_id else match.user_a_id
    other = await db.scalar(select(User).options(selectinload(User.tags)).where(User.id == other_id))
    assert other is not None  # FK guarantees this
    return other


async def _to_match_read(db: AsyncSession, match: Match, current_user_id: uuid.UUID) -> MatchRead:
    other = await _other_user(db, match, current_user_id)
    my_rating = await db.scalar(
        select(Rating.score).where(Rating.match_id == match.id, Rating.rater_id == current_user_id)
    )
    return MatchRead(
        id=match.id,
        status=match.status,
        compatibility_score=match.compatibility_score,
        created_at=match.created_at,
        other_user=other,
        my_rating=my_rating,
    )


def _require_participant(match: Match, current_user_id: uuid.UUID) -> None:
    if current_user_id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")


@router.post("", response_model=MatchRead, status_code=status.HTTP_201_CREATED)
async def create_match(
    payload: MatchCreateRequest,
    response: Response,
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
        response.status_code = status.HTTP_200_OK
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
    """Starts a fresh 'virtual cheers' call for this match and rings the other
    participant over their call-signaling websocket (see core/connections.py).

    Each call gets a brand-new room name rather than reusing one persistent
    name per match — Jitsi's free public server accumulates state (locks,
    lobby mode) on a room name over repeated joins/leaves, so a long-lived
    name eventually fails with conference.connectionError.membersOnly. A
    fresh name every call avoids that entirely. The frontend's "accept"
    action never calls this endpoint itself (it already has the room name
    from the ring payload), so there's no risk of the acceptor generating a
    second, mismatched room for the same call.
    """
    match = await db.scalar(
        select(Match).options(selectinload(Match.video_session)).where(Match.id == match_id)
    )
    if not match:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")
    _require_participant(match, current_user.id)

    room_name = f"cheers-{uuid.uuid4()}"
    session = match.video_session
    if session:
        session.room_name = room_name
    else:
        session = VideoSession(match_id=match.id, room_name=room_name)
        db.add(session)
    match.status = MatchStatus.video
    await db.commit()
    await db.refresh(session)

    callee_id = match.user_b_id if match.user_a_id == current_user.id else match.user_a_id
    await manager.send_to_user(
        callee_id,
        {
            "type": "incoming_call",
            "match_id": str(match.id),
            "room_name": session.room_name,
            "caller_name": current_user.display_name,
        },
    )
    return session


@router.post("/{match_id}/rate", response_model=MatchRead)
async def rate_match(
    match_id: uuid.UUID,
    payload: RatingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MatchRead:
    """Rates the other participant of this match, 1-5 — never about quantity
    consumed (see CLAUDE.md). Re-rating the same match updates your previous
    score rather than erroring, so people can change their mind.
    """
    match = await db.scalar(select(Match).where(Match.id == match_id))
    if not match:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")
    _require_participant(match, current_user.id)

    if match.status == MatchStatus.pending:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Start a virtual cheers call before rating")

    rated_user_id = match.user_b_id if match.user_a_id == current_user.id else match.user_a_id

    stmt = (
        pg_insert(Rating)
        .values(
            match_id=match.id,
            rater_id=current_user.id,
            rated_user_id=rated_user_id,
            score=payload.score,
        )
        .on_conflict_do_update(
            constraint="uq_rating_per_match_rater",
            set_={"score": payload.score},
        )
    )
    await db.execute(stmt)

    avg_score = await db.scalar(select(func.avg(Rating.score)).where(Rating.rated_user_id == rated_user_id))
    rated_user = await db.get(User, rated_user_id)
    assert rated_user is not None  # FK guarantees this
    rated_user.rating = round(float(avg_score), 2) if avg_score is not None else 0.0

    await db.commit()
    return await _to_match_read(db, match, current_user.id)


@router.get("/{match_id}/messages", response_model=list[MessageRead])
async def list_messages(
    match_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Message]:
    match = await db.scalar(select(Match).where(Match.id == match_id))
    if not match:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")
    _require_participant(match, current_user.id)

    return list(
        (
            await db.scalars(
                select(Message).where(Message.match_id == match_id).order_by(Message.created_at)
            )
        ).all()
    )


@router.post("/{match_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def send_message(
    match_id: uuid.UUID,
    payload: MessageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Message:
    """Chat is available as soon as a match exists — not gated behind virtual
    cheers, since people reasonably want to coordinate logistics first. Pushes
    a real-time notification to the recipient over the same per-user
    websocket channel used for call ringing (see core/connections.py) — one
    generic event channel per user rather than a separate socket per feature.
    """
    match = await db.scalar(select(Match).where(Match.id == match_id))
    if not match:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")
    _require_participant(match, current_user.id)

    other_id = match.user_b_id if match.user_a_id == current_user.id else match.user_a_id
    blocked_ids = await get_blocked_user_ids(db, current_user.id)
    if other_id in blocked_ids:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")

    message = Message(match_id=match.id, sender_id=current_user.id, body=payload.body)
    db.add(message)
    await db.commit()
    await db.refresh(message)

    await manager.send_to_user(
        other_id,
        {
            "type": "new_message",
            "match_id": str(match.id),
            "message": {
                "id": str(message.id),
                "match_id": str(match.id),
                "sender_id": str(message.sender_id),
                "body": message.body,
                "created_at": message.created_at.isoformat(),
            },
        },
    )
    return message
