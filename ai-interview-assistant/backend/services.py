"""Local Whisper transcription (faster-whisper) and Claude analysis services."""
import json
import re
import threading
from pathlib import Path

import anthropic
from faster_whisper import WhisperModel

from config import settings

# ── Whisper model (lazy, loaded once) ────────────────────────────────────────

_whisper_model: WhisperModel | None = None
_model_lock = threading.Lock()


def _get_whisper_model() -> WhisperModel:
    global _whisper_model
    if _whisper_model is None:
        with _model_lock:
            if _whisper_model is None:
                _whisper_model = WhisperModel(
                    settings.WHISPER_MODEL,
                    device="cpu",
                    compute_type="int8",
                )
    return _whisper_model


def _transcribe_sync(file_path: str) -> dict:
    model = _get_whisper_model()
    segments, info = model.transcribe(file_path, beam_size=5)
    text = " ".join(seg.text for seg in segments)
    return {
        "text": text.strip(),
        "language": info.language,
        "duration": info.duration,
    }


async def transcribe_audio(file_path: Path) -> dict:
    """Transcribe audio locally using faster-whisper (no API key required)."""
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _transcribe_sync, str(file_path))


# ── Claude analysis ───────────────────────────────────────────────────────────

ANALYSIS_SYSTEM_PROMPT = """You are an expert technical interview coach with 15 years of experience
evaluating software engineering candidates at top-tier companies.

Analyze the candidate's spoken interview response and return ONLY valid JSON — no markdown, no explanation.
Use this exact schema:

{
  "overall_score": <int 0-100>,
  "clarity_score": <int 0-100>,
  "clarity_feedback": "<string>",
  "completeness_score": <int 0-100>,
  "completeness_feedback": "<string>",
  "communication_score": <int 0-100>,
  "communication_feedback": "<string>",
  "confidence_score": <int 0-100>,
  "confidence_feedback": "<string>",
  "star_method_score": <int 0-100>,
  "star_method_feedback": "<string>",
  "technical_depth_score": <int 0-100>,
  "technical_depth_feedback": "<string>",
  "filler_words": [{"word": "<string>", "count": <int>}, ...],
  "strengths": ["<string>", ...],
  "weaknesses": ["<string>", ...],
  "suggestions": ["<string>", ...],
  "improved_answer": "<rewritten answer, 150-300 words>"
}

Scoring rubric (0-100):
- 90-100: Exceptional — would impress at FAANG-level
- 75-89: Strong — above average
- 60-74: Adequate — has clear gaps
- 40-59: Below average — needs significant work
- 0-39: Insufficient response

For behavioral/situational questions, score star_method_score on Situation/Task/Action/Result structure.
For technical questions, score it on problem-solving structure and clarity of reasoning."""

ANALYSIS_USER_TEMPLATE = """Question category: {category}
Question: {question}

Candidate transcript:
---
{transcript}
---

Word count: {word_count}
Duration: {duration:.0f} seconds
Speaking pace: {wpm:.0f} words per minute

Analyze this response and return JSON."""


async def analyze_response(
    question_text: str,
    category: str,
    transcript: str,
    duration_seconds: float,
) -> dict:
    """Call Claude to analyze an interview response and return structured feedback."""
    word_count = len(transcript.split())
    wpm = word_count / (duration_seconds / 60) if duration_seconds > 0 else 0

    user_content = ANALYSIS_USER_TEMPLATE.format(
        category=category,
        question=question_text,
        transcript=transcript,
        word_count=word_count,
        duration=duration_seconds,
        wpm=wpm,
    )

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=ANALYSIS_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    raw = message.content[0].text
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    raw = re.sub(r"\s*```$", "", raw)

    data = json.loads(raw)

    required_keys = {
        "overall_score", "clarity_score", "clarity_feedback",
        "completeness_score", "completeness_feedback",
        "communication_score", "communication_feedback",
        "confidence_score", "confidence_feedback",
        "star_method_score", "star_method_feedback",
        "technical_depth_score", "technical_depth_feedback",
        "filler_words", "strengths", "weaknesses", "suggestions", "improved_answer",
    }
    missing = required_keys - data.keys()
    if missing:
        raise ValueError(f"Claude response missing keys: {missing}")

    return data
