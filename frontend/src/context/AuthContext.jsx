import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifie le token au chargement initial
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      console.log("🔐 AuthContext Init - Token trouvé:", token ? "OUI" : "NON");
      if (token) {
        console.log("📝 Token value:", token.substring(0, 50) + "...");
        try {
          const response = await authAPI.getProfile();
          setUser(response.data);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(response.data));
          console.log("✅ Authentification OK - Utilisateur:", response.data.email);
        } catch (error) {
          console.error('❌ Erreur lors de la récupération du profil:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } else {
        console.warn("⚠️ Pas de token au démarrage - Utilisateur non authentifié");
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (token) => {
    console.log("🔓 AuthContext.login appelé avec token:", token.substring(0, 50) + "...");
    localStorage.setItem('token', token);
    console.log("✅ Token sauvegardé dans localStorage");
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(response.data));
      console.log("✅ Profil récupéré - Email:", response.data.email);
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
