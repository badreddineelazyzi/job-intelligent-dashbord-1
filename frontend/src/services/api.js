import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log("🔑 Token trouvé dans localStorage:", token ? "OUI" : "NON");
  console.log("📤 Requête:", config.method.toUpperCase(), config.url);
  console.log("📋 localStorage completo:", localStorage);
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    console.log("✅ Token ajouté au header Authorization");
  } else {
    console.warn("⚠️ AUCUN TOKEN TROUVÉ - La requête sera rejetée avec 401!");
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor pour gérer les erreurs 401 (non authentifié)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Endpoints d'authentification
export const authAPI = {
  register: (email, password, fullName) =>
    api.post('/auth/register', { email, password, full_name: fullName }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getProfile: () =>
    api.get('/auth/me'),
  updateProfile: (profileData) =>
    api.put('/auth/profile', profileData),
};

// Endpoints pour les offres d'emploi
export const jobsAPI = {
  getJobs: (skip = 0, limit = 20, query = '', filters = {}) => {
    return api.get('/jobs/', { 
      params: { 
        skip, 
        limit, 
        query,
        // On "étale" l'objet filters pour que chaque clé devienne un paramètre URL
        // Exemple: { location: 'Paris' } devient ?location=Paris
        ...filters 
      } 
    });
  },
  getJobById: (jobId) =>
    api.get(`/jobs/${jobId}`),
  getRecommendations: (query) =>
    api.get('/recommend/', { params: { query } }),
};

// Endpoints pour les favoris
export const favoritesAPI = {
  getFavorites: () =>
    api.get('/favorites/'),
  addFavorite: (jobId) =>
    api.post('/favorites/', { job_id: jobId }),
  removeFavorite: (jobId) =>
    api.delete(`/favorites/${jobId}/`),
};

// Endpoints pour l'historique
export const searchHistoryAPI = {
  getHistory: () => api.get('/search-history/'),
  // Ajoute cette ligne pour sauvegarder une recherche
  addSearch: (query) => api.post('/search-history/', { query_text: query }),
  // Optionnel : pour vider l'historique
  clearHistory: () => api.delete('/search-history/'),
};

export default api;
