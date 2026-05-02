// ============================================================================
// GATutorialModal — First-time onboarding for the Goal Alignment programme
// ============================================================================
// Auto-opens the first time a client visits any GA page. State persisted
// server-side via `client_service_lines.ga_tutorial_seen_at` so admin can
// reset it with SQL and the tutorial follows the client across browsers.
// A "How this works" entry in the GA sidebar/mobile menu re-opens it any
// time, and includes interactive walkthroughs showing exactly how to
// complete a task and submit the weekly Life Pulse.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Map as MapIcon,
  Flag,
  Heart,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CheckCircle,
  Play,
  X,
  Sparkles,
  Target,
  Clock,
  MousePointer2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Interactive Task walkthrough — mirrors the real `TaskCard` in
// SprintDashboardPage so the client sees the exact UI they're about to use.
// Auto-animates through the three task states: pending → in_progress →
// completed, with an annotation arrow that follows the action.
// ---------------------------------------------------------------------------

type TaskDemoState = 'pending' | 'in_progress' | 'completed';

const TASK_DEMO_TIMINGS: Record<TaskDemoState, number> = {
  pending: 2200,
  in_progress: 2200,
  completed: 2400,
};

function TaskWalkthroughDemo() {
  const [state, setState] = useState<TaskDemoState>('pending');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const next: Record<TaskDemoState, TaskDemoState> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    timerRef.current = setTimeout(() => {
      setState((s) => next[s]);
    }, TASK_DEMO_TIMINGS[state]);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state]);

  const cardClass =
    state === 'completed'
      ? 'bg-emerald-50 border-emerald-200'
      : state === 'in_progress'
      ? 'bg-blue-50 border-blue-200'
      : 'bg-white border-slate-200';
  const buttonClass =
    state === 'completed'
      ? 'bg-emerald-500 border-emerald-500 text-white'
      : state === 'in_progress'
      ? 'border-blue-500 bg-blue-100'
      : 'border-slate-300';
  const titleClass =
    state === 'completed'
      ? 'text-emerald-700 line-through'
      : 'text-slate-900';

  const annotation =
    state === 'pending'
      ? 'Tap the circle to start the task'
      : state === 'in_progress'
      ? 'In progress — tap again when done'
      : 'Completed — moves you towards unlocking the next week';

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className={`p-4 rounded-lg border transition-colors ${cardClass}`}>
          <div className="flex items-start gap-3">
            <div className="relative">
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${buttonClass} ${state === 'pending' ? 'animate-pulse ring-4 ring-indigo-300/50' : ''}`}
              >
                {state === 'completed' && <CheckCircle className="w-4 h-4" />}
                {state === 'in_progress' && <Play className="w-3 h-3 text-blue-500" />}
              </button>
              {/* Hand pointer overlay */}
              {state === 'pending' && (
                <MousePointer2 className="w-4 h-4 text-indigo-600 absolute -bottom-3 -right-3 drop-shadow" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className={`font-medium text-sm ${titleClass}`}>
                Reclaim Your First Hour
              </h5>
              <p className="text-xs text-slate-500 mt-1">
                Block 7–8am for one priority. No email, no Slack.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded">routine</span>
                <span><Clock className="w-2.5 h-2.5 inline mr-0.5" />20 min/day</span>
                <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">high</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 italic whitespace-nowrap">Didn't do this</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-white ${state === 'completed' ? 'bg-emerald-500' : state === 'in_progress' ? 'bg-blue-500' : 'bg-indigo-500'}`}>
          {state === 'pending' ? '1' : state === 'in_progress' ? '2' : '✓'}
        </span>
        <span className="text-slate-700 font-medium">{annotation}</span>
      </div>
      {/* state pips */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {(['pending', 'in_progress', 'completed'] as const).map((s) => (
          <span
            key={s}
            className={`h-1 rounded-full transition-all ${
              s === state ? 'w-8 bg-indigo-500' : 'w-1.5 bg-slate-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interactive Life Pulse walkthrough — mirrors LifePulseCard. Cycles through
// rating select → category select → submit → "saved" state.
// ---------------------------------------------------------------------------

type PulseDemoState = 'rate' | 'categories' | 'submit' | 'saved';
const PULSE_DEMO_TIMINGS: Record<PulseDemoState, number> = {
  rate: 2200,
  categories: 2200,
  submit: 1800,
  saved: 2400,
};

const PULSE_CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: 'life_time', label: 'Time', emoji: '⏰' },
  { value: 'life_relationship', label: 'Relationships', emoji: '💛' },
  { value: 'life_health', label: 'Health', emoji: '🏃' },
  { value: 'life_experience', label: 'Experiences', emoji: '✨' },
  { value: 'life_identity', label: 'Identity', emoji: '🎯' },
];

function PulseWalkthroughDemo() {
  const [state, setState] = useState<PulseDemoState>('rate');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const next: Record<PulseDemoState, PulseDemoState> = {
      rate: 'categories',
      categories: 'submit',
      submit: 'saved',
      saved: 'rate',
    };
    timerRef.current = setTimeout(() => {
      setState((s) => next[s]);
    }, PULSE_DEMO_TIMINGS[state]);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state]);

  const filledHearts = state === 'rate' ? 0 : 4;
  let selectedCats: string[];
  if (state === 'rate') {
    selectedCats = [];
  } else if (state === 'categories') {
    selectedCats = ['life_time'];
  } else {
    selectedCats = ['life_time', 'life_relationship'];
  }

  const annotation =
    state === 'rate'
      ? 'Tap a heart to rate this week (1–5)'
      : state === 'categories'
      ? 'Choose the life areas you tended to'
      : state === 'submit'
      ? 'Tap Submit to close out the week'
      : 'Saved — Week 2 is now unlocked';

  if (state === 'saved') {
    return (
      <div className="space-y-3">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="text-sm font-semibold text-rose-800">Life Pulse saved ✓</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-800">
              Score: 72
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-white bg-emerald-500">✓</span>
          <span className="text-slate-700 font-medium">{annotation}</span>
        </div>
        <DemoPips active={3} total={4} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-semibold text-rose-800 uppercase tracking-wide">
            Weekly Life Pulse
          </span>
        </div>
        {/* Hearts */}
        <p className="text-xs text-rose-700 mb-1.5">How aligned did this week feel?</p>
        <div className="flex items-center gap-1.5 mb-3">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= filledHearts;
            const isTarget = state === 'rate' && n === 4;
            return (
              <div key={n} className="relative">
                <Heart
                  className={`w-5 h-5 transition-all ${filled ? 'text-rose-500 fill-rose-500' : 'text-rose-200'} ${isTarget ? 'animate-pulse' : ''}`}
                />
                {isTarget && (
                  <MousePointer2 className="w-3.5 h-3.5 text-indigo-600 absolute -bottom-2 -right-2 drop-shadow" />
                )}
              </div>
            );
          })}
        </div>
        {/* Categories */}
        <p className="text-xs text-rose-700 mb-1.5">Which areas got attention?</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PULSE_CATEGORIES.map((c) => {
            const sel = selectedCats.includes(c.value);
            const isTargetCat =
              state === 'categories' &&
              ((c.value === 'life_time' && selectedCats.length === 0) ||
                (c.value === 'life_relationship' && selectedCats.length === 1));
            return (
              <span
                key={c.value}
                className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                  sel
                    ? 'bg-rose-200 border-rose-300 text-rose-900'
                    : 'bg-white border-rose-200 text-rose-600'
                } ${isTargetCat ? 'ring-2 ring-indigo-300' : ''}`}
              >
                <span>{c.emoji}</span>
                {c.label}
              </span>
            );
          })}
        </div>
        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            disabled={state !== 'submit'}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all ${
              state === 'submit'
                ? 'bg-rose-500 ring-4 ring-indigo-300/50'
                : state === 'categories' && selectedCats.length >= 2
                ? 'bg-rose-400'
                : 'bg-rose-300'
            }`}
          >
            Submit Pulse
            {state === 'submit' && (
              <MousePointer2 className="w-3.5 h-3.5 text-indigo-600 absolute -bottom-2 -right-2 drop-shadow" />
            )}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-white bg-rose-500">
          {state === 'rate' ? '1' : state === 'categories' ? '2' : '3'}
        </span>
        <span className="text-slate-700 font-medium">{annotation}</span>
      </div>
      <DemoPips
        active={state === 'rate' ? 0 : state === 'categories' ? 1 : 2}
        total={4}
      />
    </div>
  );
}

function DemoPips({ active, total }: { active: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 rounded-full transition-all ${
            i === active ? 'w-8 bg-rose-500' : 'w-1.5 bg-slate-300'
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tutorial steps
// ---------------------------------------------------------------------------

interface TutorialStep {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  body: React.ReactNode;
}

const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    title: 'Welcome to your Goal Alignment programme',
    body: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          Your Goal Alignment plan turns your business and life ambitions into a
          12-week sprint of small, focused weekly steps — so progress compounds
          instead of stalling.
        </p>
        <p>
          This quick walkthrough explains the four key tools you'll use each
          week. It only takes a minute.
        </p>
      </div>
    ),
  },
  {
    id: 'roadmap',
    icon: MapIcon,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    title: 'Roadmap — your 365-day map',
    body: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          Your <strong>Roadmap</strong> shows the four sprints that make up your
          year. Each sprint is 12 weeks of focused work, followed by a review
          and a refreshed plan for the next sprint.
        </p>
        <p>
          You'll see your value gaps, a six-month outlook, your life design
          summary, and any advisory briefs your practice has shared. Visit it
          when you want the bigger picture.
        </p>
      </div>
    ),
  },
  {
    id: 'sprint',
    icon: Flag,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    title: 'Sprint — your week-by-week dashboard',
    body: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          The <strong>Sprint</strong> page is where most of the action happens.
          Each week unlocks a small set of tasks designed to move one specific
          outcome forward.
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
          <p className="font-semibold text-indigo-900">
            To unlock the next week, you need two things:
          </p>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold mt-0.5">
              1
            </span>
            <p className="text-indigo-800">
              <strong>Complete (or skip)</strong> all of this week's tasks.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold mt-0.5">
              2
            </span>
            <p className="text-indigo-800">
              <strong>Submit your Life Pulse</strong> — a 30-second check-in on
              how the week felt.
            </p>
          </div>
        </div>
        <p>
          Don't worry if you skip a task — be honest. The system uses your real
          data (not assumptions) to refine the next sprint.
        </p>
      </div>
    ),
  },
  {
    id: 'task-walkthrough',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    title: 'How to complete a task',
    body: (
      <div className="space-y-4 text-sm text-slate-600">
        <p>
          Every task has a circle on the left. Tap it once to mark it{' '}
          <strong>in progress</strong>, tap again when you've done it. If you
          didn't get to it, use <em>"Didn't do this"</em> on the right — being
          honest matters more than perfect compliance.
        </p>
        <TaskWalkthroughDemo />
      </div>
    ),
  },
  {
    id: 'pulse-walkthrough',
    icon: Heart,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    title: 'How to submit the Life Pulse',
    body: (
      <div className="space-y-4 text-sm text-slate-600">
        <p>
          At the end of each week, the rose-coloured Life Pulse card appears on
          your Sprint page. It takes about 30 seconds — pick a heart rating,
          tap the life areas you tended to, and submit.
        </p>
        <PulseWalkthroughDemo />
      </div>
    ),
  },
  {
    id: 'life',
    icon: Heart,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    title: 'Life — your alignment thread',
    body: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          Goal Alignment isn't just business goals. The <strong>Life</strong>{' '}
          page tracks how aligned your week feels across five areas: Time,
          Relationships, Health, Experience, and Identity.
        </p>
        <p>
          Your Life Alignment score is calculated from four signals: life-task
          completion, your weekly Life Pulse rating, time you protect for
          yourself, and how broadly you're moving across the five categories.
        </p>
        <p>
          Aim for movement, not perfection — small consistent wins matter more
          than big one-off pushes.
        </p>
      </div>
    ),
  },
  {
    id: 'progress',
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    title: 'Progress — see momentum build',
    body: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          The <strong>Progress</strong> page is where your data tells its story.
          Track wins, weekly trends in Life Alignment and Sprint Progress, and
          the value being created over time.
        </p>
        <p>
          As you complete more weeks, this view becomes a record of momentum —
          and the input your advisor uses to tune what comes next.
        </p>
      </div>
    ),
  },
  {
    id: 'ready',
    icon: Target,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    title: "You're ready to begin",
    body: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>That's the whole loop. Each week:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Read your week's intent and tasks on the Sprint page.</li>
          <li>Tick off (or honestly skip) each task as you go.</li>
          <li>Submit your Life Pulse to close out the week.</li>
          <li>Watch the next week unlock automatically.</li>
        </ol>
        <p className="pt-2">
          You can re-open this guide any time using the{' '}
          <strong>"How this works"</strong> link in the sidebar.
        </p>
      </div>
    ),
  },
];

interface GATutorialModalProps {
  open: boolean;
  onClose: () => void;
}

export function GATutorialModal({ open, onClose }: GATutorialModalProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tutorial"
          className="absolute top-4 right-4 z-10 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step icon + title */}
        <div className="px-8 pt-8 pb-4">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${step.iconBg} mb-4`}>
            <Icon className={`w-6 h-6 ${step.iconColor}`} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 font-display">
            {step.title}
          </h2>
        </div>

        {/* Step body */}
        <div className="flex-1 overflow-y-auto px-8 pb-6">{step.body}</div>

        {/* Step indicators + nav */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-8 py-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStepIndex(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex
                    ? 'w-6 bg-indigo-600'
                    : i < stepIndex
                    ? 'w-1.5 bg-indigo-300'
                    : 'w-1.5 bg-slate-300'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Server-side tutorial-seen state (persisted on `client_service_lines`).
// Falls back to localStorage in the unlikely case the column does not exist
// yet (e.g. migration not yet applied) so the tutorial still doesn't loop.
// ---------------------------------------------------------------------------

const GA_SERVICE_CODES = ['365_method', '365_alignment'];

function localStorageKey(clientId: string | null | undefined): string | null {
  if (!clientId) return null;
  return `ga_tutorial_seen_${clientId}`;
}

/** Returns true if the client has already seen the GA tutorial. */
export async function hasSeenGATutorial(clientId: string | null | undefined): Promise<boolean> {
  if (!clientId) return true;

  try {
    const { data, error } = await supabase
      .from('client_service_lines')
      .select('ga_tutorial_seen_at, service_lines!inner(code)')
      .eq('client_id', clientId)
      .in('service_lines.code', GA_SERVICE_CODES)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return Boolean((data as { ga_tutorial_seen_at: string | null }).ga_tutorial_seen_at);
    }
  } catch (err) {
    console.warn('[GATutorial] read seen flag failed, falling back to localStorage', err);
  }

  // Fallback to localStorage if DB lookup fails (e.g. column missing yet).
  const key = localStorageKey(clientId);
  if (!key) return true;
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return true;
  }
}

/** Marks the GA tutorial as seen for this client (server-side + localStorage cache). */
export async function markGATutorialSeen(clientId: string | null | undefined): Promise<void> {
  if (!clientId) return;

  try {
    const { data: rows } = await supabase
      .from('client_service_lines')
      .select('id, service_lines!inner(code)')
      .eq('client_id', clientId)
      .in('service_lines.code', GA_SERVICE_CODES);

    const ids = (rows ?? []).map((r: { id: string }) => r.id);
    if (ids.length > 0) {
      await supabase
        .from('client_service_lines')
        .update({ ga_tutorial_seen_at: new Date().toISOString() })
        .in('id', ids);
    }
  } catch (err) {
    console.warn('[GATutorial] write seen flag failed, falling back to localStorage', err);
  }

  const key = localStorageKey(clientId);
  if (!key) return;
  try {
    localStorage.setItem(key, '1');
  } catch {
    // ignore — privacy mode etc.
  }
}
