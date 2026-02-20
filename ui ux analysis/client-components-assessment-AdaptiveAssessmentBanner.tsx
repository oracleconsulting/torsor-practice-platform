// ============================================================================
// AdaptiveAssessmentBanner — Informs Clients About Shortened Assessment
// ============================================================================
// Shown at the top of the Part 2 assessment page when sections are being
// skipped because richer data exists from other service lines.
// Also includes the Part 3 skip notice when BM/HVA value analysis exists.
// ============================================================================

import { CheckCircle, Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { AdaptiveAssessmentState } from '../../hooks/useAdaptiveAssessment';

interface AdaptiveAssessmentBannerProps {
  state: AdaptiveAssessmentState;
  part: 'part2' | 'part3';
}

export function AdaptiveAssessmentBanner({ state, part }: AdaptiveAssessmentBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (part === 'part2' && state.skippedQuestionCount > 0) {
    const hiddenSections = state.part2Sections.filter(s => !s.visible);

    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-emerald-900">
              Your assessment has been personalised
            </h3>
            <p className="text-sm text-emerald-700 mt-1">
              We've removed {state.skippedQuestionCount} questions because we already have detailed
              data from your other services. You'll answer {state.visibleQuestionCount} questions
              instead of the usual 72.
            </p>

            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-2 hover:text-emerald-800 transition-colors"
            >
              {expanded ? 'Hide details' : 'See what was removed'}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {expanded && (
              <div className="mt-3 space-y-2">
                {hiddenSections.map(section => (
                  <div
                    key={section.sectionId}
                    className="flex items-start gap-2 p-2 bg-white/60 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        {section.name}
                        <span className="text-slate-400 font-normal"> — {section.questionCount} questions</span>
                      </p>
                      {section.replacedBy && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Covered by your {section.replacedBy}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (part === 'part3' && !state.showPart3) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">
              Hidden Value Analysis — already covered
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {state.part3HiddenReason || 'Your value analysis data is being sourced from your other services.'}
            </p>
            {state.valueAnalysisSource === 'bm_report' && (
              <p className="text-xs text-blue-600 mt-2">
                Your Benchmarking & Hidden Value Analysis report provides a more comprehensive
                value assessment than the standard questionnaire. We'll use that data to enrich
                your roadmap automatically.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

interface SkippedSectionPlaceholderProps {
  sectionName: string;
  replacedBy: string | null;
  questionCount: number;
}

export function SkippedSectionPlaceholder({ sectionName, replacedBy, questionCount }: SkippedSectionPlaceholderProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 opacity-60">
      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-slate-500">
          <span className="font-medium">{sectionName}</span>
          <span className="text-slate-400"> — {questionCount} questions</span>
        </p>
        {replacedBy && (
          <p className="text-xs text-slate-400">
            Already covered by your {replacedBy}
          </p>
        )}
      </div>
      <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
        Skipped
      </span>
    </div>
  );
}
