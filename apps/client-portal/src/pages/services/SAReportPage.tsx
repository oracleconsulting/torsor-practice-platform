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

// Desired outcomes: map DB slugs to human-readable labels
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

  return {
    annualCostOfChaos: Math.round(facts.annualCostOfChaos ?? report.total_annual_cost_of_chaos ?? 0),
    hoursWastedWeekly: facts.hoursWastedWeekly ?? report.total_hours_wasted_weekly ?? 0,
    growthMultiplier: facts.growthMultiplier ?? report.growth_multiplier ?? 1.3,
    projectedCostAtScale: Math.round(facts.projectedCostAtScale ?? report.projected_cost_at_scale ?? 0),
    integrationScore: scores.integration?.score ?? report.integration_score ?? 0,
    automationScore: scores.automation?.score ?? report.automation_score ?? 0,
    dataAccessibilityScore: scores.dataAccessibility?.score ?? report.data_accessibility_score ?? 0,
    scalabilityScore: scores.scalability?.score ?? report.scalability_score ?? 0,
    integrationEvidence: scores.integration?.evidence || '',
    automationEvidence: scores.automation?.evidence || '',
    dataAccessibilityEvidence: scores.dataAccessibility?.evidence || '',
    scalabilityEvidence: scores.scalability?.evidence || '',
    totalAnnualBenefit,
    totalInvestment,
    hoursReclaimable,
    roiRatio,
    paybackMonths,
  };
}

// ─── Format Helpers ──────────────────────────────────────────────────────────

const fmt = (n: number) => n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${n}`;
const fmtFull = (n: number) => `£${Math.round(n).toLocaleString()}`;
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [execSummaryExpanded, setExecSummaryExpanded] = useState(false);
  const [systemsExpanded, setSystemsExpanded] = useState(false);
  const [chaosExpanded, setChaosExpanded] = useState(false);
  const [expandedQW, setExpandedQW] = useState<number | null>(null);
  const [mondayExpanded, setMondayExpanded] = useState(false);
  const [expandedFreedom, setExpandedFreedom] = useState<number | null>(null);

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

  const loadReportRef = useRef(0);
  useEffect(() => {
    if (!clientSession?.clientId) return;
    loadReportRef.current = 0;
    loadReport();
  }, [clientSession?.clientId]);

  // IntersectionObserver: update activeSection as user scrolls
  useEffect(() => {
    const refs = sectionRefs;
    const ids = Object.keys(refs);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute('data-section-id');
          if (id) setActiveSection(id);
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.3 }
    );
    ids.forEach((id) => {
      const el = refs[id]?.current;
      if (el) {
        el.setAttribute('data-section-id', id);
        observer.observe(el);
      }
    });
    return () => observer.disconnect();
  }, [report]);

  // Scroll progress for nav bar (0–100)
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? Math.round((window.scrollY / total) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const loadReport = async (isRetry = false) => {
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
      if (!reportData || !['generated', 'regenerating', 'approved', 'published', 'delivered'].includes(reportData.status)) {
        setReport(null);
        setLoading(false);
        // One retry after 2s in case DB/RLS was slow or share was just applied
        if (!isRetry && loadReportRef.current === 0) {
          loadReportRef.current = 1;
          setTimeout(() => loadReport(true), 2000);
        }
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

  const contained = 'max-w-[1400px] mx-auto px-6 lg:px-10';

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
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className={`${contained} py-2.5 flex items-center gap-4`}>
          <button onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                    activeSection === item.id
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon className="w-3 h-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="h-0.5 bg-gray-100">
          <div className="h-full bg-purple-600 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
        </div>
      </div>

      <div className="space-y-0">

        {/* ═══ SECTION 1: HERO + EXEC SUMMARY + YOUR BUSINESS ═══ */}
        <div ref={sectionRefs.hero} className="scroll-mt-16" data-section-id="hero">
          <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
            <div className={`${contained} py-12 lg:py-16`}>
              <div className="flex items-start gap-3 mb-4 opacity-70">
                <Settings className="w-5 h-5 mt-0.5" />
                <span className="text-sm font-medium tracking-wide uppercase">Systems Audit Report</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-8 max-w-3xl">
                {report.headline}
              </h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                  <p className="text-purple-200 text-xs mb-1 uppercase tracking-wide">Hours Lost / Week</p>
                  <p className="text-3xl font-bold">{m.hoursWastedWeekly}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                  <p className="text-purple-200 text-xs mb-1 uppercase tracking-wide">Annual Cost of Chaos</p>
                  <p className="text-3xl font-bold">{fmt(m.annualCostOfChaos)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                  <p className="text-purple-200 text-xs mb-1 uppercase tracking-wide">Systems Audited</p>
                  <p className="text-3xl font-bold">{(facts.systems || []).length || report.systems_count}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                  <p className="text-purple-200 text-xs mb-1 uppercase tracking-wide">At {m.growthMultiplier}x Growth</p>
                  <p className="text-3xl font-bold text-red-300">{fmt(m.projectedCostAtScale)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${contained} py-10`}>
            <div className="lg:flex lg:gap-12">
              <div className="lg:flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Executive Summary
                </h2>
                <div className="max-w-[60ch]">
                  {(report.executive_summary || '').split('\n\n').map((para: string, i: number) => (
                    <p key={i} className="text-gray-700 leading-[1.75] mb-5 last:mb-0 text-[15.5px]">{para}</p>
                  ))}
                </div>
              </div>
              {(facts.teamSize || facts.revenueBand || facts.confirmedRevenue || facts.industry) && (
                <div ref={sectionRefs.business} className="lg:w-[360px] flex-shrink-0 mt-8 lg:mt-0" data-section-id="business">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 sticky top-20">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      Your Business
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {facts.teamSize && (
                        <div>
                          <p className="text-xs text-gray-500">Team Size</p>
                          <p className="text-lg font-bold text-gray-900">{facts.teamSize} people</p>
                          {facts.projectedTeamSize && (
                            <p className="text-xs text-gray-400">→ {facts.projectedTeamSize} planned</p>
                          )}
                        </div>
                      )}
                      {(facts.confirmedRevenue || facts.revenueBand) && (
                        <div>
                          <p className="text-xs text-gray-500">Revenue</p>
                          <p className="text-lg font-bold text-gray-900">
                            {facts.confirmedRevenue ? facts.confirmedRevenue :
                             facts.revenueBand === '1m_2m' ? '£1-2m' :
                             facts.revenueBand === '500k_1m' ? '£500k-1m' :
                             facts.revenueBand === '2m_5m' ? '£2-5m' :
                             facts.revenueBand === '5m_10m' ? '£5-10m' :
                             facts.revenueBand === '250k_500k' ? '£250-500k' :
                             facts.revenueBand === '10m_plus' ? '£10m+' :
                             facts.revenueBand}
                          </p>
                        </div>
                      )}
                      {facts.industry && (
                        <div>
                          <p className="text-xs text-gray-500">Industry</p>
                          <p className="text-sm font-semibold text-gray-900 capitalize">{facts.industry}</p>
                        </div>
                      )}
                      {facts.totalSystemCost > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">Monthly Software</p>
                          <p className="text-lg font-bold text-gray-900">£{facts.totalSystemCost}/mo</p>
                        </div>
                      )}
                    </div>
                    {facts.desiredOutcomes && facts.desiredOutcomes.length > 0 && (
                      <div className="bg-purple-50 rounded-xl p-4 mt-2">
                        <p className="text-[10px] font-medium text-purple-700 uppercase tracking-wide mb-2">
                          What You Want
                        </p>
                        <div className="space-y-1.5">
                          {facts.desiredOutcomes.map((outcome: string, i: number) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <Target className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-purple-900 leading-snug">{displayOutcome(outcome)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ SECTION 2: SYSTEMS + HEALTH ═══ */}
        <div className="bg-gray-50 border-y border-gray-200">
          <div className={`${contained} py-10`}>
            <div className="lg:flex lg:gap-10">
              {facts.systems && facts.systems.length > 0 && (
                <div ref={sectionRefs.systems} className="scroll-mt-16 lg:flex-1" data-section-id="systems">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-purple-600" />
                      Your Systems Today
                    </h2>
                    <button
                      onClick={() => setSystemsExpanded(!systemsExpanded)}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      {systemsExpanded ? 'Collapse' : 'View all systems'}
                      {systemsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{facts.systems.length}</span> systems
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-red-600">
                      <span className="font-semibold">{facts.disconnectedSystems?.length || 0}</span> disconnected
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">£{facts.totalSystemCost || 0}</span>/month total
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {facts.systems.map((sys: any, i: number) => (
                      <div key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                        (sys.gaps || []).length > 1
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : (sys.gaps || []).length === 1
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {sys.name}
                        <span className="opacity-60">£{sys.monthlyCost || 0}</span>
                      </div>
                    ))}
                  </div>
                  {systemsExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
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
                  )}
                </div>
              )}
              <div ref={sectionRefs.health} className="scroll-mt-16 lg:w-[320px] flex-shrink-0 mt-8 lg:mt-0" data-section-id="health">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    Operations Health
                  </h2>
                  <div className="grid grid-cols-2 gap-4 justify-items-center">
                    <ScoreRing score={m.integrationScore} label="Integration" size={80} />
                    <ScoreRing score={m.automationScore} label="Automation" size={80} />
                    <ScoreRing score={m.dataAccessibilityScore} label="Data Access" size={80} />
                    <ScoreRing score={m.scalabilityScore} label="Scalability" size={80} />
                  </div>
                  <div className="space-y-2 mt-4">
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
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3: COST OF CHAOS (full-bleed) ═══ */}
        <div ref={sectionRefs.chaos} className="scroll-mt-16 bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-y border-red-200" data-section-id="chaos">
          <div className={`${contained} py-10`}>
            <h2 className="text-lg font-semibold text-red-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              The Cost of Chaos
            </h2>

            <div className="lg:flex lg:gap-8 mb-6">
              <div className="lg:flex-1 max-w-prose">
                {(() => {
                  const paragraphs = (report.cost_of_chaos_narrative || '').split('\n\n');
                  const visible = chaosExpanded ? paragraphs : paragraphs.slice(0, 2);
                  return (
                    <>
                      {visible.map((para: string, i: number) => (
                        <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0 text-[15px]">{para}</p>
                      ))}
                      {paragraphs.length > 2 && (
                        <button
                          onClick={() => setChaosExpanded(!chaosExpanded)}
                          className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 flex items-center gap-1"
                        >
                          {chaosExpanded ? <>Show less <ChevronUp className="w-4 h-4" /></> : <>Read more <ChevronDown className="w-4 h-4" /></>}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="lg:w-48 flex-shrink-0 mt-6 lg:mt-0">
                <div className="bg-red-900 rounded-xl p-5 text-white text-center sticky top-24">
                  <p className="text-red-300 text-xs uppercase tracking-wide mb-2">Annual Cost</p>
                  <p className="text-3xl font-bold mb-3">{fmt(m.annualCostOfChaos)}</p>
                  <div className="border-t border-red-700/50 pt-3 mt-3">
                    <p className="text-red-300 text-xs uppercase tracking-wide mb-1">At {m.growthMultiplier}x</p>
                    <p className="text-xl font-bold text-red-300">{fmt(m.projectedCostAtScale)}</p>
                  </div>
                </div>
              </div>
            </div>

            {processes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* ═══ SECTION 4: PROCESS ANALYSIS (contained) ═══ */}
        <div className={`${contained} py-10 space-y-10`}>
        {processes.length > 0 && (
          <div ref={sectionRefs.processes} className="scroll-mt-16" data-section-id="processes">
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

        {/* ═══ SECTION 5: WHAT WE FOUND (contained) ═══ */}
        <div ref={sectionRefs.findings} className="scroll-mt-16 space-y-4" data-section-id="findings">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              What We Found
              <span className="text-sm font-normal text-gray-500">
                ({criticalCount} critical, {highCount} high)
              </span>
            </h2>
          </div>

          {/* Severity distribution bar */}
          <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-6 bg-gray-100">
            {criticalCount > 0 && (
              <div className="bg-red-500 rounded-full" style={{ flex: criticalCount }} title={`${criticalCount} Critical`} />
            )}
            {highCount > 0 && (
              <div className="bg-orange-500 rounded-full" style={{ flex: highCount }} title={`${highCount} High`} />
            )}
            {displayFindings.filter((f: any) => f.severity === 'medium').length > 0 && (
              <div className="bg-amber-400 rounded-full" style={{ flex: displayFindings.filter((f: any) => f.severity === 'medium').length }} title={`${displayFindings.filter((f: any) => f.severity === 'medium').length} Medium`} />
            )}
            {displayFindings.filter((f: any) => f.severity === 'low').length > 0 && (
              <div className="bg-blue-400 rounded-full" style={{ flex: displayFindings.filter((f: any) => f.severity === 'low').length }} title={`${displayFindings.filter((f: any) => f.severity === 'low').length} Low`} />
            )}
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
        </div>

        {/* ═══ TECH MAP — FULL-BLEED IMMERSIVE (split layout inside component) ═══ */}
        <div ref={sectionRefs.techmap} className="scroll-mt-16" data-section-id="techmap">
          <SystemsMapSection systemsMaps={systemsMaps} facts={facts} layout="split" />
        </div>

        {/* ═══ IMPLEMENTATION ROADMAP (contained) ═══ */}
        <div className={`${contained} py-10`}>
          {displayRecs.length > 0 && (
            <div ref={sectionRefs.roadmap} className="scroll-mt-16" data-section-id="roadmap">
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
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <PhaseBadge phase={phase} />
                    <span className="text-xs text-gray-400">
                      {recsByPhase[phase].length} recommendation{recsByPhase[phase].length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {recsByPhase[phase].map((rec: any, idx: number) => {
                      const rid = rec.id || `rec-${phase}-${idx}`;
                      const benefit = rec.annualBenefit || rec.annual_cost_savings || 0;
                      const cost = rec.estimatedCost || rec.estimated_cost || 0;
                      const hours = parseFloat(rec.hoursSavedWeekly || rec.hours_saved_weekly) || 0;
                      const payback = cost > 0 && benefit > 0 ? Math.round(cost / (benefit / 12)) : 0;

                      return (
                        <div key={rid} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                          expandedRec === rid ? 'border-purple-300 ring-1 ring-purple-100' : 'border-gray-200 hover:border-purple-200'
                        }`}>
                          <button onClick={() => setExpandedRec(expandedRec === rid ? null : rid)}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {rec.priorityRank || rec.priority_rank || idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm leading-snug">{rec.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {benefit > 0 && (
                                  <span className="text-xs font-semibold text-emerald-700">{fmt(benefit)}/yr</span>
                                )}
                                <span className="text-xs text-gray-400">{hours}h/wk</span>
                              </div>
                            </div>
                            {expandedRec === rid
                              ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                          </button>

                          {expandedRec === rid && (
                            <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                              <p className="text-sm text-gray-700 leading-relaxed">{rec.description}</p>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 rounded-lg p-2.5">
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Investment</p>
                                  <p className="font-semibold text-gray-900 text-sm">{cost > 0 ? fmtFull(cost) : '£0'}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-2.5">
                                  <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Annual Benefit</p>
                                  <p className="font-semibold text-emerald-700 text-sm">{fmtFull(benefit)}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-2.5">
                                  <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Hours Saved</p>
                                  <p className="font-semibold text-emerald-700 text-sm">{hours}h/week</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-2.5">
                                  <p className="text-[10px] text-blue-600 uppercase tracking-wide">Payback</p>
                                  <p className="font-semibold text-blue-700 text-sm">{fmtPayback(payback)}</p>
                                </div>
                              </div>

                              {(rec.goalsAdvanced || []).length > 0 && (
                                <div className="flex gap-1.5 flex-wrap">
                                  {(rec.goalsAdvanced || []).map((g: string, j: number) => (
                                    <span key={j} className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                      ✓ {g}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {(rec.freedomUnlocked || rec.freedom_unlocked) && (
                                <div className="bg-purple-50 rounded-lg p-3 flex gap-2">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-purple-800 leading-relaxed">
                                    {rec.freedomUnlocked || rec.freedom_unlocked}
                                  </p>
                                </div>
                              )}

                              {(rec.findingsAddressed || []).length > 0 && (
                                <div>
                                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Addresses</p>
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
        </div>

        {/* ═══ QUICK WINS (contained) ═══ */}
        {quickWins.length > 0 && (
          <div className={`${contained} py-10`}>
          <div ref={sectionRefs.quickwins} className="scroll-mt-16" data-section-id="quickwins">
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
                  <div key={i} className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedQW(expandedQW === i ? null : i)}
                      className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-emerald-50/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm leading-snug">{qw.title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full text-xs">
                          {qw.hoursSavedWeekly}h/week saved
                        </span>
                        <span className="text-xs text-gray-400">{qw.timeToImplement}</span>
                        {expandedQW === i
                          ? <ChevronUp className="w-4 h-4 text-gray-400" />
                          : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {expandedQW === i && (
                      <div className="px-5 pb-4 pt-1 border-t border-emerald-100 space-y-3">
                        <p className="text-sm text-gray-600 leading-relaxed">{qw.action}</p>
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-emerald-700 mb-1">Impact</p>
                          <p className="text-sm text-emerald-800">{qw.impact}</p>
                        </div>
                        {qw.systems && qw.systems.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {qw.systems.map((sys: string, j: number) => (
                              <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{sys}</span>
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
          </div>
        )}

        {/* ═══ INVESTMENT & ROI (contained) ═══ */}
        <div className={`${contained} py-10`}>
        <div ref={sectionRefs.investment} className="scroll-mt-16" data-section-id="investment">
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
              <div className="bg-white rounded-xl border border-emerald-100 overflow-x-auto overflow-hidden">
                <table className="w-full text-sm min-w-[400px]">
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
        </div>

        {/* ═══ YOUR MONDAY MORNING — FULL-BLEED ═══ */}
        <div ref={sectionRefs.monday} className="scroll-mt-16" data-section-id="monday">
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white">
            <div className={`${contained} py-12 lg:py-16`}>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-emerald-300" />
              Your Monday Morning
            </h2>

            {facts.mondayMorningVision && (
              <div className="bg-white/10 rounded-xl p-6 mb-8 backdrop-blur-sm max-w-4xl">
                <div className="flex gap-3">
                  <Quote className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-100 text-base italic leading-relaxed">
                      &quot;{facts.mondayMorningVision}&quot;
                    </p>
                    <p className="text-emerald-400 text-xs mt-3">— You said this. Here&apos;s how we make it real.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-[60ch] mx-auto mb-10">
              {(report.time_freedom_narrative || '').split('\n\n').map((para: string, i: number) => (
                <p key={i} className="text-emerald-50 leading-[1.75] mb-5 last:mb-0 text-[15.5px]">{para}</p>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-10 pt-8 border-t border-emerald-700/50">
              <div className="text-center">
                <p className="text-3xl font-bold">{totalHoursSaved}h</p>
                <p className="text-emerald-300 text-xs mt-1">Saved per Week</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{fmtFull(totalBenefit)}</p>
                <p className="text-emerald-300 text-xs mt-1">Annual Benefit</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{fmtPayback(m.paybackMonths)}</p>
                <p className="text-emerald-300 text-xs mt-1">Payback</p>
              </div>
            </div>

            {/* What each rec unlocks — progressive vision build */}
            {displayRecs.filter((r: any) => r.freedomUnlocked || r.freedom_unlocked).length > 0 && (
              <div className="mt-8 pt-6 border-t border-emerald-700/50">
                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-4">
                  How Each Step Gets You There
                </p>
                <div className="space-y-3">
                  {displayRecs.filter((r: any) => r.freedomUnlocked || r.freedom_unlocked).map((rec: any, i: number) => {
                    const text = rec.freedomUnlocked || rec.freedom_unlocked;
                    const parts = text.split(/\.\s+/).filter(Boolean);
                    const firstSentence = parts.length > 0 ? parts.slice(0, 2).join('. ') + (parts.length >= 2 ? '.' : '') : text;
                    const hasMore = parts.length > 2;
                    const isOpen = expandedFreedom === i;
                    return (
                      <div key={i} className="bg-white/5 rounded-lg p-3">
                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {rec.priorityRank || i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-emerald-100 leading-relaxed">
                              {isOpen ? text : firstSentence}
                            </p>
                            {hasMore && (
                              <button
                                onClick={() => setExpandedFreedom(isOpen ? null : i)}
                                className="text-xs text-emerald-400 hover:text-emerald-300 mt-1"
                              >
                                {isOpen ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* ═══ NEXT STEPS (contained) ═══ */}
        <div className={`${contained} py-10 pb-16`}>
        <div ref={sectionRefs.nextsteps} className="scroll-mt-16" data-section-id="nextsteps">
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
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}