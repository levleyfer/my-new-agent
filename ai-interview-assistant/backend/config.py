from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://interview_user:password@localhost:5432/interview_db"
    SECRET_KEY: str = "change-me-in-production-min-32-chars!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ANTHROPIC_API_KEY: str = ""
    WHISPER_MODEL: str = "base"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 25
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost",
        "https://frontend-ruddy-phi-26.vercel.app",
    ]
    DEBUG: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
