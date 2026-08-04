// ============================================================================
// SPRINT REFRESH REVIEW
// ============================================================================
// A checkpoint refresh lands as a new roadmap_stages version with status
// 'generated'. The client keeps seeing the published version until an admin
// releases it here.
//
// Reading nine regenerated weeks cold is not a fifteen minute job. Reading a
// diff is, so unchanged weeks collapse to a line and only real edits expand.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  diffSprintContent,
  groupViolationsByPath,
  type SprintDiff,
  type WeekDiff,
  type TaskDiff,
  type FieldDiff,
  type VoiceScanResult,
  type VoiceViolation,
} from '../../lib/sprintRefreshDiff';
import { SprintEditorModal } from './sprint-editor';
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Pencil,
  AlertTriangle,
  X,
  Check,
  Trash2,
  Loader2,
} from 'lucide-react';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface StageRow {
  id: string;
  client_id: string;
  practice_id: string;
  stage_type: string;
  sprint_number: number | null;
  version: number;
  status: string;
  generated_content: any;
  approved_content: any;
  metadata: any;
  created_at: string;
}

export interface PendingRefresh {
  stage: StageRow;
  published: StageRow | null;
  clientName: string;
  clientCompany: string | null;
  diff: SprintDiff;
  voiceScan: VoiceScanResult | null;
}

export interface SprintRefreshClient {
  clientId: string;
  name: string;
  company?: string | null;
}

interface PanelProps {
  practiceId: string | undefined;
  /** practice_members.id of the reviewing admin, written to published_by */
  memberId: string | undefined;
  /** Clients the current admin is scoped to see */
  clients: SprintRefreshClient[];
  onPublished?: () => void;
}

const SPRINT_STAGE_TYPES = ['sprint_plan', 'sprint_plan_part1', 'sprint_plan_part2'];

// ----------------------------------------------------------------------------
// Data
// ----------------------------------------------------------------------------

async function fetchPendingRefreshes(
  practiceId: string,
  clients: SprintRefreshClient[],
): Promise<PendingRefresh[]> {
  const { data: pending } = await supabase
    .from('roadmap_stages')
    .select(
      'id, client_id, practice_id, stage_type, sprint_number, version, status, generated_content, approved_content, metadata, created_at',
    )
    .eq('practice_id', practiceId)
    .eq('status', 'generated')
    .eq('metadata->>refreshKind', 'sprint_checkpoint')
    .in('stage_type', SPRINT_STAGE_TYPES)
    .order('created_at', { ascending: false });

  if (!pending?.length) return [];

  const nameById = new Map(clients.map((c) => [c.clientId, c]));
  // Only show refreshes for clients this admin is scoped to.
  const visible = (pending as StageRow[]).filter((s) => nameById.has(s.client_id));
  if (!visible.length) return [];

  // Baselines: what each client can see right now.
  const { data: baselines } = await supabase
    .from('roadmap_stages')
    .select(
      'id, client_id, practice_id, stage_type, sprint_number, version, status, generated_content, approved_content, metadata, created_at',
    )
    .in('client_id', Array.from(new Set(visible.map((s) => s.client_id))))
    .in('stage_type', SPRINT_STAGE_TYPES)
    .in('status', ['published', 'approved'])
    .order('created_at', { ascending: false });

  return visible.map((stage) => {
    const published =
      ((baselines ?? []) as StageRow[]).find(
        (b) => b.client_id === stage.client_id && b.stage_type === stage.stage_type,
      ) ?? null;

    const client = nameById.get(stage.client_id);
    const publishedContent = published?.approved_content ?? published?.generated_content ?? null;

    return {
      stage,
      published,
      clientName: client?.name ?? 'Unknown client',
      clientCompany: client?.company ?? null,
      diff: diffSprintContent(publishedContent, stage.generated_content),
      voiceScan: (stage.metadata?.voiceScan ?? null) as VoiceScanResult | null,
    };
  });
}

// ----------------------------------------------------------------------------
// Small presentational pieces
// ----------------------------------------------------------------------------

function VoiceFlags({ violations }: { violations: VoiceViolation[] }) {
  if (!violations.length) return null;
  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
        <AlertTriangle className="w-3.5 h-3.5" />
        {violations.length} voice {violations.length === 1 ? 'flag' : 'flags'}
      </div>
      <ul className="mt-1 space-y-1">
        {violations.slice(0, 6).map((v, i) => (
          <li key={i} className="text-xs text-amber-700">
            <span className="font-medium">{v.label}:</span>{' '}
            <span className="font-mono">{v.match}</span>
            <span className="text-amber-600"> — {v.excerpt}</span>
          </li>
        ))}
        {violations.length > 6 && (
          <li className="text-xs text-amber-600">and {violations.length - 6} more</li>
        )}
      </ul>
    </div>
  );
}

function SideBySide({ field }: { field: FieldDiff }) {
  if (!field.changed) return null;
  return (
    <div className="grid grid-cols-2 gap-3 py-2 border-t border-slate-100 first:border-t-0">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
          {field.label} — now
        </div>
        <p className="text-sm text-slate-500 line-through decoration-slate-300 whitespace-pre-wrap">
          {field.before ?? '—'}
        </p>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-indigo-500 mb-1">
          {field.label} — proposed
        </div>
        <p className="text-sm text-slate-900 whitespace-pre-wrap">{field.after ?? '—'}</p>
      </div>
    </div>
  );
}

const TASK_STATUS_STYLE: Record<TaskDiff['status'], { chip: string; label: string; icon: any }> = {
  added: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Added', icon: Plus },
  removed: { chip: 'bg-red-50 text-red-700 border-red-200', label: 'Removed', icon: Minus },
  changed: { chip: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Edited', icon: Pencil },
  unchanged: { chip: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Unchanged', icon: Check },
};

function TaskRow({
  task,
  violations,
}: {
  task: TaskDiff;
  violations: VoiceViolation[];
}) {
  const [open, setOpen] = useState(task.status === 'added' || task.status === 'removed');
  const style = TASK_STATUS_STYLE[task.status];
  const Icon = style.icon;
  const changedFields = task.fields.filter((f) => f.changed);

  if (task.status === 'unchanged' && !violations.length) {
    return (
      <div className="flex items-center gap-2 py-1.5 pl-2 text-sm text-slate-400">
        <Check className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{task.title}</span>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
      >
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-medium shrink-0 ${style.chip}`}
        >
          <Icon className="w-3 h-3" />
          {style.label}
        </span>
        <span
          className={`text-sm truncate ${
            task.status === 'removed' ? 'text-slate-500 line-through' : 'text-slate-900'
          }`}
        >
          {task.title}
        </span>
        {violations.length > 0 && (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        )}
        <span className="ml-auto shrink-0 text-slate-400">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 bg-white">
          {task.previousTitle && (
            <p className="text-xs text-slate-500 pt-2">
              Retitled from &ldquo;{task.previousTitle}&rdquo;
            </p>
          )}

          {task.status === 'removed' && (
            <div className="pt-2 space-y-1">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {task.before?.description ?? 'No description'}
              </p>
              <p className="text-xs text-slate-400">
                This task disappears from the plan when you publish.
              </p>
            </div>
          )}

          {task.status === 'added' && (
            <div className="pt-2 space-y-1">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {task.after?.description ?? 'No description'}
              </p>
              {task.after?.whyThisMatters && (
                <p className="text-xs text-slate-500">Why: {task.after.whyThisMatters}</p>
              )}
            </div>
          )}

          {task.status === 'changed' &&
            changedFields.map((f) => <SideBySide key={f.key} field={f} />)}

          <VoiceFlags violations={violations} />
        </div>
      )}
    </div>
  );
}

function WeekBlock({
  week,
  violationsByPath,
}: {
  week: WeekDiff;
  violationsByPath: Map<string, VoiceViolation[]>;
}) {
  const [open, setOpen] = useState(week.status !== 'unchanged');
  const weekViolations = violationsByPath.get(`week${week.weekNumber}`) ?? [];
  const changedFields = week.fields.filter((f) => f.changed);

  if (week.status === 'unchanged') {
    return (
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-100 text-sm">
        <span className="w-16 shrink-0 text-slate-400">Week {week.weekNumber}</span>
        <Check className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="text-slate-400 truncate">{week.headline}</span>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="w-16 shrink-0 font-medium text-slate-900">Week {week.weekNumber}</span>
        <span className="text-sm text-slate-600 truncate">{week.headline}</span>
        {weekViolations.length > 0 && (
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        )}
        <span className="ml-auto shrink-0 text-slate-400">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {changedFields.length > 0 && (
            <div className="rounded-lg border border-slate-200 px-3 py-1">
              {changedFields.map((f) => (
                <SideBySide key={f.key} field={f} />
              ))}
            </div>
          )}

          <VoiceFlags violations={weekViolations} />

          {week.tasks.length > 0 && (
            <div className="space-y-1.5">
              {week.tasks.map((task, i) => (
                <TaskRow
                  key={`${task.title}-${i}`}
                  task={task}
                  violations={task.path ? (violationsByPath.get(task.path) ?? []) : []}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Inputs the refresh acted on
// ----------------------------------------------------------------------------

function InputsPanel({ metadata }: { metadata: any }) {
  const inputs = metadata?.refreshInputs ?? {};
  const review = inputs.checkpointReview ?? null;
  const pulses: any[] = inputs.pulses ?? [];
  const checkins: any[] = inputs.checkins ?? [];
  const skipReasons: any[] = inputs.skipReasons ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h4 className="text-sm font-semibold text-slate-900">Checkpoint review</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {review
              ? 'What the client said. This outweighs anything inferred from task outcomes.'
              : 'The client skipped the review. The refresh ran on pulses and task outcomes only.'}
          </p>
        </div>
        {review && (
          <dl className="divide-y divide-slate-100">
            {[
              ["What's changed in the business", review.whats_changed, true],
              ['What worked', review.what_worked, false],
              ["What didn't", review.what_didnt, false],
              ['Where they want the next three weeks pointed', review.next_three_weeks, false],
              ['Capacity outlook', review.capacity_outlook, false],
            ].map(([label, value, emphasise]) => (
              <div key={label as string} className="px-4 py-3">
                <dt
                  className={`text-xs uppercase tracking-wide ${
                    emphasise ? 'text-indigo-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {label as string}
                </dt>
                <dd
                  className={`mt-1 text-sm whitespace-pre-wrap ${
                    emphasise ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {(value as string) || 'Not answered'}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <h4 className="text-sm font-semibold text-slate-900">Life pulses</h4>
          </div>
          {pulses.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">None recorded.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pulses.map((p, i) => (
                <li key={i} className="px-4 py-2 text-sm">
                  <span className="text-slate-400">Week {p.week_number}</span>{' '}
                  <span className="text-slate-900">{p.alignment_rating}/5</span>
                  {p.protect_next_week && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Protecting: {p.protect_next_week}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <h4 className="text-sm font-semibold text-slate-900">Weekly check-ins</h4>
          </div>
          {checkins.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">None recorded.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {checkins.map((c, i) => (
                <li key={i} className="px-4 py-2 text-sm">
                  <span className="text-slate-400">Week {c.week_number}</span>{' '}
                  <span className="text-slate-900">
                    satisfaction {c.life_satisfaction ?? '—'}/5
                  </span>
                  {c.blockers && (
                    <p className="text-xs text-slate-500 mt-0.5">Blocked by: {c.blockers}</p>
                  )}
                  {c.personal_win && (
                    <p className="text-xs text-slate-500 mt-0.5">Win: {c.personal_win}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <h4 className="text-sm font-semibold text-slate-900">Skipped tasks</h4>
        </div>
        {skipReasons.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-400">Nothing skipped this period.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {skipReasons.map((s, i) => (
              <li key={i} className="px-4 py-2 text-sm">
                <span className="text-slate-400">Week {s.weekNumber}</span>{' '}
                <span className="text-slate-900">{s.title}</span>
                <p className="text-xs text-slate-500 mt-0.5">{s.skipReason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Review modal
// ----------------------------------------------------------------------------

function ReviewModal({
  item,
  memberId,
  onClose,
  onDone,
  onEdit,
}: {
  item: PendingRefresh;
  memberId: string | undefined;
  onClose: () => void;
  onDone: () => void;
  onEdit?: (item: PendingRefresh) => void;
}) {
  const [tab, setTab] = useState<'diff' | 'inputs'>('diff');
  const [busy, setBusy] = useState<'publish' | 'discard' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const violationsByPath = useMemo(
    () => groupViolationsByPath(item.voiceScan),
    [item.voiceScan],
  );

  const { summary } = item.diff;
  const checkpointWeek = item.stage.metadata?.checkpointWeek ?? null;
  const totalViolations = item.voiceScan?.violationCount ?? 0;

  const publish = async () => {
    setBusy('publish');
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('roadmap_stages')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          published_by: memberId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.stage.id);
      if (updateError) throw updateError;
      onDone();
    } catch (e: any) {
      setError(e?.message ?? 'Could not publish this version.');
      setBusy(null);
    }
  };

  const discard = async () => {
    setBusy('discard');
    setError(null);
    try {
      // The published version is untouched; this row simply stops being a
      // candidate for release.
      const { error: updateError } = await supabase
        .from('roadmap_stages')
        .update({ status: 'not_started', updated_at: new Date().toISOString() })
        .eq('id', item.stage.id);
      if (updateError) throw updateError;
      onDone();
    } catch (e: any) {
      setError(e?.message ?? 'Could not discard this version.');
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">
              {item.clientName}
              {item.clientCompany ? ` · ${item.clientCompany}` : ''}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Checkpoint {checkpointWeek ? `week ${checkpointWeek}` : ''} refresh, version{' '}
              {item.stage.version}. The client still sees version{' '}
              {item.published?.version ?? '—'}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto shrink-0 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="flex gap-1 border-b border-slate-200">
            {(['diff', 'inputs'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'diff' ? 'What changed' : 'What it listened to'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'diff' ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Weeks changed', value: summary.weeksChanged },
                  { label: 'Tasks removed', value: summary.tasksRemoved },
                  { label: 'Tasks added', value: summary.tasksAdded },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-slate-200 px-4 py-3">
                    <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {totalViolations > 0 && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">
                    {totalViolations} voice{' '}
                    {totalViolations === 1 ? 'violation' : 'violations'} in the regenerated
                    weeks, flagged inline below. These do not block publishing.
                  </p>
                </div>
              )}

              {!item.published && (
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No published version to compare against, so every week reads as new.
                </div>
              )}

              {!item.diff.hasChanges ? (
                <div className="rounded-lg border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  The refresh produced no changes to the plan.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  {item.diff.weeks.map((week) => (
                    <WeekBlock
                      key={week.weekNumber}
                      week={week}
                      violationsByPath={violationsByPath}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <InputsPanel metadata={item.stage.metadata} />
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={discard}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {busy === 'discard' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Discard
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                <Pencil className="w-4 h-4" />
                Publish with edits
              </button>
            )}
            <button
              type="button"
              onClick={publish}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy === 'publish' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Panel
// ----------------------------------------------------------------------------

export function SprintRefreshReviewPanel({
  practiceId,
  memberId,
  clients,
  onPublished,
}: PanelProps) {
  const [items, setItems] = useState<PendingRefresh[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingRefresh | null>(null);
  const [editing, setEditing] = useState<PendingRefresh | null>(null);

  // Keyed on ids so a new array identity from the parent does not refetch.
  const clientKey = clients.map((c) => c.clientId).sort().join(',');

  const load = useCallback(async () => {
    if (!practiceId || !clientKey) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(await fetchPendingRefreshes(practiceId, clients));
    } catch (err) {
      console.error('Failed to load sprint refreshes:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceId, clientKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || items.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <RefreshCw className="w-4 h-4 text-indigo-500" />
        <div>
          <h3 className="font-semibold text-slate-900">Sprint refreshes awaiting review</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Each client keeps their published plan until you release the new version.
          </p>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium">
          {items.length}
        </span>
      </div>

      <ul className="divide-y divide-slate-100">
        {items.map((item) => {
          const { summary } = item.diff;
          const violations = item.voiceScan?.violationCount ?? 0;
          const checkpointWeek = item.stage.metadata?.checkpointWeek ?? null;
          const hadReview = item.stage.metadata?.hadClientReview;

          return (
            <li key={item.stage.id}>
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 truncate">
                      {item.clientName}
                    </span>
                    {checkpointWeek && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium shrink-0">
                        Week {checkpointWeek}
                      </span>
                    )}
                    {!hadReview && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 text-[11px] shrink-0">
                        No review submitted
                      </span>
                    )}
                    {violations > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-medium shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                        {violations}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {summary.weeksChanged} week{summary.weeksChanged === 1 ? '' : 's'} changed
                    {' · '}
                    {summary.tasksRemoved} removed
                    {' · '}
                    {summary.tasksAdded} added
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <ReviewModal
          item={selected}
          memberId={memberId}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            load();
            onPublished?.();
          }}
          onEdit={(item) => {
            setSelected(null);
            setEditing(item);
          }}
        />
      )}

      {editing && (
        <SprintEditorModal
          clientId={editing.stage.client_id}
          practiceId={editing.stage.practice_id}
          sprintNumber={editing.stage.sprint_number ?? 1}
          stageId={editing.stage.id}
          generatedContent={editableSprint(editing.stage.generated_content)}
          approvedContent={
            editing.stage.approved_content
              ? editableSprint(editing.stage.approved_content)
              : null
          }
          currentStatus={editing.stage.status}
          clientName={editing.clientName}
          tierName=""
          isCheckpointRefresh
          publishedBy={memberId}
          onSave={() => {
            load();
            onPublished?.();
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/**
 * The editor works on a flat object with top-level `weeks`, which is also the
 * shape the client portal reads. Refresh content is sometimes nested under
 * `sprint`, so unwrap before handing it over.
 */
function editableSprint(content: any): any {
  if (!content) return { weeks: [] };
  if (Array.isArray(content.weeks)) return content;
  if (Array.isArray(content.sprint?.weeks)) return content.sprint;
  return { ...content, weeks: [] };
}
