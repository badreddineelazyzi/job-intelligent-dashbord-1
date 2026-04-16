import pandas as pd
import re

class JobCleaner:
    def __init__(self):
        # Mots-clés pour valider que loffre est bien dans le domaine Data     
        self.data_keywords = [
            "data", "donnée", "données", "analyst", "scientist", "engineer", "ingénieur", "ingénieure", "ingenieur",
            "intelligence artificielle", "ia", "ai", "bi", "business intelligence",
            "machine learning", "python", "sql", "statist", "big data"
        ]
        
        # Dictionnaire pour standardiser les titres d emploi (Normalisation métier)
        self.title_mapping = {
            r".*(data\s*engineer|ingénieur\s*data|ingénieure\s*data|data\s*ingénieur|big\s*data\s*engineer).*": "Data Engineer",
            r".*(data\s*scientist|scientifique\s*de\s*données|machine\s*learning|ia|intelligence\s*artificielle).*": "Data Scientist",
            r".*(data\s*analyst|analyste\s*de\s*données|analyste\s*data).*": "Data Analyst",
            r".*(business\s*intelligence|bi\s*analyst|consultant\s*bi).*": "BI / Business Intelligence",
            r".*(architecte\s*data|data\s*architect).*": "Data Architect"
        }

    def clean(self, df):
        """Lance tout le processus de nettoyage sur le DataFrame"""
        if df.empty:
            print("⚠️ DataFrame vide, rien à nettoyer.")
            return df

        initial_count = len(df)

        # 1. Suppression des doublons (Titre + Entreprise)
        # On garde la première occurrence (souvent la source la plus fraîche) 
        df = df.drop_duplicates(subset=["job_title", "company"], keep="first")  

        # 2. Nettoyage des colonnes texte via un vrai processus
        df["job_title"] = df["job_title"].astype(str).apply(self._clean_string)
        df["company"] = df["company"].astype(str).apply(self._clean_string)
        df["location"] = df["location"].astype(str).apply(self._clean_string)

        # 3. Filtrage par pertinence (Data Only)
        mask = df["job_title"].str.contains("|".join(self.data_keywords), case=False, na=False, regex=True)
        df = df[mask].copy()

        # 4. Standardisation des Titres
        df["standard_title"] = df["job_title"].apply(self._standardize_title)

        # 5. Gestion des valeurs manquantes
        df["description"] = df["description"].fillna("Pas de description disponible")
        df["url"] = df["url"].fillna("#")

        # 6. Harmonisation de la casse
        df["job_title"] = df["job_title"].str.title()
        df["company"] = df["company"].str.upper()

        final_count = len(df)
        print(f"🧹 Nettoyage terminé : {initial_count} -> {final_count} offres conservées.")

        return df

    def _clean_string(self, text):
        """Nettoie une chaîne de caractères : HTML, espaces, caractères spéciaux"""
        if pd.isna(text) or text == "N/A" or text == "nan":
            return "Non spécifié"

        text = re.sub(r"<.*?>", "", text)
        # Supprimer les caractères bizarres mais garder les lettres et accents (é, à, è...)
        text = re.sub(r"[^\w\s\-\.\(\)\/éèêàâäîïôöùç]", "", text)
        text = " ".join(text.split())

        return text.strip()

    def _standardize_title(self, title):
        """Associe un titre brut à une catégorie métier standard (Data Engineer, Data Analyst, etc.)"""
        title_lower = title.lower()
        for pattern, standard_name in self.title_mapping.items():
            if re.match(pattern, title_lower):
                return standard_name
        return "Other Data Role"

