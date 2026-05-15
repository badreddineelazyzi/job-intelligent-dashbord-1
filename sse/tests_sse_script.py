#!/usr/bin/env python3
"""
Script de test SSE - Exécutable
Usage: python tests_sse_script.py [stream|broadcast|stats|all]
"""

import requests
import sys
import time
from typing import Optional

# Configuration
API_URL = "http://localhost:8000"
TOKEN = None  # À définir après login

def get_token(email: str, password: str) -> str:
    """Récupérer un JWT token"""
    print(f"🔐 Login avec {email}...")
    
    response = requests.post(
        f"{API_URL}/auth/login",
        json={"email": email, "password": password}
    )
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✅ Token obtenu: {token[:50]}...")
        return token
    else:
        print(f"❌ Login échoué: {response.status_code}")
        print(response.text)
        sys.exit(1)


def test_stats(token: str):
    """Test 1: Récupérer les stats SSE"""
    print("\n" + "="*60)
    print("TEST 1: Stats SSE")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{API_URL}/sse/stats",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Stats obtenues:")
            print(f"   📊 Clients connectés: {stats['connected_clients']}")
            print(f"   📜 Historique: {stats['event_history_size']} événements")
            print(f"   ⏰ Timestamp: {stats['timestamp']}")
            return True
        else:
            print(f"❌ Erreur: {response.status_code}")
            print(response.text)
            return False
    
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def test_broadcast(token: str):
    """Test 2: Broadcaster un événement"""
    print("\n" + "="*60)
    print("TEST 2: Broadcaster un événement")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    test_events = [
        {
            "type": "job_created",
            "data": {"job_id": 1, "title": "Senior Engineer", "company": "Tech Corp"}
        },
        {
            "type": "recommendation_ready",
            "data": {"count": 5, "query": "Python Developer"}
        },
        {
            "type": "system_alert",
            "data": {"message": "Alerte test SSE", "level": "info"}
        }
    ]
    
    for i, event in enumerate(test_events, 1):
        print(f"\n📤 Envoi événement {i}/{len(test_events)}: {event['type']}")
        
        try:
            response = requests.post(
                f"{API_URL}/sse/broadcast",
                params={"event_type": event['type']},
                json=event['data'],
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Broadcasté à {result['clients']['connected_clients']} clients")
            else:
                print(f"   ❌ Erreur: {response.status_code}")
                return False
            
            time.sleep(1)  # Petit délai entre les événements
        
        except Exception as e:
            print(f"   ❌ Exception: {e}")
            return False
    
    return True


def test_stream_connection(token: str, duration: int = 15):
    """Test 3: Se connecter au flux SSE et attendre les événements"""
    print("\n" + "="*60)
    print(f"TEST 3: Connexion au flux SSE (durée: {duration}s)")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"🔌 Connexion au flux SSE...")
    print(f"   (Envoyez des événements depuis un autre terminal)")
    print(f"   ⏱️  Écoute pendant {duration} secondes...")
    print()
    
    try:
        response = requests.get(
            f"{API_URL}/sse/stream?client_id=test_client_{int(time.time())}",
            headers=headers,
            stream=True,
            timeout=duration + 5
        )
        
        if response.status_code != 200:
            print(f"❌ Erreur: {response.status_code}")
            return False
        
        print("✅ Connexion établie!")
        print("📨 En attente d'événements...\n")
        
        event_count = 0
        start_time = time.time()
        
        for line in response.iter_lines():
            if time.time() - start_time > duration:
                print(f"\n⏰ Timeout atteint ({duration}s)")
                break
            
            if line and isinstance(line, bytes):
                line = line.decode('utf-8')
            
            if line.startswith('data: '):
                data = line[6:]  # Enlever "data: "
                
                try:
                    import json
                    event = json.loads(data)
                    event_count += 1
                    
                    print(f"📨 Événement #{event_count}:")
                    print(f"   Type: {event.get('type', 'unknown')}")
                    print(f"   Data: {event.get('data')}")
                    print(f"   ⏰ {event.get('timestamp')}")
                    print()
                
                except:
                    pass  # Heartbeat ou données invalides
            
            elif line == ":":
                print("💓 Heartbeat reçu")
        
        print(f"\n✅ {event_count} événement(s) reçu(s)")
        return True
    
    except requests.exceptions.ReadTimeout:
        print(f"✅ Timeout normal après {duration}s")
        return True
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def main():
    """Fonction principale"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║             SSE Module - Test Suite                       ║
║  Job Intelligence Dashboard - Server-Sent Events Testing  ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    if len(sys.argv) < 2:
        print("Usage: python tests_sse_script.py [stats|broadcast|stream|all]")
        print("\nOptions:")
        print("  stats     - Récupérer les stats SSE")
        print("  broadcast - Tester le broadcast d'événements")
        print("  stream    - Se connecter au flux SSE et écouter")
        print("  all       - Exécuter tous les tests")
        sys.exit(1)
    
    command = sys.argv[1]
    
    # Login
    email = input("📧 Email: ") or "wissal.selmane@etu.uae.ac.ma"
    password = input("🔑 Password: ") or "password123"
    
    print()
    token = get_token(email, password)
    
    # Exécuter les tests
    results = {}
    
    if command in ["stats", "all"]:
        results["stats"] = test_stats(token)
    
    if command in ["broadcast", "all"]:
        results["broadcast"] = test_broadcast(token)
    
    if command in ["stream", "all"]:
        results["stream"] = test_stream_connection(token, duration=15)
    
    # Résumé
    print("\n" + "="*60)
    print("RÉSUMÉ DES TESTS")
    print("="*60)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper():20} {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "="*60)
    if all_passed:
        print("🎉 TOUS LES TESTS RÉUSSIS!")
    else:
        print("⚠️  CERTAINS TESTS ONT ÉCHOUÉ")
    print("="*60)
    
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
