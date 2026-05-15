# 📡 Server-Sent Events (SSE) Module

Module SSE isolé pour le projet Job Intelligence Dashboard. Permet de streamer les événements en temps réel aux clients sans affecter le code existant.

## 🎯 Objectif

Implémenter une communication **unidirectionnelle** du serveur vers les clients pour:
- Notifications en temps réel
- Mises à jour des recommandations
- Alertes système
- Événements d'offres d'emploi

## 📁 Structure

```
sse/
├── __init__.py          # Module initialization
├── manager.py           # SSEManager - Gestion des connexions
├── routes.py            # FastAPI routes SSE
├── models.py            # Modèles de données
└── README.md            # Documentation (ce fichier)
```

## 🚀 Installation & Configuration

### 1. Intégrer dans FastAPI (api/main.py)

```python
from sse.routes import router as sse_router

app.include_router(sse_router)
```

### 2. Endpoints

#### **Connecter au flux SSE**
```
GET /sse/stream?client_id=user123
```

Retourne un flux SSE où le serveur envoie les événements.

#### **Broadcaster un événement** (admin)
```
POST /sse/broadcast?event_type=job_created
Body: { "job_id": 1, "title": "Data Engineer" }
```

#### **Récupérer les stats**
```
GET /sse/stats
```

## 📝 Utilisation dans les Routes

### Exemple 1: Créer une offre avec broadcast SSE

```python
from sse.manager import sse_manager

@router.post("/jobs/")
async def create_job(job: JobCreate):
    new_job = Job(**job.dict())
    db.add(new_job)
    db.commit()
    
    # Broadcaster l'événement
    await sse_manager.broadcast(
        event_type="job_created",
        data={
            "job_id": new_job.id,
            "title": new_job.title,
            "company": new_job.company
        }
    )
    
    return new_job
```

### Exemple 2: Recommandations

```python
@router.post("/recommend/profile/")
async def match_by_profile(request: ProfileMatchingRequest):
    # Notifier que la recherche a commencé
    await sse_manager.broadcast(
        event_type="search_started",
        data={"query_used": query}
    )
    
    # Faire le matching...
    results = recommender.recommend(query)
    
    # Notifier que c'est fini
    await sse_manager.broadcast(
        event_type="search_completed",
        data={
            "results_count": len(results),
            "duration_ms": elapsed_time
        }
    )
    
    return results
```

## 🔌 Client-Côté (JavaScript)

### Connexion au flux SSE

```javascript
// Ouvrir la connexion
const eventSource = new EventSource('http://localhost:8000/sse/stream?client_id=user123', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Écouter les événements
eventSource.addEventListener('job_created', (event) => {
  const data = JSON.parse(event.data);
  console.log('Nouvelle offre:', data);
  // Mettre à jour l'UI...
});

eventSource.addEventListener('search_completed', (event) => {
  const data = JSON.parse(event.data);
  console.log('Recherche terminée:', data.results_count, 'résultats');
});

// Fermer la connexion si nécessaire
eventSource.close();
```

### React Hook personnalisé

```javascript
// hooks/useSSE.js
import { useEffect, useState } from 'react';

export function useSSE(clientId) {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    const eventSource = new EventSource(
      `http://localhost:8000/sse/stream?client_id=${clientId}`,
      {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }
    );
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents(prev => [...prev, data]);
      } catch (e) {
        console.error('Erreur SSE:', e);
      }
    };
    
    return () => eventSource.close();
  }, [clientId]);
  
  return events;
}

// Utilisation
function Dashboard() {
  const events = useSSE('user123');
  return (
    <div>
      {events.map(event => (
        <div key={event.timestamp}>
          {event.type}: {JSON.stringify(event.data)}
        </div>
      ))}
    </div>
  );
}
```

## 🌐 Types d'Événements

Définis dans `sse/models.py::EventType`:

- `job_created` - Une offre a été créée
- `job_updated` - Une offre a été mise à jour
- `job_deleted` - Une offre a été supprimée
- `recommendation_ready` - Les recommandations sont prêtes
- `search_started` - Une recherche a commencé
- `search_completed` - Une recherche est terminée
- `cv_uploaded` - Un CV a été uploadé
- `cv_analyzed` - Un CV a été analysé
- `user_notification` - Notification utilisateur
- `system_alert` - Alerte système
- `live_update` - Mise à jour en direct

## ⚙️ Configuration

### Max History

Par défaut, le manager garde les **100 derniers événements** pour les nouveaux clients.

```python
# sse/manager.py
sse_manager.max_history = 100
```

### Timeout du Heartbeat

Par défaut, **30 secondes** sans événement envoie un heartbeat pour maintenir la connexion.

```python
# sse/routes.py ligne ~50
event = await asyncio.wait_for(queue.get(), timeout=30.0)
```

## 📊 Stats SSE

Récupérer les stats:
```
GET /sse/stats
```

Réponse:
```json
{
  "connected_clients": 5,
  "event_history_size": 42,
  "timestamp": "2026-05-15T14:30:00"
}
```

## 🔒 Sécurité

- ✅ Les endpoints SSE nécessitent l'authentification JWT
- ✅ Chaque client est isolé avec une queue individuelle
- ✅ Les événements incluent le `user_id` pour le filtrage côté client
- ⚠️ À faire: Mapper les événements par `user_id` pour éviter les fuites

## 🐛 Debugging

Activer les logs détaillés:
```python
import logging
logging.getLogger('sse').setLevel(logging.DEBUG)
```

Vérifier la connexion:
```bash
curl -N "http://localhost:8000/sse/stream?client_id=test" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📦 Docker Support (Optionnel)

Voir `Dockerfile.sse` pour containeriser le service SSE séparément.

## 🎓 Ressources

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [FastAPI Streaming](https://fastapi.tiangolo.com/advanced/streaming-response/)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

## ✅ Checklist d'Intégration

- [ ] Importer le router SSE dans `api/main.py`
- [ ] Ajouter SSE broadcasts dans les routes existantes
- [ ] Créer des hooks React pour SSE côté client
- [ ] Tester avec plusieurs clients simultanément
- [ ] Configurer les logs
- [ ] Documenter les événements personnalisés
- [ ] Ajouter au docker-compose (optionnel)

---

**Auteur**: Job Intelligence Dashboard  
**Date**: May 2026  
**Status**: ✅ Prêt pour intégration
