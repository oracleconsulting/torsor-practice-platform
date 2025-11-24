import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PracticeMember } from '../lib/types';

export function useTeamMembers(practiceId: string | null) {
  return useQuery({
    queryKey: ['team-members', practiceId],
    queryFn: async () => {
      if (!practiceId) return [];
      
      const { data, error } = await supabase
        .from('practice_members')
        .select('id, name, email, role, practice_id, user_id')
        .eq('practice_id', practiceId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as PracticeMember[];
    },
    enabled: !!practiceId,
  });
}

