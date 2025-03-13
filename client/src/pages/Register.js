// client/src/pages/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { register } from '../services/authService';
import Navbar from '../components/Navbar';
import AlertMessage from '../components/AlertMessage';
import Spinner from '../components/Spinner';
import '../styles/Auth.css';

const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Le nom d\'utilisateur doit comporter au moins 3 caractères')
    .max(20, 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères')
    .required('Le nom d\'utilisateur est requis'),
  email: Yup.string()
    .email('Adresse email invalide')
    .required('L\'adresse email est requise'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit comporter au moins 6 caractères')
    .required('Le mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Les mots de passe doivent correspondre')
    .required('La confirmation du mot de passe est requise')
});

const Register = () => {
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const { confirmPassword, ...userData } = values;
      await register(userData);
      setAlert({
        type: 'success',
        message: 'Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.'
      });
      
      // Rediriger vers la page de connexion après quelques secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Une erreur s\'est produite lors de l\'inscription.'
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
            <h2>Créer un compte</h2>
            
            {alert && (
              <AlertMessage 
                type={alert.type} 
                message={alert.message} 
                onClose={() => setAlert(null)} 
              />
            )}
            
            <Formik
              initialValues={{ username: '', email: '', password: '', confirmPassword: '' }}
              validationSchema={RegisterSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="form-group">
                    <label htmlFor="username">Nom d'utilisateur</label>
                    <Field type="text" id="username" name="username" />
                    <ErrorMessage name="username" component="div" className="error-message" />
                  </div>
                  
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
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                    <Field type="password" id="confirmPassword" name="confirmPassword" />
                    <ErrorMessage name="confirmPassword" component="div" className="error-message" />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-block" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Spinner size="small" /> : "S'inscrire"}
                  </button>
                </Form>
              )}
            </Formik>
            
            <div className="auth-links">
              <p>
                Vous avez déjà un compte? <Link to="/login">Se connecter</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;