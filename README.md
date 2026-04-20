# Job Intelligent Dashboard

An end-to-end data engineering and machine learning pipeline that collects job postings, extracts key skills, and provides AI-powered recommendations. Hosted on a FastAPI backend and visualized via Power BI.

## Features
- **Scalable Web Scraping**: Extracts job data from platforms like LinkedIn, Indeed, and Rekrute.
- **API Integrations**: Polls robust job boards like Adzuna, Jobicy, and Jooble.
- **Airflow Orchestration**: Automates the ETL pipeline across Ingestion, Cleaning, and Export DAGs.
- **Machine Learning**: Uses NLP (TF-IDF and embeddings) to generate skill similarity and job recommendations.
- **RESTful API**: Fast and asynchronous API powered by FastAPI.
- **Data Insights**: Complete data models generated for PowerBI KPIs mapping.

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repo_url>
   cd job-intelligent-dashboard
   ```

2. **Create and activate Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   # Or on Windows: .venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   make install
   ```

4. **Initialize Database** (Ensure local PostgreSQL or Docker container is running):
   ```bash
   python database/init_db.py
   ```

5. **Start Airflow Standalone**:
   Make sure you have set up a local `airflow.cfg` in your environment.
   ```bash
   make run-airflow
   ```

6. **Start FastAPI Backend**:
   ```bash
   make run-api
   ```

## Architecture
See [docs/architecture.md](docs/architecture.md) for a complete system walkthrough.

## Testing & Linting
Run the full test suite with:
```bash
make test
```

Format code via Black:
```bash
make format
```
