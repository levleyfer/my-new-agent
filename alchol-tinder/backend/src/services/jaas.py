"""Signs JaaS (Jitsi as a Service, jaas.8x8.vc) room-access JWTs.

JaaS rooms require a JWT signed with the RSA private key generated in the
JaaS console — without it, no one can join (unlike the free public
meet.jit.si server, where anonymous rooms get stuck waiting for a
moderator to log in). Each call participant gets their own token here,
scoped to that one room and carrying only their display name/id — never
location or other PII (see CLAUDE.md).
"""

import time
import uuid
from functools import lru_cache
from pathlib import Path

import jwt

from src.core.config import get_settings

TOKEN_TTL_SECONDS = 60 * 60 * 2  # 2 hours — generous enough a call never expires mid-conversation


@lru_cache
def _private_key() -> str:
    settings = get_settings()
    return Path(settings.JAAS_PRIVATE_KEY_PATH).read_text()


def generate_room_token(*, room_name: str, user_id: uuid.UUID, display_name: str) -> str:
    settings = get_settings()
    now = int(time.time())
    payload = {
        "aud": "jitsi",
        "iss": "chat",
        "sub": settings.JAAS_APP_ID,
        "room": room_name,
        "exp": now + TOKEN_TTL_SECONDS,
        "nbf": now - 10,
        "context": {
            "user": {
                "id": str(user_id),
                "name": display_name,
                "moderator": "true",  # both peers in a 1:1 call are equally privileged
            },
            "features": {
                "livestreaming": False,
                "recording": False,
                "transcription": False,
                "outbound-call": False,
            },
        },
    }
    return jwt.encode(
        payload,
        _private_key(),
        algorithm="RS256",
        headers={"kid": settings.JAAS_API_KEY_ID},
    )
