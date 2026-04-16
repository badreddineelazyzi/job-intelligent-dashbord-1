import requests
import time
from bs4 import BeautifulSoup
from scraping.settings import SCRAPING_SETTINGS

def scrape_rekrute(keyword="data", location="Maroc", target_count=400):
    print(f"🚀 [REKRUTE] Démarrage du scraping pour {target_count} offres...")
    # Construction de l'URL
    base_url = f"https://www.rekrute.com/offres.html?s=1&st=1&keyword={keyword}" 
    
    all_jobs = []
    page = 1
    
    try:
        while len(all_jobs) < target_count:
            url = f"{base_url}&p={page}"
            response = requests.get(url, headers=SCRAPING_SETTINGS["headers"])
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')
            
            job_listings = soup.find_all('li', class_='post-id')
            
            if not job_listings:
                # No more jobs found on this page
                break
                
            for item in job_listings:
                company_img = item.find('img')
                company_str = company_img['alt'] if company_img and 'alt' in company_img.attrs else "N/A"
                
                link_tag = item.find('a')
                link = "https://www.rekrute.com" + link_tag['href'] if link_tag and 'href' in link_tag.attrs else "N/A"
                
                title_tag = item.find('h2')
                job = {
                    "title": title_tag.text.strip() if title_tag else "N/A",
                    "company": company_str,
                    "link": link
                }
                all_jobs.append(job)
                
            page += 1
            print(f"✅ [REKRUTE] Page {page-1} récupérée. Total actuel: {len(all_jobs)}/{target_count}")
            time.sleep(1) # Be gentle to the server
            
        return all_jobs[:target_count]
    except Exception as e:
        print(f"Erreur Rekrute Spider: {e}")
        return all_jobs