// ============================================================================
// Sprint Editor — sprint-level overview (theme, promise, goals, phases)
// ============================================================================

import type { SprintData } from './types';

interface SprintOverviewProps {
  sprint: SprintData;
  onChange: (field: string, value: string) => void;
  changeLogCount: number;
}

export function SprintOverview({ sprint, onChange, changeLogCount }: SprintOverviewProps) {
  const phases = sprint.phases ? Object.entries(sprint.phases) : [];
  const totalTasks = (sprint.weeks || []).reduce((sum, w) => sum + (w.tasks?.length || 0), 0);
  const weekCount = (sprint.weeks || []).length;

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-slate-900">Sprint overview</h3>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Sprint theme</label>
        <input
          type="text"
          value={sprint.sprintTheme ?? ''}
          onChange={(e) => onChange('sprintTheme', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
          placeholder="e.g. 12 Weeks to Revenue Clarity"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Sprint promise</label>
        <textarea
          value={sprint.sprintPromise ?? ''}
          onChange={(e) => onChange('sprintPromise', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
          placeholder="By the end of this sprint…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Sprint goals</label>
        <textarea
          value={
            typeof sprint.sprintGoals === 'string'
              ? sprint.sprintGoals
              : sprint.sprintGoals != null
                ? JSON.stringify(sprint.sprintGoals, null, 2)
                : ''
          }
          onChange={(e) => onChange('sprintGoals', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-slate-900"
          placeholder="Goals (plain text or JSON)"
        />
      </div>

      {phases.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Phase summary</h4>
          <ul className="space-y-2">
            {phases.map(([name, p]) => (
              <li key={name} className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">{name}</span>
                {p.weeks?.length ? ` (Wk ${Math.min(...p.weeks)}–${Math.max(...p.weeks)})` : ''}
                {p.theme ? `: "${p.theme}"` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-4 border-t border-slate-200 text-sm text-slate-500">
        {weekCount} weeks · {totalTasks} tasks
        {changeLogCount > 0 && ` · ${changeLogCount} change${changeLogCount !== 1 ? 's' : ''} in this session`}
      </div>
    </div>
  );
}
