// ============================================================================
// Sprint Editor — header with title, status, actions
// ============================================================================

import { X } from 'lucide-react';

interface SprintEditorHeaderProps {
  clientName: string;
  sprintNumber: number;
  currentStatus: string;
  isDirty: boolean;
  saving: boolean;
  publishing: boolean;
  onSaveDraft: () => void;
  onApprovePublish: () => void;
  onClose: () => void;
  onResetToGenerated?: () => void;
}

const statusLabels: Record<string, string> = {
  generating: 'Generating…',
  generated: 'Ready for review',
  approved: 'Approved (draft)',
  published: 'Published',
};

export function SprintEditorHeader({
  clientName,
  sprintNumber,
  currentStatus,
  isDirty,
  saving,
  publishing,
  onSaveDraft,
  onApprovePublish,
  onClose,
  onResetToGenerated,
}: SprintEditorHeaderProps) {
  const statusLabel = statusLabels[currentStatus] || currentStatus;
  const canPublish = currentStatus !== 'published';

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-4 min-w-0">
        <h2 className="text-lg font-semibold text-slate-900 truncate">
          Sprint Editor — {clientName}'s Sprint {sprintNumber}
        </h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {statusLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onResetToGenerated && (currentStatus === 'approved' || isDirty) && (
          <button
            type="button"
            onClick={onResetToGenerated}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            Reset to generated
          </button>
        )}
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={!isDirty || saving}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm"
        >
          {saving && <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />}
          Save draft
        </button>
        {canPublish && (
          <button
            type="button"
            onClick={onApprovePublish}
            disabled={publishing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
          >
            {publishing && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Approve & publish
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
