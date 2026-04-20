import pandas as pd
import re

class FeatureEngineer:
    def __init__(self):
        # List of critical technical skills for Data domains
        self.skills_dict = {
            "python": r"\b(python)\b",
            "sql": r"\b(sql|mysql|postgresql)\b",
            "r": r"\b(R)\b(?![\w])", # standalone R
            "java": r"\b(java)\b",
            "scala": r"\b(scala)\b",
            "aws": r"\b(aws|amazon web services)\b",
            "azure": r"\b(azure)\b",
            "gcp": r"\b(gcp|google cloud)\b",
            "spark": r"\b(spark|pyspark)\b",
            "kafka": r"\b(kafka)\b",
            "hadoop": r"\b(hadoop)\b",
            "tableau": r"\b(tableau)\b",
            "powerbi": r"\b(power[\s-]?bi)\b",
            "docker": r"\b(docker)\b",
            "kubernetes": r"\b(kubernetes|k8s)\b",
            "airflow": r"\b(airflow)\b",
            "machine_learning": r"\b(machine learning|ml)\b",
            "deep_learning": r"\b(deep learning|dl|tensorflow|pytorch|keras)\b"
        }
        
    def extract_features(self, df):
        """Engineers new columns based on title and description"""
        if df.empty:
            return df
            
        print(" [FEATURE ENGINEERING] Extraction of skills and experience...")
        
        # Ensure description is string
        df["description"] = df["description"].fillna("").astype(str)
        df["job_title"] = df["job_title"].fillna("").astype(str)
        
        # 1. Combine title and desc for text search
        full_text = (df["job_title"] + " " + df["description"]).str.lower()
        
        # 2. Extract technical skills as a list
        df["skills"] = full_text.apply(self._extract_skills)
        
        # 3. Determine Experience Level (Junior, Mid, Senior)
        df["experience_level"] = full_text.apply(self._extract_experience)
        
        # 4. Extract Contract Type
        df["contract_type"] = full_text.apply(self._extract_contract)

        return df

    def _extract_skills(self, text):
        found_skills = []
        for skill_name, pattern in self.skills_dict.items():
            if re.search(pattern, text):
                found_skills.append(skill_name)
        return ",".join(found_skills)

    def _extract_experience(self, text):
        if re.search(r"\b(junior|d�butant|junior|0-2 ans|debutant|entry level)\b", text):
            return "Junior"
        elif re.search(r"\b(senior|s�nior|lead|expert|principal|manager|5\+ ans|5 ans)\b", text):
            return "Senior"
        return "Mid/Unspecified"

    def _extract_contract(self, text):
        if re.search(r"\b(cdi|permanent|plein temps)\b", text):
            return "CDI / Permanent"
        elif re.search(r"\b(freelance|ind�pendant|independant|contractor)\b", text):
            return "Freelance / Contract"
        elif re.search(r"\b(cdd|temporary|temporaire)\b", text):
            return "CDD / Temporary"
        elif re.search(r"\b(stage|internship|intern)\b", text):
            return "Stage / Internship"
        elif re.search(r"\b(alternance|apprentissage|apprenticeship)\b", text):
            return "Alternance"
        return "Unspecified"

