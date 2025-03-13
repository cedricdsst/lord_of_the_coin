// client/src/services/authService.js
import api from './api';
import { jwtDecode } from 'jwt-decode';

// Enregistrer un nouvel utilisateur
export const register = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Connecter un utilisateur
export const login = async (credentials) => {
  try {
    const response = await api.post('/users/login', credentials);
    
    // Stocker le token dans le localStorage
    localStorage.setItem('token', response.data.token);
    
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Déconnecter l'utilisateur
export const logout = () => {
  localStorage.removeItem('token');
};

// Vérifier si l'utilisateur est authentifié
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return false;
  }
  
  try {
    // Vérifier si le token n'est pas expiré
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Récupérer les infos de l'utilisateur depuis le token
export const getUserInfo = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Récupérer le token d'authentification
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Récupérer le profil utilisateur depuis l'API
export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};