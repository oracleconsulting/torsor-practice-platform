import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { user, clientSession, loading, clientSessionLoading } = useAuth();
  const location = useLocation();

  // Show loading while auth is initializing OR while client session is being fetched
  if (loading || clientSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only show "Access Not Configured" if we're done loading and there's genuinely no client session
  if (!clientSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Access Not Configured
          </h1>
          <p className="text-slate-600 mb-4">
            Your account exists but isn't linked to the client portal yet.
            Please contact your advisor to get set up.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

