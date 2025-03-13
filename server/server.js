// server/server.js (fichier complet)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const { handleRoomEvents } = require('./services/socketService');

// Initialiser Express
const app = express();
const server = http.createServer(app);

// Configurer Socket.IO avec CORS mis à jour
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.BASE_URL 
      : ['http://localhost:3000', 'http://localhost:3001'], // Ajouter les deux origines
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware CORS pour Express
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.BASE_URL
    : ['http://localhost:3000', 'http://localhost:3001'], // Ajouter les deux origines
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);

// Socket.IO
handleRoomEvents(io);

// Connexion à la base de données
testConnection();

// Synchroniser les modèles avec la base de données
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Base de données synchronisée');
  })
  .catch(err => {
    console.error('Erreur de synchronisation de la base de données:', err);
  });

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});