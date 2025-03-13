// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est présent dans les headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extraire le token du header
      token = req.headers.authorization.split(' ')[1];

      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur sans son mot de passe
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }

      next();
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      res.status(401).json({ message: 'Non autorisé, token invalide' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Non autorisé, aucun token fourni' });
  }
};

// Vérifier si l'email est confirmé
const emailConfirmed = (req, res, next) => {
  if (!req.user.isEmailConfirmed) {
    return res.status(403).json({ 
      message: 'Veuillez confirmer votre adresse email avant d\'accéder à cette ressource' 
    });
  }
  next();
};

module.exports = { protect, emailConfirmed };