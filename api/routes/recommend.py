# api/routes/recommend.py

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from api.services.recommendation_service import recommender
from api.routes.auth import get_current_user
from database.db_session import get_db

router = APIRouter(tags=["Recommendations"])

# ═══════════════════════════════════════════════════════════
# CHARGEMENT DU MODÈLE (IMPORTANT)
# ═══════════════════════════════════════════════════════════

import asyncio

@router.on_event("startup")
async def load_ml_model():
    """ Charge les données et précalcule les vecteurs au démarrage (en tâche de fond) """
    def background_load():
        success = recommender.load_data()
        if not success:
            print("❌ Erreur: Le modèle de recommandation n'a pas pu charger les données.")
            
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, background_load)


# ═══════════════════════════════════════════════════════════
# MODÈLES
# ═══════════════════════════════════════════════════════════

class ProfileMatchingRequest(BaseModel):
    title: Optional[str] = None
    skills: Optional[List[str]] = None
    location: Optional[str] = None
    experience_years: Optional[int] = None
    salary_min: Optional[int] = None
    remote_preference: Optional[str] = None

class CvMatchingRequest(BaseModel):
    cv_text: str


# ═══════════════════════════════════════════════════════════
# 1. ANCIEN ENDPOINT — Recherche libre (GET)
# ═══════════════════════════════════════════════════════════

@router.get("/")
def get_recommendations(query: str = Query(..., description="E.g. Python Data Engineer, Azure, Remote")):
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Cannot recommend jobs for an empty query")
            
        results = recommender.recommend(query)
        if "error" in results:
            raise HTTPException(status_code=503, detail=results["error"])
            
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════
# 2. NOUVEAU — Matching par profil utilisateur (POST)
# ═══════════════════════════════════════════════════════════

@router.post("/profile/")
def match_by_profile(
    request: ProfileMatchingRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Matching basé sur le profil utilisateur.
    Vérifie si le profil est complet, sinon guide l'utilisateur.
    """
    # Vérifier si le profil est suffisamment complet
    required_fields = ['title', 'skills', 'location']
    missing = [f for f in required_fields if not getattr(request, f)]
    
    if missing:
        return {
            "status": "incomplete_profile",
            "missing_fields": missing,
            "message": f"Profil incomplet. Champs manquants: {', '.join(missing)}",
            "results": []
        }
    
    # Construire la requête NLP à partir du profil
    query_parts = [request.title]
    if request.skills:
        query_parts.extend(request.skills[:5])  # Top 5 skills
    if request.location:
        query_parts.append(request.location)
    if request.remote_preference:
        query_parts.append(request.remote_preference)
    
    query = " ".join(filter(None, query_parts))
    
    results = recommender.recommend(query)
    print(f"📝 Recommender returned {len(results.get('recommendations', []))} jobs")
    
    # Post-filtrage par salaire et expérience + TRI
    filtered_results = post_filter_results(results, request)
    print(f"📤 Returning {len(filtered_results.get('recommendations', []))} filtered jobs")
    
    return {
        "status": "success",
        "query_used": query,
        "results_count": len(filtered_results.get("recommendations", [])),
        "results": filtered_results  # ✅ Retourne les résultats triés et filtrés
    }


# ═══════════════════════════════════════════════════════════
# 3. NOUVEAU — Matching par CV (NLP) (POST)
# ═══════════════════════════════════════════════════════════

@router.post("/cv/")
def match_by_cv(
    request: CvMatchingRequest,
    current_user=Depends(get_current_user)
):
    """
    Matching basé sur le texte extrait du CV.
    Le CV doit être parsé et envoyé comme texte brut.
    """
    if not request.cv_text or len(request.cv_text.strip()) < 50:
        raise HTTPException(
            status_code=400, 
            detail="CV text too short or empty. Please upload a valid CV."
        )
    
    # Le NLP recommender travaille directement sur le texte du CV
    results = recommender.recommend(request.cv_text)
    
    # Trier les résultats par score de matching (décroissant)
    if results.get("recommendations"):
        results["recommendations"].sort(key=lambda x: x.get("match_score", 0), reverse=True)
    
    return {
        "status": "success",
        "query_used": "cv_parsed_text",
        "results_count": len(results.get("recommendations", [])),
        "results": results
    }


# ═══════════════════════════════════════════════════════════
# HELPER — Post-filtrage des résultats
# ═══════════════════════════════════════════════════════════

def post_filter_results(results, request):
    """Filtre et re-score les résultats par critères durs."""
    # ✅ Accéder à la bonne clé: "recommendations" pas "results"
    jobs = results.get("recommendations", [])
    print(f"🔍 post_filter_results: {len(jobs)} jobs avant filtrage")
    
    filtered = []
    
    for job in jobs:
        score = job.get("match_score", 0)
        original_score = score
        
        # ❌ PÉNALITÉ SALAIRE SUPPRIMÉE : tous les salaires sont 0 dans la base
        
        # Boost si localisation match
        if request.location and request.location.lower() in job.get("location", "").lower():
            score += 10
        
        # Boost si remote match
        if request.remote_preference == "remote" and job.get("is_remote"):
            score += 15
        
        job["match_score"] = min(score, 100)
        filtered.append(job)
    
    # Trier par score décroissant
    filtered.sort(key=lambda x: x["match_score"], reverse=True)
    
    print(f"✅ post_filter_results: {len(filtered)} jobs après filtrage et tri")
    print(f"📊 Top 3 scores: {[j.get('match_score', 0) for j in filtered[:3]]}")
    
    # Retourner la même structure que l'original mais avec recommandations triées/filtrées
    return {
        "query": results.get("query", ""),
        "detected_skills": results.get("detected_skills", []),
        "recommendations": filtered
    }