// ============================================================================
// SYSTEMS AUDIT CLIENT REPORT PAGE — DASHBOARD v4
// ============================================================================
// Client-facing report: Proof → Pattern → Price → Path → Plan → Future
// v4: Visual-only rewrite — immersive design system, scroll-reveal, premium cards.
// Data layer (resolveMetrics, Supabase, types, auth) UNCHANGED.
// GOLDEN RULE: pass1_data is the single source of truth for all metrics.
// ============================================================================

import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
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
  ChevronRight, Minus, Plus, ExternalLink, Layers,
  Play, FileText, Gauge, Timer, X, Rocket, Star,
  TrendingDown, CircleDot, Flame
} from 'lucide-react';
import SystemsMapSection from '@/components/SystemsMapSection';

// ─── Desired Outcomes ────────────────────────────────────────────────────────
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

// Smart paragraph splitter — works even without \n\n
function splitNarrative(text: string, maxParas: number = 3): string[] {
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

// ─── RPGCC Colour System ─────────────────────────────────────────────────────
const C = {
  navy: '#162340',
  navyLight: '#1e3156',
  blue: '#3B82F6',
  red: '#EF4444',
  orange: '#F59E0B',
  amber: '#f97316',
  emerald: '#10B981',
  purple: '#8b5cf6',
  bg: '#F0F2F7',
  cardBg: 'rgba(255,255,255,0.85)',
  cardBorder: 'rgba(0,0,0,0.06)',
  cardShadow: '0 1px 3px rgba(22,35,64,0.06), 0 8px 32px rgba(22,35,64,0.04)',
  text: '#162340',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  blueLight: '#60a5fa',
  emeraldLight: '#34d399',
  redLight: '#f87171',
  purpleLight: '#a78bfa',
  surface: '#ffffff',
  surfaceElevated: '#f8fafc',
};

// Shadow system
const SHADOW = {
  sm: '0 1px 2px rgba(22,35,64,0.06), 0 1px 3px rgba(22,35,64,0.1)',
  md: '0 4px 6px rgba(22,35,64,0.07), 0 2px 4px rgba(22,35,64,0.06), 0 10px 15px rgba(22,35,64,0.08)',
  lg: '0 10px 25px rgba(22,35,64,0.1), 0 6px 10px rgba(22,35,64,0.08), 0 20px 40px rgba(22,35,64,0.06)',
  glow: (color: string, intensity = 0.3) => `0 0 30px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
  colorMatch: (color: string) => `0 8px 24px ${color}25, 0 2px 8px ${color}15`,
};

const EASE = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
};

const DURATION = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  reveal: '600ms',
  counter: 2000,
  heroCounter: 2500,
};

const STAGGER = 70;

const TYPE = {
  heroMetric: { fontSize: 48, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
  sectionMetric: { fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
  cardMetric: { fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
  sectionTitle: { fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', color: C.text } as React.CSSProperties,
  cardTitle: { fontSize: 16, fontWeight: 600, color: C.text } as React.CSSProperties,
  body: { fontSize: 15, fontWeight: 400, lineHeight: 1.7, color: C.textSecondary } as React.CSSProperties,
  caption: { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const } as React.CSSProperties,
  label: { fontSize: 13, fontWeight: 500, color: C.textMuted } as React.CSSProperties,
};

// Glass card base (v4)
const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.82)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  borderRadius: 16,
  boxShadow: SHADOW.sm,
  transition: `transform ${DURATION.normal} ${EASE.out}, box-shadow ${DURATION.normal} ${EASE.out}`,
  ...extra,
});

const glassHover: React.CSSProperties = { transform: 'translateY(-3px) scale(1.005)', boxShadow: SHADOW.md };
const glassRest: React.CSSProperties = { transform: 'translateY(0) scale(1)', boxShadow: SHADOW.sm };

const accentCard = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  ...glass(),
  borderLeft: `4px solid ${color}`,
  background: `linear-gradient(135deg, ${color}06 0%, rgba(255,255,255,0.82) 100%)`,
  boxShadow: SHADOW.colorMatch(color),
  ...extra,
});

// Mono font helper
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const label: React.CSSProperties = { fontSize: 10, color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, ...mono };

// Content constraint wrapper
const sectionWrap: React.CSSProperties = {
  maxWidth: '100%',
  overflow: 'hidden',
  wordBreak: 'break-word' as const,
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

  // Score extraction: scores can be {integration: {score: N, evidence: "..."}} or {integration: N}
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
    dataAccessibilityEvidence: extractEvidence('dataAccessibility'),
    scalabilityEvidence: extractEvidence('scalability'),
    overallEvidence: extractEvidence('overall'),
    visibilityEvidence: extractEvidence('visibility'),
    totalAnnualBenefit,
    totalInvestment,
    hoursReclaimable,
    roiRatio,
    paybackMonths,
  };
}

// ─── Format Helpers ──────────────────────────────────────────────────────────

const fmt = (n: number) => {
  if (n == null || isNaN(n)) return '£0';
  return n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${Math.round(n)}`;
};
const fmtFull = (n: number) => `£${Math.round(n).toLocaleString()}`;
const fmtPayback = (months: number) => {
  if (months <= 0) return 'Immediate';
  if (months < 1) return '< 1 mo';
  return `${Math.round(months)} mo`;
};

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000, decimals = 0 }: {
  target: number; prefix?: string; suffix?: string; duration?: number; decimals?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    started.current = false;
    setVal(0);
  }, [target]);
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

// ─── Cost Clock ──────────────────────────────────────────────────────────────
function CostClock({ annualCost, size = 'normal' }: { annualCost: number; size?: 'normal' | 'large' }) {
  const [elapsed, setElapsed] = useState(0);
  const costPerSecond = annualCost / (365.25 * 24 * 3600);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const fontSize = size === 'large' ? 32 : 16;
  return (
    <span style={{ ...mono, color: C.red, fontSize, fontWeight: 700 }}>
      £{(costPerSecond * elapsed).toFixed(2)}
    </span>
  );
}

// ─── Health Ring ─────────────────────────────────────────────────────────────
function HealthRing({ score, label, evidence, delay = 0, size = 120 }: {
  score: number; label: string; evidence?: string; delay?: number; size?: number;
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
  const safeScore = isNaN(score) ? 0 : Math.round(score);
  const color = safeScore < 30 ? C.red : safeScore < 50 ? C.amber : safeScore < 70 ? C.orange : C.emerald;
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = animated ? circumference - (safeScore / 100) * circumference : circumference;
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: `stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size * 0.23, fontWeight: 700, color, ...mono }}>{safeScore}</span>
        </div>
      </div>
      <p style={{ color: C.text, fontWeight: 600, fontSize: 13, marginTop: 10, marginBottom: 0 }}>{label}</p>
    </div>
  );
}

// ─── Severity Dot Grid (findings with expandable detail) ───────────────────────
function SeverityDotGrid({ findings, displayOutcomeFn }: { findings: any[]; displayOutcomeFn: (outcome: string) => string }) {
  const [active, setActive] = useState<number | null>(null);
  const colors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6' };
  return (
    <div style={sectionWrap}>
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
            <span style={{ fontSize: 11, color: C.textMuted, textTransform: 'capitalize', ...mono }}>{sev}</span>
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
          <div style={{ ...glass(), border: `1px solid ${c}40`, padding: 24, maxHeight: 500, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: c, padding: '3px 10px', borderRadius: 6, background: `${c}15`, border: `1px solid ${c}30`, ...mono }}>{f.severity}</span>
              {f.category && <span style={{ fontSize: 10, color: C.textMuted, ...mono }}>{(f.category || '').replace(/_/g, ' ')}</span>}
              <button onClick={() => setActive(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4 }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <h4 style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{f.title}</h4>
            <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{f.description}</p>
            {(f.evidence && f.evidence.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, ...mono }}>Evidence</span>
                {f.evidence.map((e: string, j: number) => (
                  <p key={j} style={{ color: C.textMuted, fontSize: 12, marginTop: 4, paddingLeft: 12, borderLeft: `2px solid ${C.textLight}` }}>{e}</p>
                ))}
              </div>
            )}
            {(f.client_quote || f.clientQuote) && (
              <div style={{ padding: '10px 14px', background: 'rgba(139,92,246,0.08)', borderRadius: 8, marginBottom: 16, borderLeft: '3px solid #8b5cf6' }}>
                <p style={{ color: C.text, fontSize: 12, fontStyle: 'italic' }}>&quot;{f.client_quote || f.clientQuote}&quot;</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {hoursVal > 0 && (
                <div>
                  <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, ...mono }}>Hours/week</span>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', margin: '4px 0 0', ...mono }}>{hoursVal}</p>
                </div>
              )}
              {costVal > 0 && (
                <div>
                  <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, ...mono }}>Annual cost</span>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', margin: '4px 0 0', ...mono }}>£{Number(costVal).toLocaleString()}</p>
                </div>
              )}
              {Array.isArray(affected) && affected.length > 0 && (
                <div>
                  <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, ...mono }}>Affects</span>
                  <p style={{ fontSize: 13, color: C.textMuted, margin: '4px 0 0' }}>{affected.join(', ')}</p>
                </div>
              )}
            </div>
            {(f.recommendation) && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: '#22c55e08', borderLeft: '2px solid #22c55e40', borderRadius: '0 8px 8px 0' }}>
                <span style={{ fontSize: 9, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, ...mono }}>Recommendation</span>
                <p style={{ color: '#065f46', fontSize: 12, marginTop: 4 }}>{f.recommendation}</p>
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
    <div style={{ ...glass({ padding: 24 }), overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 200, paddingBottom: 40, position: 'relative', overflow: 'hidden' }}>
        {recommendations.map((r: any, i: number) => {
          const benefit = r.annualBenefit || r.annual_cost_savings || 0;
          const cost = r.estimatedCost || r.estimated_cost || 0;
          const hours = parseFloat(r.hoursSavedWeekly || r.hours_saved_weekly) || 0;
          const h = (benefit / maxBenefit) * 140;
          const isHovered = hovered === i;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: 0 }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {isHovered && (
                <div style={{ position: 'absolute', bottom: h + 48, left: '50%', transform: 'translateX(-50%)',
                  ...glass(), padding: '10px 14px', minWidth: 180, zIndex: 10, pointerEvents: 'none' }}>
                  <p style={{ color: C.text, fontSize: 11, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{r.title}</p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: 9, color: '#64748b', ...mono }}>BENEFIT</span>
                      <p style={{ color: '#22c55e', fontSize: 13, fontWeight: 700, margin: '2px 0 0', ...mono }}>£{benefit.toLocaleString()}/yr</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 9, color: '#64748b', ...mono }}>COST</span>
                      <p style={{ color: '#f97316', fontSize: 13, fontWeight: 700, margin: '2px 0 0', ...mono }}>{cost > 0 ? `£${cost.toLocaleString()}` : '£0'}</p>
                    </div>
                  </div>
                </div>
              )}
              <div style={{
                width: '100%', maxWidth: 60, height: h, borderRadius: '6px 6px 0 0', cursor: 'pointer',
                background: isHovered ? 'linear-gradient(180deg, #22c55e, #16a34a)' : 'linear-gradient(180deg, #22c55e88, #059669aa)',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: isHovered ? '0 0 24px #22c55e30' : 'none',
              }} />
              <span style={{ position: 'absolute', bottom: -28, fontSize: 9, color: '#64748b', ...mono, textAlign: 'center', width: '100%' }}>R{i + 1}</span>
            </div>
          );
        })}
        <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: 0 }}
          onMouseEnter={() => setHovered('total')} onMouseLeave={() => setHovered(null)}>
          <div style={{
            width: '100%', maxWidth: 80, height: 160, borderRadius: '6px 6px 0 0', cursor: 'pointer',
            background: hovered === 'total' ? 'linear-gradient(180deg, #38bdf8, #0284c7)' : 'linear-gradient(180deg, #38bdf888, #0284c7aa)',
            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          }} />
          <span style={{ position: 'absolute', bottom: -28, fontSize: 9, color: '#38bdf8', ...mono, fontWeight: 700, textAlign: 'center', width: '100%' }}>TOTAL</span>
        </div>
      </div>
    </div>
  );
}

// ─── System Detail Overlay (v4 enhanced) ─────────────────────────────────────
function SystemDetailOverlay({ sys, borderColor, onClose }: { sys: any; borderColor: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(22,35,64,0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        ...glass({ padding: 0 }),
        borderLeft: `4px solid ${borderColor}`,
        maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto',
        borderRadius: 20,
        boxShadow: SHADOW.lg,
        animation: `fadeSlideUp 0.3s ${EASE.out}`,
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${borderColor}12`, color: borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {(sys.name || sys.system_name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: C.text, fontSize: 20, margin: 0 }}>{sys.name || sys.system_name || 'System'}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
              {sys.cost != null && <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>{fmt(sys.cost)}/mo</span>}
              {sys.category && <span style={{ fontSize: 12, color: C.textMuted }}>{(sys.category || '').replace(/_/g, ' ')}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4 }}><X style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {sys.gaps?.length > 0 && (
            <div>
              <span style={{ ...TYPE.caption, fontSize: 10, color: C.red }}>GAPS ({sys.gaps.length})</span>
              {sys.gaps.map((g: string, j: number) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
                  <AlertTriangle style={{ width: 14, height: 14, color: C.red, flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>{g}</p>
                </div>
              ))}
            </div>
          )}
          {sys.strengths?.length > 0 && (
            <div>
              <span style={{ ...TYPE.caption, fontSize: 10, color: C.emerald }}>STRENGTHS ({sys.strengths.length})</span>
              {sys.strengths.map((s: string, j: number) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
                  <CheckCircle2 style={{ width: 14, height: 14, color: C.emerald, flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>{s}</p>
                </div>
              ))}
            </div>
          )}
          {(!sys.gaps?.length && !sys.strengths?.length) && (
            <p style={{ color: C.textMuted, fontSize: 13, gridColumn: '1 / -1' }}>No detailed findings for this system.</p>
          )}
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
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    immediate: { bg: `${C.emerald}15`, color: C.emerald, label: 'Quick Win' },
    quick_win: { bg: `${C.emerald}15`, color: C.emerald, label: 'Quick Win' },
    foundation: { bg: `${C.blue}15`, color: C.blue, label: 'Foundation' },
    short_term: { bg: `${C.blue}15`, color: C.blue, label: 'Short Term' },
    strategic: { bg: `${C.purple}15`, color: C.purple, label: 'Strategic' },
    medium_term: { bg: `${C.purple}15`, color: C.purple, label: 'Medium Term' },
    optimization: { bg: '#6366f115', color: '#6366f1', label: 'Optimisation' },
    long_term: { bg: 'rgba(0,0,0,0.06)', color: C.textMuted, label: 'Long Term' },
  };
  const s = styles[phase] || styles.short_term;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 8, background: s.bg, color: s.color, ...mono }}>
      {s.label}
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
function ChainIcon({ code, size = 16 }: { code: string; size?: number }) {
  const icons: Record<string, any> = {
    quote_to_cash: PoundSterling,
    record_to_report: BarChart3,
    procure_to_pay: DollarSign,
    hire_to_retire: Users,
    lead_to_client: Target,
    comply_to_confirm: Shield,
    project_to_delivery: Workflow,
  };
  const Icon = icons[code] || Workflow;
  return <Icon style={{ width: size, height: size }} />;
}

// ─── Horizontal Bar (for process hours visual) ──────────────────────────────
function HoursBar({ hours, maxHours, color }: { hours: number; maxHours: number; color: string }) {
  const pct = maxHours > 0 ? Math.min(100, (hours / maxHours) * 100) : 0;
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.04)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, ...mono, minWidth: 36, textAlign: 'right' }}>{hours}h</span>
    </div>
  );
}

// ─── useScrollReveal ────────────────────────────────────────────────────────
function useScrollReveal(options?: { threshold?: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: options?.threshold ?? 0.15, rootMargin: '0px 0px -40px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── RevealCard ─────────────────────────────────────────────────────────────
function RevealCard({ children, delay = 0, style, hoverLift = true, className, onClick }: {
  children: ReactNode; delay?: number; style?: React.CSSProperties; hoverLift?: boolean; className?: string; onClick?: () => void;
}) {
  const { ref, visible } = useScrollReveal();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      ref={ref}
      className={className}
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      onMouseEnter={() => hoverLift && setHovered(true)}
      onMouseLeave={() => hoverLift && setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? (hovered ? 'translateY(-4px) scale(1.005)' : 'translateY(0)')
          : 'translateY(24px)',
        transition: `opacity ${DURATION.reveal} ${EASE.out} ${delay}ms, transform ${DURATION.reveal} ${EASE.out} ${delay}ms, box-shadow ${DURATION.normal} ${EASE.out}`,
        boxShadow: hovered ? SHADOW.md : SHADOW.sm,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── SectionHeader ──────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, badge, badgeColor }: {
  title: string; subtitle?: string; badge?: string; badgeColor?: string;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `all ${DURATION.reveal} ${EASE.out}`,
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ ...TYPE.sectionTitle, margin: 0 }}>{title}</h2>
        {badge && (
          <span style={{
            ...TYPE.caption,
            fontSize: 11,
            color: badgeColor || C.emerald,
            background: `${badgeColor || C.emerald}12`,
            border: `1px solid ${(badgeColor || C.emerald)}25`,
            padding: '3px 12px',
            borderRadius: 20,
          }}>{badge}</span>
        )}
      </div>
      {subtitle && <p style={{ ...TYPE.label, marginTop: 6 }}>{subtitle}</p>}
    </div>
  );
}

// ─── DotGridOverlay ─────────────────────────────────────────────────────────
function DotGridOverlay({ opacity = 0.04, size = 24 }: { opacity?: number; size?: number }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `radial-gradient(circle, rgba(22,35,64,${opacity}) 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
      maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
    }} />
  );
}

// ─── NoiseOverlay ───────────────────────────────────────────────────────────
function NoiseOverlay({ opacity = 0.35 }: { opacity?: number }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', opacity,
      mixBlendMode: 'soft-light',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
    }} />
  );
}

// ─── ProgressRing (270° arc gauge) ──────────────────────────────────────────
function ProgressRing({ score, size = 160, strokeWidth = 12, color, label, delay = 0 }: {
  score: number; size?: number; strokeWidth?: number; color: string; label?: string; delay?: number;
}) {
  const { ref, visible } = useScrollReveal();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const arc = circumference * 0.75;
  const offset = arc - (score / 100) * arc;
  const safeScore = isNaN(score) ? 0 : Math.round(score);

  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
        <defs>
          <linearGradient id={`ring-grad-${label ?? 'default'}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}88`} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} strokeDasharray={`${arc} ${circumference}`} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`url(#ring-grad-${label ?? 'default'})`} strokeWidth={strokeWidth} strokeDasharray={`${arc} ${circumference}`} strokeDashoffset={visible ? offset : arc} strokeLinecap="round" style={{ transition: `stroke-dashoffset 1.5s ${EASE.out} ${delay}ms` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ ...TYPE.heroMetric, fontSize: size * 0.25, color } as React.CSSProperties}>
          {visible ? <AnimatedCounter target={safeScore} duration={1800} /> : '0'}
        </span>
        {label && <span style={{ ...TYPE.caption, color: C.textMuted, fontSize: 10, marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
}

// ─── MiniSparkline ──────────────────────────────────────────────────────────
function MiniSparkline({ values, width = 80, height = 24, color = C.emerald }: {
  values: number[]; width?: number; height?: number; color?: string;
}) {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) =>
    `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
  ).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polygon points={areaPoints} fill={`${color}15`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedQW, setExpandedQW] = useState<number | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
  const [selectedFindingIndex, setSelectedFindingIndex] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // ─── Persistent visited sections (localStorage) ─────────────────────────
  const storageKey = report?.id ? `sa-visited-${report.id}` : null;

  const [visited, setVisited] = useState<Set<string>>(() => new Set(['overview']));

  // Load visited from localStorage when report loads
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setVisited(new Set([...parsed, 'overview']));
        }
      }
    } catch { /* ignore parse errors */ }
  }, [storageKey]);

  // Save visited to localStorage whenever it changes
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...visited]));
    } catch { /* ignore storage errors */ }
  }, [visited, storageKey]);

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
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: 32, height: 32, color: C.emerald, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: C.textMuted, fontSize: 14 }}>Loading your Systems Audit report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...glass({ padding: 48 }), textAlign: 'center' }}>
          <p style={{ color: C.textMuted, marginBottom: 16 }}>Report not available yet.</p>
          <button onClick={() => navigate('/dashboard')}
            style={{ color: C.blue, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            ← Back to Dashboard
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

  const systemsList = facts?.systems || [];
  const sortedProcesses = [...(processes || [])].sort((a: any, b: any) => (b.hoursWasted ?? b.hours_wasted ?? 0) - (a.hoursWasted ?? a.hours_wasted ?? 0));
  const maxProcessHours = Math.max(...sortedProcesses.map((p: any) => p.hoursWasted ?? p.hours_wasted ?? 0), 1);
  const totalProcessHours = sortedProcesses.reduce((s: number, p: any) => s + (p.hoursWasted ?? p.hours_wasted ?? 0), 0);

  // Sidebar component (fixed left, navy, grouped nav + progress)
  function SASidebar() {
    let lastGroup = '';
    return (
      <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 220, background: C.navy, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', zIndex: 30 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, fontFamily: "'DM Sans', sans-serif" }}>RPGCC</span>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.blue }} />
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.red }} />
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.orange }} />
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
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', border: 'none', background: activeSection === item.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeSection === item.id ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', borderLeft: activeSection === item.id ? `3px solid ${C.blue}` : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (activeSection !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { if (activeSection !== item.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {visited.has(item.id) && activeSection !== item.id && (
                    <span style={{ width: 18, height: 18, borderRadius: 9, background: C.emerald, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>✓</span>
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
            <div style={{ height: '100%', width: `${(visited.size / NAV_ITEMS.length) * 100}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.emerald})`, borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </aside>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Hero — animated mesh gradient */}
            <div style={{ background: 'linear-gradient(135deg, #162340 0%, #1e3a5f 40%, #0f172a 70%, #162340 100%)', backgroundSize: '300% 300%', animation: 'gradientShift 15s ease infinite', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
              <DotGridOverlay opacity={0.06} size={20} />
              <NoiseOverlay opacity={0.25} />
              <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(32px, 5vw, 56px)' }}>
                <span style={{ ...TYPE.caption, color: C.emerald, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap style={{ width: 14, height: 14 }} /> SYSTEMS AUDIT REPORT
                </span>
                <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, maxWidth: '42ch', letterSpacing: '-0.02em', marginTop: 8, marginBottom: 8 }}>
                  {report?.headline || `Your systems are costing you £${(m.annualCostOfChaos / 1000).toFixed(0)}k a year — and it gets worse at scale.`}
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                  {(facts?.companyName || facts?.clientName || '') + (facts?.industry ? ' · ' + facts.industry : '') + (facts?.teamSize ? ' · Team: ' + facts.teamSize : '')}
                </p>
                {report?.generated_at && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
              </div>
              <div style={{ position: 'absolute', bottom: 24, right: 32, zIndex: 1, textAlign: 'right' }}>
                <CostClock annualCost={m.annualCostOfChaos} />
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Wasted since you opened this page</p>
              </div>
            </div>
            {/* Stat bento grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
              {[
                { label: 'ANNUAL COST OF CHAOS', value: m.annualCostOfChaos, prefix: '£', color: C.red },
                { label: `AT ${m.growthMultiplier}X SCALE`, value: m.projectedCostAtScale, prefix: '£', color: C.amber },
                { label: 'HOURS LOST WEEKLY', value: m.hoursWastedWeekly, decimals: 1, color: C.blue },
              ].map((stat, i) => (
                <RevealCard key={i} delay={i * STAGGER}>
                  <div style={{ ...accentCard(stat.color), padding: 24 }}>
                    <p style={{ ...TYPE.caption, color: stat.color, marginBottom: 8 }}>{stat.label}</p>
                    <p style={{ ...TYPE.sectionMetric, color: stat.color }}>
                      <AnimatedCounter target={stat.value} prefix={stat.prefix || ''} decimals={(stat as any).decimals || 0} duration={i === 0 ? DURATION.heroCounter : DURATION.counter} />
                    </p>
                  </div>
                </RevealCard>
              ))}
            </div>
            {/* Executive Summary */}
            <RevealCard delay={300}>
              <div style={{ ...glass({ padding: 32 }) }}>
                <p style={{ ...TYPE.cardTitle, marginBottom: 12 }}>Executive Summary</p>
                {splitNarrative(report?.executive_summary || '', 4).map((para: string, i: number) => (
                  <p key={i} style={{ ...TYPE.body, maxWidth: '62ch', marginBottom: 12 }}>{para}</p>
                ))}
              </div>
            </RevealCard>
            {/* Desired Outcomes */}
            {(facts?.desiredOutcomes?.length > 0) && (
              <RevealCard delay={400}>
                <div style={{ ...glass({ padding: 24 }) }}>
                  <p style={{ ...TYPE.cardTitle, marginBottom: 16 }}>What You Want to Achieve</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
                    {(facts.desiredOutcomes || []).map((o: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <CheckCircle2 style={{ width: 16, height: 16, color: C.emerald, flexShrink: 0, marginTop: 2 }} />
                        <span style={{ ...TYPE.body, fontSize: 14 }}>{displayOutcome(o)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealCard>
            )}
          </div>
        );
      case 'systems': {
        const totalGaps = systemsList.reduce((a: number, s: any) => a + (s.gaps?.length || 0), 0);
        const criticalGapsCount = systemsList.filter((s: any) => (s.gaps?.length || 0) > 2).length;
        const okCount = systemsList.filter((s: any) => { const g = s.gaps?.length || 0; return g === 1 || g === 2; }).length;
        const strongCount = systemsList.filter((s: any) => (s.gaps?.length || 0) === 0 || (s.strengths?.length && (s.gaps?.length || 0) <= 1)).length;
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionHeader title={`${systemsList.length} systems`} subtitle="Across your technology stack" />
            <RevealCard>
              <div style={{ ...glass({ padding: 16 }), display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ ...TYPE.sectionTitle, margin: 0 }}>{systemsList.length} systems</h2>
                  <p style={{ ...TYPE.label, marginTop: 4 }}>Across your technology stack</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ background: `${C.red}12`, border: `1px solid ${C.red}25`, borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600, color: C.red }}>{criticalGapsCount} critical</span>
                  <span style={{ background: `${C.amber}12`, border: `1px solid ${C.amber}25`, borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600, color: C.amber }}>{okCount} OK</span>
                  <span style={{ background: `${C.emerald}12`, border: `1px solid ${C.emerald}25`, borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600, color: C.emerald }}>{strongCount} strong</span>
                </div>
              </div>
            </RevealCard>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
              {systemsList.map((sys: any, i: number) => {
                const gapCount = sys.gaps?.length || 0;
                const barColor = gapCount >= 3 ? C.red : gapCount >= 1 ? C.amber : C.emerald;
                const healthPct = gapCount >= 3 ? 25 : gapCount >= 1 ? 60 : 100;
                return (
                  <RevealCard key={i} delay={i * STAGGER} style={{ ...glass({ padding: 20 }), cursor: 'pointer' }} onClick={() => setSelectedSystem(i)}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ ...TYPE.cardTitle, margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sys.name || sys.system_name || 'System'}</p>
                        {gapCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: C.red, ...mono }}>{gapCount} gaps</span>}
                      </div>
                      <p style={{ ...TYPE.caption, color: C.textMuted, fontSize: 11, marginTop: 4 }}>{(sys.category || '').replace(/_/g, ' ') || '—'}</p>
                      <div style={{ height: 3, borderRadius: 2, background: 'rgba(0,0,0,0.06)', marginTop: 12, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${healthPct}%`, background: barColor, borderRadius: 2, transition: `width 0.6s ${EASE.spring}` }} />
                      </div>
                      {gapCount > 0 && (sys.gaps?.slice(0, 2) || []).map((g: string, j: number) => (
                        <span key={j} style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${C.red}08`, color: C.red, border: `1px solid ${C.red}15`, marginTop: 6, marginRight: 4 }}>{(g || '').slice(0, 20)}{(g || '').length > 20 ? '…' : ''}</span>
                      ))}
                    </div>
                  </RevealCard>
                );
              })}
            </div>
            {selectedSystem !== null && systemsList[selectedSystem] && (
              <SystemDetailOverlay
                sys={systemsList[selectedSystem]}
                borderColor={(() => { const gc = systemsList[selectedSystem].gaps?.length || 0; return gc > 3 ? C.red : gc > 1 ? C.orange : gc === 1 ? '#eab308' : C.emerald; })()}
                onClose={() => setSelectedSystem(null)}
              />
            )}
          </div>
        );
      }
      case 'health': {
        const healthItems = [
          { key: 'overall', label: 'Overall', score: m.overallScore, evidence: m.overallEvidence },
          { key: 'integration', label: 'Integration', score: m.integrationScore, evidence: m.integrationEvidence },
          { key: 'automation', label: 'Automation', score: m.automationScore, evidence: m.automationEvidence },
          { key: 'visibility', label: 'Visibility', score: m.visibilityScore, evidence: m.visibilityEvidence },
        ];
        if (healthItems[0].score === 0 && (healthItems[1].score > 0 || healthItems[2].score > 0 || healthItems[3].score > 0)) {
          healthItems[0].score = Math.round((healthItems[1].score + healthItems[2].score + healthItems[3].score) / 3);
        }
        const overallScore = healthItems[0].score;
        const overallColor = overallScore < 30 ? C.red : overallScore < 50 ? C.amber : overallScore < 70 ? C.orange : C.emerald;
        const keyPersonFindings = displayFindings.filter((f: any) =>
          (f.category === 'single_point_failure') ||
          (f.title || '').toLowerCase().includes('key person') ||
          (f.title || '').toLowerCase().includes('single point')
        );
        const healthVerdict = overallScore < 30 ? 'Critical' : overallScore < 50 ? 'At Risk' : overallScore < 70 ? 'Needs Work' : 'Healthy';
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Health hero */}
            <div style={{
              background: `linear-gradient(135deg, ${overallColor}10 0%, ${overallColor}04 50%, rgba(255,255,255,0.85) 100%)`,
              border: `1px solid ${overallColor}20`,
              borderRadius: 20, padding: 40, position: 'relative', overflow: 'hidden',
            }}>
              <DotGridOverlay opacity={0.03} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                <ProgressRing score={overallScore} size={180} strokeWidth={14} color={overallColor} label="OVERALL" />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h2 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: 0 }}>System Health</h2>
                    <span style={{ fontSize: 14, fontWeight: 700, color: overallColor, padding: '4px 16px', borderRadius: 20, background: `${overallColor}15`, border: `1px solid ${overallColor}30`, ...mono }}>{healthVerdict}</span>
                  </div>
                  <p style={{ ...TYPE.body, fontSize: 15, maxWidth: '50ch', margin: 0 }}>
                    {overallScore < 30 ? 'Your systems are critically disconnected. Manual workarounds dominate daily operations, creating compounding errors and invisible costs.' :
                     overallScore < 50 ? 'Significant gaps exist across your technology stack. Key processes rely on manual intervention, limiting scalability.' :
                     overallScore < 70 ? 'Your systems have a reasonable foundation but key integration and automation gaps are holding you back.' :
                     'Your systems are well-connected with strong foundations. Focus on optimisation to unlock remaining value.'}
                  </p>
                </div>
              </div>
            </div>
            {/* Sub-score ring cluster */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24, flexWrap: 'wrap' }}>
              {healthItems.slice(1).map((item, i) => (
                <div key={item.key} style={{ textAlign: 'center' }}>
                  <ProgressRing score={item.score} size={100} strokeWidth={8} delay={i * 200} color={item.score < 30 ? C.red : item.score < 50 ? C.amber : item.score < 70 ? C.orange : C.emerald} label={item.label} />
                </div>
              ))}
            </div>
            {/* Score detail cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
              {healthItems.slice(1).map((item, i) => {
                const scoreColor = item.score < 30 ? C.red : item.score < 50 ? C.amber : item.score < 70 ? C.orange : C.emerald;
                return (
                  <RevealCard key={item.key} delay={i * STAGGER}>
                    <div style={{ ...glass({ padding: 20 }), borderTop: `3px solid ${scoreColor}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</span>
                        <span style={{ ...TYPE.cardMetric, fontSize: 28, color: scoreColor }}>{item.score}</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ height: '100%', width: `${item.score}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}88)`, borderRadius: 3, transition: `width 1.2s ${EASE.spring}` }} />
                      </div>
                      {item.evidence && <p style={{ ...TYPE.body, fontSize: 12, lineHeight: 1.5, marginTop: 12, maxHeight: 80, overflow: 'hidden' }}>{item.evidence}</p>}
                    </div>
                  </RevealCard>
                );
              })}
            </div>
            {keyPersonFindings.length > 0 && (
              <RevealCard delay={400}>
                <div style={{ ...accentCard(C.red, { padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }) }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'pulse 2.5s ease infinite' }}>
                    <AlertTriangle style={{ width: 22, height: 22, color: C.red }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: C.text, fontSize: 16, margin: '0 0 4px' }}>Key Person Risk Detected</p>
                    <p style={{ ...TYPE.body, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{keyPersonFindings[0].description || keyPersonFindings[0].title}</p>
                  </div>
                </div>
              </RevealCard>
            )}
          </div>
        );
      }
      case 'chaos': {
        const chaosParas = splitNarrative(report?.cost_of_chaos_narrative || '', 4);
        const firstTwoParas = splitNarrative(report?.cost_of_chaos_narrative || '', 2);
        const quoteSource = displayFindings.find((f: any) => f.client_quote || f.clientQuote);
        const clientQuote = quoteSource?.client_quote || quoteSource?.clientQuote;
        const clientPresentation = p1.clientPresentation || {};
        const firstQuote = (clientPresentation.clientQuotes && clientPresentation.clientQuotes[0]) || clientQuote;

        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Running cost hero */}
            <div style={{ background: 'linear-gradient(135deg, #1a0505 0%, #2d0a0a 50%, #0f172a 100%)', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
              <NoiseOverlay opacity={0.3} />
              <DotGridOverlay opacity={0.06} size={20} />
              <div style={{ position: 'relative', zIndex: 1, padding: 48, textAlign: 'center' }}>
                <p style={{ ...TYPE.caption, color: `${C.red}aa`, marginBottom: 8 }}>ANNUAL COST OF CHAOS</p>
                <p style={{ fontSize: 56, fontWeight: 800, color: C.red, textShadow: '0 0 40px rgba(239,68,68,0.4)', fontVariantNumeric: 'tabular-nums', ...mono }}>
                  <AnimatedCounter target={m.annualCostOfChaos} prefix="£" duration={2500} />
                </p>
                <CostClock annualCost={m.annualCostOfChaos} size="large" />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>wasted since you opened this report</p>
              </div>
            </div>
            {/* Impact stat tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
              {[
                { label: 'ANNUAL COST OF CHAOS', value: fmtFull(m.annualCostOfChaos), color: C.red },
                { label: `AT ${m.growthMultiplier}X SCALE`, value: fmtFull(m.projectedCostAtScale), color: C.amber },
                { label: 'HOURS LOST WEEKLY', value: m.hoursWastedWeekly, color: C.blue, isNum: true },
              ].map((stat, i) => (
                <RevealCard key={i} delay={i * STAGGER}>
                  <div style={{ ...glass({ padding: 24, textAlign: 'center' }) }}>
                    <p style={{ ...TYPE.caption, color: stat.color, marginBottom: 8 }}>{stat.label}</p>
                    <p style={{ ...TYPE.sectionMetric, color: stat.color }}>{stat.isNum ? <AnimatedCounter target={stat.value} decimals={1} /> : stat.value}</p>
                  </div>
                </RevealCard>
              ))}
            </div>
            {/* Narrative & quote */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
              <RevealCard delay={200}>
                <div style={{ ...glass({ padding: 28 }) }}>
                  <p style={{ ...TYPE.caption, color: C.text, marginBottom: 12 }}>THE PATTERN</p>
                  {firstTwoParas.map((para: string, i: number) => (
                    <p key={i} style={{ ...TYPE.body, maxWidth: '55ch', marginBottom: 12 }}>{para}</p>
                  ))}
                </div>
              </RevealCard>
              {(firstQuote || chaosParas[1]) && (
                <RevealCard delay={250}>
                  <div style={{ ...glass({ padding: 28 }), borderLeft: '3px solid #8b5cf6', background: 'rgba(139,92,246,0.05)' }}>
                    <Quote style={{ width: 28, height: 28, color: `${C.purple}40`, marginBottom: 12 }} />
                    <p style={{ fontStyle: 'italic', fontSize: 16, lineHeight: 1.7, fontFamily: "'Playfair Display', serif", color: C.text, margin: 0 }}>&quot;{firstQuote || chaosParas[1]}&quot;</p>
                    <p style={{ ...TYPE.caption, color: C.textMuted, marginTop: 12 }}>{quoteSource ? (quoteSource.client_quote ? 'Staff interview' : '') : ''}</p>
                  </div>
                </RevealCard>
              )}
            </div>
            {/* Process cost bars — top 5 */}
            <RevealCard delay={300}>
              <div style={{ ...glass({ padding: 24 }) }}>
                <p style={{ ...TYPE.cardTitle, marginBottom: 16 }}>Where the Hours Go</p>
                {(sortedProcesses.slice(0, 5) as any[]).map((proc: any, i: number) => {
                  const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
                  const maxProcessHoursVal = Math.max(...(sortedProcesses as any[]).map((p: any) => p.hoursWasted ?? p.hours_wasted ?? 0), 1);
                  const pct = maxProcessHoursVal > 0 ? (hours / maxProcessHoursVal) * 100 : 0;
                  const name = proc.chainName || proc.chain_name || proc.chainCode || 'Process';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, flex: '0 0 180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                      <div style={{ flex: 1, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.04)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.red}cc, ${C.red}66)`, borderRadius: 6, transition: `width 1s ${EASE.spring} ${i * 100}ms` }} />
                        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: pct > 50 ? '#fff' : C.text }}>{hours}h/wk</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RevealCard>

            {m.projectedCostAtScale > m.annualCostOfChaos && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <AlertTriangle style={{ width: 22, height: 22, color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 600, color: '#162340', margin: '0 0 4px' }}>Scaling Danger</p>
                  <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6 }}>At {m.growthMultiplier}x growth, projected cost reaches £{(m.projectedCostAtScale / 1000).toFixed(0)}k. These systems don&apos;t scale linearly — the chaos compounds.</p>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'processes': {
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionHeader title={`${sortedProcesses.length} process chains`} subtitle={`Total ${totalProcessHours}h wasted weekly`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(sortedProcesses as any[]).map((proc: any, i: number) => {
                const isExpanded = expandedProcess === (proc.chainCode || proc.chain_code);
                const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
                const pct = maxProcessHours > 0 ? (hours / maxProcessHours) * 100 : 0;
                const name = proc.chainName || proc.chain_name || proc.chainCode || 'Process';
                const gaps = proc.criticalGaps || proc.critical_gaps || [];
                const quotes = proc.clientQuotes || proc.client_quotes || [];
                return (
                  <RevealCard key={proc.chainCode || proc.chain_code} delay={i * STAGGER}>
                    <div style={{ ...glass({ padding: 0, overflow: 'hidden' }) }}>
                      <button type="button" onClick={() => setExpandedProcess(isExpanded ? null : (proc.chainCode || proc.chain_code))} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.blue}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ChainIcon code={proc.chainCode || proc.chain_code || ''} size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ ...TYPE.cardTitle, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                          <p style={{ ...TYPE.caption, color: C.textMuted, marginTop: 2 }}>{hours}h/week</p>
                        </div>
                        <span style={{ ...TYPE.cardMetric, color: C.red, flexShrink: 0 }}>{hours}h</span>
                        {isExpanded ? <ChevronUp style={{ color: C.textMuted, flexShrink: 0 }} /> : <ChevronDown style={{ color: C.textMuted, flexShrink: 0 }} />}
                      </button>
                      <div style={{ width: '100%', height: 3, background: 'rgba(0,0,0,0.04)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.amber}, ${C.red})`, borderRadius: 2, transition: `width 0.6s ${EASE.out}` }} />
                      </div>
                      <div style={{ maxHeight: isExpanded ? 600 : 0, overflow: 'hidden', transition: `max-height 0.4s ${EASE.out}` }}>
                        <div style={{ padding: '0 24px 24px' }}>
                          {gaps.length > 0 && gaps.map((g: string, j: number) => (
                            <p key={j} style={{ borderLeft: `3px solid ${C.red}`, paddingLeft: 14, marginBottom: 8, fontSize: 14, color: C.red, lineHeight: 1.5 }}>{g}</p>
                          ))}
                          {quotes.map((q: string, j: number) => (
                            <div key={j} style={{ ...glass({ padding: 16, marginTop: 12 }), borderLeft: `3px solid ${C.purple}40` }}>
                              <p style={{ fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, color: C.textSecondary, margin: 0 }}>&quot;{q}&quot;</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </RevealCard>
                );
              })}
            </div>
          </div>
        );
      }
      case 'findings': {
        const findingColors: Record<string, string> = { critical: C.red, high: C.amber, medium: C.orange, low: C.blue };
        const findingSizes: Record<string, number> = { critical: 32, high: 28, medium: 24, low: 22 };
        const selIdx = selectedFindingIndex ?? (displayFindings.length > 0 ? 0 : null);
        const selectedFinding = selIdx !== null ? displayFindings[selIdx] : null;
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionHeader title={`${displayFindings.length} Findings`} subtitle={`What We Found · Critical: ${criticalCount} · High: ${highCount}`} />
            <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 'min-content' }}>
                {(displayFindings as any[]).map((f: any, i: number) => {
                  const c = findingColors[f.severity] || C.textMuted;
                  const size = findingSizes[f.severity] ?? 22;
                  const isActive = selIdx === i;
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedFindingIndex(i)}
                      style={{
                        width: isActive ? 'auto' : size,
                        height: size,
                        minWidth: size,
                        borderRadius: size / 2,
                        background: isActive ? `${c}15` : c,
                        border: isActive ? '2px solid white' : '2px solid transparent',
                        boxShadow: isActive ? SHADOW.glow(c, 0.4) : 'none',
                        transform: isActive ? 'scale(1.3)' : 'scale(1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: isActive ? '0 16px' : 0,
                        transition: `all ${DURATION.normal} ${EASE.out}`,
                      }}
                    >
                      {isActive ? (
                        <span style={{ color: c, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                          {((f.title || '').length > 36 ? (f.title || '').slice(0, 34) + '…' : f.title) || 'Finding'}
                        </span>
                      ) : (
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: 'white', opacity: 0.9 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {Object.entries(findingColors).map(([sev, c]) => (
                <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: c }} />
                  <span style={{ ...TYPE.label, fontSize: 11, textTransform: 'capitalize' }}>{sev}</span>
                </div>
              ))}
            </div>
            {selectedFinding && (
              <RevealCard>
                <div style={{ ...glass({ padding: 28 }) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ ...TYPE.caption, fontSize: 11, color: findingColors[selectedFinding.severity] || C.textMuted, background: `${(findingColors[selectedFinding.severity] || C.textMuted)}12`, border: `1px solid ${(findingColors[selectedFinding.severity] || C.textMuted)}25`, padding: '3px 10px', borderRadius: 20 }}>{(selectedFinding as any).severity}</span>
                    {(selectedFinding as any).category && <span style={{ ...TYPE.caption, color: C.textMuted }}>{(selectedFinding as any).category?.replace(/_/g, ' ')}</span>}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>{(selectedFinding as any).title}</h3>
                  <p style={{ ...TYPE.body, lineHeight: 1.7, marginBottom: 20 }}>{(selectedFinding as any).description}</p>
                  {((selectedFinding as any).evidence && (selectedFinding as any).evidence.length > 0) && (
                    <div style={{ marginTop: 20 }}>
                      <p style={{ ...TYPE.caption, color: C.textMuted, marginBottom: 8 }}>EVIDENCE</p>
                      {((selectedFinding as any).evidence as string[]).map((e: string, j: number) => (
                        <p key={j} style={{ borderLeft: `3px solid ${C.amber}`, paddingLeft: 14, marginBottom: 8, fontSize: 14 }}>{e}</p>
                      ))}
                    </div>
                  )}
                  {((selectedFinding as any).client_quote || (selectedFinding as any).clientQuote) && (
                    <div style={{ ...glass({ padding: 16, marginTop: 16 }), borderLeft: `3px solid ${C.purple}40` }}>
                      <p style={{ fontStyle: 'italic', fontFamily: "'Playfair Display', serif", fontSize: 14, lineHeight: 1.6, color: C.text, margin: 0 }}>&quot;{(selectedFinding as any).client_quote || (selectedFinding as any).clientQuote}&quot;</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 32, marginTop: 20, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ ...TYPE.caption, color: C.textMuted }}>HOURS/WEEK</p>
                      <p style={{ ...TYPE.cardMetric, color: C.blue }}>{(selectedFinding as any).hours_wasted_weekly ?? (selectedFinding as any).hoursWastedWeekly ?? (selectedFinding as any).hoursPerWeek ?? '—'}</p>
                    </div>
                    <div>
                      <p style={{ ...TYPE.caption, color: C.textMuted }}>ANNUAL COST</p>
                      <p style={{ ...TYPE.cardMetric, color: C.red }}>{((selectedFinding as any).annual_cost_impact ?? (selectedFinding as any).annualCostImpact) != null ? `£${Number((selectedFinding as any).annual_cost_impact ?? (selectedFinding as any).annualCostImpact).toLocaleString()}` : '—'}</p>
                    </div>
                    <div>
                      <p style={{ ...TYPE.caption, color: C.textMuted }}>AFFECTS</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        {Array.isArray((selectedFinding as any).affected_systems ?? (selectedFinding as any).affectedSystems) ? ((selectedFinding as any).affected_systems ?? (selectedFinding as any).affectedSystems).map((s: string, j: number) => (
                          <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${C.blue}10`, color: C.blue }}>{s}</span>
                        )) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </RevealCard>
            )}
          </div>
        );
      }
      case 'techmap':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionHeader title="Technology Map" subtitle="How your systems connect and where the gaps are" />
            {(systemsMaps?.length > 0 || (facts?.systems && facts.systems.length > 0)) ? (
              <RevealCard style={{ borderRadius: 20, overflow: 'hidden', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', ...glass({ padding: 0, borderRadius: 20 }) }}>
                <SystemsMapSection systemsMaps={systemsMaps} facts={facts} layout="split" />
              </RevealCard>
            ) : (
              <RevealCard>
                <div style={{ ...glass({ padding: 32, textAlign: 'center' }) }}>
                  <p style={{ color: C.textMuted }}>Technology map not yet generated.</p>
                </div>
              </RevealCard>
            )}
          </div>
        );
      case 'quickwins': {
        const qwList = quickWins || [];
        const totalQWHours = qwList.reduce((s: number, q: any) => s + (parseFloat(q.hoursSaved || q.hours_saved || q.hoursSavedWeekly || 0) || 0), 0);
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <RevealCard>
              <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: `linear-gradient(135deg, ${C.emerald} 0%, #059669 100%)` }}>
                <NoiseOverlay opacity={0.2} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 32, position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Zap style={{ width: 32, height: 32, color: '#fff' }} />
                    <div>
                      <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>Start This Week</h2>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>{qwList.length} wins · zero cost · {totalQWHours}h saved every week</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(8px)' }}>
                      <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', ...mono, margin: 0 }}>£0</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>Investment</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(8px)' }}>
                      <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', ...mono, margin: 0 }}>+{totalQWHours}h</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>Per Week</p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealCard>
            <div style={{ position: 'relative', marginTop: 24, paddingLeft: 32 }}>
              <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${C.emerald}, ${C.emerald}30)`, borderRadius: 2 }} />
              {qwList.map((qw: any, i: number) => {
                const isExpanded = expandedQW === i;
                const hoursSaved = parseFloat(qw.hoursSaved || qw.hours_saved || qw.hoursSavedWeekly || 0) || 0;
                return (
                  <RevealCard key={i} delay={i * STAGGER} style={{ position: 'relative', marginBottom: 16 }}>
                    <div style={{ ...glass({ padding: 20 }), borderLeft: `3px solid ${C.emerald}30` }}>
                      <div style={{ position: 'absolute', left: -32, top: 18, width: 30, height: 30, borderRadius: 15, background: C.emerald, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, boxShadow: SHADOW.glow(C.emerald, 0.3), zIndex: 2 }}>{i + 1}</div>
                      <button type="button" onClick={() => setExpandedQW(isExpanded ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 0, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: C.blue, lineHeight: 1.5 }}>{qw.owner || 'Team'}: <span style={{ fontWeight: 500, color: C.text }}>{qw.title || qw.action?.slice(0, 80) || 'Quick Win'}</span></p>
                        </div>
                        <span style={{ ...TYPE.cardMetric, color: C.emerald, fontSize: 18, flexShrink: 0 }}>+{hoursSaved}h</span>
                        {isExpanded ? <ChevronUp style={{ color: C.textMuted, flexShrink: 0 }} /> : <ChevronDown style={{ color: C.textMuted, flexShrink: 0 }} />}
                      </button>
                      <div style={{ maxHeight: isExpanded ? 300 : 0, overflow: 'hidden', transition: `max-height 0.3s ${EASE.out}` }}>
                        <div style={{ paddingTop: 12 }}>
                          {qw.action && <p style={{ ...TYPE.body, fontSize: 13 }}>{qw.action}</p>}
                          {qw.impact && <div style={{ ...glass({ padding: 12, marginTop: 8 }), borderLeft: `3px solid ${C.emerald}40` }}><p style={{ fontSize: 13, color: C.emerald, lineHeight: 1.5, fontStyle: 'italic', margin: 0 }}>{qw.impact}</p></div>}
                          {(qw.systems || qw.systems_affected)?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                              {(qw.systems || qw.systems_affected).map((sys: string, j: number) => (
                                <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${C.emerald}12`, color: C.emerald }}>{sys}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </RevealCard>
                );
              })}
            </div>
          </div>
        );
      }
      case 'roadmap': {
        const phaseColors: Record<string, string> = { immediate: C.emerald, quick_win: C.emerald, foundation: C.blue, short_term: C.blue, strategic: C.purple, medium_term: C.purple, optimization: C.purple, long_term: C.textMuted };
        const phaseLabels: Record<string, string> = { immediate: 'Quick Win', quick_win: 'Quick Win', foundation: 'Short Term', short_term: 'Short Term', strategic: 'Medium Term', medium_term: 'Medium Term', optimization: 'Medium Term', long_term: 'Long Term' };
        const phaseDots = [{ pct: 16.5, label: '1' }, { pct: 50, label: '2' }, { pct: 83.5, label: '3' }];
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionHeader title="Roadmap" />
            <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${C.emerald} 33%, ${C.blue} 33% 66%, ${C.purple} 66%)`, marginBottom: 32, position: 'relative' }}>
              {phaseDots.map((d, i) => (
                <div key={i} style={{ position: 'absolute', left: `${d.pct}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 16, height: 16, borderRadius: 8, background: C.text, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{d.label}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {phaseOrder.map((phaseKey) => {
                const recs = recsByPhase[phaseKey] || [];
                if (recs.length === 0) return null;
                const phaseColor = phaseColors[phaseKey] || C.textMuted;
                const phaseLabel = phaseLabels[phaseKey] || phaseKey;
                return (
                  <div key={phaseKey}>
                    <RevealCard>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: phaseColor, padding: '4px 14px', borderRadius: 20, background: `${phaseColor}12`, border: `1px solid ${phaseColor}25` }}>{phaseLabel}</span>
                        <span style={{ ...TYPE.label }}>{recs.length} {recs.length === 1 ? 'item' : 'items'}</span>
                      </div>
                    </RevealCard>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {recs.map((rec: any, recIdx: number) => {
                        const rid = rec.id || rec.title || String(rec.priorityRank);
                        const isExpanded = expandedRec === rid;
                        const paybackSafe = (() => { const b = rec.annualBenefit ?? rec.annual_cost_savings ?? 0; const c = rec.estimatedCost ?? rec.estimated_cost ?? 0; if (c === 0) return '£0'; if (b <= 0 || !Number.isFinite(b)) return '—'; const months = Math.round(c / (b / 12)); return months < 1 ? '< 1 mo' : `${months} mo`; })();
                        return (
                          <RevealCard key={rid} delay={recIdx * STAGGER}>
                            <div style={{ ...glass({ padding: 20 }), borderLeft: `3px solid ${phaseColor}`, overflow: 'hidden' }}>
                              <button type="button" onClick={() => setExpandedRec(isExpanded ? null : rid)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 0, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 14, background: `${phaseColor}15`, color: phaseColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, ...mono }}>{rec.priorityRank ?? '-'}</div>
                                <span style={{ flex: 1, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '70%' }}>{rec.title}</span>
                                {isExpanded ? <ChevronUp style={{ color: C.textMuted, width: 16, height: 16, flexShrink: 0 }} /> : <ChevronDown style={{ color: C.textMuted, width: 16, height: 16, flexShrink: 0 }} />}
                              </button>
                              <div style={{ maxHeight: isExpanded ? 600 : 0, overflow: 'hidden', transition: `max-height 0.4s ${EASE.out}` }}>
                                <div style={{ paddingTop: 16 }}>
                                  {rec.description && <p style={{ ...TYPE.body, marginBottom: 16 }}>{rec.description}</p>}
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16 }}>
                                    <div><span style={{ ...TYPE.caption, color: C.textMuted }}>Investment</span><p style={{ ...TYPE.cardMetric, margin: '4px 0 0' }}>{fmt(rec.estimatedCost ?? rec.estimated_cost ?? 0)}</p></div>
                                    <div><span style={{ ...TYPE.caption, color: C.textMuted }}>Benefit</span><p style={{ ...TYPE.cardMetric, color: C.emerald, margin: '4px 0 0' }}>{fmt(rec.annualBenefit ?? rec.annual_cost_savings ?? 0)}/yr</p></div>
                                    <div><span style={{ ...TYPE.caption, color: C.textMuted }}>Hours</span><p style={{ ...TYPE.cardMetric, margin: '4px 0 0' }}>{rec.hoursSavedWeekly ?? rec.hours_saved_weekly ?? 0}h/wk</p></div>
                                    <div><span style={{ ...TYPE.caption, color: C.textMuted }}>Payback</span><p style={{ ...TYPE.cardMetric, margin: '4px 0 0' }}>{paybackSafe}</p></div>
                                  </div>
                                  {(rec.freedomUnlocked || rec.freedom_unlocked) && <div style={{ marginTop: 16, padding: 12, background: `${C.emerald}08`, borderRadius: 8, borderLeft: `3px solid ${C.emerald}40` }}><p style={{ fontSize: 13, color: C.emerald, lineHeight: 1.5, fontStyle: 'italic', margin: 0 }}>{rec.freedomUnlocked || rec.freedom_unlocked}</p></div>}
                                  {(rec.findingsAddressed || rec.findings_addressed)?.length > 0 && <p style={{ ...TYPE.caption, color: C.textMuted, marginTop: 12, fontStyle: 'italic' }}>Addresses: {(rec.findingsAddressed || rec.findings_addressed).join(', ')}</p>}
                                </div>
                              </div>
                            </div>
                          </RevealCard>
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
        const paybackDisplay = (m.paybackMonths <= 0 || !Number.isFinite(m.paybackMonths)) ? '—' : m.paybackMonths < 1 ? '< 1 mo' : `${Math.round(m.paybackMonths)} mo`;
        const roiDisplay = m.roiRatio || (totalInvestment > 0 ? `${(totalBenefit / totalInvestment).toFixed(1)}:1` : '—');
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionHeader title="Return on Investment" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'INVESTMENT', value: fmt(totalInvestment), color: C.text },
                { label: 'BENEFIT', value: `${fmtFull(totalBenefit)}/yr`, color: C.emerald },
                { label: 'PAYBACK', value: paybackDisplay, color: C.blue },
                { label: 'ROI', value: roiDisplay, color: C.purple, gradient: true },
              ].map((stat, i) => (
                <RevealCard key={i} delay={i * STAGGER}>
                  <div style={{ ...glass({ padding: 20, textAlign: 'center' }) }}>
                    <p style={{ ...TYPE.caption, color: C.textMuted, marginBottom: 8 }}>{stat.label}</p>
                    <p style={{ ...TYPE.sectionMetric, color: stat.color, ...(stat.gradient ? { background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : {}) }}>{stat.value}</p>
                  </div>
                </RevealCard>
              ))}
            </div>
            <RevealCard delay={300}>
              <div style={{ ...glass({ padding: 24 }) }}>
                <ROIWaterfall recommendations={displayRecs} />
              </div>
            </RevealCard>
            <RevealCard delay={400}>
              <div style={{ ...glass({ padding: 0, overflow: 'hidden' }) }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13, minWidth: 500 }}>
                    <thead>
                      <tr style={{ background: C.bg, position: 'sticky', top: 0 }}>
                        <th style={{ ...TYPE.caption, color: C.textMuted, padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>Phase</th>
                        <th style={{ ...TYPE.caption, color: C.textMuted, padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>Title</th>
                        <th style={{ ...TYPE.caption, color: C.textMuted, padding: '12px 16px', textAlign: 'right', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>Cost</th>
                        <th style={{ ...TYPE.caption, color: C.textMuted, padding: '12px 16px', textAlign: 'right', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>Benefit</th>
                        <th style={{ ...TYPE.caption, color: C.textMuted, padding: '12px 16px', textAlign: 'right', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRecs.map((r: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                          <td style={{ padding: '14px 16px' }}><PhaseBadge phase={r.implementationPhase || r.implementation_phase || 'short_term'} /></td>
                          <td style={{ padding: '14px 16px', color: C.text, maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', ...mono, color: C.text }}>{fmt(r.estimatedCost ?? r.estimated_cost ?? 0)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', ...mono, color: C.emerald }}>£{Number(r.annualBenefit ?? r.annual_cost_savings ?? 0).toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', ...mono, color: C.text }}>{r.hoursSavedWeekly ?? r.hours_saved_weekly ?? 0}h</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 700, borderTop: '2px solid rgba(0,0,0,0.08)' }}>
                        <td style={{ padding: '14px 16px', color: C.text }} colSpan={2}>Total</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', ...mono, color: C.text }}>{fmt(totalInvestment)}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', ...mono, color: C.emerald }}>£{totalBenefit.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', ...mono, color: C.text }}>{totalHoursSaved}h</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </RevealCard>
          </div>
        );
      }
      case 'monday': {
        const visionParas = splitNarrative(report?.time_freedom_narrative || '', 4);
        const clientPres = p1.clientPresentation || {};
        const mondayQuote = (clientPres as any).mondayMorning || visionParas[0] || facts?.mondayMorningVision || facts?.monday_morning_vision || '';
        const freedomStories = clientPres.freedomStories || (p1.adminGuidance && (p1.adminGuidance as any).freedomStories) || [];
        const freedomRecs = displayRecs.filter((r: any) => r.freedomUnlocked || r.freedom_unlocked);
        const storiesToShow = freedomStories.length > 0 ? freedomStories : freedomRecs;
        const paybackVal = totalInvestment > 0 && totalBenefit > 0 ? (totalInvestment / (totalBenefit / 12) < 1 ? '<1' : Math.round(totalInvestment / (totalBenefit / 12))) : '—';
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Dark cinematic hero */}
            <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #162340 0%, #0f172a 40%, #1e3156 100%)' }}>
              <DotGridOverlay opacity={0.06} size={20} />
              <NoiseOverlay opacity={0.25} />
              <div style={{ position: 'absolute', top: '-20%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', filter: 'blur(80px)', animation: 'float 20s ease infinite' }} />
              <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', filter: 'blur(80px)', animation: 'float 15s ease infinite 5s' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', filter: 'blur(80px)', animation: 'float 18s ease infinite 3s', transform: 'translate(-50%, -50%)' }} />
              <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(40px, 6vw, 64px)', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                  <Rocket style={{ width: 16, height: 16, color: C.emerald }} />
                  <span style={{ ...TYPE.caption, color: C.emerald }}>YOUR FUTURE</span>
                </div>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 32 }}>
                  Ready to Reclaim <span style={{ color: C.emerald }}>{totalHoursSaved}</span> Hours Every Week?
                </h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 32, flexWrap: 'wrap' }}>
                  <div style={{ borderRadius: 16, padding: '20px 32px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 140, background: 'rgba(16,185,129,0.15)' }}>
                    <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', ...mono, margin: 0 }}>{totalHoursSaved}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Hours/week reclaimed</p>
                  </div>
                  <div style={{ borderRadius: 16, padding: '20px 32px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 140, background: 'rgba(59,130,246,0.15)' }}>
                    <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', ...mono, margin: 0 }}>£{Math.round(totalBenefit / 1000)}k</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Annual benefit</p>
                  </div>
                  <div style={{ borderRadius: 16, padding: '20px 32px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 140, background: 'rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', ...mono, margin: 0 }}>{paybackVal}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Month payback</p>
                  </div>
                </div>
              </div>
            </div>

            {mondayQuote && (
              <RevealCard delay={200}>
                <div style={{ ...glass({ padding: 32 }), borderLeft: `4px solid ${C.emerald}`, background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(59,130,246,0.03))' }}>
                  <Quote style={{ width: 28, height: 28, color: C.emerald, opacity: 0.5, marginBottom: 12 }} />
                  <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 18, lineHeight: 1.8, color: C.text, maxWidth: '62ch', margin: 0 }}>&quot;{mondayQuote}&quot;</p>
                </div>
              </RevealCard>
            )}

            {visionParas.length > 0 && (
              <RevealCard delay={300}>
                <div style={{ ...glass({ padding: 32 }) }}>
                  <p style={{ ...TYPE.caption, color: C.text, marginBottom: 16 }}>HOW WE GET THERE</p>
                  {visionParas.map((para: string, i: number) => (
                    <p key={i} style={{ ...TYPE.body, maxWidth: '62ch', marginBottom: 16 }}>{para}</p>
                  ))}
                </div>
              </RevealCard>
            )}

            {(storiesToShow.length > 0 || freedomRecs.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
                {(storiesToShow as any[]).map((item: any, i: number) => {
                  const text = typeof item === 'string' ? item : (item.freedomUnlocked || item.freedom_unlocked || item.text || '');
                  if (!text) return null;
                  return (
                    <RevealCard key={i} delay={i * STAGGER}>
                      <div style={{ ...glass({ padding: 20 }), borderTop: `3px solid ${C.emerald}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 12, background: C.emerald, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                          <Star style={{ width: 12, height: 12, color: `${C.emerald}40` }} />
                        </div>
                        <p style={{ ...TYPE.body, fontSize: 14, margin: 0 }}>{text}</p>
                      </div>
                    </RevealCard>
                  );
                })}
              </div>
            )}

            <RevealCard delay={500}>
              <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #162340, #1e3a5f)' }}>
                <DotGridOverlay opacity={0.04} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 40, position: 'relative', zIndex: 1 }}>
                  <Phone style={{ width: 24, height: 24, color: C.emerald }} />
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Ready to Start?</h3>
                  <button type="button" onClick={() => navigate('/appointments')} style={{
                    background: `linear-gradient(135deg, ${C.emerald}, #059669)`, color: '#fff', padding: '14px 40px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700,
                    boxShadow: `0 0 30px rgba(16,185,129,0.4)`, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.3s ease',
                  }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 0 40px rgba(16,185,129,0.6)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 0 30px rgba(16,185,129,0.4)`; }}>
                    Book a Call <ArrowRight style={{ width: 18, height: 18 }} />
                  </button>
                </div>
              </div>
            </RevealCard>
          </div>
        );
      }

      default: return null;
    }
  };

  return (
    <div className="sa-report-root" style={{ background: '#F0F2F7', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#162340', display: 'flex' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes growWidth { from { width: 0%; } }
        .sa-report-root, .sa-report-root * { color-scheme: light; }
        .sa-report-content { background: #F0F2F7 !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <SASidebar />
      <div
        ref={contentRef}
        className="sa-report-content"
        style={{
          marginLeft: 220, flex: 1, padding: '24px 32px', overflowY: 'auto', height: '100vh',
          background: '#F0F2F7',
          opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', overflow: 'hidden' }}>
          {/* Client header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingBottom: 24, marginBottom: 24, borderBottom: `1px solid ${C.cardBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              <button type="button" onClick={() => navigate('/dashboard')} style={{ color: C.textMuted, padding: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="Back to dashboard"><ArrowLeft style={{ width: 20, height: 20 }} /></button>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{facts?.clientName || report?.headline || 'Systems Audit Report'}</h1>
                <p style={{ fontSize: 13, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[facts?.industry, facts?.teamSize && `Team: ${facts.teamSize}`, facts?.confirmedRevenue || facts?.revenueBand].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
              <CostClock annualCost={m.annualCostOfChaos} />
              <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>
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

