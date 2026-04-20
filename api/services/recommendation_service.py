import os
import sys
import pandas as pd
import io
import boto3

# Add path to load recommendation module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from recommendation.matcher import JobMatcher

class RecommendationService:
    def __init__(self):
        self.matcher = None
        self.df_jobs = None
        self.is_ready = False
        
        self.s3 = boto3.client(
            's3', 
            endpoint_url='http://localhost:9000', 
            aws_access_key_id='admin',
            aws_secret_access_key='password123'
        )

    def load_data(self):
        print("📥 Loading data for API Recommendation Engine...")
        try:
            bucket_name = 'curated-data'
            objects = self.s3.list_objects_v2(Bucket=bucket_name, Prefix='final_features_job_market_')
            if 'Contents' not in objects:
                print("❌ No matching files found in MinIO.")
                return False
                
            latest_file = sorted(objects['Contents'], key=lambda obj: obj['LastModified'], reverse=True)[0]
            file_key = latest_file['Key']
            
            obj = self.s3.get_object(Bucket=bucket_name, Key=file_key)
            raw_data = obj['Body'].read().decode('utf-8')
            
            df = pd.read_csv(io.StringIO(raw_data), dtype=str)
            self.df_jobs = df.dropna(subset=['job_title', 'description']).fillna("")
            
            self.df_jobs['combined_features'] = (
                "JOB: " + self.df_jobs['job_title'].astype(str) + " " +
                "JOB: " + self.df_jobs['job_title'].astype(str) +
                " | EXPERIENCE: " + self.df_jobs['experience_level'].astype(str) +
                " | SKILLS: " + self.df_jobs['skills'].astype(str) +
                " | DESC: " + self.df_jobs['description'].astype(str)
            ).str.lower()
            
            model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../recommendation/model_final'))
            self.matcher = JobMatcher(model_path=model_path)
            
            corpus_texts = self.df_jobs['combined_features'].tolist()
            self.matcher.precompute_corpus(corpus_texts)
            
            self.is_ready = True
            print("⚡ Recommendation Service ready!")
            return True
            
        except Exception as e:
            print(f"💥 Error loading engine: {e}")
            return False

    def recommend(self, query: str):
        if not self.is_ready or self.matcher is None:
            return {"error": "Recommendation engine not ready"}
            
        results, skills = self.matcher.match(query, self.df_jobs)
        
        # Format the top results into a standard JSON response
        recommendations = []
        if not results.empty:
            for _, row in results.iterrows():
                recommendations.append({
                    "job_title": row.get("job_title", ""),
                    "company": row.get("company", row.get("company_name", row.get("campany", ""))),
                    "match_score": row.get("score", 0),
                    "url": row.get("url", ""),
                    "skills": row.get("skills", "")
                })
        
        return {
            "query": query,
            "detected_skills": skills,
            "recommendations": recommendations
        }

recommender = RecommendationService()