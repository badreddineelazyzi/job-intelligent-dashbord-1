import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordStrengthColor = {
    0: 'bg-slate-300',
    1: 'bg-danger',
    2: 'bg-warning',
    3: 'bg-accent',
    4: 'bg-accent',
  };

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

    // Validation
    if (!formData.fullName.trim()) {
      setError('Le nom complet est requis');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins une majuscule');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins un chiffre');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions générales');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.register(
        formData.email,
        formData.password,
        formData.fullName
      );
      const token = response.data.access_token;
      await login(token);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Erreur lors de l\'inscription. Cet email est peut-être déjà utilisé.'
      );
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
            Créer un compte
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-danger/10 text-danger rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Jean Dupont"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Email *
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
                Mot de passe *
              </label>
              <div className="relative mb-2">
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
              
              {/* Password Strength */}
              {formData.password && (
                <div className="space-y-1">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrengthColor[passwordStrength]} transition-all`}
                      style={{ width: `${((passwordStrength + 1) / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Force : {['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent'][passwordStrength]}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Confirmer mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text transition"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-text-secondary">
                J'accepte les conditions générales d'utilisation
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.acceptTerms}
              className="w-full mt-6 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-sm text-text-secondary">ou</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-text-secondary mb-2">
              Déjà un compte ?
            </p>
            <Link
              to="/login"
              className="text-primary font-semibold hover:text-primary-dark transition"
            >
              Se connecter →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
