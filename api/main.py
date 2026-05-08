import sys
import os
import fitz  # PyMuPDF
import ollama
import json
import re

# Ajoute le dossier parent au path (racine du projet)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from api.middleware.logging_middleware import LoggingMiddleware

app = FastAPI(
    title="Job Intelligence Dashboard API",
    description="API for the Job Recommendation Engine",
    version="1.0.0",
    redirect_slashes=False,
)
app.router.redirect_slashes = True

# --- MIDDLEWARE ---
# Add Logging Middleware
app.add_middleware(LoggingMiddleware)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES ---
from api.routes import auth, jobs, favorites, search_history
from api.routes import recommend

# Inclure les routes
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(recommend.router, prefix="/recommend", tags=["Recommend"])
app.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
app.include_router(search_history.router, prefix="/search-history", tags=["History"])


@app.get("/", tags=["Root"])
def root():
    return {"message": "Welcome to the Job Intelligence Dashboard API. Visit /docs for the Swagger UI."}


# --- IA CV EXTRACTION ENDPOINT ---
@app.post("/extract-cv", tags=["CV Analysis"])
async def extract_cv_data(file: UploadFile = File(...)):
    try:
        # 1. Lire le contenu du fichier PDF
        pdf_content = await file.read()
        text = ""
        with fitz.open(stream=pdf_content, filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
                
        # 2. Prompt pour Llama 3 (Extraction Compétences + Expérience)
        system_prompt = """
        You are an expert IT Recruiter parsing a CV. Read the provided text and extract:
        1. "skills": A list of ALL technical skills (programming languages, tools, frameworks, databases).
        2. "experience_years": The total years of professional experience as a single INTEGER (e.g., 3). If you cannot determine the exact years, estimate based on dates or return 0.
        
        You MUST return ONLY a valid JSON object. Do not add markdown blocks like ```json.
        Example format: {"skills": ["Python", "React", "Docker"], "experience_years": 3}
        """

        # 3. Communiquer avec Ollama (Llama 3 en local) avec format JSON forcé
        response = ollama.chat(model='llama3', messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': f"Here is the CV text:\n{text}"}
        ], format='json')
        
        ai_output = response['message']['content']
        
        # 4. Nettoyer et parser la réponse JSON
        try:
            extracted_data = json.loads(ai_output)
        except json.JSONDecodeError:
            # Au cas où Ollama rajoute du texte même avec format='json'
            match = re.search(r'\{.*\}', ai_output, re.DOTALL)
            clean_json = match.group(0) if match else ai_output
            extracted_data = json.loads(clean_json)

        return {
            "status": "success",
            "data": extracted_data
        }
        
    except Exception as e:
        print(f"Erreur d'extraction CV avec IA: {e}")
        return {
            "status": "error",
            "message": str(e),
            "data": {"skills": [], "experience_years": 0}
        }

# To run this file:
# uvicorn api.main:app --reload --host 0.0.0.0 --port 8000