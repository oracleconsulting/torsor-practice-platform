// ============================================================================
// useWeeklyCheckIn — Submit + Fetch Weekly Life Pulse & Sprint Review
// ============================================================================
// Follows the same pattern as useTasks in useAnalysis.ts.
// Direct Supabase calls from the client portal — no edge function needed.
//
// Usage:
//   const { submit, fetchCheckIn, fetchHistory, checkIn, history, loading } = useWeeklyCheckIn();
//
//   await submit({
//     weekNumber: 5,
//     lifeSatisfaction: 4,
//     timeProtected: 'mostly',
//     personalWin: 'Took Wednesday afternoon off',
//     businessProgress: 3,
//     blockers: null
//   });
//
//   await fetchCheckIn(5);
//   await fetchHistory();  // last 4 weeks by default
// ============================================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

export interface CheckInData {
  weekNumber: number;
  lifeSatisfaction: 1 | 2 | 3 | 4 | 5;
  timeProtected: 'yes' | 'mostly' | 'no';
  personalWin?: string | null;
  businessProgress: 1 | 2 | 3 | 4 | 5;
  blockers?: string | null;
}

export interface WeeklyCheckIn {
  id: string;
  clientId: string;
  weekNumber: number;
  sprintId: string | null;
  lifeSatisfaction: number;
  timeProtected: string;
  personalWin: string | null;
  businessProgress: number;
  blockers: string | null;
  lifeAlignmentScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface LifeAlignmentSummary {
  score: number;
  trend: 'up' | 'stable' | 'down';
  weeklyScores: Array<{ weekNumber: number; score: number }>;
  summary: string;
  timeProtectedCount: number;
  totalWeeks: number;
}

// ============================================================================
// SCORE COMPUTATION
// ============================================================================

function computeLifeAlignmentScore(
  lifeSatisfaction: number,
  timeProtected: string,
  lifeTaskCompletionRate?: number
): number {
  const satisfactionScore = ((lifeSatisfaction - 1) / 4) * 100;
  const timeScore = timeProtected === 'yes' ? 100
    : timeProtected === 'mostly' ? 60
    : 20;

  if (lifeTaskCompletionRate !== undefined && lifeTaskCompletionRate !== null) {
    return Math.round(
      (satisfactionScore * 0.4) +
      (timeScore * 0.4) +
      (lifeTaskCompletionRate * 0.2)
    );
  }

  return Math.round(
    (satisfactionScore * 0.55) +
    (timeScore * 0.45)
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useWeeklyCheckIn() {
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<WeeklyCheckIn | null>(null);
  const [history, setHistory] = useState<WeeklyCheckIn[]>([]);

  const submit = useCallback(async (data: CheckInData): Promise<boolean> => {
    if (!clientSession?.clientId || !clientSession?.practiceId) {
      setError('Not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const lifeTaskRate = await getLifeTaskCompletionRate(
        clientSession.clientId,
        data.weekNumber
      );

      const lifeAlignmentScore = computeLifeAlignmentScore(
        data.lifeSatisfaction,
        data.timeProtected,
        lifeTaskRate
      );

      const { data: activeStage } = await supabase
        .from('roadmap_stages')
        .select('id')
        .eq('client_id', clientSession.clientId)
        .in('stage_type', ['sprint_plan', 'sprint_plan_part2'])
        .in('status', ['generated', 'approved', 'published'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: result, error: upsertError } = await supabase
        .from('weekly_checkins')
        .upsert({
          client_id: clientSession.clientId,
          practice_id: clientSession.practiceId,
          week_number: data.weekNumber,
          sprint_id: activeStage?.id ?? null,
          life_satisfaction: data.lifeSatisfaction,
          time_protected: data.timeProtected,
          personal_win: data.personalWin ?? null,
          business_progress: data.businessProgress,
          blockers: data.blockers ?? null,
          life_alignment_score: lifeAlignmentScore,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,sprint_id,week_number'
        })
        .select()
        .single();

      if (upsertError) throw new Error(upsertError.message);

      if (result) {
        setCheckIn(mapRow(result));
      }

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit check-in';
      setError(msg);
      console.error('[useWeeklyCheckIn] Submit error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [clientSession?.clientId, clientSession?.practiceId]);

  const fetchCheckIn = useCallback(async (weekNumber: number): Promise<WeeklyCheckIn | null> => {
    if (!clientSession?.clientId) return null;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .eq('week_number', weekNumber)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw new Error(fetchError.message);

      const mapped = data ? mapRow(data) : null;
      setCheckIn(mapped);
      return mapped;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch check-in';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clientSession?.clientId]);

  const fetchHistory = useCallback(async (lastNWeeks: number = 12): Promise<WeeklyCheckIn[]> => {
    if (!clientSession?.clientId) return [];

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .order('week_number', { ascending: false })
        .limit(lastNWeeks);

      if (fetchError) throw new Error(fetchError.message);

      const mapped = (data ?? []).map(mapRow);
      setHistory(mapped);
      return mapped;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch check-in history';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [clientSession?.clientId]);

  const getLifeAlignmentSummary = useCallback((): LifeAlignmentSummary | null => {
    if (history.length === 0) return null;

    const recent = history.slice(0, 4);
    const scores = recent.map(c => c.lifeAlignmentScore);
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    let trend: 'up' | 'stable' | 'down' = 'stable';
    if (recent.length >= 4) {
      const recentAvg = (scores[0] + scores[1]) / 2;
      const olderAvg = (scores[2] + scores[3]) / 2;
      const diff = recentAvg - olderAvg;
      if (diff > 5) trend = 'up';
      else if (diff < -5) trend = 'down';
    }

    const timeProtectedCount = recent.filter(c => c.timeProtected === 'yes').length;

    let summary: string;
    if (timeProtectedCount === recent.length) {
      summary = `You protected your time every week for the last ${recent.length} weeks`;
    } else if (timeProtectedCount > 0) {
      summary = `You protected your time ${timeProtectedCount} out of ${recent.length} weeks`;
    } else {
      summary = `Your time commitments need attention — let's make next week different`;
    }

    return {
      score,
      trend,
      weeklyScores: [...history].reverse().map(c => ({
        weekNumber: c.weekNumber,
        score: c.lifeAlignmentScore
      })),
      summary,
      timeProtectedCount,
      totalWeeks: recent.length
    };
  }, [history]);

  return {
    submit,
    fetchCheckIn,
    fetchHistory,
    getLifeAlignmentSummary,
    checkIn,
    history,
    loading,
    error
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function mapRow(row: Record<string, unknown>): WeeklyCheckIn {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    weekNumber: Number(row.week_number),
    sprintId: row.sprint_id != null ? String(row.sprint_id) : null,
    lifeSatisfaction: Number(row.life_satisfaction),
    timeProtected: String(row.time_protected),
    personalWin: row.personal_win != null ? String(row.personal_win) : null,
    businessProgress: Number(row.business_progress),
    blockers: row.blockers != null ? String(row.blockers) : null,
    lifeAlignmentScore: parseFloat(String(row.life_alignment_score)) || 0,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

async function getLifeTaskCompletionRate(
  clientId: string,
  weekNumber: number
): Promise<number | undefined> {
  try {
    const { data: tasks, error } = await supabase
      .from('client_tasks')
      .select('status, category')
      .eq('client_id', clientId)
      .eq('week_number', weekNumber)
      .like('category', 'life_%');

    if (error || !tasks || tasks.length === 0) return undefined;

    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  } catch {
    return undefined;
  }
}
