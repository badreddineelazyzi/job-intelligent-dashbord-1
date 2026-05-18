import React, { useState, useEffect } from 'react';
import { Briefcase, Building2, TrendingUp, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import NLPSearchBar from '../components/NLPSearchBar';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import JobCard from '../components/JobCard';
import { jobsAPI, searchHistoryAPI, statsAPI } from '../services/api';



export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const itemsPerPage = 20;

  const [realStats, setRealStats] = useState([
    { label: 'Offres', value: '...', icon: Briefcase, key: 'total_jobs' },
    { label: 'Entreprises', value: '...', icon: Building2, key: 'total_companies' },
    { label: 'Taux Match', value: '...', icon: TrendingUp, key: 'avg_match' },
    { label: 'Sources', value: '...', icon: Zap, key: 'total_sources' },
  ]);

  useEffect(() => {
  // On repart à 0 (page 1) dès que la recherche ou les filtres changent
  fetchJobs(0, searchQuery, filters);
  fetchRealStats(); 
}, [searchQuery, filters]);

  const fetchRealStats = async () => {
    try {
      const response = await statsAPI.getStatsSummary();
      const data = response.data;

      // Mise à jour des valeurs dans l'objet STATS
      setRealStats(prev => prev.map(stat => ({
        ...stat,
        value: formatStatValue(stat.key, data[stat.key])
      })));
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  // Utilitaire pour formater les nombres (ex: 1200 -> 1.2k)
  const formatStatValue = (key, value) => {
    if (!value) return '0';
    if (key === 'avg_match') return `${value}%`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k+`;
    return value;
  };

  
  const fetchJobs = async (skip = 0, query = searchQuery, currentFilters = filters) => {
  setIsLoading(true);
  try {
    const { location, experience, contractType , source ,skills,category } = currentFilters;

    const response = await jobsAPI.getJobs(
      skip, 
      itemsPerPage, 
      query, 
      { location, contractType, experience, source, skills,category  }
    );
    
    const jobsData = response.data.data || response.data; 
    setJobs(Array.isArray(jobsData) ? jobsData : []);
    
    const totalCount = response.data.total || 0;
    const total = Math.ceil(totalCount / itemsPerPage);
    setTotalPages(total || 1);
    setCurrentPage(Math.floor(skip / itemsPerPage) + 1);
  } catch (error) {
    console.error('Erreur lors du chargement des offres:', error);
    setJobs([]);
  } finally {
    setIsLoading(false);
  }
};

  const handleSearch = async (e, query) => {
    if (e && e.preventDefault) e.preventDefault();
    setSearchQuery(query);
    
    // 1. Lancer la recherche
    await fetchJobs(0, query);

    // 2. Sauvegarde dans l'historique (Base Users)
    if (query && query.trim().length > 2) {
      try {
        await searchHistoryAPI.addSearch(query);
      } catch (err) {
        console.error("Erreur sauvegarde historique:", err);
        // Si l'utilisateur n'est pas authentifié (401) ou en cas d'erreur,
        // sauvegarder localement pour ne pas perdre la recherche.
        try {
          const local = JSON.parse(localStorage.getItem('search_history') || '[]');
          local.unshift({ query, created_at: new Date().toISOString() });
          // Garder les 50 dernières
          localStorage.setItem('search_history', JSON.stringify(local.slice(0, 50)));
          console.debug('Historique local mis à jour');
        } catch (e) {
          console.error('Impossible de sauvegarder l\'historique localement', e);
        }
      }
    }
  };

  const handlePageChange = (newPage) => {
    const skip = (newPage - 1) * itemsPerPage;
    fetchJobs(skip);
    window.scrollTo(0, 0);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Trouvez votre prochain poste dans la Data
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              IA pour matcher votre profil avec les meilleures offres
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <NLPSearchBar />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* Stats Section utilisant realStats */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {realStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-primary-light rounded-lg">
                      <Icon className="text-primary" size={24} />
                    </div>
                  </div>
                  {/* Affichage d'un squelette si la donnée est en cours de chargement */}
                  <p className="text-3xl font-bold text-text">
                    {stat.value === '...' ? (
                      <span className="animate-pulse">---</span>
                    ) : stat.value}
                  </p>
                  <p className="text-text-secondary mt-2">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Job Board Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-text mb-8">Dernières offres</h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <FilterPanel onFilterChange={handleFilterChange} />
            </div>

            <div className="lg:col-span-3">
              <div className="mb-8">
                <SearchBar onSearch={handleSearch} />
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-text-secondary">Chargement des offres...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <Briefcase size={48} className="mx-auto text-text-secondary mb-4" />
                  <h3 className="text-lg font-semibold text-text mb-2">Aucune offre trouvée</h3>
                  <p className="text-text-secondary">Essayez de modifier votre recherche ou vos filtres</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-8">
                    {jobs.map((job) => (
                      <JobCard key={job.job_id} job={job} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}