// client/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import AlertMessage from '../components/AlertMessage';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import '../styles/Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les statistiques de l'utilisateur
        const statsResponse = await api.get('/games/stats');
        setStats(statsResponse.data);
        
        // Récupérer l'historique des parties
        const historyResponse = await api.get('/games/history');
        setGameHistory(historyResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Une erreur est survenue lors de la récupération des données.');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Formater la date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Déterminer si l'utilisateur connecté a gagné la partie
  const didUserWin = (game) => {
    if (!user) return false;
    return game.winnerId === user.id;
  };
  
  // Récupérer le score de l'utilisateur dans la partie
  const getUserScore = (game) => {
    if (!user) return 0;
    return game.player1Id === user.id ? game.player1Score : game.player2Score;
  };
  
  // Récupérer le score de l'adversaire dans la partie
  const getOpponentScore = (game) => {
    if (!user) return 0;
    return game.player1Id === user.id ? game.player2Score : game.player1Score;
  };
  
  // Récupérer le nom de l'adversaire
  const getOpponentName = (game) => {
    if (!user) return 'Inconnu';
    return game.player1Id === user.id ? game.player2.username : game.player1.username;
  };
  
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading-container">
            <Spinner size="large" center />
            <p>Chargement de votre profil...</p>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="container">
        <div className="profile">
          <h1>Profil</h1>
          
          {error && (
            <AlertMessage
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}
          
          <div className="profile-content">
            <div className="user-info card">
              <h2>Informations utilisateur</h2>
              <div className="info-item">
                <span className="info-label">Nom d'utilisateur:</span>
                <span className="info-value">{user?.username}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
            </div>
            
            <div className="user-stats card">
              <h2>Statistiques</h2>
              {stats ? (
                <>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-value">{stats.totalGames}</span>
                      <span className="stat-label">Parties jouées</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{stats.wins}</span>
                      <span className="stat-label">Victoires</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{stats.losses}</span>
                      <span className="stat-label">Défaites</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{stats.winRate}%</span>
                      <span className="stat-label">Taux de victoire</span>
                    </div>
                  </div>
                  <div className="high-score">
                    <span className="high-score-label">Meilleur score:</span>
                    <span className="high-score-value">{stats.highestScore}</span>
                  </div>
                </>
              ) : (
                <p>Aucune statistique disponible.</p>
              )}
            </div>
            
            <div className="game-history card">
              <h2>Historique des parties</h2>
              {gameHistory.length > 0 ? (
                <div className="history-list">
                  {gameHistory.map((game) => (
                    <div 
                      key={game.id} 
                      className={`history-item ${didUserWin(game) ? 'win' : game.winnerId ? 'loss' : 'tie'}`}
                    >
                      <div className="history-date">{formatDate(game.createdAt)}</div>
                      <div className="history-result">
                        <span className="result-score">{getUserScore(game)}</span>
                        <span className="result-separator">-</span>
                        <span className="result-score">{getOpponentScore(game)}</span>
                      </div>
                      <div className="history-opponent">
                        vs <strong>{getOpponentName(game)}</strong>
                      </div>
                      <div className="history-status">
                        {didUserWin(game) ? 'Victoire' : game.winnerId ? 'Défaite' : 'Égalité'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-history">Vous n'avez pas encore joué de partie.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;