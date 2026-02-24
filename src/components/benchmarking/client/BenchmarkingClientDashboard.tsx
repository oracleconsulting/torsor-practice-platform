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

import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import {
  ArrowLeft, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Zap, BarChart3, Target, ChevronDown, ChevronUp,
  Quote, DollarSign, ArrowRight, Sparkles, Brain, Phone,
  Clock, Users, Building2, Shield, Activity, Eye,
  CalendarClock, PoundSterling, Coffee, Gem,
  ChevronRight, ExternalLink, Layers,
  Rocket, Star, Wallet, Info, Lightbulb,
  X, Check
} from 'lucide-react';
import type { ValueAnalysis, ValueSuppressor, ValueEnhancer } from '../../types/benchmarking';
import type { BaselineMetrics } from '../../lib/scenario-calculator';
import type {
  EnhancedValueSuppressor,
  ExitReadinessScore,
  TwoPathsNarrative,
  SurplusCashData
} from '../../types/opportunity-calculations';

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
const sectionWrap: React.CSSProperties = { maxWidth: '100%', wordBreak: 'break-word' as const, minHeight: 'calc(100vh - 160px)', paddingBottom: 40 };

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
const fmtFull = (n: number) => `£${Math.round(n).toLocaleString()}`;
const fmtMetric = (val: number, format: string) => {
  switch (format) {
    case 'currency': return val >= 1000000 ? `£${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `£${Math.round(val / 1000)}k` : `£${Math.round(val)}`;
    case 'percent': return `${val.toFixed(1)}%`;
    case 'days': return `${Math.round(val)} days`;
    default: return val.toFixed(1);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

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

  // ─── Persistent visited sections ─────────────────────────────────────────
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

  // ─── Data Resolution (FROZEN from original — identical logic) ─────────

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

  // Baseline metrics (FROZEN)
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

  // Service recommendations (FROZEN)
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

  // Derived values
  const percentile = data.overall_percentile || 0;
  const totalOpportunity = heroTotal;
  const concentration = data.client_concentration_top3 || data.client_concentration || 0;
  const hasConcentrationRisk = concentration > 75;
  const surplusCash = data.surplus_cash?.surplusCash || data.pass1_data?.surplus_cash?.surplusCash || 0;
  const valueAnalysis = data.value_analysis;
  const enhancedSuppressors = data.pass1_data?.enhanced_suppressors || [];
  const exitBreakdown = data.pass1_data?.exit_readiness_breakdown;
  const twoPathsNarrative = data.pass1_data?.two_paths_narrative || 
    safeJsonParse<any>(data.pass1_data as any, {})?.two_paths_narrative || null;
  const surplusCashBreakdown = data.pass1_data?.surplus_cash_breakdown;

  // Filtered metrics (no concentration, must have valid p50)
  const displayMetrics = metrics
    .filter((m: any) => { const code = (m.metricCode || m.metric_code || '').toLowerCase(); return !code.includes('concentration'); })
    .filter((m: any) => m.p50 != null && m.p50 !== 0);

  const strengthMetrics = displayMetrics.filter((m: any) => (m.percentile || 0) >= 50);
  const gapMetrics = displayMetrics.filter((m: any) => (m.percentile || 0) < 50);

  // ─── Navigation Config ─────────────────────────────────────────────────

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

  // ─── Sidebar ─────────────────────────────────────────────────────────────

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

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION RENDERERS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderSection = () => {
    switch (activeSection) {

      // ─── OVERVIEW ────────────────────────────────────────────────────────
      case 'overview':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Cinematic hero */}
            <RevealCard style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #162340 100%)', borderRadius: 20, padding: 'clamp(32px, 5vw, 48px)', position: 'relative', overflow: 'hidden', border: 'none', boxShadow: SHADOW.lg }}>
              <DotGrid opacity={0.06} /><NoiseOverlay opacity={0.15} />
              <div style={{ position: 'absolute', top: '-20%', right: '10%', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${C.blue}15 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                  <BarChart3 style={{ width: 14, height: 14, color: C.emeraldLight }} />
                  <span style={{ fontSize: 11, letterSpacing: '0.12em', color: C.emeraldLight, textTransform: 'uppercase', fontWeight: 600, ...mono }}>Annual Opportunity Identified</span>
                </div>
                <p style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', ...mono, fontVariantNumeric: 'tabular-nums' }}>
                  <AnimatedCounter target={totalOpportunity} prefix="£" duration={2500} />
                </p>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: '48ch', margin: '0 auto 24px', lineHeight: 1.6 }}>{data.headline}</p>
                {/* Percentile gauge */}
                <div style={{ maxWidth: 480, margin: '0 auto' }}>
                  <div style={{ position: 'relative', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                      <div style={{ width: '25%', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
                      <div style={{ width: '25%', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
                      <div style={{ width: '25%', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
                      <div style={{ width: '25%' }} />
                    </div>
                    <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${percentile}%`, background: `linear-gradient(90deg, ${C.red}, ${C.amber}, ${C.emerald})`, borderRadius: 5, transition: 'width 1.5s ease' }} />
                    <div style={{ position: 'absolute', top: '50%', left: `${percentile}%`, transform: 'translate(-50%, -50%)', width: 16, height: 16, borderRadius: 8, background: '#fff', border: '2px solid #0F172A', boxShadow: '0 0 12px rgba(255,255,255,0.4)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)', ...mono }}>
                    <span>0</span><span>25th</span><span>50th</span><span>75th</span><span>100</span>
                  </div>
                  <p style={{ textAlign: 'center', marginTop: 10, fontSize: 14, color: percentile >= 75 ? C.emeraldLight : percentile >= 50 ? C.blue : percentile >= 25 ? '#FBBF24' : C.red, fontWeight: 600 }}>
                    {getOrdinalSuffix(percentile)} Percentile · {percentile >= 75 ? 'Top Quartile' : percentile >= 50 ? 'Above Median' : percentile >= 25 ? 'Below Median' : 'Bottom Quartile'}
                  </p>
                </div>
              </div>
            </RevealCard>

            {/* Stat tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'ANNUAL OPPORTUNITY', value: totalOpportunity, prefix: '£', color: C.emerald },
                { label: 'GAPS FOUND', value: data.gap_count || gapMetrics.length, prefix: '', color: C.red },
                { label: 'STRENGTHS', value: data.strength_count || strengthMetrics.length, prefix: '', color: C.blue },
              ].map((stat, i) => (
                <RevealCard key={i} delay={i * 70} style={{ ...accentCard(stat.color, { padding: 24 }) }}>
                  <span style={{ ...label, color: stat.color }}>{stat.label}</span>
                  <p style={{ fontSize: 32, fontWeight: 800, color: stat.color, margin: '8px 0 0', ...mono, fontVariantNumeric: 'tabular-nums' }}>
                    <AnimatedCounter target={stat.value} prefix={stat.prefix} duration={2200} />
                  </p>
                </RevealCard>
              ))}
            </div>

            {/* Executive Summary */}
            <RevealCard delay={250} style={{ ...glass({ padding: '28px 32px' }) }}>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Executive Summary</h3>
              {splitNarrative(data.executive_summary, 6).map((para, i) => (
                <p key={i} style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.75, marginBottom: 12, overflowWrap: 'break-word' }}>{para}</p>
              ))}
            </RevealCard>
          </div>
        );

      // ─── METRICS ─────────────────────────────────────────────────────────
      case 'metrics':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ ...glass({ padding: 24 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Key Metrics</h2>
                <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>{displayMetrics.length} metrics benchmarked against your sector peers</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 20, background: `${C.emerald}12`, color: C.emerald, border: `1px solid ${C.emerald}25` }}>{strengthMetrics.length} strengths</span>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 20, background: `${C.red}12`, color: C.red, border: `1px solid ${C.red}25` }}>{gapMetrics.length} gaps</span>
              </div>
            </RevealCard>

            {/* Metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {displayMetrics.map((metric: any, i: number) => {
                const code = (metric.metricCode || metric.metric_code || '').toLowerCase();
                const name = metric.metricName || metric.metric_name || metric.metric || code;
                const clientVal = metric.clientValue ?? metric.client_value ?? 0;
                const pct = metric.percentile || 0;
                const format = getMetricFormat(code);
                const higherIsBetter = !(code.includes('days') || code.includes('debtor') || code.includes('creditor') || code.includes('turnover'));
                const isStrength = pct >= 50;
                const barColor = pct >= 75 ? C.emerald : pct >= 50 ? C.blue : pct >= 25 ? C.amber : C.red;
                const impact = metric.annualImpact ?? metric.annual_impact;

                return (
                  <RevealCard key={i} delay={i * 40} style={{ ...glass({ padding: 20 }), borderLeft: `4px solid ${barColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: isStrength ? `${C.emerald}12` : `${C.red}12`, color: isStrength ? C.emerald : C.red, ...mono }}>
                        {isStrength ? 'STRENGTH' : 'GAP'}
                      </span>
                    </div>
                    {/* Value + percentile */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: barColor, ...mono, fontVariantNumeric: 'tabular-nums' }}>{fmtMetric(clientVal, format)}</span>
                      <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>{getOrdinalSuffix(pct)} percentile</span>
                    </div>
                    {/* Percentile bar */}
                    <div style={{ position: 'relative', height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`, borderRadius: 4, transition: `width 1s ${EASE.spring}` }} />
                    </div>
                    {/* Benchmarks */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textMuted, ...mono }}>
                      <span>P25: {fmtMetric(metric.p25 || 0, format)}</span>
                      <span>P50: {fmtMetric(metric.p50 || 0, format)}</span>
                      <span>P75: {fmtMetric(metric.p75 || 0, format)}</span>
                    </div>
                    {/* Gap / Advantage comparison */}
                    {metric.p50 != null && metric.p50 !== 0 && (() => {
                      const gap = clientVal - metric.p50;
                      const isAdvantage = higherIsBetter ? gap > 0 : gap < 0;
                      const absGap = Math.abs(gap);
                      return (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: isAdvantage ? `${C.emerald}06` : `${C.red}06`, border: `1px solid ${isAdvantage ? C.emerald : C.red}15` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                            <span style={{ fontWeight: 600, color: C.text }}>{fmtMetric(clientVal, format)}</span>
                            <ArrowRight style={{ width: 12, height: 12, color: C.textMuted }} />
                            <span style={{ color: C.textMuted }}>{fmtMetric(metric.p50, format)}</span>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: isAdvantage ? C.emerald : C.red, ...mono }}>
                            {isAdvantage ? '+' : '−'}{fmtMetric(absGap, format)}
                          </span>
                        </div>
                      );
                    })()}
                    {/* Annual impact */}
                    {impact != null && impact !== 0 && (
                      <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: impact > 0 ? `${C.red}06` : `${C.emerald}06`, borderLeft: `3px solid ${impact > 0 ? C.red : C.emerald}40` }}>
                        <span style={{ fontSize: 12, color: impact > 0 ? C.red : C.emerald, fontWeight: 600 }}>
                          {impact > 0 ? '−' : '+'}£{Math.abs(impact).toLocaleString()}/yr impact
                        </span>
                      </div>
                    )}
                  </RevealCard>
                );
              })}
            </div>
          </div>
        );

      // ─── POSITION (Narratives) ───────────────────────────────────────────
      case 'position':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}>
              <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Your Position</h2>
              <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>How your business compares to sector peers</p>
            </RevealCard>

            {/* 2×2 narrative grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[
                { title: 'Where You Stand', content: data.position_narrative, color: C.blue, icon: Target, highlight: `${getOrdinalSuffix(percentile)} percentile` },
                { title: 'Your Strengths', content: data.strength_narrative, color: C.emerald, icon: CheckCircle },
                { title: 'Performance Gaps', content: data.gap_narrative, color: C.red, icon: AlertTriangle, highlight: `${data.gap_count || gapMetrics.length} gaps identified` },
                { title: 'The Opportunity', content: data.opportunity_narrative, color: C.purple, icon: Sparkles, highlight: `£${totalOpportunity.toLocaleString()} potential` },
              ].map((section, i) => {
                const Icon = section.icon;
                return (
                  <RevealCard key={i} delay={i * 80} style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${section.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <Icon style={{ width: 20, height: 20, color: section.color }} />
                      <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>{section.title}</h3>
                    </div>
                    {section.highlight && (
                      <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 12, background: `${section.color}10`, color: section.color, marginBottom: 12, ...mono }}>{section.highlight}</span>
                    )}
                    {splitNarrative(section.content, 4).map((para, j) => (
                      <p key={j} style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>{para}</p>
                    ))}
                  </RevealCard>
                );
              })}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <RevealCard delay={350} style={{ ...glass({ padding: 24 }) }}>
                <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recommendations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recommendations.map((rec: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', borderLeft: `3px solid ${C.blue}40` }}>
                      <div style={{ width: 24, height: 24, borderRadius: 12, background: `${C.blue}15`, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>{rec.title || rec.recommendation}</p>
                        {rec.annualValue > 0 && <span style={{ fontSize: 12, color: C.emerald, fontWeight: 600, ...mono }}>£{rec.annualValue.toLocaleString()}/yr</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </RevealCard>
            )}

            {/* Competitive Moat */}
            {data.hva_data?.competitive_moat && data.hva_data.competitive_moat.length > 0 && (
              <RevealCard delay={400} style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${C.blue}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Shield style={{ width: 20, height: 20, color: C.blue }} />
                  <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Your Competitive Moat</h3>
                </div>
                <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 14 }}>Barriers that protect your business from competitors:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {data.hva_data.competitive_moat.map((moat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: `${C.blue}06`, border: `1px solid ${C.blue}15` }}>
                      <CheckCircle style={{ width: 14, height: 14, color: C.blue, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: C.text }}>{moat}</span>
                    </div>
                  ))}
                </div>
                {data.hva_data.unique_methods && (
                  <div style={{ marginTop: 14, padding: '14px 18px', borderRadius: 12, background: `${C.purple}06`, borderLeft: `3px solid ${C.purple}40` }}>
                    <span style={{ ...label, color: C.purple }}>Your Unique Advantage</span>
                    <p style={{ fontSize: 14, fontStyle: 'italic', color: C.text, marginTop: 6, lineHeight: 1.6 }}>"{data.hva_data.unique_methods}"</p>
                    {data.hva_data.reputation_build_time && <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>Time to replicate: {data.hva_data.reputation_build_time}</p>}
                  </div>
                )}
              </RevealCard>
            )}
          </div>
        );

      // ─── HIDDEN VALUE ────────────────────────────────────────────────────
      case 'hidden': {
        const hasSurplus = surplusCash > 0;
        const hasProperty = (data.balance_sheet?.freehold_property || 0) > 0;
        const hasInvestments = (data.balance_sheet?.investments || 0) > 0;
        const hasHiddenValue = hasSurplus || hasProperty || hasInvestments;

        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Hidden Value Hero */}
            {hasHiddenValue && (
              <>
                <RevealCard style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${C.emerald}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Gem style={{ width: 22, height: 22, color: C.emerald }} />
                    <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Hidden Value Identified</h2>
                  </div>
                  <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 8 }}>Assets that sit outside normal earnings-based valuations</p>
                </RevealCard>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {hasSurplus && (
                    <RevealCard delay={60} style={{ ...accentCard(C.emerald, { padding: 24 }) }}>
                      <span style={{ ...label, color: C.emerald }}>Surplus Cash</span>
                      <p style={{ fontSize: 28, fontWeight: 800, color: C.emerald, margin: '8px 0 4px', ...mono }}>{fmt(surplusCash)}</p>
                      <p style={{ fontSize: 12, color: C.textMuted }}>Above operating requirements</p>
                    </RevealCard>
                  )}
                  {hasProperty && (
                    <RevealCard delay={120} style={{ ...accentCard(C.blue, { padding: 24 }) }}>
                      <span style={{ ...label, color: C.blue }}>Property Value</span>
                      <p style={{ fontSize: 28, fontWeight: 800, color: C.blue, margin: '8px 0 4px', ...mono }}>{fmt(data.balance_sheet!.freehold_property!)}</p>
                      <p style={{ fontSize: 12, color: C.textMuted }}>At book value (market may be higher)</p>
                    </RevealCard>
                  )}
                  {hasInvestments && (
                    <RevealCard delay={180} style={{ ...accentCard(C.purple, { padding: 24 }) }}>
                      <span style={{ ...label, color: C.purple }}>Investments</span>
                      <p style={{ fontSize: 28, fontWeight: 800, color: C.purple, margin: '8px 0 4px', ...mono }}>{fmt(data.balance_sheet!.investments!)}</p>
                      <p style={{ fontSize: 12, color: C.textMuted }}>Fixed asset investments</p>
                    </RevealCard>
                  )}
                </div>

                {/* Free working capital bonus */}
                {data.surplus_cash?.components?.netWorkingCapital && data.surplus_cash.components.netWorkingCapital < 0 && (
                  <RevealCard delay={240} style={{ ...glass({ padding: '14px 20px' }), borderLeft: `4px solid ${C.emerald}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <TrendingUp style={{ width: 18, height: 18, color: C.emerald, flexShrink: 0 }} />
                    <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
                      <strong style={{ color: C.emerald }}>Bonus:</strong> Your supplier payment terms mean you operate with £{(Math.abs(data.surplus_cash.components.netWorkingCapital) / 1000000).toFixed(1)}M of free working capital.
                    </p>
                  </RevealCard>
                )}

                {/* Surplus cash breakdown (expandable) */}
                {surplusCashBreakdown && (
                  <RevealCard delay={300} style={{ ...glass({ padding: 0, overflow: 'hidden' }), borderTop: `3px solid ${C.emerald}` }}>
                    <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Wallet style={{ width: 20, height: 20, color: C.emerald }} />
                        <div>
                          <p style={{ fontWeight: 700, color: C.text, fontSize: 15, margin: 0 }}>Surplus Cash: {fmt(surplusCashBreakdown.surplusCash)}</p>
                          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{surplusCashBreakdown.surplusAsPercentOfRevenue?.toFixed(1)}% of revenue</p>
                        </div>
                      </div>
                      <button onClick={() => setShowSurplusDetail(!showSurplusDetail)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500 }}>
                        {showSurplusDetail ? 'Hide' : 'See'} breakdown <ChevronDown style={{ width: 14, height: 14, transform: showSurplusDetail ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                      </button>
                    </div>
                    {showSurplusDetail && (
                      <div style={{ padding: '0 24px 20px' }}>
                        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'separate', borderSpacing: 0 }}>
                          <tbody>
                            {[
                              { lbl: 'Cash at bank', val: fmt(surplusCashBreakdown.actualCash), color: C.text },
                              { lbl: 'Less: 3-month operating buffer', val: `(${fmt(surplusCashBreakdown.components.operatingBuffer)})`, color: C.red },
                              { lbl: 'Less: Working capital requirement', val: `(${fmt(Math.max(0, surplusCashBreakdown.components.workingCapitalRequirement))})`, color: C.red },
                            ].map((row, i) => (
                              <tr key={i}><td style={{ padding: '8px 0', color: C.textSecondary, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{row.lbl}</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: row.color, ...mono, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{row.val}</td></tr>
                            ))}
                            <tr style={{ fontWeight: 700 }}><td style={{ padding: '10px 0', color: C.emerald }}>Surplus available</td><td style={{ padding: '10px 0', textAlign: 'right', color: C.emerald, ...mono }}>{fmt(surplusCashBreakdown.surplusCash)}</td></tr>
                          </tbody>
                        </table>

                        {/* Operating Buffer Components */}
                        <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, ...mono }}>Operating Buffer Components</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ color: C.textMuted }}>Staff costs (quarterly)</span>
                              <span style={{ ...mono, color: C.text }}>{fmt(surplusCashBreakdown.components.staffCostsQuarterly || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ color: C.textMuted }}>Admin expenses (quarterly)</span>
                              <span style={{ ...mono, color: C.text }}>{fmt(surplusCashBreakdown.components.adminExpensesQuarterly || 0)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Working Capital Components */}
                        <div style={{ marginTop: 10, padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, ...mono }}>Working Capital Components</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                              { lbl: 'Debtors (cash owed to you)', val: (surplusCashBreakdown.components as any).debtors, positive: true },
                              { lbl: 'Stock', val: (surplusCashBreakdown.components as any).stock, positive: true },
                              { lbl: 'Creditors (you owe them)', val: (surplusCashBreakdown.components as any).creditors, positive: false },
                            ].filter(r => r.val !== undefined).map((row, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: C.textMuted }}>{row.lbl}</span>
                                <span style={{ ...mono, color: row.positive ? C.emerald : C.red }}>{row.positive ? '+' : '-'}{fmt(Math.abs(row.val || 0))}</span>
                              </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 8, marginTop: 4 }}>
                              <span style={{ color: C.text }}>Net working capital</span>
                              <span style={{ ...mono, color: surplusCashBreakdown.components.netWorkingCapital < 0 ? C.emerald : C.text }}>{fmt(surplusCashBreakdown.components.netWorkingCapital)}</span>
                            </div>
                          </div>
                          {surplusCashBreakdown.components.netWorkingCapital < 0 && (
                            <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: `${C.emerald}08`, border: `1px solid ${C.emerald}15`, fontSize: 12, color: C.emerald, lineHeight: 1.6 }}>
                              <strong>Why negative is good:</strong> Your creditors (suppliers) are funding your operations. You collect from customers faster than you pay suppliers. This is free working capital.
                            </div>
                          )}
                        </div>

                        <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: C.textMuted }}>
                          <Info style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <strong>Methodology:</strong> {surplusCashBreakdown.methodology}
                            <br />
                            <strong>Confidence:</strong> {surplusCashBreakdown.confidence}
                          </div>
                        </div>
                      </div>
                    )}
                  </RevealCard>
                )}
              </>
            )}

            {/* Concentration Risk */}
            {hasConcentrationRisk && (
              <RevealCard delay={hasHiddenValue ? 350 : 0} style={{ ...glass({ padding: 0, overflow: 'hidden' }), border: `1px solid ${C.red}25`, boxShadow: SHADOW.colorLift(C.red) }}>
                <div style={{ background: `linear-gradient(90deg, ${C.red}, #991b1b)`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertTriangle style={{ width: 20, height: 20, color: '#fff' }} />
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Customer Concentration Risk</span>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <span style={{ fontSize: 48, fontWeight: 800, color: C.red, ...mono }}>{concentration}%</span>
                    <span style={{ fontSize: 15, color: C.textSecondary }}>of your revenue comes from just 3 customers</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ padding: '14px 18px', borderRadius: 12, background: `${C.red}06`, borderLeft: `3px solid ${C.red}40` }}>
                      <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>If you lost your largest customer:</p>
                      <p style={{ fontSize: 20, fontWeight: 700, color: C.red, margin: 0, ...mono }}>{fmt(((data.revenue || 0) * concentration / 100) / 3)}+ at risk</p>
                    </div>
                    <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(0,0,0,0.02)' }}>
                      <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Industry benchmark:</p>
                      <p style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Top 3 &lt; 40%</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>
                    Acquirers typically apply a 20-30% valuation discount for this level of concentration. Your business is vulnerable to decisions made by people outside your control.
                  </p>
                </div>
              </RevealCard>
            )}

            {!hasHiddenValue && !hasConcentrationRisk && (
              <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}>
                <p style={{ color: C.textMuted, fontSize: 14 }}>No hidden value or concentration risk data available for this engagement.</p>
              </RevealCard>
            )}
          </div>
        );
      }

      // ─── VALUATION ───────────────────────────────────────────────────────
      case 'value': {
        if (!valueAnalysis) return <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}><p style={{ color: C.textMuted }}>Value analysis not available for this engagement.</p></RevealCard>;
        const { baseline, suppressors, currentMarketValue, valueGap, exitReadiness, pathToValue, enhancers } = valueAnalysis;
        const gapPercent = valueAnalysis.valueGapPercent || 0;

        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Dark valuation hero */}
            <RevealCard style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #1e3a5f 100%)', padding: '36px 40px', border: 'none', boxShadow: SHADOW.lg }}>
              <DotGrid opacity={0.05} /><NoiseOverlay opacity={0.15} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Business Valuation Analysis</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 }}>What {clientName} could be worth, and what's holding back the value</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  {[
                    { lbl: 'Baseline Value', val: fmt(baseline.enterpriseValue.mid), sub: `${baseline.multipleRange.mid}x EBITDA`, color: '#60A5FA' },
                    { lbl: 'Current Value', val: fmt(currentMarketValue.mid), sub: 'After structural discounts', color: '#FBBF24' },
                    { lbl: 'Value Gap', val: fmt(valueGap.mid), sub: `${gapPercent.toFixed(0)}% trapped`, color: C.red },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, ...mono }}>{s.lbl}</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: '0 0 4px', ...mono }}>{s.val}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealCard>

            {/* Value Bridge Waterfall */}
            <RevealCard delay={100} style={{ ...glass({ padding: 24 }) }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Where Your Value Is Going</h3>
              {/* Starting point */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12, background: `${C.blue}08`, border: `1px solid ${C.blue}20`, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrendingUp style={{ width: 18, height: 18, color: C.blue }} />
                  <div><span style={{ fontWeight: 600, color: C.text }}>Baseline Enterprise Value</span><p style={{ fontSize: 12, color: C.textMuted, margin: '2px 0 0' }}>{baseline.multipleJustification}</p></div>
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.blue, ...mono }}>{fmt(baseline.enterpriseValue.mid)}</span>
              </div>
              {/* Suppressors below */}
              {/* Suppressors */}
              {suppressors.map((s: ValueSuppressor) => {
                const avgImpact = (s.impactAmount.low + s.impactAmount.high) / 2;
                const sevColor = s.severity === 'critical' ? C.red : s.severity === 'high' ? C.orange : s.severity === 'medium' ? C.amber : C.textMuted;
                // Cross-reference enhanced suppressor for fix hint
                const enhancedMatch = enhancedSuppressors.find(e => e.name === s.name || e.code === s.id);
                return (
                  <div key={s.id} style={{ padding: '12px 18px', borderRadius: 10, background: `${sevColor}06`, border: `1px solid ${sevColor}15`, marginLeft: 20, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TrendingDown style={{ width: 16, height: 16, color: sevColor }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: sevColor, color: '#fff', ...mono }}>{s.severity.toUpperCase()}</span>
                          </div>
                          <p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0' }}>{s.evidence}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: sevColor, ...mono, flexShrink: 0 }}>-{fmt(avgImpact)}</span>
                    </div>
                    {enhancedMatch?.pathToFix?.summary && (
                      <div style={{ marginTop: 6, marginLeft: 26, display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: C.blue }}>
                        <Clock style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} />
                        <span>Fixable via {enhancedMatch.pathToFix.summary}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Current market value */}
              {/* Adjusted Enterprise Value (after discounts, before surplus cash) */}
              {baseline.surplusCash > 100000 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)', marginTop: 12, marginBottom: 6 }}>
                    <div><span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>Adjusted Enterprise Value</span><p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0' }}>After operating-risk discounts</p></div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.text, ...mono }}>{fmt(currentMarketValue.mid - baseline.surplusCash)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderRadius: 10, background: `${C.emerald}06`, border: `1px solid ${C.emerald}15`, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles style={{ width: 16, height: 16, color: C.emerald }} /><div><span style={{ fontWeight: 600, color: C.emerald, fontSize: 13 }}>Surplus Cash</span><p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0' }}>Added to equity value (not subject to operating discounts)</p></div></div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.emerald, ...mono }}>+{fmt(baseline.surplusCash)}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 12, background: `${C.amber}08`, border: `2px solid ${C.amber}`, marginTop: baseline.surplusCash > 100000 ? 0 : 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Target style={{ width: 18, height: 18, color: C.amber }} />
                  <div><span style={{ fontWeight: 700, color: C.text }}>Current Market Value</span><p style={{ fontSize: 12, color: C.textMuted, margin: '2px 0 0' }}>What a buyer would likely pay today</p></div>
                </div>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#B45309', ...mono }}>{fmt(currentMarketValue.mid)}</span>
              </div>
              <p style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic', marginTop: 12, lineHeight: 1.6 }}>
                Discounts compounded multiplicatively (standard M&A practice per Pratt, 2009). Each discount reduces remaining value after prior discounts. Where founder dependency and concentration overlap, adjustment applied to prevent double-counting.
              </p>
            </RevealCard>

            {/* Enhanced Suppressors — expandable cards */}
            {enhancedSuppressors.length > 0 && (
              <RevealCard delay={200} style={{ ...glass({ padding: 24 }) }}>
                <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Value Suppressors: Current vs Target</h3>
                <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>Each factor below is reducing what buyers would pay. See the discount, target state, and recoverable value.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {enhancedSuppressors.map((sup) => {
                    const sevColor = sup.severity === 'CRITICAL' ? C.red : sup.severity === 'HIGH' ? C.orange : sup.severity === 'MEDIUM' ? C.amber : C.textMuted;
                    const isExpanded = expandedSuppressor === sup.code;
                    return (
                      <div key={sup.code} style={{ ...glass({ padding: 0, overflow: 'hidden' }), borderTop: `3px solid ${sevColor}` }}>
                        <div style={{ padding: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div><p style={{ fontWeight: 700, color: C.text, fontSize: 14, margin: '0 0 4px' }}>{sup.name}</p><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: sevColor, color: '#fff', ...mono }}>{sup.severity}</span></div>
                            <div style={{ textAlign: 'right' }}><p style={{ fontSize: 24, fontWeight: 800, color: C.red, margin: 0, ...mono }}>-{sup.current.discountPercent}%</p><p style={{ fontSize: 12, color: C.textMuted, ...mono }}>-{fmt(sup.current.discountValue)}</p></div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.02)' }}><span style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Current</span><p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '4px 0 0' }}>{sup.current.value}</p><p style={{ fontSize: 11, color: C.textMuted }}>{sup.current.metric}</p></div>
                            <div style={{ padding: '10px 12px', borderRadius: 10, background: `${C.emerald}06`, border: `1px solid ${C.emerald}20` }}><span style={{ fontSize: 10, color: C.emerald, textTransform: 'uppercase', fontWeight: 600 }}>Target</span><p style={{ fontSize: 16, fontWeight: 700, color: C.emerald, margin: '4px 0 0' }}>{sup.target.value}</p><p style={{ fontSize: 11, color: C.emerald }}>{sup.target.metric}</p></div>
                          </div>
                          <div style={{ padding: '10px 14px', borderRadius: 10, background: `${C.emerald}08`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp style={{ width: 16, height: 16, color: C.emerald }} /><span style={{ fontWeight: 600, color: C.emerald, fontSize: 13 }}>Value Recoverable</span></div>
                            <div style={{ textAlign: 'right' }}><span style={{ fontSize: 18, fontWeight: 800, color: C.emerald, ...mono }}>{fmt(sup.recovery.valueRecoverable)}</span><p style={{ fontSize: 10, color: C.emerald, ...mono, marginTop: 2 }}>{sup.recovery.timeframe}</p></div>
                          </div>
                        </div>
                        <button onClick={() => setExpandedSuppressor(isExpanded ? null : sup.code)} style={{ width: '100%', padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.06)', background: 'none', border: 'none', borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: C.textMuted }}>
                          <span>Why this discount & how to fix</span>
                          <ChevronDown style={{ width: 14, height: 14, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                        </button>
                        {isExpanded && (
                          <div style={{ padding: '0 18px 18px', animation: 'fadeIn 0.25s ease' }}>
                            <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>{sup.evidence}</p>
                            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', marginBottom: 10 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>Why this discount?</p>
                              <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{sup.whyThisDiscount}</p>
                              <p style={{ fontSize: 11, fontStyle: 'italic', color: C.textMuted, marginTop: 6 }}>{sup.industryContext}</p>
                            </div>
                            <div style={{ padding: '12px 14px', borderRadius: 10, background: `${C.emerald}06`, borderLeft: `3px solid ${C.emerald}40` }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: C.emerald, marginBottom: 6 }}>Path to fix</p>
                              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>{sup.pathToFix.summary}</p>
                              <ol style={{ paddingLeft: 18, margin: 0 }}>
                                {sup.pathToFix.steps.map((step: string, i: number) => <li key={i} style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4, lineHeight: 1.5 }}>{step}</li>)}
                              </ol>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.emerald}20`, fontSize: 12, color: C.emerald }}>
                                <span>Investment: {fmt(sup.pathToFix.investment)}</span>
                                <span>ROI: {Math.round(sup.recovery.valueRecoverable / sup.pathToFix.investment)}x</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </RevealCard>
            )}

            {/* Value enhancers */}
            {enhancers && enhancers.length > 0 && (
              <RevealCard delay={300} style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${C.emerald}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}><Sparkles style={{ width: 18, height: 18, color: C.emerald }} /><h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Value Protectors</h3></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                  {enhancers.map((e: ValueEnhancer) => (
                    <div key={e.id} style={{ padding: '14px 16px', borderRadius: 12, background: `${C.emerald}05`, border: `1px solid ${C.emerald}15` }}>
                      <p style={{ fontWeight: 600, color: C.emerald, fontSize: 13 }}>{e.name}</p>
                      <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>{e.evidence}</p>
                      {e.value && <p style={{ fontSize: 12, fontWeight: 700, color: C.emerald, marginTop: 6, ...mono }}>+{fmt(e.value)} to value</p>}
                    </div>
                  ))}
                </div>
              </RevealCard>
            )}

            {/* Path to value */}
            <RevealCard delay={350} style={{ borderRadius: 16, background: `linear-gradient(135deg, ${C.blue}08, ${C.purple}06, rgba(255,255,255,0.97))`, border: `1px solid ${C.blue}15`, padding: 24, boxShadow: SHADOW.sm }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Path to Full Value</h3>
              <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 16 }}>
                Over the next {pathToValue.timeframeMonths} months, addressing structural issues could unlock <strong style={{ color: C.blue }}>{fmt(pathToValue.recoverableValue.mid)}</strong> in hidden value.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pathToValue.keyActions.map((action: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.7)', border: `1px solid ${C.blue}12` }}>
                    <div style={{ width: 24, height: 24, borderRadius: 12, background: C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: C.text }}>{action}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.8)', border: `1px solid ${C.blue}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><p style={{ fontSize: 12, color: C.blue }}>Potential Future Value</p><p style={{ fontSize: 10, color: C.textMuted }}>After addressing key issues</p></div>
                <div style={{ textAlign: 'right' }}><p style={{ fontSize: 24, fontWeight: 800, color: C.blue, margin: 0, ...mono }}>{fmt(valueAnalysis.potentialValue.mid)}</p><p style={{ fontSize: 12, color: C.emerald, marginTop: 2 }}>+{fmt(valueAnalysis.potentialValue.mid - currentMarketValue.mid)} uplift</p></div>
              </div>
            </RevealCard>
          </div>
        );
      }

      // ─── EXIT READINESS ──────────────────────────────────────────────────
      case 'exit': {
        if (!exitBreakdown) return <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}><p style={{ color: C.textMuted }}>Exit readiness data not available.</p></RevealCard>;
        const score = exitBreakdown.totalScore;
        const scoreColor = score >= 65 ? C.emerald : score >= 50 ? C.amber : score >= 35 ? C.orange : C.red;

        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Exit readiness hero */}
            <RevealCard style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '36px 40px', border: 'none', boxShadow: SHADOW.lg }}>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
                <ProgressRing score={score} size={180} strokeWidth={14} color={scoreColor} ringLabel="Exit Score" />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Exit Readiness</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 14 }}>How prepared is your business for a sale or transition?</p>
                  <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 18px', borderRadius: 20, background: `${scoreColor}25`, color: scoreColor, ...mono }}>{exitBreakdown.levelLabel}</span>
                  <div style={{ marginTop: 16, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(score / exitBreakdown.maxScore) * 100}%`, background: scoreColor, borderRadius: 3, transition: `width 1.2s ${EASE.spring}` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'rgba(255,255,255,0.4)', ...mono }}>
                    <span>Not Ready</span><span>Needs Work</span><span>Progressing</span><span>Credibly Ready</span><span>Exit Ready</span>
                  </div>
                </div>
              </div>
            </RevealCard>

            {/* Component breakdown */}
            <RevealCard delay={100} style={{ ...glass({ padding: 24 }) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Score Breakdown</h3>
                <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>{score} / {exitBreakdown.maxScore} total</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {exitBreakdown.components.map((comp) => {
                  const compColor = comp.currentScore >= comp.targetScore ? C.emerald : comp.currentScore >= comp.maxScore * 0.5 ? C.amber : C.red;
                  const pctFilled = (comp.currentScore / comp.maxScore) * 100;
                  return (
                    <div key={comp.id} style={{ padding: '16px 18px', borderRadius: 12, border: `1px solid ${compColor}15`, background: `${compColor}03` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{comp.name}</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: compColor, ...mono }}>{comp.currentScore}<span style={{ color: C.textMuted, fontWeight: 400 }}>/{comp.maxScore}</span></span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', width: `${pctFilled}%`, background: `linear-gradient(90deg, ${compColor}, ${compColor}bb)`, borderRadius: 4, transition: `width 1s ${EASE.spring}` }} />
                      </div>
                      {comp.currentScore < comp.targetScore && comp.gap && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <Target style={{ width: 12, height: 12, color: compColor, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: compColor, fontWeight: 500, margin: 0 }}>{comp.gap}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </RevealCard>

            {/* Path to 70 */}
            {score < 70 && exitBreakdown.pathTo70 && (
              <RevealCard delay={200} style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${C.emerald}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Target style={{ width: 18, height: 18, color: C.emerald }} />
                  <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Path to Credibly Exit Ready (70/100)</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {exitBreakdown.pathTo70.actions.map((action: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 8, background: `${C.emerald}05` }}>
                      <div style={{ width: 22, height: 22, borderRadius: 11, background: `${C.emerald}15`, color: C.emerald, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{action}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { icon: Clock, val: exitBreakdown.pathTo70.timeframe, sub: 'Timeline' },
                    { icon: Wallet, val: fmt(exitBreakdown.pathTo70.investment), sub: 'Investment' },
                    { icon: TrendingUp, val: fmt(exitBreakdown.pathTo70.valueUnlocked), sub: 'Value Unlocked' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '12px', borderRadius: 10, background: `${C.emerald}06` }}>
                      <s.icon style={{ width: 18, height: 18, color: C.emerald, margin: '0 auto 6px' }} />
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.emerald, margin: 0 }}>{s.val}</p>
                      <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </RevealCard>
            )}
          </div>
        );
      }

      // ─── SCENARIOS ───────────────────────────────────────────────────────
      case 'scenarios': {
        if (!baselineMetrics) return <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}><p style={{ color: C.textMuted }}>Scenario data requires baseline financial metrics.</p></RevealCard>;
        const revenue = baselineMetrics.revenue;
        const currentValue = valueAnalysis?.currentMarketValue?.mid || 0;
        const baselineValue = valueAnalysis?.baseline?.totalBaseline || valueAnalysis?.baseline?.enterpriseValue?.mid || 0;
        const exitScore = valueAnalysis?.exitReadiness?.score || exitBreakdown?.totalScore || 0;
        const prefersExternal = data.client_preferences?.avoidsInternalHires || data.client_preferences?.prefersExternalSupport;

        const scenarios = [
          { id: 'do_nothing', title: 'If You Do Nothing', subtitle: 'Continue without structural changes', icon: AlertTriangle, color: C.red, outcomes: [
            { metric: 'Client Concentration', current: `${concentration}%`, projected: `${concentration}%`, change: 'Unchanged', positive: false },
            { metric: 'Business Value', current: fmt(currentValue), projected: fmt(currentValue), change: 'Discount persists', positive: false },
            { metric: 'Owner Freedom', current: 'Trapped', projected: 'Still trapped', change: 'No successor path', positive: false },
          ], risks: ['Loss of major client = existential crisis', 'Owner health issue = business crisis', 'Business remains unsellable at fair value'] },
          { id: 'diversify', title: 'If You Diversify', subtitle: 'Win new clients, reduce dependency', icon: Users, color: C.blue, outcomes: [
            { metric: 'Concentration', current: `${concentration}%`, projected: '60-70%', change: '-30+ points', positive: true },
            { metric: 'Revenue', current: fmt(revenue), projected: fmt(revenue * 1.15), change: '+15% new clients', positive: true },
            { metric: 'Business Value', current: fmt(currentValue), projected: fmt(baselineValue * 0.8), change: `+${fmt(baselineValue * 0.8 - currentValue)}`, positive: true },
          ], risks: ['Takes 12-18 months to show results', 'Requires management attention', 'New clients may have different margins'] },
          { id: 'exit_prep', title: 'If You Prepare for Exit', subtitle: 'Build sellable value systematically', icon: Rocket, color: C.emerald, outcomes: [
            { metric: 'Exit Readiness', current: `${exitScore}/100`, projected: '70+/100', change: 'Attractive to buyers', positive: true },
            { metric: 'Owner Dependency', current: '70-80%', projected: '<40%', change: 'Successor in place', positive: true },
            { metric: 'Business Value', current: fmt(currentValue), projected: fmt(baselineValue * 0.75), change: `+${fmt(baselineValue * 0.75 - currentValue)}`, positive: true },
          ], risks: ['Concentration still impacts valuation', prefersExternal ? 'Internal succession pathway requires right candidate' : 'Successor recruitment is challenging', 'Requires 2-3 years commitment'] },
        ];
        const active = scenarios.find(s => s.id === activeScenario) || scenarios[1];

        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}>
              <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Scenario Planning</h2>
              <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>What happens depending on the path you choose</p>
            </RevealCard>

            {/* Scenario tabs */}
            <div style={{ display: 'flex', gap: 8 }}>
              {scenarios.map(s => {
                const isActive = activeScenario === s.id;
                const IconComp = s.icon;
                return (
                  <button key={s.id} onClick={() => setActiveScenario(s.id)} style={{
                    flex: 1, padding: '16px 16px', borderRadius: 14, border: `2px solid ${isActive ? s.color : 'rgba(0,0,0,0.06)'}`,
                    background: isActive ? `${s.color}08` : 'rgba(255,255,255,0.97)', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}>
                    <IconComp style={{ width: 18, height: 18, color: isActive ? s.color : C.textMuted }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? s.color : C.text }}>{s.title}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{s.subtitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Active scenario content */}
            <RevealCard style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${active.color}` }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(240,242,247,0.8)' }}>
                      {['Metric', 'Today', 'Projected', 'Impact'].map(h => (
                        <th key={h} style={{ ...label, fontSize: 10, padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {active.outcomes.map((o, i) => (
                      <tr key={i} style={{ background: o.positive ? 'transparent' : `${C.red}04` }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: C.text, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{o.metric}</td>
                        <td style={{ padding: '12px 14px', color: C.textMuted, borderBottom: '1px solid rgba(0,0,0,0.04)', ...mono }}>{o.current}</td>
                        <td style={{ padding: '12px 14px', color: C.text, fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.04)', ...mono }}>{o.projected}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: o.positive ? C.emerald : C.red, fontWeight: 500 }}>
                            {o.positive ? <Check style={{ width: 14, height: 14 }} /> : <X style={{ width: 14, height: 14 }} />} {o.change}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {active.risks.length > 0 && (
                <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: active.id === 'do_nothing' ? `${C.red}06` : `${C.amber}06`, borderLeft: `3px solid ${active.id === 'do_nothing' ? C.red : C.amber}40` }}>
                  <span style={{ ...label, color: active.id === 'do_nothing' ? C.red : C.amber, marginBottom: 8, display: 'block' }}>{active.id === 'do_nothing' ? 'What You Risk' : 'Considerations'}</span>
                  {active.risks.map((r, i) => (
                    <p key={i} style={{ fontSize: 13, color: C.textSecondary, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${active.id === 'do_nothing' ? C.red : C.amber}30`, lineHeight: 1.5 }}>{r}</p>
                  ))}
                </div>
              )}
            </RevealCard>
          </div>
        );
      }

      // ─── SERVICES ────────────────────────────────────────────────────────
      case 'services':
        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <RevealCard style={{ ...glass({ padding: 24 }) }}>
              <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0 }}>How We Can Help</h2>
              <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>{recommendedServices.length} services recommended based on your analysis</p>
            </RevealCard>

            {recommendedServices.length === 0 && (
              <RevealCard style={{ ...glass({ padding: 32, textAlign: 'center' }) }}><p style={{ color: C.textMuted }}>No services have been recommended yet.</p></RevealCard>
            )}

            {recommendedServices.map((svc, i) => {
              const isExpanded = expandedService === svc.serviceCode;
              const isPrimary = svc.priority === 'primary';
              const accentColor = isPrimary ? C.blue : C.purple;
              return (
                <RevealCard key={svc.serviceCode} delay={i * 60} style={{ ...glass({ padding: 0, overflow: 'hidden' }), borderLeft: `4px solid ${accentColor}` }}>
                  <div onClick={() => setExpandedService(isExpanded ? null : svc.serviceCode)} style={{ padding: '18px 24px', cursor: 'pointer' }}>
                    {/* RECOMMENDED FOR YOU badge */}
                    {isPrimary && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <Sparkles style={{ width: 12, height: 12, color: C.blue }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.08em', ...mono }}>Recommended For You</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{svc.serviceName}</p>
                          {isPrimary && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: C.blue, color: '#fff', ...mono }}>PRIORITY</span>}
                        </div>
                        <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{svc.headline || svc.description}</p>
                      </div>
                      {(svc.priceRange || (svc.priceFrom && svc.priceTo)) && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: accentColor, ...mono }}>
                            {svc.priceRange || `£${svc.priceFrom?.toLocaleString()} – £${svc.priceTo?.toLocaleString()}`}
                          </span>
                          {svc.priceUnit && <p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0', ...mono }}>{svc.priceUnit}</p>}
                        </div>
                      )}
                      {!svc.priceRange && !svc.priceFrom && (
                        <span style={{ fontSize: 13, fontWeight: 600, color: accentColor, ...mono, flexShrink: 0 }}>Contact for pricing</span>
                      )}
                      <ChevronDown style={{ width: 16, height: 16, color: C.textMuted, flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(0,0,0,0.04)', animation: 'fadeIn 0.25s ease' }}>
                      <div style={{ paddingTop: 16 }}>
                        {/* Why This Matters */}
                        {svc.whyThisMatters && (
                          <div style={{ marginBottom: 14 }}>
                            <span style={{ ...label, marginBottom: 6, display: 'block', color: C.textMuted }}>Why This Matters For You</span>
                            <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7, margin: 0 }}>{svc.whyThisMatters}</p>
                          </div>
                        )}
                        {/* What You Get */}
                        {svc.whatYouGet && svc.whatYouGet.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <span style={{ ...label, marginBottom: 8, display: 'block' }}>What You Get</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {svc.whatYouGet.map((item: string, j: number) => (
                                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                  <CheckCircle style={{ width: 14, height: 14, color: C.emerald, flexShrink: 0, marginTop: 2 }} />
                                  <span style={{ fontSize: 13, color: C.textSecondary }}>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Expected Outcome */}
                        {svc.expectedOutcome && (
                          <div style={{ padding: '12px 16px', borderRadius: 10, background: `${C.emerald}06`, borderLeft: `3px solid ${C.emerald}40`, marginBottom: 14 }}>
                            <span style={{ ...label, color: C.emerald, marginBottom: 4, display: 'block' }}>Expected Outcome</span>
                            <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.5 }}>{svc.expectedOutcome}</p>
                          </div>
                        )}
                        {/* Footer: Time to value + Addressed Issues + Value at Stake */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMuted }}>
                              <Clock style={{ width: 14, height: 14 }} /> {svc.timeToValue}
                            </div>
                            {svc.addressesIssues && svc.addressesIssues.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: 12 }}>
                                <span style={{ color: C.textMuted }}>Addresses:</span>
                                {svc.addressesIssues.map((issue, j) => (
                                  <span key={j} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: `${C.blue}08`, color: C.blue, border: `1px solid ${C.blue}15`, fontWeight: 500 }}>
                                    {issue.issueTitle}{issue.valueAtStake > 0 ? ` (${fmt(issue.valueAtStake)})` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {svc.totalValueAtStake != null && svc.totalValueAtStake > 0 && (
                            <div style={{ padding: '10px 14px', borderRadius: 8, background: `${C.amber}06`, border: `1px solid ${C.amber}15`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>Total value at stake:</span>
                              <span style={{ fontSize: 16, fontWeight: 800, color: '#B45309', ...mono }}>£{svc.totalValueAtStake.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </RevealCard>
              );
            })}
          </div>
        );

      // ─── YOUR PATH (Two Paths) ───────────────────────────────────────────
      case 'path': {
        if (!twoPathsNarrative || !baselineMetrics) {
          // Meaningful fallback: synthesize from available data
          const marginOpp = totalOpportunity;
          const valueGapMid = valueAnalysis?.valueGap?.mid || 0;
          const potentialVal = valueAnalysis?.potentialValue?.mid || 0;
          const currentVal = valueAnalysis?.currentMarketValue?.mid || 0;
          const pathActions = valueAnalysis?.pathToValue?.keyActions || [];

          return (
            <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <RevealCard style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #1e3a5f 0%, #312e81 100%)', padding: '36px 40px', border: 'none', boxShadow: SHADOW.lg }}>
                <NoiseOverlay opacity={0.12} /><DotGrid opacity={0.04} />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Two Connected Opportunities</h2>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 24, maxWidth: '48ch', margin: '0 auto 24px' }}>Improving margins funds the journey to unlocking trapped business value</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '18px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <p style={{ fontSize: 28, fontWeight: 800, color: C.emeraldLight, margin: 0, ...mono }}>{fmt(marginOpp)}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Annual margin opportunity</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '18px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <p style={{ fontSize: 28, fontWeight: 800, color: '#FBBF24', margin: 0, ...mono }}>{fmt(valueGapMid)}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Trapped value</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                    {['Better margins', 'Fund diversification', 'Reduce risk', 'Unlock value'].map((step, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <ArrowRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />}
                        <span style={{ padding: '4px 14px', borderRadius: 6, background: `rgba(255,255,255,0.12)`, color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}>{step}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </RevealCard>

              {/* Key actions from pathToValue */}
              {pathActions.length > 0 && (
                <RevealCard delay={100} style={{ ...glass({ padding: 24 }) }}>
                  <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Priority Actions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pathActions.map((action: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.7)', border: `1px solid ${C.blue}12` }}>
                        <div style={{ width: 24, height: 24, borderRadius: 12, background: C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontSize: 13, color: C.text }}>{action}</span>
                      </div>
                    ))}
                  </div>
                </RevealCard>
              )}

              {/* Potential value card */}
              {potentialVal > 0 && (
                <RevealCard delay={200} style={{ ...glass({ padding: '20px 24px' }), borderTop: `3px solid ${C.emerald}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 2 }}>If you address these structural issues:</p>
                      <p style={{ fontSize: 12, color: C.textMuted }}>Current: {fmt(currentVal)} → Potential: {fmt(potentialVal)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 24, fontWeight: 800, color: C.emerald, margin: 0, ...mono }}>+{fmt(potentialVal - currentVal)}</p>
                      <p style={{ fontSize: 11, color: C.emerald }}>uplift potential</p>
                    </div>
                  </div>
                </RevealCard>
              )}
            </div>
          );
        }
        const marginOpp = totalOpportunity;
        const valueGapMid = valueAnalysis?.valueGap?.mid || 0;

        return (
          <div style={{ ...sectionWrap, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Dark hero */}
            <RevealCard style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #1e3a5f 0%, #312e81 100%)', padding: '36px 40px', border: 'none', boxShadow: SHADOW.lg }}>
              <NoiseOverlay opacity={0.12} /><DotGrid opacity={0.04} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 16 }}>{twoPathsNarrative.headline}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '18px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <p style={{ fontSize: 28, fontWeight: 800, color: C.emeraldLight, margin: 0, ...mono }}>{fmt(marginOpp)}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Annual margin opportunity</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '18px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <p style={{ fontSize: 28, fontWeight: 800, color: '#FBBF24', margin: 0, ...mono }}>{fmt(valueGapMid)}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Trapped value</p>
                  </div>
                </div>
                {/* Connection flow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20, fontSize: 12 }}>
                  {['Better margins', 'Fund diversification', 'Reduce risk', 'Unlock value'].map((step, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <ArrowRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />}
                      <span style={{ padding: '4px 14px', borderRadius: 6, background: `rgba(255,255,255,0.12)`, color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}>{step}</span>
                    </React.Fragment>
                  ))}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7 }}>{twoPathsNarrative.explanation}</p>
              </div>
            </RevealCard>

            {/* Owner journey */}
            <RevealCard delay={150} style={{ ...glass({ padding: 24 }) }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{clientName}'s Path to Optionality</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { year: 'Year 1', color: C.emerald, text: twoPathsNarrative.ownerJourney.year1 },
                  { year: 'Year 2', color: C.blue, text: twoPathsNarrative.ownerJourney.year2 },
                  { year: 'Year 3', color: C.amber, text: twoPathsNarrative.ownerJourney.year3 },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: step.color, minWidth: 60, textAlign: 'right', ...mono }}>{step.year}</span>
                    <div style={{ flex: 1, borderLeft: `3px solid ${step.color}30`, paddingLeft: 16 }}>
                      <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7, margin: 0 }}>{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.6 }}>{twoPathsNarrative.bottomLine}</p>
              </div>
            </RevealCard>
          </div>
        );
      }

      // ─── VISION ──────────────────────────────────────────────────────────
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
            {/* Dark cinematic hero — larger stats */}
            <RevealCard style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #0F172A 0%, #162340 40%, #1E293B 100%)', padding: '48px 40px', textAlign: 'center', border: 'none', boxShadow: SHADOW.lg }}>
              <DotGrid opacity={0.05} /><NoiseOverlay opacity={0.15} />
              <div style={{ position: 'absolute', top: '-15%', left: '10%', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${C.blue}18 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                  <Rocket style={{ width: 16, height: 16, color: C.emeraldLight }} />
                  <span style={{ fontSize: 12, letterSpacing: '0.15em', color: C.emeraldLight, textTransform: 'uppercase', fontWeight: 600, ...mono }}>Your Position: Summed Up</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 0 }}>
                  {[
                    { val: fmt(totalOpportunity), sub: 'Opportunity/yr', bg: `${C.emerald}20` },
                    ...(valueAnalysis ? [{ val: fmt(valueAnalysis.valueGap.mid), sub: 'Trapped value', bg: `${C.amber}20` }] : []),
                    ...(valueAnalysis ? [{ val: fmt(valueAnalysis.potentialValue.mid), sub: 'Potential value', bg: `${C.blue}20` }] : []),
                  ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, borderRadius: 16, padding: '22px 36px', border: '1px solid rgba(255,255,255,0.15)', minWidth: 160, backdropFilter: 'blur(8px)' }}>
                      <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0, ...mono }}>{s.val}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealCard>

            {/* Closing summary */}
            <RevealCard delay={100} style={{ ...glass({ padding: '24px 28px' }), borderLeft: `4px solid ${C.emerald}`, background: `linear-gradient(135deg, ${C.emerald}05, ${C.blue}03, rgba(255,255,255,0.97))` }}>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: C.text, margin: 0 }}>{closingSummary}</p>
            </RevealCard>

            {/* CTA */}
            <RevealCard delay={200} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #0F172A, #1E293B)', padding: '36px 40px', textAlign: 'center', border: 'none', boxShadow: SHADOW.md }}>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <Phone style={{ width: 24, height: 24, color: C.emeraldLight }} />
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Ready to Take Action?</h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: '42ch', margin: 0, lineHeight: 1.6 }}>
                  {practitionerName || 'your advisor'} can guide you through the next steps
                </p>
                {practitionerEmail && (
                  <a href={`mailto:${practitionerEmail}?subject=Benchmarking%20Report%20Follow-up${clientName ? `%20-%20${encodeURIComponent(clientName)}` : ''}`}
                    style={{ background: `linear-gradient(135deg, ${C.emerald}, #047857)`, color: '#fff', padding: '14px 40px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, boxShadow: SHADOW.glow(C.emerald, 0.4), textDecoration: 'none', transition: 'all 0.3s ease', marginTop: 4 }}>
                    Schedule a Discussion <ArrowRight style={{ width: 16, height: 16 }} />
                  </a>
                )}
              </div>
            </RevealCard>

            {/* Data sources */}
            {data.data_sources && data.data_sources.length > 0 && (
              <RevealCard delay={300} style={{ ...glass({ padding: '16px 20px' }) }}>
                <span style={{ ...label, marginBottom: 8, display: 'block' }}>Benchmark Data Sources</span>
                <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>Analysis based on industry benchmarks as of {data.benchmark_data_as_of || 'recent data'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.data_sources.slice(0, 8).map((source, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.03)', color: C.textMuted, border: '1px solid rgba(0,0,0,0.06)' }}>{source}</span>
                  ))}
                  {data.data_sources.length > 8 && <span style={{ fontSize: 11, color: C.textLight }}>+{data.data_sources.length - 8} more</span>}
                </div>
              </RevealCard>
            )}
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
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
        ::selection { background: ${C.blue}30; }
      `}</style>

      <Sidebar />

      <div ref={contentRef} style={{
        marginLeft: 220, flex: 1, padding: '24px 32px', overflowY: 'auto', height: '100vh', background: C.bg,
        opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', overflow: 'hidden' }}>
          {/* Header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${C.cardBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              {onBack && <button type="button" onClick={onBack} style={{ color: C.textMuted, padding: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}><ArrowLeft style={{ width: 20, height: 20 }} /></button>}
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{data.headline || 'Benchmarking Report'}</h1>
                <p style={{ fontSize: 13, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[clientName, `${getOrdinalSuffix(percentile)} percentile`, `£${totalOpportunity.toLocaleString()} opportunity`].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <span style={{ fontSize: 12, color: C.textMuted, ...mono }}>
              {data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </span>
          </div>
          <div key={activeSection} style={{ animation: 'fadeIn 0.4s ease' }}>
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}
