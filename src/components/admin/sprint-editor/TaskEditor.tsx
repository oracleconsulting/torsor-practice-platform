// ============================================================================
// Sprint Editor — single task (collapsed or expanded) with all fields
// ============================================================================

import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import type { SprintTask } from './types';

interface TaskEditorProps {
  task: SprintTask;
  taskIndex: number;
  weekNumber: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (field: string, value: string) => void;
  onRemove: () => void;
  validationErrors?: Record<string, string>;
}

const PRIORITIES = ['critical', 'high', 'medium', 'low'];

export function TaskEditor({
  task,
  taskIndex,
  weekNumber,
  expanded,
  onToggle,
  onChange,
  onRemove,
  validationErrors = {},
}: TaskEditorProps) {
  const hasError = Object.keys(validationErrors).length > 0;

  return (
    <div
      className={`rounded-lg border bg-white overflow-hidden ${
        expanded ? 'border-2 border-indigo-300 bg-indigo-50/30' : 'border-slate-200'
      } ${hasError ? 'border-red-300' : ''}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 truncate">{task.title || 'Untitled task'}</p>
          {!expanded && (task.timeEstimate || task.priority) && (
            <p className="text-xs text-slate-500 mt-0.5">
              {[task.timeEstimate, task.priority].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 text-slate-400 hover:text-red-500 rounded"
          aria-label="Remove task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={task.title ?? ''}
              onChange={(e) => onChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
              placeholder="Task title"
            />
            {validationErrors.title && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.title}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={task.description ?? ''}
              onChange={(e) => onChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
              placeholder="What to do"
            />
            {validationErrors.description && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.description}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Why this matters</label>
            <textarea
              value={task.whyThisMatters ?? ''}
              onChange={(e) => onChange('whyThisMatters', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deliverable</label>
            <textarea
              value={task.deliverable ?? ''}
              onChange={(e) => onChange('deliverable', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tools</label>
              <input
                type="text"
                value={task.tools ?? ''}
                onChange={(e) => onChange('tools', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                placeholder="e.g. Google Sheets, Xero"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time estimate</label>
              <input
                type="text"
                value={task.timeEstimate ?? ''}
                onChange={(e) => onChange('timeEstimate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                placeholder="e.g. 2 hours"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <label key={p} className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name={`task-${weekNumber}-${taskIndex}-priority`}
                    checked={(task.priority || 'medium') === p}
                    onChange={() => onChange('priority', p)}
                    className="rounded-full border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
