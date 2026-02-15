// ============================================================================
// Sprint Editor — confirm before publish
// ============================================================================

interface PublishConfirmationProps {
  clientName: string;
  changeSummary: { edited: number; added: number; removed: number };
  totalTasks: number;
  weekCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  publishing: boolean;
}

export function PublishConfirmation({
  clientName,
  changeSummary,
  totalTasks,
  weekCount,
  onConfirm,
  onCancel,
  publishing,
}: PublishConfirmationProps) {
  const hasChanges =
    changeSummary.edited > 0 || changeSummary.added > 0 || changeSummary.removed > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Publish sprint to {clientName}?</h3>
        <p className="text-sm text-slate-600">
          This will make the sprint visible in {clientName}'s client portal. They'll see all {weekCount}{' '}
          weeks with your edits.
        </p>
        {hasChanges && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-slate-700 mb-2">Summary of changes</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              {changeSummary.edited > 0 && (
                <li>{changeSummary.edited} task(s) edited</li>
              )}
              {changeSummary.added > 0 && (
                <li>{changeSummary.added} task(s) added</li>
              )}
              {changeSummary.removed > 0 && (
                <li>{changeSummary.removed} task(s) removed</li>
              )}
            </ul>
          </div>
        )}
        <p className="text-sm text-slate-500">
          {totalTasks} tasks across {weekCount} weeks
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={publishing}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={publishing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {publishing && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Publish sprint
          </button>
        </div>
      </div>
    </div>
  );
}
