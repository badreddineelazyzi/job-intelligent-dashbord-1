from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List

class SkillSchema(BaseModel):
    skill_id: int
    skill_name: str

    class Config:
        from_attributes = True

class CompanySchema(BaseModel):
    company_id: int
    company_name: str

    class Config:
        from_attributes = True

class LocationSchema(BaseModel):
    location_id: int
    city: Optional[str] = None
    country: Optional[str] = None

    class Config:
        from_attributes = True

class JobBase(BaseModel):
    title: str
    description: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    source: Optional[str] = None
    url: Optional[str] = None
    experience_level: Optional[str] = None
    contract_type: Optional[str] = None

class JobResponse(JobBase):
    job_id: int
    company: Optional[CompanySchema] = None
    location: Optional[LocationSchema] = None
    skills: List[SkillSchema] = []

    class Config:
        from_attributes = True

class PaginatedJobsResponse(BaseModel):
    total: int
    skip: int
    limit: int
    data: List[JobResponse]