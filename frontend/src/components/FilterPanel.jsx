import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FilterPanel({ onFilterChange }) {
  const [expanded, setExpanded] = useState(true);
  const [filters, setFilters] = useState({
    skills: [],
    location: '',
    contractType: [],
    experience: '',
    source: '',
    category: '',
  });

  const SKILLS = ['Python', 'SQL', 'Machine Learning', 'Spark', 'Azure', 'AWS', 'Tableau', 'PowerBI'];
  const LOCATIONS = ['Paris', 'Lyon', 'Toulouse', 'Bordeaux'];
  const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage'];
  const SOURCES = ['Indeed', 'LinkedIn', 'adzuna', 'jobicy', 'jooble', 'recrute'];
  const CATEGORIES =  ['Data Science', 'Data Engineering', 'Machine Learning', 'Business Intelligence'];

  // ✅ MAPPING : Tranches d'années -> Catégories en base de données
  const EXPERIENCE_OPTIONS = [
  { label: 'Junior (0-2 ans)', value: 'Junior' },
  { label: 'Mid / Unspecified (2-5 ans)', value: 'Mid/Unspecified' },
  { label: 'Senior (5+ ans)', value: 'Senior' },
];
  // --- Handlers ---

  const handleCategoryChange = (category) => {
  const newFilters = { ...filters, category };
  setFilters(newFilters);
  onFilterChange(newFilters);
};

  const handleSkillToggle = (skill) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    const newFilters = { ...filters, skills: newSkills };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleLocationChange = (location) => {
    const newFilters = { ...filters, location };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleContractToggle = (type) => {
    const newTypes = filters.contractType.includes(type)
      ? filters.contractType.filter(t => t !== type)
      : [...filters.contractType, type];
    const newFilters = { ...filters, contractType: newTypes };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // ✅ CORRIGÉ : Envoie les catégories mappées, pas la tranche d'années
  const handleExperienceChange = (expLabel) => {
    const mapping = EXPERIENCE_OPTIONS.find(opt => opt.label === expLabel);
    const categories = mapping ? mapping.value : '';
    const newFilters = { ...filters, experience: categories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSourceChange = (source) => {
    const newFilters = { ...filters, source };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters = {
      skills: [],
      location: '',
      contractType: [],
      experience: '',
      source: '',
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex justify-between items-center font-semibold text-text hover:bg-slate-50 transition"
      >
        <span>Filtres</span>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-6 py-4 border-t border-slate-200 space-y-6">
          {/* Skills */}
          <div>
            <h4 className="font-medium text-text mb-3">Compétences</h4>
            <div className="space-y-2">
              {SKILLS.map((skill) => (
                <label key={skill} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.skills.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-text-secondary">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <h4 className="font-medium text-text mb-3">Localisation</h4>
            <select
              value={filters.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
            >
              <option value="">Toutes les localisations</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Contract Type */}
          <div>
            <h4 className="font-medium text-text mb-3">Type de contrat</h4>
            <div className="space-y-2">
              {CONTRACT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.contractType.includes(type)}
                    onChange={() => handleContractToggle(type)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-text-secondary">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ✅ Experience - CORRIGÉ avec mapping */}
          <div>
            <h4 className="font-medium text-text mb-3">Expérience</h4>
            <select
              value={filters.experience ? EXPERIENCE_OPTIONS.find(opt => opt.value === filters.experience)?.label || '' : ''}
              onChange={(e) => handleExperienceChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
            >
              <option value="">Toutes les expériences</option>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.label}>{opt.label}</option>
              ))}
            </select>
            
          </div>

          {/* Source */}
          <div>
            <h4 className="font-medium text-text mb-3">Source</h4>
            <select
              value={filters.source}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
            >
              <option value="">Toutes les sources</option>
              {SOURCES.map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
           {/* Category */}
          <div>
            <h4 className="font-medium text-text mb-3">Catégorie</h4>
            <select
              value={filters.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
            >
              <option value="">Toutes les catégories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>


          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="w-full px-4 py-2 text-primary hover:bg-primary-light rounded-lg transition font-medium text-sm"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}