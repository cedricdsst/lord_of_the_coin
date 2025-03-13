// client/src/pages/Leaderboard.js
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import AlertMessage from '../components/AlertMessage';
import api from '../services/api';
import '../styles/Leaderboard.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await api.get('/games/leaderboard');
        setLeaderboard(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Une erreur est survenue lors de la récupération du classement.');
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);
  
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading-container">
            <Spinner size="large" center />
            <p>Chargement du classement...</p>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="container">
        <div className="leaderboard">
          <h1>Classement des joueurs</h1>
          
          {error && (
            <AlertMessage
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}
          
          <div className="leaderboard-intro">
            <p>Découvrez les 10 meilleurs joueurs de Lord Of The Coin classés par leur meilleur score.</p>
          </div>
          
          <div className="leaderboard-table-container">
            {leaderboard.length > 0 ? (
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Joueur</th>
                    <th>Meilleur Score</th>
                    <th>Parties</th>
                    <th>Victoires</th>
                    <th>Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => (
                    <tr key={player.id} className={index < 3 ? `top-${index + 1}` : ''}>
                      <td className="rank">
                        <div className="rank-number">{index + 1}</div>
                      </td>
                      <td className="player-name">{player.username}</td>
                      <td className="player-score">{player.highestScore}</td>
                      <td>{player.totalGames}</td>
                      <td>{player.wins}</td>
                      <td>{player.winRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>Aucune donnée de classement disponible pour le moment.</p>
                <p>Commencez à jouer pour apparaître dans le classement !</p>
              </div>
            )}
          </div>
          
          <div className="leaderboard-footer">
            <p>Le classement est mis à jour après chaque partie.</p>
            <a href="/dashboard" className="btn btn-primary">Jouer maintenant</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Leaderboard;