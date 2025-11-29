// ============================================================================
// ANALYSIS HOOKS - 365 Method Flow
// ============================================================================
// Complete flow:
// 1. Part 1 complete → generate-fit-profile → unlocks Part 2
// 2. Part 2 complete → generate-followup-analysis → dynamic questions
// 3. Follow-up complete → generate-roadmap → roadmap displayed
// 4. Roadmap displayed → unlocks Part 3 (optional for some clients)
// 5. Part 3 complete → generate-value-analysis
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

export interface FitProfile {
  signals: {
    readinessScore: number;
    commitmentScore: number;
    clarityScore: number;
    urgencyScore: number;
    coachabilityScore: number;
    overallFit: 'excellent' | 'good' | 'needs_discussion' | 'not_ready';
  };
  message: {
    headline: string;
    openingReflection: string;
    acknowledgment: string;
    strengthSpotlight: string;
    fearAddress: string;
    nextStepClarity: string;
    closingEnergy: string;
    callToAction: string;
  };
  journeyRecommendation: {
    recommendedPace: 'intensive' | 'steady' | 'gradual';
    paceDescription: string;
    primaryFocus: string[];
    expectedTimeline: string;
    weeklyCommitment: string;
  };
  unlocksPartTwo: boolean;
}

export interface FollowupQuestion {
  id: string;
  text: string;
  type: 'text' | 'number' | 'radio' | 'slider' | 'checkbox' | 'time_breakdown';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  insight?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  context: string;
  impactOnRoadmap: string;
}

export interface FollowupAnalysis {
  summary: {
    totalGapsDetected: number;
    criticalGaps: number;
    highPriorityGaps: number;
    currentMetrics: Record<string, any>;
    keyInsights: string[];
    recommendedAction: string;
  };
  questionGroups: {
    critical: FollowupQuestion[];
    high: FollowupQuestion[];
    medium: FollowupQuestion[];
    low: FollowupQuestion[];
  };
  allQuestions: FollowupQuestion[];
  totalQuestions: number;
  estimatedTime: string;
}

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
    enrichedMetrics?: any;
    followupCompleted?: boolean;
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
}

export interface Part3Section {
  section: string;
  questions: Part3Question[];
}

// Assessment flow state
export interface AssessmentFlowState {
  part1: {
    status: 'not_started' | 'in_progress' | 'completed';
    fitProfile: FitProfile | null;
    unlocksPart2: boolean;
  };
  part2: {
    status: 'locked' | 'not_started' | 'in_progress' | 'completed';
    lockedReason?: string;
  };
  followup: {
    status: 'not_applicable' | 'pending' | 'in_progress' | 'completed';
    questions: FollowupQuestion[];
    hasResponses: boolean;
  };
  roadmap: {
    status: 'not_generated' | 'generating' | 'generated';
    data: RoadmapData | null;
  };
  part3: {
    status: 'locked' | 'not_started' | 'in_progress' | 'completed' | 'skipped';
    lockedReason?: string;
    skippedReason?: string;
  };
  skipPart3: boolean; // For Tom/Zaneta and similar clients
}

// ============================================================================
// useGenerateFitProfile - Generate after Part 1
// ============================================================================

export function useGenerateFitProfile() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fitProfile, setFitProfile] = useState<FitProfile | null>(null);

  const generate = useCallback(async (): Promise<{ success: boolean; fitProfile?: FitProfile; error?: string }> => {
    if (!clientSession?.clientId || !clientSession?.practiceId) {
      const err = { success: false, error: 'Not authenticated' };
      setError(err.error);
      return err;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-fit-profile', {
        body: {
          clientId: clientSession.clientId,
          practiceId: clientSession.practiceId
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error || 'Fit profile generation failed');

      setFitProfile(data.fitProfile);
      return { success: true, fitProfile: data.fitProfile };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [clientSession]);

  return { generate, loading, error, fitProfile };
}

// ============================================================================
// useFollowupAnalysis - Dynamic questions after Part 2
// ============================================================================

export function useFollowupAnalysis() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FollowupAnalysis | null>(null);

  const analyze = useCallback(async (): Promise<{ success: boolean; analysis?: FollowupAnalysis; error?: string }> => {
    if (!clientSession?.clientId) {
      const err = { success: false, error: 'Not authenticated' };
      setError(err.error);
      return err;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-followup-analysis', {
        body: {
          action: 'analyze',
          clientId: clientSession.clientId
        }
      });

      if (fnError) throw new Error(fnError.message);

      setAnalysis(data);
      return { success: true, analysis: data };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [clientSession]);

  const saveResponses = useCallback(async (responses: Record<string, any>): Promise<{ success: boolean; error?: string }> => {
    if (!clientSession?.clientId || !clientSession?.practiceId) {
      return { success: false, error: 'Not authenticated' };
    }

    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-followup-analysis', {
        body: {
          action: 'save-responses',
          clientId: clientSession.clientId,
          practiceId: clientSession.practiceId,
          followupResponses: responses
        }
      });

      if (fnError) throw new Error(fnError.message);

      return { success: true };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [clientSession]);

  return { analyze, saveResponses, loading, error, analysis };
}

// ============================================================================
// useGenerateRoadmap - Generate from Parts 1+2 + Followup
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
// useAssessmentFlow - Central flow control
// ============================================================================

export function useAssessmentFlow() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flowState, setFlowState] = useState<AssessmentFlowState>({
    part1: { status: 'not_started', fitProfile: null, unlocksPart2: false },
    part2: { status: 'locked', lockedReason: 'Complete Part 1 first' },
    followup: { status: 'not_applicable', questions: [], hasResponses: false },
    roadmap: { status: 'not_generated', data: null },
    part3: { status: 'locked', lockedReason: 'Complete roadmap first' },
    skipPart3: false
  });

  const refreshFlow = useCallback(async () => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all assessments
      const { data: assessments, error: assessError } = await supabase
        .from('client_assessments')
        .select('assessment_type, status, responses, fit_profile')
        .eq('client_id', clientSession.clientId);

      if (assessError) throw assessError;

      // Fetch roadmap
      const { data: roadmap, error: roadmapError } = await supabase
        .from('client_roadmaps')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .eq('is_active', true)
        .maybeSingle();

      if (roadmapError) throw roadmapError;

      // Fetch client settings for skip_part3
      const { data: clientData } = await supabase
        .from('practice_members')
        .select('skip_value_analysis')
        .eq('id', clientSession.clientId)
        .single();

      const skipPart3 = clientData?.skip_value_analysis || false;

      // Parse assessment states
      const part1Assessment = assessments?.find(a => a.assessment_type === 'part1');
      const part2Assessment = assessments?.find(a => a.assessment_type === 'part2');
      const part3Assessment = assessments?.find(a => a.assessment_type === 'part3');
      const followupAssessment = assessments?.find(a => a.assessment_type === 'followup');

      const part1Complete = part1Assessment?.status === 'completed';
      const part2Complete = part2Assessment?.status === 'completed';
      const part3Complete = part3Assessment?.status === 'completed';
      const followupComplete = followupAssessment?.status === 'completed';
      const roadmapGenerated = !!roadmap;

      const fitProfile = part1Assessment?.fit_profile as FitProfile | null;
      const unlocksPart2 = fitProfile?.unlocksPartTwo ?? part1Complete;

      setFlowState({
        part1: {
          status: part1Complete ? 'completed' : part1Assessment ? 'in_progress' : 'not_started',
          fitProfile,
          unlocksPart2
        },
        part2: {
          status: !unlocksPart2 ? 'locked' 
            : part2Complete ? 'completed' 
            : part2Assessment ? 'in_progress' 
            : 'not_started',
          lockedReason: !unlocksPart2 ? 'Complete Part 1 and receive your Fit Profile first' : undefined
        },
        followup: {
          status: !part2Complete ? 'not_applicable'
            : followupComplete ? 'completed'
            : followupAssessment ? 'in_progress'
            : 'pending',
          questions: [],
          hasResponses: !!followupAssessment?.responses
        },
        roadmap: {
          status: roadmapGenerated ? 'generated' : 'not_generated',
          data: roadmap ? {
            id: roadmap.id,
            roadmapData: roadmap.roadmap_data,
            valueAnalysis: roadmap.value_analysis,
            createdAt: roadmap.created_at,
            isActive: roadmap.is_active
          } : null
        },
        part3: {
          status: skipPart3 ? 'skipped'
            : !roadmapGenerated ? 'locked'
            : part3Complete ? 'completed'
            : part3Assessment ? 'in_progress'
            : 'not_started',
          lockedReason: !roadmapGenerated ? 'Your roadmap must be generated first' : undefined,
          skippedReason: skipPart3 ? 'Value analysis not required for your program' : undefined
        },
        skipPart3
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clientSession]);

  useEffect(() => {
    refreshFlow();
  }, [refreshFlow]);

  // Helper to determine what action is available
  const getNextAction = useCallback((): { 
    action: 'part1' | 'fit_profile' | 'part2' | 'followup' | 'roadmap' | 'part3' | 'complete' | 'blocked';
    label: string;
    url?: string;
  } => {
    const { part1, part2, followup, roadmap, part3, skipPart3 } = flowState;

    if (part1.status !== 'completed') {
      return { action: 'part1', label: 'Start Part 1: Life Design', url: '/assessments/part1' };
    }

    if (!part1.fitProfile) {
      return { action: 'fit_profile', label: 'Generate Your Fit Profile', url: '/assessments/fit-profile' };
    }

    if (!part1.unlocksPart2) {
      return { action: 'blocked', label: 'Schedule a call to discuss next steps' };
    }

    if (part2.status !== 'completed') {
      return { action: 'part2', label: 'Start Part 2: Business Deep Dive', url: '/assessments/part2' };
    }

    if (followup.status === 'pending') {
      return { action: 'followup', label: 'Answer Follow-up Questions', url: '/assessments/followup' };
    }

    if (roadmap.status !== 'generated') {
      return { action: 'roadmap', label: 'Generate Your Roadmap', url: '/roadmap/generate' };
    }

    if (!skipPart3 && part3.status !== 'completed' && part3.status !== 'skipped') {
      return { action: 'part3', label: 'Start Part 3: Hidden Value Audit', url: '/assessments/part3' };
    }

    return { action: 'complete', label: 'View Your Roadmap', url: '/roadmap' };

  }, [flowState]);

  return { 
    flowState, 
    refreshFlow, 
    loading, 
    error, 
    getNextAction,
    isComplete: flowState.roadmap.status === 'generated' && 
                (flowState.skipPart3 || flowState.part3.status === 'completed')
  };
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

// ============================================================================
// Legacy hook for backward compatibility
// ============================================================================

export function useGenerateAnalysis() {
  return useGenerateRoadmap();
}
