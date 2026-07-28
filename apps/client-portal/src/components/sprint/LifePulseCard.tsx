// ============================================================================
// LifePulseCard — Weekly 3-question life pulse (4A Life Design Thread)
// ============================================================================

import { useState } from 'react';
import { Heart, Loader2, CheckCircle } from 'lucide-react';
import type { PulseByWeekEntry } from '@/hooks/useLifeAlignment';

export const CATEGORY_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'life_time', label: 'Time', emoji: '⏰' },
  { value: 'life_relationship', label: 'Relationships', emoji: '💛' },
  { value: 'life_health', label: 'Health', emoji: '🏃' },
  { value: 'life_experience', label: 'Experiences', emoji: '✨' },
  { value: 'life_identity', label: 'Identity', emoji: '🎯' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Disconnected',
  2: '',
  3: 'Balanced',
  4: '',
  5: 'Fully aligned',
};

export interface LifePulseCardProps {
  sprintNumber: number;
  weekNumber: number;
  isCatchUp?: boolean;
  isSprintComplete?: boolean;
  onSubmit?: (rating: number, categories: string[], protectText?: string) => Promise<void>;
  currentScore?: number | null;
  loading?: boolean;
  /** When present, render a read-only submitted summary (WeeklyCheckInCard pattern). */
  existingPulse?: PulseByWeekEntry | null;
  /** Override the form heading (e.g. "Close out Week N"). */
  formHeading?: string;
}

export function LifePulseCard({
  sprintNumber,
  weekNumber,
  isCatchUp = false,
  isSprintComplete = false,
  onSubmit,
  currentScore = null,
  loading = false,
  existingPulse = null,
  formHeading,
}: LifePulseCardProps) {
  const [rating, setRating] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [protectText, setProtectText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isSprintComplete) return null;

  if (existingPulse) {
    const areaLabels = existingPulse.activeCategories
      .map((v) => CATEGORY_OPTIONS.find((c) => c.value === v))
      .filter(Boolean) as typeof CATEGORY_OPTIONS;
    return (
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-rose-900">
              Week {weekNumber} Life Pulse — Submitted
            </h3>
          </div>
          <span className="text-xs text-rose-500">
            {new Date(existingPulse.createdAt).toLocaleDateString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-rose-900">
            <span className="text-rose-600">Alignment:</span>{' '}
            <span className="font-medium">
              {existingPulse.alignmentRating}/5
              {RATING_LABELS[existingPulse.alignmentRating]
                ? ` — ${RATING_LABELS[existingPulse.alignmentRating]}`
                : ''}
            </span>
          </p>
          {areaLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {areaLabels.map(({ value, label, emoji }) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800"
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </span>
              ))}
            </div>
          )}
          {existingPulse.protectNextWeek && (
            <p className="text-rose-800">
              <span className="text-rose-600">Protect:</span> {existingPulse.protectNextWeek}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!onSubmit) return null;

  const toggleCategory = (value: string) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(rating, categories, protectText.trim() || undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save your Life Pulse.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-rose-500" />
        <span className="text-sm font-semibold text-rose-800 uppercase tracking-wide">
          {formHeading
            ?? (isCatchUp ? 'Catch-up Life Pulse' : 'Weekly Life Pulse')}
        </span>
        {!formHeading && (
          <span className="text-xs text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
            Week {weekNumber}
          </span>
        )}
      </div>

      <p className="text-sm text-rose-900 mb-3">
        {isCatchUp
          ? 'Looking back, how aligned did that week feel with the life you\u2019re building?'
          : 'How aligned did your week feel with the life you\u2019re building?'}
      </p>
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              rating === n
                ? 'bg-rose-500 text-white'
                : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
            title={RATING_LABELS[n] || `${n}`}
          >
            ♥
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-xs text-rose-600 mb-4">{RATING_LABELS[rating]}</p>
      )}

      <p className="text-sm text-rose-900 mb-2">
        {isCatchUp
          ? 'Which life areas got attention that week?'
          : 'Which life areas got attention this week?'}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORY_OPTIONS.map(({ value, label, emoji }) => (
          <button
            key={value}
            type="button"
            onClick={() => toggleCategory(value)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              categories.includes(value)
                ? 'bg-rose-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <p className="text-sm text-rose-900 mb-2">
        {isCatchUp
          ? 'One thing you\u2019d protect if you had that week again (optional)'
          : 'One thing to protect next week (optional)'}
      </p>
      <input
        type="text"
        value={protectText}
        onChange={(e) => setProtectText(e.target.value)}
        placeholder="e.g. Wednesday morning with the kids"
        className="w-full px-3 py-2 border border-rose-200 rounded-lg text-sm text-rose-900 placeholder-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
      />

      <div className="mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={rating < 1 || submitting || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting || loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          Save Pulse
        </button>
      </div>
      {submitError && (
        <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          Couldn&apos;t save your Life Pulse: {submitError}
        </div>
      )}
      {currentScore != null && (
        <p className="mt-2 text-xs text-rose-500">Current alignment score: {Math.round(currentScore)}</p>
      )}
      <span className="sr-only">Sprint {sprintNumber}</span>
    </div>
  );
}
