import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function ProfileForm({ isEditing, onSubmit }) {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    title: user?.title || '',
    location: user?.location || '',
    remote_preference: user?.remote_preference || 'hybrid',
    skills: user?.skills || [],
    experience_years: user?.experience_years || '',
    contract_type: user?.contract_type || [],
    salary_min: user?.salary_min || '',
    salary_max: user?.salary_max || '',
  });

  const CONTRACT_OPTIONS = ['CDI', 'CDD', 'Freelance', 'Stage'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContractToggle = (contract) => {
    setFormData(prev => ({
      ...prev,
      contract_type: prev.contract_type.includes(contract)
        ? prev.contract_type.filter(c => c !== contract)
        : [...prev.contract_type, contract]
    }));
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 1. Nqiyw l-data w n-qaddou types qbel ma n-siftohom l-FastAPI
    const dataToSend = { ...formData };

    // Convertir les salaires et l'expérience en Integer (aw null ila kano khawin)
    dataToSend.salary_min = dataToSend.salary_min ? parseInt(dataToSend.salary_min, 10) : null;
    dataToSend.salary_max = dataToSend.salary_max ? parseInt(dataToSend.salary_max, 10) : null;
    dataToSend.experience_years = dataToSend.experience_years ? parseInt(dataToSend.experience_years, 10) : null;

    try {
      // Sifet l-API
      await updateProfile(dataToSend);
      if (onSubmit) onSubmit(); 
    } catch (err) {
      // 2. N-gériw l-erreur bach React ma-y-craché-ch
      const errorDetail = err.response?.data?.detail;
      
      if (Array.isArray(errorDetail)) {
        const firstError = errorDetail[0];
        const fieldName = firstError.loc[firstError.loc.length - 1]; 
        setError(`Erreur f l-champ "${fieldName}": ${firstError.msg}`);
      } else if (typeof errorDetail === 'string') {
        setError(errorDetail);
      } else if (typeof errorDetail === 'object') {
        setError(JSON.stringify(errorDetail));
      } else {
        setError('Erreur lors de la mise à jour du profil');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-text mb-2">Nom complet</h4>
          <p className="text-text-secondary">{formData.full_name || 'Non renseigné'}</p>
        </div>
        <div>
          <h4 className="font-medium text-text mb-2">Titre visé</h4>
          <p className="text-text-secondary">{formData.title || 'Non renseigné'}</p>
        </div>
        <div>
          <h4 className="font-medium text-text mb-2">Localisation</h4>
          <p className="text-text-secondary">{formData.location || 'Non renseigné'}</p>
        </div>
        <div>
          <h4 className="font-medium text-text mb-2">Télétravail</h4>
          <p className="text-text-secondary">{formData.remote_preference || 'Non renseigné'}</p>
        </div>
        <div>
          <h4 className="font-medium text-text mb-2">Compétences</h4>
          <div className="flex flex-wrap gap-2">
            {formData.skills.length > 0 ? (
              formData.skills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-primary-light text-primary text-sm rounded-full">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-text-secondary">Non renseigné</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-danger/10 text-danger rounded-lg">
          {error}
        </div>
      )}

      {/* Nom complet */}
      <div>
        <label className="block font-medium text-text mb-2">Nom complet *</label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      {/* Titre */}
      <div>
        <label className="block font-medium text-text mb-2">Titre visé</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Data Scientist, Data Engineer..."
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      {/* Localisation */}
      <div>
        <label className="block font-medium text-text mb-2">Localisation</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Paris, Lyon, Remote..."
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      {/* Télétravail */}
      <div>
        <label className="block font-medium text-text mb-2">Préférence télétravail</label>
        <select
          name="remote_preference"
          value={formData.remote_preference}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="remote">Remote</option>
          <option value="hybrid">Hybride</option>
          <option value="onsite">Sur site</option>
        </select>
      </div>

      {/* Compétences */}
      <div>
        <label className="block font-medium text-text mb-2">Compétences</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill(e);
              }
            }}
            placeholder="Ajouter une compétence..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
          />
          <button
            onClick={addSkill}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.skills.map(skill => (
            <div key={skill} className="flex items-center gap-2 px-3 py-1 bg-primary-light text-primary rounded-full">
              <span className="text-sm">{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="p-0.5 hover:bg-primary text-primary hover:text-white rounded transition"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Expérience */}
      <div>
        <label className="block font-medium text-text mb-2">Expérience (en années)</label>
        <input
          type="number"
          name="experience_years"
          value={formData.experience_years}
          onChange={handleChange}
          min="0"
          placeholder="Ex: 3"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      {/* Type de contrat */}
      <div>
        <label className="block font-medium text-text mb-3">Type de contrat</label>
        <div className="space-y-2">
          {CONTRACT_OPTIONS.map(contract => (
            <label key={contract} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.contract_type.includes(contract)}
                onChange={() => handleContractToggle(contract)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-text-secondary">{contract}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Salaire */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium text-text mb-2">Salaire min (k€)</label>
          <input
            type="number"
            name="salary_min"
            value={formData.salary_min}
            onChange={handleChange}
            placeholder="Ex: 35"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block font-medium text-text mb-2">Salaire max (k€)</label>
          <input
            type="number"
            name="salary_max"
            value={formData.salary_max}
            onChange={handleChange}
            placeholder="Ex: 45"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 px-4 py-2 border border-slate-300 text-text rounded-lg hover:bg-slate-100 transition font-medium"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium disabled:opacity-50"
        >
          {isLoading ? 'Enregistrement...' : '💾 Enregistrer'}
        </button>
      </div>
    </form>
  );
}