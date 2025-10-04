import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/authService';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackPath = '/auth'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.email) {
        setHasAccess(false);
        return;
      }

      try {
        // Check roles if required
        if (requiredRoles.length > 0) {
          const userRoles = await AuthService.getUserRoles(user.email);
          if (!userRoles || !requiredRoles.some(role => userRoles.roles.includes(role))) {
            setHasAccess(false);
            return;
          }
        }

        // Check permissions if required
        if (requiredPermissions.length > 0) {
          const hasAllPermissions = await Promise.all(
            requiredPermissions.map(permission => 
              AuthService.hasPermission(user.email!, permission)
            )
          );

          if (!hasAllPermissions.every(Boolean)) {
            setHasAccess(false);
            return;
          }
        }

        setHasAccess(true);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      }
    };

    if (user) {
      checkAccess();
    }
  }, [user, requiredRoles, requiredPermissions]);

  // Show loading state
  if (loading || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // No access
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-6">
            You don't have the required permissions to access this area.
            {requiredRoles.length > 0 && (
              <span className="block mt-2">
                Required roles: {requiredRoles.join(', ')}
              </span>
            )}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Has access
  return <>{children}</>;
}; 