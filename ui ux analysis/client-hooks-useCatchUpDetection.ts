// ============================================================================
// useCatchUpDetection — Determines if catch-up mode should be offered
// ============================================================================
// Trigger: client is 3+ weeks behind calendar. Unresolved weeks = activeWeek
// through calendarWeek that are not fully resolved.
// ============================================================================

export interface CatchUpState {
  isCatchUpNeeded: boolean;
  calendarWeek: number;
  activeWeek: number;
  weeksBehind: number;
  unresolvedWeeks: number[];
}

export function useCatchUpDetection(
  sprintStartDate: string | Date | null,
  gating: { activeWeek: number; resolvedWeeks: number[] },
  totalWeeks: number = 12,
): CatchUpState {
  const start = sprintStartDate ? new Date(sprintStartDate) : null;
  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;

  const calendarWeek =
    start != null
      ? Math.min(
          Math.max(1, Math.floor((now.getTime() - start.getTime()) / msPerWeek) + 1),
          totalWeeks,
        )
      : 1;

  const activeWeek = gating.activeWeek;
  const weeksBehind = Math.max(0, calendarWeek - activeWeek);
  const isCatchUpNeeded = weeksBehind >= 3;

  const unresolvedWeeks: number[] = [];
  for (let w = activeWeek; w <= Math.min(calendarWeek, totalWeeks); w++) {
    if (!gating.resolvedWeeks.includes(w)) {
      unresolvedWeeks.push(w);
    }
  }

  return {
    isCatchUpNeeded,
    calendarWeek,
    activeWeek,
    weeksBehind,
    unresolvedWeeks,
  };
}
