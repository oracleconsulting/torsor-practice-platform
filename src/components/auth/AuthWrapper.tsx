import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Check if user is a client and redirect appropriately
    const checkUserType = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const metadata = user.user_metadata || {};
        
        // Check if user is CLIENT-ONLY (not just has client access)
        if (metadata.is_client_only === true) {
          const clientId = metadata.client_id || metadata.portal_id;
          
          // List of accountant-only paths
          const accountantPaths = [
            '/dashboard',
            '/accountancy/dashboard',
            '/accountancy/clients',
            '/accountancy/settings',
            '/accountancy/pricing',
            '/accountancy/cyber-security',
            '/accountancy/team-wellness',
            '/accountancy/esg-reporting',
            '/accountancy/continuity-planning',
            '/accountancy/mtd-capacity',
            '/accountancy/alternate-auditor',
            '/accountancy/consulting-ai',
            '/assessment',
            '/admin',
            '/superadmin',
            '/super-admin'
          ];
          
          // If client is trying to access accountant areas, redirect to client portal
          if (accountantPaths.some(path => location.pathname.startsWith(path))) {
            navigate(`/client-portal/${clientId}/dashboard`, { replace: true });
          }
        }
        // Remove the else clause that was redirecting accountants
        // Accountants should be able to access both accountancy dashboard and client portals
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkUserType();
      }
    });

    // Check on mount
    checkUserType();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}