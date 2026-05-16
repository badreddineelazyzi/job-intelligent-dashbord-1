import os
import sys
import pandas as pd
import boto3
import logging
import re
import ast
from io import BytesIO
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Configuration du PATH pour importer 'database'
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from database.db_session import engine
from database.models import Base, FactJobs, DimCompany, DimLocation, DimTime, DimCategory, DimSkills

# Configuration Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Configuration MinIO
MINIO_URL = os.getenv("MINIO_ENDPOINT_URL", "http://localhost:9000")
s3_client = boto3.client('s3', endpoint_url=MINIO_URL, aws_access_key_id='admin', aws_secret_access_key='password123')

def get_or_create(session, model, **kwargs):
    """Vérifie si une entrée existe en DB, sinon la crée et retourne l'objet."""
    instance = session.query(model).filter_by(**kwargs).first()
    if not instance:
        instance = model(**kwargs)
        session.add(instance)
        session.flush()  # Pour récupérer l'ID immédiatement
    return instance


def normalize_category(raw_value):
    """Normalize category values from strings/dicts to a clean label."""
    if raw_value is None or (isinstance(raw_value, float) and pd.isna(raw_value)):
        return ""

    # Already a dict-like object (can happen before CSV serialization)
    if isinstance(raw_value, dict):
        return str(raw_value.get('label') or raw_value.get('tag') or '').strip()

    text = str(raw_value).strip()
    if not text:
        return ""

    # Try parsing stringified dicts: {'tag': 'it-jobs', 'label': 'Emplois Informatique', ...}
    if text.startswith('{') and text.endswith('}'):
        try:
            parsed = ast.literal_eval(text)
            if isinstance(parsed, dict):
                return str(parsed.get('label') or parsed.get('tag') or '').strip()
        except Exception:
            pass

    # Fallback if parsing failed but a label is present in the text
    label_match = re.search(r"['\"]label['\"]\s*:\s*['\"]([^'\"]+)['\"]", text)
    if label_match:
        return label_match.group(1).strip()

    # Fallback if only tag exists
    tag_match = re.search(r"['\"]tag['\"]\s*:\s*['\"]([^'\"]+)['\"]", text)
    if tag_match:
        return tag_match.group(1).strip()

    return text


def is_it_category(category_name):
    """Return True if category looks IT/Data related."""
    if not category_name:
        return False
    txt = str(category_name).lower()
    it_keywords = [
        'it', 'informatique', 'data', 'software', 'developer', 'devops',
        'cloud', 'ai', 'machine learning', 'cyber', 'security', 'bi',
        'analytics', 'engineering', 'ingenierie', 'intelligence artificielle'
    ]
    return any(k in txt for k in it_keywords)


def infer_it_category(row):
    """Infer an IT-only category from title/description/standard_title."""
    title_text = str(row.get('job_title') or row.get('title') or '')
    desc_text = str(row.get('description') or '')
    std_text = str(row.get('standard_title') or '')
    look = (title_text + ' ' + desc_text + ' ' + std_text).lower()

    if 'data scientist' in look or 'data science' in look:
        return 'Data Science'
    if 'data engineer' in look or 'data engineering' in look:
        return 'Data Engineering'
    if 'data analyst' in look or 'analyst' in look:
        return 'Data Analyst'
    if 'bi' in look or 'business intelligence' in look:
        return 'Business Intelligence'
    if any(k in look for k in ['developer', 'software engineer', 'devops', 'cloud', 'ai', 'machine learning']):
        return 'IT / Software'
    return 'Uncategorized'

def run_export():
    from database.models import Base
    from database.db_session import engine
    Base.metadata.create_all(bind=engine)
    logging.info("📤 [EXPORT PIPELINE] Début de l'export vers PostgreSQL...")
    
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # --- ÉTAPE 1 : RECHERCHE DYNAMIQUE DU DERNIER FICHIER CURATED ---
        logging.info("🔍 Recherche du dernier fichier dans 'curated-data'...")
        response = s3_client.list_objects_v2(Bucket="curated-data")
        
        if 'Contents' not in response:
            logging.error("❌ Aucun fichier trouvé dans le bucket 'curated-data'.")
            return

        # Sélection du fichier le plus récent basé sur la date de modification
        latest_file = max(response['Contents'], key=lambda x: x['LastModified'])
        file_key = latest_file['Key']
        
        logging.info(f"📄 Chargement du fichier : {file_key} ({latest_file['LastModified']})")
        
        obj = s3_client.get_object(Bucket="curated-data", Key=file_key)
        df = pd.read_csv(BytesIO(obj['Body'].read()))
        
        logging.info(f"✅ CSV chargé : {len(df)} lignes à traiter.")

        for _, row in df.iterrows():
            # 2. Gérer les Dimensions
            # On utilise .get() pour éviter que le script crash si une colonne manque
            company_name = row.get('company') or row.get('company_name') or "Inconnu"
            location_name = row.get('location') or row.get('city') or "France"
            
            company = get_or_create(session, DimCompany, company_name=str(company_name))
            location = get_or_create(session, DimLocation, city=str(location_name), country="France")

            # Determine category: keep only IT/Data categories.
            raw_category = row.get('category') or row.get('job_category') or row.get('category_name') or row.get('standard_title') or ''
            raw_category = normalize_category(raw_category)
            if raw_category and is_it_category(raw_category):
                chosen_category = raw_category
            else:
                chosen_category = infer_it_category(row)

            category = get_or_create(session, DimCategory, category_name=chosen_category)
            
            job_date = datetime.now()
            time_dim = get_or_create(session, DimTime, 
                                     date=job_date.date(),
                                     day=job_date.day, 
                                     month=job_date.month, 
                                     year=job_date.year)

            # 3. Créer ou mettre à jour le Fait (FactJobs)
            def parse_salary_text(s):
                try:
                    if s is None or (isinstance(s, float) and pd.isna(s)):
                        return (0, 0)
                    text = str(s)
                    # Replace common k/K markers (e.g. 50k -> 50000)
                    text = re.sub(r"(\d+)k\b", lambda m: str(int(m.group(1)) * 1000), text, flags=re.IGNORECASE)
                    nums = re.findall(r"\d+[\,\d]*", text)
                    nums = [int(n.replace(',', '')) for n in nums]
                    if len(nums) >= 2:
                        return (nums[0], nums[1])
                    if len(nums) == 1:
                        return (nums[0], nums[0])
                except Exception:
                    pass
                return (0, 0)

            def safe_num(v):
                if v is None or v == '' or pd.isna(v):
                    return 0
                try:
                    return float(v)
                except Exception:
                    return 0

            raw_min = row.get('salary_min')
            raw_max = row.get('salary_max')
            salary_min = safe_num(raw_min)
            salary_max = safe_num(raw_max)

            if (not salary_min and not salary_max):
                raw_salary = row.get('salary') or row.get('salary_range') or row.get('compensation') or row.get('salary_text')
                s_min, s_max = parse_salary_text(raw_salary)
                salary_min = s_min
                salary_max = s_max

            exists = session.query(FactJobs).filter_by(url=row.get('url')).first()
            if not exists:
                new_job = FactJobs(
                    title=row.get('job_title') or row.get('title'),
                    description=row.get('description', ''),
                    salary_min=salary_min,
                    salary_max=salary_max,
                    experience_level=row.get('experience_level'),
                    contract_type=row.get('contract_type'),
                    source=row.get('source', 'unknown'),
                    url=row.get('url'),
                    company_id=company.company_id,
                    location_id=location.location_id,
                    category_id=category.category_id,
                    date_id=time_dim.date_id
                )

                # 4. Gérer les Skills
                if 'skills' in row and pd.notna(row['skills']):
                    skill_list = str(row['skills']).split(',')
                    for s in skill_list:
                        skill_name = s.strip()
                        if skill_name:
                            skill_obj = get_or_create(session, DimSkills, skill_name=skill_name)
                            new_job.skills.append(skill_obj)

                session.add(new_job)
            else:
                # Update existing rows when better values are available
                changed = False
                if (exists.salary_min is None or exists.salary_min == 0) and salary_min:
                    exists.salary_min = salary_min
                    changed = True
                if (exists.salary_max is None or exists.salary_max == 0) and salary_max:
                    exists.salary_max = salary_max
                    changed = True
                if (exists.category_id is None) and category.category_id:
                    exists.category_id = category.category_id
                    changed = True
                elif category.category_name and category.category_name != 'Uncategorized':
                    # Upgrade category if existing one is empty/non-IT/uncategorized.
                    existing_category = session.query(DimCategory).filter_by(category_id=exists.category_id).first()
                    if existing_category and (
                        existing_category.category_name == 'Uncategorized'
                        or not is_it_category(existing_category.category_name)
                    ):
                        exists.category_id = category.category_id
                        changed = True
                if changed:
                    session.add(exists)

        session.commit()
        logging.info("✨ [SUCCESS] Données exportées avec succès dans le schéma en étoile !")

    except Exception as e:
        session.rollback()
        logging.error(f"❌ Erreur lors de l'export : {e}")
    finally:
        session.close()

if __name__ == "__main__":
    run_export()