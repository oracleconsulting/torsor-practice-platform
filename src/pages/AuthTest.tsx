import React from 'react';

export default function AuthTest() {
  console.log('[AuthTest] Component rendering');
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      color: 'black',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ color: 'black', marginBottom: '20px' }}>Auth Test Page</h1>
        <p style={{ color: 'black', marginBottom: '20px' }}>If you can see this, the basic rendering is working.</p>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: 'black', marginBottom: '5px' }}>Email:</label>
          <input 
            type="email" 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: 'black'
            }}
            placeholder="test@example.com"
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: 'black', marginBottom: '5px' }}>Password:</label>
          <input 
            type="password" 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: 'black'
            }}
            placeholder="••••••••"
          />
        </div>
        <button style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          Test Button
        </button>
        <p style={{ color: 'black', marginTop: '20px', fontSize: '12px' }}>
          Debug Info: Component rendered successfully
        </p>
      </div>
    </div>
  );
} 