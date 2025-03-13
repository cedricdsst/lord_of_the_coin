// server/services/socketService.js
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Game = require('../models/Game');

// Store pour les rooms actives et les utilisateurs connectés
const rooms = {};
const userSocketMap = {};
const gameState = {};
const coinState = {}; // Ajouter un state pour les pièces

// Fonction pour générer une position aléatoire pour une pièce
const generateRandomCoinPosition = (platforms) => {
  const coin = { width: 30, height: 30 };  // Taille de l'anneau
  
  // Positions possibles sur les plateformes
  const possiblePositions = platforms.map(platform => ({
    x: Math.random() * (platform.width - coin.width) + platform.x,
    y: platform.y - coin.height - 5 // Légèrement au-dessus de la plateforme pour mieux voir l'anneau
  }));
  
  return possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
};

// Plateformes pour toutes les rooms (fixe pour l'instant)
const defaultPlatforms = [
  // Sol
  {x: 0, y: 650, width: 1000, height: 25},  // Ajuster pour le canvas plus grand
  // Plateformes
  {x: 120, y: 520, width: 260, height: 25},  // Ajuster pour le canvas plus grand
  {x: 500, y: 440, width: 260, height: 25},  // Ajuster pour le canvas plus grand
  {x: 350, y: 320, width: 200, height: 25}   // Ajuster pour le canvas plus grand
];

const handleRoomEvents = (io) => {
  io.on('connection', (socket) => {
    console.log(`Utilisateur connecté: ${socket.id}`);
    
    // Authentification
    socket.on('authenticate', async (userId) => {
      try {
        if (!userId) {
          return socket.emit('error', { message: 'ID utilisateur manquant' });
        }

        console.log(`Authentification de l'utilisateur ${userId} avec socket ${socket.id}`);
        
        const user = await User.findByPk(userId);
        if (!user) {
          return socket.emit('error', { message: 'Utilisateur non trouvé' });
        }
        
        // Associer l'ID socket à l'ID utilisateur
        userSocketMap[userId] = socket.id;
        socket.userId = userId;
        socket.username = user.username;
        
        // Envoyer la liste des rooms disponibles
        socket.emit('roomList', Object.values(rooms).filter(room => room.players.length < 2 && !room.gameStarted));
        console.log('Liste des rooms envoyée à', userId);
      } catch (error) {
        console.error('Erreur d\'authentification socket:', error);
        socket.emit('error', { message: 'Erreur d\'authentification' });
      }
    });
    
    // Récupérer les détails d'une room
    socket.on('getRoomDetails', (roomId) => {
      try {
        if (!socket.userId) {
          return socket.emit('error', { message: 'Vous devez être authentifié' });
        }
        
        const room = rooms[roomId];
        
        if (!room) {
          return socket.emit('error', { message: 'Room non trouvée' });
        }
        
        // Envoyer les détails de la room à l'utilisateur
        socket.emit('playerJoined', {
          roomId,
          players: room.players
        });
        
      } catch (error) {
        console.error('Erreur lors de la récupération des détails de la room:', error);
        socket.emit('error', { message: 'Erreur lors de la récupération des détails de la room' });
      }
    });
    
    // Création d'une room
    socket.on('createRoom', async () => {
      try {
        if (!socket.userId) {
          return socket.emit('error', { message: 'Vous devez être authentifié' });
        }
        
        console.log(`L'utilisateur ${socket.userId} (${socket.username}) crée une room`);
        
        // Générer un ID unique pour la room
        const roomId = uuidv4();
        
        // Créer la room
        rooms[roomId] = {
          id: roomId,
          creatorId: socket.userId,
          creatorName: socket.username,
          players: [{ 
            id: socket.userId, 
            socketId: socket.id, 
            username: socket.username 
          }],
          gameStarted: false
        };
        
        // Joindre la room
        socket.join(roomId);
        
        console.log('Room créée:', rooms[roomId]);
        
        // Informer le client que la room a été créée
        socket.emit('roomCreated', rooms[roomId]);
        
        // Mettre à jour la liste des rooms pour tous les clients
        io.emit('roomList', Object.values(rooms).filter(room => room.players.length < 2 && !room.gameStarted));
      } catch (error) {
        console.error('Erreur lors de la création de la room:', error);
        socket.emit('error', { message: 'Erreur lors de la création de la room' });
      }
    });
    
    // Rejoindre une room
    socket.on('joinRoom', async (roomId) => {
      try {
        if (!socket.userId) {
          return socket.emit('error', { message: 'Vous devez être authentifié' });
        }
        
        const room = rooms[roomId];
        
        if (!room) {
          return socket.emit('error', { message: 'Room non trouvée' });
        }
        
        if (room.players.length >= 2) {
          return socket.emit('error', { message: 'La room est pleine' });
        }
        
        if (room.gameStarted) {
          return socket.emit('error', { message: 'La partie a déjà commencé' });
        }
        
        // Vérifier si le joueur est déjà dans la room
        if (room.players.some(player => player.id === socket.userId)) {
          console.log(`Le joueur ${socket.userId} est déjà dans la room ${roomId}`);
          return;
        }
        
        console.log(`Le joueur ${socket.userId} (${socket.username}) rejoint la room ${roomId}`);
        
        // Ajouter le joueur à la room
        room.players.push({ 
          id: socket.userId, 
          socketId: socket.id, 
          username: socket.username 
        });
        
        // Joindre la room
        socket.join(roomId);
        
        // Informer tous les joueurs dans la room
        io.to(roomId).emit('playerJoined', {
          roomId,
          players: room.players
        });
        
        // Mettre à jour la liste des rooms
        io.emit('roomList', Object.values(rooms).filter(room => room.players.length < 2 && !room.gameStarted));
      } catch (error) {
        console.error('Erreur lors de la connexion à la room:', error);
        socket.emit('error', { message: 'Erreur lors de la connexion à la room' });
      }
    });
    
    // Démarrer le jeu
    socket.on('startGame', async (roomId) => {
      try {
        if (!socket.userId) {
          return socket.emit('error', { message: 'Vous devez être authentifié' });
        }
        
        console.log(`L'utilisateur ${socket.userId} tente de démarrer le jeu dans la room ${roomId}`);
        
        const room = rooms[roomId];
        
        if (!room) {
          return socket.emit('error', { message: 'Room non trouvée' });
        }
        
        if (room.players.length !== 2) {
          return socket.emit('error', { message: 'Il faut deux joueurs pour démarrer' });
        }
        
        if (room.creatorId !== socket.userId) {
          return socket.emit('error', { message: 'Seul le créateur peut démarrer la partie' });
        }
        
        // Marquer la room comme démarrée
        room.gameStarted = true;
        gameState[roomId] = {
          player1: {
            id: room.players[0].id,
            score: 0
          },
          player2: {
            id: room.players[1].id,
            score: 0
          },
          startTime: Date.now(),
          endTime: Date.now() + 60000, // 60 secondes de jeu
          finished: false
        };
        
        // Initialiser la position de la pièce
        coinState[roomId] = {
          position: generateRandomCoinPosition(defaultPlatforms),
          active: true
        };
        
        console.log(`Démarrage du jeu dans la room ${roomId}, état:`, gameState[roomId]);
        
        // Informer les joueurs que le jeu démarre (compte à rebours)
        io.to(roomId).emit('gameStarting', {
          countdown: 3
        });
        
        // Démarrer le jeu après le compte à rebours
        setTimeout(() => {
          io.to(roomId).emit('gameStarted', {
            gameState: gameState[roomId],
            coinState: coinState[roomId]
          });
          
          // Terminer le jeu après 60 secondes
          setTimeout(async () => {
            if (!gameState[roomId]) {
              console.log(`La room ${roomId} n'existe plus, impossible de terminer le jeu`);
              return;
            }
            
            gameState[roomId].finished = true;
            
            // Déterminer le gagnant
            let winnerId = null;
            if (gameState[roomId].player1.score > gameState[roomId].player2.score) {
              winnerId = gameState[roomId].player1.id;
            } else if (gameState[roomId].player2.score > gameState[roomId].player1.score) {
              winnerId = gameState[roomId].player2.id;
            }
            
            console.log(`Fin du jeu dans la room ${roomId}, gagnant: ${winnerId || 'égalité'}`);
            
            // Sauvegarder la partie dans la base de données
            try {
              const savedGame = await Game.create({
                player1Id: gameState[roomId].player1.id,
                player2Id: gameState[roomId].player2.id,
                player1Score: gameState[roomId].player1.score,
                player2Score: gameState[roomId].player2.score,
                winnerId
              });
              
              // Mettre à jour les statistiques des joueurs
              if (winnerId) {
                const winner = await User.findByPk(winnerId);
                winner.wins += 1;
                winner.totalGames += 1;
                
                const highestScore = winnerId === gameState[roomId].player1.id
                  ? gameState[roomId].player1.score
                  : gameState[roomId].player2.score;
                  
                if (highestScore > winner.highestScore) {
                  winner.highestScore = highestScore;
                }
                
                await winner.save();
                
                const loserId = winnerId === gameState[roomId].player1.id
                  ? gameState[roomId].player2.id
                  : gameState[roomId].player1.id;
                  
                const loser = await User.findByPk(loserId);
                loser.losses += 1;
                loser.totalGames += 1;
                await loser.save();
              } else {
                // Si égalité
                const player1 = await User.findByPk(gameState[roomId].player1.id);
                const player2 = await User.findByPk(gameState[roomId].player2.id);
                
                player1.totalGames += 1;
                player2.totalGames += 1;
                
                await player1.save();
                await player2.save();
              }
              
              // Envoyer les résultats aux joueurs
              io.to(roomId).emit('gameEnded', {
                gameState: gameState[roomId],
                winner: winnerId,
                gameId: savedGame.id
              });
              
              // Nettoyer
              delete gameState[roomId];
              delete coinState[roomId]; // Nettoyer aussi l'état des pièces
              delete rooms[roomId];
              
              // Mettre à jour la liste des rooms
              io.emit('roomList', Object.values(rooms).filter(room => room.players.length < 2 && !room.gameStarted));
            } catch (error) {
              console.error('Erreur lors de la sauvegarde de la partie:', error);
              io.to(roomId).emit('error', { message: 'Erreur lors de la sauvegarde des résultats' });
            }
          }, 60000);
        }, 3000);
      } catch (error) {
        console.error('Erreur lors du démarrage du jeu:', error);
        socket.emit('error', { message: 'Erreur lors du démarrage du jeu' });
      }
    });
    
    // Gérer les clics des joueurs
    socket.on('playerClick', (roomId) => {
      try {
        if (!socket.userId) {
          return socket.emit('error', { message: 'Vous devez être authentifié' });
        }
        
        const game = gameState[roomId];
        
        if (!game || game.finished) {
          return;
        }
        
        // Incrémenter le score du joueur
        if (game.player1.id === socket.userId) {
          game.player1.score += 1;
        } else if (game.player2.id === socket.userId) {
          game.player2.score += 1;
        }
        
        // Diffuser les scores mis à jour aux deux joueurs
        io.to(roomId).emit('scoreUpdate', {
          player1Score: game.player1.score,
          player2Score: game.player2.score
        });
      } catch (error) {
        console.error('Erreur lors de la gestion du clic:', error);
      }
    });
    
    // Synchroniser la position du joueur
    socket.on('playerPosition', ({ roomId, position }) => {
      try {
        if (!socket.userId) {
          return;
        }
        
        const room = rooms[roomId];
        if (!room) {
          return;
        }
        
        // Trouver l'autre joueur
        const otherPlayer = room.players.find(player => player.id !== socket.userId);
        if (!otherPlayer) {
          return;
        }
        
        // Envoyer la position au joueur adverse uniquement
        io.to(otherPlayer.socketId).emit('opponentPosition', position);
      } catch (error) {
        console.error('Erreur lors de la synchronisation de position:', error);
      }
    });
    
    // Gérer la collecte de pièces
    socket.on('collectCoin', ({ roomId, playerPosition }) => {
      try {
        if (!socket.userId) {
          return socket.emit('error', { message: 'Vous devez être authentifié' });
        }
        
        const game = gameState[roomId];
        const coin = coinState[roomId];
        
        if (!game || game.finished || !coin || !coin.active) {
          return;
        }
        
        // Variables mises à jour pour la détection de collision
        const playerWidth = 48;  // Conserver la taille originale pour les collisions
        const playerHeight = 48; // Conserver la taille originale pour les collisions
        const coinWidth = 30;    // Mettre à jour la taille de la pièce
        const coinHeight = 30;   // Mettre à jour la taille de la pièce
        
        // Vérifier la collision avec la pièce
        const isColliding = 
          playerPosition.x < coin.position.x + coinWidth &&
          playerPosition.x + playerWidth > coin.position.x &&
          playerPosition.y < coin.position.y + coinHeight &&
          playerPosition.y + playerHeight > coin.position.y;
          
        if (isColliding) {
          // Déterminer qui a collecté la pièce et incrémenter son score
          if (game.player1.id === socket.userId) {
            game.player1.score += 1;
          } else if (game.player2.id === socket.userId) {
            game.player2.score += 1;
          }
          
          // Désactiver temporairement la pièce
          coin.active = false;
          
          // Informer les joueurs du changement de score
          io.to(roomId).emit('scoreUpdate', {
            player1Score: game.player1.score,
            player2Score: game.player2.score
          });
          
          // Générer une nouvelle position pour la pièce
          setTimeout(() => {
            coin.position = generateRandomCoinPosition(defaultPlatforms);
            coin.active = true;
            
            // Informer les joueurs de la nouvelle position de la pièce
            io.to(roomId).emit('coinUpdate', {
              position: coin.position,
              active: true
            });
          }, 500);
          
          // Informer immédiatement de la disparition de la pièce
          io.to(roomId).emit('coinUpdate', {
            position: coin.position,
            active: false
          });
        }
      } catch (error) {
        console.error('Erreur lors de la collecte de pièce:', error);
      }
    });
    
    // Quitter une room
    socket.on('leaveRoom', (roomId) => {
      try {
        if (!socket.userId) {
          return socket.emit('error', { message: 'Vous devez être authentifié' });
        }
        
        console.log(`L'utilisateur ${socket.userId} tente de quitter la room ${roomId}`);
        
        const room = rooms[roomId];
        
        if (!room) {
          return;
        }
        
        // Si c'est le créateur qui quitte et que le jeu n'a pas commencé, détruire la room
        if (room.creatorId === socket.userId && !room.gameStarted) {
          console.log(`Le créateur ${socket.userId} quitte la room ${roomId}, suppression de la room`);
          io.to(roomId).emit('roomClosed', { roomId });
          
          // Retirer tous les joueurs de la room
          room.players.forEach(player => {
            const playerSocket = io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
              playerSocket.leave(roomId);
            }
          });
          
          delete rooms[roomId];
        } else if (!room.gameStarted) {
          // Si c'est un joueur non-créateur et que le jeu n'a pas commencé, retirer le joueur
          console.log(`Le joueur ${socket.userId} quitte la room ${roomId}`);
          room.players = room.players.filter(p => p.id !== socket.userId);
          socket.leave(roomId);
          
          // Informer les joueurs restants
          io.to(roomId).emit('playerLeft', {
            playerId: socket.userId,
            players: room.players
          });
        }
        // Si le jeu est en cours, on ne fait rien
        
        // Mettre à jour la liste des rooms
        io.emit('roomList', Object.values(rooms).filter(room => room.players.length < 2 && !room.gameStarted));
      } catch (error) {
        console.error('Erreur lors de la sortie de la room:', error);
      }
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
      console.log(`Utilisateur déconnecté: ${socket.id} (userId: ${socket.userId})`);
      
      // Trouver les rooms où l'utilisateur était présent
      const userRooms = [];
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        
        if (playerIndex !== -1) {
          userRooms.push({ roomId, isCreator: room.creatorId === socket.userId });
        }
      }
      
      // Gérer les rooms de l'utilisateur
      userRooms.forEach(({ roomId, isCreator }) => {
        const room = rooms[roomId];
        
        // Si c'est le créateur et que le jeu n'est pas démarré, détruire la room
        if (isCreator && !room.gameStarted) {
          console.log(`Le créateur ${socket.userId} s'est déconnecté, fermeture de la room ${roomId}`);
          io.to(roomId).emit('roomClosed', { roomId });
          delete rooms[roomId];
        } else if (!room.gameStarted) {
          // Si ce n'est pas le créateur et que le jeu n'est pas démarré, retirer le joueur
          console.log(`Le joueur ${socket.userId} a quitté la room ${roomId}`);
          room.players = room.players.filter(p => p.socketId !== socket.id);
          io.to(roomId).emit('playerLeft', {
            playerId: socket.userId,
            players: room.players
          });
        }
        // Si le jeu est en cours, on ne fait rien de spécial
      });
      
      // Retirer l'utilisateur de la map
      if (socket.userId) {
        delete userSocketMap[socket.userId];
      }
      
      // Mettre à jour la liste des rooms
      io.emit('roomList', Object.values(rooms).filter(room => room.players.length < 2 && !room.gameStarted));
    });
  });
};

module.exports = { handleRoomEvents };