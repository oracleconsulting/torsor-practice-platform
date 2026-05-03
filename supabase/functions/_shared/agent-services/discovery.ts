// Discovery service module — read-only context for the advisory agent.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ServiceModule } from './types.ts';

const DISCOVERY_PROMPT = `

DISCOVERY SERVICE CONTEXT

This client has gone through a Destination Discovery assessment. The agent
can reference their recommended services, fit assessment, and discovery
opportunities. Discovery is the gateway service — most other engagements
trace back to choices made here.
`;

function safeJsonString(value: unknown, max: number): string {
  try {
    const s = JSON.stringify(value);
    return s.length > max ? `${s.slice(0, max)}...[truncated]` : s;
  } catch {
    return String(value).slice(0, max);
  }
}

async function fetchDiscoveryContext(
  supabase: SupabaseClient,
  clientId: string,
): Promise<string> {
  const { data: engs } = await supabase
    .from('discovery_engagements')
    .select('id, status, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!engs || engs.length === 0) return '';
  const eng = engs[0];

  const [{ data: report }, { data: opportunities }] = await Promise.all([
    supabase
      .from('discovery_reports')
      .select('status, executive_summary, fit_signals, archetype, opportunity_summary')
      .eq('engagement_id', eng.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((r: any) => ({ data: r?.data ?? null })),
    supabase
      .from('discovery_opportunities')
      .select('service_code, headline, opportunity_size, priority')
      .eq('engagement_id', eng.id)
      .order('priority', { ascending: false })
      .limit(8)
      .then((r: any) => ({ data: r?.data ?? null })),
  ]);

  const lines = [
    'DISCOVERY DATA:',
    `Engagement status: ${eng.status ?? 'unknown'}`,
  ];
  if (report) {
    lines.push(`Report status: ${report.status ?? 'n/a'}`);
    if (report.archetype) lines.push(`Archetype: ${report.archetype}`);
    if (report.executive_summary) lines.push(String(report.executive_summary).slice(0, 800));
    if (report.fit_signals) lines.push(`Fit signals: ${safeJsonString(report.fit_signals, 600)}`);
  }
  if (opportunities && opportunities.length > 0) {
    lines.push(`\n--- top ${opportunities.length} opportunities ---`);
    for (const o of opportunities) {
      lines.push(`- [P${o.priority ?? '?'}] ${o.service_code ?? 'service'}: ${o.headline ?? ''} (size: ${o.opportunity_size ?? 'n/a'})`);
    }
  }
  return lines.join('\n');
}

export const discoveryModule: ServiceModule = {
  codes: ['discovery'],
  label: 'Discovery',
  systemPromptModule: DISCOVERY_PROMPT,
  fetchContext: fetchDiscoveryContext,
  allowedTargets: [],
};
