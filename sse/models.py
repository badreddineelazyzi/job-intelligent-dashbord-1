"""
Models - Modèles de données pour SSE
"""

from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime
from enum import Enum


class EventType(str, Enum):
    """Types d'événements SSE supportés"""
    JOB_CREATED = "job_created"
    JOB_UPDATED = "job_updated"
    JOB_DELETED = "job_deleted"
    RECOMMENDATION_READY = "recommendation_ready"
    SEARCH_STARTED = "search_started"
    SEARCH_COMPLETED = "search_completed"
    CV_UPLOADED = "cv_uploaded"
    CV_ANALYZED = "cv_analyzed"
    USER_NOTIFICATION = "user_notification"
    SYSTEM_ALERT = "system_alert"
    LIVE_UPDATE = "live_update"


class SSEEvent(BaseModel):
    """Modèle pour un événement SSE"""
    type: EventType
    data: Any
    timestamp: datetime = datetime.now()
    source: Optional[str] = "system"
    user_id: Optional[str] = None


class JobEventData(BaseModel):
    """Données pour les événements d'offres d'emploi"""
    job_id: int
    title: str
    company: str
    action: str  # 'created', 'updated', 'deleted'


class RecommendationEventData(BaseModel):
    """Données pour les événements de recommandation"""
    user_id: str
    recommendation_id: int
    job_count: int
    query: str
    status: str  # 'started', 'in_progress', 'completed'


class NotificationEventData(BaseModel):
    """Données pour les notifications utilisateur"""
    user_id: str
    title: str
    message: str
    severity: str  # 'info', 'warning', 'error', 'success'
    action_url: Optional[str] = None
