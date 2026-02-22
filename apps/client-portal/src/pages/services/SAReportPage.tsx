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

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
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

// ─── RPGCC Colour System ─────────────────────────────────────────────────────
const COLORS = {
  navy: '#162340',
  navyLight: '#1e3156',
  blue: '#3B82F6',
  red: '#EF4444',
  orange: '#F59E0B',
  emerald: '#10B981',
  bg: '#F0F2F7',
  cardBg: 'rgba(255,255,255,0.72)',
  cardBorder: 'rgba(255,255,255,0.5)',
  cardShadow: '0 8px 32px rgba(22,35,64,0.08)',
  text: '#162340',
  textMuted: '#64748b',
  textLight: '#94a3b8',
};

const glassCard = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.5)',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(22,35,64,0.08)',
};

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

// ─── Health Ring (animated score ring; light-theme track, evidence always shown) ─
function HealthRing({ score, label, evidence, delay = 0 }: {
  score: number; label: string; evidence?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
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
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: `stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
        </div>
      </div>
      <p style={{ color: COLORS.text, fontWeight: 600, fontSize: 14, marginTop: 12, marginBottom: 4 }}>{label}</p>
      {evidence && (
        <p style={{ color: COLORS.textMuted, fontSize: 11, lineHeight: 1.5, maxWidth: 200, margin: '8px auto 0', padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)' }}>{evidence}</p>
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
            <span style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize', fontFamily: "'JetBrains Mono', monospace" }}>{sev}</span>
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
          <div style={{ ...glassCard, border: `1px solid ${c}40`, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: c, padding: '3px 10px', borderRadius: 6, background: `${c}15`, border: `1px solid ${c}30`, fontFamily: "'JetBrains Mono', monospace" }}>{f.severity}</span>
              {f.category && <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{(f.category || '').replace(/_/g, ' ')}</span>}
            </div>
            <h4 style={{ color: COLORS.text, fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{f.title}</h4>
            <p style={{ color: COLORS.textMuted, fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{f.description}</p>
            {(f.evidence && f.evidence.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>Evidence</span>
                {f.evidence.map((e: string, j: number) => (
                  <p key={j} style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4, paddingLeft: 12, borderLeft: `2px solid ${COLORS.textLight}` }}>{e}</p>
                ))}
              </div>
            )}
            {(f.client_quote || f.clientQuote) && (
              <div style={{ padding: '10px 14px', background: 'rgba(139,92,246,0.08)', borderRadius: 8, marginBottom: 16, borderLeft: '3px solid #8b5cf6' }}>
                <p style={{ color: COLORS.text, fontSize: 12, fontStyle: 'italic' }}>&quot;{f.client_quote || f.clientQuote}&quot;</p>
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
                  ...glassCard, padding: '12px 16px', minWidth: 200, zIndex: 10 }}>
                  <p style={{ color: COLORS.text, fontSize: 12, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{r.title}</p>
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
                      <span style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>SAVES</span>
                      <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700, margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>{hours}hrs/wk</p>
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
              ...glassCard, padding: '12px 16px', minWidth: 180, zIndex: 10 }}>
              <p style={{ color: COLORS.text, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Total Package</p>
              <p style={{ color: COLORS.blue, fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>£{totalBenefit.toLocaleString()}/yr</p>
              <p style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>Investment: £{totalCost.toLocaleString()}</p>
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
  const [activeSection, setActiveSection] = useState('overview');
  const [showScoreDetail, setShowScoreDetail] = useState<string | null>(null);
  const [systemsExpanded, setSystemsExpanded] = useState(false);
  const [expandedQW, setExpandedQW] = useState<number | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set(['overview']));
  const [transitioning, setTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleNavigate = useCallback((sectionId: string) => {
    if (sectionId === activeSection) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveSection(sectionId);
      setVisited((prev) => {
        const next = new Set(prev);
        next.add(sectionId);
        return next;
      });
      if (contentRef.current) contentRef.current.scrollTop = 0;
      setTimeout(() => setTransitioning(false), 50);
    }, 200);
  }, [activeSection]);

  const loadReportRef = useRef(0);
  useEffect(() => {
    if (!clientSession?.clientId) return;
    loadReportRef.current = 0;
    loadReport();
  }, [clientSession?.clientId]);

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

  const NAV_ITEMS: { id: string; label: string; icon: typeof BarChart3; section: string }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3, section: 'overview' },
    { id: 'systems', label: 'Systems', icon: Monitor, section: 'analysis' },
    { id: 'health', label: 'Health', icon: Activity, section: 'analysis' },
    { id: 'chaos', label: 'Cost', icon: DollarSign, section: 'analysis' },
    { id: 'processes', label: 'Processes', icon: Workflow, section: 'analysis' },
    { id: 'findings', label: 'Findings', icon: AlertTriangle, section: 'analysis' },
    { id: 'techmap', label: 'Tech Map', icon: Layers, section: 'roadmap' },
    { id: 'quickwins', label: 'Quick Wins', icon: Zap, section: 'action' },
    { id: 'roadmap', label: 'Roadmap', icon: CalendarClock, section: 'action' },
    { id: 'investment', label: 'ROI', icon: TrendingUp, section: 'action' },
    { id: 'monday', label: 'Vision', icon: Coffee, section: 'action' },
  ];
  const SECTION_GROUPS: Record<string, string> = {
    overview: 'Overview',
    analysis: 'Analysis',
    roadmap: 'Roadmap',
    action: 'Action',
  };

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: COLORS.emerald }} />
          <p style={{ color: COLORS.textMuted }}>Loading your Systems Audit report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center" style={{ ...glassCard, padding: 48 }}>
          <p style={{ color: COLORS.textMuted, marginBottom: 16 }}>Report not available yet.</p>
          <button onClick={() => navigate('/dashboard')}
            style={{ color: COLORS.blue, fontWeight: 500 }}
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

  // Sidebar component (fixed left, navy, grouped nav + progress)
  function SASidebar() {
    let lastGroup = '';
    return (
      <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 220, background: COLORS.navy, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', zIndex: 30 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, fontFamily: "'DM Sans', sans-serif" }}>RPGCC</span>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: COLORS.blue }} />
            <span style={{ width: 6, height: 6, borderRadius: 3, background: COLORS.red }} />
            <span style={{ width: 6, height: 6, borderRadius: 3, background: COLORS.orange }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>Systems Audit</p>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const showGroup = lastGroup !== item.section && (lastGroup = item.section);
            return (
              <div key={item.id}>
                {showGroup && (
                  <div style={{ padding: '8px 16px 4px', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                    {SECTION_GROUPS[item.section]}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', border: 'none', background: activeSection === item.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeSection === item.id ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', borderLeft: activeSection === item.id ? `3px solid ${COLORS.blue}` : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (activeSection !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { if (activeSection !== item.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {visited.has(item.id) && activeSection !== item.id && (
                    <span style={{ width: 18, height: 18, borderRadius: 9, background: COLORS.emerald, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>✓</span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>Progress</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{visited.size}/{NAV_ITEMS.length}</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(visited.size / NAV_ITEMS.length) * 100}%`, background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.emerald})`, borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </aside>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Hero banner */}
            <div style={{ background: 'linear-gradient(135deg, #162340 0%, #1e3a5f 50%, #1a3352 100%)', borderRadius: 20, padding: 40, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>Systems Audit Report</div>
                <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: '#fff', marginBottom: 24, lineHeight: 1.2 }}>
                  {report?.headline || `Your systems are costing you £${(m.annualCostOfChaos / 1000).toFixed(0)}k a year — and it gets worse at scale.`}
                </h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: COLORS.red, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}><AnimatedCounter target={m.annualCostOfChaos} prefix="£" /></p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Annual Cost</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: COLORS.orange, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}><AnimatedCounter target={m.hoursWastedWeekly} decimals={1} /></p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Hours Lost/Week</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: COLORS.blue, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{(facts?.systems || []).length}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Systems</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: '#8b5cf6', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}><AnimatedCounter target={m.projectedCostAtScale} prefix="£" /></p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>At Scale</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
              <div style={{ ...glassCard, padding: 28, maxWidth: '62ch' }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>In Brief</div>
                {(report?.executive_summary || '').split('\n\n').map((para: string, i: number) => (
                  <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: COLORS.text, marginBottom: 16 }}>{para}</p>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ ...glassCard, padding: 20, background: 'rgba(22,35,64,0.04)' }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>Your Business</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {facts?.teamSize && <div><span style={{ color: COLORS.textLight, fontSize: 12 }}>Team</span><p style={{ color: COLORS.text, fontWeight: 600 }}>{facts.teamSize}</p></div>}
                    {(facts?.confirmedRevenue ?? facts?.revenueBand) && <div><span style={{ color: COLORS.textLight, fontSize: 12 }}>Revenue</span><p style={{ color: COLORS.text, fontWeight: 600 }}>{typeof facts.confirmedRevenue === 'number' ? `£${(facts.confirmedRevenue / 1000).toFixed(0)}k` : facts.revenueBand || '-'}</p></div>}
                    {facts?.industry && <div><span style={{ color: COLORS.textLight, fontSize: 12 }}>Industry</span><p style={{ color: COLORS.text, fontWeight: 600 }}>{facts.industry}</p></div>}
                    {facts?.totalSystemCost != null && <div><span style={{ color: COLORS.textLight, fontSize: 12 }}>Software spend</span><p style={{ color: COLORS.text, fontWeight: 600 }}>{fmt(facts.totalSystemCost)}</p></div>}
                  </div>
                </div>
                {(facts?.desiredOutcomes?.length > 0) && (
                  <div style={{ ...glassCard, padding: 20, background: 'rgba(16,185,129,0.06)', border: `1px solid ${COLORS.emerald}20` }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>Desired Outcomes</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {(facts.desiredOutcomes || []).map((o: string, i: number) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: COLORS.text }}>
                          <CheckCircle2 style={{ width: 18, height: 18, color: COLORS.emerald, flexShrink: 0 }} />
                          {displayOutcome(o)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ ...glassCard, padding: 20, background: 'rgba(239,68,68,0.06)', border: `1px solid ${COLORS.red}20` }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>Live waste</div>
                  <CostClock annualCost={m.annualCostOfChaos} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'systems': {
        const systemsList = facts?.systems || [];
        return (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{systemsList.length} systems</h2>
              <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Summary stats and legend</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {systemsList.map((sys: any, i: number) => {
                const gapCount = (sys.gaps && sys.gaps.length) || 0;
                const borderColor = gapCount > 3 ? COLORS.red : gapCount > 1 ? COLORS.orange : gapCount === 1 ? '#eab308' : COLORS.blue;
                const initial = (sys.name || sys.system_name || '?').charAt(0).toUpperCase();
                return (
                  <div key={i} style={{ ...glassCard, padding: 16, borderLeft: `4px solid ${borderColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: `${borderColor}20`, color: borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{initial}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, color: COLORS.text }}>{sys.name || sys.system_name || 'System'}</p>
                        {sys.cost != null && <p style={{ fontSize: 12, color: COLORS.textMuted }}>{fmt(sys.cost)}</p>}
                      </div>
                      {sys.dataQualityScore != null && <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{sys.dataQualityScore}%</span>}
                    </div>
                    {(sys.gaps && sys.gaps.length > 0) && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${COLORS.cardBorder}` }}>
                        <p style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Gaps</p>
                        {(sys.gaps || []).map((g: string, j: number) => <p key={j} style={{ fontSize: 12, color: COLORS.red, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${COLORS.red}` }}>{g}</p>)}
                      </div>
                    )}
                    {(sys.strengths && sys.strengths.length > 0) && (
                      <div style={{ marginTop: 8 }}>
                        <p style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Strengths</p>
                        {(sys.strengths || []).map((s: string, j: number) => <p key={j} style={{ fontSize: 12, color: COLORS.emerald, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${COLORS.emerald}` }}>{s}</p>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'health': {
        const scores = p1?.scores || {};
        const scoreEntries = [
          { key: 'overall', label: 'Overall', score: scores.overall ?? clientPres?.overall ?? 0, evidence: scores.overallEvidence || clientPres?.overallEvidence },
          { key: 'integration', label: 'Integration', score: scores.integration ?? clientPres?.integration ?? 0, evidence: scores.integrationEvidence || clientPres?.integrationEvidence },
          { key: 'automation', label: 'Automation', score: scores.automation ?? clientPres?.automation ?? 0, evidence: scores.automationEvidence || clientPres?.automationEvidence },
          { key: 'visibility', label: 'Visibility', score: scores.visibility ?? clientPres?.visibility ?? 0, evidence: scores.visibilityEvidence || clientPres?.visibilityEvidence },
        ];
        return (
          <div>
            <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Health</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {scoreEntries.map(({ key, label, score, evidence }, i) => (
                <div key={key} style={{ ...glassCard, padding: 24, textAlign: 'center' }}>
                  <HealthRing score={Math.round(score)} label={label} evidence={evidence} delay={i * 0.1} />
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'chaos': {
        const chaosParas = (report?.cost_of_chaos_narrative || '').split('\n\n').filter(Boolean);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
              <div style={{ maxWidth: '62ch' }}>
                <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Cost of Chaos</h2>
                {chaosParas.map((para: string, i: number) => (
                  <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: COLORS.text, marginBottom: 16 }}>{para}</p>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ ...glassCard, padding: 20, background: 'rgba(239,68,68,0.06)', border: `1px solid ${COLORS.red}20` }}>
                  <p style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Annual Cost</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.red, fontFamily: "'JetBrains Mono', monospace" }}><AnimatedCounter target={m.annualCostOfChaos} prefix="£" /></p>
                </div>
                <div style={{ ...glassCard, padding: 20, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <p style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>At Scale</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6', fontFamily: "'JetBrains Mono', monospace" }}><AnimatedCounter target={m.projectedCostAtScale} prefix="£" /></p>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {(processes || []).map((proc: any, i: number) => {
                const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
                const borderColor = hours > 60 ? COLORS.red : hours > 30 ? COLORS.orange : COLORS.blue;
                return (
                  <div key={i} style={{ ...glassCard, padding: 16, borderLeft: `4px solid ${borderColor}` }}>
                    <div style={{ marginBottom: 8 }}><ChainIcon code={proc.chainCode || proc.chain_code || ''} /></div>
                    <p style={{ fontWeight: 600, color: COLORS.text }}>{proc.chainName || proc.chain_name || proc.chainCode}</p>
                    <p style={{ fontSize: 14, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{hours}h</p>
                  </div>
                );
              })}
            </div>
            {m.projectedCostAtScale > m.annualCostOfChaos && (
              <div style={{ ...glassCard, padding: 20, background: 'rgba(239,68,68,0.06)', border: `1px solid ${COLORS.red}30`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertTriangle style={{ width: 24, height: 24, color: COLORS.red, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>Scaling danger</p>
                  <p style={{ fontSize: 14, color: COLORS.textMuted }}>Projected cost at {m.growthMultiplier}x growth is £{(m.projectedCostAtScale / 1000).toFixed(0)}k — addressing chaos now reduces this risk.</p>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'processes': {
        const sortedProcesses = [...(processes || [])].sort((a: any, b: any) => (b.hoursWasted ?? b.hours_wasted ?? 0) - (a.hoursWasted ?? a.hours_wasted ?? 0));
        const totalProcHours = sortedProcesses.reduce((s: number, p: any) => s + (p.hoursWasted ?? p.hours_wasted ?? 0), 0);
        return (
          <div>
            <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{sortedProcesses.length} process chains</h2>
            <p style={{ color: COLORS.textMuted, marginBottom: 24 }}>Total {totalProcHours}h wasted weekly</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedProcesses.map((proc: any) => {
                const isExpanded = expandedProcess === (proc.chainCode || proc.chain_code);
                const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
                const borderColor = hours > 60 ? COLORS.red : hours > 30 ? COLORS.orange : COLORS.blue;
                return (
                  <div key={proc.chainCode || proc.chain_code} style={{ ...glassCard, borderLeft: `4px solid ${borderColor}`, overflow: 'hidden' }}>
                    <button type="button" onClick={() => setExpandedProcess(isExpanded ? null : (proc.chainCode || proc.chain_code))} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: `${borderColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChainIcon code={proc.chainCode || proc.chain_code || ''} /></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, color: COLORS.text }}>{proc.chainName || proc.chain_name || proc.chainCode}</p>
                        <p style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{hours}h/week</p>
                      </div>
                      {isExpanded ? <ChevronUp style={{ color: COLORS.textMuted }} /> : <ChevronDown style={{ color: COLORS.textMuted }} />}
                    </button>
                    {isExpanded && (
                      <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${COLORS.cardBorder}` }}>
                        <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {(proc.criticalGaps || proc.critical_gaps || []).length > 0 && (
                            <div>
                              <p style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Critical gaps</p>
                              {(proc.criticalGaps || proc.critical_gaps || []).map((g: string, j: number) => <p key={j} style={{ fontSize: 13, color: COLORS.red, marginBottom: 4 }}>{g}</p>)}
                            </div>
                          )}
                          {(proc.clientQuotes || proc.client_quotes || [])?.length > 0 && (proc.clientQuotes || proc.client_quotes).map((q: string, j: number) => (
                            <p key={j} style={{ fontSize: 13, fontStyle: 'italic', color: COLORS.textMuted }}>&quot;{q}&quot;</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'findings':
        return (
          <div>
            <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{displayFindings.length} Findings</h2>
            <p style={{ color: COLORS.textMuted, marginBottom: 24 }}>What We Found · Critical: {criticalCount} · High: {highCount}</p>
            <SeverityDotGrid findings={displayFindings} displayOutcomeFn={displayOutcome} />
          </div>
        );
      case 'techmap':
        return (systemsMaps?.length > 0 || (facts?.systems && facts.systems.length > 0)) ? (
          <SystemsMapSection systemsMaps={systemsMaps} facts={facts} layout="split" />
        ) : (
          <div style={{ ...glassCard, padding: 24 }}><h2 style={{ color: COLORS.text }}>Tech Map</h2><p style={{ color: COLORS.textMuted }}>No map data.</p></div>
        );
      case 'quickwins': {
        const qwList = quickWins || [];
        const totalQWHours = qwList.reduce((s: number, q: any) => s + (parseFloat(q.hoursSaved || q.hours_saved) || 0), 0);
        return (
          <div>
            <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Start This Week</h2>
            <p style={{ color: COLORS.textMuted, marginBottom: 24 }}>{qwList.length} quick wins · {totalQWHours}h saved</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {qwList.map((qw: any, i: number) => {
                const isExpanded = expandedQW === i;
                return (
                  <div key={i} style={{ ...glassCard, padding: 16 }}>
                    <button type="button" onClick={() => setExpandedQW(isExpanded ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: `${COLORS.emerald}20`, color: COLORS.emerald, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, color: COLORS.text }}>{qw.title || qw.action?.slice(0, 60) || 'Quick Win'}</p>
                        {qw.owner && <p style={{ fontSize: 12, color: COLORS.textMuted }}>{qw.owner}</p>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.emerald, fontFamily: "'JetBrains Mono', monospace" }}>+{qw.hoursSaved || qw.hours_saved || 0}h</p>
                        {qw.timeToImplement && <p style={{ fontSize: 11, color: COLORS.textMuted }}>{qw.timeToImplement}</p>}
                      </div>
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.cardBorder}` }}>
                        {qw.action && <p style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.6, marginBottom: 8 }}>{qw.action}</p>}
                        {qw.impact && <p style={{ fontSize: 13, color: COLORS.emerald, marginBottom: 8 }}>{qw.impact}</p>}
                        {(qw.systems || qw.systems_affected)?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(qw.systems || qw.systems_affected).map((sys: string, j: number) => (
                              <span key={j} style={{ fontSize: 11, background: 'rgba(0,0,0,0.06)', color: COLORS.textMuted, padding: '4px 8px', borderRadius: 6 }}>{sys}</span>
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
        );
      }
      case 'roadmap': {
        return (
          <div>
            <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Roadmap</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {phaseOrder.map((phaseKey) => {
                const recs = recsByPhase[phaseKey] || [];
                if (recs.length === 0) return null;
                return (
                  <div key={phaseKey}>
                    <div style={{ marginBottom: 12 }}><PhaseBadge phase={phaseKey} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {recs.map((rec: any) => {
                        const rid = rec.id || rec.title || String(rec.priorityRank);
                        const isExpanded = expandedRec === rid;
                        return (
                          <div key={rid} style={{ ...glassCard, border: `1px solid ${isExpanded ? COLORS.blue + '40' : COLORS.cardBorder}`, padding: 16 }}>
                            <button type="button" onClick={() => setExpandedRec(isExpanded ? null : rid)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                              <div style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(0,0,0,0.06)', color: COLORS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{rec.priorityRank ?? '-'}</div>
                              <span style={{ flex: 1, fontWeight: 600, color: COLORS.text }}>{rec.title}</span>
                              {isExpanded ? <ChevronUp /> : <ChevronDown />}
                            </button>
                            {isExpanded && (
                              <div style={{ paddingTop: 12, marginTop: 12, borderTop: `1px solid ${COLORS.cardBorder}` }}>
                                {rec.description && <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 12 }}>{rec.description}</p>}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                                  <div><span style={{ fontSize: 10, color: COLORS.textLight }}>Investment</span><p style={{ fontWeight: 600, color: COLORS.text }}>{fmt(rec.estimatedCost ?? rec.estimated_cost)}</p></div>
                                  <div><span style={{ fontSize: 10, color: COLORS.textLight }}>Benefit</span><p style={{ fontWeight: 600, color: COLORS.emerald }}>{fmt(rec.annualBenefit ?? rec.annual_cost_savings)}/yr</p></div>
                                  <div><span style={{ fontSize: 10, color: COLORS.textLight }}>Hours</span><p style={{ fontWeight: 600, color: COLORS.text }}>{rec.hoursSavedWeekly ?? rec.hours_saved_weekly ?? 0}h/wk</p></div>
                                  <div><span style={{ fontSize: 10, color: COLORS.textLight }}>Payback</span><p style={{ fontWeight: 600, color: COLORS.text }}>{fmtPayback(rec)}</p></div>
                                </div>
                                {(rec.goalsAdvanced || rec.goals_advanced)?.length > 0 && (
                                  <div style={{ marginBottom: 8 }}><span style={{ fontSize: 10, color: COLORS.textMuted }}>Goals advanced</span> {(rec.goalsAdvanced || rec.goals_advanced).map((g: string, j: number) => <span key={j} style={{ marginRight: 6, fontSize: 12, background: 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: 6 }}>{g}</span>)}</div>
                                )}
                                {(rec.freedomUnlocked || rec.freedom_unlocked) && <p style={{ fontSize: 13, color: COLORS.emerald, marginTop: 8 }}>{rec.freedomUnlocked || rec.freedom_unlocked}</p>}
                                {(rec.findingsAddressed || rec.findings_addressed)?.length > 0 && <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>Addresses: {(rec.findingsAddressed || rec.findings_addressed).join(', ')}</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'investment': {
        const roiRecs = displayRecs || [];
        const paybackMonths = totalInvestment > 0 ? (totalInvestment / (totalBenefit / 12)) : 0;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700 }}>ROI</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div style={{ ...glassCard, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Investment</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(totalInvestment)}</p>
              </div>
              <div style={{ ...glassCard, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Benefit</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.emerald, fontFamily: "'JetBrains Mono', monospace" }}>£{totalBenefit.toLocaleString()}/yr</p>
              </div>
              <div style={{ ...glassCard, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Payback</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{paybackMonths < 1 ? '<1 mo' : `${Math.round(paybackMonths)} mo`}</p>
              </div>
              <div style={{ ...glassCard, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>ROI</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.blue, fontFamily: "'JetBrains Mono', monospace" }}>{totalInvestment > 0 ? `${(totalBenefit / totalInvestment).toFixed(1)}:1` : '—'}</p>
              </div>
            </div>
            <ROIWaterfall recommendations={roiRecs} />
            <div style={{ ...glassCard, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: 'rgba(0,0,0,0.02)' }}>
                    <th style={{ textAlign: 'left', padding: 12, color: COLORS.textMuted, fontWeight: 600 }}>Phase</th>
                    <th style={{ textAlign: 'left', padding: 12, color: COLORS.textMuted, fontWeight: 600 }}>Title</th>
                    <th style={{ textAlign: 'right', padding: 12, color: COLORS.textMuted, fontWeight: 600 }}>Cost</th>
                    <th style={{ textAlign: 'right', padding: 12, color: COLORS.textMuted, fontWeight: 600 }}>Benefit</th>
                    <th style={{ textAlign: 'right', padding: 12, color: COLORS.textMuted, fontWeight: 600 }}>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {roiRecs.map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                      <td style={{ padding: 12, color: COLORS.text }}><PhaseBadge phase={r.implementationPhase || r.implementation_phase || 'short_term'} /></td>
                      <td style={{ padding: 12, color: COLORS.text }}>{r.title}</td>
                      <td style={{ padding: 12, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: COLORS.text }}>{fmt(r.estimatedCost ?? r.estimated_cost)}</td>
                      <td style={{ padding: 12, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: COLORS.emerald }}>£{(r.annualBenefit ?? r.annual_cost_savings ?? 0).toLocaleString()}</td>
                      <td style={{ padding: 12, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: COLORS.text }}>{r.hoursSavedWeekly ?? r.hours_saved_weekly ?? 0}h</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(0,0,0,0.03)', fontWeight: 600 }}>
                    <td style={{ padding: 12, color: COLORS.text }} colSpan={2}>Total</td>
                    <td style={{ padding: 12, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: COLORS.text }}>{fmt(totalInvestment)}</td>
                    <td style={{ padding: 12, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: COLORS.emerald }}>£{totalBenefit.toLocaleString()}</td>
                    <td style={{ padding: 12, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: COLORS.text }}>{totalHoursSaved}h</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      case 'monday': {
        const freedomRecs = displayRecs.filter((r: any) => r.freedomUnlocked || r.freedom_unlocked);
        const visionHeadline = `Ready to Reclaim ${totalHoursSaved} Hours Every Week?`;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700 }}>{visionHeadline}</h2>
            {(facts?.mondayMorningVision || facts?.monday_morning_vision) && (
              <div style={{ ...glassCard, padding: 24, background: 'rgba(22,35,64,0.04)', borderLeft: `4px solid ${COLORS.emerald}` }}>
                <p style={{ fontSize: 16, fontStyle: 'italic', color: COLORS.text, lineHeight: 1.7 }}>&quot;{facts.mondayMorningVision || facts.monday_morning_vision}&quot;</p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'start' }}>
              <div style={{ maxWidth: '62ch' }}>
                <p style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>How We Get There</p>
                {(report?.time_freedom_narrative || '').split('\n\n').map((para: string, i: number) => (
                  <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: COLORS.text, marginBottom: 12 }}>{para}</p>
                ))}
              </div>
              <div style={{ ...glassCard, padding: 20, textAlign: 'center' }}><p style={{ fontSize: 11, color: COLORS.textMuted }}>Hours/week</p><p style={{ fontSize: 22, fontWeight: 700, color: COLORS.emerald, fontFamily: "'JetBrains Mono', monospace" }}>{totalHoursSaved}</p></div>
              <div style={{ ...glassCard, padding: 20, textAlign: 'center' }}><p style={{ fontSize: 11, color: COLORS.textMuted }}>Benefit/yr</p><p style={{ fontSize: 22, fontWeight: 700, color: COLORS.emerald, fontFamily: "'JetBrains Mono', monospace" }}>£{(totalBenefit / 1000).toFixed(0)}k</p></div>
              <div style={{ ...glassCard, padding: 20, textAlign: 'center' }}><p style={{ fontSize: 11, color: COLORS.textMuted }}>Payback</p><p style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{totalInvestment > 0 && totalBenefit > 0 ? (totalInvestment / (totalBenefit / 12) < 1 ? '< 1 mo' : `${Math.round(totalInvestment / (totalBenefit / 12))} mo`) : '—'}</p></div>
            </div>
            {freedomRecs.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>Freedom stories</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {freedomRecs.map((rec: any, i: number) => (
                    <div key={i} style={{ ...glassCard, padding: 14, background: 'rgba(16,185,129,0.06)', border: `1px solid ${COLORS.emerald}20` }}>
                      <p style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.6 }}>{rec.freedomUnlocked || rec.freedom_unlocked}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ ...glassCard, padding: 24, background: `linear-gradient(135deg, ${COLORS.emerald}18, ${COLORS.blue}08)`, border: `1px solid ${COLORS.emerald}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 8 }}><Phone style={{ width: 20, height: 20, color: COLORS.emerald }} />Ready to Start?</h3>
                <p style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 4 }}>Let&apos;s discuss these findings and build your implementation timeline.</p>
              </div>
              <button type="button" onClick={() => navigate('/appointments')} style={{ padding: '14px 32px', fontSize: 16, fontWeight: 700, background: `linear-gradient(135deg, ${COLORS.emerald}, #059669)`, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: `0 0 24px ${COLORS.emerald}40`, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                Book a Call <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: COLORS.text, display: 'flex' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
      <SASidebar />
      <div
        ref={contentRef}
        className="sa-report-content"
        style={{
          marginLeft: 220, flex: 1, padding: '32px 40px', overflowY: 'auto', height: '100vh',
          opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(12px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Client header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingBottom: 24, marginBottom: 24, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button type="button" onClick={() => navigate('/dashboard')} style={{ color: COLORS.textMuted, padding: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} aria-label="Back to dashboard"><ArrowLeft style={{ width: 20, height: 20 }} /></button>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{facts?.clientName || report?.headline || 'Systems Audit Report'}</h1>
                <p style={{ fontSize: 13, color: COLORS.textMuted }}>
                  {[facts?.industry, facts?.teamSize && `Team: ${facts.teamSize}`, facts?.confirmedRevenue || facts?.revenueBand].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <CostClock annualCost={m.annualCostOfChaos} />
              <span style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                {report?.generated_at ? new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </span>
            </div>
          </div>
          <div key={activeSection} style={{ animation: 'fadeIn 0.4s ease' }}>
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}

