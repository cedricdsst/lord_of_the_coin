// client/src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const NotFound = () => {
  return (
    <>
      <Navbar />
      <div className="container">
        <div className="not-found">
          <h1>404</h1>
          <h2>Page non trouvée</h2>
          <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
          <Link to="/" className="btn btn-primary">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;