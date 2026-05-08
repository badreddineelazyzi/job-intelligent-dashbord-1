from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    remote_preference: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_years: Optional[int] = None
    contract_type: Optional[List[str]] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None

class UserResponse(UserBase):
    id: int
    title: Optional[str] = None
    location: Optional[str] = None
    remote_preference: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_years: Optional[int] = None
    contract_type: Optional[List[str]] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    created_at: datetime = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"