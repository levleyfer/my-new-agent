"""In-memory registry of open call-signaling WebSocket connections, keyed by
user id. Single-process only — fine for the current single-instance deployment;
would need a shared backend (e.g. Redis pub/sub) to scale beyond one process.
"""

import uuid
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)

    def register(self, user_id: uuid.UUID, websocket: WebSocket) -> None:
        self._connections[user_id].add(websocket)

    def unregister(self, user_id: uuid.UUID, websocket: WebSocket) -> None:
        connections = self._connections.get(user_id)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            del self._connections[user_id]

    async def send_to_user(self, user_id: uuid.UUID, message: dict) -> bool:
        """Returns True if at least one connection for this user received the message."""
        connections = list(self._connections.get(user_id, ()))
        delivered = False
        for websocket in connections:
            try:
                await websocket.send_json(message)
                delivered = True
            except Exception:
                self.unregister(user_id, websocket)
        return delivered


manager = ConnectionManager()
