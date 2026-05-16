import pandas as pd
import os

class JobNormalizer:
    def __init__(self):
        self.standard_columns = [
            'job_title', 'company', 'location', 'source', 
            'url', 'description', 'date_extracted',
            'salary_min', 'salary_max', 'salary_text', 'category'
        ]

    def normalize(self, raw_data):
        """Méthode principale pour le JSON (Scraping)"""
        all_jobs = []
        extraction_date = raw_data.get("metadata", {}).get("date", "N/A")
        jobs_dict = raw_data.get("jobs", {})

        for source, jobs in jobs_dict.items():
            if not isinstance(jobs, list): continue
            for item in jobs:
                all_jobs.append({
                    'job_title': item.get('title', 'N/A'),
                    'company': self._extract_company(item, source),
                    'location': self._extract_location(item, source),
                    'source': source,
                    'url': item.get('link') or item.get('url') or item.get('redirect_url'),
                    'description': item.get('description') or item.get('snippet') or "",
                    'date_extracted': extraction_date,
                    # Preserve salary-related fields when available from source payloads
                    'salary_min': item.get('salary_min') or item.get('min_salary') or item.get('salaryFrom') or 0,
                    'salary_max': item.get('salary_max') or item.get('max_salary') or item.get('salaryTo') or 0,
                    'salary_text': item.get('salary') or item.get('salary_range') or item.get('compensation') or item.get('salaryEstimate') or "",
                    'category': item.get('category') or item.get('job_type') or item.get('role') or ""
                })
        return pd.DataFrame(all_jobs)

    def normalize_dataset(self, df, source_name):
        """Méthode pour normaliser un DataFrame issu d'un CSV (Datasets)"""
        df_norm = pd.DataFrame()
        # Mapping flexible pour s'adapter à tes différents CSV
        df_norm['job_title'] = df.get('job_title') or df.get('title') or df.get('Poste')
        df_norm['company'] = df.get('company') or df.get('entreprise') or df.get('Entreprise')
        df_norm['location'] = df.get('location') or df.get('ville') or "Maroc"
        df_norm['source'] = source_name
        df_norm['url'] = df.get('url') or df.get('link') or "N/A"
        df_norm['description'] = df.get('description') or ""
        df_norm['date_extracted'] = "Dataset_Reference"
        # Salary/category columns preserved for downstream export to DW
        df_norm['salary_min'] = df.get('salary_min') or df.get('min_salary') or 0
        df_norm['salary_max'] = df.get('salary_max') or df.get('max_salary') or 0
        df_norm['salary_text'] = (
            df.get('salary')
            or df.get('salary_range')
            or df.get('compensation')
            or df.get('Salary Estimate')
            or ""
        )
        df_norm['category'] = df.get('category') or df.get('job_category') or ""
        
        # On s'assure que toutes les colonnes standard sont présentes
        for col in self.standard_columns:
            if col not in df_norm.columns:
                df_norm[col] = "N/A"
                
        return df_norm[self.standard_columns]

    def _extract_company(self, item, source):
        if source == "adzuna" and isinstance(item.get('company'), dict):
            return item.get('company', {}).get('display_name', 'N/A')
        return item.get('company', 'N/A')

    def _extract_location(self, item, source):
        if source == "adzuna" and isinstance(item.get('location'), dict):
            return item.get('location', {}).get('display_name', 'N/A')
        return item.get('location', 'N/A')