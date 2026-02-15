// ============================================================================
// Sprint Editor — single week: theme, narrative, tasks, milestone, Tuesday
// ============================================================================

import { useState } from 'react';
import type { SprintWeek, SprintTask } from './types';
import { TaskEditor } from './TaskEditor';

interface WeekEditorProps {
  week: SprintWeek;
  weekNumber: number;
  onChange: (taskIndex: number | null, field: string, value: string) => void;
  onAddTask: () => void;
  onRemoveTask: (taskIndex: number) => void;
  validationErrors?: Record<number, Record<string, string>>;
}

const defaultNewTask = (weekNumber: number, currentLength: number): SprintTask => ({
  id: `w${weekNumber}_t${currentLength + 1}_custom`,
  title: '',
  description: '',
  whyThisMatters: '',
  milestone: '',
  tools: '',
  timeEstimate: '1-2 hours',
  deliverable: '',
  celebrationMoment: '',
  category: 'general',
  priority: 'medium',
});

export function WeekEditor({
  week,
  weekNumber,
  onChange,
  onAddTask,
  onRemoveTask,
  validationErrors = {},
}: WeekEditorProps) {
  const [expandedTaskIndex, setExpandedTaskIndex] = useState<number | null>(null);
  const tasks = week.tasks || [];

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 rounded-t-lg">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 font-bold">
            {weekNumber}
          </span>
          <div>
            <p className="text-sm font-medium text-slate-500">
              Week {weekNumber} of 12
              {week.phase ? ` — ${week.phase}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Theme</label>
        <input
          type="text"
          value={week.theme ?? ''}
          onChange={(e) => onChange(null, 'theme', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
          placeholder="Week theme"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Narrative</label>
        <textarea
          value={week.narrative ?? ''}
          onChange={(e) => onChange(null, 'narrative', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
          placeholder="This week is about…"
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">Tasks</h4>
        <div className="space-y-3">
          {tasks.map((task, idx) => (
            <TaskEditor
              key={task.id}
              task={task}
              taskIndex={idx}
              weekNumber={weekNumber}
              expanded={expandedTaskIndex === idx}
              onToggle={() => setExpandedTaskIndex((prev) => (prev === idx ? null : idx))}
              onChange={(field, value) => onChange(idx, field, value)}
              onRemove={() => {
                onRemoveTask(idx);
                setExpandedTaskIndex(null);
              }}
              validationErrors={validationErrors[idx]}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onAddTask}
          className="mt-3 w-full border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 rounded-lg p-3 text-sm font-medium transition-colors"
        >
          + Add task
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Week milestone</label>
        <input
          type="text"
          value={week.weekMilestone ?? ''}
          onChange={(e) => onChange(null, 'weekMilestone', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
          placeholder="By end of week…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tuesday check-in</label>
        <textarea
          value={week.tuesdayCheckIn ?? ''}
          onChange={(e) => onChange(null, 'tuesdayCheckIn', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
          placeholder="Do I feel…"
        />
      </div>
    </div>
  );
}

export { defaultNewTask };
