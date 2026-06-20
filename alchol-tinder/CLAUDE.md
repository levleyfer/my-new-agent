# Project Context

**Project:** Social drinking companion app (working name: TBD)

A location-aware mobile app that connects people who want company while drinking
— think "find someone to share a bottle / grab a drink with tonight." Matching is
based on **vibe and taste**, not on quantity consumed.

Core flows:
- Users create a profile and select **tags** (drink taste, vibe, logistics).
- The app matches nearby, currently-available users with compatible tags.
- Before meeting in person, matched users do a short **video call** ("virtual cheers")
  to confirm the person is real and there's a connection. Video is a safety feature,
  not just a chat feature.

The goal is to produce practical, production-ready results with minimal back-and-forth
while maintaining high code quality, accuracy, and — given the domain — strong safety
and compliance guarantees.

---

# Product Domain Model

## Tag Categories (these drive matching)

1. **Taste / Drink** — beer only, wine, whiskey, spirits, cocktails, gin & tonic,
   soft drinks welcome. (Inclusive: light/non-drinkers must feel they have a place.)
2. **Vibe** — good conversation, celebration mode, meet new people, looking for
   company at a bar, relaxed evening, social mood.
3. **Logistics** — nearby, available now, available tonight, prefer public place,
   virtual cheers first.

## Key Entities

- **User** — profile, verified age, verification status, rating, tags, location.
- **Match** — two users, compatibility score, status (pending / video / met / closed).
- **VideoSession** — WebRTC session tied to a match, used before any physical meetup.
- **Report / SafetyFlag** — user reports, blocks, moderation actions.

---

# Product & Safety Rules (NON-NEGOTIABLE)

These are domain rules, not suggestions. Generated code, copy, and features must respect them.

- **Responsible framing.** Match people around *company and taste*, never around
  *amount consumed*. No feature, tag, metric, or copy may encourage drinking more
  (no "quantity" tags, no "heavy drinker" matching, no leaderboards for consumption).
- **No emotional-drinking framing.** Do not pair "drinking" with emotional distress
  as a coping path. "Good conversation" / "relaxed evening" tags are fine; framing
  alcohol as a solution to a bad mood is not.
- **Age gate.** Hard requirement: 18+ (IL). Age verification before any matching.
  Treat age as a verified attribute, never self-declared-only for matching.
- **Identity & trust.** Support identity verification, user ratings, reporting,
  and blocking as first-class features — not afterthoughts.
- **Video before meeting.** The "virtual cheers" video call is a safety primitive.
  Surface "prefer public place" and "virtual cheers first" preferences prominently.
- **App store compliance.** Apple App Store & Google Play have specific rules for
  alcohol-related and dating-style apps. Verify positioning and metadata against
  current store guidelines before relying on any submission assumption.
- **Privacy by default.** Never expose precise location. Use coarse / fuzzed distance
  ("~2 km away"), never raw coordinates, on the client or in API responses.

---

# About Me

## Background

- Software Engineer
- Strong interest in AI, automation, data analysis, and software architecture
- Experience with React, React Native, Python, JavaScript, TypeScript, SQL, C, and machine learning
- Frequently works on university, research, and personal projects

## Preferences

- Prefer concise answers for simple questions
- Prefer detailed explanations for complex technical topics
- Show examples whenever possible
- Focus on practical implementation rather than theory
- Explain trade-offs when multiple solutions exist
- Avoid unnecessary complexity
- Suggest better alternatives when appropriate

---

# Tech Stack (assumed — adjust as needed)

- **Mobile client:** React Native (TypeScript)
- **Backend:** Python 3.12, FastAPI, async SQLAlchemy, Alembic
- **Database:** PostgreSQL + PostGIS (geo proximity queries)
- **Realtime:** WebSockets (matching/chat), WebRTC for video
- **Video:** managed WebRTC provider (LiveKit / Daily / Twilio) for MVP —
  do not build a custom media server early
- **Auth:** JWT; third-party KYC/age verification provider (e.g. Onfido/Veriff)
- **Infra:** containerized; secrets via environment, never committed

---

# Rules

## General

- Prioritize correctness over speed.
- Do not make assumptions when requirements are unclear.
- Ask clarifying questions only when necessary.
- Be direct and practical.
- Identify risks and edge cases.
- Think through problems before proposing solutions.

## Coding

- Write clean, maintainable, production-quality code.
- Follow language-specific best practices.
- Prefer readability over cleverness.
- Avoid code duplication.
- Keep functions focused and small.
- Use meaningful variable and function names.
- Add comments only where they improve understanding.
- Preserve existing architecture unless there is a strong reason to change it.
- When modifying code, explain what changed and why.

## Debugging

- Find root causes rather than patching symptoms.
- Explain likely causes in order of probability.
- Suggest verification steps before implementing fixes.
- Minimize changes required to solve the issue.

## Research

- Distinguish facts from assumptions.
- Cite sources whenever possible.
- Highlight uncertainty when information is incomplete.
- Summarize findings clearly.

## Security

- Never expose secrets, API keys, tokens, or credentials.
- Follow secure coding practices.
- Validate and sanitize all inputs, especially user-generated profile content.
- Consider security implications of recommendations.
- Treat location and identity data as sensitive PII; minimize, fuzz, and protect it.

---

# Development Standards

## Git

- Make small, focused commits.
- Write descriptive commit messages.
- Avoid unrelated changes in the same commit.

### Commit Format

```
feat: add tag-based matching engine
fix: resolve WebRTC reconnection issue
refactor: simplify proximity query
docs: update onboarding flow notes
test: add matching compatibility tests
```

---

## Testing

Whenever code is written:

1. Explain how to test it.
2. Identify edge cases.
3. Mention potential failure scenarios.
4. Include tests when appropriate.

Prefer:

- Unit Tests
- Integration Tests
- End-to-End Tests when relevant

Domain-specific cases to always consider:
- Under-18 / unverified user must never reach matching.
- Location fuzzing must hold (no raw coordinates leak via API or logs).
- Matching must never rank by consumption-related signals.

---

# Project Structure

```
/project
├── mobile/        → React Native app (client)
├── backend/       → FastAPI service (API, matching, auth)
│   ├── src/
│   ├── tests/
│   └── alembic/
├── docs/          → documentation
├── scripts/       → automation scripts
├── research/      → notes and findings
├── assets/        → images and static resources
├── config/        → configuration files
└── archive/       → completed or deprecated work
```

---

# Agent Workflow

For every task:

1. Understand the goal.
2. Identify constraints (including safety/compliance constraints above).
3. Create a plan.
4. Execute the plan.
5. Verify results.
6. Suggest improvements.

For large tasks:

- Break work into phases.
- Complete one phase at a time.
- Validate before moving forward.

---

# Output Style

Default response structure:

1. Summary
2. Solution
3. Code (if applicable)
4. Testing Steps
5. Risks / Notes

Use markdown formatting. Use code blocks for code. Use bullet points for lists.
Keep responses organized and easy to scan.

---

# Decision Making

When multiple solutions exist:

- Recommend the simplest solution that satisfies requirements.
- Explain trade-offs.
- Mention scalability concerns.
- Consider maintainability.
- Consider performance only when relevant.
- For any user-facing feature, check it against the Product & Safety Rules first.

---

# Backend Setup

## Prerequisites

- PostgreSQL (with PostGIS extension) installed and running
- Python 3.12
- Virtual environment at `backend/.venv`

## Database Setup

1. Create the database and enable PostGIS:

```sql
CREATE DATABASE social_drinks;
\c social_drinks
CREATE EXTENSION IF NOT EXISTS postgis;
```

2. Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/social_drinks
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
VERIFICATION_API_KEY=your-kyc-provider-key
VIDEO_PROVIDER_API_KEY=your-video-provider-key
```

Replace credentials with your own. Never commit `.env`.

## Running the Backend

```bash
# Activate the venv
source backend/.venv/bin/activate      # (Windows: backend\.venv\Scripts\Activate.ps1)

# Run migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload
```

---

# Quality Checklist

Before completing a task:

- Is the answer correct?
- Is the solution practical?
- Is the code clean?
- Are edge cases considered?
- Are risks explained?
- Is testing covered?
- **Does it comply with the Product & Safety Rules?**
- **Is age verification enforced where relevant?**
- **Is location data fuzzed and PII protected?**
- Is the response concise and useful?
