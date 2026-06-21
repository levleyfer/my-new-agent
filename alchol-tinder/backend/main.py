from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.core.media import MEDIA_ROOT
from src.routers import auth, calls, discover, matches, push_tokens, safety, tags, users

app = FastAPI(title="Social Drinking App API")
app.mount("/media", StaticFiles(directory=MEDIA_ROOT), name="media")

# Dev-only: the Expo web client and this API run on different origins (e.g. a
# forwarded dev tunnel for each). Auth uses Bearer tokens, not cookies, so an
# open origin policy carries no credential-theft risk here. Tighten this to a
# fixed allowlist before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(safety.router)
app.include_router(tags.router)
app.include_router(discover.router)
app.include_router(matches.router)
app.include_router(calls.router)
app.include_router(push_tokens.router)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
