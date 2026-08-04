// ============================================================================
// useCheckpointReview — Optional mid-sprint reviews at weeks 3, 6, 9
// ============================================================================
// Never gates week progression. Loading starts true until the first fetch
// settles so callers do not treat an empty map as "no reviews yet" while
// data is still in flight.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const CHECKPOINT_WEEKS = [3, 6, 9] as const;
export type CheckpointWeek = (typeof CHECKPOINT_WEEKS)[number];

export type CapacityOutlook = 'lighter' | 'similar' | 'heavier';

export interface CheckpointReview {
  id?: string;
  clientId: string;
  practiceId: string;
  sprintNumber: number;
  checkpointWeek: CheckpointWeek;
  whatWorked: string | null;
  whatDidnt: string | null;
  whatsChanged: string | null;
  nextThreeWeeks: string | null;
  capacityOutlook: CapacityOutlook | null;
  createdAt: string;
  updatedAt: string;
}

export type CheckpointReviewInput = {
  whatWorked?: string | null;
  whatDidnt?: string | null;
  whatsChanged?: string | null;
  nextThreeWeeks?: string | null;
  capacityOutlook?: CapacityOutlook | null;
};

function rowToReview(row: any): CheckpointReview {
  return {
    id: row.id,
    clientId: row.client_id,
    practiceId: row.practice_id,
    sprintNumber: row.sprint_number,
    checkpointWeek: row.checkpoint_week as CheckpointWeek,
    whatWorked: row.what_worked ?? null,
    whatDidnt: row.what_didnt ?? null,
    whatsChanged: row.whats_changed ?? null,
    nextThreeWeeks: row.next_three_weeks ?? null,
    capacityOutlook: row.capacity_outlook ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isCheckpointWeek(week: number): week is CheckpointWeek {
  return (CHECKPOINT_WEEKS as readonly number[]).includes(week);
}

/**
 * Whether to show the checkpoint review UI.
 * Requires a submitted pulse for that week. Explicitly ignores isBehind —
 * never hide the review because the client is off the original calendar.
 */
export function shouldShowCheckpointReview(opts: {
  weekNumber: number;
  hasPulseForWeek: boolean;
  /** Ignored — present so callers remember not to gate on it */
  isBehind?: boolean;
}): boolean {
  if (!isCheckpointWeek(opts.weekNumber)) return false;
  if (!opts.hasPulseForWeek) return false;
  void opts.isBehind;
  return true;
}

export function useCheckpointReview(sprintNumber: number) {
  const { clientSession } = useAuth();
  const clientId = clientSession?.clientId ?? null;
  const practiceId = clientSession?.practiceId ?? null;

  const [reviewsByWeek, setReviewsByWeek] = useState<Map<number, CheckpointReview>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!clientId || sprintNumber < 1) {
      setReviewsByWeek(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sprint_checkpoint_reviews')
        .select('*')
        .eq('client_id', clientId)
        .eq('sprint_number', sprintNumber)
        .order('checkpoint_week', { ascending: true });
      if (error) {
        console.warn('[useCheckpointReview] fetch error:', error);
        setReviewsByWeek(new Map());
      } else {
        const map = new Map<number, CheckpointReview>();
        for (const row of data ?? []) {
          const review = rowToReview(row);
          map.set(review.checkpointWeek, review);
        }
        setReviewsByWeek(map);
      }
    } catch (err) {
      console.warn('[useCheckpointReview] fetch error:', err);
      setReviewsByWeek(new Map());
    } finally {
      setLoading(false);
    }
  }, [clientId, sprintNumber]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(
    async (checkpointWeek: CheckpointWeek, input: CheckpointReviewInput) => {
      if (!clientId || !practiceId || sprintNumber < 1) {
        throw new Error('Cannot submit checkpoint review: missing client context.');
      }
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('sprint_checkpoint_reviews')
        .upsert(
          {
            client_id: clientId,
            practice_id: practiceId,
            sprint_number: sprintNumber,
            checkpoint_week: checkpointWeek,
            what_worked: input.whatWorked?.trim() || null,
            what_didnt: input.whatDidnt?.trim() || null,
            whats_changed: input.whatsChanged?.trim() || null,
            next_three_weeks: input.nextThreeWeeks?.trim() || null,
            capacity_outlook: input.capacityOutlook ?? null,
            updated_at: now,
          },
          { onConflict: 'client_id,sprint_number,checkpoint_week' },
        )
        .select('*')
        .single();
      if (error) {
        console.error('[useCheckpointReview] submit error:', error);
        throw new Error(error.message || 'Failed to save checkpoint review.');
      }
      const review = rowToReview(data);
      setReviewsByWeek((prev) => {
        const next = new Map(prev);
        next.set(checkpointWeek, review);
        return next;
      });
      return review;
    },
    [clientId, practiceId, sprintNumber],
  );

  return {
    reviewsByWeek,
    loading,
    submitReview,
    refetch: fetchReviews,
  };
}
