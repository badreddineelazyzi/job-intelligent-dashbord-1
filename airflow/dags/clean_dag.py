import sys
import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

# Ensure the project root is in the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipelines.processing_pipeline import run_processing

default_args = {
    "owner": "data-team",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="02_process_jobs_data",
    description="Clean, normalize, and extract NLP features before saving strictly into MinIO",
    default_args=default_args,
    start_date=datetime(2026, 4, 1),
    schedule_interval=None, # Triggered automatically by ingestion DAG
    catchup=False,
    tags=["processing", "cleaning", "milestone-3"],
) as dag:
    
    process_data_task = PythonOperator(
        task_id="process_and_feature_engineer",
        python_callable=run_processing,
    )

    trigger_export_task = TriggerDagRunOperator(
        task_id="trigger_export_pipeline",
        trigger_dag_id="03_export_to_database",
        wait_for_completion=False,
    )

    process_data_task >> trigger_export_task
