# INTEGRATION_GUIDE.md - Guide d'intégration SSE

## 🎯 Objectif

Intégrer le module SSE isolé dans l'API FastAPI existante **sans casser le code existant**.

## ✅ Étapes d'intégration

### 1️⃣ Ajouter l'import du router SSE dans `api/main.py`

Ouvrir `api/main.py` et ajouter après les autres imports de routers:

```python
# api/main.py

# ... imports existants ...
from api.routes.recommend import router as recommend_router
from api.routes.jobs import router as jobs_router
# ... autres routers ...

# ✅ NOUVEAU - Importer le router SSE
from sse.routes import router as sse_router

# ... configuration CORS ...

# Enregistrer les routers
app.include_router(recommend_router)
app.include_router(jobs_router)
# ... autres routers ...

# ✅ NOUVEAU - Enregistrer le router SSE
app.include_router(sse_router)
```

### 2️⃣ Vérifier que l'API démarre

```bash
python -m uvicorn api.main:app --reload --port 8000
```

Vous devriez voir dans les logs:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Et les endpoints SSE devraient être disponibles:
```
GET  /sse/stream
POST /sse/broadcast
GET  /sse/stats
```

### 3️⃣ Tester les endpoints SSE

#### Terminal 1: Démarrer le serveur
```bash
python -m uvicorn api.main:app --reload --port 8000
```

#### Terminal 2: Se connecter au flux SSE
```bash
# D'abord, récupérer un token (voir TESTING.py)
TOKEN="votre_jwt_token_ici"

curl -N "http://localhost:8000/sse/stream?client_id=test1" \
  -H "Authorization: Bearer $TOKEN"
```

#### Terminal 3: Envoyer un événement
```bash
curl -X POST "http://localhost:8000/sse/broadcast?event_type=job_created" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_id": 1, "title": "Python Engineer"}'
```

Le Terminal 2 devrait recevoir l'événement! ✅

### 4️⃣ Ajouter SSE broadcasts aux routes existantes

#### Exemple: Ajouter SSE au endpoint de recommandation

Ouvrir `api/routes/recommend.py` et ajouter:

```python
# En haut du fichier
from sse.manager import sse_manager

# Dans la fonction match_by_profile
@router.post("/profile/")
async def match_by_profile(
    request: ProfileMatchingRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ... code existant ...
    
    # 🆕 Notifier que la recherche a commencé
    await sse_manager.broadcast(
        event_type="search_started",
        data={
            "user_id": current_user.id,
            "query_used": query,
            "message": "Recommandations en cours..."
        }
    )
    
    # ... code de recommandation ...
    results = recommender.recommend(query)
    filtered_results = post_filter_results(results, request)
    
    # 🆕 Notifier que c'est prêt
    await sse_manager.broadcast(
        event_type="recommendation_ready",
        data={
            "user_id": current_user.id,
            "results_count": len(filtered_results.get("recommendations", [])),
            "message": "Recommandations prêtes!"
        }
    )
    
    return {
        "status": "success",
        "query_used": query,
        "results_count": len(filtered_results.get("recommendations", [])),
        "results": filtered_results
    }
```

### 5️⃣ Tester l'intégration côté frontend

Créer un hook React pour écouter les événements SSE:

```javascript
// frontend/src/hooks/useSSE.js
import { useEffect, useState } from 'react';

export function useSSE(eventType) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(
      `http://localhost:8000/sse/stream?client_id=react_${Date.now()}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (!eventType || message.type === eventType) {
          console.log(`📨 SSE Event: ${message.type}`, message.data);
          setData(message);
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
      eventSource.close();
    };

    return () => eventSource.close();
  }, [eventType]);

  return data;
}

// Utilisation dans un composant
export function RecommendationWithSSE() {
  const [results, setResults] = useState([]);
  const searchEvent = useSSE('recommendation_ready');

  useEffect(() => {
    if (searchEvent?.data?.results_count) {
      console.log(`✅ ${searchEvent.data.results_count} recommandations prêtes!`);
      // Mettre à jour l'UI...
    }
  }, [searchEvent]);

  return (
    <div>
      {searchEvent?.data?.message && (
        <div className="alert alert-info">
          {searchEvent.data.message}
        </div>
      )}
      {/* Afficher les résultats... */}
    </div>
  );
}
```

### 6️⃣ Lancer le test complet

```bash
# Installer les dépendances si nécessaire
pip install sseclient-py

# Lancer le script de test
python sse/tests_sse_script.py all
```

## 📊 Checklist d'intégration

- [ ] Importer le router SSE dans `api/main.py`
- [ ] Vérifier que les endpoints SSE sont accessibles
- [ ] Tester la connexion SSE avec curl
- [ ] Tester le broadcast avec curl
- [ ] Ajouter `await sse_manager.broadcast()` à 1-2 routes existantes
- [ ] Créer des hooks React pour SSE
- [ ] Tester depuis le frontend React
- [ ] Vérifier les logs du serveur
- [ ] Documenter les événements SSE utilisés
- [ ] Tester avec plusieurs clients simultanés
- [ ] Vérifier la consommation mémoire
- [ ] Commit et push les changements

## 🐛 Troubleshooting

### ❌ "SSE module not found"
```bash
# Vérifier que le dossier sse/ existe
ls -la sse/
# Vérifier l'import dans api/main.py
```

### ❌ "401 Unauthorized"
```bash
# Vérifier que le token JWT est valide
# Récupérer un nouveau token via /auth/login
```

### ❌ "Connection refused"
```bash
# Vérifier que le serveur écoute sur le port 8000
lsof -i :8000
```

### ❌ Les événements ne sont pas reçus
```bash
# Vérifier que le client est bien connecté
curl http://localhost:8000/sse/stats

# Vérifier les logs du serveur
# Devrait voir: "✅ Client SSE connecté..."
```

## 📚 Ressources

- [sse/README.md](./README.md) - Documentation principale
- [sse/TESTING.py](./TESTING.py) - Guide de test détaillé
- [sse/routes.py](./routes.py) - Endpoints SSE
- [sse/manager.py](./manager.py) - Manager SSE

## ✨ Prochaines étapes optionnelles

1. **Mapper les événements par user_id** - Pour éviter les fuites de données
2. **Ajouter une base de données d'événements** - Pour persister et rejouer les événements
3. **Créer un dashboard SSE** - Pour monitorer les connexions en temps réel
4. **Ajouter des filtres d'événements** - Pour que les clients ne reçoivent que leurs événements
5. **Implémenter Redis PubSub** - Pour supporter plusieurs instances de l'API
6. **Ajouter des tests unitaires** - Pour la couche SSE

---

**Date**: May 2026  
**Status**: ✅ Prêt pour intégration
