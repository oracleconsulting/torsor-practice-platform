import { User as SupabaseUser } from '@supabase/supabase-js';
import { ROLES } from '../constants/roles';

export interface PortalAccess {
  id: string;
  user_id: string;
  portal_id: string;
  practice_id: string | null;
  access_type: 'client' | 'accountant' | 'admin';
  portal_name?: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: keyof typeof ROLES;
  description: string;
  permissions: string[];
}

export interface User extends SupabaseUser {
  roles?: Role[];
  portal_access?: PortalAccess[];
  current_portal_id?: string;
  is_client?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  portalType: 'oracle' | 'accountancy' | 'client' | null;
  hasPortalAccess: (portal: 'oracle' | 'accountancy' | 'client') => boolean;
  portalAccess: PortalAccess[];
  currentPortal: PortalAccess | null;
  switchPortal: (portalId: string) => Promise<void>;
  isClientUser: boolean;
  sessionExpiresAt: Date | null;
  sessionStatus: 'active' | 'expiring' | 'expired';
  timeUntilExpiry: number | null;
  refreshSession: () => Promise<void>;
}

// Keep legacy types for backwards compatibility during migration
export interface ClientSession {
  id: string;
  portalId: string;
  clientEmail: string;
  sessionToken: string;
  isVerified: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface ClientAuthResponse {
  success: boolean;
  message: string;
  token: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TwoFactorRequest {
  email: string;
  portalId: string;
}

export interface TwoFactorVerify {
  email: string;
  portalId: string;
  code: string;
  sessionToken: string;
} 