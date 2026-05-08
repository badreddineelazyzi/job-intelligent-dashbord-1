# 🚀 Quick Start - Frontend Job Intelligent

## En 3 étapes

### 1️⃣ Installation
```bash
cd frontend
npm install
```

### 2️⃣ Configuration
Créer `frontend/.env.local` :
```env
VITE_API_URL=http://localhost:8000
```

### 3️⃣ Démarrage
```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) 🎉

---

## 📋 Prérequis

- ✅ Node.js 16+ et npm/pnpm
- ✅ Backend FastAPI tournant sur `http://localhost:8000`
- ✅ Navigateur moderne (Chrome, Firefox, Safari, Edge)

---

## 🗂️ Structure minimale créée

```
frontend/
├── src/
│   ├── components/      # 9 composants réutilisables
│   ├── pages/           # 5 pages principales
│   ├── hooks/           # Hooks d'auth et API
│   ├── services/        # Service API centralisé
│   ├── context/         # AuthContext global
│   ├── App.jsx          # Routeur principal
│   └── index.css        # Styles Tailwind
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── .env.local
```

---

## 📁 Pages disponibles

| Route | Page | Accès |
|-------|------|-------|
| `/` | Job Board | Public |
| `/recommendations?query=...` | Résultats IA | Public |
| `/login` | Connexion | Public |
| `/signup` | Inscription | Public |
| `/dashboard` | Profil + Favoris + Historique | Authentifié |

---

## 🎯 Composants clés

### 🔝 Barre de recherche NLP
```jsx
<NLPSearchBar />
```
- Recherche sémantique avec IA
- Suggestions rapides
- Redirection vers `/recommendations`

### 💼 Fiche d'offre
```jsx
<JobCard job={job} matchScore={95} matchedSkills={["Python", "SQL"]} />
```
- Affiche l'offre avec tous les détails
- Bouton favori
- MatchScore optionnel

### 🔐 Route protégée
```jsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```
- Redirige vers `/login` si non authentifié

---

## 🔗 API attendue du Backend

```
POST   /auth/register          # Inscription
POST   /auth/login             # Connexion
GET    /auth/me                # Profil (auth requise)
PUT    /auth/profile           # Mise à jour profil (auth requise)

GET    /jobs/?skip=0&limit=20  # Liste des offres
GET    /recommend/?query=...   # Matching AI

GET    /favorites              # Favoris (auth requise)
POST   /favorites              # Ajouter favori (auth requise)
DELETE /favorites/{id}         # Supprimer favori (auth requise)
```

---

## 🎨 Customisation facile

### Couleurs (dans `tailwind.config.js`)
```javascript
colors: {
  primary: '#2563eb',      // Bleu
  accent: '#10b981',       // Vert
  danger: '#ef4444',       // Rouge
  // ...
}
```

### Typage et validation
Tous les composants acceptent des props typées pour une meilleure DX.

---

## 🐛 Dépannage rapide

**❌ CORS error ?**
→ Vérifier que le backend autorise `http://localhost:3000`

**❌ 404 sur `/api/...` ?**
→ Vérifier que `VITE_API_URL` est correct

**❌ Page blanche ?**
→ Ouvrir la console (F12) et vérifier les erreurs

**❌ Erreur "Cannot find module" ?**
→ Relancer `npm install` et le dev server

---

## 📦 Build production

```bash
npm run build    # Crée le dossier dist/
npm run preview  # Prévisualise le build
```

---

## 🔑 Authentification

1. Créer un compte sur `/signup`
2. Les données sont stockées en localStorage
3. JWT envoyé automatiquement à chaque requête
4. Déconnexion supprime le token et les data locales

---

## 📚 Documentation complète

- **Détails composants** : `frontend/PROJECT_STRUCTURE.md`
- **Setup complet** : `SETUP.md` (racine)
- **README** : `frontend/README.md`

---

## 💡 Tips

- Tailwind est pré-configuré, pas besoin de CSS manuel
- Tous les endpoints API sont dans `src/services/api.js`
- Utiliser `useAuth()` pour accéder à l'utilisateur connecté
- Les routes protégées redirigent automatiquement

---

**Bon développement ! 🎉**
