from pydantic import BaseModel, Field


class ReportCreateRequest(BaseModel):
    reason: str = Field(pattern="^(inappropriate_behavior|fake_profile|harassment|safety_concern|other)$")
    details: str | None = Field(default=None, max_length=1000)
