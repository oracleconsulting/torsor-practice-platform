import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const DebugRouter: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  console.log('Current location:', location);
  console.log('Available navigation:', navigate);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>Current Path: {location.pathname}</div>
      <div>Search: {location.search}</div>
      <div>Hash: {location.hash}</div>
    </div>
  );
};
