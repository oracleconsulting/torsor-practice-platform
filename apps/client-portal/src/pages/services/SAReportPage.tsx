// ============================================================================
// SYSTEMS AUDIT CLIENT REPORT PAGE — v5 PREMIUM VISUAL REWRITE
// ============================================================================
// Client-facing report: Proof → Pattern → Price → Path → Plan → Future
//
// v5: Section-by-section visual refinement from v4.
//     - Bolder glass cards (higher opacity, visible borders, stronger shadows)
//     - Better typography (larger body, darker text, proper containment)
//     - Fixed overflow/truncation issues throughout
//     - Emotional pacing: alarm on Health/Cost, aspiration on Vision
//     - Process names visible in collapsed state
//     - Findings auto-selects first item
//     - Color usage more intentional (red = danger, emerald = future)
//
// Data layer is IDENTICAL to v4. GOLDEN RULE: pass1_data is the single source of truth.
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

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v5 — BOLDER, DEEPER, ALIVE
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  navy: '#162340',
  navyLight: '#1e3156',
  blue: '#2563EB',        // deeper blue — more authority
  red: '#DC2626',         // deeper red — more urgency
  orange: '#EA580C',      // deeper orange — more warmth
  amber: '#D97706',       // richer amber
  emerald: '#059669',     // deeper emerald — more premium
  emeraldLight: '#10B981',
  purple: '#7C3AED',      // deeper purple — more premium
  bg: '#F0F2F7',
  cardBg: 'rgba(255,255,255,0.97)',
  cardBorder: 'rgba(22,35,64,0.08)',
  text: '#0F172A',        // near-black — much better readability
  textSecondary: '#334155', // darker secondary
  textMuted: '#64748b',
  textLight: '#94a3b8',
};

// Bolder shadow system — actually visible
const SHADOW = {
  sm: '0 1px 3px rgba(22,35,64,0.08), 0 4px 12px rgba(22,35,64,0.06)',
  md: '0 4px 12px rgba(22,35,64,0.1), 0 8px 24px rgba(22,35,64,0.08)',
  lg: '0 12px 32px rgba(22,35,64,0.12), 0 4px 12px rgba(22,35,64,0.08)',
  glow: (color: string, intensity = 0.3) => `0 0 32px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}, 0 0 8px ${color}20`,
  colorLift: (color: string) => `0 8px 24px ${color}30, 0 2px 8px ${color}18`,
};

// Motion
const EASE = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
};

// v5 Glass card — MORE opaque, visible border, real shadow
const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.97)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(22, 35, 64, 0.08)',
  borderRadius: 16,
  boxShadow: SHADOW.sm,
  ...extra,
});

// Accent card — stronger tint, visible accent
const accentCard = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  ...glass(),
  borderLeft: `4px solid ${color}`,
  background: `linear-gradient(135deg, ${color}08 0%, rgba(255,255,255,0.97) 60%)`,
  ...extra,
});

// Mono font helper
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const label: React.CSSProperties = { fontSize: 11, color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600, ...mono };

// Content constraint wrapper
const sectionWrap: React.CSSProperties = {
  maxWidth: '100%',
  overflow: 'hidden',
  wordBreak: 'break-word' as const,
};

// ─── Types (FROZEN) ──────────────────────────────────────────────────────────

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

// ─── Metric Resolution (FROZEN — do not touch) ─────────────────────────────

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

// ═══════════════════════════════════════════════════════════════════════════════
// v5 VISUAL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Animated Counter (scroll-triggered) ────────────────────────────────────
function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000, decimals = 0 }: {
  target: number; prefix?: string; suffix?: string; duration?: number; decimals?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => { started.current = false; setVal(0); }, [target]);
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

// ─── Scroll Reveal Hook ─────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold, rootMargin: '0px 0px -30px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── RevealCard — scroll-enter + hover-lift ─────────────────────────────────
function RevealCard({ children, delay = 0, style, className }: {
  children: ReactNode; delay?: number; style?: React.CSSProperties; className?: string;
}) {
  const { ref, visible } = useScrollReveal();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      ref={ref}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? (hovered ? 'translateY(-3px)' : 'translateY(0)')
          : 'translateY(16px)',
        transition: `opacity 0.5s ${EASE.out} ${delay}ms, transform 0.5s ${EASE.out} ${delay}ms, box-shadow 0.3s ${EASE.out}`,
        boxShadow: hovered ? SHADOW.md : (style?.boxShadow || SHADOW.sm),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Dot Grid Overlay ────────────────────────────────────────────────────────
function DotGrid({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `radial-gradient(circle, rgba(22,35,64,${opacity}) 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
    }} />
  );
}

// ─── SVG Noise Overlay ───────────────────────────────────────────────────────
function NoiseOverlay({ opacity = 0.3 }: { opacity?: number }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', opacity,
      mixBlendMode: 'soft-light',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
    }} />
  );
}

// ─── Progress Ring (270° SVG arc gauge) ──────────────────────────────────────
function ProgressRing({ score, size = 140, strokeWidth = 12, color, ringLabel, delay = 0 }: {
  score: number; size?: number; strokeWidth?: number; color: string; ringLabel?: string; delay?: number;
}) {
  const { ref, visible } = useScrollReveal();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const arc = circumference * 0.75;
  const offset = arc - (score / 100) * arc;
  const uid = `ring-${ringLabel || 'x'}-${score}`;

  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}88`} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth}
          strokeDasharray={`${arc} ${circumference}`} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`url(#${uid})`} strokeWidth={strokeWidth}
          strokeDasharray={`${arc} ${circumference}`}
          strokeDashoffset={visible ? offset : arc}
          strokeLinecap="round"
          style={{ transition: `stroke-dashoffset 1.5s ${EASE.out} ${delay}ms`, filter: `drop-shadow(0 0 8px ${color}50)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.24, fontWeight: 800, color, ...mono, fontVariantNumeric: 'tabular-nums' }}>
          {visible ? <AnimatedCounter target={score} duration={1600} /> : '0'}
        </span>
        {ringLabel && <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2, ...mono }}>{ringLabel}</span>}
      </div>
    </div>
  );
}

// ─── Process Chain Icon ──────────────────────────────────────────────────────
function ChainIcon({ code, size = 16 }: { code: string; size?: number }) {
  const icons: Record<string, any> = {
    quote_to_cash: PoundSterling, record_to_report: BarChart3, procure_to_pay: DollarSign,
    hire_to_retire: Users, lead_to_client: Target, comply_to_confirm: Shield, project_to_delivery: Workflow,
  };
  const Icon = icons[code] || Workflow;
  return <Icon style={{ width: size, height: size }} />;
}

// ─── Phase Badge ─────────────────────────────────────────────────────────────
function PhaseBadge({ phase }: { phase: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    immediate: { bg: `${C.emerald}18`, color: C.emerald, label: 'Quick Win' },
    quick_win: { bg: `${C.emerald}18`, color: C.emerald, label: 'Quick Win' },
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

// ─── Severity Dot Grid (findings) — v5: auto-select first, better layout ────
function SeverityDotGrid({ findings, displayOutcomeFn }: { findings: any[]; displayOutcomeFn: (outcome: string) => string }) {
  const [active, setActive] = useState<number | null>(findings.length > 0 ? 0 : null);
  const colors: Record<string, string> = { critical: C.red, high: C.orange, medium: C.amber, low: C.blue };

  return (
    <div style={sectionWrap}>
      {/* Finding cards list — v5: vertical list instead of dots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {findings.map((f: any, i: number) => {
          const c = colors[f.severity] || '#64748b';
          const isActive = active === i;
          return (
            <div key={i} onClick={() => setActive(isActive ? null : i)}
              style={{
                padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                background: isActive ? `${c}10` : 'rgba(255,255,255,0.97)',
                border: `1px solid ${isActive ? c : 'rgba(22,35,64,0.06)'}`,
                borderLeft: `4px solid ${c}`,
                display: 'flex', alignItems: 'center', gap: 12,
                transition: `all 0.25s ${EASE.out}`,
                boxShadow: isActive ? SHADOW.colorLift(c) : SHADOW.sm,
                transform: isActive ? 'scale(1.01)' : 'scale(1)',
              }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: c, padding: '2px 8px', borderRadius: 4, background: `${c}15`, ...mono, flexShrink: 0 }}>{f.severity}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title || 'Finding'}</span>
              <ChevronRight style={{ width: 16, height: 16, color: C.textMuted, flexShrink: 0, transform: isActive ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
            </div>
          );
        })}
      </div>

      {/* Selected finding detail */}
      {active !== null && findings[active] && (() => {
        const f = findings[active];
        const c = colors[f.severity] || '#64748b';
        const hoursVal = f.hours_wasted_weekly ?? f.hoursWastedWeekly ?? f.hoursPerWeek ?? 0;
        const costVal = f.annual_cost_impact ?? f.annualCostImpact ?? f.annualCost ?? 0;
        const affected = f.affected_systems ?? f.affectedSystems ?? [];
        return (
          <RevealCard style={{ ...glass({ padding: 28 }), border: `1px solid ${c}25`, borderLeft: `4px solid ${c}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#fff', padding: '4px 10px', borderRadius: 6, background: c, ...mono }}>{f.severity}</span>
              {f.category && <span style={{ fontSize: 11, color: C.textMuted, ...mono }}>{(f.category || '').replace(/_/g, ' ')}</span>}
              <button onClick={() => setActive(null)} style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <h4 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 12, lineHeight: 1.4 }}>{f.title}</h4>
            <p style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.75, marginBottom: 20 }}>{f.description}</p>
            {(f.evidence && f.evidence.length > 0) && (
              <div style={{ marginBottom: 20 }}>
                <span style={{ ...label, marginBottom: 8, display: 'block' }}>Evidence</span>
                {f.evidence.map((e: string, j: number) => (
                  <p key={j} style={{ color: C.textSecondary, fontSize: 14, marginTop: 6, paddingLeft: 14, borderLeft: `3px solid ${C.amber}60`, lineHeight: 1.65 }}>{e}</p>
                ))}
              </div>
            )}
            {(f.client_quote || f.clientQuote) && (
              <div style={{ padding: '16px 20px', background: `${C.purple}06`, borderRadius: 12, marginBottom: 20, borderLeft: `3px solid ${C.purple}50` }}>
                <p style={{ color: C.text, fontSize: 15, fontStyle: 'italic', lineHeight: 1.75, fontFamily: "'Playfair Display', serif" }}>&quot;{f.client_quote || f.clientQuote}&quot;</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {hoursVal > 0 && (
                <div>
                  <span style={{ ...label }}>Hours/week</span>
                  <p style={{ fontSize: 26, fontWeight: 700, color: C.blue, margin: '6px 0 0', ...mono, fontVariantNumeric: 'tabular-nums' }}>{hoursVal}</p>
                </div>
              )}
              {costVal > 0 && (
                <div>
                  <span style={{ ...label }}>Annual cost</span>
                  <p style={{ fontSize: 26, fontWeight: 700, color: C.red, margin: '6px 0 0', ...mono, fontVariantNumeric: 'tabular-nums' }}>£{Number(costVal).toLocaleString()}</p>
                </div>
              )}
              {Array.isArray(affected) && affected.length > 0 && (
                <div>
                  <span style={{ ...label }}>Affects</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {affected.map((s: string, j: number) => (
                      <span key={j} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: `${C.blue}10`, color: C.blue, border: `1px solid ${C.blue}20`, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {f.recommendation && (
              <div style={{ marginTop: 20, padding: '14px 18px', background: `${C.emerald}06`, borderLeft: `3px solid ${C.emerald}50`, borderRadius: '0 10px 10px 0' }}>
                <span style={{ ...label, color: C.emerald }}>Recommendation</span>
                <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 6, lineHeight: 1.65 }}>{f.recommendation}</p>
              </div>
            )}
            {(f.scalability_impact || f.scalabilityImpact || f.blocks_goal || f.blocksGoal) && (
              <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                {(f.scalability_impact || f.scalabilityImpact) && (
                  <span style={{ fontSize: 12, color: C.amber, background: `${C.amber}10`, padding: '4px 12px', borderRadius: 6, fontWeight: 500 }}>
                    Scalability: {f.scalability_impact || f.scalabilityImpact}
                  </span>
                )}
                {(f.blocks_goal || f.blocksGoal) && (
                  <span style={{ fontSize: 12, color: C.purple, background: `${C.purple}10`, padding: '4px 12px', borderRadius: 6, fontWeight: 500 }}>
                    Blocks: {displayOutcomeFn(f.blocks_goal || f.blocksGoal || '')}
                  </span>
                )}
              </div>
            )}
          </RevealCard>
        );
      })()}
    </div>
  );
}

// ─── ROI Waterfall ───────────────────────────────────────────────────────────
function ROIWaterfall({ recommendations }: { recommendations: any[] }) {
  const { ref, visible } = useScrollReveal();
  const [hovered, setHovered] = useState<number | string | null>(null);
  const maxBenefit = Math.max(...recommendations.map(r => r.annualBenefit || r.annual_cost_savings || 0), 1);
  return (
    <div ref={ref} style={{ ...glass({ padding: 28 }), overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 220, paddingBottom: 40, position: 'relative', overflow: 'hidden' }}>
        {recommendations.map((r: any, i: number) => {
          const benefit = r.annualBenefit || r.annual_cost_savings || 0;
          const h = (benefit / maxBenefit) * 160;
          const isHovered = hovered === i;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: 0 }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {isHovered && (
                <div style={{ position: 'absolute', bottom: h + 48, left: '50%', transform: 'translateX(-50%)',
                  ...glass({ padding: '10px 14px' }), minWidth: 180, zIndex: 10, pointerEvents: 'none', boxShadow: SHADOW.lg }}>
                  <p style={{ color: C.text, fontSize: 12, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{r.title}</p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: 9, color: C.textMuted, ...mono }}>BENEFIT</span>
                      <p style={{ color: C.emerald, fontSize: 13, fontWeight: 700, margin: '2px 0 0', ...mono }}>£{benefit.toLocaleString()}/yr</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 9, color: C.textMuted, ...mono }}>COST</span>
                      <p style={{ color: C.amber, fontSize: 13, fontWeight: 700, margin: '2px 0 0', ...mono }}>{(r.estimatedCost || r.estimated_cost || 0) > 0 ? `£${(r.estimatedCost || r.estimated_cost || 0).toLocaleString()}` : '£0'}</p>
                    </div>
                  </div>
                </div>
              )}
              <div style={{
                width: '100%', maxWidth: 56, height: visible ? h : 0, borderRadius: '8px 8px 0 0', cursor: 'pointer',
                background: isHovered ? `linear-gradient(180deg, ${C.emerald}, ${C.emeraldLight})` : `linear-gradient(180deg, ${C.emerald}cc, ${C.emeraldLight}88)`,
                transition: `height 0.8s ${EASE.spring} ${i * 80}ms, background 0.3s ease, box-shadow 0.3s ease`,
                boxShadow: isHovered ? SHADOW.glow(C.emerald, 0.35) : 'none',
              }} />
              <span style={{ position: 'absolute', bottom: -28, fontSize: 10, color: C.textMuted, ...mono, textAlign: 'center', width: '100%', fontWeight: 600 }}>R{i + 1}</span>
            </div>
          );
        })}
        {/* Total bar */}
        <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: 0 }}
          onMouseEnter={() => setHovered('total')} onMouseLeave={() => setHovered(null)}>
          <div style={{
            width: '100%', maxWidth: 72, height: visible ? 180 : 0, borderRadius: '8px 8px 0 0', cursor: 'pointer',
            background: hovered === 'total' ? `linear-gradient(180deg, ${C.blue}, #1d4ed8)` : `linear-gradient(180deg, ${C.blue}cc, #2563EB99)`,
            transition: `height 0.8s ${EASE.spring} ${recommendations.length * 80}ms, background 0.3s ease`,
            boxShadow: hovered === 'total' ? SHADOW.glow(C.blue, 0.35) : 'none',
          }} />
          <span style={{ position: 'absolute', bottom: -28, fontSize: 10, color: C.blue, ...mono, fontWeight: 700, textAlign: 'center', width: '100%' }}>TOTAL</span>
        </div>
      </div>
    </div>
  );
}

// ─── System Detail Overlay ───────────────────────────────────────────────────
function SystemDetailOverlay({ sys, borderColor, onClose }: { sys: any; borderColor: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.6)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, borderLeft: `4px solid ${borderColor}`,
        maxWidth: 600, width: '100%', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: SHADOW.lg,
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${borderColor}15`, color: borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            {(sys.name || sys.system_name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: C.text, fontSize: 18, margin: 0 }}>{sys.name || sys.system_name || 'System'}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
              {sys.cost != null && <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>{fmt(sys.cost)}/mo</span>}
              {sys.category && <span style={{ fontSize: 12, color: C.textMuted }}>{(sys.category || '').replace(/_/g, ' ')}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: sys.gaps?.length > 0 && sys.strengths?.length > 0 ? '1fr 1fr' : '1fr', gap: 24 }}>
          {sys.gaps?.length > 0 && (
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: '0.08em', textTransform: 'uppercase', ...mono }}>GAPS ({sys.gaps.length})</span>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sys.gaps.map((g: string, j: number) => (
                  <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <AlertTriangle style={{ width: 14, height: 14, color: C.red, flexShrink: 0, marginTop: 3 }} />
                    <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, margin: 0 }}>{g}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sys.strengths?.length > 0 && (
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.emerald, letterSpacing: '0.08em', textTransform: 'uppercase', ...mono }}>STRENGTHS ({sys.strengths.length})</span>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sys.strengths.map((s: string, j: number) => (
                  <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <CheckCircle2 style={{ width: 14, height: 14, color: C.emerald, flexShrink: 0, marginTop: 3 }} />
                    <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, margin: 0 }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(!sys.gaps?.length && !sys.strengths?.length) && (
            <p style={{ color: C.textMuted, fontSize: 14 }}>No detailed findings for this system.</p>
          )}
        </div>
      </div>
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

  const [visited, setVisited] = useState<Set<string>>(() => {
    return new Set(['overview']);
  });

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
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...visited]));
    } catch { /* ignore */ }
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

  // ─── Data Fetching (FROZEN) ─────────────────────────────────────────────
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

      if (reportErr) console.error('SA report fetch error:', reportErr.message);
      if (!reportData || !['generated', 'regenerating', 'approved', 'published', 'delivered'].includes(reportData.status)) {
        setReport(null);
        setLoading(false);
        if (!isRetry && loadReportRef.current === 0) {
          loadReportRef.current = 1;
          setTimeout(() => loadReport(true), 2000);
        }
        return;
      }

      setReport(reportData);

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

  // ─── Navigation Items (FROZEN) ─────────────────────────────────────────
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

  // ─── Resolve all data (FROZEN) ─────────────────────────────────────────
  const p1 = report.pass1_data || {};
  const facts = p1.facts || {};
  const m = resolveMetrics(report);
  const p1Findings = p1.findings || [];
  const p1Recs = p1.recommendations || [];
  const quickWins = p1.quickWins || report.quick_wins || [];
  const systemsMaps = p1.systemsMaps;
  const processes = facts.processes || [];
  const clientPresentation = p1.clientPresentation || {};
  const adminGuidance = p1.adminGuidance || {};

  const displayFindings = p1Findings.length > 0 ? p1Findings : findings;
  const criticalCount = displayFindings.filter((f: any) => f.severity === 'critical').length;
  const highCount = displayFindings.filter((f: any) => f.severity === 'high').length;

  const displayRecs = p1Recs.length > 0 ? p1Recs : [];
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

  const systemsList = facts?.systems || [];
  const sortedProcesses = [...(processes || [])].sort((a: any, b: any) => (b.hoursWasted ?? b.hours_wasted ?? 0) - (a.hoursWasted ?? a.hours_wasted ?? 0));
  const maxProcessHours = Math.max(...sortedProcesses.map((p: any) => p.hoursWasted ?? p.hours_wasted ?? 0), 1);
  const totalProcessHours = sortedProcesses.reduce((s: number, p: any) => s + (p.hoursWasted ?? p.hours_wasted ?? 0), 0);

  const clientQuotes = clientPresentation?.clientQuotes || [];
  const bestQuote = clientQuotes[0] || displayFindings.find((f: any) => f.client_quote || f.clientQuote)?.client_quote || displayFindings.find((f: any) => f.client_quote || f.clientQuote)?.clientQuote || '';

  // Sidebar
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
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4, ...mono }}>Systems Audit</p>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const showGroup = lastGroup !== item.section && (lastGroup = item.section);
            return (
              <div key={item.id}>
                {showGroup && (
                  <div style={{ padding: '8px 16px 4px', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', ...mono }}>
                    {SECTION_GROUPS[item.section]}
                  </div>
                )}
                <button type="button" onClick={() => handleNavigate(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', border: 'none', background: activeSection === item.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeSection === item.id ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', borderLeft: activeSection === item.id ? `3px solid ${C.blue}` : '3px solid transparent',
                    transition: 'all 0.15s ease',
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
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', ...mono }}>Progress</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', ...mono }}>{visited.size}/{NAV_ITEMS.length}</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(visited.size / NAV_ITEMS.length) * 100}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.emerald})`, borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </aside>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // v5 SECTION RENDERERS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderSection = () => {
    switch (activeSection) {

      // ─── OVERVIEW ────────────────────────────────────────────────────────
      case 'overview':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Cinematic hero banner */}
            <RevealCard style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #162340 100%)',
              borderRadius: 20, padding: 'clamp(32px, 5vw, 48px)', position: 'relative', overflow: 'hidden',
              border: 'none', boxShadow: SHADOW.lg,
            }}>
              <DotGrid opacity={0.06} />
              <NoiseOverlay opacity={0.15} />
              {/* Atmospheric blobs */}
              <div style={{ position: 'absolute', top: '-20%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${C.red}15 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-10%', right: '5%', width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${C.purple}12 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Zap style={{ width: 14, height: 14, color: C.emeraldLight }} />
                  <span style={{ fontSize: 11, letterSpacing: '0.12em', color: C.emeraldLight, textTransform: 'uppercase', fontWeight: 600, ...mono }}>Systems Audit Report</span>
                </div>
                <h1 style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', fontWeight: 800, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.01em', margin: '0 0 16px', maxWidth: '100%', wordBreak: 'break-word' }}>
                  {report.headline}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                    {[facts?.companyName, facts?.industry, facts?.teamSize && `Team: ${facts.teamSize}`].filter(Boolean).join(' · ')}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, ...mono }}>
                    {report.generated_at ? new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </p>
                </div>
              </div>
              {/* Running cost ticker */}
              <div style={{ position: 'absolute', bottom: 24, right: 28, textAlign: 'right', zIndex: 1 }}>
                <CostClock annualCost={m.annualCostOfChaos} size="normal" />
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, ...mono }}>wasted since opening</p>
              </div>
            </RevealCard>

            {/* Stat tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'ANNUAL COST OF CHAOS', value: m.annualCostOfChaos, prefix: '£', color: C.red },
                { label: `AT ${m.growthMultiplier}× SCALE`, value: m.projectedCostAtScale, prefix: '£', color: C.orange },
                { label: 'HOURS LOST WEEKLY', value: m.hoursWastedWeekly, prefix: '', color: C.blue, decimals: 1 },
              ].map((stat, i) => (
                <RevealCard key={i} delay={i * 70} style={{ ...accentCard(stat.color, { padding: 24 }) }}>
                  <span style={{ ...label, color: stat.color }}>{stat.label}</span>
                  <p style={{ fontSize: 32, fontWeight: 800, color: stat.color, margin: '8px 0 0', fontVariantNumeric: 'tabular-nums', ...mono }}>
                    <AnimatedCounter target={stat.value} prefix={stat.prefix} duration={2200} decimals={(stat as any).decimals || 0} />
                  </p>
                </RevealCard>
              ))}
            </div>

            {/* Executive Summary */}
            <RevealCard delay={250} style={{ ...glass({ padding: 32 }) }}>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Executive Summary</h3>
              {splitNarrative(report.executive_summary, 4).map((para, i) => (
                <p key={i} style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.8, maxWidth: '65ch', marginBottom: 14 }}>{para}</p>
              ))}
            </RevealCard>

            {/* Desired Outcomes */}
            {facts?.desired_outcomes?.length > 0 && (
              <RevealCard delay={350} style={{ ...glass({ padding: 28 }) }}>
                <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>What You Want to Achieve</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                  {facts.desired_outcomes.map((o: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                      <CheckCircle2 style={{ width: 18, height: 18, color: C.emerald, flexShrink: 0 }} />
                      <span style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.5 }}>{displayOutcome(o)}</span>
                    </div>
                  ))}
                </div>
              </RevealCard>
            )}
          </div>
        );

      // ─── SYSTEMS ─────────────────────────────────────────────────────────
      case 'systems': {
        const critGap = systemsList.filter((s: any) => (s.gaps?.length || 0) >= 3).length;
        const medGap = systemsList.filter((s: any) => (s.gaps?.length || 0) >= 1 && (s.gaps?.length || 0) < 3).length;
        const okCount = systemsList.filter((s: any) => !(s.gaps?.length > 0)).length;
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Summary bar */}
            <RevealCard style={{ ...glass({ padding: 24 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>{systemsList.length} Systems</h2>
                <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>Across your technology stack</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {critGap > 0 && <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 20, background: `${C.red}12`, color: C.red, border: `1px solid ${C.red}25` }}>{critGap} critical</span>}
                {medGap > 0 && <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 20, background: `${C.orange}12`, color: C.orange, border: `1px solid ${C.orange}25` }}>{medGap} gaps</span>}
                {okCount > 0 && <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 20, background: `${C.emerald}12`, color: C.emerald, border: `1px solid ${C.emerald}25` }}>{okCount} strong</span>}
              </div>
            </RevealCard>

            {/* System grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {systemsList.map((sys: any, i: number) => {
                const gapCount = sys.gaps?.length || 0;
                const statusColor = gapCount >= 3 ? C.red : gapCount >= 1 ? C.orange : C.emerald;
                return (
                  <RevealCard key={i} delay={i * 50}
                    style={{ ...glass({ padding: 20, cursor: 'pointer' }), borderTop: `3px solid ${statusColor}` }}
                  >
                    <div onClick={() => setSelectedSystem(i)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{sys.name || sys.system_name}</span>
                        {gapCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: statusColor, width: 24, height: 24, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono }}>{gapCount}</span>}
                      </div>
                      {sys.category && <span style={{ fontSize: 12, color: C.textMuted }}>{(sys.category || '').replace(/_/g, ' ')}</span>}
                      {/* Status bar */}
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', marginTop: 14, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: gapCount >= 3 ? '100%' : gapCount >= 1 ? '60%' : '20%', background: statusColor, borderRadius: 2, transition: `width 0.8s ${EASE.spring}` }} />
                      </div>
                      {/* Gap preview pills */}
                      {gapCount > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                          {sys.gaps.slice(0, 2).map((g: string, j: number) => (
                            <span key={j} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: `${C.red}08`, color: C.red, border: `1px solid ${C.red}15`, lineHeight: 1.4, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{g}</span>
                          ))}
                          {gapCount > 2 && <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>+{gapCount - 2} more</span>}
                        </div>
                      )}
                    </div>
                  </RevealCard>
                );
              })}
            </div>

            {selectedSystem !== null && systemsList[selectedSystem] && (
              <SystemDetailOverlay
                sys={systemsList[selectedSystem]}
                borderColor={(systemsList[selectedSystem].gaps?.length || 0) >= 3 ? C.red : (systemsList[selectedSystem].gaps?.length || 0) >= 1 ? C.orange : C.emerald}
                onClose={() => setSelectedSystem(null)}
              />
            )}
          </div>
        );
      }

      // ─── HEALTH ──────────────────────────────────────────────────────────
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
        const overallColor = overallScore < 30 ? C.red : overallScore < 50 ? C.orange : overallScore < 70 ? C.amber : C.emerald;
        const healthVerdict = overallScore < 30 ? 'Critical' : overallScore < 50 ? 'At Risk' : overallScore < 70 ? 'Needs Work' : 'Healthy';
        const isCritical = overallScore < 30;
        const keyPersonFindings = displayFindings.filter((f: any) =>
          (f.category === 'single_point_failure') ||
          (f.title || '').toLowerCase().includes('key person') ||
          (f.title || '').toLowerCase().includes('single point')
        );
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* v5: Dramatic health hero — dark bg for critical, makes score feel alarming */}
            <RevealCard style={{
              borderRadius: 20, padding: 'clamp(32px, 5vw, 48px)', position: 'relative', overflow: 'hidden',
              background: isCritical
                ? 'linear-gradient(135deg, #1a0808 0%, #2d0a0a 30%, #0f172a 100%)'
                : `linear-gradient(135deg, ${overallColor}08 0%, ${overallColor}03 50%, rgba(255,255,255,0.97) 100%)`,
              border: isCritical ? 'none' : `1px solid ${overallColor}18`,
              boxShadow: isCritical ? SHADOW.lg : SHADOW.md,
            }}>
              {isCritical && <NoiseOverlay opacity={0.2} />}
              {isCritical && <DotGrid opacity={0.04} />}
              {/* Red glow for critical */}
              {isCritical && <div style={{ position: 'absolute', top: '50%', left: '20%', transform: 'translate(-50%, -50%)', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${C.red}20 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
                <ProgressRing score={overallScore} size={200} strokeWidth={16} color={overallColor} ringLabel="Overall" />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <h2 style={{ color: isCritical ? '#fff' : C.text, fontSize: 28, fontWeight: 800, margin: 0 }}>System Health</h2>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isCritical ? '#fff' : overallColor, padding: '6px 18px', borderRadius: 20, background: isCritical ? C.red : `${overallColor}15`, border: isCritical ? 'none' : `1px solid ${overallColor}25`, ...mono }}>{healthVerdict}</span>
                  </div>
                  <p style={{ color: isCritical ? 'rgba(255,255,255,0.7)' : C.textSecondary, fontSize: 15, lineHeight: 1.75, maxWidth: '52ch', margin: 0 }}>
                    {overallScore < 30 ? 'Your systems are critically disconnected. Manual workarounds dominate daily operations, creating compounding errors and invisible costs.' :
                     overallScore < 50 ? 'Significant gaps exist across your technology stack. Key processes rely on manual intervention, limiting scalability.' :
                     overallScore < 70 ? 'Your systems have a reasonable foundation but key integration and automation gaps are holding you back.' :
                     'Your systems are well-connected with strong foundations. Focus on optimisation to unlock remaining value.'}
                  </p>
                </div>
              </div>
            </RevealCard>

            {/* Sub-score ring cluster */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
              {healthItems.slice(1).map((item, i) => {
                const sc = item.score < 30 ? C.red : item.score < 50 ? C.orange : item.score < 70 ? C.amber : C.emerald;
                return <ProgressRing key={item.key} score={item.score} size={110} strokeWidth={9} color={sc} ringLabel={item.label} delay={i * 200} />;
              })}
            </div>

            {/* Score detail cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {healthItems.slice(1).map((item, i) => {
                const sc = item.score < 30 ? C.red : item.score < 50 ? C.orange : item.score < 70 ? C.amber : C.emerald;
                return (
                  <RevealCard key={item.key} delay={i * 70} style={{ ...glass({ padding: 22 }), borderTop: `3px solid ${sc}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{item.label}</span>
                      <span style={{ fontSize: 28, fontWeight: 800, color: sc, ...mono, fontVariantNumeric: 'tabular-nums' }}>{item.score}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                      <div style={{ height: '100%', width: `${item.score}%`, background: `linear-gradient(90deg, ${sc}, ${sc}88)`, borderRadius: 3, transition: `width 1.2s ${EASE.spring}` }} />
                    </div>
                    {item.evidence && (
                      <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6, margin: 0, maxHeight: 100, overflow: 'hidden' }}>{item.evidence}</p>
                    )}
                  </RevealCard>
                );
              })}
            </div>

            {/* Key Person Risk — v5: much more urgent styling */}
            {keyPersonFindings.length > 0 && (
              <RevealCard delay={350} style={{
                ...glass({ padding: 0, overflow: 'hidden' }),
                border: `1px solid ${C.red}25`,
                boxShadow: SHADOW.colorLift(C.red),
              }}>
                <div style={{ background: `linear-gradient(90deg, ${C.red}, #991b1b)`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertTriangle style={{ width: 20, height: 20, color: '#fff' }} />
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Key Person Risk Detected</span>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <p style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.75, margin: 0 }}>{keyPersonFindings[0].description || keyPersonFindings[0].title}</p>
                </div>
              </RevealCard>
            )}
          </div>
        );
      }

      // ─── COST OF CHAOS ─────────────────────────────────────────────────────
      case 'chaos': {
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Dark cinematic cost hero */}
            <RevealCard style={{
              borderRadius: 20, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(135deg, #1a0505 0%, #2d0a0a 40%, #0f172a 100%)',
              padding: 48, textAlign: 'center', border: 'none', boxShadow: SHADOW.lg,
            }}>
              <NoiseOverlay opacity={0.2} />
              <DotGrid opacity={0.04} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${C.red}18 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 11, letterSpacing: '0.15em', color: `${C.red}bb`, textTransform: 'uppercase', fontWeight: 600, ...mono }}>Annual Cost of Chaos</span>
                <p style={{ fontSize: 56, fontWeight: 800, color: C.red, margin: '12px 0', fontVariantNumeric: 'tabular-nums', ...mono, textShadow: `0 0 60px ${C.red}50` }}>
                  <AnimatedCounter target={m.annualCostOfChaos} prefix="£" duration={2500} />
                </p>
                <CostClock annualCost={m.annualCostOfChaos} size="large" />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, ...mono }}>wasted since you opened this report</p>
              </div>
            </RevealCard>

            {/* v5: Impact tiles — different from Overview (show the growth story) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'EVERY WEEK', value: `${m.hoursWastedWeekly}h`, sub: 'lost to manual workarounds', color: C.red },
                { label: 'EVERY YEAR', value: fmtFull(m.annualCostOfChaos), sub: 'in invisible costs', color: C.orange },
                { label: `AT ${m.growthMultiplier}× GROWTH`, value: fmtFull(m.projectedCostAtScale), sub: 'if nothing changes', color: C.amber },
              ].map((stat, i) => (
                <RevealCard key={i} delay={i * 70} style={{ ...glass({ padding: 22, textAlign: 'center' }) }}>
                  <span style={{ ...label, color: stat.color }}>{stat.label}</span>
                  <p style={{ fontSize: 28, fontWeight: 800, color: stat.color, margin: '8px 0 4px', ...mono, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{stat.sub}</p>
                </RevealCard>
              ))}
            </div>

            {/* Narrative + Quote 2-col — v5: better balanced */}
            <div style={{ display: 'grid', gridTemplateColumns: bestQuote ? '1.2fr 1fr' : '1fr', gap: 20 }}>
              <RevealCard delay={250} style={{ ...glass({ padding: 28 }) }}>
                <span style={{ ...label, color: C.text, marginBottom: 14, display: 'block' }}>THE PATTERN</span>
                {splitNarrative(report.cost_of_chaos_narrative, 3).map((para, i) => (
                  <p key={i} style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.8, maxWidth: '60ch', marginBottom: 14 }}>{para}</p>
                ))}
              </RevealCard>
              {bestQuote && (
                <RevealCard delay={320} style={{ ...glass({ padding: 28 }), borderLeft: `4px solid ${C.purple}`, background: `linear-gradient(135deg, ${C.purple}06, rgba(255,255,255,0.97))`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Quote style={{ width: 28, height: 28, color: `${C.purple}40`, marginBottom: 12 }} />
                  <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.8, color: C.text }}>
                    &quot;{bestQuote}&quot;
                  </p>
                  <p style={{ ...label, color: C.textMuted, marginTop: 14 }}>Staff interview</p>
                </RevealCard>
              )}
            </div>

            {/* Process cost bars — v5: with process names */}
            {sortedProcesses.length > 0 && (
              <RevealCard delay={400} style={{ ...glass({ padding: 28 }) }}>
                <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Where the Hours Go</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sortedProcesses.slice(0, 6).map((proc: any, i: number) => {
                    const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
                    const pct = (hours / maxProcessHours) * 100;
                    const barColor = pct > 80 ? C.red : pct > 50 ? C.orange : C.amber;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: '0 0 200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proc.name}</span>
                        <div style={{ flex: 1, height: 32, borderRadius: 8, background: 'rgba(0,0,0,0.04)', overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`, borderRadius: 8,
                            background: `linear-gradient(90deg, ${barColor}, ${barColor}aa)`,
                            transition: `width 1s ${EASE.spring} ${i * 100}ms`,
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12,
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: pct > 35 ? '#fff' : C.text, ...mono }}>{hours}h/wk</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </RevealCard>
            )}
          </div>
        );
      }

      // ─── PROCESSES ─────────────────────────────────────────────────────────
      case 'processes': {
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}>
              <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>{sortedProcesses.length} Process Chains</h2>
              <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>Total <strong style={{ color: C.red, ...mono }}>{totalProcessHours}h</strong> wasted weekly across your operations</p>
            </RevealCard>

            {sortedProcesses.map((proc: any, i: number) => {
              const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
              const isExpanded = expandedProcess === proc.code;
              const pct = (hours / maxProcessHours) * 100;
              const barColor = pct > 80 ? C.red : pct > 50 ? C.orange : C.amber;
              return (
                <RevealCard key={proc.code || i} delay={i * 60} style={{ ...glass({ padding: 0, overflow: 'hidden' }) }}>
                  {/* Clickable header — v5: shows process NAME prominently */}
                  <div
                    onClick={() => setExpandedProcess(isExpanded ? null : proc.code)}
                    style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${barColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: barColor, flexShrink: 0 }}>
                      <ChainIcon code={proc.code} size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{proc.name}</p>
                      <span style={{ fontSize: 12, color: C.textMuted }}>
                        {(proc.criticalGaps || proc.critical_gaps || []).length} gaps · {(proc.clientQuotes || proc.client_quotes || []).length} quotes
                      </span>
                    </div>
                    <span style={{ fontSize: 26, fontWeight: 800, color: barColor, ...mono, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{hours}h</span>
                    <div style={{ color: C.textMuted, transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                      <ChevronDown style={{ width: 18, height: 18 }} />
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 4, background: 'rgba(0,0,0,0.04)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`, transition: `width 0.8s ${EASE.spring}` }} />
                  </div>
                  {/* Expanded content — v5: better readability */}
                  <div style={{ maxHeight: isExpanded ? 800 : 0, overflow: 'hidden', transition: `max-height 0.4s ${EASE.out}` }}>
                    <div style={{ padding: '20px 24px 24px' }}>
                      {(proc.criticalGaps || proc.critical_gaps || []).length > 0 && (
                        <div style={{ marginBottom: 18 }}>
                          <span style={{ ...label, color: C.red, marginBottom: 8, display: 'block' }}>Critical Gaps</span>
                          {(proc.criticalGaps || proc.critical_gaps).map((g: string, j: number) => (
                            <p key={j} style={{ fontSize: 14, color: C.textSecondary, marginBottom: 8, paddingLeft: 14, borderLeft: `3px solid ${C.red}50`, lineHeight: 1.65 }}>{g}</p>
                          ))}
                        </div>
                      )}
                      {(proc.clientQuotes || proc.client_quotes || []).length > 0 && (
                        <div>
                          <span style={{ ...label, color: C.purple, marginBottom: 8, display: 'block' }}>What your team said</span>
                          {(proc.clientQuotes || proc.client_quotes).map((q: string, j: number) => (
                            <div key={j} style={{ padding: '14px 18px', background: `${C.purple}06`, borderRadius: 12, marginBottom: 10, borderLeft: `3px solid ${C.purple}40` }}>
                              <p style={{ fontSize: 14, fontStyle: 'italic', color: C.text, lineHeight: 1.7, margin: 0, fontFamily: "'Playfair Display', serif" }}>&quot;{q}&quot;</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </RevealCard>
              );
            })}
          </div>
        );
      }

      // ─── FINDINGS ─────────────────────────────────────────────────────────
      case 'findings':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RevealCard style={{ ...glass({ padding: 24 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>{displayFindings.length} Findings</h2>
                <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>Select a finding below to see the full detail</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {criticalCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, background: C.red, color: '#fff' }}>{criticalCount} Critical</span>}
                {highCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, background: C.orange, color: '#fff' }}>{highCount} High</span>}
              </div>
            </RevealCard>
            <SeverityDotGrid findings={displayFindings} displayOutcomeFn={displayOutcome} />
          </div>
        );

      // ─── TECH MAP ─────────────────────────────────────────────────────────
      case 'techmap':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}>
              <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Technology Map</h2>
              <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>How your systems connect and where the gaps are</p>
            </RevealCard>
            {(systemsMaps?.length > 0 || (facts?.systems && facts.systems.length > 0)) ? (
              <RevealCard delay={100} style={{
                borderRadius: 16, overflow: 'hidden',
                boxShadow: SHADOW.md,
                border: '1px solid rgba(22,35,64,0.08)',
                background: '#0f172a',
              }}>
                <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                  <SystemsMapSection systemsMaps={systemsMaps} facts={facts} layout="split" />
                </div>
              </RevealCard>
            ) : (
              <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}>
                <p style={{ color: C.textMuted }}>Technology map not yet generated.</p>
              </RevealCard>
            )}
          </div>
        );

      // ─── QUICK WINS ───────────────────────────────────────────────────────
      case 'quickwins': {
        const qwList = quickWins || [];
        const totalQWHours = qwList.reduce((s: number, q: any) => s + (parseFloat(q.hoursSaved || q.hours_saved || q.hoursSavedWeekly || 0) || 0), 0);
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Hero banner */}
            <RevealCard style={{
              borderRadius: 20, overflow: 'hidden', position: 'relative',
              background: `linear-gradient(135deg, ${C.emerald}, #047857)`,
              padding: 32, border: 'none', boxShadow: SHADOW.lg,
            }}>
              <NoiseOverlay opacity={0.12} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Zap style={{ width: 28, height: 28, color: '#fff' }} />
                    <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0 }}>Start This Week</h2>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, margin: 0 }}>
                    {qwList.length} wins · zero cost · <strong>{totalQWHours}h saved every week</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[{ val: '£0', sub: 'Investment' }, { val: `+${totalQWHours}h`, sub: 'Per Week' }].map((s, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '14px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, ...mono }}>{s.val}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealCard>

            {/* Quick win cards with timeline */}
            <div style={{ position: 'relative', paddingLeft: 40 }}>
              <div style={{ position: 'absolute', left: 17, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${C.emerald}, ${C.emerald}20)`, borderRadius: 2 }} />
              {qwList.map((qw: any, i: number) => {
                const hours = parseFloat(qw.hoursSaved || qw.hours_saved || qw.hoursSavedWeekly || 0) || 0;
                const isExpanded = expandedQW === i;
                const owner = qw.owner || qw.assignee || '';
                return (
                  <RevealCard key={i} delay={i * 80} style={{ marginBottom: 14, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -40, top: 18, width: 32, height: 32, borderRadius: 16, background: C.emerald, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, boxShadow: SHADOW.glow(C.emerald, 0.35), zIndex: 2 }}>{i + 1}</div>
                    <div style={{ ...glass({ padding: 0, overflow: 'hidden' }), borderLeft: `3px solid ${C.emerald}50` }}>
                      <div onClick={() => setExpandedQW(isExpanded ? null : i)}
                        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0, color: C.text }}>
                            {owner && <span style={{ fontWeight: 700, color: C.blue }}>{owner}: </span>}
                            {qw.title || qw.action}
                          </p>
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 800, color: C.emerald, ...mono, flexShrink: 0 }}>+{hours}h</span>
                        <div style={{ color: C.textMuted, transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                          <ChevronDown style={{ width: 16, height: 16 }} />
                        </div>
                      </div>
                      <div style={{ maxHeight: isExpanded ? 400 : 0, overflow: 'hidden', transition: `max-height 0.4s ${EASE.out}` }}>
                        <div style={{ padding: '0 20px 20px' }}>
                          {(qw.steps || qw.implementation) && (
                            <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>{qw.steps || qw.implementation}</p>
                          )}
                          {(qw.impact || qw.mondayMorning) && (
                            <div style={{ padding: '14px 18px', background: `${C.emerald}06`, borderLeft: `3px solid ${C.emerald}50`, borderRadius: '0 10px 10px 0', marginBottom: 10 }}>
                              <p style={{ fontSize: 14, fontStyle: 'italic', color: C.text, lineHeight: 1.7, margin: 0, fontFamily: "'Playfair Display', serif" }}>{qw.impact || qw.mondayMorning}</p>
                            </div>
                          )}
                          {(qw.affectedSystems || qw.affected_systems || []).length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                              {(qw.affectedSystems || qw.affected_systems).map((sys: string, j: number) => (
                                <span key={j} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: `${C.blue}08`, color: C.blue, border: `1px solid ${C.blue}18`, fontWeight: 500 }}>{sys}</span>
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

      // ─── ROADMAP ──────────────────────────────────────────────────────────
      case 'roadmap': {
        const phaseColors: Record<string, string> = {
          immediate: C.emerald, quick_win: C.emerald, foundation: C.blue,
          short_term: C.blue, strategic: C.purple, medium_term: C.purple,
          optimization: '#6366f1', long_term: C.textMuted,
        };
        const activePhases = phaseOrder.filter(p => recsByPhase[p]?.length > 0);
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}>
              <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Implementation Roadmap</h2>
              <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>{displayRecs.length} recommendations across {activePhases.length} phases</p>
            </RevealCard>

            {/* Phase timeline bar */}
            {activePhases.length > 1 && (
              <RevealCard delay={80} style={{ ...glass({ padding: '16px 24px' }), position: 'relative', display: 'flex', alignItems: 'center', height: 56 }}>
                <div style={{ position: 'absolute', left: 24, right: 24, top: '50%', height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${C.emerald} 33%, ${C.blue} 33% 66%, ${C.purple} 66%)`, transform: 'translateY(-50%)' }} />
                {activePhases.map((p, i) => (
                  <div key={p} style={{ position: 'absolute', left: `calc(24px + ${((i + 0.5) / activePhases.length) * 100}% * (1 - 48px/100%))`, top: '50%', transform: 'translate(-50%, -50%)', width: 32, height: 32, borderRadius: 16, background: phaseColors[p] || C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, boxShadow: SHADOW.glow(phaseColors[p] || C.blue, 0.35), zIndex: 2 }}>{i + 1}</div>
                ))}
              </RevealCard>
            )}

            {/* Phase sections */}
            {activePhases.map((phase) => {
              const phaseRecs = recsByPhase[phase] || [];
              const phaseColor = phaseColors[phase] || C.blue;
              return (
                <div key={phase}>
                  <RevealCard style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <PhaseBadge phase={phase} />
                    <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>{phaseRecs.length} item{phaseRecs.length !== 1 ? 's' : ''}</span>
                  </RevealCard>
                  {phaseRecs.map((rec: any, ri: number) => {
                    const recKey = rec.title || `${phase}-${ri}`;
                    const isExpanded = expandedRec === recKey;
                    const cost = rec.estimatedCost || rec.estimated_cost || 0;
                    const benefit = rec.annualBenefit || rec.annual_cost_savings || 0;
                    const hrs = parseFloat(rec.hoursSavedWeekly || rec.hours_saved_weekly) || 0;
                    const payback = cost > 0 && benefit > 0 ? Math.max(1, Math.round(cost / (benefit / 12))) : (cost === 0 ? 0 : null);
                    return (
                      <RevealCard key={recKey} delay={ri * 60} style={{ ...glass({ padding: 0, overflow: 'hidden', marginBottom: 10 }), borderLeft: `3px solid ${phaseColor}50` }}>
                        <div onClick={() => setExpandedRec(isExpanded ? null : recKey)}
                          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 14, background: `${phaseColor}15`, color: phaseColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{ri + 1}</div>
                          <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.title}</span>
                          <div style={{ color: C.textMuted, transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                            <ChevronDown style={{ width: 16, height: 16 }} />
                          </div>
                        </div>
                        <div style={{ maxHeight: isExpanded ? 700 : 0, overflow: 'hidden', transition: `max-height 0.4s ${EASE.out}` }}>
                          <div style={{ padding: '0 20px 24px' }}>
                            <p style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.75, marginBottom: 20 }}>{rec.description}</p>
                            {/* Stats grid — v5: more prominent */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20, padding: '16px', background: `${phaseColor}04`, borderRadius: 12, border: `1px solid ${phaseColor}10` }}>
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ ...label }}>Investment</span>
                                <p style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '6px 0 0', ...mono }}>{fmt(cost)}</p>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ ...label }}>Benefit</span>
                                <p style={{ fontSize: 22, fontWeight: 800, color: C.emerald, margin: '6px 0 0', ...mono }}>{fmt(benefit)}/yr</p>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ ...label }}>Hours</span>
                                <p style={{ fontSize: 22, fontWeight: 800, color: C.blue, margin: '6px 0 0', ...mono }}>{hrs}h/wk</p>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ ...label }}>Payback</span>
                                <p style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '6px 0 0', ...mono }}>
                                  {payback === 0 ? '—' : payback != null ? `${payback} mo` : '—'}
                                </p>
                              </div>
                            </div>
                            {rec.mondayMorning && (
                              <div style={{ padding: '14px 18px', background: `${C.emerald}06`, borderLeft: `3px solid ${C.emerald}50`, borderRadius: '0 10px 10px 0', marginBottom: 14 }}>
                                <p style={{ fontSize: 14, fontStyle: 'italic', color: C.text, lineHeight: 1.7, margin: 0, fontFamily: "'Playfair Display', serif" }}>{rec.mondayMorning}</p>
                              </div>
                            )}
                            {rec.addresses && (
                              <p style={{ ...label, color: C.textMuted, lineHeight: 1.5 }}>
                                ADDRESSES: {rec.addresses}
                              </p>
                            )}
                          </div>
                        </div>
                      </RevealCard>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      }

      // ─── INVESTMENT & ROI ─────────────────────────────────────────────────
      case 'investment': {
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}>
              <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Return on Investment</h2>
            </RevealCard>

            {/* Hero stat tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'INVESTMENT', val: fmt(totalInvestment), color: C.text },
                { label: 'ANNUAL BENEFIT', val: fmtFull(totalBenefit), color: C.emerald },
                { label: 'PAYBACK', val: `${m.paybackMonths} mo`, color: C.blue },
                { label: 'ROI', val: m.roiRatio, color: C.purple, gradient: true },
              ].map((s, i) => (
                <RevealCard key={i} delay={i * 70} style={{ ...glass({ padding: 20, textAlign: 'center' }), borderTop: `3px solid ${s.color}` }}>
                  <span style={{ ...label, color: C.textMuted }}>{s.label}</span>
                  <p style={{
                    fontSize: 26, fontWeight: 800, margin: '8px 0 0', ...mono, fontVariantNumeric: 'tabular-nums',
                    color: s.color,
                    ...((s as any).gradient ? {
                      background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    } : {}),
                  }}>{s.val}</p>
                </RevealCard>
              ))}
            </div>

            {/* Waterfall chart */}
            {displayRecs.length > 0 && (
              <RevealCard delay={300}>
                <ROIWaterfall recommendations={displayRecs} />
              </RevealCard>
            )}

            {/* Data table */}
            <RevealCard delay={400} style={{ ...glass({ padding: 0, overflow: 'hidden' }) }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: 'rgba(240,242,247,0.8)' }}>
                      {['Phase', 'Title', 'Cost', 'Benefit', 'Hours'].map(h => (
                        <th key={h} style={{ ...label, padding: '14px 16px', textAlign: 'left', borderBottom: '2px solid rgba(0,0,0,0.06)', position: 'sticky', top: 0, background: 'rgba(240,242,247,0.95)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecs.map((rec: any, i: number) => {
                      const phase = rec.implementationPhase || rec.implementation_phase || 'short_term';
                      return (
                        <tr key={i}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}><PhaseBadge phase={phase} /></td>
                          <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, color: C.text, fontWeight: 500 }}>{rec.title}</td>
                          <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', ...mono, fontSize: 14, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fmt(rec.estimatedCost || rec.estimated_cost || 0)}</td>
                          <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', ...mono, fontSize: 14, color: C.emerald, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>£{(rec.annualBenefit || rec.annual_cost_savings || 0).toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', ...mono, fontSize: 14, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{parseFloat(rec.hoursSavedWeekly || rec.hours_saved_weekly) || 0}h</td>
                        </tr>
                      );
                    })}
                    <tr style={{ fontWeight: 700 }}>
                      <td style={{ padding: '14px 16px', borderTop: '2px solid rgba(0,0,0,0.08)' }} colSpan={2}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>TOTAL</span>
                      </td>
                      <td style={{ padding: '14px 16px', borderTop: '2px solid rgba(0,0,0,0.08)', ...mono, fontSize: 14, color: C.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalInvestment)}</td>
                      <td style={{ padding: '14px 16px', borderTop: '2px solid rgba(0,0,0,0.08)', ...mono, fontSize: 14, color: C.emerald, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>£{Math.round(totalBenefit).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', borderTop: '2px solid rgba(0,0,0,0.08)', ...mono, fontSize: 14, color: C.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{totalHoursSaved}h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </RevealCard>
          </div>
        );
      }

      // ─── VISION ───────────────────────────────────────────────────────────
      case 'monday': {
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Dark cinematic hero */}
            <RevealCard style={{
              borderRadius: 20, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(135deg, #0F172A 0%, #162340 40%, #1E293B 100%)',
              padding: 'clamp(40px, 5vw, 56px)', textAlign: 'center',
              border: 'none', boxShadow: SHADOW.lg,
            }}>
              <DotGrid opacity={0.05} />
              <NoiseOverlay opacity={0.15} />
              {/* Aurora blobs */}
              <div style={{ position: 'absolute', top: '-15%', left: '10%', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${C.blue}18 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none', animation: 'float 20s ease infinite' }} />
              <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${C.emerald}15 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none', animation: 'float 15s ease infinite 5s' }} />
              <div style={{ position: 'absolute', top: '40%', left: '50%', width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${C.purple}12 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none', animation: 'float 18s ease infinite 3s' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                  <Rocket style={{ width: 16, height: 16, color: C.emeraldLight }} />
                  <span style={{ fontSize: 11, letterSpacing: '0.15em', color: C.emeraldLight, textTransform: 'uppercase', fontWeight: 600, ...mono }}>Your Future</span>
                </div>
                <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 auto 32px', letterSpacing: '-0.02em', maxWidth: '20ch' }}>
                  Ready to Reclaim <span style={{ color: C.emeraldLight }}>{totalHoursSaved}</span> Hours Every Week?
                </h2>
                {/* Stat tiles */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { val: `${totalHoursSaved}`, sub: 'Hours/week reclaimed', bg: `${C.emerald}20` },
                    { val: `£${Math.round(totalBenefit / 1000)}k`, sub: 'Annual benefit', bg: `${C.blue}20` },
                    { val: `<${m.paybackMonths}`, sub: 'Month payback', bg: 'rgba(255,255,255,0.12)' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, borderRadius: 16, padding: '20px 32px', border: '1px solid rgba(255,255,255,0.12)', minWidth: 140, backdropFilter: 'blur(8px)' }}>
                      <p style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: 0, ...mono, fontVariantNumeric: 'tabular-nums' }}>{s.val}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealCard>

            {/* Monday morning quote — v5: properly contained */}
            <RevealCard delay={200} style={{
              ...glass({ padding: 32 }),
              borderLeft: `4px solid ${C.emerald}`,
              background: `linear-gradient(135deg, ${C.emerald}05, ${C.blue}03, rgba(255,255,255,0.97))`,
            }}>
              <Quote style={{ width: 28, height: 28, color: `${C.emerald}40`, marginBottom: 12 }} />
              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 17, lineHeight: 1.8, color: C.text, maxWidth: '60ch' }}>
                {clientPresentation?.mondayMorning || splitNarrative(report.time_freedom_narrative, 1)[0] || 'Imagine opening your laptop on Monday morning and having everything you need at your fingertips.'}
              </p>
            </RevealCard>

            {/* How we get there — v5: properly contained text */}
            <RevealCard delay={300} style={{ ...glass({ padding: 32 }) }}>
              <span style={{ ...label, color: C.text, marginBottom: 14, display: 'block' }}>HOW WE GET THERE</span>
              {splitNarrative(report.time_freedom_narrative, 4).map((para, i) => (
                <p key={i} style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.8, maxWidth: '62ch', marginBottom: 14 }}>{para}</p>
              ))}
            </RevealCard>

            {/* Freedom stories */}
            {(clientPresentation?.freedomStories || adminGuidance?.freedomStories || []).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {(clientPresentation?.freedomStories || adminGuidance?.freedomStories || []).map((story: any, i: number) => (
                  <RevealCard key={i} delay={i * 80} style={{ ...glass({ padding: 22 }), borderTop: `3px solid ${C.emerald}` }}>
                    <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{typeof story === 'string' ? story : story.text || story.description || JSON.stringify(story)}</p>
                  </RevealCard>
                ))}
              </div>
            )}

            {/* CTA banner */}
            <RevealCard delay={500} style={{
              borderRadius: 20, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(135deg, #0F172A, #1E293B)',
              padding: 40, textAlign: 'center', border: 'none', boxShadow: SHADOW.lg,
            }}>
              <DotGrid opacity={0.04} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <Phone style={{ width: 24, height: 24, color: C.emeraldLight }} />
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Ready to Start?</h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: '42ch', margin: 0 }}>
                  Book a call to discuss your implementation roadmap
                </p>
                <button
                  style={{
                    background: `linear-gradient(135deg, ${C.emerald}, #047857)`, color: '#fff',
                    padding: '14px 40px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: SHADOW.glow(C.emerald, 0.4),
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = SHADOW.glow(C.emerald, 0.6); }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = SHADOW.glow(C.emerald, 0.4); }}
                >
                  Book a Call <ArrowRight style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </RevealCard>
          </div>
        );
      }

      default:
        return <div style={{ color: C.textMuted, padding: 32 }}>Section not found.</div>;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
        ::selection { background: ${C.blue}30; }
      `}</style>

      <SASidebar />

      <div
        ref={contentRef}
        style={{
          marginLeft: 220, flex: 1, padding: '24px 32px', overflowY: 'auto', height: '100vh',
          background: C.bg,
          opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <div style={{ maxWidth: 1060, margin: '0 auto', overflow: 'hidden' }}>
          {/* Client header bar — v5: smaller, wrapping, contained */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${C.cardBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              <button type="button" onClick={() => navigate('/dashboard')} style={{ color: C.textMuted, padding: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="Back to dashboard"><ArrowLeft style={{ width: 20, height: 20 }} /></button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{report.headline || 'Systems Audit Report'}</h1>
                <p style={{ fontSize: 13, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[facts?.industry, facts?.teamSize && `Team: ${facts.teamSize}`, facts?.confirmedRevenue || facts?.revenueBand].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <CostClock annualCost={m.annualCostOfChaos} />
              <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>
                {report.generated_at ? new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
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
