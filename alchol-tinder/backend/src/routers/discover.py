from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.database import get_db
from src.core.deps import get_current_user
from src.models.user import User
from src.schemas.discover import DiscoverUser
from src.services.matching import CandidateInput, MatchingIneligible, ensure_eligible_for_matching, rank_candidates
from src.services.safety import get_blocked_user_ids

router = APIRouter(prefix="/discover", tags=["discover"])

MAX_RESULTS = 50

_INELIGIBLE_RESPONSES = {
    "age_not_verified": (status.HTTP_403_FORBIDDEN, "Complete age verification before matching"),
    "location_not_set": (status.HTTP_400_BAD_REQUEST, "Set your location before discovering matches"),
}


@router.get("", response_model=list[DiscoverUser])
async def discover(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DiscoverUser]:
    try:
        ensure_eligible_for_matching(
            is_age_verified=current_user.is_age_verified,
            latitude=current_user.latitude,
            longitude=current_user.longitude,
        )
    except MatchingIneligible as exc:
        status_code, detail = _INELIGIBLE_RESPONSES[exc.reason]
        raise HTTPException(status_code, detail) from exc

    blocked_ids = await get_blocked_user_ids(db, current_user.id)

    candidates = (
        await db.scalars(
            select(User)
            .options(selectinload(User.tags))
            .where(
                User.id != current_user.id,
                User.id.not_in(blocked_ids),
                User.is_age_verified.is_(True),
                User.is_available.is_(True),
                User.latitude.is_not(None),
                User.longitude.is_not(None),
            )
        )
    ).all()
    candidates_by_id = {c.id: c for c in candidates}

    ranked = rank_candidates(
        my_latitude=current_user.latitude,
        my_longitude=current_user.longitude,
        my_tag_ids=frozenset(tag.id for tag in current_user.tags),
        candidates=[
            CandidateInput(
                id=c.id,
                latitude=c.latitude,
                longitude=c.longitude,
                tag_ids=frozenset(tag.id for tag in c.tags),
            )
            for c in candidates
        ],
        limit=MAX_RESULTS,
    )

    return [
        DiscoverUser(
            id=r.id,
            display_name=candidates_by_id[r.id].display_name,
            verification_status=candidates_by_id[r.id].verification_status,
            rating=candidates_by_id[r.id].rating,
            is_available=candidates_by_id[r.id].is_available,
            tags=candidates_by_id[r.id].tags,
            distance_km=r.distance_km,
            shared_tag_count=r.shared_tag_count,
        )
        for r in ranked
    ]
