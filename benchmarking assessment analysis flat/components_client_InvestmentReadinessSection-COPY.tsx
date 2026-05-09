import React from 'react';

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
  lg: '0 12px 32px rgba(22,35,64,0.12), 0 4px 12px rgba(22,35,64,0.08)',
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

interface ComponentBreakdown {
  score: number;
  max: number;
  gaps: string[];
  strengths?: string[];
}

interface InvestmentReadinessSectionProps {
  breakdown: {
    score: number;
    verdict: 'investment_ready' | 'needs_preparation' | 'not_ready';
    components: Record<string, ComponentBreakdown>;
    overallGaps: string[];
    overallStrengths: string[];
  };
}

const COMPONENT_LABELS: Record<string, string> = {
  pipeline_quality: 'Pipeline Quality',
  team_hires: 'Team & Hires',
  cap_table_governance: 'Cap Table & Governance',
  forecast_credibility: 'Forecast Credibility',
  data_room_ip: 'Data Room & IP',
};

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  investment_ready: { label: 'Investment Ready', color: C.emerald, bg: `${C.emerald}15` },
  needs_preparation: { label: 'Needs Preparation', color: C.amber, bg: `${C.amber}15` },
  not_ready: { label: 'Not Ready', color: C.red, bg: `${C.red}15` },
};

export function InvestmentReadinessSection({ breakdown }: InvestmentReadinessSectionProps) {
  const { score, verdict, components, overallGaps, overallStrengths } = breakdown;
  const verdictCfg = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.needs_preparation;
  const scoreColor = score >= 65 ? C.emerald : score >= 45 ? C.amber : C.red;
  const scorePct = Math.min(100, (score / 100) * 100);

  const componentEntries = Object.entries(components);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero card with score ring */}
      <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '36px 40px', border: 'none', boxShadow: SHADOW.lg }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          {/* Score ring */}
          <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
            <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
              <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              <circle
                cx="80" cy="80" r="66" fill="none" stroke={scoreColor} strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(scorePct / 100) * 2 * Math.PI * 66} ${2 * Math.PI * 66}`}
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dasharray 1.2s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', ...mono }}>{score}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', ...mono }}>/100</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Investment Readiness</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 14 }}>How prepared is your business for investment?</p>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 20, background: verdictCfg.bg, color: verdictCfg.color, ...mono }}>
              {verdictCfg.label}
            </span>
            <div style={{ marginTop: 16, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${scorePct}%`, background: scoreColor, borderRadius: 3, transition: 'width 1.2s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Component breakdown */}
      <div style={{ ...glass({ padding: 24 }) }}>
        <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Component Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {componentEntries.map(([key, comp]) => {
            const label = COMPONENT_LABELS[key] || key.replace(/_/g, ' ');
            const pct = (comp.score / comp.max) * 100;
            const barColor = pct >= 70 ? C.emerald : pct >= 50 ? C.amber : C.red;

            return (
              <div key={key} style={{ padding: '16px 18px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, background: 'rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: barColor, ...mono }}>{comp.score}/{comp.max}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
                {comp.gaps.length > 0 && (
                  <div style={{ marginBottom: comp.strengths?.length ? 6 : 0 }}>
                    {comp.gaps.map((gap, i) => (
                      <p key={i} style={{ fontSize: 12, color: C.amber, margin: '2px 0', lineHeight: 1.5 }}>• {gap}</p>
                    ))}
                  </div>
                )}
                {comp.strengths && comp.strengths.length > 0 && (
                  <div>
                    {comp.strengths.map((s, i) => (
                      <p key={i} style={{ fontSize: 12, color: C.emerald, margin: '2px 0', lineHeight: 1.5 }}>✓ {s}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths */}
      {overallStrengths.length > 0 && (
        <div style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${C.emerald}` }}>
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Investment Strengths</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {overallStrengths.map((s, i) => (
              <p key={i} style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>✓ {s}</p>
            ))}
          </div>
        </div>
      )}

      {/* Path to Investment Ready */}
      {score < 65 && overallGaps.length > 0 && (
        <div style={{ ...glass({ padding: 24 }), borderTop: `3px solid ${C.purple}` }}>
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Path to Investment Ready (65+)</h3>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 14 }}>Top actions to close the gap</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {overallGaps.slice(0, 3).map((gap, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>{gap}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
