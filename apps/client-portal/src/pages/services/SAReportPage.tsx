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
  Sparkles, Brain, Phone, Building2, Activity, GitBranch, Map, Route
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
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [systemInventory, setSystemInventory] = useState<any[]>([]);
  const [discovery, setDiscovery] = useState<any>(null);
  const [deepDives, setDeepDives] = useState<any[]>([]);

  const overviewRef = useRef<HTMLDivElement>(null);
  const businessRef = useRef<HTMLDivElement>(null);
  const systemsRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);
  const costRef = useRef<HTMLDivElement>(null);
  const processesRef = useRef<HTMLDivElement>(null);
  const findingsRef = useRef<HTMLDivElement>(null);
  const mapsRef = useRef<HTMLDivElement>(null);
  const quickwinsRef = useRef<HTMLDivElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);
  const roiRef = useRef<HTMLDivElement>(null);
  const mondayRef = useRef<HTMLDivElement>(null);

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

      // System inventory for Section 3
      const { data: systemsData } = await supabase
        .from('sa_system_inventory')
        .select('*')
        .eq('engagement_id', engagement.id);
      setSystemInventory(systemsData || []);

      // Discovery responses for Section 2
      const { data: discoveryData } = await supabase
        .from('sa_discovery_responses')
        .select('team_size, expected_team_size_12mo, revenue_band, industry_sector, magic_process_fix, desired_outcomes, monday_morning_vision, time_freedom_priority')
        .eq('engagement_id', engagement.id)
        .maybeSingle();
      setDiscovery(discoveryData);

      // Deep dives for Section 6
      const { data: deepDivesData } = await supabase
        .from('sa_process_deep_dives')
        .select('chain_code, key_pain_points, responses')
        .eq('engagement_id', engagement.id);
      setDeepDives(deepDivesData || []);
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
    { id: 'business', label: 'Your Business', ref: businessRef, icon: Building2 },
    { id: 'systems', label: 'Systems', ref: systemsRef, icon: Settings },
    { id: 'health', label: 'Scores', ref: healthRef, icon: Activity },
    { id: 'cost', label: 'Cost', ref: costRef, icon: DollarSign },
    { id: 'processes', label: 'Processes', ref: processesRef, icon: GitBranch },
    { id: 'findings', label: 'Findings', ref: findingsRef, icon: AlertTriangle },
    { id: 'maps', label: 'Tech Recs', ref: mapsRef, icon: Map },
    { id: 'quickwins', label: 'Quick Wins', ref: quickwinsRef, icon: Zap },
    { id: 'roadmap', label: 'Roadmap', ref: roadmapRef, icon: Route },
    { id: 'roi', label: 'ROI', ref: roiRef, icon: TrendingUp },
    { id: 'monday', label: 'Future', ref: mondayRef, icon: Sparkles },
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

          {/* SECTION 2: Your Business */}
          {discovery && (
            <div ref={businessRef} className="scroll-mt-20">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Your Business
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Team Size</p>
                    <p className="text-xl font-bold text-gray-900">{discovery.team_size ?? '—'}</p>
                    {discovery.expected_team_size_12mo && (
                      <p className="text-xs text-purple-600 mt-1">→ {discovery.expected_team_size_12mo} in 12mo</p>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Revenue</p>
                    <p className="text-xl font-bold text-gray-900">{(discovery.revenue_band || '').replace(/_/g, ' ') || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Industry</p>
                    <p className="text-xl font-bold text-gray-900">{discovery.industry_sector || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Time freedom</p>
                    <p className="text-xl font-bold text-gray-900">{(discovery.time_freedom_priority || '').replace(/_/g, ' ') || '—'}</p>
                  </div>
                </div>

                {pass1?.phase2?.aspirationGap && (
                  <div className="bg-purple-50 rounded-xl p-5 mb-6">
                    <p className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-2">Where You Want To Be</p>
                    <p className="text-sm text-purple-900 leading-relaxed">{pass1.phase2.aspirationGap}</p>
                  </div>
                )}

                {discovery.magic_process_fix && (
                  <div className="border-l-4 border-purple-300 pl-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-medium">Magic process fix:</span> {discovery.magic_process_fix}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={healthRef} className="scroll-mt-20 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
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

        {/* SECTION 3: Your Systems Today */}
        {systemInventory.length > 0 && (
          <div ref={systemsRef} className="scroll-mt-20 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Your Systems Today
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {systemInventory.length} systems audited — {fmtFull(systemInventory.reduce((s, sys) => s + (Number(sys.monthly_cost) || 0), 0))}/month total software spend
              </p>

              {(() => {
                const connected = systemInventory.filter(s => s.integration_method === 'native' && !s.manual_transfer_required).length;
                const partial = systemInventory.filter(s => s.integration_method === 'native' && s.manual_transfer_required).length;
                const disconnected = systemInventory.filter(s => !s.integration_method || s.integration_method === 'none' || s.integration_method === 'manual').length;
                const total = systemInventory.length;
                return (
                  <div className="mb-6">
                    <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-100 mb-2">
                      {connected > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(connected/total)*100}%` }} />}
                      {partial > 0 && <div className="bg-amber-400 transition-all" style={{ width: `${(partial/total)*100}%` }} />}
                      {disconnected > 0 && <div className="bg-red-400 transition-all" style={{ width: `${(disconnected/total)*100}%` }} />}
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {connected} connected</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> {partial} partial</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> {disconnected} disconnected</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemInventory.map((sys) => {
                  const isDisconnected = !sys.integration_method || sys.integration_method === 'none' || sys.integration_method === 'manual';
                  const isManual = sys.manual_transfer_required;
                  const statusBg = isDisconnected ? 'border-red-200 bg-red-50/30' : isManual ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200 bg-white';
                  const statusDot = isDisconnected ? 'bg-red-500' : isManual ? 'bg-amber-500' : 'bg-emerald-500';

                  return (
                    <div key={sys.id} className={`rounded-xl border p-4 ${statusBg}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{sys.system_name}</p>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{(sys.category_code || '').replace(/_/g, ' ')}</span>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full mt-1 ${statusDot}`} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div>
                          <p className="text-gray-500">Cost</p>
                          <p className="font-medium text-gray-900">£{sys.monthly_cost ?? 0}/mo</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Satisfaction</p>
                          <p className="font-medium text-gray-900">{'★'.repeat(sys.user_satisfaction || 0)}{'☆'.repeat(5 - (sys.user_satisfaction || 0))}</p>
                        </div>
                        {isManual && sys.manual_hours_monthly > 0 && (
                          <div className="col-span-2">
                            <p className="text-red-700 font-medium">{sys.manual_hours_monthly}h/mo manual transfer</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: Cost of Chaos */}
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

        {/* SECTION 6: Process Analysis */}
        {deepDives.length > 0 && (
          <div ref={processesRef} className="scroll-mt-20">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-600" />
                Process Analysis
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {deepDives.length} business processes analysed
              </p>

              <div className="space-y-4">
                {deepDives.map((dd) => {
                  const chainName = (dd.chain_code || '').replace(/_/g, ' ');
                  const pains = dd.key_pain_points || [];
                  const processData = (facts.processes || []).find((p: any) => p.chainCode === dd.chain_code);
                  const hoursWasted = processData?.hoursWasted ?? 0;
                  const isExpanded = expandedProcess === dd.chain_code;

                  return (
                    <div key={dd.chain_code} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedProcess(isExpanded ? null : dd.chain_code)}
                        className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm capitalize">{chainName}</p>
                          {processData?.criticalGaps?.[0] && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{processData.criticalGaps[0]}</p>
                          )}
                        </div>
                        {hoursWasted > 0 && (
                          <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                            {hoursWasted}h/mo wasted
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-5 pt-2 border-t border-gray-100 space-y-4">
                          {pains.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Key Pain Points</p>
                              <div className="space-y-2">
                                {pains.slice(0, 5).map((pain: string, i: number) => (
                                  <div key={i} className="flex gap-3 bg-red-50/50 rounded-lg p-3">
                                    <Quote className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-red-800 italic">&quot;{pain}&quot;</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {processData && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {processData.score !== undefined && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs text-gray-500">Process Health</p>
                                  <p className="font-semibold text-gray-900">{processData.score}/100</p>
                                </div>
                              )}
                              <div className="bg-red-50 rounded-lg p-3">
                                <p className="text-xs text-red-600">Hours Wasted</p>
                                <p className="font-semibold text-red-700">{hoursWasted}h/month</p>
                              </div>
                              {processData.criticalGaps?.length > 0 && (
                                <div className="bg-amber-50 rounded-lg p-3">
                                  <p className="text-xs text-amber-600">Integration Gaps</p>
                                  <p className="font-semibold text-amber-700">{processData.criticalGaps.length}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: Findings */}
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

        {/* SECTION 8: Technology Recommendations */}
        <div ref={mapsRef} className="scroll-mt-20 space-y-6">
          {pass1?.systemsMaps && Array.isArray(pass1.systemsMaps) && pass1.systemsMaps.length === 4 ? (
            <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 rounded-2xl p-8 text-white shadow-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-400" />
                Technology Recommendations
              </h2>
              <p className="text-gray-300 text-sm mb-6">
                Four levels of integration maturity — from where you are today to your optimal stack.
              </p>
              <p className="text-gray-400 text-xs text-center py-8">Systems map visualisation loading…</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Map className="w-5 h-5 text-purple-600" />
                Technology Recommendations
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
          )}
        </div>

        {/* SECTION 10: Quick Wins */}
        {quickWins.length > 0 && (
          <div ref={quickwinsRef} className="scroll-mt-20">
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
          </div>
        )}

        {/* SECTION: Implementation Roadmap */}
        {recommendations.length > 0 && (
          <div ref={roadmapRef} className="scroll-mt-20">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Route className="w-5 h-5 text-purple-600" />
                Implementation Roadmap
              </h2>

              {(() => {
                const phases = [
                  { key: 'immediate', label: 'Week 1-2', title: 'Quick Wins', bgColor: 'bg-emerald-50 border-emerald-200', colorClasses: 'bg-emerald-100 text-emerald-700', dotClasses: 'text-emerald-500' },
                  { key: 'short_term', label: 'Month 1-2', title: 'Foundation', bgColor: 'bg-blue-50 border-blue-200', colorClasses: 'bg-blue-100 text-blue-700', dotClasses: 'text-blue-500' },
                  { key: 'medium_term', label: 'Month 2-4', title: 'Strategic Changes', bgColor: 'bg-purple-50 border-purple-200', colorClasses: 'bg-purple-100 text-purple-700', dotClasses: 'text-purple-500' },
                  { key: 'long_term', label: 'Month 4-6', title: 'Optimisation', bgColor: 'bg-gray-50 border-gray-200', colorClasses: 'bg-gray-100 text-gray-700', dotClasses: 'text-gray-500' },
                ];

                let cumulativeHours = 0;
                let cumulativeBenefit = 0;

                return (
                  <div className="space-y-6">
                    {phases.map((phase, phaseIdx) => {
                      const phaseRecs = recommendations.filter(r => r.implementation_phase === phase.key);
                      if (phaseRecs.length === 0) return null;

                      const phaseHours = phaseRecs.reduce((s, r) => s + (r.hours_saved_weekly || 0), 0);
                      const phaseBenefit = phaseRecs.reduce((s, r) => s + (r.annual_cost_savings || 0), 0);
                      cumulativeHours += phaseHours;
                      cumulativeBenefit += phaseBenefit;

                      return (
                        <div key={phase.key} className="relative">
                          {phaseIdx > 0 && (
                            <div className="absolute -top-3 left-6 w-0.5 h-6 bg-gray-200" />
                          )}

                          <div className={`rounded-xl border p-5 ${phase.bgColor}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${phase.colorClasses}`}>
                                  {phaseIdx + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{phase.title}</p>
                                  <p className="text-xs text-gray-500">{phase.label} · {phaseRecs.length} action{phaseRecs.length !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-emerald-700">+{phaseHours}h/wk saved</p>
                                <p className="text-xs text-gray-500">Cumulative: {cumulativeHours}h/wk, {fmtFull(cumulativeBenefit)}/yr</p>
                              </div>
                            </div>

                            <div className="space-y-2 ml-14">
                              {phaseRecs.map((rec) => (
                                <div key={rec.id} className="flex items-center gap-2 text-sm">
                                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${phase.dotClasses}`} />
                                  <span className="text-gray-700">{rec.title}</span>
                                  {(rec.hours_saved_weekly || 0) > 0 && (
                                    <span className="text-xs text-emerald-600 ml-auto whitespace-nowrap">+{rec.hours_saved_weekly}h/wk</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* SECTION 11: Investment & ROI */}
        <div ref={roiRef} className="scroll-mt-20">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Investment & Return
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fmtFull(recommendations.reduce((s, r) => s + (r.estimated_cost || 0), 0))}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-600 mb-1">Annual Return</p>
                <p className="text-2xl font-bold text-emerald-700">{fmtFull(totalAnnualBenefit)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 mb-1">Payback Period</p>
                <p className="text-2xl font-bold text-blue-700">
                  {(() => {
                    const totalInv = recommendations.reduce((s, r) => s + (r.estimated_cost || 0), 0);
                    const monthlyBenefit = totalAnnualBenefit / 12;
                    if (totalInv === 0 || monthlyBenefit === 0) return 'Immediate';
                    const months = totalInv / monthlyBenefit;
                    if (months < 1) return '< 1 month';
                    return `${Math.ceil(months)} months`;
                  })()}
                </p>
              </div>
            </div>

            {(() => {
              const totalInv = recommendations.reduce((s, r) => s + (r.estimated_cost || 0), 0);
              const ratio = totalInv > 0 ? (totalAnnualBenefit / totalInv).toFixed(0) : '∞';
              return (
                <div className="bg-emerald-900 rounded-xl p-5 text-white mb-6">
                  <p className="text-lg font-bold">For every £1 invested → £{ratio} return in the first year</p>
                  <p className="text-emerald-200 text-sm mt-1">
                    {totalHoursSaved} hours per week back to your team.
                    That&apos;s {Math.round(totalHoursSaved * 52)} hours per year of productive capacity restored.
                  </p>
                </div>
              );
            })()}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="py-2 pr-4 font-medium text-gray-500 text-xs">Recommendation</th>
                    <th className="py-2 px-3 font-medium text-gray-500 text-xs text-right">Cost</th>
                    <th className="py-2 px-3 font-medium text-gray-500 text-xs text-right">Annual Return</th>
                    <th className="py-2 px-3 font-medium text-gray-500 text-xs text-right">Hours/wk</th>
                    <th className="py-2 pl-3 font-medium text-gray-500 text-xs text-right">Payback</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((rec) => {
                    const pb = (rec.annual_cost_savings || 0) > 0 && (rec.estimated_cost || 0) > 0
                      ? Math.ceil((rec.estimated_cost || 0) / ((rec.annual_cost_savings || 0) / 12))
                      : 0;
                    return (
                      <tr key={rec.id} className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-900">{rec.title}</td>
                        <td className="py-3 px-3 text-right text-gray-700">{(rec.estimated_cost || 0) > 0 ? fmtFull(rec.estimated_cost!) : '£0'}</td>
                        <td className="py-3 px-3 text-right text-emerald-700 font-medium">{fmtFull(rec.annual_cost_savings || 0)}</td>
                        <td className="py-3 px-3 text-right text-gray-700">{rec.hours_saved_weekly}h</td>
                        <td className="py-3 pl-3 text-right text-gray-500">{pb < 1 ? 'Immediate' : `${pb}mo`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 12: Monday Morning — Your Future */}
        <div ref={mondayRef} className="scroll-mt-20">
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-300" />
              Your Monday Morning
            </h2>

            {(discovery?.monday_morning_vision || facts.mondayMorningVision || facts.magicFix) && (
              <div className="bg-white/10 rounded-xl p-5 mb-6 backdrop-blur-sm">
                <div className="flex gap-3">
                  <Quote className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-100 text-sm italic leading-relaxed">
                      &quot;{discovery?.monday_morning_vision || facts.mondayMorningVision || facts.magicFix}&quot;
                    </p>
                    <p className="text-emerald-400 text-xs mt-2">— You said this. Here&apos;s how we make it real.</p>
                  </div>
                </div>
              </div>
            )}

            {report.time_freedom_narrative && (
              <div className="prose prose-invert max-w-none mb-6">
                {report.time_freedom_narrative.split('\n\n').map((para: string, i: number) => (
                  <p key={i} className="text-emerald-50 leading-relaxed mb-4 last:mb-0">{para}</p>
                ))}
              </div>
            )}

            {discovery?.desired_outcomes && Array.isArray(discovery.desired_outcomes) && discovery.desired_outcomes.length > 0 && (
              <div className="space-y-3 mb-6">
                <p className="text-emerald-300 text-xs font-medium uppercase tracking-wide">Your Goals → Our Recommendations</p>
                {discovery.desired_outcomes.slice(0, 5).map((outcome: string, i: number) => {
                  const matchingRecs = recommendations.filter(r =>
                    (r.freedom_unlocked || '').toLowerCase().includes(outcome.toLowerCase().slice(0, 20)) ||
                    (r.title || '').toLowerCase().includes((outcome.toLowerCase().split(' ')[0] || ''))
                  );
                  return (
                    <div key={i} className="bg-white/5 rounded-lg p-4">
                      <p className="text-emerald-100 text-sm font-medium mb-1">{outcome}</p>
                      {matchingRecs.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {matchingRecs.slice(0, 3).map((rec, j) => (
                            <span key={j} className="text-xs bg-emerald-700/50 text-emerald-200 px-2 py-0.5 rounded-full">
                              {rec.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-emerald-400/60 text-xs italic">Delivered through the integrated implementation plan</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-emerald-700/50">
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
                  {(() => {
                    const totalInv = recommendations.reduce((s, r) => s + (r.estimated_cost || 0), 0);
                    const monthlyBenefit = totalAnnualBenefit / 12;
                    if (totalInv === 0 || monthlyBenefit === 0) return 'Now';
                    const months = totalInv / monthlyBenefit;
                    if (months < 1) return '< 1mo';
                    return `${Math.ceil(months)}mo`;
                  })()}
                </p>
                <p className="text-emerald-300 text-xs">Payback</p>
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
