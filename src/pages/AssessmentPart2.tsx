import React, { useEffect } from 'react';
import { AssessmentPart2Container } from '@/components/dashboard/AssessmentPart2Container';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AssessmentPart2 = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  console.log('[AssessmentPart2] Component rendering:', {
    user: user?.email,
    authLoading,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('[AssessmentPart2] useEffect triggered:', {
      user: user?.email,
      authLoading,
      timestamp: new Date().toISOString()
    });

    // Simple auth check without aggressive body locking
    if (!authLoading && !user) {
      console.log('[AssessmentPart2] No user, redirecting to auth');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    console.log('[AssessmentPart2] Showing loading state');
    return (
      <div style={{ 
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[AssessmentPart2] No user, returning null');
    return null;
  }

  console.log('[AssessmentPart2] Rendering AssessmentPart2Container');
  return <AssessmentPart2Container />;
};

export default AssessmentPart2;