// ============================================================================
// SprintCompletionLoading — Shown while sprint summary is generating
// ============================================================================

import { Loader2 } from 'lucide-react';

export function SprintCompletionLoading() {
  return (
    <div className="rounded-xl bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 p-12 text-center max-w-md mx-auto">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">Generating your Sprint Review</h2>
      <p className="text-slate-600 text-sm">
        We&apos;re analysing your 12 weeks and preparing your transformation summary.
        This usually takes about 30 seconds.
      </p>
    </div>
  );
}
