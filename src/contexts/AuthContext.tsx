import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  portal_access?: string[];
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  uid: string | null;
  userId: string | null;
  signUp: (email: string, password: string, portal?: 'oracle' | 'accountancy' | 'client') => Promise<any>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: null | Error }>;
  signOut: () => Promise<void>;
  hasPortalAccess: (portal: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setInitialized] = useState(false);
  const navigate = useNavigate();

  // EMERGENCY BYPASS - Only use when explicitly enabled
  const createMockSession = () => {
    console.log('[Auth] Creating emergency mock session');
    
    // Check if there's a custom UUID in localStorage
    const customUUID = localStorage.getItem('custom-user-uuid');
    const customEmail = localStorage.getItem('custom-user-email') || 'admin@oracle.com';
    
    const mockUser = {
      id: customUUID || 'fe05560d-63d7-429d-88dc-1415b61eed2c',
      email: customEmail,
      user_metadata: {
        portal_type: 'oracle',
        is_client_only: false
      }
    };
    const mockProfile = {
      portal_access: ['oracle', 'accountancy'],
      is_admin: true
    };
    setUser(mockUser as any);
    // Persist visible identity so header shows correct identity
    localStorage.setItem('oracle_visible_email', mockUser.email);
    localStorage.setItem('oracle_visible_uid', mockUser.id);
    setProfile(mockProfile);
    setLoading(false);
    setInitialized(true);
  };

  // Single source of truth for profile loading
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('portal_access, is_admin')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create profile with default access
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: user?.email,
            portal_access: ['oracle'], // Default access
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        return newProfile;
      }
      
      return data;
    } catch (error) {
      console.error('[Auth] Error loading profile:', error);
      // TEMPORARY FIX: Return default profile if loading fails
      console.log('[Auth] Returning default profile due to loading error');
      return {
        portal_access: ['oracle'],
        is_admin: false
      };
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check for emergency bypass token ONLY if explicitly set
        const emergencyBypass = localStorage.getItem('oracle-auth-token');
        if (emergencyBypass === 'temp-admin-bypass') {
          console.log('[Auth] Emergency bypass detected, creating mock session');
          createMockSession();
          return;
        }

        // Clear any old conflicting tokens
        localStorage.removeItem('oracle-auth-token');
        localStorage.removeItem('custom-user-uuid');
        localStorage.removeItem('custom-user-email');

        // Add a small delay to ensure Supabase is ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('[Auth] Checking for real Supabase session...');
        
        // Try to get the current user first
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('[Auth] User error:', userError);
        }
        
        // Then get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
        }
        
        console.log('[Auth] Session check results:', {
          hasUser: !!user,
          hasSession: !!session,
          userEmail: user?.email,
          sessionUserEmail: session?.user?.email
        });
        
        if (mounted && (session?.user || user)) {
          const authUser = session?.user || user;
          console.log('[Auth] Real user session found:', authUser.email);
          setUser(authUser);
          const profile = await loadUserProfile(authUser.id);
          if (mounted) setProfile(profile);
        } else {
          console.log('[Auth] No valid session found - redirecting to login');
          // No demo mode - require real authentication
          if (mounted) {
            setUser(null);
            setProfile(null);
          }
        }
        setInitialized(true);
      } catch (error) {
        console.error('[Auth] Init error:', error);
        if (mounted) {
          setInitialized(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[Auth] Auth state change:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Auth] User signed in successfully');
          setUser(session.user);
          const profile = await loadUserProfile(session.user.id);
          setProfile(profile);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out');
          setUser(null);
          setProfile(null);
          setLoading(false);
          navigate('/auth');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('[Auth] Token refreshed');
          setUser(session.user);
        } else if (session?.user) {
          // Handle other events with valid session
          setUser(session.user);
          const profile = await loadUserProfile(session.user.id);
          setProfile(profile);
        } else {
          // No session
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Set up session refresh
  useEffect(() => {
    if (user) {
      const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
      const refreshInterval = setInterval(async () => {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('[Auth] Session refresh failed:', error);
          // If refresh fails, sign out
          await signOut();
        }
      }, REFRESH_INTERVAL);

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  const signUp = async (email: string, password: string, portal: 'oracle' | 'accountancy' | 'client' = 'oracle') => {
    try {
      console.log('[Auth] Signing up user for portal:', portal);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            portal_type: portal // Store portal type in user metadata
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile with correct portal access
        console.log('[Auth] Creating profile for new user with portal:', portal);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            portal_access: [portal], // Set portal access based on signup source
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error('[Auth] Error creating profile:', profileError);
          // Don't throw here - user is created, just log the error
        } else {
          console.log('[Auth] Profile created successfully with portal:', portal);
        }
        
        toast.success('Account created! Please check your email to verify.');
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('[Auth] Signup error:', error);
      toast.error(error.message);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        return { error: error.message };
      }

      console.log('[Auth] Sign in successful:', data.user?.email);
      console.log('[Auth] Session created:', !!data.session);
      
      // Immediately set the user and profile
      if (data.user) {
        setUser(data.user);
        const profile = await loadUserProfile(data.user.id);
        setProfile(profile);
        setLoading(false);
        console.log('[Auth] User and profile set after login');
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('[Auth] Sign in exception:', error);
      return { error: error.message };
    }
  };

  const signOut = async () => {
    try {
      // Clear mock session
      setUser(null);
      setProfile(null);
      setLoading(false);
      setInitialized(false);
      
      // Clear any stored data
      localStorage.removeItem('oracle-auth-token');
      localStorage.clear();
      
      console.log('[Auth] Mock session cleared');
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      throw error;
    }
  };

  const hasPortalAccess = (portal: string): boolean => {
    if (!profile) return false;
    
    // Use the profiles.portal_access column as the single source of truth
    const portalAccess = profile.portal_access || [];
    const hasAccess = portalAccess.includes(portal);
    
    console.log(`[Auth] Checking portal access for '${portal}':`, {
      user: user?.email,
      portalAccess,
      hasAccess
    });
    
    return hasAccess;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, uid: user?.id, userId: user?.id, signUp, signIn, signOut, hasPortalAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};