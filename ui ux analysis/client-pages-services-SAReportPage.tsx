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

import { useState, useEffect, useRef, type ReactNode } from 'react';
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

// ─── Vitalise: Animated Counter (scroll-triggered) ───────────────────────────
function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000, decimals = 0 }: {
  target: number; prefix?: string; suffix?: string; duration?: number; decimals?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let start: number | null = null;
        const step = (ts: number) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(eased * target);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val);
  return (
    <span ref={ref}>
      {prefix}{typeof display === 'number' ? display.toLocaleString() : Number(display).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

// ─── Reveal (scroll-triggered fade-in) ───────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ─── Cost Clock (live waste counter) ─────────────────────────────────────────
function CostClock({ annualCost }: { annualCost: number }) {
  const [elapsed, setElapsed] = useState(0);
  const costPerSecond = annualCost / (365.25 * 24 * 3600);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#ef4444' }}>
      £{(costPerSecond * elapsed).toFixed(2)}
    </span>
  );
}

// ─── Health Ring (animated score ring, replaces ScoreRing) ────────────────────
function HealthRing({ score, label, evidence, delay = 0 }: {
  score: number; label: string; evidence?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAnimated(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const color = score < 30 ? '#ef4444' : score < 50 ? '#f97316' : score < 70 ? '#eab308' : '#22c55e';
  const circumference = 2 * Math.PI * 52;
  const offset = animated ? circumference - (score / 100) * circumference : circumference;
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto', cursor: evidence ? 'pointer' : 'default' }}
        onClick={() => evidence && setShowEvidence(!showEvidence)}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: `stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
        </div>
      </div>
      <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, marginTop: 12, marginBottom: 4 }}>{label}</p>
      {evidence && showEvidence && (
        <p style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.5, maxWidth: 200, margin: '8px auto 0', padding: '8px 12px', background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b' }}>{evidence}</p>
      )}
    </div>
  );
}

// ─── Severity Dot Grid (findings with expandable detail) ───────────────────────
function SeverityDotGrid({ findings, displayOutcomeFn }: { findings: any[]; displayOutcomeFn: (outcome: string) => string }) {
  const [active, setActive] = useState<number | null>(null);
  const colors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6' };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
        {findings.map((f: any, i: number) => {
          const c = colors[f.severity] || '#64748b';
          const isActive = active === i;
          return (
            <div key={i} onClick={() => setActive(isActive ? null : i)}
              style={{
                width: isActive ? 'auto' : 44, height: 44, minWidth: 44, borderRadius: 22,
                background: `${c}18`, border: `2px solid ${c}${isActive ? 'cc' : '55'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                padding: isActive ? '0 16px' : 0,
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: isActive ? `0 0 20px ${c}30` : 'none',
              }}>
              {isActive ? (
                <span style={{ color: c, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {((f.title || '').length > 40 ? (f.title || '').slice(0, 38) + '…' : f.title) || 'Finding'}
                </span>
              ) : (
                <div style={{ width: 12, height: 12, borderRadius: 6, background: c, boxShadow: `0 0 8px ${c}60` }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 24 }}>
        {Object.entries(colors).map(([sev, c]) => (
          <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: c }} />
            <span style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize', fontFamily: "'JetBrains Mono', monospace" }}>{sev}</span>
          </div>
        ))}
      </div>
      {active !== null && findings[active] && (() => {
        const f = findings[active];
        const c = colors[f.severity] || '#64748b';
        const hoursVal = f.hours_wasted_weekly ?? f.hoursWastedWeekly ?? f.hoursPerWeek ?? 0;
        const costVal = f.annual_cost_impact ?? f.annualCostImpact ?? f.annualCost ?? 0;
        const affected = f.affected_systems ?? f.affectedSystems ?? [];
        return (
          <div style={{ background: '#0f172a', border: `1px solid ${c}40`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: c, padding: '3px 10px', borderRadius: 6, background: `${c}15`, border: `1px solid ${c}30`, fontFamily: "'JetBrains Mono', monospace" }}>{f.severity}</span>
              {f.category && <span style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{(f.category || '').replace(/_/g, ' ')}</span>}
            </div>
            <h4 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{f.title}</h4>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{f.description}</p>
            {(f.evidence && f.evidence.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>Evidence</span>
                {f.evidence.map((e: string, j: number) => (
                  <p key={j} style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, paddingLeft: 12, borderLeft: '2px solid #1e293b' }}>{e}</p>
                ))}
              </div>
            )}
            {(f.client_quote || f.clientQuote) && (
              <div style={{ padding: '10px 14px', background: '#1e293b', borderRadius: 8, marginBottom: 16, borderLeft: '3px solid #8b5cf6' }}>
                <p style={{ color: '#c4b5fd', fontSize: 12, fontStyle: 'italic' }}>&quot;{f.client_quote || f.clientQuote}&quot;</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {hoursVal > 0 && (
                <div>
                  <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>Hours/week</span>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', margin: '4px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>{hoursVal}</p>
                </div>
              )}
              {costVal > 0 && (
                <div>
                  <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>Annual cost</span>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', margin: '4px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>£{Number(costVal).toLocaleString()}</p>
                </div>
              )}
              {Array.isArray(affected) && affected.length > 0 && (
                <div>
                  <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>Affects</span>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>{affected.join(', ')}</p>
                </div>
              )}
            </div>
            {(f.recommendation) && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: '#22c55e08', borderLeft: '2px solid #22c55e40', borderRadius: '0 8px 8px 0' }}>
                <span style={{ fontSize: 9, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>Recommendation</span>
                <p style={{ color: '#86efac', fontSize: 12, marginTop: 4 }}>{f.recommendation}</p>
              </div>
            )}
            {(f.scalability_impact || f.scalabilityImpact || f.blocks_goal || f.blocksGoal) && (
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                {(f.scalability_impact || f.scalabilityImpact) && (
                  <span style={{ fontSize: 11, color: '#f97316', background: '#f9731610', padding: '4px 10px', borderRadius: 6 }}>
                    Scalability: {f.scalability_impact || f.scalabilityImpact}
                  </span>
                )}
                {(f.blocks_goal || f.blocksGoal) && (
                  <span style={{ fontSize: 11, color: '#a78bfa', background: '#a78bfa10', padding: '4px 10px', borderRadius: 6 }}>
                    Blocks: {displayOutcomeFn(f.blocks_goal || f.blocksGoal || '')}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── ROI Waterfall (visual bar chart for recommendations) ────────────────────
function ROIWaterfall({ recommendations }: { recommendations: any[] }) {
  const [hovered, setHovered] = useState<number | string | null>(null);
  const maxBenefit = Math.max(...recommendations.map(r => r.annualBenefit || r.annual_cost_savings || 0), 1);
  const totalBenefit = recommendations.reduce((s, r) => s + (r.annualBenefit || r.annual_cost_savings || 0), 0);
  const totalCost = recommendations.reduce((s, r) => s + (r.estimatedCost || r.estimated_cost || 0), 0);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 220, paddingBottom: 40, position: 'relative' }}>
        {recommendations.map((r: any, i: number) => {
          const benefit = r.annualBenefit || r.annual_cost_savings || 0;
          const cost = r.estimatedCost || r.estimated_cost || 0;
          const hours = parseFloat(r.hoursSavedWeekly || r.hours_saved_weekly) || 0;
          const h = (benefit / maxBenefit) * 160;
          const isHovered = hovered === i;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {isHovered && (
                <div style={{ position: 'absolute', bottom: h + 56, left: '50%', transform: 'translateX(-50%)',
                  background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 16px',
                  minWidth: 200, zIndex: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                  <p style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{r.title}</p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>BENEFIT</span>
                      <p style={{ color: '#22c55e', fontSize: 14, fontWeight: 700, margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>£{benefit.toLocaleString()}/yr</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>COST</span>
                      <p style={{ color: '#f97316', fontSize: 14, fontWeight: 700, margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>{cost > 0 ? `£${cost.toLocaleString()}` : '£0'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>SAVES</span>
                      <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>{hours}hrs/wk</p>
                    </div>
                  </div>
                </div>
              )}
              <div style={{
                width: '100%', height: h, borderRadius: '6px 6px 0 0', cursor: 'pointer',
                background: isHovered ? 'linear-gradient(180deg, #22c55e, #16a34a)' : 'linear-gradient(180deg, #22c55e88, #059669aa)',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: isHovered ? '0 0 24px #22c55e30' : 'none',
              }} />
              <span style={{ position: 'absolute', bottom: -32, fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', width: '100%' }}>R{i + 1}</span>
            </div>
          );
        })}
        <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
          onMouseEnter={() => setHovered('total')} onMouseLeave={() => setHovered(null)}>
          {hovered === 'total' && (
            <div style={{ position: 'absolute', bottom: 200, left: '50%', transform: 'translateX(-50%)',
              background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 16px',
              minWidth: 180, zIndex: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <p style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Total Package</p>
              <p style={{ color: '#38bdf8', fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>£{totalBenefit.toLocaleString()}/yr</p>
              <p style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>Investment: £{totalCost.toLocaleString()}</p>
            </div>
          )}
          <div style={{
            width: '100%', height: 180, borderRadius: '6px 6px 0 0', cursor: 'pointer',
            background: hovered === 'total' ? 'linear-gradient(180deg, #38bdf8, #0284c7)' : 'linear-gradient(180deg, #38bdf888, #0284c7aa)',
            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: hovered === 'total' ? '0 0 24px #38bdf830' : 'none',
          }} />
          <span style={{ position: 'absolute', bottom: -32, fontSize: 9, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, textAlign: 'center', width: '100%' }}>TOTAL</span>
        </div>
      </div>
    </div>
  );
}

// ─── Score Ring (legacy; HealthRing used for vitalise sections) ────────────────

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
      <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" style={{ color: '#22c55e' }} />
          <p style={{ color: '#94a3b8' }}>Loading your Systems Audit report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>Report not available yet.</p>
          <button onClick={() => navigate('/dashboard')}
            style={{ color: '#38bdf8', fontWeight: 500 }}
            className="hover:underline">
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
    <div style={{ background: '#020617', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes scrollBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
      `}</style>
      {/* ─── Sticky Navigation ──────────────────────────────────────── */}
      <div className="sticky top-0 z-40 backdrop-blur-sm border-b border-[#1e293b]" style={{ background: 'rgba(2, 6, 23, 0.9)' }}>
        <div className={`${contained} py-2.5 flex items-center gap-4`}>
          <button onClick={() => navigate('/dashboard')}
            className="flex-shrink-0 transition-colors"
            style={{ color: '#475569' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                    activeSection === item.id
                      ? 'border-[#1e293b]'
                      : 'border-transparent'
                  }`}
                  style={activeSection === item.id ? { color: '#e2e8f0', borderBottomColor: '#1e293b' } : { color: '#64748b' }}>
                  <Icon className="w-3 h-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="h-0.5" style={{ background: '#1e293b' }}>
          <div className="h-full transition-all duration-150" style={{ width: `${scrollProgress}%`, background: '#334155' }} />
        </div>
      </div>

      <div className="space-y-0">

        {/* ═══ SECTION 1: HERO (full-viewport cinematic) ═══ */}
        <div ref={sectionRefs.hero} className="scroll-mt-16" data-section-id="hero">
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '40px 24px' }}>
            <div style={{ position: 'absolute', top: '20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
              <Reveal>
                <div style={{ fontSize: 11, letterSpacing: 4, color: '#64748b', textTransform: 'uppercase', marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}>
                  Systems Audit Report
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 32, maxWidth: 800, color: '#e2e8f0' }}>
                  Your systems are costing you <span style={{ color: '#ef4444' }}><AnimatedCounter target={m.annualCostOfChaos} prefix="£" /></span> a year — and it gets worse at scale.
                </h1>
              </Reveal>
              <Reveal delay={0.25}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 700 }}>
                  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
                      <AnimatedCounter target={m.annualCostOfChaos} prefix="£" />
                    </p>
                    <p style={{ fontSize: 11, color: '#64748b' }}>Annual Cost of Chaos</p>
                  </div>
                  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
                      <AnimatedCounter target={m.hoursWastedWeekly} decimals={1} />
                    </p>
                    <p style={{ fontSize: 11, color: '#64748b' }}>Hours Lost Weekly</p>
                  </div>
                  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
                      <AnimatedCounter target={m.projectedCostAtScale} prefix="£" />
                    </p>
                    <p style={{ fontSize: 11, color: '#64748b' }}>At {m.growthMultiplier}x Growth</p>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.4}>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: '#ef4444', animation: 'pulse 2s ease infinite' }} />
                  Wasted since you opened this report: <CostClock annualCost={m.annualCostOfChaos} />
                </div>
              </Reveal>
            </div>
            <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: 24, height: 40, border: '2px solid #334155', borderRadius: 12, display: 'flex', justifyContent: 'center', paddingTop: 8, margin: '0 auto' }}>
                <div style={{ width: 3, height: 8, borderRadius: 2, background: '#64748b', animation: 'scrollBounce 2s ease infinite' }} />
              </div>
              <p style={{ fontSize: 10, color: '#475569', marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>Scroll to explore</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
            <Reveal>
              <div style={{ fontSize: 11, letterSpacing: 3, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>In Brief</div>
              <div style={{ maxWidth: 720 }}>
                {(report.executive_summary || '').split('\n\n').map((para: string, i: number) => (
                  <p key={i} style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', color: '#cbd5e1', lineHeight: 1.7, marginBottom: 20 }}>{para}</p>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Your Business */}
          {(facts.teamSize || facts.revenueBand || facts.confirmedRevenue || facts.industry) && (
            <div ref={sectionRefs.business} style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }} data-section-id="business">
              <Reveal>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>Your Business</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
                    {facts.teamSize && (
                      <div>
                        <p style={{ fontSize: 11, color: '#64748b' }}>Team Size</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{facts.teamSize} people</p>
                        {facts.projectedTeamSize && <p style={{ fontSize: 11, color: '#64748b' }}>→ {facts.projectedTeamSize} planned</p>}
                      </div>
                    )}
                    {(facts.confirmedRevenue || facts.revenueBand) && (
                      <div>
                        <p style={{ fontSize: 11, color: '#64748b' }}>Revenue</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>
                          {facts.confirmedRevenue ? String(facts.confirmedRevenue) :
                           facts.revenueBand === '1m_2m' ? '£1-2m' :
                           facts.revenueBand === '500k_1m' ? '£500k-1m' :
                           facts.revenueBand === '2m_5m' ? '£2-5m' :
                           facts.revenueBand === '5m_10m' ? '£5-10m' :
                           facts.revenueBand === '250k_500k' ? '£250-500k' :
                           facts.revenueBand === '10m_plus' ? '£10m+' :
                           String(facts.revenueBand || '')}
                        </p>
                      </div>
                    )}
                    {facts.industry && (
                      <div>
                        <p style={{ fontSize: 11, color: '#64748b' }}>Industry</p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>{facts.industry}</p>
                      </div>
                    )}
                    {facts.totalSystemCost > 0 && (
                      <div>
                        <p style={{ fontSize: 11, color: '#64748b' }}>Monthly Software</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>£{facts.totalSystemCost}/mo</p>
                      </div>
                    )}
                  </div>
                  {facts.desiredOutcomes && facts.desiredOutcomes.length > 0 && (
                    <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 12, padding: 16 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>What You Want</p>
                      <div className="space-y-2">
                        {facts.desiredOutcomes.map((outcome: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <Target className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                            <p style={{ fontSize: 12, color: '#c4b5fd', lineHeight: 1.4 }}>{displayOutcome(outcome)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
          )}
        </div>

        {/* ═══ SECTION 2: SYSTEMS + HEALTH ═══ */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
          <div className="lg:flex lg:gap-10">
            {facts.systems && facts.systems.length > 0 && (
              <div ref={sectionRefs.systems} className="scroll-mt-16 lg:flex-1" data-section-id="systems">
                <Reveal>
                  <div style={{ fontSize: 11, letterSpacing: 3, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>Your Systems Today</div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>{(facts.systems || []).length} systems</h2>
                  <div className="flex flex-wrap items-center gap-3 mb-4" style={{ color: '#94a3b8', fontSize: 14 }}>
                    <span><span style={{ fontWeight: 600, color: '#e2e8f0' }}>{facts.systems.length}</span> systems</span>
                    <span style={{ color: '#475569' }}>·</span>
                    <span style={{ color: '#ef4444' }}><span style={{ fontWeight: 600 }}>{facts.disconnectedSystems?.length || 0}</span> disconnected</span>
                    <span style={{ color: '#475569' }}>·</span>
                    <span><span style={{ fontWeight: 600, color: '#e2e8f0' }}>£{facts.totalSystemCost || 0}</span>/month total</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {facts.systems.map((sys: any, i: number) => (
                      <div key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 500, border: '1px solid',
                        ...(sys.gaps?.length > 1 ? { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' } :
                           sys.gaps?.length === 1 ? { background: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.4)', color: '#fde047' } :
                           { background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.4)', color: '#86efac' })
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: 'currentColor' }} />
                        {sys.name}
                        <span style={{ opacity: 0.7 }}>£{sys.monthlyCost || 0}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setSystemsExpanded(!systemsExpanded)} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }} className="flex items-center gap-1">
                    {systemsExpanded ? 'Collapse' : 'View all systems'}
                    {systemsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {systemsExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-6" style={{ borderTop: '1px solid #1e293b' }}>
                      {facts.systems.map((sys: any, i: number) => (
                        <Reveal key={i} delay={i * 0.05}>
                          <div style={{
                            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16,
                            ...(sys.criticality === 'critical' ? { borderColor: 'rgba(139,92,246,0.4)' } : sys.criticality === 'important' ? { borderColor: 'rgba(59,130,246,0.4)' } : {}),
                          }}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <IntegrationDot method={sys.integrationMethod} />
                                <h4 style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{sys.name}</h4>
                              </div>
                              <span style={{ fontSize: 11, color: '#64748b' }}>£{sys.monthlyCost || 0}/mo</span>
                            </div>
                            <div className="flex items-center gap-3 mb-2 text-xs" style={{ color: '#64748b' }}>
                              <span>Quality: <span style={{ fontWeight: 600 }}>{sys.dataQuality}/5</span></span>
                              <span>Satisfaction: <span style={{ fontWeight: 600 }}>{sys.userSatisfaction}/5</span></span>
                            </div>
                            {sys.gaps && sys.gaps.length > 0 && (
                              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #1e293b' }}>
                                {sys.gaps.slice(0, 2).map((gap: string, j: number) => (
                                  <p key={j} className="text-xs flex items-start gap-1 mb-0.5" style={{ color: '#fca5a5' }}>
                                    <Minus className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    {gap}
                                  </p>
                                ))}
                              </div>
                            )}
                            {sys.strengths && sys.strengths.length > 0 && (
                              <div className="mt-1">
                                {sys.strengths.slice(0, 2).map((s: string, j: number) => (
                                  <p key={j} className="text-xs flex items-start gap-1 mb-0.5" style={{ color: '#86efac' }}>
                                    <Plus className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    {s}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  )}
                </Reveal>
              </div>
            )}
            <div ref={sectionRefs.health} className="scroll-mt-16 lg:w-[380px] flex-shrink-0 mt-8 lg:mt-0" data-section-id="health">
              <Reveal delay={0.1}>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}>
                  <div style={{ fontSize: 11, letterSpacing: 3, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>Operations Health</div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 24 }}>System Health at a Glance</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, justifyItems: 'center' }}>
                    <HealthRing score={m.integrationScore} label="Integration" evidence={m.integrationEvidence} delay={0} />
                    <HealthRing score={m.automationScore} label="Automation" evidence={m.automationEvidence} delay={0.1} />
                    <HealthRing score={m.dataAccessibilityScore} label="Data Access" evidence={m.dataAccessibilityEvidence} delay={0.2} />
                    <HealthRing score={m.scalabilityScore} label="Scalability" evidence={m.scalabilityEvidence} delay={0.3} />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3: COST OF CHAOS ═══ */}
        <div ref={sectionRefs.chaos} className="scroll-mt-16" data-section-id="chaos" style={{ background: 'linear-gradient(180deg, #020617 0%, #1a0505 50%, #020617 100%)', padding: '80px 24px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <Reveal>
              <div style={{ fontSize: 11, letterSpacing: 3, color: '#ef4444', textTransform: 'uppercase', marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}>The Cost of Standing Still</div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="lg:flex lg:gap-8 mb-6">
                <div className="lg:flex-1 max-w-prose">
                  {(() => {
                    const paragraphs = (report.cost_of_chaos_narrative || '').split('\n\n');
                    const visible = chaosExpanded ? paragraphs : paragraphs.slice(0, 2);
                    return (
                      <>
                        {visible.map((para: string, i: number) => (
                          <p key={i} style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: 16, fontSize: 16 }}>{para}</p>
                        ))}
                        {paragraphs.length > 2 && (
                          <button onClick={() => setChaosExpanded(!chaosExpanded)} style={{ color: '#f87171', fontSize: 14 }} className="flex items-center gap-1 mt-2">
                            {chaosExpanded ? <>Show less <ChevronUp className="w-4 h-4" /></> : <>Read more <ChevronDown className="w-4 h-4" /></>}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="lg:w-48 flex-shrink-0 mt-6 lg:mt-0">
                  <div style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#f87171', textTransform: 'uppercase', marginBottom: 8 }}>Annual Cost</p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>{fmt(m.annualCostOfChaos)}</p>
                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: 12, marginTop: 12 }}>
                      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>At {m.growthMultiplier}x</p>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#f97316' }}>{fmt(m.projectedCostAtScale)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
            {processes.length > 0 && (
              <Reveal delay={0.2}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {processes.map((proc: any, i: number) => (
                    <div key={i} style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 16 }}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{proc.chainName}</h4>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '4px 10px', borderRadius: 9999 }}>
                          {proc.hoursWasted}h/mo wasted
                        </span>
                      </div>
                      {proc.keyPainPoints?.[0] && (
                        <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.5 }}>&quot;{proc.keyPainPoints[0]}&quot;</p>
                      )}
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
            <Reveal delay={0.3}>
              <div style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 20 }}>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 mt-0.5 text-red-400 flex-shrink-0" />
                  <div>
                    <p style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>The Scaling Danger</p>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>
                      At {m.growthMultiplier}x your current size, these same gaps will cost <span style={{ fontWeight: 700, color: '#fff' }}>{fmtFull(m.projectedCostAtScale)}/year</span>. The chaos doesn&apos;t scale linearly — it compounds.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ═══ SECTION 4: PROCESS ANALYSIS ═══ */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
        {processes.length > 0 && (
          <div ref={sectionRefs.processes} className="scroll-mt-16" data-section-id="processes">
            <Reveal>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>Process Analysis</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{processes.length} process chains</h2>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                  Total: {processes.reduce((s: number, p: any) => s + (p.hoursWasted || 0), 0)} hours/month wasted.
                </p>
                <div className="space-y-3">
                  {processes.map((proc: any) => (
                    <div key={proc.chainCode} style={{ border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
                      <button onClick={() => setExpandedProcess(expandedProcess === proc.chainCode ? null : proc.chainCode)}
                        className="w-full px-5 py-4 flex items-center gap-4 text-left transition-colors" style={{ background: 'transparent' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(139,92,246,0.2)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ChainIcon code={proc.chainCode} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{proc.chainName}</p>
                          <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{proc.criticalGaps?.length || 0} critical gaps</p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '4px 10px', borderRadius: 8 }}>{proc.hoursWasted}h/mo</span>
                        {expandedProcess === proc.chainCode ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      </button>
                      {expandedProcess === proc.chainCode && (
                        <div className="px-5 pb-5 pt-2 space-y-4" style={{ borderTop: '1px solid #1e293b' }}>
                          {proc.criticalGaps && proc.criticalGaps.length > 0 && (
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Critical Gaps</p>
                              {proc.criticalGaps.map((gap: string, j: number) => (
                                <p key={j} className="text-sm flex items-start gap-2 mb-1.5" style={{ color: '#94a3b8' }}>
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                  {gap}
                                </p>
                              ))}
                            </div>
                          )}
                          {proc.clientQuotes && proc.clientQuotes.length > 0 && (
                            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: 16 }}>
                              {proc.clientQuotes.slice(0, 3).map((q: string, j: number) => (
                                <div key={j} className="flex gap-2 mb-2 last:mb-0">
                                  <Quote className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                  <p style={{ fontSize: 13, color: '#c4b5fd', fontStyle: 'italic' }}>&quot;{q}&quot;</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {proc.specificMetrics && Object.keys(proc.specificMetrics).length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(proc.specificMetrics).filter(([_, v]) => v != null).slice(0, 6).map(([key, value]) => (
                                <div key={key} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 10 }}>
                                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{String(value)}</p>
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
            </Reveal>
          </div>
        )}
        </div>

        {/* ═══ SECTION 5: WHAT WE FOUND (Severity Dot Grid) ═══ */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
        <div ref={sectionRefs.findings} className="scroll-mt-16" data-section-id="findings">
          <Reveal>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              {displayFindings.length} Findings
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>What We Found</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>({criticalCount} critical, {highCount} high) — Click any dot to explore</p>
          </Reveal>
          <Reveal delay={0.1}>
            <SeverityDotGrid findings={displayFindings} displayOutcomeFn={displayOutcome} />
          </Reveal>
        </div>
        </div>

        {/* ═══ TECH MAP (wrapper only — SystemsMapSection unchanged) ═══ */}
        {(systemsMaps?.length > 0 || (facts?.systems && facts.systems.length > 0)) && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
          <div ref={sectionRefs.techmap} className="scroll-mt-16" data-section-id="techmap">
            <Reveal>
              <div style={{ fontSize: 11, letterSpacing: 3, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                Technology Roadmap
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                From Chaos to Connected
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <SystemsMapSection systemsMaps={systemsMaps} facts={facts} layout="split" />
            </Reveal>
          </div>
        </div>
        )}

        {/* ═══ IMPLEMENTATION ROADMAP ═══ */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
          {displayRecs.length > 0 && (
            <div ref={sectionRefs.roadmap} className="scroll-mt-16" data-section-id="roadmap">
            <Reveal>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>Implementation Roadmap</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{displayRecs.length} recommendations</h2>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
                Phased by impact. Combined: <span style={{ fontWeight: 600, color: '#22c55e' }}>{fmtFull(totalBenefit)}/year</span> benefit, <span style={{ fontWeight: 600, color: '#22c55e' }}>{totalHoursSaved}h/week</span> saved.
              </p>

              <div className="space-y-6">
                {phaseOrder.filter(phase => recsByPhase[phase]).map((phase) => (
                <div key={phase}>
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <PhaseBadge phase={phase} />
                    <span style={{ fontSize: 12, color: '#64748b' }}>
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
                        <div key={rid} style={{
                          background: '#0f172a',
                          border: `1px solid ${expandedRec === rid ? '#334155' : '#1e293b'}`,
                          borderRadius: 12,
                          overflow: 'hidden',
                          transition: 'border-color 0.2s',
                        }}>
                          <button onClick={() => setExpandedRec(expandedRec === rid ? null : rid)}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors" style={{ background: 'transparent' }}>
                            <div style={{ width: 24, height: 24, borderRadius: 12, background: '#334155', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {rec.priorityRank || rec.priority_rank || idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ fontWeight: 500, color: '#e2e8f0', fontSize: 14, lineHeight: 1.3 }}>{rec.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {benefit > 0 && (
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>{fmt(benefit)}/yr</span>
                                )}
                                <span style={{ fontSize: 12, color: '#64748b' }}>{hours}h/wk</span>
                              </div>
                            </div>
                            {expandedRec === rid
                              ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />
                              : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />}
                          </button>

                          {expandedRec === rid && (
                            <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: '1px solid #1e293b' }}>
                              {rec.description && <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{rec.description}</p>}

                              <div className="grid grid-cols-2 gap-2">
                                <div style={{ background: '#1e293b', borderRadius: 8, padding: 10 }}>
                                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Investment</p>
                                  <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{cost > 0 ? fmtFull(cost) : '£0'}</p>
                                </div>
                                <div style={{ background: '#22c55e15', borderRadius: 8, padding: 10, border: '1px solid #22c55e30' }}>
                                  <p style={{ fontSize: 10, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Annual Benefit</p>
                                  <p style={{ fontWeight: 600, color: '#22c55e', fontSize: 14 }}>{fmtFull(benefit)}</p>
                                </div>
                                <div style={{ background: '#22c55e15', borderRadius: 8, padding: 10, border: '1px solid #22c55e30' }}>
                                  <p style={{ fontSize: 10, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hours Saved</p>
                                  <p style={{ fontWeight: 600, color: '#22c55e', fontSize: 14 }}>{hours}h/week</p>
                                </div>
                                <div style={{ background: '#38bdf815', borderRadius: 8, padding: 10, border: '1px solid #38bdf830' }}>
                                  <p style={{ fontSize: 10, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payback</p>
                                  <p style={{ fontWeight: 600, color: '#38bdf8', fontSize: 14 }}>{fmtPayback(payback)}</p>
                                </div>
                              </div>

                              {(rec.goalsAdvanced || []).length > 0 && (
                                <div className="flex gap-1.5 flex-wrap">
                                  {(rec.goalsAdvanced || []).map((g: string, j: number) => (
                                    <span key={j} style={{ fontSize: 10, color: '#c4b5fd', background: '#8b5cf620', padding: '2px 8px', borderRadius: 9999, border: '1px solid #8b5cf640' }}>
                                      ✓ {g}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {(rec.freedomUnlocked || rec.freedom_unlocked) && (
                                <div style={{ background: '#8b5cf615', border: '1px solid #8b5cf630', borderRadius: 8, padding: 12, display: 'flex', gap: 8 }}>
                                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#a78bfa', marginTop: 2 }} />
                                  <p style={{ fontSize: 12, color: '#c4b5fd', lineHeight: 1.5 }}>
                                    {rec.freedomUnlocked || rec.freedom_unlocked}
                                  </p>
                                </div>
                              )}

                              {(rec.findingsAddressed || []).length > 0 && (
                                <div>
                                  <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Addresses</p>
                                  {(rec.findingsAddressed || []).map((f: string, j: number) => (
                                    <p key={j} style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 2 }}>
                                      <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#64748b' }} />
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
            </Reveal>
          </div>
          )}
        </div>

        {/* ═══ QUICK WINS ═══ */}
        {quickWins.length > 0 && (
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
          <div ref={sectionRefs.quickwins} className="scroll-mt-16" data-section-id="quickwins">
            <Reveal>
              <div style={{ fontSize: 11, letterSpacing: 3, color: '#eab308', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>Quick Wins</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Start This Week</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
                {quickWins.length} actions, £0 cost — {quickWins.reduce((s: number, q: any) => s + (parseFloat(q.hoursSavedWeekly) || 0), 0)} hours/week saved.
              </p>
            </Reveal>
              <div className="space-y-4">
                {quickWins.map((qw: any, i: number) => (
                  <Reveal key={i} delay={i * 0.08}>
                  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedQW(expandedQW === i ? null : i)}
                      className="w-full px-5 py-4 flex items-center gap-3 text-left transition-colors"
                      style={{ background: 'transparent' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: 'linear-gradient(135deg, #eab30820, #eab30810)', border: '1px solid #eab30830', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, color: '#eab308', fontSize: 16, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{qw.title}</p>
                        {qw.impact && <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{qw.impact}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>
                          +{qw.hoursSavedWeekly}h/wk
                        </span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{qw.timeToImplement}</span>
                        {expandedQW === i
                          ? <ChevronUp className="w-4 h-4" style={{ color: '#64748b' }} />
                          : <ChevronDown className="w-4 h-4" style={{ color: '#64748b' }} />}
                      </div>
                    </button>

                    {expandedQW === i && (
                      <div className="px-5 pb-4 pt-1 space-y-3" style={{ borderTop: '1px solid #1e293b' }}>
                        {qw.action && <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{qw.action}</p>}
                        {qw.impact && (
                          <div style={{ background: '#22c55e15', border: '1px solid #22c55e30', borderRadius: 8, padding: 12 }}>
                            <p style={{ fontSize: 10, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Impact</p>
                            <p style={{ fontSize: 14, color: '#86efac' }}>{qw.impact}</p>
                          </div>
                        )}
                        {qw.systems && qw.systems.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {qw.systems.map((sys: string, j: number) => (
                              <span key={j} style={{ fontSize: 12, background: '#1e293b', color: '#94a3b8', padding: '4px 10px', borderRadius: 6 }}>{sys}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  </Reveal>
                ))}
              </div>
          </div>
          </div>
        )}

        {/* ═══ INVESTMENT & ROI ═══ */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
        <div ref={sectionRefs.investment} className="scroll-mt-16" data-section-id="investment">
          <Reveal>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>Return on Investment</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Investment & Return</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Hover each bar to see recommendation detail</p>
          </Reveal>
          {displayRecs.length > 0 && (
            <Reveal delay={0.1}>
              <ROIWaterfall recommendations={displayRecs} />
            </Reveal>
          )}
          <Reveal delay={0.2}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 48, marginBottom: 32 }}>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Total Investment</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#f97316', fontFamily: "'JetBrains Mono', monospace" }}>{totalInvestment > 0 ? fmtFull(totalInvestment) : '£0'}</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{totalInvestment > 0 ? 'One-time + annual' : 'Process fixes only'}</p>
              </div>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Annual Benefit</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>{fmtFull(totalBenefit)}</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{totalHoursSaved}h/week back</p>
              </div>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Payback</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>{fmtPayback(m.paybackMonths)}</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Time to break even</p>
              </div>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>ROI (Year 1)</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#a78bfa', fontFamily: "'JetBrains Mono', monospace" }}>
                  {totalInvestment > 0 ? `${Math.round(totalBenefit / totalInvestment)}:1` : '∞'}
                </p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>3yr: {totalInvestment > 0 ? `${Math.round(totalBenefit * 3 / totalInvestment)}:1` : '∞'}</p>
              </div>
            </div>
          </Reveal>

            {/* Per-recommendation table */}
            {displayRecs.length > 0 && (
              <Reveal delay={0.25}>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b', background: '#1e293b' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recommendation</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cost</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Benefit/yr</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hrs/wk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecs.map((rec: any, i: number) => {
                      const benefit = rec.annualBenefit || rec.annual_cost_savings || 0;
                      const cost = rec.estimatedCost || rec.estimated_cost || 0;
                      const hours = parseFloat(rec.hoursSavedWeekly || rec.hours_saved_weekly) || 0;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '10px 16px', color: '#94a3b8' }}>
                            <div className="flex items-center gap-2">
                              <PhaseBadge phase={rec.implementationPhase || rec.implementation_phase || ''} />
                              <span style={{ fontSize: 13 }}>{rec.title}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#e2e8f0', fontWeight: 500 }}>{cost > 0 ? fmtFull(cost) : '£0'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#22c55e', fontWeight: 500 }}>{fmtFull(benefit)}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#94a3b8' }}>{hours}h</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: '#1e293b', fontWeight: 600 }}>
                      <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>Total</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#e2e8f0' }}>{totalInvestment > 0 ? fmtFull(totalInvestment) : '£0'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#22c55e' }}>{fmtFull(totalBenefit)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#e2e8f0' }}>{totalHoursSaved}h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </Reveal>
            )}
        </div>
        </div>

        {/* ═══ YOUR MONDAY MORNING ═══ */}
        <div ref={sectionRefs.monday} className="scroll-mt-16" data-section-id="monday" style={{
          background: 'linear-gradient(180deg, #020617 0%, #0c1a0e 40%, #065f4620 100%)',
          padding: '100px 24px 80px',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: '30%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #22c55e08 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
            <Reveal>
              <div style={{ fontSize: 11, letterSpacing: 3, color: '#22c55e', textTransform: 'uppercase', marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}>Your Monday Morning</div>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 32, color: '#e2e8f0' }}>
                Ready to Reclaim <span style={{ color: '#22c55e' }}>{totalHoursSaved} Hours</span> Every Week?
              </h2>
            </Reveal>

            {facts.mondayMorningVision && (
              <Reveal delay={0.1}>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderLeft: '4px solid #8b5cf6', borderRadius: 12, padding: 24, marginBottom: 32 }}>
                  <div className="flex gap-3">
                    <Quote className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#a78bfa' }} />
                    <div>
                      <p style={{ color: '#c4b5fd', fontSize: 'clamp(16px, 2vw, 18px)', fontStyle: 'italic', lineHeight: 1.7, fontFamily: "'Playfair Display', serif" }}>
                        &quot;{facts.mondayMorningVision}&quot;
                      </p>
                      <p style={{ color: '#64748b', fontSize: 12, marginTop: 12 }}>— You said this. Here&apos;s how we make it real.</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            <Reveal delay={0.15}>
              <div style={{ maxWidth: 720, marginBottom: 32 }}>
                {(report.time_freedom_narrative || '').split('\n\n').map((para: string, i: number) => (
                  <p key={i} style={{ color: '#cbd5e1', lineHeight: 1.75, marginBottom: 20, fontSize: 'clamp(15px, 2vw, 17px)' }}>{para}</p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40, paddingTop: 32, borderTop: '1px solid #1e293b' }}>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                  <p style={{ fontSize: 32, fontWeight: 700, color: '#22c55e', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{totalHoursSaved}h</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Saved per Week</p>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                  <p style={{ fontSize: 32, fontWeight: 700, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{fmtFull(totalBenefit)}</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Annual Benefit</p>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                  <p style={{ fontSize: 32, fontWeight: 700, color: '#a78bfa', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{fmtPayback(m.paybackMonths)}</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Payback</p>
                </div>
              </div>
            </Reveal>

            {displayRecs.filter((r: any) => r.freedomUnlocked || r.freedom_unlocked).length > 0 && (
              <Reveal delay={0.25}>
                <div style={{ paddingTop: 24, borderTop: '1px solid #1e293b' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}>How Each Step Gets You There</p>
                  <div className="space-y-3">
                    {displayRecs.filter((r: any) => r.freedomUnlocked || r.freedom_unlocked).map((rec: any, i: number) => {
                      const text = rec.freedomUnlocked || rec.freedom_unlocked;
                      const parts = text.split(/\.\s+/).filter(Boolean);
                      const firstSentence = parts.length > 0 ? parts.slice(0, 2).join('. ') + (parts.length >= 2 ? '.' : '') : text;
                      const hasMore = parts.length > 2;
                      const isOpen = expandedFreedom === i;
                      return (
                        <div key={i} style={{ background: '#22c55e08', border: '1px solid #22c55e20', borderRadius: 10, padding: 14 }}>
                          <div className="flex gap-3">
                            <div style={{ width: 24, height: 24, borderRadius: 12, background: '#22c55e20', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {rec.priorityRank || i + 1}
                            </div>
                            <div className="flex-1">
                              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
                                {isOpen ? text : firstSentence}
                              </p>
                              {hasMore && (
                                <button
                                  onClick={() => setExpandedFreedom(isOpen ? null : i)}
                                  style={{ fontSize: 12, color: '#22c55e', marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
              </Reveal>
            )}
          </div>
        </div>

        {/* ═══ NEXT STEPS / CTA ═══ */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 100px' }}>
        <div ref={sectionRefs.nextsteps} className="scroll-mt-16" data-section-id="nextsteps">
          <Reveal>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone className="w-4 h-4" style={{ color: '#a78bfa' }} />
                  Ready to Start?
                </h3>
                <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
                  Let&apos;s discuss these findings and build your implementation timeline.
                </p>
              </div>
              <button
                onClick={() => navigate('/appointments')}
                style={{
                  padding: '14px 32px',
                  fontSize: 16,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#020617',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  boxShadow: '0 0 40px #22c55e30',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Book a Call
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Reveal>
        </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}