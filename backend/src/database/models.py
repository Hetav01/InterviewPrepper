from sqlalchemy import Column, Integer, String, DateTime, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

engine = create_engine("sqlite:///database.db", echo= True)
Base = declarative_base()

class InterviewChallenge(Base):
    """
    Multiple Choice Question (MCQ) challenges for interview preparation.
    Each record represents one generated question.
    """
    __tablename__ = "interview_challenges"
    
    # System-generated fields
    id = Column(Integer, primary_key=True)  # Auto-generated unique identifier
    date_created = Column(DateTime, default=datetime.now)  # Auto-generated timestamp
    
    # User input fields (what the user provides)
    topic = Column(String, nullable=False)  # USER INPUT: Subject matter (e.g., "Neural Networks", "SVM")
    difficulty = Column(String, nullable=False)  # USER INPUT: "easy", "medium", or "hard"
    
    # AI-generated content fields (OpenAI outputs stored for reuse)
    title = Column(String, nullable=False)  # AI GENERATED: The actual question text (e.g., "What is backpropagation?")
    options = Column(String, nullable=False)  # AI GENERATED: JSON array of answer choices (e.g., ["Option A", "Option B", "Option C", "Option D"])
    correct_answer_id = Column(Integer, nullable=False)  # AI GENERATED: Index of correct option (0-3)
    explaination = Column(String, nullable=False)  # AI GENERATED: Explanation of why the answer is correct (typo kept to match frontend)
    
class ScenarioChallenge(Base):
    """
    Open-ended scenario challenges for interview preparation.
    Each record represents one scenario with multiple related questions.
    """
    __tablename__ = "scenario_challenges"

    # System-generated fields
    id = Column(Integer, primary_key=True)  # Auto-generated unique identifier
    date_created = Column(DateTime, default=datetime.now)  # Auto-generated timestamp
    
    # User input fields (what the user provides)
    topic = Column(String, nullable=False)  # USER INPUT: Subject matter (e.g., "Machine Learning", "Data Science")
    difficulty = Column(String, nullable=False)  # USER INPUT: "easy", "medium", or "hard"
    
    # AI-generated content fields (OpenAI outputs stored for reuse)
    title = Column(String, nullable=False)  # AI GENERATED: Main scenario description (e.g., "You are a data scientist at a startup...")
    questions = Column(String, nullable=False)  # AI GENERATED: JSON array of question objects [{"prompt": "How would you handle overfitting?"}]
    correct_answer = Column(String, nullable=True)  # AI GENERATED: Optional ideal answer template for evaluation
    explanation = Column(String, nullable=True)  # AI GENERATED: Optional rubric or feedback guidelines
    
class ChallengeQuota(Base):
    """
    Tracks usage limits for each user per challenge type.
    Prevents API abuse and manages user quotas.
    """
    __tablename__ = "challenge_quotas"
    
    # System-generated fields
    id = Column(Integer, primary_key=True)  # Auto-generated unique identifier
    
    # User tracking fields (from authentication system)
    user_id = Column(Integer, nullable=False)  # CLERK AUTH: User identifier from Clerk authentication
    
    # Quota management fields (business logic)
    challenge_type = Column(String, nullable=False)  # SYSTEM DEFINED: "mcq" or "scenario" - tracks quotas separately
    quota_remaining = Column(Integer, nullable=False, default=40)  # SYSTEM MANAGED: How many challenges user can generate (resets daily)
    last_reset_date = Column(DateTime, default=datetime.now)  # SYSTEM MANAGED: When quota was last reset (for daily reset logic)

# FUTURE MODEL: User response tracking (not implemented yet)
# class UserChallengeResponse(Base):
#     """
#     Tracks individual user responses to challenges.
#     This would store what users actually answered vs the correct answers.
#     """
#     __tablename__ = "user_challenge_responses"
    
#     # System fields
#     id = Column(Integer, primary_key=True)  # Auto-generated unique identifier
#     date_completed = Column(DateTime, default=datetime.now)  # When user completed the challenge
    
#     # User tracking (from auth system)
#     user_id = Column(String, nullable=False)  # CLERK AUTH: User identifier
#     email = Column(String, nullable=False)  # CLERK AUTH: User email for analytics
    
#     # Challenge reference
#     challenge_id = Column(Integer, nullable=False)  # FOREIGN KEY: References InterviewChallenge.id or ScenarioChallenge.id
#     challenge_type = Column(String, nullable=False)  # SYSTEM: "mcq" or "scenario"
    
#     # User response data
#     user_answer = Column(String, nullable=True)  # USER RESPONSE: What the user selected/typed
#     is_correct = Column(Boolean, nullable=True)  # SYSTEM CALCULATED: Whether user got it right
#     time_taken_seconds = Column(Integer, nullable=True)  # SYSTEM TRACKED: How long user took

Base.metadata.create_all(engine)

SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


    
