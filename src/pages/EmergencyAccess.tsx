import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function EmergencyAccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set emergency bypass
    localStorage.setItem('oracle-auth-token', 'temp-admin-bypass');
    localStorage.setItem('oracle-user', JSON.stringify({
      id: 'temp-admin-id',
      email: 'admin@oracle.com',
      user_metadata: {
        portal_type: 'oracle',
        is_client_only: false
      }
    }));

    // Force reload to trigger auth context update
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Emergency Access Activated</h2>
        <p className="text-gray-600">Bypassing authentication...</p>
        <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
      </div>
    </div>
  );
} 