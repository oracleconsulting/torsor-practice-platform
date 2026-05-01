import { useState } from 'react';
import { Eye, TrendingUp, X } from 'lucide-react';

interface ClientRoadmapPreviewProps {
  client: { name: string; company: string };
  roadmapData: any;
  valueAnalysis: any;
  insightReport?: any;
  onClose: () => void;
  onPublish: () => void;
}

type Tab = 'vision' | 'shift' | 'sprint' | 'value';

export function ClientRoadmapPreview({ client, roadmapData, valueAnalysis, insightReport, onClose, onPublish }: ClientRoadmapPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('vision');

  const vision = roadmapData?.fiveYearVision;
  const shift = roadmapData?.sixMonthShift;
  const sprint = roadmapData?.sprint;
  const fitProfile = roadmapData?.fitProfile;
  const northStar = fitProfile?.northStar || vision?.northStar;
  const tagline = fitProfile?.tagline || vision?.tagline;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center py-8 px-4">
        <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">

          <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">CLIENT PREVIEW — This is what {client.name} will see</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onPublish} className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600">Looks good — Publish</button>
              <button onClick={onClose} className="p-1 rounded hover:bg-blue-500"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="p-6 space-y-6">

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">{tagline || 'Your Transformation'}</h1>
              {client.company && <p className="text-sm text-slate-500 mt-1">{client.company}</p>}
            </div>

            {valueAnalysis && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Your Financial Picture</h3>
                    <p className="text-xs text-slate-500">
                      {[
                        valueAnalysis.overallScore && `${valueAnalysis.overallScore}/100`,
                        valueAnalysis.totalOpportunity && `£${Number(valueAnalysis.totalOpportunity).toLocaleString()} opportunity`,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {insightReport && (
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-5">
                <h3 className="font-semibold text-cyan-900 text-lg mb-2">Your Sprint Review</h3>
                {insightReport.lifeMetrics?.summary && <p className="text-sm text-gray-800">{insightReport.lifeMetrics.summary}</p>}
                {insightReport.insight && (
                  <div className="bg-white rounded-lg p-3 border border-cyan-100 mt-3">
                    <p className="text-sm font-medium text-gray-900">{insightReport.insight.headline}</p>
                    <p className="text-sm text-gray-600 mt-1">{insightReport.insight.detail}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {([
                { id: 'vision', label: '5-Year Vision' },
                { id: 'shift', label: '6-Month Shift' },
                { id: 'sprint', label: '12-Week Sprint' },
                { id: 'value', label: 'Value Analysis' },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'vision' && (
              <div className="space-y-6">
                {northStar && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                    <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-2">Your North Star</p>
                    <p className="text-lg text-emerald-900 italic font-medium leading-relaxed">&ldquo;{northStar}&rdquo;</p>
                  </div>
                )}
                {fitProfile?.openingReflection && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Opening Reflection</h3>
                    {String(fitProfile.openingReflection).split('\n\n').map((p: string, i: number) => (
                      <p key={i} className="text-slate-700 leading-relaxed">{p}</p>
                    ))}
                  </div>
                )}
                {fitProfile?.archetype && (
                  <span className="inline-block px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-medium capitalize">
                    {String(fitProfile.archetype).replace(/_/g, ' ')}
                  </span>
                )}
                {vision?.transformationNarrative && (
                  <div className="space-y-6">
                    {vision.transformationNarrative.currentReality && <div><h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Current Reality</h4><p className="text-slate-700 leading-relaxed">{vision.transformationNarrative.currentReality}</p></div>}
                    {vision.transformationNarrative.turningPoint && <div><h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">The Turning Point</h4><p className="text-slate-700 leading-relaxed">{vision.transformationNarrative.turningPoint}</p></div>}
                    {vision.transformationNarrative.achievedVision && <div><h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">The Achieved Vision</h4><p className="text-slate-700 leading-relaxed">{vision.transformationNarrative.achievedVision}</p></div>}
                  </div>
                )}
                {vision?.yearMilestones && (
                  <div className="grid grid-cols-3 gap-4">
                    {(['year1', 'year3', 'year5'] as const).map((year, i) => {
                      const m = vision.yearMilestones[year];
                      if (!m) return null;
                      return (
                        <div key={year} className="bg-indigo-50 rounded-lg p-4 text-center">
                          <p className="text-xs text-indigo-600 font-medium">Year {i === 0 ? 1 : i === 1 ? 3 : 5}</p>
                          <p className="text-sm font-medium text-indigo-900 mt-1">{typeof m === 'string' ? m : m.headline || m.title || ''}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shift' && (
              <div className="space-y-6">
                {shift?.shiftStatement && <p className="text-lg text-slate-800 font-medium leading-relaxed">{shift.shiftStatement}</p>}
                {(shift?.keyMilestones || shift?.milestones)?.map((m: any, i: number) => (
                  <div key={i} className="border-l-4 border-emerald-400 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">M{m.targetMonth || m.month || (i + 1) * 2}</span>
                      <h4 className="font-medium text-slate-900">{m.milestone || m.title}</h4>
                    </div>
                    {(m.measurable || m.target) && <p className="text-sm text-slate-600 mt-1">{m.measurable || m.target}</p>}
                    {(m.whyItMatters || m.explanation) && <p className="text-sm text-slate-500 italic mt-1">{m.whyItMatters || m.explanation}</p>}
                  </div>
                ))}
                {shift?.tuesdayEvolution && (
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tuesday Evolution</h4>
                    <div className="space-y-3">
                      {Object.entries(shift.tuesdayEvolution).map(([month, text]: [string, any]) => (
                        <div key={month} className="flex gap-3"><span className="text-xs font-medium text-emerald-600 w-16 shrink-0">{month}</span><p className="text-sm text-slate-600">{text}</p></div>
                      ))}
                    </div>
                  </div>
                )}
                {shift?.quickWins?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Wins</h4>
                    {shift.quickWins.map((win: any, i: number) => <div key={i} className="flex items-start gap-2 mb-2"><span className="text-emerald-500 mt-0.5">✅</span><p className="text-sm text-slate-700">{typeof win === 'string' ? win : win.win || win.title}</p></div>)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sprint' && sprint?.weeks && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">{sprint.weeks.length} weeks · {sprint.weeks.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0)} tasks</p>
                {sprint.weeks.map((week: any) => (
                  <details key={week.weekNumber} className="border border-slate-200 rounded-lg overflow-hidden">
                    <summary className="px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 flex items-center gap-3 list-none [&::-webkit-details-marker]:hidden">
                      <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">{week.weekNumber}</span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{week.theme}</p>
                        <p className="text-xs text-slate-500">{week.phase} · {week.tasks?.length || 0} tasks</p>
                      </div>
                    </summary>
                    <div className="px-4 py-3 space-y-3 border-t border-slate-200">
                      {(week.narrative || week.focus) && <p className="text-sm text-slate-600 italic">{week.narrative || week.focus}</p>}
                      {(week.weekMilestone || week.milestone) && (
                        <div className="bg-amber-50 rounded-lg p-3"><p className="text-xs text-amber-700 font-medium">🎯 {week.weekMilestone || week.milestone}</p></div>
                      )}
                      {week.tasks?.map((task: any, ti: number) => (
                        <div key={ti} className="border border-slate-100 rounded-lg p-3">
                          <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                          {task.description && <p className="text-sm text-slate-600 mt-1">{task.description.substring(0, 200)}{task.description.length > 200 ? '...' : ''}</p>}
                          {(task.why || task.whyThisMatters) && <p className="text-sm text-indigo-600 mt-1 italic">Why: {task.why || task.whyThisMatters}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            {task.category && <span className={`text-xs px-2 py-0.5 rounded ${(task.category || '').startsWith('life_') ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{(task.category || '').replace('life_', '✨ ')}</span>}
                            {(task.timeEstimate || task.estimatedHours) && <span className="text-xs text-slate-400">{task.timeEstimate || `${task.estimatedHours}h`}</span>}
                          </div>
                          {task.deliverable && <p className="text-xs text-slate-400 mt-1">📋 {task.deliverable}</p>}
                        </div>
                      ))}
                      {(week.tuesdayCheckIn || week.tuesdayTransformation) && (
                        <div className="bg-indigo-50 rounded-lg p-3"><p className="text-xs text-indigo-700 font-medium">Tuesday Check-In</p><p className="text-sm text-indigo-800 mt-1 italic">{week.tuesdayCheckIn || week.tuesdayTransformation}</p></div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}

            {activeTab === 'value' && valueAnalysis && (
              <div className="space-y-6">
                {valueAnalysis.narrativeSummary && (
                  <div className="space-y-4">
                    {valueAnalysis.narrativeSummary.uncomfortableTruth && <div className="border-l-4 border-red-400 pl-4"><h4 className="text-sm font-bold text-red-800 mb-2">The Uncomfortable Truth</h4><p className="text-sm text-slate-700 leading-relaxed">{valueAnalysis.narrativeSummary.uncomfortableTruth}</p></div>}
                    {valueAnalysis.narrativeSummary.whatThisReallyMeans && <p className="text-sm text-slate-600 italic leading-relaxed">{valueAnalysis.narrativeSummary.whatThisReallyMeans}</p>}
                    {valueAnalysis.narrativeSummary.beforeYouDoAnythingElse && <div><h4 className="text-sm font-bold text-slate-800 mb-1">Before anything else</h4><p className="text-sm text-slate-700">{valueAnalysis.narrativeSummary.beforeYouDoAnythingElse}</p></div>}
                    {(valueAnalysis.narrativeSummary.theGoodNews || valueAnalysis.actionHierarchy?.theGoodNews) && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4"><h4 className="text-sm font-bold text-emerald-800 mb-1">The Good News</h4><p className="text-sm text-emerald-700">{valueAnalysis.narrativeSummary.theGoodNews || valueAnalysis.actionHierarchy?.theGoodNews}</p></div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  {valueAnalysis.overallScore != null && <div className="bg-emerald-50 rounded-lg p-4 text-center"><p className="text-3xl font-bold text-emerald-600">{valueAnalysis.overallScore}/100</p><p className="text-xs text-emerald-700 mt-1">Business Score</p></div>}
                  {valueAnalysis.totalOpportunity != null && valueAnalysis.totalOpportunity > 0 && <div className="bg-blue-50 rounded-lg p-4 text-center"><p className="text-3xl font-bold text-blue-600">£{Number(valueAnalysis.totalOpportunity).toLocaleString()}</p><p className="text-xs text-blue-700 mt-1">Opportunity</p></div>}
                  {valueAnalysis.riskRegister?.length > 0 && <div className="bg-red-50 rounded-lg p-4 text-center"><p className="text-3xl font-bold text-red-600">{valueAnalysis.riskRegister.filter((r: any) => r.severity === 'Critical').length}</p><p className="text-xs text-red-700 mt-1">Critical Risks</p></div>}
                </div>
                {valueAnalysis.businessValuation && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center"><p className="text-xs text-slate-500 uppercase tracking-wide">Current Valuation</p><p className="text-2xl font-bold text-slate-900">£{Number(valueAnalysis.businessValuation.currentValue || valueAnalysis.businessValuation.baselineValue || 0).toLocaleString()}</p></div>
                    {valueAnalysis.businessValuation.potentialValue > 0 && <div className="text-center"><p className="text-xs text-slate-500 uppercase tracking-wide">Potential Valuation</p><p className="text-2xl font-bold text-emerald-600">£{Number(valueAnalysis.businessValuation.potentialValue).toLocaleString()}</p></div>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between sticky bottom-0">
            <p className="text-xs text-slate-400">Preview only — no practice-only content shown</p>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm">Close</button>
              <button onClick={onPublish} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">Publish to Client</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
