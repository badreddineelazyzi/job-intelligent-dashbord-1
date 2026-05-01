from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from api.schemas.search_history_schema import SearchHistoryResponse, SearchHistoryCreate # Ajoute l'import du schéma
from database.users_session import get_users_db
from database.users_models import User, SearchHistory
from api.routes.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=list[SearchHistoryResponse])
def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_users_db)):
    return db.query(SearchHistory).filter(
        SearchHistory.user_id == current_user.id
    ).order_by(SearchHistory.created_at.desc()).all()

# --- AJOUTE CETTE ROUTE POUR FIXER L'ERREUR 405 ---
@router.post("/", status_code=status.HTTP_201_CREATED)
def add_to_history(
    search_data: SearchHistoryCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_users_db)
):
    new_entry = SearchHistory(
        user_id=current_user.id,
        query=search_data.query_text, # On mappe 'query_text' du Pydantic vers 'query' du SQL
        results_count=0 # Tu peux passer une valeur par défaut ou la calculer
    )
    
    try:
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        return {"message": "Recherche enregistrée"}
    except Exception as e:
        db.rollback()
        print(f"Erreur DB: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'insertion")