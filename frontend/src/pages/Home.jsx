import React, { useState, useEffect } from 'react';
import { Briefcase, Building2, TrendingUp, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import NLPSearchBar from '../components/NLPSearchBar';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import JobCard from '../components/JobCard';
import { jobsAPI, searchHistoryAPI } from '../services/api'; // Ajout de searchHistoryAPI

const STATS = [
  { label: 'Offres', value: '1,240+', icon: Briefcase },
  { label: 'Entreprises', value: '450+', icon: Building2 },
  { label: 'Taux Match', value: '98%', icon: TrendingUp },
  { label: 'Sources', value: '3', icon: Zap },
];

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const itemsPerPage = 20;

  // Chargement initial et réaction aux filtres
  useEffect(() => {
  // On repart à la page 1 (skip = 0) quand les filtres ou la recherche changent
  fetchJobs(0, searchQuery, filters);
}, [searchQuery, filters]);

  const fetchJobs = async (skip = 0, query = searchQuery, currentFilters = filters) => {
  setIsLoading(true);
  try {
    // On passe maintenant skip, limit, query ET filters
    const response = await jobsAPI.getJobs(skip, itemsPerPage, query, currentFilters);
    
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
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STATS.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-primary-light rounded-lg">
                      <Icon className="text-primary" size={24} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-text">{stat.value}</p>
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