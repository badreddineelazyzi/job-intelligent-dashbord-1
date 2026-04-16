import requests
import time
from bs4 import BeautifulSoup
from scraping.settings import SCRAPING_SETTINGS

def scrape_linkedin(keyword="data", location="France", target_count=400):
    all_jobs = []
    start = 0
    
    print(f"🚀 [LINKEDIN] Démarrage du scraping pour {target_count} offres...")

    while len(all_jobs) < target_count:
        # Utilisation du paramètre `start` pour la pagination LinkedIn (pas de 25)
        url = f"https://www.linkedin.com/jobs/search/?keywords={keyword}&location={location}&start={start}"

        try:
            response = requests.get(url, headers=SCRAPING_SETTINGS["headers"], timeout=10)
            response.encoding = 'utf-8' # Force l'UTF-8 pour les accents français
            soup = BeautifulSoup(response.text, 'html.parser')

            # Sélecteur typique pour les cartes d'emploi LinkedIn
            cards = soup.find_all('div', class_='base-search-card__info')
            
            if not cards:
                print(f"⚠️ [LINKEDIN] Plus de résultats ou blocage à l'offset {start}.")
                break
            
            for card in cards:
                try:
                    job = {
                        "title": card.find('h3', class_='base-search-card__title').text.strip(),
                        "company": card.find('h4', class_='base-search-card__subtitle').text.strip(),
                        "location": card.find('span', class_='job-search-card__location').text.strip(),
                        "link": card.parent.find('a', class_='base-card__full-link')['href']
                    }
                    all_jobs.append(job)
                except AttributeError:
                    continue # Ignore les cartes mal formatées
            
            print(f"✅ [LINKEDIN] Pagination: {len(all_jobs)}/{target_count} offres récupérées...")
            start += 25
            
            # Attente pour éviter le blocage IP
            time.sleep(SCRAPING_SETTINGS.get("delay", 2))
            
        except Exception as e:
            print(f"❌ Erreur LinkedIn Spider à l'offset {start}: {e}")
            break
            
    return all_jobs[:target_count]