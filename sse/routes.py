"""
Routes SSE - Endpoints FastAPI pour Server-Sent Events
À intégrer dans l'API principale (api/main.py)
"""

from fastapi import APIRouter, Query, Depends, Request
from fastapi.responses import StreamingResponse
import asyncio
import json
import logging
from typing import Optional

from .manager import sse_manager
from api.routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sse", tags=["SSE - Server-Sent Events"])


@router.get("/stream")
async def sse_stream(
    request: Request,
    client_id: Optional[str] = Query(None),
    current_user=Depends(get_current_user)
):
    """
    Endpoint SSE pour streamer les événements.
    Le client se connecte et reçoit les événements en temps réel.
    """
    
    async def event_generator():
        """Génère les événements SSE"""
        queue = await sse_manager.connect(client_id or current_user.id)
        
        try:
            while True:
                # Vérifier si le client est déconnecté
                if await request.is_disconnected():
                    logger.info(f"Client {client_id} déconnecté")
                    break
                
                try:
                    # Attendre un événement (timeout 30s)
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    
                    # Formater en SSE
                    message = f"data: {json.dumps(event)}\n\n"
                    yield message
                    
                except asyncio.TimeoutError:
                    # Heartbeat pour maintenir la connexion
                    yield ": heartbeat\n\n"
                    
        except asyncio.CancelledError:
            logger.info(f"SSE stream annulé pour {client_id}")
        finally:
            await sse_manager.disconnect(queue, client_id or current_user.id)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/broadcast")
async def broadcast_event(
    event_type: str = Query(...),
    data: dict = None,
    current_user=Depends(get_current_user)
):
    """
    Broadcast un événement à tous les clients SSE.
    Endpoint de test/admin.
    """
    if data is None:
        data = {}
    
    await sse_manager.broadcast(
        event_type=event_type,
        data={
            **data,
            "source": "api",
            "admin": current_user.id
        }
    )
    
    return {
        "status": "broadcasted",
        "event_type": event_type,
        "clients": sse_manager.get_stats()
    }


@router.get("/stats")
async def get_sse_stats(current_user=Depends(get_current_user)):
    """Retourne les statistiques SSE"""
    return sse_manager.get_stats()


# ═══════════════════════════════════════════════════════════
# EXEMPLE D'UTILISATION DANS D'AUTRES ROUTES
# ═══════════════════════════════════════════════════════════

"""
# Dans api/routes/jobs.py par exemple:

from sse.manager import sse_manager

@router.post("/jobs/")
async def create_job(job: JobCreate):
    # Créer l'offre...
    new_job = Job(**job.dict())
    db.add(new_job)
    db.commit()
    
    # Broadcaster l'événement SSE
    await sse_manager.broadcast(
        event_type="job_created",
        data={
            "job_id": new_job.id,
            "title": new_job.title,
            "company": new_job.company
        }
    )
    
    return new_job
"""
