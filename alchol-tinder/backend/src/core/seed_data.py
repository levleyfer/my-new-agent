"""Canonical tag catalog (see CLAUDE.md Tag Categories) and a seeding helper.

Run via: python -m src.core.seed_data
"""

import asyncio

from sqlalchemy import select

from src.core.database import SessionLocal
from src.models.tag import Tag, TagCategory

TAGS: list[tuple[TagCategory, str]] = [
    (TagCategory.taste, "beer only"),
    (TagCategory.taste, "wine"),
    (TagCategory.taste, "whiskey"),
    (TagCategory.taste, "spirits"),
    (TagCategory.taste, "cocktails"),
    (TagCategory.taste, "gin & tonic"),
    (TagCategory.taste, "soft drinks welcome"),
    (TagCategory.vibe, "good conversation"),
    (TagCategory.vibe, "celebration mode"),
    (TagCategory.vibe, "meet new people"),
    (TagCategory.vibe, "looking for company at a bar"),
    (TagCategory.vibe, "relaxed evening"),
    (TagCategory.vibe, "social mood"),
    (TagCategory.logistics, "nearby"),
    (TagCategory.logistics, "available now"),
    (TagCategory.logistics, "available tonight"),
    (TagCategory.logistics, "prefer public place"),
    (TagCategory.logistics, "virtual cheers first"),
]


async def seed_tags() -> None:
    async with SessionLocal() as session:
        result = await session.execute(select(Tag.category, Tag.name))
        existing_pairs = {(row.category, row.name) for row in result.all()}

        added = 0
        for category, name in TAGS:
            if (category, name) in existing_pairs:
                continue
            session.add(Tag(category=category, name=name))
            added += 1

        await session.commit()
        print(f"Seeded {added} new tag(s); {len(TAGS) - added} already present.")


if __name__ == "__main__":
    asyncio.run(seed_tags())
