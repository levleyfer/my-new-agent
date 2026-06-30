from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment / .env file."""

    DATABASE_URL: str
    SECRET_KEY: str = "change-me"
    JWT_SECRET: str = "change-me"
    VERIFICATION_API_KEY: str = ""
    # JaaS (Jitsi as a Service) — see services/jaas.py. APP_ID and API_KEY_ID
    # are public identifiers; PRIVATE_KEY_PATH points to the RSA private key
    # file downloaded from the JaaS console (never commit the key itself).
    JAAS_APP_ID: str = ""
    JAAS_API_KEY_ID: str = ""
    JAAS_PRIVATE_KEY_PATH: str = ""
    MIN_AGE: int = 18  # IL legal drinking age
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
