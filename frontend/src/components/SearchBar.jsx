import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';

// Note : On retire les imports d'API ici pour éviter les erreurs de chemin
// La logique d'appel API reste dans Home.jsx

export default function SearchBar({ onSearch, placeholder = "Rechercher des offres..." }) {
  const [query, setQuery] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);

    // Annule le timer précédent si l'utilisateur tape encore
    if (debounceTimer) clearTimeout(debounceTimer);
    
    // Crée un nouveau timer de 500ms
    const timer = setTimeout(() => {
      if (onSearch) {
        // On envoie null pour 'e' et la valeur pour la recherche
        onSearch(null, value); 
      }
    }, 500); 

    setDebounceTimer(timer);
  }, [debounceTimer, onSearch]);

  return (
    <div className="relative">
      <Search 
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" 
        size={20} 
      />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
      />
    </div>
  );
}