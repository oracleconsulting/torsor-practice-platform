// ============================================================================
// SYSTEMS AUDIT CLIENT REPORT PAGE — v6 BENTO DASHBOARD REWRITE
// ============================================================================
// Client-facing report: Proof → Pattern → Price → Path → Plan → Future
//
// v6: COMPLETE VISUAL OVERHAUL from v5.1
//     - Bento grid layouts filling the full page width
//     - Colored card backgrounds (teal, amber, blue tints) not just white
//     - Max-width increased to 1280px — NO more wasted grey
//     - Italic Playfair removed — quotes now bold & readable
//     - Tech Map rendered DIRECTLY on page, no dark box wrapper
//     - Roadmap with visual journey/road graphic
//     - Vision section: dramatic, high-impact closing
//     - Vibrancy and dynamism throughout
//
// Data layer is IDENTICAL to v4/v5. GOLDEN RULE: pass1_data is the single source of truth.
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
  TrendingDown, CircleDot, Flame, MapPin, Flag,
  Milestone, Award, Crown, Gem, Trophy
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
// DESIGN SYSTEM v6 — BENTO, BOLD, VIBRANT
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  // Core
  navy: '#162340',
  navyLight: '#1e3156',
  // Primaries — deeper, richer
  blue: '#2563EB',
  red: '#DC2626',
  orange: '#EA580C',
  amber: '#D97706',
  emerald: '#059669',
  emeraldLight: '#10B981',
  purple: '#7C3AED',
  violet: '#8B5CF6',
  teal: '#0D9488',
  rose: '#E11D48',
  // Tinted card backgrounds — the bento palette
  tintRed: '#FEF2F2',
  tintRedMed: '#FEE2E2',
  tintOrange: '#FFF7ED',
  tintAmber: '#FFFBEB',
  tintEmerald: '#ECFDF5',
  tintEmeraldMed: '#D1FAE5',
  tintBlue: '#EFF6FF',
  tintBlueMed: '#DBEAFE',
  tintPurple: '#F5F3FF',
  tintPurpleMed: '#EDE9FE',
  tintTeal: '#F0FDFA',
  // Background & text
  bg: '#F0F2F7',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(22,35,64,0.07)',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748b',
  textLight: '#94a3b8',
};

const SHADOW = {
  xs: '0 1px 2px rgba(22,35,64,0.05)',
  sm: '0 1px 3px rgba(22,35,64,0.07), 0 4px 12px rgba(22,35,64,0.05)',
  md: '0 4px 12px rgba(22,35,64,0.1), 0 8px 24px rgba(22,35,64,0.07)',
  lg: '0 12px 32px rgba(22,35,64,0.12), 0 4px 12px rgba(22,35,64,0.07)',
  colored: (color: string, intensity = 0.2) => `0 8px 32px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
  glow: (color: string, intensity = 0.3) => `0 0 32px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
};

const EASE = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
};

// v6 Card system — NO more flat white. Solid white with real borders + colored variants
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: '#FFFFFF',
  border: '1px solid rgba(22, 35, 64, 0.07)',
  borderRadius: 16,
  boxShadow: SHADOW.sm,
  ...extra,
});

// Colored card — tinted background with matching border
const tintCard = (bg: string, borderColor: string, extra?: React.CSSProperties): React.CSSProperties => ({
  background: bg,
  border: `1px solid ${borderColor}25`,
  borderRadius: 16,
  boxShadow: SHADOW.xs,
  ...extra,
});

// Accent stripe card
const stripeCard = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  ...card(),
  borderLeft: `4px solid ${color}`,
  ...extra,
});

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const label: React.CSSProperties = { fontSize: 11, color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600, ...mono };

const sectionWrap: React.CSSProperties = {
  maxWidth: '100%',
  overflow: 'hidden',
  wordBreak: 'break-word' as const,
};

// ─── Types (FROZEN) ──────────────────────────────────────────────────────────

interface SAReport {
  id: string; engagement_id: string; headline: string; executive_summary: string;
  cost_of_chaos_narrative: string; time_freedom_narrative: string;
  total_hours_wasted_weekly: number; total_annual_cost_of_chaos: number;
  growth_multiplier: number; projected_cost_at_scale: number;
  systems_count: number; integration_score: number; automation_score: number;
  data_accessibility_score: number; scalability_score: number;
  critical_findings_count: number; high_findings_count: number;
  medium_findings_count: number; low_findings_count: number;
  total_annual_benefit: number; total_recommended_investment: number;
  hours_reclaimable_weekly: number; overall_payback_months: number;
  roi_ratio: string; pass1_data: any; quick_wins: any[];
  status: string; generated_at: string; created_at: string;
}

interface SAFinding {
  id: string; severity: 'critical' | 'high' | 'medium' | 'low';
  category: string; title: string; description: string; evidence: string[];
  client_quote: string | null; affected_systems: string[] | null;
  affected_processes: string[] | null; hours_wasted_weekly: number;
  annual_cost_impact: number; recommendation: string | null;
  scalability_impact: string | null; blocks_goal: string | null;
}

// ─── Metric Resolution (FROZEN) ─────────────────────────────────────────────

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
    totalAnnualBenefit, totalInvestment, hoursReclaimable, roiRatio, paybackMonths,
  };
}

// ─── Format Helpers ──────────────────────────────────────────────────────────

const fmt = (n: number) => {
  if (n == null || isNaN(n)) return '£0';
  return n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${Math.round(n)}`;
};
const fmtFull = (n: number) => `£${Math.round(n).toLocaleString()}`;

// ═══════════════════════════════════════════════════════════════════════════════
// v6 VISUAL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Animated Counter ────────────────────────────────────────────────────────
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
  const fontSize = size === 'large' ? 36 : 16;
  return (
    <span style={{ ...mono, color: C.red, fontSize, fontWeight: 700 }}>
      £{(costPerSecond * elapsed).toFixed(2)}
    </span>
  );
}

// ─── Scroll Reveal ───────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold, rootMargin: '0px 0px -20px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── RevealCard ──────────────────────────────────────────────────────────────
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
          ? (hovered ? 'translateY(-2px)' : 'translateY(0)')
          : 'translateY(12px)',
        transition: `opacity 0.45s ${EASE.out} ${delay}ms, transform 0.45s ${EASE.out} ${delay}ms, box-shadow 0.25s ${EASE.out}`,
        boxShadow: hovered ? SHADOW.md : (style?.boxShadow || SHADOW.sm),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Progress Ring ───────────────────────────────────────────────────────────
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
function PhaseBadge({ phase, size = 'normal' }: { phase: string; size?: 'normal' | 'large' }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    immediate: { bg: C.tintEmeraldMed, color: C.emerald, label: 'Quick Win' },
    quick_win: { bg: C.tintEmeraldMed, color: C.emerald, label: 'Quick Win' },
    foundation: { bg: C.tintBlueMed, color: C.blue, label: 'Foundation' },
    short_term: { bg: C.tintBlueMed, color: C.blue, label: 'Short Term' },
    strategic: { bg: C.tintPurpleMed, color: C.purple, label: 'Strategic' },
    medium_term: { bg: C.tintPurpleMed, color: C.purple, label: 'Medium Term' },
    optimization: { bg: '#E0E7FF', color: '#4F46E5', label: 'Optimisation' },
    long_term: { bg: '#F1F5F9', color: C.textMuted, label: 'Long Term' },
  };
  const s = styles[phase] || styles.short_term;
  const pad = size === 'large' ? '6px 16px' : '4px 12px';
  const fs = size === 'large' ? 12 : 11;
  return (
    <span style={{ fontSize: fs, fontWeight: 700, padding: pad, borderRadius: 8, background: s.bg, color: s.color, ...mono }}>
      {s.label}
    </span>
  );
}

// ─── Noise Overlay ───────────────────────────────────────────────────────────
function NoiseOverlay({ opacity = 0.3 }: { opacity?: number }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', opacity,
      mixBlendMode: 'soft-light',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
    }} />
  );
}

// ─── DotGrid ─────────────────────────────────────────────────────────────────
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

// ─── Quote Block — READABLE, no italic ───────────────────────────────────────
function QuoteBlock({ text, source, color = C.purple }: { text: string; source?: string; color?: string }) {
  return (
    <div style={{
      padding: '20px 24px', borderRadius: 14,
      background: `${color}08`, borderLeft: `4px solid ${color}`,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 14, left: 20, opacity: 0.15 }}>
        <Quote style={{ width: 32, height: 32, color }} />
      </div>
      <p style={{
        fontSize: 15, fontWeight: 500, lineHeight: 1.75, color: C.text,
        margin: 0, paddingLeft: 8,
      }}>
        &ldquo;{text}&rdquo;
      </p>
      {source && <p style={{ ...label, color: C.textMuted, marginTop: 12, paddingLeft: 8 }}>{source}</p>}
    </div>
  );
}

// ─── Findings Inline List ────────────────────────────────────────────────────
function FindingsInlineList({ findings, displayOutcomeFn }: { findings: any[]; displayOutcomeFn: (outcome: string) => string }) {
  const [active, setActive] = useState<number | null>(findings.length > 0 ? 0 : null);
  const colors: Record<string, string> = { critical: C.red, high: C.orange, medium: C.amber, low: C.blue };
  const detailRef = useRef<HTMLDivElement>(null);

  const handleSelect = (i: number) => {
    setActive(active === i ? null : i);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  return (
    <div style={sectionWrap}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {findings.map((f: any, i: number) => {
          const c = colors[f.severity] || '#64748b';
          const isActive = active === i;
          const hoursVal = f.hours_wasted_weekly ?? f.hoursWastedWeekly ?? f.hoursPerWeek ?? 0;
          const costVal = f.annual_cost_impact ?? f.annualCostImpact ?? f.annualCost ?? 0;
          const affected = f.affected_systems ?? f.affectedSystems ?? [];
          return (
            <div key={i}>
              <div onClick={() => handleSelect(i)}
                style={{
                  padding: '14px 18px', borderRadius: isActive ? '14px 14px 0 0' : 14, cursor: 'pointer',
                  background: isActive ? `${c}06` : '#fff',
                  border: `1px solid ${isActive ? c + '30' : 'rgba(22,35,64,0.07)'}`,
                  borderBottom: isActive ? 'none' : `1px solid rgba(22,35,64,0.07)`,
                  borderLeft: `4px solid ${c}`,
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: `all 0.2s ${EASE.out}`,
                  boxShadow: isActive ? `0 -2px 8px ${c}10` : SHADOW.xs,
                }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#fff', padding: '3px 10px', borderRadius: 6, background: c, ...mono, flexShrink: 0 }}>{f.severity}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title || 'Finding'}</span>
                {hoursVal > 0 && <span style={{ fontSize: 12, color: C.textMuted, ...mono, flexShrink: 0 }}>{hoursVal}h/wk</span>}
                <ChevronDown style={{ width: 16, height: 16, color: C.textMuted, flexShrink: 0, transform: isActive ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
              </div>
              {isActive && (
                <div ref={detailRef} style={{
                  padding: '20px 24px', borderRadius: '0 0 14px 14px',
                  background: '#fff', border: `1px solid ${c}20`, borderTop: `1px solid ${c}10`,
                  borderLeft: `4px solid ${c}`, boxShadow: SHADOW.sm,
                }}>
                  <p style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.75, marginBottom: 16 }}>{f.description}</p>
                  {(f.evidence && f.evidence.length > 0) && (
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ ...label, marginBottom: 8, display: 'block' }}>Evidence</span>
                      {f.evidence.map((e: string, j: number) => (
                        <p key={j} style={{ color: C.textSecondary, fontSize: 14, marginTop: 6, paddingLeft: 14, borderLeft: `3px solid ${C.amber}60`, lineHeight: 1.65 }}>{e}</p>
                      ))}
                    </div>
                  )}
                  {(f.client_quote || f.clientQuote) && (
                    <QuoteBlock text={f.client_quote || f.clientQuote} color={C.purple} />
                  )}
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 16 }}>
                    {hoursVal > 0 && (
                      <div>
                        <span style={{ ...label }}>Hours/week</span>
                        <p style={{ fontSize: 22, fontWeight: 700, color: C.blue, margin: '4px 0 0', ...mono }}>{hoursVal}</p>
                      </div>
                    )}
                    {costVal > 0 && (
                      <div>
                        <span style={{ ...label }}>Annual cost</span>
                        <p style={{ fontSize: 22, fontWeight: 700, color: C.red, margin: '4px 0 0', ...mono }}>£{Number(costVal).toLocaleString()}</p>
                      </div>
                    )}
                    {Array.isArray(affected) && affected.length > 0 && (
                      <div>
                        <span style={{ ...label }}>Affects</span>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                          {affected.map((s: string, j: number) => (
                            <span key={j} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: C.tintBlue, color: C.blue, border: `1px solid ${C.blue}18` }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {f.recommendation && (
                    <div style={{ marginTop: 16, padding: '14px 18px', background: C.tintEmerald, borderLeft: `3px solid ${C.emerald}60`, borderRadius: '0 10px 10px 0' }}>
                      <span style={{ ...label, color: C.emerald }}>Recommendation</span>
                      <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 6, lineHeight: 1.65 }}>{f.recommendation}</p>
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

// ─── System Detail Overlay ───────────────────────────────────────────────────
function SystemDetailOverlay({ sys, borderColor, onClose }: { sys: any; borderColor: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, borderLeft: `4px solid ${borderColor}`,
        maxWidth: 600, width: '100%', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: SHADOW.lg, animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
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
  const [showFullMap, setShowFullMap] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const storageKey = report?.id ? `sa-visited-${report.id}` : null;
  const [visited, setVisited] = useState<Set<string>>(() => new Set(['overview']));

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setVisited(new Set([...parsed, 'overview']));
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify([...visited])); } catch { /* ignore */ }
  }, [visited, storageKey]);

  const handleNavigate = useCallback((sectionId: string) => {
    if (sectionId === activeSection) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveSection(sectionId);
      setVisited((prev) => { const next = new Set(prev); next.add(sectionId); return next; });
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
        .from('sa_engagements').select('id, status, is_shared_with_client')
        .eq('client_id', clientSession.clientId).maybeSingle();
      if (!engagement?.is_shared_with_client) { navigate('/dashboard'); return; }
      const { data: reportData, error: reportErr } = await supabase
        .from('sa_audit_reports').select('*')
        .eq('engagement_id', engagement.id).maybeSingle();
      if (reportErr) console.error('SA report fetch error:', reportErr.message);
      if (!reportData || !['generated', 'regenerating', 'approved', 'published', 'delivered'].includes(reportData.status)) {
        setReport(null); setLoading(false);
        if (!isRetry && loadReportRef.current === 0) {
          loadReportRef.current = 1;
          setTimeout(() => loadReport(true), 2000);
        }
        return;
      }
      setReport(reportData);
      const { data: findingsData } = await supabase
        .from('sa_findings').select('*')
        .eq('engagement_id', engagement.id).order('severity', { ascending: true });
      setFindings(findingsData || []);
    } catch (err) { console.error('Error loading SA report:', err); }
    finally { setLoading(false); }
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
  const SECTION_GROUPS: Record<string, string> = { overview: 'Overview', analysis: 'Analysis', roadmap: 'Roadmap', action: 'Action' };

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
        <div style={{ ...card({ padding: 48 }), textAlign: 'center' }}>
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
  const getProcessName = (proc: any) => proc.chainName || proc.chain_name || proc.name || (proc.chainCode || proc.chain_code || 'Process').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const getProcessCode = (proc: any) => proc.chainCode || proc.chain_code || proc.code || `proc-${Math.random()}`;

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
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', border: 'none',
                    background: activeSection === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: activeSection === item.id ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
                    borderLeft: activeSection === item.id ? `3px solid ${C.blue}` : '3px solid transparent',
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
  // v6 SECTION RENDERERS — BENTO LAYOUTS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderSection = () => {
    switch (activeSection) {

      // ─── OVERVIEW — BENTO HERO + FULL-WIDTH SUMMARY ────────────────────
      case 'overview':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Cinematic hero — FULL WIDTH */}
            <RevealCard style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #162340 100%)',
              borderRadius: 20, padding: 'clamp(28px, 4vw, 40px)', position: 'relative', overflow: 'hidden',
              border: 'none', boxShadow: SHADOW.lg,
            }}>
              <DotGrid opacity={0.06} />
              <NoiseOverlay opacity={0.12} />
              <div style={{ position: 'absolute', top: '-20%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${C.red}15 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Zap style={{ width: 14, height: 14, color: C.emeraldLight }} />
                  <span style={{ fontSize: 11, letterSpacing: '0.12em', color: C.emeraldLight, textTransform: 'uppercase', fontWeight: 600, ...mono }}>Systems Audit Report</span>
                </div>
                <h1 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: '#fff', lineHeight: 1.35, margin: '0 0 14px', wordBreak: 'break-word' }}>
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
              <div style={{ position: 'absolute', bottom: 20, right: 28, textAlign: 'right', zIndex: 1 }}>
                <CostClock annualCost={m.annualCostOfChaos} size="normal" />
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, ...mono }}>wasted since opening</p>
              </div>
            </RevealCard>

            {/* BENTO: 3 stat tiles — colored backgrounds */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'ANNUAL COST OF CHAOS', value: m.annualCostOfChaos, prefix: '£', color: C.red, bg: C.tintRed, border: C.red },
                { label: `AT ${m.growthMultiplier}× SCALE`, value: m.projectedCostAtScale, prefix: '£', color: C.orange, bg: C.tintOrange, border: C.orange },
                { label: 'HOURS LOST WEEKLY', value: m.hoursWastedWeekly, prefix: '', color: C.blue, bg: C.tintBlue, border: C.blue, decimals: 1 },
              ].map((stat, i) => (
                <RevealCard key={i} delay={i * 60} style={{ ...tintCard(stat.bg, stat.border, { padding: 22 }) }}>
                  <span style={{ ...label, color: stat.color }}>{stat.label}</span>
                  <p style={{ fontSize: 34, fontWeight: 800, color: stat.color, margin: '6px 0 0', fontVariantNumeric: 'tabular-nums', ...mono }}>
                    <AnimatedCounter target={stat.value} prefix={stat.prefix} duration={2200} decimals={(stat as any).decimals || 0} />
                  </p>
                </RevealCard>
              ))}
            </div>

            {/* Executive Summary — FULL WIDTH, plenty of room */}
            <RevealCard delay={200} style={{ ...card({ padding: '28px 32px' }) }}>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Executive Summary</h3>
              {splitNarrative(report.executive_summary, 6).map((para, i) => (
                <p key={i} style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.8, marginBottom: 14, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{para}</p>
              ))}
            </RevealCard>

            {/* Desired Outcomes — colored pill grid */}
            {facts?.desired_outcomes?.length > 0 && (
              <RevealCard delay={300} style={{ ...card({ padding: 24 }) }}>
                <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>What You Want to Achieve</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {facts.desired_outcomes.map((o: string, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                      background: C.tintEmerald, borderRadius: 10, border: `1px solid ${C.emerald}15`,
                    }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: C.emerald, flexShrink: 0 }} />
                      <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{displayOutcome(o)}</span>
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
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RevealCard style={{ ...card({ padding: 24 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h2 style={{ color: C.text, fontSize: 26, fontWeight: 800, margin: 0 }}>{systemsList.length} Systems</h2>
                <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>Across your technology stack</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {critGap > 0 && <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 18px', borderRadius: 20, background: C.tintRedMed, color: C.red }}>{critGap} critical</span>}
                {medGap > 0 && <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 18px', borderRadius: 20, background: C.tintOrange, color: C.orange }}>{medGap} gaps</span>}
                {okCount > 0 && <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 18px', borderRadius: 20, background: C.tintEmerald, color: C.emerald }}>{okCount} strong</span>}
              </div>
            </RevealCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {systemsList.map((sys: any, i: number) => {
                const gapCount = sys.gaps?.length || 0;
                const statusColor = gapCount >= 3 ? C.red : gapCount >= 1 ? C.orange : C.emerald;
                const tileBg = gapCount >= 3 ? C.tintRed : gapCount >= 1 ? C.tintOrange : C.tintEmerald;
                return (
                  <RevealCard key={i} delay={i * 40}
                    style={{ ...tintCard(tileBg, statusColor, { padding: 20, cursor: 'pointer' }), borderTop: `3px solid ${statusColor}` }}
                  >
                    <div onClick={() => setSelectedSystem(i)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{sys.name || sys.system_name}</span>
                        {gapCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: statusColor, width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono }}>{gapCount}</span>}
                      </div>
                      {sys.category && <span style={{ fontSize: 12, color: C.textMuted }}>{(sys.category || '').replace(/_/g, ' ')}</span>}
                      <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.06)', marginTop: 14, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: gapCount >= 3 ? '100%' : gapCount >= 1 ? '60%' : '20%', background: statusColor, borderRadius: 3, transition: `width 0.8s ${EASE.spring}` }} />
                      </div>
                      {gapCount > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                          {sys.gaps.slice(0, 2).map((g: string, j: number) => (
                            <span key={j} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: '#fff', color: C.red, border: `1px solid ${C.red}20`, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{g}</span>
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
              <SystemDetailOverlay sys={systemsList[selectedSystem]}
                borderColor={(systemsList[selectedSystem].gaps?.length || 0) >= 3 ? C.red : (systemsList[selectedSystem].gaps?.length || 0) >= 1 ? C.orange : C.emerald}
                onClose={() => setSelectedSystem(null)} />
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
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Hero — big ring + verdict */}
            <RevealCard style={{
              borderRadius: 20, padding: 'clamp(28px, 4vw, 40px)', position: 'relative', overflow: 'hidden',
              background: isCritical
                ? 'linear-gradient(135deg, #1a0808 0%, #2d0a0a 30%, #0f172a 100%)'
                : `linear-gradient(135deg, ${overallColor}08 0%, ${overallColor}03 50%, #fff 100%)`,
              border: isCritical ? 'none' : `1px solid ${overallColor}18`,
              boxShadow: isCritical ? SHADOW.lg : SHADOW.md,
            }}>
              {isCritical && <NoiseOverlay opacity={0.2} />}
              {isCritical && <div style={{ position: 'absolute', top: '50%', left: '20%', transform: 'translate(-50%, -50%)', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${C.red}20 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
                <ProgressRing score={overallScore} size={200} strokeWidth={16} color={overallColor} ringLabel="Overall" />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <h2 style={{ color: isCritical ? '#fff' : C.text, fontSize: 28, fontWeight: 800, margin: 0 }}>System Health</h2>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isCritical ? '#fff' : overallColor, padding: '6px 18px', borderRadius: 20, background: isCritical ? C.red : `${overallColor}15`, ...mono }}>{healthVerdict}</span>
                  </div>
                  <p style={{ color: isCritical ? 'rgba(255,255,255,0.7)' : C.textSecondary, fontSize: 15, lineHeight: 1.75, maxWidth: '56ch', margin: 0 }}>
                    {overallScore < 30 ? 'Your systems are critically disconnected. Manual workarounds dominate daily operations, creating compounding errors and invisible costs.' :
                     overallScore < 50 ? 'Significant gaps exist across your technology stack. Key processes rely on manual intervention, limiting scalability.' :
                     overallScore < 70 ? 'Your systems have a reasonable foundation but key integration and automation gaps are holding you back.' :
                     'Your systems are well-connected with strong foundations. Focus on optimisation to unlock remaining value.'}
                  </p>
                </div>
              </div>
            </RevealCard>

            {/* BENTO: Sub-scores as colored cards with rings INSIDE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {healthItems.slice(1).map((item, i) => {
                const sc = item.score < 30 ? C.red : item.score < 50 ? C.orange : item.score < 70 ? C.amber : C.emerald;
                const bgTint = item.score < 30 ? C.tintRed : item.score < 50 ? C.tintOrange : item.score < 70 ? C.tintAmber : C.tintEmerald;
                return (
                  <RevealCard key={item.key} delay={i * 80} style={{ ...tintCard(bgTint, sc, { padding: 24 }) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <ProgressRing score={item.score} size={80} strokeWidth={7} color={sc} delay={i * 200} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.text, display: 'block', marginBottom: 4 }}>{item.label}</span>
                        <span style={{ fontSize: 28, fontWeight: 800, color: sc, ...mono }}>{item.score}</span>
                        <span style={{ fontSize: 12, color: C.textMuted }}>/100</span>
                      </div>
                    </div>
                    {item.evidence && (
                      <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6, margin: '14px 0 0', maxHeight: 80, overflow: 'hidden' }}>{item.evidence}</p>
                    )}
                  </RevealCard>
                );
              })}
            </div>

            {/* Key Person Risk */}
            {keyPersonFindings.length > 0 && (
              <RevealCard delay={300} style={{
                ...card({ padding: 0, overflow: 'hidden' }),
                border: `1px solid ${C.red}25`,
                boxShadow: SHADOW.colored(C.red, 0.15),
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

      // ─── COST OF CHAOS — BENTO DASHBOARD LAYOUT ────────────────────────
      case 'chaos': {
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* BENTO TOP ROW: Big cost number + Live clock + Growth */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 14 }}>
              {/* Main cost — red tinted card */}
              <RevealCard style={{
                ...tintCard(C.tintRedMed, C.red, { padding: 28 }),
                gridRow: 'span 2',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <span style={{ ...label, color: C.red }}>ANNUAL COST OF CHAOS</span>
                <p style={{ fontSize: 52, fontWeight: 800, color: C.red, margin: '8px 0', fontVariantNumeric: 'tabular-nums', ...mono }}>
                  <AnimatedCounter target={m.annualCostOfChaos} prefix="£" duration={2500} />
                </p>
                <div style={{ marginTop: 8 }}>
                  <CostClock annualCost={m.annualCostOfChaos} size="large" />
                  <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4, ...mono }}>wasted since you opened this report</p>
                </div>
              </RevealCard>

              {/* Weekly hours — amber */}
              <RevealCard delay={60} style={{ ...tintCard(C.tintAmber, C.amber, { padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'center' }) }}>
                <span style={{ ...label, color: C.amber }}>EVERY WEEK</span>
                <p style={{ fontSize: 38, fontWeight: 800, color: C.amber, margin: '6px 0 2px', ...mono }}>{m.hoursWastedWeekly}h</p>
                <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>lost to manual workarounds</p>
              </RevealCard>

              {/* Annual — orange */}
              <RevealCard delay={120} style={{ ...tintCard(C.tintOrange, C.orange, { padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'center' }) }}>
                <span style={{ ...label, color: C.orange }}>EVERY YEAR</span>
                <p style={{ fontSize: 32, fontWeight: 800, color: C.orange, margin: '6px 0 2px', ...mono }}>{fmtFull(m.annualCostOfChaos)}</p>
                <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>in invisible costs</p>
              </RevealCard>

              {/* At growth — blue */}
              <RevealCard delay={180} style={{ ...tintCard(C.tintBlue, C.blue, { padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'center' }), gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ ...label, color: C.blue }}>AT {m.growthMultiplier}× GROWTH</span>
                    <p style={{ fontSize: 36, fontWeight: 800, color: C.blue, margin: '6px 0 2px', ...mono }}>{fmtFull(m.projectedCostAtScale)}</p>
                    <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>if nothing changes</p>
                  </div>
                  <TrendingUp style={{ width: 48, height: 48, color: `${C.blue}30` }} />
                </div>
              </RevealCard>
            </div>

            {/* BENTO: Narrative + Quote side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: bestQuote ? '1.2fr 1fr' : '1fr', gap: 14 }}>
              <RevealCard delay={240} style={{ ...card({ padding: 24 }) }}>
                <span style={{ ...label, color: C.text, marginBottom: 10, display: 'block' }}>THE PATTERN</span>
                {splitNarrative(report.cost_of_chaos_narrative, 3).map((para, i) => (
                  <p key={i} style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.75, marginBottom: 12, overflowWrap: 'break-word' }}>{para}</p>
                ))}
              </RevealCard>
              {bestQuote && (
                <RevealCard delay={300} style={{ ...card({ padding: 0, display: 'flex', flexDirection: 'column' }) }}>
                  <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <QuoteBlock text={bestQuote} source="Staff interview" color={C.purple} />
                  </div>
                </RevealCard>
              )}
            </div>

            {/* Process cost bars — FULL WIDTH */}
            {sortedProcesses.length > 0 && (
              <RevealCard delay={360} style={{ ...card({ padding: 28 }) }}>
                <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Where the Hours Go</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sortedProcesses.slice(0, 7).map((proc: any, i: number) => {
                    const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
                    const pct = (hours / maxProcessHours) * 100;
                    const barColor = pct > 80 ? C.red : pct > 50 ? C.orange : C.amber;
                    const procName = getProcessName(proc);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: '0 0 200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{procName}</span>
                        <div style={{ flex: 1, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.04)', overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`, borderRadius: 10,
                            background: `linear-gradient(90deg, ${barColor}, ${barColor}bb)`,
                            transition: `width 1s ${EASE.spring} ${i * 80}ms`,
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 14,
                          }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: pct > 30 ? '#fff' : C.text, ...mono }}>{hours}h/wk</span>
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

      // ─── PROCESSES — READABLE QUOTES ───────────────────────────────────
      case 'processes': {
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <RevealCard style={{ ...card({ padding: 24 }) }}>
              <h2 style={{ color: C.text, fontSize: 26, fontWeight: 800, margin: 0 }}>{sortedProcesses.length} Process Chains</h2>
              <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>Total <strong style={{ color: C.red, ...mono }}>{totalProcessHours}h</strong> wasted weekly across your operations</p>
            </RevealCard>

            {sortedProcesses.map((proc: any, i: number) => {
              const hours = proc.hoursWasted ?? proc.hours_wasted ?? 0;
              const procCode = getProcessCode(proc);
              const procName = getProcessName(proc);
              const isExpanded = expandedProcess === procCode;
              const pct = (hours / maxProcessHours) * 100;
              const barColor = pct > 80 ? C.red : pct > 50 ? C.orange : C.amber;
              const gaps = proc.criticalGaps || proc.critical_gaps || [];
              const quotes = proc.clientQuotes || proc.client_quotes || [];
              return (
                <RevealCard key={procCode} delay={i * 50} style={{ ...card({ padding: 0, overflow: 'hidden' }) }}>
                  <div
                    onClick={() => setExpandedProcess(isExpanded ? null : procCode)}
                    style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${barColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: barColor, flexShrink: 0 }}>
                      <ChainIcon code={proc.chainCode || proc.chain_code || ''} size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{procName}</p>
                      <span style={{ fontSize: 12, color: C.textMuted }}>{gaps.length} gaps · {quotes.length} quotes</span>
                    </div>
                    <span style={{ fontSize: 28, fontWeight: 800, color: barColor, ...mono, flexShrink: 0 }}>{hours}h</span>
                    <ChevronDown style={{ width: 18, height: 18, color: C.textMuted, transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </div>
                  <div style={{ height: 5, background: 'rgba(0,0,0,0.04)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`, transition: `width 0.8s ${EASE.spring}` }} />
                  </div>
                  <div style={{ maxHeight: isExpanded ? 1000 : 0, overflow: 'hidden', transition: `max-height 0.4s ${EASE.out}` }}>
                    <div style={{ padding: '20px 24px 24px' }}>
                      {gaps.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <span style={{ ...label, color: C.red, marginBottom: 10, display: 'block' }}>Critical Gaps</span>
                          {gaps.map((g: string, j: number) => (
                            <p key={j} style={{ fontSize: 14, color: C.textSecondary, marginBottom: 8, paddingLeft: 14, borderLeft: `3px solid ${C.red}50`, lineHeight: 1.7 }}>{g}</p>
                          ))}
                        </div>
                      )}
                      {quotes.length > 0 && (
                        <div>
                          <span style={{ ...label, color: C.purple, marginBottom: 10, display: 'block' }}>What your team said</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {quotes.map((q: string, j: number) => (
                              <QuoteBlock key={j} text={q} color={C.purple} />
                            ))}
                          </div>
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
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <RevealCard style={{ ...card({ padding: 24 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ color: C.text, fontSize: 26, fontWeight: 800, margin: 0 }}>{displayFindings.length} Findings</h2>
                <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>Select a finding below to see the full detail</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {criticalCount > 0 && <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 20, background: C.red, color: '#fff' }}>{criticalCount} Critical</span>}
                {highCount > 0 && <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 20, background: C.orange, color: '#fff' }}>{highCount} High</span>}
              </div>
            </RevealCard>
            <FindingsInlineList findings={displayFindings} displayOutcomeFn={displayOutcome} />
          </div>
        );

      // ─── TECH MAP — DIRECTLY ON GREY, NO DARK BOX ─────────────────────
      case 'techmap': {
        const mapData = systemsMaps?.[0] || {};
        const connections = mapData.connections || mapData.integrations || [];
        const issues = connections.filter((c: any) => c.issue || c.status === 'broken' || c.status === 'manual');
        const integrationFindings = displayFindings.filter((f: any) => f.category === 'integration_gap' || (f.title || '').toLowerCase().includes('disconnect') || (f.title || '').toLowerCase().includes('integration'));
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RevealCard style={{ ...card({ padding: 24 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ color: C.text, fontSize: 26, fontWeight: 800, margin: 0 }}>Technology Map</h2>
                <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>{systemsList.length} systems · How they connect and where the gaps are</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 20, background: C.tintRedMed, color: C.red }}>{issues.length || integrationFindings.length} integration gaps</span>
              </div>
            </RevealCard>

            {/* System tiles — LARGE, colored, directly on grey */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {systemsList.map((sys: any, i: number) => {
                const gapCount = sys.gaps?.length || 0;
                const statusColor = gapCount >= 3 ? C.red : gapCount >= 1 ? C.orange : C.emerald;
                const tileBg = gapCount >= 3 ? C.tintRedMed : gapCount >= 1 ? C.tintOrange : C.tintEmerald;
                return (
                  <RevealCard key={i} delay={i * 25} style={{
                    ...tintCard(tileBg, statusColor, { padding: '16px 18px', textAlign: 'center', cursor: 'pointer' }),
                    borderTop: `3px solid ${statusColor}`,
                  }}>
                    <div onClick={() => setSelectedSystem(i)}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sys.name || sys.system_name}</p>
                      {sys.cost != null && <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>{fmt(sys.cost)}/mo</span>}
                      {gapCount > 0 && <div style={{ marginTop: 8, fontSize: 12, color: statusColor, fontWeight: 700, ...mono }}>{gapCount} gap{gapCount !== 1 ? 's' : ''}</div>}
                    </div>
                  </RevealCard>
                );
              })}
            </div>

            {selectedSystem !== null && systemsList[selectedSystem] && (
              <SystemDetailOverlay sys={systemsList[selectedSystem]}
                borderColor={(systemsList[selectedSystem].gaps?.length || 0) >= 3 ? C.red : (systemsList[selectedSystem].gaps?.length || 0) >= 1 ? C.orange : C.emerald}
                onClose={() => setSelectedSystem(null)} />
            )}

            {/* Integration gaps — clear, impactful */}
            {integrationFindings.length > 0 && (
              <RevealCard delay={150} style={{ ...card({ padding: 24 }) }}>
                <span style={{ ...label, color: C.red, marginBottom: 14, display: 'block' }}>Key Integration Gaps</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
                  {integrationFindings.slice(0, 6).map((f: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                      borderRadius: 12, background: C.tintRed, border: `1px solid ${C.red}15`,
                    }}>
                      <AlertTriangle style={{ width: 18, height: 18, color: C.red, flexShrink: 0, marginTop: 2 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.5 }}>{f.title}</p>
                        {(f.hours_wasted_weekly || f.hoursWastedWeekly || f.hoursPerWeek) > 0 && (
                          <span style={{ fontSize: 12, color: C.red, fontWeight: 600, ...mono }}>{f.hours_wasted_weekly || f.hoursWastedWeekly || f.hoursPerWeek}h/wk impact</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RevealCard>
            )}

            {/* Interactive map — toggle, rendered DIRECTLY */}
            {(systemsMaps?.length > 0 || (facts?.systems && facts.systems.length > 0)) && (
              <div>
                <button
                  onClick={() => setShowFullMap(!showFullMap)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 14,
                    background: showFullMap ? C.navy : '#fff', color: showFullMap ? '#fff' : C.text,
                    border: '1px solid rgba(22,35,64,0.08)', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    boxShadow: SHADOW.sm, transition: 'all 0.2s ease', width: '100%', justifyContent: 'center',
                  }}
                >
                  <Layers style={{ width: 16, height: 16 }} />
                  {showFullMap ? 'Hide Interactive Map' : 'View Interactive Systems Map'}
                  <ChevronDown style={{ width: 16, height: 16, transform: showFullMap ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                </button>
                {showFullMap && (
                  <div style={{ marginTop: 14, borderRadius: 16, overflow: 'hidden', boxShadow: SHADOW.md, border: '1px solid rgba(22,35,64,0.08)', background: '#fff' }}>
                    <SystemsMapSection systemsMaps={systemsMaps} facts={facts} layout="split" />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // ─── QUICK WINS — FULL WIDTH, READABLE ────────────────────────────
      case 'quickwins': {
        const qwList = quickWins || [];
        const totalQWHours = qwList.reduce((s: number, q: any) => s + (parseFloat(q.hoursSaved || q.hours_saved || q.hoursSavedWeekly || 0) || 0), 0);
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Hero — emerald */}
            <RevealCard style={{
              borderRadius: 20, overflow: 'hidden', position: 'relative',
              background: `linear-gradient(135deg, ${C.emerald}, #047857)`,
              padding: '28px 32px', border: 'none', boxShadow: SHADOW.lg,
            }}>
              <NoiseOverlay opacity={0.1} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Zap style={{ width: 26, height: 26, color: '#fff' }} />
                    <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0 }}>Start This Week</h2>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, margin: 0 }}>
                    {qwList.length} wins · zero cost · <strong>{totalQWHours}h saved every week</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ val: '£0', sub: 'Investment' }, { val: `+${totalQWHours}h`, sub: 'Per Week' }].map((s, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '14px 28px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, ...mono }}>{s.val}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealCard>

            {/* Quick win cards — FULL WIDTH, numbered, no wasted left gutter */}
            {qwList.map((qw: any, i: number) => {
              const hours = parseFloat(qw.hoursSaved || qw.hours_saved || qw.hoursSavedWeekly || 0) || 0;
              const isExpanded = expandedQW === i;
              const owner = qw.owner || qw.assignee || '';
              return (
                <RevealCard key={i} delay={i * 60} style={{ ...card({ padding: 0, overflow: 'hidden' }), borderLeft: `4px solid ${C.emerald}` }}>
                  <div onClick={() => setExpandedQW(isExpanded ? null : i)}
                    style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: C.tintEmeraldMed, color: C.emerald, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0, ...mono }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0, color: C.text, fontWeight: 500 }}>
                        {owner && <span style={{ fontWeight: 700, color: C.blue }}>{owner}: </span>}
                        {qw.title || qw.action}
                      </p>
                    </div>
                    <span style={{ fontSize: 22, fontWeight: 800, color: C.emerald, ...mono, flexShrink: 0 }}>+{hours}h</span>
                    <ChevronDown style={{ width: 16, height: 16, color: C.textMuted, transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </div>
                  <div style={{ maxHeight: isExpanded ? 500 : 0, overflow: 'hidden', transition: `max-height 0.4s ${EASE.out}` }}>
                    <div style={{ padding: '0 22px 22px', paddingLeft: 72 }}>
                      {(qw.steps || qw.implementation) && (
                        <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.75, marginBottom: 14 }}>{qw.steps || qw.implementation}</p>
                      )}
                      {(qw.impact || qw.mondayMorning) && (
                        <div style={{ padding: '14px 18px', background: C.tintEmerald, borderLeft: `3px solid ${C.emerald}60`, borderRadius: '0 12px 12px 0', marginBottom: 10 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: C.text, lineHeight: 1.7, margin: 0 }}>{qw.impact || qw.mondayMorning}</p>
                        </div>
                      )}
                      {(qw.affectedSystems || qw.affected_systems || []).length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                          {(qw.affectedSystems || qw.affected_systems).map((sys: string, j: number) => (
                            <span key={j} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: C.tintBlue, color: C.blue, fontWeight: 500 }}>{sys}</span>
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

      // ─── ROADMAP — VISUAL JOURNEY ─────────────────────────────────────
      case 'roadmap': {
        const phaseColors: Record<string, string> = {
          immediate: C.emerald, quick_win: C.emerald, foundation: C.blue,
          short_term: C.blue, strategic: C.purple, medium_term: C.purple,
          optimization: '#4F46E5', long_term: C.textMuted,
        };
        const phaseBgs: Record<string, string> = {
          immediate: C.tintEmerald, quick_win: C.tintEmerald, foundation: C.tintBlue,
          short_term: C.tintBlue, strategic: C.tintPurple, medium_term: C.tintPurple,
          optimization: '#E0E7FF', long_term: '#F8FAFC',
        };
        const phaseIcons: Record<string, any> = {
          immediate: Zap, quick_win: Zap, foundation: Layers,
          short_term: Target, strategic: Rocket, medium_term: Rocket,
          optimization: Crown, long_term: Star,
        };
        const activePhases = phaseOrder.filter(p => recsByPhase[p]?.length > 0);

        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RevealCard style={{ ...card({ padding: 24 }) }}>
              <h2 style={{ color: C.text, fontSize: 26, fontWeight: 800, margin: 0 }}>Implementation Roadmap</h2>
              <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>{displayRecs.length} recommendations across {activePhases.length} phases</p>
            </RevealCard>

            {/* VISUAL JOURNEY BAR — colored segments */}
            {activePhases.length > 1 && (
              <RevealCard delay={60} style={{ ...card({ padding: '20px 28px' }), position: 'relative' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {activePhases.map((p, i) => {
                    const PhaseIcon = phaseIcons[p] || Target;
                    const color = phaseColors[p] || C.blue;
                    const bg = phaseBgs[p] || C.tintBlue;
                    const count = (recsByPhase[p] || []).length;
                    return (
                      <div key={p} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: '100%', height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}88)`,
                          position: 'relative',
                        }}>
                          <div style={{
                            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                            width: 36, height: 36, borderRadius: 18, background: color, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: SHADOW.colored(color, 0.3), zIndex: 2,
                          }}>
                            <PhaseIcon style={{ width: 18, height: 18 }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                          <PhaseBadge phase={p} size="large" />
                          <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4, ...mono }}>{count} item{count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Connector line behind */}
                <div style={{ position: 'absolute', left: 40, right: 40, top: 30, height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2, zIndex: 0 }} />
              </RevealCard>
            )}

            {/* Phase sections */}
            {activePhases.map((phase) => {
              const phaseRecs = recsByPhase[phase] || [];
              const phaseColor = phaseColors[phase] || C.blue;
              const phaseBg = phaseBgs[phase] || C.tintBlue;
              return (
                <div key={phase}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '0 4px' }}>
                    <PhaseBadge phase={phase} size="large" />
                    <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>{phaseRecs.length} item{phaseRecs.length !== 1 ? 's' : ''}</span>
                    <div style={{ flex: 1, height: 1, background: `${phaseColor}20` }} />
                  </div>
                  {phaseRecs.map((rec: any, ri: number) => {
                    const recKey = rec.title || `${phase}-${ri}`;
                    const isExpanded = expandedRec === recKey;
                    const cost = rec.estimatedCost || rec.estimated_cost || 0;
                    const benefit = rec.annualBenefit || rec.annual_cost_savings || 0;
                    const hrs = parseFloat(rec.hoursSavedWeekly || rec.hours_saved_weekly) || 0;
                    const payback = cost > 0 && benefit > 0 ? Math.max(1, Math.round(cost / (benefit / 12))) : (cost === 0 ? 0 : null);
                    return (
                      <RevealCard key={recKey} delay={ri * 50} style={{ ...card({ padding: 0, overflow: 'hidden', marginBottom: 8 }), borderLeft: `4px solid ${phaseColor}` }}>
                        <div onClick={() => setExpandedRec(isExpanded ? null : recKey)}
                          style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 15, background: phaseBg, color: phaseColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, ...mono }}>{ri + 1}</div>
                          <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.title}</span>
                          {benefit > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: C.emerald, ...mono, flexShrink: 0 }}>{fmt(benefit)}/yr</span>}
                          <ChevronDown style={{ width: 16, height: 16, color: C.textMuted, transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }} />
                        </div>
                        <div style={{ maxHeight: isExpanded ? 600 : 0, overflow: 'hidden', transition: `max-height 0.4s ${EASE.out}` }}>
                          <div style={{ padding: '0 22px 22px' }}>
                            <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.75, marginBottom: 16, overflowWrap: 'break-word' }}>{rec.description}</p>
                            {/* Stats — bento mini-grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
                              {[
                                { lbl: 'Investment', val: fmt(cost), color: C.text, bg: '#F8FAFC' },
                                { lbl: 'Benefit', val: `${fmt(benefit)}/yr`, color: C.emerald, bg: C.tintEmerald },
                                { lbl: 'Hours', val: `${hrs}h/wk`, color: C.blue, bg: C.tintBlue },
                                ...(payback != null && payback !== 0 ? [{ lbl: 'Payback', val: `${payback} mo`, color: C.purple, bg: C.tintPurple }] : []),
                              ].map((s, si) => (
                                <div key={si} style={{ padding: '12px 14px', borderRadius: 10, background: s.bg, textAlign: 'center' }}>
                                  <span style={{ ...label, fontSize: 9 }}>{s.lbl}</span>
                                  <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: '4px 0 0', ...mono }}>{s.val}</p>
                                </div>
                              ))}
                            </div>
                            {rec.mondayMorning && (
                              <div style={{ padding: '12px 16px', background: C.tintEmerald, borderLeft: `3px solid ${C.emerald}60`, borderRadius: '0 10px 10px 0' }}>
                                <p style={{ fontSize: 14, fontWeight: 500, color: C.text, lineHeight: 1.65, margin: 0 }}>{rec.mondayMorning}</p>
                              </div>
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

      // ─── INVESTMENT & ROI — IMPACTFUL ─────────────────────────────────
      case 'investment': {
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* BENTO stat tiles — BIG, colored */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'INVESTMENT', val: fmt(totalInvestment), color: C.text, bg: '#F8FAFC', border: C.text },
                { label: 'ANNUAL BENEFIT', val: fmtFull(totalBenefit), color: C.emerald, bg: C.tintEmeraldMed, border: C.emerald },
                { label: 'PAYBACK', val: `${m.paybackMonths} mo`, color: C.blue, bg: C.tintBlueMed, border: C.blue },
                { label: 'ROI', val: m.roiRatio, color: C.purple, bg: C.tintPurpleMed, border: C.purple },
              ].map((s, i) => (
                <RevealCard key={i} delay={i * 50} style={{ ...tintCard(s.bg, s.border, { padding: '20px 16px', textAlign: 'center' }) }}>
                  <span style={{ ...label, color: C.textMuted, fontSize: 10 }}>{s.label}</span>
                  <p style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 0', ...mono, fontVariantNumeric: 'tabular-nums', color: s.color }}>{s.val}</p>
                </RevealCard>
              ))}
            </div>

            {/* ROI visual — comparison bars */}
            <RevealCard delay={200} style={{ ...card({ padding: 28 }) }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Return by Recommendation</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {displayRecs.map((r: any, i: number) => {
                  const benefit = r.annualBenefit || r.annual_cost_savings || 0;
                  const cost = r.estimatedCost || r.estimated_cost || 0;
                  const maxB = Math.max(...displayRecs.map((r2: any) => r2.annualBenefit || r2.annual_cost_savings || 0), 1);
                  const pct = (benefit / maxB) * 100;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, ...mono, width: 24, textAlign: 'right', flexShrink: 0 }}>R{i + 1}</span>
                      <div style={{ flex: 1, height: 40, borderRadius: 10, background: 'rgba(0,0,0,0.03)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`, borderRadius: 10,
                          background: `linear-gradient(90deg, ${C.emerald}, ${C.emeraldLight})`,
                          transition: `width 0.8s ${EASE.spring} ${i * 60}ms`,
                          display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 14,
                          justifyContent: 'space-between',
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: pct > 25 ? '#fff' : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', ...mono, flexShrink: 0 }}>£{benefit.toLocaleString()}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: C.textMuted, ...mono, width: 50, textAlign: 'right', flexShrink: 0 }}>{fmt(cost)}</span>
                    </div>
                  );
                })}
                {/* Total bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.text, ...mono, width: 24, textAlign: 'right', flexShrink: 0 }}>Σ</span>
                  <div style={{ flex: 1, height: 44, borderRadius: 10, background: `linear-gradient(90deg, ${C.blue}, #1d4ed8)`, display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 14, justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total Annual Benefit</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', ...mono }}>£{Math.round(totalBenefit).toLocaleString()}</span>
                  </div>
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 700, ...mono, width: 50, textAlign: 'right', flexShrink: 0 }}>{fmt(totalInvestment)}</span>
                </div>
              </div>
            </RevealCard>

            {/* Data table */}
            <RevealCard delay={300} style={{ ...card({ padding: 0, overflow: 'hidden' }) }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Phase', 'Title', 'Cost', 'Benefit', 'Hours'].map(h => (
                        <th key={h} style={{ ...label, fontSize: 10, padding: '12px 14px', textAlign: 'left', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecs.map((rec: any, i: number) => {
                      const phase = rec.implementationPhase || rec.implementation_phase || 'short_term';
                      return (
                        <tr key={i}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.015)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}><PhaseBadge phase={phase} /></td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)', color: C.text, fontWeight: 500, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.title}</td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)', ...mono, color: C.text }}>{fmt(rec.estimatedCost || rec.estimated_cost || 0)}</td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)', ...mono, color: C.emerald, fontWeight: 700 }}>£{(rec.annualBenefit || rec.annual_cost_savings || 0).toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)', ...mono, color: C.text }}>{parseFloat(rec.hoursSavedWeekly || rec.hours_saved_weekly) || 0}h</td>
                        </tr>
                      );
                    })}
                    <tr style={{ fontWeight: 700 }}>
                      <td style={{ padding: '12px 14px', borderTop: '2px solid rgba(0,0,0,0.08)' }} colSpan={2}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>TOTAL</span>
                      </td>
                      <td style={{ padding: '12px 14px', borderTop: '2px solid rgba(0,0,0,0.08)', ...mono, color: C.text, fontWeight: 700 }}>{fmt(totalInvestment)}</td>
                      <td style={{ padding: '12px 14px', borderTop: '2px solid rgba(0,0,0,0.08)', ...mono, color: C.emerald, fontWeight: 700 }}>£{Math.round(totalBenefit).toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', borderTop: '2px solid rgba(0,0,0,0.08)', ...mono, color: C.text, fontWeight: 700 }}>{totalHoursSaved}h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </RevealCard>
          </div>
        );
      }

      // ─── VISION — THE KILLER CLOSE ────────────────────────────────────
      case 'monday': {
        const visionParas = splitNarrative(report.time_freedom_narrative, 6);
        const mondayQuote = clientPresentation?.mondayMorning || visionParas[0] || 'Imagine opening your laptop on Monday morning and having everything you need at your fingertips.';
        const howParas = visionParas.slice(1);
        const freedomStories = clientPresentation?.freedomStories || adminGuidance?.freedomStories || [];

        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* CINEMATIC HERO — the big payoff */}
            <RevealCard style={{
              borderRadius: 24, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(135deg, #0F172A 0%, #162340 50%, #1E293B 100%)',
              padding: 'clamp(36px, 5vw, 56px) clamp(28px, 4vw, 48px)', textAlign: 'center',
              border: 'none', boxShadow: SHADOW.lg,
            }}>
              <DotGrid opacity={0.05} />
              <NoiseOverlay opacity={0.12} />
              {/* Atmospheric glows */}
              <div style={{ position: 'absolute', top: '-20%', left: '15%', width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${C.blue}20 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-15%', right: '10%', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${C.emerald}18 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '30%', right: '25%', width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${C.purple}12 0%, transparent 70%)`, filter: 'blur(50px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                  <Rocket style={{ width: 16, height: 16, color: C.emeraldLight }} />
                  <span style={{ fontSize: 11, letterSpacing: '0.15em', color: C.emeraldLight, textTransform: 'uppercase', fontWeight: 600, ...mono }}>Your Future</span>
                </div>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 auto 28px', letterSpacing: '-0.02em', maxWidth: '28ch' }}>
                  Ready to Reclaim{' '}
                  <span style={{ background: `linear-gradient(135deg, ${C.emeraldLight}, ${C.teal})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {totalHoursSaved} Hours
                  </span>
                  {' '}Every Week?
                </h2>

                {/* BENTO stat pills inside hero */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
                  {[
                    { val: `${totalHoursSaved}h`, sub: 'Reclaimed/week', bg: `linear-gradient(135deg, ${C.emerald}, #047857)`, glow: C.emerald },
                    { val: `£${Math.round(totalBenefit / 1000)}k`, sub: 'Annual benefit', bg: `linear-gradient(135deg, ${C.blue}, #1d4ed8)`, glow: C.blue },
                    { val: `<${m.paybackMonths} mo`, sub: 'Payback period', bg: `linear-gradient(135deg, ${C.purple}, #6D28D9)`, glow: C.purple },
                    { val: fmt(totalInvestment), sub: 'Total investment', bg: 'rgba(255,255,255,0.1)', glow: 'transparent' },
                  ].map((s, i) => (
                    <div key={i} style={{
                      background: s.bg, borderRadius: 16, padding: '18px 28px', border: '1px solid rgba(255,255,255,0.15)',
                      minWidth: 130, boxShadow: s.glow !== 'transparent' ? SHADOW.glow(s.glow, 0.25) : 'none',
                    }}>
                      <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, ...mono }}>{s.val}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealCard>

            {/* Monday morning quote — FULL WIDTH, readable */}
            <RevealCard delay={100} style={{
              ...tintCard(C.tintEmerald, C.emerald, { padding: '24px 28px' }),
              borderLeft: `5px solid ${C.emerald}`,
            }}>
              <QuoteBlock text={mondayQuote} color={C.emerald} />
            </RevealCard>

            {/* How we get there — BENTO CARDS, fills width */}
            {howParas.length > 0 && (
              <RevealCard delay={200} style={{ ...card({ padding: 24 }) }}>
                <span style={{ ...label, color: C.text, marginBottom: 14, display: 'block' }}>HOW WE GET THERE</span>
                <div style={{ display: 'grid', gridTemplateColumns: howParas.length >= 3 ? 'repeat(3, 1fr)' : howParas.length === 2 ? '1fr 1fr' : '1fr', gap: 14 }}>
                  {howParas.map((para, i) => {
                    const colors = [C.blue, C.emerald, C.purple, C.teal, C.amber];
                    const bgTints = [C.tintBlue, C.tintEmerald, C.tintPurple, C.tintTeal, C.tintAmber];
                    const ci = i % colors.length;
                    return (
                      <div key={i} style={{
                        padding: '18px 20px', background: bgTints[ci], borderRadius: 14,
                        borderLeft: `3px solid ${colors[ci]}40`,
                      }}>
                        <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{para}</p>
                      </div>
                    );
                  })}
                </div>
              </RevealCard>
            )}

            {/* Freedom stories */}
            {freedomStories.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {freedomStories.map((story: any, i: number) => (
                  <RevealCard key={i} delay={i * 50} style={{ ...tintCard(C.tintEmerald, C.emerald, { padding: 22 }), borderTop: `3px solid ${C.emerald}` }}>
                    <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{typeof story === 'string' ? story : story.text || story.description || JSON.stringify(story)}</p>
                  </RevealCard>
                ))}
              </div>
            )}

            {/* CTA — THE NAIL IN THE COFFIN */}
            <RevealCard delay={350} style={{
              borderRadius: 20, overflow: 'hidden', position: 'relative',
              background: `linear-gradient(135deg, ${C.emerald}, #047857, ${C.teal})`,
              backgroundSize: '200% 200%',
              padding: '40px 48px', textAlign: 'center', border: 'none',
              boxShadow: SHADOW.colored(C.emerald, 0.25),
            }}>
              <NoiseOverlay opacity={0.08} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
                  <Trophy style={{ width: 28, height: 28, color: '#fff' }} />
                </div>
                <h3 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
                  {fmt(totalInvestment)} Investment → {fmtFull(totalBenefit)} Annual Return
                </h3>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', maxWidth: '50ch', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  {m.roiRatio} return on investment with payback in {m.paybackMonths} month{m.paybackMonths !== 1 ? 's' : ''}. Let&apos;s make it happen.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
                  <button
                    style={{
                      background: '#fff', color: C.emerald,
                      padding: '14px 40px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
                  >
                    <Phone style={{ width: 18, height: 18 }} /> Book Your Implementation Call
                  </button>
                </div>
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
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
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
          marginLeft: 220, flex: 1, padding: '20px 28px', overflowY: 'auto', height: '100vh',
          background: C.bg,
          opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(6px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        {/* v6: WIDER max-width — fills the grey area */}
        <div style={{ maxWidth: 1280, margin: '0 auto', overflow: 'hidden' }}>
          {/* Client header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 16, marginBottom: 16, borderBottom: `1px solid ${C.cardBorder}` }}>
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
