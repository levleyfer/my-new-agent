# Project Context

This workspace is primarily used for software engineering, AI development, research, automation, and productivity workflows.

The goal is to produce practical, production-ready results with minimal back-and-forth while maintaining high code quality and accuracy.

---

# About Me

## Background

- Software Engineer
- Strong interest in AI, automation, data analysis, and software architecture
- Experience with React, Python, JavaScript, TypeScript, SQL, c, and machine learning
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
- Validate inputs when relevant.
- Consider security implications of recommendations.

---

# Development Standards

## Git

- Make small, focused commits.
- Write descriptive commit messages.
- Avoid unrelated changes in the same commit.

### Commit Format

feat: add user authentication

fix: resolve API timeout issue

refactor: simplify validation logic

docs: update installation guide

test: add integration tests

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

---

# Project Structure

/project
├── src/
├── tests/
├── docs/
├── scripts/
├── research/
├── assets/
├── config/
└── archive/

### Folder Purposes

- src → application source code
- tests → automated tests
- docs → documentation
- scripts → automation scripts
- research → notes and findings
- assets → images and static resources
- config → configuration files
- archive → completed or deprecated work

---

# Agent Workflow

For every task:

1. Understand the goal.
2. Identify constraints.
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

Use markdown formatting.

Use code blocks for code.

Use bullet points for lists.

Keep responses organized and easy to scan.

---

# Decision Making

When multiple solutions exist:

- Recommend the simplest solution that satisfies requirements.
- Explain trade-offs.
- Mention scalability concerns.
- Consider maintainability.
- Consider performance only when relevant.

---

# AI Interview Assistant — Backend Setup

## Prerequisites

- PostgreSQL installed and running
- Python 3.12
- Virtual environment at `ai-interview-assistant/backend/.venv`

## PostgreSQL Setup

1. Create a database:

```sql
CREATE DATABASE interview_assistant;
```

2. Create a `.env` file in `ai-interview-assistant/backend/`:

```env
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/interview_assistant
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

Replace `username` and `password` with your PostgreSQL credentials.

## Running the Backend

```powershell
# Activate the venv
& "ai-interview-assistant\backend\.venv\Scripts\Activate.ps1"

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
- Is the response concise and useful?
