import { describe, expect, it } from 'vitest';
import {
  computeWeekGating,
  isPulseUnlockPathReachable,
  weekLockReason,
  formatWeekStartLabel,
} from './weekGating';
import { shouldShowCheckpointReview } from '../../hooks/useCheckpointReview';

function week(n: number, titles: string[]) {
  return {
    weekNumber: n,
    tasks: titles.map((title) => ({ title })),
  };
}

function dbTask(week_number: number, title: string, status: string) {
  return { week_number, title, status, sort_order: 0 };
}

describe('computeWeekGating + rolling schedule unlock path', () => {
  const weeks = [
    week(1, ['W1a', 'W1b']),
    week(2, ['W2a', 'W2b']),
    week(3, ['W3a', 'W3b', 'W3c']),
    week(4, ['W4a']),
  ];

  const tasksAllResolvedThrough3 = [
    dbTask(1, 'W1a', 'completed'),
    dbTask(1, 'W1b', 'skipped'),
    dbTask(2, 'W2a', 'completed'),
    dbTask(2, 'W2b', 'completed'),
    dbTask(3, 'W3a', 'completed'),
    dbTask(3, 'W3b', 'skipped'),
    dbTask(3, 'W3c', 'skipped'),
  ];

  it('holds activeWeek when tasks are done but pulse is missing', () => {
    const gating = computeWeekGating(
      weeks,
      tasksAllResolvedThrough3,
      new Set([1, 2]),
      '2026-05-01',
      false,
    );
    expect(gating.activeWeek).toBe(3);
    expect(gating.needsPulse(3)).toBe(true);
    expect(gating.isWeekLocked(4)).toBe(true);
    expect(weekLockReason(gating).kind).toBe('pulse');
  });

  it('does not briefly unlock while pulse rows are still loading', () => {
    const gating = computeWeekGating(
      weeks,
      tasksAllResolvedThrough3,
      new Set([1, 2, 3]),
      '2026-05-01',
      true,
    );
    expect(gating.resolvedWeeks).toEqual([]);
    expect(gating.activeWeek).toBe(1);
  });

  it('unlocks week 4 once week 3 pulse is present', () => {
    const gating = computeWeekGating(
      weeks,
      tasksAllResolvedThrough3,
      new Set([1, 2, 3]),
      '2026-05-01',
      false,
    );
    expect(gating.activeWeek).toBe(4);
    expect(gating.needsPulse(3)).toBe(false);
  });

  it('prefers stored schedule dates over fixed derivation', () => {
    // Keep this clearly in the future relative to "today" so phase stays scheduled
    const futureStart = new Date(2099, 0, 5); // Monday 5 Jan 2099
    const schedule = new Map<number, Date>([[4, futureStart]]);
    const gating = computeWeekGating(
      weeks,
      tasksAllResolvedThrough3,
      new Set([1, 2, 3]),
      '2026-05-01',
      false,
      schedule,
    );
    expect(gating.weekStartDate(4)?.toDateString()).toBe(futureStart.toDateString());
    expect(formatWeekStartLabel(gating.weekStartDate(4))).toMatch(/Starts Monday/);
    // Week 4 is the active week with a future start → scheduled (expandable, not locked)
    expect(gating.weekPhase(4)).toBe('scheduled');
    expect(gating.isWeekExpandable(4)).toBe(true);
    expect(gating.isWeekActionable(4)).toBe(false);
    expect(gating.weekPhase(5)).toBe('locked');
    expect(gating.isWeekExpandable(5)).toBe(false);
  });

  it('keeps a reachable unlock path via inline pulse (no page-level block)', () => {
    const gating = computeWeekGating(
      weeks,
      tasksAllResolvedThrough3,
      new Set([1, 2]),
      '2026-05-01',
      false,
    );
    expect(gating.needsPulse(gating.activeWeek)).toBe(true);
    expect(gating.weekPhase(3)).toBe('active');
    expect(
      isPulseUnlockPathReachable({
        needsPulse: true,
        showInlinePulseWhenNeedsPulse: true,
        catchUpCollectsPulse: true,
      }),
    ).toBe(true);
  });
});

describe('checkpoint review never gates progression', () => {
  const weeksThrough10 = Array.from({ length: 10 }, (_, i) =>
    week(i + 1, [`W${i + 1}a`, `W${i + 1}b`]),
  );

  function resolveThrough(n: number) {
    const tasks = [];
    for (let w = 1; w <= n; w++) {
      tasks.push(dbTask(w, `W${w}a`, 'completed'));
      tasks.push(dbTask(w, `W${w}b`, 'skipped'));
    }
    return tasks;
  }

  it('a client with no sprint_checkpoint_reviews progresses through weeks 3, 6 and 9', () => {
    // No review input is passed — absence of reviews must not hold the gate.
    const gating = computeWeekGating(
      weeksThrough10,
      resolveThrough(9),
      new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      '2026-05-01',
      false,
    );
    expect(gating.activeWeek).toBe(10);
    expect(gating.weekPhase(3)).toBe('resolved');
    expect(gating.weekPhase(6)).toBe('resolved');
    expect(gating.weekPhase(9)).toBe('resolved');
  });

  it('computeWeekGating takes no checkpoint review input and its signature is unchanged', () => {
    // weeks, dbTasks, pulseWeeks?, sprintStartDate?, pulseLoading?, weekStartsByNumber?
    expect(computeWeekGating.length).toBe(6);
    const gating = computeWeekGating(
      weeksThrough10,
      resolveThrough(3),
      new Set([1, 2, 3]),
      '2026-05-01',
      false,
    );
    expect(gating.activeWeek).toBe(4);
  });

  it('review renders for a client who is behind schedule (no !isBehind wrapper)', () => {
    expect(
      shouldShowCheckpointReview({
        weekNumber: 3,
        hasPulseForWeek: true,
        isBehind: true,
      }),
    ).toBe(true);
    expect(
      shouldShowCheckpointReview({
        weekNumber: 6,
        hasPulseForWeek: true,
        isBehind: true,
      }),
    ).toBe(true);
    expect(
      shouldShowCheckpointReview({
        weekNumber: 9,
        hasPulseForWeek: true,
        isBehind: true,
      }),
    ).toBe(true);
    expect(
      shouldShowCheckpointReview({
        weekNumber: 3,
        hasPulseForWeek: false,
        isBehind: false,
      }),
    ).toBe(false);
    expect(
      shouldShowCheckpointReview({
        weekNumber: 4,
        hasPulseForWeek: true,
        isBehind: false,
      }),
    ).toBe(false);
  });
});
