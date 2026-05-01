from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Ajoute le dossier parent au path (racine du projet)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.users_models import Base

# Même serveur PostgreSQL, base différente (ou même base, schéma différent)
USERS_DATABASE_URL = "postgresql://user_dw:password_dw@localhost:5432/job_intelligent_users"

engine = None
SessionLocal = None

def get_engine():
    global engine
    if engine is None:
        engine = create_engine(USERS_DATABASE_URL)
    return engine

def get_session_local():
    global SessionLocal
    if SessionLocal is None:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return SessionLocal

def get_users_db():
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()

# Fonction pour créer les tables (à appeler au démarrage)
def init_users_tables():
    Base.metadata.create_all(bind=get_engine())