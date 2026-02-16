// ============================================================================
// SprintSummaryAdminPreview — Admin view of generated sprint summary
// ============================================================================
// Used in ClientDetailModal Roadmap tab for review/approve/regenerate.
// Supports new shape (headline, completionStats, achievements, etc.) and
// legacy shape (content.summary, content.analytics).
// ============================================================================

import {
  Trophy,
  TrendingDown,
  Quote,
  Target,
  BarChart3,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

export function SprintSummaryAdminPreview({ content }: { content: any }) {
  if (!content) {
    return (
      <div className="text-sm text-gray-500 italic py-4">
        No summary content to preview
      </div>
    );
  }

  // Backward compatibility: old shape (content.summary / content.analytics)
  if (content.summary != null || content.analytics != null) {
    return (
      <div className="space-y-3">
        {content.summary != null && (
          <p className="text-sm text-gray-700">
            {typeof content.summary === 'string'
              ? content.summary
              : JSON.stringify(content.summary)}
          </p>
        )}
        {content.analytics != null && (
          <pre className="text-xs text-gray-500 bg-white p-3 rounded overflow-x-auto">
            {JSON.stringify(content.analytics, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  // New shape: require at least headline or completionStats to consider it valid
  const hasNewShape = content.headline != null || content.completionStats != null;
  if (!hasNewShape) {
    return (
      <div className="text-sm text-gray-500 italic py-4">
        No summary content to preview
      </div>
    );
  }

  const stats = content.completionStats || {};
  const achievements = content.achievements || [];
  const growthAreas = content.growthAreas || [];
  const behaviouralShifts = content.behaviouralShifts || {};
  const clientVoice = content.clientVoice || {};
  const nextSprint = content.nextSprintRecommendations || [];

  return (
    <div className="space-y-4 text-sm">
      {/* 1. Headline */}
      {content.headline && (
        <p className="text-base font-bold text-gray-900 leading-snug">
          {content.headline}
        </p>
      )}

      {/* 2. Completion Stats — 4 mini stat cards */}
      {(stats.totalTasks != null || stats.completionRate != null) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white rounded-lg border border-gray-100 p-2.5">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Completed
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {stats.completed ?? 0}/{stats.totalTasks ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-2.5">
            <div className="flex items-center gap-1.5 text-amber-600">
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Skipped
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {stats.skipped ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-2.5">
            <div className="flex items-center gap-1.5 text-indigo-600">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Rate
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {stats.completionRate ?? 0}%
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-2.5">
            <div className="flex items-center gap-1.5 text-blue-600">
              <Target className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Strongest
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              Wk {stats.strongestWeek ?? '—'}
            </p>
          </div>
        </div>
      )}

      {/* 3. Achievements */}
      {achievements.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">
            Key Achievements
          </p>
          <div className="space-y-2">
            {achievements.map((a: any, i: number) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-100 p-2.5 space-y-1"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{a.title}</span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      a.impactLevel === 'high'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {a.impactLevel ?? 'medium'}
                  </span>
                </div>
                <p className="text-gray-600 text-[13px] leading-snug">
                  {a.description}
                </p>
                {a.category && (
                  <span className="inline-block text-[11px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                    {a.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Growth Areas */}
      {growthAreas.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">
            Growth Areas
          </p>
          <div className="space-y-2">
            {growthAreas.map((g: any, i: number) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-100 p-2.5 space-y-1"
              >
                <span className="font-semibold text-gray-900">{g.title}</span>
                <p className="text-gray-600 text-[13px] leading-snug">
                  {g.description}
                </p>
                {g.suggestedFocus && (
                  <p className="text-[12px] text-amber-700 font-medium">
                    Next sprint focus: {g.suggestedFocus}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Behavioural Shifts */}
      {(behaviouralShifts.whatChanged ||
        behaviouralShifts.whatDidnt ||
        behaviouralShifts.tuesdayTestProgress) && (
        <div className="space-y-2">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">
            What Changed
          </p>
          <div className="space-y-2">
            {behaviouralShifts.whatChanged && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 mb-0.5">
                  What shifted
                </p>
                <p className="text-gray-700 text-[13px] leading-snug">
                  {behaviouralShifts.whatChanged}
                </p>
              </div>
            )}
            {behaviouralShifts.whatDidnt && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 mb-0.5">
                  What persists
                </p>
                <p className="text-gray-700 text-[13px] leading-snug">
                  {behaviouralShifts.whatDidnt}
                </p>
              </div>
            )}
            {behaviouralShifts.tuesdayTestProgress && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                <p className="text-[11px] font-semibold text-amber-800 mb-0.5">
                  Tuesday Test
                </p>
                <p className="text-amber-900 text-[13px] leading-snug">
                  {behaviouralShifts.tuesdayTestProgress}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Client Voice */}
      {(clientVoice.bestQuote || clientVoice.concernQuote) && (
        <div className="space-y-2">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5" />
            Client Voice
          </p>
          <div className="space-y-2">
            {clientVoice.bestQuote && (
              <blockquote className="border-l-2 border-emerald-200 pl-2.5 py-1 text-gray-700 text-[13px] italic">
                {clientVoice.bestQuote}
              </blockquote>
            )}
            {clientVoice.concernQuote && (
              <blockquote className="border-l-2 border-amber-200 pl-2.5 py-1 text-gray-700 text-[13px] italic flex gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="text-amber-700 font-medium">Concern: </span>
                  {clientVoice.concernQuote}
                </span>
              </blockquote>
            )}
          </div>
        </div>
      )}

      {/* 7. Next Sprint Recommendations */}
      {nextSprint.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Recommended Focus for Next Sprint
          </p>
          <ol className="list-decimal list-inside space-y-1.5">
            {nextSprint.map((r: any, i: number) => (
              <li key={i} className="text-gray-700">
                <span className="font-semibold text-gray-900">{r.focus}</span>
                <p className="text-[13px] text-gray-600 ml-5 mt-0.5">
                  {r.reason}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 8. Advisor Brief */}
      {content.advisorBrief && (
        <div className="space-y-2">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Advisor Notes
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            <p className="text-gray-700 text-[13px] leading-snug whitespace-pre-wrap">
              {content.advisorBrief}
            </p>
          </div>
        </div>
      )}

      {/* Generated at */}
      {content.generatedAt && (
        <p className="text-[11px] text-gray-400 pt-1">
          Generated {new Date(content.generatedAt).toLocaleString()}
          {content.sprintNumber != null && ` · Sprint ${content.sprintNumber}`}
        </p>
      )}
    </div>
  );
}
