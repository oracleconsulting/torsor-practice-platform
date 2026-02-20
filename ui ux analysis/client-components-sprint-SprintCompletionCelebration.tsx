// ============================================================================
// SprintCompletionCelebration — Shown when all 12 weeks are resolved
// ============================================================================
// Stats + "Generating your Sprint Review..." and optional progress indicator
// ============================================================================

import { PartyPopper } from 'lucide-react';
export interface CompletionStats {
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  completionRate: number;
  resolutionRate: number;
}

interface SprintCompletionCelebrationProps {
  completionStats: CompletionStats;
  onRequestSummary?: () => void;
  isGenerating?: boolean;
}

export function SprintCompletionCelebration({
  completionStats,
  onRequestSummary,
  isGenerating = false,
}: SprintCompletionCelebrationProps) {
  return (
    <div className="rounded-xl bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 p-8 text-center max-w-lg mx-auto">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
          <PartyPopper className="w-8 h-8 text-indigo-600" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Sprint 1 Complete!</h2>
      <p className="text-slate-600 mb-6">
        You&apos;ve resolved all 12 weeks of your sprint.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div>
          <p className="text-2xl font-bold text-emerald-600">{completionStats.completedTasks}</p>
          <p className="text-xs text-slate-500">tasks completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-500">{completionStats.skippedTasks}</p>
          <p className="text-xs text-slate-500">skipped</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-indigo-600">{completionStats.completionRate}%</p>
          <p className="text-xs text-slate-500">completion rate</p>
        </div>
      </div>

      {isGenerating ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Your Sprint Review is being generated...</p>
          <p className="text-xs text-slate-500">This usually takes about 30 seconds.</p>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full animate-pulse"
              style={{ width: '60%' }}
            />
          </div>
        </div>
      ) : onRequestSummary ? (
        <button
          type="button"
          onClick={onRequestSummary}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Generate Sprint Review
        </button>
      ) : null}
    </div>
  );
}
