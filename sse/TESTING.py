"""
Testing Guide - Tests complets pour le module SSE
"""

# ═══════════════════════════════════════════════════════════
# 1. TEST TERMINAL - Vérifier la connexion SSE
# ═══════════════════════════════════════════════════════════

# Terminal 1: Démarrer le serveur
# cd c:\Users\MOI\Desktop\DW_DL\job-intelligent-dashbord-1
# (env activation)
# python -m uvicorn api.main:app --reload --port 8000

# Terminal 2: Se connecter au flux SSE
# curl -N "http://localhost:8000/sse/stream?client_id=test_client_1" \
#   -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Vous devriez voir:
# data: {"type": "...", "data": {...}, "timestamp": "..."}
# (un heartbeat toutes les 30s si pas d'événement)


# ═══════════════════════════════════════════════════════════
# 2. BROADCASTER UN ÉVÉNEMENT (depuis un autre terminal)
# ═══════════════════════════════════════════════════════════

# curl -X POST "http://localhost:8000/sse/broadcast?event_type=job_created" \
#   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"job_id": 123, "title": "Senior Engineer", "company": "Tech Corp"}'

# Le terminal 2 devrait recevoir l'événement en direct!


# ═══════════════════════════════════════════════════════════
# 3. TEST AVEC PYTHON (Script de test)
# ═══════════════════════════════════════════════════════════

import requests
import json
import asyncio
from sseclient import SSEClient

# Récupérer un token (remplacer par votre token)
TOKEN = "YOUR_JWT_TOKEN"  # À obtenir via login
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def test_sse_connection():
    """Tester la connexion SSE"""
    print("🔌 Connexion au flux SSE...")
    
    url = "http://localhost:8000/sse/stream?client_id=python_test_client"
    
    try:
        response = requests.get(url, headers=HEADERS, stream=True, timeout=60)
        
        if response.status_code == 200:
            print("✅ Connexion établie!")
            
            client = SSEClient(response)
            for event in client:
                if event.event:
                    print(f"📨 Événement reçu: {event.event}")
                    print(f"   Données: {event.data}")
                else:
                    print("💓 Heartbeat reçu")
        else:
            print(f"❌ Erreur: {response.status_code}")
            print(response.text)
    
    except KeyboardInterrupt:
        print("\n🛑 Connexion fermée par l'utilisateur")
    except Exception as e:
        print(f"❌ Erreur: {e}")


def test_broadcast():
    """Broadcaster un événement de test"""
    print("📤 Broadcasting un événement...")
    
    url = "http://localhost:8000/sse/broadcast"
    params = {
        "event_type": "job_created"
    }
    data = {
        "job_id": 42,
        "title": "Data Engineer",
        "company": "Google"
    }
    
    try:
        response = requests.post(
            url,
            params=params,
            json=data,
            headers=HEADERS
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Event broadcasté!")
            print(f"   Clients connectés: {result['clients']['connected_clients']}")
        else:
            print(f"❌ Erreur: {response.status_code}")
            print(response.text)
    
    except Exception as e:
        print(f"❌ Erreur: {e}")


def test_stats():
    """Récupérer les stats SSE"""
    print("📊 Récupération des stats...")
    
    url = "http://localhost:8000/sse/stats"
    
    try:
        response = requests.get(url, headers=HEADERS)
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Stats SSE:")
            print(f"   Clients connectés: {stats['connected_clients']}")
            print(f"   Historique: {stats['event_history_size']} événements")
            print(f"   Timestamp: {stats['timestamp']}")
        else:
            print(f"❌ Erreur: {response.status_code}")
    
    except Exception as e:
        print(f"❌ Erreur: {e}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python test_sse.py [stream|broadcast|stats|all]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "stream":
        test_sse_connection()
    elif command == "broadcast":
        test_broadcast()
    elif command == "stats":
        test_stats()
    elif command == "all":
        test_stats()
        print()
        test_broadcast()


# ═══════════════════════════════════════════════════════════
# 4. TEST JAVASCRIPT/REACT (Frontend)
# ═══════════════════════════════════════════════════════════

"""
// Frontend test - à mettre dans une page React

import { useEffect, useState } from 'react';

export function SSETestPage() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(
      'http://localhost:8000/sse/stream?client_id=react_test',
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    eventSource.onopen = () => {
      console.log('✅ Connecté au flux SSE');
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Événement SSE:', data);
        setEvents(prev => [data, ...prev]);
      } catch (e) {
        console.error('Erreur parse SSE:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ Erreur SSE:', error);
      setConnected(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4">
        Test SSE {connected ? '✅' : '❌'}
      </h2>

      <div className="grid gap-4">
        <div>
          <h3>Événements reçus: {events.length}</h3>
          <div className="max-h-96 overflow-y-auto border rounded p-4">
            {events.map((event, i) => (
              <div key={i} className="mb-3 p-3 bg-gray-100 rounded text-xs">
                <strong>{event.type}</strong>
                <pre>{JSON.stringify(event.data, null, 2)}</pre>
                <small className="text-gray-500">{event.timestamp}</small>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(
              'http://localhost:8000/sse/broadcast?event_type=test_event',
              {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
            const data = await res.json();
            console.log('Broadcast result:', data);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Envoyer un événement de test
        </button>
      </div>
    </div>
  );
}
"""


# ═══════════════════════════════════════════════════════════
# 5. TEST INTEGRATION - Ajouter SSE dans une vraie route
# ═══════════════════════════════════════════════════════════

"""
# Dans api/routes/recommend.py, ajouter:

from sse.manager import sse_manager

@router.post("/profile/")
async def match_by_profile(request: ProfileMatchingRequest):
    # Notifier le début de la recherche
    await sse_manager.broadcast(
        event_type="search_started",
        data={"message": "Recherche de recommandations en cours..."}
    )
    
    # Faire le matching...
    results = recommender.recommend(query)
    
    # Notifier la fin
    await sse_manager.broadcast(
        event_type="search_completed",
        data={
            "results_count": len(results.get('recommendations', [])),
            "message": "Recommandations prêtes!"
        }
    )
    
    return results
"""


# ═══════════════════════════════════════════════════════════
# 6. CHECKLIST DE TEST
# ═══════════════════════════════════════════════════════════

"""
✅ Checklist de test SSE:

[ ] 1. Démarrer le serveur FastAPI
[ ] 2. Vérifier que /sse/stats retourne 200
[ ] 3. Connecter 1 client SSE (curl -N)
[ ] 4. Envoyer un broadcast depuis un autre terminal
[ ] 5. Vérifier que le client reçoit l'événement
[ ] 6. Connecter 3-4 clients SSE simultanément
[ ] 7. Envoyer un broadcast et vérifier que tous les reçoivent
[ ] 8. Fermer 1 client et vérifier les stats
[ ] 9. Tester le timeout (30s sans événement = heartbeat)
[ ] 10. Intégrer SSE dans une vraie route
[ ] 11. Tester depuis React/Frontend
[ ] 12. Vérifier les logs du serveur
[ ] 13. Tester avec plusieurs utilisateurs simultanés
[ ] 14. Vérifier la mémoire/fuites de ressources
[ ] 15. Documenter les résultats
"""


# ═══════════════════════════════════════════════════════════
# 7. OBTENIR UN JWT TOKEN POUR TESTER
# ═══════════════════════════════════════════════════════════

"""
# 1. Login via l'API
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'

# Réponse:
# {"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "token_type": "bearer"}

# 2. Utiliser ce token dans les tests:
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -N "http://localhost:8000/sse/stream?client_id=test" \
  -H "Authorization: Bearer $TOKEN"
"""


# ═══════════════════════════════════════════════════════════
# 8. TROUBLESHOOTING
# ═══════════════════════════════════════════════════════════

"""
❌ Problème: "401 Unauthorized"
✅ Solution: Vérifier que le token JWT est valide et non expiré

❌ Problème: Pas de heartbeat après 30s
✅ Solution: Normal - cela maintient la connexion ouverte

❌ Problème: Client ne reçoit pas les broadcasts
✅ Solution: Vérifier que le client est connecté (/sse/stats)

❌ Problème: Erreur "Connection timeout"
✅ Solution: Vérifier que le serveur écoute sur le port 8000

❌ Problème: Les événements anciens ne sont pas reçus
✅ Solution: Ils sont reçus si le max_history n'est pas dépassé (100 par défaut)

❌ Problème: Croissance infinie de la mémoire
✅ Solution: Vérifier que les clients ferment correctement les connexions
"""
