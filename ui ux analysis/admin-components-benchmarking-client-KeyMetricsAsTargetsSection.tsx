import React, { useState } from 'react';

const C = {
  navy: '#0F172A',
  text: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  blue: '#3B82F6',
  emerald: '#10B981',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  red: '#EF4444',
  bg: '#F0F2F7',
  cardBg: 'rgba(255,255,255,0.97)',
  cardBorder: 'rgba(22,35,64,0.08)',
};

const SHADOW = {
  sm: '0 1px 3px rgba(22,35,64,0.08), 0 4px 12px rgba(22,35,64,0.06)',
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.97)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(22, 35, 64, 0.08)',
  borderRadius: 16,
  boxShadow: SHADOW.sm,
  ...extra,
});

const fmt = (v: number) => v >= 1000000 ? '£' + (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? '£' + Math.round(v / 1000) + 'k' : '£' + v;

interface MetricTarget {
  metricCode: string;
  metricName: string;
  metricCategory: 'valuation_defining' | 'operational' | 'investor_readiness';
  p25: number;
  p50: number;
  p75: number;
  unit: string;
  targetValue: number;
  targetByYear: number;
  currentValue?: number;
  currentValueDisplay: string;
  status: 'not_engaged' | 'on_track' | 'behind_trajectory' | 'at_target';
  valuationImpactAtP75: number;
  valuationImpactRationale: string;
  whyThisMatters: string;
}

interface KeyMetricsAsTargetsProps {
  metricTargets: MetricTarget[];
  targetExitValuation: number;
}

const STATUS_CONFIG: Record<MetricTarget['status'], { label: string; color: string; bg: string }> = {
  not_engaged: { label: 'Not Engaged', color: C.textMuted, bg: `${C.textMuted}15` },
  on_track: { label: 'On Track', color: C.emerald, bg: `${C.emerald}15` },
  behind_trajectory: { label: 'Behind', color: C.amber, bg: `${C.amber}15` },
  at_target: { label: 'At Target', color: C.blue, bg: `${C.blue}15` },
};

const CATEGORY_CONFIG: Record<MetricTarget['metricCategory'], { label: string; color: string }> = {
  valuation_defining: { label: 'Valuation Defining', color: C.purple },
  operational: { label: 'Operational', color: C.blue },
  investor_readiness: { label: 'Investor Readiness', color: C.emerald },
};

function MetricTargetCard({ metric }: { metric: MetricTarget }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[metric.status];
  const min = Math.min(metric.p25, metric.targetValue, metric.currentValue ?? metric.p25);
  const max = Math.max(metric.p75, metric.targetValue, metric.currentValue ?? metric.p75);
  const range = max - min || 1;

  const pctOf = (val: number) => Math.max(0, Math.min(100, ((val - min) / range) * 100));

  return (
    <div style={{ ...glass({ padding: 20 }), borderLeft: `4px solid ${status.color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{metric.metricName}</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: status.bg, color: status.color, ...mono }}>
          {status.label}
        </span>
      </div>

      {/* Current value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: C.text, ...mono }}>{metric.currentValueDisplay}</span>
        <span style={{ fontSize: 12, color: C.textMuted }}>→ target: {metric.targetValue}{metric.unit === '%' ? '%' : ` ${metric.unit}`} by Y{metric.targetByYear}</span>
      </div>

      {/* Horizontal track with P25/P50/P75 markers */}
      <div style={{ position: 'relative', height: 24, marginBottom: 8 }}>
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2 }} />
        {/* P25 marker */}
        <div style={{ position: 'absolute', left: `${pctOf(metric.p25)}%`, top: 6, width: 1, height: 12, background: C.textMuted, opacity: 0.5 }} />
        {/* P50 marker */}
        <div style={{ position: 'absolute', left: `${pctOf(metric.p50)}%`, top: 4, width: 2, height: 16, background: C.textSecondary, borderRadius: 1 }} />
        {/* P75 marker */}
        <div style={{ position: 'absolute', left: `${pctOf(metric.p75)}%`, top: 6, width: 1, height: 12, background: C.textMuted, opacity: 0.5 }} />
        {/* Target indicator */}
        <div style={{ position: 'absolute', left: `${pctOf(metric.targetValue)}%`, top: 2, transform: 'translateX(-50%)' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.purple, border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
        </div>
        {/* Current value indicator */}
        {metric.currentValue != null && (
          <div style={{ position: 'absolute', left: `${pctOf(metric.currentValue)}%`, top: 2, transform: 'translateX(-50%)' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: status.color, border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
          </div>
        )}
      </div>

      {/* P-labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textMuted, ...mono, marginBottom: 10 }}>
        <span>P25: {metric.p25}{metric.unit === '%' ? '%' : ''}</span>
        <span>P50: {metric.p50}{metric.unit === '%' ? '%' : ''}</span>
        <span>P75: {metric.p75}{metric.unit === '%' ? '%' : ''}</span>
      </div>

      {/* Valuation impact */}
      <p style={{ fontSize: 11, color: C.purple, fontStyle: 'italic', margin: '0 0 8px' }}>
        +{fmt(metric.valuationImpactAtP75)} valuation at P75
      </p>

      {/* Expandable "Why this matters" */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
      >
        {expanded ? 'Hide details' : 'Why this matters'}
      </button>
      {expanded && (
        <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: `${C.blue}06`, border: `1px solid ${C.blue}12` }}>
          <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.6, margin: 0 }}>{metric.whyThisMatters}</p>
          {metric.valuationImpactRationale && (
            <p style={{ fontSize: 11, color: C.textMuted, marginTop: 6, lineHeight: 1.5, margin: '6px 0 0' }}>{metric.valuationImpactRationale}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function KeyMetricsAsTargetsSection({ metricTargets, targetExitValuation }: KeyMetricsAsTargetsProps) {
  const exitLabel = targetExitValuation >= 1000000 ? `£${(targetExitValuation / 1000000).toFixed(0)}M` : fmt(targetExitValuation);

  const grouped = {
    valuation_defining: metricTargets.filter(m => m.metricCategory === 'valuation_defining'),
    operational: metricTargets.filter(m => m.metricCategory === 'operational'),
    investor_readiness: metricTargets.filter(m => m.metricCategory === 'investor_readiness'),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>
          Industry targets that drive your {exitLabel} exit
        </h2>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
          These metrics define what investors and acquirers look for. Each target is set against your sector benchmarks.
        </p>
      </div>

      {(Object.keys(grouped) as Array<MetricTarget['metricCategory']>).map(cat => {
        const items = grouped[cat];
        if (!items.length) return null;
        const cfg = CATEGORY_CONFIG[cat];
        return (
          <div key={cat}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cfg.label}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {items.map(m => <MetricTargetCard key={m.metricCode} metric={m} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
