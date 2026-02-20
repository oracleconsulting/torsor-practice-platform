// ============================================================================
// LifePulseCard — Weekly 3-question life pulse (4A Life Design Thread)
// ============================================================================

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';

const CATEGORY_OPTIONS: { value: string; label: string; emoji: string }[] = [
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
  isCatchUp: boolean;
  isSprintComplete: boolean;
  onSubmit: (rating: number, categories: string[], protectText?: string) => Promise<void>;
  currentScore?: number | null;
  loading?: boolean;
}

export function LifePulseCard({
  sprintNumber,
  weekNumber,
  isCatchUp,
  isSprintComplete,
  onSubmit,
  currentScore = null,
  loading = false,
}: LifePulseCardProps) {
  const [rating, setRating] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [protectText, setProtectText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);

  if (isCatchUp || isSprintComplete) return null;

  const toggleCategory = (value: string) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    try {
      await onSubmit(rating, categories, protectText.trim() || undefined);
      setSubmitted(true);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && !showForm) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-semibold text-rose-800">Life Pulse saved ✓</span>
          </div>
          {currentScore != null && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
              Score: {Math.round(currentScore)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-2 text-xs text-rose-600 hover:text-rose-800 underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-rose-500" />
        <span className="text-sm font-semibold text-rose-800 uppercase tracking-wide">
          Weekly Life Pulse
        </span>
        <span className="text-xs text-rose-600 bg-rose-100 px-2 py-0.5 rounded">Week {weekNumber}</span>
      </div>

      <p className="text-sm text-rose-900 mb-3">
        How aligned did your week feel with the life you&apos;re building?
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
        Which life areas got attention this week?
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

      <p className="text-sm text-rose-900 mb-2">One thing to protect next week (optional)</p>
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
    </div>
  );
}
