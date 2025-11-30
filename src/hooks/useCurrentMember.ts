import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCurrentMember(userId: string | undefined) {
  return useQuery({
    queryKey: ['current-member', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // First try to find as a team member in practice_members
      const { data: teamMember, error: teamError } = await supabase
        .from('practice_members')
        .select('id, name, email, role, practice_id, user_id, member_type')
        .eq('user_id', userId)
        .eq('member_type', 'team')
        .single();
      
      if (teamMember) {
        console.log('Found team member:', teamMember);
        return teamMember;
      }
      
      // If not found as team, try without member_type filter (backwards compat)
      const { data, error } = await supabase
        .from('practice_members')
        .select('id, name, email, role, practice_id, user_id, member_type')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching current member:', error);
        throw error;
      }
      
      console.log('Found member:', data);
      return data;
    },
    enabled: !!userId,
  });
}

