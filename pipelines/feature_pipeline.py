import os
import sys
import pandas as pd
import logging
import boto3
from io import StringIO, BytesIO
from datetime import datetime

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

        # --- ÉTAPE 1 : RÉCUPÉRATION DYNAMIQUE DU DERNIER FICHIER PROCESSED ---
        logging.info("🔍 Recherche du fichier le plus récent dans 'processed-data'...")
        
        response = S3_CLIENT.list_objects_v2(Bucket="processed-data")
        
        if 'Contents' not in response:
            logging.error("❌ Aucun fichier trouvé dans le bucket 'processed-data'.")
            return

        # On trouve le fichier avec la date de modification la plus récente
        latest_processed_file = max(response['Contents'], key=lambda x: x['LastModified'])
        file_key = latest_processed_file['Key']
        
        logging.info(f"📦 Lecture du fichier : {file_key}")
        
        obj = S3_CLIENT.get_object(Bucket="processed-data", Key=file_key)
        cleaned_df = pd.read_csv(BytesIO(obj['Body'].read()), encoding='utf-8-sig')

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

        # --- ÉTAPE 4 : SAUVEGARDE AVEC TIMESTAMP DANS CURATED ---
        csv_buffer = StringIO()
        final_df.to_csv(csv_buffer, index=False, encoding='utf-8-sig')
        
        # Génération du timestamp pour le stockage final
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        final_filename = f"final_features_job_market_{timestamp}.csv"
        
        S3_CLIENT.put_object(
            Bucket="curated-data",
            Key=final_filename,
            Body=csv_buffer.getvalue(),
            ContentType='text/csv'
        )
        
        logging.info(f"✨ TERMINÉ : Fichier final sauvegardé sous : {final_filename}")

    except Exception as e:
        logging.critical(f"💥 Erreur fatale durant le pipeline de features : {e}")

if __name__ == "__main__":
    run_feature_engineering()