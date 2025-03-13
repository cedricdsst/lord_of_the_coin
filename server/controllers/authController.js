// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, VerificationToken } = require('../models');
const { sendConfirmationEmail } = require('../services/emailService');
require('dotenv').config();
const { Op } = require('sequelize');  // Ajoutez cette ligne en haut du fichier

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Inscription
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
      } 
    });

    if (userExists) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    // Créer l'utilisateur
    const user = await User.create({
      username,
      email,
      password
    });

    // Générer un token de vérification
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire après 24h

    // Enregistrer le token
    await VerificationToken.create({
      userId: user.id,
      token,
      expiresAt
    });

    // Envoyer l'email de confirmation
    const emailSent = await sendConfirmationEmail(email, token);

    if (!emailSent) {
      return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email de confirmation' });
    }

    res.status(201).json({
      message: 'Utilisateur créé avec succès. Veuillez vérifier votre email pour confirmer votre compte.'
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isMatch = await user.validatePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer un token JWT
    const token = generateToken(user.id);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isEmailConfirmed: user.isEmailConfirmed,
      token
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

// Vérification d'email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // Trouver le token dans la base de données
    const verificationToken = await VerificationToken.findOne({
      where: { token }
    });

    if (!verificationToken) {
      return res.status(400).json({ message: 'Token de vérification invalide' });
    }

    // Vérifier si le token n'a pas expiré
    if (new Date() > verificationToken.expiresAt) {
      await verificationToken.destroy();
      return res.status(400).json({ message: 'Token de vérification expiré' });
    }

    // Mettre à jour l'utilisateur
    const user = await User.findByPk(verificationToken.userId);
    user.isEmailConfirmed = true;
    await user.save();

    // Supprimer le token
    await verificationToken.destroy();

    res.json({ message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification de l\'email' });
  }
};

// Profil utilisateur
const getUserProfile = async (req, res) => {
  try {
    // req.user est défini par le middleware authMiddleware
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  getUserProfile
};