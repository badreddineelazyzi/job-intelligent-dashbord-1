"""
SSE Manager - Gère les connexions Server-Sent Events
Permet de broadcaster des événements à tous les clients connectés
"""

import asyncio
import json
from typing import Set, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SSEManager:
    """
    Gestionnaire centralisé pour les connexions SSE.
    Permet de broadcaster des événements à tous les clients connectés.
    """
    
    def __init__(self):
        self.connections: Set[asyncio.Queue] = set()
        self.event_history: list = []
        self.max_history = 100  # Garder les 100 derniers événements
        
    async def connect(self, client_id: Optional[str] = None) -> asyncio.Queue:
        """Enregistre une nouvelle connexion SSE"""
        queue = asyncio.Queue()
        self.connections.add(queue)
        logger.info(f"✅ Client SSE connecté: {client_id or 'Anonymous'} (Total: {len(self.connections)})")
        
        # Envoyer l'historique au nouveau client
        for event in self.event_history:
            await queue.put(event)
            
        return queue
    
    async def disconnect(self, queue: asyncio.Queue, client_id: Optional[str] = None):
        """Désenregistre une connexion SSE"""
        self.connections.discard(queue)
        logger.info(f"❌ Client SSE déconnecté: {client_id or 'Anonymous'} (Total: {len(self.connections)})")
    
    async def broadcast(self, 
                       event_type: str,
                       data: Any,
                       exclude_queue: Optional[asyncio.Queue] = None):
        """
        Broadcast un événement à tous les clients connectés.
        
        Args:
            event_type: Type d'événement (ex: 'job_update', 'recommendation')
            data: Données à envoyer
            exclude_queue: Queue à exclure du broadcast
        """
        event = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
        # Garder l'historique
        self.event_history.append(event)
        if len(self.event_history) > self.max_history:
            self.event_history.pop(0)
        
        # Broadcaster à tous les clients
        dead_connections = set()
        for queue in self.connections:
            if queue == exclude_queue:
                continue
            try:
                await queue.put(event)
            except Exception as e:
                logger.error(f"Erreur lors du broadcast: {e}")
                dead_connections.add(queue)
        
        # Nettoyer les connexions mortes
        self.connections -= dead_connections
        
        logger.info(f"📤 Événement {event_type} broadcasté à {len(self.connections)} clients")
    
    async def send_to_user(self,
                          user_id: str,
                          event_type: str,
                          data: Any):
        """
        Envoyer un événement à un utilisateur spécifique.
        Note: Cette implémentation simple envoie à tous. 
        À améliorer avec un mapping user_id -> queues
        """
        await self.broadcast(event_type, {
            "user_id": user_id,
            "payload": data
        })
    
    def get_stats(self) -> Dict[str, Any]:
        """Retourne les stats SSE"""
        return {
            "connected_clients": len(self.connections),
            "event_history_size": len(self.event_history),
            "timestamp": datetime.now().isoformat()
        }


# Instance globale
sse_manager = SSEManager()
