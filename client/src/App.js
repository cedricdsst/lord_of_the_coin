// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import useAuth from './hooks/useAuth';

// Pages (à créer plus tard)
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import GameRoom from './pages/GameRoom';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import NotFound from './pages/NotFound';

// Route protégée qui vérifie l'authentification
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Chargement...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const EmailVerifiedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Chargement...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!user.isEmailConfirmed) {
    return <Navigate to="/verify-email-pending" />;
  }
  
  return children;
};

// Composant App avec le router
const AppContent = () => {
  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Leaderboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email-pending" element={<div>Vérifiez votre email pour continuer</div>} />
        
        {/* Routes protégées */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/room/:roomId" 
          element={
            <EmailVerifiedRoute>
              <GameRoom />
            </EmailVerifiedRoute>
          } 
        />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;