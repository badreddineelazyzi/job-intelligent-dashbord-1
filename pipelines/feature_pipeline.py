import os
import sys
import pandas as pd
import logging
import boto3
from io import StringIO, BytesIO

# Config pour Windows (Localhost) ou Docker (minio-job)
MINIO_URL = os.getenv("MINIO_ENDPOINT_URL", "http://localhost:9000")
S3_CLIENT = boto3.client(
    's3',
    endpoint_url=MINIO_URL,
    aws_access_key_id='admin',
    aws_secret_access_key='password123',
    region_name='us-east-1'
)

# CONFIGURATION DU PATH ET DES LOGS
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

log_dir = os.path.join(project_root, "logs")
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "feature_engineering.log"), encoding='utf-8'),
        logging.StreamHandler()
    ]
)

try:
    from processing.feature_engineering import FeatureEngineer
    from processing.validators import JobValidator
except ImportError as e:
    logging.critical(f"❌ Impossible d'importer les modules : {e}")
    sys.exit(1)

def run_feature_engineering():
    logging.info("🚀 [PIPELINE FEATURE ENGINEERING] Démarrage de l'extraction des features...")
    
    try:
        engineer = FeatureEngineer()
        validator = JobValidator()

        # ÉTAPE 1 : LECTURE DU FICHIER NETTOYÉ DEPUIS MINIO
        logging.info("📦 Lecture du fichier nettoyé depuis le bucket 'processed-data'...")
        try:
            obj = S3_CLIENT.get_object(Bucket="processed-data", Key="cleaned_job_market_latest.csv")
            cleaned_df = pd.read_csv(BytesIO(obj['Body'].read()), encoding='utf-8-sig')
        except Exception as e:
            logging.error(f"❌ Impossible de lire 'cleaned_job_market_latest.csv' : {e}")
            return

        if cleaned_df.empty:
            logging.warning("⚠️ Dataset vide. Arrêt du Feature Engineering.")
            return

        # ÉTAPE 2 : FEATURE ENGINEERING
        logging.info("⚙️ Lancement du Feature Engineering et extraction du contexte NLP...")
        engineered_df = engineer.extract_features(cleaned_df)

        # ÉTAPE 3 : VALIDATION FINALE
        logging.info("⚖️ Lancement de la validation métier...")
        final_df = validator.validate(engineered_df)

        if not validator.check_schema(final_df):
            logging.error("❌ Le schéma final est invalide après feature engineering.")
            return

        # ÉTAPE 4 : SAUVEGARDE DU FICHIER FINAL SUR MINIO
        csv_buffer = StringIO()
        final_df.to_csv(csv_buffer, index=False, encoding='utf-8-sig')
        
        S3_CLIENT.put_object(
            Bucket="processed-data",
            Key="final_features_job_market_latest.csv",
            Body=csv_buffer.getvalue(),
            ContentType='text/csv'
        )
        
        logging.info("✨ TERMINÉ : Fichier final NLP/Feature sauvegardé ['final_features_job_market_latest.csv'] dans MinIO.")

    except Exception as e:
        logging.critical(f"💥 Erreur fatale durant le pipeline de features : {e}")

if __name__ == "__main__":
    run_feature_engineering()