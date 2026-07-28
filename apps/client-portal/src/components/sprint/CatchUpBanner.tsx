// ============================================================================
// CatchUpBanner — Gentle dormancy nudge or catch-up offer (never "behind")
// ============================================================================

import { Zap, Heart } from 'lucide-react';

interface CatchUpBannerProps {
  dormancyLevel: 'gentle' | 'catch_up';
  daysDormant: number;
  activeWeek: number;
  onEnter?: () => void;
}

export function CatchUpBanner({
  dormancyLevel,
  daysDormant,
  activeWeek,
  onEnter,
}: CatchUpBannerProps) {
  if (dormancyLevel === 'gentle') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900">
              Pick up where you left off
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Week {activeWeek} has been open for {daysDormant} day{daysDormant !== 1 ? 's' : ''}.
              No rush — whenever you&apos;re ready, your tasks and Life Pulse are waiting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900">
            Ready to continue Week {activeWeek}?
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            It&apos;s been a little while since this week opened. Catch-up mode lets you
            quickly mark what you did and close the week with a Life Pulse — then the
            next week starts fresh from the following Monday.
          </p>
          {onEnter && (
            <button
              type="button"
              onClick={onEnter}
              className="mt-4 px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              Enter Catch-Up Mode
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
