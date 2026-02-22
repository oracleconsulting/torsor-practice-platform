// ============================================================================
// SYSTEMS AUDIT CLIENT REPORT PAGE — DASHBOARD v3
// ============================================================================
// Client-facing report: Proof → Pattern → Price → Path → Plan → Future
//
// v3 CHANGES:
// - Light theme #F0F2F7 enforced everywhere
// - All content constrained within page bounds (no horizontal overflow)
// - Green ticks persist via localStorage (survive refresh/logout)
// - Systems cards open in isolated overlay (don't affect siblings)
// - Health page redesigned with dramatic visual treatment
// - Quick Wins redesigned with urgency and impact
// - Vision page is the showstopper finale
// - All expandable sections contained (no layout-breaking scroll)
// - Roadmap/ROI/Processes all respect boundaries
// - Tech Map contained with internal scroll
//
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
};

// Glass card base (light theme)
const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(22,35,64,0.06), 0 8px 32px rgba(22,35,64,0.04)',
  ...extra,
});

// Accent card
const accentCard = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  ...glass(),
  background: `${color}08`,
  border: `1px solid ${color}20`,
  ...extra,
});

// Mono font helper
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const label: React.CSSProperties = { fontSize: 10, color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, ...mono };

// ─── Content constraint wrapper ──────────────────────────────────────────────
// Every section gets this to prevent horizontal overflow
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

// ─── System Detail Overlay ───────────────────────────────────────────────────
// Opens as a floating panel over the card, doesn't affect other cards
function SystemDetailOverlay({ sys, borderColor, onClose }: { sys: any; borderColor: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(22,35,64,0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        ...glass({ padding: 0 }),
        borderLeft: `4px solid ${borderColor}`,
        maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(22,35,64,0.2)',
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${borderColor}12`, color: borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {(sys.name || sys.system_name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: C.text, fontSize: 16, margin: 0 }}>{sys.name || sys.system_name || 'System'}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
              {sys.cost != null && <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>{fmt(sys.cost)}/mo</span>}
              {sys.category && <span style={{ fontSize: 12, color: C.textMuted }}>{(sys.category || '').replace(/_/g, ' ')}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4 }}><X style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ padding: '16px 24px' }}>
          {sys.gaps?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ ...label, fontSize: 10, color: C.red }}>GAPS ({sys.gaps.length})</span>
              {sys.gaps.map((g: string, j: number) => (
                <p key={j} style={{ fontSize: 13, color: C.textSecondary, marginTop: 6, paddingLeft: 12, borderLeft: `2px solid ${C.red}40`, lineHeight: 1.6 }}>{g}</p>
              ))}
            </div>
          )}
          {sys.strengths?.length > 0 && (
            <div>
              <span style={{ ...label, fontSize: 10, color: C.emerald }}>STRENGTHS ({sys.strengths.length})</span>
              {sys.strengths.map((s: string, j: number) => (
                <p key={j} style={{ fontSize: 13, color: C.textSecondary, marginTop: 6, paddingLeft: 12, borderLeft: `2px solid ${C.emerald}40`, lineHeight: 1.6 }}>{s}</p>
              ))}
            </div>
          )}
          {(!sys.gaps?.length && !sys.strengths?.length) && (
            <p style={{ color: C.textMuted, fontSize: 13 }}>No detailed findings for this system.</p>
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
            {/* Hero banner */}
            <div style={{ background: 'linear-gradient(135deg, #162340 0%, #1e3a5f 50%, #1a3352 100%)', borderRadius: 20, padding: 'clamp(24px, 4vw, 40px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 8, ...mono }}>Systems Audit Report</div>
                <h1 style={{ fontSize: 'clamp(20px, 2.5vw, 32px)', fontWeight: 700, color: '#fff', marginBottom: 24, lineHeight: 1.3 }}>
                  {report?.headline || `Your systems are costing you £${(m.annualCostOfChaos / 1000).toFixed(0)}k a year — and it gets worse at scale.`}
                </h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  {[
                    { value: m.annualCostOfChaos, prefix: '£', color: C.red, label: 'Annual Cost' },
                    { value: m.hoursWastedWeekly, decimals: 1, color: C.orange, label: 'Hours Lost/Week' },
                    { value: (facts?.systems || []).length, color: C.blue, label: 'Systems', noAnimate: true },
                    { value: m.projectedCostAtScale, prefix: '£', color: '#8b5cf6', label: 'At Scale' },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <p style={{ fontSize: 'clamp(18px, 2vw, 26px)', fontWeight: 700, color: stat.color, ...mono, marginBottom: 4 }}>
                        {stat.noAnimate ? stat.value : <AnimatedCounter target={stat.value} prefix={stat.prefix || ''} decimals={(stat as any).decimals || 0} />}
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24, alignItems: 'start' }}>
              <div style={{ ...glass(), padding: 28, minWidth: 0 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: C.textMuted, textTransform: 'uppercase', marginBottom: 12, ...mono }}>In Brief</div>
                {splitNarrative(report?.executive_summary || '', 4).map((para: string, i: number) => (
                  <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: C.text, marginBottom: 16, maxWidth: '62ch' }}>{para}</p>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                <div style={{ ...glass(), padding: 20, background: 'rgba(22,35,64,0.04)' }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: C.textMuted, textTransform: 'uppercase', marginBottom: 12, ...mono }}>Your Business</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {facts?.teamSize && <div><span style={{ color: C.textLight, fontSize: 12 }}>Team</span><p style={{ color: C.text, fontWeight: 600 }}>{facts.teamSize}</p></div>}
                    {(facts?.confirmedRevenue ?? facts?.revenueBand) && <div><span style={{ color: C.textLight, fontSize: 12 }}>Revenue</span><p style={{ color: C.text, fontWeight: 600 }}>{typeof facts.confirmedRevenue === 'number' ? `£${(facts.confirmedRevenue / 1000).toFixed(0)}k` : facts.revenueBand || '-'}</p></div>}
                    {facts?.industry && <div><span style={{ color: C.textLight, fontSize: 12 }}>Industry</span><p style={{ color: C.text, fontWeight: 600 }}>{facts.industry}</p></div>}
                    {facts?.totalSystemCost != null && <div><span style={{ color: C.textLight, fontSize: 12 }}>Software spend</span><p style={{ color: C.text, fontWeight: 600 }}>{fmt(facts.totalSystemCost)}</p></div>}
                  </div>
                </div>
                {(facts?.desiredOutcomes?.length > 0) && (
                  <div style={{ ...glass(), padding: 20, background: 'rgba(16,185,129,0.06)', border: `1px solid ${C.emerald}20` }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: C.textMuted, textTransform: 'uppercase', marginBottom: 12, ...mono }}>Desired Outcomes</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {(facts.desiredOutcomes || []).map((o: string, i: number) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, color: C.text, fontSize: 14, lineHeight: 1.5 }}>
                          <CheckCircle2 style={{ width: 18, height: 18, color: C.emerald, flexShrink: 0, marginTop: 2 }} />
                          {displayOutcome(o)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ ...glass(), padding: 20, background: 'rgba(239,68,68,0.06)', border: `1px solid ${C.red}20` }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: C.textMuted, textTransform: 'uppercase', marginBottom: 8, ...mono }}>Live waste</div>
                  <CostClock annualCost={m.annualCostOfChaos} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'systems': {
        const totalGaps = systemsList.reduce((a: number, s: any) => a + (s.gaps?.length || 0), 0);
        const totalStrengths = systemsList.reduce((a: number, s: any) => a + (s.strengths?.length || 0), 0);
        return (
          <div style={sectionWrap}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>{systemsList.length} systems</h2>
                <p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>Audited across your technology stack</p>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}><span style={{ fontSize: 20, fontWeight: 700, color: C.red, ...mono }}>{totalGaps}</span><p style={{ fontSize: 10, color: C.textMuted, ...mono }}>GAPS</p></div>
                <div style={{ textAlign: 'center' }}><span style={{ fontSize: 20, fontWeight: 700, color: C.emerald, ...mono }}>{totalStrengths}</span><p style={{ fontSize: 10, color: C.textMuted, ...mono }}>STRENGTHS</p></div>
                {facts?.totalSystemCost != null && <div style={{ textAlign: 'center' }}><span style={{ fontSize: 20, fontWeight: 700, color: C.text, ...mono }}>{fmt(facts.totalSystemCost)}</span><p style={{ fontSize: 10, color: C.textMuted, ...mono }}>MONTHLY</p></div>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {systemsList.map((sys: any, i: number) => {
                const gapCount = sys.gaps?.length || 0;
                const borderColor = gapCount > 3 ? C.red : gapCount > 1 ? C.orange : gapCount === 1 ? '#eab308' : C.emerald;
                return (
                  <div key={i} onClick={() => setSelectedSystem(i)}
                    style={{ ...glass({ padding: 14, borderLeft: `3px solid ${borderColor}`, cursor: 'pointer', transition: 'box-shadow 0.2s ease, transform 0.2s ease' }) }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(22,35,64,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = C.cardShadow; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${borderColor}12`, color: borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {(sys.name || sys.system_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: C.text, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sys.name || sys.system_name || 'System'}</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                          {sys.cost != null && <span style={{ fontSize: 11, color: C.textMuted, ...mono }}>{fmt(sys.cost)}/mo</span>}
                          {gapCount > 0 && <span style={{ fontSize: 11, color: C.red, ...mono }}>{gapCount} gaps</span>}
                        </div>
                      </div>
                      <ChevronRight style={{ width: 14, height: 14, color: C.textLight }} />
                    </div>
                  </div>
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
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Dramatic health hero */}
            <div style={{
              background: `linear-gradient(135deg, ${overallColor}08 0%, ${overallColor}03 100%)`,
              border: `1px solid ${overallColor}20`,
              borderRadius: 20, padding: 32, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
            }}>
              <HealthRing score={overallScore} label="" size={160} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h2 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: 0 }}>
                    System Health
                  </h2>
                  <span style={{ fontSize: 14, fontWeight: 700, color: overallColor, padding: '4px 16px', borderRadius: 20, background: `${overallColor}15`, border: `1px solid ${overallColor}30`, ...mono }}>
                    {healthVerdict}
                  </span>
                </div>
                <p style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.7, maxWidth: '55ch', margin: 0 }}>
                  {overallScore < 30 ? 'Your systems are critically disconnected. Manual workarounds dominate daily operations, creating compounding errors and invisible costs.' :
                   overallScore < 50 ? 'Significant gaps exist across your technology stack. Key processes rely on manual intervention, limiting scalability.' :
                   overallScore < 70 ? 'Your systems have a reasonable foundation but key integration and automation gaps are holding you back.' :
                   'Your systems are well-connected with strong foundations. Focus on optimisation to unlock remaining value.'}
                </p>
              </div>
            </div>

            {/* Score breakdown — cards with bars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {healthItems.slice(1).map((item) => {
                const scoreColor = item.score < 30 ? C.red : item.score < 50 ? C.amber : item.score < 70 ? C.orange : C.emerald;
                return (
                  <div key={item.key} style={{
                    ...glass({ padding: 24 }),
                    background: `linear-gradient(180deg, ${scoreColor}06 0%, rgba(255,255,255,0.85) 100%)`,
                    borderTop: `3px solid ${scoreColor}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</span>
                      <span style={{ fontSize: 28, fontWeight: 700, color: scoreColor, ...mono }}>{item.score}</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ height: '100%', width: `${item.score}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}cc)`, borderRadius: 4, transition: 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)' }} />
                    </div>
                    {item.evidence && (
                      <p style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.6, margin: 0, maxHeight: 100, overflow: 'hidden' }}>{item.evidence}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {keyPersonFindings.length > 0 && (
              <div style={{ ...accentCard(C.red, { padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }) }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: `${C.red}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle style={{ width: 20, height: 20, color: C.red }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: C.text, fontSize: 16, margin: '0 0 4px' }}>Key Person Risk Detected</p>
                  <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{keyPersonFindings[0].description || keyPersonFindings[0].title}</p>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'chaos': {
        const chaosParas = splitNarrative(report?.cost_of_chaos_narrative || '', 4);
        const firstChaosPara = chaosParas[0] || '';
        const restChaosParas = chaosParas.slice(1);
        const quoteSource = displayFindings.find((f: any) => f.client_quote || f.clientQuote);
        const clientQuote = quoteSource?.client_quote || quoteSource?.clientQuote;

        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Annual Cost of Chaos', value: m.annualCostOfChaos, prefix: '£', color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)' },
                { label: `At ${m.growthMultiplier}x Scale`, value: m.projectedCostAtScale, prefix: '£', color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.15)' },
                { label: 'Hours Lost Weekly', value: m.hoursWastedWeekly, decimals: 1, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' },
              ].map((stat, i) => (
                <div key={i} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: stat.color, textTransform: 'uppercase', letterSpacing: 1, ...mono, marginBottom: 8 }}>{stat.label}</p>
                  <p style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: stat.color, ...mono }}>
                    <AnimatedCounter target={stat.value} prefix={stat.prefix || ''} decimals={(stat as any).decimals || 0} />
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ ...glass({ padding: 24 }) }}>
                <p style={{ ...label, marginBottom: 12 }}>The Pattern</p>
                <p style={{ fontSize: 15, lineHeight: 1.85, color: C.text, maxWidth: '55ch', margin: 0 }}>{firstChaosPara}</p>
              </div>
              {clientQuote ? (
                <div style={{ ...glass({ padding: 24, background: 'rgba(139,92,246,0.05)', borderLeft: '3px solid #8b5cf6' }) }}>
                  <Quote style={{ width: 24, height: 24, color: '#8b5cf6', opacity: 0.5, marginBottom: 8 }} />
                  <p style={{ fontSize: 15, fontStyle: 'italic', color: C.text, lineHeight: 1.7, fontFamily: "'Playfair Display', serif", margin: 0 }}>&quot;{clientQuote}&quot;</p>
                </div>
              ) : restChaosParas[0] ? (
                <div style={{ ...glass({ padding: 24 }) }}>
                  <p style={{ fontSize: 15, lineHeight: 1.85, color: C.textSecondary, maxWidth: '55ch', margin: 0 }}>{restChaosParas[0]}</p>
                </div>
              ) : null}
            </div>

            {restChaosParas.length > 1 && (
              <div style={{ ...glass({ padding: 24 }) }}>
                {restChaosParas.slice(clientQuote ? 0 : 1).map((para: string, i: number) => (
                  <p key={i} style={{ fontSize: 14, lineHeight: 1.8, color: C.textSecondary, marginBottom: 12, maxWidth: '62ch' }}>{para}</p>
                ))}
              </div>
            )}

            <div>
              <p style={{ ...label, marginBottom: 12 }}>Where the Hours Go</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {sortedProcesses.map((proc: any, i: number) => {
                  const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
                  const maxH = Math.max(...sortedProcesses.map((p: any) => p.hoursWasted ?? p.hours_wasted ?? 0), 1);
                  const color = hours > 60 ? '#ef4444' : hours > 30 ? '#f59e0b' : '#3B82F6';
                  return (
                    <div key={i} style={{ ...glass({ padding: '12px 16px' }), display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                        <ChainIcon code={proc.chainCode || proc.chain_code || ''} size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proc.chainName || proc.chain_name || proc.chainCode}</p>
                        <HoursBar hours={hours} maxHours={maxH} color={color} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
          <div style={sectionWrap}>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{sortedProcesses.length} process chains</h2>
            <p style={{ color: C.textMuted, marginBottom: 24 }}>Total {totalProcessHours}h wasted weekly</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedProcesses.map((proc: any) => {
                const isExpanded = expandedProcess === (proc.chainCode || proc.chain_code);
                const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
                const borderColor = hours > 60 ? C.red : hours > 30 ? C.orange : C.blue;
                const pct = maxProcessHours > 0 ? (hours / maxProcessHours) * 100 : 0;
                return (
                  <div key={proc.chainCode || proc.chain_code} style={{ ...glass(), borderLeft: `4px solid ${borderColor}`, overflow: 'hidden' }}>
                    <button type="button" onClick={() => setExpandedProcess(isExpanded ? null : (proc.chainCode || proc.chain_code))} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `${borderColor}06`, transition: 'width 0.6s ease', pointerEvents: 'none' }} />
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: `${borderColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}><ChainIcon code={proc.chainCode || proc.chain_code || ''} /></div>
                      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proc.chainName || proc.chain_name || proc.chainCode}</p>
                        <p style={{ fontSize: 12, color: C.textMuted, ...mono, margin: '2px 0 0' }}>{hours}h/week</p>
                      </div>
                      <span style={{ position: 'relative', flexShrink: 0 }}>{isExpanded ? <ChevronUp style={{ color: C.textMuted }} /> : <ChevronDown style={{ color: C.textMuted }} />}</span>
                    </button>
                    <div style={{ maxHeight: isExpanded ? 400 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                      <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.cardBorder}` }}>
                        <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {(proc.criticalGaps || proc.critical_gaps || []).length > 0 && (
                            <div>
                              <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 6, ...mono }}>Critical gaps</p>
                              {(proc.criticalGaps || proc.critical_gaps || []).map((g: string, j: number) => <p key={j} style={{ fontSize: 13, color: C.red, marginBottom: 4, lineHeight: 1.5 }}>{g}</p>)}
                            </div>
                          )}
                          {(proc.clientQuotes || proc.client_quotes || [])?.length > 0 && (proc.clientQuotes || proc.client_quotes).map((q: string, j: number) => (
                            <p key={j} style={{ fontSize: 13, fontStyle: 'italic', color: C.textMuted, lineHeight: 1.5 }}>&quot;{q}&quot;</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'findings':
        return (
          <div style={sectionWrap}>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{displayFindings.length} Findings</h2>
            <p style={{ color: C.textMuted, marginBottom: 24 }}>What We Found · Critical: {criticalCount} · High: {highCount}</p>
            <SeverityDotGrid findings={displayFindings} displayOutcomeFn={displayOutcome} />
          </div>
        );
      case 'techmap':
        return (
          <div style={sectionWrap}>
            {(systemsMaps?.length > 0 || (facts?.systems && facts.systems.length > 0)) ? (
              <div style={{
                borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.08)',
                maxHeight: 'calc(100vh - 140px)',
                overflowY: 'auto',
              }}>
                <SystemsMapSection systemsMaps={systemsMaps} facts={facts} layout="split" />
              </div>
            ) : (
              <div style={{ ...glass({ padding: 32, textAlign: 'center' }) }}>
                <p style={{ color: C.textMuted }}>Technology map not yet generated.</p>
              </div>
            )}
          </div>
        );
      case 'quickwins': {
        const qwList = quickWins || [];
        const totalQWHours = qwList.reduce((s: number, q: any) => s + (parseFloat(q.hoursSaved || q.hours_saved || q.hoursSavedWeekly || 0) || 0), 0);
        return (
          <div style={sectionWrap}>
            {/* Urgency hero banner */}
            <div style={{
              background: `linear-gradient(135deg, ${C.emerald}15, ${C.emerald}05)`,
              border: `2px solid ${C.emerald}30`,
              borderRadius: 20, padding: 28, marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Zap style={{ width: 28, height: 28, color: C.emerald }} />
                  <h2 style={{ color: C.text, fontSize: 26, fontWeight: 700, margin: 0 }}>Start This Week</h2>
                </div>
                <p style={{ color: C.textSecondary, fontSize: 15, margin: 0 }}>
                  {qwList.length} wins · zero cost · <span style={{ color: C.emerald, fontWeight: 700 }}>{totalQWHours}h saved every week</span>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.7)', borderRadius: 12 }}>
                  <p style={{ fontSize: 28, fontWeight: 700, color: C.emerald, ...mono, margin: 0 }}>£0</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: '4px 0 0' }}>Investment</p>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.7)', borderRadius: 12 }}>
                  <p style={{ fontSize: 28, fontWeight: 700, color: C.emerald, ...mono, margin: 0 }}>+{totalQWHours}h</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: '4px 0 0' }}>Per Week</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {qwList.map((qw: any, i: number) => {
                const isExpanded = expandedQW === i;
                const hoursSaved = parseFloat(qw.hoursSaved || qw.hours_saved || qw.hoursSavedWeekly || 0) || 0;
                return (
                  <div key={i} style={{ ...glass(), overflow: 'hidden', borderLeft: `4px solid ${C.emerald}` }}>
                    <button type="button" onClick={() => setExpandedQW(isExpanded ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 18, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: `${C.emerald}20`, color: C.emerald, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: C.text, fontSize: 15, margin: 0, lineHeight: 1.4 }}>
                          {qw.owner && <span style={{ color: C.blue, fontWeight: 700 }}>{qw.owner}: </span>}
                          {qw.title || qw.action?.slice(0, 80) || 'Quick Win'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 18, fontWeight: 700, color: C.emerald, ...mono, margin: 0 }}>+{hoursSaved}h</p>
                        {qw.timeToImplement && <p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0' }}>{qw.timeToImplement}</p>}
                      </div>
                      <span style={{ flexShrink: 0 }}>{isExpanded ? <ChevronUp style={{ color: C.textMuted }} /> : <ChevronDown style={{ color: C.textMuted }} />}</span>
                    </button>
                    <div style={{ maxHeight: isExpanded ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${C.cardBorder}` }}>
                        <div style={{ paddingTop: 12 }}>
                          {qw.action && <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 8 }}>{qw.action}</p>}
                          {qw.impact && <p style={{ fontSize: 13, color: C.emerald, marginBottom: 8, lineHeight: 1.5, padding: '8px 12px', background: `${C.emerald}08`, borderRadius: 8, borderLeft: `3px solid ${C.emerald}` }}>{qw.impact}</p>}
                          {(qw.systems || qw.systems_affected)?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                              {(qw.systems || qw.systems_affected).map((sys: string, j: number) => (
                                <span key={j} style={{ fontSize: 11, background: 'rgba(0,0,0,0.06)', color: C.textMuted, padding: '4px 8px', borderRadius: 6 }}>{sys}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'roadmap': {
        const phaseColors: Record<string, string> = { immediate: C.emerald, quick_win: C.emerald, foundation: C.blue, short_term: C.blue, strategic: C.purple, medium_term: C.purple, optimization: '#6366f1', long_term: C.textMuted };
        const phaseLabels: Record<string, string> = { immediate: 'Quick Win', quick_win: 'Quick Win', foundation: 'Foundation', short_term: 'Short Term', strategic: 'Strategic', medium_term: 'Medium Term', optimization: 'Optimisation', long_term: 'Long Term' };
        return (
          <div style={sectionWrap}>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Roadmap</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {phaseOrder.map((phaseKey) => {
                const recs = recsByPhase[phaseKey] || [];
                if (recs.length === 0) return null;
                const phaseColor = phaseColors[phaseKey] || C.textMuted;
                const phaseLabel = phaseLabels[phaseKey] || phaseKey;
                return (
                  <div key={phaseKey}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: phaseColor, boxShadow: `0 0 8px ${phaseColor}40`, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: phaseColor, ...mono }}>{phaseLabel.toUpperCase()}</span>
                      <div style={{ flex: 1, height: 1, background: `${phaseColor}20` }} />
                      <span style={{ fontSize: 11, color: C.textMuted }}>{recs.length} {recs.length === 1 ? 'item' : 'items'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 22 }}>
                      {recs.map((rec: any) => {
                        const rid = rec.id || rec.title || String(rec.priorityRank);
                        const isExpanded = expandedRec === rid;
                        return (
                          <div key={rid} style={{ ...glass(), padding: 0, borderLeft: `3px solid ${phaseColor}`, overflow: 'hidden' }}>
                            <button type="button" onClick={() => setExpandedRec(isExpanded ? null : rid)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                              <div style={{ width: 24, height: 24, borderRadius: 12, background: `${phaseColor}15`, color: phaseColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, ...mono }}>{rec.priorityRank ?? '-'}</div>
                              <span style={{ flex: 1, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{rec.title}</span>
                              <span style={{ flexShrink: 0 }}>{isExpanded ? <ChevronUp style={{ color: C.textMuted, width: 16, height: 16 }} /> : <ChevronDown style={{ color: C.textMuted, width: 16, height: 16 }} />}</span>
                            </button>
                            <div style={{ maxHeight: isExpanded ? 500 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                              <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${C.cardBorder}` }}>
                                {rec.description && <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 12 }}>{rec.description}</p>}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: 12 }}>
                                  <div><span style={{ fontSize: 10, color: C.textLight, ...mono }}>Investment</span><p style={{ fontWeight: 600, color: C.text, margin: '4px 0 0' }}>{fmt(rec.estimatedCost ?? rec.estimated_cost)}</p></div>
                                  <div><span style={{ fontSize: 10, color: C.textLight, ...mono }}>Benefit</span><p style={{ fontWeight: 600, color: C.emerald, margin: '4px 0 0' }}>{fmt(rec.annualBenefit ?? rec.annual_cost_savings)}/yr</p></div>
                                  <div><span style={{ fontSize: 10, color: C.textLight, ...mono }}>Hours</span><p style={{ fontWeight: 600, color: C.text, margin: '4px 0 0' }}>{rec.hoursSavedWeekly ?? rec.hours_saved_weekly ?? 0}h/wk</p></div>
                                  <div><span style={{ fontSize: 10, color: C.textLight, ...mono }}>Payback</span><p style={{ fontWeight: 600, color: C.text, margin: '4px 0 0' }}>{(() => { const b = rec.annualBenefit ?? rec.annual_cost_savings ?? 0; const c = rec.estimatedCost ?? rec.estimated_cost ?? 0; if (c === 0) return '£0'; if (b <= 0) return '—'; const months = Math.round(c / (b / 12)); return months < 1 ? '< 1 mo' : `${months} mo`; })()}</p></div>
                                </div>
                                {(rec.freedomUnlocked || rec.freedom_unlocked) && <p style={{ fontSize: 13, color: C.emerald, marginTop: 8, padding: '8px 12px', background: `${C.emerald}08`, borderRadius: 8, lineHeight: 1.5 }}>{rec.freedomUnlocked || rec.freedom_unlocked}</p>}
                                {(rec.findingsAddressed || rec.findings_addressed)?.length > 0 && <p style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>Addresses: {(rec.findingsAddressed || rec.findings_addressed).join(', ')}</p>}
                              </div>
                            </div>
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
        const paybackMonths = totalBenefit > 0 && totalInvestment > 0 ? (totalInvestment / (totalBenefit / 12)) : 0;
        const paybackDisplay = paybackMonths <= 0 || !Number.isFinite(paybackMonths) ? '—' : paybackMonths < 1 ? '<1 mo' : `${Math.round(paybackMonths)} mo`;
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700 }}>Return on Investment</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              {[
                { label: 'Investment', value: fmt(totalInvestment), color: C.text },
                { label: 'Benefit', value: `£${totalBenefit.toLocaleString()}/yr`, color: C.emerald },
                { label: 'Payback', value: paybackDisplay, color: C.text },
                { label: 'ROI', value: totalInvestment > 0 ? `${(totalBenefit / totalInvestment).toFixed(1)}:1` : '—', color: C.blue },
              ].map((stat, i) => (
                <div key={i} style={{ ...glass(), padding: 20, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, ...mono }}>{stat.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: stat.color, ...mono }}>{stat.value}</p>
                </div>
              ))}
            </div>
            <ROIWaterfall recommendations={displayRecs} />
            <div style={{ ...glass(), overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.cardBorder}`, background: 'rgba(0,0,0,0.02)' }}>
                      <th style={{ textAlign: 'left', padding: 12, color: C.textMuted, fontWeight: 600 }}>Phase</th>
                      <th style={{ textAlign: 'left', padding: 12, color: C.textMuted, fontWeight: 600 }}>Title</th>
                      <th style={{ textAlign: 'right', padding: 12, color: C.textMuted, fontWeight: 600 }}>Cost</th>
                      <th style={{ textAlign: 'right', padding: 12, color: C.textMuted, fontWeight: 600 }}>Benefit</th>
                      <th style={{ textAlign: 'right', padding: 12, color: C.textMuted, fontWeight: 600 }}>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecs.map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                        <td style={{ padding: 12 }}><PhaseBadge phase={r.implementationPhase || r.implementation_phase || 'short_term'} /></td>
                        <td style={{ padding: 12, color: C.text, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</td>
                        <td style={{ padding: 12, textAlign: 'right', ...mono, color: C.text }}>{fmt(r.estimatedCost ?? r.estimated_cost)}</td>
                        <td style={{ padding: 12, textAlign: 'right', ...mono, color: C.emerald }}>£{(r.annualBenefit ?? r.annual_cost_savings ?? 0).toLocaleString()}</td>
                        <td style={{ padding: 12, textAlign: 'right', ...mono, color: C.text }}>{r.hoursSavedWeekly ?? r.hours_saved_weekly ?? 0}h</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'rgba(0,0,0,0.03)', fontWeight: 600 }}>
                      <td style={{ padding: 12, color: C.text }} colSpan={2}>Total</td>
                      <td style={{ padding: 12, textAlign: 'right', ...mono, color: C.text }}>{fmt(totalInvestment)}</td>
                      <td style={{ padding: 12, textAlign: 'right', ...mono, color: C.emerald }}>£{totalBenefit.toLocaleString()}</td>
                      <td style={{ padding: 12, textAlign: 'right', ...mono, color: C.text }}>{totalHoursSaved}h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }
      case 'monday': {
        const freedomRecs = displayRecs.filter((r: any) => r.freedomUnlocked || r.freedom_unlocked);
        const visionParas = splitNarrative(report?.time_freedom_narrative || '', 3);
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Hero — full-width gradient banner */}
            <div style={{
              background: 'linear-gradient(135deg, #162340 0%, #0f172a 40%, #1e3156 100%)',
              borderRadius: 24, padding: 'clamp(32px, 5vw, 56px)', position: 'relative', overflow: 'hidden', marginBottom: 24,
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.06) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Rocket style={{ width: 28, height: 28, color: C.emerald }} />
                  <span style={{ fontSize: 12, letterSpacing: 3, color: C.emerald, textTransform: 'uppercase', ...mono }}>Your Future</span>
                </div>
                <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 24 }}>
                  Ready to Reclaim <span style={{ color: C.emerald }}>{totalHoursSaved} Hours</span> Every Week?
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div style={{ background: 'rgba(16,185,129,0.15)', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <p style={{ fontSize: 36, fontWeight: 700, color: C.emerald, ...mono }}>{totalHoursSaved}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Hours/week reclaimed</p>
                  </div>
                  <div style={{ background: 'rgba(59,130,246,0.15)', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid rgba(59,130,246,0.25)' }}>
                    <p style={{ fontSize: 36, fontWeight: 700, color: '#60a5fa', ...mono }}>£{(totalBenefit / 1000).toFixed(0)}k</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Annual benefit</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', ...mono }}>
                      {totalInvestment > 0 && totalBenefit > 0 ? (totalInvestment / (totalBenefit / 12) < 1 ? '<1' : Math.round(totalInvestment / (totalBenefit / 12))) : '—'}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Month payback</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monday morning vision quote */}
            {(facts?.mondayMorningVision || facts?.monday_morning_vision) && (
              <div style={{
                ...glass({ padding: 28 }),
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.04))',
                borderLeft: `4px solid ${C.emerald}`,
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Quote style={{ width: 28, height: 28, color: C.emerald, opacity: 0.6, flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 18, fontStyle: 'italic', color: C.text, lineHeight: 1.7, fontFamily: "'Playfair Display', serif", margin: 0 }}>
                    &quot;{facts.mondayMorningVision || facts.monday_morning_vision}&quot;
                  </p>
                </div>
              </div>
            )}

            {/* How We Get There — narrative */}
            {visionParas.length > 0 && (
              <div style={{ ...glass({ padding: 28 }), marginBottom: 24 }}>
                <p style={{ ...label, marginBottom: 16 }}>How We Get There</p>
                {visionParas.map((para: string, i: number) => (
                  <p key={i} style={{ fontSize: 15, lineHeight: 1.85, color: C.text, marginBottom: 16, maxWidth: '62ch' }}>{para}</p>
                ))}
              </div>
            )}

            {/* Freedom stories — what each fix unlocks */}
            {freedomRecs.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ ...label, marginBottom: 12 }}>What Each Step Unlocks</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {freedomRecs.map((rec: any, i: number) => (
                    <div key={i} style={{
                      ...glass({ padding: 20 }),
                      background: 'rgba(16,185,129,0.06)',
                      border: `1px solid ${C.emerald}20`,
                      borderTop: `3px solid ${C.emerald}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Star style={{ width: 14, height: 14, color: C.emerald }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.emerald, ...mono }}>STEP {rec.priorityRank || i + 1}</span>
                      </div>
                      <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, margin: 0 }}>{rec.freedomUnlocked || rec.freedom_unlocked}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA — Book a Call */}
            <div style={{
              background: 'linear-gradient(135deg, #162340, #1e3a5f)',
              borderRadius: 20, padding: 'clamp(28px, 4vw, 40px)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Phone style={{ width: 22, height: 22, color: C.emerald }} />
                  Ready to Start?
                </h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Let&apos;s discuss these findings and build your implementation timeline.</p>
              </div>
              <button type="button" onClick={() => navigate('/appointments')} style={{
                position: 'relative', zIndex: 1,
                padding: '16px 36px', fontSize: 17, fontWeight: 700,
                background: `linear-gradient(135deg, ${C.emerald}, #059669)`,
                color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer',
                boxShadow: `0 0 30px ${C.emerald}50`,
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 40px ${C.emerald}60`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 0 30px ${C.emerald}50`; }}>
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
    <div className="sa-report-root" style={{ background: '#F0F2F7', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#162340', display: 'flex' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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

