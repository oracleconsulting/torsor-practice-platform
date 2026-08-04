// ============================================================================
// CheckpointReviewCard — Optional mid-sprint review (weeks 3, 6, 9)
// ============================================================================
// Never gates progression. All fields optional; blank submit is allowed.
// ============================================================================

import { useState } from 'react';
import { CheckCircle, Loader2, Pencil } from 'lucide-react';
import type {
  CapacityOutlook,
  CheckpointReview,
  CheckpointReviewInput,
  CheckpointWeek,
} from '@/hooks/useCheckpointReview';

const CAPACITY_OPTIONS: { value: CapacityOutlook; label: string }[] = [
  { value: 'lighter', label: 'Lighter' },
  { value: 'similar', label: 'About the same' },
  { value: 'heavier', label: 'More than usual' },
];

export interface CheckpointReviewCardProps {
  checkpointWeek: CheckpointWeek;
  existingReview?: CheckpointReview | null;
  onSubmit: (input: CheckpointReviewInput) => Promise<void>;
  loading?: boolean;
}

function CapacityLabel({ value }: { value: CapacityOutlook | null }) {
  if (!value) return <span className="text-slate-400">Not said</span>;
  return (
    <span className="font-medium text-slate-900">
      {CAPACITY_OPTIONS.find((o) => o.value === value)?.label ?? value}
    </span>
  );
}

export function CheckpointReviewCard({
  checkpointWeek,
  existingReview = null,
  onSubmit,
  loading = false,
}: CheckpointReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [whatWorked, setWhatWorked] = useState(existingReview?.whatWorked ?? '');
  const [whatDidnt, setWhatDidnt] = useState(existingReview?.whatDidnt ?? '');
  const [whatsChanged, setWhatsChanged] = useState(existingReview?.whatsChanged ?? '');
  const [nextThreeWeeks, setNextThreeWeeks] = useState(existingReview?.nextThreeWeeks ?? '');
  const [capacityOutlook, setCapacityOutlook] = useState<CapacityOutlook | null>(
    existingReview?.capacityOutlook ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const showForm = !existingReview || editing;

  const startEdit = () => {
    setWhatWorked(existingReview?.whatWorked ?? '');
    setWhatDidnt(existingReview?.whatDidnt ?? '');
    setWhatsChanged(existingReview?.whatsChanged ?? '');
    setNextThreeWeeks(existingReview?.nextThreeWeeks ?? '');
    setCapacityOutlook(existingReview?.capacityOutlook ?? null);
    setSubmitError(null);
    setEditing(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        whatWorked,
        whatDidnt,
        whatsChanged,
        nextThreeWeeks,
        capacityOutlook,
      });
      setEditing(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save your review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!showForm && existingReview) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-800">
              Week {checkpointWeek} checkpoint — submitted
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {new Date(existingReview.updatedAt || existingReview.createdAt).toLocaleDateString(
                undefined,
                { weekday: 'short', day: 'numeric', month: 'short' },
              )}
            </span>
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
        </div>
        <div className="space-y-3 text-sm text-slate-700">
          {existingReview.whatWorked && (
            <p>
              <span className="text-slate-500">What worked:</span> {existingReview.whatWorked}
            </p>
          )}
          {existingReview.whatDidnt && (
            <p>
              <span className="text-slate-500">What didn&apos;t:</span> {existingReview.whatDidnt}
            </p>
          )}
          {existingReview.whatsChanged && (
            <p>
              <span className="text-slate-500">What&apos;s changed:</span>{' '}
              {existingReview.whatsChanged}
            </p>
          )}
          {existingReview.nextThreeWeeks && (
            <p>
              <span className="text-slate-500">Next three weeks:</span>{' '}
              {existingReview.nextThreeWeeks}
            </p>
          )}
          <p>
            <span className="text-slate-500">Capacity:</span>{' '}
            <CapacityLabel value={existingReview.capacityOutlook} />
          </p>
          {!existingReview.whatWorked &&
            !existingReview.whatDidnt &&
            !existingReview.whatsChanged &&
            !existingReview.nextThreeWeeks &&
            !existingReview.capacityOutlook && (
              <p className="text-slate-400 italic">Submitted without answers — that&apos;s fine.</p>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-indigo-900">
          Three weeks done. Five questions, five minutes, and it shapes what comes next.
        </h3>
        <p className="text-xs text-indigo-700/80 mt-1">
          Optional — skip it and nothing about your sprint changes. Fill it in and the next
          three weeks can reflect what is actually true now.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Looking back over the last three weeks, what actually worked?
          </label>
          <textarea
            value={whatWorked}
            onChange={(e) => setWhatWorked(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="The habits, conversations, or changes that stuck"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            What didn&apos;t, and was it the task or the timing?
          </label>
          <textarea
            value={whatDidnt}
            onChange={(e) => setWhatDidnt(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Wrong ask, wrong week, or something else entirely"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Has anything changed in the business we wouldn&apos;t know about?
          </label>
          <textarea
            value={whatsChanged}
            onChange={(e) => setWhatsChanged(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            placeholder="Someone has left, a system got fixed, a customer situation changed, anything."
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">
            What do you want the next three weeks pointed at?
          </label>
          <textarea
            value={nextThreeWeeks}
            onChange={(e) => setNextThreeWeeks(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="The one or two outcomes that would make the next stretch useful"
          />
        </div>

        <div>
          <p className="text-sm text-slate-700 mb-2">
            Realistically, what does your capacity look like?
          </p>
          <div className="flex flex-wrap gap-2">
            {CAPACITY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setCapacityOutlook((prev) => (prev === value ? null : value))
                }
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  capacityOutlook === value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {(submitting || loading) && <Loader2 className="w-4 h-4 animate-spin" />}
          Save review
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        )}
        <span className="text-xs text-slate-400">You can leave every field blank.</span>
      </div>
      {submitError && (
        <p className="mt-2 text-xs text-red-600">Couldn&apos;t save: {submitError}</p>
      )}
    </div>
  );
}
