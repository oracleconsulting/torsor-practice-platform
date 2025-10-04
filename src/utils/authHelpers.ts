import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export const checkUserPortalAccess = async (email: string) => {
  // Check if user exists in client_portal_auth
  const { data: clientPortalUser } = await supabase
    .from('client_portal_auth')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  // Check if user exists in Supabase auth
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  const authUser = users?.find(u => u.email === email);
  
  return {
    hasClientPortalAccess: !!clientPortalUser,
    hasOracleAccess: !!authUser && !authUser.user_metadata?.is_client_only,
    hasAccountancyAccess: !!authUser && authUser.user_metadata?.portal_type === 'accountancy'
  };
};

export const getPortalTypeForUser = (user: any) => {
  if (user.user_metadata?.is_client_only) return 'client';
  if (user.user_metadata?.portal_type) return user.user_metadata.portal_type;
  
  // Check localStorage/sessionStorage
  const storedType = localStorage.getItem('portalType') || sessionStorage.getItem('portalType');
  return storedType || 'oracle';
};

export const ensureGroupId = async (email: string, userId?: string): Promise<string | null> => {
  // If we have a userId, use it as the primary identifier
  if (userId) {
    // Check if user has a group_id in client_intake
    const { data: intakeData } = await supabase
      .from('client_intake')
      .select('group_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (intakeData?.group_id) {
      return intakeData.group_id;
    }
    
    // If no group_id exists, create a new intake record with user_id
    const newGroupId = crypto.randomUUID();
    const { error } = await supabase
      .from('client_intake')
      .insert({
        user_id: userId,
        email: email,
        group_id: newGroupId,
        responses: {},
        fit_message: null
      });
    
    if (error) {
      console.error('Error creating intake record:', error);
      return null;
    }
    
    return newGroupId;
  }
  
  // Fallback to email-based lookup (for backward compatibility)
  const { data: intakeData } = await supabase
    .from('client_intake')
    .select('group_id')
    .eq('email', email)
    .maybeSingle();
  
  if (intakeData?.group_id) {
    return intakeData.group_id;
  }
  
  // If no group_id exists, create a new intake record
  const newGroupId = crypto.randomUUID();
  const { error } = await supabase
    .from('client_intake')
    .insert({
      email: email,
      group_id: newGroupId,
      responses: {},
      fit_message: null
    });
  
  if (error) {
    console.error('Error creating intake record:', error);
    return null;
  }
  
  return newGroupId;
};

/**
 * Check if a user has access to a specific portal
 */
export function canAccessPortal(user: User | null, portal: 'oracle' | 'accountancy' | 'client'): boolean {
  if (!user) return false;
  
  const isClientOnly = user.user_metadata?.is_client_only;
  
  switch (portal) {
    case 'oracle':
      // Oracle portal is accessible to all non-client-only users
      return !isClientOnly;
      
    case 'accountancy':
      // Accountancy portal is accessible to non-client-only users
      // Additional checks for accountancy_users table would be done separately
      return !isClientOnly;
      
    case 'client':
      // Client portal is only for client users
      return isClientOnly === true;
      
    default:
      return false;
  }
}

/**
 * Get the default portal for a user
 */
export function getDefaultPortal(user: User | null): 'oracle' | 'accountancy' | 'client' | null {
  if (!user) return null;
  
  const isClientOnly = user.user_metadata?.is_client_only;
  
  if (isClientOnly) {
    return 'client';
  }
  
  // For non-client users, default to Oracle portal
  return 'oracle';
}

/**
 * Clear all portal-related storage
 */
export function clearPortalStorage(): void {
  localStorage.removeItem('portalType');
  localStorage.removeItem('selectedPortal');
  sessionStorage.removeItem('portalType');
}

/**
 * Set portal type in storage
 */
export function setPortalType(portal: 'oracle' | 'accountancy' | 'client'): void {
  localStorage.setItem('portalType', portal);
  localStorage.setItem('selectedPortal', portal);
  sessionStorage.setItem('portalType', portal);
} 