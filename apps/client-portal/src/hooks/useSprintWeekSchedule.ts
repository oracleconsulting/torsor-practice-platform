// ============================================================================
// useSprintWeekSchedule — Rolling week start dates from sprint_week_schedule
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useSprintWeekSchedule(sprintNumber: number) {
  const { clientSession } = useAuth();
  const clientId = clientSession?.clientId ?? null;
  const [weekStartsByNumber, setWeekStartsByNumber] = useState<Map<number, Date>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    if (!clientId || sprintNumber < 1) {
      setWeekStartsByNumber(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sprint_week_schedule')
        .select('week_number, starts_on')
        .eq('client_id', clientId)
        .eq('sprint_number', sprintNumber)
        .order('week_number', { ascending: true });
      if (error) {
        console.warn('[useSprintWeekSchedule] fetch error:', error);
        setWeekStartsByNumber(new Map());
      } else {
        const map = new Map<number, Date>();
        for (const row of data ?? []) {
          // Parse as local calendar date (avoid UTC midnight shift)
          const [y, m, d] = String(row.starts_on).split('-').map(Number);
          map.set(row.week_number, new Date(y, m - 1, d));
        }
        setWeekStartsByNumber(map);
      }
    } catch (err) {
      console.warn('[useSprintWeekSchedule] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, sprintNumber]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const ensureWeek1 = useCallback(
    async (startsOn: string) => {
      if (!clientId || !clientSession?.practiceId || sprintNumber < 1) return;
      const { error } = await supabase.from('sprint_week_schedule').upsert(
        {
          client_id: clientId,
          practice_id: clientSession.practiceId,
          sprint_number: sprintNumber,
          week_number: 1,
          starts_on: startsOn,
          source: 'initial',
        },
        { onConflict: 'client_id,sprint_number,week_number' },
      );
      if (error) {
        console.warn('[useSprintWeekSchedule] ensureWeek1 error:', error);
        return;
      }
      await fetchSchedule();
    },
    [clientId, clientSession?.practiceId, sprintNumber, fetchSchedule],
  );

  return {
    weekStartsByNumber,
    loading,
    refetch: fetchSchedule,
    ensureWeek1,
  };
}
