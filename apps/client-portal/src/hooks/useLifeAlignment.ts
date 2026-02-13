// ============================================================================
// useLifeAlignment — Life Alignment Score from weekly check-ins
// ============================================================================
// Fetches last 4 weeks of weekly_checkins and computes a rolling score:
// - lifeSatisfaction 40% (1–5 → 0–100)
// - timeProtected 40% (yes=100, mostly=60, no=20)
// - lifeTaskCompletion 20% (from client_tasks where category starts with 'life_')
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface LifeAlignmentResult {
  score: number;
  trend: 'up' | 'stable' | 'down';
  weeklyScores: number[];
  lastCheckIn?: { weekNumber: number; lifeSatisfaction: number; timeProtected: string };
}

function timeProtectedToScore(tp: string | null): number {
  if (tp === 'yes') return 100;
  if (tp === 'mostly') return 60;
  if (tp === 'no') return 20;
  return 0;
}

export function useLifeAlignment(sprintId?: string | null): {
  data: LifeAlignmentResult | null;
  loading: boolean;
  error: Error | null;
} {
  const { clientSession } = useAuth();
  const clientId = clientSession?.clientId ?? null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['lifeAlignment', clientId, sprintId],
    queryFn: async (): Promise<LifeAlignmentResult | null> => {
      if (!clientId) return null;

      const { data: checkins, error: checkinsError } = await supabase
        .from('weekly_checkins')
        .select('week_number, life_satisfaction, time_protected, life_alignment_score')
        .eq('client_id', clientId)
        .order('week_number', { ascending: false })
        .limit(4);

      if (checkinsError) throw checkinsError;
      if (!checkins?.length) {
        return { score: 0, trend: 'stable', weeklyScores: [] };
      }

      const weeklyScores = checkins.map((c) => {
        const sat = (c.life_satisfaction != null ? (Number(c.life_satisfaction) / 5) * 100 : 0);
        const tp = timeProtectedToScore(c.time_protected);
        return c.life_alignment_score != null ? Number(c.life_alignment_score) : sat * 0.4 + tp * 0.4;
      });

      const score = weeklyScores.length > 0
        ? weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length
        : 0;

      let trend: 'up' | 'stable' | 'down' = 'stable';
      if (weeklyScores.length >= 2) {
        const recent = weeklyScores[0];
        const older = weeklyScores[weeklyScores.length - 1];
        if (recent - older >= 5) trend = 'up';
        else if (older - recent >= 5) trend = 'down';
      }

      const last = checkins[0];
      return {
        score: Math.round(score * 10) / 10,
        trend,
        weeklyScores,
        lastCheckIn: last
          ? {
              weekNumber: last.week_number,
              lifeSatisfaction: last.life_satisfaction ?? 0,
              timeProtected: last.time_protected ?? '',
            }
          : undefined,
      };
    },
    enabled: !!clientId,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error as Error | null,
  };
}
