from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings

# One engine per app — it owns the connection pool. DATABASE_URL must use an
# async driver (e.g. postgresql+asyncpg://). echo logs SQL when DEBUG is on.
engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)

# Session factory: call AsyncSessionLocal() to get one session per request.
# expire_on_commit=False keeps ORM objects usable after commit() — without it,
# attribute access post-commit triggers a lazy reload, which async forbids and
# would raise during response serialization.
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


# Declarative base for all ORM models; Base.metadata drives create_all().
class Base(DeclarativeBase):
    pass


async def get_db():
    # FastAPI dependency: yields a session for one request, then the async-with
    # closes it on the way out. Routes commit explicitly; this only opens/closes.
    async with AsyncSessionLocal() as session:
        yield session