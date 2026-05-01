import React, { useState } from 'react';
import { Heart, MapPin, Building2, Calendar, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { favoritesAPI } from '../services/api';
import MatchScore from './MatchScore';

export default function JobCard({ job, matchScore, matchedSkills = [], isFavorite = false, onFavoriteChange }) {
  const { isAuthenticated } = useAuth();
  const [favorite, setFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Veuillez vous connecter pour ajouter des favoris');
      return;
    }

    setIsLoading(true);
    try {
      if (favorite) {
        await favoritesAPI.removeFavorite(job.job_id);
        setFavorite(false);
      } else {
        await favoritesAPI.addFavorite(job.job_id);
        setFavorite(true);
      }
      if (onFavoriteChange) onFavoriteChange();
    } catch (error) {
      console.error('Erreur lors de la modification du favori:', error);
      alert('Erreur lors de la modification du favori');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text mb-1">{job.title}</h3>
          <p className="text-sm text-text-secondary">{job.company?.company_name}</p>
        </div>
        <div className="flex items-center gap-3">
          {matchScore !== undefined && (
            <MatchScore score={matchScore} />
          )}
          <button
            onClick={handleFavorite}
            disabled={isLoading}
            className={`p-2 rounded-lg transition ${
              favorite
                ? 'bg-danger/10 text-danger'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            <Heart size={20} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Location & Type */}
      <div className="flex flex-wrap gap-3 mb-3 text-sm">
        <div className="flex items-center gap-1 text-text-secondary">
          <MapPin size={16} />
          <span>{job.location?.city}</span>
        </div>
        <div className="flex items-center gap-1 text-text-secondary">
          <Building2 size={16} />
          <span>{job.contract_type}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary mb-4 line-clamp-3">
        {job.description}
      </p>

      {/* Skills */}
<div className="mb-4">
  <div className="flex flex-wrap gap-2">
    {/* ✅ Vérifier que c'est un tableau avant de mapper */}
    {Array.isArray(job.skills) && job.skills.map((skill, index) => (
      <span
        key={skill.skill_id || index}
        className={`text-xs px-3 py-1 rounded-full transition ${
          matchedSkills.includes(skill.skill_name)
            ? 'bg-accent/20 text-accent font-medium'
            : 'bg-slate-100 text-text-secondary'
        }`}
      >
        {skill.skill_name}
      </span>
    ))}
    
    {/* Message si pas de skills */}
    {!Array.isArray(job.skills) && (
      <span className="text-xs text-slate-400">Aucune compétence listée</span>
    )}
  </div>
</div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-200">
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{job.posted_date || 'N/A'}</span>
          </div>
          <span className="bg-slate-100 px-2 py-1 rounded">{job.source || 'N/A'}</span>
        </div>
        <button className="flex items-center gap-1 px-3 py-2 text-primary hover:bg-primary-light rounded-lg transition text-sm font-medium">
          <Eye size={16} />
          Voir
        </button>
      </div>
    </div>
  );
}
