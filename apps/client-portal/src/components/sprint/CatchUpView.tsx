// ============================================================================
// CatchUpView — Bulk resolve tasks for weeks that are behind
// ============================================================================
// Replaces main content when client is 3+ weeks behind. Task key = "weekNumber:title"
// for safe parsing when title contains ':'. Submit uses batch upsert.
// ============================================================================

import { useState, useMemo, useEffect } from 'react';
import { Loader2, SkipForward } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function taskKey(weekNumber: number, title: string): string {
  return `${weekNumber}:${title}`;
}

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
  unresolvedWeeks,
  sprintWeeks,
  dbTasks,
  clientId,
  practiceId,
  onComplete,
  onCancel,
}: {
  unresolvedWeeks: number[];
  sprintWeeks: any[];
  dbTasks: any[];
  clientId: string;
  practiceId: string;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [resolutions, setResolutions] = useState<Record<string, 'completed' | 'skipped'>>({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-populate resolutions from existing DB tasks
  useEffect(() => {
    const initial: Record<string, 'completed' | 'skipped'> = {};
    for (const task of dbTasks) {
      if (task.status === 'completed' || task.status === 'skipped') {
        initial[taskKey(task.week_number, task.title)] = task.status as 'completed' | 'skipped';
      }
    }
    setResolutions((prev) => (Object.keys(initial).length > 0 ? { ...initial, ...prev } : prev));
  }, [dbTasks]);

  const catchUpWeeks = useMemo(() => {
    const result: CatchUpWeek[] = [];

    for (const weekNum of unresolvedWeeks) {
      const week = sprintWeeks[weekNum - 1];
      if (!week) continue;

      const weekDbTasks = dbTasks.filter((t: any) => t.week_number === weekNum);

      const tasks: CatchUpTaskItem[] = (week.tasks || []).map((gt: any) => {
        const dbTask = weekDbTasks.find((t: any) => t.title === gt.title);
        const alreadyResolved = !!dbTask && (dbTask.status === 'completed' || dbTask.status === 'skipped');

        return {
          generatedTask: gt,
          dbTask: dbTask ?? null,
          key: taskKey(weekNum, gt.title),
          alreadyResolved,
        };
      });

      result.push({
        weekNumber: weekNum,
        theme: week.theme || `Week ${weekNum}`,
        tasks,
      });
    }

    return result;
  }, [unresolvedWeeks, sprintWeeks, dbTasks]);

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

  const tasksNeedingResolution = catchUpWeeks.flatMap((w) =>
    w.tasks.filter((t) => !t.alreadyResolved),
  );
  const completedCount = tasksNeedingResolution.filter((t) => resolutions[t.key] === 'completed').length;
  const skippedCount = tasksNeedingResolution.filter((t) => resolutions[t.key] === 'skipped').length;
  const remainingCount = tasksNeedingResolution.length - completedCount - skippedCount;
  const allResolved = remainingCount === 0;

  const handleSubmit = async () => {
    if (!clientId || !practiceId) return;

    setSubmitting(true);
    try {
      const upserts: any[] = [];

      for (const [key, resolution] of Object.entries(resolutions)) {
        if (!resolution) continue;

        const parts = key.split(':');
        const weekNumber = parseInt(parts[0], 10);
        const title = parts.slice(1).join(':');

        const existingTask = dbTasks.find(
          (t: any) => t.week_number === weekNumber && t.title === title,
        );
        if (existingTask && existingTask.status === resolution) continue;

        const weekData = sprintWeeks[weekNumber - 1];
        const generatedTask = weekData?.tasks?.find((t: any) => t.title === title);

        const now = new Date().toISOString();
        upserts.push({
          client_id: clientId,
          practice_id: practiceId,
          week_number: weekNumber,
          title,
          description: generatedTask?.description ?? null,
          category: generatedTask?.category ?? 'general',
          priority: generatedTask?.priority ?? 'medium',
          status: resolution,
          completed_at: resolution === 'completed' ? now : null,
          skipped_at: resolution === 'skipped' ? now : null,
          skip_reason:
            resolution === 'skipped'
              ? 'Catch-up mode — not completed during sprint period'
              : null,
          completion_feedback:
            resolution === 'completed'
              ? {
                  caughtUp: true,
                  catchUpDate: now,
                  whatWentWell: '',
                  whatDidntWork: '',
                  additionalNotes: 'Marked during catch-up',
                }
              : null,
          metadata: {
            ...(generatedTask?.whyThisMatters ? { whyThisMatters: generatedTask.whyThisMatters } : {}),
            ...(generatedTask?.deliverable ? { deliverable: generatedTask.deliverable } : {}),
            ...(generatedTask?.phase ? { phase: generatedTask.phase } : {}),
            caughtUp: true,
            catchUpDate: now,
          },
        });
      }

      if (upserts.length > 0) {
        const { error } = await supabase.from('client_tasks').upsert(upserts, {
          onConflict: 'client_id,week_number,title',
        });
        if (error) throw error;
      }

      onComplete();
    } catch (err) {
      console.error('Catch-up submit failed:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Back link */}
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        ← Back to Sprint Dashboard
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-amber-900">Catch-Up Mode</h2>
            <p className="text-sm text-amber-700 mt-2 max-w-lg">
              You&apos;re catching up on week{unresolvedWeeks.length !== 1 ? 's' : ''}{' '}
              {unresolvedWeeks.length > 0 ? unresolvedWeeks.join(', ') : ''}. Mark each task as done
              or skipped to get back on track.
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

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-amber-200">
          <span className="text-sm text-amber-800">
            <span className="font-semibold">{catchUpWeeks.length}</span> weeks to review
          </span>
          <span className="text-sm text-amber-800">
            <span className="font-semibold">{tasksNeedingResolution.length}</span> tasks to resolve
          </span>
          {(completedCount > 0 || skippedCount > 0) && (
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
        const weekResolvedCount = week.tasks.filter(
          (t) => t.alreadyResolved || resolutions[t.key],
        ).length;
        const weekHasUnresolved = week.tasks.some(
          (t) => !t.alreadyResolved && !resolutions[t.key],
        );

        return (
          <div
            key={week.weekNumber}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-indigo-600">{week.weekNumber}</span>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  Week {week.weekNumber}: {week.theme}
                </h3>
                <span className="text-xs text-slate-500">
                  {weekResolvedCount} of {week.tasks.length} resolved
                </span>
              </div>

              {weekHasUnresolved && (
                <button
                  type="button"
                  onClick={() => skipEntireWeek(week.weekNumber, week.tasks)}
                  className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1 flex items-center gap-1"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip all
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-50">
              {week.tasks.map((task) => {
                const resolution = task.alreadyResolved
                  ? task.dbTask?.status
                  : resolutions[task.key] || null;
                const isLife = task.generatedTask?.category?.startsWith?.('life_');

                return (
                  <div
                    key={task.key}
                    className={`px-5 py-3 flex items-center gap-3 transition-colors ${
                      resolution === 'completed'
                        ? 'bg-emerald-50/50'
                        : resolution === 'skipped'
                          ? 'bg-slate-50/50'
                          : ''
                    } ${task.alreadyResolved ? 'opacity-75' : ''}`}
                  >
                    {isLife && (
                      <div
                        className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0"
                        title="Life commitment"
                      />
                    )}
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
                              ? 'bg-emerald-600 text-white shadow-sm'
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
                              ? 'bg-slate-400 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ✗ Didn&apos;t do it
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

      {/* Sticky submit bar — fixed to viewport bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200 shadow-lg px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {remainingCount === 0 && tasksNeedingResolution.length > 0 ? (
              <span>All resolved — save to continue</span>
            ) : (
              <>
                <span className="font-medium text-emerald-600">✓ {completedCount} completed</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="text-slate-500">✗ {skippedCount} skipped</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span>○ {remainingCount} remaining</span>
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
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
