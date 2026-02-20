import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Task, TaskStatus } from '@torsor/shared';

export function useCurrentTasks() {
  const { clientSession } = useAuth();
  const { progress } = useAssessmentProgress();

  const query = useQuery({
    queryKey: ['current-tasks', clientSession?.clientId, progress?.currentWeek],
    queryFn: async () => {
      if (!clientSession?.clientId) return [];

      const currentWeek = progress?.currentWeek || 1;

      const { data, error } = await supabase
        .from('client_tasks')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .eq('week_number', currentWeek)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!clientSession?.clientId,
  });

  return {
    tasks: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAllTasks() {
  const { clientSession } = useAuth();

  const query = useQuery({
    queryKey: ['all-tasks', clientSession?.clientId],
    queryFn: async () => {
      if (!clientSession?.clientId) return [];

      const { data, error } = await supabase
        .from('client_tasks')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .order('week_number', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!clientSession?.clientId,
  });

  return {
    tasks: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const { clientSession } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      status,
      notes,
    }: {
      taskId: string;
      status: TaskStatus;
      notes?: string;
    }) => {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      if (notes) {
        updates.completion_notes = notes;
      }

      const { data, error } = await supabase
        .from('client_tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('client_id', clientSession?.clientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
}

// Import at top of file - avoiding circular dependency
import { useAssessmentProgress } from './useAssessmentProgress';

