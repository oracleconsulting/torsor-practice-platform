// ============================================================================
// useCatchUpDetection — Dormancy-based catch-up offer (rolling schedule)
// ============================================================================
// "Weeks behind" a fixed calendar is meaningless once week starts re-anchor.
// Instead: days since the ACTIVE week's starts_on while that week is unclosed.
//   < 14 days  → normal
//   14–28 days → gentle "pick up where you left off"
//   > 28 days  → offer catch-up mode
// ============================================================================

export type DormancyLevel = 'none' | 'gentle' | 'catch_up';

export interface CatchUpState {
  /** True when dormant > 28 days — offer catch-up mode */
  isCatchUpNeeded: boolean;
  /** True when dormant 14–28 days — gentle nudge only */
  isGentleNudge: boolean;
  dormancyLevel: DormancyLevel;
  daysDormant: number;
  activeWeek: number;
  unresolvedWeeks: number[];
}

export function useCatchUpDetection(
  gating: { activeWeek: number; resolvedWeeks: number[]; weekStartDate: (n: number) => Date | null },
  totalWeeks: number = 12,
  now: Date = new Date(),
): CatchUpState {
  const activeWeek = gating.activeWeek;
  const start = gating.weekStartDate(activeWeek);

  let daysDormant = 0;
  if (start) {
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    daysDormant = Math.max(
      0,
      Math.floor((today.getTime() - startDay.getTime()) / (24 * 60 * 60 * 1000)),
    );
  }

  let dormancyLevel: DormancyLevel = 'none';
  if (daysDormant > 28) dormancyLevel = 'catch_up';
  else if (daysDormant >= 14) dormancyLevel = 'gentle';

  const unresolvedWeeks: number[] = [];
  if (activeWeek >= 1 && activeWeek <= totalWeeks && !gating.resolvedWeeks.includes(activeWeek)) {
    unresolvedWeeks.push(activeWeek);
  }

  return {
    isCatchUpNeeded: dormancyLevel === 'catch_up',
    isGentleNudge: dormancyLevel === 'gentle',
    dormancyLevel,
    daysDormant,
    activeWeek,
    unresolvedWeeks,
  };
}
