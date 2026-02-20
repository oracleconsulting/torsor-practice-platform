// ============================================================================
// Sprint Editor — sidebar list of changes with optional navigate
// ============================================================================

import type { ChangeEntry } from './types';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 60000;
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${Math.floor(diff)} min ago`;
  return `${Math.floor(diff / 60)} hr ago`;
}

interface EditorChangeLogProps {
  changeLog: ChangeEntry[];
  onNavigate?: (weekNumber: number | null, taskIndex: number | null) => void;
  onResetAll?: () => void;
}

export function EditorChangeLog({ changeLog, onNavigate, onResetAll }: EditorChangeLogProps) {
  const entries = [...changeLog].reverse();

  return (
    <div className="h-full flex flex-col bg-slate-50 border-l border-slate-200">
      <div className="p-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800">Changes ({changeLog.length})</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">No changes yet</p>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className={`rounded-lg border p-3 text-sm ${
                e.action === 'remove'
                  ? 'border-red-200 bg-red-50/50'
                  : e.action === 'add'
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-indigo-200 bg-indigo-50/30'
              }`}
            >
              <div className="font-medium text-slate-800">
                {e.weekNumber != null
                  ? e.taskIndex != null
                    ? `Wk ${e.weekNumber} / Task ${e.taskIndex + 1}`
                    : `Week ${e.weekNumber}`
                  : 'Overview'}
              </div>
              <p className="text-slate-700 mt-1">{e.summary}</p>
              {e.oldValue && e.action === 'edit' && (
                <p className="text-xs text-slate-500 mt-1 truncate" title={e.oldValue}>
                  → {e.newValue}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">{formatTime(e.timestamp)}</p>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(e.weekNumber ?? null, e.taskIndex ?? null)}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Go to
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {onResetAll && changeLog.length > 0 && (
        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onResetAll}
            className="w-full text-sm text-slate-600 hover:text-slate-900"
          >
            Reset all changes
          </button>
        </div>
      )}
    </div>
  );
}
