import { matchWeekTasks, isTaskResolved } from './taskMatching';

export type WeekGating = {
  activeWeek: number;
  resolvedWeeks: number[];
  lockedWeeks: number[];
  isWeekResolved: (weekNum: number) => boolean;
  isWeekLocked: (weekNum: number) => boolean;
  /** Weeks where tasks are done but pulse is missing */
  needsPulse: (weekNum: number) => boolean;
  /**
   * True when the calendar has reached this week's start date AND the previous
   * week is fully resolved. Drives whether tasks for this week can be marked
   * in_progress / completed. Weeks before activeWeek are always actionable.
   * If `sprintStartDate` is null, every visible week is actionable (legacy).
   */
  isWeekActionable: (weekNum: number) => boolean;
  /**
   * Returns the calendar date this week first becomes actionable (i.e. tasks
   * can be marked done). Null if `sprintStartDate` is not set yet.
   */
  weekStartDate: (weekNum: number) => Date | null;
};

/**
 * Sequential week unlock: tasks must be resolved AND a life pulse submitted.
 * Stops at the first unresolved week.
 *
 * While `pulseLoading` is true, missing pulses are treated as outstanding so
 * we never briefly unlock weeks before pulse rows have loaded.
 * When `pulseWeeks` is omitted entirely and not loading, the pulse gate is
 * skipped (legacy callers).
 */
export function computeWeekGating(
  weeks: any[],
  dbTasks: any[],
  pulseWeeks?: Set<number>,
  sprintStartDate?: string | null,
  pulseLoading?: boolean,
): WeekGating {
  const resolvedWeeks: number[] = [];
  const tasksDoneWeeks: number[] = [];

  for (let i = 0; i < (weeks?.length || 0); i++) {
    const week = weeks[i];
    const weekNum = week?.weekNumber ?? week?.week ?? (i + 1);
    const generatedTasks = week?.tasks || [];

    const matches = matchWeekTasks(generatedTasks, dbTasks, weekNum);
    const allTasksDone =
      generatedTasks.length > 0 &&
      matches.every((m) => m !== null && isTaskResolved(m.status));

    if (allTasksDone) {
      tasksDoneWeeks.push(weekNum);
      const hasPulse = pulseLoading
        ? false
        : pulseWeeks == null
          ? true
          : pulseWeeks.has(weekNum);
      if (hasPulse) {
        resolvedWeeks.push(weekNum);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  const activeWeek =
    resolvedWeeks.length > 0
      ? Math.min(resolvedWeeks[resolvedWeeks.length - 1] + 1, 12)
      : 1;

  const lockedWeeks = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (w) => w > activeWeek && !resolvedWeeks.includes(w),
  );

  const weekStartDate = (weekNum: number): Date | null => {
    if (!sprintStartDate) return null;
    const start = new Date(sprintStartDate);
    if (Number.isNaN(start.getTime())) return null;
    const d = new Date(start);
    d.setDate(d.getDate() + (weekNum - 1) * 7);
    return d;
  };

  const isWeekActionable = (weekNum: number): boolean => {
    if (resolvedWeeks.includes(weekNum)) return true;
    if (!sprintStartDate) return true;
    const startDate = weekStartDate(weekNum);
    if (!startDate) return true;
    const now = new Date();
    return now.getTime() >= startDate.getTime();
  };

  return {
    activeWeek,
    resolvedWeeks,
    lockedWeeks,
    isWeekResolved: (w) => resolvedWeeks.includes(w),
    isWeekLocked: (w) => lockedWeeks.includes(w),
    needsPulse: (w) => tasksDoneWeeks.includes(w) && !resolvedWeeks.includes(w),
    isWeekActionable,
    weekStartDate,
  };
}

/**
 * Highest week number where every generated task has a matching DB task in
 * completed/skipped status. Used as the target week for the Life Pulse so it
 * gets saved against the week the client is closing out — NOT the next week
 * they haven't started yet. Defaults to 1 when no week is fully done.
 */
export function getPulseTargetWeek(weeks: any[], dbTasks: any[]): number {
  let lastDoneWeek = 0;
  for (let i = 0; i < (weeks?.length || 0); i++) {
    const week = weeks[i];
    const weekNum = week?.weekNumber ?? week?.week ?? (i + 1);
    const generatedTasks = week?.tasks || [];
    const matches = matchWeekTasks(generatedTasks, dbTasks, weekNum);
    const allDone =
      generatedTasks.length > 0 &&
      matches.every((m) => m !== null && isTaskResolved(m.status));
    if (allDone) {
      lastDoneWeek = weekNum;
    } else {
      break;
    }
  }
  return lastDoneWeek > 0 ? lastDoneWeek : 1;
}

/** Lock / tooltip copy distinguishing tasks vs pulse as the blocker. */
export function weekLockReason(
  gating: Pick<WeekGating, 'activeWeek' | 'needsPulse'>,
): { kind: 'tasks' | 'pulse'; label: string } {
  const n = gating.activeWeek;
  if (gating.needsPulse(n)) {
    return { kind: 'pulse', label: `Week ${n} pulse outstanding` };
  }
  return { kind: 'tasks', label: `Finish Week ${n} tasks` };
}

/**
 * Product rule: when pulse is the only gate holding activeWeek, the client
 * must have a reachable UI path — either the dashboard pulse card (shown
 * even when behind) or catch-up pulse collection.
 */
export function isPulseUnlockPathReachable(opts: {
  needsPulse: boolean;
  isBehind: boolean;
  showPulseCardWhenNeedsPulse: boolean;
  catchUpCollectsPulse: boolean;
}): boolean {
  if (!opts.needsPulse) return true;
  if (opts.showPulseCardWhenNeedsPulse) return true;
  if (opts.isBehind && opts.catchUpCollectsPulse) return true;
  return false;
}
