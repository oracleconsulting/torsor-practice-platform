import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCurrentMember(userId: string | undefined) {
  return useQuery({
    queryKey: ['current-member', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('practice_members')
        .select('id, name, email, role, practice_id, user_id')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

