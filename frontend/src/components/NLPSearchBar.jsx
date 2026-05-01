import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mic } from 'lucide-react';

const SUGGESTIONS = [
  'Data Scientist Python',
  'Data Engineer Spark',
  'Remote CDI',
  'Machine Learning Paris',
  'ETL Developer',
  'Analytics Engineer',
];

export default function NLPSearchBar({ onSubmit, placeholder = "Décrivez le poste idéal : compétences, expérience, localisation..." }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState(SUGGESTIONS);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/recommendations?query=${encodeURIComponent(query)}`);
      if (onSubmit) onSubmit(query);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    navigate(`/recommendations?query=${encodeURIComponent(suggestion)}`);
    if (onSubmit) onSubmit(suggestion);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-white rounded-full shadow-lg border-2 border-primary focus-within:shadow-xl transition">
          <Search className="ml-4 text-primary flex-shrink-0" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-4 bg-transparent border-none focus:outline-none text-text placeholder:text-text-secondary"
          />
          <button
            type="button"
            className="p-3 text-text-secondary hover:text-primary transition"
            title="Recherche vocale"
          >
            <Mic size={20} />
          </button>
          <button
            type="submit"
            className="mr-2 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition font-medium"
          >
            Trouver
          </button>
        </div>
      </form>

      {/* Suggestions rapides */}
      {query === '' && (
        <div className="mt-4 text-center">
          <p className="text-sm text-text-secondary mb-3">Suggestions rapides :</p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 bg-slate-100 text-text-secondary text-sm rounded-full hover:bg-primary-light hover:text-primary transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
