from pydantic_settings import BaseSettings


# BaseSettings automatically loads values from environment variables
# or from the .env file defined below.
class Settings(BaseSettings):
    # Database connection string
    DATABASE_URL: str = "postgresql+asyncpg://interview_user:password@localhost:5432/interview_db"

    # Secret key used to sign JWT tokens
    # (Should be changed in production and kept secret)
    SECRET_KEY: str = "change-me-in-production-min-32-chars!!"

    # Algorithm used for signing JWT tokens
    ALGORITHM: str = "HS256"

    # Access token lifetime (in minutes)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    # Refresh token lifetime (in days)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # API key for Anthropic's Claude API
    ANTHROPIC_API_KEY: str = ""

    # Whisper speech-to-text model to use
    WHISPER_MODEL: str = "base"

    # Directory where uploaded audio files are stored
    UPLOAD_DIR: str = "./uploads"

    # Maximum allowed upload size in MB
    MAX_UPLOAD_MB: int = 25

    # Frontend origins allowed to access the API (CORS)
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost",
        "https://frontend-ruddy-phi-26.vercel.app",
    ]

    # Enables or disables debug mode
    DEBUG: bool = False

    class Config:
        # Load environment variables from the .env file
        # Values in .env override the defaults above.
        env_file = ".env"


# Create a single settings instance that can be imported
# anywhere in the application.
settings = Settings()