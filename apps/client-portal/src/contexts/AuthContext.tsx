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
  const loadClientSession = async (userId: string) => {
    console.log('Loading client session for user:', userId);
    try {
      const { data, error } = await supabase
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
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no record

      if (error) {
        console.error('Client session query error:', error);
        setClientSession(null);
        return;
      }

      if (!data) {
        console.log('No client record found for user - they may be a team member');
        setClientSession(null);
        return;
      }

      console.log('Client data found:', data);

      // Get advisor data if assigned
      let advisor = null;
      if (data.assigned_advisor_id) {
        const { data: advisorData } = await supabase
          .from('practice_members')
          .select('id, name, email')
          .eq('id', data.assigned_advisor_id)
          .maybeSingle();
        advisor = advisorData;
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

      // Update last login (don't await, fire and forget)
      supabase
        .from('practice_members')
        .update({ last_portal_login: new Date().toISOString() })
        .eq('id', data.id)
        .then(() => console.log('Updated last login'));

    } catch (error) {
      console.error('Error loading client session:', error);
      setClientSession(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initialLoadDone = false;

    // Listen for auth changes (this handles both initial load and subsequent changes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            await loadClientSession(session.user.id);
          } catch (error) {
            console.error('Error loading client session:', error);
            setClientSession(null);
          }
        } else {
          setClientSession(null);
        }
        
        // Only set loading false after first load
        if (!initialLoadDone) {
          initialLoadDone = true;
          setLoading(false);
        }
      }
    );

    // Also check initial session (backup in case onAuthStateChange doesn't fire)
    const timeout = setTimeout(() => {
      if (!initialLoadDone && isMounted) {
        console.log('Auth timeout - setting loading false');
        setLoading(false);
        initialLoadDone = true;
      }
    }, 3000); // 3 second timeout as backup

    return () => {
      isMounted = false;
      clearTimeout(timeout);
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

