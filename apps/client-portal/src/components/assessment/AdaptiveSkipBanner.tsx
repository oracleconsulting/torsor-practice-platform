// ============================================================================
// AdaptiveSkipBanner — Per-section opt-in skip (4B)
// ============================================================================
// "We have this from X. Skip or answer anyway."

import { Sparkles } from 'lucide-react';

export interface AdaptiveSkipBannerProps {
  sectionId: string;
  sectionLabel: string;
  dataSourceLabel: string;
  dataAge?: string;
  isSkipped: boolean;
  onSkip: () => void;
  onAnswer: () => void;
}

export function AdaptiveSkipBanner({
  sectionLabel,
  dataSourceLabel,
  dataAge,
  isSkipped,
  onSkip,
  onAnswer,
}: AdaptiveSkipBannerProps) {
  if (isSkipped) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-800">
            Section skipped ✓ — Using data from {dataSourceLabel}
          </span>
          <button
            type="button"
            onClick={onAnswer}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
          >
            Undo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900">
            We already have this information from {dataSourceLabel}.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            You can skip this section or answer to update your data.
          </p>
          {dataAge && (
            <p className="text-sm text-blue-400 mt-2">
              Data from {dataAge} — you may want to answer fresh if things have changed.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Skip — use existing data
            </button>
            <button
              type="button"
              onClick={onAnswer}
              className="inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50"
            >
              Answer anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
