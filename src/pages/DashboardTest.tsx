import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardTest() {
  const { user, profile, loading } = useAuth();
  
  console.log('[DashboardTest] Component rendering:', {
    user: user?.email,
    profile: profile?.portal_access,
    loading
  });
  
  // Emergency CSS fixes
  React.useEffect(() => {
    // Force body and html to be visible
    document.body.style.overflow = 'visible';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';
    document.documentElement.style.overflow = 'visible';
    document.documentElement.style.height = 'auto';
    document.documentElement.style.minHeight = '100vh';
    
    // Remove any problematic CSS
    document.body.style.display = 'block';
    document.documentElement.style.display = 'block';
    
    console.log('[DashboardTest] Emergency CSS fixes applied');
  }, []);
  
  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1f2937',
        color: 'white',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        zIndex: 9999,
        visibility: 'visible',
        opacity: 1
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #8b5cf6',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading dashboard test...</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>Debug: loading=true</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      data-testid="dashboard-test"
      className="dashboard-test"
      id="dashboard-test"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#f9fafb',
        color: 'black',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        zIndex: 9999,
        visibility: 'visible',
        opacity: 1,
        overflow: 'visible'
      }}
    >
      {/* Sidebar */}
      <div style={{
        width: '320px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '24px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 10000
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #9333ea, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px'
        }}>
          Oracle Method
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
          Good morning, {user?.email?.split('@')[0] || 'User'}
        </p>
        
        <div style={{ marginBottom: '16px' }}>
          <button style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(to right, #9333ea, #ec4899)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Quick Add
          </button>
        </div>
        
        <nav>
          <button style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: '#f3e8ff',
            color: '#9333ea',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '4px'
          }}>
            <span>⚡</span>
            Command Centre
          </button>
          
          <button style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            color: '#6b7280',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '4px'
          }}>
            <span>📄</span>
            Assessments
          </button>
          
          <button style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            color: '#6b7280',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '4px'
          }}>
            <span>🏔️</span>
            My Journey
          </button>
        </nav>
      </div>
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '32px',
        background: 'linear-gradient(to bottom right, #f9fafb, #fdf2f8)',
        position: 'relative',
        zIndex: 10000,
        overflow: 'auto'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '16px'
          }}>
            Dashboard Test Page
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            If you can see this, the basic dashboard layout is working.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f3e8ff',
              borderRadius: '8px',
              border: '1px solid #e9d5ff'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#7c3aed', marginBottom: '8px' }}>
                User Info
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Email: {user?.email || 'Not loaded'}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Portal Access: {profile?.portal_access?.join(', ') || 'None'}
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#ecfdf5',
              borderRadius: '8px',
              border: '1px solid #d1fae5'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#059669', marginBottom: '8px' }}>
                Status
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Auth Loading: {loading ? 'Yes' : 'No'}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                User Loaded: {user ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fde68a'
          }}>
            <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
              <strong>Debug Info:</strong> Dashboard test component rendered successfully
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 