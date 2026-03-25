// ═══════════════════════════════════════════════════════════════════════════════
// SA CLIENT REPORT PREVIEW — Admin-side mirror of client portal SAReportPage
// ═══════════════════════════════════════════════════════════════════════════════
// Renders all 14 sections so admin can preview before sharing with client.
// Data sources: report (sa_audit_reports row), findings, saRecommendations.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, Target, ChevronDown, ChevronRight,
  DollarSign, Zap, BarChart3, Shield, Users, Building2, Eye,
  Activity, Monitor, Workflow, Layers, TrendingUp, Gauge,
  CalendarClock, Rocket, Quote
} from 'lucide-react';
import SystemsMapSection from './SystemsMapSection';

function resolveMetrics(report: any) {
  const p = report?.pass1_data || {};
  const facts = p.facts || {};
  const scores = p.scores || {};
  const recs = p.recommendations || [];

  const calcBenefit = recs.reduce((s: number, r: any) => s + (r.annualBenefit || 0), 0);
  const calcInvestment = recs.reduce((s: number, r: any) => s + (r.estimatedCost || 0), 0);
  const calcHours = recs.reduce((s: number, r: any) => s + (parseFloat(r.hoursSavedWeekly) || 0), 0);

  const totalAnnualBenefit = calcBenefit || report.total_annual_benefit || 0;
  const totalInvestment = calcInvestment || report.total_recommended_investment || 0;
  const hoursReclaimable = calcHours || report.hours_reclaimable_weekly || 0;
  const paybackMonths = totalAnnualBenefit > 0 && totalInvestment > 0
    ? Math.max(1, Math.round(totalInvestment / (totalAnnualBenefit / 12)))
    : (report.overall_payback_months ?? 0);
  const roiRatio = totalInvestment > 0
    ? `${Math.round(totalAnnualBenefit / totalInvestment)}:1`
    : (report.roi_ratio || 'Infinite');

  const extractScore = (key: string, fallback: number) => {
    const val = scores[key];
    if (val && typeof val === 'object' && 'score' in val) return val.score ?? fallback;
    if (typeof val === 'number') return val;
    return fallback;
  };
  const extractEvidence = (key: string) => {
    const val = scores[key];
    if (val && typeof val === 'object' && 'evidence' in val) return val.evidence || '';
    return '';
  };

  return {
    annualCostOfChaos: Math.round(facts.annualCostOfChaos ?? report.total_annual_cost_of_chaos ?? 0),
    hoursWastedWeekly: facts.hoursWastedWeekly ?? report.total_hours_wasted_weekly ?? 0,
    growthMultiplier: facts.growthMultiplier ?? report.growth_multiplier ?? 1.3,
    projectedCostAtScale: Math.round(facts.projectedCostAtScale ?? report.projected_cost_at_scale ?? 0),
    integrationScore: extractScore('integration', report.integration_score ?? 0),
    automationScore: extractScore('automation', report.automation_score ?? 0),
    dataAccessibilityScore: extractScore('dataAccessibility', report.data_accessibility_score ?? 0),
    scalabilityScore: extractScore('scalability', report.scalability_score ?? 0),
    overallScore: extractScore('overall', 0),
    visibilityScore: extractScore('visibility', 0),
    integrationEvidence: extractEvidence('integration'),
    automationEvidence: extractEvidence('automation'),
    visibilityEvidence: extractEvidence('visibility'),
    totalAnnualBenefit,
    totalInvestment,
    hoursReclaimable,
    roiRatio,
    paybackMonths,
  };
}

const fmt = (n: number) => {
  if (n == null || isNaN(n)) return '£0';
  return n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${Math.round(n)}`;
};
const fmtFull = (n: number) => `£${Math.round(n).toLocaleString()}`;

const DESIRED_OUTCOME_LABELS: Record<string, string> = {
  client_profitability: 'Know which clients or jobs are actually profitable',
  cash_visibility: 'See our cash position and forecast without asking anyone',
  fast_month_end: 'Close month-end in under a week',
  fast_quoting: 'Get quotes and proposals out within 48 hours',
  pipeline_confidence: 'Track pipeline and forecast revenue with confidence',
  free_key_people: 'Free key people from manual admin and data entry',
  useful_mi: 'Get management information I actually use for decisions',
  smooth_onboarding: 'Onboard new team members without things falling apart',
  scale_without_admin: 'Scale the team without scaling the admin',
  proper_controls: 'Have proper controls so mistakes don\'t slip through',
};

function displayOutcome(outcome: string): string {
  return DESIRED_OUTCOME_LABELS[outcome] || outcome;
}

function splitNarrative(text: string, maxParas = 3): string[] {
  if (!text) return [];
  const byNewlines = text.split('\n\n').filter(Boolean);
  if (byNewlines.length > 1) return byNewlines.slice(0, maxParas);
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    chunks.push(sentences.slice(i, i + 3).join('').trim());
  }
  return chunks.slice(0, maxParas).filter(Boolean);
}

const EMPTY_MSG = 'This section will be available after your follow-up consultation.';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart3, group: 'Overview' },
  { id: 'diagnostic', label: 'Diagnostic', icon: Activity, group: 'Analysis' },
  { id: 'chaos', label: 'Cost of Chaos', icon: DollarSign, group: 'Analysis' },
  { id: 'systems', label: 'Systems', icon: Monitor, group: 'Analysis' },
  { id: 'processes', label: 'Processes', icon: Workflow, group: 'Analysis' },
  { id: 'findings', label: 'Findings', icon: AlertTriangle, group: 'Analysis' },
  { id: 'risks', label: 'Risks', icon: Shield, group: 'Analysis' },
  { id: 'governance', label: 'Governance', icon: Users, group: 'Analysis' },
  { id: 'recommendations', label: 'Recommendations', icon: Target, group: 'Plan' },
  { id: 'investment', label: 'Investment', icon: TrendingUp, group: 'Plan' },
  { id: 'decisions', label: 'Decisions', icon: Gauge, group: 'Plan' },
  { id: 'roadmap', label: 'Roadmap', icon: Layers, group: 'Plan' },
  { id: 'quickwins', label: 'Quick Wins', icon: Zap, group: 'Plan' },
  { id: 'actions', label: 'Actions', icon: CalendarClock, group: 'Action' },
];

interface Props {
  report: any;
  companyName?: string;
  findings?: any[];
  saRecommendations?: any[];
}

export function SAClientReportView({ report, companyName, findings: propFindings, saRecommendations: propRecs }: Props) {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [expandedQW, setExpandedQW] = useState<number | null>(null);

  const m = useMemo(() => resolveMetrics(report), [report]);
  const p1 = report?.pass1_data || {};
  const facts = p1.facts || {};
  const systemsMaps = p1.systemsMaps;
  const quickWins = p1.quickWins || report.quick_wins || [];
  const clientPresentation = p1.clientPresentation || {};

  const p1Findings = p1.findings || [];
  const p1Recs = p1.recommendations || [];

  const recsFromDb = (propRecs || []).map((r: any) => ({
    ...r,
    title: r.title,
    estimatedCost: r.estimated_cost ?? r.estimatedCost ?? 0,
    annualBenefit: r.annual_cost_savings ?? r.annualBenefit ?? 0,
    hoursSavedWeekly: r.hours_saved_weekly ?? r.hoursSavedWeekly,
    implementationPhase: r.implementation_phase ?? r.implementationPhase ?? 'short_term',
    description: r.description ?? r.rationale ?? '',
  }));
  const displayRecs = recsFromDb.length > 0 ? recsFromDb : p1Recs;
  const displayFindings = (propFindings && propFindings.length > 0) ? propFindings : p1Findings;

  const riskFlags = (report.admin_risk_flags || []) as any[];
  const adminTasksList = (report.admin_tasks || []) as any[];
  const adminNextStepsList = (report.admin_next_steps || []) as any[];

  const systemsList = facts?.systems || [];
  const processes = facts?.processes || [];
  const sortedProcesses = [...processes].sort((a: any, b: any) => (b.hoursWasted ?? b.hours_wasted ?? 0) - (a.hoursWasted ?? a.hours_wasted ?? 0));
  const maxProcessHours = Math.max(...sortedProcesses.map((p: any) => p.hoursWasted ?? p.hours_wasted ?? 0), 1);
  const totalProcessHours = sortedProcesses.reduce((s: number, p: any) => s + (p.hoursWasted ?? p.hours_wasted ?? 0), 0);

  const criticalCount = displayFindings.filter((f: any) => f.severity === 'critical').length;
  const highCount = displayFindings.filter((f: any) => f.severity === 'high').length;

  const totalBenefit = displayRecs.reduce((s: number, r: any) => s + (r.annualBenefit || r.annual_cost_savings || 0), 0) || m.totalAnnualBenefit;
  const totalHoursSaved = displayRecs.reduce((s: number, r: any) => s + (parseFloat(r.hoursSavedWeekly || r.hours_saved_weekly) || 0), 0) || m.hoursReclaimable;
  const totalInvestment = displayRecs.reduce((s: number, r: any) => s + (r.estimatedCost || r.estimated_cost || 0), 0) || m.totalInvestment;

  const recsByPhase = displayRecs.reduce((acc: any, rec: any) => {
    const phase = rec.implementationPhase || rec.implementation_phase || 'short_term';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(rec);
    return acc;
  }, {});
  const phaseOrder = ['immediate', 'quick_win', 'foundation', 'short_term', 'strategic', 'medium_term', 'optimization', 'long_term'];
  const activePhases = phaseOrder.filter(p => recsByPhase[p]?.length > 0);

  const clientQuotes = clientPresentation?.clientQuotes || [];
  const bestQuote = clientQuotes[0] || displayFindings.find((f: any) => f.client_quote || f.clientQuote)?.client_quote || '';

  const sevColor: Record<string, string> = { critical: 'text-red-600 bg-red-50 border-red-200', high: 'text-orange-600 bg-orange-50 border-orange-200', medium: 'text-amber-600 bg-amber-50 border-amber-200', low: 'text-blue-600 bg-blue-50 border-blue-200' };
  const sevBadge: Record<string, string> = { critical: 'bg-red-600 text-white', high: 'bg-orange-500 text-white', medium: 'bg-amber-500 text-white', low: 'bg-blue-500 text-white' };

  const phaseLabels: Record<string, string> = { immediate: 'Quick Win', quick_win: 'Quick Win', foundation: 'Foundation', short_term: 'Short Term', strategic: 'Strategic', medium_term: 'Medium Term', optimization: 'Optimisation', long_term: 'Long Term' };
  const phaseColors: Record<string, string> = { immediate: 'bg-emerald-100 text-emerald-700', quick_win: 'bg-emerald-100 text-emerald-700', foundation: 'bg-blue-100 text-blue-700', short_term: 'bg-blue-100 text-blue-700', strategic: 'bg-purple-100 text-purple-700', medium_term: 'bg-purple-100 text-purple-700', optimization: 'bg-indigo-100 text-indigo-700', long_term: 'bg-gray-100 text-gray-600' };

  // ─── Section renderer ─────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {

      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 relative overflow-hidden">
              <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-2">Systems Audit Report</p>
              <h1 className="text-2xl font-bold leading-tight mb-4">{report.headline}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>{[facts?.companyName || companyName, facts?.industry, facts?.teamSize && `Team: ${facts.teamSize}`].filter(Boolean).join(' · ')}</span>
                {report.generated_at && <span className="font-mono text-xs">{new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'ANNUAL COST OF CHAOS', val: fmtFull(m.annualCostOfChaos), color: 'text-red-600 border-l-red-500' },
                { label: `AT ${m.growthMultiplier}× SCALE`, val: fmtFull(m.projectedCostAtScale), color: 'text-orange-600 border-l-orange-500' },
                { label: 'HOURS LOST WEEKLY', val: `${m.hoursWastedWeekly}`, color: 'text-blue-600 border-l-blue-500' },
              ].map((s, i) => (
                <div key={i} className={`bg-white border border-gray-200 border-l-4 ${s.color} rounded-xl p-5`}>
                  <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">{s.label}</p>
                  <p className={`text-2xl font-extrabold font-mono mt-1 ${s.color.split(' ')[0]}`}>{s.val}</p>
                </div>
              ))}
            </div>
            {report.executive_summary && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Executive Summary</h3>
                {splitNarrative(report.executive_summary, 4).map((para, i) => (
                  <p key={i} className="text-gray-600 text-[15px] leading-relaxed mb-3 max-w-[65ch]">{para}</p>
                ))}
              </div>
            )}
            {facts?.desired_outcomes?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">What You Want to Achieve</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {facts.desired_outcomes.map((o: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{displayOutcome(o)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white border border-gray-200 rounded-xl p-6 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 mb-3">
                <Rocket className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">Your Future</span>
              </div>
              <p className="text-gray-800 text-base italic leading-relaxed max-w-[62ch]">
                {clientPresentation?.mondayMorning || splitNarrative(report.time_freedom_narrative, 1)[0] || ''}
              </p>
            </div>
          </div>
        );

      case 'diagnostic': {
        const items = [
          { label: 'Overall', score: m.overallScore },
          { label: 'Integration', score: m.integrationScore, evidence: m.integrationEvidence },
          { label: 'Automation', score: m.automationScore, evidence: m.automationEvidence },
          { label: 'Visibility', score: m.visibilityScore, evidence: m.visibilityEvidence },
        ];
        if (items[0].score === 0 && (items[1].score > 0 || items[2].score > 0 || items[3].score > 0)) {
          items[0].score = Math.round((items[1].score + items[2].score + items[3].score) / 3);
        }
        const oc = items[0].score;
        const verdict = oc < 30 ? 'Critical' : oc < 50 ? 'At Risk' : oc < 70 ? 'Needs Work' : 'Healthy';
        const vColor = oc < 30 ? 'text-red-600 bg-red-100' : oc < 50 ? 'text-orange-600 bg-orange-100' : oc < 70 ? 'text-amber-600 bg-amber-100' : 'text-emerald-600 bg-emerald-100';
        return (
          <div className="space-y-6">
            <div className={`rounded-xl p-8 ${oc < 30 ? 'bg-gradient-to-br from-red-950 to-slate-900 text-white' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-center">
                  <p className={`text-5xl font-extrabold font-mono ${oc < 30 ? 'text-red-400' : vColor.split(' ')[0]}`}>{oc}</p>
                  <p className="text-xs text-gray-500 mt-1">Overall</p>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className={`text-xl font-extrabold ${oc < 30 ? 'text-white' : 'text-gray-900'}`}>System Health</h2>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${vColor}`}>{verdict}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${oc < 30 ? 'text-gray-300' : 'text-gray-600'}`}>
                    {oc < 30 ? 'Your systems are critically disconnected. Manual workarounds dominate daily operations.' :
                     oc < 50 ? 'Significant gaps exist across your technology stack.' :
                     oc < 70 ? 'Reasonable foundation but key gaps are holding you back.' :
                     'Well-connected systems with strong foundations.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {items.slice(1).map(item => {
                const sc = item.score < 30 ? 'border-t-red-500' : item.score < 50 ? 'border-t-orange-500' : item.score < 70 ? 'border-t-amber-500' : 'border-t-emerald-500';
                return (
                  <div key={item.label} className={`bg-white border border-gray-200 border-t-4 ${sc} rounded-xl p-5`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-gray-900">{item.label}</span>
                      <span className="text-2xl font-extrabold font-mono">{item.score}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-current rounded-full transition-all" style={{ width: `${item.score}%` }} />
                    </div>
                    {item.evidence && <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{item.evidence}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'chaos':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-red-950 to-slate-900 text-white rounded-2xl p-10 text-center relative overflow-hidden">
              <p className="text-[10px] tracking-[0.15em] text-red-400 uppercase font-semibold font-mono">Annual Cost of Chaos</p>
              <p className="text-5xl font-extrabold text-red-500 font-mono mt-3">{fmtFull(m.annualCostOfChaos)}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'EVERY WEEK', val: `${m.hoursWastedWeekly}h`, sub: 'lost to manual workarounds', color: 'text-red-600' },
                { label: 'EVERY YEAR', val: fmtFull(m.annualCostOfChaos), sub: 'in invisible costs', color: 'text-orange-600' },
                { label: `AT ${m.growthMultiplier}× GROWTH`, val: fmtFull(m.projectedCostAtScale), sub: 'if nothing changes', color: 'text-amber-600' },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                  <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">{s.label}</p>
                  <p className={`text-2xl font-extrabold font-mono mt-2 ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
            {report.cost_of_chaos_narrative && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-[10px] font-semibold tracking-wider text-gray-900 uppercase mb-3">THE PATTERN</p>
                {splitNarrative(report.cost_of_chaos_narrative, 3).map((para, i) => (
                  <p key={i} className="text-gray-600 text-[15px] leading-relaxed mb-3 max-w-[60ch]">{para}</p>
                ))}
              </div>
            )}
            {bestQuote && (
              <div className="bg-white border border-gray-200 border-l-4 border-l-purple-500 rounded-xl p-6">
                <Quote className="w-6 h-6 text-purple-300 mb-2" />
                <p className="italic text-gray-800 text-base leading-relaxed">"{bestQuote}"</p>
                <p className="text-[10px] text-gray-400 mt-3 font-semibold tracking-wider uppercase">Staff interview</p>
              </div>
            )}
            {sortedProcesses.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Where the Hours Go</h3>
                <div className="space-y-3">
                  {sortedProcesses.slice(0, 6).map((proc: any, i: number) => {
                    const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
                    const pct = (hours / maxProcessHours) * 100;
                    const barColor = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-orange-500' : 'bg-amber-500';
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-gray-900 w-48 truncate flex-shrink-0">{proc.chainName || proc.name || 'Process'}</span>
                        <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                          <div className={`h-full ${barColor} rounded-lg flex items-center justify-end pr-3`} style={{ width: `${pct}%` }}>
                            <span className="text-xs font-bold text-white font-mono">{hours}h/wk</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 'systems':
        if (!systemsList.length) return <p className="text-gray-400 text-sm">{EMPTY_MSG}</p>;
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">System-by-System Assessment</h2>
              <p className="text-sm text-gray-500 mt-1">Each platform in your stack — gaps, strengths, and operational load</p>
            </div>
            {systemsList.map((sys: any, i: number) => {
              const crit = sys.criticality || sys.criticality_level || '—';
              const monthly = sys.monthlyCost ?? sys.monthly_cost;
              const dq = sys.dataQuality ?? sys.data_quality;
              const sat = sys.userSatisfaction ?? sys.user_satisfaction;
              const manualHours = Number(sys.manualHours ?? sys.manual_hours ?? 0) || 0;
              const painPoints = sys.painPoints || sys.pain_points || [];
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-base font-extrabold text-gray-900 flex-1">{sys.name || sys.system_name}</h3>
                    {sys.category && <span className="text-[10px] px-2 py-1 rounded-md bg-blue-50 text-blue-600 font-semibold">{String(sys.category).replace(/_/g, ' ')}</span>}
                    <span className="text-[10px] px-2 py-1 rounded-md bg-amber-50 text-amber-600 font-semibold">{String(crit)}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-mono mb-3">
                    {monthly != null && <span>Monthly: <strong className="text-gray-900">£{Number(monthly).toLocaleString()}</strong></span>}
                    {dq != null && <span>Data quality: <strong>{dq}/5</strong></span>}
                    {sat != null && <span>Satisfaction: <strong>{sat}/5</strong></span>}
                  </div>
                  {manualHours > 0 && <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 mb-3">{manualHours} hours/month manual work</span>}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider text-red-500 uppercase mb-2">GAPS</p>
                      {(sys.gaps || []).length > 0 ? (sys.gaps || []).map((g: string, j: number) => (
                        <div key={j} className="flex gap-2 items-start mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{g}</span>
                        </div>
                      )) : <p className="text-xs text-gray-400">None listed</p>}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider text-emerald-500 uppercase mb-2">STRENGTHS</p>
                      {(sys.strengths || []).length > 0 ? (sys.strengths || []).map((s: string, j: number) => (
                        <div key={j} className="flex gap-2 items-start mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{s}</span>
                        </div>
                      )) : <p className="text-xs text-gray-400">None listed</p>}
                    </div>
                  </div>
                  {painPoints.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <p className="text-[10px] font-semibold text-amber-600 uppercase mb-1">Pain points</p>
                      <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
                        {painPoints.map((p: string, j: number) => <li key={j}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'processes':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Process Analysis</h2>
              <p className="text-sm text-gray-500 mt-1">{sortedProcesses.length} chains · <strong className="text-red-600 font-mono">{totalProcessHours}h</strong>/month wasted</p>
            </div>
            {sortedProcesses.map((proc: any, i: number) => {
              const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
              const procKey = proc.chainCode || proc.code || `p-${i}`;
              const isExp = expandedProcess === procKey;
              const chainName = proc.chainName || proc.name || 'Process';
              const keyPain = proc.keyPainPoints || proc.key_pain_points || [];
              const critGaps = proc.criticalGaps || proc.critical_gaps || [];
              const quotes = proc.clientQuotes || proc.client_quotes || [];
              return (
                <div key={procKey} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpandedProcess(isExp ? null : procKey)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{chainName}</p>
                      <span className="text-xs text-gray-400">{critGaps.length} gaps · {quotes.length} quotes</span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 font-mono flex-shrink-0">{hours} hrs/month</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                  </button>
                  {isExp && (
                    <div className="px-4 pb-4 space-y-3">
                      {keyPain.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold tracking-wider text-gray-900 uppercase mb-2">Key pain points</p>
                          <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">{keyPain.map((pt: string, j: number) => <li key={j}>{pt}</li>)}</ul>
                        </div>
                      )}
                      {critGaps.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold tracking-wider text-red-500 uppercase mb-2">Critical Gaps</p>
                          {critGaps.map((g: string, j: number) => <p key={j} className="text-sm text-gray-600 p-2 border border-red-200 rounded-lg mb-1">{g}</p>)}
                        </div>
                      )}
                      {quotes.length > 0 && quotes.map((q: string, j: number) => (
                        <blockquote key={j} className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 rounded-r-lg italic text-sm text-gray-600">"{q}"</blockquote>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'findings':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">{displayFindings.length} Findings</h2>
                <p className="text-sm text-gray-500 mt-1">Select a finding to see detail</p>
              </div>
              <div className="flex gap-2">
                {criticalCount > 0 && <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-600 text-white">{criticalCount} Critical</span>}
                {highCount > 0 && <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-500 text-white">{highCount} High</span>}
              </div>
            </div>
            {displayFindings.map((f: any, i: number) => {
              const isActive = expandedFinding === i;
              const sev = f.severity || 'medium';
              const hoursVal = f.hours_wasted_weekly ?? f.hoursWastedWeekly ?? f.hoursPerWeek ?? 0;
              const costVal = f.annual_cost_impact ?? f.annualCostImpact ?? f.annualCost ?? 0;
              return (
                <div key={i} className={`bg-white border rounded-xl overflow-hidden transition-all cursor-pointer ${isActive ? sevColor[sev] || 'border-gray-200' : 'border-gray-200'}`} onClick={() => setExpandedFinding(isActive ? null : i)}>
                  <div className="flex items-center gap-3 p-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${sevBadge[sev] || 'bg-gray-500 text-white'}`}>{sev}</span>
                    <span className="text-sm font-semibold text-gray-900 flex-1 truncate">{f.title || 'Finding'}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                  </div>
                  {isActive && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                      {f.category && <span className="text-[10px] font-mono text-gray-400">{(f.category || '').replace(/_/g, ' ')}</span>}
                      <p className="text-sm text-gray-700 leading-relaxed">{f.description}</p>
                      {f.evidence?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mb-1">Evidence</p>
                          {f.evidence.map((e: string, j: number) => <p key={j} className="text-sm text-gray-600 pl-3 border-l-2 border-amber-300 mb-1">{e}</p>)}
                        </div>
                      )}
                      {(f.client_quote || f.clientQuote) && (
                        <blockquote className="border-l-4 border-purple-300 bg-purple-50 px-4 py-3 rounded-r-lg italic text-sm text-gray-700">"{f.client_quote || f.clientQuote}"</blockquote>
                      )}
                      <div className="flex gap-6 flex-wrap">
                        {hoursVal > 0 && <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Hours/week</p><p className="text-xl font-bold text-blue-600 font-mono">{hoursVal}</p></div>}
                        {costVal > 0 && <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Annual cost</p><p className="text-xl font-bold text-red-600 font-mono">£{Number(costVal).toLocaleString()}</p></div>}
                      </div>
                      {f.recommendation && (
                        <div className="p-3 bg-emerald-50 border-l-3 border-l-emerald-500 rounded-r-lg">
                          <p className="text-[10px] text-emerald-600 font-semibold uppercase mb-1">Recommendation</p>
                          <p className="text-sm text-gray-600">{f.recommendation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'risks':
        if (!riskFlags.length) return <div><h2 className="text-xl font-extrabold text-gray-900 mb-2">Risks & Concerns</h2><p className="text-sm text-gray-400">{EMPTY_MSG}</p></div>;
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-gray-900">Risks & Concerns</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">{riskFlags.length}</span>
            </div>
            {riskFlags.map((rf: any, i: number) => {
              const sev = (rf.severity || '').toLowerCase();
              const badge = sev === 'high' ? 'bg-red-100 text-red-700 border-red-200' : sev === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200';
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badge}`}>{rf.severity || 'risk'}</span>
                  <p className="text-sm font-semibold text-gray-900 mt-3 leading-relaxed">{rf.flag}</p>
                  <div className="mt-3 pl-3 border-l-2 border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Mitigation</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{rf.mitigation || '—'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'governance': {
        const search = (keywords: string[]) => {
          const lk = keywords.map(k => k.toLowerCase());
          const finding = displayFindings.find((f: any) => lk.some(k => (f.title || '').toLowerCase().includes(k) || (f.description || '').toLowerCase().includes(k)));
          const risk = riskFlags.find((r: any) => lk.some(k => (r.flag || '').toLowerCase().includes(k) || (r.mitigation || '').toLowerCase().includes(k)));
          const quote = clientQuotes.find((q: string) => lk.some(k => q.toLowerCase().includes(k)));
          return { finding, risk, quote };
        };
        const cards = [
          { title: 'Leadership Buy-In', Icon: Building2, color: 'purple', kw: ['shareholder', 'cheque', 'physical sign', 'invoice sign', 'paper'], rec: 'Demonstrate that digital approval workflows provide a stronger audit trail than physical signatures — with faster throughput.' },
          { title: 'Shadow IT & Workarounds', Icon: Eye, color: 'amber', kw: ['bypass', 'shadow', 'google doc', 'workaround', 'unofficial', 'ollie'], rec: 'New systems must be fast enough that workarounds are not needed. Address the root cause, not the symptom.' },
          { title: 'Key Person Dependencies', Icon: Users, color: 'red', kw: ['key person', 'single point', 'debbie', 'ann', 'irreplaceable', 'only person'], rec: 'Document all critical processes and cross-train before any system migration. Remove single points of failure.' },
          { title: 'Control vs Speed Trade-off', Icon: Shield, color: 'orange', kw: ['approval', 'disabled', 'control', 'limit', 'override', 'speed'], rec: 'New purchasing and approval systems must deliver speed AND controls simultaneously.' },
        ];
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Governance & Change Readiness</h2>
              <p className="text-sm text-gray-500 mt-1">Technology changes only succeed if the organisation is ready to adopt them</p>
            </div>
            {cards.map((card, i) => {
              const hits = search(card.kw);
              const colorMap: Record<string, string> = { purple: 'bg-purple-50 text-purple-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', orange: 'bg-orange-50 text-orange-600' };
              const Icon = card.Icon;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[card.color] || 'bg-gray-50 text-gray-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{card.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed pl-3 border-l-2 border-gray-200 mb-3">
                    {hits.finding?.description || hits.risk?.flag || `Identified as a factor affecting change readiness.`}
                  </p>
                  {hits.quote && <blockquote className="border-l-4 border-amber-400 bg-amber-50 px-4 py-2 rounded-r-lg italic text-sm text-gray-600 mb-3">"{hits.quote}"</blockquote>}
                  <div className="p-3 bg-emerald-50 border-l-2 border-emerald-500 rounded-r-lg">
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase mb-1">Recommendation</p>
                    <p className="text-sm text-gray-600">{card.rec}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'recommendations':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Recommendations</h2>
              <p className="text-sm text-gray-500 mt-1">{displayRecs.length} recommendations across {activePhases.length} phases</p>
            </div>
            {activePhases.map(phase => {
              const phaseRecs = recsByPhase[phase] || [];
              return (
                <div key={phase}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${phaseColors[phase] || 'bg-gray-100 text-gray-600'}`}>{phaseLabels[phase] || phase}</span>
                    <span className="text-xs text-gray-400">{phaseRecs.length} item{phaseRecs.length !== 1 ? 's' : ''}</span>
                  </div>
                  {phaseRecs.map((rec: any, ri: number) => {
                    const recKey = rec.title || `${phase}-${ri}`;
                    const isExp = expandedRec === recKey;
                    const cost = rec.estimatedCost || rec.estimated_cost || 0;
                    const benefit = rec.annualBenefit || rec.annual_cost_savings || 0;
                    const hrs = parseFloat(rec.hoursSavedWeekly || rec.hours_saved_weekly) || 0;
                    const payback = cost > 0 && benefit > 0 ? Math.max(1, Math.round(cost / (benefit / 12))) : (cost === 0 ? 0 : null);
                    return (
                      <div key={recKey} className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-2">
                        <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpandedRec(isExp ? null : recKey)}>
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">{ri + 1}</div>
                          <span className="text-sm font-semibold text-gray-900 flex-1 truncate">{rec.title}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                        </button>
                        {isExp && (
                          <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600 leading-relaxed">{rec.description}</p>
                            <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg text-center">
                              <div><p className="text-[10px] text-gray-400 uppercase">Investment</p><p className="text-lg font-bold font-mono">{fmt(cost)}</p></div>
                              <div><p className="text-[10px] text-gray-400 uppercase">Benefit</p><p className="text-lg font-bold font-mono text-emerald-600">{fmt(benefit)}/yr</p></div>
                              <div><p className="text-[10px] text-gray-400 uppercase">Hours</p><p className="text-lg font-bold font-mono text-blue-600">{hrs}h/wk</p></div>
                              <div><p className="text-[10px] text-gray-400 uppercase">Payback</p><p className="text-lg font-bold font-mono">{payback === 0 ? '—' : payback != null ? `${payback} mo` : '—'}</p></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );

      case 'investment':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Investment Summary</h2>
              <p className="text-sm text-gray-500 mt-1">Costs, savings, and time reclaimed by recommendation</p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'INVESTMENT', val: fmt(totalInvestment), color: 'text-gray-900 border-t-gray-800' },
                { label: 'ANNUAL BENEFIT', val: fmtFull(totalBenefit), color: 'text-emerald-600 border-t-emerald-500' },
                { label: 'PAYBACK', val: `${m.paybackMonths} mo`, color: 'text-blue-600 border-t-blue-500' },
                { label: 'ROI', val: m.roiRatio, color: 'text-purple-600 border-t-purple-500' },
              ].map((s, i) => (
                <div key={i} className={`bg-white border border-gray-200 border-t-4 ${s.color.split(' ')[1]} rounded-xl p-5 text-center`}>
                  <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">{s.label}</p>
                  <p className={`text-xl font-extrabold font-mono mt-2 ${s.color.split(' ')[0]}`}>{s.val}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Recommendation', 'Investment', 'Annual saving', 'Hours/week'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold tracking-wider text-gray-500 uppercase border-b-2 border-gray-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRecs.map((rec: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-gray-100 font-medium text-gray-900 max-w-[380px]">{rec.title}</td>
                      <td className="px-4 py-3 border-b border-gray-100 font-mono text-gray-900">{fmt(rec.estimatedCost || rec.estimated_cost || 0)}</td>
                      <td className="px-4 py-3 border-b border-gray-100 font-mono text-emerald-600 font-semibold">£{(rec.annualBenefit || rec.annual_cost_savings || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 border-b border-gray-100 font-mono text-gray-900">{parseFloat(rec.hoursSavedWeekly || rec.hours_saved_weekly) || 0}h</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="px-4 py-3 border-t-2 border-gray-300 text-gray-900">TOTAL</td>
                    <td className="px-4 py-3 border-t-2 border-gray-300 font-mono">{fmt(totalInvestment)}</td>
                    <td className="px-4 py-3 border-t-2 border-gray-300 font-mono text-emerald-600">£{Math.round(totalBenefit).toLocaleString()}</td>
                    <td className="px-4 py-3 border-t-2 border-gray-300 font-mono">{totalHoursSaved}h</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                <strong>Payback</strong> {m.paybackMonths} months · <strong>ROI</strong> {m.roiRatio} · <strong>Hours reclaimable</strong> {Math.round(totalHoursSaved)}h/week
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">Investment figures cover software and estimated migration costs. Implementation advisory support available separately — contact your practice team.</p>
            </div>
          </div>
        );

      case 'decisions': {
        const qwHours = (quickWins || []).reduce((s: number, q: any) => s + (parseFloat(q.hoursSavedWeekly || q.hoursSaved || q.hours_saved || 0) || 0), 0);
        const qwBenefit = (quickWins || []).reduce((s: number, q: any) => s + (parseFloat(q.annualBenefit || q.annual_benefit || 0) || 0), 0);
        const scenarios = [
          { title: 'Do Nothing', sub: 'Accept current costs and risks', color: 'red', y1: m.annualCostOfChaos, y3: m.annualCostOfChaos * 3, hrs: 0, inv: 0, risks: ['Key person dependencies remain', 'Manual processes scale with growth', 'Loss-making contracts invisible', 'Controls gap persists'] },
          { title: 'Quick Wins Only', sub: 'Zero-cost fixes this week', color: 'amber', y1: m.annualCostOfChaos - qwBenefit, y3: (m.annualCostOfChaos - qwBenefit) * 3, hrs: qwHours, inv: 0, risks: ['Core integration gaps remain', 'Manual data transfers continue', 'Period-close mismatch persists', 'Partial improvement only'] },
          { title: 'Full Transformation', sub: 'Complete technology overhaul', color: 'emerald', y1: totalInvestment, y3: totalInvestment - (totalBenefit * 3), hrs: totalHoursSaved, inv: totalInvestment, risks: ['Migration disruption (mitigated by phased approach)', 'Requires team adoption and training', 'Shareholder buy-in needed'] },
        ];
        const colorMap: Record<string, string> = { red: 'border-t-red-500 text-red-600', amber: 'border-t-amber-500 text-amber-600', emerald: 'border-t-emerald-500 text-emerald-600' };
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Decision Matrix</h2>
              <p className="text-sm text-gray-500 mt-1">Three scenarios — the cost of action versus inaction</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {scenarios.map((sc, i) => (
                <div key={i} className={`bg-white border border-gray-200 border-t-4 ${colorMap[sc.color]} rounded-xl overflow-hidden`}>
                  <div className="p-4 pb-3">
                    <h3 className={`text-base font-extrabold ${colorMap[sc.color].split(' ')[1]}`}>{sc.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{sc.sub}</p>
                  </div>
                  <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-[9px] text-gray-400 uppercase">Year 1</p>
                        <p className={`text-sm font-bold font-mono ${sc.y1 > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{sc.y1 < 0 ? '-' : ''}{fmt(Math.abs(sc.y1))}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-[9px] text-gray-400 uppercase">3-Year</p>
                        <p className={`text-sm font-bold font-mono ${sc.y3 > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{sc.y3 < 0 ? '-' : ''}{fmt(Math.abs(sc.y3))}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-[9px] text-gray-400 uppercase">Hours back</p>
                        <p className="text-sm font-bold font-mono text-blue-600">{sc.hrs > 0 ? `+${sc.hrs}h/wk` : '0'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-[9px] text-gray-400 uppercase">Investment</p>
                        <p className="text-sm font-bold font-mono">{sc.inv > 0 ? fmt(sc.inv) : '£0'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-semibold mb-1">Residual risks</p>
                      <ul className="list-disc pl-4 text-xs text-gray-500 space-y-0.5">{sc.risks.map((r, j) => <li key={j}>{r}</li>)}</ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 border-l-4 border-l-emerald-500 rounded-xl p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">Our recommendation</p>
              <p className="text-sm text-gray-600 leading-relaxed">Implement quick wins immediately (this week), then begin the full transformation in phases. See the Implementation Roadmap for the step-by-step plan.</p>
            </div>
          </div>
        );
      }

      case 'roadmap':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Technology Roadmap</h2>
              <p className="text-sm text-gray-500 mt-1">How your systems connect and where the gaps are</p>
            </div>
            {(systemsMaps?.length > 0 || (facts?.systems && facts.systems.length > 0)) ? (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-900">
                <SystemsMapSection systemsMaps={systemsMaps} facts={facts} />
              </div>
            ) : (
              <p className="text-sm text-gray-400">{EMPTY_MSG}</p>
            )}
          </div>
        );

      case 'quickwins': {
        const qwList = quickWins || [];
        const totalQWHours = qwList.reduce((s: number, q: any) => s + (parseFloat(q.hoursSaved || q.hours_saved || q.hoursSavedWeekly || 0) || 0), 0);
        return (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6" />
                <h2 className="text-xl font-extrabold">Start This Week</h2>
              </div>
              <p className="text-emerald-100 text-sm">{qwList.length} wins · zero cost · <strong>{totalQWHours}h saved every week</strong></p>
            </div>
            {qwList.map((qw: any, i: number) => {
              const hours = parseFloat(qw.hoursSaved || qw.hours_saved || qw.hoursSavedWeekly || 0) || 0;
              const isExp = expandedQW === i;
              const owner = qw.owner || qw.assignee || '';
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpandedQW(isExp ? null : i)}>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {owner && <span className="font-bold text-blue-600">{owner}: </span>}
                        {qw.title || qw.action}
                      </p>
                    </div>
                    <span className="text-lg font-extrabold text-emerald-600 font-mono flex-shrink-0">+{hours}h</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                  </button>
                  {isExp && (
                    <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
                      {(qw.steps || qw.implementation) && <p className="text-sm text-gray-600 leading-relaxed">{qw.steps || qw.implementation}</p>}
                      {(qw.impact || qw.mondayMorning) && (
                        <div className="p-3 bg-emerald-50 border-l-2 border-emerald-500 rounded-r-lg">
                          <p className="text-sm italic text-gray-700">{qw.impact || qw.mondayMorning}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      }

      case 'actions': {
        const nNext = adminNextStepsList.length;
        const nTasks = adminTasksList.length;
        const nTotal = nNext + nTasks;
        if (nTotal === 0) return <div><h2 className="text-xl font-extrabold text-gray-900 mb-2">What To Do Next</h2><p className="text-sm text-gray-400">{EMPTY_MSG}</p></div>;
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-gray-900">What To Do Next</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{nTotal}</span>
            </div>
            {nNext > 0 && (
              <>
                <h3 className="text-sm font-bold text-gray-900">Recommended Next Steps</h3>
                {adminNextStepsList.map((step: any, i: number) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-extrabold text-blue-600 font-mono">#{i + 1}</span>
                      {step.priority && <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-600">{step.priority}</span>}
                      {step.owner && <span className="text-xs text-gray-400">Owner: {step.owner}</span>}
                      {step.timing && <span className="text-xs text-gray-400">· {step.timing}</span>}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">{step.action}</p>
                    {step.outcome && <p className="text-sm text-gray-500 leading-relaxed">{step.outcome}</p>}
                  </div>
                ))}
              </>
            )}
            {nTasks > 0 && (
              <>
                <h3 className="text-sm font-bold text-gray-900 mt-2">Tasks to Assign</h3>
                {adminTasksList.map((t: any, i: number) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-sm font-semibold text-gray-900 mb-2">{t.task}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {t.assignTo && <span><strong>Assign:</strong> {t.assignTo}</span>}
                      {t.dueDate && <span><strong>Due:</strong> {t.dueDate}</span>}
                    </div>
                    {t.deliverable && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{t.deliverable}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        );
      }

      default:
        return <p className="text-gray-400 text-sm">Section not found.</p>;
    }
  };

  // ─── Layout ──────────────────────────────────────────────────────────────
  let lastGroup = '';

  return (
    <div className="flex bg-gray-50 rounded-xl overflow-hidden border border-gray-200" style={{ minHeight: 600 }}>
      {/* Sidebar nav */}
      <div className="w-48 bg-slate-900 flex-shrink-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="px-3 py-4 border-b border-white/5">
          <p className="text-white font-bold text-sm">Client Preview</p>
          <p className="text-slate-500 text-[10px] font-mono mt-0.5">14 sections</p>
        </div>
        <nav className="py-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const showGroup = lastGroup !== item.group && (lastGroup = item.group);
            return (
              <div key={item.id}>
                {showGroup && (
                  <p className="px-3 pt-3 pb-1 text-[9px] font-semibold tracking-widest text-slate-500 uppercase">{item.group}</p>
                )}
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${activeSection === item.id ? 'bg-white/10 text-white border-l-2 border-blue-500' : 'text-slate-400 hover:bg-white/5 border-l-2 border-transparent'}`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="max-w-4xl">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
