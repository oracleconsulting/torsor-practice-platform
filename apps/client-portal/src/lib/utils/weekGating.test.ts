import { describe, expect, it } from 'vitest';
import {
  computeWeekGating,
  isPulseUnlockPathReachable,
  weekLockReason,
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

describe('computeWeekGating + behind-schedule unlock path', () => {
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
      new Set([1, 2]), // no week 3 pulse
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
      new Set([1, 2, 3]), // would unlock if trusted
      '2026-05-01',
      true, // loading
    );
    expect(gating.needsPulse(1) || gating.activeWeek === 1).toBe(true);
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

  it('keeps a reachable unlock path when calendarWeek >> activeWeek (isBehind)', () => {
    const gating = computeWeekGating(
      weeks,
      tasksAllResolvedThrough3,
      new Set([1, 2]),
      '2026-05-01',
      false,
    );
    // calendar week 9 vs active 3 ⇒ behind by 6 — product must still offer pulse UI
    const calendarWeek = 9;
    const isBehind = calendarWeek - gating.activeWeek >= 3;
    expect(isBehind).toBe(true);
    expect(gating.needsPulse(gating.activeWeek)).toBe(true);

    // Pre-fix: pulse card hidden when behind AND catch-up had no pulse → dead end
    expect(
      isPulseUnlockPathReachable({
        needsPulse: true,
        isBehind: true,
        showPulseCardWhenNeedsPulse: false,
        catchUpCollectsPulse: false,
      }),
    ).toBe(false);

    // Post-fix: dashboard always shows pulse card when needsPulse
    expect(
      isPulseUnlockPathReachable({
        needsPulse: true,
        isBehind: true,
        showPulseCardWhenNeedsPulse: true,
        catchUpCollectsPulse: true,
      }),
    ).toBe(true);
  });
});
