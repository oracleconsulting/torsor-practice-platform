// ============================================================================
// useLifeAlignment — Life Pulse entries + calculated life alignment scores
// ============================================================================
// For 4A Life Design Thread: weekly pulse (3 questions) + weighted score
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const LIFE_CATEGORIES = ['life_time', 'life_relationship', 'life_health', 'life_experience', 'life_identity'];

export interface LifePulseEntry {
  id: string;
  client_id: string;
  practice_id: string;
  sprint_number: number;
  week_number: number;
  alignment_rating: number;
  active_categories: string[];
  protect_next_week: string | null;
  created_at: string;
}

export interface LifeAlignmentScoreRow {
  id: string;
  client_id: string;
  practice_id: string;
  sprint_number: number;
  week_number: number;
  task_completion_score: number;
  pulse_alignment_score: number;
  hours_adherence_score: number;
  category_diversity_score: number;
  overall_score: number;
  trend: 'up' | 'down' | 'stable';
  category_scores: Record<string, number>;
  calculated_at: string;
}

export function useLifeAlignment(sprintNumber: number, currentWeek: number) {
  const { clientSession } = useAuth();
  const clientId = clientSession?.clientId ?? null;
  const practiceId = clientSession?.practiceId ?? null;

  const [pulse, setPulse] = useState<LifePulseEntry[]>([]);
  const [scores, setScores] = useState<LifeAlignmentScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPulseAndScores = useCallback(async () => {
    if (!clientId || sprintNumber < 1) {
      setPulse([]);
      setScores([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [pulseRes, scoresRes] = await Promise.all([
        supabase
          .from('life_pulse_entries')
          .select('*')
          .eq('client_id', clientId)
          .eq('sprint_number', sprintNumber)
          .order('week_number', { ascending: true }),
        supabase
          .from('life_alignment_scores')
          .select('*')
          .eq('client_id', clientId)
          .eq('sprint_number', sprintNumber)
          .order('week_number', { ascending: true }),
      ]);
      if (pulseRes.error) {
        console.warn('[useLifeAlignment] pulse fetch error:', pulseRes.error);
      } else {
        setPulse((pulseRes.data as LifePulseEntry[]) ?? []);
      }
      if (scoresRes.error) {
        console.warn('[useLifeAlignment] scores fetch error:', scoresRes.error);
      } else {
        setScores((scoresRes.data as LifeAlignmentScoreRow[]) ?? []);
      }
    } catch (err) {
      console.warn('[useLifeAlignment] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, sprintNumber]);

  useEffect(() => {
    fetchPulseAndScores();
  }, [fetchPulseAndScores]);

  const hasPulseThisWeek = pulse.some((p) => p.week_number === currentWeek);
  const hasPulseForWeek = (weekNum: number) => pulse.some((p) => p.week_number === weekNum);
  const pulseWeeks = new Set(pulse.map(p => p.week_number));

  const latestScore = scores.length > 0 ? scores[scores.length - 1] : null;
  const currentScore = latestScore != null ? Number(latestScore.overall_score) : null;
  const trend: 'up' | 'down' | 'stable' = latestScore?.trend ?? 'stable';
  const categoryScores: Record<string, number> = latestScore?.category_scores ?? {};

  const recalculateScore = useCallback(async () => {
    if (!clientId || !practiceId || sprintNumber < 1 || currentWeek < 1) return;
    try {
      const [
        { data: lifeTasks },
        { data: existingScores },
      ] = await Promise.all([
        supabase
          .from('client_tasks')
          .select('id, week_number, status, category')
          .eq('client_id', clientId)
          .eq('sprint_number', sprintNumber)
          .like('category', 'life_%'),
        supabase
          .from('life_alignment_scores')
          .select('*')
          .eq('client_id', clientId)
          .eq('sprint_number', sprintNumber)
          .order('week_number', { ascending: true }),
      ]);

      const tasks = lifeTasks ?? [];
      const scoresThisSprint = (existingScores as LifeAlignmentScoreRow[]) ?? [];
      const totalLifeTasks = tasks.length;
      const completedLifeTasks = tasks.filter((t: any) => t.status === 'completed');
      const taskCompletionScore = totalLifeTasks > 0
        ? Math.round((completedLifeTasks.length / totalLifeTasks) * 10000) / 100
        : 0;

      const { data: pulseRows } = await supabase
        .from('life_pulse_entries')
        .select('alignment_rating')
        .eq('client_id', clientId)
        .eq('sprint_number', sprintNumber);
      const pulseThisSprint = pulseRows ?? [];
      const avgPulseRating = pulseThisSprint.length > 0
        ? pulseThisSprint.reduce((s: number, p: { alignment_rating: number }) => s + p.alignment_rating, 0) / pulseThisSprint.length
        : 0;
      const pulseAlignmentScore = Math.round((avgPulseRating / 5) * 10000) / 100;

      // Derive hours adherence from real weekly check-in data ("yes" / "mostly" / "no")
      // rather than a hard-coded floor. weekly_checkins uses sprint_id (FK to
      // roadmap_stages), not sprint_number — look up the active sprint stage
      // for this client and filter by that.
      const { data: activeSprintStage } = await supabase
        .from('roadmap_stages')
        .select('id')
        .eq('client_id', clientId)
        .in('stage_type', ['sprint_plan', 'sprint_plan_part2'])
        .in('status', ['generated', 'approved', 'published'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let checkinQuery = supabase
        .from('weekly_checkins')
        .select('time_protected')
        .eq('client_id', clientId);
      if (activeSprintStage?.id) {
        checkinQuery = checkinQuery.eq('sprint_id', activeSprintStage.id);
      }
      const { data: checkinRows } = await checkinQuery;
      const checkins = checkinRows ?? [];
      const hoursAdherenceScore = checkins.length > 0
        ? Math.round(
            (checkins.reduce((sum: number, c: { time_protected: string }) => {
              const v = String(c.time_protected || '').toLowerCase();
              if (v === 'yes') return sum + 100;
              if (v === 'mostly') return sum + 60;
              if (v === 'no') return sum + 20;
              return sum;
            }, 0) /
              checkins.length) * 100
          ) / 100
        : 0;

      const categoriesWithCompletion = new Set(
        completedLifeTasks.map((t: any) => t.category).filter(Boolean)
      );
      const categoryDiversityScore = Math.round((categoriesWithCompletion.size / 5) * 10000) / 100;

      const overall = Math.min(
        100,
        Math.max(
          0,
          taskCompletionScore * 0.4 +
            pulseAlignmentScore * 0.3 +
            hoursAdherenceScore * 0.2 +
            categoryDiversityScore * 0.1
        )
      );
      const overallRounded = Math.round(overall * 100) / 100;

      const prevWeekScoreRow = scoresThisSprint.find((s) => s.week_number === currentWeek - 1);
      const prevOverall = prevWeekScoreRow != null ? Number(prevWeekScoreRow.overall_score) : null;
      let trendVal: 'up' | 'down' | 'stable' = 'stable';
      if (prevOverall != null) {
        const diff = overallRounded - prevOverall;
        if (diff > 5) trendVal = 'up';
        else if (diff < -5) trendVal = 'down';
      }

      const categoryScoresMap: Record<string, number> = {};
      for (const cat of LIFE_CATEGORIES) {
        const catTasks = tasks.filter((t: any) => t.category === cat);
        const catCompleted = catTasks.filter((t: any) => t.status === 'completed').length;
        categoryScoresMap[cat] = catTasks.length > 0
          ? Math.round((catCompleted / catTasks.length) * 10000) / 100
          : 0;
      }

      const row = {
        client_id: clientId,
        practice_id: practiceId,
        sprint_number: sprintNumber,
        week_number: currentWeek,
        task_completion_score: taskCompletionScore,
        pulse_alignment_score: pulseAlignmentScore,
        hours_adherence_score: hoursAdherenceScore,
        category_diversity_score: categoryDiversityScore,
        overall_score: overallRounded,
        trend: trendVal,
        category_scores: categoryScoresMap,
      };

      const { error } = await supabase.from('life_alignment_scores').upsert(row, {
        onConflict: 'client_id,sprint_number,week_number',
      });
      if (error) {
        console.warn('[useLifeAlignment] upsert score error:', error);
        return;
      }
      await fetchPulseAndScores();
    } catch (err) {
      console.warn('[useLifeAlignment] recalculate error:', err);
    }
  }, [clientId, practiceId, sprintNumber, currentWeek, fetchPulseAndScores]);

  const submitPulse = useCallback(
    async (rating: number, categories: string[], protectText?: string) => {
      if (!clientId || !practiceId || sprintNumber < 1 || currentWeek < 1) {
        throw new Error('Cannot submit pulse: missing client/sprint/week context.');
      }
      const { error } = await supabase.from('life_pulse_entries').upsert(
        {
          client_id: clientId,
          practice_id: practiceId,
          sprint_number: sprintNumber,
          week_number: currentWeek,
          alignment_rating: rating,
          active_categories: categories,
          protect_next_week: protectText?.trim() || null,
        },
        { onConflict: 'client_id,sprint_number,week_number' }
      );
      if (error) {
        // Surface the error so the UI doesn't optimistically show "saved" while
        // the row was actually rejected (e.g. by RLS).
        console.error('[useLifeAlignment] submit pulse error:', error);
        throw new Error(error.message || 'Failed to save Life Pulse.');
      }
      await fetchPulseAndScores();
      await recalculateScore();
    },
    [clientId, practiceId, sprintNumber, currentWeek, fetchPulseAndScores, recalculateScore]
  );

  return {
    pulse,
    scores,
    currentScore,
    trend,
    categoryScores,
    submitPulse,
    recalculateScore,
    hasPulseThisWeek,
    hasPulseForWeek,
    pulseWeeks,
    loading,
    refetch: fetchPulseAndScores,
  };
}
