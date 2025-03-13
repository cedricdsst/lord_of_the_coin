// server/controllers/gameController.js
const { Game, User } = require('../models');
const { Op } = require('sequelize');

// Récupérer l'historique des parties d'un utilisateur
const getUserGameHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const games = await Game.findAll({
      where: {
        [Op.or]: [
          { player1Id: userId },
          { player2Id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'player1',
          attributes: ['username']
        },
        {
          model: User,
          as: 'player2',
          attributes: ['username']
        },
        {
          model: User,
          as: 'winner',
          attributes: ['username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(games);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des parties:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique des parties' });
  }
};

// Récupérer les statistiques d'un utilisateur
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'totalGames', 'wins', 'losses', 'highestScore']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({
      username: user.username,
      totalGames: user.totalGames,
      wins: user.wins,
      losses: user.losses,
      winRate: user.totalGames > 0 ? (user.wins / user.totalGames * 100).toFixed(2) : 0,
      highestScore: user.highestScore
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};

// Récupérer le leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.findAll({
      attributes: ['id', 'username', 'wins', 'totalGames', 'highestScore'],
      order: [['highestScore', 'DESC']],
      limit: 10
    });
    
    const formattedLeaderboard = leaderboard.map(user => ({
      id: user.id,
      username: user.username,
      wins: user.wins,
      totalGames: user.totalGames,
      winRate: user.totalGames > 0 ? (user.wins / user.totalGames * 100).toFixed(2) : 0,
      highestScore: user.highestScore
    }));
    
    res.json(formattedLeaderboard);
  } catch (error) {
    console.error('Erreur lors de la récupération du leaderboard:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du leaderboard' });
  }
};

module.exports = {
  getUserGameHistory,
  getUserStats,
  getLeaderboard
};