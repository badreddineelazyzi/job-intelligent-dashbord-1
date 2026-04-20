import sys
import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator

# Ensure the project root is in the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipelines.export_pipeline import run_export
from database.init_db import init_database

default_args = {
    "owner": "data-team",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="03_export_to_database",
    description="Export the perfectly processed machine learning data from MinIO to PostgreSQL",
    default_args=default_args,
    start_date=datetime(2026, 4, 1),
    schedule_interval=None, # Triggered automatically by processing DAG
    catchup=False,
    tags=["database", "export", "milestone-4"],
) as dag:
    
    check_schema_task = PythonOperator(
        task_id="check_and_create_tables",
        python_callable=init_database,
    )

    export_to_db_task = PythonOperator(
        task_id="export_processed_to_postgres",
        python_callable=run_export,
    )

    check_schema_task >> export_to_db_task
