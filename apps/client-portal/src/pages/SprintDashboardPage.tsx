// ============================================================================
// Sprint Command Centre — Dedicated sprint dashboard at /tasks
// ============================================================================
// Replaces the sprint tab in RoadmapPage with a standalone page.
// This week front and centre, Life Alignment + Sprint Progress, inline check-in.
// ============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
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
} from 'lucide-react';

// ============================================================================
// CURRENT WEEK HELPERS
// ============================================================================

function getCurrentWeekFromTasks(tasks: any[]): number {
  const activeWeeks = tasks
    .filter(t => t.status !== 'pending')
    .map(t => t.week_number);
  if (activeWeeks.length === 0) return 1;
  const highestActive = Math.max(...activeWeeks);
  const allDoneInHighest = tasks
    .filter(t => t.week_number === highestActive)
    .every(t => t.status === 'completed');
  return allDoneInHighest ? Math.min(highestActive + 1, 12) : highestActive;
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
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
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
  clientId?: string;
  practiceId?: string;
}) {
  const whyText = task.whyThisMatters || task.why;
  const cardClass = isLife
    ? status === 'completed'
      ? 'bg-teal-50 border-teal-200'
      : status === 'in_progress'
        ? 'bg-teal-50/70 border-teal-200'
        : 'bg-teal-50/50 border-teal-200'
    : status === 'completed'
      ? 'bg-emerald-50 border-emerald-200'
      : status === 'in_progress'
        ? 'bg-blue-50 border-blue-200'
        : 'bg-white border-slate-200';

  const buttonClass = isLife
    ? status === 'completed'
      ? 'bg-teal-500 border-teal-500 text-white'
      : status === 'in_progress'
        ? 'border-teal-500 bg-teal-100'
        : 'border-teal-300 hover:border-teal-400'
    : status === 'completed'
      ? 'bg-emerald-500 border-emerald-500 text-white'
      : status === 'in_progress'
        ? 'border-blue-500 bg-blue-100'
        : 'border-slate-300 hover:border-slate-400';

  const handleClick = async () => {
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
        <div className="flex-1">
          <h5 className={`font-medium ${status === 'completed' ? 'text-emerald-700 line-through' : 'text-slate-900'}`}>
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
      </div>
    </div>
  );
}

// ============================================================================
// THIS WEEK CARD
// ============================================================================

function ThisWeekCard({
  week,
  weekNumber,
  tasks,
  onTaskStatusChange,
  clientId,
  practiceId,
}: {
  week: any;
  weekNumber: number;
  tasks: any[];
  onTaskStatusChange: (taskId: string, status: 'pending' | 'in_progress' | 'completed', task?: any) => void;
  clientId?: string;
  practiceId?: string;
}) {
  const narrative = week.narrative || week.focus;
  const weekMilestone = week.weekMilestone || week.milestone;
  const weekTasks = week.tasks || [];
  const lifeTasks = weekTasks.filter((t: any) => t.category?.startsWith?.('life_'));
  const businessTasks = weekTasks.filter((t: any) => !t.category?.startsWith?.('life_'));

  const allTasksPending =
    weekTasks.length > 0 &&
    weekTasks.every((task: any) => {
      const dbTask = tasks.find((t: any) => t.title === task.title || (t.week_number === weekNumber && t.sort_order === weekTasks.indexOf(task)));
      return !dbTask || dbTask.status === 'pending';
    });

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

      {allTasksPending && (
        <div className="mx-5 mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-800 font-medium">
            Ready to start? Click any task below to begin your first week.
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
                const dbTask = tasks.find(t => t.title === task.title || (t.week_number === weekNumber && t.sort_order === weekTasks.indexOf(task)));
                const status = dbTask?.status || 'pending';
                return (
                  <TaskCard
                    key={task.id || `life-${idx}`}
                    task={task}
                    weekNumber={weekNumber}
                    index={weekTasks.indexOf(task)}
                    status={status}
                    dbTask={dbTask}
                    isLife
                    onStatusChange={onTaskStatusChange}
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
                const dbTask = tasks.find(t => t.title === task.title || (t.week_number === weekNumber && t.sort_order === weekTasks.indexOf(task)));
                const status = dbTask?.status || 'pending';
                return (
                  <TaskCard
                    key={task.id || `biz-${idx}`}
                    task={task}
                    weekNumber={weekNumber}
                    index={weekTasks.indexOf(task)}
                    status={status}
                    dbTask={dbTask}
                    isLife={false}
                    onStatusChange={onTaskStatusChange}
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
  currentWeek,
  onWeekClick,
}: {
  weeks: any[];
  tasks: any[];
  currentWeek: number;
  onWeekClick: (weekNum: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700">12-Week Progress</h3>
        <span className="text-xs text-slate-400">Week {currentWeek} of 12</span>
      </div>
      <div className="flex gap-1">
        {(weeks || Array.from({ length: 12 }, (_, i) => ({ weekNumber: i + 1, theme: `Week ${i + 1}` }))).map((week: any, i: number) => {
          const weekNum = week.weekNumber ?? i + 1;
          const weekTasks = tasks.filter((t: any) => t.week_number === weekNum);
          const total = week.tasks?.length ?? weekTasks.length;
          const completed = weekTasks.filter((t: any) => t.status === 'completed').length;
          const isCurrent = weekNum === currentWeek;
          const allDone = total > 0 && completed === total;
          const hasActivity = weekTasks.length > 0;
          let bgColor = 'bg-slate-100';
          if (allDone) bgColor = 'bg-emerald-500';
          else if (hasActivity && completed > 0) bgColor = 'bg-indigo-300';
          else if (weekNum < currentWeek) bgColor = 'bg-slate-200';
          return (
            <button
              key={weekNum}
              onClick={() => onWeekClick(weekNum)}
              className={`flex-1 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all hover:scale-105 ${bgColor} ${
                isCurrent ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
              } ${allDone ? 'text-white' : 'text-slate-500'}`}
              title={`Week ${weekNum}: ${week.theme ?? ''} — ${completed}/${total} tasks`}
            >
              {allDone ? '✓' : weekNum}
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
  currentWeek,
  scrollToWeek,
  onScrolledToWeek,
  onTaskStatusChange,
  clientId,
  practiceId,
}: {
  weeks: any[];
  tasks: any[];
  currentWeek: number;
  scrollToWeek: number | null;
  onScrolledToWeek?: () => void;
  onTaskStatusChange: (taskId: string, status: 'pending' | 'in_progress' | 'completed', task?: any) => void;
  clientId?: string;
  practiceId?: string;
}) {
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const weekRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (scrollToWeek != null && weekRefs.current[scrollToWeek]) {
      weekRefs.current[scrollToWeek]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setOpenWeek(scrollToWeek);
      onScrolledToWeek?.();
    }
  }, [scrollToWeek, onScrolledToWeek]);

  const list = weeks?.length ? weeks : Array.from({ length: 12 }, (_, i) => ({ weekNumber: i + 1, theme: `Week ${i + 1}`, tasks: [] }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">All Weeks</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {list.map((week: any) => {
          const weekNum = week.weekNumber ?? week.week;
          const weekTasks = tasks.filter((t: any) => t.week_number === weekNum);
          const weekTaskList = week.tasks || [];
          const completedCount = weekTasks.filter((t: any) => t.status === 'completed').length;
          const totalCount = weekTaskList.length || weekTasks.length || 0;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isActive = openWeek === weekNum;
          const isCurrent = weekNum === currentWeek;
          const lifeTasks = weekTaskList.filter((t: any) => t.category?.startsWith?.('life_'));
          const businessTasks = weekTaskList.filter((t: any) => !t.category?.startsWith?.('life_'));

          return (
            <div key={weekNum} ref={(el) => { weekRefs.current[weekNum] = el; }}>
              <button
                onClick={() => setOpenWeek(isActive ? null : weekNum)}
                className={`w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left ${isCurrent ? 'border-l-4 border-l-indigo-500' : ''}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    progress === 100 ? 'bg-emerald-500 text-white' : progress > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {progress === 100 ? <CheckCircle className="w-6 h-6" /> : <span className="font-bold text-lg">{weekNum}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900">{week.theme}</h4>
                  <p className="text-sm text-slate-500">{week.focus || week.narrative || ''}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-medium text-slate-900">{completedCount}/{totalCount} tasks</span>
                  {isActive ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>
              {isActive && (
                <div className="px-4 pb-4">
                  <div className="ml-16 space-y-2">
                    {lifeTasks.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mt-2">
                          <Heart className="w-4 h-4 text-teal-500" />
                          <span className="text-xs font-semibold text-teal-700 uppercase">Life</span>
                        </div>
                        {lifeTasks.map((task: any, idx: number) => {
                          const dbTask = weekTasks.find((t: any) => t.title === task.title || (t.sort_order === weekTaskList.indexOf(task)));
                          const status = dbTask?.status || 'pending';
                          return (
                            <TaskCard
                              key={task.id || `life-${weekNum}-${idx}`}
                              task={task}
                              weekNumber={weekNum}
                              index={weekTaskList.indexOf(task)}
                              status={status}
                              dbTask={dbTask}
                              isLife
                              onStatusChange={onTaskStatusChange}
                              clientId={clientId}
                              practiceId={practiceId}
                            />
                          );
                        })}
                      </>
                    )}
                    {businessTasks.map((task: any, idx: number) => {
                      const dbTask = weekTasks.find((t: any) => t.title === task.title || (t.sort_order === weekTaskList.indexOf(task)));
                      const status = dbTask?.status || 'pending';
                      return (
                        <TaskCard
                          key={task.id || `biz-${weekNum}-${idx}`}
                          task={task}
                          weekNumber={weekNum}
                          index={weekTaskList.indexOf(task)}
                          status={status}
                          dbTask={dbTask}
                          isLife={false}
                          onStatusChange={onTaskStatusChange}
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
  const {
    submit: submitCheckIn,
    fetchCheckIn,
    fetchHistory,
    getLifeAlignmentSummary,
    checkIn,
    loading: checkInLoading,
  } = useWeeklyCheckIn();

  const [currentWeek, setCurrentWeek] = useState(1);
  const [scrollToWeek, setScrollToWeek] = useState<number | null>(null);
  const [completingTask, setCompletingTask] = useState<{ id: string; title: string; week_number: number } | null>(null);

  const sprint = roadmap?.roadmapData?.sprint;
  const weeks = sprint?.weeks || [];

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  useEffect(() => {
    if (roadmap?.roadmapData?.sprint) {
      fetchTasks();
    }
  }, [roadmap?.roadmapData?.sprint, fetchTasks]);

  useEffect(() => {
    if (weeks.length > 0) {
      setCurrentWeek(getCurrentWeekFromTasks(tasks));
    }
  }, [tasks, weeks.length]);

  useEffect(() => {
    fetchHistory(12);
  }, [fetchHistory]);

  useEffect(() => {
    if (currentWeek >= 1) {
      fetchCheckIn(currentWeek);
    }
  }, [currentWeek, fetchCheckIn]);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed', task?: any) => {
      if (newStatus === 'completed' && task) {
        setCompletingTask({ id: taskId, title: task.title, week_number: task.week_number || 1 });
      } else {
        await updateTaskStatus(taskId, newStatus);
      }
    },
    [updateTaskStatus]
  );

  const handleTaskComplete = useCallback(
    async (taskId: string, feedback: { whatWentWell: string; whatDidntWork: string; additionalNotes: string }) => {
      await updateTaskStatus(taskId, 'completed', feedback);
      setCompletingTask(null);
    },
    [updateTaskStatus]
  );

  const lifeAlignment = getLifeAlignmentSummary();
  const businessTasks = tasks.filter((t: any) => !t.category?.startsWith?.('life_'));
  const lifeTasksExist = tasks.some((t: any) => t.category?.startsWith?.('life_'));
  const sprintProgress = {
    completed: lifeTasksExist ? businessTasks.filter((t: any) => t.status === 'completed').length : tasks.filter((t: any) => t.status === 'completed').length,
    total: lifeTasksExist ? businessTasks.length : tasks.length,
    percentage: 0,
  };
  sprintProgress.percentage = sprintProgress.total > 0 ? Math.round((sprintProgress.completed / sprintProgress.total) * 100) : 0;

  const thisWeekData = weeks[currentWeek - 1];
  const thisWeekTasks = tasks.filter((t: any) => t.week_number === currentWeek);

  if (roadmapLoading && !roadmap) {
    return (
      <Layout title="Your Sprint" subtitle="Loading...">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  if (!sprint || !weeks.length) {
    return (
      <Layout title="Your Sprint" subtitle="Sprint Command Centre">
        <div className="text-center py-16">
          <Flag className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your Sprint is Being Prepared</h2>
          <p className="text-slate-600 mb-6">
            Once your roadmap is finalised, your 12-week sprint plan will appear here.
          </p>
          <Link to="/roadmap" className="text-indigo-600 hover:text-indigo-700 font-medium">
            View your roadmap →
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Your Sprint" subtitle={sprint.sprintTheme || 'Your 12-week transformation'}>
      <div className="space-y-6">
        <HeroMetrics lifeAlignment={lifeAlignment} sprintProgress={sprintProgress} />
        {thisWeekData && (
          <ThisWeekCard
            week={thisWeekData}
            weekNumber={currentWeek}
            tasks={thisWeekTasks}
            onTaskStatusChange={handleTaskStatusChange}
            clientId={clientSession?.clientId}
            practiceId={clientSession?.practiceId}
          />
        )}
        <WeeklyCheckInCard
          currentWeek={currentWeek}
          existingCheckIn={checkIn?.weekNumber === currentWeek ? checkIn : null}
          onSubmit={async (data) => {
            const ok = await submitCheckIn({ ...data, weekNumber: currentWeek });
            if (ok) {
              await fetchHistory(12);
              fetchCheckIn(currentWeek);
            }
            return ok;
          }}
          loading={checkInLoading}
        />
        <ProgressStrip weeks={weeks} tasks={tasks} currentWeek={currentWeek} onWeekClick={(w) => setScrollToWeek(w)} />
        <AllWeeksAccordion
          weeks={weeks}
          tasks={tasks}
          currentWeek={currentWeek}
          scrollToWeek={scrollToWeek}
          onScrolledToWeek={() => setScrollToWeek(null)}
          onTaskStatusChange={handleTaskStatusChange}
          clientId={clientSession?.clientId}
          practiceId={clientSession?.practiceId}
        />
      </div>

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
