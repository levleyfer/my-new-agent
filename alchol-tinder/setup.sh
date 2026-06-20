#!/usr/bin/env bash
#
# Project bootstrap script — social drinking companion app.
# Run from inside this folder (alchol-tinder/), which already contains CLAUDE.md
# and lives inside the parent git repo.
#
#   bash setup.sh
#
# On Windows: run inside Git Bash or WSL.
#
set -euo pipefail

say() { printf "\n\033[1;36m==> %s\033[0m\n" "$1"; }

# ---------------------------------------------------------------------------
# Pick a Python interpreter (3.12 preferred)
# ---------------------------------------------------------------------------
if command -v python3.12 >/dev/null 2>&1; then PY=python3.12
elif command -v python3 >/dev/null 2>&1; then PY=python3
else PY=python
fi

# ---------------------------------------------------------------------------
# 1. Folder structure (matches CLAUDE.md's documented layout)
# ---------------------------------------------------------------------------
say "Creating folder structure"
mkdir -p mobile docs scripts research assets config archive
mkdir -p backend/{src,tests}
mkdir -p backend/src/{models,schemas,routers,core}
mkdir -p backend/migrations/versions

# ---------------------------------------------------------------------------
# 2. .gitignore (this folder lives inside an existing git repo — no git init here)
# ---------------------------------------------------------------------------
say "Writing .gitignore"
cat > .gitignore << 'IGNORE'
# Python
.venv/
__pycache__/
*.pyc
# Env / secrets
.env
*.env
!.env.example
# Node / RN
node_modules/
.expo/
# OS / IDE
.DS_Store
.vscode/
IGNORE

# ---------------------------------------------------------------------------
# 3. Backend: dependency + env files
# ---------------------------------------------------------------------------
say "Writing backend config files"

cat > backend/requirements.txt << 'REQ'
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg
alembic
pydantic-settings
pydantic[email]
python-dotenv
passlib[bcrypt]
bcrypt==4.0.1
pyjwt
pytest
REQ

cat > backend/.env.example << 'ENVEX'
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/social_drinks
SECRET_KEY=change-me
JWT_SECRET=change-me
VERIFICATION_API_KEY=
VIDEO_PROVIDER_API_KEY=
ENVEX
cp backend/.env.example backend/.env

# ---------------------------------------------------------------------------
# 4. Backend: core (settings + db + safety utils)
# ---------------------------------------------------------------------------
cat > backend/src/__init__.py << 'PYEOF'
PYEOF

cat > backend/src/core/__init__.py << 'PYEOF'
PYEOF

cat > backend/src/core/config.py << 'PYEOF'
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment / .env file."""

    DATABASE_URL: str
    SECRET_KEY: str = "change-me"
    JWT_SECRET: str = "change-me"
    VERIFICATION_API_KEY: str = ""
    VIDEO_PROVIDER_API_KEY: str = ""
    MIN_AGE: int = 18  # IL legal drinking age

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
PYEOF

cat > backend/src/core/database.py << 'PYEOF'
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from src.core.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all ORM models."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
PYEOF

cat > backend/src/core/safety.py << 'PYEOF'
"""Safety/compliance helpers enforced across the app (see CLAUDE.md)."""

from datetime import date


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
PYEOF

cat > backend/src/core/security.py << 'PYEOF'
from passlib.context import CryptContext

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)
PYEOF

# ---------------------------------------------------------------------------
# 5. Backend: models
# ---------------------------------------------------------------------------
say "Writing models"

cat > backend/src/models/__init__.py << 'PYEOF'
from src.models.tag import Tag, TagCategory, user_tags
from src.models.user import User, VerificationStatus

__all__ = ["User", "VerificationStatus", "Tag", "TagCategory", "user_tags"]
PYEOF

cat > backend/src/models/tag.py << 'PYEOF'
import enum
import uuid

from sqlalchemy import Column, Enum, ForeignKey, String, Table, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class TagCategory(str, enum.Enum):
    taste = "taste"        # beer, wine, whiskey, spirits, cocktails...
    vibe = "vibe"          # good conversation, celebration, relaxed...
    logistics = "logistics"  # nearby, available now, public place, video first...


# Many-to-many association between users and tags.
user_tags = Table(
    "user_tags",
    Base.metadata,
    Column("user_id", Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Uuid, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("category", "name", name="uq_tag_category_name"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    category: Mapped[TagCategory] = mapped_column(Enum(TagCategory), nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)

    users: Mapped[list["User"]] = relationship(  # noqa: F821
        secondary=user_tags, back_populates="tags"
    )
PYEOF

cat > backend/src/models/user.py << 'PYEOF'
import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
from src.models.tag import Tag, user_tags


class VerificationStatus(str, enum.Enum):
    unverified = "unverified"
    pending = "pending"
    verified = "verified"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)

    # Age gate — birth_date is the source of truth; is_age_verified must be True
    # before the user is allowed into matching (enforced in service layer).
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_age_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.unverified, nullable=False
    )

    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Raw location is sensitive PII. Never return these fields directly to clients —
    # expose only a fuzzed distance (see core/safety.fuzz_distance_km).
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    tags: Mapped[list[Tag]] = relationship(secondary=user_tags, back_populates="users")
PYEOF

# ---------------------------------------------------------------------------
# 6. Backend: schemas
# ---------------------------------------------------------------------------
say "Writing schemas"

cat > backend/src/schemas/__init__.py << 'PYEOF'
PYEOF

cat > backend/src/schemas/user.py << 'PYEOF'
import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from src.core.config import get_settings
from src.core.safety import is_of_age

_MIN_AGE = get_settings().MIN_AGE


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    birth_date: date

    @field_validator("birth_date")
    @classmethod
    def must_be_of_age(cls, value: date) -> date:
        if not is_of_age(value, _MIN_AGE):
            raise ValueError(f"Users must be at least {_MIN_AGE} years old.")
        return value


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    category: str
    name: str


class UserRead(BaseModel):
    """Public-facing user view. Deliberately omits raw coordinates (PII)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str
    verification_status: str
    rating: float
    is_available: bool
    tags: list[TagRead] = []
PYEOF

# ---------------------------------------------------------------------------
# 7. Backend: routers
# ---------------------------------------------------------------------------
say "Writing routers"

cat > backend/src/routers/__init__.py << 'PYEOF'
PYEOF

cat > backend/src/routers/users.py << 'PYEOF'
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.database import get_db
from src.core.security import hash_password
from src.models.user import User
from src.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    exists = await db.scalar(select(User).where(User.email == payload.email))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name,
        birth_date=payload.birth_date,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user, attribute_names=["tags"])
    return user


@router.get("/{user_id}", response_model=UserRead)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> User:
    user = await db.scalar(
        select(User).options(selectinload(User.tags)).where(User.id == user_id)
    )
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user
PYEOF

# ---------------------------------------------------------------------------
# 8. Backend: app entrypoint
# ---------------------------------------------------------------------------
cat > backend/main.py << 'PYEOF'
from fastapi import FastAPI

from src.routers import users

app = FastAPI(title="Social Drinking App API")

app.include_router(users.router)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
PYEOF

# ---------------------------------------------------------------------------
# 9. Alembic (async)
# ---------------------------------------------------------------------------
say "Writing Alembic config"

cat > backend/alembic.ini << 'INI'
[alembic]
script_location = migrations
prepend_sys_path = .

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
INI

cat > backend/migrations/env.py << 'PYEOF'
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from src.core.config import get_settings
from src.core.database import Base
import src.models  # noqa: F401  (import models so they register on metadata)

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
DB_URL = get_settings().DATABASE_URL


def run_migrations_offline() -> None:
    context.configure(url=DB_URL, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def _do_run(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(DB_URL)
    async with engine.connect() as connection:
        await connection.run_sync(_do_run)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
PYEOF

cat > backend/migrations/script.py.mako << 'MAKO'
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
MAKO

# ---------------------------------------------------------------------------
# 10. Python venv + dependencies
# ---------------------------------------------------------------------------
say "Creating virtual environment ($PY)"
cd backend
"$PY" -m venv .venv

# Activate (cross-platform: Windows Git Bash vs Unix)
if [ -f .venv/Scripts/activate ]; then
  # shellcheck disable=SC1091
  source .venv/Scripts/activate
else
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

say "Installing dependencies"
python -m pip install --upgrade pip -q
pip install -q -r requirements.txt

cd ..

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
cat << 'DONE'

============================================================
 Setup complete.

 Next steps:
   1. Create the database (one-time):
        CREATE DATABASE social_drinks;
   2. Put real credentials in backend/.env
   3. From backend/, with the venv active:
        alembic revision --autogenerate -m "initial schema"
        alembic upgrade head
        uvicorn main:app --reload
   4. Open http://127.0.0.1:8000/docs

 Note: PostGIS-based geo matching is deferred — location is stored
 as plain lat/lng for now and exposed only via fuzzed distance.
============================================================
DONE
