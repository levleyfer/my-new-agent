import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, field_validator


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Questions ─────────────────────────────────────────────────────────────────

class QuestionResponse(BaseModel):
    id: uuid.UUID
    category: str
    difficulty: str
    text: str
    follow_ups: list[Any]
    tags: list[Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionList(BaseModel):
    items: list[QuestionResponse]
    total: int
    limit: int
    offset: int


# ── Sessions ──────────────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    question_id: uuid.UUID
    notes: str | None = None


class SessionSummary(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    status: str
    created_at: datetime
    overall_score: int | None = None
    question_text: str | None = None
    question_category: str | None = None

    model_config = {"from_attributes": True}


class RecordingInfo(BaseModel):
    id: uuid.UUID
    duration_seconds: float
    file_size_bytes: int

    model_config = {"from_attributes": True}


class TranscriptInfo(BaseModel):
    id: uuid.UUID
    text: str
    word_count: int
    language: str

    model_config = {"from_attributes": True}


class FillerWord(BaseModel):
    word: str
    count: int


class AnalysisResponse(BaseModel):
    id: uuid.UUID
    overall_score: int
    clarity_score: int
    completeness_score: int
    communication_score: int
    confidence_score: int
    star_method_score: int
    technical_depth_score: int
    clarity_feedback: str
    completeness_feedback: str
    communication_feedback: str
    confidence_feedback: str
    star_method_feedback: str
    technical_depth_feedback: str
    filler_words: list[Any]
    strengths: list[Any]
    weaknesses: list[Any]
    suggestions: list[Any]
    improved_answer: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionDetail(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    question_id: uuid.UUID
    status: str
    notes: str | None
    created_at: datetime
    question: QuestionResponse | None = None
    recording: RecordingInfo | None = None
    transcript: TranscriptInfo | None = None
    analysis: AnalysisResponse | None = None

    model_config = {"from_attributes": True}


class SessionList(BaseModel):
    items: list[SessionSummary]
    total: int
    limit: int
    offset: int


# ── Analytics ─────────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    total_sessions: int
    completed_sessions: int
    avg_overall_score: float | None
    avg_clarity_score: float | None
    avg_completeness_score: float | None
    avg_communication_score: float | None
    avg_confidence_score: float | None


class ProgressPoint(BaseModel):
    date: str
    score: float
    session_id: uuid.UUID


class WeaknessCount(BaseModel):
    weakness: str
    count: int


class FillerWordTotal(BaseModel):
    word: str
    total_count: int
