import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading, isInitialized, hasPortalAccess } = useAuth();
  const location = useLocation();

  // Emergency bypass - allow authenticated users to dashboard
  if (user && location.pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // Show loading state while auth is initializing
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check for required roles
  const userRoles = user.roles?.map(r => r.name) || [];
  const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

  // For dashboard access, be more permissive
  if (location.pathname.startsWith('/dashboard')) {
    // Allow access if user has oracle portal access
    const hasOracleAccess = hasPortalAccess('oracle');
    if (user && hasOracleAccess) {
      return <>{children}</>;
    }
  }

  // For client portal access, check specific permissions
  if (location.pathname.startsWith('/client-portal')) {
    const hasClientAccess = hasPortalAccess('client');
    if (user && hasClientAccess) {
      return <>{children}</>;
    }
  }

  // For accountancy portal access, check specific permissions
  if (location.pathname.startsWith('/accountancy')) {
    const hasAccountancyAccess = hasPortalAccess('accountancy');
    if (user && hasAccountancyAccess) {
      return <>{children}</>;
    }
  }

  // If user has any portal access but not the required role, send to portal select
  if (user.portal_access?.length > 0) {
    return <Navigate to="/portal-select" replace />;
  }

  // If no access at all, send to auth
  return <Navigate to="/auth" replace />;
}; 