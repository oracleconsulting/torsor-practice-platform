// ============================================================================
// CatchUpView — Bulk resolve tasks for weeks that are behind
// ============================================================================
// Shown when calendar week is ahead of active week. Client marks each task
// as "Did it" or "Didn't" (skipped), then submits to persist to DB.
// Toggle: clicking same button again deselects. "Skip all" per week.
// ============================================================================

import { useState, useMemo } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface CatchUpTaskItem {
  generatedTask: any;
  dbTask: any | null;
  key: string;
  alreadyResolved: boolean;
}

interface CatchUpWeek {
  weekNumber: number;
  theme: string;
  tasks: CatchUpTaskItem[];
}

export function CatchUpView({
  weeks,
  dbTasks,
  activeWeek,
  calendarWeek,
  onComplete,
  onCancel,
}: {
  weeks: any[];
  dbTasks: any[];
  activeWeek: number;
  calendarWeek: number;
  onComplete: (resolutions: Array<{
    weekNumber: number;
    title: string;
    generatedTask: any;
    resolution: 'completed' | 'skipped';
  }>) => Promise<void>;
  onCancel: () => void;
}) {
  const [resolutions, setResolutions] = useState<Record<string, 'completed' | 'skipped'>>({});
  const [submitting, setSubmitting] = useState(false);

  const catchUpWeeks = useMemo(() => {
    const result: CatchUpWeek[] = [];

    for (let i = activeWeek - 1; i < Math.min(calendarWeek, 12); i++) {
      const week = weeks[i];
      if (!week) continue;

      const weekNum = i + 1;
      const weekDbTasks = dbTasks.filter((t: any) => t.week_number === weekNum);

      const tasks: CatchUpTaskItem[] = (week.tasks || []).map((gt: any) => {
        const dbTask = weekDbTasks.find((t: any) => t.title === gt.title);
        const alreadyResolved = !!dbTask && (dbTask.status === 'completed' || dbTask.status === 'skipped');

        return {
          generatedTask: gt,
          dbTask: dbTask ?? null,
          key: `${weekNum}-${gt.title}`,
          alreadyResolved,
        };
      });

      if (tasks.some((t) => !t.alreadyResolved)) {
        result.push({
          weekNumber: weekNum,
          theme: week.theme || `Week ${weekNum}`,
          tasks,
        });
      }
    }

    return result;
  }, [weeks, dbTasks, activeWeek, calendarWeek]);

  const setTaskResolution = (key: string, resolution: 'completed' | 'skipped') => {
    setResolutions((prev) => {
      if (prev[key] === resolution) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: resolution };
    });
  };

  const skipEntireWeek = (weekNumber: number, weekTasks: CatchUpTaskItem[]) => {
    setResolutions((prev) => {
      const next = { ...prev };
      for (const task of weekTasks) {
        if (!task.alreadyResolved) {
          next[task.key] = 'skipped';
        }
      }
      return next;
    });
  };

  const unresolvedTasks = catchUpWeeks.flatMap((w) => w.tasks.filter((t) => !t.alreadyResolved));
  const resolvedCount = Object.keys(resolutions).length;
  const completedCount = Object.values(resolutions).filter((r) => r === 'completed').length;
  const skippedCount = Object.values(resolutions).filter((r) => r === 'skipped').length;
  const allResolved = unresolvedTasks.length > 0 && resolvedCount === unresolvedTasks.length;

  const handleSubmit = async () => {
    const payload: Array<{ weekNumber: number; title: string; generatedTask: any; resolution: 'completed' | 'skipped' }> = [];

    for (const week of catchUpWeeks) {
      for (const task of week.tasks) {
        if (task.alreadyResolved) continue;
        const resolution = resolutions[task.key];
        if (!resolution) continue;

        payload.push({
          weekNumber: week.weekNumber,
          title: task.generatedTask.title,
          generatedTask: task.generatedTask,
          resolution,
        });
      }
    }

    setSubmitting(true);
    await onComplete(payload);
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-amber-900">Sprint Catch-Up</h2>
            <p className="text-sm text-amber-700 mt-2 max-w-lg">
              Go through each task and mark what you did. Be honest — skipping tasks
              isn&apos;t failure, it&apos;s information. Your next sprint will be smarter because of it.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-amber-600 hover:text-amber-800 text-sm font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-amber-200">
          <span className="text-sm text-amber-800">
            <span className="font-semibold">{catchUpWeeks.length}</span> weeks to review
          </span>
          <span className="text-sm text-amber-800">
            <span className="font-semibold">{unresolvedTasks.length}</span> tasks to resolve
          </span>
          {resolvedCount > 0 && (
            <>
              <span className="text-sm text-emerald-700">
                <span className="font-semibold">{completedCount}</span> done
              </span>
              <span className="text-sm text-slate-500">
                <span className="font-semibold">{skippedCount}</span> skipped
              </span>
            </>
          )}
        </div>
      </div>

      {/* Week-by-week task list */}
      {catchUpWeeks.map((week) => {
        const weekResolvedCount =
          week.tasks.filter((t) => t.alreadyResolved || resolutions[t.key]).length;
        const weekHasUnresolved = week.tasks.some((t) => !t.alreadyResolved && !resolutions[t.key]);

        return (
          <div
            key={week.weekNumber}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            {/* Week header */}
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-indigo-600">{week.weekNumber}</span>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{week.theme}</h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {weekResolvedCount}/{week.tasks.length}
                </span>

                {weekHasUnresolved && (
                  <button
                    type="button"
                    onClick={() => skipEntireWeek(week.weekNumber, week.tasks)}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Skip all
                  </button>
                )}
              </div>
            </div>

            {/* Task list — compact, title + buttons */}
            <div className="divide-y divide-slate-50">
              {week.tasks.map((task) => {
                const resolution = task.alreadyResolved
                  ? task.dbTask?.status
                  : resolutions[task.key] || null;

                return (
                  <div
                    key={task.key}
                    className={`px-5 py-3 flex items-center gap-3 transition-colors ${
                      resolution === 'completed'
                        ? 'bg-emerald-50/50'
                        : resolution === 'skipped'
                          ? 'bg-slate-50/50'
                          : ''
                    }`}
                  >
                    <p
                      className={`flex-1 text-sm ${
                        resolution === 'completed'
                          ? 'text-emerald-700'
                          : resolution === 'skipped'
                            ? 'text-slate-400 line-through'
                            : 'text-slate-700'
                      }`}
                    >
                      {task.generatedTask.title}
                    </p>

                    {task.alreadyResolved ? (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                          task.dbTask?.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {task.dbTask?.status === 'completed' ? 'Done' : 'Skipped'}
                      </span>
                    ) : (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setTaskResolution(task.key, 'completed')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            resolution === 'completed'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          ✓ Did it
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskResolution(task.key, 'skipped')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            resolution === 'skipped'
                              ? 'bg-slate-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ✗ Didn&apos;t
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Submit bar — sticky at bottom */}
      <div className="sticky bottom-0 z-20 -mx-4 px-4 py-4 bg-white/95 backdrop-blur-sm border-t border-slate-200">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="text-sm text-slate-600">
            {resolvedCount === 0 ? (
              <span>Mark each task as done or skipped to continue</span>
            ) : (
              <>
                <span className="font-medium text-emerald-600">{completedCount} done</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="text-slate-400">{skippedCount} skipped</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span>{unresolvedTasks.length - resolvedCount} remaining</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allResolved || submitting}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              allResolved && !submitting
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                I&apos;m caught up
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
