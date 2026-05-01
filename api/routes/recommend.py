from fastapi import APIRouter, HTTPException, Query
from api.services.recommendation_service import recommender
from typing import List, Dict, Any

router = APIRouter(
    tags=["Recommendations"]
)

@router.on_event("startup")
def load_ml_model():
    """ Load the data and precompute the vectors once when the server starts up. """
    success = recommender.load_data()
    if not success:
        print("Warning: Recommendation model failed to load. Will return empty results initially.")

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