// ============================================================================
// TRAINING PLANS & MODULES HOOKS
// ============================================================================
// React Query hooks for training_plans and training_modules (Phase 1C).
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TrainingPlan, TrainingModule } from '../lib/types';

function mapPlanRow(row: { training_modules?: TrainingModule[]; [k: string]: unknown }): TrainingPlan {
  const { training_modules, ...plan } = row;
  return {
    ...plan,
    modules: (training_modules ?? []).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    ),
  } as TrainingPlan;
}

export function useTrainingPlans(practiceId: string | null, status?: string) {
  return useQuery({
    queryKey: ['training-plans', practiceId, status],
    queryFn: async (): Promise<TrainingPlan[]> => {
      if (!practiceId) return [];
      let query = supabase
        .from('training_plans')
        .select('*, modules:training_modules(*)')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as { training_modules?: TrainingModule[]; [k: string]: unknown }[];
      return rows.map((row) => {
        const mods = (row.modules ?? row.training_modules) as TrainingModule[] | undefined;
        return mapPlanRow({ ...row, training_modules: mods });
      });
    },
    enabled: !!practiceId,
  });
}

export function useTrainingPlanMutations() {
  const queryClient = useQueryClient();

  const createPlan = useMutation({
    mutationFn: async (plan: Omit<TrainingPlan, 'id' | 'created_at' | 'updated_at' | 'modules'>) => {
      const { data, error } = await supabase
        .from('training_plans')
        .insert({
          practice_id: plan.practice_id,
          member_id: plan.member_id,
          title: plan.title,
          description: plan.description ?? null,
          skill_ids: plan.skill_ids ?? [],
          service_line_id: plan.service_line_id ?? null,
          target_level: plan.target_level ?? null,
          current_progress: plan.current_progress ?? 0,
          status: plan.status ?? 'not_started',
          start_date: plan.start_date ?? null,
          target_date: plan.target_date ?? null,
          created_by: plan.created_by ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return { ...data, modules: [] } as TrainingPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<TrainingPlan> & { id: string }) => {
      const payload: Record<string, unknown> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.skill_ids !== undefined) payload.skill_ids = updates.skill_ids;
      if (updates.service_line_id !== undefined) payload.service_line_id = updates.service_line_id;
      if (updates.target_level !== undefined) payload.target_level = updates.target_level;
      if (updates.current_progress !== undefined) payload.current_progress = updates.current_progress;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.start_date !== undefined) payload.start_date = updates.start_date;
      if (updates.target_date !== undefined) payload.target_date = updates.target_date;
      if (updates.completed_at !== undefined) payload.completed_at = updates.completed_at;
      const { data, error } = await supabase
        .from('training_plans')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as TrainingPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('training_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });

  const addModule = useMutation({
    mutationFn: async (module: Omit<TrainingModule, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('training_modules')
        .insert({
          training_plan_id: module.training_plan_id,
          title: module.title,
          description: module.description ?? null,
          module_type: module.module_type,
          duration_hours: module.duration_hours ?? 1,
          skill_category: module.skill_category ?? null,
          resource_url: module.resource_url ?? null,
          sort_order: module.sort_order ?? 0,
          completed: module.completed ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as TrainingModule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });

  const completeModule = useMutation({
    mutationFn: async (params: {
      moduleId: string;
      trainingPlanId: string;
      cpd_record_id?: string;
    }) => {
      const { data: plan } = await supabase
        .from('training_plans')
        .select('id, member_id, practice_id, title, skill_ids')
        .eq('id', params.trainingPlanId)
        .single();
      if (!plan) throw new Error('Training plan not found');

      const { data: mod } = await supabase
        .from('training_modules')
        .select('*')
        .eq('id', params.moduleId)
        .single();
      if (!mod) throw new Error('Module not found');

      const now = new Date().toISOString();
      const today = now.split('T')[0];
      let cpdRecordId: string | null = params.cpd_record_id ?? null;

      if (!mod.cpd_record_id) {
        const activityTypeMap: Record<string, string> = {
          video: 'course',
          reading: 'reading',
          exercise: 'course',
          assessment: 'course',
          workshop: 'workshop',
          on_the_job: 'on_the_job',
          shadowing: 'shadowing',
          mentoring: 'mentoring',
          client_delivery: 'on_the_job',
        };
        let skillCategory = 'Advisory & Consulting';
        if (plan.skill_ids?.length > 0) {
          const { data: skill } = await supabase
            .from('skills')
            .select('category')
            .eq('id', plan.skill_ids[0])
            .single();
          if (skill?.category) skillCategory = skill.category;
        }
        const { data: cpdRecord, error: cpdErr } = await supabase
          .from('cpd_records')
          .insert({
            practice_id: plan.practice_id,
            member_id: plan.member_id,
            activity_type: activityTypeMap[mod.module_type] || 'course',
            title: `${plan.title} — ${mod.title}`,
            hours: mod.duration_hours ?? 1,
            date_completed: today,
            skill_category: skillCategory,
            skill_ids: plan.skill_ids ?? [],
            notes: 'Auto-logged from training plan completion',
            verified: false,
          })
          .select('id')
          .single();
        if (cpdErr) throw cpdErr;
        cpdRecordId = cpdRecord?.id ?? null;
      }

      const { data: updatedModule, error: modError } = await supabase
        .from('training_modules')
        .update({
          completed: true,
          completed_at: now,
          ...(cpdRecordId && { cpd_record_id: cpdRecordId }),
        })
        .eq('id', params.moduleId)
        .select()
        .single();
      if (modError) throw modError;

      const { data: allModules } = await supabase
        .from('training_modules')
        .select('id, completed')
        .eq('training_plan_id', params.trainingPlanId);
      const total = allModules?.length ?? 0;
      const completedCount = allModules?.filter((m) => m.completed).length ?? 0;
      const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      const status = progress === 100 ? 'completed' : 'in_progress';
      const planUpdates: { current_progress: number; status: string; completed_at?: string } = {
        current_progress: progress,
        status,
      };
      if (progress === 100) planUpdates.completed_at = now;

      const { error: planError } = await supabase
        .from('training_plans')
        .update(planUpdates)
        .eq('id', params.trainingPlanId);
      if (planError) throw planError;

      return updatedModule as TrainingModule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      queryClient.invalidateQueries({ queryKey: ['cpd-records'] });
      queryClient.invalidateQueries({ queryKey: ['cpd-targets'] });
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ planId, progress }: { planId: string; progress: number }) => {
      const updates: { current_progress: number; status?: string; completed_at?: string } = {
        current_progress: Math.min(100, Math.max(0, progress)),
      };
      if (progress >= 100) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from('training_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();
      if (error) throw error;
      return data as TrainingPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });

  return {
    createPlan,
    updatePlan,
    deletePlan,
    addModule,
    completeModule,
    updateProgress,
  };
}
