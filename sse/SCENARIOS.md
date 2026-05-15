# 📡 Module SSE - Explications & Scénarios

## 🎯 Qu'est-ce que SSE (Server-Sent Events)?

**SSE** = Une **communication unidirectionnelle** du serveur vers les clients.

```
Client                                          Serveur
  ↑                                               ↑
  │                                               │
  │ 1. Se connecte & demande le flux            │
  ├──────────────────────────────────────────→  │
  │                                               │
  │ 2. Reste connecté et écoute                 │
  ├────────────────────── (connexion ouverte) ──│
  │                                               │
  │                                         Événement!
  │                                      (quelqu'un crée
  │                    3. Envoie l'événement    une offre)
  │  ←──────────────────────────────────────────┤
  │                                               │
  │ 4. Le client reçoit l'événement en direct   │
  │    (sans faire de requête!)                 │
  │                                               │
```

## 💡 Pourquoi SSE dans Job Dashboard?

Sans SSE:
```
Le client doit faire une requête toutes les X secondes:
GET /sse/stats  →  attendre la réponse  →  afficher  →  répéter...
❌ Inefficace, consomme beaucoup de bande passante, retard
```

Avec SSE:
```
Le serveur envoie les données en temps réel des qu'il y a un changement:
Nouvelle offre créée → Broadcast SSE → Le client reçoit instantanément
✅ Efficace, temps réel, économe en ressources
```

---

## 🎬 Scénarios d'Utilisation

### **Scénario 1: Notification en Temps Réel - Nouvelle Offre d'Emploi**

```
Timeline:

T0 - Admin crée une offre d'emploi sur le site
    └─> POST /jobs/create
        └─> Offre sauvegardée
        └─> ✅ SSE Broadcast: "job_created"
            └─> Tous les clients connectés reçoivent l'événement
                └─> La notification s'affiche dans l'app React

T1 - L'utilisateur John qui a SSE connecté:
    └─> Reçoit l'événement "job_created"
    └─> Son app React affiche: "🎉 Nouvelle offre: Senior Engineer chez Tech Corp"
    └─> Il peut cliquer pour voir les détails

T2 - L'utilisateur Maria qui est hors ligne:
    └─> Elle se reconnecte 10 min plus tard
    └─> L'historique SSE (100 derniers événements) lui est envoyé
    └─> Elle voit les offres qu'elle a manquées
```

**Bénéfices:**
- ✅ Les utilisateurs sont notifiés instantanément
- ✅ Pas besoin de rafraîchir manuellement
- ✅ Meilleure expérience utilisateur

---

### **Scénario 2: Suivi en Temps Réel - Recommandations**

```
Timeline:

T0 - Utilisateur clic sur "Obtenir mes recommandations"
    └─> POST /recommend/profile/
        └─> 🔍 Backend commence à chercher les offres...
        
T0.1 - SSE Broadcast: "search_started"
       └─> Client React reçoit
       └─> Affiche: "⏳ Recherche en cours..."
       └─> Spinner de chargement activé

T0 à T2 - Traitement (2 secondes)
       └─> Matching TF-IDF
       └─> Cross-encoder re-ranking
       └─> Post-filtrage

T2 - Résultats prêts
    └─> SSE Broadcast: "search_completed"
       └─> Inclut: nombre de résultats, durée, etc.
       └─> Client reçoit
       └─> Affiche: "✅ 12 recommandations trouvées!"
       └─> Spinner disparaît
       └─> Les résultats s'affichent

```

**Sans SSE (approche traditionnelle):**
```
Client fait:  POST /recommend/profile/  →  attend 2s  →  reçoit réponse  →  affiche
❌ Le client doit attendre que l'appel se termine
❌ Pas d'indication de progression
❌ Mauvaise UX si le traitement prend longtemps
```

**Avec SSE:**
```
Client fait:  POST /recommend/profile/  →  reçoit "search_started" immédiatement
           →  reçoit "search_completed" quand c'est prêt
✅ Feedback immédiat
✅ Indication de progression
✅ Meilleure UX
```

---

### **Scénario 3: Notifications d'Activité - CV Uploadé et Analysé**

```
Timeline:

T0 - Utilisateur upload son CV
    └─> POST /extract-cv (multipart/form-data)
        └─> CV envoyé
        
T0.5 - SSE Broadcast: "cv_uploaded"
       └─> Clients reçoivent
       └─> Affiche: "📄 Analyse du CV en cours avec Llama 3..."

T0.5 à T3 - Llama 3 analyse le CV
           └─> Extraction des skills
           └─> Détection du niveau d'expérience
           └─> Génération de requête de recherche

T3 - Analyse complétée
    └─> SSE Broadcast: "cv_analyzed"
       └─> Clients reçoivent + données extraites
       └─> Affiche les skills détectés
       └─> Lance automatiquement les recommandations

T3.5 - Recommandations lancées
      └─> SSE Broadcast: "search_started"
      └─> SSE Broadcast: "search_completed"
      └─> L'utilisateur voit les offres recommandées

```

---

### **Scénario 4: Dashboard Admin - Monitoring en Temps Réel**

```
Dashboard Admin affiche:
┌────────────────────────────────────────┐
│ 📊 Job Dashboard - Stats en Temps Réel│
├────────────────────────────────────────┤
│ Utilisateurs actifs: 42                │
│ Offres consultées (dernier: 2s)       │
│ Recommandations lancées: 8             │
│ Temps moyen recherche: 1.2s            │
│ CVs uploadés (dernier: 5s)            │
└────────────────────────────────────────┘

Flux d'événements SSE:
├─ job_created: Senior Engineer @ Google
├─ search_started: Data Engineer
├─ cv_uploaded: alice@example.com
├─ recommendation_ready: 15 résultats
├─ job_updated: Python dev salary +10%
├─ user_notification: Alice liked Job#42
└─ system_alert: CPU usage 85%
```

---

## 🔄 Flux Technique Détaillé

### **Architecture SSE dans le projet:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  useSSE Hook: Écoute les événements en temps réel    │   │
│  │  ├─ event.addEventListener('job_created', ...)      │   │
│  │  ├─ event.addEventListener('search_completed', ...) │   │
│  │  └─ Met à jour l'UI automatiquement                  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
         ↓ WebSocket/SSE
┌──────────────────────────────────────────────────────────────┐
│               Backend (FastAPI)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GET /sse/stream → Établit la connexion SSE         │   │
│  │                    (reste ouverte)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                        ↓                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /jobs/create → SSE Manager reçoit l'ordre      │   │
│  │  POST /recommend/profile/                           │   │
│  │  POST /extract-cv                                   │   │
│  │                        ↓                             │   │
│  │  await sse_manager.broadcast(                        │   │
│  │      event_type="job_created",                       │   │
│  │      data={...}                                      │   │
│  │  )                                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                        ↓                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SSE Manager: Stocke l'événement                     │   │
│  │  ├─ Ajoute à l'historique (100 max)                 │   │
│  │  ├─ L'envoie à toutes les queues connectées          │   │
│  │  └─ Log: "✅ job_created broadcasté à 5 clients"    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
         ↓ SSE Event Stream
┌──────────────────────────────────────────────────────────────┐
│                  Tous les Clients                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Client 1 reçoit: {type: "job_created", ...}        │   │
│  │  Client 2 reçoit: {type: "job_created", ...}        │   │
│  │  Client 3 reçoit: {type: "job_created", ...}        │   │
│  │                   (instantanément!)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Comparaison: Avant vs Après SSE

### **AVANT SSE (Polling)**

```
Utilisateur clique "Chercher recommandations"
↓
POST /recommend/profile/
↓
Attendre... ⏳ (2 secondes)
↓
Réponse: 200 OK + JSON (150 KB)
↓
Afficher les résultats

Problèmes:
❌ 2 secondes sans feedback
❌ L'utilisateur ne sait pas ce qui se passe
❌ Une seule requête = une grosse réponse
```

### **APRÈS SSE (Streaming)**

```
Utilisateur clique "Chercher recommandations"
↓
POST /recommend/profile/ (lance la recherche)
↓
SSE: "search_started" (instantanément)
└─> Affiche: "Recherche en cours..."
↓
SSE: "recommendation_ready" (après 2s)
└─> Affiche les résultats
↓
Multiple événements plus petits au lieu d'une grosse réponse

Bénéfices:
✅ Feedback immédiat
✅ Indication de progression
✅ Meilleure UX
✅ Communication optimisée
```

---

## 🛠️ Types d'Événements SSE Disponibles

| Événement | Quand | Données | Exemple |
|-----------|-------|---------|---------|
| `job_created` | Une offre est créée | job_id, title, company | Data Engineer @ Google |
| `job_updated` | Une offre est modifiée | job_id, updated_fields | Salaire augmenté |
| `job_deleted` | Une offre est supprimée | job_id | Offre expirée |
| `search_started` | Recherche lancée | query | "Python Developer Remote" |
| `search_completed` | Recherche finie | results_count, duration | 12 résultats en 1.2s |
| `recommendation_ready` | Recommandations prêtes | count, matching_scores | 5 offres avec scores |
| `cv_uploaded` | CV uploadé | user_id, file_name | alice.pdf |
| `cv_analyzed` | CV analysé par Llama 3 | skills, experience_level | ["Python", "SQL"], 3 ans |
| `user_notification` | Notification utilisateur | message, link | "New job matching your profile" |
| `system_alert` | Alerte système | severity, message | "Database backup completed" |

---

## ✨ Cas d'Usage Réels dans le Projet

### **1. Dashboard Utilisateur - Suivi des recherches**
```
Utilisateur fait une recherche
└─> Affiche: "Traitement en cours..."
└─> Après 2s:
    └─> "✅ 15 recommandations trouvées!"
    └─> Affiche les résultats automatiquement
```

### **2. Système de Notifications**
```
Admin crée une nouvelle offre
└─> Tous les utilisateurs connectés reçoivent une notification
└─> Ils voient l'offre en temps réel
```

### **3. Upload & Analyse CV**
```
Utilisateur upload son CV
└─> Affiche: "Analyse avec IA en cours..."
└─> Llama 3 extrait les skills
└─> Affiche les skills détectés
└─> Lance automatiquement les recommandations
```

### **4. Monitoring Admin**
```
Dashboard admin affiche:
└─> Nombre d'utilisateurs actifs (en temps réel)
└─> Dernières offres créées (live feed)
└─> Statistiques de recherche (mises à jour)
└─> Alertes système (instantanées)
```

---

## 🚀 Avantages SSE

✅ **Temps réel** - Les données arrivent instantanément  
✅ **Efficace** - Pas de polling, économe en ressources  
✅ **Meilleure UX** - Feedback immédiat aux utilisateurs  
✅ **Scalable** - Une seule connexion par client  
✅ **Simple** - Basé sur HTTP standard, pas besoin de WebSocket  
✅ **Fallback** - Fonctionne même avec les proxies HTTP  

---

## 📋 Résumé

**Le module SSE permet:**

1. **Communication serveur → client en temps réel**
2. **Notifications instantanées** (nouvelles offres, changements)
3. **Suivi en direct** (recherches, uploads, analyses)
4. **Meilleure expérience utilisateur** (feedback immédiat)
5. **Monitoring en temps réel** (dashboard admin)

**Sans affecter le code existant** - C'est un module isolé dans le dossier `sse/`.

---

**Prochaine étape**: Voir [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) pour intégrer SSE dans les routes existantes.
