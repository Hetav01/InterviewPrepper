# Challenge API Routes - Frontend Integration Guide
# 
# BASE URL: http://localhost:8000
# Authentication: All endpoints require user auth headers
# 
# ENDPOINTS OVERVIEW:
# POST /challenges/interview   - Generate MCQ challenges (max 7 questions)
# POST /challenges/scenario    - Generate scenario challenges (max 3 questions)  
# GET  /challenges/history     - Get user's challenge history
# POST /quotas/initialize      - Initialize user quotas (call first)
# GET  /quotas/{type}          - Get specific quota info
# GET  /quotas                 - Get all quota info
# POST /scenario-answers       - Submit & evaluate scenario answers

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from ..database.db import (
    get_user_challenges,
    create_challenge_quota,
    create_interview_challenge,
    create_scenario_challenge,
    reset_quota_if_needed,
    get_challenge_quota,
    save_scenario_answer,
    update_scenario_evaluation
)
from ..agents.ai_generator_agentic import (
    generate_interview_challenges,
    generate_scenario_challenge,
    evaluate_scenario_answer
)
from ..utils import authenticate_and_get_user_details
from ..database.models import get_db, ScenarioChallenge
import json
from datetime import datetime

router = APIRouter()

# ========================================================================================
# REQUEST/RESPONSE MODELS
# ========================================================================================

class ChallengeRequest(BaseModel):
    """
    Frontend Request Model for Challenge Generation
    
    USAGE:
    {
      "difficulty": "Easy" | "Medium" | "Hard",
      "topic": "string (min 2 chars)",
      "num_questions": 1-7 for interview, 1-3 for scenario
    }
    """
    difficulty: str
    topic: str
    num_questions: int = 5  # Default to 5 questions
    
    @validator('difficulty')
    def validate_difficulty(cls, v):
        if v not in ['Easy', 'Medium', 'Hard']:
            raise ValueError('difficulty must be "Easy", "Medium", or "Hard"')
        return v
    
    @validator('num_questions')
    def validate_num_questions(cls, v):
        if v < 1:
            raise ValueError('num_questions must be at least 1')
        return v
    
    @validator('topic')
    def validate_topic(cls, v):
        if not v or not v.strip():
            raise ValueError('topic cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('topic must be at least 2 characters long')
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "difficulty": "Medium",
                "topic": "Neural Networks", 
                "num_questions": 3
            }
        }

class ScenarioAnswerRequest(BaseModel):
    """
    Frontend Request Model for Scenario Answer Submission
    
    USAGE:
    {
      "scenario_id": number,
      "question_index": number (0-based index),
      "user_answer": "string"
    }
    """
    scenario_id: int
    question_index: int  # Which question in the scenario (0-based)
    user_answer: str

# ========================================================================================
# HELPER FUNCTIONS
# ========================================================================================

def _ensure_quota_exists_and_reset(db: Session, user_id: str, challenge_type: str):
    """
    Internal helper: Ensure quota exists and reset if needed.
    Frontend should use POST /quotas/initialize instead.
    """
    quota = get_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
    if not quota:
        quota = create_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
    quota = reset_quota_if_needed(db, quota)
    return quota

def _validate_challenge_type_limits(challenge_type: str, num_questions: int):
    """
    Internal helper: Validate question limits.
    Frontend should enforce these limits in UI.
    """
    if challenge_type == 'scenario' and num_questions > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Scenario challenges can have maximum 3 questions'
        )
    if challenge_type == 'interview' and num_questions > 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Interview challenges can have maximum 7 questions'
        )

# ========================================================================================
# CHALLENGE GENERATION ENDPOINTS
# ========================================================================================

@router.post("/challenges/interview", status_code=status.HTTP_201_CREATED)
async def generate_interview_challenge(
    challenge_request: ChallengeRequest, 
    request: Request, 
    db: Session = Depends(get_db)
):
    """
    Generate Interview (MCQ) Challenges
    
    FRONTEND USAGE:
    const response = await fetch('/challenges/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ difficulty: 'Medium', topic: 'ML', num_questions: 5 })
    });
    
    RESPONSE FORMAT:
    {
      "challenges": [{ id, type, topic, difficulty, title, date_created, options, correct_answer_id, explanation }],
      "quota_remaining": number,
      "challenge_type": "interview"
    }
    
    ERROR CODES:
    400 - Invalid input, 429 - Quota exceeded, 500 - Server error
    """
    try:
        user_details = authenticate_and_get_user_details(request=request)
        user_id = user_details.get("user_id")

        # Validate question limits for interview challenges
        _validate_challenge_type_limits("interview", challenge_request.num_questions)

        # Ensure quota exists and check availability
        quota = _ensure_quota_exists_and_reset(db, user_id, "interview")
        
        if quota.quota_remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You have reached your daily quota for interview challenges"
            )

        # Generate the challenge data using the AI agent
        ai_generated_data = generate_interview_challenges(
            topic=challenge_request.topic,
            difficulty=challenge_request.difficulty,
            num_questions=challenge_request.num_questions
        )
        
        # Create challenges in database and format response
        created_challenges = []
        for q in ai_generated_data:
            created = create_interview_challenge(
                db=db,
                difficulty=challenge_request.difficulty,
                created_by=user_id,
                topic=challenge_request.topic,
                title=q["title"],
                options=q["options"],
                correct_answer_id=q["correct_answer_id"],
                explaination=q["explaination"]
            )
            # Frontend-friendly response format
            created_challenges.append({
                "id": created.id,
                "type": "interview",
                "topic": created.topic,
                "difficulty": created.difficulty,
                "title": created.title,
                "date_created": created.date_created.isoformat(),
                "options": created.options,  # JSON string - parse with JSON.parse()
                "correct_answer_id": created.correct_answer_id,  # 0-3 for A/B/C/D
                "explanation": created.explaination
            })
        
        # Update quota and commit transaction
        quota.quota_remaining -= 1
        db.commit()
        
        return {
            "challenges": created_challenges,
            "quota_remaining": quota.quota_remaining,
            "challenge_type": "interview"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating interview challenge: {str(e)}"
        )

@router.post("/challenges/scenario", status_code=status.HTTP_201_CREATED)
async def generate_scenario_challenge(
    challenge_request: ChallengeRequest, 
    request: Request, 
    db: Session = Depends(get_db)
):
    """
    Generate Scenario (Open-ended) Challenges
    
    FRONTEND USAGE:
    const response = await fetch('/challenges/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ difficulty: 'Hard', topic: 'Data Science', num_questions: 2 })
    });
    
    RESPONSE FORMAT:
    {
      "challenges": [{ id, type, topic, difficulty, title, date_created, questions, correct_answer, explanation }],
      "quota_remaining": number,
      "challenge_type": "scenario"
    }
    
    ERROR CODES:
    400 - Invalid input, 429 - Quota exceeded, 500 - Server error
    """
    try:
        user_details = authenticate_and_get_user_details(request=request)
        user_id = user_details.get("user_id")

        # Validate question limits for scenario challenges
        _validate_challenge_type_limits("scenario", challenge_request.num_questions)

        # Ensure quota exists and check availability
        quota = _ensure_quota_exists_and_reset(db, user_id, "scenario")
        
        if quota.quota_remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You have reached your daily quota for scenario challenges"
            )

        # Generate the challenge data using the AI agent
        ai_generated_data = generate_scenario_challenge(
            topic=challenge_request.topic,
            difficulty=challenge_request.difficulty,
            num_questions=challenge_request.num_questions
        )
        
        # Create challenge in database
        created_challenge = create_scenario_challenge(
            db=db,
            difficulty=challenge_request.difficulty,
            created_by=user_id,
            topic=challenge_request.topic,
            title=ai_generated_data["title"],
            questions=ai_generated_data["questions"],
            correct_answer=ai_generated_data["correct_answer"],
            explanation=ai_generated_data["explanation"]
        )
        
        # Update quota and commit transaction
        quota.quota_remaining -= 1
        db.commit()
        
        # Return consistent format with interview challenges (array of challenges)
        return {
            "challenges": [{
                "id": created_challenge.id,
                "type": "scenario",
                "topic": created_challenge.topic,
                "difficulty": created_challenge.difficulty,
                "title": created_challenge.title,
                "date_created": created_challenge.date_created.isoformat(),
                "questions": created_challenge.questions,  # JSON string - parse with JSON.parse()
                "correct_answer": created_challenge.correct_answer,
                "explanation": created_challenge.explanation
            }],
            "quota_remaining": quota.quota_remaining,
            "challenge_type": "scenario"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating scenario challenge: {str(e)}"
        )

# ========================================================================================
# HISTORY ENDPOINT
# ========================================================================================

@router.get("/challenges/history")
async def get_challenge_history(request: Request, db: Session = Depends(get_db)):
    """
    Get User's Challenge History (Read-only, Idempotent)
    
    FRONTEND USAGE:
    const response = await fetch('/challenges/history', {
      headers: { ...authHeaders }
    });
    const data = await response.json();
    
    // Separate by type if needed
    const interviews = data.challenges.filter(c => c.type === 'interview');
    const scenarios = data.challenges.filter(c => c.type === 'scenario');
    
    RESPONSE FORMAT:
    {
      "challenges": [mixed array of interview and scenario challenges],
      "total_count": number,
      "interview_count": number,
      "scenario_count": number
    }
    
    NOTE: Challenges are sorted by date_created (newest first)
    """
    
    user_details = authenticate_and_get_user_details(request)
    user_id = user_details.get("user_id")

    # Get user's challenges - both types (READ-ONLY operation)
    interview_challenges = get_user_challenges(db, user_id=user_id, challenge_type="interview")
    scenario_challenges = get_user_challenges(db, user_id=user_id, challenge_type="scenario")
    
    # Combine and return both types with type indicators
    all_challenges = []
    
    # Add interview challenges with type indicator
    for challenge in interview_challenges:
        challenge_dict = {
            "id": challenge.id,
            "type": "interview",  # Frontend: use this to distinguish challenge types
            "topic": challenge.topic,
            "difficulty": challenge.difficulty,
            "title": challenge.title,
            "date_created": challenge.date_created.isoformat(),
            "options": challenge.options,  # JSON string for interview challenges
            "correct_answer_id": challenge.correct_answer_id,
            "explanation": challenge.explaination
        }
        all_challenges.append(challenge_dict)
    
    # Add scenario challenges with type indicator
    for challenge in scenario_challenges:
        challenge_dict = {
            "id": challenge.id,
            "type": "scenario",  # Frontend: use this to distinguish challenge types
            "topic": challenge.topic,
            "difficulty": challenge.difficulty,
            "title": challenge.title,
            "date_created": challenge.date_created.isoformat(),
            "questions": challenge.questions,  # JSON string for scenario challenges
            "correct_answer": challenge.correct_answer,
            "explanation": challenge.explanation
        }
        all_challenges.append(challenge_dict)
    
    # Sort by date created (newest first)
    all_challenges.sort(key=lambda x: x["date_created"], reverse=True)
    
    return {
        "challenges": all_challenges,
        "total_count": len(all_challenges),
        "interview_count": len(interview_challenges),
        "scenario_count": len(scenario_challenges)
    }

# ========================================================================================
# QUOTA MANAGEMENT ENDPOINTS
# ========================================================================================

@router.post("/quotas/initialize", status_code=status.HTTP_201_CREATED)
async def initialize_quotas(request: Request, db: Session = Depends(get_db)):
    """
    Initialize User Quotas (Call this first!)
    
    FRONTEND USAGE:
    // Call this when user first visits the app
    const response = await fetch('/quotas/initialize', {
      method: 'POST',
      headers: { ...authHeaders }
    });
    
    RESPONSE FORMAT:
    {
      "quotas": {
        "interview": { "quota_remaining": 10, "last_reset_date": "ISO", "total_daily_quota": 10 },
        "scenario": { "quota_remaining": 10, "last_reset_date": "ISO", "total_daily_quota": 10 }
      },
      "total_remaining": 20
    }
    """
    
    user_details = authenticate_and_get_user_details(request)
    user_id = user_details.get("user_id")
    
    quotas = {}
    
    for challenge_type in ["interview", "scenario"]:
        quota = get_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
        
        # Create quota if it doesn't exist
        if not quota:
            quota = create_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
        
        # Reset quota if needed (daily reset)
        quota = reset_quota_if_needed(db, quota)
        
        quotas[challenge_type] = {
            "quota_remaining": quota.quota_remaining,
            "last_reset_date": quota.last_reset_date.isoformat(),
            "total_daily_quota": 10
        }
    
    return {
        "quotas": quotas,
        "total_remaining": quotas["interview"]["quota_remaining"] + quotas["scenario"]["quota_remaining"]
    }
    
@router.get("/quotas/{challenge_type}")
async def get_quota(challenge_type: str, request: Request, db: Session = Depends(get_db)):
    """
    Get Quota for Specific Challenge Type (Read-only)
    
    FRONTEND USAGE:
    const response = await fetch('/quotas/interview', { headers: { ...authHeaders } });
    // or
    const response = await fetch('/quotas/scenario', { headers: { ...authHeaders } });
    
    RESPONSE FORMAT:
    {
      "user_id": "string",
      "challenge_type": "interview" | "scenario",
      "quota_remaining": number,
      "last_reset_date": "ISO string",
      "total_daily_quota": 10
    }
    
    ERROR CODES:
    400 - Invalid challenge_type, 404 - Quota not found (call /quotas/initialize first)
    """
    
    # Validate challenge type
    if challenge_type not in ["interview", "scenario"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid challenge type. Must be 'interview' or 'scenario'"
        )
    
    user_details = authenticate_and_get_user_details(request)
    user_id = user_details.get("user_id")
    
    # ONLY READ the quota - don't create or modify (maintains HTTP GET semantics)
    quota = get_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
    
    if not quota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No quota found for challenge type '{challenge_type}'. Use POST /quotas/initialize to create quotas."
        )
    
    return {
        "user_id": user_id,
        "challenge_type": challenge_type,
        "quota_remaining": quota.quota_remaining,
        "last_reset_date": quota.last_reset_date.isoformat(),
        "total_daily_quota": 10
    }

@router.get("/quotas")
async def get_all_quotas(request: Request, db: Session = Depends(get_db)):
    """
    Get All Quotas (Read-only)
    
    FRONTEND USAGE:
    const response = await fetch('/quotas', { headers: { ...authHeaders } });
    const data = await response.json();
    
    // Check if quotas need initialization
    if (data.missing_quotas) {
      await fetch('/quotas/initialize', { method: 'POST', headers: { ...authHeaders } });
    }
    
    RESPONSE FORMAT:
    {
      "quotas": {
        "interview": { "quota_remaining": number, "last_reset_date": "ISO", "total_daily_quota": 10 },
        "scenario": { "quota_remaining": number, "last_reset_date": "ISO", "total_daily_quota": 10 }
      },
      "total_remaining": number
    }
    
    IF QUOTAS MISSING:
    {
      "quotas": { ...existing quotas },
      "missing_quotas": ["interview", "scenario"],
      "message": "Some quotas are missing. Use POST /quotas/initialize to create them.",
      "total_remaining": number
    }
    """
    
    user_details = authenticate_and_get_user_details(request)
    user_id = user_details.get("user_id")
    
    quotas = {}
    missing_quotas = []
    
    for challenge_type in ["interview", "scenario"]:
        # ONLY READ the quota - don't create or modify (maintains HTTP GET semantics)
        quota = get_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
        
        if not quota:
            missing_quotas.append(challenge_type)
        else:
            quotas[challenge_type] = {
                "quota_remaining": quota.quota_remaining,
                "last_reset_date": quota.last_reset_date.isoformat(),
                "total_daily_quota": 10
            }
    
    if missing_quotas:
        return {
            "quotas": quotas,
            "missing_quotas": missing_quotas,
            "message": "Some quotas are missing. Use POST /quotas/initialize to create them.",
            "total_remaining": sum(q["quota_remaining"] for q in quotas.values())
        }
    
    return {
        "quotas": quotas,
        "total_remaining": sum(q["quota_remaining"] for q in quotas.values())
    }

# ========================================================================================
# SCENARIO ANSWER SUBMISSION ENDPOINT
# ========================================================================================

@router.post("/scenario-answers", status_code=status.HTTP_201_CREATED)
async def submit_scenario_answer(
    answer_request: ScenarioAnswerRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Submit and Evaluate Scenario Answer
    
    FRONTEND USAGE:
    const response = await fetch('/scenario-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        scenario_id: 123,
        question_index: 0,  // 0-based index
        user_answer: "My detailed answer here..."
      })
    });
    
    RESPONSE FORMAT:
    {
      "answer_id": number,
      "score": number,
      "feedback": "string",
      "correct_answer": "string",
      "scenario_id": number,
      "question_index": number
    }
    
    ERROR CODES:
    404 - Scenario not found, 500 - Server error during evaluation
    """
    try:
        user_details = authenticate_and_get_user_details(request)
        user_id = user_details.get("user_id")
        
        # Fetch scenario from DB first to validate it exists
        scenario = db.query(ScenarioChallenge).filter(
            ScenarioChallenge.id == answer_request.scenario_id
        ).first()
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scenario not found"
            )
        
        # Save user answer to database
        answer = save_scenario_answer(
            db, 
            user_id, 
            answer_request.scenario_id, 
            answer_request.question_index, 
            answer_request.user_answer
        )
        
        # Evaluate answer using AI agent
        eval_result = evaluate_scenario_answer(
            user_answer=answer_request.user_answer,
            correct_answer=scenario.correct_answer,
            scenario_title=scenario.title,
            questions=scenario.questions
        )
        
        # Save evaluation results
        update_scenario_evaluation(
            db, answer.id,
            llm_score=eval_result["score"],
            llm_feedback=eval_result["feedback"],
            llm_correct_answer=eval_result["correct_answer"]
        )
        
        # Return evaluation results to frontend
        return {
            "answer_id": answer.id,
            "score": eval_result["score"],
            "feedback": eval_result["feedback"],
            "correct_answer": eval_result["correct_answer"],
            "scenario_id": answer_request.scenario_id,
            "question_index": answer_request.question_index
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing scenario answer: {str(e)}"
        )