// ============================================================================
// useProgress — Client value tracker: snapshots, wins, hero stats, chart, value story
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProgressSnapshot {
  id: string;
  client_id: string;
  practice_id: string;
  sprint_number: number;
  week_number: number;
  total_tasks: number;
  completed_tasks: number;
  skipped_tasks: number;
  life_tasks_total: number;
  life_tasks_completed: number;
  business_tasks_total: number;
  business_tasks_completed: number;
  completion_rate: number;
  baseline_weekly_hours: number | null;
  target_weekly_hours: number | null;
  estimated_weekly_hours: number | null;
  hours_reclaimed: number | null;
  life_alignment_score: number | null;
  milestones: unknown[];
  financial_snapshot: Record<string, unknown>;
  calculated_at: string;
}

export interface ClientWin {
  id: string;
  client_id: string;
  practice_id: string;
  sprint_number: number;
  week_number: number | null;
  title: string;
  description: string | null;
  category: string;
  source: string;
  is_highlighted: boolean;
  created_at: string;
}

export interface HeroStats {
  hoursReclaimed: number | null;
  totalTasksCompleted: number;
  lifeAlignmentScore: number | null;
  sprintsCompleted: number;
  completionRate: number;
}

export interface ValueStoryData {
  starting: { hours?: number; income?: number; painPoint?: string };
  current: { tasksCompleted: number; completionRate: number; sprintNumber: number };
  heading: { vision?: string; year1Goal?: string };
}

export function useProgress() {
  const { clientSession } = useAuth();
  const clientId = clientSession?.clientId ?? null;
  const practiceId = clientSession?.practiceId ?? null;

  const [snapshots, setSnapshots] = useState<ProgressSnapshot[]>([]);
  const [wins, setWins] = useState<ClientWin[]>([]);
  const [fitProfile, setFitProfile] = useState<Record<string, unknown> | null>(null);
  const [valueAnalysis, setValueAnalysis] = useState<Record<string, unknown> | null>(null);
  const [vision, setVision] = useState<Record<string, unknown> | null>(null);
  const [currentSprint, setCurrentSprint] = useState(1);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!clientId) {
      setSnapshots([]);
      setWins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [
        snapRes,
        winsRes,
        stagesRes,
        enrollmentRes,
        lifeScoresRes,
      ] = await Promise.all([
        supabase
          .from('client_progress_snapshots')
          .select('*')
          .eq('client_id', clientId)
          .order('sprint_number', { ascending: true })
          .order('week_number', { ascending: true }),
        supabase
          .from('client_wins')
          .select('*')
          .eq('client_id', clientId)
          .order('is_highlighted', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('roadmap_stages')
          .select('stage_type, generated_content, approved_content')
          .eq('client_id', clientId)
          .in('stage_type', ['fit_assessment', 'value_analysis', 'five_year_vision'])
          .in('status', ['generated', 'approved', 'published']),
        supabase
          .from('service_lines')
          .select('id')
          .eq('code', '365_method')
          .maybeSingle()
          .then(async ({ data: sl }) => {
            if (!sl?.id) return null;
            const { data } = await supabase
              .from('client_service_lines')
              .select('current_sprint_number')
              .eq('client_id', clientId)
              .eq('service_line_id', sl.id)
              .maybeSingle();
            return data;
          }),
        supabase
          .from('life_alignment_scores')
          .select('week_number, overall_score')
          .eq('client_id', clientId)
          .order('sprint_number', { ascending: false })
          .order('week_number', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const snapData = (snapRes.data as ProgressSnapshot[]) ?? [];
      setSnapshots(snapData);

      const winsData = (winsRes.data as ClientWin[]) ?? [];
      setWins(winsData.sort((a, b) => (b.is_highlighted ? 1 : 0) - (a.is_highlighted ? 1 : 0)));

      const stages = (stagesRes.data as Array<{ stage_type: string; generated_content: unknown; approved_content: unknown }>) ?? [];
      stages.forEach(s => {
        const content = (s.approved_content ?? s.generated_content) as Record<string, unknown> | null;
        if (!content) return;
        if (s.stage_type === 'fit_assessment') setFitProfile(content);
        if (s.stage_type === 'value_analysis') setValueAnalysis(content);
        if (s.stage_type === 'five_year_vision') setVision(content);
      });

      const enrollment = enrollmentRes as { current_sprint_number?: number } | null;
      if (enrollment?.current_sprint_number != null) setCurrentSprint(enrollment.current_sprint_number);

      const lifeScoreRow = lifeScoresRes.data as { week_number: number; overall_score: number } | null;
      if (lifeScoreRow != null) setCurrentWeek(lifeScoreRow.week_number);
    } catch (err) {
      console.warn('[useProgress] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const recalculate = useCallback(async () => {
    if (!clientId || !practiceId) return;
    try {
      const { data: sl } = await supabase.from('service_lines').select('id').eq('code', '365_method').maybeSingle();
      if (!sl?.id) return;
      const { data: enrollment } = await supabase
        .from('client_service_lines')
        .select('current_sprint_number')
        .eq('client_id', clientId)
        .eq('service_line_id', sl.id)
        .maybeSingle();
      const sprintNumber = enrollment?.current_sprint_number ?? 1;

      const { data: tasks } = await supabase
        .from('client_tasks')
        .select('week_number, status, category')
        .eq('client_id', clientId)
        .eq('sprint_number', sprintNumber);

      const weekNumbers = [...new Set((tasks ?? []).map((t: { week_number: number }) => t.week_number))].filter(Boolean) as number[];
      const weekToUse = weekNumbers.length > 0 ? Math.max(...weekNumbers) : 1;

      const list = tasks ?? [];
      const total = list.length;
      const completed = list.filter((t: { status: string }) => t.status === 'completed').length;
      const skipped = list.filter((t: { status: string }) => t.status === 'skipped').length;
      const lifeList = list.filter((t: { category?: string }) => (t.category ?? '').startsWith('life_'));
      const lifeTotal = lifeList.length;
      const lifeCompleted = lifeList.filter((t: { status: string }) => t.status === 'completed').length;
      const businessTotal = total - lifeTotal;
      const businessCompleted = completed - lifeCompleted;
      const completionRate = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

      let baselineHours: number | null = null;
      let targetHours: number | null = null;
      if (fitProfile) {
        const fp = fitProfile as Record<string, unknown>;
        if (typeof fp.currentWeeklyHours === 'number') baselineHours = fp.currentWeeklyHours;
        if (typeof fp.targetWeeklyHours === 'number') targetHours = fp.targetWeeklyHours;
        const lifeDesign = fp.lifeDesignProfile as Record<string, unknown> | undefined;
        if (lifeDesign && typeof (lifeDesign as any).targetWeeklyHours === 'number') targetHours = (lifeDesign as any).targetWeeklyHours;
      }

      let lifeAlignmentScore: number | null = null;
      try {
        const { data: scoreRow } = await supabase
          .from('life_alignment_scores')
          .select('overall_score')
          .eq('client_id', clientId)
          .eq('sprint_number', sprintNumber)
          .eq('week_number', weekToUse)
          .maybeSingle();
        if (scoreRow?.overall_score != null) lifeAlignmentScore = Number(scoreRow.overall_score);
      } catch {
        // ignore
      }

      const hoursReclaimed = baselineHours != null && targetHours != null && baselineHours > targetHours
        ? Math.round((baselineHours - targetHours) * 10) / 10
        : null;

      const row = {
        client_id: clientId,
        practice_id: practiceId,
        sprint_number: sprintNumber,
        week_number: weekToUse,
        total_tasks: total,
        completed_tasks: completed,
        skipped_tasks: skipped,
        life_tasks_total: lifeTotal,
        life_tasks_completed: lifeCompleted,
        business_tasks_total: businessTotal,
        business_tasks_completed: businessCompleted,
        completion_rate: completionRate,
        baseline_weekly_hours: baselineHours,
        target_weekly_hours: targetHours,
        estimated_weekly_hours: null,
        hours_reclaimed: hoursReclaimed,
        life_alignment_score: lifeAlignmentScore,
        milestones: [],
        financial_snapshot: {},
      };

      await supabase.from('client_progress_snapshots').upsert(row, {
        onConflict: 'client_id,sprint_number,week_number',
      });
      await fetchAll();
    } catch (err) {
      console.warn('[useProgress] recalculate error:', err);
    }
  }, [clientId, practiceId, fitProfile, fetchAll]);

  const heroStats: HeroStats = useMemo(() => {
    const totalTasksCompleted = snapshots.reduce((s, n) => s + (n.completed_tasks ?? 0), 0);
    const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    const completionRate = latest?.completion_rate ?? 0;
    const lifeAlignmentScore = latest?.life_alignment_score ?? null;
    const hoursReclaimed = latest?.hours_reclaimed ?? null;
    const sprintsWithHighCompletion = new Set(
      snapshots.filter(s => (s.completion_rate ?? 0) >= 80).map(s => s.sprint_number)
    );
    const sprintsCompleted = sprintsWithHighCompletion.size;
    return {
      hoursReclaimed,
      totalTasksCompleted,
      lifeAlignmentScore,
      sprintsCompleted,
      completionRate,
    };
  }, [snapshots]);

  const totalSprints = useMemo(() => {
    const max = snapshots.reduce((m, s) => Math.max(m, s.sprint_number), 0);
    return Math.max(1, max);
  }, [snapshots]);

  const chartData = useMemo(() => {
    const multiSprint = snapshots.some((s, i, a) => a[0] && a[0].sprint_number !== s.sprint_number);
    return snapshots.map(s => ({
      week: multiSprint ? `S${s.sprint_number}W${s.week_number}` : `W${s.week_number}`,
      completionRate: s.completion_rate ?? 0,
      lifeScore: s.life_alignment_score ?? null,
    }));
  }, [snapshots]);

  const valueStory: ValueStoryData = useMemo(() => {
    const fp = fitProfile as Record<string, unknown> | null;
    const hours = fp && typeof fp.currentWeeklyHours === 'number' ? fp.currentWeeklyHours : undefined;
    const income = fp && typeof (fp as any).currentMonthlyIncome === 'number' ? (fp as any).currentMonthlyIncome : undefined;
    const painPoint = fp && typeof (fp as any).mondayFrustration === 'string' ? (fp as any).mondayFrustration : undefined;
    const visionContent = vision as Record<string, unknown> | null;
    const visionText = visionContent?.vision as string | undefined;
    const year1 = visionContent?.yearMilestones as Record<string, string> | undefined;
    const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    return {
      starting: { hours, income, painPoint },
      current: {
        tasksCompleted: heroStats.totalTasksCompleted,
        completionRate: heroStats.completionRate,
        sprintNumber: currentSprint,
      },
      heading: {
        vision: visionText?.slice(0, 100),
        year1Goal: year1?.year1,
      },
    };
  }, [fitProfile, vision, snapshots, heroStats.totalTasksCompleted, heroStats.completionRate, currentSprint]);

  return {
    snapshots,
    wins,
    heroStats,
    chartData,
    valueStory,
    totalSprints,
    currentSprint,
    loading,
    recalculate,
    fetchAll,
  };
}
