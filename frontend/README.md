# Job Intelligent - Frontend

Frontend React + Vite pour la plateforme de centralisation et recommandation d'offres d'emploi Data.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 16+
- npm ou pnpm

### Installation

```bash
npm install
# ou
pnpm install
```

### Configuration

Créer un fichier `.env.local` :

```env
VITE_API_URL=http://localhost:8000
```

### Démarrage du serveur de développement

```bash
npm run dev
# ou
pnpm dev
```

L'application sera accessible à `http://localhost:3000`

## 📁 Structure du projet

```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── Navbar.jsx
│   │   ├── JobCard.jsx
│   │   ├── SearchBar.jsx
│   │   ├── NLPSearchBar.jsx
│   │   ├── FilterPanel.jsx
│   │   ├── Pagination.jsx
│   │   ├── MatchScore.jsx
│   │   ├── ProfileForm.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/               # Pages de l'application
│   │   ├── Home.jsx         # Job Board
│   │   ├── Recommendations.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── Dashboard.jsx
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.js
│   │   └── useApi.js
│   ├── services/            # Services API
│   │   └── api.js           # Configuration Axios + endpoints
│   ├── context/             # Context React
│   │   └── AuthContext.jsx
│   ├── App.jsx              # Router principal
│   ├── main.jsx             # Point d'entrée
│   └── index.css            # Styles globaux
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── .env.local               # Variables d'environnement
```

## 🎨 Stack technique

- **React 18** - Framework UI
- **Vite** - Build tool
- **React Router 6** - Routing
- **Axios** - HTTP client
- **Tailwind CSS 3.4** - Styling
- **Lucide React** - Icônes
- **Recharts** - Graphiques

## 🔑 Fonctionnalités

### Pages publiques
- **Accueil** : Job board avec recherche et filtres
- **Recommandations** : Résultats du matching AI basé sur la requête NLP
- **Connexion** : Authentification par email/password
- **Inscription** : Création de compte avec validation de mot de passe

### Pages protégées (authentification requise)
- **Dashboard** : Espace utilisateur avec 3 onglets
  - **Profil** : Édition des informations et préférences
  - **Favoris** : Liste des offres sauvegardées
  - **Historique** : Historique des recherches NLP

## 🔐 Authentification

- JWT stocké en localStorage
- Interceptors Axios pour ajouter le token à chaque requête
- Redirection automatique vers `/login` si token invalide (401)
- Context AuthContext pour gérer l'état global

## 📡 API Integration

Tous les appels API sont centralisés dans `src/services/api.js` :

```javascript
import { jobsAPI, authAPI, favoritesAPI } from './services/api';

// Exemples
jobsAPI.getJobs(skip, limit, query);
authAPI.login(email, password);
favoritesAPI.addFavorite(jobId);
```

## 🎨 Design System

**Couleurs :**
- Primary: `#2563eb` (Bleu royal)
- Accent: `#10b981` (Émeraude)
- Warning: `#f59e0b` (Orange)
- Danger: `#ef4444` (Rouge)
- Background: `#f8fafc` (Gris très clair)

**Police :** Inter (Google Fonts)

## 🔗 Intégration Backend

Le frontend communique avec le backend FastAPI sur `http://localhost:8000`.

Endpoints supportés :
- `GET /jobs/` - Lister les offres
- `GET /recommend/?query=...` - Matching AI
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `GET /auth/me` - Profil utilisateur
- `PUT /auth/profile` - Mise à jour profil
- `GET/POST/DELETE /favorites` - Gestion des favoris

## 📦 Build pour production

```bash
npm run build
npm run preview
```

## 📝 Notes de développement

- Les variables d'environnement sont chargées depuis `.env.local`
- Le debounce de la recherche est fixé à 300ms
- Les favoris et l'historique nécessitent une authentification
- Les routes protégées redirigent vers `/login` si non authentifié
