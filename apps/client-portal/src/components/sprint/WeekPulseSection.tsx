// ============================================================================
// WeekPulseSection — Single source of truth for per-week Life Pulse UI
// ============================================================================
// Renders exactly one of: read-only submitted summary | close-out form | nothing.
// Never renders a form for a locked week (caller must gate that).
// ============================================================================

import { LifePulseCard } from '@/components/sprint/LifePulseCard';
import type { PulseByWeekEntry } from '@/hooks/useLifeAlignment';

export function WeekPulseSection({
  weekNumber,
  sprintNumber,
  existingPulse,
  needsPulse,
  isCatchUp = false,
  onSubmit,
  loading = false,
  currentScore = null,
}: {
  weekNumber: number;
  sprintNumber: number;
  existingPulse?: PulseByWeekEntry | null;
  needsPulse: boolean;
  isCatchUp?: boolean;
  onSubmit: (rating: number, categories: string[], protectText?: string) => Promise<void>;
  loading?: boolean;
  currentScore?: number | null;
}) {
  if (existingPulse) {
    return (
      <LifePulseCard
        sprintNumber={sprintNumber}
        weekNumber={weekNumber}
        existingPulse={existingPulse}
      />
    );
  }

  if (!needsPulse) return null;

  return (
    <div className="ring-2 ring-rose-300/40 rounded-xl">
      <LifePulseCard
        sprintNumber={sprintNumber}
        weekNumber={weekNumber}
        isCatchUp={isCatchUp}
        formHeading={`Close out Week ${weekNumber}`}
        onSubmit={onSubmit}
        loading={loading}
        currentScore={currentScore}
      />
    </div>
  );
}
