import { supabase } from '../lib/supabase/client';
import { User } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

// Cache TTL in milliseconds (5 minutes)
const ROLE_CACHE_TTL = 5 * 60 * 1000;

// Role cache structure
interface RoleCache {
  roles: string[];
  timestamp: number;
}

// Role cache storage
const roleCache = new Map<string, RoleCache>();

export interface UserRole {
  id: string;
  email: string;
  roles: string[];
  is_super_admin: boolean;
  permissions: string[];
}

export class AuthService {
  /**
   * Check if a user has super admin privileges
   */
  static async checkSuperAdmin(email: string): Promise<boolean> {
    try {
      // Check cache first
      const cached = roleCache.get(email);
      if (cached && Date.now() - cached.timestamp < ROLE_CACHE_TTL) {
        return cached.roles.includes('super_admin');
      }

      // Query database
      const { data, error } = await supabase
        .from('admin_users')
        .select('is_super_admin')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      // Update cache
      roleCache.set(email, {
        roles: data?.is_super_admin ? ['super_admin'] : [],
        timestamp: Date.now()
      });

      return data?.is_super_admin || false;
    } catch (error) {
      console.error('Error in checkSuperAdmin:', error);
      return false;
    }
  }

  /**
   * Get all roles for a user
   */
  static async getUserRoles(email: string): Promise<UserRole | null> {
    try {
      // Check cache first
      const cached = roleCache.get(email);
      if (cached && Date.now() - cached.timestamp < ROLE_CACHE_TTL) {
        const { data: userData } = await supabase
          .from('admin_users')
          .select('id, email, permissions')
          .eq('email', email)
          .single();

        if (userData) {
          let permissions: string[] = [];
          if (userData.permissions) {
            if (Array.isArray(userData.permissions)) {
              permissions = userData.permissions;
            } else if (typeof userData.permissions === 'object') {
              permissions = Object.keys(userData.permissions).filter(key => userData.permissions[key]);
            } else if (typeof userData.permissions === 'string') {
              try {
                const parsed = JSON.parse(userData.permissions);
                if (Array.isArray(parsed)) {
                  permissions = parsed;
                } else if (typeof parsed === 'object') {
                  permissions = Object.keys(parsed).filter(key => parsed[key]);
                }
              } catch (e) {
                permissions = [userData.permissions];
              }
            }
          }
          
          return {
            ...userData,
            roles: cached.roles,
            is_super_admin: cached.roles.includes('super_admin'),
            permissions
          };
        }
      }

      // Query database
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, is_super_admin, permissions')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error fetching user roles:', error);
        return null;
      }

      // Determine roles
      const roles = [];
      if (data.is_super_admin) roles.push('super_admin');
      
      // Handle permissions safely - could be array, object, or string
      let permissions: string[] = [];
      if (data.permissions) {
        if (Array.isArray(data.permissions)) {
          permissions = data.permissions;
        } else if (typeof data.permissions === 'object') {
          // If it's an object, extract keys where value is true
          permissions = Object.keys(data.permissions).filter(key => data.permissions[key]);
        } else if (typeof data.permissions === 'string') {
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(data.permissions);
            if (Array.isArray(parsed)) {
              permissions = parsed;
            } else if (typeof parsed === 'object') {
              permissions = Object.keys(parsed).filter(key => parsed[key]);
            }
          } catch (e) {
            // If not JSON, treat as single permission
            permissions = [data.permissions];
          }
        }
      }
      
      // Check permissions using the normalized array
      if (permissions.includes('manage_practice')) roles.push('practice_admin');
      if (permissions.includes('manage_clients')) roles.push('client_manager');

      // Update cache
      roleCache.set(email, {
        roles,
        timestamp: Date.now()
      });

      return {
        ...data,
        roles,
        permissions
      };
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      return null;
    }
  }

  /**
   * Check if a user has a specific role
   */
  static async hasRole(email: string, role: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(email);
    return userRoles?.roles.includes(role) || false;
  }

  /**
   * Check if a user has a specific permission
   */
  static async hasPermission(email: string, permission: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(email);
    return userRoles?.permissions.includes(permission) || false;
  }

  /**
   * Clear role cache for a user
   */
  static clearRoleCache(email: string): void {
    roleCache.delete(email);
  }

  /**
   * Clear entire role cache
   */
  static clearAllRoleCache(): void {
    roleCache.clear();
  }

  /**
   * Get portal access for a user
   */
  static async getPortalAccess(email: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_portal_access')
        .select('portal_type')
        .eq('email', email);

      if (error) {
        console.error('Error fetching portal access:', error);
        return [];
      }

      return data.map(access => access.portal_type);
    } catch (error) {
      console.error('Error in getPortalAccess:', error);
      return [];
    }
  }

  /**
   * Check if a user has access to a specific portal
   */
  static async hasPortalAccess(email: string, portalType: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_portal_access')
        .select('portal_type')
        .eq('email', email)
        .eq('portal_type', portalType)
        .single();

      if (error) {
        console.error('Error checking portal access:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasPortalAccess:', error);
      return false;
    }
  }
}

interface SessionHealth {
  isHealthy: boolean;
  expiresAt: Date | null;
  needsRefresh: boolean;
}

export const authService = {
  /**
   * Check the health of the current session
   */
  checkSessionHealth: async (): Promise<SessionHealth> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          isHealthy: false,
          expiresAt: null,
          needsRefresh: false
        };
      }

      const expiresAt = authService.getSessionExpiry(session);
      const now = new Date();
      const timeUntilExpiry = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / 1000) : 0;
      const needsRefresh = timeUntilExpiry < 600; // 10 minutes

      return {
        isHealthy: timeUntilExpiry > 0,
        expiresAt,
        needsRefresh
      };
    } catch (error) {
      console.error('Error checking session health:', error);
      return {
        isHealthy: false,
        expiresAt: null,
        needsRefresh: false
      };
    }
  },

  /**
   * Force a token refresh
   */
  forceTokenRefresh: async (): Promise<Session | null> => {
    try {
      console.log('Attempting to refresh session token...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }

      console.log('Session refreshed successfully');
      return session;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  },

  /**
   * Get session expiry date
   */
  getSessionExpiry: (session: Session | null): Date | null => {
    if (!session?.expires_at) {
      return null;
    }
    return new Date(session.expires_at);
  },

  /**
   * Handle session errors
   */
  handleSessionError: (error: any): string => {
    console.error('Session error:', error);

    // Network errors
    if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
      return 'Network error. Please check your connection.';
    }

    // Auth errors
    if (error.message?.includes('token') || error.message?.includes('session')) {
      return 'Authentication error. Please sign in again.';
    }

    // Default error
    return 'An error occurred. Please try again.';
  }
}; 