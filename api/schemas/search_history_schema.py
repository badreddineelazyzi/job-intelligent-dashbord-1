from pydantic import BaseModel
from datetime import datetime

class SearchHistoryCreate(BaseModel):
    query_text: str

class SearchHistoryResponse(BaseModel):
    id: int
    query: str
    created_at: datetime

    class Config:
        from_attributes = True