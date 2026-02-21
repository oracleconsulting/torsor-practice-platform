// ============================================================================
// Sprint Command Centre — Dedicated sprint dashboard at /tasks
// ============================================================================
// Replaces the sprint tab in RoadmapPage with a standalone page.
// This week front and centre, Life Alignment + Sprint Progress, inline check-in.
// ============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { PageSkeleton } from '@/components/ui';
import { useRoadmap, useTasks } from '@/hooks/useAnalysis';
import { useWeeklyCheckIn, type LifeAlignmentSummary, type WeeklyCheckIn } from '@/hooks/useWeeklyCheckIn';
import { useAuth } from '@/contexts/AuthContext';
import { TaskCompletionModal } from '@/components/tasks/TaskCompletionModal';
import { supabase } from '@/lib/supabase';
import {
  Heart,
  Flag,
  Briefcase,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Play,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useCatchUpDetection } from '@/hooks/useCatchUpDetection';
import { CatchUpBanner } from '@/components/sprint/CatchUpBanner';
import { CatchUpView } from '@/components/sprint/CatchUpView';
import { SprintCompletionCelebration } from '@/components/sprint/SprintCompletionCelebration';
import { SprintCompletionLoading } from '@/components/sprint/SprintCompletionLoading';
import { SprintSummaryView } from '@/components/sprint/SprintSummaryView';
import { QuarterlyLifeCheck } from '@/components/sprint/QuarterlyLifeCheck';
import { QuarterlyLifeCheckForm } from '@/components/QuarterlyLifeCheckForm';
import { SprintSummaryClientView } from '@/components/SprintSummaryClientView';
import { TuesdayCheckInCard } from '@/components/sprint/TuesdayCheckInCard';
import { LifePulseCard } from '@/components/sprint/LifePulseCard';
import { LifeAlignmentCard } from '@/components/sprint/LifeAlignmentCard';
import { useLifeAlignment } from '@/hooks/useLifeAlignment';
import { useProgress } from '@/hooks/useProgress';
import { RenewalWaiting } from '@/components/sprint/RenewalWaiting';
import { TierUpgradePrompt } from '@/components/sprint/TierUpgradePrompt';
import { checkRenewalEligibility, type RenewalEligibility } from '@/lib/renewal';

// ============================================================================
// CALENDAR WEEK (for catch-up gating)
// ============================================================================

function getCalendarWeek(sprintStartDate: string | null): number {
  if (!sprintStartDate) return 1;
  const start = new Date(sprintStartDate).getTime();
  const now = Date.now();
  const weekNum = Math.ceil((now - start) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(12, weekNum));
}

// ============================================================================
// SPRINT COMPLETION (for Phase 3 summary)
// ============================================================================

export interface SprintCompletionState {
  isSprintComplete: boolean;
  completionStats: {
    totalTasks: number;
    completedTasks: number;
    skippedTasks: number;
    completionRate: number;
    resolutionRate: number;
  };
}

function checkSprintCompletion(
  sprintWeeks: any[],
  dbTasks: any[],
  totalWeeks: number,
): SprintCompletionState {
  let totalTasks = 0;
  let completedTasks = 0;
  let skippedTasks = 0;

  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    const week = sprintWeeks[weekNum - 1];
    if (!week?.tasks) continue;

    for (const task of week.tasks) {
      totalTasks++;
      const dbTask = dbTasks.find(
        (t: any) => t.week_number === weekNum && t.title === task.title,
      );
      if (dbTask?.status === 'completed') completedTasks++;
      else if (dbTask?.status === 'skipped') skippedTasks++;
    }
  }

  const resolvedTasks = completedTasks + skippedTasks;
  const isSprintComplete = totalTasks > 0 && resolvedTasks === totalTasks;

  return {
    isSprintComplete,
    completionStats: {
      totalTasks,
      completedTasks,
      skippedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      resolutionRate: totalTasks > 0 ? Math.round((resolvedTasks / totalTasks) * 100) : 0,
    },
  };
}

// ============================================================================
// CURRENT WEEK HELPERS
// ============================================================================

function getCurrentWeekFromTasks(tasks: any[]): number {
  const activeWeeks = tasks
    .filter(t => t.status !== 'pending' && t.status !== 'skipped')
    .map(t => t.week_number);
  if (activeWeeks.length === 0) return 1;
  const highestActive = Math.max(...activeWeeks);
  const allDoneInHighest = tasks
    .filter(t => t.week_number === highestActive)
    .every(t => t.status === 'completed' || t.status === 'skipped');
  return allDoneInHighest ? Math.min(highestActive + 1, 12) : highestActive;
}

// ============================================================================
// WEEK GATING
// ============================================================================

function computeWeekGating(
  weeks: any[],
  dbTasks: any[]
): {
  activeWeek: number;
  resolvedWeeks: number[];
  lockedWeeks: number[];
  isWeekResolved: (weekNum: number) => boolean;
  isWeekLocked: (weekNum: number) => boolean;
} {
  const resolvedWeeks: number[] = [];

  for (let i = 0; i < (weeks?.length || 0); i++) {
    const week = weeks[i];
    const weekNum = i + 1;
    const generatedTasks = week?.tasks || [];
    const weekDbTasks = dbTasks.filter((t: any) => t.week_number === weekNum);

    const allResolved =
      generatedTasks.length > 0 &&
      generatedTasks.every((gt: any) => {
        const dbTask = weekDbTasks.find((t: any) => t.title === gt.title);
        return dbTask && (dbTask.status === 'completed' || dbTask.status === 'skipped');
      });

    if (allResolved) {
      resolvedWeeks.push(weekNum);
    } else {
      break;
    }
  }

  const activeWeek =
    resolvedWeeks.length > 0
      ? Math.min(resolvedWeeks[resolvedWeeks.length - 1] + 1, 12)
      : 1;

  const lockedWeeks = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (w) => w > activeWeek && !resolvedWeeks.includes(w)
  );

  return {
    activeWeek,
    resolvedWeeks,
    lockedWeeks,
    isWeekResolved: (w) => resolvedWeeks.includes(w),
    isWeekLocked: (w) => lockedWeeks.includes(w),
  };
}

// ============================================================================
// SKIP TASK PROMPT
// ============================================================================

function SkipTaskPrompt({
  taskTitle,
  onSkip,
  onCancel,
}: {
  taskTitle: string;
  onSkip: (reason?: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 className="font-semibold text-slate-900 mb-2">Skip this task?</h3>
        <p className="text-sm text-slate-500 mb-4 truncate" title={taskTitle}>{taskTitle}</p>
        <label className="block text-sm text-slate-600 mb-1">
          Why? <span className="text-slate-400">(optional)</span>
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Didn't get to it, not relevant, etc."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSkip(reason.trim() || undefined)}
            className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
          >
            Mark as Skipped
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HERO METRICS
// ============================================================================

function TrendBadge({ trend }: { trend: 'up' | 'stable' | 'down' }) {
  if (trend === 'up') return <TrendingUp className="w-5 h-5 text-teal-600" />;
  if (trend === 'down') return <TrendingDown className="w-5 h-5 text-amber-600" />;
  return <Minus className="w-5 h-5 text-slate-500" />;
}

function HeroMetrics({
  lifeAlignment,
  sprintProgress,
}: {
  lifeAlignment: LifeAlignmentSummary | null;
  sprintProgress: { completed: number; total: number; percentage: number };
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-semibold text-teal-800 uppercase tracking-wide">
              Life Alignment
            </h3>
          </div>
          {lifeAlignment?.trend && <TrendBadge trend={lifeAlignment.trend} />}
        </div>
        {lifeAlignment ? (
          <>
            <p className="text-4xl font-bold text-teal-900">{lifeAlignment.score}%</p>
            <div className="h-2 bg-teal-200 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${lifeAlignment.score}%` }}
              />
            </div>
            <p className="text-sm text-teal-700 mt-2">{lifeAlignment.summary}</p>
          </>
        ) : (
          <div className="mt-2">
            <p className="text-2xl font-bold text-teal-400">—</p>
            <p className="text-sm text-teal-600 mt-2">
              Complete your first weekly check-in to see your Life Alignment score
            </p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Flag className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-indigo-800 uppercase tracking-wide">
            Sprint Progress
          </h3>
        </div>
        <p className="text-4xl font-bold text-indigo-900">{sprintProgress.percentage}%</p>
        <div className="h-2 bg-indigo-200 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-teal transition-all duration-700 ease-out"
            style={{ width: `${sprintProgress.percentage}%` }}
          />
        </div>
        <p className="text-sm text-indigo-700 mt-2">
          {sprintProgress.completed} of {sprintProgress.total} tasks completed
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// TASK CARD (shared for ThisWeekCard and AllWeeksAccordion)
// ============================================================================

function TaskCard({
  task,
  weekNumber,
  index,
  status,
  dbTask,
  isLife,
  onStatusChange,
  onSkip,
  clientId,
  practiceId,
}: {
  task: any;
  weekNumber: number;
  index: number;
  status: string;
  dbTask: any;
  isLife: boolean;
  onStatusChange: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed', task?: any) => void;
  onSkip?: (info: { dbTaskId: string | null; generatedTask: any; weekNumber: number; index: number }) => void;
  clientId?: string;
  practiceId?: string;
}) {
  const whyText = task.whyThisMatters || task.why;
  const cardClass = isLife
    ? status === 'completed'
      ? 'bg-teal-50 border-teal-200'
      : status === 'skipped'
        ? 'bg-slate-50 border-slate-200 opacity-75'
        : status === 'in_progress'
          ? 'bg-teal-50/70 border-teal-200'
          : 'bg-teal-50/50 border-teal-200'
    : status === 'completed'
      ? 'bg-emerald-50 border-emerald-200'
      : status === 'skipped'
        ? 'bg-slate-50 border-slate-200 opacity-75'
        : status === 'in_progress'
          ? 'bg-blue-50 border-blue-200'
          : 'bg-white border-slate-200';

  const buttonClass = isLife
    ? status === 'completed'
      ? 'bg-teal-500 border-teal-500 text-white'
      : status === 'skipped'
        ? 'border-slate-300 bg-slate-100'
        : status === 'in_progress'
          ? 'border-teal-500 bg-teal-100'
          : 'border-teal-300 hover:border-teal-400'
    : status === 'completed'
      ? 'bg-emerald-500 border-emerald-500 text-white'
      : status === 'skipped'
        ? 'border-slate-300 bg-slate-100'
        : status === 'in_progress'
          ? 'border-blue-500 bg-blue-100'
          : 'border-slate-300 hover:border-slate-400';

  const handleClick = async () => {
    if (status === 'skipped') return;
    const nextStatus =
      status === 'pending' ? 'in_progress' : status === 'in_progress' ? 'completed' : 'pending';

    if (dbTask) {
      onStatusChange(dbTask.id, nextStatus, nextStatus === 'completed' ? { ...dbTask, title: task.title, week_number: weekNumber } : undefined);
    } else {
      if (!clientId || !practiceId) return;
      try {
        const { data: newTask, error: createError } = await supabase
          .from('client_tasks')
          .insert({
            client_id: clientId,
            practice_id: practiceId,
            week_number: weekNumber,
            title: task.title,
            description: task.description,
            category: task.category || 'general',
            priority: task.priority || 'medium',
            status: nextStatus,
            sort_order: index,
            metadata: {
              whyThisMatters: task.whyThisMatters,
              milestone: task.milestone,
              tools: task.tools,
              deliverable: task.deliverable,
              phase: task.phase,
            },
          })
          .select()
          .single();

        if (createError) throw createError;
        if (newTask) {
          onStatusChange(newTask.id, nextStatus, nextStatus === 'completed' ? { ...newTask, title: task.title, week_number: weekNumber } : undefined);
        }
      } catch (err) {
        console.error('[TaskCard] Error creating task:', err);
        alert('Failed to create task. Please refresh the page.');
      }
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${cardClass}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={handleClick}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${buttonClass}`}
        >
          {status === 'completed' && <CheckCircle className="w-4 h-4" />}
          {status === 'in_progress' && <Play className="w-3 h-3 text-blue-500" />}
        </button>
        <div className="flex-1 min-w-0">
          <h5 className={`font-medium ${
            status === 'completed' ? 'text-emerald-700 line-through' :
            status === 'skipped' ? 'text-slate-400 line-through' :
            'text-slate-900'
          }`}>
            {task.title}
          </h5>
          <p className="text-sm text-slate-500 mt-1">{task.description}</p>
          {whyText && <p className="text-sm text-indigo-600 mt-2 italic">Why: {whyText}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="bg-slate-100 px-2 py-0.5 rounded">{task.category}</span>
            {(task.estimatedHours ?? task.timeEstimate) && (
              <span><Clock className="w-3 h-3 inline mr-1" />{task.estimatedHours ?? task.timeEstimate}</span>
            )}
            <span
              className={`px-2 py-0.5 rounded ${
                task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}
            >
              {task.priority || 'medium'}
            </span>
          </div>
        </div>
        {status !== 'completed' && status !== 'skipped' && onSkip && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSkip({ dbTaskId: dbTask?.id ?? null, generatedTask: task, weekNumber, index });
            }}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-auto flex-shrink-0 whitespace-nowrap"
          >
            Didn't do this
          </button>
        )}
        {status === 'skipped' && (
          <span className="text-xs text-slate-400 ml-auto flex-shrink-0 italic">Skipped</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// THIS WEEK CARD
// ============================================================================

/** Match a generated task to its DB counterpart (title or sort_order). Same as RoadmapPage WeekCard. */
function findMatchingDbTask(generatedTask: any, dbTasks: any[], weekNumber: number, taskIndex: number): any {
  return (
    dbTasks.find(
      (t: any) =>
        t.title === generatedTask.title ||
        (t.week_number === weekNumber && t.sort_order === taskIndex)
    ) ?? null
  );
}

function ThisWeekCard({
  week,
  weekNumber,
  dbTasks,
  onTaskStatusChange,
  onSkip,
  isBehind,
  activeWeek,
  calendarWeek,
  onStartCatchUp,
  clientId,
  practiceId,
}: {
  week: any;
  weekNumber: number;
  dbTasks: any[];
  onTaskStatusChange: (taskId: string, status: 'pending' | 'in_progress' | 'completed', task?: any) => void;
  onSkip?: (info: { dbTaskId: string | null; generatedTask: any; weekNumber: number; index: number }) => void;
  isBehind?: boolean;
  activeWeek?: number;
  calendarWeek?: number;
  onStartCatchUp?: () => void;
  clientId?: string;
  practiceId?: string;
}) {
  const narrative = week.narrative || week.focus;
  const weekMilestone = week.weekMilestone || week.milestone;
  const weekTasks = week.tasks || [];
  const lifeTasks = weekTasks.filter((t: any) => t.category?.startsWith?.('life_'));
  const businessTasks = weekTasks.filter((t: any) => !t.category?.startsWith?.('life_'));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">{weekNumber}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{week.theme}</h2>
            {week.phase && <span className="text-indigo-200 text-sm">{week.phase}</span>}
          </div>
        </div>
        {narrative && (
          <p className="text-indigo-100 text-sm mt-3 leading-relaxed">{narrative}</p>
        )}
      </div>

      {dbTasks.length === 0 && weekTasks.length > 0 && (
        <div className="mx-5 mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-800 font-medium">
            Ready to start? Click any task below to begin your first week.
          </p>
        </div>
      )}

      {isBehind && activeWeek != null && calendarWeek != null && onStartCatchUp && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mx-5 mt-5">
          <p className="text-sm text-amber-800">
            You're on Week {activeWeek} — the calendar says Week {calendarWeek}.
            {' '}
            <button
              type="button"
              onClick={onStartCatchUp}
              className="font-semibold text-amber-900 underline hover:no-underline"
            >
              Catch up now →
            </button>
          </p>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {lifeTasks.length > 0 && (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-teal-800 uppercase tracking-wide">
                Life Commitments
              </h3>
            </div>
            <div className="space-y-2">
              {lifeTasks.map((task: any, idx: number) => {
                const taskIndex = weekTasks.indexOf(task);
                const dbTask = findMatchingDbTask(task, dbTasks, weekNumber, taskIndex);
                const status = dbTask?.status || 'pending';
                return (
                  <TaskCard
                    key={task.id || `life-${idx}`}
                    task={task}
                    weekNumber={weekNumber}
                    index={taskIndex}
                    status={status}
                    dbTask={dbTask}
                    isLife
                    onStatusChange={onTaskStatusChange}
                    onSkip={onSkip}
                    clientId={clientId}
                    practiceId={practiceId}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-indigo-800 uppercase tracking-wide">
              Business Tasks
            </h3>
          </div>
          <div className="space-y-2">
            {businessTasks.length > 0 ? (
              businessTasks.map((task: any, idx: number) => {
                const taskIndex = weekTasks.indexOf(task);
                const dbTask = findMatchingDbTask(task, dbTasks, weekNumber, taskIndex);
                const status = dbTask?.status || 'pending';
                return (
                  <TaskCard
                    key={task.id || `biz-${idx}`}
                    task={task}
                    weekNumber={weekNumber}
                    index={taskIndex}
                    status={status}
                    dbTask={dbTask}
                    isLife={false}
                    onStatusChange={onTaskStatusChange}
                    onSkip={onSkip}
                    clientId={clientId}
                    practiceId={practiceId}
                  />
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No business tasks this week.</p>
            )}
          </div>
        </div>
      </div>

      {weekMilestone && (
        <div className="px-5 pb-5">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-semibold uppercase text-xs tracking-wide">By end of week:</span>{' '}
              {weekMilestone}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// WEEKLY CHECK-IN CARD (inline, not modal)
// ============================================================================

const LIFE_SAT_LABELS: Record<number, string> = {
  1: 'Rough week',
  2: 'Surviving',
  3: 'Fine',
  4: 'Good',
  5: 'Great week',
};
const BUSINESS_LABELS: Record<number, string> = {
  1: 'Stuck',
  2: 'Behind',
  3: 'On track',
  4: 'Ahead',
  5: 'Smashed it',
};

function WeeklyCheckInCard({
  currentWeek,
  existingCheckIn,
  onSubmit,
  loading,
}: {
  currentWeek: number;
  existingCheckIn: WeeklyCheckIn | null;
  onSubmit: (data: { weekNumber: number; lifeSatisfaction: 1 | 2 | 3 | 4 | 5; timeProtected: 'yes' | 'mostly' | 'no'; personalWin?: string | null; businessProgress: 1 | 2 | 3 | 4 | 5; blockers?: string | null }) => Promise<boolean>;
  loading: boolean;
}) {
  const [lifeSatisfaction, setLifeSatisfaction] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [timeProtected, setTimeProtected] = useState<'yes' | 'mostly' | 'no' | null>(null);
  const [personalWin, setPersonalWin] = useState('');
  const [businessProgress, setBusinessProgress] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [blockers, setBlockers] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (existingCheckIn) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-700">
              Week {currentWeek} Check-In — Submitted
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {new Date(existingCheckIn.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Life satisfaction</p>
            <p className="font-medium">{LIFE_SAT_LABELS[existingCheckIn.lifeSatisfaction as 1 | 2 | 3 | 4 | 5] ?? existingCheckIn.lifeSatisfaction}</p>
          </div>
          <div>
            <p className="text-slate-500">Protected time</p>
            <p className="font-medium capitalize">{existingCheckIn.timeProtected}</p>
          </div>
          {existingCheckIn.personalWin && (
            <div className="col-span-2">
              <p className="text-slate-500">Personal win</p>
              <p className="font-medium">{existingCheckIn.personalWin}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (lifeSatisfaction == null || timeProtected == null || businessProgress == null) return;
    setSubmitting(true);
    const ok = await onSubmit({
      weekNumber: currentWeek,
      lifeSatisfaction,
      timeProtected,
      personalWin: personalWin.trim() || null,
      businessProgress,
      blockers: blockers.trim() || null,
    });
    setSubmitting(false);
    if (ok) {
      setLifeSatisfaction(null);
      setTimeProtected(null);
      setPersonalWin('');
      setBusinessProgress(null);
      setBlockers('');
    }
  };

  const canSubmit = lifeSatisfaction != null && timeProtected != null && businessProgress != null;
  const isLoading = loading || submitting;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Weekly Check-In — Week {currentWeek}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-700 mb-2">How was your life this week?</label>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLifeSatisfaction(n)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  lifeSatisfaction === n ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {n} — {LIFE_SAT_LABELS[n]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-700 mb-2">Did you protect your time?</label>
          <div className="flex gap-2">
            {(['yes', 'mostly', 'no'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setTimeProtected(opt)}
                className={`rounded-lg border px-3 py-2 text-sm capitalize ${
                  timeProtected === opt ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-700 mb-1">Personal win (optional)</label>
          <input
            type="text"
            maxLength={100}
            value={personalWin}
            onChange={(e) => setPersonalWin(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-700 mb-2">Business progress this week</label>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setBusinessProgress(n)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  businessProgress === n ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {n} — {BUSINESS_LABELS[n]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-700 mb-1">Blockers (optional)</label>
          <textarea
            maxLength={200}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Submit check-in'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS STRIP
// ============================================================================

function ProgressStrip({
  weeks,
  tasks,
  gating,
  calendarWeek,
  onWeekClick,
}: {
  weeks: any[];
  tasks: any[];
  gating: ReturnType<typeof computeWeekGating>;
  calendarWeek: number;
  onWeekClick: (weekNum: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700">12-Week Progress</h3>
        <span className="text-xs text-slate-400">
          Week {gating.activeWeek} of 12
          {calendarWeek > gating.activeWeek + 2 && (
            <span className="text-amber-500 ml-1">(calendar: week {calendarWeek})</span>
          )}
        </span>
      </div>
      <div className="flex gap-1">
        {(weeks || Array.from({ length: 12 }, (_, i) => ({ weekNumber: i + 1, theme: `Week ${i + 1}` }))).map((week: any, i: number) => {
          const weekNum = week.weekNumber ?? i + 1;
          const isResolved = gating.isWeekResolved(weekNum);
          const isLocked = gating.isWeekLocked(weekNum);
          const isActive = weekNum === gating.activeWeek;
          const weekDbTasks = tasks.filter((t: any) => t.week_number === weekNum);
          const completed = weekDbTasks.filter((t: any) => t.status === 'completed').length;
          const skipped = weekDbTasks.filter((t: any) => t.status === 'skipped').length;
          const total = weekDbTasks.length > 0 ? weekDbTasks.length : (week.tasks || []).length;
          let bgColor = 'bg-slate-100 text-slate-400';
          if (isResolved) bgColor = 'bg-emerald-500 text-white';
          else if (isActive) bgColor = 'bg-indigo-500 text-white';
          else if (isLocked) bgColor = 'bg-slate-50 text-slate-300';
          return (
            <button
              key={weekNum}
              type="button"
              onClick={() => !isLocked && onWeekClick(weekNum)}
              disabled={isLocked}
              className={`flex-1 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all ${bgColor} ${
                isActive ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
              } ${isLocked ? 'cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
              title={isLocked
                ? `Week ${weekNum} — Locked (complete Week ${gating.activeWeek} first)`
                : `Week ${weekNum}: ${week.theme ?? ''} — ${completed} done, ${skipped} skipped of ${total}`}
            >
              {isResolved ? '✓' : isLocked ? '🔒' : weekNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// ALL WEEKS ACCORDION
// ============================================================================

function AllWeeksAccordion({
  weeks,
  tasks,
  gating,
  scrollToWeek,
  onScrolledToWeek,
  onTaskStatusChange,
  onSkip,
  clientId,
  practiceId,
}: {
  weeks: any[];
  tasks: any[];
  gating: ReturnType<typeof computeWeekGating>;
  scrollToWeek: number | null;
  onScrolledToWeek?: () => void;
  onTaskStatusChange: (taskId: string, status: 'pending' | 'in_progress' | 'completed', task?: any) => void;
  onSkip?: (info: { dbTaskId: string | null; generatedTask: any; weekNumber: number; index: number }) => void;
  clientId?: string;
  practiceId?: string;
}) {
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const weekRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (scrollToWeek != null && weekRefs.current[scrollToWeek] && !gating.isWeekLocked(scrollToWeek)) {
      setOpenWeek(scrollToWeek);
      const el = weekRefs.current[scrollToWeek];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      onScrolledToWeek?.();
    }
  }, [scrollToWeek, onScrolledToWeek, gating]);

  const list = weeks?.length ? weeks : Array.from({ length: 12 }, (_, i) => ({ weekNumber: i + 1, theme: `Week ${i + 1}`, tasks: [] }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">All Weeks</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {list.map((week: any) => {
          const weekNum = week.weekNumber ?? week.week;
          const isLocked = gating.isWeekLocked(weekNum);
          const isResolved = gating.isWeekResolved(weekNum);
          const weekTasks = tasks.filter((t: any) => t.week_number === weekNum);
          const weekTaskList = week.tasks || [];
          const completedCount = weekTasks.filter((t: any) => t.status === 'completed').length;
          const skippedCount = weekTasks.filter((t: any) => t.status === 'skipped').length;
          const totalCount = weekTaskList.length > 0 ? weekTaskList.length : weekTasks.length;
          const progress = totalCount > 0 ? Math.round(((completedCount + skippedCount) / totalCount) * 100) : 0;
          const isActive = openWeek === weekNum;
          const lifeTasks = weekTaskList.filter((t: any) => t.category?.startsWith?.('life_'));
          const businessTasks = weekTaskList.filter((t: any) => !t.category?.startsWith?.('life_'));

          return (
            <div
              key={weekNum}
              ref={(el) => { weekRefs.current[weekNum] = el; }}
              className={`scroll-mt-24 ${isLocked ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                onClick={() => {
                  if (isLocked) return;
                  setOpenWeek(isActive ? null : weekNum);
                }}
                disabled={isLocked}
                className={`w-full p-4 flex items-center gap-4 text-left transition-colors ${
                  isLocked ? 'cursor-not-allowed' : 'hover:bg-slate-50'
                } ${isResolved ? 'bg-emerald-50/50' : ''} ${weekNum === gating.activeWeek ? 'border-l-4 border-l-indigo-500' : ''}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isResolved ? 'bg-emerald-500 text-white' :
                    weekNum === gating.activeWeek ? 'bg-indigo-500 text-white' :
                    isLocked ? 'bg-slate-100 text-slate-300' :
                    'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isResolved ? <CheckCircle className="w-6 h-6" /> : isLocked ? <Lock className="w-5 h-5" /> : <span className="font-bold text-lg">{weekNum}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900">{week.theme}</h4>
                  <p className="text-sm text-slate-500">{week.focus || week.narrative || ''}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-medium text-slate-900">{completedCount + skippedCount}/{totalCount} tasks</span>
                  {isLocked && (
                    <span className="text-xs text-slate-400">Complete Week {gating.activeWeek} to unlock</span>
                  )}
                  {isActive ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>
              {isActive && !isLocked && (
                <div className="px-4 pb-4">
                  <div className="ml-16 space-y-2">
                    {lifeTasks.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mt-2">
                          <Heart className="w-4 h-4 text-teal-500" />
                          <span className="text-xs font-semibold text-teal-700 uppercase">Life</span>
                        </div>
                        {lifeTasks.map((task: any, idx: number) => {
                          const taskIndex = weekTaskList.indexOf(task);
                          const dbTask = findMatchingDbTask(task, weekTasks, weekNum, taskIndex);
                          const status = dbTask?.status || 'pending';
                          return (
                            <TaskCard
                              key={task.id || `life-${weekNum}-${idx}`}
                              task={task}
                              weekNumber={weekNum}
                              index={taskIndex}
                              status={status}
                              dbTask={dbTask}
                              isLife
                              onStatusChange={onTaskStatusChange}
                              onSkip={onSkip}
                              clientId={clientId}
                              practiceId={practiceId}
                            />
                          );
                        })}
                      </>
                    )}
                    {businessTasks.map((task: any, idx: number) => {
                      const taskIndex = weekTaskList.indexOf(task);
                      const dbTask = findMatchingDbTask(task, weekTasks, weekNum, taskIndex);
                      const status = dbTask?.status || 'pending';
                      return (
                        <TaskCard
                          key={task.id || `biz-${weekNum}-${idx}`}
                          task={task}
                          weekNumber={weekNum}
                          index={taskIndex}
                          status={status}
                          dbTask={dbTask}
                          isLife={false}
                          onStatusChange={onTaskStatusChange}
                          onSkip={onSkip}
                          clientId={clientId}
                          practiceId={practiceId}
                        />
                      );
                    })}
                  </div>
                  {(week.weekMilestone || week.milestone) && (
                    <div className="ml-16 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <span className="uppercase text-xs tracking-wide">Milestone:</span> {week.weekMilestone || week.milestone}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function SprintDashboardPage() {
  const { clientSession } = useAuth();
  const { roadmap, fetchRoadmap, loading: roadmapLoading } = useRoadmap();
  const { tasks, fetchTasks, updateTaskStatus } = useTasks();
  const { recalculate: recalculateProgress } = useProgress();
  const {
    submit: submitCheckIn,
    fetchCheckIn,
    fetchHistory,
    getLifeAlignmentSummary,
    checkIn,
    loading: checkInLoading,
  } = useWeeklyCheckIn();

  const [scrollToWeek, setScrollToWeek] = useState<number | null>(null);
  const [completingTask, setCompletingTask] = useState<{ id: string; title: string; week_number: number; category?: string } | null>(null);
  const [skippingTask, setSkippingTask] = useState<{
    dbTaskId: string | null;
    generatedTask: any;
    weekNumber: number;
    index: number;
  } | null>(null);
  const [catchUpMode, setCatchUpMode] = useState(false);
  const [sprintStartDate, setSprintStartDate] = useState<string | null>(null);
  const [sprintSummary, setSprintSummary] = useState<{ summary: any; analytics: any } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [renewalState, setRenewalState] = useState<RenewalEligibility | null>(null);
  const [currentSprintNumber, setCurrentSprintNumber] = useState<number>(1);
  const [part1Responses, setPart1Responses] = useState<Record<string, any> | null>(null);
  const completionTriggeredRef = useRef(false);
  const [enrichmentSources, setEnrichmentSources] = useState<{
    financial?: boolean;
    systems?: boolean;
    market?: boolean;
    valueAnalysis?: boolean;
    discovery?: boolean;
  } | null>(null);

  const sprint = roadmap?.roadmapData?.sprint;
  const weeks = sprint?.weeks || [];
  const completionState = checkSprintCompletion(weeks, tasks, 12);
  const sprintSummaryFromRoadmap = roadmap?.roadmapData?.sprintSummary ?? null;
  const allWeeksResolved = completionState.isSprintComplete;
  const showSprintSummary = !!sprintSummaryFromRoadmap && allWeeksResolved;

  const gating = computeWeekGating(weeks, tasks);
  const {
    scores: lifeScores,
    currentScore: lifeScore,
    trend: lifeTrend,
    categoryScores,
    submitPulse,
    hasPulseThisWeek,
    recalculateScore,
    loading: lifeLoading,
  } = useLifeAlignment(currentSprintNumber, gating.activeWeek);

  const calendarWeek = getCalendarWeek(sprintStartDate);
  const catchUpState = useCatchUpDetection(
    sprintStartDate,
    { activeWeek: gating.activeWeek, resolvedWeeks: gating.resolvedWeeks },
    12,
  );
  const isBehind = catchUpState.isCatchUpNeeded;

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  useEffect(() => {
    if (!clientSession?.clientId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('roadmap_stages')
          .select('metadata')
          .eq('client_id', clientSession.clientId)
          .in('stage_type', ['sprint_plan_part2', 'sprint_plan_part1', 'sprint_plan'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.metadata?.enrichmentSources) {
          setEnrichmentSources(data.metadata.enrichmentSources);
        }
      } catch {}
    })();
  }, [clientSession?.clientId]);

  // Fetch current sprint number from enrollment (for catch-up and task writes)
  useEffect(() => {
    if (!clientSession?.clientId) return;
    (async () => {
      const { data: sl } = await supabase
        .from('service_lines')
        .select('id')
        .eq('code', '365_method')
        .maybeSingle();
      if (!sl?.id) return;
      const { data: enrollment } = await supabase
        .from('client_service_lines')
        .select('current_sprint_number')
        .eq('client_id', clientSession.clientId)
        .eq('service_line_id', sl.id)
        .maybeSingle();
      if (enrollment?.current_sprint_number != null) {
        setCurrentSprintNumber(enrollment.current_sprint_number);
      }
    })();
  }, [clientSession?.clientId]);

  useEffect(() => {
    async function fetchSprintStart() {
      if (!clientSession?.clientId) return;
      const { data } = await supabase
        .from('roadmap_stages')
        .select('created_at, approved_at, published_at')
        .eq('client_id', clientSession.clientId)
        .in('stage_type', ['sprint_plan_part2', 'sprint_plan'])
        .in('status', ['generated', 'approved', 'published'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSprintStartDate(data.published_at || data.approved_at || data.created_at);
      }
    }
    fetchSprintStart();
  }, [clientSession?.clientId]);

  useEffect(() => {
    if (roadmap?.roadmapData?.sprint) {
      fetchTasks();
    }
  }, [roadmap?.roadmapData?.sprint, fetchTasks]);

  useEffect(() => {
    fetchHistory(12);
  }, [fetchHistory]);

  useEffect(() => {
    if (gating.activeWeek >= 1) {
      fetchCheckIn(gating.activeWeek);
    }
  }, [gating.activeWeek, fetchCheckIn]);

  // When sprint is complete: fetch existing summary or trigger generation
  useEffect(() => {
    if (!completionState.isSprintComplete || !clientSession?.clientId) return;

    let cancelled = false;

    async function run() {
      const { data } = await supabase
        .from('roadmap_stages')
        .select('generated_content, approved_content, status')
        .eq('client_id', clientSession!.clientId)
        .eq('stage_type', 'sprint_summary')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      const content = data?.approved_content || data?.generated_content;
      if (content?.summary) {
        setSprintSummary({ summary: content.summary, analytics: content.analytics || {} });
        setSummaryLoading(false);
        return;
      }

      if (completionTriggeredRef.current) return;
      completionTriggeredRef.current = true;
      setSummaryLoading(true);
      const { error } = await supabase.functions.invoke('generate-sprint-summary', {
        body: {
          clientId: clientSession!.clientId,
          practiceId: clientSession?.practiceId ?? undefined,
          sprintNumber: 1,
        },
      });
      if (cancelled) return;
      if (error) {
        console.error('Failed to queue sprint summary:', error);
        setSummaryLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [completionState.isSprintComplete, clientSession?.clientId, clientSession?.practiceId]);

  // Poll for sprint summary while loading
  useEffect(() => {
    if (!summaryLoading || !clientSession?.clientId) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('roadmap_stages')
        .select('generated_content, approved_content')
        .eq('client_id', clientSession.clientId)
        .eq('stage_type', 'sprint_summary')
        .in('status', ['generated', 'approved', 'published'])
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const content = data?.approved_content || data?.generated_content;
      if (content?.summary) {
        setSprintSummary({ summary: content.summary, analytics: content.analytics || {} });
        setSummaryLoading(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [summaryLoading, clientSession?.clientId]);

  // Fetch renewal eligibility when sprint is complete (so life_check_pending shows form even before summary)
  useEffect(() => {
    if (!completionState.isSprintComplete || !clientSession?.clientId || !clientSession?.practiceId) return;
    checkRenewalEligibility(supabase, clientSession.clientId, clientSession.practiceId).then(setRenewalState);
  }, [completionState.isSprintComplete, clientSession?.clientId, clientSession?.practiceId]);

  // Fetch Part 1 responses when life check is pending (for QuarterlyLifeCheck context)
  useEffect(() => {
    if (renewalState?.renewalStatus !== 'life_check_pending' || !clientSession?.clientId) return;
    supabase
      .from('client_assessments')
      .select('responses')
      .eq('client_id', clientSession.clientId)
      .eq('assessment_type', 'part1')
      .maybeSingle()
      .then(({ data }) => setPart1Responses(data?.responses ?? null));
  }, [renewalState?.renewalStatus, clientSession?.clientId]);

  const handleLifeCheckComplete = useCallback(() => {
    if (!clientSession?.clientId || !clientSession?.practiceId) return;
    checkRenewalEligibility(supabase, clientSession.clientId, clientSession.practiceId).then(setRenewalState);
  }, [clientSession?.clientId, clientSession?.practiceId]);

  const handleSprintCompletion = useCallback(() => {
    if (!clientSession?.clientId) return;
    completionTriggeredRef.current = true;
    setSummaryLoading(true);
    supabase.functions.invoke('generate-sprint-summary', {
      body: {
        clientId: clientSession.clientId,
        practiceId: clientSession?.practiceId ?? undefined,
        sprintNumber: 1,
      },
    }).then(({ error }) => {
      if (error) {
        console.error('Failed to queue sprint summary:', error);
        setSummaryLoading(false);
      }
    });
  }, [clientSession?.clientId, clientSession?.practiceId]);

  const handleSkipTask = useCallback(
    async (info: { dbTaskId: string | null; generatedTask: any; weekNumber: number; index: number }, reason?: string) => {
      const { dbTaskId, generatedTask, weekNumber, index } = info;
      if (dbTaskId) {
        await updateTaskStatus(dbTaskId, 'skipped', undefined, reason);
      } else {
        if (!clientSession?.clientId || !clientSession?.practiceId) return;
        const { error } = await supabase
          .from('client_tasks')
          .insert({
            client_id: clientSession.clientId,
            practice_id: clientSession.practiceId,
            week_number: weekNumber,
            title: generatedTask.title,
            description: generatedTask.description,
            category: generatedTask.category || 'general',
            priority: generatedTask.priority || 'medium',
            status: 'skipped',
            skip_reason: reason || null,
            skipped_at: new Date().toISOString(),
            sort_order: index,
            metadata: {
              whyThisMatters: generatedTask.whyThisMatters,
              deliverable: generatedTask.deliverable,
              phase: generatedTask.phase,
            },
          })
          .select()
          .single();
        if (!error) await fetchTasks();
      }
      setSkippingTask(null);
    },
    [updateTaskStatus, clientSession, fetchTasks]
  );

  const handleCatchUpComplete = useCallback(() => {
    fetchTasks();
    setCatchUpMode(false);
  }, [fetchTasks]);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed', task?: any) => {
      if (newStatus === 'completed' && task) {
        setCompletingTask({
          id: taskId,
          title: task.title,
          week_number: task.week_number || 1,
          category: task?.category,
        });
      } else {
        await updateTaskStatus(taskId, newStatus);
      }
    },
    [updateTaskStatus]
  );

  const handleTaskComplete = useCallback(
    async (taskId: string, feedback: { whatWentWell: string; whatDidntWork: string; additionalNotes: string }) => {
      const task = completingTask;
      const wasLifeTask = task?.category?.startsWith?.('life_');
      await updateTaskStatus(taskId, 'completed', feedback);
      setCompletingTask(null);
      if (wasLifeTask && recalculateScore) {
        recalculateScore();
      }
      try {
        await recalculateProgress();
      } catch (e) {
        console.warn('Progress snapshot recalculate failed', e);
      }
      if (task && (clientSession?.clientId && clientSession?.practiceId)) {
        const isMilestone =
          task.title?.toLowerCase().includes('milestone') ||
          (task as { deliverable?: boolean }).deliverable === true;
        if (isMilestone) {
          try {
            await supabase.from('client_wins').insert({
              client_id: clientSession.clientId,
              practice_id: clientSession.practiceId,
              sprint_number: currentSprintNumber,
              week_number: task.week_number ?? undefined,
              title: `Completed: ${task.title}`,
              category: task.category?.startsWith('life_') ? 'life' : 'general',
              source: 'auto',
            });
          } catch (err) {
            console.warn('Auto-add client win failed', err);
          }
        }
      }
    },
    [updateTaskStatus, completingTask, recalculateScore, recalculateProgress, clientSession?.clientId, clientSession?.practiceId, currentSprintNumber]
  );

  const lifeAlignment = getLifeAlignmentSummary();

  // Sprint progress: use generated task counts as baseline when DB is empty (cold start)
  const generatedTaskCount =
    sprint?.weeks?.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0) || 0;
  const generatedBusinessTaskCount =
    sprint?.weeks?.reduce(
      (sum: number, w: any) =>
        sum + (w.tasks?.filter((t: any) => !t.category?.startsWith?.('life_')).length || 0),
      0
    ) || 0;
  const dbBusinessTasks = tasks.filter((t: any) => !t.category?.startsWith?.('life_'));
  const dbLifeTasksExist = tasks.some((t: any) => t.category?.startsWith?.('life_'));
  const completed = dbBusinessTasks.filter((t: any) => t.status === 'completed').length;
  const total =
    dbBusinessTasks.length > 0
      ? dbBusinessTasks.length
      : dbLifeTasksExist
        ? generatedBusinessTaskCount
        : generatedTaskCount;
  const sprintProgress = {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };

  const displayWeekData = weeks[gating.activeWeek - 1];
  const thisWeekTasks = tasks.filter((t: any) => t.week_number === gating.activeWeek);

  if (roadmapLoading && !roadmap) {
    return (
      <Layout title="Your Sprint">
        <PageSkeleton />
      </Layout>
    );
  }

  if (!sprint || !weeks.length) {
    const hasUnpublishedSprint = roadmap?.hasUnpublishedSprint === true;
    return (
      <Layout title="Your Sprint" subtitle="Sprint Command Centre">
        <div className="text-center py-16">
          <Flag className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {hasUnpublishedSprint ? 'Your sprint is with your advisor' : 'Your Sprint is Being Prepared'}
          </h2>
          <p className="text-slate-600 mb-6">
            {hasUnpublishedSprint
              ? 'Your 12-week sprint has been created and is ready for your advisor to review and publish. It will appear here once they’ve approved it.'
              : 'Once your roadmap is finalised, your 12-week sprint plan will appear here.'}
          </p>
          <Link to="/roadmap" className="text-indigo-600 hover:text-indigo-700 font-medium">
            View your roadmap →
          </Link>
        </div>
      </Layout>
    );
  }

  if (completionState.isSprintComplete && renewalState?.renewalStatus !== 'life_check_pending') {
    const status = renewalState?.renewalStatus;
    const name = clientSession?.name?.split(' ')[0];

    return (
      <Layout title="Your Sprint" subtitle={sprint.sprintTheme || 'Your 12-week transformation'}>
        <div className="space-y-6">
          {!sprintSummary ? (
            summaryLoading ? (
              <SprintCompletionLoading />
            ) : (
              <SprintCompletionCelebration
                completionStats={completionState.completionStats}
                onRequestSummary={handleSprintCompletion}
                isGenerating={false}
              />
            )
          ) : status === 'life_check_pending' ? (
            <QuarterlyLifeCheck
              clientId={clientSession?.clientId ?? ''}
              practiceId={clientSession?.practiceId ?? ''}
              sprintNumber={(renewalState?.currentSprint ?? 1) + 1}
              serviceLineId={renewalState?.serviceLineId}
              part1Responses={part1Responses}
              sprintSummary={sprintSummary}
              onComplete={handleLifeCheckComplete}
            />
          ) : status === 'life_check_complete' ? (
            <RenewalWaiting
              message="Your advisor is preparing your next sprint."
              sprintSummary={sprintSummary}
              clientName={name}
            />
          ) : status === 'generating' ? (
            <RenewalWaiting
              message="Your Sprint 2 is being generated..."
              showSpinner
              sprintSummary={sprintSummary}
              clientName={name}
            />
          ) : status === 'review_pending' ? (
            <RenewalWaiting
              message="Your advisor is reviewing Sprint 2 before it's ready."
              sprintSummary={sprintSummary}
              clientName={name}
            />
          ) : (
            <>
              <SprintSummaryView
                summary={sprintSummary.summary}
                analytics={sprintSummary.analytics}
                clientName={name}
              />
              {renewalState && !renewalState.isEligible && renewalState.currentSprint >= renewalState.maxSprints && (
                <TierUpgradePrompt currentTier={renewalState.tierName} />
              )}
            </>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Your Sprint" subtitle={sprint.sprintTheme || 'Your 12-week transformation'}>
      {catchUpMode ? (
        <CatchUpView
          unresolvedWeeks={catchUpState.unresolvedWeeks}
          sprintWeeks={weeks}
          dbTasks={tasks}
          clientId={clientSession?.clientId ?? ''}
          practiceId={clientSession?.practiceId ?? ''}
          sprintNumber={renewalState?.currentSprint ?? currentSprintNumber}
          onComplete={handleCatchUpComplete}
          onCancel={() => setCatchUpMode(false)}
        />
      ) : (
        <div className="space-y-6">
          {showSprintSummary && (
            <SprintSummaryClientView
              summary={sprintSummaryFromRoadmap}
              clientName={clientSession?.name?.split(' ')[0]}
              onStartLifeCheck={
                renewalState?.renewalStatus === 'life_check_pending'
                  ? () => document.getElementById('life-check-form')?.scrollIntoView({ behavior: 'smooth' })
                  : undefined
              }
            />
          )}
          {renewalState?.renewalStatus === 'life_check_pending' &&
            clientSession?.clientId &&
            clientSession?.practiceId && (
              <div id="life-check-form">
                <QuarterlyLifeCheckForm
                  clientId={clientSession.clientId}
                  practiceId={clientSession.practiceId}
                  sprintNumber={renewalState.currentSprint ?? 1}
                  clientName={clientSession.name?.split(' ')[0]}
                  onComplete={handleLifeCheckComplete}
                />
              </div>
            )}
          {isBehind && (
            <CatchUpBanner
              weeksBehind={catchUpState.weeksBehind}
              unresolvedWeekCount={catchUpState.unresolvedWeeks.length}
              onEnter={() => setCatchUpMode(true)}
            />
          )}
          {enrichmentSources && Object.values(enrichmentSources).some(Boolean) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span>
                This sprint was personalised using your{' '}
                {[
                  enrichmentSources.financial && 'financial data',
                  enrichmentSources.systems && 'Systems Audit findings',
                  enrichmentSources.market && 'Benchmarking results',
                  enrichmentSources.valueAnalysis && 'Value Analysis',
                  enrichmentSources.discovery && 'Discovery insights',
                ].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {/* Life Alignment — before Tuesday Check-In */}
          {!isBehind && !completionState.isSprintComplete && (
            <>
              <LifeAlignmentCard
                scores={lifeScores}
                currentScore={lifeScore}
                trend={lifeTrend}
                categoryScores={categoryScores}
              />
              {!hasPulseThisWeek && (
                <LifePulseCard
                  sprintNumber={currentSprintNumber}
                  weekNumber={gating.activeWeek}
                  isCatchUp={isBehind}
                  isSprintComplete={completionState.isSprintComplete}
                  onSubmit={submitPulse}
                  currentScore={lifeScore}
                  loading={lifeLoading}
                />
              )}
            </>
          )}
          {displayWeekData?.tuesdayCheckIn && !showSprintSummary && (
            <TuesdayCheckInCard
              checkInPrompt={displayWeekData.tuesdayCheckIn}
              weekNumber={gating.activeWeek}
              weekTheme={displayWeekData.theme}
              isActiveWeek={true}
            />
          )}
          <HeroMetrics lifeAlignment={lifeAlignment} sprintProgress={sprintProgress} />
          {displayWeekData && (
            <ThisWeekCard
              week={displayWeekData}
              weekNumber={gating.activeWeek}
              dbTasks={thisWeekTasks}
              onTaskStatusChange={handleTaskStatusChange}
              onSkip={(info) => setSkippingTask(info)}
              isBehind={isBehind}
              activeWeek={gating.activeWeek}
              calendarWeek={calendarWeek}
              onStartCatchUp={() => setCatchUpMode(true)}
              clientId={clientSession?.clientId}
              practiceId={clientSession?.practiceId}
            />
          )}
          <WeeklyCheckInCard
            currentWeek={gating.activeWeek}
            existingCheckIn={checkIn?.weekNumber === gating.activeWeek ? checkIn : null}
            onSubmit={async (data) => {
              const ok = await submitCheckIn({ ...data, weekNumber: gating.activeWeek });
              if (ok) {
                await fetchHistory(12);
                fetchCheckIn(gating.activeWeek);
              }
              return ok;
            }}
            loading={checkInLoading}
          />
          {/* Sticky progress strip — stays visible when scrolling */}
          <div className="sticky top-0 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-3 bg-white/95 backdrop-blur-sm border-b border-slate-100">
            <ProgressStrip
              weeks={weeks}
              tasks={tasks}
              gating={gating}
              calendarWeek={calendarWeek}
              onWeekClick={(w) => setScrollToWeek(w)}
            />
          </div>
          <AllWeeksAccordion
            weeks={weeks}
            tasks={tasks}
            gating={gating}
            scrollToWeek={scrollToWeek}
            onScrolledToWeek={() => setScrollToWeek(null)}
            onTaskStatusChange={handleTaskStatusChange}
            onSkip={(info) => setSkippingTask(info)}
            clientId={clientSession?.clientId}
            practiceId={clientSession?.practiceId}
          />
        </div>
      )}

      {skippingTask && (
        <SkipTaskPrompt
          taskTitle={skippingTask.generatedTask.title}
          onSkip={(reason) => handleSkipTask(skippingTask, reason)}
          onCancel={() => setSkippingTask(null)}
        />
      )}

      {completingTask && (
        <TaskCompletionModal
          task={completingTask}
          isOpen
          onClose={() => setCompletingTask(null)}
          onComplete={handleTaskComplete}
        />
      )}
    </Layout>
  );
}
