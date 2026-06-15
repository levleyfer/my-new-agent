"""Run with: python seed.py"""
import asyncio
from database import AsyncSessionLocal, engine, Base
from models import Question

QUESTIONS = [
    # ── Behavioral ────────────────────────────────────────────────────────────
    {"category": "behavioral", "difficulty": "easy", "text": "Tell me about yourself and your background.", "tags": ["intro"]},
    {"category": "behavioral", "difficulty": "medium", "text": "Tell me about a time you had to deal with a difficult team member.", "tags": ["teamwork", "conflict"]},
    {"category": "behavioral", "difficulty": "medium", "text": "Describe a project where you had to meet a very tight deadline.", "tags": ["deadline", "pressure"]},
    {"category": "behavioral", "difficulty": "medium", "text": "Tell me about a time you failed and what you learned from it.", "tags": ["failure", "growth"]},
    {"category": "behavioral", "difficulty": "medium", "text": "Describe a situation where you had to lead a team without formal authority.", "tags": ["leadership"]},
    {"category": "behavioral", "difficulty": "hard", "text": "Tell me about the most complex technical problem you have solved.", "tags": ["problem-solving", "technical"]},
    {"category": "behavioral", "difficulty": "medium", "text": "Give an example of a time you had to quickly learn a new technology.", "tags": ["learning", "adaptability"]},
    {"category": "behavioral", "difficulty": "medium", "text": "Describe a time when you disagreed with your manager and how you handled it.", "tags": ["conflict", "communication"]},
    {"category": "behavioral", "difficulty": "hard", "text": "Tell me about a time you had to make a decision with incomplete information.", "tags": ["decision-making", "ambiguity"]},
    {"category": "behavioral", "difficulty": "medium", "text": "Describe a time you received critical feedback and how you responded.", "tags": ["feedback", "growth"]},
    {"category": "behavioral", "difficulty": "hard", "text": "Tell me about a project you are most proud of and your specific contributions.", "tags": ["achievement", "impact"]},

    # ── Technical ─────────────────────────────────────────────────────────────
    {"category": "technical", "difficulty": "easy", "text": "What is the difference between a stack and a queue?", "tags": ["data-structures"]},
    {"category": "technical", "difficulty": "medium", "text": "Explain how you would design a URL shortener service.", "tags": ["system-design", "scalability"]},
    {"category": "technical", "difficulty": "medium", "text": "What is the difference between SQL and NoSQL databases? When would you use each?", "tags": ["databases"]},
    {"category": "technical", "difficulty": "hard", "text": "How would you design a distributed cache for a high-traffic application?", "tags": ["system-design", "distributed-systems"]},
    {"category": "technical", "difficulty": "medium", "text": "Explain the concept of REST and what makes an API RESTful.", "tags": ["api", "web"]},
    {"category": "technical", "difficulty": "medium", "text": "What is Big O notation and why does it matter?", "tags": ["algorithms", "complexity"]},
    {"category": "technical", "difficulty": "hard", "text": "Walk me through how you would approach optimizing a slow database query.", "tags": ["databases", "performance"]},
    {"category": "technical", "difficulty": "medium", "text": "Explain the difference between concurrency and parallelism.", "tags": ["concurrency"]},
    {"category": "technical", "difficulty": "hard", "text": "How would you design a notification system that needs to support millions of users?", "tags": ["system-design", "scalability"]},
    {"category": "technical", "difficulty": "medium", "text": "What are common security vulnerabilities in web applications and how do you prevent them?", "tags": ["security"]},
    {"category": "technical", "difficulty": "hard", "text": "Describe how you would architect a microservices-based application.", "tags": ["architecture", "microservices"]},

    # ── Situational ────────────────────────────────────────────────────────────
    {"category": "situational", "difficulty": "medium", "text": "If you discovered a critical bug in production right before a major release, what would you do?", "tags": ["crisis", "decision-making"]},
    {"category": "situational", "difficulty": "medium", "text": "How would you handle a situation where your team is behind schedule on a key project?", "tags": ["project-management", "pressure"]},
    {"category": "situational", "difficulty": "hard", "text": "Imagine you are given a legacy codebase with no documentation. How would you approach understanding it?", "tags": ["legacy-code", "problem-solving"]},
    {"category": "situational", "difficulty": "medium", "text": "If two senior engineers disagree on the technical approach for a new feature, how would you resolve it?", "tags": ["conflict", "leadership"]},
    {"category": "situational", "difficulty": "medium", "text": "You are asked to estimate the time for a project with very unclear requirements. How do you handle this?", "tags": ["estimation", "ambiguity"]},
    {"category": "situational", "difficulty": "hard", "text": "A client is unhappy with the progress of a project and is threatening to cancel. What steps do you take?", "tags": ["client-management", "crisis"]},
    {"category": "situational", "difficulty": "medium", "text": "How would you prioritize tasks when everything seems equally urgent?", "tags": ["prioritization", "time-management"]},
    {"category": "situational", "difficulty": "medium", "text": "If you joined a new team and noticed they had poor coding practices, how would you address it?", "tags": ["culture", "improvement"]},
    {"category": "situational", "difficulty": "hard", "text": "Your manager assigns you a project you believe is technically unfeasible in the given timeframe. What do you do?", "tags": ["communication", "expectation-management"]},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        existing = (await db.execute(select(Question))).scalars().first()
        if existing:
            print("Questions already seeded. Skipping.")
            return

        for q in QUESTIONS:
            db.add(Question(
                category=q["category"],
                difficulty=q["difficulty"],
                text=q["text"],
                tags=q.get("tags", []),
                follow_ups=[],
            ))
        await db.commit()
        print(f"Seeded {len(QUESTIONS)} questions.")


if __name__ == "__main__":
    asyncio.run(seed())
