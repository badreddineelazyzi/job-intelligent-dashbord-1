#!/usr/bin/env python3
"""
Script d'initialisation de la base de données Users
Exécute : python database/user_db_init.py
"""
import sys
import os

# Ajoute le dossier parent au path (racine du projet)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine
from database.users_models import Base

# Configuration
DB_HOST = "localhost"
DB_PORT = "5432"
DB_USER = "user_dw"        # Modifie selon ton setup
DB_PASSWORD = "password_dw"    # Modifie selon ton setup
DB_NAME = "job_intelligent_users"

def create_database():
    """Crée la base de données si elle n'existe pas"""
    try:
        # Connexion à postgres (base système)
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Vérifie si la base existe
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (DB_NAME,)
        )
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"✅ Base '{DB_NAME}' créée avec succès")
        else:
            print(f"ℹ️  Base '{DB_NAME}' existe déjà")
            
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur création base: {e}")
        return False

def create_tables():
    """Crée les tables avec SQLAlchemy"""
    try:
        DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        engine = create_engine(DATABASE_URL)
        
        # Crée toutes les tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables créées avec succès")
        return True
        
    except Exception as e:
        print(f"❌ Erreur création tables: {e}")
        return False

def verify_tables():
    """Vérifie que les tables existent"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cursor.fetchall()
        
        print("\n📋 Tables dans la base:")
        for table in tables:
            print(f"   • {table[0]}")
            
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur vérification: {e}")
        return False

def main():
    print("🚀 Initialisation de la base Users...\n")
    
    # Étape 1: Créer la base
    if not create_database():
        return False
    
    # Étape 2: Créer les tables
    if not create_tables():
        return False
    
    # Étape 3: Vérifier
    verify_tables()
    
    print("\n✅ Initialisation terminée !")
    return True

if __name__ == "__main__":
    main()