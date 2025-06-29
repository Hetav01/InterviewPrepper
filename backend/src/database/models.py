from sqlalchemy import Column, Integer, String, DateTime, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

engine = create_engine("sqlite:///database.db", echo= True)
Base = declarative_base()

class InterviewChallenge(Base):
    __tablename__ = "interview_challenges"