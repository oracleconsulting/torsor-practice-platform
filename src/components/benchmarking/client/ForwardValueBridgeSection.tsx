import React from 'react';
import { EnhancedSuppressorCard } from '../EnhancedSuppressorCard';
import type { EnhancedValueSuppressor } from '../../../types/opportunity-calculations';

interface ForwardValueBridgeProps {
  preRevenueAnalysis: {
    defensiblePreMoney: { conservative: number; base: number; stretch: number; rationale: string; sources: string[] };
    vcMethodBackSolve: { targetExitValuation: number; exitHorizonYears: number; todayPreMoneyImplied: number; methodology: string };
    scorecardValuation: { impliedPreMoney: number };
    berkusValuation: { impliedPreMoney: number };
    comparableRoundsAnalysis?: { impliedRange: { low: number; mid: number; high: number } };
    versusOwnerStated: { ownerStatedPreMoney?: number; plausibilityVerdict: string; rationale: string; gapToBaseCase: number };
    forwardSuppressors: any[];
    milestonePath: Array<{ milestoneNumber: number; timeframeMonths: number; description: string; arrTarget?: number; valuationStepUp: { from: number; to: number }; blockers: string[] }>;
    investmentReadiness: { score: number; verdict: string; components: Record<string, { score: number; max: number; gaps: string[] }>; overallGaps: string[]; overallStrengths: string[] };
    caveats: string[];
  };
  businessStage: string;
}

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
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const label: React.CSSProperties = { fontSize: 11, color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600, ...mono };

const fmt = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1000000) return sign + '£' + (abs / 1000000).toFixed(1) + 'M';
  if (abs >= 1000) return sign + '£' + Math.round(abs / 1000) + 'k';
  return sign + '£' + abs;
};

const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.97)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(22, 35, 64, 0.08)',
  borderRadius: 16,
  boxShadow: SHADOW.sm,
  ...extra,
});

export function ForwardValueBridgeSection({ preRevenueAnalysis, businessStage }: ForwardValueBridgeProps) {
  const { defensiblePreMoney, vcMethodBackSolve, scorecardValuation, berkusValuation, comparableRoundsAnalysis, versusOwnerStated, forwardSuppressors, milestonePath, caveats } = preRevenueAnalysis;

  const verdictColors: Record<string, { bg: string; border: string; text: string }> = {
    aligned: { bg: '#059669', border: '#059669', text: '#fff' },
    stretch_defensible: { bg: '#D97706', border: '#D97706', text: '#fff' },
    materially_above: { bg: '#DC2626', border: '#DC2626', text: '#fff' },
    below_market: { bg: '#2563EB', border: '#2563EB', text: '#fff' },
  };

  const verdictLabels: Record<string, string> = {
    aligned: 'Aligned',
    stretch_defensible: 'Stretch but Defensible',
    materially_above: 'Materially Above',
    below_market: 'Below Market',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Dark Hero Card — Pre-Money Valuation Analysis */}
      <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #1e3a5f 100%)', padding: '36px 40px', border: 'none', boxShadow: SHADOW.lg }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ ...label, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{businessStage === 'early_revenue' ? 'Early Revenue' : 'Pre-Revenue'}</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Pre-Money Valuation Analysis</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 }}>Defensible valuation range based on four independent methodologies</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { lbl: 'Conservative', val: fmt(defensiblePreMoney.conservative), color: '#94A3B8', highlighted: false },
              { lbl: 'Base Case', val: fmt(defensiblePreMoney.base), color: '#60A5FA', highlighted: true },
              { lbl: 'Stretch', val: fmt(defensiblePreMoney.stretch), color: '#10B981', highlighted: false },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: s.highlighted ? '16px 12px' : '12px', borderRadius: 12, background: s.highlighted ? 'rgba(96,165,250,0.1)' : 'transparent', border: s.highlighted ? '1px solid rgba(96,165,250,0.2)' : '1px solid transparent' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, ...mono }}>{s.lbl}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: '0 0 4px', ...mono }}>{s.val}</p>
              </div>
            ))}
          </div>
          {defensiblePreMoney.rationale && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 16, fontStyle: 'italic', lineHeight: 1.6 }}>{defensiblePreMoney.rationale}</p>
          )}
        </div>
      </div>

      {/* 2. Valuation Lenses Card */}
      <div style={{ ...glass({ padding: 24 }) }}>
        <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Valuation Lenses</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { name: 'Scorecard Method', value: fmt(scorecardValuation.impliedPreMoney), note: 'Weighted factor vs UK regional median' },
            { name: 'Berkus Method', value: fmt(berkusValuation.impliedPreMoney), note: 'Factor-based early-stage ceiling' },
            ...(comparableRoundsAnalysis ? [{ name: 'Comparable Rounds', value: fmt(comparableRoundsAnalysis.impliedRange.mid), note: `Range: ${fmt(comparableRoundsAnalysis.impliedRange.low)} – ${fmt(comparableRoundsAnalysis.impliedRange.high)}` }] : []),
            { name: 'VC Method (target consistency check)', value: fmt(vcMethodBackSolve.todayPreMoneyImplied), note: vcMethodBackSolve.methodology },
          ].map((lens, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRadius: 12, background: `${C.blue}06`, border: `1px solid ${C.blue}12` }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>{lens.name}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: C.blue, margin: '0 0 6px', ...mono }}>{lens.value}</p>
              <p style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{lens.note}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: C.textMuted, marginTop: 12, lineHeight: 1.6, fontStyle: 'italic' }}>
          The first three lenses are alternative pre-money triangulations. The VC Method back-solve is a different exercise — it answers "what would today's pre-money need to be for today's shareholders to retain the target exit return at 40% IRR after dilution to exit". It's a consistency check on the £750M target, not a competing valuation. The wide gap is expected: a single round structure with 50% dilution implies a much higher today-value than three rounds with cumulative ~80% dilution would. See the milestone path below for the realistic trajectory.
        </p>
      </div>

      {/* 3. vs Owner Stated (if applicable) */}
      {versusOwnerStated.ownerStatedPreMoney != null && (
        <div style={{ ...glass({ padding: 24 }), borderLeft: `4px solid ${verdictColors[versusOwnerStated.plausibilityVerdict]?.border || C.textMuted}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>vs Owner's Stated Valuation</h3>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
              background: verdictColors[versusOwnerStated.plausibilityVerdict]?.bg || C.textMuted,
              color: verdictColors[versusOwnerStated.plausibilityVerdict]?.text || '#fff',
            }}>
              {verdictLabels[versusOwnerStated.plausibilityVerdict] || versusOwnerStated.plausibilityVerdict}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 14 }}>
            <div>
              <p style={{ ...label }}>Owner States</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: C.text, ...mono }}>{fmt(versusOwnerStated.ownerStatedPreMoney!)}</p>
            </div>
            <div>
              <p style={{ ...label }}>Our Base Case</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: C.blue, ...mono }}>{fmt(defensiblePreMoney.base)}</p>
            </div>
            <div>
              <p style={{ ...label }}>Gap</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: versusOwnerStated.gapToBaseCase > 0 ? C.red : C.emerald, ...mono }}>
                {versusOwnerStated.gapToBaseCase > 0 ? '+' : ''}{fmt(versusOwnerStated.gapToBaseCase)}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}>{versusOwnerStated.rationale}</p>
        </div>
      )}

      {/* 4. Forward Suppressors */}
      {forwardSuppressors && forwardSuppressors.length > 0 && (
        <div style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${C.orange}` }}>
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Forward Suppressors</h3>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16 }}>Factors that could suppress valuation at next round if unresolved</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {forwardSuppressors.map((sup: any, i: number) => {
              const isEnhanced = sup.code && sup.pathToFix && sup.current;
              if (isEnhanced) {
                return <EnhancedSuppressorCard key={sup.code || i} suppressor={sup as EnhancedValueSuppressor} />;
              }
              const severityColor = sup.severity === 'CRITICAL' || sup.severity === 'critical' ? C.red
                : sup.severity === 'HIGH' || sup.severity === 'high' ? C.orange
                : sup.severity === 'MEDIUM' || sup.severity === 'medium' ? C.amber : C.textMuted;
              return (
                <div key={i} style={{ padding: '16px 18px', borderRadius: 12, border: `1px solid ${severityColor}30`, background: `${severityColor}04` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{sup.name || sup.title || `Suppressor ${i + 1}`}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: `${severityColor}15`, color: severityColor, textTransform: 'uppercase', ...mono }}>
                      {sup.severity || 'medium'}
                    </span>
                  </div>
                  {sup.evidence && <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.6, marginBottom: 8 }}>{sup.evidence}</p>}
                  {sup.methodology && typeof sup.methodology === 'string' && (
                    <p style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>{sup.methodology}</p>
                  )}
                  {sup.methodology && typeof sup.methodology === 'object' && sup.methodology.calibrationNote && (
                    <p style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>{sup.methodology.calibrationNote}</p>
                  )}
                  {sup.methodology && typeof sup.methodology === 'object' && sup.methodology.limitationsNote && (
                    <p style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic', marginTop: 4, opacity: 0.7 }}>{sup.methodology.limitationsNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Milestone Path */}
      {milestonePath && milestonePath.length > 0 && (
        <div style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${C.purple}` }}>
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Milestone Path to Step-Up</h3>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 20 }}>Key milestones that trigger valuation increases</p>
          <div style={{ position: 'relative' }}>
            {/* Connecting line */}
            <div style={{ position: 'absolute', left: 20, top: 20, bottom: 20, width: 2, background: `linear-gradient(180deg, ${C.purple}40, ${C.blue}40)` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {milestonePath.map((ms, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                  {/* Node */}
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0, zIndex: 1 }}>
                    {ms.milestoneNumber}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, padding: '14px 18px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', border: `1px solid ${C.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{ms.description}</span>
                      <span style={{ fontSize: 11, color: C.textMuted, ...mono }}>{ms.timeframeMonths}mo</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, ...mono }}>{fmt(ms.valuationStepUp.from)}</span>
                      <span style={{ fontSize: 16, color: C.purple }}>→</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.purple, ...mono }}>{fmt(ms.valuationStepUp.to)}</span>
                    </div>
                    {ms.arrTarget && <p style={{ fontSize: 11, color: C.blue, marginBottom: 4 }}>ARR target: {fmt(ms.arrTarget)}</p>}
                    {ms.blockers.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {ms.blockers.map((b, bi) => (
                          <span key={bi} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, background: `${C.orange}10`, color: C.orange, fontWeight: 500 }}>{b}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Caveats */}
      {caveats && caveats.length > 0 && (
        <div style={{ padding: '0 4px' }}>
          {caveats.map((caveat, i) => (
            <p key={i} style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 4 }}>
              • {caveat}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
