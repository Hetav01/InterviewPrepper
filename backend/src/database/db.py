# Helper functions for the database

from sqlalchemy.orm import Session
from . import models
from datetime import datetime, timedelta

# Challenge Quota Functions

def get_challenge_quota(db: Session, user_id: str, challenge_type: str):
    return db.query(models.ChallengeQuota).filter(
            models.ChallengeQuota.user_id == user_id, models.ChallengeQuota.challenge_type == challenge_type
        ).first()

def create_challenge_quota(db: Session, user_id: str, challenge_type: str):
    db_quota = models.ChallengeQuota(user_id = user_id, challenge_type = challenge_type)
    db.add(db_quota)
    db.commit()
    db.refresh(db_quota)
    return db_quota

def reset_quota_if_needed(db: Session, quota: models.ChallengeQuota):
    now = datetime.now()
    
    if now - quota.last_reset_date > timedelta(hours=24):
        quota.quota_remaining = 10
        quota.last_reset_date = now
        db.commit()
        db.refresh(quota)

    return quota


# Interview Challenge Functions

def create_interview_challenge(db: Session, difficulty: str, created_by: str, topic: str, title: str, options: str, correct_answer_id: int, explaination: str):
    db_interview_challenge = models.InterviewChallenge(
        difficulty=difficulty,
        created_by=created_by,
        topic=topic,  # User input: what they want to learn about
        title=title,  # AI-generated: the actual question text
        options=options,  # JSON string of answer choices
        correct_answer_id=correct_answer_id,  # Index of correct option
        explaination=explaination  # Explanation text (with typo to match frontend)
    )
    db.add(db_interview_challenge)
    db.commit()
    db.refresh(db_interview_challenge)
    return db_interview_challenge

# Scenario Challenge Functions

def create_scenario_challenge(db: Session, difficulty: str, created_by: str, topic: str, title: str, questions: str, correct_answer: str = None, explanation: str = None):
    db_scenario_challenge = models.ScenarioChallenge(
        difficulty=difficulty,
        created_by=created_by,
        topic=topic,  # User input: what they want to learn about
        title=title,  # AI-generated: the main scenario description
        questions=questions,  # JSON string of question objects
        correct_answer=correct_answer,  # Optional: ideal answer
        explanation=explanation  # Optional: rubric or feedback
    )
    db.add(db_scenario_challenge)
    db.commit()
    db.refresh(db_scenario_challenge)
    return db_scenario_challenge

# Get User Challenges Function

def get_user_challenges(db: Session, user_id: str, challenge_type: str):
    if challenge_type == "interview":
        return db.query(models.InterviewChallenge).filter(
            models.InterviewChallenge.created_by == user_id
        ).all()
    elif challenge_type == "scenario":
        return db.query(models.ScenarioChallenge).filter(
            models.ScenarioChallenge.created_by == user_id
        ).all()
    else:
        raise ValueError(f"Invalid challenge_type: {challenge_type}. Must be 'interview' or 'scenario'")