// client/src/components/AlertMessage.js
import React, { useState, useEffect } from 'react';
import '../styles/AlertMessage.css';

const AlertMessage = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">{message}</div>
      <button className="alert-close" onClick={handleClose}>×</button>
    </div>
  );
};

export default AlertMessage;