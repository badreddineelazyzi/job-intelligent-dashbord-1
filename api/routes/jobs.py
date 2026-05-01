from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database.db_session import get_db
from database.models import FactJobs, DimCompany, DimLocation, DimSkills
from api.schemas.job_schema import PaginatedJobsResponse, JobResponse

router = APIRouter(
    tags=["Jobs"]
)

@router.get("/", response_model=PaginatedJobsResponse)
def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = None,
    # --- Nouveaux paramètres de filtres ---
    location: Optional[str] = None,
    contract_type: Optional[str] = None,
    experience: Optional[str] = None,
    # --------------------------------------
    db: Session = Depends(get_db)
):
    try:
        # On commence par une jointure si tes filtres sont dans d'autres tables (ex: DimLocation)
        base_query = db.query(FactJobs)
        
        # 1. Filtre par texte (Recherche)
        if query:
            base_query = base_query.filter(FactJobs.title.ilike(f"%{query}%"))
            
        # 2. Filtre par Localisation
        if location:
            # Si la localisation est dans une table liée DimLocation :
            base_query = base_query.join(DimLocation).filter(DimLocation.city.ilike(f"%{location}%"))
            # Note : Si 'location' est directement dans FactJobs, utilise :
            # base_query = base_query.filter(FactJobs.location.ilike(f"%{location}%"))

        # 3. Filtre par Type de Contrat
        if contract_type:
            base_query = base_query.filter(FactJobs.contract_type == contract_type)

        # 4. Filtre par Expérience
        if experience:
            base_query = base_query.filter(FactJobs.experience_level == experience)
            
        total = base_query.count()
        jobs = base_query.offset(skip).limit(limit).all()
        
        return PaginatedJobsResponse(
            total=total,
            skip=skip,
            limit=limit,
            data=jobs
        )
        
    except Exception as e:
        print(f"Erreur Backend: {str(e)}") # Log pour le debug
        raise HTTPException(status_code=500, detail=str(e))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(FactJobs).filter(FactJobs.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job