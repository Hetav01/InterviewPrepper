# Database Models - InterviewPrepper Application
#
# This file defines the SQLAlchemy ORM models for the database schema.
# Models represent the core entities: challenges, answers, and user quotas.
#
# FRONTEND NOTES:
# - Interview challenges contain MCQ data with options as JSON strings
# - Scenario challenges contain open-ended questions as JSON strings  
# - All dates are returned as ISO format strings in API responses
# - User quotas reset daily (10 challenges per type per day)

from sqlalchemy import Column, Integer, String, DateTime, Boolean, create_engine, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Database configuration (development)
# engine = create_engine("sqlite:///database.db", echo=True)
import os
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///database.db")
engine = create_engine(DATABASE_URL, echo=False)

Base = declarative_base()

# ========================================================================================
# CHALLENGE MODELS
# ========================================================================================

class InterviewChallenge(Base):
    """
    Multiple Choice Question (MCQ) challenges for interview preparation.
    Each record represents one generated question with multiple answer options.
    
    FRONTEND USAGE:
    - Use 'options' field as JSON.parse(challenge.options) to get array
    - 'correct_answer_id' maps to array index (0=A, 1=B, 2=C, 3=D)
    - Display 'title' as the main question text
    """
    __tablename__ = "interview_challenges"
    
    # System-generated fields
    id = Column(Integer, primary_key=True)  # Auto-generated unique identifier
    date_created = Column(DateTime, default=datetime.now)  # Auto-generated timestamp
    
    # User input fields (what the user provides when generating)
    topic = Column(String, nullable=False)  # USER INPUT: Subject matter (e.g., "Neural Networks", "SVM")
    difficulty = Column(String, nullable=False)  # USER INPUT: "Easy", "Medium", or "Hard"
    created_by = Column(String, nullable=False, index=True)  # USER AUTH: User ID - INDEXED for user history queries
    
    # AI-generated content fields (OpenAI outputs stored for reuse)
    title = Column(String, nullable=False)  # AI GENERATED: The actual question text
    options = Column(String, nullable=False)  # AI GENERATED: JSON array ["Option A", "Option B", "Option C", "Option D"]
    correct_answer_id = Column(Integer, nullable=False)  # AI GENERATED: Index of correct option (0-3 for A/B/C/D)
    explaination = Column(String, nullable=False)  # AI GENERATED: Explanation text (typo preserved for frontend compatibility)
    
class ScenarioChallenge(Base):
    """
    Open-ended scenario challenges for interview preparation.
    Each record represents one scenario with multiple related questions.
    
    FRONTEND USAGE:
    - Use 'questions' field as JSON.parse(challenge.questions) to get question array
    - Display 'title' as the main scenario description
    - 'correct_answer' and 'explanation' are used for AI evaluation
    """
    __tablename__ = "scenario_challenges"

    # System-generated fields
    id = Column(Integer, primary_key=True)  # Auto-generated unique identifier
    date_created = Column(DateTime, default=datetime.now)  # Auto-generated timestamp
    
    # User input fields (what the user provides when generating)
    topic = Column(String, nullable=False)  # USER INPUT: Subject matter (e.g., "Machine Learning", "Data Science")
    difficulty = Column(String, nullable=False)  # USER INPUT: "Easy", "Medium", or "Hard"
    created_by = Column(String, nullable=False, index=True)  # USER AUTH: User ID - INDEXED for user history queries
    
    # AI-generated content fields (OpenAI outputs stored for reuse)
    title = Column(String, nullable=False)  # AI GENERATED: Main scenario description
    questions = Column(String, nullable=False)  # AI GENERATED: JSON array of question objects
    correct_answer = Column(String, nullable=True)  # AI GENERATED: Optional ideal answer template for evaluation
    explanation = Column(String, nullable=True)  # AI GENERATED: Optional rubric or feedback guidelines
    
    # Relationship to answers (one scenario can have many user answers)
    answers = relationship("ScenarioAnswer", back_populates="scenario")

# ========================================================================================
# ANSWER TRACKING MODELS
# ========================================================================================

class ScenarioAnswer(Base):
    """
    Tracks individual user responses to scenario challenges.
    Stores user answers and AI evaluation results.
    
    FRONTEND USAGE:
    - Submit answers via POST /scenario-answers endpoint
    - 'question_index' is 0-based (first question = 0, second = 1, etc.)
    - AI evaluation provides score, feedback, and correct answer
    """
    __tablename__ = "scenario_answers"
    
    # System-generated fields
    id = Column(Integer, primary_key=True)  # Auto-generated unique identifier
    created_at = Column(DateTime, default=datetime.now)  # When answer was submitted
    
    # User response fields
    user_id = Column(String, nullable=False)  # USER AUTH: User who submitted the answer
    scenario_id = Column(Integer, ForeignKey("scenario_challenges.id"), nullable=False)  # Reference to scenario
    question_index = Column(Integer, nullable=False)  # Which question in the scenario (0-based index)
    user_answer = Column(String, nullable=False)  # USER INPUT: The actual text response
    
    # AI evaluation fields (populated after submission)
    llm_score = Column(Integer, nullable=True)  # AI GENERATED: Numeric score
    llm_feedback = Column(String, nullable=True)  # AI GENERATED: Detailed feedback text
    llm_correct_answer = Column(String, nullable=True)  # AI GENERATED: Ideal answer for comparison
    
    # Relationship back to scenario
    scenario = relationship("ScenarioChallenge", back_populates="answers")

class InterviewAnswer(Base):
    """
    Tracks individual user responses to interview (MCQ) challenges.
    Stores what users actually answered vs the correct answers.
    
    FRONTEND USAGE:
    - Submit answers via POST /interview-answers endpoint
    - Track user's selected option (0-3 for A/B/C/D)
    - Calculate correctness and performance metrics
    """
    __tablename__ = "interview_answers"
    
    # System fields
    id = Column(Integer, primary_key=True)
    date_completed = Column(DateTime, default=datetime.now)
    
    # User tracking
    user_id = Column(String, nullable=False)  # USER AUTH: User identifier
    
    # Challenge reference
    challenge_id = Column(Integer, ForeignKey("interview_challenges.id"), nullable=False)  # References InterviewChallenge.id
    
    # User response data
    user_answer_id = Column(Integer, nullable=False)  # USER RESPONSE: Selected option (0-3 for A/B/C/D)
    is_correct = Column(Boolean, nullable=False)  # SYSTEM CALCULATED: Whether user got it right
    time_taken_seconds = Column(Integer, nullable=True)  # SYSTEM TRACKED: How long user took (optional)
    
    # Relationship back to challenge
    challenge = relationship("InterviewChallenge")

# ========================================================================================
# QUOTA MANAGEMENT MODELS
# ========================================================================================

class ChallengeQuota(Base):
    """
    Tracks usage limits for each user per challenge type.
    Prevents API abuse and manages daily quotas.
    
    FRONTEND USAGE:
    - Each user gets 10 challenges per type per day
    - Quotas reset automatically after 24 hours
    - Check quotas before allowing challenge generation
    """
    __tablename__ = "challenge_quotas"
    
    # System-generated fields
    id = Column(Integer, primary_key=True)  # Auto-generated unique identifier
    
    # User tracking fields (from authentication system)
    user_id = Column(String, nullable=False, index=True)  # USER AUTH: User identifier - INDEXED for quota lookups
    
    # Quota management fields (business logic)
    challenge_type = Column(String, nullable=False)  # SYSTEM: "interview" or "scenario" - tracks quotas separately
    quota_remaining = Column(Integer, nullable=False, default=10)  # SYSTEM: How many challenges user can generate today
    last_reset_date = Column(DateTime, default=datetime.now)  # SYSTEM: When quota was last reset (for daily reset logic)

# ========================================================================================
# FUTURE MODELS (Not implemented yet, but planned)
# ========================================================================================

# NOTE: This model is commented out but shows the planned structure for interview answer tracking
# 
# class UserChallengeResponse(Base):
#     """
#     Future: Track individual user responses to interview (MCQ) challenges.
#     This would store what users actually answered vs the correct answers.
#     """
#     __tablename__ = "user_challenge_responses"
#     
#     # System fields
#     id = Column(Integer, primary_key=True)
#     date_completed = Column(DateTime, default=datetime.now)
#     
#     # User tracking
#     user_id = Column(String, nullable=False)  # CLERK AUTH: User identifier
#     email = Column(String, nullable=False)  # CLERK AUTH: User email for analytics
#     
#     # Challenge reference
#     challenge_id = Column(Integer, nullable=False)  # FOREIGN KEY: References InterviewChallenge.id
#     challenge_type = Column(String, nullable=False)  # SYSTEM: "interview" or "scenario"
#     
#     # User response data
#     user_answer = Column(String, nullable=True)  # USER RESPONSE: What the user selected/typed
#     is_correct = Column(Boolean, nullable=True)  # SYSTEM CALCULATED: Whether user got it right
#     time_taken_seconds = Column(Integer, nullable=True)  # SYSTEM TRACKED: How long user took

# ========================================================================================
# DATABASE INITIALIZATION
# ========================================================================================

# Create all tables in the database
Base.metadata.create_all(engine)

# Session factory for database connections
SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)

def get_db():
    """
    Database session dependency for FastAPI.
    
    USAGE IN ROUTES:
    async def my_endpoint(db: Session = Depends(get_db)):
        # Use db session here
        pass
    
    This function ensures proper session cleanup after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


    
