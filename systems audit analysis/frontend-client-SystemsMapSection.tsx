// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEMS MAP VISUALIZATION — FULL FIDELITY
// ═══════════════════════════════════════════════════════════════════════════════
// 1:1 implementation of SystemsMapVisualization.jsx prototype
// Reads from pass1_data.systemsMaps (4 levels) when available
// Falls back to basic single-level map from facts.systems when null
//
// DATA CONTRACT (what Phase 4b should generate for systemsMaps):
// [
//   {
//     title: "Where You Are Today",
//     subtitle: "The reality",
//     recommended: false,
//     nodes: { "xero": { name, category, cost, x, y, status?, replaces?: string[] } },
//     edges: [{ from, to, status, label, changed?, middleware?, person? }],
//     middlewareHub: null | { name, x, y, cost },
//     metrics: { monthlySoftware, manualHours, annualWaste, annualSavings,
//                investment, payback, integrations, risk }
//   },
//   ... // 4 maps total
// ]
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Colours ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  accounting_software: '#10b981', accounting: '#10b981',
  time_tracking: '#f59e0b',
  project_management: '#3b82f6',
  expense_management: '#8b5cf6',
  chat_messaging: '#ec4899',
  document_management: '#06b6d4', email: '#06b6d4',
  payment_collection: '#f97316',
  email_marketing: '#a855f7',
  design: '#e11d48',
  spreadsheet: '#64748b',
  crm: '#14b8a6',
  psa: '#6366f1',
  middleware: '#facc15',
  other: '#64748b',
};

const STATUS_COLORS: Record<string, string> = {
  red: '#ef4444', amber: '#f59e0b', green: '#22c55e', blue: '#3b82f6', grey: '#475569',
};

const MAP_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
const MAP_LABELS = ['Today', 'Native Fixes', 'Connected', 'Optimal'];

const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] || '#64748b';

/** Normalize edge status so IntegrationEdge gets red/amber/green/blue for correct colours, dash and particles. */
function normalizeEdgeStatus(edge: { status?: string; colour?: string }): 'red' | 'amber' | 'green' | 'blue' {
  const s = (edge.status || edge.colour || '').toLowerCase();
  if (s === 'red' || s === 'amber' || s === 'green' || s === 'blue') return s as 'red' | 'amber' | 'green' | 'blue';
  if (s === 'active' || s === 'native_new' || s === 'middleware') return 'green';
  if (s === 'broken' || s === 'none' || s === 'off' || s === 'manual') return 'red';
  return 'amber';
}

/** Coerce to number for SVG attributes; avoids NaN/undefined. */
const num = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ─── AnimatedNumber ──────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 800 }: {
  value: number; prefix?: string; suffix?: string; duration?: number;
}) {
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ─── Particle ────────────────────────────────────────────────────────────────

function Particle({ x1, y1, x2, y2, color, delay }: {
  x1: number; y1: number; x2: number; y2: number; color: string; delay: number;
}) {
  return (
    <circle r="2.5" fill={color} opacity="0.8">
      <animateMotion
        dur="2.5s"
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={`M${x1},${y1} L${x2},${y2}`}
      />
      <animate attributeName="opacity" values="0;0.9;0.9;0" dur="2.5s"
        repeatCount="indefinite" begin={`${delay}s`} />
    </circle>
  );
}

// ─── SystemNode ──────────────────────────────────────────────────────────────

function SystemNode({ id, name, category, cost, x, y, status, replaces, isActive, onClick }: {
  id: string; name: string; category: string; cost: number;
  x: number; y: number; status?: string; replaces?: string[];
  isActive: boolean; onClick: (id: string) => void;
}) {
  const color = getCategoryColor(category);
  const r = 32;
  const x_ = num(x, 0);
  const y_ = num(y, 0);

  return (
    <g
      transform={`translate(${x_}, ${y_})`}
      onClick={() => onClick(id)}
      style={{ cursor: 'pointer', transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      {/* Outer glow */}
      <circle r={r + 12} fill="none" stroke={color} strokeWidth="1"
        opacity={isActive ? 0.3 : 0.1}>
        {isActive && (
          <animate attributeName="r" values={`${r + 8};${r + 16};${r + 8}`}
            dur="3s" repeatCount="indefinite" />
        )}
      </circle>
      <circle r={r + 6} fill="none" stroke={color} strokeWidth="0.5"
        opacity={isActive ? 0.2 : 0.05} />

      {/* Main circle */}
      <circle r={r} fill={`${color}15`} stroke={color}
        strokeWidth={status === 'new' ? 2.5 : 1.5}
        style={{ transition: 'all 0.4s ease' }} />

      {/* Status badge: new */}
      {status === 'new' && (
        <g transform={`translate(${r - 4}, ${-r + 4})`}>
          <circle r="8" fill="#22c55e" />
          <text textAnchor="middle" y="3.5" fill="#fff" fontSize="8" fontWeight="700">+</text>
        </g>
      )}

      {/* Status badge: reconfigure */}
      {status === 'reconfigure' && (
        <g transform={`translate(${r - 4}, ${-r + 4})`}>
          <circle r="8" fill="#f59e0b" />
          <text textAnchor="middle" y="3.5" fill="#fff" fontSize="8" fontWeight="700">⟳</text>
        </g>
      )}

      {/* Name */}
      <text textAnchor="middle" y="4" fill="#e2e8f0" fontSize="10" fontWeight="600"
        fontFamily="'DM Sans', sans-serif">
        {name.length > 12 ? name.slice(0, 11) + '…' : name}
      </text>

      {/* Cost below */}
      <text textAnchor="middle" y={r + 16} fill="#94a3b8" fontSize="9"
        fontFamily="'JetBrains Mono', monospace">
        {cost === 0 ? 'Free' : `£${cost}/mo`}
      </text>

      {/* Replaces tag */}
      {replaces && replaces.length > 0 && (
        <text textAnchor="middle" y={r + 30} fill="#64748b" fontSize="7.5"
          fontFamily="'DM Sans', sans-serif" fontStyle="italic">
          Replaces: {replaces.join(', ')}
        </text>
      )}
    </g>
  );
}

// ─── IntegrationEdge ─────────────────────────────────────────────────────────

function IntegrationEdge({ x1, y1, x2, y2, status, label, changed, middleware, person }: {
  x1: number; y1: number; x2: number; y2: number;
  status: string; label?: string; changed?: boolean; middleware?: boolean; person?: string;
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

  // Offset to avoid overlapping node circles
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
    <g style={{ transition: 'all 0.6s ease' }}>
      {/* Glow for active lines */}
      {(status === 'green' || status === 'blue') && (
        <line x1={sx} y1={sy} x2={ex} y2={ey}
          stroke={color} strokeWidth="6" opacity="0.15" strokeLinecap="round" />
      )}

      {/* Main line */}
      <line x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={color}
        strokeWidth={changed ? 2.5 : 1.5}
        strokeDasharray={isDashed ? '6,4' : 'none'}
        opacity={status === 'red' ? 0.6 : 0.9}
        strokeLinecap="round">
        {isDashed && (
          <animate attributeName="stroke-dashoffset" values="0;20"
            dur="1.5s" repeatCount="indefinite" />
        )}
      </line>

      {/* Data flow particles */}
      {showParticles && (
        <>
          <Particle x1={sx} y1={sy} x2={ex} y2={ey} color={color} delay={0} />
          <Particle x1={sx} y1={sy} x2={ex} y2={ey} color={color} delay={0.8} />
          <Particle x1={sx} y1={sy} x2={ex} y2={ey} color={color} delay={1.6} />
        </>
      )}

      {/* Label */}
      {label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-labelLen * 3.2 - 6} y="-9"
            width={labelLen * 6.4 + 12} height="18"
            rx="4" fill="#0f172a" stroke={color} strokeWidth="0.5" opacity="0.9"
          />
          <text textAnchor="middle" y="3.5" fill={color} fontSize="8"
            fontFamily="'JetBrains Mono', monospace" fontWeight="500">
            {label}
          </text>
        </g>
      )}

      {/* Person badge */}
      {person && (
        <g transform={`translate(${midX}, ${midY + 18})`}>
          <rect x="-20" y="-7" width="40" height="14" rx="7"
            fill="#ef444430" stroke="#ef4444" strokeWidth="0.5" />
          <text textAnchor="middle" y="3" fill="#fca5a5" fontSize="7"
            fontFamily="'DM Sans', sans-serif" fontWeight="600">
            {person}
          </text>
        </g>
      )}

      {/* Changed indicator dot */}
      {changed && label && (
        <circle
          cx={midX + labelLen * 3.2 + 12} cy={midY} r="4"
          fill={status === 'blue' ? '#3b82f6' : '#22c55e'}>
          <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

// ─── MiddlewareHub ───────────────────────────────────────────────────────────

function MiddlewareHub({ name, x, y, cost }: {
  name: string; x: number; y: number; cost: number;
}) {
  const x_ = num(x, 400);
  const y_ = num(y, 340);
  return (
    <g transform={`translate(${x_}, ${y_})`}>
      <circle r="22" fill="#facc1510" stroke="#facc15" strokeWidth="1" strokeDasharray="3,3">
        <animate attributeName="r" values="18;24;18" dur="4s" repeatCount="indefinite" />
      </circle>
      <text textAnchor="middle" y="4" fill="#facc15" fontSize="9" fontWeight="600"
        fontFamily="'DM Sans', sans-serif">
        {name}
      </text>
      <text textAnchor="middle" y="38" fill="#94a3b8" fontSize="8"
        fontFamily="'JetBrains Mono', monospace">
        £{cost}/mo
      </text>
    </g>
  );
}

// ─── Fallback map builder ────────────────────────────────────────────────────

function buildMapsFromFacts(facts: any): any[] {
  if (!facts?.systems || facts.systems.length === 0) return [];

  const systems = facts.systems;
  const integrationGaps = facts.integrationGaps || [];

  // Position systems in a circle layout
  const centerX = 400, centerY = 290;
  const radiusLayout = 180;
  const nodesObj: Record<string, any> = {};

  systems.forEach((sys: any, i: number) => {
    const angle = (2 * Math.PI * i) / systems.length - Math.PI / 2;
    const id = sys.name.toLowerCase().replace(/[\s.]+/g, '_');
    nodesObj[id] = {
      name: sys.name,
      category: sys.category,
      cost: sys.monthlyCost || 0,
      x: Math.round(centerX + radiusLayout * Math.cos(angle)),
      y: Math.round(centerY + radiusLayout * Math.sin(angle)),
    };
  });

  // Build edges from integration data
  const edges: any[] = [];
  const addedEdges = new Set<string>();

  systems.forEach((sys: any) => {
    const fromId = sys.name.toLowerCase().replace(/[\s.]+/g, '_');
    (sys.integratesWith || []).forEach((partner: string) => {
      const toId = partner.toLowerCase().replace(/[\s.]+/g, '_');
      const edgeKey = [fromId, toId].sort().join('|');
      if (nodesObj[toId] && !addedEdges.has(edgeKey)) {
        addedEdges.add(edgeKey);
        const hasIssues = (sys.gaps || []).some((g: string) =>
          g.toLowerCase().includes(partner.toLowerCase())
        );
        edges.push({
          from: fromId, to: toId,
          status: hasIssues ? 'amber' : 'green',
          label: hasIssues ? 'Issues' : 'Connected',
        });
      }
    });
  });

  // Red edges for disconnected systems
  const disconnected = facts.disconnectedSystems || [];
  disconnected.forEach((sysName: string) => {
    const sysId = sysName.toLowerCase().replace(/[\s.]+/g, '_');
    if (!nodesObj[sysId]) return;
    const gap = integrationGaps.find((g: string) =>
      g.toLowerCase().includes(sysName.toLowerCase())
    );
    if (gap) {
      const other = systems.find((s: any) =>
        s.name !== sysName && gap.toLowerCase().includes(s.name.toLowerCase())
      );
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
    metrics: {
      monthlySoftware: totalCost,
      manualHours: facts.hoursWastedWeekly || 0,
      annualWaste: facts.annualCostOfChaos || 0,
      annualSavings: 0,
      investment: 0,
      payback: '—',
      integrations: `${greenCount} / ${systems.length}`,
      risk: 'Critical',
    },
  }];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SystemsMapSection({ systemsMaps, facts, layout = 'stacked' }: {
  systemsMaps: any; facts: any; layout?: 'stacked' | 'split';
}) {
  const [activeMap, setActiveMap] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const maps = useMemo(() => {
    if (systemsMaps && Array.isArray(systemsMaps) && systemsMaps.length > 0) {
      return systemsMaps;
    }
    return buildMapsFromFacts(facts);
  }, [systemsMaps, facts]);

  const switchMap = useCallback((idx: number) => {
    if (idx === activeMap) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveMap(idx);
      setTimeout(() => setIsTransitioning(false), 100);
    }, 200);
  }, [activeMap]);

  if (!maps || maps.length === 0) return null;

  const current = maps[activeMap] || maps[0];

  // Nodes can be object { id: {...} } or array [{ id, ... }]
  const nodesRaw: Record<string, any> = Array.isArray(current.nodes)
    ? current.nodes.reduce((acc: any, n: any) => { acc[n.id] = n; return acc; }, {})
    : (current.nodes || {});

  // Auto-layout: if any node lacks valid x/y, position all in a circle
  const nodesObj = useMemo(() => {
    const entries = Object.entries(nodesRaw);
    if (entries.length === 0) return nodesRaw;

    const needsLayout = entries.some(
      ([, n]) => typeof n.x !== 'number' || typeof n.y !== 'number' || !isFinite(n.x) || !isFinite(n.y)
    );
    if (!needsLayout) return nodesRaw;

    const centerX = 400, centerY = 290, radius = 180;
    const laid: Record<string, any> = {};
    entries.forEach(([id, node], i) => {
      const angle = (2 * Math.PI * i) / entries.length - Math.PI / 2;
      laid[id] = {
        ...node,
        x: typeof node.x === 'number' && isFinite(node.x) ? node.x : Math.round(centerX + radius * Math.cos(angle)),
        y: typeof node.y === 'number' && isFinite(node.y) ? node.y : Math.round(centerY + radius * Math.sin(angle)),
      };
    });
    return laid;
  }, [nodesRaw]);

  const edges = current.edges || [];
  const metrics = current.metrics || {};
  const hub = current.middlewareHub || null;

  const hasChanges = current.changes && current.changes.length > 0;
  const isSplit = layout === 'split';

  const titleBar = (
    <div style={{
      textAlign: 'center', marginBottom: '8px', padding: '8px',
      background: `${MAP_COLORS[activeMap] || '#64748b'}08`,
      borderRadius: '8px',
      border: `1px solid ${MAP_COLORS[activeMap] || '#64748b'}20`,
    }}>
      <h3 style={{
        fontSize: '18px', fontWeight: 700, margin: 0,
        color: MAP_COLORS[activeMap] || '#64748b',
      }}>
        {current.title || MAP_LABELS[activeMap] || 'Systems Map'}
      </h3>
      {current.subtitle && (
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
          {current.subtitle}
        </p>
      )}
    </div>
  );

  const svgGraph = (
    <div style={{
      background: '#0f172a', borderRadius: '12px',
      border: '1px solid #1e293b', overflow: 'hidden',
      position: 'relative', marginBottom: '16px',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, #1e293b40 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />
      <svg viewBox="0 0 800 580" style={{
        width: '100%', height: 'auto',
        opacity: isTransitioning ? 0.3 : 1,
        transition: 'opacity 0.2s ease',
      }}>
        {hub && (
          <MiddlewareHub
            name={hub.name || 'Zapier'}
            x={hub.x || 400}
            y={hub.y || 340}
            cost={hub.cost || 50}
          />
        )}
        {edges.map((edge: any, i: number) => {
          const from = nodesObj[edge.from];
          const to = nodesObj[edge.to];
          if (!from || !to) return null;
          const status = normalizeEdgeStatus(edge);
          return (
            <IntegrationEdge
              key={`${edge.from}-${edge.to}-${activeMap}`}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              status={status}
              label={edge.label}
              changed={edge.changed}
              middleware={edge.middleware}
              person={edge.person}
            />
          );
        })}
        {Object.entries(nodesObj).map(([id, sys]: [string, any]) => (
          <SystemNode
            key={`${id}-${activeMap}`}
            id={id}
            name={sys.name}
            category={sys.category}
            cost={sys.cost || 0}
            x={sys.x}
            y={sys.y}
            status={sys.status}
            replaces={sys.replaces}
            isActive={hoveredNode === id}
            onClick={setHoveredNode}
          />
        ))}
      </svg>
    </div>
  );

  const metricsBar = (cols: number) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px', marginBottom: '16px' }}>
      {[
        { label: 'Software/mo', value: metrics.monthlySoftware || 0, prefix: '£' },
        { label: 'Manual hrs/wk', value: metrics.manualHours || 0, highlight: true },
        { label: 'Annual waste', value: metrics.annualWaste || 0, prefix: '£' },
        { label: 'Annual savings', value: metrics.annualSavingsVsMap1 ?? metrics.annualSavings ?? 0, prefix: '£', accent: true },
      ].map((item, i) => (
        <div key={i} style={{
          background: item.accent ? `${MAP_COLORS[activeMap]}10` : '#0f172a',
          border: `1px solid ${item.accent ? MAP_COLORS[activeMap] + '40' : '#1e293b'}`,
          borderRadius: '8px', padding: '12px', textAlign: 'center',
        }}>
          <div style={{
            fontSize: '9px', color: '#64748b', textTransform: 'uppercase',
            letterSpacing: '1px', marginBottom: '4px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>{item.label}</div>
          <div style={{
            fontSize: '20px', fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: item.accent
              ? MAP_COLORS[activeMap]
              : (item.highlight && (item.value as number) > 20 ? '#ef4444' : '#e2e8f0'),
          }}>
            <AnimatedNumber value={item.value as number} prefix={item.prefix || ''} />
          </div>
        </div>
      ))}
    </div>
  );

  const bottomStats = (cols: number) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px' }}>
      {[
        { label: 'Investment', value: (metrics.investment || 0) === 0 ? '£0' : `£${(metrics.investment || 0).toLocaleString()}` },
        { label: 'Payback', value: metrics.payback || '—' },
        { label: 'Integrations', value: metrics.integrations || '—' },
        {
          label: 'Key person risk', value: metrics.risk || '—',
          color: metrics.risk === 'Critical' ? '#ef4444'
            : metrics.risk === 'High' ? '#f59e0b'
            : metrics.risk === 'Moderate' ? '#eab308'
            : metrics.risk === 'Low' ? '#3b82f6' : '#22c55e',
        },
      ].map((item, i) => (
        <div key={i} style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '8px', padding: '10px', textAlign: 'center',
        }}>
          <div style={{
            fontSize: '9px', color: '#64748b', textTransform: 'uppercase',
            letterSpacing: '1px', marginBottom: '4px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>{item.label}</div>
          <div style={{
            fontSize: '15px', fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            color: (item as any).color || '#e2e8f0',
          }}>{item.value}</div>
        </div>
      ))}
    </div>
  );

  const legend = (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
      {[
        { color: '#ef4444', label: 'No connection', dash: true },
        { color: '#f59e0b', label: 'Partial / broken', dash: true },
        { color: '#22c55e', label: 'Active integration', dash: false },
        { color: '#3b82f6', label: 'New at this level', dash: false },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="24" height="2">
            <line x1="0" y1="1" x2="24" y2="1" stroke={item.color} strokeWidth="2"
              strokeDasharray={item.dash ? '4,3' : 'none'} />
          </svg>
          <span style={{
            fontSize: '10px', color: '#94a3b8',
            fontFamily: "'JetBrains Mono', monospace",
          }}>{item.label}</span>
        </div>
      ))}
    </div>
  );

  const changesPanel = hasChanges ? (
    <div style={{
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'sticky',
        top: 0,
        background: '#0f172a',
        zIndex: 2,
      }}>
        <span style={{ fontSize: '14px' }}>
          {activeMap === 0 ? '🔍' : activeMap === 1 ? '🔧' : activeMap === 2 ? '🔗' : '🚀'}
        </span>
        <span style={{
          fontSize: '13px', fontWeight: 600, color: MAP_COLORS[activeMap] || '#e2e8f0',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {activeMap === 0 ? "What's broken and why"
            : activeMap === 1 ? "What we fix for free"
            : activeMap === 2 ? "What middleware bridges"
            : "Why these replacements"}
        </span>
        <span style={{
          fontSize: '11px', color: '#64748b', marginLeft: 'auto',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {current.changes.length} {current.changes.length === 1 ? 'change' : 'changes'}
        </span>
      </div>
      {current.changes.map((change: any, i: number) => {
        const actionColors: Record<string, string> = {
          broken: '#ef4444', fixed: '#22c55e', connected: '#3b82f6',
          added: '#22c55e', reconfigured: '#f59e0b', kept: '#64748b',
        };
        const actionLabels: Record<string, string> = {
          broken: 'Issue', fixed: 'Fixed', connected: 'Connected',
          added: 'New', reconfigured: 'Reconfigured', kept: 'Unchanged',
        };
        const color = actionColors[change.action] || '#64748b';
        const label = actionLabels[change.action] || change.action;
        return (
          <div key={i} style={{
            padding: '14px 20px',
            borderBottom: i < current.changes.length - 1 ? '1px solid #1e293b' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '9px', fontWeight: 700, color, textTransform: 'uppercase',
                letterSpacing: '0.5px', padding: '2px 8px', borderRadius: '4px',
                background: `${color}15`, border: `1px solid ${color}30`,
                fontFamily: "'JetBrains Mono', monospace",
              }}>{label}</span>
              <span style={{
                fontSize: '13px', fontWeight: 600, color: '#e2e8f0',
                fontFamily: "'DM Sans', sans-serif",
              }}>{change.system}</span>
            </div>
            <p style={{
              fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 8px 0',
              fontFamily: "'DM Sans', sans-serif",
            }}>{change.description}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {change.impact && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                    IMPACT
                  </span>
                  <span style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: "'DM Sans', sans-serif" }}>
                    {change.impact}
                  </span>
                </div>
              )}
              {change.cost && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                    COST
                  </span>
                  <span style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: "'DM Sans', sans-serif" }}>
                    {change.cost}
                  </span>
                </div>
              )}
            </div>
            {change.why && (
              <div style={{
                marginTop: '8px', padding: '8px 12px',
                background: '#22c55e08', borderLeft: '2px solid #22c55e40',
                borderRadius: '0 6px 6px 0',
              }}>
                <span style={{
                  fontSize: '11px', color: '#86efac', fontStyle: 'italic',
                  fontFamily: "'DM Sans', sans-serif", lineHeight: '1.5',
                }}>{change.why}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  ) : null;

  // ─── Implementation Guide ──────────────────────────────────────────────────
  const guideSteps: { title: string; owner: string; detail: string; extra?: string }[] = useMemo(() => {
    if (activeMap === 0) return [];

    const changes: any[] = current.changes || [];
    if (activeMap === 1) {
      return changes.map((ch: any) => ({
        title: ch.system ? `${ch.system}: ${ch.description || 'Native fix'}` : (ch.description || 'Fix'),
        owner: 'Your finance/IT team',
        detail: ch.why || `Contact ${ch.system || 'vendor'} support to enable this configuration. Test in parallel before switching off manual processes.`,
        extra: 'Verify the manual workaround is no longer needed after enabling.',
      }));
    }
    if (activeMap === 2) {
      return changes.filter((ch: any) => ch.action === 'connected' || (ch.description || '').toLowerCase().includes('connect')).map((ch: any) => ({
        title: ch.system ? `${ch.system}` : (ch.description || 'Connection'),
        owner: 'Technical team member or integration specialist',
        detail: ch.description || 'Configure middleware trigger and action flow. Build time estimate: 8-12 hours including testing.',
        extra: ch.impact || (
          (ch.description || '').toLowerCase().includes('zapier') || (ch.description || '').toLowerCase().includes('make')
            ? 'GDPR note: Data passes through US servers. Evaluate whether Power Automate (M365 environment) is preferred for data that includes personal information.'
            : undefined
        ),
      }));
    }
    if (activeMap === 3) {
      const stages = current.implementationStages;
      if (stages && Array.isArray(stages) && stages.length > 0) {
        return stages.map((st: any, idx: number) => ({
          title: `Phase ${idx + 1}: ${st.title || st.phase || 'Implementation'}`,
          owner: st.owner || 'Advisory team',
          detail: st.description || [st.timing, st.tools].filter(Boolean).join(' — ') || 'See recommendation detail.',
          extra: st.timing ? `Timeline: ${st.timing}` : undefined,
        }));
      }
      const replaces = changes.filter((c: any) => c.action === 'added' || (c.description || '').includes('replac'));
      const reconfigs = changes.filter((c: any) => c.action === 'reconfigured');
      const steps: typeof guideSteps = [];
      if (replaces.length > 0) {
        steps.push({
          title: `Phase 1: Replacements (${replaces.length})`,
          owner: 'Project lead + vendor',
          detail: replaces.map((c: any) => c.system || c.description).filter(Boolean).join(', '),
        });
      }
      if (reconfigs.length > 0) {
        steps.push({
          title: `Phase 2: Reconfigurations (${reconfigs.length})`,
          owner: 'Internal IT / vendor support',
          detail: reconfigs.map((c: any) => c.system || c.description).filter(Boolean).join(', '),
        });
      }
      if (steps.length === 0) {
        changes.forEach((ch: any, idx: number) => {
          steps.push({
            title: `Step ${idx + 1}: ${ch.system || ch.description || 'Change'}`,
            owner: 'Advisory team',
            detail: ch.description || ch.why || '',
          });
        });
      }
      return steps;
    }
    return [];
  }, [activeMap, current]);

  const guidePanel = guideSteps.length > 0 ? (
    <div style={{
      marginTop: '16px', background: '#0a1628',
      border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden',
    }}>
      <button onClick={() => setGuideOpen(!guideOpen)} style={{
        width: '100%', padding: '14px 20px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '10px',
        background: guideOpen ? '#22c55e10' : 'transparent',
        border: 'none', borderBottom: guideOpen ? '1px solid #1e293b' : 'none',
      }}>
        <span style={{ fontSize: '14px', transform: guideOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s ease', display: 'inline-block' }}>▶</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', fontFamily: "'DM Sans', sans-serif" }}>
          Implementation Guide — {guideSteps.length} step{guideSteps.length !== 1 ? 's' : ''}
        </span>
      </button>
      {guideOpen && (
        <div style={{ padding: '4px 0' }}>
          {guideSteps.map((step, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < guideSteps.length - 1 ? '1px solid #1e293b' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  width: '22px', height: '22px', borderRadius: '11px',
                  background: '#22c55e20', color: '#22c55e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, flexShrink: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{i + 1}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>{step.title}</span>
              </div>
              <div style={{ marginLeft: '32px' }}>
                <span style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                  background: '#7c3aed15', color: '#a78bfa', border: '1px solid #7c3aed30',
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}>{step.owner}</span>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', margin: '8px 0 0', fontFamily: "'DM Sans', sans-serif" }}>{step.detail}</p>
                {step.extra && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f59e0b08', borderLeft: '2px solid #f59e0b40', borderRadius: '0 6px 6px 0' }}>
                    <span style={{ fontSize: '11px', color: '#fbbf24', fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif", lineHeight: '1.5' }}>{step.extra}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {activeMap === 3 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #1e293b', background: '#22c55e05' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                This implementation plan is designed to be self-contained. Your team can begin making these changes independently.
                For guided support through the transition, contact your advisory team about implementation packages.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #020617 0%, #0f172a 40%, #1e1b4b08 100%)',
        fontFamily: "'DM Sans', sans-serif",
        color: '#e2e8f0',
        padding: isSplit ? '32px 40px' : '24px',
        borderRadius: isSplit ? 0 : 16,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          fontSize: '11px', letterSpacing: '3px', color: '#64748b',
          textTransform: 'uppercase', marginBottom: '6px',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Systems Audit · Technology Roadmap
        </div>
        <h2 style={{
          fontSize: isSplit ? '32px' : '28px', fontWeight: 700, margin: 0,
          background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          From Chaos to Connected
        </h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
          {maps.length > 1
            ? 'Four levels of integration maturity — choose your ambition'
            : 'Your current system connections'}
        </p>
      </div>

      {maps.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '24px' }}>
          {maps.map((_: any, i: number) => {
            const mapColor = MAP_COLORS[i] || '#64748b';
            const label = MAP_LABELS[i] || `Level ${i + 1}`;
            const isRecommended = maps[i]?.recommended || maps[i]?.recommendedLevel;
            return (
              <button key={i} onClick={() => switchMap(i)}
                style={{
                  background: activeMap === i ? `${mapColor}20` : 'transparent',
                  border: `1px solid ${activeMap === i ? mapColor : '#1e293b'}`,
                  color: activeMap === i ? mapColor : '#64748b',
                  padding: '8px 20px',
                  borderRadius: i === 0 ? '8px 0 0 8px' : i === maps.length - 1 ? '0 8px 8px 0' : '0',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  marginRight: '6px', opacity: 0.5, fontSize: '10px',
                }}>{i + 1}</span>
                {label}
                {isRecommended && (
                  <span style={{
                    position: 'absolute', top: '-8px', right: '-4px',
                    background: '#3b82f6', color: '#fff', fontSize: '7px',
                    padding: '2px 5px', borderRadius: '4px', fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}>REC</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {isSplit && hasChanges ? (
        <>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 58%', minWidth: 0 }}>
              {titleBar}
              {svgGraph}
              {metricsBar(2)}
              {bottomStats(2)}
              {legend}
            </div>
            <div
              style={{
                flex: '1 1 auto', minWidth: 0,
                position: 'sticky', top: '60px',
                maxHeight: 'calc(100vh - 80px)',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              className="scrollbar-hide"
            >
              {changesPanel}
              {guidePanel}
            </div>
          </div>
        </>
      ) : (
        <>
          {titleBar}
          {svgGraph}
          {metricsBar(4)}
          {bottomStats(4)}
          {legend}
          {changesPanel && <div style={{ marginTop: '20px' }}>{changesPanel}</div>}
          {guidePanel && <div style={{ marginTop: '12px' }}>{guidePanel}</div>}
        </>
      )}
    </div>
  );
}
