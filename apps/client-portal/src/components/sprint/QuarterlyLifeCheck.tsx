// ============================================================================
// Quarterly Life Check — 6-question form for renewal (Phase 4)
// ============================================================================

import { useState } from 'react';
import { RefreshCw, Heart, ChevronRight, Send, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
            <>
              <p className="mb-3 text-sm text-slate-500">Last time you described:</p>
              <blockquote className={contextClass}>{tuesdayOriginal}</blockquote>
              <p className="mt-3 text-sm text-slate-600">
                How has this changed? What would your ideal Tuesday look like now?
              </p>
            </>
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

// ============================================================================
// QUARTERLY LIFE CHECK BANNER — Roadmap page trigger
// ============================================================================

interface LifeCheckBannerProps {
  clientId: string;
  practiceId: string;
  sprintNumber: number;
  onComplete: () => void;
}

const BANNER_QUESTIONS = [
  { key: 'tuesday_test_update', title: 'Your Tuesday — then and now', question: "Think back to the Tuesday you described when you started. How does a typical Tuesday feel now? What's different? What's still the same?", placeholder: "Be honest — not what you think we want to hear...", hint: "We're looking for the real texture of your day." },
  { key: 'time_reclaim_progress', title: 'Time reclaimed', question: "How many hours per week have you genuinely reclaimed from the business? What are you doing with that time?", placeholder: "Even 2 hours matters. What did you do with them?", hint: "Writing? Family? Exercise? All valid." },
  { key: 'biggest_win', title: 'Your biggest win', question: "What's the single thing from the last 12 weeks that made you think 'this is actually working'?", placeholder: "A moment, a number, a conversation, a feeling...", hint: "Sometimes the win is the absence of a problem." },
  { key: 'biggest_frustration', title: "What's still grinding", question: "What's the one thing that still pulls you back into the business when you don't want to be there?", placeholder: "The thing that undoes the progress...", hint: "This becomes a priority for the next sprint." },
  { key: 'priority_shift', title: 'Has the goal shifted?', question: "Is your North Star still what matters most — or has something changed?", placeholder: "Goals evolve. That's not failure — it's clarity.", hint: "If the goal has shifted, that's important for us to know." },
  { key: 'next_sprint_wish', title: 'Your wish for the next 12 weeks', question: "If the next sprint could change one thing about your daily life, what would it be?", placeholder: "One thing. The thing that would make the biggest difference.", hint: "Think life first, then business." },
] as const;

type BannerResponseKey = typeof BANNER_QUESTIONS[number]['key'];

export function QuarterlyLifeCheckBanner({ clientId, practiceId, sprintNumber, onComplete }: LifeCheckBannerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-indigo-900 text-lg">Time for a life check-in</h3>
            <p className="text-indigo-700 text-sm mt-1">
              You&apos;ve completed Sprint {sprintNumber}. Before we build your next sprint, we want to know: how has your life actually changed? Six questions, five minutes.
            </p>
            <button onClick={() => setIsOpen(true)} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
              Start your life check-in <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {isOpen && <LifeCheckModal clientId={clientId} practiceId={practiceId} sprintNumber={sprintNumber} onClose={() => setIsOpen(false)} onComplete={() => { setIsOpen(false); onComplete(); }} />}
    </>
  );
}

function LifeCheckModal({ clientId, practiceId, sprintNumber, onClose, onComplete }: LifeCheckBannerProps & { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<BannerResponseKey, string>>({ tuesday_test_update: '', time_reclaim_progress: '', biggest_win: '', biggest_frustration: '', priority_shift: '', next_sprint_wish: '' });
  const [submitting, setSubmitting] = useState(false);

  const q = BANNER_QUESTIONS[step];
  const isLast = step === BANNER_QUESTIONS.length - 1;
  const canProceed = responses[q.key].trim().length > 10;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('quarterly_life_checks').upsert({ client_id: clientId, practice_id: practiceId, sprint_number: sprintNumber, ...responses, completed_at: new Date().toISOString() }, { onConflict: 'client_id,sprint_number' });
      if (insertError) throw insertError;
      const { data: sl } = await supabase.from('service_lines').select('id').eq('code', '365_method').single();
      if (sl?.id) await supabase.from('client_service_lines').update({ renewal_status: 'life_check_complete' }).eq('client_id', clientId).eq('service_line_id', sl.id);
      onComplete();
    } catch (err) { console.error('Failed to save life check:', err); alert('Something went wrong. Please try again.'); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div><h2 className="text-lg font-semibold text-slate-900">Quarterly Life Check-In</h2><p className="text-sm text-slate-500">Sprint {sprintNumber} reflection</p></div>
        <div className="flex items-center gap-4"><span className="text-sm text-slate-400">{step + 1} of {BANNER_QUESTIONS.length}</span><button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button></div>
      </div>
      <div className="h-1 bg-slate-100"><div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((step + 1) / BANNER_QUESTIONS.length) * 100}%` }} /></div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl w-full">
          <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-2">{q.title}</p>
          <h3 className="text-2xl font-semibold text-slate-900 mb-4 leading-snug">{q.question}</h3>
          <textarea value={responses[q.key]} onChange={(e) => setResponses(prev => ({ ...prev, [q.key]: e.target.value }))} placeholder={q.placeholder} rows={5} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400" autoFocus />
          <p className="text-xs text-slate-400 mt-2 italic">{q.hint}</p>
        </div>
      </div>
      <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-30">Back</button>
        {isLast ? (
          <button onClick={handleSubmit} disabled={!canProceed || submitting} className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors font-medium"><Send className="w-4 h-4" />{submitting ? 'Sending...' : 'Submit your check-in'}</button>
        ) : (
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed} className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors font-medium">Next <ChevronRight className="w-4 h-4" /></button>
        )}
      </div>
    </div>
  );
}
