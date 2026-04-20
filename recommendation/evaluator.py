import pandas as pd
import os
import sys
import boto3
import io

# Ajout du chemin pour importer tes modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from recommendation.matcher import JobMatcher

# --- 1. CONFIGURATION MINIO & CHARGEMENT ---
s3 = boto3.client('s3', 
    endpoint_url='http://localhost:9000', 
    aws_access_key_id='admin',
    aws_secret_access_key='password123'
)

def load_data():
    try:
        obj = s3.get_object(Bucket='curated-data', Key='final_features_job_market_latest.csv')
        df = pd.read_csv(io.StringIO(obj['Body'].read().decode('utf-8')), dtype=str)
        return df.fillna("")
    except Exception as e:
        print(f"💥 Erreur MinIO : {e}")
        return pd.DataFrame()

# --- 2. FONCTION D'EVALUATION ---
def evaluate_model(predictions, actual_relevant_title):
    titles = predictions['job_title'].tolist()
    
    for i, title in enumerate(titles):
       
        t1 = str(title).strip().lower()
        t2 = str(actual_relevant_title).strip().lower()
        
        if t1 == t2 or t2 in t1 or t1 in t2:
            return 1 / (i + 1)
    return 0
# --- 3. INITIALISATION ---
MODEL_PATH = "./model_final"
df_reel = load_data()

if df_reel.empty:
    print("❌ Données vides. Arrêt.")
    sys.exit()

# Recréer la colonne combined_features pour le matcher

df_reel['combined_features'] = (
    "JOB: " + df_reel['job_title'].astype(str) + " " + 
    "JOB: " + df_reel['job_title'].astype(str) + 
    " | EXPERIENCE: " + df_reel['experience_level'].astype(str) + 
    " | SKILLS: " + df_reel['skills'].astype(str) + 
    " | DESC: " + df_reel['description'].astype(str)
).str.lower()

# Charger le Matcher avec le modèle déjà entraîné
matcher = JobMatcher(model_path=MODEL_PATH)

print("⏳ Encodage du corpus pour l'évaluation...")
matcher.precompute_corpus(df_reel['combined_features'].tolist())

# --- 4. JEU DE TEST (GROUND TRUTH) ---

test_cases = [
    
    {"query": "python developer backend software engineer freelance", "expected": "Data Engineer Python - Freelance"},
    {"query": "data scientist ai artificial intelligence generative", "expected": "Data Scientist Ia Générative (It)"},
    {"query": "ml engineer machine learning researcher computer vision", "expected": "Data Scientist - Machine Learning"}
]

# --- 5. EXECUTION ---
print("\n" + "="*40)
print("📊 RÉSULTATS DE L'ÉVALUATION (MRR)")
print("="*40)

scores = []
for case in test_cases:
    # On formate la query pour qu'elle ressemble à ce que le modèle a appris
    formatted_query = f"JOB: {case['query']} JOB: {case['query']}"
    
    # On cherche dans le Top 10
    predictions, _ = matcher.match(formatted_query, df_reel, top_k=10)
    
    score = evaluate_model(predictions, case['expected'])
    scores.append(score)
    
    print(f"🔍 Query: {case['query']}")
    print(f"🎯 Attendu: {case['expected']}")
    print(f"🏆 Score: {score:.4f}")
    print("-" * 20)

final_mrr = sum(scores) / len(scores)
print(f"\n✅ MEAN RECIPROCAL RANK (MRR) TOTAL : {final_mrr:.4f}")
print("="*40)