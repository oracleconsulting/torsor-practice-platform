// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEMS MAP VISUALIZATION — FULL FIDELITY (platform admin client preview)
// ═══════════════════════════════════════════════════════════════════════════════
// Mirrors apps/client-portal SystemsMapSection. Reads pass1_data.systemsMaps
// or falls back to buildMapsFromFacts(facts).
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const CATEGORY_COLORS: Record<string, string> = {
  accounting_software: '#10b981', accounting: '#10b981',
  time_tracking: '#f59e0b', project_management: '#3b82f6',
  expense_management: '#8b5cf6', chat_messaging: '#ec4899',
  document_management: '#06b6d4', email: '#06b6d4',
  payment_collection: '#f97316', email_marketing: '#a855f7',
  design: '#e11d48', spreadsheet: '#64748b', crm: '#14b8a6',
  psa: '#6366f1', middleware: '#facc15', other: '#64748b',
};

const STATUS_COLORS: Record<string, string> = {
  red: '#ef4444', amber: '#f59e0b', green: '#22c55e', blue: '#3b82f6', grey: '#475569',
};

const MAP_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
const MAP_LABELS = ['Today', 'Native Fixes', 'Connected', 'Optimal'];

const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] || '#64748b';

const num = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function AnimatedNumber({ value, prefix = '', duration = 800 }: { value: number; prefix?: string; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    prevRef.current = value;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span>{prefix}{display.toLocaleString()}</span>;
}

function Particle({ x1, y1, x2, y2, color, delay }: { x1: number; y1: number; x2: number; y2: number; color: string; delay: number }) {
  return (
    <circle r="2.5" fill={color} opacity="0.8">
      <animateMotion dur="2.5s" repeatCount="indefinite" begin={`${delay}s`} path={`M${x1},${y1} L${x2},${y2}`} />
      <animate attributeName="opacity" values="0;0.9;0.9;0" dur="2.5s" repeatCount="indefinite" begin={`${delay}s`} />
    </circle>
  );
}

function SystemNode({ id, name, category, cost, x, y, status, replaces, isActive, onClick }: {
  id: string; name: string; category: string; cost: number; x: number; y: number; status?: string; replaces?: string[];
  isActive: boolean; onClick: (id: string) => void;
}) {
  const color = getCategoryColor(category);
  const r = 32;
  const x_ = num(x, 0);
  const y_ = num(y, 0);
  return (
    <g transform={`translate(${x_}, ${y_})`} onClick={() => onClick(id)} style={{ cursor: 'pointer' }}>
      <circle r={r + 12} fill="none" stroke={color} strokeWidth="1" opacity={isActive ? 0.3 : 0.1} />
      <circle r={r + 6} fill="none" stroke={color} strokeWidth="0.5" opacity={isActive ? 0.2 : 0.05} />
      <circle r={r} fill={`${color}15`} stroke={color} strokeWidth={status === 'new' ? 2.5 : 1.5} />
      {status === 'new' && (
        <g transform={`translate(${r - 4}, ${-r + 4})`}>
          <circle r="8" fill="#22c55e" />
          <text textAnchor="middle" y="3.5" fill="#fff" fontSize="8" fontWeight="700">+</text>
        </g>
      )}
      {status === 'reconfigure' && (
        <g transform={`translate(${r - 4}, ${-r + 4})`}>
          <circle r="8" fill="#f59e0b" />
          <text textAnchor="middle" y="3.5" fill="#fff" fontSize="8" fontWeight="700">⟳</text>
        </g>
      )}
      <text textAnchor="middle" y="4" fill="#e2e8f0" fontSize="10" fontWeight="600" fontFamily="'DM Sans', sans-serif">
        {name.length > 12 ? name.slice(0, 11) + '…' : name}
      </text>
      <text textAnchor="middle" y={r + 16} fill="#94a3b8" fontSize="9" fontFamily="'JetBrains Mono', monospace">
        {cost === 0 ? 'Free' : `£${cost}/mo`}
      </text>
      {replaces && replaces.length > 0 && (
        <text textAnchor="middle" y={r + 30} fill="#64748b" fontSize="7.5" fontFamily="'DM Sans', sans-serif" fontStyle="italic">
          Replaces: {replaces.join(', ')}
        </text>
      )}
    </g>
  );
}

function IntegrationEdge({ x1, y1, x2, y2, status, label, changed, person }: {
  x1: number; y1: number; x2: number; y2: number; status: string; label?: string; changed?: boolean; person?: string;
}) {
  const x1_ = num(x1, 0);
  const y1_ = num(y1, 0);
  const x2_ = num(x2, 0);
  const y2_ = num(y2, 0);
  const color = STATUS_COLORS[status] || '#475569';
  const isDashed = status === 'red' || status === 'amber';
  const showParticles = status === 'green' || status === 'blue';
  const midX = (x1_ + x2_) / 2;
  const midY = (y1_ + y2_) / 2;
  const dx = x2_ - x1_;
  const dy = y2_ - y1_;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const nx = dx / len;
  const ny = dy / len;
  const offset = 36;
  const sx = x1_ + nx * offset;
  const sy = y1_ + ny * offset;
  const ex = x2_ - nx * offset;
  const ey = y2_ - ny * offset;
  const labelLen = label?.length || 0;
  return (
    <g>
      {(status === 'green' || status === 'blue') && (
        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth="6" opacity="0.15" strokeLinecap="round" />
      )}
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth={changed ? 2.5 : 1.5}
        strokeDasharray={isDashed ? '6,4' : 'none'} opacity={status === 'red' ? 0.6 : 0.9} strokeLinecap="round" />
      {showParticles && (
        <>
          <Particle x1={sx} y1={sy} x2={ex} y2={ey} color={color} delay={0} />
          <Particle x1={sx} y1={sy} x2={ex} y2={ey} color={color} delay={0.8} />
          <Particle x1={sx} y1={sy} x2={ex} y2={ey} color={color} delay={1.6} />
        </>
      )}
      {label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect x={-labelLen * 3.2 - 6} y="-9" width={labelLen * 6.4 + 12} height="18" rx="4" fill="#0f172a" stroke={color} strokeWidth="0.5" opacity="0.9" />
          <text textAnchor="middle" y="3.5" fill={color} fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="500">{label}</text>
        </g>
      )}
      {person && (
        <g transform={`translate(${midX}, ${midY + 18})`}>
          <rect x="-20" y="-7" width="40" height="14" rx="7" fill="#ef444430" stroke="#ef4444" strokeWidth="0.5" />
          <text textAnchor="middle" y="3" fill="#fca5a5" fontSize="7" fontFamily="'DM Sans', sans-serif" fontWeight="600">{person}</text>
        </g>
      )}
    </g>
  );
}

function MiddlewareHub({ name, x, y, cost }: { name: string; x: number; y: number; cost: number }) {
  const x_ = num(x, 400);
  const y_ = num(y, 340);
  return (
    <g transform={`translate(${x_}, ${y_})`}>
      <circle r="22" fill="#facc1510" stroke="#facc15" strokeWidth="1" strokeDasharray="3,3" />
      <text textAnchor="middle" y="4" fill="#facc15" fontSize="9" fontWeight="600" fontFamily="'DM Sans', sans-serif">{name}</text>
      <text textAnchor="middle" y="38" fill="#94a3b8" fontSize="8" fontFamily="'JetBrains Mono', monospace">£{cost}/mo</text>
    </g>
  );
}

function buildMapsFromFacts(facts: any): any[] {
  if (!facts?.systems || facts.systems.length === 0) return [];
  const systems = facts.systems;
  const integrationGaps = facts.integrationGaps || [];
  const centerX = 400, centerY = 290, radiusLayout = 180;
  const nodesObj: Record<string, any> = {};
  systems.forEach((sys: any, i: number) => {
    const angle = (2 * Math.PI * i) / systems.length - Math.PI / 2;
    const id = sys.name.toLowerCase().replace(/[\s.]+/g, '_');
    nodesObj[id] = { name: sys.name, category: sys.category, cost: sys.monthlyCost || 0, x: Math.round(centerX + radiusLayout * Math.cos(angle)), y: Math.round(centerY + radiusLayout * Math.sin(angle)) };
  });
  const edges: any[] = [];
  const addedEdges = new Set<string>();
  systems.forEach((sys: any) => {
    const fromId = sys.name.toLowerCase().replace(/[\s.]+/g, '_');
    (sys.integratesWith || []).forEach((partner: string) => {
      const toId = partner.toLowerCase().replace(/[\s.]+/g, '_');
      const edgeKey = [fromId, toId].sort().join('|');
      if (nodesObj[toId] && !addedEdges.has(edgeKey)) {
        addedEdges.add(edgeKey);
        const hasIssues = (sys.gaps || []).some((g: string) => g.toLowerCase().includes(partner.toLowerCase()));
        edges.push({ from: fromId, to: toId, status: hasIssues ? 'amber' : 'green', label: hasIssues ? 'Issues' : 'Connected' });
      }
    });
  });
  const disconnected = facts.disconnectedSystems || [];
  disconnected.forEach((sysName: string) => {
    const sysId = sysName.toLowerCase().replace(/[\s.]+/g, '_');
    if (!nodesObj[sysId]) return;
    const gap = integrationGaps.find((g: string) => g.toLowerCase().includes(sysName.toLowerCase()));
    if (gap) {
      const other = systems.find((s: any) => s.name !== sysName && gap.toLowerCase().includes(s.name.toLowerCase()));
      if (other) {
        const toId = other.name.toLowerCase().replace(/[\s.]+/g, '_');
        const edgeKey = [sysId, toId].sort().join('|');
        if (!addedEdges.has(edgeKey)) {
          addedEdges.add(edgeKey);
          edges.push({ from: sysId, to: toId, status: 'red', label: 'No connection' });
        }
      }
    }
  });
  const totalCost = systems.reduce((s: number, sys: any) => s + (sys.monthlyCost || 0), 0);
  const greenCount = edges.filter((e: any) => e.status === 'green').length;
  return [{
    title: 'Where You Are Today',
    subtitle: 'Current system connections',
    recommended: false,
    nodes: nodesObj,
    edges,
    middlewareHub: null,
    metrics: { monthlySoftware: totalCost, manualHours: facts.hoursWastedWeekly || 0, annualWaste: facts.annualCostOfChaos || 0, annualSavings: 0, investment: 0, payback: '—', integrations: `${greenCount} / ${systems.length}`, risk: 'Critical' },
  }];
}

export default function SystemsMapSection({ systemsMaps, facts }: { systemsMaps: any; facts: any }) {
  const [activeMap, setActiveMap] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const maps = useMemo(() => {
    if (systemsMaps && Array.isArray(systemsMaps) && systemsMaps.length > 0) return systemsMaps;
    return buildMapsFromFacts(facts);
  }, [systemsMaps, facts]);

  const switchMap = useCallback((idx: number) => {
    if (idx === activeMap) return;
    setIsTransitioning(true);
    setTimeout(() => { setActiveMap(idx); setTimeout(() => setIsTransitioning(false), 100); }, 200);
  }, [activeMap]);

  if (!maps || maps.length === 0) return null;

  const current = maps[activeMap] || maps[0];
  const nodesObj: Record<string, any> = Array.isArray(current.nodes)
    ? current.nodes.reduce((acc: any, n: any) => { acc[n.id] = n; return acc; }, {})
    : (current.nodes || {});
  const edges = current.edges || [];
  const metrics = current.metrics || {};
  const hub = current.middlewareHub || null;

  return (
    <div style={{ background: 'linear-gradient(145deg, #020617 0%, #0f172a 40%, #1e1b4b08 100%)', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', padding: '24px', borderRadius: '16px' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '3px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', fontFamily: "'JetBrains Mono', monospace" }}>Systems Audit · Technology Roadmap</div>
        <h2 style={{ fontSize: '28px', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>From Chaos to Connected</h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{maps.length > 1 ? 'Four levels of integration maturity' : 'Your current system connections'}</p>
      </div>
      {maps.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '20px' }}>
          {maps.map((_: any, i: number) => {
            const mapColor = MAP_COLORS[i] || '#64748b';
            const label = MAP_LABELS[i] || `Level ${i + 1}`;
            const isRecommended = maps[i]?.recommended || maps[i]?.recommendedLevel;
            return (
              <button key={i} onClick={() => switchMap(i)} style={{ background: activeMap === i ? `${mapColor}20` : 'transparent', border: `1px solid ${activeMap === i ? mapColor : '#1e293b'}`, color: activeMap === i ? mapColor : '#64748b', padding: '8px 20px', borderRadius: i === 0 ? '8px 0 0 8px' : i === maps.length - 1 ? '0 8px 8px 0' : '0', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", marginRight: '6px', opacity: 0.5, fontSize: '10px' }}>{i + 1}</span>{label}
                {isRecommended && <span style={{ position: 'absolute', top: '-8px', right: '-4px', background: '#3b82f6', color: '#fff', fontSize: '7px', padding: '2px 5px', borderRadius: '4px', fontWeight: 700 }}>REC</span>}
              </button>
            );
          })}
        </div>
      )}
      <div style={{ textAlign: 'center', marginBottom: '8px', padding: '8px', background: `${MAP_COLORS[activeMap] || '#64748b'}08`, borderRadius: '8px', border: `1px solid ${MAP_COLORS[activeMap] || '#64748b'}20` }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: MAP_COLORS[activeMap] || '#64748b' }}>{current.title || MAP_LABELS[activeMap] || 'Systems Map'}</h3>
        {current.subtitle && <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>{current.subtitle}</p>}
      </div>
      <div style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden', position: 'relative', marginBottom: '16px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, #1e293b40 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <svg viewBox="0 0 800 580" style={{ width: '100%', height: 'auto', opacity: isTransitioning ? 0.3 : 1, transition: 'opacity 0.2s ease' }}>
          {hub && <MiddlewareHub name={hub.name || 'Zapier'} x={hub.x || 400} y={hub.y || 340} cost={hub.cost || 50} />}
          {edges.map((edge: any) => {
            const from = nodesObj[edge.from];
            const to = nodesObj[edge.to];
            if (!from || !to) return null;
            return (
              <IntegrationEdge key={`${edge.from}-${edge.to}-${activeMap}`} x1={num(from.x, 0)} y1={num(from.y, 0)} x2={num(to.x, 0)} y2={num(to.y, 0)} status={edge.status} label={edge.label} changed={edge.changed} person={edge.person} />
            );
          })}
          {Object.entries(nodesObj).map(([id, sys]: [string, any]) => (
            <SystemNode key={`${id}-${activeMap}`} id={id} name={sys.name} category={sys.category} cost={sys.cost || 0} x={num(sys.x, 0)} y={num(sys.y, 0)} status={sys.status} replaces={sys.replaces} isActive={hoveredNode === id} onClick={setHoveredNode} />
          ))}
        </svg>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Software/mo', value: metrics.monthlySoftware || 0, prefix: '£' },
          { label: 'Manual hrs/wk', value: metrics.manualHours || 0, highlight: true },
          { label: 'Annual waste', value: metrics.annualWaste || 0, prefix: '£' },
          { label: 'Annual savings', value: metrics.annualSavings ?? metrics.annualSavingsVsMap1 ?? 0, prefix: '£', accent: true },
        ].map((item, i) => (
          <div key={i} style={{ background: item.accent ? `${MAP_COLORS[activeMap]}10` : '#0f172a', border: `1px solid ${item.accent ? MAP_COLORS[activeMap] + '40' : '#1e293b'}`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{item.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: item.accent ? MAP_COLORS[activeMap] : (item.highlight && item.value > 20 ? '#ef4444' : '#e2e8f0') }}>
              <AnimatedNumber value={item.value} prefix={item.prefix || ''} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {[
          { label: 'Investment', value: (metrics.investment || 0) === 0 ? '£0' : `£${(metrics.investment || 0).toLocaleString()}` },
          { label: 'Payback', value: metrics.payback || '—' },
          { label: 'Integrations', value: metrics.integrations || '—' },
          { label: 'Key person risk', value: metrics.risk || '—', color: metrics.risk === 'Critical' ? '#ef4444' : metrics.risk === 'High' ? '#f59e0b' : metrics.risk === 'Moderate' ? '#eab308' : metrics.risk === 'Low' ? '#3b82f6' : '#22c55e' },
        ].map((item, i) => (
          <div key={i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{item.label}</div>
            <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: (item as any).color || '#e2e8f0' }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        {[{ color: '#ef4444', label: 'No connection', dash: true }, { color: '#f59e0b', label: 'Partial / broken', dash: true }, { color: '#22c55e', label: 'Active integration', dash: false }, { color: '#3b82f6', label: 'New at this level', dash: false }].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke={item.color} strokeWidth="2" strokeDasharray={item.dash ? '4,3' : 'none'} /></svg>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Stack Explanation */}
      {current.changes && current.changes.length > 0 && (
        <div style={{ marginTop: '20px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>{activeMap === 0 ? '🔍' : activeMap === 1 ? '🔧' : activeMap === 2 ? '🔗' : '🚀'}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: MAP_COLORS[activeMap] || '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
              {activeMap === 0 ? "What's broken and why" : activeMap === 1 ? "What we fix for free" : activeMap === 2 ? "What middleware bridges" : "Why these replacements"}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>
              {current.changes.length} {current.changes.length === 1 ? 'change' : 'changes'}
            </span>
          </div>
          {current.changes.map((change: any, i: number) => {
            const actionColors: Record<string, string> = { broken: '#ef4444', fixed: '#22c55e', connected: '#3b82f6', added: '#22c55e', reconfigured: '#f59e0b', kept: '#64748b' };
            const actionLabels: Record<string, string> = { broken: 'Issue', fixed: 'Fixed', connected: 'Connected', added: 'New', reconfigured: 'Reconfigured', kept: 'Unchanged' };
            const color = actionColors[change.action] || '#64748b';
            const label = actionLabels[change.action] || change.action;
            return (
              <div key={i} style={{ padding: '14px 20px', borderBottom: i < current.changes.length - 1 ? '1px solid #1e293b' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '2px 8px', borderRadius: '4px', background: `${color}15`, border: `1px solid ${color}30`, fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>{change.system}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 8px 0', fontFamily: "'DM Sans', sans-serif" }}>{change.description}</p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {change.impact && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>IMPACT</span>
                      <span style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: "'DM Sans', sans-serif" }}>{change.impact}</span>
                    </div>
                  )}
                  {change.cost && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>COST</span>
                      <span style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: "'DM Sans', sans-serif" }}>{change.cost}</span>
                    </div>
                  )}
                </div>
                {change.why && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: '#22c55e08', borderLeft: '2px solid #22c55e40', borderRadius: '0 6px 6px 0' }}>
                    <span style={{ fontSize: '11px', color: '#86efac', fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif", lineHeight: '1.5' }}>{change.why}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
