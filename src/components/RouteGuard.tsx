import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PORTAL_REQUIRED_ROLES, PortalType } from '../constants/roles';
import { LoadingSpinner } from './ui/loading-spinner';

interface RouteGuardProps {
  children: React.ReactNode;
  routeType: PortalType;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, routeType }) => {
  const location = useLocation();
  const { user, userRoles, isInitialized, canAccessPortal } = useAuth();
  
  if (!isInitialized) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/auth" state={{ from: location, portal: routeType }} replace />;
  }

  // Check if user has required role for this portal
  const hasRequiredRole = canAccessPortal(routeType);

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8">
            You don't have access to the {routeType} portal.
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="text-purple-500 hover:text-purple-400 underline"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 