// ============================================================================
// SPRINT REFRESH DIFF
// ============================================================================
// Compares a generated sprint version against the currently published one so
// an admin can review a checkpoint refresh in about fifteen minutes rather than
// reading nine regenerated weeks cold.
//
// Weeks match on weekNumber. Tasks match on title within a week, because the
// LLM does not carry ids across a regeneration.
// ============================================================================

export interface SprintTaskLike {
  id?: string;
  title?: string;
  description?: string;
  whyThisMatters?: string;
  why?: string;
  milestone?: string;
  tools?: string;
  timeEstimate?: string;
  deliverable?: string;
  celebrationMoment?: string;
  category?: string;
  priority?: string;
  [key: string]: unknown;
}

export interface SprintWeekLike {
  weekNumber?: number;
  week?: number;
  theme?: string;
  phase?: string;
  narrative?: string;
  focus?: string;
  weekMilestone?: string;
  milestone?: string;
  tuesdayCheckIn?: string;
  tuesdayTransformation?: string;
  tasks?: SprintTaskLike[];
  [key: string]: unknown;
}

/** A field shown side by side in the diff. */
export interface FieldDiff {
  key: string;
  label: string;
  before: string | null;
  after: string | null;
  changed: boolean;
}

export interface TaskDiff {
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  title: string;
  /** Title before the refresh, when a matched task was retitled. */
  previousTitle?: string;
  before: SprintTaskLike | null;
  after: SprintTaskLike | null;
  fields: FieldDiff[];
  /** Path into the generated content, for matching voice scan violations. */
  path: string | null;
}

export interface WeekDiff {
  weekNumber: number;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  fields: FieldDiff[];
  tasks: TaskDiff[];
  tasksAdded: number;
  tasksRemoved: number;
  tasksChanged: number;
  /** Short line shown when the week is collapsed. */
  headline: string;
}

export interface SprintDiffSummary {
  weeksChanged: number;
  tasksRemoved: number;
  tasksAdded: number;
  tasksChanged: number;
}

export interface SprintDiff {
  summary: SprintDiffSummary;
  weeks: WeekDiff[];
  hasChanges: boolean;
}

const WEEK_FIELDS: Array<{ key: keyof SprintWeekLike; label: string }> = [
  { key: 'theme', label: 'Theme' },
  { key: 'narrative', label: 'Narrative' },
  { key: 'focus', label: 'Focus' },
  { key: 'weekMilestone', label: 'Milestone' },
  { key: 'tuesdayCheckIn', label: 'Tuesday check-in' },
  { key: 'phase', label: 'Phase' },
];

const TASK_FIELDS: Array<{ key: keyof SprintTaskLike; label: string }> = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'whyThisMatters', label: 'Why this matters' },
  { key: 'milestone', label: 'Milestone' },
  { key: 'tools', label: 'Tools' },
  { key: 'timeEstimate', label: 'Time estimate' },
  { key: 'deliverable', label: 'Deliverable' },
  { key: 'celebrationMoment', label: 'Celebration moment' },
  { key: 'category', label: 'Category' },
];

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

/** Whitespace and casing differences are not edits worth a reviewer's attention. */
function normalise(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function weekNumberOf(week: SprintWeekLike): number {
  return Number(week.weekNumber ?? week.week ?? 0);
}

/**
 * Reads a field and its alias together, so a week whose milestone moved from
 * `milestone` to `weekMilestone` does not read as an edit.
 */
function weekField(week: SprintWeekLike, key: string): string | null {
  if (key === 'weekMilestone') return text(week.weekMilestone) ?? text(week.milestone);
  if (key === 'narrative') return text(week.narrative);
  if (key === 'focus') return text(week.focus) ?? text(week.narrative);
  if (key === 'tuesdayCheckIn') {
    return text(week.tuesdayCheckIn) ?? text(week.tuesdayTransformation);
  }
  return text(week[key]);
}

function taskField(task: SprintTaskLike, key: string): string | null {
  if (key === 'whyThisMatters') return text(task.whyThisMatters) ?? text(task.why);
  return text(task[key]);
}

function diffFields(
  before: unknown | null,
  after: unknown | null,
  spec: Array<{ key: string; label: string }>,
  read: (source: any, key: string) => string | null,
): FieldDiff[] {
  return spec
    .map(({ key, label }) => {
      const b = before ? read(before, key) : null;
      const a = after ? read(after, key) : null;
      return { key, label, before: b, after: a, changed: normalise(b) !== normalise(a) };
    })
    .filter((f) => f.before !== null || f.after !== null);
}

function taskKey(task: SprintTaskLike): string {
  return normalise(text(task.title));
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'with', 'your', 'our',
  'in', 'on', 'at', 'by', 'from', 'this', 'that', 'into', 'up', 'out',
]);

function titleTokens(task: SprintTaskLike): Set<string> {
  return new Set(
    normalise(text(task.title))
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t)),
  );
}

/** Dice coefficient over significant title words. */
function titleSimilarity(a: SprintTaskLike, b: SprintTaskLike): number {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  ta.forEach((t) => {
    if (tb.has(t)) shared++;
  });
  return (2 * shared) / (ta.size + tb.size);
}

/**
 * Below this, two leftover tasks are a genuine removal and a genuine addition
 * rather than one task being retitled. Those are the substantive edits a
 * reviewer needs called out, so the bar is deliberately high.
 */
const RETITLE_THRESHOLD = 0.5;

/**
 * Matches tasks by exact title first, since the LLM does not carry ids across a
 * regeneration. Leftovers are paired only where the titles are clearly the same
 * task reworded; everything else stays an explicit add or remove.
 */
function matchTasks(
  before: SprintTaskLike[],
  after: SprintTaskLike[],
): Array<{ before: SprintTaskLike | null; after: SprintTaskLike | null; afterIndex: number }> {
  const pairs: Array<{
    before: SprintTaskLike | null;
    after: SprintTaskLike | null;
    afterIndex: number;
  }> = [];
  const usedBefore = new Set<number>();

  after.forEach((afterTask, afterIndex) => {
    const key = taskKey(afterTask);
    const matchIndex = key
      ? before.findIndex((b, i) => !usedBefore.has(i) && taskKey(b) === key)
      : -1;
    if (matchIndex >= 0) {
      usedBefore.add(matchIndex);
      pairs.push({ before: before[matchIndex], after: afterTask, afterIndex });
    } else {
      pairs.push({ before: null, after: afterTask, afterIndex });
    }
  });

  // Best-first pairing of what is left, so the strongest retitle wins its
  // partner before a weaker one can claim it.
  const candidates: Array<{ pair: (typeof pairs)[number]; beforeIndex: number; score: number }> = [];
  pairs
    .filter((p) => p.before === null)
    .forEach((pair) => {
      before.forEach((beforeTask, beforeIndex) => {
        if (usedBefore.has(beforeIndex)) return;
        const score = titleSimilarity(beforeTask, pair.after!);
        if (score >= RETITLE_THRESHOLD) candidates.push({ pair, beforeIndex, score });
      });
    });

  candidates.sort((a, b) => b.score - a.score);
  for (const candidate of candidates) {
    if (candidate.pair.before !== null || usedBefore.has(candidate.beforeIndex)) continue;
    candidate.pair.before = before[candidate.beforeIndex];
    usedBefore.add(candidate.beforeIndex);
  }

  before.forEach((beforeTask, i) => {
    if (!usedBefore.has(i)) pairs.push({ before: beforeTask, after: null, afterIndex: -1 });
  });

  return pairs;
}

function weeksOf(content: any): SprintWeekLike[] {
  if (!content) return [];
  const weeks = content?.sprint?.weeks ?? content?.weeks ?? [];
  return Array.isArray(weeks) ? weeks : [];
}

function buildHeadline(week: WeekDiff, after: SprintWeekLike | null): string {
  if (week.status === 'unchanged') {
    return text(after?.theme) ?? 'No changes';
  }
  if (week.status === 'added') return 'New week';
  if (week.status === 'removed') return 'Week removed';

  const parts: string[] = [];
  const changedFields = week.fields.filter((f) => f.changed).map((f) => f.label.toLowerCase());
  if (changedFields.length) parts.push(changedFields.join(', '));
  if (week.tasksAdded) parts.push(`${week.tasksAdded} task${week.tasksAdded === 1 ? '' : 's'} added`);
  if (week.tasksRemoved) {
    parts.push(`${week.tasksRemoved} task${week.tasksRemoved === 1 ? '' : 's'} removed`);
  }
  if (week.tasksChanged) {
    parts.push(`${week.tasksChanged} task${week.tasksChanged === 1 ? '' : 's'} edited`);
  }
  return parts.join(' · ') || 'Changed';
}

/**
 * @param publishedContent generated_content (or approved_content) of the version the client sees now
 * @param generatedContent generated_content of the new version awaiting review
 */
export function diffSprintContent(publishedContent: any, generatedContent: any): SprintDiff {
  const beforeWeeks = weeksOf(publishedContent);
  const afterWeeks = weeksOf(generatedContent);

  const beforeByNumber = new Map<number, SprintWeekLike>();
  beforeWeeks.forEach((w) => beforeByNumber.set(weekNumberOf(w), w));

  const afterByNumber = new Map<number, SprintWeekLike>();
  afterWeeks.forEach((w) => afterByNumber.set(weekNumberOf(w), w));

  const allNumbers = Array.from(
    new Set([...beforeByNumber.keys(), ...afterByNumber.keys()]),
  ).sort((a, b) => a - b);

  const weeks: WeekDiff[] = [];
  let tasksAdded = 0;
  let tasksRemoved = 0;
  let tasksChanged = 0;

  for (const weekNumber of allNumbers) {
    const before = beforeByNumber.get(weekNumber) ?? null;
    const after = afterByNumber.get(weekNumber) ?? null;

    const fields = diffFields(before, after, WEEK_FIELDS as any, weekField);
    const pairs = matchTasks(before?.tasks ?? [], after?.tasks ?? []);

    const taskDiffs: TaskDiff[] = pairs.map((pair) => {
      const taskFields = diffFields(pair.before, pair.after, TASK_FIELDS as any, taskField);
      let status: TaskDiff['status'];
      if (!pair.before) status = 'added';
      else if (!pair.after) status = 'removed';
      else status = taskFields.some((f) => f.changed) ? 'changed' : 'unchanged';

      const title =
        text(pair.after?.title) ?? text(pair.before?.title) ?? 'Untitled task';
      const previousTitle =
        pair.before && pair.after && normalise(text(pair.before.title)) !== normalise(title)
          ? (text(pair.before.title) ?? undefined)
          : undefined;

      return {
        status,
        title,
        previousTitle,
        before: pair.before,
        after: pair.after,
        fields: taskFields,
        path: pair.afterIndex >= 0 ? `week${weekNumber}.tasks[${pair.afterIndex}]` : null,
      };
    });

    const weekTasksAdded = taskDiffs.filter((t) => t.status === 'added').length;
    const weekTasksRemoved = taskDiffs.filter((t) => t.status === 'removed').length;
    const weekTasksChanged = taskDiffs.filter((t) => t.status === 'changed').length;

    tasksAdded += weekTasksAdded;
    tasksRemoved += weekTasksRemoved;
    tasksChanged += weekTasksChanged;

    let status: WeekDiff['status'];
    if (!before) status = 'added';
    else if (!after) status = 'removed';
    else if (
      fields.some((f) => f.changed) ||
      weekTasksAdded ||
      weekTasksRemoved ||
      weekTasksChanged
    ) {
      status = 'changed';
    } else status = 'unchanged';

    const weekDiff: WeekDiff = {
      weekNumber,
      status,
      fields,
      // An unchanged week collapses to one line, so its task rows are noise.
      tasks: status === 'unchanged' ? [] : taskDiffs,
      tasksAdded: weekTasksAdded,
      tasksRemoved: weekTasksRemoved,
      tasksChanged: weekTasksChanged,
      headline: '',
    };
    weekDiff.headline = buildHeadline(weekDiff, after);
    weeks.push(weekDiff);
  }

  const weeksChanged = weeks.filter((w) => w.status !== 'unchanged').length;

  return {
    summary: { weeksChanged, tasksRemoved, tasksAdded, tasksChanged },
    weeks,
    hasChanges: weeksChanged > 0,
  };
}

// ---------------------------------------------------------------------------
// Voice scan helpers
// ---------------------------------------------------------------------------

export interface VoiceViolation {
  path: string;
  rule: string;
  label: string;
  match: string;
  excerpt: string;
}

export interface VoiceScanResult {
  scannedAt?: string;
  fieldsScanned?: number;
  violationCount?: number;
  byRule?: Record<string, number>;
  flaggedPaths?: string[];
  violations?: VoiceViolation[];
  truncated?: boolean;
}

/**
 * Groups violations by the task path recorded during generation, so the diff
 * view can flag the specific task that carries them.
 *
 * The scan runs over the regenerated weeks array, so its paths are relative to
 * that array rather than to the merged twelve-week plan.
 */
export function groupViolationsByPath(
  scan: VoiceScanResult | null | undefined,
): Map<string, VoiceViolation[]> {
  const grouped = new Map<string, VoiceViolation[]>();
  for (const violation of scan?.violations ?? []) {
    // 'week4.tasks[2].description' -> 'week4.tasks[2]', and week-level fields
    // such as 'week4.narrative' -> 'week4'
    const taskPath = violation.path.match(/^week\d+\.tasks\[\d+\]/)?.[0];
    const weekPath = violation.path.match(/^week\d+/)?.[0];
    const key = taskPath ?? weekPath ?? violation.path;
    const list = grouped.get(key) ?? [];
    list.push(violation);
    grouped.set(key, list);
  }
  return grouped;
}
