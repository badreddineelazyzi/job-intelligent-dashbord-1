# System Architecture

This document describes the high-level architecture of the Job Intelligent Dashboard project.

## Components
The system consists of the following major components:
1. **Data Ingestion (Scrapers)**: Python scripts for web scraping (Indeed, LinkedIn, Rekrute) and API clients (Adzuna, Jobicy, Jooble).
2. **Orchestration**: Apache Airflow schedules the batch jobs to scrape and clean data periodically.
3. **Processing & Machine Learning**: 
    - Text data is cleaned and normalized (NLP).
    - TF-IDF and Embeddings generate similarity matrices to recommend skills and job roles.
4. **Data Storage**: Processed data is stored in a PostgreSQL database (`models.py` uses SQLAlchemy ORM).
5. **API Layer**: A FastAPI server exposes the extracted insights and recommendations via REST endpoints.
6. **Visualization**: A Power BI dashboard connects to the PostgreSQL database for BI tracking and KPI reporting.

## Data Flow Diagram
See `docs/diagrams/architecture.mermaid` for the data flow visualization.
