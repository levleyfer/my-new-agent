from src.schemas.user import UserRead


class DiscoverUser(UserRead):
    """A nearby candidate — distance is always pre-fuzzed server-side, never raw."""

    distance_km: float
    shared_tag_count: int
