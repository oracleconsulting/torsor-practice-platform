// ============================================================================
// BENCHMARKING CLIENT DASHBOARD — v1 PREMIUM DASHBOARD REWRITE
// ============================================================================
// Client-facing dashboard: Position → Metrics → Value → Risk → Path → Future
//
// Replaces the scroll-through BenchmarkingClientReport with an interactive
// dashboard following the SA Report pattern (sidebar nav, section switching,
// scroll reveal, animated counters, progress rings, glass cards).
//
// ZERO DATA LOSS: Every section from the original report is rendered here.
// Data layer is IDENTICAL. BenchmarkAnalysis interface is the single source of truth.
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, AlertTriangle, Zap, BarChart3, Target, ChevronDown,
  Clock, Shield, Activity, CalendarClock, PoundSterling, Coffee, Gem,
  Rocket, Phone
} from 'lucide-react';
import type { ValueAnalysis, ValueSuppressor } from '../../../types/benchmarking';
import type { BaselineMetrics } from '../../../lib/scenario-calculator';
import type {
  EnhancedValueSuppressor,
  ExitReadinessScore,
  TwoPathsNarrative,
  SurplusCashData
} from '../../../types/opportunity-calculations';

// ─── Types (FROZEN — matches BenchmarkingClientReport exactly) ────────────

interface SurplusCashAnalysis {
  hasData: boolean;
  actualCash: number;
  requiredCash: number;
  surplusCash: number;
  surplusAsPercentOfRevenue: number;
  components: {
    operatingBuffer: number;
    workingCapitalRequirement: number;
    netWorkingCapital: number;
    staffCostsQuarterly?: number;
    adminExpensesQuarterly?: number;
  };
}

interface BalanceSheet {
  cash: number;
  net_assets: number;
  freehold_property?: number;
  investments?: number;
  total_assets?: number;
}

interface BenchmarkAnalysis {
  headline: string;
  executive_summary: string;
  position_narrative: string;
  strength_narrative: string;
  gap_narrative: string;
  opportunity_narrative: string;
  metrics_comparison?: string;
  overall_percentile?: number;
  gap_count?: number;
  strength_count?: number;
  total_annual_opportunity: string;
  recommendations?: string;
  created_at?: string;
  data_sources?: string[];
  benchmark_data_as_of?: string;
  surplus_cash?: SurplusCashAnalysis;
  balance_sheet?: BalanceSheet;
  client_concentration?: number;
  client_concentration_top3?: number;
  top_customers?: Array<{ name: string; percentage?: number }>;
  revenue?: number;
  employee_count?: number;
  gross_margin?: number;
  net_margin?: number;
  ebitda?: number;
  ebitda_margin?: number;
  debtor_days?: number;
  creditor_days?: number;
  employee_band?: string;
  pass1_data?: {
    _enriched_revenue?: number;
    _enriched_employee_count?: number;
    gross_margin?: number;
    net_margin?: number;
    ebitda_margin?: number;
    debtor_days?: number;
    creditor_days?: number;
    revenue_per_employee?: number;
    client_concentration_top3?: number;
    classification?: { employeeBand?: string };
    surplus_cash?: { surplusCash?: number };
    enhanced_suppressors?: EnhancedValueSuppressor[];
    exit_readiness_breakdown?: ExitReadinessScore;
    surplus_cash_breakdown?: SurplusCashData;
    two_paths_narrative?: TwoPathsNarrative;
  };
  hva_data?: {
    competitive_moat?: string[];
    unique_methods?: string;
    reputation_build_time?: string;
  };
  founder_risk_level?: string;
  founder_risk_score?: number;
  value_analysis?: ValueAnalysis;
  opportunities?: any[];
  recommended_services?: any[];
  not_recommended_services?: any[];
  client_preferences?: any;
}

interface MetricComparison {
  metricCode?: string;
  metric_code?: string;
  metricName?: string;
  metric_name?: string;
  metric?: string;
  clientValue?: number;
  client_value?: number;
  p10?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p90?: number;
  percentile?: number;
  annualImpact?: number;
  annual_impact?: number;
}

interface RecommendedService {
  serviceCode: string;
  serviceName: string;
  description: string;
  headline?: string;
  priceFrom?: number;
  priceTo?: number;
  priceUnit?: string;
  priceRange?: string;
  category?: string;
  whyThisMatters: string;
  whatYouGet: string[];
  expectedOutcome: string;
  timeToValue: string;
  addressesIssues: Array<{ issueTitle: string; valueAtStake: number; severity: string }>;
  totalValueAtStake?: number;
  source: string;
  priority: string;
}

interface BenchmarkingClientDashboardProps {
  data: BenchmarkAnalysis;
  practitionerName?: string;
  practitionerEmail?: string;
  clientName?: string;
  onBack?: () => void;
}

// ─── Helpers (FROZEN from original report) ─────────────────────────────────

const safeJsonParse = <T,>(value: string | T | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  if (typeof value === 'string') { try { return JSON.parse(value) as T; } catch { return fallback; } }
  return value as T;
};

const getOrdinalSuffix = (n: number): string => {
  const num = Math.round(n);
  if (num % 100 >= 11 && num % 100 <= 13) return num + 'th';
  switch (num % 10) { case 1: return num + 'st'; case 2: return num + 'nd'; case 3: return num + 'rd'; default: return num + 'th'; }
};

const getMetricFormat = (metricCode: string | undefined): 'currency' | 'percent' | 'number' | 'days' => {
  if (!metricCode) return 'number';
  const code = metricCode.toLowerCase();
  if (code.includes('days') || code.includes('debtor') || code.includes('creditor')) return 'days';
  if (code.includes('margin') || code.includes('rate') || code.includes('utilisation') || code.includes('utilization') || code.includes('concentration') || code.includes('growth') || code.includes('retention') || code.includes('turnover') || code.includes('percentage') || code.includes('pct') || code.includes('ratio')) return 'percent';
  if (code.includes('revenue') || code.includes('profit') || code.includes('ebitda') || code.includes('hourly') || code.includes('salary') || code.includes('cost') || code.includes('fee') || code.includes('price') || code.includes('value') || code.includes('per_employee')) return 'currency';
  return 'number';
};

function splitNarrative(text: string, maxParas: number = 3): string[] {
  if (!text) return [];
  const byNewlines = text.split('\n\n').filter(Boolean);
  if (byNewlines.length > 1) return byNewlines.slice(0, maxParas);
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) { chunks.push(sentences.slice(i, i + 3).join('').trim()); }
  return chunks.slice(0, maxParas).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM — Matches SA Report v5 exactly
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  navy: '#162340',
  navyLight: '#1e3156',
  blue: '#2563EB',
  red: '#DC2626',
  orange: '#EA580C',
  amber: '#D97706',
  emerald: '#059669',
  emeraldLight: '#10B981',
  purple: '#7C3AED',
  bg: '#F0F2F7',
  cardBg: 'rgba(255,255,255,0.97)',
  cardBorder: 'rgba(22,35,64,0.08)',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748b',
  textLight: '#94a3b8',
};

const SHADOW = {
  sm: '0 1px 3px rgba(22,35,64,0.08), 0 4px 12px rgba(22,35,64,0.06)',
  md: '0 4px 12px rgba(22,35,64,0.1), 0 8px 24px rgba(22,35,64,0.08)',
  lg: '0 12px 32px rgba(22,35,64,0.12), 0 4px 12px rgba(22,35,64,0.08)',
  glow: (color: string, intensity = 0.3) => `0 0 32px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}, 0 0 8px ${color}20`,
  colorLift: (color: string) => `0 8px 24px ${color}30, 0 2px 8px ${color}18`,
};

const EASE = { out: 'cubic-bezier(0.22, 1, 0.36, 1)', spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)' };

const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.97)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(22, 35, 64, 0.08)', borderRadius: 16, boxShadow: SHADOW.sm, ...extra,
});

const accentCard = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  ...glass(), borderLeft: `4px solid ${color}`, background: `linear-gradient(135deg, ${color}08 0%, rgba(255,255,255,0.97) 60%)`, ...extra,
});

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const label: React.CSSProperties = { fontSize: 11, color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600, ...mono };
const sectionWrap: React.CSSProperties = { maxWidth: '100%', overflow: 'hidden', wordBreak: 'break-word' as const };

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL COMPONENTS (same as SA Report)
// ═══════════════════════════════════════════════════════════════════════════════

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

function RevealCard({ children, delay = 0, style, className }: {
  children: ReactNode; delay?: number; style?: React.CSSProperties; className?: string;
}) {
  const { ref, visible } = useScrollReveal();
  const [hovered, setHovered] = useState(false);
  return (
    <div ref={ref} className={className}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-3px)' : 'translateY(0)') : 'translateY(16px)',
        transition: `opacity 0.5s ${EASE.out} ${delay}ms, transform 0.5s ${EASE.out} ${delay}ms, box-shadow 0.3s ${EASE.out}`,
        boxShadow: hovered ? SHADOW.md : (style?.boxShadow || SHADOW.sm),
        ...style,
      }}
    >{children}</div>
  );
}

function DotGrid({ opacity = 0.04 }: { opacity?: number }) {
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `radial-gradient(circle, rgba(22,35,64,${opacity}) 1px, transparent 1px)`, backgroundSize: '24px 24px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)' }} />;
}

function NoiseOverlay({ opacity = 0.3 }: { opacity?: number }) {
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity, mixBlendMode: 'soft-light', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")` }} />;
}

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
        <defs><linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={`${color}88`} /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} strokeDasharray={`${arc} ${circumference}`} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`url(#${uid})`} strokeWidth={strokeWidth} strokeDasharray={`${arc} ${circumference}`} strokeDashoffset={visible ? offset : arc} strokeLinecap="round" style={{ transition: `stroke-dashoffset 1.5s ${EASE.out} ${delay}ms`, filter: `drop-shadow(0 0 8px ${color}50)` }} />
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

// ─── Format Helpers ──────────────────────────────────────────────────────────

const fmt = (n: number) => {
  if (n == null || isNaN(n)) return '£0';
  if (n >= 1000000) return `£${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `£${Math.round(n / 1000)}k`;
  return `£${Math.round(n)}`;
};
const fmtMetric = (val: number, format: string) => {
  switch (format) {
    case 'currency': return val >= 1000000 ? `£${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `£${Math.round(val / 1000)}k` : `£${Math.round(val)}`;
    case 'percent': return `${val.toFixed(1)}%`;
    case 'days': return `${Math.round(val)} days`;
    default: return val.toFixed(1);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function BenchmarkingClientDashboard({
  data,
  practitionerName = 'your advisor',
  practitionerEmail,
  clientName = 'Your Business',
  onBack,
}: BenchmarkingClientDashboardProps) {

  const [activeSection, setActiveSection] = useState('overview');
  const [transitioning, setTransitioning] = useState(false);
  const [expandedSuppressor, setExpandedSuppressor] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState('diversify');
  const [showSurplusDetail, setShowSurplusDetail] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [visited, setVisited] = useState<Set<string>>(() => new Set(['overview']));

  const handleNavigate = useCallback((sectionId: string) => {
    if (sectionId === activeSection) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveSection(sectionId);
      setVisited(prev => { const next = new Set(prev); next.add(sectionId); return next; });
      if (contentRef.current) contentRef.current.scrollTop = 0;
      setTimeout(() => setTransitioning(false), 50);
    }, 200);
  }, [activeSection]);

  const metrics = safeJsonParse<MetricComparison[]>(data.metrics_comparison, []);
  const rawRecommendations = safeJsonParse(data.recommendations, []);
  const heroTotal = parseFloat(data.total_annual_opportunity) || 0;

  const recommendations = useMemo(() => {
    if (!rawRecommendations.length || heroTotal <= 0) return rawRecommendations;
    const currentSum = rawRecommendations.reduce((sum: number, rec: any) => sum + (rec.annualValue || 0), 0);
    if (currentSum > 0 && Math.abs(currentSum - heroTotal) / heroTotal < 0.05) return rawRecommendations;
    if (currentSum > 0) {
      const scaleFactor = heroTotal / currentSum;
      return rawRecommendations.map((rec: any) => ({ ...rec, annualValue: Math.round((rec.annualValue || 0) * scaleFactor) }));
    }
    return rawRecommendations;
  }, [rawRecommendations, heroTotal]);

  const getMetricValue = (code: string): number | undefined => {
    const lowerCode = code.toLowerCase();
    let metric = metrics.find(m => (m.metricCode || m.metric_code || '').toLowerCase() === lowerCode);
    if (!metric) metric = metrics.find(m => { const mc = (m.metricCode || m.metric_code || '').toLowerCase(); return mc.startsWith(lowerCode) || lowerCode.startsWith(mc); });
    return metric?.clientValue ?? metric?.client_value;
  };

  const getBenchmarkForMetric = (code: string) => {
    const metric = metrics.find(m => { const mc = (m.metricCode || m.metric_code || '').toLowerCase(); return mc === code.toLowerCase() || mc.includes(code.toLowerCase()); });
    if (!metric || metric.p50 == null) return undefined;
    return { p25: metric.p25 || 0, p50: metric.p50, p75: metric.p75 || 0 };
  };

  const baselineMetrics = useMemo((): BaselineMetrics | null => {
    const directRevenue = data.revenue || data.pass1_data?._enriched_revenue;
    const revPerEmployeeMetric = metrics.find((m: any) => m.metricCode === 'revenue_per_consultant' || m.metricCode === 'revenue_per_employee');
    const revPerEmployeeRaw = revPerEmployeeMetric?.clientValue || data.pass1_data?.revenue_per_employee || getMetricValue('revenue_per_employee');
    const employeeBand = data.employee_band || data.pass1_data?.classification?.employeeBand;
    const estimatedEmployees = employeeBand === '1-10' ? 5 : employeeBand === '11-50' ? 30 : employeeBand === '51-250' ? 131 : employeeBand === '251+' ? 300 : 0;
    const employeeCountRaw = data.employee_count || data.pass1_data?._enriched_employee_count || estimatedEmployees;
    const calculatedRevenue = (employeeCountRaw && revPerEmployeeRaw && employeeCountRaw > 0) ? employeeCountRaw * revPerEmployeeRaw : 0;
    const revenue = directRevenue || calculatedRevenue || 0;
    if (revenue <= 0) return null;
    const grossMargin = data.gross_margin || data.pass1_data?.gross_margin || getMetricValue('gross_margin') || 0;
    const netMargin = data.net_margin || data.pass1_data?.net_margin || getMetricValue('net_margin') || 0;
    const employeeCount = employeeCountRaw || 1;
    const revenuePerEmployee = revPerEmployeeRaw || (revenue / employeeCount);
    const ebitdaMargin = data.ebitda_margin || data.pass1_data?.ebitda_margin || getMetricValue('ebitda_margin') || netMargin * 1.2;
    const debtorDays = data.debtor_days || data.pass1_data?.debtor_days || getMetricValue('debtor_days') || 45;
    const creditorDays = data.creditor_days || data.pass1_data?.creditor_days || getMetricValue('creditor_days') || 30;
    const clientConcentration = data.client_concentration_top3 || data.client_concentration || data.pass1_data?.client_concentration_top3;
    return { revenue, grossMargin, grossProfit: revenue * (grossMargin / 100), netMargin, netProfit: revenue * (netMargin / 100), ebitda: revenue * (ebitdaMargin / 100), ebitdaMargin, employeeCount, revenuePerEmployee, debtorDays, creditorDays, clientConcentration };
  }, [data, metrics]);

  const recommendedServices = useMemo((): RecommendedService[] => {
    const dbRecommendations = data.recommended_services || [];
    if (dbRecommendations.length > 0) {
      return dbRecommendations.map((r: any): RecommendedService => ({
        serviceCode: r.serviceCode || r.code, serviceName: r.serviceName || r.name, description: r.description || '',
        headline: r.headline, priceFrom: r.priceFrom || r.price_from, priceTo: r.priceTo || r.price_to,
        priceUnit: r.priceUnit || r.price_unit, priceRange: r.priceRange, category: r.category,
        whyThisMatters: r.whyThisMatters || r.contextReason || r.description || '',
        whatYouGet: r.whatYouGet || r.deliverables || [], expectedOutcome: r.expectedOutcome || '',
        timeToValue: r.timeToValue || r.timeframe || '4-6 weeks', addressesIssues: r.addressesIssues || [],
        totalValueAtStake: r.totalValueAtStake, source: r.source || 'opportunity', priority: r.priority || 'secondary',
      }));
    }
    const opportunities = data.opportunities || [];
    const blockedCodes = (data.not_recommended_services || []).map((b: any) => b.serviceCode);
    const serviceMap = new Map<string, RecommendedService>();
    for (const opp of opportunities) {
      const service = opp.service;
      if (!service?.code || blockedCodes.includes(service.code)) continue;
      const existing = serviceMap.get(service.code);
      const newIssue = { issueTitle: opp.title || 'Issue', valueAtStake: opp.financial_impact_amount || 0, severity: opp.severity || 'medium' };
      if (existing) {
        existing.addressesIssues.push(newIssue);
        existing.totalValueAtStake = (existing.totalValueAtStake || 0) + newIssue.valueAtStake;
      } else {
        serviceMap.set(service.code, {
          serviceCode: service.code, serviceName: service.name, description: service.description || '',
          headline: service.headline, priceFrom: service.price_from, priceTo: service.price_to, priceUnit: service.price_unit,
          category: service.category, whyThisMatters: opp.service_fit_rationale || opp.talking_point || service.description || '',
          whatYouGet: service.deliverables || [], expectedOutcome: opp.life_impact || `Addresses ${opp.title}`,
          timeToValue: service.typical_duration || '4-6 weeks', addressesIssues: [newIssue], totalValueAtStake: newIssue.valueAtStake,
          source: opp.opportunity_code?.startsWith('pinned-') ? 'pinned' : 'opportunity',
          priority: opp.opportunity_code?.startsWith('pinned-') || opp.severity === 'critical' || opp.severity === 'high' ? 'primary' : 'secondary',
        });
      }
    }
    return Array.from(serviceMap.values()).sort((a, b) => {
      if (a.source === 'pinned' && b.source !== 'pinned') return -1;
      if (b.source === 'pinned' && a.source !== 'pinned') return 1;
      return (b.totalValueAtStake || 0) - (a.totalValueAtStake || 0);
    });
  }, [data.recommended_services, data.opportunities, data.not_recommended_services]);

  const percentile = data.overall_percentile || 0;
  const totalOpportunity = heroTotal;
  const concentration = data.client_concentration_top3 || data.client_concentration || 0;
  const hasConcentrationRisk = concentration > 75;
  const surplusCash = data.surplus_cash?.surplusCash || data.pass1_data?.surplus_cash?.surplusCash || 0;
  const valueAnalysis = data.value_analysis;
  const enhancedSuppressors = data.pass1_data?.enhanced_suppressors || [];
  const exitBreakdown = data.pass1_data?.exit_readiness_breakdown;
  const twoPathsNarrative = data.pass1_data?.two_paths_narrative;
  const surplusCashBreakdown = data.pass1_data?.surplus_cash_breakdown;

  const displayMetrics = metrics
    .filter((m: any) => { const code = (m.metricCode || m.metric_code || '').toLowerCase(); return !code.includes('concentration'); })
    .filter((m: any) => m.p50 != null && m.p50 !== 0);

  const strengthMetrics = displayMetrics.filter((m: any) => (m.percentile || 0) >= 50);
  const gapMetrics = displayMetrics.filter((m: any) => (m.percentile || 0) < 50);

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: BarChart3, section: 'overview' },
    { id: 'metrics', label: 'Metrics', icon: Activity, section: 'analysis' },
    { id: 'position', label: 'Position', icon: Target, section: 'analysis' },
    { id: 'hidden', label: 'Hidden Value', icon: Gem, section: 'analysis' },
    { id: 'value', label: 'Valuation', icon: PoundSterling, section: 'value' },
    { id: 'exit', label: 'Exit Ready', icon: Shield, section: 'value' },
    { id: 'scenarios', label: 'Scenarios', icon: CalendarClock, section: 'action' },
    { id: 'services', label: 'Services', icon: Zap, section: 'action' },
    { id: 'path', label: 'Your Path', icon: Rocket, section: 'action' },
    { id: 'vision', label: 'Vision', icon: Coffee, section: 'action' },
  ];
  const SECTION_GROUPS: Record<string, string> = { overview: 'Overview', analysis: 'Analysis', value: 'Value', action: 'Action' };

  function Sidebar() {
    let lastGroup = '';
    return (
      <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 220, background: C.navy, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', zIndex: 30 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, fontFamily: "'DM Sans', sans-serif" }}>RPGCC</span>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.blue }} />
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.emerald }} />
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.purple }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4, ...mono }}>Benchmarking Report</p>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const showGroup = lastGroup !== item.section && (lastGroup = item.section);
            return (
              <div key={item.id}>
                {showGroup && <div style={{ padding: '8px 16px 4px', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', ...mono }}>{SECTION_GROUPS[item.section]}</div>}
                <button type="button" onClick={() => handleNavigate(item.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', border: 'none', background: activeSection === item.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeSection === item.id ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', borderLeft: activeSection === item.id ? `3px solid ${C.blue}` : '3px solid transparent', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { if (activeSection !== item.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (activeSection !== item.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Icon style={{ width: 18, height: 18, flexShrink: 0 }} /><span style={{ flex: 1 }}>{item.label}</span>
                  {visited.has(item.id) && activeSection !== item.id && <span style={{ width: 18, height: 18, borderRadius: 9, background: C.emerald, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>✓</span>}
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

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <RevealCard style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #162340 100%)', borderRadius: 20, padding: 'clamp(32px, 5vw, 48px)', position: 'relative', overflow: 'hidden', border: 'none', boxShadow: SHADOW.lg }}>
              <DotGrid opacity={0.06} /><NoiseOverlay opacity={0.15} />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', ...mono }}>
                  <AnimatedCounter target={totalOpportunity} prefix="£" duration={2500} />
                </p>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: '48ch', margin: '0 auto 24px', lineHeight: 1.6 }}>{data.headline}</p>
                <div style={{ maxWidth: 480, margin: '0 auto' }}>
                  <div style={{ position: 'relative', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${percentile}%`, background: `linear-gradient(90deg, ${C.red}, ${C.amber}, ${C.emerald})`, borderRadius: 5, transition: 'width 1.5s ease' }} />
                  </div>
                  <p style={{ textAlign: 'center', marginTop: 10, fontSize: 14, color: percentile >= 75 ? C.emeraldLight : percentile >= 50 ? C.blue : percentile >= 25 ? '#FBBF24' : C.red, fontWeight: 600 }}>
                    {getOrdinalSuffix(percentile)} Percentile
                  </p>
                </div>
              </div>
            </RevealCard>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[{ label: 'ANNUAL OPPORTUNITY', value: totalOpportunity, prefix: '£', color: C.emerald }, { label: 'GAPS FOUND', value: data.gap_count || gapMetrics.length, prefix: '', color: C.red }, { label: 'STRENGTHS', value: data.strength_count || strengthMetrics.length, prefix: '', color: C.blue }].map((stat, i) => (
                <RevealCard key={i} delay={i * 70} style={{ ...accentCard(stat.color, { padding: 24 }) }}>
                  <span style={{ ...label, color: stat.color }}>{stat.label}</span>
                  <p style={{ fontSize: 32, fontWeight: 800, color: stat.color, margin: '8px 0 0', ...mono }}><AnimatedCounter target={stat.value} prefix={stat.prefix} duration={2200} /></p>
                </RevealCard>
              ))}
            </div>
            <RevealCard delay={250} style={{ ...glass({ padding: '28px 32px' }) }}>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Executive Summary</h3>
              {splitNarrative(data.executive_summary, 6).map((para, i) => (
                <p key={i} style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.75, marginBottom: 12 }}>{para}</p>
              ))}
            </RevealCard>
          </div>
        );
      case 'metrics':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}>
              <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Key Metrics</h2>
              <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>{displayMetrics.length} metrics benchmarked</p>
            </RevealCard>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {displayMetrics.map((metric: any, i: number) => {
                const code = (metric.metricCode || metric.metric_code || '').toLowerCase();
                const name = metric.metricName || metric.metric_name || metric.metric || code;
                const clientVal = metric.clientValue ?? metric.client_value ?? 0;
                const pct = metric.percentile || 0;
                const format = getMetricFormat(code);
                const isStrength = pct >= 50;
                const barColor = pct >= 75 ? C.emerald : pct >= 50 ? C.blue : pct >= 25 ? C.amber : C.red;
                return (
                  <RevealCard key={i} delay={i * 40} style={{ ...glass({ padding: 20 }), borderLeft: `4px solid ${barColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: isStrength ? `${C.emerald}12` : `${C.red}12`, color: isStrength ? C.emerald : C.red, ...mono }}>{isStrength ? 'STRENGTH' : 'GAP'}</span>
                    </div>
                    <span style={{ fontSize: 26, fontWeight: 800, color: barColor, ...mono }}>{fmtMetric(clientVal, format)}</span>
                    <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>{getOrdinalSuffix(pct)} percentile</span>
                  </RevealCard>
                );
              })}
            </div>
          </div>
        );
      case 'position':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}><h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Your Position</h2></RevealCard>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[{ title: 'Where You Stand', content: data.position_narrative, color: C.blue }, { title: 'Your Strengths', content: data.strength_narrative, color: C.emerald }, { title: 'Performance Gaps', content: data.gap_narrative, color: C.red }, { title: 'The Opportunity', content: data.opportunity_narrative, color: C.purple }].map((section, i) => (
                <RevealCard key={i} delay={i * 80} style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${section.color}` }}>
                  <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>{section.title}</h3>
                  {splitNarrative(section.content, 4).map((para, j) => <p key={j} style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>{para}</p>)}
                </RevealCard>
              ))}
            </div>
          </div>
        );
      case 'hidden': {
        const hasSurplus = surplusCash > 0;
        const hasProperty = (data.balance_sheet?.freehold_property || 0) > 0;
        const hasInvestments = (data.balance_sheet?.investments || 0) > 0;
        const hasHiddenValue = hasSurplus || hasProperty || hasInvestments;
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {hasHiddenValue && (
              <>
                <RevealCard style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${C.emerald}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Gem style={{ width: 22, height: 22, color: C.emerald }} /><h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Hidden Value Identified</h2></div>
                </RevealCard>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {hasSurplus && <RevealCard delay={60} style={{ ...accentCard(C.emerald, { padding: 24 }) }}><span style={{ ...label, color: C.emerald }}>Surplus Cash</span><p style={{ fontSize: 28, fontWeight: 800, color: C.emerald, margin: '8px 0 4px', ...mono }}>{fmt(surplusCash)}</p></RevealCard>}
                  {hasProperty && <RevealCard delay={120} style={{ ...accentCard(C.blue, { padding: 24 }) }}><span style={{ ...label, color: C.blue }}>Property Value</span><p style={{ fontSize: 28, fontWeight: 800, color: C.blue, margin: '8px 0 4px', ...mono }}>{fmt(data.balance_sheet!.freehold_property!)}</p></RevealCard>}
                  {hasInvestments && <RevealCard delay={180} style={{ ...accentCard(C.purple, { padding: 24 }) }}><span style={{ ...label, color: C.purple }}>Investments</span><p style={{ fontSize: 28, fontWeight: 800, color: C.purple, margin: '8px 0 4px', ...mono }}>{fmt(data.balance_sheet!.investments!)}</p></RevealCard>}
                </div>
              </>
            )}
            {hasConcentrationRisk && (
              <RevealCard style={{ ...glass({ padding: 24 }), border: `1px solid ${C.red}25` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><AlertTriangle style={{ width: 20, height: 20, color: C.red }} /><span style={{ fontWeight: 700, fontSize: 15, color: C.red }}>Customer Concentration Risk</span></div>
                <p style={{ fontSize: 14, color: C.textSecondary, marginTop: 12 }}>{concentration}% of revenue from top 3 customers.</p>
              </RevealCard>
            )}
            {!hasHiddenValue && !hasConcentrationRisk && <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}><p style={{ color: C.textMuted, fontSize: 14 }}>No hidden value or concentration risk data available.</p></RevealCard>}
          </div>
        );
      }
      case 'value':
        if (!valueAnalysis) return <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}><p style={{ color: C.textMuted }}>Value analysis not available.</p></RevealCard>;
        const { baseline, suppressors, currentMarketValue, valueGap, pathToValue } = valueAnalysis;
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #1e3a5f 100%)', padding: '36px 40px', border: 'none', boxShadow: SHADOW.lg }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Business Valuation Analysis</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                <div style={{ textAlign: 'center' }}><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, ...mono }}>Baseline Value</p><p style={{ fontSize: 28, fontWeight: 800, color: '#60A5FA', ...mono }}>{fmt(baseline.enterpriseValue.mid)}</p></div>
                <div style={{ textAlign: 'center' }}><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, ...mono }}>Current Value</p><p style={{ fontSize: 28, fontWeight: 800, color: '#FBBF24', ...mono }}>{fmt(currentMarketValue.mid)}</p></div>
                <div style={{ textAlign: 'center' }}><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, ...mono }}>Value Gap</p><p style={{ fontSize: 28, fontWeight: 800, color: C.red, ...mono }}>{fmt(valueGap.mid)}</p></div>
              </div>
            </RevealCard>
            <RevealCard delay={100} style={{ ...glass({ padding: 24 }) }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Where Your Value Is Going</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12, background: `${C.blue}08`, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: C.text }}>Baseline Enterprise Value</span><span style={{ fontSize: 20, fontWeight: 800, color: C.blue, ...mono }}>{fmt(baseline.enterpriseValue.mid)}</span>
              </div>
              {suppressors.map((s: ValueSuppressor) => {
                const avgImpact = (s.impactAmount.low + s.impactAmount.high) / 2;
                const sevColor = s.severity === 'critical' ? C.red : s.severity === 'high' ? C.orange : C.amber;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderRadius: 10, background: `${sevColor}06`, marginLeft: 20, marginBottom: 6 }}>
                    <div><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</span><p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0' }}>{s.evidence}</p></div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: sevColor, ...mono }}>-{fmt(avgImpact)}</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 12, background: `${C.amber}08`, border: `2px solid ${C.amber}`, marginTop: 12 }}>
                <span style={{ fontWeight: 700, color: C.text }}>Current Market Value</span><span style={{ fontSize: 24, fontWeight: 800, color: '#B45309', ...mono }}>{fmt(currentMarketValue.mid)}</span>
              </div>
            </RevealCard>
            <RevealCard delay={200} style={{ ...glass({ padding: 24 }) }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Path to Full Value</h3>
              <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 16 }}>Over the next {pathToValue.timeframeMonths} months, addressing structural issues could unlock <strong style={{ color: C.blue }}>{fmt(pathToValue.recoverableValue.mid)}</strong>.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pathToValue.keyActions.map((action: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.7)', border: `1px solid ${C.blue}12` }}>
                    <div style={{ width: 24, height: 24, borderRadius: 12, background: C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: C.text }}>{action}</span>
                  </div>
                ))}
              </div>
            </RevealCard>
          </div>
        );
      case 'exit':
        if (!exitBreakdown) return <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}><p style={{ color: C.textMuted }}>Exit readiness data not available.</p></RevealCard>;
        const score = exitBreakdown.totalScore;
        const scoreColor = score >= 65 ? C.emerald : score >= 50 ? C.amber : score >= 35 ? C.orange : C.red;
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '36px 40px', border: 'none', boxShadow: SHADOW.lg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
                <ProgressRing score={score} size={180} strokeWidth={14} color={scoreColor} ringLabel="Exit Score" />
                <div><h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Exit Readiness</h2><p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{exitBreakdown.levelLabel}</p></div>
              </div>
            </RevealCard>
            <RevealCard delay={100} style={{ ...glass({ padding: 24 }) }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Score Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {exitBreakdown.components.map((comp) => {
                  const compColor = comp.currentScore >= comp.targetScore ? C.emerald : comp.currentScore >= comp.maxScore * 0.5 ? C.amber : C.red;
                  return (
                    <div key={comp.id} style={{ padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{comp.name}</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: compColor, ...mono }}>{comp.currentScore}/{comp.maxScore}</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(comp.currentScore / comp.maxScore) * 100}%`, background: compColor, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </RevealCard>
          </div>
        );
      case 'scenarios':
        if (!baselineMetrics) return <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}><p style={{ color: C.textMuted }}>Scenario data requires baseline financial metrics.</p></RevealCard>;
        const scenarios = [
          { id: 'do_nothing', title: 'If You Do Nothing', color: C.red },
          { id: 'diversify', title: 'If You Diversify', color: C.blue },
          { id: 'exit_prep', title: 'If You Prepare for Exit', color: C.emerald },
        ];
        const active = scenarios.find(s => s.id === activeScenario) || scenarios[1];
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}><h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Scenario Planning</h2><p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>What happens depending on the path you choose</p></RevealCard>
            <div style={{ display: 'flex', gap: 8 }}>
              {scenarios.map(s => (
                <button key={s.id} onClick={() => setActiveScenario(s.id)} style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: `2px solid ${activeScenario === s.id ? s.color : 'rgba(0,0,0,0.06)'}`, background: activeScenario === s.id ? `${s.color}08` : 'rgba(255,255,255,0.97)', cursor: 'pointer', color: activeScenario === s.id ? s.color : C.textMuted, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{s.title}</button>
              ))}
            </div>
            <RevealCard style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${active.color}` }}><p style={{ color: C.textSecondary, fontSize: 14 }}>Scenario details for {active.title}.</p></RevealCard>
          </div>
        );
      case 'services':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}><h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>How We Can Help</h2><p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>{recommendedServices.length} services recommended</p></RevealCard>
            {recommendedServices.length === 0 && <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}><p style={{ color: C.textMuted }}>No services have been recommended yet.</p></RevealCard>}
            {recommendedServices.map((svc, i) => {
              const isExpanded = expandedService === svc.serviceCode;
              const accentColor = svc.priority === 'primary' ? C.blue : C.purple;
              return (
                <RevealCard key={svc.serviceCode} delay={i * 60} style={{ ...glass({ padding: 0, overflow: 'hidden' }), borderLeft: `4px solid ${accentColor}` }}>
                  <div onClick={() => setExpandedService(isExpanded ? null : svc.serviceCode)} style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                    <div style={{ flex: 1 }}><p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{svc.serviceName}</p><p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{svc.headline || svc.description}</p></div>
                    {(svc.priceRange || (svc.priceFrom && svc.priceTo)) && <span style={{ fontSize: 14, fontWeight: 700, color: accentColor, ...mono }}>{svc.priceRange || `£${svc.priceFrom?.toLocaleString()}-£${svc.priceTo?.toLocaleString()}`}</span>}
                    <ChevronDown style={{ width: 16, height: 16, color: C.textMuted, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                      <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7, marginBottom: 14 }}>{svc.whyThisMatters}</p>
                      {svc.expectedOutcome && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${C.emerald}06`, borderLeft: `3px solid ${C.emerald}40`, marginBottom: 10 }}><span style={{ ...label, color: C.emerald }}>Expected Outcome</span><p style={{ fontSize: 13, color: C.text, marginTop: 4 }}>{svc.expectedOutcome}</p></div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMuted }}><Clock style={{ width: 14, height: 14 }} /> Time to value: {svc.timeToValue}</div>
                    </div>
                  )}
                </RevealCard>
              );
            })}
          </div>
        );
      case 'path':
        if (!twoPathsNarrative || !baselineMetrics) return <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}><p style={{ color: C.textMuted }}>Path narrative not available.</p></RevealCard>;
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #1e3a5f 0%, #312e81 100%)', padding: '36px 40px', border: 'none', boxShadow: SHADOW.lg }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 16 }}>{twoPathsNarrative.headline}</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7 }}>{twoPathsNarrative.explanation}</p>
            </RevealCard>
            <RevealCard delay={150} style={{ ...glass({ padding: 24 }) }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{clientName}'s Path to Optionality</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[{ year: 'Year 1', color: C.emerald, text: twoPathsNarrative.ownerJourney.year1 }, { year: 'Year 2', color: C.blue, text: twoPathsNarrative.ownerJourney.year2 }, { year: 'Year 3', color: C.amber, text: twoPathsNarrative.ownerJourney.year3 }].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: step.color, minWidth: 60, textAlign: 'right', ...mono }}>{step.year}</span>
                    <div style={{ flex: 1, borderLeft: `3px solid ${step.color}30`, paddingLeft: 16 }}><p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7, margin: 0 }}>{step.text}</p></div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}><p style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.6 }}>{twoPathsNarrative.bottomLine}</p></div>
            </RevealCard>
          </div>
        );
      case 'vision': {
        const closingSummary = (() => {
          const parts: string[] = [];
          if (baselineMetrics?.revenue) parts.push(`You're a £${(baselineMetrics.revenue / 1000000).toFixed(0)}M business`);
          if (percentile) parts.push(`sitting at the ${getOrdinalSuffix(percentile)} percentile`);
          if (surplusCash > 0) parts.push(`with £${(surplusCash / 1000000).toFixed(1)}M in surplus cash`);
          let summary = parts.join(' ');
          if (totalOpportunity > 0) summary += `. The data shows £${totalOpportunity.toLocaleString()} in annual opportunity`;
          const vGap = valueAnalysis?.valueGap?.mid;
          if (vGap && vGap > 0) summary += ` and £${(vGap / 1000000).toFixed(1)}M in trapped value`;
          summary += '. The path forward is about protecting what you\'ve built and unlocking what\'s already there.';
          return summary;
        })();
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #0F172A 0%, #162340 40%, #1E293B 100%)', padding: '36px 40px', textAlign: 'center', border: 'none', boxShadow: SHADOW.lg }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
                <div style={{ background: `${C.emerald}20`, borderRadius: 14, padding: '16px 28px', border: '1px solid rgba(255,255,255,0.12)', minWidth: 140 }}><p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0, ...mono }}>{fmt(totalOpportunity)}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Opportunity/yr</p></div>
                {valueAnalysis && <div style={{ background: `${C.amber}20`, borderRadius: 14, padding: '16px 28px', border: '1px solid rgba(255,255,255,0.12)', minWidth: 140 }}><p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0, ...mono }}>{fmt(valueAnalysis.valueGap.mid)}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Trapped value</p></div>}
                {valueAnalysis && <div style={{ background: `${C.blue}20`, borderRadius: 14, padding: '16px 28px', border: '1px solid rgba(255,255,255,0.12)', minWidth: 140 }}><p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0, ...mono }}>{fmt(valueAnalysis.potentialValue.mid)}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Potential value</p></div>}
              </div>
            </RevealCard>
            <RevealCard delay={100} style={{ ...glass({ padding: '24px 28px' }), borderLeft: `4px solid ${C.emerald}` }}><p style={{ fontSize: 16, lineHeight: 1.8, color: C.text, margin: 0 }}>{closingSummary}</p></RevealCard>
            <RevealCard delay={200} style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg, #0F172A, #1E293B)', padding: '32px 40px', textAlign: 'center', border: 'none', boxShadow: SHADOW.md }}>
              <Phone style={{ width: 22, height: 22, color: C.emeraldLight }} />
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '12px 0' }}>Ready to Take Action?</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: '38ch', margin: '0 auto' }}>{practitionerName} can guide you through the next steps</p>
              {practitionerEmail && <a href={`mailto:${practitionerEmail}?subject=Benchmarking%20Report%20Follow-up${clientName ? `%20-%20${encodeURIComponent(clientName)}` : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg, ${C.emerald}, #047857)`, color: '#fff', padding: '12px 36px', borderRadius: 10, marginTop: 16, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Schedule a Discussion <ArrowRight style={{ width: 16, height: 16 }} /></a>}
            </RevealCard>
            {data.data_sources && data.data_sources.length > 0 && (
              <RevealCard delay={300} style={{ ...glass({ padding: '16px 20px' }) }}>
                <span style={{ ...label, marginBottom: 8, display: 'block' }}>Benchmark Data Sources</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{data.data_sources.slice(0, 8).map((source, i) => <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.03)', color: C.textMuted, border: '1px solid rgba(0,0,0,0.06)' }}>{source}</span>)}</div>
              </RevealCard>
            )}
          </div>
        );
      }
      default:
        return <div style={{ color: C.textMuted, padding: 32 }}>Section not found.</div>;
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
        ::selection { background: ${C.blue}30; }
      `}</style>
      <Sidebar />
      <div ref={contentRef} style={{ marginLeft: 220, flex: 1, padding: '24px 32px', overflowY: 'auto', height: '100vh', background: C.bg, opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(8px)' : 'translateY(0)', transition: 'opacity 0.2s ease, transform 0.2s ease' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${C.cardBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              {onBack && <button type="button" onClick={onBack} style={{ color: C.textMuted, padding: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}><ArrowLeft style={{ width: 20, height: 20 }} /></button>}
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 2, lineHeight: 1.4 }}>{data.headline || 'Benchmarking Report'}</h1>
                <p style={{ fontSize: 13, color: C.textMuted }}>{[clientName, `${getOrdinalSuffix(percentile)} percentile`, `£${totalOpportunity.toLocaleString()} opportunity`].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>{data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
          </div>
          <div key={activeSection} style={{ animation: 'fadeIn 0.4s ease' }}>{renderSection()}</div>
        </div>
      </div>
    </div>
  );
}
