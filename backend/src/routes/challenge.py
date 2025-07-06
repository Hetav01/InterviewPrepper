# this is file to write the routes for the challenge. the "/" routes

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from ..database.db import (
    get_user_challenges,
    create_challenge_quota,
    create_interview_challenge,
    create_scenario_challenge,
    reset_quota_if_needed,
    get_challenge_quota,
)

from ..utils import authenticate_and_get_user_details
from ..database.models import get_db
import json
from datetime import datetime

router = APIRouter()

class ChallengeRequest(BaseModel):
    #specify what to expect from the user in the challenge.
    difficulty: str
    topic: str
    challenge_type: str  # "interview" or "scenario"
    num_questions: int = 5  # Default to 5 questions
    
    @validator('difficulty')
    def validate_difficulty(cls, v):
        if v not in ['easy', 'medium', 'hard']:
            raise ValueError('difficulty must be "easy", "medium", or "hard"')
        return v
    
    @validator('challenge_type')
    def validate_challenge_type(cls, v):
        if v not in ['interview', 'scenario']:
            raise ValueError('challenge_type must be "interview" or "scenario"')
        return v
    
    @validator('num_questions')
    def validate_num_questions(cls, v, values):
        if v < 1:
            raise ValueError('num_questions must be at least 1')
        if values.get('challenge_type') == 'scenario' and v > 3:
            raise ValueError('scenario challenges can have maximum 3 questions')
        if values.get('challenge_type') == 'interview' and v > 10:
            raise ValueError('interview challenges can have maximum 10 questions')
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
                "difficulty": "medium",
                "topic": "Neural Networks",
                "challenge_type": "interview",
                "num_questions": 3
            }
        }

# post a new challenge.
@router.post("/generate-challenge/{challenge_type}")
async def generate_challenge(challenge_type: str, challenge_request: ChallengeRequest, request: Request, db: Session = Depends(get_db)):
    """Generate a new challenge for the user"""
    
    try: 
        user_details = authenticate_and_get_user_details(request=request)
        user_id = user_details.get("user_id")
        
        # Validate challenge type matches the URL parameter
        if challenge_type != challenge_request.challenge_type:
            raise HTTPException(status_code=400, detail="Challenge type in URL must match challenge type in request body")
        
        # Validate challenge type
        if challenge_type not in ["interview", "scenario"]:
            raise HTTPException(status_code=400, detail="Invalid challenge type. Must be 'interview' or 'scenario'")
        
        # get the user's quota for specific challenge type
        quota = get_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
        
        if not quota:
            quota = create_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
        
        # Reset quota if needed (daily reset)
        quota = reset_quota_if_needed(db, quota)
            
        if quota.quota_remaining <= 0:
            raise HTTPException(status_code=429, detail="You have reached your daily quota for this challenge type")
        
        # TO-DO: Generate the challenge data using AI
        # This is where you'll call your AI generation function
        # ai_generated_data = generate_ai_challenge(
        #     topic=challenge_request.topic,
        #     difficulty=challenge_request.difficulty,
        #     challenge_type=challenge_type,
        #     num_questions=challenge_request.num_questions
        # )
        
        # TO-DO: Replace with actual AI-generated data and database save
        # if challenge_type == "interview":
        #     created_challenge = create_interview_challenge(
        #         db=db,
        #         difficulty=challenge_request.difficulty,
        #         created_by=user_id,
        #         topic=challenge_request.topic,
        #         title=ai_generated_data["title"],
        #         options=json.dumps(ai_generated_data["options"]),
        #         correct_answer_id=ai_generated_data["correct_answer_id"],
        #         explaination=ai_generated_data["explanation"]
        #     )
        # else:  # scenario
        #     created_challenge = create_scenario_challenge(
        #         db=db,
        #         difficulty=challenge_request.difficulty,
        #         created_by=user_id,
        #         topic=challenge_request.topic,
        #         title=ai_generated_data["title"],
        #         questions=json.dumps(ai_generated_data["questions"]),
        #         correct_answer=ai_generated_data["correct_answer"],
        #         explanation=ai_generated_data["explanation"]
        #     )
        
        # Decrement quota only after successful generation
        quota.quota_remaining -= 1
        db.commit()
        
        # TO-DO: Return the created challenge data
        # return {
        #     "challenge": created_challenge,
        #     "quota_remaining": quota.quota_remaining
        # }
        
        # Temporary response until AI is implemented
        return {
            "message": "Challenge generation ready - AI pending",
            "quota_remaining": quota.quota_remaining
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generating challenge: {str(e)}")
    
    

@router.get("/my-history")
async def my_history(request: Request, db: Session = Depends(get_db)):
    """Get the user's challenge history"""
    
    user_details = authenticate_and_get_user_details(request)
    user_id = user_details.get("user_id")

    # get the user's challenges - both types
    interview_challenges = get_user_challenges(db, user_id=user_id, challenge_type="interview")
    scenario_challenges = get_user_challenges(db, user_id=user_id, challenge_type="scenario")
    
    # combine and return both types with type indicators
    all_challenges = []
    
    # Add interview challenges with type indicator
    for challenge in interview_challenges:
        challenge_dict = {
            "id": challenge.id,
            "type": "interview",
            "topic": challenge.topic,
            "difficulty": challenge.difficulty,
            "title": challenge.title,
            "date_created": challenge.date_created.isoformat(),
            "options": challenge.options,
            "correct_answer_id": challenge.correct_answer_id,
            "explanation": challenge.explaination
        }
        all_challenges.append(challenge_dict)
    
    # Add scenario challenges with type indicator
    for challenge in scenario_challenges:
        challenge_dict = {
            "id": challenge.id,
            "type": "scenario", 
            "topic": challenge.topic,
            "difficulty": challenge.difficulty,
            "title": challenge.title,
            "date_created": challenge.date_created.isoformat(),
            "questions": challenge.questions,
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
    
@router.get("/quota/{challenge_type}")
async def get_quota(challenge_type: str, request: Request, db: Session = Depends(get_db)):
    """Get the user's quota for a specific challenge type"""
    
    user_details = authenticate_and_get_user_details(request)
    user_id = user_details.get("user_id")
    
    # get the user's quota for specific challenge type
    quota = get_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
    
    # If no quota exists, create one
    if not quota:
        quota = create_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
    
    # Reset quota if needed (daily reset)
    quota = reset_quota_if_needed(db, quota)
    
    return {
        "user_id": user_id,
        "quota": quota,
        "challenge_type": challenge_type
    }

@router.get("/quota")
async def get_all_quotas(request: Request, db: Session = Depends(get_db)):
    """Get quotas for both challenge types"""
    
    user_details = authenticate_and_get_user_details(request)
    user_id = user_details.get("user_id")
    
    quotas = {}
    
    for challenge_type in ["interview", "scenario"]:
        quota = get_challenge_quota(db, user_id=user_id, challenge_type=challenge_type)
        
        # If no quota exists, create one
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