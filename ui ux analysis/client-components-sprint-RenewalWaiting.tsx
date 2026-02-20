// ============================================================================
// Renewal Waiting — Shown during life_check_complete / generating / review_pending
// ============================================================================

import { useState } from 'react';
import { RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { SprintSummaryView } from './SprintSummaryView';

interface RenewalWaitingProps {
  message: string;
  showSpinner?: boolean;
  sprintSummary?: { summary: any; analytics: any } | null;
  clientName?: string;
}

export function RenewalWaiting({
  message,
  showSpinner = false,
  sprintSummary,
  clientName,
}: RenewalWaitingProps) {
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="rounded-xl bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 p-8 text-center">
        {showSpinner ? (
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
        ) : (
          <RefreshCw className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
        )}
        <h2 className="text-xl font-bold text-slate-900 mb-2">Sprint 2 is on its way</h2>
        <p className="text-slate-600">{message}</p>
        <p className="text-sm text-slate-500 mt-2">
          Your advisor is preparing your next sprint based on what you learned in Sprint 1.
        </p>
      </div>

      {sprintSummary && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSummary((s) => !s)}
            className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 text-left"
          >
            <span className="font-medium text-slate-900">In the meantime: your Sprint 1 summary</span>
            {showSummary ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>
          {showSummary && (
            <div className="p-5 border-t border-slate-100">
              <SprintSummaryView
                summary={sprintSummary.summary}
                analytics={sprintSummary.analytics}
                clientName={clientName}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
