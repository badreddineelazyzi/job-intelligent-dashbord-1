import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authAPI, jobsAPI } from '../services/api';
import JobCard from './JobCard'; // ← Import du vrai JobCard
import MatchScore from './MatchScore';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

export default function ProfileMatchingSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'cv'
  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState('');
  const [matchingResults, setMatchingResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedSkills, setDetectedSkills] = useState([]);
  
  // ─── DETECTION DES SKILLS ─────────────────────────────
  const parseSkills = (skillsData) => {
  if (!skillsData) return [];
  if (Array.isArray(skillsData)) return skillsData;
  return skillsData.split(',').map(s => s.trim()).filter(Boolean);
 };

  // ─── VÉRIFICATION PROFIL ─────────────────────────────
  const checkProfileComplete = () => {
    if (!user) return { complete: false, missing: ['connexion'] };
    
    const required = ['title', 'skills', 'location', 'experience_years', 'salary_min'];
    const missing = required.filter(field => !user[field] || user[field].length === 0);
    
    return {
      complete: missing.length === 0,
      missing,
      score: Math.round(((required.length - missing.length) / required.length) * 100)
    };
  };

  // ─── MATCHING PAR PROFIL ─────────────────────────────
  const handleProfileMatching = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await jobsAPI.getProfileRecommendations({
        title: user.title,
        skills: user.skills,
        location: user.location,
        experience_years: user.experience_years,
        salary_min: user.salary_min,
        remote_preference: user.remote_preference
      });

      console.log('📥 DATA BACKEND:', data); // DEBUG
      
      // 🔧 CORRECTION : extraire data.results, pas data entier
      if (data.status === 'incomplete_profile') {
        setError(data.message);
        setMatchingResults([]);
      } else {
        setMatchingResults(data.results?.recommendations || []);
        setDetectedSkills(data.results?.detected_skills || []);
      }
    } catch (err) {
      console.error('❌ ERREUR:', err);
      setError('Erreur lors du matching par profil');
    } finally {
      setLoading(false);
    }
  };


  // ─── UPLOAD & PARSING CV ─────────────────────────────
  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      setError('Format accepté: PDF, DOC, DOCX');
      return;
    }
    
    setCvFile(file);
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadResult } = await authAPI.uploadCV(formData);
      
      setCvText(uploadResult.parsed_text);
      await handleCvMatching(uploadResult.parsed_text);
      
    } catch (err) {
      setError('Erreur lors du traitement du CV');
    } finally {
      setLoading(false);
    }
  };

  // ─── MATCHING PAR CV ─────────────────────────────
  const handleCvMatching = async (text) => {
    try {
      const { data } = await jobsAPI.getCvRecommendations(text);
      console.log('📥 DATA CV:', data); // DEBUG
      
      const results = data.results || data;
      setMatchingResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setError('Erreur lors du matching par CV');
    }
  };

  // ─── RENDER ────────────────────────────────────────────
  const profileStatus = checkProfileComplete();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎯 Matching Intelligent
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Utilisez notre système pour matcher votre profil avec les meilleures offres.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => { setActiveTab('profile'); setMatchingResults([]); setError(''); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📋 Par profil
        </button>
        <button
          onClick={() => { setActiveTab('cv'); setMatchingResults([]); setError(''); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'cv' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📄 Par CV
        </button>
      </div>

      {/* ONGLET PROFIL */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          {!user ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <p className="text-amber-800 font-medium mb-4">Connectez-vous pour utiliser le matching</p>
              <div className="flex justify-center gap-3">
                <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Se connecter</Link>
                <Link to="/register" className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg">Créer un compte</Link>
              </div>
            </div>
          ) : !profileStatus.complete ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-semibold text-amber-900 mb-2">Profil incomplet ({profileStatus.score}%)</h3>
              <ul className="space-y-2 mb-4">
                {profileStatus.missing.map(field => (
                  <li key={field} className="flex items-center gap-2 text-sm text-amber-800">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    {field === 'title' && 'Titre du poste recherché'}
                    {field === 'skills' && 'Compétences clés'}
                    {field === 'location' && 'Localisation souhaitée'}
                    {field === 'experience_years' && 'Années d\'expérience'}
                    {field === 'salary_min' && 'Salaire minimum attendu'}
                  </li>
                ))}
              </ul>
              <Link to="/complete-profile" className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg">Compléter mon profil →</Link>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800">✓ Profil complet !</p>
              </div>
              <button
                onClick={handleProfileMatching}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Analyse...' : '🚀 Lancer le matching'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ONGLET CV */}
      {activeTab === 'cv' && (
        <div className="space-y-4">
          {!user ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <p className="text-amber-800 mb-4">Connectez-vous pour uploader votre CV</p>
              <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Se connecter</Link>
            </div>
          ) : (
            <>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                cvFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
              }`}>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" id="cv-matching-upload" />
                <label htmlFor="cv-matching-upload" className="cursor-pointer block">
                  {cvFile ? (
                    <div>
                      <div className="text-4xl mb-2">✅</div>
                      <p className="font-medium text-green-900">{cvFile.name}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📄</div>
                      <p className="font-medium text-gray-900">Glissez votre CV ou cliquez</p>
                      <p className="text-sm text-gray-500">PDF, DOC, DOCX</p>
                    </div>
                  )}
                </label>
              </div>
            </>
          )}
        </div>
      )}

      {/* ERREURS */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* ═══ RÉSULTATS AVEC JobCard ═══ */}
      {matchingResults.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 {matchingResults.length} offre{matchingResults.length > 1 ? 's' : ''} trouvée{matchingResults.length > 1 ? 's' : ''}
          </h3>
          
          {/* Debug temporaire */}
          <details className="mb-4">
            <summary className="text-xs text-gray-500 cursor-pointer">Debug données brutes</summary>
            <pre className="bg-gray-100 p-2 text-xs overflow-auto max-h-40">
              {JSON.stringify(matchingResults[0], null, 2)}
            </pre>
          </details>
          
          <div className="space-y-4">
  {matchingResults.map((job, index) => {
    const skills = parseSkills(job.skills);
    const score = Math.round((job.match_score || 0) * 100);

    return (
      <div key={job.url || index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">{job.job_title}</h3>
            <p className="text-primary font-medium text-sm">{job.company}</p>
          </div>
          {/* Ton composant MatchScore */}
          <MatchScore score={score} />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <span className="text-sm text-slate-500 italic">Score : {score}%</span>
          {job.url && (
            <a href={job.url.trim()} target="_blank" rel="noopener noreferrer" 
               className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
              <ExternalLink size={16} /> Voir l'offre
            </a>
          )}
        </div>
      </div>
    );
  })}
</div>
        </div>
      )}
      
      {/* Aucun résultat */}
      {matchingResults.length === 0 && !loading && !error && activeTab === 'profile' && profileStatus.complete && (
        <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Cliquez sur "Lancer le matching" pour voir les résultats</p>
        </div>
      )}
    </div>
  );
}