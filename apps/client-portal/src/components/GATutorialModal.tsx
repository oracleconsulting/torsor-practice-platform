// ============================================================================
// GATutorialModal — First-time onboarding for the Goal Alignment programme
// ============================================================================
// Explains the sprint mechanics (12-week sprints, weekly tasks, life pulse,
// week unlocks, etc.) before a client first uses the GA pages.
//
// Storage: localStorage key `ga_tutorial_seen_<clientId>` is set on completion
// or skip so the modal does not auto-open again. A "?" trigger inside
// `Layout` lets the client re-open it from any GA page.
// ============================================================================

import { useEffect, useState } from 'react';
import {
  Map as MapIcon,
  Flag,
  Heart,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Sparkles,
  Target,
} from 'lucide-react';

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
          You can re-open this guide any time using the <strong>?</strong>{' '}
          button in the top-right of any Goal Alignment page.
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
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

// Storage helpers — use clientId so each client sees the tutorial once
function storageKey(clientId: string | null | undefined): string | null {
  if (!clientId) return null;
  return `ga_tutorial_seen_${clientId}`;
}

export function hasSeenGATutorial(clientId: string | null | undefined): boolean {
  const key = storageKey(clientId);
  if (!key) return true;
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return true;
  }
}

export function markGATutorialSeen(clientId: string | null | undefined): void {
  const key = storageKey(clientId);
  if (!key) return;
  try {
    localStorage.setItem(key, '1');
  } catch {
    // ignore — privacy mode etc.
  }
}
