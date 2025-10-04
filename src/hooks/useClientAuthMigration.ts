import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { toast } from 'sonner';
import jwt from 'jsonwebtoken';

interface LegacyClientData {
  id: string;
  name: string;
  email: string;
}

export function useClientAuthMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    const checkAndMigrate = async () => {
      // Skip if already migrated
      const migrated = localStorage.getItem('client_auth_migrated');
      if (migrated === 'true') {
        setMigrationComplete(true);
        return;
      }

      // Check for legacy auth tokens
      const token = localStorage.getItem('client_auth_token');
      const clientDataStr = localStorage.getItem('client_data');

      if (!token || !clientDataStr) {
        setMigrationComplete(true);
        return;
      }

      try {
        setIsMigrating(true);

        // Parse client data
        const clientData: LegacyClientData = JSON.parse(clientDataStr);

        // Validate token
        try {
          const decoded = jwt.decode(token);
          if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
            throw new Error('Invalid token');
          }

          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            throw new Error('Token expired');
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          cleanupLegacyAuth();
          return;
        }

        // Check if user exists in Supabase
        const { data: existingUser } = await supabase
          .from('user_portal_access')
          .select('user_id')
          .eq('portal_id', clientData.id)
          .single();

        if (existingUser) {
          // User already migrated
          cleanupLegacyAuth();
          return;
        }

        // Create invitation for the user
        const { error: inviteError } = await supabase
          .from('client_invitations')
          .insert({
            email: clientData.email,
            client_id: clientData.id,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          });

        if (inviteError) {
          throw inviteError;
        }

        toast.success('Please check your email to complete account migration', {
          duration: 10000
        });

        cleanupLegacyAuth();
      } catch (error) {
        console.error('Migration error:', error);
        toast.error('Failed to migrate account. Please login again.');
        cleanupLegacyAuth();
      } finally {
        setIsMigrating(false);
        setMigrationComplete(true);
      }
    };

    checkAndMigrate();
  }, []);

  const cleanupLegacyAuth = () => {
    localStorage.removeItem('client_auth_token');
    localStorage.removeItem('client_data');
    localStorage.setItem('client_auth_migrated', 'true');
  };

  return {
    isMigrating,
    migrationComplete
  };
} 