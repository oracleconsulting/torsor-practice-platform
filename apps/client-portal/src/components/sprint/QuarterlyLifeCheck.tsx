// ============================================================================
// Quarterly Life Check — 6-question form for renewal (Phase 4)
// ============================================================================

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export interface QuarterlyLifeCheckResponses {
  tuesdayTestUpdate: string;
  timeReclaimProgress: string;
  biggestWin: string;
  biggestFrustration: string;
  priorityShift: string;
  nextSprintWish: string;
}

interface QuarterlyLifeCheckProps {
  clientId: string;
  practiceId: string;
  sprintNumber: number;
  serviceLineId?: string;
  part1Responses: Record<string, any> | null;
  sprintSummary: { summary: any; analytics: any } | null;
  onComplete: () => void;
}

const emptyResponses: QuarterlyLifeCheckResponses = {
  tuesdayTestUpdate: '',
  timeReclaimProgress: '',
  biggestWin: '',
  biggestFrustration: '',
  priorityShift: '',
  nextSprintWish: '',
};

export function QuarterlyLifeCheck({
  clientId,
  practiceId,
  sprintNumber,
  serviceLineId,
  part1Responses,
  sprintSummary,
  onComplete,
}: QuarterlyLifeCheckProps) {
  const [responses, setResponses] = useState<QuarterlyLifeCheckResponses>(emptyResponses);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tuesdayOriginal = part1Responses?.tuesday_test || '';
  const commitmentHours = part1Responses?.commitment_hours ?? part1Responses?.hours_to_reclaim ?? '';
  const ninetyDayPriorities = part1Responses?.ninety_day_priorities ?? part1Responses?.priorities_90_days ?? '';
  const headlineWin = sprintSummary?.summary?.headlineAchievement ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error: upsertError } = await supabase
        .from('quarterly_life_checks')
        .upsert(
          {
            client_id: clientId,
            practice_id: practiceId,
            sprint_number: sprintNumber,
            tuesday_test_update: responses.tuesdayTestUpdate.trim() || null,
            time_reclaim_progress: responses.timeReclaimProgress.trim() || null,
            biggest_win: responses.biggestWin.trim() || null,
            biggest_frustration: responses.biggestFrustration.trim() || null,
            priority_shift: responses.priorityShift.trim() || null,
            next_sprint_wish: responses.nextSprintWish.trim() || null,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'client_id,sprint_number' }
        );

      if (upsertError) throw upsertError;

      if (serviceLineId) {
        const { error: statusError } = await supabase
          .from('client_service_lines')
          .update({ renewal_status: 'life_check_complete' })
          .eq('client_id', clientId)
          .eq('service_line_id', serviceLineId);
        if (statusError) throw statusError;
      }
      onComplete();
    } catch (err: any) {
      setError(err?.message || 'Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contextClass = 'bg-slate-50 border-l-4 border-slate-300 text-slate-500 italic p-3 rounded-r text-sm';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <RefreshCw className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-slate-900">Time for a Check-In</h1>
        <p className="text-slate-600 mt-2">
          Before we build your next sprint, let&apos;s see what&apos;s changed. This takes about 5 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">1. Your Ideal Tuesday</h2>
          {tuesdayOriginal && (
            <p className="mb-3 text-sm text-slate-500">Last time you described:</p>
            <blockquote className={contextClass}>{tuesdayOriginal}</blockquote>
            <p className="mt-3 text-sm text-slate-600">
              How has this changed? What would your ideal Tuesday look like now?
            </p>
          )}
          <textarea
            value={responses.tuesdayTestUpdate}
            onChange={(e) => setResponses((r) => ({ ...r, tuesdayTestUpdate: e.target.value }))}
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe your ideal Tuesday now..."
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">2. Reclaiming Time</h2>
          {commitmentHours && (
            <p className="mb-2 text-sm text-slate-600">
              You wanted to reclaim {commitmentHours} hours/week. How are you doing on that?
            </p>
          )}
          <textarea
            value={responses.timeReclaimProgress}
            onChange={(e) => setResponses((r) => ({ ...r, timeReclaimProgress: e.target.value }))}
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="How are you doing on reclaiming time?"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">3. Biggest Win</h2>
          {headlineWin && (
            <p className="mb-2 text-sm text-slate-500">Sprint headline: {headlineWin}</p>
          )}
          <p className="mb-2 text-sm text-slate-600">What was your biggest win from the last sprint?</p>
          <textarea
            value={responses.biggestWin}
            onChange={(e) => setResponses((r) => ({ ...r, biggestWin: e.target.value }))}
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Your biggest win..."
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">4. Biggest Frustration</h2>
          <p className="mb-2 text-sm text-slate-600">What frustrated you most about the last sprint?</p>
          <textarea
            value={responses.biggestFrustration}
            onChange={(e) => setResponses((r) => ({ ...r, biggestFrustration: e.target.value }))}
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="What frustrated you most?"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">5. Priority Shift</h2>
          {ninetyDayPriorities && (
            <p className="mb-2 text-sm text-slate-500">Your 90-day priorities were: {String(ninetyDayPriorities)}</p>
          )}
          <p className="mb-2 text-sm text-slate-600">
            Have your priorities changed? What matters most right now?
          </p>
          <textarea
            value={responses.priorityShift}
            onChange={(e) => setResponses((r) => ({ ...r, priorityShift: e.target.value }))}
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="What matters most now?"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">6. One Wish for This Sprint</h2>
          <p className="mb-2 text-sm text-slate-600">
            If this next sprint could change ONE thing in your life or business, what would it be?
          </p>
          <textarea
            value={responses.nextSprintWish}
            onChange={(e) => setResponses((r) => ({ ...r, nextSprintWish: e.target.value }))}
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="One thing you'd like this sprint to change..."
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : 'Save & Continue →'}
          </button>
        </div>
      </form>
    </div>
  );
}
