// ============================================================================
// SprintSummaryClientView — Client-facing sprint summary (celebration + reflection)
// ============================================================================
// Renders the generate-sprint-summary output. advisorBrief is NOT shown.
// ============================================================================

import { useState } from 'react';
import { Trophy, Quote, ArrowRight } from 'lucide-react';

export interface SprintSummaryContent {
  headline?: string;
  completionStats?: {
    totalTasks: number;
    completed: number;
    skipped: number;
    inProgress?: number;
    pending?: number;
    completionRate: number;
    strongestWeek?: number;
    weakestWeek?: number;
  };
  achievements?: Array<{
    title: string;
    description: string;
    category: string;
    impactLevel: 'high' | 'medium';
  }>;
  growthAreas?: Array<{
    title: string;
    description: string;
    suggestedFocus: string;
  }>;
  behaviouralShifts?: {
    whatChanged: string;
    whatDidnt: string;
    tuesdayTestProgress: string;
  };
  clientVoice?: {
    bestQuote: string | null;
    concernQuote: string | null;
  };
  nextSprintRecommendations?: Array<{
    focus: string;
    reason: string;
  }>;
  sprintNumber?: number;
  generatedAt?: string;
}

export interface SprintSummaryClientViewProps {
  summary: SprintSummaryContent | null;
  clientName?: string;
  onStartLifeCheck?: () => void;
}

const ACHIEVEMENTS_SHOWN = 4;

export function SprintSummaryClientView({
  summary,
  clientName,
  onStartLifeCheck,
}: SprintSummaryClientViewProps) {
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  if (!summary) return null;

  const hasNewShape = summary.headline != null || summary.completionStats != null;
  if (!hasNewShape) return null;

  const stats = summary.completionStats;
  const achievements = summary.achievements || [];
  const growthAreas = summary.growthAreas || [];
  const shifts = summary.behaviouralShifts || {};
  const clientVoice = summary.clientVoice || {};
  const nextSprint = summary.nextSprintRecommendations || [];
  const sprintNum = summary.sprintNumber ?? 1;
  const displayAchievements = showAllAchievements ? achievements : achievements.slice(0, ACHIEVEMENTS_SHOWN);
  const hasMoreAchievements = achievements.length > ACHIEVEMENTS_SHOWN;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 lg:p-8 space-y-8">
        {/* 1. Header + Headline */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            Sprint {sprintNum} Complete
          </h2>
          {summary.headline && (
            <p className="text-lg text-slate-600 italic mt-2">"{summary.headline}"</p>
          )}
        </div>

        {/* 2. Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.completionRate ?? 0}%</p>
              <p className="text-xs text-slate-500 uppercase mt-0.5">Completed</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.totalTasks ?? 0}</p>
              <p className="text-xs text-slate-500 uppercase mt-0.5">Tasks</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.completed ?? 0}</p>
              <p className="text-xs text-slate-500 uppercase mt-0.5">Done</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.skipped ?? 0}</p>
              <p className="text-xs text-slate-500 uppercase mt-0.5">Skipped</p>
            </div>
          </div>
        )}

        {/* 3. What You Achieved */}
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            What You Achieved
          </p>
          {displayAchievements.length === 0 ? (
            <p className="text-slate-500 italic">Your achievements are being compiled.</p>
          ) : (
            <div className="space-y-4">
              {displayAchievements.map((a, i) => (
                <div
                  key={i}
                  className={`border-l-4 pl-4 py-2 ${
                    a.impactLevel === 'high' ? 'border-emerald-400' : 'border-indigo-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{a.title}</p>
                  <p className="text-slate-600 text-sm mt-1">{a.description}</p>
                  {a.category && (
                    <span className="inline-block text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500 mt-2">
                      {a.category}
                    </span>
                  )}
                </div>
              ))}
              {hasMoreAchievements && !showAllAchievements && (
                <button
                  type="button"
                  onClick={() => setShowAllAchievements(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Show more
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. How Your Tuesday Changed */}
        {shifts.tuesdayTestProgress && (
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              How Your Tuesday Changed
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex gap-3">
              <Quote className="w-5 h-5 text-indigo-300 flex-shrink-0 mt-0.5" />
              <p className="text-indigo-900 leading-relaxed">{shifts.tuesdayTestProgress}</p>
            </div>
          </div>
        )}

        {/* 5. What Shifted */}
        {shifts.whatChanged && (
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              What Shifted
            </p>
            <p className="text-slate-700 leading-relaxed">{shifts.whatChanged}</p>
          </div>
        )}

        {/* 6. What's Still in Play */}
        {shifts.whatDidnt && (
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              What&apos;s Still in Play
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">{shifts.whatDidnt}</p>
            {growthAreas.length > 0 && (
              <div className="space-y-3">
                {growthAreas.map((g, i) => (
                  <div
                    key={i}
                    className="bg-amber-50 border border-amber-100 rounded-lg p-3"
                  >
                    <p className="font-semibold text-slate-900">{g.title}</p>
                    {g.suggestedFocus && (
                      <p className="text-sm text-amber-800 mt-1">
                        → {g.suggestedFocus}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. In Your Own Words */}
        {(clientVoice.bestQuote || clientVoice.concernQuote) && (
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              In Your Own Words
            </p>
            <div className="space-y-3">
              {clientVoice.bestQuote && (
                <blockquote className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 border-l-4 border-emerald-400 italic text-slate-700">
                  {clientVoice.bestQuote}
                </blockquote>
              )}
              {clientVoice.concernQuote && (
                <blockquote className="bg-amber-50 border border-amber-100 rounded-lg p-4 border-l-4 border-amber-400 italic text-slate-700">
                  {clientVoice.concernQuote}
                </blockquote>
              )}
            </div>
          </div>
        )}

        {/* 8. What's Next */}
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            What&apos;s Next
          </p>
          {nextSprint.length > 0 ? (
            <>
              <p className="text-slate-600 mb-3">Your next sprint will focus on:</p>
              <ul className="space-y-2">
                {nextSprint.map((r, i) => (
                  <li key={i}>
                    <span className="font-semibold text-slate-900">{r.focus}</span>
                    <span className="text-slate-600"> — {r.reason}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {onStartLifeCheck && (
            <button
              type="button"
              onClick={onStartLifeCheck}
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-medium transition-colors"
            >
              Ready for Sprint {sprintNum + 1}?
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {summary.generatedAt && (
          <p className="text-xs text-slate-400">
            Summary generated {new Date(summary.generatedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
