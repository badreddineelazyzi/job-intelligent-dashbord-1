from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database.db_session import get_db
from database.models import FactJobs, DimCompany, DimLocation, DimSkills
from api.schemas.job_schema import PaginatedJobsResponse, JobResponse

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)

@router.get("/", response_model=PaginatedJobsResponse)
def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        base_query = db.query(FactJobs)
        
        if query:
            base_query = base_query.filter(FactJobs.title.ilike(f"%{query}%"))
            
        total = base_query.count()
        jobs = base_query.offset(skip).limit(limit).all()
        
        # Load relations explicitly if needed (or assume SQLAlchemy lazy loads)
        # Assuming relations are defined in FactJobs model
        
        return PaginatedJobsResponse(
            total=total,
            skip=skip,
            limit=limit,
            data=jobs
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(FactJobs).filter(FactJobs.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job