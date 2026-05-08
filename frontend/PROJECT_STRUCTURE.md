# Structure détaillée du Frontend

## 📦 Organisation des dossiers

### `src/components/` - Composants réutilisables

#### Composants de navigation
- **`Navbar.jsx`** - Barre de navigation avec menu mobile
  - Navigation vers Home/Recommendations
  - Affichage de l'utilisateur connecté
  - Boutons Login/Signup ou Logout

#### Composants de recherche
- **`NLPSearchBar.jsx`** - Barre de recherche NLP avancée
  - Input large arrondi avec icônes
  - Suggestions rapides en badges
  - Navigation vers `/recommendations?query=...`

- **`SearchBar.jsx`** - Barre de recherche classique
  - Input simple avec debounce 300ms
  - Utilisée sur la page d'accueil

#### Composants de filtrage
- **`FilterPanel.jsx`** - Panneau de filtres accordéon
  - Filtres : compétences, localisation, contrat, expérience, source
  - Bouton réinitialiser

#### Composants d'affichage
- **`JobCard.jsx`** - Carte d'une offre d'emploi
  - Titre, entreprise, localisation
  - Compétences (surlignées si matchées)
  - Bouton favori et "Voir"
  - MatchScore optionnel

- **`MatchScore.jsx`** - Affichage du score de correspondance
  - Cercle SVG animé avec pourcentage
  - Couleurs dynamiques : vert (90+), bleu (70-89), orange (50-69), gris (<50)

- **`Pagination.jsx`** - Composant de pagination
  - Boutons précédent/suivant
  - Numéros de page avec ellipsis

#### Composants de profil
- **`ProfileForm.jsx`** - Formulaire de profil utilisateur
  - Mode lecture (affichage) par défaut
  - Mode édition avec tous les champs éditables
  - Validation (salary_min < salary_max)
  - Tags pour les compétences

#### Composants d'authentification
- **`ProtectedRoute.jsx`** - HOC pour les routes protégées
  - Redirectionne vers `/login` si non authentifié
  - Affiche un loader pendant la vérification

### `src/pages/` - Pages de l'application

- **`Home.jsx`** - Accueil / Job Board
  - Section hero avec NLPSearchBar
  - Statistiques (offres, entreprises, etc.)
  - Job board avec SearchBar, FilterPanel
  - Pagination

- **`Recommendations.jsx`** - Résultats du matching AI
  - En-tête avec la query affichée
  - NLPSearchBar pré-remplie
  - Liste de JobCards avec MatchScore
  - Gestion des états : loading, vide, résultats

- **`Login.jsx`** - Page de connexion
  - Formulaire email/password
  - Validation en temps réel
  - Toggle visibilité du mot de passe
  - Checkbox "Se souvenir de moi"
  - Lien vers inscription

- **`Signup.jsx`** - Page d'inscription
  - Formulaire avec nom, email, password, confirmation
  - Validation du mot de passe (8+ chars, majuscule, chiffre)
  - Barre de force du mot de passe
  - Checkbox CGU (obligatoire)
  - Lien vers connexion

- **`Dashboard.jsx`** - Espace utilisateur (protégé)
  - En-tête avec infos utilisateur et bouton "Modifier"
  - 3 onglets :
    1. **Mon profil** - ProfileForm en mode lecture/édition
    2. **Mes favoris** - Grille de JobCards sauvegardés
    3. **Historique** - Liste des recherches NLP récentes

### `src/hooks/` - Custom hooks

- **`useAuth.js`** - Hook pour accéder au contexte d'authentification
  - Retourne : `{ user, isAuthenticated, isLoading, login, logout, updateProfile }`
  - Lève une erreur si utilisé hors AuthProvider

- **`useApi.js`** - Hook pour les appels API
  - Retourne : `{ data, isLoading, error }`
  - Gère les erreurs automatiquement

### `src/services/` - Services API

- **`api.js`** - Configuration Axios centralisée
  - Base URL depuis `.env.local`
  - Interceptors pour JWT et gestion 401
  - Objets regroupés par domaine :
    - `authAPI` : register, login, getProfile, updateProfile
    - `jobsAPI` : getJobs, getJobById, getRecommendations
    - `favoritesAPI` : getFavorites, addFavorite, removeFavorite
    - `searchHistoryAPI` : getHistory

### `src/context/` - Context React

- **`AuthContext.jsx`** - Contexte global d'authentification
  - Gère l'état utilisateur
  - Persiste le token en localStorage
  - Vérifie l'auth au chargement initial
  - Fournit : `{ user, isAuthenticated, isLoading, login, logout, updateProfile }`

### Fichiers racines `src/`

- **`App.jsx`** - Routeur principal
  - Routes publiques : `/`, `/recommendations`, `/login`, `/signup`
  - Routes protégées : `/dashboard`
  - Wrapper AuthProvider

- **`main.jsx`** - Point d'entrée React
  - Bootstrap de l'app

- **`index.css`** - Styles globaux
  - Directives Tailwind
  - Styles du scrollbar
  - Reset CSS

## 🎯 Flux de données

### Authentification
```
Login/Signup → authAPI.login() → JWT en localStorage 
→ AuthContext.login() → Stockage user en state + localStorage 
→ Redirect /dashboard
```

### Recherche d'offres
```
SearchBar (debounce) → fetchJobs() → jobsAPI.getJobs() 
→ State jobs + totalPages → JobCards
```

### Matching AI
```
NLPSearchBar → /recommendations?query=X 
→ jobsAPI.getRecommendations() → JobCards avec MatchScore
```

### Favoris (authentifié)
```
Button ❤️ → favoritesAPI.addFavorite() 
→ Mise à jour locale + refresh list
```

## 📊 States principaux

### Niveau global (AuthContext)
- `user` : Données utilisateur ou null
- `isAuthenticated` : Boolean
- `isLoading` : Boolean (vérification auth initial)

### Niveau page
- `jobs` : Array des offres
- `isLoading` : Boolean
- `currentPage` : Numéro de page
- `totalPages` : Nombre de pages
- `searchQuery` : String de recherche
- `filters` : Object avec tous les filtres

### Niveau composant
- Dépend du composant (ex: ProfileForm gère son form state)

## 🎨 Palette de couleurs Tailwind

```javascript
{
  primary: '#2563eb',      // Bleu royal - CTA principal
  'primary-dark': '#1d4ed8', // Bleu foncé - Hover
  'primary-light': '#dbeafe', // Bleu très clair - Fond léger
  accent: '#10b981',       // Émeraude - Match success
  warning: '#f59e0b',      // Orange - Avertissements
  danger: '#ef4444',       // Rouge - Erreurs/Delete
  bg: '#f8fafc',           // Très clair - Fond principal
  card: '#ffffff',         // Blanc - Cards
  text: '#0f172a',         // Très foncé - Texte principal
  'text-secondary': '#64748b', // Gris - Texte secondaire
}
```

## 🔧 Configuration

### Vite (`vite.config.js`)
- Port 3000
- Proxy API vers http://localhost:8000

### Tailwind (`tailwind.config.js`)
- Couleurs personnalisées
- Font family Inter

### TypeScript (`tsconfig.json`)
- Preset React + Vite

## 🚀 Points d'entrée

1. **Utilisateur public** : `/` → Home.jsx
2. **Recherche NLP** : `/` → NLPSearchBar → `/recommendations`
3. **Authentification** : `/login` ou `/signup`
4. **Espace personnel** : `/dashboard` (protégé)

## 📚 Dépendances principales

- `react@^18.3.1` - Framework
- `react-dom@^18.3.1` - Rendering
- `react-router-dom@^6.20.1` - Routing
- `axios@^1.6.5` - HTTP client
- `lucide-react@^0.356.0` - Icônes
- `recharts@^2.10.3` - Graphiques
- `tailwindcss@^3.4.1` - Styling
