import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { jobsAPI } from '../services/api';
import JobCard from './JobCard'; 
import MatchScore from './MatchScore';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Target, 
  User, 
  FileText,  
  CheckCircle2, 
  UploadCloud,
  Bot // <-- Zedt icon dyal IA
} from 'lucide-react';

export default function ProfileMatchingSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); 
  const [cvFile, setCvFile] = useState(null);
  const [matchingResults, setMatchingResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // N-khebiw fihom dakchi li jbed Llama 3 bach n-werriwh l-User
  const [detectedSkills, setDetectedSkills] = useState([]);
  const [detectedExperience, setDetectedExperience] = useState(null);
  
  const navigate = useNavigate();
  
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
    setDetectedSkills([]);
    setDetectedExperience(null);
    try {
      const { data } = await jobsAPI.getProfileRecommendations({
        title: user.title,
        skills: user.skills,
        location: user.location,
        experience_years: user.experience_years,
        salary_min: user.salary_min,
        remote_preference: user.remote_preference
      });
      
      if (data.status === 'incomplete_profile') {
        setError(data.message);
        setMatchingResults([]);
      } else {
        setMatchingResults(data.results?.recommendations || []);
      }
    } catch (err) {
      console.error('❌ ERREUR:', err);
      setError('Erreur lors du matching par profil');
    } finally {
      setLoading(false);
    }
  };


  // ─── UPLOAD & PARSING CV AVEC OLLAMA (LLAMA 3) ─────────────────────────────
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
    setError('');
    setMatchingResults([]);
    
    try {
      // 1. N-sifto l-CV l-FastAPI bach y-qrah Llama 3
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8000/extract-cv', {
        method: 'POST',
        body: formData,
        // headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } // Décommente ila knti dayr token
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        const { skills, experience_years } = result.data;
        
        console.log("🧠 Llama 3 a extrait:", skills, experience_years);
        
        setDetectedSkills(skills || []);
        setDetectedExperience(experience_years);
        
        // 2. N-akhdo l-expérience w l-skills li jbed Llama 3 w n-siftohom l-Model d Recommandation dyalk
        const searchPayload = {
          title: user?.title || '', // N-khelliw titre d profil (aw n-zido default)
          skills: skills && skills.length > 0 ? skills : (user?.skills || []),
          experience_years: experience_years !== null ? experience_years : (user?.experience_years || 0),
          location: user?.location || '',
          salary_min: user?.salary_min || null,
          remote_preference: user?.remote_preference || ''
        };

        const { data } = await jobsAPI.getProfileRecommendations(searchPayload);
        
        if (data.status === 'incomplete_profile') {
          setError(data.message);
        } else {
          setMatchingResults(data.results?.recommendations || []);
        }
      } else {
        setError('Erreur lors de l\'analyse du CV par l\'IA.');
      }
      
    } catch (err) {
      console.error('❌ ERREUR CV:', err);
      setError('Impossible de se connecter à Llama 3 ou de lire le CV.');
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────
  const profileStatus = checkProfileComplete();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Target className="text-blue-600" size={28} />
           Matching Intelligent
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Utilisez notre système pour matcher votre profil avec les meilleures offres.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => { setActiveTab('profile'); setMatchingResults([]); setError(''); setCvFile(null); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
            <User size={18} />
           Par profil
        </button>
        <button
          onClick={() => { setActiveTab('cv'); setMatchingResults([]); setError(''); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'cv' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
           <FileText size={18} />
           Par CV (IA)
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
                    <AlertCircle size={14} className="text-amber-500" />
                    {field === 'title' && 'Titre du poste recherché'}
                    {field === 'skills' && 'Compétences clés'}
                    {field === 'location' && 'Localisation souhaitée'}
                    {field === 'experience_years' && 'Années d\'expérience'}
                    {field === 'salary_min' && 'Salaire minimum attendu'}
                  </li>
                ))}
              </ul>
              <button 
                type="button"
                onClick={() => navigate('/dashboard', { state: { openEditProfile: true } })}
                className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors relative z-10"
              >
               Compléter mon profil →
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center justify-center gap-2">
                <CheckCircle2 className="text-green-600" size={20} />
                <p className="text-green-800 font-medium">Profil complet !</p>
              </div>
              <button
                onClick={handleProfileMatching}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <><span className="animate-spin text-xl">⏳</span> Analyse en cours...</>
                ) : ' Lancer le matching'}
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
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                loading ? 'border-blue-400 bg-blue-50 opacity-70' : 
                cvFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
              }`}>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} disabled={loading} className="hidden" id="cv-matching-upload" />
                <label htmlFor="cv-matching-upload" className={loading ? "cursor-wait block" : "cursor-pointer block"}>
                  {loading ? (
                    <div className="animate-pulse">
                      <Bot className="mx-auto text-blue-500 mb-3 animate-bounce" size={48} />
                      <p className="font-bold text-blue-900">Llama 3 analyse votre CV...</p>
                      <p className="text-sm text-blue-600 mt-1">Extraction de l'expérience et des compétences en cours</p>
                    </div>
                  ) : cvFile ? (
                    <div>
                      <CheckCircle2 className="mx-auto text-green-500 mb-2" size={48} />
                      <p className="font-medium text-green-900">{cvFile.name}</p>
                      <p className="text-sm text-green-600 mt-1">Cliquez pour analyser un autre CV</p>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud className="mx-auto text-gray-400 mb-2" size={48} />
                      <p className="font-medium text-gray-900">Glissez votre CV ou cliquez</p>
                      <p className="text-sm text-gray-500">PDF, DOC, DOCX</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Affichage de ce que l'IA a trouvé */}
              {detectedSkills.length > 0 && !loading && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mt-4">
                  <h4 className="flex items-center gap-2 font-medium text-blue-800 mb-3">
                    <Bot size={18} /> Données extraites par l'IA :
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-blue-600 uppercase font-semibold">Expérience détectée :</span>
                      <p className="text-slate-700 font-medium">
                        {detectedExperience !== null ? `${detectedExperience} an(s)` : 'Non précisée'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 uppercase font-semibold">Compétences :</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detectedSkills.slice(0, 5).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-white text-blue-700 text-xs rounded border border-blue-200">{s}</span>
                        ))}
                        {detectedSkills.length > 5 && <span className="text-xs text-slate-500 self-center">+{detectedSkills.length - 5} autres</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ERREURS */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* ═══ RÉSULTATS AVEC JobCard ═══ */}
      {matchingResults.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="text-blue-500" size={20} />
             {matchingResults.length} offre{matchingResults.length > 1 ? 's' : ''} recommandée{matchingResults.length > 1 ? 's' : ''}
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {matchingResults.map((job, index) => {
              const skills = parseSkills(job.skills);
              const rawScore = job.match_score || 0;
              const displayScore = rawScore > 1 ? rawScore : Math.round(rawScore * 100);

              return (
                <div key={job.url || index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-4">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{job.job_title}</h3>
                      <p className="text-blue-600 font-medium text-sm">{job.company}</p>
                    </div>
                    <div className="shrink-0">
                      <MatchScore score={rawScore} size={42} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {skills.slice(0, 6).map((skill, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                        {skill}
                      </span>
                    ))}
                    {skills.length > 6 && <span className="text-xs text-slate-400 self-center">+{skills.length - 6}</span>}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {job.experience_years !== null && job.experience_years !== undefined && (
                        <span>Exp: {job.experience_years} an(s)</span>
                      )}
                    </div>
                    {job.url && (
                      <a href={job.url.trim()} target="_blank" rel="noopener noreferrer" 
                         className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                        Voir l'offre <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Aucun résultat (uniquement si ce n'est pas en train de charger) */}
      {matchingResults.length === 0 && !loading && !error && (
        <div className="mt-6 text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-500 font-medium">
            {activeTab === 'profile' 
              ? 'Cliquez sur "Lancer le matching" pour voir les résultats' 
              : 'Uploadez votre CV pour que Llama 3 trouve les offres correspondantes'}
          </p>
        </div>
      )}
    </div>
  );
}