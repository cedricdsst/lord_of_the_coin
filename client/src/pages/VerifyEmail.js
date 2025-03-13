// client/src/pages/VerifyEmail.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import AlertMessage from '../components/AlertMessage';
import Spinner from '../components/Spinner';

const VerifyEmail = () => {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('Token de vérification manquant.');
          return;
        }
        
        // Appeler l'API pour vérifier le token
        const response = await api.get(`/users/verify-email?token=${token}`);
        
        setStatus('success');
        setMessage(response.data.message || 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.');
        
        // Rediriger vers la page de connexion après quelques secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Erreur lors de la vérification de l\'email.');
      }
    };
    
    verifyToken();
  }, [location.search, navigate]);

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="auth-container">
          <div className="auth-form">
            <h2>Vérification de l'email</h2>
            
            {status === 'loading' && (
              <div className="text-center">
                <Spinner center />
                <p>Vérification de votre email...</p>
              </div>
            )}
            
            {status === 'success' && (
              <AlertMessage 
                type="success" 
                message={message} 
              />
            )}
            
            {status === 'error' && (
              <AlertMessage 
                type="error" 
                message={message} 
              />
            )}
            
            {status !== 'loading' && (
              <button 
                className="btn btn-primary btn-block mt-3" 
                onClick={() => navigate('/login')}
              >
                Aller à la page de connexion
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyEmail;