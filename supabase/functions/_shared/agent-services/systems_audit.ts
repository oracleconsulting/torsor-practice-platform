// Systems Audit service module — read-only context for the advisory agent.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ServiceModule } from './types.ts';

const SA_PROMPT = `

SYSTEMS AUDIT SERVICE CONTEXT

This client has a Systems Audit engagement. The agent can discuss their
inventory of business systems, capability gaps, and platform-direction
recommendations. Edits to SA content are NOT directly applicable in v1 —
suggest changes in plain text and the advisor will apply through the
Systems Audit admin view.
`;

function safeJsonString(value: unknown, max: number): string {
  try {
    const s = JSON.stringify(value);
    return s.length > max ? `${s.slice(0, max)}...[truncated]` : s;
  } catch {
    return String(value).slice(0, max);
  }
}

async function fetchSAContext(
  supabase: SupabaseClient,
  clientId: string,
): Promise<string> {
  const { data: engs } = await supabase
    .from('sa_engagements')
    .select('id, status, current_phase, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!engs || engs.length === 0) return '';
  const eng = engs[0];

  // Pull preliminary analysis + reports if available
  const [{ data: prelim }, { data: reports }, { data: gaps }] = await Promise.all([
    supabase
      .from('sa_preliminary_analyses')
      .select('summary, key_findings, recommendations, created_at')
      .eq('engagement_id', eng.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((r: any) => ({ data: r?.data ?? null })),
    supabase
      .from('sa_reports')
      .select('status, executive_summary, key_recommendations, created_at')
      .eq('engagement_id', eng.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((r: any) => ({ data: r?.data ?? null })),
    supabase
      .from('sa_engagement_gaps')
      .select('gap_text, severity, category')
      .eq('engagement_id', eng.id)
      .order('severity', { ascending: false })
      .limit(10)
      .then((r: any) => ({ data: r?.data ?? null })),
  ]);

  const lines = [
    'SYSTEMS AUDIT DATA:',
    `Engagement status: ${eng.status ?? 'unknown'}, Phase: ${eng.current_phase ?? 'n/a'}`,
  ];
  if (prelim) {
    lines.push(`\n--- preliminary analysis ---`);
    if (prelim.summary) lines.push(String(prelim.summary).slice(0, 800));
    if (prelim.key_findings) lines.push(`Key findings: ${safeJsonString(prelim.key_findings, 800)}`);
  }
  if (reports) {
    lines.push(`\n--- report (status=${reports.status ?? 'n/a'}) ---`);
    if (reports.executive_summary) lines.push(String(reports.executive_summary).slice(0, 800));
    if (reports.key_recommendations) {
      lines.push(`Key recommendations: ${safeJsonString(reports.key_recommendations, 800)}`);
    }
  }
  if (gaps && gaps.length > 0) {
    lines.push(`\n--- top ${gaps.length} gaps ---`);
    for (const g of gaps) {
      lines.push(`- [${g.severity ?? '?'}] (${g.category ?? '?'}) ${String(g.gap_text ?? '').slice(0, 200)}`);
    }
  }
  return lines.join('\n');
}

export const saModule: ServiceModule = {
  codes: ['systems_audit'],
  label: 'Systems Audit',
  systemPromptModule: SA_PROMPT,
  fetchContext: fetchSAContext,
  allowedTargets: [],
};
