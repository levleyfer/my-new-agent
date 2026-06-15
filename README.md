<div align="center">

# AI Interview Assistant

**Practice interviews with real-time AI feedback powered by Claude and Whisper**

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Features](#features) · [Tech Stack](#tech-stack) · [Screenshots](#screenshots) · [Quick Start](#quick-start) · [API Docs](#api-documentation)

</div>

---

## Overview

AI Interview Assistant is a full-stack web application that helps job seekers sharpen their interview skills through AI-powered analysis. Users record audio answers to curated interview questions, receive instant transcription via a local Whisper model, and get structured feedback from Anthropic Claude across seven performance dimensions — all without sending audio to third-party services.

The platform tracks progress over time, surfaces recurring weaknesses, and generates an improved version of each answer so users can learn by example.

---

## Features

### Core Workflow
- **Audio Recording** — in-browser recording with real-time duration tracking and 25 MB upload limit
- **Local Transcription** — speech-to-text via faster-whisper (runs on-device, no API key required)
- **AI Feedback** — structured analysis from Claude across 7 dimensions with actionable suggestions
- **Improved Answer** — Claude rewrites the user's response to show a model answer (150–300 words)

### Analytics & Progress
- **Dashboard** — aggregate stats: sessions completed, average score, top category
- **Progress Chart** — score trends over 30-day rolling window
- **Weakness Tracker** — ranks recurring weaknesses across all sessions
- **Filler Word Analysis** — detects "um", "like", "you know" and tracks frequency
- **Category Breakdown** — performance split by Behavioral / Technical / Situational

### Question Bank
- **32 pre-seeded questions** across 3 categories and 3 difficulty levels
- Filter by category, difficulty, or fetch a random question
- Each question includes follow-up prompts (stored as JSONB)

### Platform
- **JWT Authentication** — access + refresh token flow with bcrypt password hashing
- **Dark Mode** — Tailwind-based theme toggle with persistence
- **Bilingual UI** — English and Hebrew with full RTL layout support
- **Docker Compose** — one-command deployment of all services

### Scoring Dimensions
| Dimension | What it measures |
|-----------|-----------------|
| Overall | Composite score (0–100) |
| Clarity | How clear and organized the answer is |
| Completeness | Whether the question is fully addressed |
| Communication | Vocabulary, fluency, and sentence structure |
| Confidence | Tone, pacing, and assertiveness |
| STAR Method | Situation → Task → Action → Result structure |
| Technical Depth | Domain knowledge and precision (for technical questions) |

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | FastAPI 0.115 (async) |
| Language | Python 3.12 |
| Database | PostgreSQL 16 + asyncpg |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt via passlib |
| Transcription | faster-whisper 1.2.1 (local) |
| AI Analysis | Anthropic Claude (claude-sonnet-4-6) |
| Rate Limiting | slowapi |
| Validation | Pydantic v2 + pydantic-settings |
| Server | Uvicorn |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + React Router 6 |
| Language | TypeScript 5.7 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| State | Zustand 5 (persistent) |
| Data Fetching | TanStack React Query 5 + Axios |
| Icons | Lucide React |
| PDF Export | jsPDF + html2canvas |
| i18n | Custom (EN/HE, RTL support) |

### Infrastructure
| Layer | Technology |
|-------|-----------|
| Containerization | Docker + Docker Compose |
| Frontend Server | Nginx (Alpine) + SPA routing |
| Database | PostgreSQL 16 (Alpine) |

---

## Screenshots

> Add screenshots by placing images in `assets/screenshots/` and updating the paths below.

| Dashboard | Practice Session |
|-----------|-----------------|
| ![Dashboard](assets/screenshots/dashboard.png) | ![Practice](assets/screenshots/practice.png) |

| Analysis Results | Analytics Page |
|-----------------|---------------|
| ![Analysis](assets/screenshots/analysis.png) | ![Analytics](assets/screenshots/analytics.png) |

---

## Quick Start

### Option 1 — Docker Compose (Recommended)

Requires [Docker Desktop](https://docs.docker.com/get-docker/) installed and running.

```bash
# 1. Clone the repository
git clone https://github.com/levleyfer/my-new-agent.git
cd my-new-agent/ai-interview-assistant

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# 3. Start all services
docker compose up --build
```

The app will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs

---

### Option 2 — Local Development

#### Prerequisites
- Python 3.12
- Node.js 20+
- PostgreSQL 16 running locally

#### Backend

```bash
cd ai-interview-assistant/backend

# Create and activate virtual environment
python -m venv .venv
# Windows
.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables below)
cp ../.env.example .env

# Run database migrations
alembic upgrade head

# Seed the question bank
python seed.py

# Start the development server
uvicorn main:app --reload
```

#### Frontend

```bash
cd ai-interview-assistant/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at http://localhost:5173 and proxies API calls to http://localhost:8000.

---

## Environment Variables

Create `ai-interview-assistant/backend/.env` (or set these in Docker Compose):

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Async PostgreSQL connection string | `postgresql+asyncpg://user:pass@localhost:5432/interview_assistant` |
| `SECRET_KEY` | Yes | JWT signing secret — use a random 32+ char string | `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude analysis | `sk-ant-...` |
| `OPENAI_API_KEY` | No | OpenAI API key (reserved for future use) | `sk-...` |

> **Never commit your `.env` file.** It is listed in `.gitignore`.

Get your Anthropic API key at [console.anthropic.com](https://console.anthropic.com).

---

## API Documentation

FastAPI generates interactive API docs automatically.

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Endpoint Summary

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive tokens |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/auth/me` | Get current user info |
| `GET` | `/api/questions` | List questions (filter by category/difficulty) |
| `GET` | `/api/questions/random` | Fetch a random question |
| `POST` | `/api/sessions` | Create a new practice session |
| `GET` | `/api/sessions` | List user's past sessions |
| `GET` | `/api/sessions/{id}` | Get session with full analysis |
| `POST` | `/api/sessions/{id}/recording` | Upload audio and trigger processing |
| `GET` | `/api/sessions/{id}/recording/status` | Poll processing status |
| `GET` | `/api/analytics/summary` | Aggregate performance stats |
| `GET` | `/api/analytics/progress` | 30-day score progression |
| `GET` | `/api/analytics/weaknesses` | Top recurring weaknesses |
| `GET` | `/api/analytics/filler-words` | Filler word frequency totals |

---

## Project Structure

```
my-new-agent/
├── ai-interview-assistant/
│   ├── backend/
│   │   ├── main.py          # FastAPI app, all routes, background pipeline
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── services.py      # Whisper transcription + Claude analysis
│   │   ├── auth.py          # JWT creation and validation
│   │   ├── database.py      # Async DB engine and session factory
│   │   ├── config.py        # Environment-based configuration
│   │   ├── seed.py          # 32 pre-seeded interview questions
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── pages/       # LoginPage, Dashboard, Practice, History, Analytics
│   │   │   ├── App.tsx      # Route configuration
│   │   │   ├── api.ts       # Axios client with auto token refresh
│   │   │   ├── store.ts     # Zustand auth store (persistent)
│   │   │   └── i18n.ts      # EN/HE translations
│   │   ├── package.json
│   │   ├── nginx.conf
│   │   └── Dockerfile
│   └── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                           │
│              React 18 + TypeScript + Vite               │
│         Zustand · React Query · Tailwind CSS            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (Nginx proxy)
┌────────────────────────▼────────────────────────────────┐
│                   FastAPI Backend                        │
│              Python 3.12 · Uvicorn · JWT                │
│                                                         │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │   REST API   │  │  Whisper    │  │ Claude Sonnet │  │
│  │  (20 routes) │  │ (local STT) │  │  (AI scoring) │  │
│  └──────────────┘  └─────────────┘  └───────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ asyncpg
┌────────────────────────▼────────────────────────────────┐
│                   PostgreSQL 16                          │
│   users · questions · sessions · recordings             │
│   transcripts · analyses                                │
└─────────────────────────────────────────────────────────┘
```

---

## Processing Pipeline

When a user uploads a recording, the backend runs this async pipeline:

```
Audio Upload
    │
    ▼
faster-whisper (local)
    │  transcript text
    ▼
Claude Sonnet (Anthropic API)
    │  structured JSON: scores, feedback, suggestions, improved answer
    ▼
PostgreSQL — Analysis record saved
    │
    ▼
Session status → "completed"
```

---

## License

MIT © [Lev Leyfer](https://github.com/levleyfer)
