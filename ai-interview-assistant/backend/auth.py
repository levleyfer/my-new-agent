from datetime import datetime, timedelta, timezone
from typing import Any

# Library for creating and decoding JWT (JSON Web Tokens)
from jose import JWTError, jwt

# Library for securely hashing and verifying passwords
from passlib.context import CryptContext

# Import application configuration
from config import settings

# Configure Passlib to use the bcrypt hashing algorithm.
# "deprecated='auto'" automatically handles migration from older algorithms if needed.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt before storing it in the database.
    """
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """
    Compare a plain-text password with its hashed version.
    Returns True if they match, otherwise False.
    """
    return pwd_context.verify(plain, hashed)


def create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    """
    Create a JWT with:
    - sub: the user's ID
    - exp: expiration time
    - type: access or refresh
    """

    # Calculate when the token expires
    expire = datetime.now(timezone.utc) + expires_delta

    # Data stored inside the JWT
    payload = {
        "sub": subject,
        "exp": expire,
        "type": token_type,
    }

    # Encode and sign the token using the application's secret key
    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_access_token(user_id: str) -> str:
    """
    Generate a short-lived access token used to authenticate API requests.
    """
    return create_token(
        user_id,
        "access",
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: str) -> str:
    """
    Generate a long-lived refresh token used to obtain new access tokens
    without requiring the user to log in again.
    """
    return create_token(
        user_id,
        "refresh",
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and verify a JWT.

    Returns:
        The payload stored inside the token.

    Raises:
        ValueError: If the token is invalid, expired, or has an incorrect signature.
    """
    try:
        # Verify the token's signature and decode its payload
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload

    except JWTError:
        # Raised if the token is invalid or expired
        raise ValueError("Invalid token")