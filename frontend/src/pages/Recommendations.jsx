import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Briefcase, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import NLPSearchBar from '../components/NLPSearchBar';
import MatchScore from '../components/MatchScore';
import { jobsAPI } from '../services/api';

export default function Recommendations() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';

  const [recommendations, setRecommendations] = useState([]);
  const [detectedSkills, setDetectedSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query) {
      fetchRecommendations();
    }
  }, [query]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await jobsAPI.getRecommendations(query);
      setRecommendations(response.data.recommendations || []);
      setDetectedSkills(response.data.detected_skills || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des recommandations:', err);
      setError('Erreur lors de la récupération des recommandations');
      setRecommendations([]);
      setDetectedSkills([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Helper pour parser les skills (string "python,sql" → tableau)
  const parseSkills = (skillsString) => {
    if (!skillsString) return [];
    if (Array.isArray(skillsString)) return skillsString;
    return skillsString.split(',').map(s => s.trim()).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold text-text mb-4">
            Recommandations personnalisées
          </h1>
          {query && (
            <p className="text-lg text-text-secondary mb-8">
              Basées sur : <span className="font-semibold text-primary">"{query}"</span>
            </p>
          )}

          <div className="flex justify-center mb-12"> 
          <div className="w-full max-w-2xl">
            <NLPSearchBar />
          </div>
</div>
        </div>

        {/* Results Section */}
        <div>
          {error && (
            <div className="p-4 bg-danger/10 text-danger rounded-lg mb-8 flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">Analyse de vos préférences...</p>
            </div>
          ) : recommendations.length === 0 && query ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <AlertCircle size={48} className="mx-auto text-text-secondary mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">
                Aucune correspondance trouvée
              </h3>
              <p className="text-text-secondary mb-6">
                Essayez de reformuler votre recherche avec d'autres compétences ou critères
              </p>
              <div className="space-y-2 text-sm text-text-secondary">
                <p>Suggestions :</p>
                <ul className="inline-block space-y-1">
                  <li>• Soyez plus spécifique sur vos compétences</li>
                  <li>• Mentionnez votre niveau d'expérience</li>
                  <li>• Précisez votre localisation ou préférence télétravail</li>
                </ul>
              </div>
            </div>
          ) : recommendations.length > 0 ? (
            <div>
              {/* 🆕 Skills détectés */}
              {detectedSkills.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-text-secondary">Compétences détectées :</span>
                  {detectedSkills.map((skill, i) => (
                    <span key={i} className="text-xs px-3 py-1 bg-primary-light text-primary rounded-full font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-text-secondary mb-6">
                {recommendations.length} résultat{recommendations.length > 1 ? 's' : ''} trouvé{recommendations.length > 1 ? 's' : ''}
              </p>

              <div className="space-y-4">
                {recommendations.map((item, index) => {
                  const skills = parseSkills(item.skills);
                  const score = Math.round((item.match_score || 0) * 100);
                  
                  return (
                    <div 
                      key={item.url || index} 
                      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition p-6"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-text mb-1">
                            {item.job_title || 'Poste non précisé'}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {item.company || 'Entreprise non précisée'}
                          </p>
                        </div>
                        <MatchScore score={score} />
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {skills.map((skill, i) => (
                          <span 
                            key={i}
                            className="text-xs px-3 py-1 bg-primary-light text-primary rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Score info */}
                      <div className="mb-4 text-sm text-text-secondary">
                        Score de matching : <span className="font-semibold text-primary">{score}%</span>
                      </div>

                      {/* Lien */}
                      {item.url && (
                        <a 
                          href={item.url.trim()} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium"
                        >
                          <ExternalLink size={16} />
                          Voir l'offre
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <Briefcase size={48} className="mx-auto text-text-secondary mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">
                Commencez par une recherche
              </h3>
              <p className="text-text-secondary">
                Utilisez la barre de recherche ci-dessus pour trouver des offres correspondant à votre profil
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}