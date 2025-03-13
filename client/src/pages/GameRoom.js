// client/src/pages/GameRoom.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AlertMessage from '../components/AlertMessage';
import Spinner from '../components/Spinner';
import useAuth from '../hooks/useAuth';
import SpriteAnimation from '../utils/SpriteAnimation';
import { 
  getSocket, 
  leaveRoom, 
  startGame, 
  sendClick, 
  sendPlayerPosition,
  collectCoin,
  onPlayerJoined, 
  onPlayerLeft, 
  onGameStarting, 
  onGameStarted, 
  onScoreUpdate,
  onCoinUpdate,
  onGameEnded, 
  onRoomClosed,
  onOpponentPosition,
  onError 
} from '../services/socketService';
import '../styles/GameRoom.css';

const GameRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [players, setPlayers] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [gameState, setGameState] = useState({
    status: 'waiting', // waiting, countdown, playing, ended
    countdown: 0,
    player1Score: 0,
    player2Score: 0,
    winner: null,
    timeLeft: 60  // Modifier de 30 à 60 secondes
  });
  const [alert, setAlert] = useState(null);
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const backgroundImageRef = useRef(null); // Référence pour l'image de fond
  const ringImageRef = useRef(null); // Référence pour l'image de l'anneau
  const playerRef = useRef({
    x: 70,  // Ajuster la position initiale pour le canvas plus grand
    y: 350, // Ajuster la position initiale pour le canvas plus grand
    width: 48,  // Conserver la taille originale pour les collisions
    height: 48, // Conserver la taille originale pour les collisions
    speed: 6,   // Légèrement augmenter la vitesse
    velY: 0,
    jumping: false,
    gravity: 0.3,
    color: '#FF4136',
    direction: 'right',
    isMoving: false,
    animations: {
      idle: null,
      walk: null
    },
    currentAnimation: 'idle',
    spriteWidth: 120,  // Augmenter considérablement la taille d'affichage du sprite
    spriteHeight: 120  // Augmenter considérablement la taille d'affichage du sprite
  });
  const opponentRef = useRef({
    x: 930, // Ajuster la position initiale pour le canvas plus grand
    y: 350, // Ajuster la position initiale pour le canvas plus grand
    width: 48,  // Conserver la taille originale pour les collisions
    height: 48, // Conserver la taille originale pour les collisions
    speed: 6,   // Légèrement augmenter la vitesse
    velY: 0,
    jumping: false,
    gravity: 0.3,
    color: '#0074D9',
    direction: 'left',
    isMoving: false,
    animations: {
      idle: null,
      walk: null
    },
    currentAnimation: 'idle',
    spriteWidth: 120,  // Augmenter considérablement la taille d'affichage du sprite
    spriteHeight: 120  // Augmenter considérablement la taille d'affichage du sprite
  });
  const platformsRef = useRef([
    // Sol
    {x: 0, y: 650, width: 1000, height: 25},  // Ajuster pour le canvas plus grand
    // Plateformes
    {x: 120, y: 520, width: 260, height: 25},  // Ajuster pour le canvas plus grand
    {x: 500, y: 440, width: 260, height: 25},  // Ajuster pour le canvas plus grand
    {x: 350, y: 320, width: 200, height: 25}   // Ajuster pour le canvas plus grand
  ]);
  const coinRef = useRef({
    x: 500,
    y: 250,
    width: 30,  // Rendre la pièce un peu plus grande
    height: 30, // Rendre la pièce un peu plus grande
    active: true
  });
  const keysRef = useRef({});
  
  // Vérifier si l'utilisateur est le créateur de la room
  useEffect(() => {
    if (players.length > 0 && user) {
      setIsCreator(players[0].id === user.id);
    }
  }, [players, user]);
  
  // Configurer les écouteurs d'événements Socket.IO
  useEffect(() => {
    const socket = getSocket();
    
    // Identifier la room actuelle et l'utilisateur
    console.log(`Entrée dans room ${roomId}, utilisateur ${user?.id}`);
    
    // Demander les détails de la room dès l'entrée
    if (user) {
      // Cette section est nouvelle, elle initialise les joueurs dès l'entrée dans la room
      socket.emit('getRoomDetails', roomId);
      
      // Initialiser l'état players avec au moins l'utilisateur actuel si la liste est vide
      if (players.length === 0 && user) {
        setPlayers([{
          id: user.id,
          username: user.username
        }]);
      }
    }
    
    // Gérer les joueurs qui rejoignent
    const cleanupPlayerJoinedListener = onPlayerJoined(({ players: roomPlayers }) => {
      console.log('Joueurs dans la room:', roomPlayers);
      setPlayers(roomPlayers);
    });
    
    // Gérer les joueurs qui partent
    const cleanupPlayerLeftListener = onPlayerLeft(({ players: roomPlayers }) => {
      console.log('Joueur parti, joueurs restants:', roomPlayers);
      setPlayers(roomPlayers);
    });
    
    // Gérer la fermeture de la room
    const cleanupRoomClosedListener = onRoomClosed(() => {
      console.log('Room fermée, redirection vers dashboard');
      setAlert({
        type: 'info',
        message: 'La partie a été fermée par le créateur.'
      });
      
      // Rediriger vers le tableau de bord après quelques secondes
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    });
    
    // Gérer le démarrage du jeu (compte à rebours)
    const cleanupGameStartingListener = onGameStarting(({ countdown }) => {
      setGameState(prevState => ({
        ...prevState,
        status: 'countdown',
        countdown
      }));
    });
    
    // Gérer le démarrage du jeu
    const cleanupGameStartedListener = onGameStarted(({ gameState: initialGameState, coinState: initialCoinState }) => {
      setGameState(prevState => ({
        ...prevState,
        status: 'playing',
        player1Score: 0,
        player2Score: 0,
        timeLeft: 60  // Modifier de 30 à 60 secondes
      }));
      
      // Initialiser la position de la pièce
      if (initialCoinState) {
        coinRef.current = {
          ...coinRef.current,
          x: initialCoinState.position.x,
          y: initialCoinState.position.y,
          active: initialCoinState.active
        };
      }
      
      // Démarrer le compte à rebours
      const timer = setInterval(() => {
        setGameState(prevState => {
          const newTimeLeft = prevState.timeLeft - 1;
          
          if (newTimeLeft <= 0) {
            clearInterval(timer);
          }
          
          return {
            ...prevState,
            timeLeft: Math.max(0, newTimeLeft)
          };
        });
      }, 1000);
      
      return () => clearInterval(timer);
    });
    
    // Gérer les mises à jour de score
    const cleanupScoreUpdateListener = onScoreUpdate(({ player1Score, player2Score }) => {
      setGameState(prevState => ({
        ...prevState,
        player1Score,
        player2Score
      }));
    });
    
    // Gérer les positions de l'adversaire
    const cleanupOpponentPositionListener = onOpponentPosition((positionData) => {
      opponentRef.current = {
        ...opponentRef.current,
        x: positionData.x,
        y: positionData.y,
        direction: positionData.direction || opponentRef.current.direction,
        currentAnimation: positionData.currentAnimation || 'idle'
      };
      
      // Mettre à jour la direction de l'animation si elle existe
      if (opponentRef.current.animations && 
          opponentRef.current.animations[opponentRef.current.currentAnimation]) {
        opponentRef.current.animations[opponentRef.current.currentAnimation]
          .setDirection(opponentRef.current.direction);
      }
    });
    
    // Gérer les mises à jour des positions des pièces
    const cleanupCoinUpdateListener = onCoinUpdate((coinData) => {
      coinRef.current = {
        ...coinRef.current,
        x: coinData.position.x,
        y: coinData.position.y,
        active: coinData.active
      };
    });
    
    // Gérer la fin du jeu
    const cleanupGameEndedListener = onGameEnded(({ gameState: finalGameState, winner }) => {
      setGameState(prevState => ({
        ...prevState,
        status: 'ended',
        player1Score: finalGameState.player1.score,
        player2Score: finalGameState.player2.score,
        winner
      }));
    });
    
    // Gérer les erreurs
    const cleanupErrorListener = onError((error) => {
      setAlert({
        type: 'error',
        message: error.message || 'Une erreur est survenue.'
      });
    });
    
    // Nettoyer tous les écouteurs lorsque le composant est démonté
    return () => {
      if (typeof cleanupPlayerJoinedListener === 'function') cleanupPlayerJoinedListener();
      if (typeof cleanupPlayerLeftListener === 'function') cleanupPlayerLeftListener();
      if (typeof cleanupRoomClosedListener === 'function') cleanupRoomClosedListener();
      if (typeof cleanupGameStartingListener === 'function') cleanupGameStartingListener();
      if (typeof cleanupGameStartedListener === 'function') cleanupGameStartedListener();
      if (typeof cleanupScoreUpdateListener === 'function') cleanupScoreUpdateListener();
      if (typeof cleanupOpponentPositionListener === 'function') cleanupOpponentPositionListener();
      if (typeof cleanupCoinUpdateListener === 'function') cleanupCoinUpdateListener();
      if (typeof cleanupGameEndedListener === 'function') cleanupGameEndedListener();
      if (typeof cleanupErrorListener === 'function') cleanupErrorListener();
    };
  }, [roomId, navigate, user, players.length]);
  
  // Gérer le départ de l'utilisateur
  const handleLeaveRoom = useCallback(() => {
    console.log(`Quittant la room ${roomId} via bouton`);
    leaveRoom(roomId);
    navigate('/dashboard');
  }, [roomId, navigate]);
  
  // Gérer le démarrage du jeu
  const handleStartGame = useCallback(() => {
    startGame(roomId);
  }, [roomId]);
  
  // Gérer les clics sur le bouton de jeu - remplacé par la logique du jeu de plateforme
  const handleButtonClick = useCallback(() => {
    if (gameState.status === 'playing') {
      sendClick(roomId);
    }
  }, [roomId, gameState.status]);
  
  // Obtenir le score du joueur actuel
  const getCurrentPlayerScore = useCallback(() => {
    if (!user || players.length < 2) return 0;
    
    return user.id === players[0].id ? gameState.player1Score : gameState.player2Score;
  }, [user, players, gameState]);
  
  // Obtenir le score de l'adversaire
  const getOpponentScore = useCallback(() => {
    if (!user || players.length < 2) return 0;
    
    return user.id === players[0].id ? gameState.player2Score : gameState.player1Score;
  }, [user, players, gameState]);
  
  // Vérifier si l'utilisateur actuel est le gagnant
  const isCurrentPlayerWinner = useCallback(() => {
    if (!user || !gameState.winner) return false;
    
    return user.id === gameState.winner;
  }, [user, gameState.winner]);
  
  // Charger les sprites et animations
  const loadPlayerSprites = useCallback(async (isPlayer1) => {
    try {
      // Déterminer quel set de sprites utiliser selon le joueur
      const characterFolder = isPlayer1 ? 'char1' : 'char2';
      const idleFrames = isPlayer1 ? 6 : 7;  // 6 frames pour char1/idle, 7 pour char2/idle
      const walkFrames = 12;  // 12 frames pour les deux animations walk

      // Créer et charger les animations
      const idleAnimation = new SpriteAnimation({ frameDelay: 16 });  // Ralentir l'animation idle (2x plus lent)
      await idleAnimation.loadFrames(`${process.env.PUBLIC_URL}/${characterFolder}/idle`, idleFrames, '_Idle');

      const walkAnimation = new SpriteAnimation({ frameDelay: 5 });
      await walkAnimation.loadFrames(`${process.env.PUBLIC_URL}/${characterFolder}/walk`, walkFrames, '_Walk');

      return { idle: idleAnimation, walk: walkAnimation };
    } catch (error) {
      console.error('Erreur lors du chargement des sprites:', error);
      return null;
    }
  }, []);
  
  // Charger l'image de fond et l'image de l'anneau
  useEffect(() => {
    const loadImages = () => {
      // Charger l'image de fond
      const bgImage = new Image();
      bgImage.src = `${process.env.PUBLIC_URL}/background.jpg`;
      bgImage.onload = () => {
        backgroundImageRef.current = bgImage;
      };
      
      // Charger l'image de l'anneau
      const ringImage = new Image();
      ringImage.src = `${process.env.PUBLIC_URL}/ring.png`; // Image d'un anneau à placer dans le dossier public
      ringImage.onload = () => {
        ringImageRef.current = ringImage;
      };
    };
    
    loadImages();
  }, []);
  
  // Initialiser le jeu de plateforme
  useEffect(() => {
    if (gameState.status === 'playing' && canvasRef.current) {
      // Réinitialiser les positions des joueurs au début de chaque partie
      if (user && players.length >= 2) {
        // Déterminer si on est le joueur 1 ou 2
        const isPlayer1 = user.id === players[0].id;
        
        // Charger les sprites des personnages
        const loadSprites = async () => {
          try {
            // Charger les sprites du joueur actuel
            const playerAnimations = await loadPlayerSprites(isPlayer1);
            playerRef.current = {
              ...playerRef.current,
              x: isPlayer1 ? 70 : 930,  // Ajuster pour le canvas plus grand 
              y: 350,                   // Ajuster pour le canvas plus grand
              color: isPlayer1 ? '#FF4136' : '#0074D9',
              direction: isPlayer1 ? 'right' : 'left',
              animations: playerAnimations
            };
            
            // Charger les sprites de l'adversaire
            const opponentAnimations = await loadPlayerSprites(!isPlayer1);
            opponentRef.current = {
              ...opponentRef.current,
              x: isPlayer1 ? 930 : 70,  // Ajuster pour le canvas plus grand
              y: 350,                   // Ajuster pour le canvas plus grand
              color: isPlayer1 ? '#0074D9' : '#FF4136',
              direction: isPlayer1 ? 'left' : 'right',
              animations: opponentAnimations
            };
          } catch (error) {
            console.error('Erreur lors du chargement des animations:', error);
          }
        };
        
        loadSprites();
      }
      
      const handleKeyDown = (e) => {
        keysRef.current[e.key] = true;
      };
      
      const handleKeyUp = (e) => {
        keysRef.current[e.key] = false;
      };
      
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      
      // Démarrer la boucle de jeu
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current);
        }
      };
    }
  }, [gameState.status, user, players, loadPlayerSprites]);
  
  // Fonction pour mettre à jour l'état du joueur et des objets du jeu
  const updateGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const player = playerRef.current;
    const isMoving = keysRef.current['ArrowLeft'] || keysRef.current['a'] || 
                     keysRef.current['ArrowRight'] || keysRef.current['d'];
    
    // Appliquer la gravité
    player.velY += player.gravity;
    player.y += player.velY;
    
    // Déplacements horizontaux
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
      player.x -= player.speed;
      player.direction = 'left';
      player.isMoving = true;
      player.currentAnimation = 'walk';
    } else if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
      player.x += player.speed;
      player.direction = 'right';
      player.isMoving = true;
      player.currentAnimation = 'walk';
    } else {
      player.isMoving = false;
      player.currentAnimation = 'idle';
    }
    
    // Mettre à jour l'animation
    if (player.animations && player.animations[player.currentAnimation]) {
      player.animations[player.currentAnimation].update();
      player.animations[player.currentAnimation].setDirection(player.direction);
    }
    
    // Saut
    if ((keysRef.current['ArrowUp'] || keysRef.current[' '] || keysRef.current['w']) && !player.jumping) {
      player.velY = -10;
      player.jumping = true;
    }
    
    // Détection de collisions avec les plateformes
    player.jumping = true;
    platformsRef.current.forEach(platform => {
      if (player.y + player.height > platform.y && 
          player.y < platform.y + platform.height && 
          player.x + player.width > platform.x && 
          player.x < platform.x + platform.width) {
        
        if (player.velY > 0) {
          player.jumping = false;
          player.velY = 0;
          player.y = platform.y - player.height;
        }
      }
    });
    
    // Limites du canvas
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    
    // Si le joueur tombe hors du canvas
    if (player.y > canvas.height) {
      player.x = 70;  // Ajuster pour le canvas plus grand
      player.y = 350; // Ajuster pour le canvas plus grand
      player.velY = 0;
    }
    
    // Détection de collision avec la pièce
    const coin = coinRef.current;
    if (coin.active && 
        player.x < coin.x + coin.width &&
        player.x + player.width > coin.x &&
        player.y < coin.y + coin.height &&
        player.y + player.height > coin.y) {
      
      // Envoyer l'info au serveur pour vérification
      collectCoin(roomId, {
        x: player.x,
        y: player.y
      });
      
      // On ne fait plus disparaître la pièce ici
      // C'est le serveur qui gère cela et qui nous informe via onCoinUpdate
    }
    
    // Envoyer la position et l'état au serveur (3 frames = ~50ms)
    if (gameState.status === 'playing') {
      player.positionUpdateTimer = player.positionUpdateTimer || 0;
      player.positionUpdateTimer++;
      
      if (player.positionUpdateTimer >= 3) {
        player.positionUpdateTimer = 0;
        sendPlayerPosition(roomId, {
          x: player.x,
          y: player.y,
          direction: player.direction,
          currentAnimation: player.currentAnimation
        });
      }
    }
  };
  
  // Fonction pour dessiner le jeu
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner l'arrière-plan
    if (backgroundImageRef.current) {
      // Si l'image est chargée, la dessiner comme fond
      ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Sinon utiliser une couleur de fond par défaut
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Dessiner les plateformes
    ctx.fillStyle = '#333333';
    platformsRef.current.forEach(platform => {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    // Dessiner le joueur
    const player = playerRef.current;
    if (player.animations && player.animations[player.currentAnimation]) {
      // Utiliser la spriteWidth et spriteHeight pour le rendu, mais garder la taille physique pour les collisions
      player.animations[player.currentAnimation].draw(
        ctx, 
        player.x - (player.spriteWidth - player.width) / 2, // Centrer le sprite
        player.y - (player.spriteHeight - player.height) / 2 - 15, // Centrer le sprite et remonter de 10px
        player.spriteWidth, 
        player.spriteHeight
      );
    } else {
      // Fallback si les animations ne sont pas chargées
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Dessiner l'adversaire
    const opponent = opponentRef.current;
    if (opponent.animations && opponent.animations[opponent.currentAnimation]) {
      // Utiliser la spriteWidth et spriteHeight pour le rendu, mais garder la taille physique pour les collisions
      opponent.animations[opponent.currentAnimation].draw(
        ctx, 
        opponent.x - (opponent.spriteWidth - opponent.width) / 2, // Centrer le sprite
        opponent.y - (opponent.spriteHeight - opponent.height) / 2 - 10, // Centrer le sprite et remonter de 10px
        opponent.spriteWidth, 
        opponent.spriteHeight
      );
    } else {
      // Fallback si les animations ne sont pas chargées
      ctx.fillStyle = opponent.color;
      ctx.fillRect(opponent.x, opponent.y, opponent.width, opponent.height);
    }
    
    // Dessiner l'anneau (pièce) si elle est active
    const coin = coinRef.current;
    if (coin.active) {
      if (ringImageRef.current) {
        // Si l'image de l'anneau est chargée, l'utiliser
        // Ajouter une petite animation de rotation pour l'anneau
        const time = Date.now() / 1000;
        const oscillation = Math.sin(time * 2) * 5; // Oscillation verticale
        
        ctx.save();
        ctx.translate(coin.x + coin.width/2, coin.y + coin.height/2 + oscillation);
        ctx.rotate(time % (Math.PI * 2)); // Rotation lente
        ctx.drawImage(
          ringImageRef.current, 
          -coin.width/2, 
          -coin.height/2, 
          coin.width, 
          coin.height
        );
        ctx.restore();
        
        // Ajouter un effet de lueur pour mettre en valeur l'anneau
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(time * 3) * 0.1; // Opacité variable pour effet de pulsation
        ctx.filter = 'blur(5px)';
        ctx.drawImage(
          ringImageRef.current, 
          coin.x - 5 + oscillation/2, 
          coin.y - 5 + oscillation, 
          coin.width + 10, 
          coin.height + 10
        );
        ctx.restore();
      } else {
        // Fallback si l'image n'est pas chargée - utiliser le rendu d'anneau précédent
        const centerX = coin.x + coin.width/2;
        const centerY = coin.y + coin.height/2;
        const outerRadius = coin.width/2;
        const innerRadius = coin.width/3.5;
        
        // Créer un dégradé radial pour un effet brillant doré
        const gradient = ctx.createRadialGradient(
          centerX, centerY, innerRadius,
          centerX, centerY, outerRadius
        );
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.7, '#FFC125');
        gradient.addColorStop(1, '#B8860B');
        
        // Dessiner le cercle extérieur
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Couper le cercle intérieur pour créer l'anneau
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = backgroundImageRef.current ? 'rgba(0,0,0,0)' : '#f8f9fa';
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        
        // Ajouter un effet lumineux
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFD700';
        ctx.stroke();
      }
    }
  };
  
  // Boucle de jeu principale
  const gameLoop = () => {
    updateGame();
    updateOpponentAnimation();
    drawGame();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Mettre à jour l'animation de l'adversaire
  const updateOpponentAnimation = () => {
    const opponent = opponentRef.current;
    if (opponent.animations && opponent.animations[opponent.currentAnimation]) {
      opponent.animations[opponent.currentAnimation].update();
    }
  };
  
  return (
    <>
      <Navbar />
      <div className="container">
        <div className="game-room">
          <h1>Salle de jeu</h1>
          
          {alert && (
            <AlertMessage
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}
          
          <div className="game-container">
            <div className="players-info">
              <h2>Joueurs ({players.length}/2)</h2>
              <div className="players-list">
                {players.map((player, index) => (
                  <div 
                    key={player.id} 
                    className={`player ${player.id === user?.id ? 'current-player' : ''}`}
                  >
                    <span className="player-number">Joueur {index + 1}:</span>
                    <span className="player-name">
                      {player.id === user?.id ? 'Vous' : player.username}
                    </span>
                  </div>
                ))}
                
                {players.length === 1 && (
                  <div className="waiting-message">En attente d'un autre joueur...</div>
                )}
              </div>
            </div>
            
            <div className="game-area">
              {gameState.status === 'waiting' && (
                <div className="waiting-state">
                  {players.length < 2 ? (
                    <div className="waiting-message">
                      <p>En attente d'un autre joueur pour commencer...</p>
                    </div>
                  ) : isCreator ? (
                    <div className="creator-controls">
                      <p>Un autre joueur a rejoint votre partie !</p>
                      <button 
                        className="btn btn-primary btn-start-game"
                        onClick={handleStartGame}
                      >
                        Démarrer la partie
                      </button>
                    </div>
                  ) : (
                    <div className="waiting-message">
                      <p>En attente que le créateur démarre la partie...</p>
                      <Spinner />
                    </div>
                  )}
                </div>
              )}
              
              {gameState.status === 'countdown' && (
                <div className="countdown-state">
                  <h2>La partie commence dans...</h2>
                  <div className="countdown">{gameState.countdown}</div>
                  <p>Préparez-vous à cliquer !</p>
                </div>
              )}
              
              {gameState.status === 'playing' && (
                <div className="playing-state">
                  <div className="scores">
                    <div className="score-container">
                      <div className="score-label">Vous</div>
                      <div className="score-value">{getCurrentPlayerScore()}</div>
                    </div>
                    <div className="score-separator">vs</div>
                    <div className="score-container">
                      <div className="score-label">Adversaire</div>
                      <div className="score-value">{getOpponentScore()}</div>
                    </div>
                  </div>
                  
                  <div className="timer">Temps restant: {gameState.timeLeft}s</div>
                  
                  <canvas 
                    ref={canvasRef} 
                    width="1000" 
                    height="750" 
                    className="game-canvas"
                  />
                  
                  <div className="game-instructions">
                    <p>Utilisez les flèches ou WASD pour vous déplacer et espace pour sauter.</p>
                    <p>Collectez les anneaux dorés pour gagner des points !</p>
                  </div>
                </div>
              )}
              
              {gameState.status === 'ended' && (
                <div className="ended-state">
                  <h2>Partie terminée !</h2>
                  
                  <div className="final-scores">
                    <div className="score-container">
                      <div className="score-label">Vous</div>
                      <div className="score-value">{getCurrentPlayerScore()}</div>
                    </div>
                    <div className="score-separator">vs</div>
                    <div className="score-container">
                      <div className="score-label">Adversaire</div>
                      <div className="score-value">{getOpponentScore()}</div>
                    </div>
                  </div>
                  
                  <div className="result-message">
                    {gameState.winner ? (
                      isCurrentPlayerWinner() ? (
                        <div className="winner-message">Vous avez gagné ! 🎉</div>
                      ) : (
                        <div className="loser-message">Vous avez perdu ! 😢</div>
                      )
                    ) : (
                      <div className="tie-message">Match nul ! 🤝</div>
                    )}
                  </div>
                  
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Retour au tableau de bord
                  </button>
                </div>
              )}
            </div>
            
            {gameState.status === 'waiting' && (
              <div className="room-controls">
                <button 
                  className="btn btn-danger btn-leave-room"
                  onClick={handleLeaveRoom}
                >
                  Quitter la partie
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GameRoom;