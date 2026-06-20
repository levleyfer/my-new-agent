"""Tag-based matching engine — pure ranking/eligibility logic, no DB or HTTP.

Keeping this DB-free makes the ranking and safety-gate rules directly unit
testable: see CLAUDE.md Product & Safety Rules — age verification is a hard
gate before matching, ranking is never based on anything consumption-related,
and distance is always pre-fuzzed before it leaves this layer.
"""

import uuid
from dataclasses import dataclass

from src.core.safety import fuzz_distance_km, haversine_km


class MatchingIneligible(Exception):
    """Raised when a user does not meet the prerequisites for matching."""

    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)


@dataclass(frozen=True)
class CandidateInput:
    id: uuid.UUID
    latitude: float
    longitude: float
    tag_ids: frozenset[uuid.UUID]


@dataclass(frozen=True)
class RankedCandidate:
    id: uuid.UUID
    distance_km: float
    shared_tag_count: int


def ensure_eligible_for_matching(*, is_age_verified: bool, latitude: float | None, longitude: float | None) -> None:
    """Raises MatchingIneligible if the user cannot participate in matching.

    Age verification before any matching is a hard requirement (CLAUDE.md) —
    checked first and independently of location so the two failure reasons
    are never conflated.
    """
    if not is_age_verified:
        raise MatchingIneligible("age_not_verified")
    if latitude is None or longitude is None:
        raise MatchingIneligible("location_not_set")


def rank_candidates(
    *,
    my_latitude: float,
    my_longitude: float,
    my_tag_ids: frozenset[uuid.UUID],
    candidates: list[CandidateInput],
    limit: int = 50,
) -> list[RankedCandidate]:
    """Ranks candidates by shared-tag overlap (desc), then proximity (asc).

    Never ranks by quantity/consumption signals — there is no such field on
    CandidateInput by construction. Distance is fuzzed here so callers never
    have to remember to do it themselves.
    """
    ranked = [
        RankedCandidate(
            id=candidate.id,
            distance_km=fuzz_distance_km(
                haversine_km(my_latitude, my_longitude, candidate.latitude, candidate.longitude)
            ),
            shared_tag_count=len(my_tag_ids & candidate.tag_ids),
        )
        for candidate in candidates
    ]
    ranked.sort(key=lambda r: (-r.shared_tag_count, r.distance_km))
    return ranked[:limit]
