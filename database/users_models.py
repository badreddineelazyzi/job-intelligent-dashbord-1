from sqlalchemy import Column, Integer, String, ARRAY, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    
    # Profil matching
    title = Column(String(100))
    location = Column(String(100))
    remote_preference = Column(String(20))
    skills = Column(ARRAY(String))
    experience_years = Column(Integer)
    contract_type = Column(ARRAY(String))
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class UserFavorite(Base):
    __tablename__ = "user_favorites"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    job_id = Column(Integer, nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())


class SearchHistory(Base):
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    query = Column(String, nullable=False)
    results_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())