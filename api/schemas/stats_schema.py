from pydantic import BaseModel

class StatsSummaryResponse(BaseModel):
    total_jobs: int
    total_companies: int
    avg_match: float
    total_sources: int