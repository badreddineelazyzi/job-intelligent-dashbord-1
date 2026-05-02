import React, { useState, useEffect } from 'react';
import { Edit2, Heart, Search, Target } from 'lucide-react'; // ← Ajout de Target
import Navbar from '../components/Navbar';
import ProfileForm from '../components/ProfileForm';
import JobCard from '../components/JobCard';
import ProfileMatchingSection from '../components/ProfileMatchingSection'; // ← Nouveau composant
import { useAuth } from '../hooks/useAuth';
import { favoritesAPI, searchHistoryAPI } from '../services/api';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'favorites') {
      fetchFavorites();
    } else if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchFavorites = async () => {
    setIsFavoritesLoading(true);
    try {
      const response = await favoritesAPI.getFavorites();
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Erreur favoris:', error);
      setFavorites([]);
    } finally {
      setIsFavoritesLoading(false);
    }
  };

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await searchHistoryAPI.getHistory();
      setSearchHistory(response.data || []);
    } catch (error) {
      console.error('Erreur historique:', error);
      setSearchHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">{user?.full_name}</h1>
              <p className="text-text-secondary">{user?.email}</p>
              <p className="text-sm text-text-secondary mt-1">
                Membre depuis {new Date(user?.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              <Edit2 size={18} />
              {isEditingProfile ? 'Annuler' : 'Modifier'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            {/* ─── ONGLET PROFIL ─── */}
            <button
              onClick={() => {
                setActiveTab('profile');
                setIsEditingProfile(false);
              }}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'profile'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Mon profil
            </button>

            {/* ─── NOUVEL ONGLET: MATCHING ─── */}
            <button
              onClick={() => setActiveTab('matching')}
              className={`flex-1 px-6 py-4 font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'matching'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <Target size={18} />
              Matching
            </button>

            {/* ─── ONGLET FAVORIS ─── */}
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 px-6 py-4 font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'favorites'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <Heart size={18} />
              Mes favoris
            </button>

            {/* ─── ONGLET HISTORIQUE ─── */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'history'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <Search size={18} />
              Historique
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            
            {/* ─── CONTENU: PROFIL ─── */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-text mb-6">
                  {isEditingProfile ? 'Éditer votre profil' : 'Informations personnelles'}
                </h2>
                <ProfileForm
                  isEditing={isEditingProfile}
                  onSubmit={() => setIsEditingProfile(false)}
                />
              </div>
            )}

            {/* ─── CONTENU: MATCHING (NOUVEAU) ─── */}
            {activeTab === 'matching' && (
              <ProfileMatchingSection />
            )}

            {/* ─── CONTENU: FAVORIS ─── */}
            {activeTab === 'favorites' && (
              <div>
                <h2 className="text-2xl font-bold text-text mb-6">
                  Mes favoris ⭐
                </h2>
                {isFavoritesLoading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Chargement des favoris...</p>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <Heart size={48} className="mx-auto text-text-secondary mb-4" />
                    <h3 className="text-lg font-semibold text-text mb-2">
                      Aucun favori sauvegardé
                    </h3>
                    <p className="text-text-secondary">
                      Explorez les offres et cliquez sur le cœur pour les ajouter ici
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {favorites.map((job, index) => (
                      <div key={`${job.job_id}-${index}`} className="p-4 border rounded-lg shadow-sm bg-white">
                        <h3 className="font-bold text-lg">{job.title}</h3>
                        <p className="text-gray-600">
                          🏢 {job.company?.company_name || "Entreprise non spécifiée"}
                        </p>
                        <p className="text-gray-500 text-sm">
                          📍 {job.location ? `${job.location.city}, ${job.location.country}` : "Lieu non spécifié"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {job.skills?.map(skill => (
                            <span key={skill.skill_id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {skill.skill_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── CONTENU: HISTORIQUE ─── */}
            {activeTab === 'history' && (
              <div>
                <h2 className="text-2xl font-bold text-text mb-6">
                  Mon historique 🔍
                </h2>
                {isHistoryLoading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Chargement de l'historique...</p>
                  </div>
                ) : searchHistory.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <Search size={48} className="mx-auto text-text-secondary mb-4" />
                    <h3 className="text-lg font-semibold text-text mb-2">
                      Aucune recherche enregistrée
                    </h3>
                    <p className="text-text-secondary">
                      Vos recherches récentes apparaîtront ici
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchHistory.map((item, index) => (
                      <div
                        key={`hist-${item.id}`}
                        className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-start hover:bg-slate-100 transition"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-text">"{item.query}"</p>
                          <p className="text-sm text-text-secondary mt-1">
                            {item.results_count} résultat{item.results_count > 1 ? 's' : ''} • il y a{' '}
                            {getTimeAgo(item.created_at)}
                          </p>
                        </div>
                        <a
                          href={`/recommendations?query=${encodeURIComponent(item.query)}`}
                          className="px-4 py-2 text-primary hover:bg-primary-light rounded-lg transition text-sm font-medium flex-shrink-0"
                        >
                          Relancer
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' ans';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' mois';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' jours';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' heures';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes';

  return 'à l\'instant';
}