// client/src/pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { login } from '../services/authService';
import Navbar from '../components/Navbar';
import AlertMessage from '../components/AlertMessage';
import Spinner from '../components/Spinner';
import useAuth from '../hooks/useAuth';
import '../styles/Auth.css';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Adresse email invalide')
    .required('L\'adresse email est requise'),
  password: Yup.string()
    .required('Le mot de passe est requis')
});

const Login = () => {
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const userData = await login(values);
      
      // Mettre à jour le contexte d'authentification avec les données utilisateur
      updateUser(userData);
      
      // Afficher un message de succès avant la redirection
      setAlert({
        type: 'success',
        message: 'Connexion réussie! Redirection en cours...'
      });
      
      // Rediriger vers le tableau de bord après un court délai
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Email ou mot de passe incorrect.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="auth-container">
          <div className="auth-form">
            <h2>Connexion</h2>
            
            {alert && (
              <AlertMessage 
                type={alert.type} 
                message={alert.message} 
                onClose={() => setAlert(null)} 
              />
            )}
            
            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="form-group">
                    <label htmlFor="email">Adresse email</label>
                    <Field type="email" id="email" name="email" />
                    <ErrorMessage name="email" component="div" className="error-message" />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Mot de passe</label>
                    <Field type="password" id="password" name="password" />
                    <ErrorMessage name="password" component="div" className="error-message" />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-block" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Spinner size="small" /> : "Se connecter"}
                  </button>
                </Form>
              )}
            </Formik>
            
            <div className="auth-links">
              <p>
                Vous n'avez pas de compte? <Link to="/register">S'inscrire</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;