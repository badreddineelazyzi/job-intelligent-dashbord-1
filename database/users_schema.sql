-- ============================================================
-- BASE USERS - Job Intelligent
-- Séparée du Data Warehouse
-- ============================================================

-- Créer la base (à exécuter manuellement dans psql)
-- CREATE DATABASE job_intelligent_users;

\c job_intelligent_users;

-- Table users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    title VARCHAR(100),
    location VARCHAR(100),
    remote_preference VARCHAR(20),
    skills TEXT[],
    experience_years INTEGER,
    contract_type TEXT[],
    salary_min INTEGER,
    salary_max INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Table user_favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    saved_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id);

-- Table search_history
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    results_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_user ON search_history(user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();