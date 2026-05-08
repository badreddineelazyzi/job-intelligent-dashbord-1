from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Dans Docker, utilise le nom du service 'postgres-dw'
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user_dw:password_dw@localhost:5432/job_data_warehouse")

engine = None
SessionLocal = None

def get_engine():
    global engine
    if engine is None:
        engine = create_engine(DATABASE_URL)
    return engine

def get_session_local():
    global SessionLocal
    if SessionLocal is None:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return SessionLocal

def get_db():
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()