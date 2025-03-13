// client/src/services/socketService.js
import { io } from 'socket.io-client';
import { getUserInfo } from './authService';

let socket;

// Initialiser la connexion Socket.IO
export const initializeSocket = () => {
  if (socket) {
    return socket;
  }

  const ENDPOINT = process.env.NODE_ENV === 'production'
    ? window.location.origin
    : 'http://localhost:5000';
    
  socket = io(ENDPOINT, {
    withCredentials: true,
    transports: ['websocket', 'polling']
  });
  
  // Authentifier avec l'ID utilisateur
  const userInfo = getUserInfo();
  if (userInfo) {
    socket.auth = { userId: userInfo.id };
    socket.emit('authenticate', userInfo.id);
    
    // Écouter les déconnexions et les reconnexions
    socket.on('connect', () => {
      console.log('Socket connecté:', socket.id);
      // Ré-authentifier lors de la reconnexion
      socket.emit('authenticate', userInfo.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket déconnecté:', reason);
    });
  }
  
  return socket;
};

// Récupérer l'instance Socket.IO
export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

// Fermer la connexion Socket.IO
export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Gestion des rooms
export const createRoom = () => {
  console.log('Création d\'une room...');
  socket.emit('createRoom');
};

export const getRooms = (callback) => {
  socket.on('roomList', (rooms) => {
    console.log('Liste des rooms reçue:', rooms);
    callback(rooms);
  });
  
  // Déclencher la récupération initiale des rooms
  const userInfo = getUserInfo();
  if (userInfo) {
    socket.emit('authenticate', userInfo.id);
  }
  
  // Retourner une fonction de nettoyage
  return () => {
    socket.off('roomList');
  };
};

export const joinRoom = (roomId) => {
  console.log('Tentative de rejoindre la room:', roomId);
  socket.emit('joinRoom', roomId);
};

export const leaveRoom = (roomId) => {
  console.log('Quitter la room:', roomId);
  socket.emit('leaveRoom', roomId);
};

export const startGame = (roomId) => {
  console.log('Démarrer le jeu dans la room:', roomId);
  socket.emit('startGame', roomId);
};

export const sendClick = (roomId) => {
  socket.emit('playerClick', roomId);
};

// Synchronisation de la position du joueur
export const sendPlayerPosition = (roomId, position) => {
  socket.emit('playerPosition', { roomId, position });
};

// Collecter une pièce
export const collectCoin = (roomId, playerPosition) => {
  socket.emit('collectCoin', { roomId, playerPosition });
};

export const onCoinUpdate = (callback) => {
  socket.on('coinUpdate', (data) => {
    callback(data);
  });
  return () => {
    socket.off('coinUpdate');
  };
};

export const onOpponentPosition = (callback) => {
  socket.on('opponentPosition', (data) => {
    callback(data);
  });
  return () => {
    socket.off('opponentPosition');
  };
};

// Événements du jeu
export const onPlayerJoined = (callback) => {
  socket.on('playerJoined', (data) => {
    console.log('Joueur rejoint:', data);
    callback(data);
  });
  return () => {
    socket.off('playerJoined');
  };
};

export const onRoomCreated = (callback) => {
  socket.on('roomCreated', (data) => {
    console.log('Room créée:', data);
    callback(data);
  });
  return () => {
    socket.off('roomCreated');
  };
};

export const onRoomClosed = (callback) => {
  socket.on('roomClosed', (data) => {
    console.log('Room fermée:', data);
    callback(data);
  });
  return () => {
    socket.off('roomClosed');
  };
};

export const onPlayerLeft = (callback) => {
  socket.on('playerLeft', (data) => {
    console.log('Joueur parti:', data);
    callback(data);
  });
  return () => {
    socket.off('playerLeft');
  };
};

export const onGameStarting = (callback) => {
  socket.on('gameStarting', (data) => {
    console.log('Jeu en démarrage:', data);
    callback(data);
  });
  return () => {
    socket.off('gameStarting');
  };
};

export const onGameStarted = (callback) => {
  socket.on('gameStarted', (data) => {
    console.log('Jeu démarré:', data);
    callback(data);
  });
  return () => {
    socket.off('gameStarted');
  };
};

export const onScoreUpdate = (callback) => {
  socket.on('scoreUpdate', (data) => {
    callback(data);
  });
  return () => {
    socket.off('scoreUpdate');
  };
};

export const onGameEnded = (callback) => {
  socket.on('gameEnded', (data) => {
    console.log('Jeu terminé:', data);
    callback(data);
  });
  return () => {
    socket.off('gameEnded');
  };
};

export const onError = (callback) => {
  socket.on('error', (data) => {
    console.error('Erreur socket:', data);
    callback(data);
  });
  return () => {
    socket.off('error');
  };
};