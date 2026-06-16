import os
import uuid
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import auth as auth_utils
import services
from config import settings
from database import get_db, engine, Base
from models import User, Question, Session, Recording, Transcript, Analysis
from schemas import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse,
    QuestionResponse, QuestionList,
    CreateSessionRequest, SessionDetail, SessionList, SessionSummary, AnalysisResponse,
    AnalyticsSummary, ProgressPoint, WeaknessCount, FillerWordTotal,
)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="AI Interview Assistant", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception:
        return {"status": "ok", "db": "error"}


# ── Auth helpers ──────────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = auth_utils.decode_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id), User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=auth_utils.hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@app.post("/api/auth/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user or not auth_utils.verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return TokenResponse(
        access_token=auth_utils.create_access_token(str(user.id)),
        refresh_token=auth_utils.create_refresh_token(str(user.id)),
    )


@app.post("/api/auth/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = auth_utils.decode_token(body.refresh_token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id), User.is_active == True))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=401, detail="User not found")

    return TokenResponse(
        access_token=auth_utils.create_access_token(user_id),
        refresh_token=auth_utils.create_refresh_token(user_id),
    )


@app.get("/api/auth/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Questions ─────────────────────────────────────────────────────────────────

@app.get("/api/questions", response_model=QuestionList)
async def list_questions(
    category: str | None = None,
    difficulty: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = select(Question).where(Question.is_active == True)
    count_query = select(func.count()).select_from(Question).where(Question.is_active == True)

    if category:
        query = query.where(Question.category == category)
        count_query = count_query.where(Question.category == category)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)
        count_query = count_query.where(Question.difficulty == difficulty)

    total = (await db.execute(count_query)).scalar()
    items = (await db.execute(query.offset(offset).limit(limit))).scalars().all()

    return QuestionList(items=list(items), total=total, limit=limit, offset=offset)


@app.get("/api/questions/random", response_model=QuestionResponse)
async def random_question(
    category: str | None = None,
    difficulty: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = select(Question).where(Question.is_active == True)
    if category:
        query = query.where(Question.category == category)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)
    query = query.order_by(func.random()).limit(1)

    result = await db.execute(query)
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="No questions found")
    return q


@app.get("/api/questions/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


# ── Sessions ──────────────────────────────────────────────────────────────────

@app.post("/api/sessions", response_model=SessionDetail, status_code=201)
async def create_session(
    body: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (await db.execute(select(Question).where(Question.id == body.question_id))).scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    session = Session(user_id=current_user.id, question_id=body.question_id, notes=body.notes)
    db.add(session)
    await db.commit()

    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.question),
            selectinload(Session.recording),
            selectinload(Session.transcript),
            selectinload(Session.analysis),
        )
        .where(Session.id == session.id)
    )
    return result.scalar_one()


@app.get("/api/sessions", response_model=SessionList)
async def list_sessions(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = (await db.execute(
        select(func.count()).select_from(Session).where(Session.user_id == current_user.id)
    )).scalar()

    rows = (await db.execute(
        select(Session)
        .options(selectinload(Session.question), selectinload(Session.analysis))
        .where(Session.user_id == current_user.id)
        .order_by(Session.created_at.desc())
        .offset(offset).limit(limit)
    )).scalars().all()

    items = []
    for s in rows:
        items.append(SessionSummary(
            id=s.id,
            question_id=s.question_id,
            status=s.status,
            created_at=s.created_at,
            overall_score=s.analysis.overall_score if s.analysis else None,
            question_text=s.question.text if s.question else None,
            question_category=s.question.category if s.question else None,
        ))

    return SessionList(items=items, total=count, limit=limit, offset=offset)


@app.get("/api/sessions/{session_id}", response_model=SessionDetail)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.question),
            selectinload(Session.recording),
            selectinload(Session.transcript),
            selectinload(Session.analysis),
        )
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return session


@app.delete("/api/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.recording),
            selectinload(Session.transcript),
            selectinload(Session.analysis),
        )
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Clean up audio file from disk
    if session.recording and session.recording.storage_path:
        audio_path = Path(session.recording.storage_path)
        if audio_path.exists():
            audio_path.unlink(missing_ok=True)

    if session.analysis:
        await db.delete(session.analysis)
    if session.transcript:
        await db.delete(session.transcript)
    if session.recording:
        await db.delete(session.recording)
    await db.delete(session)
    await db.commit()


# ── Recording upload + async pipeline ─────────────────────────────────────────

async def _run_pipeline(session_id: uuid.UUID, file_path: Path, duration: float):
    """Background task: transcribe → analyze → update session status."""
    from database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(Session)
                .options(selectinload(Session.question))
                .where(Session.id == session_id)
            )
            session = result.scalar_one()

            # 1. Transcribe
            whisper_result = await services.transcribe_audio(file_path)
            text = whisper_result["text"]
            word_count = len(text.split())

            transcript = Transcript(
                session_id=session_id,
                text=text,
                language=whisper_result.get("language", "en"),
                word_count=word_count,
            )
            db.add(transcript)
            await db.flush()

            # 2. Analyze
            analysis_data = await services.analyze_response(
                question_text=session.question.text,
                category=session.question.category,
                transcript=text,
                duration_seconds=duration,
            )

            analysis = Analysis(
                session_id=session_id,
                overall_score=analysis_data["overall_score"],
                clarity_score=analysis_data["clarity_score"],
                clarity_feedback=analysis_data["clarity_feedback"],
                completeness_score=analysis_data["completeness_score"],
                completeness_feedback=analysis_data["completeness_feedback"],
                communication_score=analysis_data["communication_score"],
                communication_feedback=analysis_data["communication_feedback"],
                confidence_score=analysis_data["confidence_score"],
                confidence_feedback=analysis_data["confidence_feedback"],
                star_method_score=analysis_data["star_method_score"],
                star_method_feedback=analysis_data["star_method_feedback"],
                technical_depth_score=analysis_data["technical_depth_score"],
                technical_depth_feedback=analysis_data["technical_depth_feedback"],
                filler_words=analysis_data["filler_words"],
                strengths=analysis_data["strengths"],
                weaknesses=analysis_data["weaknesses"],
                suggestions=analysis_data["suggestions"],
                improved_answer=analysis_data["improved_answer"],
            )
            db.add(analysis)

            session.status = "completed"
            await db.commit()

        except Exception as e:
            await db.rollback()
            async with AsyncSessionLocal() as err_db:
                res = await err_db.execute(select(Session).where(Session.id == session_id))
                s = res.scalar_one_or_none()
                if s:
                    s.status = "failed"
                    await err_db.commit()
            raise


@app.post("/api/sessions/{session_id}/recording", status_code=202)
async def upload_recording(
    session_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    duration_seconds: float = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    existing = await db.execute(select(Recording).where(Recording.session_id == session_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Recording already exists for this session")

    # Validate file size
    content = await audio.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_MB:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.MAX_UPLOAD_MB} MB)")

    # Save file
    upload_dir = Path(settings.UPLOAD_DIR) / str(current_user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(audio.filename).suffix if audio.filename else ".webm"
    file_path = upload_dir / f"{session_id}{ext}"
    file_path.write_bytes(content)

    recording = Recording(
        session_id=session_id,
        storage_path=str(file_path),
        mime_type=audio.content_type or "audio/webm",
        file_size_bytes=len(content),
        duration_seconds=duration_seconds,
    )
    db.add(recording)
    session.status = "processing"
    await db.commit()

    background_tasks.add_task(_run_pipeline, session_id, file_path, duration_seconds)

    return {"session_id": str(session_id), "status": "processing"}


@app.get("/api/sessions/{session_id}/audio")
async def get_session_audio(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.recording))
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not session.recording or not session.recording.storage_path:
        raise HTTPException(status_code=404, detail="No recording found")
    audio_path = Path(session.recording.storage_path)
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found on disk")
    return FileResponse(str(audio_path), media_type=session.recording.mime_type or "audio/webm")


@app.get("/api/sessions/{session_id}/recording/status")
async def recording_status(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"session_id": str(session_id), "status": session.status}


# ── Analytics ─────────────────────────────────────────────────────────────────

@app.get("/api/analytics/summary", response_model=AnalyticsSummary)
async def analytics_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_ids_q = select(Session.id).where(Session.user_id == current_user.id)

    total = (await db.execute(
        select(func.count()).select_from(Session).where(Session.user_id == current_user.id)
    )).scalar()

    completed = (await db.execute(
        select(func.count()).select_from(Session).where(
            Session.user_id == current_user.id, Session.status == "completed"
        )
    )).scalar()

    agg = (await db.execute(
        select(
            func.avg(Analysis.overall_score),
            func.avg(Analysis.clarity_score),
            func.avg(Analysis.completeness_score),
            func.avg(Analysis.communication_score),
            func.avg(Analysis.confidence_score),
        ).where(Analysis.session_id.in_(session_ids_q))
    )).one()

    return AnalyticsSummary(
        total_sessions=total,
        completed_sessions=completed,
        avg_overall_score=round(float(agg[0]), 1) if agg[0] else None,
        avg_clarity_score=round(float(agg[1]), 1) if agg[1] else None,
        avg_completeness_score=round(float(agg[2]), 1) if agg[2] else None,
        avg_communication_score=round(float(agg[3]), 1) if agg[3] else None,
        avg_confidence_score=round(float(agg[4]), 1) if agg[4] else None,
    )


@app.get("/api/analytics/progress")
async def analytics_progress(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (await db.execute(
        select(Analysis.overall_score, Analysis.created_at, Analysis.session_id)
        .join(Session, Session.id == Analysis.session_id)
        .where(Session.user_id == current_user.id)
        .order_by(Analysis.created_at.asc())
    )).all()

    return {
        "data_points": [
            {"date": r[1].strftime("%Y-%m-%d"), "score": r[0], "session_id": str(r[2])}
            for r in rows
        ]
    }


@app.get("/api/analytics/weaknesses")
async def analytics_weaknesses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (await db.execute(
        text("""
            SELECT w.value AS weakness, COUNT(*) AS cnt
            FROM analyses a
            JOIN sessions s ON s.id = a.session_id
            CROSS JOIN LATERAL jsonb_array_elements_text(a.weaknesses) AS w(value)
            WHERE s.user_id = :user_id
            GROUP BY w.value
            ORDER BY cnt DESC
            LIMIT 20
        """),
        {"user_id": str(current_user.id)},
    )).all()

    return {"common_weaknesses": [{"weakness": r[0], "count": r[1]} for r in rows]}


@app.get("/api/analytics/category-breakdown")
async def analytics_category_breakdown(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (await db.execute(
        select(
            Question.category,
            func.avg(Analysis.overall_score).label("avg_score"),
            func.count(Analysis.id).label("count"),
        )
        .join(Session, Session.question_id == Question.id)
        .join(Analysis, Analysis.session_id == Session.id)
        .where(Session.user_id == current_user.id)
        .group_by(Question.category)
    )).all()
    return {
        "categories": [
            {"category": r[0], "avg_score": round(float(r[1]), 1), "count": r[2]}
            for r in rows
        ]
    }


@app.get("/api/analytics/filler-words")
async def analytics_filler_words(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (await db.execute(
        text("""
            SELECT fw->>'word' AS word, SUM((fw->>'count')::int) AS total_count
            FROM analyses a
            JOIN sessions s ON s.id = a.session_id
            CROSS JOIN LATERAL jsonb_array_elements(a.filler_words) AS fw
            WHERE s.user_id = :user_id
            GROUP BY fw->>'word'
            ORDER BY total_count DESC
        """),
        {"user_id": str(current_user.id)},
    )).all()

    return {"totals": [{"word": r[0], "total_count": int(r[1])} for r in rows]}
