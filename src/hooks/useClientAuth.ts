import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalApi } from '../services/clientPortalApi';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase/client';

interface ClientSession {
  id: string;
  portalId: string;
  clientEmail: string;
  sessionToken: string;
  isVerified: boolean;
  expiresAt: string;
  createdAt: string;
}

export const useClientAuth = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<any>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check Supabase auth session first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user is a client
      if (!user.user_metadata?.is_client) {
        setLoading(false);
        return;
      }

      // Get stored session
      const storedSession = localStorage.getItem('clientPortalSession');
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        const now = new Date();
        const expiresAt = new Date(parsedSession.expiresAt);
        
        if (now < expiresAt) {
          setSession(parsedSession);
          
          // Try to get client info but don't fail if the endpoint doesn't exist
          try {
            if (clientPortalApi.getClientInfo) {
              const info = await clientPortalApi.getClientInfo();
              setClientInfo(info);
            }
          } catch (error) {
            console.log('Client info endpoint not available');
          }
        } else {
          localStorage.removeItem('clientPortalSession');
        }
      } else {
        // Create a new session for authenticated clients
        const clientId = user.user_metadata.client_id || user.user_metadata.portal_id;
        const newSession: ClientSession = {
          id: `session_${Date.now()}`,
          portalId: clientId,
          clientEmail: user.email || '',
          sessionToken: (await supabase.auth.getSession()).data.session?.access_token || '',
          isVerified: true, // Skip 2FA for now since it's not set up
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('clientPortalSession', JSON.stringify(newSession));
        setSession(newSession);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (portalId: string, email: string, password: string) => {
    try {
      setLoading(true);
      
      // Use Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Create session
      const newSession: ClientSession = {
        id: `session_${Date.now()}`,
        portalId,
        clientEmail: email,
        sessionToken: data.session?.access_token || '',
        isVerified: false, // Will need 2FA if enabled
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('clientPortalSession', JSON.stringify(newSession));
      setSession(newSession);
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid credentials');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const requestTwoFactorCode = async () => {
    if (!session) return { success: false };
    
    try {
      // For now, skip 2FA since it's not set up
      console.log('2FA not configured, skipping...');
      
      // Mark session as verified
      const updatedSession = { ...session, isVerified: true };
      localStorage.setItem('clientPortalSession', JSON.stringify(updatedSession));
      setSession(updatedSession);
      
      return { success: true };
    } catch (error: any) {
      console.error('2FA request error:', error);
      return { success: false, error: error.message };
    }
  };

  const verifyTwoFactorCode = async (code: string) => {
    if (!session) return { success: false };
    
    try {
      // For now, accept any code since 2FA is not set up
      console.log('2FA not configured, accepting any code...');
      
      const updatedSession = { ...session, isVerified: true };
      localStorage.setItem('clientPortalSession', JSON.stringify(updatedSession));
      setSession(updatedSession);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast.error('Invalid code');
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('clientPortalSession');
      setSession(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    session,
    loading,
    isAuthenticated: !!session,
    isTwoFactorVerified: session?.isVerified || false,
    clientInfo,
    login,
    logout,
    requestTwoFactorCode,
    verifyTwoFactorCode
  };
};