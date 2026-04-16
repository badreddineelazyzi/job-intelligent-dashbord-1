import requests
import time
from scraping.settings import API_KEYS, API_ENDPOINTS

def fetch_adzuna_jobs(keyword="data", location="France", target_count=2500):
    conf = API_KEYS["adzuna"]
    
    all_jobs = []
    page = 1
    results_per_page = 50  # Maximum per page for Adzuna
    
    print(f"🚀 [ADZUNA] Démarrage du scraping pour {target_count} offres...")
    
    while len(all_jobs) < target_count:
        # L'endpoint d'Adzuna inclut le numéro de page dans l'URL
        url = API_ENDPOINTS.get("adzuna", "https://api.adzuna.com/v1/api/jobs/fr/search/1").replace("/1", f"/{page}")
        
        params = {
            "app_id": conf["app_id"],
            "app_key": conf["app_key"],
            "what": keyword,
            "where": location,
            "results_per_page": results_per_page,
            "content-type": "application/json"
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            results = data.get('results', [])
            
            if not results:
                print(f"⚠️ [ADZUNA] Plus de résultats trouvés à la page {page}.")
                break
                
            all_jobs.extend(results)
            print(f"✅ [ADZUNA] Page {page} récupérée. Total: {len(all_jobs)}/{target_count}")
            
            page += 1
            time.sleep(1) # Pause pour respecter le rate limiting de l'API
            
            if len(results) < results_per_page:
                break # Dernière page atteinte
                
        except Exception as e:
            print(f"❌ Erreur Adzuna (page {page}): {e}")
            break
            
    return all_jobs[:target_count]