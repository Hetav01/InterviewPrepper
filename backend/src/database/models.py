from sqlalchemy import Column, Integer, String, DateTime, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

engine = create_engine("sqlite:///database.db", echo= True)
Base = declarative_base()

class InterviewChallenge(Base):
    __tablename__ = "interview_challenges"
    
    id = Column(Integer, primary_key=True)
    difficulty = Column(String, nullable=False)
    date_created = Column(DateTime, default=datetime.now)
    title = Column(String, nullable=False)
    options = Column(String, nullable=False)
    correct_answer_id = Column(Integer, nullable=False)
    explanation = Column(String, nullable=False)
    
class ScenarioChallenge(Base):
    __tablename__ = "scenario_challenges"

    id = Column(Integer, primary_key=True)
    difficulty = Column(String, nullable=False)
    date_created = Column(DateTime, default=datetime.now)
    title = Column(String, nullable=False)  # The scenario prompt
    correct_answer = Column(String, nullable=True)  # The ideal answer (optional)
    explanation = Column(String, nullable=True)  # Optional: rubric or feedback
    
class ChallengeQuota(Base):
    __tablename__ = "challenge_quotas"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    challenge_type = Column(String, nullable=False)
    quota_remaining = Column(Integer, nullable=False, default=40)
    last_reset_date = Column(DateTime, default=datetime.now)

# class User(Base):
#     __table_name__ = "challenge-users"
    
#     id = Column(Integer, primary_key=True)
#     user_id = Column(String, nullable=False)
#     challenge_id = Column(Integer, nullable=False)
#     date_completed = Column(DateTime, default=datetime.now)
#     email = Column(String, nullable=False)

Base.metadata.create_all(engine)

SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


    
