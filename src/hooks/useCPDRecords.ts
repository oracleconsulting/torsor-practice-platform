// ============================================================================
// CPD RECORDS & TARGETS HOOKS
// ============================================================================
// React Query hooks for cpd_records and cpd_targets (Phase 1C).
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CPDRecord, CPDTarget } from '../lib/types';

export function useCPDRecords(practiceId: string | null, year?: number) {
  return useQuery({
    queryKey: ['cpd-records', practiceId, year],
    queryFn: async (): Promise<CPDRecord[]> => {
      if (!practiceId) return [];
      let query = supabase
        .from('cpd_records')
        .select('*')
        .eq('practice_id', practiceId)
        .order('date_completed', { ascending: false });
      if (year != null) {
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;
        query = query.gte('date_completed', start).lte('date_completed', end);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CPDRecord[];
    },
    enabled: !!practiceId,
  });
}

export function useCPDTargets(practiceId: string | null, year: number) {
  return useQuery({
    queryKey: ['cpd-targets', practiceId, year],
    queryFn: async (): Promise<CPDTarget[]> => {
      if (!practiceId) return [];
      const { data, error } = await supabase
        .from('cpd_targets')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('year', year);
      if (error) throw error;
      return (data ?? []).map((row: { category_targets?: unknown }) => ({
        ...row,
        category_targets: (row.category_targets as Record<string, number>) ?? {},
      })) as CPDTarget[];
    },
    enabled: !!practiceId,
  });
}

export function useCPDMutations() {
  const queryClient = useQueryClient();

  const addRecord = useMutation({
    mutationFn: async (record: Omit<CPDRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('cpd_records')
        .insert({
          practice_id: record.practice_id,
          member_id: record.member_id,
          activity_type: record.activity_type,
          title: record.title,
          description: record.description ?? null,
          provider: record.provider ?? null,
          hours: record.hours,
          date_completed: record.date_completed,
          skill_category: record.skill_category,
          skill_ids: record.skill_ids ?? [],
          verified: record.verified ?? false,
          certificate_url: record.certificate_url ?? null,
          notes: record.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CPDRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpd-records'] });
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CPDRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('cpd_records')
        .update({
          ...(updates.title !== undefined && { title: updates.title }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.provider !== undefined && { provider: updates.provider }),
          ...(updates.hours !== undefined && { hours: updates.hours }),
          ...(updates.date_completed !== undefined && { date_completed: updates.date_completed }),
          ...(updates.skill_category !== undefined && { skill_category: updates.skill_category }),
          ...(updates.skill_ids !== undefined && { skill_ids: updates.skill_ids }),
          ...(updates.notes !== undefined && { notes: updates.notes }),
          ...(updates.certificate_url !== undefined && { certificate_url: updates.certificate_url }),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CPDRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpd-records'] });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cpd_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpd-records'] });
    },
  });

  const verifyRecord = useMutation({
    mutationFn: async ({ id, verifiedBy }: { id: string; verifiedBy: string }) => {
      const { data, error } = await supabase
        .from('cpd_records')
        .update({
          verified: true,
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CPDRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpd-records'] });
    },
  });

  const setTarget = useMutation({
    mutationFn: async (target: {
      practice_id: string;
      member_id: string;
      year: number;
      target_hours: number;
      category_targets?: Record<string, number>;
    }) => {
      const { data, error } = await supabase
        .from('cpd_targets')
        .upsert(
          {
            practice_id: target.practice_id,
            member_id: target.member_id,
            year: target.year,
            target_hours: target.target_hours,
            category_targets: target.category_targets ?? {},
          },
          { onConflict: 'member_id,year' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as CPDTarget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpd-targets'] });
    },
  });

  return {
    addRecord,
    updateRecord,
    deleteRecord,
    verifyRecord,
    setTarget,
  };
}
