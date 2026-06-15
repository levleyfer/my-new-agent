import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import String, Boolean, DateTime, Text, Integer, Float, SmallInteger, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sessions: Mapped[list["Session"]] = relationship("Session", back_populates="user")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    text: Mapped[str] = mapped_column(Text, nullable=False)
    follow_ups: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    tags: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sessions: Mapped[list["Session"]] = relationship("Session", back_populates="question")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="sessions")
    question: Mapped["Question"] = relationship("Question", back_populates="sessions")
    recording: Mapped["Recording | None"] = relationship("Recording", back_populates="session", uselist=False)
    transcript: Mapped["Transcript | None"] = relationship("Transcript", back_populates="session", uselist=False)
    analysis: Mapped["Analysis | None"] = relationship("Analysis", back_populates="session", uselist=False)


class Recording(Base):
    __tablename__ = "recordings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False, default="audio/webm")
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["Session"] = relationship("Session", back_populates="recording")


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    word_count: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["Session"] = relationship("Session", back_populates="transcript")


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    overall_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    clarity_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    completeness_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    communication_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    confidence_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    star_method_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    technical_depth_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    clarity_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    completeness_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    communication_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    star_method_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    technical_depth_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    filler_words: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    strengths: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    weaknesses: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    suggestions: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    improved_answer: Mapped[str] = mapped_column(Text, nullable=False)
    claude_model: Mapped[str] = mapped_column(String(50), nullable=False, default="claude-sonnet-4-6")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["Session"] = relationship("Session", back_populates="analysis")
