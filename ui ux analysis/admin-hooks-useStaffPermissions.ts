import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentMember } from './useCurrentMember';
import { useAuth } from './useAuth';

export interface StaffPermission {
  service_line_code: string;
  can_view: boolean;
  can_run: boolean;
}

export type NavKey =
  | 'client-services'
  | 'goal-alignment'
  | 'bi-portal'
  | 'delivery-teams'
  | 'skills-heatmap'
  | 'skills-management'
  | 'team-analytics'
  | 'cpd-tracker'
  | 'training'
  | 'service-readiness'
  | 'assessments'
  | 'service-config'
  | 'service-line-builder'
  | 'tech-database'
  | 'knowledge-base';

export type SectionKey = NavKey;

export interface UseStaffPermissionsResult {
  permissions: StaffPermission[];
  isOwner: boolean;
  isStaff: boolean;
  clientScope: 'all' | 'assigned_only' | null;
  canView: (serviceLineCode: string) => boolean;
  canRun: (serviceLineCode: string) => boolean;
  canSeeNav: (key: NavKey) => boolean;
  canEditSection: (key: SectionKey) => boolean;
  isLoading: boolean;
}

const OWNER_ONLY_NAV: ReadonlySet<NavKey> = new Set([
  'skills-management',
  'team-analytics',
]);

const VIEW_ONLY_FOR_NON_OWNERS: ReadonlySet<SectionKey> = new Set([
  'service-readiness',
  'assessments',
  'service-config',
  'service-line-builder',
  'tech-database',
  'knowledge-base',
]);

export function useStaffPermissions(): UseStaffPermissionsResult {
  const { user } = useAuth();
  const { data: member, isLoading: memberLoading } = useCurrentMember(user?.id);

  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['staff-permissions', member?.id],
    queryFn: async (): Promise<StaffPermission[]> => {
      if (!member?.id) return [];
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('service_line_code, can_view, can_run')
        .eq('practice_member_id', member.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!member?.id,
    staleTime: 60_000,
  });

  return useMemo(() => {
    const isStaff = member?.member_type === 'team';
    const isOwner = isStaff && (member?.role === 'owner' || member?.role === 'admin');
    const clientScope = (member?.client_scope as 'all' | 'assigned_only' | undefined) ?? null;

    const canView = (code: string): boolean => {
      if (isOwner) return true;
      if (!isStaff) return false;
      return permissions.some((p) => p.service_line_code === code && p.can_view);
    };

    const canRun = (code: string): boolean => {
      if (isOwner) return true;
      if (!isStaff) return false;
      return permissions.some((p) => p.service_line_code === code && p.can_run);
    };

    const canSeeNav = (key: NavKey): boolean => {
      if (isOwner) return true;
      if (OWNER_ONLY_NAV.has(key)) return false;
      return true;
    };

    const canEditSection = (key: SectionKey): boolean => {
      if (isOwner) return true;
      return !VIEW_ONLY_FOR_NON_OWNERS.has(key);
    };

    return {
      permissions,
      isOwner,
      isStaff,
      clientScope,
      canView,
      canRun,
      canSeeNav,
      canEditSection,
      isLoading: memberLoading || permsLoading,
    };
  }, [member, permissions, memberLoading, permsLoading]);
}
