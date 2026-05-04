from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database.db_session import get_db
from database.models import DimCategory, FactJobs, DimCompany, DimLocation, DimSkills
from api.schemas.job_schema import PaginatedJobsResponse, JobResponse
from sqlalchemy import func

router = APIRouter(
    tags=["Jobs"]
)

@router.get("/summary")
def get_stats_summary(db: Session = Depends(get_db)):
    # 1. Nombre total d'offres (total_jobs)
    total_jobs = db.query(FactJobs).count()
    
    # 2. Nombre d'entreprises distinctes (total_companies)
    # On passe par la table de dimension DimCompany
    total_companies = db.query(DimCompany).count()
    
    # 3. Nombre de sources différentes (total_sources)
    # La colonne 'source' est directement dans FactJobs
    total_sources = db.query(func.count(func.distinct(FactJobs.source))).scalar() or 0
    
    # 4. Taux de Match Moyen (avg_match)
    # Si tu n'as pas encore de colonne match_score, on peut simuler 
    # ou compter le nombre moyen de compétences par offre
    avg_match = 85.5  # Valeur statique en attendant ton moteur NLP

    # CRITIQUE : Les clés ici doivent correspondre EXACTEMENT aux 'key' de ton Home.jsx
    return {
        "total_jobs": total_jobs,
        "total_companies": total_companies,
        "avg_match": avg_match,
        "total_sources": total_sources
    }

@router.get("/", response_model=PaginatedJobsResponse)
def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = None,
    location: Optional[str] = None,
    contract_type: Optional[str] = None,
    experience: Optional[str] = None,
    source: Optional[str] = None,
    skills: Optional[str] = None, 
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        # 1. Utiliser base_query de manière dynamique
        base_query = db.query(FactJobs)

        # 2. Filtre par texte - Uniquement si la string n'est pas vide
        if query and query.strip():
            base_query = base_query.filter(FactJobs.title.ilike(f"%{query.strip()}%"))
            
        # 3. Filtre par Localisation (Jointure explicite)
        if location and location.strip():
            # Utilisation de join() sur la relation ou le modèle
            base_query = base_query.join(DimLocation).filter(
                DimLocation.city.ilike(f"%{location.strip()}%")
            )

        # 4. Filtre par Type de Contrat
        if contract_type and contract_type.strip():
            base_query = base_query.filter(FactJobs.contract_type.ilike(f"%{contract_type.strip()}%"))

        # 5. Filtre par Expérience
        if experience and experience.strip():
            experience_list = [e.strip() for e in experience.split(',')]
            base_query = base_query.filter(FactJobs.experience_level.in_(experience_list))

        if source and source.strip():
            base_query = base_query.filter(FactJobs.source.ilike(f"%{source.strip()}%"))

        if skills and skills.strip():
            skill_list = [s.strip() for s in skills.split(',') if s.strip()]
            
            # Comme location : join sur la table de dimension + filter
            base_query = base_query.join(DimSkills, FactJobs.skills).filter(
                func.lower(DimSkills.skill_name).in_([s.lower() for s in skill_list])
            )
        
        if category and category.strip():
            # Jointure explicite via la clé étrangère
            base_query = base_query.join(
                DimCategory, 
                FactJobs.category_id == DimCategory.category_id
            ).filter(
                DimCategory.category_name.ilike(f"%{category.strip()}%")
            )

    
            
        # --- Exécution ---
        
        # Le count() doit être fait APRES les filtres
        total = base_query.count()
        
        # Tri descendant pour avoir les nouveautés en premier
        jobs = base_query.order_by(FactJobs.job_id.desc()).offset(skip).limit(limit).all()
        
        return PaginatedJobsResponse(
            total=total,
            skip=skip,
            limit=limit,
            data=jobs
        )
        
    except Exception as e:
        print(f"❌ ERREUR BACKEND: {str(e)}") 
        raise HTTPException(status_code=500, detail="Erreur lors du filtrage des offres.")




@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(FactJobs).filter(FactJobs.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


