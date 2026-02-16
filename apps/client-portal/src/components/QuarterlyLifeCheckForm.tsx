// ============================================================================
// Quarterly Life Check Form — 6 reflection questions before Sprint 2
// ============================================================================
// Shown when renewal_status = 'life_check_pending'. Completion triggers
// DB trigger to set renewal_status = 'life_check_complete'.
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Trophy,
  AlertTriangle,
  Compass,
  Sparkles,
  Check,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const QUESTIONS = [
  {
    key: 'tuesday_test_update',
    title: 'The Tuesday Test',
    subtitle:
      "How's your ideal Tuesday looking now? Has anything shifted since we started?",
    placeholder: 'My Tuesdays now look like...',
    Icon: Calendar,
  },
  {
    key: 'time_reclaim_progress',
    title: 'Time Reclaimed',
    subtitle:
      "How many hours a week have you genuinely reclaimed? Be honest — even 2 hours counts.",
    placeholder: "I've reclaimed roughly...",
    Icon: Clock,
  },
  {
    key: 'biggest_win',
    title: 'Biggest Win',
    subtitle: "What's the single thing from this sprint you're most proud of?",
    placeholder: "The thing I'm most proud of is...",
    Icon: Trophy,
  },
  {
    key: 'biggest_frustration',
    title: 'Biggest Frustration',
    subtitle: "What's still not working? What kept pulling you back in?",
    placeholder: "The thing that still frustrates me is...",
    Icon: AlertTriangle,
  },
  {
    key: 'priority_shift',
    title: 'Priority Shift',
    subtitle:
      "Have your priorities changed since we started? What matters more now? What matters less?",
    placeholder: "What's changed for me is...",
    Icon: Compass,
  },
  {
    key: 'next_sprint_wish',
    title: 'Next Sprint Wish',
    subtitle:
      "If this next sprint could change one thing in your life or business, what would it be?",
    placeholder: "For the next sprint, I'd love to...",
    Icon: Sparkles,
  },
];

export interface QuarterlyLifeCheckFormProps {
  clientId: string;
  practiceId: string;
  sprintNumber: number;
  clientName?: string;
  onComplete: () => void;
}

export function QuarterlyLifeCheckForm({
  clientId,
  practiceId,
  sprintNumber,
  clientName,
  onComplete,
}: QuarterlyLifeCheckFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isComplete = QUESTIONS.every((q) => (answers[q.key] || '').trim().length > 0);

  // Pre-fill from existing draft
  useEffect(() => {
    const loadExisting = async () => {
      const { data } = await supabase
        .from('quarterly_life_checks')
        .select('*')
        .eq('client_id', clientId)
        .eq('sprint_number', sprintNumber)
        .maybeSingle();

      if (data && !data.completed_at) {
        setAnswers({
          tuesday_test_update: data.tuesday_test_update || '',
          time_reclaim_progress: data.time_reclaim_progress || '',
          biggest_win: data.biggest_win || '',
          biggest_frustration: data.biggest_frustration || '',
          priority_shift: data.priority_shift || '',
          next_sprint_wish: data.next_sprint_wish || '',
        });
      }
    };
    loadExisting();
  }, [clientId, sprintNumber]);

  // Debounced auto-save draft (no completed_at)
  useEffect(() => {
    const hasAnyContent = Object.values(answers).some((v) => v.trim().length > 0);
    if (!hasAnyContent) return;

    const timer = setTimeout(async () => {
      try {
        await supabase.from('quarterly_life_checks').upsert(
          {
            client_id: clientId,
            practice_id: practiceId,
            sprint_number: sprintNumber,
            tuesday_test_update: answers.tuesday_test_update?.trim() || null,
            time_reclaim_progress: answers.time_reclaim_progress?.trim() || null,
            biggest_win: answers.biggest_win?.trim() || null,
            biggest_frustration: answers.biggest_frustration?.trim() || null,
            priority_shift: answers.priority_shift?.trim() || null,
            next_sprint_wish: answers.next_sprint_wish?.trim() || null,
          },
          { onConflict: 'client_id,sprint_number' }
        );
      } catch {
        // Silent fail for auto-save
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [answers, clientId, practiceId, sprintNumber]);

  const handleSubmit = async () => {
    if (!isComplete || saving) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('quarterly_life_checks')
        .upsert(
          {
            client_id: clientId,
            practice_id: practiceId,
            sprint_number: sprintNumber,
            tuesday_test_update: answers.tuesday_test_update?.trim() || null,
            time_reclaim_progress: answers.time_reclaim_progress?.trim() || null,
            biggest_win: answers.biggest_win?.trim() || null,
            biggest_frustration: answers.biggest_frustration?.trim() || null,
            priority_shift: answers.priority_shift?.trim() || null,
            next_sprint_wish: answers.next_sprint_wish?.trim() || null,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'client_id,sprint_number' }
        );

      if (error) throw error;

      setSaved(true);
      setTimeout(() => onComplete(), 1500);
    } catch (err) {
      console.error('Failed to save life check:', err);
      alert('Something went wrong saving your answers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-emerald-800 font-medium">
          <Check className="w-5 h-5" />
          <span>Answers saved!</span>
        </div>
        <p className="text-sm text-emerald-700 mt-2">
          Your advisor will use these to plan your next sprint.
        </p>
      </div>
    );
  }

  const name = clientName || 'there';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span aria-hidden>🎉</span>
          Sprint {sprintNumber} Complete!
        </h2>
        <p className="text-slate-600 mt-1">
          Before we plan your next sprint, {name}, take a few minutes to reflect on
          what&apos;s changed.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {QUESTIONS.map(({ key, title, subtitle, placeholder, Icon }) => (
          <div
            key={key}
            className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2"
          >
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>{title}</span>
            </div>
            <p className="text-sm text-slate-600">{subtitle}</p>
            <textarea
              value={answers[key] ?? ''}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [key]: e.target.value }))
              }
              rows={3}
              placeholder={placeholder}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[80px]"
            />
          </div>
        ))}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete || saving}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                Submit & Plan Next Sprint
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
