from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
import logging

from database.users_session import get_users_db
from database.db_session import get_db
from database.users_models import User, UserFavorite
from database.models import FactJobs
from api.schemas.job_schema import JobResponse
from api.schemas.favorites_schema import FavoriteCreate, FavoriteResponse
from api.routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[JobResponse])
def get_favorites(
    current_user: User = Depends(get_current_user), 
    users_db: Session = Depends(get_users_db), # Connexion Base A (Users)
    jobs_db: Session = Depends(get_db)         # Connexion Base B (Jobs/DW)
):
    # ÉTAPE 1 : Récupérer les IDs des favoris dans la Base A
    favorites_raw = users_db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.id
    ).all()
    
    # Extraire juste les IDs : [1, 5, 12]
    job_ids = [fav.job_id for fav in favorites_raw]

    if not job_ids:
        return []

    # ÉTAPE 2 : Aller chercher les détails complets dans la Base B
    # C'est ici que tu récupères title, company_name, city, etc.
    jobs_complets = jobs_db.query(FactJobs).options(
        joinedload(FactJobs.company), # Charge l'objet company
        joinedload(FactJobs.location) # Charge l'objet location
    ).filter(
        FactJobs.job_id.in_(job_ids)  # Filtre par les IDs de la Base A
    ).all()

    print(f"DEBUG -> IDs cherchés: {job_ids}")
    print(f"DEBUG -> Nombre de jobs trouvés dans Base B: {len(jobs_complets)}")
    if jobs_complets:
        print(f"DEBUG -> Premier job trouvé: {jobs_complets[0].title}")

    # ÉTAPE 3 : Retourner les objets enrichis
    return jobs_complets

@router.post("/", response_model=FavoriteResponse)
def add_favorite(fav: FavoriteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_users_db)):
    logger.info(f"➕ Ajout du favori - User: {current_user.email}, Job ID: {fav.job_id}")
    db_fav = UserFavorite(user_id=current_user.id, job_id=fav.job_id)
    db.add(db_fav)
    db.commit()
    db.refresh(db_fav)
    logger.info(f"✅ Favori ajouté avec succès")
    return db_fav

@router.delete("/{job_id}")
def remove_favorite(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_users_db)):
    logger.info(f"➖ Suppression du favori - User: {current_user.email}, Job ID: {job_id}")
    db_fav = db.query(UserFavorite).filter(UserFavorite.user_id == current_user.id, UserFavorite.job_id == job_id).first()
    if not db_fav:
        logger.warning(f"⚠️ Favori non trouvé")
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(db_fav)
    db.commit()
    logger.info(f"✅ Favori supprimé avec succès")
    return {"message": "Favorite removed"}