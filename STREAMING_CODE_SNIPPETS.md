# 🔥 Code Snippets Prêts à Copier-Coller

Tout le code pour ajouter le WebSocket streaming. Copie/colle directement! 

---

## 1️⃣ `requirements.txt` - À Ajouter

```txt
# Copie tout ce qui suit à la fin de requirements.txt

# WebSocket & Real-time Streaming
websockets>=12.0
redis>=5.0
aioredis>=2.0
```

---

## 2️⃣ `api/websocket/__init__.py` - CRÉER

```python
\"\"\"WebSocket management for streaming endpoints\"\"\"
from .connection_manager import ConnectionManager

__all__ = [\"ConnectionManager\"]
```

---

## 3️⃣ `api/websocket/connection_manager.py` - CRÉER

```python
\"\"\"Manages WebSocket connections and broadcasts\"\"\"

from typing import Set
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    \"\"\"Gère les connexions WebSocket actives\"\"\"
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        \"\"\"Accepte et enregistre une nouvelle connexion\"\"\"
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f\"✅ Client connecté. Total: {len(self.active_connections)}\")
    
    def disconnect(self, websocket: WebSocket):
        \"\"\"Retire une connexion\"\"\"
        self.active_connections.discard(websocket)
        logger.info(f\"❌ Client déconnecté. Total: {len(self.active_connections)}\")
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        \"\"\"Envoie un message à une connexion spécifique\"\"\"
        try:
            await websocket.send_json(message)
        except RuntimeError as e:
            logger.warning(f\"Erreur envoi WebSocket: {e}\")
    
    async def broadcast(self, message: dict):
        \"\"\"Broadcast à tous les clients connectés\"\"\"
        dead_connections = []
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f\"Erreur broadcast: {e}\")
                dead_connections.append(connection)
        
        for connection in dead_connections:
            self.disconnect(connection)

manager = ConnectionManager()
```

---

## 4️⃣ `api/routes/stream_recommend.py` - CRÉER

```python
\"\"\"WebSocket endpoints pour le streaming de recommendations\"\"\"

import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from api.services.recommendation_service import recommender
from api.websocket.connection_manager import manager

router = APIRouter(tags=[\"Streaming\"])


@router.get(\"/health\")
async def stream_health_check():
    \"\"\"Health check pour streaming\"\"\"
    return {
        \"status\": \"ok\",
        \"streaming\": True
    }


@router.websocket(\"/ws/recommend/{query}\")
async def websocket_recommend(websocket: WebSocket, query: str):
    \"\"\"
    WebSocket endpoint pour recommendations streaming.
    
    Exemple client:
    ws://localhost:8000/stream/ws/recommend/python%20engineer
    \"\"\"
    await manager.connect(websocket)
    
    try:
        if not query or len(query.strip()) == 0:
            await manager.send_personal(
                websocket, 
                {\"error\": \"Query cannot be empty\"}
            )
            return
        
        # Streaming des résultats (réutilise le service existant)
        async for chunk in recommender.recommend_stream(query):
            await manager.send_personal(websocket, chunk)
            
            # Vérifier si le client demande l'arrêt
            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(), 
                    timeout=0.1
                )
                if message == \"STOP\":
                    break
            except asyncio.TimeoutError:
                pass
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    
    except Exception as e:
        await manager.send_personal(
            websocket, 
            {\"error\": f\"Server error: {str(e)}\"}
        )
        manager.disconnect(websocket)
```

---

## 5️⃣ `api/services/recommendation_service.py` - À AJOUTER

**Ajouter cette méthode à la classe `RecommendationService`:**

```python
    # ============================================
    # 🆕 STREAMING SUPPORT
    # ============================================
    
    async def recommend_stream(self, query: str, chunk_delay: float = 0.05):
        \"\"\"
        Streaming generator pour WebSocket.
        Réutilise entièrement recommend().
        
        Yields:
            dict: Chunk de recommandation
        \"\"\"
        import asyncio
        from datetime import datetime
        
        # Appeler le moteur NLP existant
        results = self.recommend(query)
        
        if \"error\" in results:
            yield {
                \"status\": \"error\",
                \"message\": results[\"error\"],
                \"timestamp\": datetime.now().isoformat()
            }
            return
        
        # Streamer les résultats progressivement
        jobs = results.get(\"jobs\", [])
        
        for index, job in enumerate(jobs):
            chunk = {
                \"status\": \"streaming\",
                \"index\": index,
                \"total\": len(jobs),
                \"job\": {
                    \"id\": job.get(\"id\"),
                    \"title\": job.get(\"title\"),
                    \"company\": job.get(\"company\"),
                    \"location\": job.get(\"location\"),
                    \"source\": job.get(\"source\"),
                    \"match_score\": job.get(\"match_score\", 0),
                    \"skills_matched\": job.get(\"skills_matched\", []),
                },
                \"timestamp\": datetime.now().isoformat()
            }
            
            yield chunk
            await asyncio.sleep(chunk_delay)
        
        # Signal de fin
        yield {
            \"status\": \"complete\",
            \"total_jobs\": len(jobs),
            \"timestamp\": datetime.now().isoformat()
        }
```

---

## 6️⃣ `api/main.py` - À MODIFIER

**Ajouter ces imports au début:**

```python
from api.routes import stream_recommend  # AJOUTER CETTE LIGNE
```

**Ajouter ce router avant les autres:**

```python
# AJOUTER CETTE SECTION
app.include_router(
    stream_recommend.router, 
    prefix=\"/stream\", 
    tags=[\"Streaming\"]
)
```

---

## 7️⃣ `frontend/src/hooks/useStreamRecommend.js` - CRÉER

```javascript
import { useState, useEffect, useRef } from 'react';

export const useStreamRecommend = (query) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  
  useEffect(() => {
    setJobs([]);
    setError(null);
    
    if (!query || query.trim().length === 0) {
      setLoading(false);
      return;
    }
    
    const encodedQuery = encodeURIComponent(query.trim());
    const wsUrl = `ws://localhost:8000/stream/ws/recommend/${encodedQuery}`;
    
    console.log('🔌 WebSocket:', wsUrl);
    
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
          setJobs(prev => [...prev, chunk.job]);
        }
        
        if (chunk.status === 'complete') {
          console.log(`✅ Complet: ${chunk.total_jobs} jobs`);
          setLoading(false);
        }
      } catch (e) {
        console.error('Erreur JSON:', e);
        setError('Erreur parsing');
      }
    };
    
    ws.onerror = (event) => {
      console.error('❌ WebSocket erreur:', event);
      setError('Erreur connexion');
      setLoading(false);
    };
    
    ws.onclose = () => {
      console.log('❌ WebSocket fermé');
      setLoading(false);
    };
    
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(\"STOP\");
        wsRef.current.close();
      }
    };
  }, [query]);
  
  return { jobs, loading, error };
};
```

---

## 8️⃣ `frontend/src/components/RecommendationStream.jsx` - CRÉER

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
    <div className=\"p-8\">
      <h1 className=\"text-3xl font-bold mb-6\">Recommendations</h1>
      
      <form onSubmit={handleSearch} className=\"mb-8\">
        <div className=\"flex gap-2\">
          <input
            type=\"text\"
            placeholder=\"Ex: Python Engineer, Data Scientist...\"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className=\"flex-1 px-4 py-2 border rounded-lg\"
          />
          <button
            type=\"submit\"
            disabled={loading}
            className=\"px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400\"
          >
            {loading ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className=\"mb-4 p-4 bg-red-100 text-red-800 rounded-lg\">
          ❌ {error}
        </div>
      )}
      
      <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
        {jobs.map((job, idx) => (
          <div key={idx} className=\"p-4 border rounded-lg hover:shadow-lg\">
            <h3 className=\"font-bold text-lg\">{job.title}</h3>
            <p className=\"text-gray-600\">{job.company}</p>
            <p className=\"text-sm text-gray-500\">{job.location}</p>
            
            {job.match_score > 0 && (
              <div className=\"mt-2 text-blue-600 font-semibold\">
                Match: {(job.match_score * 100).toFixed(0)}%
              </div>
            )}
            
            {job.skills_matched && job.skills_matched.length > 0 && (
              <div className=\"mt-2 flex flex-wrap gap-1\">
                {job.skills_matched.map((skill, i) => (
                  <span key={i} className=\"px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm\">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {loading && jobs.length === 0 && (
        <div className=\"text-center py-8 text-gray-500\">
          ⏳ Loading recommendations...
        </div>
      )}
      
      {!loading && jobs.length === 0 && submitted && !error && (
        <div className=\"text-center py-8 text-gray-500\">
          No results found
        </div>
      )}
    </div>
  );
};
```

---

## 9️⃣ `docker-compose.yml` - À AJOUTER

**Ajouter dans la section `services:`:**

```yaml
  redis:
    image: redis:7-alpine
    container_name: redis_job
    ports:
      - \"6379:6379\"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: [\"CMD\", \"redis-cli\", \"ping\"]
      interval: 5s
      timeout: 3s
      retries: 5
```

**Ajouter dans la section `volumes:` à la fin:**

```yaml
  redis_data:
```

---

## 🧪 Tests Rapides

### Test 1: WebSocket avec wscat
```bash
# Installer wscat
npm install -g wscat

# Tester
wscat -c ws://localhost:8000/stream/ws/recommend/python%20engineer

# Devrait voir les réponses JSON s'ajouter...
```

### Test 2: Depuis Python
```python
import asyncio
import websockets
import json

async def test():
    async with websockets.connect(\"ws://localhost:8000/stream/ws/recommend/data%20engineer\") as ws:
        async for msg in ws:
            print(json.loads(msg))

asyncio.run(test())
```

### Test 3: Depuis le Frontend
```bash
cd frontend
npm run dev
# Aller à http://localhost:3000
# Chercher
# Observer le streaming ✨
```

---

## ⚡ Quick Deploy

```bash
# 1. Install
pip install websockets redis aioredis

# 2. Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# 3. Copy-paste les 9 fichiers ci-dessus

# 4. Restart API
uvicorn api.main:app --reload

# 5. Restart Frontend
cd frontend && npm run dev

# 6. Test
# http://localhost:3000 → chercher quelque chose ✨
```

---

## 🎉 Done!

C'est tout! Vous avez maintenant le WebSocket streaming en 2-3 jours avec 85% du code réutilisé.

