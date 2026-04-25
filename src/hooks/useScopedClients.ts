import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCurrentMember } from './useCurrentMember';
import { useAuth } from './useAuth';

export function useScopedClients(serviceCode?: string) {
  const { user } = useAuth();
  const { data: member, isLoading: memberLoading } = useCurrentMember(user?.id);

  return useQuery({
    queryKey: ['scoped-clients', member?.id, member?.client_scope, member?.role, serviceCode],
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

      // Resolve effective scope: per-service override > member default
      let effectiveScope: 'all' | 'assigned_only' =
        (member.client_scope as 'all' | 'assigned_only' | undefined) ?? 'assigned_only';
      if (serviceCode && !isOwner) {
        const { data: perm } = await supabase
          .from('staff_permissions')
          .select('client_scope')
          .eq('practice_member_id', member.id)
          .eq('service_line_code', serviceCode)
          .maybeSingle();
        if (perm?.client_scope) {
          effectiveScope = perm.client_scope as 'all' | 'assigned_only';
        }
      }

      const seesAll = isOwner || effectiveScope === 'all';

      if (seesAll) {
        const { data, error } = await supabase
          .from('practice_members')
          .select(baseSelect)
          .eq('practice_id', member.practice_id)
          .eq('member_type', 'client')
          .order('name', { ascending: true });
        if (error) throw error;
        return data ?? [];
      }

      const [ownedRes, assignedRes] = await Promise.all([
        supabase
          .from('practice_members')
          .select(baseSelect)
          .eq('practice_id', member.practice_id)
          .eq('member_type', 'client')
          .eq('client_owner_id', member.id),
        supabase
          .from('client_assignments')
          .select(`
            client_id,
            role_label,
            is_primary,
            client:practice_members!client_id(${baseSelect})
          `)
          .eq('staff_member_id', member.id)
          .eq('practice_id', member.practice_id),
      ]);

      if (ownedRes.error) throw ownedRes.error;
      if (assignedRes.error) throw assignedRes.error;

      const byId = new Map<string, any>();

      (ownedRes.data ?? []).forEach((c: any) => {
        byId.set(c.id, { ...c, _role_label: 'Partner', _is_primary: true });
      });

      (assignedRes.data ?? []).forEach((a: any) => {
        const c = a.client;
        if (!c) return;
        const existing = byId.get(c.id);
        if (existing) {
          existing._role_label = a.role_label ?? existing._role_label;
          existing._is_primary = existing._is_primary || a.is_primary;
        } else {
          byId.set(c.id, {
            ...c,
            _role_label: a.role_label,
            _is_primary: a.is_primary,
          });
        }
      });

      return Array.from(byId.values()).sort((a, b) =>
        (a.name ?? '').localeCompare(b.name ?? '')
      );
    },
    enabled: !!member?.id && !memberLoading,
    staleTime: 30_000,
  });
}
