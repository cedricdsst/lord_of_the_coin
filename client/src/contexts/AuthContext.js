// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { isAuthenticated, logout, getUserInfo, getUserProfile } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        if (isAuthenticated()) {
          const basicInfo = getUserInfo();
          setUser({ ...basicInfo, loading: true });
          
          // Récupérer les données complètes du profil
          try {
            const profileData = await getUserProfile();
            setUser({ ...profileData, loading: false });
          } catch (profileError) {
            console.error('Erreur lors de la récupération du profil:', profileError);
            setUser({ ...basicInfo, loading: false });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserProfile();
  }, []);
  
  const logoutUser = () => {
    logout();
    setUser(null);
  };
  
  const updateUser = (userData) => {
    console.log('Mise à jour du contexte utilisateur:', userData);
    setUser(userData);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, error, logoutUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};