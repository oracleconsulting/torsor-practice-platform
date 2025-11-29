import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [clientSession, setClientSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Load client session data
  const loadClientSession = async (userId: string): Promise<boolean> => {
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
        setClientSession(null);
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

      setClientSession({
        clientId: data.id,
        practiceId: data.practice_id,
        name: data.name,
        email: data.email,
        company: data.client_company,
        status: data.program_status || 'active',
        enrolledAt: data.program_enrolled_at,
        advisor,
      });

      console.log('Client session set successfully');

      // Update last login (don't await, fire and forget)
      supabase
        .from('practice_members')
        .update({ last_portal_login: new Date().toISOString() })
        .eq('id', data.id)
        .then(
          () => console.log('Updated last login'),
          () => {} // Ignore errors
        );

      return true;
    } catch (error) {
      console.error('Error loading client session:', error);
      setClientSession(null);
      return false;
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
        
        // Skip INITIAL_SESSION as we handle that in initAuth
        if (event === 'INITIAL_SESSION') return;
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadClientSession(session.user.id);
        } else {
          setClientSession(null);
        }
        
        setLoading(false);
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

