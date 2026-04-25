import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCurrentMember } from './useCurrentMember';
import { useAuth } from './useAuth';

export function useScopedClients() {
  const { user } = useAuth();
  const { data: member, isLoading: memberLoading } = useCurrentMember(user?.id);

  return useQuery({
    queryKey: ['scoped-clients', member?.id, member?.client_scope, member?.role],
    queryFn: async () => {
      if (!member?.practice_id || member.member_type !== 'team') {
        return [];
      }

      const baseSelect = `
        id, name, email, role, practice_id, user_id, member_type,
        client_company, client_owner_id,
        owner:practice_members!client_owner_id(id, name, email)
      `;

      const isOwner = member.role === 'owner' || member.role === 'admin';
      const seesAll = isOwner || member.client_scope === 'all';

      let query = supabase
        .from('practice_members')
        .select(baseSelect)
        .eq('practice_id', member.practice_id)
        .eq('member_type', 'client')
        .order('name', { ascending: true });

      if (!seesAll) {
        query = query.eq('client_owner_id', member.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!member?.id && !memberLoading,
    staleTime: 30_000,
  });
}
