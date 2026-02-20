import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface TeamMember {
  id: string;
  practiceId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'advisor' | 'viewer';
  practiceName: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  teamMember: TeamMember | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTeamMember = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('practice_members')
        .select(`
          id,
          practice_id,
          name,
          email,
          role,
          member_type,
          practices:practice_id (name)
        `)
        .eq('user_id', userId)
        .eq('member_type', 'team')
        .maybeSingle();

      if (error || !data) {
        console.log('No team member found for user');
        setTeamMember(null);
        return false;
      }

      setTeamMember({
        id: data.id,
        practiceId: data.practice_id,
        name: data.name,
        email: data.email,
        role: data.role || 'viewer',
        practiceName: (data.practices as any)?.name || 'Practice'
      });

      return true;
    } catch (error) {
      console.error('Error loading team member:', error);
      setTeamMember(null);
      return false;
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

        if (session?.user) {
          await loadTeamMember(session.user.id);
        }
        
        if (isMounted) {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadTeamMember(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setTeamMember(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setTeamMember(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        teamMember,
        loading,
        signIn,
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

