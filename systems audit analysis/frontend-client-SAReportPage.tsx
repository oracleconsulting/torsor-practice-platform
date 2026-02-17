// ============================================================================
// SYSTEMS AUDIT CLIENT REPORT PAGE
// ============================================================================
// Client-facing report page for Systems Audit — matches Benchmarking report
// quality with the story arc framework (Proof → Pattern → Price → Path → Plan).
//
// Data sources:
//   sa_audit_reports  → headline, executive_summary, cost_of_chaos_narrative,
//                       time_freedom_narrative, scores, metrics, pass1_data
//   sa_findings       → severity, title, description, client_quote, evidence
//   sa_recommendations → priority_rank, title, implementation_phase,
//                        annual_cost_savings, hours_saved_weekly, estimated_cost
//   sa_engagements    → status, is_shared_with_client
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, TrendingUp,
  Zap, BarChart3, Target, ChevronDown, ChevronUp,
  Loader2, Quote, DollarSign, Settings, ArrowRight,
  Sparkles, Brain, Phone
} from 'lucide-react';

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
  pass1_data: any;
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
}

interface SARecommendation {
  id: string;
  priority_rank: number;
  title: string;
  description: string;
  category: string;
  implementation_phase: string;
  estimated_cost: number;
  hours_saved_weekly: number;
  annual_cost_savings: number;
  time_reclaimed_weekly: number | null;
  freedom_unlocked: string | null;
}

// ─── Score Ring Component ────────────────────────────────────────────────────

function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#059669', text: 'text-emerald-700', bg: 'text-emerald-100' };
    if (s >= 50) return { stroke: '#d97706', text: 'text-amber-700', bg: 'text-amber-100' };
    if (s >= 30) return { stroke: '#ea580c', text: 'text-orange-700', bg: 'text-orange-100' };
    return { stroke: '#dc2626', text: 'text-red-700', bg: 'text-red-100' };
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke="#e5e7eb" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color.stroke} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${color.text}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Severity Badge ──────────────────────────────────────────────────────────

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

// ─── Phase Badge ─────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: string }) {
  const styles: Record<string, { bg: string; label: string }> = {
    immediate: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Quick Win' },
    short_term: { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Short Term' },
    medium_term: { bg: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Medium Term' },
    long_term: { bg: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Long Term' },
  };
  const style = styles[phase] || styles.medium_term;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style.bg}`}>
      {style.label}
    </span>
  );
}

// ─── Format helpers ──────────────────────────────────────────────────────────

const fmt = (n: number) => n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${n}`;
const fmtFull = (n: number) => `£${n.toLocaleString()}`;

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function SAReportPage() {
  const navigate = useNavigate();
  const { clientSession } = useAuth();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SAReport | null>(null);
  const [findings, setFindings] = useState<SAFinding[]>([]);
  const [recommendations, setRecommendations] = useState<SARecommendation[]>([]);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');

  const overviewRef = useRef<HTMLDivElement>(null);
  const costRef = useRef<HTMLDivElement>(null);
  const findingsRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<HTMLDivElement>(null);
  const freedomRef = useRef<HTMLDivElement>(null);

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

      if (!engagement) {
        navigate('/dashboard');
        return;
      }

      if (!engagement.is_shared_with_client) {
        navigate('/dashboard');
        return;
      }

      const { data: reportData } = await supabase
        .from('sa_audit_reports')
        .select('*')
        .eq('engagement_id', engagement.id)
        .single();

      if (!reportData || !['generated', 'approved', 'published', 'delivered'].includes(reportData.status)) {
        navigate('/dashboard');
        return;
      }

      setReport(reportData);

      const { data: findingsData } = await supabase
        .from('sa_findings')
        .select('*')
        .eq('engagement_id', engagement.id)
        .order('severity', { ascending: true });

      setFindings(findingsData || []);

      const { data: recsData } = await supabase
        .from('sa_recommendations')
        .select('*')
        .eq('engagement_id', engagement.id)
        .order('priority_rank', { ascending: true });

      setRecommendations(recsData || []);
    } catch (err) {
      console.error('Error loading SA report:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, section: string) => {
    setActiveSection(section);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const pass1 = report.pass1_data || {};
  const facts = pass1.facts || {};
  const criticalFindings = findings.filter(f => f.severity === 'critical');
  const highFindings = findings.filter(f => f.severity === 'high');
  const quickWins = pass1.quickWins || [];
  const totalAnnualBenefit = recommendations.reduce((sum, r) => sum + (r.annual_cost_savings || 0), 0);
  const totalHoursSaved = recommendations.reduce((sum, r) => sum + (r.hours_saved_weekly || 0), 0);

  const navItems = [
    { id: 'overview', label: 'Overview', ref: overviewRef, icon: BarChart3 },
    { id: 'cost', label: 'Cost of Chaos', ref: costRef, icon: DollarSign },
    { id: 'findings', label: 'Findings', ref: findingsRef, icon: AlertTriangle },
    { id: 'plan', label: 'The Plan', ref: planRef, icon: Target },
    { id: 'freedom', label: 'Your Future', ref: freedomRef, icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-1 overflow-x-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id}
                  onClick={() => scrollTo(item.ref, item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeSection === item.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* SECTION 1: Hero + Overview */}
        <div ref={overviewRef} className="scroll-mt-20">
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
                <p className="text-2xl font-bold">{report.total_hours_wasted_weekly}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-200 text-xs mb-1">Annual Cost of Chaos</p>
                <p className="text-2xl font-bold">{fmt(report.total_annual_cost_of_chaos)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-200 text-xs mb-1">Systems Audited</p>
                <p className="text-2xl font-bold">{report.systems_count}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-200 text-xs mb-1">At {report.growth_multiplier}x Growth</p>
                <p className="text-2xl font-bold text-red-300">{fmt(report.projected_cost_at_scale)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Operations Health Scores
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
              <ScoreRing score={report.integration_score} label="Integration" size={90} />
              <ScoreRing score={report.automation_score} label="Automation" size={90} />
              <ScoreRing score={report.data_accessibility_score} label="Data Access" size={90} />
              <ScoreRing score={report.scalability_score} label="Scalability" size={90} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Executive Summary
            </h2>
            <div className="prose prose-gray max-w-none">
              {(report.executive_summary || '').split('\n\n').map((para, i) => (
                <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">{para}</p>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: Cost of Chaos */}
        <div ref={costRef} className="scroll-mt-20">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              The Cost of Chaos
            </h2>
            <div className="prose prose-gray max-w-none mb-6">
              {(report.cost_of_chaos_narrative || '').split('\n\n').map((para, i) => (
                <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">{para}</p>
              ))}
            </div>

            {facts.processes && facts.processes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {facts.processes.map((proc: any, i: number) => (
                  <div key={i} className="bg-white/70 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{proc.chainName}</h4>
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        {proc.hoursWasted}h/mo wasted
                      </span>
                    </div>
                    {proc.keyPainPoints && proc.keyPainPoints[0] && (
                      <p className="text-xs text-gray-500 italic">
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
                    At {report.growth_multiplier}x your current size, these same gaps will cost{' '}
                    <span className="font-bold text-white">{fmtFull(report.projected_cost_at_scale)}/year</span>.
                    The chaos doesn&apos;t scale linearly — it compounds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Findings */}
        <div ref={findingsRef} className="scroll-mt-20 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Key Findings
              <span className="text-sm font-normal text-gray-500">
                ({criticalFindings.length} critical, {highFindings.length} high)
              </span>
            </h2>
          </div>

          {findings.map(finding => (
            <div key={finding.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                finding.severity === 'critical' ? 'border-red-200' :
                finding.severity === 'high' ? 'border-orange-200' : 'border-gray-200'
              }`}>
              <button
                onClick={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)}
                className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                <SeverityBadge severity={finding.severity} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{finding.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {(finding.affected_systems || []).join(' → ')}
                    {finding.hours_wasted_weekly > 0 && ` • ${finding.hours_wasted_weekly}h/week`}
                  </p>
                </div>
                {finding.annual_cost_impact > 0 && (
                  <span className="text-sm font-semibold text-red-700 whitespace-nowrap">
                    {fmt(finding.annual_cost_impact)}/yr
                  </span>
                )}
                {expandedFinding === finding.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>

              {expandedFinding === finding.id && (
                <div className="px-6 pb-5 pt-2 border-t border-gray-100 space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{finding.description}</p>

                  {finding.client_quote && (
                    <div className="flex gap-3 bg-purple-50 rounded-lg p-4">
                      <Quote className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-800 italic">&quot;{finding.client_quote}&quot;</p>
                    </div>
                  )}

                  {finding.evidence && finding.evidence.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Evidence</p>
                      {finding.evidence.map((e, i) => (
                        <p key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          {e}
                        </p>
                      ))}
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
          ))}
        </div>

        {/* SECTION 4: The Plan */}
        <div ref={planRef} className="scroll-mt-20 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              The Plan
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {recommendations.length} recommendations prioritised by impact and speed.
              Combined annual benefit: <span className="font-semibold text-emerald-700">{fmtFull(totalAnnualBenefit)}</span>,
              saving <span className="font-semibold text-emerald-700">{totalHoursSaved}h/week</span>.
            </p>

            <div className="space-y-4">
              {recommendations.map((rec, idx) => {
                const paybackMonths = rec.annual_cost_savings > 0 && rec.estimated_cost > 0
                  ? Math.round(rec.estimated_cost / (rec.annual_cost_savings / 12))
                  : 0;
                return (
                  <div key={rec.id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:border-purple-200 transition-colors">
                    <button
                      onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
                      className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 text-sm">{rec.title}</p>
                          <PhaseBadge phase={rec.implementation_phase} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {rec.annual_cost_savings > 0 && (
                          <p className="text-sm font-semibold text-emerald-700">{fmt(rec.annual_cost_savings)}/yr</p>
                        )}
                        {paybackMonths > 0 && (
                          <p className="text-xs text-gray-500">{paybackMonths}mo payback</p>
                        )}
                      </div>
                      {expandedRec === rec.id
                        ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </button>

                    {expandedRec === rec.id && (
                      <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">
                        <p className="text-sm text-gray-700 leading-relaxed">{rec.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Estimated Cost</p>
                            <p className="font-semibold text-gray-900">{rec.estimated_cost > 0 ? fmtFull(rec.estimated_cost) : 'TBD'}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-3">
                            <p className="text-xs text-emerald-600">Hours Saved</p>
                            <p className="font-semibold text-emerald-700">{rec.hours_saved_weekly}h/week</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-3">
                            <p className="text-xs text-emerald-600">Annual Benefit</p>
                            <p className="font-semibold text-emerald-700">{fmtFull(rec.annual_cost_savings)}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-blue-600">Payback</p>
                            <p className="font-semibold text-blue-700">{paybackMonths > 0 ? `${paybackMonths} months` : 'Immediate'}</p>
                          </div>
                        </div>

                        {rec.freedom_unlocked && (
                          <div className="bg-purple-50 rounded-lg p-4 flex gap-3">
                            <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">What This Unlocks</p>
                              <p className="text-sm text-purple-800">{rec.freedom_unlocked}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {quickWins.length > 0 && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <h3 className="text-base font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                Quick Wins — Start This Week
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickWins.map((qw: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-emerald-100">
                    <p className="font-medium text-gray-900 text-sm mb-1">{qw.title}</p>
                    <p className="text-xs text-gray-600 mb-2">{qw.action}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-700 font-medium">
                        Saves {qw.hoursSavedWeekly}h/week
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{qw.timeToImplement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: Your Future */}
        <div ref={freedomRef} className="scroll-mt-20">
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-300" />
              Your Future
            </h2>

            {facts.magicFix && (
              <div className="bg-white/10 rounded-xl p-5 mb-6 backdrop-blur-sm">
                <div className="flex gap-3">
                  <Quote className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-100 text-sm italic leading-relaxed">
                      &quot;{facts.magicFix}&quot;
                    </p>
                    <p className="text-emerald-400 text-xs mt-2">— You said this. Here&apos;s how we make it real.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              {(report.time_freedom_narrative || '').split('\n\n').map((para, i) => (
                <p key={i} className="text-emerald-50 leading-relaxed mb-4 last:mb-0">{para}</p>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-emerald-700/50">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalHoursSaved}h</p>
                <p className="text-emerald-300 text-xs">Saved per Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{fmtFull(totalAnnualBenefit)}</p>
                <p className="text-emerald-300 text-xs">Annual Benefit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {recommendations.length > 0
                    ? `${Math.round(recommendations.reduce((s, r) => {
                        const pm = r.annual_cost_savings > 0 && r.estimated_cost > 0
                          ? Math.round(r.estimated_cost / (r.annual_cost_savings / 12))
                          : 0;
                        return s + pm;
                      }, 0) / recommendations.length)}mo`
                    : '—'}
                </p>
                <p className="text-emerald-300 text-xs">Avg Payback</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
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
            <button
              onClick={() => navigate('/appointments')}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap">
              Book a Call
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
