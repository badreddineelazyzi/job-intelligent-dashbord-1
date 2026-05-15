# 🎯 Plan d'Action Détaillé: WebSocket Streaming (Option 1)

**Effort Total:** 10-11 heures ≈ **2-3 jours**  
**Développeurs:** 1  
**Code Réutilisé:** 85%  

---

## 📋 Checklist d'Implémentation

### **✅ Tâche 1: Setup Infrastructure (2-3 heures)**

#### 1.1 - Ajouter Redis au docker-compose.yml
```bash
# Vérifier que Redis existe dans docker-compose.yml
# Sinon ajouter:

redis:
  image: redis:7-alpine
  container_name: redis_job
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes

# Dans la section volumes:
volumes:
  redis_data:
```

#### 1.2 - Installer les dépendances
```bash
pip install websockets redis aioredis
pip install --upgrade requirements.txt  # Au besoin
```

#### 1.3 - Tester la connexion
```bash
# Terminal 1: Lancer Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2: Tester
redis-cli ping  # → PONG ✅
```

---

### **✅ Tâche 2: Adapter le Service de Recommendation (3 heures)**

**Fichier à modifier:** `api/services/recommendation_service.py`

**Résultat attendu:**
- Ajouter une méthode `recommend_stream(query)` qui génère les résultats par chunks
- Implémenter le cache Redis pour les résultats
- Réutiliser 100% de `self.recommend(query)` existant

**Taille des changements:** +40 lignes, 0 lignes supprimées

---

### **✅ Tâche 3: Créer le Manager de Connexion WebSocket (2 heures)**

**Fichiers à créer:**
```
api/
  └── websocket/
      ├── __init__.py
      └── connection_manager.py
```

**Responsabilités:**
- Gérer les connexions actives
- Broadcaster les messages à tous les clients connectés
- Gérer les reconnexions

---

### **✅ Tâche 4: Créer l'Endpoint WebSocket (2 heures)**

**Fichiers à créer:**
```
api/
  └── routes/
      └── stream_recommend.py
```

**Endpoints:**
- `GET /stream/ws/recommend/{query}` - WebSocket pour streaming
- `GET /stream/health` - Health check

---

### **✅ Tâche 5: Intégrer dans FastAPI (1 heure)**

**Fichier à modifier:** `api/main.py`

**Changements:**
- Importer et inclure le routeur
- Ajouter config CORS pour WebSocket
- Ajouter lifecycle hooks si besoin

---

### **✅ Tâche 6: Frontend WebSocket Client (2-3 heures)**

**Fichier à créer:**
```
frontend/src/
  ├── hooks/
  │   └── useStreamRecommend.js
  └── components/
      └── RecommendationStream.jsx
```

**Responsabilités:**
- Établir connexion WebSocket
- Afficher les résultats progressivement
- Gérer les erreurs de connexion

---

### **✅ Tâche 7: Tests & Debugging (1-2 heures)**

**Tests manuels:**
```bash
# 1. Tester WebSocket directement
wscat -c ws://localhost:8000/stream/ws/recommend/python%20engineer

# 2. Tester depuis le frontend React
# Naviguer vers http://localhost:3000/recommend
# Chercher "Python Engineer"
# Vérifier le streaming en temps réel

# 3. Vérifier les logs
tail -f logs/api.log
```

---

## 📝 Fichiers Détaillés à Créer/Modifier

### 1️⃣ `requirements.txt` (MODIFIER)

**À ajouter à la fin:**
```
websockets>=12.0
redis>=5.0
aioredis>=2.0
```

---

### 2️⃣ `api/websocket/__init__.py` (CRÉER)

```python
"""WebSocket management for streaming endpoints"""
from .connection_manager import ConnectionManager

__all__ = ["ConnectionManager"]
```

---

### 3️⃣ `api/websocket/connection_manager.py` (CRÉER)

```python
"""Manages WebSocket connections and broadcasts"""

from typing import Set
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Gère les connexions WebSocket actives.
    Permet de broadcaster à tous les clients connectés.
    """
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        """Accepte et enregistre une nouvelle connexion"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"✅ Client connecté. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Retire une connexion"""
        self.active_connections.discard(websocket)
        logger.info(f"❌ Client déconnecté. Total: {len(self.active_connections)}")
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        """Envoie un message à une connexion spécifique"""
        try:
            await websocket.send_json(message)
        except RuntimeError as e:
            logger.warning(f"Erreur envoi WebSocket: {e}")
    
    async def broadcast(self, message: dict):
        """Broadcast à tous les clients connectés"""
        dead_connections = []
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Erreur broadcast: {e}")
                dead_connections.append(connection)
        
        # Nettoyer les connexions mortes
        for connection in dead_connections:
            self.disconnect(connection)

# Instance globale
manager = ConnectionManager()
```

---

### 4️⃣ `api/services/recommendation_service.py` (MODIFIER - AJOUTER)

**À ajouter à la fin de la classe `RecommendationService`:**

```python
    # ============================================
    # 🆕 STREAMING SUPPORT (réutilise recommend())
    # ============================================
    
    async def recommend_stream(self, query: str, chunk_delay: float = 0.05):
        """
        Streaming generator pour WebSocket.
        Réutilise entièrement le moteur NLP existant.
        
        Args:
            query: Requête de recherche
            chunk_delay: Délai entre chaque chunk (ms)
            
        Yields:
            dict: Chunk de recommandation
        """
        import asyncio
        
        # 🔄 RÉUTILISER LE CODE EXISTANT
        results = self.recommend(query)
        
        if "error" in results:
            yield {
                "status": "error",
                "message": results["error"],
                "timestamp": datetime.now().isoformat()
            }
            return
        
        # Streamer les résultats progressivement
        jobs = results.get("jobs", [])
        
        for index, job in enumerate(jobs):
            chunk = {
                "status": "streaming",
                "index": index,
                "total": len(jobs),
                "job": {
                    "id": job.get("id"),
                    "title": job.get("title"),
                    "company": job.get("company"),
                    "location": job.get("location"),
                    "source": job.get("source"),
                    "match_score": job.get("match_score", 0),
                    "skills_matched": job.get("skills_matched", []),
                },
                "timestamp": datetime.now().isoformat()
            }
            
            yield chunk
            
            # Throttle pour éviter surcharge
            await asyncio.sleep(chunk_delay)
        
        # Signal de fin
        yield {
            "status": "complete",
            "total_jobs": len(jobs),
            "timestamp": datetime.now().isoformat()
        }
```

---

### 5️⃣ `api/routes/stream_recommend.py` (CRÉER)

```python
"""
WebSocket endpoints pour le streaming de recommendations.
Réutilise entièrement les services existants.
"""

import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from api.services.recommendation_service import recommender
from api.websocket.connection_manager import manager

router = APIRouter(tags=["Streaming"])


@router.get("/health")
async def stream_health_check():
    """Health check pour les endpoints streaming"""
    return {
        "status": "ok",
        "streaming": True,
        "redis": "connected"  # À vérifier dans recommender
    }


@router.websocket("/ws/recommend/{query}")
async def websocket_recommend(websocket: WebSocket, query: str):
    """
    WebSocket endpoint pour streaming de recommendations.
    
    Clients se connectent à:
    ws://localhost:8000/stream/ws/recommend/python%20engineer
    
    Reçoivent les résultats progressivement.
    """
    await manager.connect(websocket)
    
    try:
        # Validation
        if not query or len(query.strip()) == 0:
            await manager.send_personal(
                websocket, 
                {"error": "Query cannot be empty"}
            )
            return
        
        # 🔄 RÉUTILISER le service existant avec streaming
        async for chunk in recommender.recommend_stream(query):
            await manager.send_personal(websocket, chunk)
            
            # Vérifier si le client a envoyé un signal d'arrêt
            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(), 
                    timeout=0.1
                )
                if message == "STOP":
                    break
            except asyncio.TimeoutError:
                # Normal - continue streaming
                pass
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    
    except Exception as e:
        await manager.send_personal(
            websocket, 
            {"error": f"Server error: {str(e)}"}
        )
        manager.disconnect(websocket)


@router.websocket("/ws/recommend-advanced/{query}")
async def websocket_recommend_advanced(
    websocket: WebSocket, 
    query: str,
    filters: str = Query(None)
):
    """
    Advanced WebSocket avec filtres.
    
    Exemple:
    ws://localhost:8000/stream/ws/recommend-advanced/data%20engineer?filters=remote:true,salary:min:50000
    """
    await manager.connect(websocket)
    
    try:
        # Ajouter logique de filtres si query params présents
        if filters:
            # Parse filters et les appliquer
            query = f"{query} {filters}"
        
        async for chunk in recommender.recommend_stream(query):
            await manager.send_personal(websocket, chunk)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    
    except Exception as e:
        await manager.send_personal(websocket, {"error": str(e)})
        manager.disconnect(websocket)
```

---

### 6️⃣ `api/main.py` (MODIFIER - AJOUTER)

**À ajouter après les imports existants:**

```python
# 🆕 AJOUTER IMPORTS
from api.routes import stream_recommend  # NOUVEAU

# ... code existant ...

# À ajouter AVANT app.include_router pour les autres routes:

# 🆕 AJOUTER ROUTE STREAMING
app.include_router(
    stream_recommend.router, 
    prefix="/stream", 
    tags=["Streaming"]
)

# ... reste du code existant ...
```

---

### 7️⃣ `frontend/src/hooks/useStreamRecommend.js` (CRÉER)

```javascript
import { useState, useEffect, useRef } from 'react';

/**
 * Hook pour connecter et consommer WebSocket de recommendations.
 * 
 * Usage:
 * const { jobs, loading, error } = useStreamRecommend("python engineer");
 */
export const useStreamRecommend = (query) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  
  useEffect(() => {
    // Réinitialiser les jobs à chaque nouvelle query
    setJobs([]);
    setError(null);
    
    // Ne rien faire si query vide
    if (!query || query.trim().length === 0) {
      setLoading(false);
      return;
    }
    
    // Construire l'URL WebSocket
    const encodedQuery = encodeURIComponent(query.trim());
    const wsUrl = `ws://localhost:8000/stream/ws/recommend/${encodedQuery}`;
    
    console.log('🔌 Connexion WebSocket:', wsUrl);
    
    // Créer la connexion
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    setLoading(true);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connecté');
    };
    
    ws.onmessage = (event) => {
      try {
        const chunk = JSON.parse(event.data);
        
        if (chunk.status === 'error') {
          setError(chunk.message);
          setLoading(false);
          return;
        }
        
        if (chunk.status === 'streaming') {
          // Ajouter le job aux résultats
          setJobs(prev => [...prev, chunk.job]);
        }
        
        if (chunk.status === 'complete') {
          console.log(`✅ Streaming complet: ${chunk.total_jobs} jobs`);
          setLoading(false);
        }
      } catch (e) {
        console.error('Erreur parsing JSON:', e);
        setError('Erreur parsing des données');
      }
    };
    
    ws.onerror = (event) => {
      console.error('❌ WebSocket erreur:', event);
      setError('Erreur de connexion WebSocket');
      setLoading(false);
    };
    
    ws.onclose = () => {
      console.log('❌ WebSocket fermé');
      setLoading(false);
    };
    
    // Cleanup: fermer la connexion
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send("STOP");
        wsRef.current.close();
      }
    };
  }, [query]);
  
  return { jobs, loading, error };
};

/**
 * Alternative: Hook pour contrôler manuellement
 */
export const useStreamRecommendManual = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  
  const start = (query) => {
    if (!query) return;
    
    setJobs([]);
    setError(null);
    setLoading(true);
    
    const encodedQuery = encodeURIComponent(query.trim());
    const wsUrl = `ws://localhost:8000/stream/ws/recommend/${encodedQuery}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onmessage = (event) => {
      const chunk = JSON.parse(event.data);
      
      if (chunk.status === 'streaming') {
        setJobs(prev => [...prev, chunk.job]);
      } else if (chunk.status === 'complete') {
        setLoading(false);
      } else if (chunk.status === 'error') {
        setError(chunk.message);
        setLoading(false);
      }
    };
    
    ws.onerror = () => {
      setError('WebSocket error');
      setLoading(false);
    };
  };
  
  const stop = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send("STOP");
      wsRef.current.close();
      setLoading(false);
    }
  };
  
  return { jobs, loading, error, start, stop };
};
```

---

### 8️⃣ `frontend/src/components/RecommendationStream.jsx` (CRÉER)

```jsx
import React, { useState } from 'react';
import { useStreamRecommend } from '../hooks/useStreamRecommend';

export const RecommendationStream = () => {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const { jobs, loading, error } = useStreamRecommend(submitted ? query : '');
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSubmitted(true);
    }
  };
  
  return (
    <div className="recommendation-stream">
      <div className="search-box">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Chercher un poste (ex: Python Engineer, Data Scientist)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? '⏳ Streaming...' : '🔍 Chercher'}
          </button>
        </form>
      </div>
      
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
      
      <div className="jobs-stream">
        {jobs.map((job, idx) => (
          <div key={idx} className="job-card">
            <div className="job-header">
              <h3>{job.title}</h3>
              <span className="badge badge-primary">{job.source}</span>
            </div>
            
            <div className="job-body">
              <p className="company">{job.company}</p>
              <p className="location">{job.location}</p>
              
              {job.match_score > 0 && (
                <div className="match-score">
                  Score: <strong>{(job.match_score * 100).toFixed(1)}%</strong>
                </div>
              )}
              
              {job.skills_matched && job.skills_matched.length > 0 && (
                <div className="skills">
                  {job.skills_matched.map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && jobs.length === 0 && (
          <div className="loading">⏳ Chargement des recommandations...</div>
        )}
        
        {loading && jobs.length > 0 && (
          <div className="loading-more">
            ⏳ Chargement de plus de résultats...
            <div className="spinner"></div>
          </div>
        )}
        
        {!loading && jobs.length === 0 && submitted && !error && (
          <div className="no-results">Aucun résultat trouvé</div>
        )}
      </div>
    </div>
  );
};
```

---

### 9️⃣ `docker-compose.yml` (MODIFIER)

**À ajouter dans la section `services:`**

```yaml
  redis:
    image: redis:7-alpine
    container_name: redis_job
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
```

**Et dans la section `volumes:`**

```yaml
volumes:
  # ... volumes existants ...
  redis_data:
```

---

## 🧪 Tests d'Intégration

### Test 1: Vérifier WebSocket Client

```bash
# Installer wscat
npm install -g wscat

# Tester
wscat -c ws://localhost:8000/stream/ws/recommend/python%20engineer

# Attendre les messages JSON...
```

### Test 2: Tester depuis Python

```python
import asyncio
import websockets
import json

async def test_websocket():
    async with websockets.connect("ws://localhost:8000/stream/ws/recommend/data%20scientist") as ws:
        async for message in ws:
            data = json.loads(message)
            print(f"✅ Reçu: {data['status']} - {data.get('index', '...')}")

asyncio.run(test_websocket())
```

### Test 3: Frontend React

```bash
cd frontend
npm run dev

# Naviguer vers http://localhost:3000
# Chercher "Python Engineer"
# Observer le streaming en temps réel
```

---

## 📊 Résumé des Fichiers

| Fichier | Type | Lignes | Effort |
|---------|------|--------|--------|
| `requirements.txt` | Modification | +3 | 5 min |
| `api/websocket/__init__.py` | Création | 5 | 5 min |
| `api/websocket/connection_manager.py` | Création | 60 | 30 min |
| `api/services/recommendation_service.py` | Modification | +40 | 45 min |
| `api/routes/stream_recommend.py` | Création | 100 | 1h |
| `api/main.py` | Modification | +3 | 10 min |
| `frontend/src/hooks/useStreamRecommend.js` | Création | 120 | 1h |
| `frontend/src/components/RecommendationStream.jsx` | Création | 80 | 1h |
| `docker-compose.yml` | Modification | +15 | 10 min |
| **TOTAL** | | **~450** | **~5 heures** |

---

## ⚡ Quick Start Command

```bash
# 1. Ajouter dépendances
pip install websockets redis aioredis

# 2. Lancer Redis
docker run -d -p 6379:6379 redis:7-alpine

# 3. Copier les fichiers (fournis ci-dessus)

# 4. Redémarrer FastAPI
uvicorn api.main:app --reload

# 5. Redémarrer Frontend
cd frontend && npm run dev

# 6. Tester
# - Accès WebSocket: ws://localhost:8000/stream/health
# - Chercher: http://localhost:3000/recommend
```

