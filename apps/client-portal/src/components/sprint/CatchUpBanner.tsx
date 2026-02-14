// ============================================================================
// CatchUpBanner — Amber banner when client is 3+ weeks behind
// ============================================================================
// Shown at top of Sprint Dashboard. Client clicks to enter catch-up mode.
// ============================================================================

import { Zap } from 'lucide-react';

interface CatchUpBannerProps {
  weeksBehind: number;
  unresolvedWeekCount: number;
  onEnter: () => void;
}

export function CatchUpBanner({
  weeksBehind,
  unresolvedWeekCount,
  onEnter,
}: CatchUpBannerProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900">
            You&apos;re {weeksBehind} week{weeksBehind !== 1 ? 's' : ''} behind your sprint schedule
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            You have {unresolvedWeekCount} week{unresolvedWeekCount !== 1 ? 's' : ''} of tasks to catch up on.
            Use catch-up mode to quickly mark what you did and didn&apos;t do while you were away.
          </p>
          <button
            type="button"
            onClick={onEnter}
            className="mt-4 px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Enter Catch-Up Mode
          </button>
        </div>
      </div>
    </div>
  );
}
