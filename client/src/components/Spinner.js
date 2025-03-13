// client/src/components/Spinner.js
import React from 'react';
import '../styles/Spinner.css';

const Spinner = ({ size = 'medium', center = false }) => {
  const spinnerClass = `spinner spinner-${size}${center ? ' spinner-center' : ''}`;
  
  return (
    <div className={spinnerClass}>
      <div className="bounce1"></div>
      <div className="bounce2"></div>
      <div className="bounce3"></div>
    </div>
  );
};

export default Spinner;