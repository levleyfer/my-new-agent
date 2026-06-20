from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.models.tag import Tag
from src.schemas.user import TagRead

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagRead])
async def list_tags(db: AsyncSession = Depends(get_db)) -> list[Tag]:
    return list((await db.scalars(select(Tag).order_by(Tag.category, Tag.name))).all())
