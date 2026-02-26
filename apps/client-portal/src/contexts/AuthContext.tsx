import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ClientSession } from '@torsor/shared';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  clientSession: ClientSession | null;
  loading: boolean;
  clientSessionLoading: boolean; // True while fetching client session from DB
  signIn: (email: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshClientSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [clientSession, setClientSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSessionLoading, setClientSessionLoading] = useState(false);
  
  // Track if we've successfully loaded the session to avoid re-querying on token refresh
  const sessionLoadedRef = useRef(false);
  const loadingRef = useRef(false);

  // Load client session data
  const loadClientSession = async (userId: string, force = false): Promise<boolean> => {
    if (!userId) return false;

    // Verify we have an active session before querying (avoids RLS timeout when auth not ready)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return false;
    }

    // Skip if already loaded and not forcing refresh
    if (sessionLoadedRef.current && clientSession && !force) {
      return true;
    }

    // Prevent concurrent loads
    if (loadingRef.current) {
      return false;
    }

    loadingRef.current = true;
    setClientSessionLoading(true);

    try {
      const { data, error } = await supabase
        .from('practice_members')
        .select('id, practice_id, name, email, member_type, program_status, program_enrolled_at, client_company, assigned_advisor_id')
        .eq('user_id', userId)
        .eq('member_type', 'client')
        .maybeSingle();

      if (error) {
        console.error('Client session query error:', error);
        if (!clientSession) setClientSession(null);
        return false;
      }

      if (!data) {
        setClientSession(null);
        return false;
      }

      // Get advisor data if assigned (don't block on this)
      let advisor = null;
      if (data.assigned_advisor_id) {
        try {
          const { data: advisorData } = await supabase
            .from('practice_members')
            .select('id, name, email')
            .eq('id', data.assigned_advisor_id)
            .maybeSingle();
          advisor = advisorData;
        } catch {
          // ignore
        }
      }

      // Get enrolled services for this client
      let enrolledServices: string[] = [];
      try {
        const { data: enrollments } = await supabase
          .from('client_service_lines')
          .select('service_line:service_lines(code)')
          .eq('client_id', data.id)
          .neq('status', 'cancelled');
        
        enrolledServices = (enrollments || [])
          .filter((e: any) => e.service_line?.code)
          .map((e: any) => e.service_line.code);
      } catch {
        // ignore
      }

      const newSession: ClientSession = {
        clientId: data.id,
        practiceId: data.practice_id,
        name: data.name,
        email: data.email,
        company: data.client_company,
        status: data.program_status || 'active',
        enrolledAt: data.program_enrolled_at,
        advisor,
        enrolledServices, // Add enrolled services to session
      };

      setClientSession(newSession);
      sessionLoadedRef.current = true;

      // Update last login (don't await, fire and forget)
      // REVERT: Original working code only used .eq('id', data.id)
      // The RLS policy handles user_id check automatically via auth.uid()
      supabase
        .from('practice_members')
        .update({ last_portal_login: new Date().toISOString() })
        .eq('id', data.id)
        .then((result) => { if (result.error) console.error('Failed to update last login:', result.error); }, () => {});

      return true;
    } catch (error) {
      console.error('Error loading client session:', error);
      if (!clientSession) setClientSession(null);
      return false;
    } finally {
      loadingRef.current = false;
      setClientSessionLoading(false);
    }
  };

  // Manual refresh function
  const refreshClientSession = async () => {
    if (user) {
      await loadClientSession(user.id, true);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error) {
          console.error('Auth error:', error);
          setLoading(false);
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user?.id) {
          await loadClientSession(session.user.id);
        }
        if (isMounted) setLoading(false);
      } catch (error) {
        console.error('Init auth error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for subsequent auth changes (sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user?.id) {
          await loadClientSession(session.user.id);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setClientSession(null);
          sessionLoadedRef.current = false;
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Magic link sign in
  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Password sign in
  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setClientSession(null);
    sessionLoadedRef.current = false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        clientSession,
        loading,
        clientSessionLoading,
        signIn,
        signInWithPassword,
        signOut,
        refreshClientSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
