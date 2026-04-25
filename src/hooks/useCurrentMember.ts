import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface CurrentMember {
  id: string;
  name: string;
  email: string;
  role: string;
  practice_id: string;
  user_id: string | null;
  member_type: 'team' | 'client';
  client_scope?: 'all' | 'assigned_only';
}

export function useCurrentMember(userId: string | undefined) {
  return useQuery({
    queryKey: ['current-member', userId],
    queryFn: async (): Promise<CurrentMember | null> => {
      if (!userId) return null;

      const { data: teamMember, error: teamErr } = await supabase
        .from('practice_members')
        .select('id, name, email, role, practice_id, user_id, member_type, client_scope')
        .eq('user_id', userId)
        .eq('member_type', 'team')
        .maybeSingle();

      if (teamErr) throw teamErr;
      if (teamMember) return teamMember as CurrentMember;

      const { data: clientMember, error: clientErr } = await supabase
        .from('practice_members')
        .select('id, name, email, role, practice_id, user_id, member_type, client_scope')
        .eq('user_id', userId)
        .eq('member_type', 'client')
        .maybeSingle();

      if (clientErr) throw clientErr;
      return (clientMember as CurrentMember) ?? null;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}
