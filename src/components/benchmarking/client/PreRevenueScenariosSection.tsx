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

const fmt = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1000000) {
    const m = abs / 1000000;
    const formatted = Math.abs(m - Math.round(m)) < 1e-6 ? Math.round(m).toFixed(0) : m.toFixed(1);
    return sign + '£' + formatted + 'M';
  }
  if (abs >= 1000) return sign + '£' + Math.round(abs / 1000) + 'k';
  return sign + '£' + abs;
};

interface Scenario {
  scenarioName: string;
  inputs: Record<string, number | string>;
  outputs: Record<string, number | string>;
  valuationImpact?: { current: number; projected: number; delta: number };
  trajectoryImpact?: { milestoneInterpretation: string; gapClosed?: string };
  summary: string;
  methodology: string;
}

interface PreRevenueScenariosProps {
  scenarios: Scenario[];
  targetExitValuation: number;
}

const DEFAULT_TAB_LABELS = [
  'Pipeline Conversion',
  'Contract Term',
  'NRR Compounding',
  'Pricing Mix',
  'Dilution',
  'Time to Exit',
];

export function PreRevenueScenariosSection({ scenarios, targetExitValuation }: PreRevenueScenariosProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeScenario = scenarios[activeIdx] || scenarios[0];

  if (!scenarios?.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>Pre-Revenue Scenarios</h2>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
          Explore how different assumptions affect your trajectory to {fmt(targetExitValuation)} exit
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ ...glass({ padding: 24 }) }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap', background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 4 }}>
          {scenarios.map((s, i) => {
            const isActive = i === activeIdx;
            const tabLabel = s.scenarioName || DEFAULT_TAB_LABELS[i] || `Scenario ${i + 1}`;
            return (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#fff' : C.textSecondary,
                  background: isActive ? C.blue : 'transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>

        {/* Active scenario content */}
        {activeScenario && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Inputs */}
            <div style={{ padding: '16px 18px', borderRadius: 12, background: `${C.blue}04`, border: `1px solid ${C.blue}12` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, ...mono }}>Inputs</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {Object.entries(activeScenario.inputs).map(([key, val]) => (
                  <div key={key}>
                    <p style={{ fontSize: 11, color: C.textMuted, margin: '0 0 2px' }}>{key.replace(/_/g, ' ')}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0, ...mono }}>
                      {typeof val === 'number' ? (val >= 1000 ? fmt(val) : val.toLocaleString()) : val}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs */}
            <div style={{ padding: '16px 18px', borderRadius: 12, background: `${C.emerald}04`, border: `1px solid ${C.emerald}12` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.emerald, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, ...mono }}>Outputs</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {Object.entries(activeScenario.outputs).map(([key, val]) => {
                  if (Array.isArray(val)) {
                    if (!val.length) return null;
                    const columns = Object.keys(val[0]);
                    return (
                      <div key={key} style={{ marginBottom: 10, gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</p>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>{columns.map(col => <th key={col} style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)', fontSize: 10, color: C.textMuted, textTransform: 'capitalize' }}>{col.replace(/([A-Z])/g, ' $1').trim()}</th>)}</tr>
                          </thead>
                          <tbody>
                            {val.map((row: any, idx: number) => (
                              <tr key={idx}>{columns.map(col => {
                                const cell = row[col];
                                const isPct = col.toLowerCase().includes('pct') || col.toLowerCase().includes('ownership');
                                return <td key={col} style={{ padding: '4px 8px', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: 12 }}>{typeof cell === 'number' ? (isPct ? `${cell.toFixed(1)}%` : cell.toLocaleString()) : String(cell)}</td>;
                              })}</tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  if (typeof val === 'object' && val !== null) {
                    return (
                      <div key={key} style={{ marginBottom: 6 }}>
                        <p style={{ fontSize: 11, color: C.textMuted }}>{key.replace(/_/g, ' ')}</p>
                        <p style={{ fontSize: 13, color: C.text }}>{JSON.stringify(val)}</p>
                      </div>
                    );
                  }
                  return (
                    <div key={key}>
                      <p style={{ fontSize: 11, color: C.textMuted, margin: '0 0 2px' }}>{key.replace(/_/g, ' ')}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0, ...mono }}>
                        {typeof val === 'number' ? (Math.abs(val) >= 1000 ? fmt(val) : val.toLocaleString()) : String(val)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trajectory / Valuation impact card */}
            {activeScenario.trajectoryImpact ? (
              <div style={{ padding: '14px 18px', borderRadius: 10, background: `${C.blue}08`, border: `1px solid ${C.blue}15` }}>
                <p style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', ...mono }}>Trajectory Impact</p>
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6, margin: 0 }}>{activeScenario.trajectoryImpact.milestoneInterpretation}</p>
                {activeScenario.trajectoryImpact.gapClosed && (
                  <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4, margin: '4px 0 0' }}>{activeScenario.trajectoryImpact.gapClosed}</p>
                )}
              </div>
            ) : activeScenario.valuationImpact ? (
              <div style={{ padding: '18px 20px', borderRadius: 14, background: `linear-gradient(135deg, ${C.navy}, #1E293B)`, color: '#fff' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, ...mono }}>Valuation Impact</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', ...mono }}>Current</p>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: 0, ...mono }}>{fmt(activeScenario.valuationImpact.current)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', ...mono }}>Projected</p>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: C.emerald, ...mono }}>{fmt(activeScenario.valuationImpact.projected)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', ...mono }}>Delta</p>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: activeScenario.valuationImpact.delta >= 0 ? C.emerald : C.amber, ...mono }}>
                      {activeScenario.valuationImpact.delta >= 0 ? '+' : ''}{fmt(activeScenario.valuationImpact.delta)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Summary */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.02)' }}>
              <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.7, margin: 0 }}>{activeScenario.summary}</p>
            </div>

            {/* Methodology */}
            {activeScenario.methodology && (
              <p style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                Methodology: {activeScenario.methodology}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
