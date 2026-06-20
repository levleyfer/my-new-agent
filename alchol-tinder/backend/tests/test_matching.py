import uuid

import pytest

from src.services.matching import (
    CandidateInput,
    MatchingIneligible,
    ensure_eligible_for_matching,
    rank_candidates,
)

TEL_AVIV = (32.0853, 34.7818)


def make_candidate(lat: float, lon: float, tag_ids: set[uuid.UUID]) -> CandidateInput:
    return CandidateInput(id=uuid.uuid4(), latitude=lat, longitude=lon, tag_ids=frozenset(tag_ids))


# --- ensure_eligible_for_matching -------------------------------------------------


def test_raises_when_not_age_verified():
    with pytest.raises(MatchingIneligible) as exc_info:
        ensure_eligible_for_matching(is_age_verified=False, latitude=32.0, longitude=34.0)
    assert exc_info.value.reason == "age_not_verified"


def test_raises_when_location_missing():
    with pytest.raises(MatchingIneligible) as exc_info:
        ensure_eligible_for_matching(is_age_verified=True, latitude=None, longitude=None)
    assert exc_info.value.reason == "location_not_set"


def test_age_check_takes_priority_over_location():
    # An unverified user with no location should be told to verify age first,
    # not given a confusing/unrelated location error.
    with pytest.raises(MatchingIneligible) as exc_info:
        ensure_eligible_for_matching(is_age_verified=False, latitude=None, longitude=None)
    assert exc_info.value.reason == "age_not_verified"


def test_passes_when_verified_and_located():
    ensure_eligible_for_matching(is_age_verified=True, latitude=32.0, longitude=34.0)  # no raise


# --- rank_candidates ---------------------------------------------------------------


def test_ranks_more_shared_tags_first_regardless_of_distance():
    tag_a, tag_b, tag_c = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    my_tags = frozenset({tag_a, tag_b, tag_c})

    nearby_one_shared = make_candidate(32.0860, 34.7820, {tag_a})  # ~0.1km away
    far_two_shared = make_candidate(32.2000, 34.9000, {tag_a, tag_b})  # ~15km away

    ranked = rank_candidates(
        my_latitude=TEL_AVIV[0],
        my_longitude=TEL_AVIV[1],
        my_tag_ids=my_tags,
        candidates=[nearby_one_shared, far_two_shared],
    )

    assert [c.id for c in ranked] == [far_two_shared.id, nearby_one_shared.id]


def test_breaks_ties_by_proximity():
    tag_a = uuid.uuid4()
    my_tags = frozenset({tag_a})

    nearby = make_candidate(32.0860, 34.7820, {tag_a})
    far = make_candidate(32.2000, 34.9000, {tag_a})

    ranked = rank_candidates(
        my_latitude=TEL_AVIV[0],
        my_longitude=TEL_AVIV[1],
        my_tag_ids=my_tags,
        candidates=[far, nearby],
    )

    assert [c.id for c in ranked] == [nearby.id, far.id]


def test_distance_is_fuzzed_not_raw():
    candidate = make_candidate(32.0860, 34.7820, set())
    ranked = rank_candidates(
        my_latitude=TEL_AVIV[0],
        my_longitude=TEL_AVIV[1],
        my_tag_ids=frozenset(),
        candidates=[candidate],
    )
    # Raw haversine distance here is a non-round number (~0.09km); fuzzing
    # buckets it to the nearest 0.5km — this asserts fuzzing actually ran,
    # not just that some float came back.
    assert ranked[0].distance_km in (0.0, 0.5)


def test_respects_limit():
    my_tags = frozenset()
    candidates = [make_candidate(32.0 + i * 0.01, 34.0, set()) for i in range(10)]
    ranked = rank_candidates(
        my_latitude=TEL_AVIV[0],
        my_longitude=TEL_AVIV[1],
        my_tag_ids=my_tags,
        candidates=candidates,
        limit=3,
    )
    assert len(ranked) == 3
