import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      console.log("✅ Login API Response:", response.data);

      // 1. Récupérer le token depuis la réponse du serveur
      const token = response.data.access_token;
      console.log("📝 Token extrait:", token.substring(0, 50) + "...");
      
      // 2. LE SAUVEGARDER MANUELLEMENT ICI (C'est ce qui manque sur ton image)
      localStorage.setItem('token', token);
      console.log("✅ Token sauvegardé dans localStorage");
      
      // Vérifier que c'est bien sauvegardé
      const savedToken = localStorage.getItem('token');
      console.log("🔍 Token vérifié après save:", savedToken ? "OUI" : "NON");
      
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      await login(token);
      navigate('/dashboard');
    } catch (err) {
      console.error("❌ Erreur login:", err);
      setError(err.response?.data?.detail || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
            J
          </div>
          <h1 className="text-2xl font-bold text-text">Job Intelligent</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-text mb-6 text-center">
            Se connecter
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-danger/10 text-danger rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="vous@exemple.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text transition"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-text-secondary">
                Se souvenir de moi
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-sm text-text-secondary">ou</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Signup Link */}
          <div className="text-center">
            <p className="text-sm text-text-secondary mb-2">
              Pas encore de compte ?
            </p>
            <Link
              to="/signup"
              className="text-primary font-semibold hover:text-primary-dark transition"
            >
              Créer un compte →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
