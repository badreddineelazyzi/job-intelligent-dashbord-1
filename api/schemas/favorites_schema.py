from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FavoriteCreate(BaseModel):
    job_id: int

class CompanyMinimal(BaseModel):
    company_name: str
    class Config:
        from_attributes = True

class LocationMinimal(BaseModel):
    city: str
    country: str
    class Config:
        from_attributes = True

class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    saved_at: datetime
    # Ces champs permettent à FastAPI d'inclure les détails du job
    title: Optional[str] = None
    company: Optional[CompanyMinimal] = None
    location: Optional[LocationMinimal] = None
    
    model_config = {"from_attributes": True}