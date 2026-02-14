// ============================================================================
// CatchUpView — Bulk resolve tasks for weeks that are behind
// ============================================================================
// Shown when calendar week is ahead of active week. Client marks each task
// as "Did it" or "Didn't" (skipped), then submits to persist to DB.
// ============================================================================

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface CatchUpTask {
  generatedTask: any;
  dbTask: any | null;
  weekNumber: number;
  resolved: boolean;
  resolution: 'completed' | 'skipped' | null;
}

interface CatchUpWeek {
  weekNumber: number;
  theme: string;
  tasks: CatchUpTask[];
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
  const [catchUpWeeks, setCatchUpWeeks] = useState<CatchUpWeek[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unresolvedWeeks: CatchUpWeek[] = [];

    for (let i = activeWeek - 1; i < Math.min(calendarWeek, 12); i++) {
      const week = weeks[i];
      if (!week) continue;

      const weekNum = i + 1;
      const weekDbTasks = dbTasks.filter((t: any) => t.week_number === weekNum);

      const catchUpTasks: CatchUpTask[] = (week.tasks || []).map((gt: any) => {
        const dbTask = weekDbTasks.find((t: any) => t.title === gt.title);
        const alreadyResolved = dbTask && (dbTask.status === 'completed' || dbTask.status === 'skipped');

        return {
          generatedTask: gt,
          dbTask: dbTask ?? null,
          weekNumber: weekNum,
          resolved: !!alreadyResolved,
          resolution: alreadyResolved ? (dbTask.status as 'completed' | 'skipped') : null,
        };
      });

      if (catchUpTasks.some((t) => !t.resolved)) {
        unresolvedWeeks.push({
          weekNumber: weekNum,
          theme: week.theme,
          tasks: catchUpTasks,
        });
      }
    }

    setCatchUpWeeks(unresolvedWeeks);
  }, [weeks, dbTasks, activeWeek, calendarWeek]);

  const setTaskResolution = (weekNum: number, taskTitle: string, resolution: 'completed' | 'skipped') => {
    setCatchUpWeeks((prev) =>
      prev.map((w) => {
        if (w.weekNumber !== weekNum) return w;
        return {
          ...w,
          tasks: w.tasks.map((t) => {
            if (t.generatedTask.title !== taskTitle) return t;
            return { ...t, resolved: true, resolution };
          }),
        };
      })
    );
  };

  const allResolved = catchUpWeeks.every((w) => w.tasks.every((t) => t.resolved));

  const stats = {
    completed: catchUpWeeks.flatMap((w) => w.tasks).filter((t) => t.resolution === 'completed').length,
    skipped: catchUpWeeks.flatMap((w) => w.tasks).filter((t) => t.resolution === 'skipped').length,
    total: catchUpWeeks.flatMap((w) => w.tasks).length,
    weeksCount: catchUpWeeks.length,
  };

  const handleSubmit = async () => {
    const resolutions = catchUpWeeks.flatMap((w) =>
      w.tasks
        .filter((t) => t.resolution && (!t.dbTask || !['completed', 'skipped'].includes(t.dbTask.status)))
        .map((t) => ({
          weekNumber: w.weekNumber,
          title: t.generatedTask.title,
          generatedTask: t.generatedTask,
          resolution: t.resolution!,
        }))
    );

    setSubmitting(true);
    await onComplete(resolutions);
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-amber-900">Sprint Catch-Up</h2>
            <p className="text-sm text-amber-700 mt-1">
              You're on Week {activeWeek} — the calendar says Week {calendarWeek}. Go through each task and mark what you did.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="text-amber-600 hover:text-amber-800 text-sm font-medium">
            Cancel
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {catchUpWeeks.map((week) => (
          <div key={week.weekNumber} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600">{week.weekNumber}</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{week.theme}</h3>
              </div>
              <div className="ml-auto text-xs text-slate-400">
                {week.tasks.filter((t) => t.resolved).length}/{week.tasks.length} resolved
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {week.tasks.map((task, i) => (
                <div
                  key={i}
                  className={`px-5 py-3 flex items-center gap-3 ${
                    task.resolution === 'completed' ? 'bg-emerald-50/50' : task.resolution === 'skipped' ? 'bg-slate-50/50 opacity-75' : ''
                  }`}
                >
                  <p
                    className={`flex-1 text-sm ${
                      task.resolution === 'completed' ? 'text-emerald-700' : task.resolution === 'skipped' ? 'text-slate-400 line-through' : 'text-slate-700'
                    }`}
                  >
                    {task.generatedTask.title}
                  </p>

                  {task.dbTask?.status === 'completed' || task.dbTask?.status === 'skipped' ? (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        task.dbTask.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {task.dbTask.status === 'completed' ? 'Done' : 'Skipped'}
                    </span>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTaskResolution(week.weekNumber, task.generatedTask.title, 'completed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          task.resolution === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                        }`}
                      >
                        ✓ Did it
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskResolution(week.weekNumber, task.generatedTask.title, 'skipped')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          task.resolution === 'skipped' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ✗ Didn't
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-emerald-600">{stats.completed} done</span>
            {' · '}
            <span className="text-slate-400">{stats.skipped} skipped</span>
            {' · '}
            <span>{stats.total - stats.completed - stats.skipped} remaining</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allResolved || submitting}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              allResolved && !submitting ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Saving...' : (
              <>
                I'm caught up <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
