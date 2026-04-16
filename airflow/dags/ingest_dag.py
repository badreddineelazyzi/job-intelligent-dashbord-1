import sys
import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

# Ensure the project root is in the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipelines.ingestion_pipeline import run_all_scrapers

default_args = {
    "owner": "data-team",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="01_ingest_jobs_data",
    description="Automate scraping from APIs and web sources and store in MinIO",
    default_args=default_args,
    start_date=datetime(2026, 4, 1),
    schedule_interval="@daily",
    catchup=False,
    tags=["ingestion", "scraping", "milestone-2"],
) as dag:
    
    run_scrapers_task = PythonOperator(
        task_id="run_all_scrapers",
        python_callable=run_all_scrapers,
    )

    trigger_processing_task = TriggerDagRunOperator(
        task_id="trigger_processing_pipeline",
        trigger_dag_id="02_process_jobs_data",
        wait_for_completion=False,
    )

    run_scrapers_task >> trigger_processing_task
