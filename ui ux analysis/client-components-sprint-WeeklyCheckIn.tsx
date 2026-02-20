// ============================================================================
// WEEKLY CHECK-IN — Life Pulse + Sprint Review
// ============================================================================
// Life Design Thread: reflective check-in each week.
// Part A (Life Pulse) first — life satisfaction, time protected, personal win.
// Part B (Sprint Review) — business progress, blockers.
// Data goes to weekly_checkins table; life_alignment_score computed on submit.
// ============================================================================

import { useState } from 'react';

export interface LifeCommitment {
  id: string;
  commitment: string;
  category: string;
  frequency: string;
  measurable?: string;
}

export interface CheckInData {
  lifeSatisfaction: 1 | 2 | 3 | 4 | 5;
  timeProtected: 'yes' | 'mostly' | 'no';
  personalWin: string | null;
  businessProgress: 1 | 2 | 3 | 4 | 5;
  blockers: string | null;
}

interface WeeklyCheckInProps {
  weekNumber: number;
  lifeCommitments?: LifeCommitment[];
  onSubmit: (data: CheckInData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const LIFE_SATISFACTION_LABELS: Record<number, string> = {
  1: 'Rough week',
  2: 'Surviving',
  3: 'Fine',
  4: 'Good',
  5: 'Great week',
};

const BUSINESS_PROGRESS_LABELS: Record<number, string> = {
  1: 'Stuck',
  2: 'Behind',
  3: 'On track',
  4: 'Ahead',
  5: 'Smashed it',
};

export function WeeklyCheckIn({
  weekNumber,
  lifeCommitments = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: WeeklyCheckInProps) {
  const [lifeSatisfaction, setLifeSatisfaction] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [timeProtected, setTimeProtected] = useState<'yes' | 'mostly' | 'no' | null>(null);
  const [personalWin, setPersonalWin] = useState('');
  const [businessProgress, setBusinessProgress] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [blockers, setBlockers] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (lifeSatisfaction == null || timeProtected == null || businessProgress == null) return;
    setSubmitting(true);
    try {
      await onSubmit({
        lifeSatisfaction,
        timeProtected,
        personalWin: personalWin.trim() || null,
        businessProgress,
        blockers: blockers.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = lifeSatisfaction != null && timeProtected != null && businessProgress != null;
  const loading = isLoading || submitting;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">Week {weekNumber} Check-in</h3>

      {/* Part A: Life Pulse (first) */}
      <section className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-slate-600">Life Pulse</h4>

        <div className="mb-4">
          <label className="mb-2 block text-sm text-slate-700">How was your life this week?</label>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLifeSatisfaction(n)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  lifeSatisfaction === n
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                {n} — {LIFE_SATISFACTION_LABELS[n]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm text-slate-700">Did you protect your life commitments this week?</label>
          {lifeCommitments.length > 0 && (
            <p className="mb-1 text-xs text-slate-500">
              e.g. {lifeCommitments.slice(0, 2).map((c) => c.commitment).join('; ')}
            </p>
          )}
          <div className="flex gap-2">
            {(['yes', 'mostly', 'no'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setTimeProtected(opt)}
                className={`rounded-lg border px-3 py-2 text-sm capitalize ${
                  timeProtected === opt
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-700">Personal win (optional, max 100 chars)</label>
          <input
            type="text"
            maxLength={100}
            value={personalWin}
            onChange={(e) => setPersonalWin(e.target.value)}
            placeholder="One thing that went well for you personally..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </section>

      {/* Part B: Sprint Review */}
      <section className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-slate-600">Sprint Review</h4>

        <div className="mb-4">
          <label className="mb-2 block text-sm text-slate-700">Business progress this week</label>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setBusinessProgress(n)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  businessProgress === n
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                {n} — {BUSINESS_PROGRESS_LABELS[n]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-700">Blockers (optional, max 200 chars)</label>
          <textarea
            maxLength={200}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="What got in the way?"
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </section>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Submit check-in'}
        </button>
      </div>
    </div>
  );
}
