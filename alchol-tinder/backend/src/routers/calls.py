import uuid

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from src.core.connections import manager
from src.core.database import SessionLocal
from src.core.security import decode_access_token
from src.models.match import Match

router = APIRouter()


async def _other_participant(db, match_id: uuid.UUID, current_user_id: uuid.UUID) -> uuid.UUID | None:
    match = await db.scalar(select(Match).where(Match.id == match_id))
    if not match or current_user_id not in (match.user_a_id, match.user_b_id):
        return None
    return match.user_b_id if match.user_a_id == current_user_id else match.user_a_id


@router.websocket("/ws/calls")
async def call_signaling(websocket: WebSocket, token: str) -> None:
    """Push channel for 'virtual cheers' ringing — see CLAUDE.md: video call
    is a safety primitive, not just a feature, so the callee should actually
    know they're being called rather than relying on chat to coordinate.

    Auth via ?token=<jwt> (browsers can't set custom headers on a WebSocket
    handshake). One connection per device; a user may have several open.
    """
    try:
        user_id = decode_access_token(token)
    except jwt.PyJWTError:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    manager.register(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "decline":
                match_id_raw = data.get("match_id")
                if not match_id_raw:
                    continue
                async with SessionLocal() as db:
                    caller_id = await _other_participant(db, uuid.UUID(match_id_raw), user_id)
                if caller_id:
                    await manager.send_to_user(
                        caller_id, {"type": "call_declined", "match_id": match_id_raw}
                    )
    except (WebSocketDisconnect, ValueError):
        pass
    finally:
        manager.unregister(user_id, websocket)
