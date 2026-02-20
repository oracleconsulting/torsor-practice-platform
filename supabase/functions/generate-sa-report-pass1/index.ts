import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// =============================================================================
// PASS 1: 8-PHASE EXTRACTION & ANALYSIS (each phase: 1 AI call, <120s target)
// Phase 1: EXTRACT CORE — company facts, system inventory, metrics, quotes
// Phase 2: ANALYSE PROCESSES — process deep dives, scores, uniquenessBrief, costs
// Phase 3: FINDINGS (Critical+High) — critical and high severity findings
// Phase 4: FINDINGS (Medium+Low) + QUICK WINS — remaining findings + quick wins
// Phase 5: RECOMMENDATIONS — implementation roadmap with ROI analysis
// Phase 6: SYSTEMS MAPS — 4-level integration maturity maps from tech DB
// Phase 7: ADMIN GUIDANCE — talking points, questions, tasks, risk flags
// Phase 8: CLIENT PRESENTATION + ASSEMBLY — exec brief, ROI, status update
// Then Pass 2 (separate function) generates narratives.
// =============================================================================

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

function mapDesiredOutcomes(slugs: string[]): string[] {
  return (slugs || []).map(slug => DESIRED_OUTCOME_LABELS[slug] || slug);
}

const TRUNCATE = (s: string | undefined | null, maxLen: number) =>
  (s == null ? '' : String(s)).length <= maxLen ? (s ?? '') : (s ?? '').slice(0, maxLen) + '…';

function parseJsonFromContent(content: string, wasTruncated: boolean): string {
  content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
  const firstBrace = content.indexOf('{');
  if (firstBrace > 0) content = content.substring(firstBrace);
  if (wasTruncated) {
    let braceCount = 0;
    let lastBrace = -1;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) lastBrace = i;
      }
    }
    if (lastBrace > 0) content = content.substring(0, lastBrace + 1);
  } else {
    let braceCount = 0;
    let lastBrace = -1;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          lastBrace = i;
          break;
        }
      }
    }
    if (lastBrace > 0) content = content.substring(0, lastBrace + 1);
  }
  return content;
}

async function callSonnet(
  prompt: string,
  maxTokens: number,
  phase: number,
  openRouterKey: string
): Promise<{ data: any; tokensUsed: number; cost: number; generationTime: number }> {
  const startTime = Date.now();
  console.log(`[SA Pass 1] Phase ${phase}: Calling Sonnet (streaming, max_tokens=${maxTokens})...`);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor SA Pass 1',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Sonnet API failed (${response.status}): ${errText}`);
  }

  console.log(`[SA Pass 1] Phase ${phase}: Stream connected in ${Date.now() - startTime}ms, reading chunks...`);

  let fullContent = '';
  let tokensUsed = 0;
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let chunkCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;

        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            chunkCount++;
          }
          if (json.usage) {
            tokensUsed = json.usage.total_tokens || json.usage.prompt_tokens + json.usage.completion_tokens || 0;
          }
        } catch {
          // Skip malformed chunks
        }
      }

      if (chunkCount > 0 && chunkCount % 100 === 0) {
        console.log(`[SA Pass 1] Phase ${phase}: ${chunkCount} chunks received, ${fullContent.length} chars so far (${Math.round((Date.now() - startTime) / 1000)}s)`);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const elapsed = Date.now() - startTime;
  console.log(`[SA Pass 1] Phase ${phase}: Stream complete in ${elapsed}ms. ${chunkCount} chunks, ${fullContent.length} chars, ${tokensUsed} tokens`);

  const wasTruncated = fullContent.length > 0 && !fullContent.trimEnd().endsWith('}');
  if (wasTruncated) {
    console.warn(`[SA Pass 1] Phase ${phase}: Response may be truncated (doesn't end with })`);
  }

  let cleanContent = parseJsonFromContent(fullContent.trim(), wasTruncated);

  let data: any;
  try {
    data = JSON.parse(cleanContent);
  } catch (parseErr) {
    console.warn(`[SA Pass 1] Phase ${phase}: JSON parse failed, attempting repair...`);
    let repaired = cleanContent;
    repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*("[^"]*)?$/, '');
    repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*\[?\s*(\{[^}]*)?$/, '');
    let openBraces = 0, openBrackets = 0, inString = false, escape = false;
    for (let i = 0; i < repaired.length; i++) {
      if (escape) { escape = false; continue; }
      if (repaired[i] === '\\') { escape = true; continue; }
      if (repaired[i] === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (repaired[i] === '{') openBraces++;
      if (repaired[i] === '}') openBraces--;
      if (repaired[i] === '[') openBrackets++;
      if (repaired[i] === ']') openBrackets--;
    }
    repaired = repaired.replace(/,\s*$/, '');
    for (let i = 0; i < openBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces; i++) repaired += '}';
    console.log(`[SA Pass 1] Phase ${phase}: Repaired JSON (closed ${openBraces} braces, ${openBrackets} brackets)`);
    try {
      data = JSON.parse(repaired);
      console.log(`[SA Pass 1] Phase ${phase}: Repaired JSON parsed successfully`);
    } catch (repairErr) {
      console.error(`[SA Pass 1] Phase ${phase}: JSON repair failed. First 500 chars: ${cleanContent.substring(0, 500)}`);
      console.error(`[SA Pass 1] Phase ${phase}: Last 500 chars: ${cleanContent.substring(cleanContent.length - 500)}`);
      throw new Error(`Phase ${phase} JSON parse failed: ${(parseErr as Error).message}`);
    }
  }

  const cost = (tokensUsed / 1000000) * 3;
  return { data, tokensUsed, cost, generationTime: elapsed };
}

// ---------- Phase 4b: Systems map deterministic builder + optional Map 4 AI ----------
interface SystemNode {
  name: string;
  category: string;
  cost: number;
  x: number;
  y: number;
  status?: 'new' | 'reconfigure';
  replaces?: string[];
}
interface MapEdge {
  from: string;
  to: string;
  status: 'red' | 'amber' | 'green' | 'blue';
  label?: string;
  changed?: boolean;
  middleware?: boolean;
  person?: string;
}
interface SystemsMap {
  title: string;
  subtitle: string;
  recommended: boolean;
  nodes: Record<string, SystemNode>;
  edges: MapEdge[];
  middlewareHub: { name: string; x: number; y: number; cost: number } | null;
  metrics: {
    monthlySoftware: number;
    manualHours: number;
    annualWaste: number;
    annualSavings: number;
    investment: number;
    payback: string;
    integrations: string;
    risk: string;
  };
}

function layoutSystems(systems: any[]): Record<string, SystemNode> {
  const nodes: Record<string, SystemNode> = {};
  const count = systems.length;
  const positions: [number, number][] = [];
  if (count <= 4) {
    positions.push([400, 120], [200, 300], [600, 300], [400, 480]);
  } else if (count <= 6) {
    positions.push([200, 150], [400, 150], [600, 150], [200, 400], [400, 400], [600, 400]);
  } else if (count <= 9) {
    positions.push([200, 120], [400, 120], [600, 120], [160, 280], [400, 280], [640, 280], [200, 440], [400, 440], [600, 440]);
  } else if (count <= 12) {
    positions.push([200, 100], [400, 100], [600, 100], [130, 240], [310, 240], [490, 240], [670, 240], [200, 380], [400, 380], [600, 380], [300, 510], [500, 510]);
  } else {
    const cx = 400, cy = 290, r = 200;
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      positions.push([Math.round(cx + r * Math.cos(angle)), Math.round(cy + r * Math.sin(angle))]);
    }
  }
  const catOrder: Record<string, number> = {
    accounting_software: 0, accounting: 0, time_tracking: 1, project_management: 2,
    expense_management: 3, payment_collection: 4, crm: 5, email: 6, chat_messaging: 7,
    design: 8, email_marketing: 9, spreadsheet: 10,
  };
  const sorted = [...systems].sort((a, b) => (catOrder[a.category] ?? 99) - (catOrder[b.category] ?? 99));
  sorted.forEach((sys, i) => {
    const [x, y] = positions[i] || [400, 300];
    const id = sys.name.toLowerCase().replace(/[\s.]+/g, '_');
    nodes[id] = { name: sys.name, category: sys.category, cost: sys.monthlyCost || 0, x, y };
  });
  return nodes;
}

function extractGapLabel(gaps: string[], partner: string): string {
  const relevant = (gaps || []).find((g) => g.toLowerCase().includes(partner.toLowerCase()));
  if (!relevant) return 'Issues';
  return relevant.length > 25 ? relevant.slice(0, 22) + '...' : relevant;
}

function buildEdgesMap1(
  nodes: Record<string, SystemNode>,
  systems: any[],
  findings: any[],
): MapEdge[] {
  const edges: MapEdge[] = [];
  const added = new Set<string>();
  systems.forEach((sys: any) => {
    const fromId = sys.name.toLowerCase().replace(/[\s.]+/g, '_');
    if (!nodes[fromId]) return;
    (sys.integratesWith || []).forEach((partner: string) => {
      const toId = partner.toLowerCase().replace(/[\s.]+/g, '_');
      if (!nodes[toId]) return;
      const key = [fromId, toId].sort().join('|');
      if (added.has(key)) return;
      added.add(key);
      const hasGap = (sys.gaps || []).some((g: string) => g.toLowerCase().includes(partner.toLowerCase()));
      edges.push({
        from: fromId, to: toId,
        status: hasGap ? 'amber' : 'green',
        label: hasGap ? extractGapLabel(sys.gaps, partner) : 'Connected',
      });
    });
  });
  findings.forEach((f: any) => {
    const affected = f.affectedSystems || f.affected_systems || [];
    if (affected.length >= 2) {
      const fromId = affected[0].toLowerCase().replace(/[\s.]+/g, '_');
      const toId = affected[1].toLowerCase().replace(/[\s.]+/g, '_');
      if (!nodes[fromId] || !nodes[toId]) return;
      const key = [fromId, toId].sort().join('|');
      if (added.has(key)) return;
      added.add(key);
      let person: string | undefined;
      const desc = f.description || '';
      const personMatch = desc.match(/\b(Maria|Sophie|Lily|Jake|Priya)\b/);
      if (personMatch && f.category === 'manual_process') person = personMatch[1];
      const hoursLabel = (f.hoursWastedWeekly ?? f.hours_wasted_weekly)
        ? `${f.hoursWastedWeekly ?? f.hours_wasted_weekly}h/wk`
        : undefined;
      edges.push({
        from: fromId, to: toId, status: 'red',
        label: hoursLabel ? `${person ? person + ': ' : ''}${hoursLabel}` : 'No connection',
        person,
      });
    }
  });
  return edges;
}

function buildEdgesMap2(map1Edges: MapEdge[], recommendations: any[]): MapEdge[] {
  const nativeFixes = new Set<string>();
  recommendations.forEach((rec: any) => {
    const cost = rec.estimatedCost || 0;
    const phase = rec.implementationPhase || '';
    if (cost === 0 && (phase === 'immediate' || phase === 'quick_win' || phase === 'short_term')) {
      const title = (rec.title || '').toLowerCase();
      const desc = (rec.description || '').toLowerCase();
      const combined = title + ' ' + desc;
      if (combined.includes('auto-publish') || combined.includes('dext')) nativeFixes.add('dext');
      if (combined.includes('stripe') || combined.includes('duplicate')) nativeFixes.add('stripe');
      if (combined.includes('slack') || combined.includes('notification')) nativeFixes.add('slack');
      if (combined.includes('timesheet') || combined.includes('harvest') || combined.includes('reminder')) nativeFixes.add('harvest');
      if (combined.includes('monday') || combined.includes('pipeline') || combined.includes('master tracker')) nativeFixes.add('monday_com');
      if (combined.includes('xero') || combined.includes('chart of accounts') || combined.includes('cost centre')) nativeFixes.add('xero');
      if (combined.includes('notion') || combined.includes('template') || combined.includes('proposal')) nativeFixes.add('notion');
      if (combined.includes('budget') || combined.includes('profitability')) nativeFixes.add('monday_com');
    }
  });
  return map1Edges.map((edge) => {
    if (edge.status === 'amber' && (nativeFixes.has(edge.from) || nativeFixes.has(edge.to))) {
      return { ...edge, status: 'green' as const, label: edge.label?.replace('OFF', 'ON') || 'Fixed', changed: true };
    }
    if (edge.status === 'red' && (nativeFixes.has(edge.from) || nativeFixes.has(edge.to))) {
      return { ...edge, status: 'amber' as const, label: 'Improved', changed: true };
    }
    return { ...edge };
  });
}

function buildEdgesMap3(map2Edges: MapEdge[], recommendations: any[]): {
  edges: MapEdge[];
  hub: { name: string; x: number; y: number; cost: number } | null;
} {
  const hasMiddleware = recommendations.some((r: any) => {
    const title = (r.title || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    return title.includes('zapier') || title.includes('make') || desc.includes('zapier') || desc.includes('make') || desc.includes('middleware');
  });
  if (!hasMiddleware) return { edges: map2Edges, hub: null };
  const edges = map2Edges.map((edge) => {
    if (edge.status === 'red') {
      return { ...edge, status: 'blue' as const, label: `Zapier: ${edge.label || 'connected'}`, changed: true, middleware: true, person: undefined };
    }
    return { ...edge };
  });
  return { edges, hub: { name: 'Zapier', x: 400, y: 340, cost: 50 } };
}

function calculateMetrics(
  nodes: Record<string, SystemNode>,
  edges: MapEdge[],
  map1Metrics: any,
  recommendations: any[],
  mapLevel: number,
  blendedHourlyRate?: number,
): any {
  const rate = blendedHourlyRate ?? map1Metrics?.blendedHourlyRate ?? 45;
  const totalSoftware = Object.values(nodes).reduce((s, n) => s + n.cost, 0);
  const greenEdges = edges.filter((e) => e.status === 'green' || e.status === 'blue').length;
  const totalNodes = Object.keys(nodes).length;
  const recs = recommendations || [];
  let hoursSaved = 0;
  let investment = 0;
  if (mapLevel >= 2) {
    recs.filter((r: any) => (r.estimatedCost || 0) === 0).forEach((r: any) => {
      hoursSaved += parseFloat(r.hoursSavedWeekly) || 0;
    });
  }
  if (mapLevel >= 3) {
    recs.forEach((r: any) => {
      if ((r.estimatedCost || 0) > 0) {
        hoursSaved += parseFloat(r.hoursSavedWeekly) || 0;
        investment += r.estimatedCost || 0;
      }
    });
  }

  // Map 4 bonus: tool consolidation reduces context-switching and manual reconciliation.
  if (mapLevel === 4) {
    const map1NodeCount = Object.keys(map1Metrics.map1Nodes || {}).length || map1Metrics.systemCount || 0;
    const map4NodeCount = Object.keys(nodes).length;
    const toolsConsolidated = Math.max(0, map1NodeCount - map4NodeCount);
    const consolidationHoursSaved = toolsConsolidated * 1.5;
    hoursSaved += consolidationHoursSaved;

    const map1SoftwareCost = map1Metrics.monthlySoftwareCost || 0;
    const map4SoftwareCost = Object.values(nodes).reduce((s: number, n: any) => s + (n.cost || 0), 0);
    const monthlySoftwareSaving = Math.max(0, map1SoftwareCost - map4SoftwareCost);
    (map1Metrics as any)._map4SoftwareSavingAnnual = monthlySoftwareSaving * 12;
    (map1Metrics as any)._map4ConsolidationHours = consolidationHoursSaved;
  }

  const manualHours = Math.max(0, map1Metrics.manualHours - hoursSaved);
  const annualWaste = mapLevel === 1 ? map1Metrics.annualWaste : Math.round(manualHours * rate * 52);
  let annualSavings = mapLevel === 1 ? 0 : map1Metrics.annualWaste - annualWaste;

  if (mapLevel === 4 && (map1Metrics as any)._map4SoftwareSavingAnnual > 0) {
    annualSavings += (map1Metrics as any)._map4SoftwareSavingAnnual;
  }

  let payback = '—';
  if (investment > 0 && annualSavings > 0) {
    const months = investment / (annualSavings / 12);
    if (months < 0.1) payback = 'Instant';
    else if (months < 1) payback = `${Math.round(months * 30)} days`;
    else if (months < 2) payback = `${Math.round(months * 4)} weeks`;
    else payback = `${Math.round(months)} months`;
  } else if (investment === 0 && mapLevel > 1) payback = 'Instant';
  const spofKeywords = [
    'backup', 'back-up', 'back up',
    'documentation', 'document',
    'single point', 'spof', 'bus factor',
    'cross-train', 'cross train', 'crosstrain',
    'knowledge transfer', 'knowledge sharing',
    'redundancy', 'redundant',
    'delegate', 'delegation',
    'train second', 'second person',
    'key person', 'key-person', 'keyperson',
    'handover', 'hand over', 'hand-over',
    'procedure', 'runbook', 'playbook',
    'maria', 'sole', 'only person', 'only one who',
  ];
  const spofFindings = (recommendations || []).filter((r: any) => {
    const text = ((r.title || '') + ' ' + (r.description || '')).toLowerCase();
    return spofKeywords.some(kw => text.includes(kw));
  });
  const hasSpofFix = spofFindings.length > 0 && mapLevel >= 3;
  const hasPartialSpofFix = spofFindings.length > 0 && mapLevel >= 2;

  let risk: string;
  if (mapLevel === 1) {
    if (manualHours > 60) risk = 'Critical';
    else if (manualHours > 40) risk = 'Critical';
    else if (manualHours > 25) risk = 'High';
    else if (manualHours > 10) risk = 'Moderate';
    else risk = 'Low';
  } else if (mapLevel === 2) {
    if (manualHours > 60) risk = 'Critical';
    else if (manualHours > 40 && !hasPartialSpofFix) risk = 'Critical';
    else if (manualHours > 40 && hasPartialSpofFix) risk = 'High';
    else if (manualHours > 25) risk = 'High';
    else if (manualHours > 10) risk = 'Moderate';
    else risk = 'Low';
  } else if (mapLevel === 3) {
    if (manualHours > 60 && !hasSpofFix) risk = 'Critical';
    else if (manualHours > 60 && hasSpofFix) risk = 'High';
    else if (manualHours > 40 && !hasSpofFix) risk = 'High';
    else if (manualHours > 40 && hasSpofFix) risk = 'Moderate';
    else if (manualHours > 25) risk = 'Moderate';
    else if (manualHours > 10) risk = 'Low';
    else risk = 'Minimal';
  } else {
    if (manualHours > 60 && !hasSpofFix) risk = 'High';
    else if (manualHours > 60 && hasSpofFix) risk = 'Moderate';
    else if (manualHours > 40) risk = 'Moderate';
    else if (manualHours > 25) risk = 'Low';
    else risk = 'Minimal';
  }

  const connectedEdges = edges.filter((e) => e.status === 'green' || e.status === 'blue').length;
  const partialEdges = edges.filter((e) => e.status === 'amber' && (e as any).changed).length;
  const totalEdges = edges.length;
  const integrationsStr = totalEdges > 0 ? `${connectedEdges + partialEdges} / ${totalEdges}` : `${greenEdges} / ${totalNodes}`;

  return {
    monthlySoftware: totalSoftware,
    manualHours: Math.round(manualHours),
    annualWaste,
    annualSavings,
    investment: Math.round(investment),
    payback,
    integrations: integrationsStr,
    risk,
  };
}

function buildSystemsMaps(
  facts: any,
  findings: any[],
  recommendations: any[],
  aiMap4?: any,
  blendedHourlyRate?: number,
  pass1DataFallback?: any,
): SystemsMap[] {
  const systems = facts?.systems || [];
  if (systems.length === 0) return [];
  const nodes = layoutSystems(systems);
  const map1Edges = buildEdgesMap1(nodes, systems, findings);
  const map1Metrics = {
    manualHours: facts.hoursWastedWeekly || 0,
    annualWaste: facts.annualCostOfChaos || 0,
    blendedHourlyRate: blendedHourlyRate ?? facts?.blendedHourlyRate ?? 45,
    map1Nodes: nodes,
    systemCount: systems.length,
    monthlySoftwareCost: Object.values(nodes).reduce((s, n) => s + n.cost, 0),
  };
  const rate = map1Metrics.blendedHourlyRate;
  const map1: SystemsMap = {
    title: 'Where You Are Today',
    subtitle: 'The reality',
    recommended: false,
    nodes,
    edges: map1Edges,
    middlewareHub: null,
    metrics: calculateMetrics(nodes, map1Edges, map1Metrics, recommendations, 1, rate),
  };
  const map2Edges = buildEdgesMap2(map1Edges, recommendations);
  const map2: SystemsMap = {
    title: 'Native Fixes',
    subtitle: 'Zero cost quick wins',
    recommended: false,
    nodes: { ...nodes },
    edges: map2Edges,
    middlewareHub: null,
    metrics: calculateMetrics(nodes, map2Edges, map1Metrics, recommendations, 2, rate),
  };
  const { edges: map3Edges, hub } = buildEdgesMap3(map2Edges, recommendations);
  const map3: SystemsMap = {
    title: 'Fully Connected',
    subtitle: hub ? `+£${hub.cost}/mo middleware` : 'All systems linked',
    recommended: true,
    nodes: { ...nodes },
    edges: map3Edges,
    middlewareHub: hub,
    metrics: calculateMetrics(nodes, map3Edges, map1Metrics, recommendations, 3, rate),
  };
  const maps: SystemsMap[] = [map1, map2, map3];
  if (aiMap4?.nodes && aiMap4.edges) {
    const map4: SystemsMap = {
      title: 'Optimal Stack',
      subtitle: 'Best-in-class replacements',
      recommended: false,
      nodes: aiMap4.nodes,
      edges: aiMap4.edges,
      middlewareHub: null,
      metrics: calculateMetrics(aiMap4.nodes, aiMap4.edges, map1Metrics, recommendations, 4, rate),
    };
    maps.push(map4);
  } else if (pass1DataFallback?.systemsMaps) {
    const aiMaps = Array.isArray(pass1DataFallback.systemsMaps) ? pass1DataFallback.systemsMaps : [];
    const aiMap4Entry = aiMaps.find((m: any) => m.level === 4) || aiMaps[3];
    if (aiMap4Entry?.nodes && aiMap4Entry.edges) {
      const aiNodes: Record<string, SystemNode> = {};
      (Array.isArray(aiMap4Entry.nodes) ? aiMap4Entry.nodes : Object.values(aiMap4Entry.nodes)).forEach((n: any) => {
        const id = (n.id ?? n.name ?? '').toString().toLowerCase().replace(/[\s.]+/g, '_');
        aiNodes[id] = {
          name: n.name ?? id,
          category: n.category ?? 'other',
          cost: n.monthlyCost ?? n.cost ?? 0,
          x: n.x ?? 400,
          y: n.y ?? 300,
        };
      });
      const map4Edges = (aiMap4Entry.edges || []).map((e: any) => ({
        from: e.from,
        to: e.to,
        status: (e.colour === 'green' || e.status === 'active') ? 'green' : (e.status || 'green'),
        label: e.label || 'Native',
        changed: true,
      }));
      const map4: SystemsMap = {
        title: aiMap4Entry.title || 'Optimal Stack',
        subtitle: aiMap4Entry.description || 'Best-in-class replacements',
        recommended: false,
        nodes: aiNodes,
        edges: map4Edges,
        middlewareHub: null,
        metrics: calculateMetrics(aiNodes, map4Edges, map1Metrics, recommendations, 4, rate),
      };
      maps.push(map4);
      console.log('[SA Pass 1] Map 4 built from AI-generated data (Phase 4.5 fallback)');
    } else {
      console.warn('[SA Pass 1] No valid Map 4 data from either phase4b or AI systemsMaps');
    }
  } else {
    console.warn('[SA Pass 1] phase4b missing or invalid — checking for AI-generated Map 4');
  }
  return maps;
}

function buildPhase4bPrompt(facts: any, recommendations: any[]): string {
  const systems = facts?.systems || [];
  const sysStr = systems.map((s: any) =>
    `${s.name} (${s.category}, £${s.monthlyCost || 0}/mo, satisfaction: ${s.userSatisfaction ?? s.user_satisfaction ?? '?'}/5)`
  ).join('\n');
  return `You are designing the "Optimal Stack" for a UK SMB. Given their current systems, suggest replacements that would give native integrations across the entire stack.

CURRENT SYSTEMS:
${sysStr}

CURRENT ISSUES (from findings):
${(recommendations || []).slice(0, 5).map((r: any) => `- ${r.title}`).join('\n')}

RULES:
- Keep systems the team loves (satisfaction 4+): ${systems.filter((s: any) => (s.userSatisfaction ?? s.user_satisfaction ?? 0) >= 4).map((s: any) => s.name).join(', ') || 'none'}
- Replace underperformers (satisfaction ≤2) with best-in-class alternatives
- Prefer UK-market products with native Xero integration
- Every system must have native integration with at least 2 others
- Maximise native connections, eliminate need for middleware
- Include pricing in GBP monthly

Return ONLY a JSON object:
{
  "nodes": {
    "system_id": {
      "name": "Product Name",
      "category": "category_slug",
      "cost": 99,
      "x": 400,
      "y": 120,
      "status": "new",
      "replaces": ["Old System 1", "Old System 2"]
    }
  },
  "edges": [
    { "from": "system_a", "to": "system_b", "status": "green", "label": "Native deep", "changed": true }
  ]
}

POSITION GUIDE (800x580 viewBox):
- Row 1 (y=120): accounting, expense, payments — top of map
- Row 2 (y=260): time/project/PSA tools — middle
- Row 3 (y=420): email, chat, collaboration — lower
- Row 4 (y=530): design/specialist — bottom
- x range: 130-670, center at 400

Systems with status "new" get a green + badge. Status "reconfigure" gets amber ⟳.
Include "replaces" array only on new systems that replace existing ones.
All edges should be "green" with "Native" or "Native deep" labels.

JSON only, no markdown.`;
}

// ---------- Phase 1: EXTRACT CORE (company info, system inventory, metrics, quotes) ----------
function buildPhase1Prompt(
  discovery: any,
  systems: any[],
  clientName: string,
  hourlyRate: number,
  additionalContext?: { area: string; tag?: string; gap: string; resolution: string; context: string }[],
  preliminaryAnalysis?: { confidenceScores?: { area: string; confidence: string; reason: string }[] }
): string {
  const MAX_SYSTEMS = 20;
  const MAX_TEXT = 600;
  const systemsSlice = systems.slice(0, MAX_SYSTEMS);

  const systemDetails = systemsSlice.map((s: any) => {
    const notes = s.field_notes || {};
    const noteLines = Object.entries(notes).length
      ? '\n- Client context (anything to add): ' + Object.entries(notes).map(([f, note]) => `${f}: "${TRUNCATE(String(note), 200)}"`).join('; ')
      : '';
    return `
**${s.system_name}** (${s.category_code})
- Criticality: ${s.criticality}
- Cost: £${s.monthly_cost || 0}/mo
- Users: ${s.number_of_users || '?'} (${(s.primary_users || []).join(', ')})
- Integration: ${s.integration_method || 'none'}
- Manual transfer required: ${s.manual_transfer_required ? 'YES - ' + s.manual_hours_monthly + ' hrs/mo' : 'No'}
- Data quality: ${s.data_quality_score || '?'}/5
- User satisfaction: ${s.user_satisfaction || '?'}/5
- Known issues: "${TRUNCATE(s.known_issues || 'None specified', MAX_TEXT)}"
- Workarounds: "${TRUNCATE(s.workarounds_in_use || 'None specified', MAX_TEXT)}"
- Future plan: ${s.future_plan || 'keep'}${noteLines}
`;
  }).join('\n');

  const raw = discovery.raw_responses || {};
  const stage1ContextLines = Object.entries(raw)
    .filter(([k]) => k.endsWith('_context') && raw[k])
    .map(([k, v]) => `- ${k.replace(/_context$/, '')}: "${TRUNCATE(String(v), 300)}"`)
    .join('\n');
  const stage1ContextBlock = stage1ContextLines
    ? `

Optional context from Stage 1 ("anything to add"):
${stage1ContextLines}`
    : '';

  return `
You are extracting structured FACTS from a Systems Audit assessment. Extract ALL facts, numbers, and quotes. Analyse each system's integration status. Do NOT generate findings, process analysis, scores, or recommendations — only facts about the company and its systems.

═══════════════════════════════════════════════════════════════════════════════
DISCOVERY DATA
═══════════════════════════════════════════════════════════════════════════════

Company: ${clientName}
Team Size: ${discovery.team_size} → ${discovery.expected_team_size_12mo} (12mo)
Revenue: ${discovery.revenue_band}
Industry: ${discovery.industry_sector}

**BREAKING POINT (verbatim):** "${TRUNCATE(discovery.systems_breaking_point, MAX_TEXT)}"
**MONTH-END SHAME (verbatim):** "${TRUNCATE(discovery.month_end_shame, MAX_TEXT)}"
**EXPENSIVE MISTAKE (verbatim):** "${TRUNCATE(discovery.expensive_systems_mistake, MAX_TEXT)}"
**MAGIC FIX (verbatim):** "${TRUNCATE(discovery.magic_process_fix, MAX_TEXT)}"

Operations diagnosis: ${discovery.operations_self_diagnosis}
Manual hours estimate: ${discovery.manual_hours_monthly}
Month-end close: ${discovery.month_end_close_duration}
Data errors: ${discovery.data_error_frequency}
Integration rating: ${discovery.integration_rating}
Critical spreadsheets: ${discovery.critical_spreadsheets}
Change appetite: ${discovery.change_appetite}
Fears: ${(discovery.systems_fears || []).join(', ')}
Champion: ${discovery.internal_champion}${stage1ContextBlock}

WHERE YOU'RE GOING / YOUR BUSINESS:
- Growth vision (12-18mo): "${TRUNCATE(discovery.growth_vision || '', MAX_TEXT)}"
- Next hires / blockers: "${TRUNCATE(discovery.hiring_blockers || '', MAX_TEXT)}"
- Growth type: ${discovery.growth_type || 'Not specified'}
- Capacity ceiling (what breaks first): "${TRUNCATE(discovery.capacity_ceiling || '', MAX_TEXT)}"
- Tried and failed (tools): "${TRUNCATE(discovery.failed_tools || '', MAX_TEXT)}"
- Non-negotiables: "${TRUNCATE(discovery.non_negotiables || '', MAX_TEXT)}"
- Business model: ${discovery.business_model || 'Not specified'}
- Team structure / roster: "${TRUNCATE(discovery.team_structure || '', MAX_TEXT)}"
- Work location: ${discovery.work_location || 'Not specified'}
- Key person dependency: "${TRUNCATE(discovery.key_person_dependency || '', MAX_TEXT)}"

TARGET STATE:
- Desired outcomes: ${mapDesiredOutcomes(discovery.desired_outcomes || []).join(' | ') || 'Not specified'}
- Monday morning vision: "${TRUNCATE(discovery.monday_morning_vision || 'Not specified', MAX_TEXT)}"
- Time freedom priority: "${TRUNCATE(discovery.time_freedom_priority || 'Not specified', MAX_TEXT)}"
- Magic fix (Focus Areas): "${TRUNCATE(discovery.magic_process_fix || 'Not specified', MAX_TEXT)}"

═══════════════════════════════════════════════════════════════════════════════
SYSTEM INVENTORY (${systemsSlice.length} systems)
═══════════════════════════════════════════════════════════════════════════════

${systemDetails}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK — Return ONLY this JSON
═══════════════════════════════════════════════════════════════════════════════

{
  "facts": {
    "companyName": "${clientName}",
    "teamSize": number,
    "projectedTeamSize": number,
    "growthMultiplier": number,
    "revenueBand": "string (the band from discovery, e.g. '1m_2m')",
    "confirmedRevenue": "string or null — if follow-up/additional context confirmed a SPECIFIC revenue figure (e.g. '£1.65m'), put it here. If only the band is known, set to null",
    "industry": "string",
    "breakingPoint": "EXACT verbatim quote",
    "monthEndShame": "EXACT verbatim quote",
    "expensiveMistake": "EXACT verbatim quote",
    "magicFix": "EXACT verbatim quote",
    "fears": ["fear1", "fear2"],
    "desiredOutcomes": ["human-readable outcome text — use the full labels provided above, not slugs"],
    "mondayMorningVision": "EXACT verbatim quote",
    "timeFreedomPriority": "What they said they'd do with reclaimed time",
    "systems": [
      {
        "name": "System name",
        "category": "category",
        "criticality": "critical|important|nice_to_have",
        "monthlyCost": number,
        "integrationMethod": "native|zapier_make|custom_api|manual|none",
        "integratesWith": ["other system names"],
        "gaps": ["specific integration gap 1", "gap 2"],
        "strengths": ["what it does well"],
        "manualHours": number,
        "dataQuality": 1-5,
        "userSatisfaction": 1-5,
        "painPoints": ["specific pain relating to this system"]
      }
    ],
    "totalSystemCost": number,
    "criticalSystems": ["names"],
    "disconnectedSystems": ["systems with no/manual integration"],
    "integrationGaps": ["Specific gap: System A doesn't talk to System B, causing X"],
    "metrics": {
      "quoteTimeMins": number,
      "invoiceLagDays": number,
      "reportingLagDays": number,
      "monthEndCloseDays": number,
      "targetCloseDays": number,
      "debtorDays": number,
      "transactionVolume": number,
      "invoiceVolume": number,
      "apVolume": number,
      "employeeCount": number
    },
    "allClientQuotes": ["every significant verbatim quote from discovery and deep dives"]
  }
}
${preliminaryAnalysis?.confidenceScores && preliminaryAnalysis.confidenceScores.length > 0 ? `
═══════════════════════════════════════════════════════════════════════════════
PRELIMINARY ANALYSIS CONTEXT
═══════════════════════════════════════════════════════════════════════════════
The preliminary analysis identified these confidence levels. Use this to strengthen your analysis in low-confidence areas:

${preliminaryAnalysis.confidenceScores.map((c: { area: string; confidence: string; reason: string }) => `- ${c.area}: ${c.confidence} (${c.reason})`).join('\n')}
` : ''}
${additionalContext && additionalContext.length > 0 ? `
═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL CONTEXT FROM FOLLOW-UP CALL
═══════════════════════════════════════════════════════════════════════════════
The practice team identified gaps in the initial assessment and gathered additional
information through a follow-up call with the client. Incorporate this context
into your analysis. Treat this as primary source evidence alongside the assessment:

${additionalContext.map((c: { area: string; tag?: string; context: string }) => `[${c.area}${c.tag ? ' — ' + c.tag : ''}]: ${c.context}`).join('\n')}
` : ''}

Return ONLY valid JSON.
`;
}

// ---------- Phase 2: ANALYSE PROCESSES (scores, uniquenessBrief, aspirationGap) ----------
function buildPhase2AnalysePrompt(
  phase1Facts: any,
  discovery: any,
  deepDives: any[],
  clientName: string,
  hourlyRate: number
): string {
  const MAX_DEEP_DIVES = 12;
  const MAX_TEXT = 600;
  const deepDivesSlice = deepDives.slice(0, MAX_DEEP_DIVES);

  const deepDiveDetails = deepDivesSlice.map((dd: any) => {
    const responses = dd.responses || {};
    const pains = dd.key_pain_points || [];
    const respEntries = Object.entries(responses)
      .filter(([k]) => !k.endsWith('_context'))
      .slice(0, 25)
      .map(([k, v]) => {
        const ctx = responses[`${k}_context`];
        return `- ${k}: ${TRUNCATE(JSON.stringify(v), 400)}${ctx ? `\n  → Context: "${TRUNCATE(String(ctx), 200)}"` : ''}`;
      });
    return `
### ${dd.chain_code.toUpperCase().replace(/_/g, ' ')}
**Pain Points (their words):**
${pains.slice(0, 15).map((p: string) => `- "${TRUNCATE(p, 300)}"`).join('\n')}
**All Responses:**
${respEntries.join('\n')}
`;
  }).join('\n\n');

  const systemSummary = (phase1Facts.systems || []).map((s: any) =>
    `- ${s.name} (${s.category}): ${s.criticality}, ${s.integrationMethod} integration, ${s.manualHours || 0} manual hrs/mo, gaps: ${(s.gaps || []).join('; ')}`
  ).join('\n');

  return `
You are analysing process deep dives for ${clientName}. Phase 1 already extracted company facts and system inventory. Now analyse the PROCESSES, generate scores, and synthesise the client's unique situation.

═══════════════════════════════════════════════════════════════════════════════
CONTEXT FROM PHASE 1
═══════════════════════════════════════════════════════════════════════════════

Company: ${clientName}
Team: ${phase1Facts.teamSize} → ${phase1Facts.projectedTeamSize} (12mo), growth multiplier: ${phase1Facts.growthMultiplier}
Revenue: ${phase1Facts.revenueBand}
Industry: ${phase1Facts.industry}

Systems extracted (${(phase1Facts.systems || []).length} total):
${systemSummary}

Total system cost: £${phase1Facts.totalSystemCost || 0}/mo
Disconnected systems: ${(phase1Facts.disconnectedSystems || []).join(', ')}
Integration gaps: ${(phase1Facts.integrationGaps || []).join('; ')}

TARGET STATE:
- Desired outcomes: ${mapDesiredOutcomes(discovery.desired_outcomes || []).join(' | ') || 'Not specified'}
- Monday morning vision: "${TRUNCATE(discovery.monday_morning_vision || 'Not specified', MAX_TEXT)}"
- Time freedom priority: "${TRUNCATE(discovery.time_freedom_priority || 'Not specified', MAX_TEXT)}"
- Magic fix: "${TRUNCATE(discovery.magic_process_fix || 'Not specified', MAX_TEXT)}"

═══════════════════════════════════════════════════════════════════════════════
PROCESS DEEP DIVES (${deepDivesSlice.length} processes) — ANALYSE THESE
═══════════════════════════════════════════════════════════════════════════════

${deepDiveDetails}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK — Return ONLY this JSON
═══════════════════════════════════════════════════════════════════════════════

{
  "uniquenessBrief": "3-4 sentences: what makes THIS client's situation different from any other small business? Emotional core, not just technical gap. Reference their specific systems, team dynamics, and aspirations.",

  "aspirationGap": "2-3 sentences: gap between where they ARE and where they WANT TO BE. Name specific systems, hours, and capabilities that are missing. Reference their desired_outcomes and monday_morning_vision.",

  "processes": [
    {
      "chainCode": "quote_to_cash",
      "chainName": "Quote-to-Cash",
      "keyPainPoints": ["verbatim pain points from deep dive"],
      "specificMetrics": { "quoteTimeMins": 90, "invoiceLagDays": 10 },
      "hoursWasted": "calculated hours per MONTH wasted in this process",
      "criticalGaps": ["specific gap causing waste — name systems involved"],
      "clientQuotes": ["relevant verbatim quotes from this chain"]
    }
  ],

  "hoursWastedWeekly": "calculated total across ALL processes (sum of monthly hoursWasted / 4)",
  "annualCostOfChaos": "hoursWastedWeekly × ${hourlyRate} × 52",
  "projectedCostAtScale": "annualCostOfChaos × ${phase1Facts.growthMultiplier} × 1.3",

  "scores": {
    "integration": { "score": 0-100, "evidence": "X of Y systems have no integration. Specific gaps: A→B, C→D" },
    "automation": { "score": 0-100, "evidence": "Specific manual processes: quote creation (Xmins), invoice triggers (manual), time backfill (Yhrs/wk)" },
    "dataAccessibility": { "score": 0-100, "evidence": "X-day reporting lag. Can't answer [question] in under Y minutes" },
    "scalability": { "score": 0-100, "evidence": "At ${phase1Facts.growthMultiplier}x growth, [system] breaks because [reason]" }
  },

  "additionalClientQuotes": ["any significant verbatim quotes from deep dives NOT already captured in Phase 1"]
}

CRITICAL NUMBER CONSISTENCY:
- hoursWastedWeekly = sum of all process hoursWasted (monthly) divided by 4
- annualCostOfChaos = hoursWastedWeekly × ${hourlyRate} × 52 (EXACT — no rounding errors)
- projectedCostAtScale = annualCostOfChaos × ${phase1Facts.growthMultiplier} × 1.3
- Round monetary to nearest £10, hours to whole number
- Score evidence must cite SPECIFIC systems and numbers from the data above

Return ONLY valid JSON.
`;
}

async function runPhase1(
  supabaseClient: any,
  engagementId: string,
  engagement: any,
  discovery: any,
  systems: any[],
  clientName: string,
  hourlyRate: number,
  openRouterKey: string,
  additionalContext?: { area: string; tag?: string; gap: string; resolution: string; context: string }[],
  preliminaryAnalysis?: { confidenceScores?: { area: string; confidence: string; reason: string }[] }
): Promise<{ success: boolean; phase: number }> {
  const prompt = buildPhase1Prompt(discovery, systems || [], clientName, hourlyRate, additionalContext, preliminaryAnalysis);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 12000, 1, openRouterKey);

  console.log('[SA Pass 1] Phase 1: Writing to DB...');
  await supabaseClient.from('sa_audit_reports').upsert(
    {
      engagement_id: engagementId,
      status: 'generating',
      executive_summary: 'Phase 1/6: Extracting facts and analysing systems...',
      pass1_data: { phase1: data },
      systems_count: (data.facts?.systems || []).length,
      llm_model: 'claude-sonnet-4.5',
      llm_tokens_used: tokensUsed,
      llm_cost: cost,
      generation_time_ms: generationTime,
      prompt_version: 'v7-5phase',
    },
    { onConflict: 'engagement_id' }
  );
  console.log('[SA Pass 1] Phase 1: DB write complete');

  return { success: true, phase: 1 };
}

// ---------- Phase 2: ANALYSE PROCESSES (scores, uniquenessBrief, aspirationGap) ----------
async function runPhase2Analyse(
  supabaseClient: any,
  engagementId: string,
  engagement: any,
  hourlyRate: number,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports')
    .select('pass1_data')
    .eq('engagement_id', engagementId)
    .single();
  if (!report?.pass1_data?.phase1) {
    throw new Error('Phase 1 data not found');
  }
  const phase1Facts = report.pass1_data.phase1.facts;

  const [discoveryRes, deepDivesRes] = await Promise.all([
    supabaseClient.from('sa_discovery_responses').select('*').eq('engagement_id', engagementId).single(),
    supabaseClient.from('sa_process_deep_dives').select('*').eq('engagement_id', engagementId),
  ]);
  if (discoveryRes.error || !discoveryRes.data) {
    throw new Error(`Discovery not found: ${discoveryRes.error?.message}`);
  }

  const clientName = phase1Facts.companyName || 'the business';
  const prompt = buildPhase2AnalysePrompt(phase1Facts, discoveryRes.data, deepDivesRes.data || [], clientName, hourlyRate);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 12000, 2, openRouterKey);

  const expectedAnnual = Math.round(data.hoursWastedWeekly * hourlyRate * 52);
  const expectedScale = Math.round(expectedAnnual * phase1Facts.growthMultiplier * 1.3);
  const tolerance = 0.05;
  if (Math.abs((data.annualCostOfChaos || 0) - expectedAnnual) / Math.max(expectedAnnual, 1) > tolerance) {
    data.annualCostOfChaos = expectedAnnual;
  }
  if (Math.abs((data.projectedCostAtScale || 0) - expectedScale) / Math.max(expectedScale, 1) > tolerance) {
    data.projectedCostAtScale = expectedScale;
  }

  const scores = data.scores;
  const avgScore = (scores.integration.score + scores.automation.score + scores.dataAccessibility.score + scores.scalability.score) / 4;
  let sentiment = 'good_with_gaps';
  if (avgScore >= 70) sentiment = 'strong_foundation';
  else if (avgScore >= 50) sentiment = 'good_with_gaps';
  else if (avgScore >= 30) sentiment = 'significant_issues';
  else sentiment = 'critical_attention';

  const existingPass1 = report.pass1_data as any;

  // Phase 2: write to pass1_data ONLY. Columns updated in Phase 8 assembly.
  console.log('[SA Pass 1] Phase 2: Writing to DB (pass1_data only, columns deferred to Phase 8)...');
  await supabaseClient
    .from('sa_audit_reports')
    .update({
      pass1_data: { ...existingPass1, phase2: data },
      executive_summary: 'Phase 2/8: Analysing processes...',
      executive_summary_sentiment: sentiment,
    })
    .eq('engagement_id', engagementId);
  console.log('[SA Pass 1] Phase 2: DB write complete');

  return { success: true, phase: 2 };
}

// ---------- Phase 3: DIAGNOSE (findings with full evidence + quick wins) ----------
const SPECIFICITY_RULES = `
SPECIFICITY RULES (non-negotiable):
1. Every finding title must name something specific: system name, role, number, process. NEVER "Improve system integration". ALWAYS "Harvest→Xero disconnect: Maria transfers 8 hours/month manually..."
2. Every finding must reference at least ONE desired_outcome by name in blocksGoal.
3. Quick wins must be things THIS team can do THIS week — name person, system, setting.
4. If a finding would be identical for a plumber and a creative agency, it's too generic. Rewrite it.

BANNED: Additionally, Furthermore, Moreover, Delve, Crucial, pivotal, vital, Testament to, Showcases, fostering, Tapestry, landscape, Synergy, leverage, streamline, optimize, holistic.
BANNED STRUCTURES: "Not only X but also Y"; "It's important to note..."; Generic recommendations like "implement a CRM", "automate invoicing" — name the specific tool, the specific person, the specific setting.
Return ONLY valid JSON.`;

function buildPhase3DiagnosePrompt(phase1: any, phase2: any, clientName: string, hourlyRate: number): string {
  const allFacts = {
    ...phase1.facts,
    processes: phase2.processes,
    hoursWastedWeekly: phase2.hoursWastedWeekly,
    annualCostOfChaos: phase2.annualCostOfChaos,
    projectedCostAtScale: phase2.projectedCostAtScale,
    aspirationGap: phase2.aspirationGap,
  };
  const factsStr = JSON.stringify(allFacts, null, 2);
  const scoresStr = JSON.stringify(phase2.scores, null, 2);
  return `
Given these extracted facts about ${clientName}, generate specific, evidence-backed findings and actionable quick wins. Use EXACT verbatim quotes where relevant. Every finding must be tied to specific systems, specific processes, and specific numbers from the data.

uniquenessBrief: ${phase2.uniquenessBrief}

facts (extracted from Phase 1 + Phase 2):
${factsStr}

scores:
${scoresStr}

Return JSON:
{
  "findings": [
    {
      "severity": "critical|high|medium|low",
      "category": "integration_gap|manual_process|data_silo|single_point_failure|scalability_risk",
      "title": "Specific title with system names and numbers — e.g. 'Harvest→Xero disconnect costs 8hrs/week in manual time entry transfer'",
      "description": "What's broken and why, using their words. Be detailed — this is the core diagnostic output.",
      "evidence": ["Specific data point 1 with number", "Data point 2 with system name"],
      "clientQuote": "Their exact words that prove this finding",
      "affectedSystems": ["Xero", "Asana"],
      "affectedProcesses": ["quote_to_cash", "record_to_report"],
      "hoursWastedWeekly": number,
      "annualCostImpact": number,
      "scalabilityImpact": "What specifically happens at ${allFacts.growthMultiplier}x growth — name the breaking point",
      "recommendation": "Specific fix — name the integration, tool, or setting change",
      "blocksGoal": "Which desired_outcome this blocks — use their exact text from desiredOutcomes"
    }
  ],
  "quickWins": [
    {
      "title": "Action with specific system name and person",
      "action": "Step 1: [specific action], Step 2: [specific action], Step 3: [specific action]",
      "systems": ["Xero", "Asana"],
      "timeToImplement": "X hours",
      "hoursSavedWeekly": number,
      "annualBenefit": number,
      "impact": "Specific outcome — what changes for the team on Monday morning"
    }
  ]
}

Generate AT LEAST 6 findings (mix of critical, high, medium). Generate AT LEAST 4 quick wins.

CRITICAL RULES FOR FINDINGS:
- SINGLE POINT OF FAILURE findings MUST have a non-zero annualCostImpact. Calculate as:
  Risk exposure = probability_of_absence × days_disrupted × daily_cost_of_disruption.
  Example: If a key person is the SPOF for invoicing, month-end, payroll, and expenses — and there is a material chance they will be unavailable for 2+ weeks in any 12-month period — the risk exposure is at least the annualised cost of all processes they solely own, multiplied by disruption probability. Assign a minimum of 30% of the total process cost they control.
- hoursWastedWeekly for SPOF findings should reflect documentation/cross-training time needed (typically 2-4h/wk for 8 weeks), NOT zero.

${SPECIFICITY_RULES}
`;
}

function buildPhase3CriticalHighPrompt(phase1: any, phase2: any, clientName: string, hourlyRate: number): string {
  const allFacts = {
    ...phase1.facts,
    processes: phase2.processes,
    hoursWastedWeekly: phase2.hoursWastedWeekly,
    annualCostOfChaos: phase2.annualCostOfChaos,
    projectedCostAtScale: phase2.projectedCostAtScale,
    aspirationGap: phase2.aspirationGap,
  };
  const factsStr = JSON.stringify(allFacts, null, 2);
  const scoresStr = JSON.stringify(phase2.scores, null, 2);
  return `
Given these extracted facts about ${clientName}, generate ONLY critical and high severity findings. Use EXACT verbatim quotes where relevant. Every finding must be tied to specific systems, specific processes, and specific numbers from the data.

uniquenessBrief: ${phase2.uniquenessBrief}

facts (extracted from Phase 1 + Phase 2):
${factsStr}

scores:
${scoresStr}

Return JSON:
{
  "findings": [
    {
      "severity": "critical|high",
      "category": "integration_gap|manual_process|data_silo|single_point_failure|scalability_risk",
      "title": "Specific title with system names and numbers",
      "description": "What's broken and why, using their words.",
      "evidence": ["Specific data point 1 with number", "Data point 2 with system name"],
      "clientQuote": "Their exact words that prove this finding",
      "affectedSystems": ["Xero", "Asana"],
      "affectedProcesses": ["quote_to_cash", "record_to_report"],
      "hoursWastedWeekly": number,
      "annualCostImpact": number,
      "scalabilityImpact": "What specifically happens at growth — name the breaking point",
      "recommendation": "Specific fix — name the integration, tool, or setting change",
      "blocksGoal": "Which desired_outcome this blocks — use their exact text from desiredOutcomes"
    }
  ]
}

Generate ALL critical and high severity findings. Focus on the most impactful issues: integration gaps causing manual workarounds, single points of failure, and processes that will break at growth. Generate 4-6 findings, all critical or high severity only. Do NOT generate medium or low severity findings — those come in the next phase.

CRITICAL RULES FOR FINDINGS:
- SINGLE POINT OF FAILURE findings MUST have a non-zero annualCostImpact.
- hoursWastedWeekly for SPOF findings should reflect documentation/cross-training time needed (typically 2-4h/wk for 8 weeks), NOT zero.

${SPECIFICITY_RULES}
Return ONLY valid JSON.`;
}

function buildPhase4MediumLowQuickWinsPrompt(phase1: any, phase2: any, phase3: any, clientName: string): string {
  const existingTitles = (phase3.findings || []).map((f: any) => f.title).filter(Boolean);
  const allFacts = {
    ...phase1.facts,
    processes: phase2.processes,
    hoursWastedWeekly: phase2.hoursWastedWeekly,
    annualCostOfChaos: phase2.annualCostOfChaos,
    projectedCostAtScale: phase2.projectedCostAtScale,
    aspirationGap: phase2.aspirationGap,
  };
  const factsStr = JSON.stringify(allFacts, null, 2);
  const scoresStr = JSON.stringify(phase2.scores, null, 2);
  return `
Phase 3 already identified these critical/high findings: ${existingTitles.length ? existingTitles.map((t: string) => `"${t}"`).join(', ') : 'none'}.

Now generate medium and low severity findings for REMAINING issues (do not duplicate the above), plus actionable quick wins. Use exact verbatim quotes where relevant.

uniquenessBrief: ${phase2.uniquenessBrief}

facts:
${factsStr}

scores:
${scoresStr}

Return JSON:
{
  "findings": [
    {
      "severity": "medium|low",
      "category": "integration_gap|manual_process|data_silo|single_point_failure|scalability_risk",
      "title": "Specific title with system names and numbers",
      "description": "What's broken and why.",
      "evidence": ["Data point 1", "Data point 2"],
      "clientQuote": "Exact words",
      "affectedSystems": ["Xero"],
      "affectedProcesses": ["quote_to_cash"],
      "hoursWastedWeekly": number,
      "annualCostImpact": number,
      "scalabilityImpact": "What happens at growth",
      "recommendation": "Specific fix",
      "blocksGoal": "Which desired_outcome this blocks"
    }
  ],
  "quickWins": [
    {
      "title": "Action with specific system name and person",
      "action": "Step 1: [action], Step 2: [action], Step 3: [action]",
      "systems": ["Xero", "Asana"],
      "timeToImplement": "X hours",
      "hoursSavedWeekly": number,
      "annualBenefit": number,
      "impact": "Specific outcome — what changes for the team on Monday morning"
    }
  ]
}

Generate 2-4 medium/low findings (do not repeat critical/high). Generate AT LEAST 4 quick wins.

${SPECIFICITY_RULES}
Return ONLY valid JSON.`;
}

async function runPhase3CriticalHigh(
  supabaseClient: any,
  engagementId: string,
  engagement: any,
  hourlyRate: number,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports')
    .select('pass1_data')
    .eq('engagement_id', engagementId)
    .single();
  if (!report?.pass1_data?.phase1 || !report.pass1_data.phase2) {
    throw new Error('Phase 1 or Phase 2 data not found');
  }
  const phase1 = report.pass1_data.phase1;
  const phase2 = report.pass1_data.phase2;
  const clientName = phase1.facts.companyName || 'the business';
  const prompt = buildPhase3CriticalHighPrompt(phase1, phase2, clientName, hourlyRate);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 8000, 3, openRouterKey);

  const existingPass1 = report.pass1_data as any;
  console.log('[SA Pass 1] Phase 3: Writing to DB (critical+high findings only)...');
  await supabaseClient
    .from('sa_audit_reports')
    .update({
      pass1_data: { ...existingPass1, phase3: { findings: data.findings || [], quickWins: [] } },
      executive_summary: 'Phase 3/8: Identifying critical findings...',
    })
    .eq('engagement_id', engagementId);
  console.log('[SA Pass 1] Phase 3: DB write complete');

  await supabaseClient.from('sa_findings').delete().eq('engagement_id', engagementId);
  if (data.findings?.length) {
    const findingRows = data.findings.map((finding: any) => ({
      engagement_id: engagementId,
      finding_code: `F-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      source_stage: 'ai_generated',
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      description: `${finding.description}${finding.blocksGoal ? `\n\nBlocks goal: ${finding.blocksGoal}` : ''}\n\nSystems: ${(finding.affectedSystems || []).join(', ')}\nProcesses: ${(finding.affectedProcesses || []).join(', ')}`,
      evidence: finding.evidence || [],
      client_quote: finding.clientQuote,
      hours_wasted_weekly: finding.hoursWastedWeekly,
      annual_cost_impact: finding.annualCostImpact,
      scalability_impact: finding.scalabilityImpact,
      recommendation: finding.recommendation,
    }));
    await supabaseClient.from('sa_findings').insert(findingRows);
  }

  return { success: true, phase: 3 };
}

async function runPhase4MediumLowQuickWins(
  supabaseClient: any,
  engagementId: string,
  engagement: any,
  hourlyRate: number,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports')
    .select('pass1_data')
    .eq('engagement_id', engagementId)
    .single();
  if (!report?.pass1_data?.phase1 || !report.pass1_data.phase2 || !report.pass1_data.phase3) {
    throw new Error('Phase 1, 2, or 3 data not found');
  }
  const phase1 = report.pass1_data.phase1;
  const phase2 = report.pass1_data.phase2;
  const phase3 = report.pass1_data.phase3;
  const clientName = phase1.facts.companyName || 'the business';
  const prompt = buildPhase4MediumLowQuickWinsPrompt(phase1, phase2, phase3, clientName);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 12000, 4, openRouterKey);

  const existingPass1 = report.pass1_data as any;
  const combinedFindings = [...(existingPass1.phase3?.findings || []), ...(data.findings || [])];
  const combinedPhase3 = {
    ...existingPass1.phase3,
    findings: combinedFindings,
    quickWins: data.quickWins || [],
  };

  console.log('[SA Pass 1] Phase 4: Merging findings and quick wins, writing to DB...');
  await supabaseClient
    .from('sa_audit_reports')
    .update({
      pass1_data: {
        ...existingPass1,
        phase3: combinedPhase3,
        phase4: { findings: data.findings || [], quickWins: data.quickWins || [] },
      },
      executive_summary: 'Phase 4/8: Completing findings and quick wins...',
    })
    .eq('engagement_id', engagementId);

  if (data.findings?.length) {
    const findingRows = data.findings.map((finding: any) => ({
      engagement_id: engagementId,
      finding_code: `F-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      source_stage: 'ai_generated',
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      description: `${finding.description}${finding.blocksGoal ? `\n\nBlocks goal: ${finding.blocksGoal}` : ''}\n\nSystems: ${(finding.affectedSystems || []).join(', ')}\nProcesses: ${(finding.affectedProcesses || []).join(', ')}`,
      evidence: finding.evidence || [],
      client_quote: finding.clientQuote,
      hours_wasted_weekly: finding.hoursWastedWeekly,
      annual_cost_impact: finding.annualCostImpact,
      scalability_impact: finding.scalabilityImpact,
      recommendation: finding.recommendation,
    }));
    await supabaseClient.from('sa_findings').insert(findingRows);
  }
  console.log('[SA Pass 1] Phase 4: DB write complete');

  return { success: true, phase: 4 };
}

// ---------- Tech stack intelligence context (Stage 2) ----------
function buildTechContext(
  matchedProducts: { systemName: string; categoryCode: string; slug: string | null; techProduct: any }[],
  relevantIntegrations: any[],
  alternativeProducts: any[],
  relevantMiddleware: any[],
  discovery: any
): string {
  const currentStackContext = matchedProducts
    .filter((mp) => mp.techProduct)
    .map((mp) => {
      const tp = mp.techProduct;
      return `
**${tp.product_name}** (${tp.category}) — Client uses this
- Market position: ${tp.market_position}
- Sweet spot: ${tp.sweet_min_employees}-${tp.sweet_max_employees} employees
- Pricing: £${tp.price_entry_gbp}/mo (entry) to £${tp.price_top_gbp ?? '?'}/mo (top). Model: ${tp.pricing_model}
- Scores: Ease=${tp.score_ease}/5, Features=${tp.score_features}/5, Integrations=${tp.score_integrations}/5, Reporting=${tp.score_reporting}/5, Scalability=${tp.score_scalability}/5
- Strengths: ${(tp.key_strengths || []).join(', ')}
- Weaknesses: ${(tp.key_weaknesses || []).join(', ')}
- Best for: ${tp.best_for || 'N/A'}
- Not ideal for: ${tp.not_ideal_for || 'N/A'}`;
    })
    .join('\n');

  const integrationContext = relevantIntegrations
    .map(
      (ti: any) =>
        `${ti.product_a_slug} ↔ ${ti.product_b_slug}: type=${ti.integration_type}, quality=${ti.quality}, bidirectional=${ti.bidirectional}, data_flows=[${ti.data_flows || 'N/A'}], setup=${ti.setup_complexity}, cost=£${ti.monthly_cost_gbp || 0}/mo, limitations=[${ti.known_limitations || 'none'}]`
    )
    .join('\n');

  const alternativesContext = alternativeProducts
    .filter((ap: any) => !matchedProducts.find((mp) => mp.slug === ap.slug))
    .slice(0, 50)
    .map(
      (ap: any) => {
        const categories = [ap.category, ...(ap.additional_categories || [])].join(', ');
        return `**${ap.product_name}** (${categories}) — ${ap.market_position}
  Sweet spot: ${ap.sweet_min_employees}-${ap.sweet_max_employees} employees
  Pricing: £${ap.price_entry_gbp}/mo entry, £${ap.price_mid_gbp}/mo mid. ${ap.is_per_user ? 'Per user' : 'Flat'}
  Scores: Ease=${ap.score_ease}/5, Features=${ap.score_features}/5, Integrations=${ap.score_integrations}/5
  Strengths: ${(ap.key_strengths || []).slice(0, 3).join(', ')}
  Can replace: ${(ap.can_replace || []).join(', ')}
  Migration complexity: ${ap.migration_complexity || 'unknown'}`;
      }
    )
    .join('\n');

  const middlewareContext: Record<string, { slug: string; platform: string; triggers: string[]; actions: string[]; searches: string[] }> = {};
  for (const mc of relevantMiddleware) {
    const key = `${mc.product_slug}_${mc.platform}`;
    if (!middlewareContext[key]) {
      middlewareContext[key] = { slug: mc.product_slug, platform: mc.platform, triggers: [], actions: [], searches: [] };
    }
    if (mc.capability_type === 'trigger') middlewareContext[key].triggers.push(mc.capability_name);
    if (mc.capability_type === 'action') middlewareContext[key].actions.push(mc.capability_name);
    if (mc.capability_type === 'search') middlewareContext[key].searches.push(mc.capability_name);
  }
  const middlewareStr = Object.values(middlewareContext)
    .map(
      (mc: any) =>
        `${mc.slug} on ${mc.platform}: ${mc.triggers.length} triggers, ${mc.actions.length} actions. Key triggers: [${mc.triggers.slice(0, 5).join(', ')}]. Key actions: [${mc.actions.slice(0, 5).join(', ')}]`
    )
    .join('\n');

  const d = discovery || {};
  const strategyStr = `
Team size: ${d.team_size || '?'} → ${d.expected_team_size_12mo || '?'} (12 months)
Revenue: ${d.revenue_band || '?'}
Growth trajectory: ${d.growth_trajectory || 'not specified'}
Owner role intent: ${d.owner_role_intent || 'not specified'}
Budget appetite: ${d.systems_budget_appetite || 'not specified'}
Growth constraint: ${d.biggest_growth_constraint || 'not specified'}`;

  return `
═══════════════════════════════════════════════════════════
TECH STACK INTELLIGENCE DATABASE
═══════════════════════════════════════════════════════════

THEIR CURRENT TOOLS (from our database):
${currentStackContext || 'No products matched in tech database'}

KNOWN INTEGRATIONS BETWEEN THEIR TOOLS:
${integrationContext || 'No integration data found'}

ALTERNATIVE PRODUCTS AVAILABLE:
${alternativesContext || 'No alternatives found'}

MIDDLEWARE CAPABILITIES (Zapier/Make):
${middlewareStr || 'No middleware data found'}

CLIENT'S STRATEGIC DIRECTION:
${strategyStr}
`;
}

// ---------- Phase 4: RECOMMEND (recommendations only — systems maps in separate phase) ----------
function buildPhase4Prompt(phase1: any, phase2: any, phase3: any, clientName: string): string {
  const findingSummaries = (phase3.findings || []).map((f: any) => ({
    title: f.title, severity: f.severity, affectedSystems: f.affectedSystems,
    hoursWastedWeekly: f.hoursWastedWeekly, annualCostImpact: f.annualCostImpact, blocksGoal: f.blocksGoal,
  }));
  return `
Given these facts, analysis, and findings for ${clientName}, generate detailed recommendations. Each recommendation must have clear ROI, connect to their specific goals, and reference their exact systems.

uniquenessBrief: ${phase2.uniquenessBrief}

Key context:
- Desired outcomes: ${JSON.stringify(phase1.facts.desiredOutcomes)}
- Monday morning vision: "${phase1.facts.mondayMorningVision}"
- Aspiration gap: "${phase2.aspirationGap}"
- Hours wasted weekly: ${phase2.hoursWastedWeekly}
- Annual cost of chaos: £${phase2.annualCostOfChaos}

Systems (name, cost, gaps):
${JSON.stringify(phase1.facts.systems?.map((s: any) => ({ name: s.name, monthlyCost: s.monthlyCost, gaps: s.gaps, integrationMethod: s.integrationMethod })), null, 2)}

Processes (name, hours wasted):
${JSON.stringify(phase2.processes?.map((p: any) => ({ chainName: p.chainName, chainCode: p.chainCode, hoursWasted: p.hoursWasted, criticalGaps: p.criticalGaps })), null, 2)}

Findings to address:
${JSON.stringify(findingSummaries, null, 2)}

Quick wins already identified:
${JSON.stringify((phase3.quickWins || []).map((q: any) => ({ title: q.title, hoursSavedWeekly: q.hoursSavedWeekly })), null, 2)}

Return JSON:
{
  "recommendations": [
    {
      "priorityRank": 1,
      "title": "Recommendation title with specific systems — e.g. 'Connect Harvest→Xero for automated time-to-invoice flow'",
      "description": "Detailed description of what this fixes, how it works, and why it matters for THIS client. Reference specific findings it addresses.",
      "category": "foundation|quick_win|strategic|optimization",
      "implementationPhase": "immediate|short_term|medium_term|long_term",
      "systemsInvolved": ["Xero", "Asana"],
      "processesFixed": ["quote_to_cash"],
      "findingsAddressed": ["Finding title 1", "Finding title 2"],
      "estimatedCost": number,
      "hoursSavedWeekly": number,
      "annualBenefit": number,
      "paybackMonths": number,
      "freedomUnlocked": "Echo their monday_morning_vision — use THEIR language. What does Monday morning look like after this is done?",
      "goalsAdvanced": ["Which desired_outcomes this advances — use EXACT text from their desiredOutcomes"]
    }
  ]
}

Generate AT LEAST 5 recommendations, prioritised. Mix of immediate wins and strategic changes.
Sum of all recommendations.hoursSavedWeekly must not exceed ${phase2.hoursWastedWeekly} (can't save more hours than are wasted).
Every recommendation must reference at least one finding and at least one desired_outcome.
${SPECIFICITY_RULES}
`;
}

// ---------- Phase 4b: SYSTEMS MAPS (separate call after recommendations) ----------
function buildPhase4SystemsMapsPrompt(phase1: any, phase2: any, phase3: any, phase4: any, techContextStr: string, clientName: string): string {
  const summary = JSON.stringify(
    {
      companyName: phase1.facts?.companyName,
      systems: phase1.facts?.systems?.map((s: any) => ({ name: s.name, category: s.category, monthlyCost: s.monthlyCost, integrationMethod: s.integrationMethod, manualHours: s.manualHours })),
      totalSystemCost: phase1.facts?.totalSystemCost,
      hoursWastedWeekly: phase2.hoursWastedWeekly,
      annualCostOfChaos: phase2.annualCostOfChaos,
      findings: (phase3.findings || []).slice(0, 8).map((f: any) => ({ title: f.title, severity: f.severity, affectedSystems: f.affectedSystems })),
      recommendations: (phase4.recommendations || []).slice(0, 6).map((r: any) => ({ title: r.title, systemsInvolved: r.systemsInvolved, hoursSavedWeekly: r.hoursSavedWeekly })),
    },
    null,
    2
  ).substring(0, 28000);

  return `
You have the extracted analysis for ${clientName}. Using it AND the tech stack intelligence below, generate ONLY systems maps, tech stack summary, and hours breakdown.

PASS 1 ANALYSIS (summary):
${summary}

${techContextStr}

═══════════════════════════════════════════════════════════
YOUR TASK — Return ONLY this JSON (no other text)
═══════════════════════════════════════════════════════════

{
  "systemsMaps": [
    {
      "level": 1,
      "title": "Where You Are Today",
      "description": "One sentence description",
      "nodes": [ { "id": "slug", "name": "Product name", "category": "category_code", "monthlyCost": number, "status": "keep", "verdict": "string", "satisfactionScore": 1-5 } ],
      "edges": [ { "from": "slug", "to": "slug", "status": "active|broken|off|manual|middleware|native_new|none", "colour": "green|amber|red|blue|grey", "dataFlows": [], "manualHoursMonthly": number, "middlewareTool": null, "middlewareCostMonthly": 0, "changeFromPrevious": null } ],
      "metrics": { "monthlySoftwareCost": number, "manualHoursWeekly": number, "annualWastedCost": number, "annualSavingsVsMap1": 0, "oneOffInvestment": 0, "activeIntegrations": "2/9" },
      "changes": [],
      "narrative": "2-3 paragraph explanation",
      "recommendedLevel": false,
      "recommendationReason": null
    }
  ],
  "techStackSummary": {
    "currentMonthlySpend": number,
    "recommendedMonthlySpend": number,
    "netMonthlyDelta": number,
    "toolsToKeep": [],
    "toolsToReconfigure": [],
    "toolsToReplace": [ { "current": "string", "replacement": "string", "reason": "string" } ],
    "toolsToAdd": [ { "product": "string", "reason": "string" } ],
    "toolsToRemove": []
  },
  "hoursBreakdown": {
    "quickWins": number,
    "foundation": number,
    "strategic": number,
    "optimisation": number,
    "total": number
  }
}

FOUR-LEVEL SYSTEMS MAPS: Generate exactly 4 entries. MAP 1 = Where You Are Today (every inventory system as node; edges from assessment: red=manual/none, amber=issues, green=working). MAP 2 = What Your Current Tools Can Already Do (same nodes; upgrade RED/AMBER to green where NATIVE integration exists in TECH INTEGRATIONS DATA; £0 investment). MAP 3 = Connected With Middleware (add Zapier/Make bridges, blue edges; include middleware cost). MAP 4 = The Optimal Stack (use ALTERNATIVE PRODUCTS; recommend replacements; sweet spot fit). Set recommendedLevel: true on ONE map. Node IDs = slug format. Map 1 metrics.annualWastedCost = annualCostOfChaos. Manual hours decrease Map 1 > 2 > 3 > 4. hoursBreakdown.total = sum of quickWins+foundation+strategic+optimisation.
Return ONLY valid JSON.
`;
}

async function runPhase5Recommendations(
  supabaseClient: any,
  engagementId: string,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports').select('pass1_data').eq('engagement_id', engagementId).single();
  if (!report?.pass1_data?.phase1 || !report.pass1_data.phase2 || !report.pass1_data.phase3 || !report.pass1_data.phase4) {
    throw new Error('Phase 1, 2, 3, or 4 data not found');
  }

  const phase1 = report.pass1_data.phase1;
  const phase2 = report.pass1_data.phase2;
  const phase3 = report.pass1_data.phase3;
  const clientName = phase1.facts.companyName || 'the business';

  const prompt = buildPhase4Prompt(phase1, phase2, phase3, clientName);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 12000, 5, openRouterKey);

  console.log('[SA Pass 1] Phase 5: Writing recommendations to DB...');
  await supabaseClient.from('sa_audit_reports').update({
    pass1_data: { ...report.pass1_data, phase5: data },
    executive_summary: 'Phase 5/8: Building recommendations...',
  }).eq('engagement_id', engagementId);

  await supabaseClient.from('sa_recommendations').delete().eq('engagement_id', engagementId);
  const recs = data.recommendations || [];
  if (recs.length) {
    const recRows = recs.map((rec: any) => ({
      engagement_id: engagementId,
      priority_rank: rec.priorityRank,
      title: rec.title,
      description: rec.description,
      category: rec.category,
      implementation_phase: rec.implementationPhase,
      estimated_cost: rec.estimatedCost,
      hours_saved_weekly: rec.hoursSavedWeekly,
      annual_cost_savings: rec.annualBenefit,
      time_reclaimed_weekly: rec.hoursSavedWeekly,
      freedom_unlocked: `${rec.freedomUnlocked || ''}${rec.goalsAdvanced?.length ? `\n\nAdvances: ${rec.goalsAdvanced.join('; ')}` : ''}`,
    }));
    await supabaseClient.from('sa_recommendations').insert(recRows);
  }
  console.log('[SA Pass 1] Phase 5: Recommendations complete');

  return { success: true, phase: 5 };
}

async function runPhase6SystemsMaps(
  supabaseClient: any,
  engagementId: string,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports').select('pass1_data').eq('engagement_id', engagementId).single();
  if (!report?.pass1_data?.phase1 || !report.pass1_data.phase5) {
    throw new Error('Phase 1 or 5 (recommendations) data not found');
  }
  const phase1 = report.pass1_data.phase1;
  const phase5 = report.pass1_data.phase5;

  let optimalStack: any = null;
  try {
    console.log('[SA Pass 1] Phase 6: Generating optimal stack hint...');
    const phase4bPrompt = buildPhase4bPrompt(phase1.facts, phase5.recommendations || []);
    const phase4bResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor SA Pass 1 Phase 6 Optimal Stack',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [{ role: 'user', content: phase4bPrompt }],
        temperature: 0.2,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (phase4bResponse.ok) {
      const phase4bJson = await phase4bResponse.json();
      let content = (phase4bJson.choices?.[0]?.message?.content ?? '').trim();
      content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
      optimalStack = JSON.parse(content);
      console.log('[SA Pass 1] Phase 6: Optimal stack generated:', Object.keys(optimalStack?.nodes || {}).length, 'systems,', (optimalStack?.edges || []).length, 'edges');
    }
  } catch (e: any) {
    console.warn('[SA Pass 1] Phase 6: Optimal stack generation failed (non-blocking):', e?.message ?? e);
  }

  let phase6Data: any = { systemsMaps: null, techStackSummary: null, hoursBreakdown: null, optimalStack };
  try {
    const mapsResult = await runPhase4SystemsMaps(supabaseClient, engagementId, openRouterKey);
    phase6Data = { ...mapsResult, optimalStack };
    console.log(`[SA Pass 1] Phase 6: Systems maps: ${mapsResult.systemsMaps?.length || 0} levels`);
  } catch (mapsErr: any) {
    console.warn('[SA Pass 1] Phase 6: Systems maps generation failed:', mapsErr?.message ?? mapsErr);
  }

  const existingPass1 = report.pass1_data as any;
  await supabaseClient
    .from('sa_audit_reports')
    .update({
      pass1_data: { ...existingPass1, phase6: phase6Data },
      executive_summary: 'Phase 6/8: Generating technology roadmap...',
    })
    .eq('engagement_id', engagementId);

  return { success: true, phase: 6 };
}

async function runPhase4SystemsMaps(
  supabaseClient: any,
  engagementId: string,
  openRouterKey: string
): Promise<{ systemsMaps: any; techStackSummary: any; hoursBreakdown: any }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports').select('pass1_data').eq('engagement_id', engagementId).single();
  if (!report?.pass1_data?.phase1 || !report.pass1_data.phase5) {
    throw new Error('Phase 1 or 5 (recommendations) data not found');
  }
  const phase1 = report.pass1_data.phase1;
  const phase2 = report.pass1_data.phase2;
  const phase3 = report.pass1_data.phase3;
  const phase4 = report.pass1_data.phase5;
  const clientName = phase1.facts?.companyName || 'the business';

  console.log('[SA Pass 1] Querying tech stack for systems maps...');
  const { data: techProducts, error: techError } = await supabaseClient
    .from('sa_tech_products')
    .select('*')
    .eq('uk_strong', true);
  if (techError) console.warn('[SA Pass 1] Tech products query failed:', techError.message);
  const { data: techIntegrations } = await supabaseClient.from('sa_tech_integrations').select('*');
  const { data: middlewareCapabilities } = await supabaseClient.from('sa_middleware_capabilities').select('*');

  const systems = phase1.facts?.systems || [];
  const matchedProducts = systems.map((s: any) => {
    const name = (s.name || '').trim();
    const normalised = name.toLowerCase();
    const slugified = normalised.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const match = (techProducts || []).find(
      (tp: any) =>
        tp.slug === slugified ||
        (tp.product_name || '').toLowerCase() === normalised ||
        normalised.includes((tp.product_name || '').toLowerCase()) ||
        (tp.product_name || '').toLowerCase().includes(normalised) ||
        (tp.slug && tp.slug.startsWith(slugified)) ||
        (tp.slug && slugified.startsWith(tp.slug))
    );
    return { systemName: name, categoryCode: s.category || '', slug: match?.slug || null, techProduct: match || null };
  });
  const matchedSlugs = matchedProducts.filter((m: any) => m.techProduct).map((m: any) => m.slug);
  const relevantIntegrations = (techIntegrations || []).filter(
    (ti: any) => matchedSlugs.includes(ti.product_a_slug) || matchedSlugs.includes(ti.product_b_slug)
  );
  const clientCategories = [...new Set(systems.map((s: any) => s.category).filter(Boolean))];
  const alternativeProducts = (techProducts || []).filter(
    (tp: any) =>
      clientCategories.includes(tp.category) ||
      (tp.additional_categories && tp.additional_categories.some((ac: string) => clientCategories.includes(ac)))
  );
  const relevantMiddleware = (middlewareCapabilities || []).filter((mc: any) => matchedSlugs.includes(mc.product_slug));

  const { data: discoveryRes } = await supabaseClient
    .from('sa_discovery_responses')
    .select('*')
    .eq('engagement_id', engagementId)
    .single();
  const techContextStr = buildTechContext(matchedProducts, relevantIntegrations, alternativeProducts, relevantMiddleware, discoveryRes);
  const mapsPrompt = buildPhase4SystemsMapsPrompt(phase1, phase2, phase3, phase4, techContextStr, clientName);

  const { data: mapsData, tokensUsed, cost, generationTime } = await callSonnet(mapsPrompt, 12000, 6, openRouterKey);

  const wasTruncated = typeof mapsData?.systemsMaps === 'undefined' || (Array.isArray(mapsData.systemsMaps) && mapsData.systemsMaps.length < 4);
  if (wasTruncated) {
    console.warn('[SA Pass 1] Systems maps response may be truncated');
  }

  return {
    systemsMaps: mapsData?.systemsMaps ?? null,
    techStackSummary: mapsData?.techStackSummary ?? null,
    hoursBreakdown: mapsData?.hoursBreakdown ?? null,
  };
}

// ---------- Phase 7: ADMIN GUIDANCE (talking points, questions, tasks, risk flags) ----------
function buildPhase7AdminGuidancePrompt(phase1: any, phase2: any, phase3: any, phase5: any, clientName: string): string {
  const topFindings = (phase3.findings || []).slice(0, 5).map((f: any) => ({
    title: f.title, severity: f.severity, hoursWastedWeekly: f.hoursWastedWeekly,
    annualCostImpact: f.annualCostImpact, clientQuote: f.clientQuote, blocksGoal: f.blocksGoal,
  }));
  const topRecs = (phase5.recommendations || []).slice(0, 5).map((r: any) => ({
    title: r.title, priorityRank: r.priorityRank, estimatedCost: r.estimatedCost,
    annualBenefit: r.annualBenefit, hoursSavedWeekly: r.hoursSavedWeekly, freedomUnlocked: r.freedomUnlocked,
  }));
  return `
Given the full analysis for ${clientName}, generate admin guidance for the practice team's client meeting. Return ONLY the adminGuidance object (no client presentation).

CONTEXT:
uniquenessBrief: ${phase2.uniquenessBrief}
aspirationGap: ${phase2.aspirationGap}
desiredOutcomes: ${JSON.stringify(phase1.facts.desiredOutcomes)}
mondayMorningVision: "${phase1.facts.mondayMorningVision}"
magicFix: "${phase1.facts.magicFix}"
expensiveMistake: "${phase1.facts.expensiveMistake}"
breakingPoint: "${phase1.facts.breakingPoint}"
fears: ${JSON.stringify(phase1.facts.fears)}
hoursWastedWeekly: ${phase2.hoursWastedWeekly}
annualCostOfChaos: £${phase2.annualCostOfChaos}

Top findings: ${JSON.stringify(topFindings, null, 2)}
Top recommendations: ${JSON.stringify(topRecs, null, 2)}
Quick wins: ${JSON.stringify((phase3.quickWins || []).map((q: any) => ({ title: q.title, impact: q.impact })))}

Return ONLY this JSON (no other keys):
{
  "adminGuidance": {
    "talkingPoints": [ { "topic": "string", "point": "string", "clientQuote": "string", "importance": "critical|high|medium" } ],
    "questionsToAsk": [ { "question": "string", "purpose": "string", "expectedInsight": "string", "followUp": "string" } ],
    "nextSteps": [ { "action": "string", "owner": "string", "timing": "string", "outcome": "string", "priority": number } ],
    "tasks": [ { "task": "string", "assignTo": "string", "dueDate": "string", "deliverable": "string" } ],
    "riskFlags": [ { "flag": "string", "mitigation": "string", "severity": "high|medium|low" } ]
  }
}

RULES: AT LEAST 6 talking points, AT LEAST 5 questions, AT LEAST 4 next steps, AT LEAST 4 tasks. Flag ALL risks.
${SPECIFICITY_RULES}
Return ONLY valid JSON.`;
}

async function runPhase7AdminGuidance(
  supabaseClient: any,
  engagementId: string,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports').select('pass1_data').eq('engagement_id', engagementId).single();
  if (!report?.pass1_data?.phase1 || !report.pass1_data.phase2 || !report.pass1_data.phase3 || !report.pass1_data.phase5) {
    throw new Error('Phase 1, 2, 3, or 5 data not found');
  }
  const phase1 = report.pass1_data.phase1;
  const phase2 = report.pass1_data.phase2;
  const phase3 = report.pass1_data.phase3;
  const phase5 = report.pass1_data.phase5;
  const clientName = phase1.facts.companyName || 'the business';
  const prompt = buildPhase7AdminGuidancePrompt(phase1, phase2, phase3, phase5, clientName);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 12000, 7, openRouterKey);

  const existingPass1 = report.pass1_data as any;
  await supabaseClient
    .from('sa_audit_reports')
    .update({
      pass1_data: { ...existingPass1, phase7: data || { adminGuidance: null } },
      executive_summary: 'Phase 7/8: Preparing practice team guidance...',
    })
    .eq('engagement_id', engagementId);
  return { success: true, phase: 7 };
}

// ---------- Phase 8: CLIENT PRESENTATION + FINAL ASSEMBLY ----------
function buildPhase8ClientPresentationPrompt(phase1: any, phase2: any, phase3: any, phase5: any, clientName: string): string {
  const topFindings = (phase3.findings || []).slice(0, 5).map((f: any) => ({ title: f.title, severity: f.severity, annualCostImpact: f.annualCostImpact }));
  const topRecs = (phase5.recommendations || []).slice(0, 5).map((r: any) => ({ title: r.title, estimatedCost: r.estimatedCost, annualBenefit: r.annualBenefit }));
  return `
Given the full analysis for ${clientName}, generate the client-facing presentation summary only. Jargon-free for an MD.

CONTEXT:
uniquenessBrief: ${phase2.uniquenessBrief}
aspirationGap: ${phase2.aspirationGap}
hoursWastedWeekly: ${phase2.hoursWastedWeekly}
annualCostOfChaos: £${phase2.annualCostOfChaos}
Top findings: ${JSON.stringify(topFindings)}
Top recommendations: ${JSON.stringify(topRecs)}

Return ONLY this JSON:
{
  "clientPresentation": {
    "executiveBrief": "One paragraph (under 100 words) for a busy MD — lead with the cost, name their goal, show the path. No jargon.",
    "roiSummary": {
      "currentAnnualCost": number,
      "projectedSavings": number,
      "implementationCost": number,
      "paybackPeriod": "X months",
      "threeYearROI": "X:1",
      "timeReclaimed": "X hours/week"
    },
    "topThreeIssues": [
      { "issue": "string", "impact": "string", "solution": "string", "timeToFix": "string" }
    ]
  }
}
Return ONLY valid JSON.`;
}

async function runPhase8Presentation(
  supabaseClient: any,
  engagementId: string,
  openRouterKey: string
): Promise<{ success: boolean; phase: number; reportId: string }> {
  const { data: reportRow } = await supabaseClient
    .from('sa_audit_reports').select('id, pass1_data').eq('engagement_id', engagementId).single();
  if (!reportRow?.pass1_data?.phase1 || !reportRow.pass1_data.phase2 || !reportRow.pass1_data.phase3 || !reportRow.pass1_data.phase5 || !reportRow.pass1_data.phase7) {
    throw new Error('Phase 1, 2, 3, 5, or 7 data not found');
  }

  const phase1 = reportRow.pass1_data.phase1;
  const phase2 = reportRow.pass1_data.phase2;
  const phase3 = reportRow.pass1_data.phase3;
  const phase5Recs = reportRow.pass1_data.phase5;
  const phase6 = reportRow.pass1_data.phase6;
  const phase7 = reportRow.pass1_data.phase7;
  const clientName = phase1.facts.companyName || 'the business';

  const prompt = buildPhase8ClientPresentationPrompt(phase1, phase2, phase3, phase5Recs, clientName);
  let phase8Result = await callSonnet(prompt, 8000, 8, openRouterKey);
  let { data: phase8, tokensUsed, cost, generationTime } = phase8Result;
  if (!phase8) {
    console.error('[SA Pass 1] Phase 8: Response did not parse');
    phase8 = { clientPresentation: null };
  }

  const allQuotes = [
    ...(phase1.facts.allClientQuotes || []),
    ...(phase2.additionalClientQuotes || []),
  ];

  const pass1Data = reportRow.pass1_data as any;

  const { data: staffMembers } = await supabaseClient
    .from('sa_staff_members')
    .select('id, name, role_title, department, hourly_rate, hours_per_week')
    .eq('engagement_id', engagementId);
  const staffForFacts = (staffMembers || []).map((sm: any) => ({
    id: sm.id,
    name: sm.name,
    roleTitle: sm.role_title,
    hourlyRate: Number(sm.hourly_rate),
    hoursPerWeek: Number(sm.hours_per_week) || 37.5,
  }));

  const finalPass1Data = {
    uniquenessBrief: phase2.uniquenessBrief,
    facts: {
      ...phase1.facts,
      processes: phase2.processes,
      hoursWastedWeekly: typeof phase2.hoursWastedWeekly === 'number' ? phase2.hoursWastedWeekly : parseFloat(String(phase2.hoursWastedWeekly).replace(/[£,]/g, '')) || 0,
      annualCostOfChaos: typeof phase2.annualCostOfChaos === 'number' ? phase2.annualCostOfChaos : parseFloat(String(phase2.annualCostOfChaos).replace(/[£,]/g, '')) || 0,
      projectedCostAtScale: typeof phase2.projectedCostAtScale === 'number' ? phase2.projectedCostAtScale : parseFloat(String(phase2.projectedCostAtScale).replace(/[£,]/g, '')) || 0,
      aspirationGap: phase2.aspirationGap,
      allClientQuotes: allQuotes,
      staffMembers: staffForFacts,
    },
    scores: phase2.scores,
    findings: phase3.findings,
    quickWins: phase3.quickWins,
    recommendations: phase5Recs.recommendations,
    systemsMaps: (phase6?.systemsMaps ?? pass1Data.systemsMaps) as any,
    techStackSummary: phase6?.techStackSummary ?? pass1Data.techStackSummary ?? null,
    hoursBreakdown: phase6?.hoursBreakdown ?? pass1Data.hoursBreakdown ?? null,
    adminGuidance: phase7?.adminGuidance ?? null,
    clientPresentation: phase8?.clientPresentation ?? null,
  };

  const { data: engRow } = await supabaseClient.from('sa_engagements').select('hourly_rate').eq('id', engagementId).single();
  const hourlyRate = engRow?.hourly_rate != null ? Number(engRow.hourly_rate) : 45;

  const phase4b = phase6?.optimalStack ?? pass1Data.phase4b ?? null;
  if (!finalPass1Data.systemsMaps && (phase4b || phase6?.systemsMaps)) {
    console.log('[SA Pass 1] Phase 8: Building deterministic systems maps from phase6 data...');
    const systemsMaps = buildSystemsMaps(
      finalPass1Data.facts,
      finalPass1Data.findings || [],
      finalPass1Data.recommendations || [],
      phase4b,
      hourlyRate,
      { ...pass1Data, systemsMaps: phase6?.systemsMaps },
    );
    if (systemsMaps.length > 0) {
      finalPass1Data.systemsMaps = systemsMaps;
      console.log(`[SA Pass 1] Phase 8: Built ${systemsMaps.length} systems maps`);
    }
  }

  // ─── McKinsey Number Reconciliation Layer ──────────────────────────
  // Every number must trace to ONE calculation chain. pass1_data is the single source of truth.
  const f = finalPass1Data.facts;
  const recs = finalPass1Data.recommendations || [];
  const qwins = finalPass1Data.quickWins || [];
  const assembledScores = finalPass1Data.scores || {};

  const totalInvestment = recs.reduce((sum: number, r: any) => sum + (r.estimatedCost || 0), 0);
  const totalBenefit = recs.reduce((sum: number, r: any) => sum + (r.annualBenefit || 0), 0);
  const hoursReclaimable = recs.reduce((sum: number, r: any) => sum + (parseFloat(r.hoursSavedWeekly) || 0), 0);

  const paybackMonths = totalBenefit > 0 && totalInvestment > 0
    ? Math.max(1, Math.round(totalInvestment / (totalBenefit / 12)))
    : 0;
  const roiRatio = totalInvestment > 0 ? `${Math.round(totalBenefit / totalInvestment)}:1` : 'Infinite';

  const expectedAnnualCost = Math.round((f.hoursWastedWeekly || 0) * hourlyRate * 52);
  if (f.annualCostOfChaos !== expectedAnnualCost) {
    console.log(`[SA McKinsey] Aligning annualCostOfChaos: AI=${f.annualCostOfChaos}, calc=${expectedAnnualCost}. Using calculated.`);
    f.annualCostOfChaos = expectedAnnualCost;
    finalPass1Data.facts.annualCostOfChaos = expectedAnnualCost;
  }

  const expectedProjected = Math.round((f.annualCostOfChaos || expectedAnnualCost) * (f.growthMultiplier || 1.3) * 1.3);
  if (f.projectedCostAtScale && Math.abs(f.projectedCostAtScale - expectedProjected) > expectedProjected * 0.20) {
    console.warn(`[SA McKinsey] projectedCostAtScale divergence: pass1=${f.projectedCostAtScale}, linear=${expectedProjected}. Keeping pass1 value (non-linear scaling is intentional).`);
  }

  if (finalPass1Data.clientPresentation?.roiSummary) {
    const roi = finalPass1Data.clientPresentation.roiSummary;
    roi.currentAnnualCost = f.annualCostOfChaos || expectedAnnualCost;
    roi.projectedSavings = totalBenefit;
    roi.implementationCost = totalInvestment;
    roi.paybackPeriod = paybackMonths <= 0 ? 'Immediate' : `${paybackMonths} months`;
    roi.threeYearROI = totalInvestment > 0 ? `${Math.round(totalBenefit * 3 / totalInvestment)}:1` : 'Infinite';
    roi.timeReclaimed = `${Math.round(hoursReclaimable)} hours/week`;
  }

  const findingCounts = {
    critical: (finalPass1Data.findings || []).filter((x: any) => x.severity === 'critical').length,
    high: (finalPass1Data.findings || []).filter((x: any) => x.severity === 'high').length,
    medium: (finalPass1Data.findings || []).filter((x: any) => x.severity === 'medium').length,
    low: (finalPass1Data.findings || []).filter((x: any) => x.severity === 'low').length,
  };

  const fmt = (v: any) => String(v ?? 0).replace(/£/g, '');
  console.log(`[SA McKinsey] Reconciliation complete:
    annualCostOfChaos: £${fmt(f.annualCostOfChaos)} (${f.hoursWastedWeekly}h × £${hourlyRate} × 52)
    projectedCostAtScale: £${fmt(f.projectedCostAtScale)} (${f.growthMultiplier}x growth)
    totalBenefit: £${fmt(totalBenefit)} (${recs.length} recs)
    totalInvestment: £${fmt(totalInvestment)}
    hoursReclaimable: ${hoursReclaimable}h/wk
    payback: ${paybackMonths} months | ROI: ${roiRatio}
    findings: ${findingCounts.critical}C/${findingCounts.high}H/${findingCounts.medium}M/${findingCounts.low}L
    quickWins: ${qwins.length}`);

  console.log('[SA Pass 1] Phase 8: Writing final report to DB...');
  const updatePayload: any = {
    pass1_data: finalPass1Data,
    status: 'pass1_complete',
    executive_summary: '[Pass 2 will generate narrative]',
    headline: `[PENDING PASS 2] ${f.hoursWastedWeekly || 0} hours/week wasted`,

    total_hours_wasted_weekly: Math.round(f.hoursWastedWeekly || 0),
    total_annual_cost_of_chaos: Math.round(f.annualCostOfChaos || expectedAnnualCost),
    growth_multiplier: f.growthMultiplier || 1.3,
    projected_cost_at_scale: Math.round(f.projectedCostAtScale || expectedProjected),

    integration_score: assembledScores.integration?.score ?? 0,
    automation_score: assembledScores.automation?.score ?? 0,
    data_accessibility_score: assembledScores.dataAccessibility?.score ?? 0,
    scalability_score: assembledScores.scalability?.score ?? 0,

    critical_findings_count: findingCounts.critical,
    high_findings_count: findingCounts.high,
    medium_findings_count: findingCounts.medium,
    low_findings_count: findingCounts.low,

    total_recommended_investment: Math.round(totalInvestment),
    total_annual_benefit: Math.round(totalBenefit),
    overall_payback_months: paybackMonths,
    roi_ratio: roiRatio,
    hours_reclaimable_weekly: Math.round(hoursReclaimable),

    quick_wins: finalPass1Data.quickWins || [],
    cost_of_chaos_narrative: '[Pass 2 will generate narrative]',
    time_freedom_narrative: '[Pass 2 will generate narrative]',
    what_this_enables: [f.magicFix?.substring(0, 200) || ''],
    client_quotes_used: allQuotes.slice(0, 10),
    generated_at: new Date().toISOString(),
  };
  if (finalPass1Data.adminGuidance) {
    updatePayload.admin_talking_points = finalPass1Data.adminGuidance.talkingPoints || [];
    updatePayload.admin_questions_to_ask = finalPass1Data.adminGuidance.questionsToAsk || [];
    updatePayload.admin_next_steps = finalPass1Data.adminGuidance.nextSteps || [];
    updatePayload.admin_tasks = finalPass1Data.adminGuidance.tasks || [];
    updatePayload.admin_risk_flags = finalPass1Data.adminGuidance.riskFlags || [];
  }
  if (finalPass1Data.clientPresentation) {
    updatePayload.client_executive_brief = finalPass1Data.clientPresentation.executiveBrief || null;
    updatePayload.client_roi_summary = finalPass1Data.clientPresentation.roiSummary || null;
  }

  const { error: updateError } = await supabaseClient
    .from('sa_audit_reports').update(updatePayload).eq('engagement_id', engagementId);
  if (updateError) {
    console.error('[SA Pass 1] Phase 8 update error:', updateError);
    throw updateError;
  }
  console.log('[SA Pass 1] Phase 8: DB write complete. Status set to pass1_complete.');

  return { success: true, phase: 8, reportId: reportRow.id };
}

// ---------- Entry: route by phase ----------
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let engagementId: string | null = null;
  let phase = 1;

  try {
    const body = await req.json();
    engagementId = body.engagementId ?? null;
    phase = body.phase ?? 1;

    if (!engagementId) {
      throw new Error('engagementId is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: engagement, error: engagementError } = await supabaseClient
      .from('sa_engagements')
      .select('*')
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      throw new Error(`Failed to fetch engagement: ${engagementError?.message || 'Not found'}`);
    }

    let clientName = 'the business';
    if (engagement.client_id) {
      const { data: client } = await supabaseClient
        .from('practice_members')
        .select('client_company, company, name')
        .eq('id', engagement.client_id)
        .maybeSingle();
      clientName = client?.client_company || client?.company || client?.name || 'the business';
    }

    const hourlyRate = engagement?.hourly_rate != null ? Number(engagement.hourly_rate) : 45;
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    console.log(`[SA Pass 1] Phase ${phase} starting for: ${engagementId}`);

    let result: { success: boolean; phase: number; reportId?: string };

    switch (phase) {
      case 1: {
        await supabaseClient.from('sa_audit_reports').upsert(
          { engagement_id: engagementId, status: 'generating', executive_summary: 'Phase 1/8: Extracting facts...' },
          { onConflict: 'engagement_id' }
        );
        const [discoveryRes, systemsRes] = await Promise.all([
          supabaseClient.from('sa_discovery_responses').select('*').eq('engagement_id', engagementId).single(),
          supabaseClient.from('sa_system_inventory').select('*').eq('engagement_id', engagementId),
        ]);
        if (discoveryRes.error || !discoveryRes.data) {
          throw new Error(`Discovery not found: ${discoveryRes.error?.message}`);
        }
        const additionalContext = Array.isArray(body.additionalContext) ? body.additionalContext : undefined;
        const preliminaryAnalysis = body.preliminaryAnalysis && typeof body.preliminaryAnalysis === 'object' ? body.preliminaryAnalysis : undefined;
        result = await runPhase1(
          supabaseClient,
          engagementId,
          engagement,
          discoveryRes.data,
          systemsRes.data || [],
          clientName,
          hourlyRate,
          openRouterKey,
          additionalContext,
          preliminaryAnalysis
        );
        break;
      }
      case 2: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 2/8: Analysing processes...' })
          .eq('engagement_id', engagementId);
        result = await runPhase2Analyse(supabaseClient, engagementId, engagement, hourlyRate, openRouterKey);
        break;
      }
      case 3: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 3/8: Identifying critical findings...' })
          .eq('engagement_id', engagementId);
        result = await runPhase3CriticalHigh(supabaseClient, engagementId, engagement, hourlyRate, openRouterKey);
        break;
      }
      case 4: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 4/8: Completing findings and quick wins...' })
          .eq('engagement_id', engagementId);
        result = await runPhase4MediumLowQuickWins(supabaseClient, engagementId, engagement, hourlyRate, openRouterKey);
        break;
      }
      case 5: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 5/8: Building recommendations...' })
          .eq('engagement_id', engagementId);
        result = await runPhase5Recommendations(supabaseClient, engagementId, openRouterKey);
        break;
      }
      case 6: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 6/8: Generating technology roadmap...' })
          .eq('engagement_id', engagementId);
        result = await runPhase6SystemsMaps(supabaseClient, engagementId, openRouterKey);
        break;
      }
      case 7: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 7/8: Preparing practice team guidance...' })
          .eq('engagement_id', engagementId);
        result = await runPhase7AdminGuidance(supabaseClient, engagementId, openRouterKey);
        break;
      }
      case 8: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 8/8: Finalising report...' })
          .eq('engagement_id', engagementId);
        result = await runPhase8Presentation(supabaseClient, engagementId, openRouterKey);
        break;
      }
      default:
        throw new Error(`Invalid phase: ${phase}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        phase: result.phase,
        reportId: (result as any).reportId,
        nextPhase: phase < 8 ? phase + 1 : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SA Pass 1] Error:', error);

    if (engagementId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const status = `phase${phase}_failed`;
      await supabaseClient
        .from('sa_audit_reports')
        .update({
          status,
          executive_summary: `Report generation failed at phase ${phase}: ${errMsg}. Retry from admin.`,
        })
        .eq('engagement_id', engagementId);
    }

    return new Response(
      JSON.stringify({ error: errMsg, phase }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
