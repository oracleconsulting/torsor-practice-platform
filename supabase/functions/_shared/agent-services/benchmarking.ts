// Benchmarking service module — read-only context for the advisory agent.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ServiceModule } from './types.ts';

const BM_PROMPT = `

BENCHMARKING SERVICE CONTEXT

This client has a Benchmarking engagement. The agent can discuss their
financial positioning, opportunity gaps, and peer comparison. Edits to
benchmarking content are NOT directly applicable through this agent in
v1 — suggest changes in plain text and the advisor will apply them
through the Benchmarking admin view if appropriate.
`;

function safeJsonString(value: unknown, max: number): string {
  try {
    const s = JSON.stringify(value);
    return s.length > max ? `${s.slice(0, max)}...[truncated]` : s;
  } catch {
    return String(value).slice(0, max);
  }
}

async function fetchBMContext(
  supabase: SupabaseClient,
  clientId: string,
): Promise<string> {
  // Resolve engagement(s) for this client, then fetch their reports.
  const { data: engs } = await supabase
    .from('bm_engagements')
    .select('id, status, sprint_number, created_at, bm_reports(headline, executive_summary, position_narrative, opportunity_narrative, metrics_comparison, overall_percentile, status)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!engs || engs.length === 0) return '';
  const eng = engs[0];
  const reports = Array.isArray(eng.bm_reports) ? eng.bm_reports : (eng.bm_reports ? [eng.bm_reports] : []);
  const report = reports[0];
  if (!report) {
    return `BENCHMARKING DATA:\nEngagement exists (status=${eng.status ?? 'unknown'}) but no report yet.`;
  }

  const lines = [
    'BENCHMARKING DATA:',
    `Engagement status: ${eng.status ?? 'unknown'}, Sprint ${eng.sprint_number ?? 'n/a'}`,
    `Report status: ${report.status ?? 'unknown'}, Overall percentile: ${report.overall_percentile ?? 'n/a'}`,
  ];
  if (report.headline) lines.push(`Headline: ${report.headline}`);
  if (report.executive_summary) lines.push(`Executive summary: ${String(report.executive_summary).slice(0, 1000)}`);
  if (report.position_narrative) lines.push(`Position: ${String(report.position_narrative).slice(0, 600)}`);
  if (report.opportunity_narrative) lines.push(`Opportunities: ${String(report.opportunity_narrative).slice(0, 600)}`);
  if (report.metrics_comparison) lines.push(`Metrics (sample): ${safeJsonString(report.metrics_comparison, 1200)}`);
  return lines.join('\n');
}

export const bmModule: ServiceModule = {
  codes: ['benchmarking'],
  label: 'Benchmarking',
  systemPromptModule: BM_PROMPT,
  fetchContext: fetchBMContext,
  allowedTargets: [],
};
