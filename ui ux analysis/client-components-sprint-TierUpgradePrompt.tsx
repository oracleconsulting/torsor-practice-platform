// ============================================================================
// Tier Upgrade Prompt — Shown to Lite clients after Sprint 1 (Phase 4)
// ============================================================================

import { Phone } from 'lucide-react';

interface TierUpgradePromptProps {
  currentTier?: string;
}

export function TierUpgradePrompt({ currentTier = 'Lite' }: TierUpgradePromptProps) {
  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 max-w-xl mx-auto">
      <h3 className="text-lg font-semibold text-emerald-900 mb-2">Ready for more?</h3>
      <p className="text-emerald-800 text-sm mb-4">
        Your Sprint 1 showed real progress. The Growth tier gives you 4 sprints per year — quarterly
        momentum with each sprint building on the last.
      </p>
      <ul className="text-sm text-emerald-800 space-y-1 mb-4">
        <li><strong>Growth:</strong> £4,500/year (4 sprints + quarterly reviews)</li>
        <li><strong>Partner:</strong> £9,000/year (4 sprints + strategy day)</li>
      </ul>
      <p className="text-sm text-emerald-700 mb-4">
        Talk to your advisor about upgrading.
      </p>
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        <Phone className="w-4 h-4" />
        Book a call
      </a>
    </div>
  );
}
