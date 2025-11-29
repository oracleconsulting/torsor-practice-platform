// ============================================================================
// ANALYSIS HOOKS
// ============================================================================
// Hooks for the 365 Method analysis system:
// - useGenerateRoadmap: Generate roadmap from Parts 1+2
// - useGenerateValueAnalysis: Generate value analysis from Part 3
// - useRoadmap: Fetch existing roadmap
// - usePart3Questions: Get stage-specific Part 3 questions
// - useTasks: Manage sprint tasks

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

export interface RoadmapResult {
  success: boolean;
  roadmapId?: string;
  summary?: {
    headline: string;
    northStar: string;
    archetype: string;
    weekCount: number;
    taskCount: number;
  };
  usage?: {
    durationMs: number;
    llmCalls: number;
  };
  error?: string;
}

export interface ValueAnalysisResult {
  success: boolean;
  valueAnalysis?: {
    businessStage: string;
    overallScore: number;
    totalOpportunity: number;
    assetScores: AssetScore[];
    riskRegister: Risk[];
    valueGaps: ValueGap[];
  };
  summary?: {
    overallScore: number;
    totalOpportunity: number;
    criticalRisks: number;
    quickWins: number;
  };
  error?: string;
}

export interface AssetScore {
  category: string;
  score: number;
  maxScore: number;
  issues: string[];
  opportunities: string[];
  financialImpact: number;
}

export interface Risk {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: string;
  mitigation: string;
  cost: number;
}

export interface ValueGap {
  area: string;
  currentValue: number;
  potentialValue: number;
  gap: number;
  actions: string[];
  timeframe: string;
  effort: 'Low' | 'Medium' | 'High';
}

export interface RoadmapData {
  id: string;
  roadmapData: {
    fiveYearVision?: any;
    sixMonthShift?: any;
    sprint?: any;
    summary?: {
      headline: string;
      northStar?: string;
      keyInsight: string;
      expectedOutcome: string;
    };
    priorities?: Array<{
      rank: number;
      title: string;
      description: string;
      category: string;
    }>;
    weeks?: Array<{
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
  };
  valueAnalysis?: {
    businessStage?: string;
    assetScores?: AssetScore[];
    overallScore?: number;
    valueGaps?: ValueGap[];
    riskRegister?: Risk[];
    totalOpportunity?: number;
  };
  createdAt: string;
  isActive: boolean;
}

export interface Part3Question {
  id: string;
  fieldName: string;
  question: string;
  type: 'radio' | 'checkbox' | 'slider' | 'matrix' | 'text';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  insight?: string;
  benchmark?: string;
  matrixRows?: Array<{ id: string; label: string; fieldName: string }>;
  matrixColumns?: string[];
}

export interface Part3Section {
  section: string;
  questions: Part3Question[];
}

// ============================================================================
// useGenerateRoadmap - Generate from Parts 1+2
// ============================================================================

export function useGenerateRoadmap() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoadmapResult | null>(null);

  const generate = useCallback(async (regenerate = false): Promise<RoadmapResult> => {
    if (!clientSession?.clientId || !clientSession?.practiceId) {
      const err = { success: false, error: 'Not authenticated' };
      setError(err.error);
      return err;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-roadmap', {
        body: {
          clientId: clientSession.clientId,
          practiceId: clientSession.practiceId,
          regenerate
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error || 'Roadmap generation failed');

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

// ============================================================================
// useGenerateValueAnalysis - Generate from Part 3
// ============================================================================

export function useGenerateValueAnalysis() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValueAnalysisResult | null>(null);

  const generate = useCallback(async (part3Responses: Record<string, any>): Promise<ValueAnalysisResult> => {
    if (!clientSession?.clientId || !clientSession?.practiceId) {
      const err = { success: false, error: 'Not authenticated' };
      setError(err.error);
      return err;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-value-analysis', {
        body: {
          action: 'generate-analysis',
          clientId: clientSession.clientId,
          practiceId: clientSession.practiceId,
          part3Responses
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error || 'Value analysis failed');

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

// ============================================================================
// usePart3Questions - Get stage-specific Hidden Value questions
// ============================================================================

export function usePart3Questions() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Part3Section[]>([]);
  const [businessStage, setBusinessStage] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!clientSession?.clientId) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-value-analysis', {
        body: {
          action: 'get-questions',
          clientId: clientSession.clientId,
          practiceId: clientSession.practiceId
        }
      });

      if (fnError) throw new Error(fnError.message);

      setQuestions(data.questions || []);
      setBusinessStage(data.businessStage);
      return data.questions || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [clientSession]);

  return { fetchQuestions, loading, error, questions, businessStage };
}

// ============================================================================
// useGenerateAnalysis - Legacy hook (calls generate-roadmap for backward compat)
// ============================================================================

export function useGenerateAnalysis() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoadmapResult | null>(null);

  const generate = useCallback(async (regenerate = false): Promise<RoadmapResult> => {
    if (!clientSession?.clientId || !clientSession?.practiceId) {
      const err = { success: false, error: 'Not authenticated' };
      setError(err.error);
      return err;
    }

    setLoading(true);
    setError(null);

    try {
      // Try new generate-roadmap function first
      let data, fnError;
      try {
        const result = await supabase.functions.invoke('generate-roadmap', {
          body: {
            clientId: clientSession.clientId,
            practiceId: clientSession.practiceId,
            regenerate
          }
        });
        data = result.data;
        fnError = result.error;
      } catch {
        // Fallback to legacy generate-analysis function
        const result = await supabase.functions.invoke('generate-analysis', {
          body: {
            clientId: clientSession.clientId,
            practiceId: clientSession.practiceId,
            regenerate
          }
        });
        data = result.data;
        fnError = result.error;
      }

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error || 'Analysis generation failed');

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

// ============================================================================
// useRoadmap - Fetch existing roadmap
// ============================================================================

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

      if (fetchError) throw new Error(fetchError.message);

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

// ============================================================================
// useTasks - Manage sprint tasks
// ============================================================================

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

      if (fetchError) throw new Error(fetchError.message);

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

      if (updateError) throw new Error(updateError.message);

      await fetchTasks();
      return true;

    } catch (err) {
      console.error('Error updating task:', err);
      return false;
    }
  }, [fetchTasks]);

  return { fetchTasks, updateTaskStatus, loading, error, tasks };
}
