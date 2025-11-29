// ============================================================================
// ANALYSIS HOOKS
// ============================================================================
// Hooks for triggering analysis generation and fetching roadmap data

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface AnalysisResult {
  success: boolean;
  roadmapId?: string;
  valueAnalysis?: {
    overallScore: number;
    totalOpportunity: number;
  };
  roadmap?: {
    summary: {
      headline: string;
      keyInsight: string;
      expectedOutcome: string;
    };
    weekCount: number;
    taskCount: number;
  };
  usage?: {
    model: string;
    cost: number;
    durationMs: number;
  };
  error?: string;
}

export interface RoadmapData {
  id: string;
  roadmapData: {
    summary: {
      headline: string;
      keyInsight: string;
      expectedOutcome: string;
    };
    priorities: Array<{
      rank: number;
      title: string;
      description: string;
      category: string;
    }>;
    weeks: Array<{
      weekNumber: number;
      theme: string;
      focus: string;
      tasks: Array<{
        id: string;
        title: string;
        description: string;
        category: string;
        priority: string;
        estimatedHours: number;
      }>;
      milestone?: string;
    }>;
    successMetrics: Array<{
      metric: string;
      baseline: string;
      target: string;
    }>;
  };
  valueAnalysis: {
    assetScores: Array<{
      category: string;
      score: number;
      maxScore: number;
      percentage: number;
      issues: string[];
      opportunities: string[];
    }>;
    riskRegister: Array<{
      title: string;
      severity: string;
      impact: string;
      mitigation: string;
    }>;
    valueGaps: Array<{
      area: string;
      gap: number;
      effort: string;
      actions: string[];
    }>;
    overallScore: number;
  };
  createdAt: string;
  isActive: boolean;
}

export function useGenerateAnalysis() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const generate = useCallback(async (regenerate = false): Promise<AnalysisResult> => {
    if (!clientSession?.clientId || !clientSession?.practiceId) {
      const err = { success: false, error: 'Not authenticated' };
      setError(err.error);
      return err;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-analysis', {
        body: {
          clientId: clientSession.clientId,
          practiceId: clientSession.practiceId,
          regenerate
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis generation failed');
      }

      setResult(data);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [clientSession]);

  return { generate, loading, error, result };
}

export function useRoadmap() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);

  const fetchRoadmap = useCallback(async () => {
    if (!clientSession?.clientId) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('client_roadmaps')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data) {
        setRoadmap({
          id: data.id,
          roadmapData: data.roadmap_data,
          valueAnalysis: data.value_analysis,
          createdAt: data.created_at,
          isActive: data.is_active
        });
        return data;
      }

      return null;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clientSession]);

  return { fetchRoadmap, loading, error, roadmap };
}

export function useTasks() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchTasks = useCallback(async (weekNumber?: number) => {
    if (!clientSession?.clientId) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('client_tasks')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .order('week_number', { ascending: true })
        .order('sort_order', { ascending: true });

      if (weekNumber) {
        query = query.eq('week_number', weekNumber);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setTasks(data || []);
      return data || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [clientSession]);

  const updateTaskStatus = useCallback(async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const { error: updateError } = await supabase
        .from('client_tasks')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Refresh tasks
      await fetchTasks();
      return true;

    } catch (err) {
      console.error('Error updating task:', err);
      return false;
    }
  }, [fetchTasks]);

  return { fetchTasks, updateTaskStatus, loading, error, tasks };
}

