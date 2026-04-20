import requests
import time
import json
from scraping.settings import API_KEYS, API_ENDPOINTS

def fetch_jooble_jobs(keyword="data", location="France", target_count=2500):
    key = API_KEYS["jooble"]["api_key"]
    url = f"{API_ENDPOINTS['jooble']}{key}"

    all_jobs = []
    page = 1
    
    print(f"🚀 [JOOBLE] Démarrage du scraping pour {target_count} offres...")

    while len(all_jobs) < target_count:
        body = {
            "keywords": keyword,
            "location": location,
            "page": page
        }

        try:
            response = requests.post(url, json=body)
            response.raise_for_status()
            data = response.json()
            jobs = data.get('jobs', [])
            
            if not jobs:
                print(f"⚠️ [JOOBLE] Plus de résultats trouvés à la page {page}.")
                break
                
            all_jobs.extend(jobs)
            print(f"✅ [JOOBLE] Page {page} récupérée. Total: {len(all_jobs)}/{target_count}")
            
            page += 1
            time.sleep(1) # Pause API rate limit
            
        except Exception as e:
            print(f"❌ Erreur Jooble (page {page}): {e}")
            break
            
    return all_jobs[:target_count]