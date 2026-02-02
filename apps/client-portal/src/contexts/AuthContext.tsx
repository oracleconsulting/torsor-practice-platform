import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ClientSession } from '@torsor/shared';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  clientSession: ClientSession | null;
  loading: boolean;
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
  
  // Track if we've successfully loaded the session to avoid re-querying on token refresh
  const sessionLoadedRef = useRef(false);
  const loadingRef = useRef(false);

  // Load client session data
  const loadClientSession = async (userId: string, force = false): Promise<boolean> => {
    // Skip if already loaded and not forcing refresh
    if (sessionLoadedRef.current && clientSession && !force) {
      console.log('Client session already loaded, skipping query');
      return true;
    }

    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('Already loading client session, skipping');
      return false;
    }

    loadingRef.current = true;
    console.log('Loading client session for user:', userId);

    try {
      console.log('Querying practice_members...');
      
      // Add timeout to prevent infinite hanging
      const queryPromise = supabase
        .from('practice_members')
        .select(`
          id,
          practice_id,
          name,
          email,
          member_type,
          program_status,
          program_enrolled_at,
          client_company,
          assigned_advisor_id
        `)
        .eq('user_id', userId)
        .eq('member_type', 'client')
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('Query result:', { data, error });

      if (error) {
        console.error('Client session query error:', error);
        // Don't clear existing session on error - keep what we have
        if (!clientSession) {
          setClientSession(null);
        }
        return false;
      }

      if (!data) {
        console.log('No client record found for user - they may be a team member');
        setClientSession(null);
        return false;
      }

      console.log('Client data found:', data);

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
        } catch (e) {
          console.log('Could not load advisor data:', e);
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
        
        console.log('Enrolled services:', enrolledServices);
      } catch (e) {
        console.log('Could not load enrolled services:', e);
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

      console.log('Client session set successfully');

      // Update last login (don't await, fire and forget)
      supabase
        .from('practice_members')
        .update({ last_portal_login: new Date().toISOString() })
        .eq('id', data.id)
        .eq('user_id', user.id) // Ensure RLS policy passes
        .then(
          (result) => {
            if (result.error) {
              console.error('Failed to update last login:', result.error);
            } else {
              console.log('Updated last login successfully');
            }
          },
          (err) => console.error('Last login update exception:', err)
        );

      return true;
    } catch (error) {
      console.error('Error loading client session:', error);
      // On timeout, DON'T clear existing session - keep what we have
      if (!clientSession) {
        console.log('No existing session to preserve');
      } else {
        console.log('Preserving existing client session despite error');
      }
      return false;
    } finally {
      loadingRef.current = false;
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
        console.log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Auth error:', error);
          setLoading(false);
          return;
        }

        console.log('Got session:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadClientSession(session.user.id);
        }
        
        if (isMounted) {
          console.log('Init complete, setting loading false');
          setLoading(false);
        }
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
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!isMounted) return;
        
        // Always update the auth session
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only reload client session on actual sign in/out, NOT token refreshes
        if (event === 'SIGNED_IN') {
          // New sign in - need to load client session
          if (session?.user) {
            await loadClientSession(session.user.id);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          // Clear everything on sign out
          setClientSession(null);
          sessionLoadedRef.current = false;
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Don't re-query on token refresh - keep existing session
          console.log('Token refreshed, keeping existing client session');
        } else if (event === 'INITIAL_SESSION') {
          // Skip - handled in initAuth
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
