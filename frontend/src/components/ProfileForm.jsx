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

  const EXPERIENCE_OPTIONS = ['0-1', '1-3', '3-5', '5-10', '10+'];
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

    try {
      await updateProfile(formData);
      if (onSubmit) onSubmit();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour du profil');
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
        <label className="block font-medium text-text mb-2">Expérience</label>
        <select
          name="experience_years"
          value={formData.experience_years}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">Sélectionner...</option>
          {EXPERIENCE_OPTIONS.map(exp => (
            <option key={exp} value={exp}>{exp} ans</option>
          ))}
        </select>
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
