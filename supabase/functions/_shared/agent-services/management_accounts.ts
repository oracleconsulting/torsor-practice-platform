// Management Accounts service module — read-only context for the advisory agent.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ServiceModule } from './types.ts';

const MA_PROMPT = `

MANAGEMENT ACCOUNTS SERVICE CONTEXT

This client has Management Accounts engagements. The agent can discuss
recent period reports, ratio movements, and identified patterns. Edits to
MA reports are NOT directly applicable in v1 — suggest changes in plain
text and the advisor will apply them through the BI admin views.
`;

function safeJsonString(value: unknown, max: number): string {
  try {
    const s = JSON.stringify(value);
    return s.length > max ? `${s.slice(0, max)}...[truncated]` : s;
  } catch {
    return String(value).slice(0, max);
  }
}

async function fetchMAContext(
  supabase: SupabaseClient,
  clientId: string,
): Promise<string> {
  const { data: reports } = await supabase
    .from('ma_reports')
    .select('id, status, period_label, executive_summary, key_insights, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(2);

  if (!reports || reports.length === 0) return '';

  const lines = ['MANAGEMENT ACCOUNTS DATA:'];
  for (const r of reports) {
    lines.push(`\n--- ${r.period_label ?? 'period'} (status=${r.status ?? 'n/a'}) ---`);
    if (r.executive_summary) lines.push(String(r.executive_summary).slice(0, 800));
    if (r.key_insights) lines.push(`Key insights: ${safeJsonString(r.key_insights, 800)}`);
  }
  return lines.join('\n');
}

export const maModule: ServiceModule = {
  codes: ['management_accounts'],
  label: 'Management Accounts',
  systemPromptModule: MA_PROMPT,
  fetchContext: fetchMAContext,
  allowedTargets: [],
};
