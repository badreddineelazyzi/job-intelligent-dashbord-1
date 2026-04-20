import pandas as pd
import boto3
import json
import io
import os
import sys

# Ajout du chemin pour importer tes modules (recommendation.matcher, etc.)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from recommendation.matcher import JobMatcher
from recommendation.embeddings import EmbeddingManager

# --- CONFIGURATION MINIO ---
s3 = boto3.client('s3', 
    endpoint_url='http://localhost:9000', 
    aws_access_key_id='admin',
    aws_secret_access_key='password123'
)

def load_real_data_from_minio(bucket_name):
    print(f"📥 Lecture du fichier CSV depuis le bucket : {bucket_name}")
    try:
        # Dynamically find the latest CSV file
        objects = s3.list_objects_v2(Bucket=bucket_name, Prefix='final_features_job_market_')
        if 'Contents' not in objects:
            print(f"❌ Aucun fichier trouvé avec le préfixe 'final_features_job_market_' dans {bucket_name}")
            return pd.DataFrame()
            
        # Sort objects by last modified date and get the latest one
        latest_file = sorted(objects['Contents'], key=lambda obj: obj['LastModified'], reverse=True)[0]
        file_key = latest_file['Key']
        print(f"📄 Fichier le plus récent trouvé : {file_key}")
        
        obj = s3.get_object(Bucket=bucket_name, Key=file_key)
        raw_data = obj['Body'].read().decode('utf-8')
        
        # Charger en String pour éviter les erreurs de type (Arrow/Float)
        df = pd.read_csv(io.StringIO(raw_data), dtype=str) 
        
        # Nettoyage des lignes sans titre ou description
        df = df.dropna(subset=['job_title', 'description'])
        print(f"✅ CSV chargé ! {len(df)} offres prêtes.")
        return df
    except Exception as e:
        print(f"💥 Erreur lors du chargement MinIO : {e}")
        return pd.DataFrame()

# --- CONFIGURATION ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model_final")

# --- 1. CHARGEMENT ET PRÉPARATION ---
df_reel = load_real_data_from_minio('curated-data')

if df_reel.empty:
    print("❌ Erreur : Aucune donnée trouvée. Arrêt du script.")
    sys.exit()

# Remplacer les valeurs manquantes (NaN) par du vide pour éviter les erreurs
df_reel = df_reel.fillna("")

# CRÉATION DE LA COLONNE COMBINÉE (Indispensable pour le Matcher et le Training)
print("🛠️ Préparation des features combinées (Title + Skills + Experience + Desc)...")

df_reel['combined_features'] = (
    "JOB: " + df_reel['job_title'].astype(str) + " " + 
    "JOB: " + df_reel['job_title'].astype(str) + 
    " | EXPERIENCE: " + df_reel['experience_level'].astype(str) + 
    " | SKILLS: " + df_reel['skills'].astype(str) + 
    " | DESC: " + df_reel['description'].astype(str)
).str.lower()

# --- 2. ENTRAÎNEMENT DU MODÈLE (Si le dossier n'existe pas) ---
if not os.path.exists(MODEL_PATH):
    print("🧠 Model introuvable. Début du Fine-tuning sur vos données...")
    
    # Préparer les paires pour l'entraînement
    train_pairs = df_reel[['job_title', 'combined_features']].values.tolist()
    # Force le type string pour chaque élément de la liste
    train_pairs = [[str(p[0]), str(p[1])] for p in train_pairs]
    
    trainer = EmbeddingManager()
    trainer.fine_tune(train_pairs, output_path=MODEL_PATH)
    print("✅ Fine-tuning terminé avec succès !")
else:
    print(f"🚀 Model déjà présent dans '{MODEL_PATH}'. On saute l'étape d'entraînement.")

# --- 3. INITIALISATION ET PRÉ-CALCUL (POUR LA RAPIDITÉ) ---
# On charge le Matcher avec le modèle expert
matcher = JobMatcher(model_path=MODEL_PATH)

print("⏳ Encodage du corpus (Pre-computing vectors)...")
corpus_texts = df_reel['combined_features'].tolist()
# On calcule les vecteurs du CSV une seule fois ici
matcher.precompute_corpus(corpus_texts) 
print("⚡ Système prêt et optimisé !")

# --- 4. INTERFACE DE RECHERCHE (BOUCLE INTERACTIVE) ---
print("\n" + "="*50)
print("🔍 BIENVENUE SUR LE MOTEUR DE RECOMMANDATION")
print("Tapez 'quitter' pour arrêter le programme.")
print("="*50)

while True:
    user_query = input("\n👉 Entrez vos mots-clés (Ex: Python Data Engineer, Azure, Remote...) : ")
    
    if user_query.lower() == 'quitter':
        print("Fin du programme. À bientôt ! 👋")
        break
    
    if not user_query.strip():
        print("⚠️ Veuillez entrer au moins un mot-clé.")
        continue

    # Lancement du matching
    # results contiendra les offres triées, skills contiendra ce que spaCy a détecté
    results, skills = matcher.match(user_query, df_reel)
    
    print(f"\n🤖 Analyse NLP : Compétences détectées -> {skills}")
    print(f"🏆 Top 5 des offres correspondantes :")
    print("-" * 60)
    
    if not results.empty:
        
        available_columns = results.columns.tolist()
        
       
        # On cherche 'job_title', 'score' et on essaye de trouver la compagnie
        cols_to_show = ['job_title', 'score']
        
        if 'company' in available_columns:
            cols_to_show.append('company')
        elif 'company_name' in available_columns:
            cols_to_show.append('company_name')
        elif 'campany' in available_columns: 
            cols_to_show.append('campany')

        print(results[cols_to_show].to_string(index=False))
    
    else:
        print("❌ Aucune offre ne semble correspondre à votre recherche.")
    print("-" * 60)