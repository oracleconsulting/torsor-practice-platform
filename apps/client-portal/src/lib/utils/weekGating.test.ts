import { describe, expect, it } from 'vitest';
import {
  computeWeekGating,
  isPulseUnlockPathReachable,
  weekLockReason,
  formatWeekStartLabel,
} from './weekGating';

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
    const schedule = new Map<number, Date>([[4, new Date(2026, 7, 3)]]);
    const gating = computeWeekGating(
      weeks,
      tasksAllResolvedThrough3,
      new Set([1, 2, 3]),
      '2026-05-01',
      false,
      schedule,
    );
    expect(gating.weekStartDate(4)?.toDateString()).toBe(new Date(2026, 7, 3).toDateString());
    expect(formatWeekStartLabel(gating.weekStartDate(4))).toMatch(/Starts Monday/);
    expect(weekLockReason(gating, 4).label).toMatch(/Starts Monday/);
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
    expect(
      isPulseUnlockPathReachable({
        needsPulse: true,
        showInlinePulseWhenNeedsPulse: true,
        catchUpCollectsPulse: true,
      }),
    ).toBe(true);
  });
});
