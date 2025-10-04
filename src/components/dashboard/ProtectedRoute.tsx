import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPortal?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPortal 
}) => {
  const { user, profile, loading, hasPortalAccess } = useAuth();
  const location = useLocation();

  // Simple loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  // No user - redirect to auth
  if (!user) {
    const authUrl = requiredPortal 
      ? `/auth?portal=${requiredPortal}` 
      : '/auth';
    return <Navigate to={authUrl} state={{ from: location }} replace />;
  }

  // Check portal access if required
  if (requiredPortal && !hasPortalAccess(requiredPortal)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
        <div className="max-w-md w-full bg-white p-8 border-2 border-[#1a2b4a] text-center">
          <h2 className="text-2xl font-black uppercase text-[#ff6b35] mb-4">ACCESS DENIED</h2>
          <p className="text-[#1a2b4a] mb-6">
            You don't have access to the {requiredPortal} portal.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-[#ff6b35] text-white px-4 py-2 font-black uppercase hover:bg-[#e55a2b] transition-colors"
          >
            RETURN TO HOME
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 