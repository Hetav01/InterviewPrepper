# Database Helper Functions
# 
# This module provides all database operations for the InterviewPrepper application.
# Functions handle challenge creation, quota management, and scenario answer processing.
# All functions include comprehensive error handling and input validation.

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from . import models
from datetime import datetime, timedelta, time as dt_time
import logging

# Set up logging for database operations
logger = logging.getLogger(__name__)

# ========================================================================================
# CHALLENGE QUOTA FUNCTIONS
# ========================================================================================

def get_challenge_quota(db: Session, user_id: str, challenge_type: str):
    """
    Retrieve user's quota for a specific challenge type.
    
    Args:
        db: Database session
        user_id: User identifier from authentication
        challenge_type: "interview" or "scenario"
    
    Returns:
        ChallengeQuota object or None if not found
    
    Raises:
        ValueError: Invalid input parameters
        RuntimeError: Database operation failed
    """
    # INPUT VALIDATION
    if not user_id or not user_id.strip():
        raise ValueError("user_id cannot be empty")
    
    if challenge_type not in ["interview", "scenario"]:
        raise ValueError(f"Invalid challenge_type '{challenge_type}'. Must be 'interview' or 'scenario'")
    
    try:
        return db.query(models.ChallengeQuota).filter(
                models.ChallengeQuota.user_id == user_id, 
                models.ChallengeQuota.challenge_type == challenge_type
            ).first()
    except SQLAlchemyError as e:
        logger.error(f"Failed to get challenge quota for user {user_id}: {str(e)}")
        raise RuntimeError(f"Database error while getting challenge quota: {str(e)}")

def create_challenge_quota(db: Session, user_id: str, challenge_type: str):
    """
    Create a new quota record for a user and challenge type.
    
    Args:
        db: Database session
        user_id: User identifier from authentication
        challenge_type: "interview" or "scenario"
    
    Returns:
        Created ChallengeQuota object
    
    Raises:
        ValueError: Invalid input parameters
        RuntimeError: Database operation failed
    """
    # INPUT VALIDATION: Ensure data integrity
    if challenge_type not in ["interview", "scenario"]:
        raise ValueError(f"Invalid challenge_type '{challenge_type}'. Must be 'interview' or 'scenario'")
    
    if not user_id or not user_id.strip():
        raise ValueError("user_id cannot be empty")
    
    try:
        # Create new quota with default values (10 daily quota)
        db_quota = models.ChallengeQuota(user_id=user_id, challenge_type=challenge_type)
        db.add(db_quota)
        db.commit()
        db.refresh(db_quota)
        logger.info(f"Created challenge quota for user {user_id}, type {challenge_type}")
        return db_quota
    except SQLAlchemyError as e:
        db.rollback()  # Rollback on error to maintain consistency
        logger.error(f"Failed to create challenge quota for user {user_id}: {str(e)}")
        raise RuntimeError(f"Database error while creating challenge quota: {str(e)}")

def reset_quota_if_needed(db: Session, quota: models.ChallengeQuota):
    """
    Reset quota to full (10) at midnight (12:00:00am) every day, regardless of last usage.
    """
    if not quota:
        raise ValueError("quota cannot be None")
    now = datetime.now()
    today_midnight = datetime.combine(now.date(), dt_time.min)
    if quota.last_reset_date < today_midnight:
        try:
            quota.quota_remaining = 10
            quota.last_reset_date = today_midnight
            db.commit()
            db.refresh(quota)
            logger.info(f"Midnight quota reset for user {quota.user_id}, type {quota.challenge_type}")
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to reset quota for user {quota.user_id}: {str(e)}")
            raise RuntimeError(f"Database error while resetting quota: {str(e)}")
    return quota

# ADMIN/MAINTENANCE: Force reset all quotas to 10 immediately

def force_reset_all_quotas(db: Session):
    try:
        all_quotas = db.query(models.ChallengeQuota).all()
        for quota in all_quotas:
            quota.quota_remaining = 10
            quota.last_reset_date = datetime.combine(datetime.now().date(), dt_time.min)
        db.commit()
        logger.info("Force reset all quotas to 10 for all users and types.")
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Failed to force reset all quotas: {str(e)}")
        raise RuntimeError(f"Database error while force resetting all quotas: {str(e)}")

# ========================================================================================
# INTERVIEW CHALLENGE FUNCTIONS
# ========================================================================================

def create_interview_challenge(
    db: Session, 
    difficulty: str, 
    created_by: str, 
    topic: str, 
    title: str, 
    options: str, 
    correct_answer_id: int, 
    explaination: str
):
    """
    Create a new interview (MCQ) challenge in the database.
    
    Args:
        db: Database session
        difficulty: "Easy", "Medium", or "Hard"
        created_by: User ID who created this challenge
        topic: Subject matter (user input)
        title: Question text (AI generated)
        options: JSON string of answer choices (AI generated)
        correct_answer_id: Index of correct option 0-3 (AI generated)
        explaination: Explanation text (AI generated, typo preserved)
    
    Returns:
        Created InterviewChallenge object
    
    Raises:
        ValueError: Invalid input parameters
        RuntimeError: Database operation failed
    """
    # INPUT VALIDATION: Ensure data integrity
    if difficulty not in ["Easy", "Medium", "Hard"]:
        raise ValueError(f"Invalid difficulty '{difficulty}'. Must be 'Easy', 'Medium', or 'Hard'")
    
    if not 0 <= correct_answer_id <= 3:
        raise ValueError(f"Invalid correct_answer_id '{correct_answer_id}'. Must be 0, 1, 2, or 3 (for A/B/C/D options)")
    
    if not created_by or not created_by.strip():
        raise ValueError("created_by cannot be empty")
    
    try:
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
        logger.info(f"Created interview challenge for user {created_by}, topic: {topic}")
        return db_interview_challenge
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Failed to create interview challenge for user {created_by}: {str(e)}")
        raise RuntimeError(f"Database error while creating interview challenge: {str(e)}")

# ========================================================================================
# SCENARIO CHALLENGE FUNCTIONS
# ========================================================================================

def create_scenario_challenge(
    db: Session, 
    difficulty: str, 
    created_by: str, 
    topic: str, 
    title: str, 
    questions: str, 
    correct_answer: str = None, 
    explanation: str = None
):
    """
    Create a new scenario (open-ended) challenge in the database.
    
    Args:
        db: Database session
        difficulty: "Easy", "Medium", or "Hard"
        created_by: User ID who created this challenge
        topic: Subject matter (user input)
        title: Scenario description (AI generated)
        questions: JSON string of question objects (AI generated)
        correct_answer: Optional ideal answer template (AI generated)
        explanation: Optional rubric or feedback guidelines (AI generated)
    
    Returns:
        Created ScenarioChallenge object
    
    Raises:
        ValueError: Invalid input parameters
        RuntimeError: Database operation failed
    """
    # INPUT VALIDATION: Ensure data integrity
    if difficulty not in ["Easy", "Medium", "Hard"]:
        raise ValueError(f"Invalid difficulty '{difficulty}'. Must be 'Easy', 'Medium', or 'Hard'")
    
    if not created_by or not created_by.strip():
        raise ValueError("created_by cannot be empty")
    
    try:
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
        logger.info(f"Created scenario challenge for user {created_by}, topic: {topic}")
        return db_scenario_challenge
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Failed to create scenario challenge for user {created_by}: {str(e)}")
        raise RuntimeError(f"Database error while creating scenario challenge: {str(e)}")

# ========================================================================================
# SCENARIO ANSWER FUNCTIONS
# ========================================================================================

def save_scenario_answer(
    db: Session, 
    user_id: str, 
    scenario_id: int, 
    question_index: int, 
    user_answer: str
):
    """
    Save a user's answer to a scenario question.
    
    Args:
        db: Database session
        user_id: User identifier from authentication
        scenario_id: ID of the scenario being answered
        question_index: 0-based index of the question being answered
        user_answer: User's text response
    
    Returns:
        Created ScenarioAnswer object
    
    Raises:
        ValueError: Invalid input parameters
        RuntimeError: Database operation failed
    """
    # INPUT VALIDATION
    if not user_id or not user_id.strip():
        raise ValueError("user_id cannot be empty")
    
    if not user_answer or not user_answer.strip():
        raise ValueError("user_answer cannot be empty")
    
    if question_index < 0:
        raise ValueError(f"Invalid question_index '{question_index}'. Must be 0 or greater")
    
    try:
        answer = models.ScenarioAnswer(
            user_id=user_id,
            scenario_id=scenario_id,
            question_index=question_index,
            user_answer=user_answer
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
        logger.info(f"Saved scenario answer for user {user_id}, scenario {scenario_id}, question {question_index}")
        return answer
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Failed to save scenario answer for user {user_id}: {str(e)}")
        raise RuntimeError(f"Database error while saving scenario answer: {str(e)}")

def update_scenario_evaluation(
    db: Session, 
    answer_id: int, 
    llm_score: int, 
    llm_feedback: str, 
    llm_correct_answer: str
):
    """
    Update a scenario answer with AI evaluation results.
    
    Args:
        db: Database session
        answer_id: ID of the ScenarioAnswer to update
        llm_score: Numeric score from AI evaluation
        llm_feedback: Feedback text from AI evaluation
        llm_correct_answer: Correct answer from AI evaluation
    
    Returns:
        Updated ScenarioAnswer object
    
    Raises:
        ValueError: Answer not found
        RuntimeError: Database operation failed
    """
    # Check if answer exists before accessing properties
    answer = db.query(models.ScenarioAnswer).filter(models.ScenarioAnswer.id == answer_id).first()
    if not answer:
        raise ValueError(f"ScenarioAnswer with id {answer_id} not found")
    
    try:
        # Update evaluation fields
        answer.llm_score = llm_score
        answer.llm_feedback = llm_feedback
        answer.llm_correct_answer = llm_correct_answer
        db.commit()
        db.refresh(answer)
        logger.info(f"Updated evaluation for answer {answer_id} with score {llm_score}")
        return answer
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Failed to update evaluation for answer {answer_id}: {str(e)}")
        raise RuntimeError(f"Database error while updating scenario evaluation: {str(e)}")

# ========================================================================================
# CHALLENGE RETRIEVAL FUNCTIONS
# ========================================================================================

def get_user_challenges(db: Session, user_id: str, challenge_type: str):
    """
    Retrieve all challenges created by a specific user for a specific type.
    
    Args:
        db: Database session
        user_id: User identifier from authentication
        challenge_type: "interview" or "scenario"
    
    Returns:
        List of challenge objects (InterviewChallenge or ScenarioChallenge)
    
    Raises:
        ValueError: Invalid input parameters
        RuntimeError: Database operation failed
    """
    # INPUT VALIDATION
    if not user_id or not user_id.strip():
        raise ValueError("user_id cannot be empty")
    
    if challenge_type not in ["interview", "scenario"]:
        raise ValueError(f"Invalid challenge_type: {challenge_type}. Must be 'interview' or 'scenario'")
    
    try:
        if challenge_type == "interview":
            challenges = db.query(models.InterviewChallenge).filter(
                models.InterviewChallenge.created_by == user_id
            ).all()
        else:  # challenge_type == "scenario"
            challenges = db.query(models.ScenarioChallenge).filter(
                models.ScenarioChallenge.created_by == user_id
            ).all()
        
        logger.info(f"Retrieved {len(challenges)} {challenge_type} challenges for user {user_id}")
        return challenges
    except SQLAlchemyError as e:
        logger.error(f"Failed to get user challenges for user {user_id}: {str(e)}")
        raise RuntimeError(f"Database error while getting user challenges: {str(e)}")