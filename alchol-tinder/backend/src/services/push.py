"""Sends chat-message push notifications via the Expo push API.

This is deliberately separate from `core/connections.py` (the live websocket
channel for in-app realtime events): a push has to reach a device that has
no open websocket at all (app closed/backgrounded), whereas the websocket
only reaches an app that's currently running. The two are complementary, not
overlapping — see routers/matches.py send_message, which fires both.
"""

import logging
import uuid

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.push_token import PushToken

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

# Notifications are sent with this payload shape; chatId is what the client's
# tap/deep-link handler reads to navigate straight into the right chat (see
# mobile/src/notifications/setup.ts handleNotificationResponse). Never include
# location or any other PII here — see CLAUDE.md privacy rules.


async def send_new_message_push(
    db: AsyncSession,
    *,
    recipient_id: uuid.UUID,
    match_id: uuid.UUID,
    sender_name: str,
    message_body: str,
    show_preview: bool,
) -> None:
    """Sends a push to every device on file for `recipient_id`. Silently
    no-ops if the recipient has no registered tokens (push permission was
    never granted, or they've never logged in on a device with this build).
    """
    tokens = (
        await db.scalars(select(PushToken).where(PushToken.user_id == recipient_id))
    ).all()
    if not tokens:
        return

    if show_preview:
        title = sender_name
        body = message_body[:200]  # keep the OS notification body short
    else:
        # Privacy default: no sender name, no message content. See CLAUDE.md
        # — "Show message preview in notifications" defaults OFF.
        title = "New message"
        body = "You have a new message waiting."

    messages = [
        {
            "to": t.token,
            "title": title,
            "body": body,
            "data": {"type": "new_message", "chatId": str(match_id)},
            "sound": "default",
        }
        for t in tokens
    ]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
        response.raise_for_status()
        receipts = response.json().get("data", [])
    except (httpx.HTTPError, ValueError) as exc:
        # Push delivery is best-effort — never let a notification failure
        # break message sending itself.
        logger.warning("Expo push send failed: %s", exc)
        return

    await _prune_invalid_tokens(db, tokens, receipts)


async def _prune_invalid_tokens(
    db: AsyncSession, tokens: list[PushToken], receipts: list[dict]
) -> None:
    """Removes tokens Expo reports as dead so we stop paying the round-trip
    for them and stop leaking a stale "this device" assumption. Expo's send
    response includes one ticket per message, in the same order they were
    submitted, with status "error" and details.error == "DeviceNotRegistered"
    for tokens that are uninstalled/expired.
    """
    invalid_token_values = {
        tokens[i].token
        for i, receipt in enumerate(receipts)
        if i < len(tokens)
        and receipt.get("status") == "error"
        and receipt.get("details", {}).get("error") == "DeviceNotRegistered"
    }
    if not invalid_token_values:
        return

    await db.execute(delete(PushToken).where(PushToken.token.in_(invalid_token_values)))
    await db.commit()
