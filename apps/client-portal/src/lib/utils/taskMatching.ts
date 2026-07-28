export function normaliseTaskTitle(input: unknown): string {
  return String(input ?? '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'") // curly single quotes
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"') // curly double quotes
    .replace(/[\u2010-\u2015\u2212]/g, '-') // en/em/figure dashes
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ') // exotic spaces
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export const isTaskResolved = (status?: string | null): boolean =>
  status === 'completed' || status === 'skipped';

/**
 * Resolve a whole week's generated tasks to their DB rows in one pass.
 * Returns an array parallel to generatedTasks (null where unmatched).
 *
 * Two passes with claim tracking so one DB row can never be assigned to two
 * generated tasks. This matters because the injected life task currently has
 * an identical title in all 12 weeks.
 */
export function matchWeekTasks<
  T extends {
    title?: string | null;
    week_number?: number | null;
    sort_order?: number | null;
    status?: string | null;
  },
>(
  generatedTasks: Array<{ title?: string | null }>,
  dbTasks: T[],
  weekNumber: number,
): Array<T | null> {
  const weekRows = (dbTasks || []).filter((t) => t.week_number === weekNumber);
  const claimed = new Set<T>();
  const out: Array<T | null> = new Array(generatedTasks.length).fill(null);

  generatedTasks.forEach((gt, i) => {
    const target = normaliseTaskTitle(gt?.title);
    if (!target) return;
    const hit = weekRows.find((t) => !claimed.has(t) && normaliseTaskTitle(t.title) === target);
    if (hit) {
      claimed.add(hit);
      out[i] = hit;
    }
  });

  generatedTasks.forEach((_, i) => {
    if (out[i]) return;
    const hit = weekRows.find((t) => !claimed.has(t) && t.sort_order === i);
    if (hit) {
      claimed.add(hit);
      out[i] = hit;
    }
  });

  return out;
}
