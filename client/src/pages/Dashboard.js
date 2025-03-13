// client/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import AlertMessage from '../components/AlertMessage';
import useAuth from '../hooks/useAuth';
import { getSocket, createRoom, getRooms, joinRoom, onRoomCreated, onError } from '../services/socketService';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // S'assurer que le socket est initialisé et authentifié
    const socket = getSocket();
    
    // Récupérer la liste des rooms
    const cleanupRoomsListener = getRooms((roomsList) => {
      setRooms(roomsList);
      setLoading(false);
    });
    
    // Écouter les erreurs socket
    const cleanupErrorListener = onError((error) => {
      setAlert({
        type: 'error',
        message: error.message || 'Une erreur est survenue.'
      });
    });
    
    // Écouter la création de room
    const cleanupRoomCreatedListener = onRoomCreated((room) => {
      navigate(`/room/${room.id}`);
    });
    
    return () => {
      cleanupRoomsListener();
      if (typeof cleanupErrorListener === 'function') {
        cleanupErrorListener();
      }
      cleanupRoomCreatedListener();
    };
  }, [navigate]);
  
  const handleCreateRoom = () => {
    createRoom();
  };
  
  const handleJoinRoom = (roomId) => {
    joinRoom(roomId);
    navigate(`/room/${roomId}`);
  };
  
  return (
    <>
      <Navbar />
      <div className="container">
        <div className="dashboard">
          <h1>Tableau de bord</h1>
          
          {alert && (
            <AlertMessage
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}
          
          <div className="welcome-card">
            <h2>Bienvenue, {user?.username || 'Joueur'} !</h2>
            <p>Créez une nouvelle partie ou rejoignez une partie existante.</p>
            <button 
              className="btn btn-primary btn-create-room"
              onClick={handleCreateRoom}
            >
              Créer une partie
            </button>
          </div>
          
          <div className="rooms-section">
            <h2>Parties disponibles</h2>
            
            {loading ? (
              <Spinner center />
            ) : rooms.length > 0 ? (
              <div className="rooms-list">
                {rooms.map(room => (
                  <div key={room.id} className="room-card">
                    <div className="room-info">
                      <h3>Partie de {room.creatorName}</h3>
                      <p>Joueurs : {room.players.length}/2</p>
                    </div>
                    <button 
                      className="btn btn-join-room"
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      Rejoindre
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-rooms">
                <p>Aucune partie disponible pour le moment.</p>
                <p>Créez une nouvelle partie ou revenez plus tard !</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;