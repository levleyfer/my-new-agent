"""Safety/compliance helpers enforced across the app (see CLAUDE.md)."""

import math
from datetime import date

_EARTH_RADIUS_KM = 6371.0


def compute_age(birth_date: date, today: date | None = None) -> int:
    today = today or date.today()
    years = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        years -= 1
    return years


def is_of_age(birth_date: date, min_age: int = 18) -> bool:
    return compute_age(birth_date) >= min_age


def fuzz_distance_km(distance_km: float, bucket_km: float = 0.5) -> float:
    """Never expose precise location. Round distance to a coarse bucket so the
    client only ever sees an approximate '~X km away'."""
    if distance_km < 0:
        distance_km = 0.0
    return round(round(distance_km / bucket_km) * bucket_km, 1)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * _EARTH_RADIUS_KM * math.asin(math.sqrt(a))
