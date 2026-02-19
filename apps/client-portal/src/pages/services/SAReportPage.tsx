// ============================================================================
// SYSTEMS AUDIT CLIENT REPORT PAGE — 13-SECTION BUILD
// ============================================================================
// Client-facing report: Proof → Pattern → Price → Path → Plan → Future
//
// GOLDEN RULE: pass1_data is the single source of truth for all metrics.
// Column values are convenience copies. When they conflict, pass1_data wins.
//
// Data sources (priority order):
//   1. pass1_data JSONB → facts, scores, findings, quickWins, recommendations,
//                          adminGuidance, systemsMaps, clientPresentation
//   2. sa_findings table → fallback for findings if pass1_data.findings empty
//   3. sa_audit_reports columns → fallback for scores/metrics
//   4. sa_engagements → status, sharing gate
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, TrendingUp,
  Zap, BarChart3, Target, ChevronDown, ChevronUp,
  Loader2, Quote, DollarSign, Settings, ArrowRight,
  Sparkles, Brain, Phone, Clock, Users, Building2,
  Shield, Activity, Database, Link2, Workflow, Eye,
  CalendarClock, PoundSterling, Monitor, Coffee,
  ChevronRight, Minus, Plus, ExternalLink, Layers
} from 'lucide-react';
import SystemsMapSection from '@/components/SystemsMapSection';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SAReport {
  id: string;
  engagement_id: string;
  headline: string;
  executive_summary: string;
  cost_of_chaos_narrative: string;
  time_freedom_narrative: string;
  total_hours_wasted_weekly: number;
  total_annual_cost_of_chaos: number;
  growth_multiplier: number;
  projected_cost_at_scale: number;
  systems_count: number;
  integration_score: number;
  automation_score: number;
  data_accessibility_score: number;
  scalability_score: number;
  critical_findings_count: number;
  high_findings_count: number;
  medium_findings_count: number;
  low_findings_count: number;
  total_annual_benefit: number;
  total_recommended_investment: number;
  hours_reclaimable_weekly: number;
  overall_payback_months: number;
  roi_ratio: string;
  pass1_data: any;
  quick_wins: any[];
  status: string;
  generated_at: string;
  created_at: string;
}

interface SAFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  evidence: string[];
  client_quote: string | null;
  affected_systems: string[] | null;
  affected_processes: string[] | null;
  hours_wasted_weekly: number;
  annual_cost_impact: number;
  recommendation: string | null;
  scalability_impact: string | null;
  blocks_goal: string | null;
}

// ─── Metric Resolution ──────────────────────────────────────────────────────
// pass1_data always wins when it conflicts with columns

function resolveMetrics(report: SAReport) {
  const p = report.pass1_data || {};
  const facts = p.facts || {};
  const scores = p.scores || {};

  return {
    annualCostOfChaos: facts.annualCostOfChaos ?? report.total_annual_cost_of_chaos ?? 0,
    hoursWastedWeekly: facts.hoursWastedWeekly ?? report.total_hours_wasted_weekly ?? 0,
    growthMultiplier: facts.growthMultiplier ?? report.growth_multiplier ?? 1.3,
    projectedCostAtScale: facts.projectedCostAtScale ?? report.projected_cost_at_scale ?? 0,
    integrationScore: scores.integration?.score ?? report.integration_score ?? 0,
    automationScore: scores.automation?.score ?? report.automation_score ?? 0,
    dataAccessibilityScore: scores.dataAccessibility?.score ?? report.data_accessibility_score ?? 0,
    scalabilityScore: scores.scalability?.score ?? report.scalability_score ?? 0,
    integrationEvidence: scores.integration?.evidence || '',
    automationEvidence: scores.automation?.evidence || '',
    dataAccessibilityEvidence: scores.dataAccessibility?.evidence || '',
    scalabilityEvidence: scores.scalability?.evidence || '',
    totalAnnualBenefit: report.total_annual_benefit ?? 0,
    totalInvestment: report.total_recommended_investment ?? 0,
    hoursReclaimable: report.hours_reclaimable_weekly ?? 0,
    roiRatio: report.roi_ratio || '0:1',
    paybackMonths: report.overall_payback_months ?? 0,
  };
}

// ─── Format Helpers ──────────────────────────────────────────────────────────

const fmt = (n: number) => n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${n}`;
const fmtFull = (n: number) => `£${n.toLocaleString()}`;
const fmtPayback = (months: number) => {
  if (months <= 0) return 'Immediate';
  if (months < 1) return '< 1 month';
  return `${months} months`;
};

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#059669', text: 'text-emerald-700', bg: 'bg-emerald-50' };
    if (s >= 50) return { stroke: '#d97706', text: 'text-amber-700', bg: 'bg-amber-50' };
    if (s >= 30) return { stroke: '#ea580c', text: 'text-orange-700', bg: 'bg-orange-50' };
    return { stroke: '#dc2626', text: 'text-red-700', bg: 'bg-red-50' };
  };
  const color = getColor(score);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color.stroke} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${color.text}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Badge Components ────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[severity] || styles.medium}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  const styles: Record<string, { bg: string; label: string }> = {
    immediate: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Quick Win' },
    quick_win: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Quick Win' },
    foundation: { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Foundation' },
    short_term: { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Short Term' },
    strategic: { bg: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Strategic' },
    medium_term: { bg: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Medium Term' },
    optimization: { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Optimisation' },
    long_term: { bg: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Long Term' },
  };
  const style = styles[phase] || styles.medium_term;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style.bg}`}>
      {style.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = {
    single_point_failure: 'Single Point of Failure',
    integration_gap: 'Integration Gap',
    manual_process: 'Manual Process',
    data_silo: 'Data Silo',
    scalability_risk: 'Scalability Risk',
    compliance_risk: 'Compliance Risk',
  };
  return (
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
      {labels[category] || category.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Integration Status Dot ──────────────────────────────────────────────────

function IntegrationDot({ method }: { method: string }) {
  const colors: Record<string, string> = {
    native: 'bg-emerald-500',
    manual: 'bg-red-500',
    none: 'bg-red-500',
    partial: 'bg-amber-500',
  };
  return <span className={`w-2 h-2 rounded-full ${colors[method] || 'bg-gray-400'}`} />;
}

// ─── Process Chain Icon ──────────────────────────────────────────────────────

function ChainIcon({ code }: { code: string }) {
  const icons: Record<string, any> = {
    quote_to_cash: PoundSterling,
    record_to_report: BarChart3,
    procure_to_pay: DollarSign,
    hire_to_retire: Users,
    lead_to_client: Target,
    comply_to_confirm: Shield,
  };
  const Icon = icons[code] || Workflow;
  return <Icon className="w-4 h-4" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SAReportPage() {
  const navigate = useNavigate();
  const { clientSession } = useAuth();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SAReport | null>(null);
  const [findings, setFindings] = useState<SAFinding[]>([]);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [showScoreDetail, setShowScoreDetail] = useState<string | null>(null);

  // Section refs
  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    hero: useRef<HTMLDivElement>(null),
    business: useRef<HTMLDivElement>(null),
    systems: useRef<HTMLDivElement>(null),
    health: useRef<HTMLDivElement>(null),
    chaos: useRef<HTMLDivElement>(null),
    processes: useRef<HTMLDivElement>(null),
    findings: useRef<HTMLDivElement>(null),
    techmap: useRef<HTMLDivElement>(null),
    quickwins: useRef<HTMLDivElement>(null),
    roadmap: useRef<HTMLDivElement>(null),
    investment: useRef<HTMLDivElement>(null),
    monday: useRef<HTMLDivElement>(null),
    nextsteps: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!clientSession?.clientId) return;
    loadReport();
  }, [clientSession?.clientId]);

  const loadReport = async () => {
    if (!clientSession?.clientId) return;
    try {
      const { data: engagement } = await supabase
        .from('sa_engagements')
        .select('id, status, is_shared_with_client')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();

      if (!engagement?.is_shared_with_client) {
        navigate('/dashboard');
        return;
      }

      const { data: reportData, error: reportErr } = await supabase
        .from('sa_audit_reports')
        .select('*')
        .eq('engagement_id', engagement.id)
        .maybeSingle();

      if (reportErr) {
        console.error('SA report fetch error:', reportErr.message, reportErr.code);
      }
      if (!reportData || !['generated', 'approved', 'published', 'delivered'].includes(reportData.status)) {
        setReport(null);
        setLoading(false);
        return;
      }

      setReport(reportData);

      // Load findings from table as fallback
      const { data: findingsData } = await supabase
        .from('sa_findings')
        .select('*')
        .eq('engagement_id', engagement.id)
        .order('severity', { ascending: true });

      setFindings(findingsData || []);
    } catch (err) {
      console.error('Error loading SA report:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (section: string) => {
    setActiveSection(section);
    sectionRefs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading your Systems Audit report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Report not available yet.</p>
          <button onClick={() => navigate('/dashboard')}
            className="text-purple-600 hover:text-purple-700 font-medium">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Resolve all data from pass1_data ────────────────────────────────────
  const p1 = report.pass1_data || {};
  const facts = p1.facts || {};
  const m = resolveMetrics(report);
  const p1Findings = p1.findings || [];
  const p1Recs = p1.recommendations || [];
  const quickWins = p1.quickWins || report.quick_wins || [];
  const systemsMaps = p1.systemsMaps;
  const clientPres = p1.clientPresentation || {};
  const processes = facts.processes || [];

  // Use pass1_data findings (richer) if available, else table findings
  const displayFindings = p1Findings.length > 0 ? p1Findings : findings;
  const criticalCount = displayFindings.filter((f: any) => f.severity === 'critical').length;
  const highCount = displayFindings.filter((f: any) => f.severity === 'high').length;

  // Recs from pass1_data (have freedomUnlocked, findingsAddressed)
  const displayRecs = p1Recs.length > 0 ? p1Recs : [];
  const totalBenefit = displayRecs.reduce((s: number, r: any) => s + (r.annualBenefit || r.annual_cost_savings || 0), 0) || m.totalAnnualBenefit;
  const totalHoursSaved = displayRecs.reduce((s: number, r: any) => s + (parseFloat(r.hoursSavedWeekly || r.hours_saved_weekly) || 0), 0) || m.hoursReclaimable;
  const totalInvestment = displayRecs.reduce((s: number, r: any) => s + (r.estimatedCost || r.estimated_cost || 0), 0) || m.totalInvestment;

  // Group recs by phase for roadmap
  const recsByPhase = displayRecs.reduce((acc: any, rec: any) => {
    const phase = rec.implementationPhase || rec.implementation_phase || 'short_term';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(rec);
    return acc;
  }, {});
  const phaseOrder = ['immediate', 'quick_win', 'foundation', 'short_term', 'strategic', 'medium_term', 'optimization', 'long_term'];

  // Navigation items
  const navItems = [
    { id: 'hero', label: 'Overview', icon: BarChart3 },
    { id: 'systems', label: 'Systems', icon: Monitor },
    { id: 'health', label: 'Health', icon: Activity },
    { id: 'chaos', label: 'Cost', icon: DollarSign },
    { id: 'processes', label: 'Processes', icon: Workflow },
    { id: 'findings', label: 'Findings', icon: AlertTriangle },
    { id: 'techmap', label: 'Tech Map', icon: Layers },
    { id: 'quickwins', label: 'Quick Wins', icon: Zap },
    { id: 'roadmap', label: 'Roadmap', icon: CalendarClock },
    { id: 'investment', label: 'ROI', icon: TrendingUp },
    { id: 'monday', label: 'Vision', icon: Coffee },
    { id: 'nextsteps', label: 'Next', icon: ArrowRight },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Sticky Navigation ──────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    activeSection === item.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}>
                  <Icon className="w-3 h-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: HERO + EXECUTIVE SUMMARY
            ═══════════════════════════════════════════════════════════════ */}
        <div ref={sectionRefs.hero} className="scroll-mt-16">
          {/* Hero banner */}
          <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-2xl p-8 text-white shadow-xl mb-8">
            <div className="flex items-start gap-3 mb-4 opacity-70">
              <Settings className="w-5 h-5 mt-0.5" />
              <span className="text-sm font-medium tracking-wide uppercase">Systems Audit Report</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-6">
              {report.headline}
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-200 text-xs mb-1">Hours Lost / Week</p>
                <p className="text-2xl font-bold">{m.hoursWastedWeekly}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-200 text-xs mb-1">Annual Cost of Chaos</p>
                <p className="text-2xl font-bold">{fmt(m.annualCostOfChaos)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-200 text-xs mb-1">Systems Audited</p>
                <p className="text-2xl font-bold">{(facts.systems || []).length || report.systems_count}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-200 text-xs mb-1">At {m.growthMultiplier}x Growth</p>
                <p className="text-2xl font-bold text-red-300">{fmt(m.projectedCostAtScale)}</p>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Executive Summary
            </h2>
            <div className="prose prose-gray max-w-none">
              {(report.executive_summary || '').split('\n\n').map((para: string, i: number) => (
                <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">{para}</p>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: YOUR BUSINESS (if context available)
            ═══════════════════════════════════════════════════════════════ */}
        {(facts.teamSize || facts.revenueBand || facts.industry) && (
          <div ref={sectionRefs.business} className="scroll-mt-16">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Your Business
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {facts.teamSize && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Team Size</p>
                    <p className="text-xl font-bold text-gray-900">{facts.teamSize} people</p>
                    {facts.projectedTeamSize && (
                      <p className="text-xs text-gray-400 mt-1">→ {facts.projectedTeamSize} planned</p>
                    )}
                  </div>
                )}
                {facts.revenueBand && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Revenue</p>
                    <p className="text-xl font-bold text-gray-900">
                      {facts.revenueBand === '1m_2m' ? '£1-2m' :
                       facts.revenueBand === '500k_1m' ? '£500k-1m' :
                       facts.revenueBand === '2m_5m' ? '£2-5m' : facts.revenueBand}
                    </p>
                  </div>
                )}
                {facts.industry && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Industry</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{facts.industry}</p>
                  </div>
                )}
                {facts.totalSystemCost > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Monthly Software</p>
                    <p className="text-xl font-bold text-gray-900">£{facts.totalSystemCost}/mo</p>
                  </div>
                )}
              </div>

              {facts.desiredOutcomes && facts.desiredOutcomes.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-5">
                  <p className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-3">
                    What You Want From Your Operations
                  </p>
                  <div className="space-y-2">
                    {facts.desiredOutcomes.map((outcome: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-purple-900">{outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: YOUR SYSTEMS TODAY
            ═══════════════════════════════════════════════════════════════ */}
        {facts.systems && facts.systems.length > 0 && (
          <div ref={sectionRefs.systems} className="scroll-mt-16">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-purple-600" />
                Your Systems Today
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {facts.systems.length} systems, {facts.disconnectedSystems?.length || 0} disconnected,
                £{facts.totalSystemCost || 0}/month total software spend
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facts.systems.map((sys: any, i: number) => (
                  <div key={i} className={`rounded-xl p-4 border ${
                    sys.criticality === 'critical' ? 'border-purple-200 bg-purple-50/30' :
                    sys.criticality === 'important' ? 'border-blue-200 bg-blue-50/30' :
                    'border-gray-200 bg-gray-50/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IntegrationDot method={sys.integrationMethod} />
                        <h4 className="font-medium text-gray-900 text-sm">{sys.name}</h4>
                      </div>
                      <span className="text-xs text-gray-400">
                        £{sys.monthlyCost || 0}/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2 text-xs">
                      <span className="text-gray-500">
                        Quality: <span className="font-medium">{sys.dataQuality}/5</span>
                      </span>
                      <span className="text-gray-500">
                        Satisfaction: <span className="font-medium">{sys.userSatisfaction}/5</span>
                      </span>
                    </div>
                    {sys.gaps && sys.gaps.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        {sys.gaps.slice(0, 2).map((gap: string, j: number) => (
                          <p key={j} className="text-xs text-red-600 flex items-start gap-1 mb-0.5">
                            <Minus className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {gap}
                          </p>
                        ))}
                      </div>
                    )}
                    {sys.strengths && sys.strengths.length > 0 && (
                      <div className="mt-1">
                        {sys.strengths.slice(0, 2).map((s: string, j: number) => (
                          <p key={j} className="text-xs text-emerald-600 flex items-start gap-1 mb-0.5">
                            <Plus className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {s}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: SYSTEM HEALTH SCORES
            ═══════════════════════════════════════════════════════════════ */}
        <div ref={sectionRefs.health} className="scroll-mt-16">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Operations Health Scores
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center mb-6">
              <ScoreRing score={m.integrationScore} label="Integration" size={90} />
              <ScoreRing score={m.automationScore} label="Automation" size={90} />
              <ScoreRing score={m.dataAccessibilityScore} label="Data Access" size={90} />
              <ScoreRing score={m.scalabilityScore} label="Scalability" size={90} />
            </div>

            {/* Score evidence expandables */}
            <div className="space-y-2">
              {[
                { key: 'integration', label: 'Integration', score: m.integrationScore, evidence: m.integrationEvidence },
                { key: 'automation', label: 'Automation', score: m.automationScore, evidence: m.automationEvidence },
                { key: 'dataAccess', label: 'Data Accessibility', score: m.dataAccessibilityScore, evidence: m.dataAccessibilityEvidence },
                { key: 'scalability', label: 'Scalability', score: m.scalabilityScore, evidence: m.scalabilityEvidence },
              ].filter(s => s.evidence).map((s) => (
                <div key={s.key} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button onClick={() => setShowScoreDetail(showScoreDetail === s.key ? null : s.key)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{s.label}: {s.score}/100</span>
                    {showScoreDetail === s.key
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {showScoreDetail === s.key && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed">{s.evidence}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5: COST OF CHAOS
            ═══════════════════════════════════════════════════════════════ */}
        <div ref={sectionRefs.chaos} className="scroll-mt-16">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              The Cost of Chaos
            </h2>
            <div className="prose prose-gray max-w-none mb-6">
              {(report.cost_of_chaos_narrative || '').split('\n\n').map((para: string, i: number) => (
                <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">{para}</p>
              ))}
            </div>

            {processes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {processes.map((proc: any, i: number) => (
                  <div key={i} className="bg-white/70 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{proc.chainName}</h4>
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        {proc.hoursWasted}h/mo wasted
                      </span>
                    </div>
                    {proc.keyPainPoints?.[0] && (
                      <p className="text-xs text-gray-500 italic line-clamp-2">
                        &quot;{proc.keyPainPoints[0]}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 bg-red-900 rounded-xl p-5 text-white">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 mt-0.5 text-red-300 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">The Scaling Danger</p>
                  <p className="text-red-100 text-sm">
                    At {m.growthMultiplier}x your current size, these same gaps will cost{' '}
                    <span className="font-bold text-white">{fmtFull(m.projectedCostAtScale)}/year</span>.
                    The chaos doesn&apos;t scale linearly — it compounds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6: PROCESS ANALYSIS
            ═══════════════════════════════════════════════════════════════ */}
        {processes.length > 0 && (
          <div ref={sectionRefs.processes} className="scroll-mt-16">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-purple-600" />
                Process Analysis
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {processes.length} process chains analysed. Total: {processes.reduce((s: number, p: any) => s + (p.hoursWasted || 0), 0)} hours/month wasted.
              </p>
              <div className="space-y-3">
                {processes.map((proc: any) => (
                  <div key={proc.chainCode} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedProcess(expandedProcess === proc.chainCode ? null : proc.chainCode)}
                      className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                        <ChainIcon code={proc.chainCode} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{proc.chainName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {proc.criticalGaps?.length || 0} critical gaps
                        </p>
                      </div>
                      <span className="text-sm font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg whitespace-nowrap">
                        {proc.hoursWasted}h/mo
                      </span>
                      {expandedProcess === proc.chainCode
                        ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </button>

                    {expandedProcess === proc.chainCode && (
                      <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">
                        {proc.criticalGaps && proc.criticalGaps.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Critical Gaps</p>
                            {proc.criticalGaps.map((gap: string, j: number) => (
                              <p key={j} className="text-sm text-gray-700 flex items-start gap-2 mb-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                {gap}
                              </p>
                            ))}
                          </div>
                        )}

                        {proc.clientQuotes && proc.clientQuotes.length > 0 && (
                          <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                            {proc.clientQuotes.slice(0, 3).map((q: string, j: number) => (
                              <div key={j} className="flex gap-2">
                                <Quote className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-purple-800 italic">&quot;{q}&quot;</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {proc.specificMetrics && Object.keys(proc.specificMetrics).length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(proc.specificMetrics).filter(([_, v]) => v != null).slice(0, 6).map(([key, value]) => (
                              <div key={key} className="bg-gray-50 rounded-lg p-2.5">
                                <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-sm font-medium text-gray-900">{String(value)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 7: WHAT WE FOUND
            ═══════════════════════════════════════════════════════════════ */}
        <div ref={sectionRefs.findings} className="scroll-mt-16 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              What We Found
              <span className="text-sm font-normal text-gray-500">
                ({criticalCount} critical, {highCount} high)
              </span>
            </h2>
          </div>

          {displayFindings.map((finding: any, idx: number) => {
            const fid = finding.id || `f-${idx}`;
            return (
              <div key={fid} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                finding.severity === 'critical' ? 'border-red-200' :
                finding.severity === 'high' ? 'border-orange-200' : 'border-gray-200'
              }`}>
                <button onClick={() => setExpandedFinding(expandedFinding === fid ? null : fid)}
                  className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                  <SeverityBadge severity={finding.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{finding.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {(finding.affectedSystems || finding.affected_systems || []).join(' → ')}
                      {(finding.hoursWastedWeekly || finding.hours_wasted_weekly) > 0 &&
                        ` · ${finding.hoursWastedWeekly || finding.hours_wasted_weekly}h/week`}
                    </p>
                  </div>
                  {(finding.annualCostImpact || finding.annual_cost_impact) > 0 && (
                    <span className="text-sm font-semibold text-red-700 whitespace-nowrap">
                      {fmt(finding.annualCostImpact || finding.annual_cost_impact)}/yr
                    </span>
                  )}
                  {expandedFinding === fid
                    ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>

                {expandedFinding === fid && (
                  <div className="px-6 pb-5 pt-2 border-t border-gray-100 space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <CategoryBadge category={finding.category} />
                      {(finding.blocksGoal || finding.blocks_goal) && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                          Blocks: {finding.blocksGoal || finding.blocks_goal}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed">{finding.description}</p>

                    {(finding.clientQuote || finding.client_quote) && (
                      <div className="flex gap-3 bg-purple-50 rounded-lg p-4">
                        <Quote className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-purple-800 italic">
                          &quot;{finding.clientQuote || finding.client_quote}&quot;
                        </p>
                      </div>
                    )}

                    {(finding.evidence || []).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Evidence</p>
                        {(finding.evidence || []).map((e: string, i: number) => (
                          <p key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                            {e}
                          </p>
                        ))}
                      </div>
                    )}

                    {(finding.scalabilityImpact || finding.scalability_impact) && (
                      <div className="bg-amber-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
                          At {m.growthMultiplier}x Scale
                        </p>
                        <p className="text-sm text-amber-800">
                          {finding.scalabilityImpact || finding.scalability_impact}
                        </p>
                      </div>
                    )}

                    {finding.recommendation && (
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Recommended Fix</p>
                        <p className="text-sm text-emerald-800">{finding.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 8: TECHNOLOGY ROADMAP (SYSTEMS MAPS)
            ═══════════════════════════════════════════════════════════════ */}
        <div ref={sectionRefs.techmap} className="scroll-mt-16">
          <SystemsMapSection systemsMaps={systemsMaps} facts={facts} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 9: QUICK WINS
            ═══════════════════════════════════════════════════════════════ */}
        {quickWins.length > 0 && (
          <div ref={sectionRefs.quickwins} className="scroll-mt-16">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <h3 className="text-base font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                Quick Wins — Start This Week
              </h3>
              <p className="text-sm text-emerald-700 mb-4">
                {quickWins.length} actions, £0 cost,{' '}
                {quickWins.reduce((s: number, q: any) => s + (parseFloat(q.hoursSavedWeekly) || 0), 0)} hours/week saved.
              </p>
              <div className="space-y-4">
                {quickWins.map((qw: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl p-5 border border-emerald-100">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900 text-sm flex-1">{qw.title}</h4>
                      <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-3">
                        <span className="text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                          {qw.hoursSavedWeekly}h/week saved
                        </span>
                        <span className="text-gray-500">{qw.timeToImplement}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{qw.action}</p>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-emerald-700 mb-1">Impact</p>
                      <p className="text-sm text-emerald-800">{qw.impact}</p>
                    </div>
                    {qw.systems && qw.systems.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {qw.systems.map((sys: string, j: number) => (
                          <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {sys}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 10: IMPLEMENTATION ROADMAP
            ═══════════════════════════════════════════════════════════════ */}
        {displayRecs.length > 0 && (
          <div ref={sectionRefs.roadmap} className="scroll-mt-16">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-purple-600" />
                Implementation Roadmap
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {displayRecs.length} recommendations, phased by impact and dependencies.
                Combined: <span className="font-semibold text-emerald-700">{fmtFull(totalBenefit)}/year</span> benefit,{' '}
                <span className="font-semibold text-emerald-700">{totalHoursSaved}h/week</span> saved.
              </p>

              <div className="space-y-6">
                {phaseOrder.filter(phase => recsByPhase[phase]).map((phase) => (
                  <div key={phase}>
                    <div className="flex items-center gap-2 mb-3">
                      <PhaseBadge phase={phase} />
                      <span className="text-xs text-gray-400">
                        {recsByPhase[phase].length} recommendation{recsByPhase[phase].length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-3 ml-2 border-l-2 border-gray-200 pl-4">
                      {recsByPhase[phase].map((rec: any, idx: number) => {
                        const rid = rec.id || `rec-${phase}-${idx}`;
                        const benefit = rec.annualBenefit || rec.annual_cost_savings || 0;
                        const cost = rec.estimatedCost || rec.estimated_cost || 0;
                        const hours = parseFloat(rec.hoursSavedWeekly || rec.hours_saved_weekly) || 0;
                        const payback = cost > 0 && benefit > 0
                          ? Math.round(cost / (benefit / 12))
                          : 0;

                        return (
                          <div key={rid} className="border border-gray-200 rounded-xl overflow-hidden hover:border-purple-200 transition-colors">
                            <button onClick={() => setExpandedRec(expandedRec === rid ? null : rid)}
                              className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {rec.priorityRank || rec.priority_rank || idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{rec.title}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {benefit > 0 && (
                                  <p className="text-sm font-semibold text-emerald-700">{fmt(benefit)}/yr</p>
                                )}
                                <p className="text-xs text-gray-500">{hours}h/wk saved</p>
                              </div>
                              {expandedRec === rid
                                ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                            </button>

                            {expandedRec === rid && (
                              <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">
                                <p className="text-sm text-gray-700 leading-relaxed">{rec.description}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Investment</p>
                                    <p className="font-semibold text-gray-900">{cost > 0 ? fmtFull(cost) : '£0'}</p>
                                  </div>
                                  <div className="bg-emerald-50 rounded-lg p-3">
                                    <p className="text-xs text-emerald-600">Annual Benefit</p>
                                    <p className="font-semibold text-emerald-700">{fmtFull(benefit)}</p>
                                  </div>
                                  <div className="bg-emerald-50 rounded-lg p-3">
                                    <p className="text-xs text-emerald-600">Hours Saved</p>
                                    <p className="font-semibold text-emerald-700">{hours}h/week</p>
                                  </div>
                                  <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-xs text-blue-600">Payback</p>
                                    <p className="font-semibold text-blue-700">{fmtPayback(payback)}</p>
                                  </div>
                                </div>

                                {(rec.goalsAdvanced || []).length > 0 && (
                                  <div className="flex gap-2 flex-wrap">
                                    {(rec.goalsAdvanced || []).map((g: string, j: number) => (
                                      <span key={j} className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                        ✓ {g}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {(rec.freedomUnlocked || rec.freedom_unlocked) && (
                                  <div className="bg-purple-50 rounded-lg p-4 flex gap-3">
                                    <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">
                                        What This Unlocks
                                      </p>
                                      <p className="text-sm text-purple-800">
                                        {rec.freedomUnlocked || rec.freedom_unlocked}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {(rec.findingsAddressed || []).length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Addresses</p>
                                    {(rec.findingsAddressed || []).map((f: string, j: number) => (
                                      <p key={j} className="text-xs text-gray-500 flex items-start gap-1 mb-0.5">
                                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        {f}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 11: INVESTMENT & ROI
            ═══════════════════════════════════════════════════════════════ */}
        <div ref={sectionRefs.investment} className="scroll-mt-16">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Investment & Return
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-5 border border-emerald-100 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">{totalInvestment > 0 ? fmtFull(totalInvestment) : '£0'}</p>
                <p className="text-xs text-gray-400 mt-1">{totalInvestment > 0 ? 'One-time + annual' : 'Process fixes only'}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-emerald-100 text-center">
                <p className="text-xs text-gray-500 mb-1">Annual Benefit</p>
                <p className="text-2xl font-bold text-emerald-700">{fmtFull(totalBenefit)}</p>
                <p className="text-xs text-gray-400 mt-1">{totalHoursSaved}h/week back</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-emerald-100 text-center">
                <p className="text-xs text-gray-500 mb-1">Payback</p>
                <p className="text-2xl font-bold text-blue-700">{fmtPayback(m.paybackMonths)}</p>
                <p className="text-xs text-gray-400 mt-1">Time to break even</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-emerald-100 text-center">
                <p className="text-xs text-gray-500 mb-1">ROI (Year 1)</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {totalInvestment > 0 ? `${Math.round(totalBenefit / totalInvestment)}:1` : '∞'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  3yr: {totalInvestment > 0 ? `${Math.round(totalBenefit * 3 / totalInvestment)}:1` : '∞'}
                </p>
              </div>
            </div>

            {/* Per-recommendation ROI breakdown */}
            {displayRecs.length > 0 && (
              <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Recommendation</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Benefit/yr</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hrs/wk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecs.map((rec: any, i: number) => {
                      const benefit = rec.annualBenefit || rec.annual_cost_savings || 0;
                      const cost = rec.estimatedCost || rec.estimated_cost || 0;
                      const hours = parseFloat(rec.hoursSavedWeekly || rec.hours_saved_weekly) || 0;
                      return (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="px-4 py-2.5 text-gray-700">
                            <div className="flex items-center gap-2">
                              <PhaseBadge phase={rec.implementationPhase || rec.implementation_phase || ''} />
                              <span className="text-xs">{rec.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-900 font-medium">
                            {cost > 0 ? fmtFull(cost) : '£0'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-emerald-700 font-medium">
                            {fmtFull(benefit)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-700">{hours}h</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-emerald-50/50 font-semibold">
                      <td className="px-4 py-3 text-gray-900">Total</td>
                      <td className="px-4 py-3 text-right text-gray-900">{totalInvestment > 0 ? fmtFull(totalInvestment) : '£0'}</td>
                      <td className="px-4 py-3 text-right text-emerald-700">{fmtFull(totalBenefit)}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{totalHoursSaved}h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 12: YOUR MONDAY MORNING
            ═══════════════════════════════════════════════════════════════ */}
        <div ref={sectionRefs.monday} className="scroll-mt-16">
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-emerald-300" />
              Your Monday Morning
            </h2>

            {facts.mondayMorningVision && (
              <div className="bg-white/10 rounded-xl p-5 mb-6 backdrop-blur-sm">
                <div className="flex gap-3">
                  <Quote className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-100 text-sm italic leading-relaxed">
                      &quot;{facts.mondayMorningVision}&quot;
                    </p>
                    <p className="text-emerald-400 text-xs mt-2">— You said this. Here&apos;s how we make it real.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              {(report.time_freedom_narrative || '').split('\n\n').map((para: string, i: number) => (
                <p key={i} className="text-emerald-50 leading-relaxed mb-4 last:mb-0">{para}</p>
              ))}
            </div>

            {/* Vision metrics */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-emerald-700/50">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalHoursSaved}h</p>
                <p className="text-emerald-300 text-xs">Saved per Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{fmtFull(totalBenefit)}</p>
                <p className="text-emerald-300 text-xs">Annual Benefit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{fmtPayback(m.paybackMonths)}</p>
                <p className="text-emerald-300 text-xs">Payback</p>
              </div>
            </div>

            {/* What each rec unlocks — progressive vision build */}
            {displayRecs.filter((r: any) => r.freedomUnlocked || r.freedom_unlocked).length > 0 && (
              <div className="mt-8 pt-6 border-t border-emerald-700/50">
                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-4">
                  How Each Step Gets You There
                </p>
                <div className="space-y-3">
                  {displayRecs.filter((r: any) => r.freedomUnlocked || r.freedom_unlocked).map((rec: any, i: number) => (
                    <div key={i} className="flex gap-3 bg-white/5 rounded-lg p-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {rec.priorityRank || i + 1}
                      </div>
                      <p className="text-sm text-emerald-100 leading-relaxed">
                        {rec.freedomUnlocked || rec.freedom_unlocked}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 13: NEXT STEPS / CTA
            ═══════════════════════════════════════════════════════════════ */}
        <div ref={sectionRefs.nextsteps} className="scroll-mt-16">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  Ready to Start?
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Let&apos;s discuss these findings and build your implementation timeline.
                </p>
              </div>
              <button onClick={() => navigate('/appointments')}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap">
                Book a Call
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}