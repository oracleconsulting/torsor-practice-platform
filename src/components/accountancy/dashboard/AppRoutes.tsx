// src/components/AppRoutes.tsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import your page components
import { AuthPage } from '../pages/AuthPage';
import { SignupPage } from '../pages/SignupPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { ClientPortalAcceptInvite } from '../pages/ClientPortalAcceptInvite';
import { AccountancyRoutes } from '../routes/AccountancyRoutes';
import { ClientPortalRoutes } from '../routes/ClientPortalRoutes';
import { OracleDashboardRoutes } from '../routes/OracleDashboardRoutes';

export const AppRoutes = () => {
  const { user, loading, isInitialized } = useAuth();
  const location = useLocation();
  const [portalType, setPortalType] = useState<string | null>(null);

  useEffect(() => {
    // Determine portal type from URL
    const path = location.pathname;
    if (path.includes('/client-portal/')) {
      setPortalType('client');
    } else if (path.includes('/accountancy/')) {
      setPortalType('accountancy');
    } else if (path.includes('/dashboard')) {
      setPortalType('oracle');
    } else {
      setPortalType(null);
    }

    // Debug logging
    console.log('[AppRoutes] Current path:', path);
    console.log('[AppRoutes] User:', user?.email || 'undefined');
    console.log('[AppRoutes] Portal Type:', portalType);
    console.log('[AppRoutes] User Metadata:', user?.user_metadata);
  }, [location.pathname, user, portalType]);

  // Show loading state while auth is initializing
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Helper function to determine if user should access a route
  const canAccessRoute = (routeType: string): boolean => {
    if (!user) return false;
    
    const metadata = user.user_metadata || {};
    const isClientOnly = metadata.is_client_only === true;
    
    switch (routeType) {
      case 'client':
        // Client routes: accessible by client-only users or accountants managing clients
        return true; // Both client-only users and accountants can access
      
      case 'accountancy':
        // Accountancy routes: only accessible by non-client-only users
        return !isClientOnly;
      
      case 'oracle':
        // Oracle dashboard: only accessible by non-client-only users
        return !isClientOnly;
      
      default:
        return true;
    }
  };

  // Custom route guard component
  const RouteGuard = ({ children, routeType }: { children: React.ReactNode, routeType: string }) => {
    // TEMPORARY: Bypass auth for accountancy portal
    if (routeType === 'accountancy') {
      console.log('[RouteGuard] TEMPORARY: Bypassing auth for accountancy portal');
      return <>{children}</>;
    }
    
    if (!user) {
      // Store the attempted location for redirect after login
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (!canAccessRoute(routeType)) {
      const metadata = user.user_metadata || {};
      const isClientOnly = metadata.is_client_only === true;
      
      if (isClientOnly) {
        const clientId = metadata.client_id || metadata.portal_id;
        if (!clientId) {
          console.error('[RouteGuard] Client user missing client_id');
          return <Navigate to="/auth" replace />;
        }
        return <Navigate to={`/client-portal/${clientId}/dashboard`} replace />;
      } else {
        return <Navigate to="/accountancy/dashboard" replace />;
      }
    }

    return <>{children}</>;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/client-portal/accept-invite" element={<ClientPortalAcceptInvite />} />
      
      {/* TEMPORARY: Direct access to accountancy dashboard */}
      <Route path="/accountancy/dashboard" element={<AccountancyRoutes />} />
      
      {/* Accountancy routes */}
      <Route path="/accountancy/*" element={
        <RouteGuard routeType="accountancy">
          <AccountancyRoutes />
        </RouteGuard>
      } />
      
      {/* Client portal routes */}
      <Route path="/client-portal/:clientId/*" element={
        <RouteGuard routeType="client">
          <ClientPortalRoutes />
        </RouteGuard>
      } />
      
      {/* Oracle dashboard routes */}
      <Route path="/dashboard/*" element={
        <RouteGuard routeType="oracle">
          <OracleDashboardRoutes />
        </RouteGuard>
      } />
      
      {/* Default redirect based on user type */}
      <Route path="/" element={
        user ? (
          user.user_metadata?.is_client_only ? (
            <Navigate to={`/client-portal/${user.user_metadata.client_id || user.user_metadata.portal_id}/dashboard`} replace />
          ) : (
            <Navigate to="/accountancy/dashboard" replace />
          )
        ) : (
          <Navigate to="/auth" replace />
        )
      } />
      
      {/* Catch-all route for 404s */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
            <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
            <a href="/" className="text-purple-500 hover:text-purple-400 underline">
              Go back home
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
};