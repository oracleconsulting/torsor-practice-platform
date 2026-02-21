// ============================================================================
// SprintSummaryView — Full sprint review after all 12 weeks resolved
// ============================================================================
// Displays LLM-generated summary + pre-computed analytics
// ============================================================================

interface SprintSummaryViewProps {
  summary: any;
  analytics: any;
  clientName?: string;
}

export function SprintSummaryView({
  summary,
  analytics,
  clientName = 'there',
}: SprintSummaryViewProps) {
  const s = summary || {};
  const a = analytics || {};
  const narrative = s.transformationNarrative || {};
  const tuesday = s.tuesdayTestComparison || {};
  const renewal = s.renewalRecommendations || {};
  const phaseReview = s.phaseReview || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <div className="rounded-xl bg-indigo-600 text-white p-8">
        <h1 className="text-2xl font-bold mb-2">{s.headlineAchievement}</h1>
        <p className="text-indigo-100 text-sm">Your 12-week transformation at a glance</p>
      </div>

      {/* Client message */}
      {s.clientMessage && (
        <div className="rounded-lg bg-indigo-50 border-l-4 border-indigo-600 p-5">
          <p className="text-slate-800 whitespace-pre-wrap">{s.clientMessage}</p>
        </div>
      )}

      {/* Completion overview */}
      {a.totalTasks != null && (
        <div className="rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Completion overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-900">{a.totalTasks}</p>
              <p className="text-sm text-slate-500">Total tasks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{a.completedTasks}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-500">{a.skippedTasks}</p>
              <p className="text-sm text-slate-500">Skipped</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{a.completionRate}%</p>
              <p className="text-sm text-slate-500">Completion rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Transformation story */}
      <div className="rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Transformation story</h2>
        <div className="space-y-4 text-slate-700">
          {narrative.opening && <p>{narrative.opening}</p>}
          {narrative.journey && <p>{narrative.journey}</p>}
          {narrative.closing && <p>{narrative.closing}</p>}
        </div>
      </div>

      {/* Tuesday Test comparison */}
      {(tuesday.original || tuesday.progress || tuesday.gap) && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <h2 className="text-lg font-semibold text-slate-900 px-6 py-4 border-b border-slate-100">
            Tuesday Test comparison
          </h2>
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-6 bg-slate-50">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Original vision
              </p>
              <p className="text-slate-700">{tuesday.original}</p>
            </div>
            <div className="p-6 bg-indigo-50">
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">
                Progress
              </p>
              <p className="text-slate-700">{tuesday.progress}</p>
            </div>
          </div>
          {(tuesday.gap || tuesday.nextSteps) && (
            <div className="px-6 py-4 border-t border-slate-100 space-y-2">
              {tuesday.gap && (
                <p className="text-sm text-slate-600"><strong>Gap:</strong> {tuesday.gap}</p>
              )}
              {tuesday.nextSteps && (
                <p className="text-sm text-slate-600"><strong>Next steps:</strong> {tuesday.nextSteps}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Phase review */}
      {Array.isArray(phaseReview) && phaseReview.length > 0 && (
        <div className="rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Phase review</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {phaseReview.map((phase: any, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-slate-100 p-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-slate-900">{phase.phase}</span>
                  <span className="text-sm text-slate-500">Weeks {phase.weeks}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-teal transition-all duration-700 ease-out"
                    style={{ width: `${phase.completionRate ?? 0}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">{phase.verdict}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & growth */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 p-6 bg-emerald-50/50">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Strengths revealed</h2>
          <ul className="space-y-3">
            {Array.isArray(s.strengthsRevealed) &&
              s.strengthsRevealed.map((item: any, i: number) => (
                <li key={i} className="text-sm text-slate-700">
                  <strong>{item.strength}</strong>
                  {item.evidence && <span> — {item.evidence}</span>}
                  {item.howToLeverage && (
                    <p className="mt-1 text-emerald-700">{item.howToLeverage}</p>
                  )}
                </li>
              ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 p-6 bg-amber-50/50">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Areas for growth</h2>
          <ul className="space-y-3">
            {Array.isArray(s.growthAreas) &&
              s.growthAreas.map((item: any, i: number) => (
                <li key={i} className="text-sm text-slate-700">
                  <strong>{item.area}</strong>
                  {item.evidence && <span> — {item.evidence}</span>}
                  {item.recommendation && (
                    <p className="mt-1 text-amber-800">{item.recommendation}</p>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Skip analysis */}
      {s.skipAnalysis && (
        <div className="rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Skip analysis</h2>
          <div className="space-y-2 text-slate-700 text-sm">
            {s.skipAnalysis.pattern && <p><strong>Pattern:</strong> {s.skipAnalysis.pattern}</p>}
            {s.skipAnalysis.insight && <p><strong>Insight:</strong> {s.skipAnalysis.insight}</p>}
            {s.skipAnalysis.adjustment && <p><strong>Adjustment:</strong> {s.skipAnalysis.adjustment}</p>}
          </div>
        </div>
      )}

      {/* Renewal / what's next */}
      {renewal.shouldRenew != null && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">What&apos;s next</h2>
          <p className="text-sm text-slate-700 mb-4">{renewal.toneShift}</p>
          {Array.isArray(renewal.focusAreas) && renewal.focusAreas.length > 0 && (
            <ul className="list-disc list-inside text-sm text-slate-700 mb-4">
              {renewal.focusAreas.map((area: string, i: number) => (
                <li key={i}>{area}</li>
              ))}
            </ul>
          )}
          {renewal.estimatedImpact && (
            <p className="text-sm text-indigo-800">{renewal.estimatedImpact}</p>
          )}
        </div>
      )}
    </div>
  );
}
