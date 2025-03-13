// client/src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Ajouter des logs pour déboguer
  console.log('État utilisateur dans Navbar:', user);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Lord Of The Coin</Link>
      </div>
      <div className="navbar-menu">
        {user ? (
          <>
            <Link to="/dashboard" className="navbar-item">Dashboard</Link>
            <Link to="/profile" className="navbar-item">Profil</Link>
            <button onClick={handleLogout} className="navbar-item logout-btn">
              Déconnexion ({user.username})
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-item">Connexion</Link>
            <Link to="/register" className="navbar-item">Inscription</Link>
          </>
        )}
        <Link to="/" className="navbar-item">Classement</Link>
      </div>
    </nav>
  );
};

export default Navbar;