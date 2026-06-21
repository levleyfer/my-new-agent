from pydantic import BaseModel, Field


class PushTokenRegisterRequest(BaseModel):
    """Registers (or re-confirms) this device's Expo push token for the
    current user. Re-registering an existing token is a no-op upsert, since
    the client calls this on every login / token-refresh, not just once.
    """

    token: str = Field(min_length=1, max_length=255)
