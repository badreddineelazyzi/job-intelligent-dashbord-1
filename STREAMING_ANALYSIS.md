# Analyse: Intégration du Streaming 🔄

**Date:** Mai 2026  
**Projet:** Job Intelligent Dashboard  
**Objectif:** Ajouter le streaming avec réutilisation maximale du code existant

---

## 📊 État Actuel du Projet

### Architecture Actuelle (Batch)
```
Web Scrapers + APIs → MinIO (raw-data) → Airflow DAGs → PostgreSQL → FastAPI → Frontend
       ↓                  ↓                     ↓             ↓         ↓
   Daily (batch)     S3 Storage         Orchestration   DW/SQL   REST Endpoints
```

### Stack Technologique
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Data:** MinIO (S3-compatible), Airflow, Pandas/NumPy
- **ML:** TF-IDF, Embeddings (sentence-transformers), Torch
- **Frontend:** React/Vite, Tailwind

**Manque actuellement:** Kafka/RabbitMQ, WebSockets, Redis

---

## 🎯 3 Scénarios de Streaming Possibles

### **Option 1: Streaming WebSocket pour Recommendations (RECOMMANDÉ - Faible Effort)**

**Objectif:** Envoyer les recommendations au fur et à mesure (real-time matching)

#### Effort Estimé: **2-3 jours**

| Tâche | Temps | Détails |
|-------|-------|---------|
| **1. Ajouter WebSocket dans FastAPI** | 2h | Importer `websockets`, créer endpoint `/ws/recommend` |
| **2. Adapter le moteur NLP pour streaming** | 3h | Transformer `recommender.recommend()` en générateur avec chunks |
| **3. Ajouter Redis pour cache** | 2h | Installer Redis, ajouter cache des embeddings |
| **4. Frontend WebSocket client** | 2h | Créer hook React pour WebSocket |
| **5. Tests + debugging** | 1-2h | Tester connexion, reconnexion, edge cases |
| **TOTAL** | **10-11 heures ≈ 2-3 jours** | Travail continu |

**Code à Réutiliser:** ✅
- ✅ `recommendation/matcher.py` → 100% réutilisable
- ✅ `recommendation/embeddings.py` → 100% réutilisable
- ✅ `api/routes/recommend.py` → 80% réutilisable
- ✅ `api/services/recommendation_service.py` → 100% réutilisable
- ⚠️ Frontend `/recommend/` → à adapter pour WebSocket

---

### **Option 2: Server-Sent Events (SSE) pour Real-time Job Updates (Moyen Effort)**

**Objectif:** Stream des nouveaux jobs au fur et à mesure de l'ingestion/scraping

#### Effort Estimé: **4-5 jours**

| Tâche | Temps | Détails |
|-------|-------|---------|
| **1. Créer endpoint SSE FastAPI** | 2h | Route `/jobs/stream` avec generators |
| **2. Modifier Ingestion Pipeline pour streaming** | 4h | Changer `run_all_scrapers()` → async generator |
| **3. Ajouter Redis Pub/Sub** | 2h | Redis comme message broker entre scraper et API |
| **4. Déduplication en temps réel** | 3h | Vérifier doublons avant d'envoyer |
| **5. Frontend SSE client** | 3h | Créer subscription pour live jobs |
| **6. Tests + monitoring** | 2h | Vérifier intégrité des données |
| **TOTAL** | **16-18 heures ≈ 4-5 jours** | |

**Code à Réutiliser:** ✅
- ✅ `scraping/run_scrapers.py` → 70% réutilisable (async conversion)
- ✅ `pipelines/ingestion_pipeline.py` → 80% réutilisable
- ✅ `database/models.py` → 100% réutilisable
- ✅ `api/routes/jobs.py` → 80% réutilisable
- ⚠️ Airflow DAG → à retravailler (Airflow n'est pas asynchrone par nature)

---

### **Option 3: Kafka pour Data Pipeline Streaming (Maximum Effort - Production-Grade)**

**Objectif:** Pipeline complète en temps réel (Ingestion → Processing → Database)

#### Effort Estimé: **10-15 jours**

| Tâche | Temps | Détails |
|-------|-------|---------|
| **1. Ajouter Kafka au docker-compose** | 1h | Zookeeper + Kafka broker |
| **2. Créer producteurs (Scrapers)** | 6h | Transformer scrapers en Kafka producers |
| **3. Créer consommateurs (Processing)** | 8h | Transformer DAGs/pipelines en Kafka consumers |
| **4. State management** | 4h | Gérer l'ordre, la déduplication, les retries |
| **5. Monitoring + observabilité** | 4h | Kafdrop/Confluent Control Center |
| **6. Tests de charge** | 3h | Vérifier performance temps réel |
| **7. Documentation + déploiement** | 2h | |
| **TOTAL** | **28-30 heures ≈ 10-15 jours** | Travail parallélisable |

**Code à Réutiliser:** ✅
- ✅ `scraping/*` → 60% réutilisable (wrapping en producer)
- ✅ `processing/*` → 60% réutilisable (wrapping en consumer)
- ⚠️ Airflow DAGs → à redévelopper (remplacer par Kafka topology)
- ✅ `database/models.py` → 100% réutilisable

---

## 📈 Comparaison des Options

| Critère | Option 1 (WebSocket) | Option 2 (SSE) | Option 3 (Kafka) |
|---------|----------------------|----------------|------------------|
| **Temps** | 2-3 jours | 4-5 jours | 10-15 jours |
| **Complexité** | 🟢 Basse | 🟡 Moyenne | 🔴 Haute |
| **Code Réutilisé** | 85% | 75% | 60% |
| **Latence** | <1s | 1-5s | 100-500ms |
| **Cas d'Usage** | UI responsive | Live updates | Production streaming |
| **Infrastructure** | Redis | Redis | Kafka + Zookeeper |
| **Scalabilité** | Moyenne | Moyenne | Excellente |
| **Maintenance** | Facile | Facile | Complexe |

---

## 🚀 Recommandation: **Approche Hybride (Phased)**

### **Phase 1 (2-3 jours): WebSocket Recommendations**
```
✅ Gain immédiat pour l'UX
✅ Faible effort, haut impact
✅ Teste l'infrastructure WebSocket
→ Prépare la base pour Phase 2
```

### **Phase 2 (4-5 jours): SSE Job Stream**
```
✅ Real-time job updates
✅ Réutilise l'infra de la Phase 1 (Redis)
→ Airflow continue en parallel (batch + stream)
```

### **Phase 3 (10-15 jours): Kafka (Optionnel)**
```
✅ Pipeline temps réel complète
✅ Production-grade, haute performance
→ Remplace progressivement Airflow batch
```

---

## 💻 Détail Technique: Option 1 (WebSocket)

### Stack à Ajouter
```
pip install websockets redis python-socketio
```

### Fichiers à Créer
```
api/
  ├── websocket/
  │   ├── __init__.py
  │   └── connection_manager.py  (50 lignes)
  └── routes/
      └── stream_recommend.py     (80 lignes)
```

### Fichiers à Modifier (MINIMAL)
```
api/main.py                       (+5 lignes)
requirements.txt                  (+3 packages)
```

### Exemple de Code Réutilisable

```python
# 🟢 100% réutilisable: api/routes/stream_recommend.py
from fastapi import WebSocket, APIRouter
from api.services.recommendation_service import recommender

router = APIRouter()

@router.websocket("/ws/recommend")
async def websocket_recommend(websocket: WebSocket):
    await websocket.accept()
    
    try:
        query = await websocket.receive_text()
        
        # 🔄 Réutiliser le moteur NLP existant
        for chunk in recommender.recommend_stream(query):
            await websocket.send_json(chunk)
            
    finally:
        await websocket.close()
```

```python
# 🟢 90% réutilisable: api/services/recommendation_service.py
class RecommendationService:
    
    def recommend_stream(self, query: str):
        """Wrapper pour streaming - réutilise recommend()"""
        results = self.recommend(query)  # Code existant
        
        # Transformer en chunks pour WebSocket
        for i, job in enumerate(results['jobs']):
            yield {
                'index': i,
                'job': job,
                'confidence': results['confidence'][i],
                'status': 'streaming'
            }
```

---

## 📋 Plan d'Action: Option 1 (Recommandée)

### **Jour 1: Infrastructure de Base (4h)**

```bash
# Terminal 1: Ajouter Redis
docker run -d -p 6379:6379 redis:latest

# Terminal 2: Ajouter WebSocket support
pip install websockets redis aioredis

# Terminal 3: Tester connexion
redis-cli ping  # → PONG ✅
```

### **Jour 1 (suite): Adapter le Service (3h)**

```python
# 📝 File: api/services/recommendation_service.py (AJOUTER)

import redis
from typing import Generator

class RecommendationServiceWithStreaming:
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379)
        self.cache_ttl = 3600  # 1 heure
        
    def recommend_stream(self, query: str) -> Generator:
        """Stream recommendations avec cache Redis"""
        cache_key = f"recommend:{query}"
        
        # Check cache
        cached = self.redis_client.get(cache_key)
        if cached:
            yield json.loads(cached)
            return
            
        # Appeler le moteur existant
        results = self.recommend(query)  # 100% existant!
        
        # Chunker et streamer
        for job in results.get('jobs', [])[:50]:  # Top 50
            chunk = {
                'job_id': job['id'],
                'title': job['title'],
                'score': job.get('match_score', 0)
            }
            yield chunk
            
        # Cacher les résultats
        self.redis_client.setex(
            cache_key, 
            self.cache_ttl, 
            json.dumps(results)
        )
```

### **Jour 2: WebSocket Endpoint (3h)**

```python
# 📝 File: api/routes/stream_recommend.py (CRÉER)

from fastapi import WebSocket, APIRouter
from api.services.recommendation_service import recommender

router = APIRouter()

@router.websocket("/ws/recommend/{query}")
async def websocket_recommend(websocket: WebSocket, query: str):
    await websocket.accept()
    
    try:
        for chunk in recommender.recommend_stream(query):
            await websocket.send_json(chunk)
            await asyncio.sleep(0.1)  # Throttle
            
    except Exception as e:
        await websocket.send_json({'error': str(e)})
    finally:
        await websocket.close()
```

### **Jour 2 (suite): Intégrer dans FastAPI (2h)**

```python
# 📝 File: api/main.py (MODIFIER)

from api.routes import stream_recommend  # AJOUTER

app.include_router(
    stream_recommend.router, 
    prefix="/stream", 
    tags=["Streaming"]
)  # AJOUTER
```

### **Jour 3: Frontend React (3h)**

```javascript
// 📝 File: frontend/src/hooks/useStreamRecommend.js (CRÉER)

export const useStreamRecommend = (query) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (!query) return;
        
        const ws = new WebSocket(`ws://localhost:8000/stream/ws/recommend/${query}`);
        setLoading(true);
        
        ws.onmessage = (event) => {
            const chunk = JSON.parse(event.data);
            setJobs(prev => [...prev, chunk.job]);
        };
        
        ws.onerror = () => setLoading(false);
        ws.onclose = () => setLoading(false);
        
        return () => ws.close();
    }, [query]);
    
    return { jobs, loading };
};
```

### **Jour 3 (suite): Tests + Debugging (2h)**

```bash
# ✅ Tester la connexion WebSocket
wscat -c ws://localhost:8000/stream/ws/recommend/python%20engineer

# ✅ Monitor Redis
redis-cli MONITOR

# ✅ Vérifier logs
tail -f logs/api.log
```

---

## 📊 Résumé des Efforts

### **Option 1: WebSocket (RECOMMANDÉE)**
- **Temps Total:** 10-11 heures = **2-3 jours** (1 développeur)
- **Code Neuf:** ~150 lignes Python + 50 lignes JavaScript
- **Code Modifié:** ~5 lignes
- **Code Réutilisé:** 85%
- **Valeur Ajoutée:** ⭐⭐⭐⭐⭐ (UX excellente, temps réel)

### **Option 2: SSE Jobs Stream**
- **Temps Total:** 16-18 heures = **4-5 jours** (1 développeur)
- **Code Neuf:** ~250 lignes Python + 80 lignes JavaScript
- **Code Modifié:** ~20 lignes
- **Code Réutilisé:** 75%
- **Valeur Ajoutée:** ⭐⭐⭐⭐ (Live updates intéressantes)

### **Option 3: Kafka Pipeline**
- **Temps Total:** 28-30 heures = **10-15 jours** (équipe de 2)
- **Code Neuf:** ~500+ lignes Python
- **Code Modifié:** ~50 lignes
- **Code Réutilisé:** 60%
- **Valeur Ajoutée:** ⭐⭐⭐⭐⭐ (Production-grade)

---

## ✅ Conclusion

**Pour votre projet, je recommande:**

1. **Phase 1 (Immédiate):** Option 1 - WebSocket Recommendations
   - ROI élevé, effort minimal
   - Impression immediate sur l'UX
   - 2-3 jours de travail

2. **Phase 2 (À court terme):** Option 2 - SSE Job Stream
   - Complète le streaming
   - Réutilise infra de Phase 1
   - 4-5 jours supplémentaires

3. **Phase 3 (Futur):** Option 3 - Kafka
   - Seulement si volume énorme (millions de jobs/jour)
   - Production-grade, scalabilité max
   - 10-15 jours d'investissement

**En réutilisant 75-85% du code existant, vous gagnez 3-5 semaines de développement! 🚀**

