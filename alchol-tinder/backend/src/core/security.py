import uuid
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from src.core.config import get_settings

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
_settings = get_settings()


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def create_access_token(user_id: uuid.UUID) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=_settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expires_at}
    return jwt.encode(payload, _settings.JWT_SECRET, algorithm=_settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> uuid.UUID:
    """Raises jwt.PyJWTError (expired/invalid/malformed) on failure — caller maps to 401."""
    payload = jwt.decode(token, _settings.JWT_SECRET, algorithms=[_settings.JWT_ALGORITHM])
    return uuid.UUID(payload["sub"])
