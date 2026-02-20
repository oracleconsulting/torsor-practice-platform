import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PracticeMember } from '../lib/types';

/**
 * Fetches STAFF members only (excludes clients)
 * Use this for internal tools like Skills Heatmap
 */
export function useTeamMembers(practiceId: string | null) {
  return useQuery({
    queryKey: ['team-members', practiceId],
    queryFn: async () => {
      if (!practiceId) return [];
      
      const { data, error } = await supabase
        .from('practice_members')
        .select('id, name, email, role, practice_id, user_id, member_type')
        .eq('practice_id', practiceId)
        .neq('member_type', 'client') // Exclude clients - staff only
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as PracticeMember[];
    },
    enabled: !!practiceId,
  });
}

/**
 * Fetches ALL members including clients
 * Use this when you need to see/manage clients
 */
export function useAllPracticeMembers(practiceId: string | null) {
  return useQuery({
    queryKey: ['all-practice-members', practiceId],
    queryFn: async () => {
      if (!practiceId) return [];
      
      const { data, error } = await supabase
        .from('practice_members')
        .select('id, name, email, role, practice_id, user_id, member_type, client_owner_id, client_company')
        .eq('practice_id', practiceId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as PracticeMember[];
    },
    enabled: !!practiceId,
  });
}

/**
 * Fetches only clients (for client management views)
 */
export function useClientMembers(practiceId: string | null) {
  return useQuery({
    queryKey: ['client-members', practiceId],
    queryFn: async () => {
      if (!practiceId) return [];
      
      const { data, error } = await supabase
        .from('practice_members')
        .select(`
          id, name, email, role, practice_id, user_id, member_type, 
          client_company, client_owner_id,
          owner:practice_members!client_owner_id(id, name, email)
        `)
        .eq('practice_id', practiceId)
        .eq('member_type', 'client')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!practiceId,
  });
}