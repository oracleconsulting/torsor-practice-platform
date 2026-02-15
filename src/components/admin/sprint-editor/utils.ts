// ============================================================================
// Sprint Editor — helpers for change log and sync
// ============================================================================

import type { ChangeEntry } from './types';

export function buildChangeSummary(
  weekNumber: number | null,
  taskIndex: number | null,
  field: string,
  action: string,
  oldVal?: string,
  newVal?: string
): string {
  if (weekNumber === null) return `Overview: ${field} changed`;
  if (taskIndex === null) return `Week ${weekNumber}: ${field} changed`;
  const shortOld = oldVal && oldVal.length > 40 ? oldVal.slice(0, 37) + '...' : oldVal;
  const shortNew = newVal && newVal.length > 40 ? newVal.slice(0, 37) + '...' : newVal;
  if (action === 'edit' && (shortOld || shortNew)) return `Week ${weekNumber}, Task ${taskIndex + 1}: ${field} → ${shortNew || ''}`;
  if (action === 'add') return `Week ${weekNumber}: new task added`;
  if (action === 'remove') return `Week ${weekNumber}: removed "${shortOld || 'task'}"`;
  return `Week ${weekNumber}, Task ${taskIndex + 1}: ${field}`;
}

export function categoriseEdits(changeLog: ChangeEntry[]): string {
  const hasStructural = changeLog.some((e) => e.action === 'add' || e.action === 'remove' || e.action === 'reorder');
  const hasContent = changeLog.some((e) => e.action === 'edit');
  if (hasStructural && hasContent) return 'rewrite';
  if (hasStructural) return 'addition'; // or removal
  if (hasContent) return 'refinement';
  return 'refinement';
}

export function countEditsByWeek(_weeks: { weekNumber: number }[], changeLog: ChangeEntry[]): Set<number> {
  const withEdits = new Set<number>();
  for (const e of changeLog) {
    if (e.weekNumber != null) withEdits.add(e.weekNumber);
  }
  return withEdits;
}
