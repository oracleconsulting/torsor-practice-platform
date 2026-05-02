// ============================================================================
// GA Client Live View — Admin-side native rendering of a client's live sprint
// ============================================================================
// Replicates what the client sees on their Sprint dashboard, but in the admin
// layout and read-only. Lets practitioners check tasks completed, comments,
// life pulse, weekly check-ins, life alignment, and progress without
// switching accounts.
//
// Route: /goal-alignment/clients/:clientId
// Triggered from the eye icon on each row of GADashboardPage.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { PageSkeleton } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Heart,
  ChevronDown,
  ChevronUp,
  Flag,
  Briefcase,
  Lock,
  TrendingUp,
  Calendar,
  MessageSquare,
} from 'lucide-react';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  client_company: string | null;
  last_portal_login: string | null;
}

interface Enrollment {
  id: string;
  current_sprint_number: number | null;
  tier_name: string | null;
  sprint_start_date: string | null;
  ga_tutorial_seen_at: string | null;
}

interface SprintWeek {
  weekNumber?: number;
  theme?: string;
  phase?: string;
  focus?: string;
  narrative?: string;
  weekMilestone?: string;
  milestone?: string;
  tasks?: SprintTask[];
}

interface SprintTask {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  estimatedHours?: string;
  timeEstimate?: string;
  whyThisMatters?: string;
  why?: string;
}

interface DbTask {
  id: string;
  client_id: string;
  week_number: number;
  sprint_number: number | null;
  title: string;
  description?: string | null;
  status: string;
  category: string | null;
  priority: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  updated_at: string | null;
  completion_feedback: string | null;
  metadata: Record<string, unknown> | null;
}

interface LifePulseEntry {
  id: string;
  sprint_number: number;
  week_number: number;
  alignment_rating: number;
  active_categories: string[] | null;
  protect_next_week: string | null;
  created_at: string;
}

interface LifeAlignmentScore {
  sprint_number: number;
  week_number: number;
  task_completion_score: number;
  pulse_alignment_score: number;
  hours_adherence_score: number;
  category_diversity_score: number;
  overall_score: number;
  trend: 'up' | 'down' | 'stable';
  category_scores: Record<string, number>;
  calculated_at: string;
}

interface WeeklyCheckin {
  id: string;
  week_number: number;
  life_satisfaction: number;
  time_protected: string;
  personal_win: string | null;
  business_progress: number;
  blockers: string | null;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const LIFE_SAT_LABELS: Record<number, string> = {
  1: 'Rough week',
  2: 'Surviving',
  3: 'Fine',
  4: 'Good',
  5: 'Great week',
};

const PULSE_LABELS: Record<number, string> = {
  1: 'Disconnected',
  2: 'Strained',
  3: 'Balanced',
  4: 'Aligned',
  5: 'Fully aligned',
};

const LIFE_CATEGORIES: Record<string, string> = {
  life_time: '⏰ Time',
  life_relationship: '💛 Relationships',
  life_health: '🏃 Health',
  life_experience: '✨ Experiences',
  life_identity: '🎯 Identity',
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysSince(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'never';
  const diff = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return `${Math.floor(diff / 30)} months ago`;
}

// ----------------------------------------------------------------------------
// Data fetcher
// ----------------------------------------------------------------------------

interface SprintViewData {
  client: ClientInfo | null;
  enrollment: Enrollment | null;
  sprintNumber: number;
  sprintTheme: string | null;
  sprintTagline: string | null;
  weeks: SprintWeek[];
  tasks: DbTask[];
  pulse: LifePulseEntry[];
  scores: LifeAlignmentScore[];
  checkins: WeeklyCheckin[];
}

async function fetchClientLiveSprint(clientId: string): Promise<SprintViewData> {
  // Client info
  const { data: client } = await supabase
    .from('practice_members')
    .select('id, name, email, client_company, last_portal_login')
    .eq('id', clientId)
    .maybeSingle();

  // GA enrollment row (sprint_start_date, tier, current sprint number)
  const { data: gaSL } = await supabase
    .from('service_lines')
    .select('id, code')
    .in('code', ['365_method', 'goal_alignment'])
    .limit(1);
  const gaServiceLineId = gaSL?.[0]?.id ?? null;

  let enrollment: Enrollment | null = null;
  if (gaServiceLineId) {
    const { data: enrollRow } = await supabase
      .from('client_service_lines')
      .select('id, current_sprint_number, tier_name, sprint_start_date, ga_tutorial_seen_at')
      .eq('client_id', clientId)
      .eq('service_line_id', gaServiceLineId)
      .maybeSingle();
    enrollment = (enrollRow as Enrollment | null) ?? null;
  }

  const sprintNumber = enrollment?.current_sprint_number ?? 1;

  // Latest sprint plan
  const { data: stage } = await supabase
    .from('roadmap_stages')
    .select('generated_content, approved_content, status, created_at, published_at, sprint_number')
    .eq('client_id', clientId)
    .in('stage_type', ['sprint_plan_part2', 'sprint_plan_part1', 'sprint_plan'])
    .in('status', ['generated', 'approved', 'published'])
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sprintContent =
    stage?.approved_content ??
    stage?.generated_content ??
    null;

  const weeks: SprintWeek[] = sprintContent?.sprint?.weeks ?? sprintContent?.weeks ?? [];
  const sprintTheme: string | null = sprintContent?.sprintTheme ?? sprintContent?.sprint?.sprintTheme ?? null;
  const sprintTagline: string | null = sprintContent?.tagline ?? sprintContent?.sprint?.tagline ?? null;

  // Tasks
  const { data: tasks } = await supabase
    .from('client_tasks')
    .select(
      'id, client_id, week_number, sprint_number, title, description, status, category, priority, completed_at, skipped_at, updated_at, completion_feedback, metadata',
    )
    .eq('client_id', clientId)
    .order('week_number', { ascending: true })
    .order('sort_order', { ascending: true });

  // Life pulse
  const { data: pulse } = await supabase
    .from('life_pulse_entries')
    .select('id, sprint_number, week_number, alignment_rating, active_categories, protect_next_week, created_at')
    .eq('client_id', clientId)
    .order('week_number', { ascending: true });

  // Life alignment scores
  const { data: scores } = await supabase
    .from('life_alignment_scores')
    .select(
      'sprint_number, week_number, task_completion_score, pulse_alignment_score, hours_adherence_score, category_diversity_score, overall_score, trend, category_scores, calculated_at',
    )
    .eq('client_id', clientId)
    .order('week_number', { ascending: true });

  // Weekly check-ins
  const { data: checkins } = await supabase
    .from('weekly_checkins')
    .select('id, week_number, life_satisfaction, time_protected, personal_win, business_progress, blockers, created_at')
    .eq('client_id', clientId)
    .order('week_number', { ascending: true });

  return {
    client: (client as ClientInfo | null) ?? null,
    enrollment,
    sprintNumber,
    sprintTheme,
    sprintTagline,
    weeks,
    tasks: ((tasks ?? []) as DbTask[]).filter((t) => (t.sprint_number ?? sprintNumber) === sprintNumber),
    pulse: ((pulse ?? []) as LifePulseEntry[]).filter((p) => p.sprint_number === sprintNumber),
    scores: ((scores ?? []) as LifeAlignmentScore[]).filter((s) => s.sprint_number === sprintNumber),
    checkins: (checkins ?? []) as WeeklyCheckin[],
  };
}

// ----------------------------------------------------------------------------
// Read-only Task row (mirrors client portal TaskCard visuals, no interactions)
// ----------------------------------------------------------------------------

function TaskStatusCircle({ status, isLife }: { status: string; isLife: boolean }) {
  const cls =
    status === 'completed'
      ? isLife
        ? 'bg-teal-500 border-teal-500 text-white'
        : 'bg-emerald-500 border-emerald-500 text-white'
      : status === 'skipped'
      ? 'border-slate-300 bg-slate-100 text-slate-400'
      : status === 'in_progress'
      ? isLife
        ? 'border-teal-500 bg-teal-100 text-teal-700'
        : 'border-blue-500 bg-blue-100 text-blue-700'
      : 'border-slate-300 bg-white text-slate-400';
  return (
    <span
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${cls}`}
      aria-hidden
    >
      {status === 'completed' && <CheckCircle className="w-4 h-4" />}
      {status === 'in_progress' && <span className="text-[10px]">▶</span>}
      {status === 'skipped' && <span className="text-[10px]">⊘</span>}
    </span>
  );
}

function ReadOnlyTaskRow({
  generatedTask,
  dbTask,
  isLife,
}: {
  generatedTask: SprintTask;
  dbTask: DbTask | null;
  isLife: boolean;
}) {
  const status = dbTask?.status ?? 'pending';
  const cardClass =
    status === 'completed'
      ? isLife
        ? 'bg-teal-50 border-teal-200'
        : 'bg-emerald-50 border-emerald-200'
      : status === 'skipped'
      ? 'bg-slate-50 border-slate-200 opacity-75'
      : status === 'in_progress'
      ? isLife
        ? 'bg-teal-50/70 border-teal-200'
        : 'bg-blue-50 border-blue-200'
      : 'bg-white border-slate-200';

  const titleClass =
    status === 'completed'
      ? isLife
        ? 'text-teal-700 line-through'
        : 'text-emerald-700 line-through'
      : status === 'skipped'
      ? 'text-slate-400 line-through'
      : 'text-slate-900';

  const why = generatedTask.whyThisMatters ?? generatedTask.why;

  return (
    <div className={`p-4 rounded-lg border ${cardClass}`}>
      <div className="flex items-start gap-3">
        <TaskStatusCircle status={status} isLife={isLife} />
        <div className="flex-1 min-w-0">
          <h5 className={`font-medium ${titleClass}`}>{generatedTask.title}</h5>
          {generatedTask.description && (
            <p className="text-sm text-slate-500 mt-1">{generatedTask.description}</p>
          )}
          {why && <p className="text-sm text-indigo-600 mt-2 italic">Why: {why}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            {generatedTask.category && (
              <span className="bg-slate-100 px-2 py-0.5 rounded">{generatedTask.category}</span>
            )}
            {(generatedTask.estimatedHours ?? generatedTask.timeEstimate) && (
              <span>
                <Clock className="w-3 h-3 inline mr-1" />
                {generatedTask.estimatedHours ?? generatedTask.timeEstimate}
              </span>
            )}
            {generatedTask.priority && (
              <span
                className={`px-2 py-0.5 rounded ${
                  generatedTask.priority === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : generatedTask.priority === 'high'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {generatedTask.priority}
              </span>
            )}
            {dbTask?.completed_at && (
              <span className="text-emerald-600">Completed {formatDate(dbTask.completed_at)}</span>
            )}
            {dbTask?.skipped_at && (
              <span className="text-slate-500">Skipped {formatDate(dbTask.skipped_at)}</span>
            )}
          </div>
          {dbTask?.completion_feedback && (
            <div className="mt-3 p-2 bg-white/70 border border-slate-200 rounded text-xs text-slate-700">
              <span className="inline-flex items-center gap-1 text-slate-500 font-medium mb-1">
                <MessageSquare className="w-3 h-3" /> Client note
              </span>
              <p className="whitespace-pre-wrap leading-relaxed">{dbTask.completion_feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Week accordion row
// ----------------------------------------------------------------------------

function WeekAccordion({
  week,
  weekNum,
  dbTasks,
  isResolved,
  isActive,
  isLocked,
  weekStartDate,
  defaultOpen,
}: {
  week: SprintWeek;
  weekNum: number;
  dbTasks: DbTask[];
  isResolved: boolean;
  isActive: boolean;
  isLocked: boolean;
  weekStartDate: Date | null;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const generated = week.tasks ?? [];
  const completed = dbTasks.filter((t) => t.status === 'completed').length;
  const skipped = dbTasks.filter((t) => t.status === 'skipped').length;
  const total = generated.length;
  const resolvedCount = generated.filter((gt) => {
    const db = dbTasks.find((t) => t.title === gt.title);
    return db && (db.status === 'completed' || db.status === 'skipped');
  }).length;
  const lifeTasks = generated.filter((t) => t.category?.startsWith?.('life_'));
  const businessTasks = generated.filter((t) => !t.category?.startsWith?.('life_'));

  return (
    <div className={`border-b border-slate-100 ${isLocked ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={() => !isLocked && setOpen((o) => !o)}
        disabled={isLocked}
        className={`w-full p-4 flex items-center gap-4 text-left transition-colors ${
          isLocked ? 'cursor-not-allowed' : 'hover:bg-slate-50'
        } ${isResolved ? 'bg-emerald-50/40' : ''} ${isActive ? 'border-l-4 border-l-indigo-500' : ''}`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isResolved
              ? 'bg-emerald-500 text-white'
              : isActive
              ? 'bg-indigo-500 text-white'
              : isLocked
              ? 'bg-slate-100 text-slate-300'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          {isResolved ? (
            <CheckCircle className="w-5 h-5" />
          ) : isLocked ? (
            <Lock className="w-4 h-4" />
          ) : (
            <span className="font-bold">{weekNum}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 truncate">{week.theme || `Week ${weekNum}`}</h4>
          <p className="text-sm text-slate-500 truncate">{week.focus || week.narrative || ''}</p>
        </div>
        <div className="hidden md:flex items-center gap-3 flex-shrink-0 text-xs text-slate-500">
          {weekStartDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(weekStartDate.toISOString())}
            </span>
          )}
          <span className="font-medium text-slate-900">
            {resolvedCount}/{total} tasks
          </span>
          {completed > 0 && <span className="text-emerald-600">{completed} done</span>}
          {skipped > 0 && <span className="text-slate-500">{skipped} skipped</span>}
          {isLocked && <span>Locked</span>}
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {open && !isLocked && (
        <div className="px-4 pb-5 ml-14 space-y-2">
          {(week.weekMilestone ?? week.milestone) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
              <p className="text-sm text-amber-800">
                <span className="uppercase text-xs tracking-wide font-semibold">Milestone:</span>{' '}
                {week.weekMilestone ?? week.milestone}
              </p>
            </div>
          )}
          {lifeTasks.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-1">
                <Heart className="w-4 h-4 text-teal-500" />
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                  Life Commitments
                </span>
              </div>
              {lifeTasks.map((task, i) => (
                <ReadOnlyTaskRow
                  key={`life-${weekNum}-${i}`}
                  generatedTask={task}
                  dbTask={dbTasks.find((t) => t.title === task.title) ?? null}
                  isLife
                />
              ))}
            </>
          )}
          {businessTasks.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-3">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                  Business Tasks
                </span>
              </div>
              {businessTasks.map((task, i) => (
                <ReadOnlyTaskRow
                  key={`biz-${weekNum}-${i}`}
                  generatedTask={task}
                  dbTask={dbTasks.find((t) => t.title === task.title) ?? null}
                  isLife={false}
                />
              ))}
            </>
          )}
          {generated.length === 0 && (
            <p className="text-sm text-slate-500 italic">No tasks generated for this week yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export function GAClientLiveViewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<SprintViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchClientLiveSprint(clientId);
      setData(next);
    } catch (err) {
      console.error('[GAClientLiveView] load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load client sprint data');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const derived = useMemo(() => {
    if (!data) return null;
    const { weeks, tasks, pulse, enrollment } = data;
    const sprintStartDate = enrollment?.sprint_start_date ?? null;

    const pulseWeeks = new Set(pulse.map((p) => p.week_number));
    const resolvedWeeks: number[] = [];
    const tasksDoneWeeks: number[] = [];

    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const weekNum = i + 1;
      const generated = week.tasks ?? [];
      const weekDb = tasks.filter((t) => t.week_number === weekNum);
      const allDone =
        generated.length > 0 &&
        generated.every((gt) => {
          const db = weekDb.find((t) => t.title === gt.title);
          return db && (db.status === 'completed' || db.status === 'skipped');
        });
      if (allDone) {
        tasksDoneWeeks.push(weekNum);
        if (pulseWeeks.has(weekNum)) {
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
        ? Math.min(resolvedWeeks[resolvedWeeks.length - 1] + 1, weeks.length || 12)
        : 1;

    const weekStartDate = (n: number): Date | null => {
      if (!sprintStartDate) return null;
      const d = new Date(sprintStartDate);
      if (Number.isNaN(d.getTime())) return null;
      d.setDate(d.getDate() + (n - 1) * 7);
      return d;
    };

    let calendarWeek = activeWeek;
    if (sprintStartDate) {
      const start = new Date(sprintStartDate);
      const diffWeeks = Math.floor((Date.now() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      calendarWeek = Math.max(1, Math.min(weeks.length || 12, diffWeeks));
    }
    const weeksBehind = Math.max(0, calendarWeek - activeWeek);

    const totalGenerated = weeks.reduce((sum, w) => sum + (w.tasks?.length ?? 0), 0);
    const totalCompleted = tasks.filter((t) => t.status === 'completed').length;
    const totalSkipped = tasks.filter((t) => t.status === 'skipped').length;
    const completionRate =
      totalGenerated > 0 ? Math.round((totalCompleted / totalGenerated) * 100) : 0;

    const latestScore = data.scores.length > 0 ? data.scores[data.scores.length - 1] : null;
    const lifeAlignmentScore = latestScore?.overall_score ?? null;
    const lifeAlignmentTrend = latestScore?.trend ?? 'stable';

    return {
      sprintStartDate,
      activeWeek,
      calendarWeek,
      weeksBehind,
      resolvedWeeks,
      tasksDoneWeeks,
      pulseWeeks,
      totalGenerated,
      totalCompleted,
      totalSkipped,
      completionRate,
      lifeAlignmentScore,
      lifeAlignmentTrend,
      weekStartDate,
    };
  }, [data]);

  if (loading) {
    return (
      <AdminLayout title="Client Sprint">
        <PageSkeleton />
      </AdminLayout>
    );
  }

  if (error || !data || !data.client) {
    return (
      <AdminLayout title="Client Sprint">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Couldn't load this client</h2>
            <p className="text-sm text-red-800">{error ?? 'Client not found.'}</p>
            <button
              type="button"
              onClick={() => navigate('/goal-alignment')}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-red-700 hover:text-red-900 underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Goal Alignment dashboard
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { client, enrollment, sprintNumber, sprintTheme, sprintTagline, weeks, tasks, pulse, scores, checkins } = data;
  const d = derived;

  return (
    <AdminLayout
      title={client.name ?? 'Client'}
      subtitle={`Viewing live as the client sees it${client.client_company ? ` · ${client.client_company}` : ''}`}
      headerActions={
        <Link
          to="/goal-alignment"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Goal Alignment
        </Link>
      }
    >
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Top context strip */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-indigo-100 text-xs uppercase tracking-wide mb-1">
                <Flag className="w-3.5 h-3.5" />
                Sprint {sprintNumber} · {enrollment?.tier_name ?? 'unknown'} tier
              </div>
              <h2 className="text-xl font-bold leading-tight">
                {sprintTagline ?? sprintTheme ?? `Week ${d?.activeWeek ?? 1} of ${weeks.length || 12}`}
              </h2>
              {sprintTheme && sprintTagline && (
                <p className="text-indigo-100 text-sm mt-1">{sprintTheme}</p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right md:text-left">
              <Stat label="Active Week" value={`${d?.activeWeek ?? 1} of ${weeks.length || 12}`} />
              <Stat label="Calendar Week" value={String(d?.calendarWeek ?? 1)} />
              <Stat
                label="Weeks Behind"
                value={String(d?.weeksBehind ?? 0)}
                warn={(d?.weeksBehind ?? 0) >= 2}
              />
              <Stat
                label="Last Login"
                value={daysSince(client.last_portal_login)}
              />
            </div>
          </div>
        </div>

        {/* Hero metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            icon={<Heart className="w-5 h-5 text-teal-600" />}
            label="Life Alignment"
            value={d?.lifeAlignmentScore != null ? `${Math.round(d.lifeAlignmentScore)}%` : '—'}
            sub={
              d?.lifeAlignmentTrend === 'up'
                ? 'Trending up'
                : d?.lifeAlignmentTrend === 'down'
                ? 'Trending down'
                : 'Stable'
            }
            tone="teal"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            label="Sprint Progress"
            value={`${d?.completionRate ?? 0}%`}
            sub={`${d?.totalCompleted ?? 0} done · ${d?.totalSkipped ?? 0} skipped · ${d?.totalGenerated ?? 0} total`}
            tone="indigo"
          />
          <MetricCard
            icon={<Calendar className="w-5 h-5 text-amber-600" />}
            label="Sprint Start"
            value={
              enrollment?.sprint_start_date
                ? formatDate(enrollment.sprint_start_date)
                : 'Not chosen'
            }
            sub={enrollment?.sprint_start_date ? '7-day pacing active' : 'Client hasn\'t started yet'}
            tone="amber"
          />
        </div>

        {/* Week unlock status */}
        {d && (
          <UnlockStatusPanel
            activeWeek={d.activeWeek}
            totalWeeks={weeks.length || 12}
            pulseWeeks={d.pulseWeeks}
            weeks={weeks}
            tasks={tasks}
          />
        )}

        {/* All weeks */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">All Weeks</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Read-only view of every task as the client sees it. Open a week to see status, completion notes, and timing.
              </p>
            </div>
          </div>
          {weeks.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No sprint plan generated for this client yet.</p>
          ) : (
            weeks.map((week, i) => {
              const weekNum = week.weekNumber ?? i + 1;
              const isResolved = (d?.resolvedWeeks ?? []).includes(weekNum);
              const isActive = weekNum === (d?.activeWeek ?? 1);
              const isLocked =
                !isResolved &&
                !isActive &&
                weekNum > (d?.activeWeek ?? 1) &&
                !((d?.tasksDoneWeeks ?? []).includes(weekNum - 1));
              const weekDb = tasks.filter((t) => t.week_number === weekNum);
              return (
                <WeekAccordion
                  key={weekNum}
                  week={week}
                  weekNum={weekNum}
                  dbTasks={weekDb}
                  isResolved={isResolved}
                  isActive={isActive}
                  isLocked={isLocked}
                  weekStartDate={d?.weekStartDate(weekNum) ?? null}
                  defaultOpen={isActive}
                />
              );
            })
          )}
        </section>

        {/* Life pulse history */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Life Pulse history</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Weekly 30-second check-ins gating the next week unlock.
            </p>
          </div>
          {pulse.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 italic">No life pulse entries yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pulse.map((p) => (
                <div key={p.id} className="p-4 flex items-start gap-4">
                  <div className="w-10 flex-shrink-0 text-center">
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Week</div>
                    <div className="text-lg font-bold text-slate-900">{p.week_number}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-xs font-medium">
                        <Heart className="w-3 h-3" />
                        {p.alignment_rating}/5 · {PULSE_LABELS[p.alignment_rating] ?? ''}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDateTime(p.created_at)}
                      </span>
                    </div>
                    {(p.active_categories ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(p.active_categories ?? []).map((cat) => (
                          <span
                            key={cat}
                            className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full"
                          >
                            {LIFE_CATEGORIES[cat] ?? cat}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.protect_next_week && (
                      <p className="text-sm text-slate-700 mt-2 italic">
                        "Protect next week: {p.protect_next_week}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Weekly check-ins history */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Weekly check-ins</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              How the client felt the week went — life satisfaction, time protection, business progress.
            </p>
          </div>
          {checkins.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 italic">No weekly check-ins submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Week</th>
                    <th className="px-4 py-2 text-left">Life</th>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">Business</th>
                    <th className="px-4 py-2 text-left">Win / Blocker</th>
                    <th className="px-4 py-2 text-left">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checkins.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">W{c.week_number}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="font-medium">{c.life_satisfaction}/5</span>{' '}
                        <span className="text-slate-400 text-xs">· {LIFE_SAT_LABELS[c.life_satisfaction] ?? ''}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 capitalize">{c.time_protected}</td>
                      <td className="px-4 py-3 text-slate-700">{c.business_progress}/5</td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.personal_win && (
                          <p className="text-xs text-emerald-700">+ {c.personal_win}</p>
                        )}
                        {c.blockers && (
                          <p className="text-xs text-red-700 mt-0.5">! {c.blockers}</p>
                        )}
                        {!c.personal_win && !c.blockers && <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDateTime(c.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Life alignment scores */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Life Alignment scores</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated weekly from task completion, life pulse rating, time protection, and category diversity.
            </p>
          </div>
          {scores.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 italic">No alignment scores calculated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Week</th>
                    <th className="px-4 py-2 text-right">Overall</th>
                    <th className="px-4 py-2 text-right">Tasks</th>
                    <th className="px-4 py-2 text-right">Pulse</th>
                    <th className="px-4 py-2 text-right">Time</th>
                    <th className="px-4 py-2 text-right">Diversity</th>
                    <th className="px-4 py-2 text-left">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scores.map((s) => (
                    <tr key={`${s.sprint_number}-${s.week_number}`} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">W{s.week_number}</td>
                      <td className="px-4 py-3 text-right font-bold text-teal-700">
                        {Math.round(Number(s.overall_score))}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{Math.round(Number(s.task_completion_score))}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{Math.round(Number(s.pulse_alignment_score))}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{Math.round(Number(s.hours_adherence_score))}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{Math.round(Number(s.category_diversity_score))}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            s.trend === 'up'
                              ? 'bg-emerald-100 text-emerald-700'
                              : s.trend === 'down'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Onboarding state footer */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
          <p>
            <strong>Tutorial:</strong>{' '}
            {enrollment?.ga_tutorial_seen_at
              ? `Seen ${formatDate(enrollment.ga_tutorial_seen_at)}`
              : 'Not yet seen — will auto-open on first GA visit.'}
            {' · '}
            <strong>Sprint start date:</strong>{' '}
            {enrollment?.sprint_start_date
              ? formatDate(enrollment.sprint_start_date)
              : 'Not chosen — client sees the welcome panel.'}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function Stat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-indigo-200">{label}</div>
      <div className={`text-lg font-bold ${warn ? 'text-amber-200' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: 'teal' | 'indigo' | 'amber';
}) {
  const toneClasses =
    tone === 'teal'
      ? 'from-teal-50 to-emerald-50 border-teal-200 text-teal-800'
      : tone === 'indigo'
      ? 'from-indigo-50 to-purple-50 border-indigo-200 text-indigo-800'
      : 'from-amber-50 to-orange-50 border-amber-200 text-amber-800';

  return (
    <div className={`rounded-xl border p-5 bg-gradient-to-br ${toneClasses}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-xs font-semibold uppercase tracking-wide">{label}</h4>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function UnlockStatusPanel({
  activeWeek,
  totalWeeks,
  pulseWeeks,
  weeks,
  tasks,
}: {
  activeWeek: number;
  totalWeeks: number;
  pulseWeeks: Set<number>;
  weeks: SprintWeek[];
  tasks: DbTask[];
}) {
  const week = weeks[activeWeek - 1];
  if (!week) return null;
  const generated = week.tasks ?? [];
  const dbWeekTasks = tasks.filter((t) => t.week_number === activeWeek);
  const tasksDoneCount = generated.filter((gt) => {
    const db = dbWeekTasks.find((t) => t.title === gt.title);
    return db && (db.status === 'completed' || db.status === 'skipped');
  }).length;
  const allTasksDone = generated.length > 0 && tasksDoneCount === generated.length;
  const pulseSubmitted = pulseWeeks.has(activeWeek);
  const allComplete = allTasksDone && pulseSubmitted;
  const isLast = activeWeek >= totalWeeks;
  const nextWeek = Math.min(activeWeek + 1, totalWeeks);

  return (
    <div
      className={`rounded-xl border p-5 ${
        allComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`text-sm font-semibold ${allComplete ? 'text-emerald-800' : 'text-indigo-800'}`}
        >
          {allComplete
            ? isLast
              ? `Week ${activeWeek} complete — sprint finished`
              : `Week ${nextWeek} unlocked`
            : isLast
            ? `Finishing Week ${activeWeek} — final week`
            : `Unlock Week ${nextWeek}`}
        </h3>
        <span className="text-xs text-slate-500">
          Week {activeWeek} of {totalWeeks}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <Criterion
          met={allTasksDone}
          label={`Complete all ${generated.length} task${generated.length === 1 ? '' : 's'} for Week ${activeWeek}`}
          progress={generated.length > 0 ? `${tasksDoneCount}/${generated.length}` : ''}
          step={1}
        />
        <Criterion
          met={pulseSubmitted}
          label={`Submit Life Pulse for Week ${activeWeek}`}
          step={2}
        />
      </div>
    </div>
  );
}

function Criterion({
  met,
  label,
  progress,
  step,
}: {
  met: boolean;
  label: string;
  progress?: string;
  step: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
          met
            ? 'bg-emerald-500 text-white'
            : 'bg-white border-2 border-indigo-300 text-indigo-600'
        }`}
      >
        {met ? '✓' : step}
      </span>
      <span
        className={
          met ? 'text-emerald-800 line-through decoration-emerald-400' : 'text-slate-700'
        }
      >
        {label}
        {progress && <span className="text-slate-500"> ({progress})</span>}
      </span>
    </div>
  );
}
