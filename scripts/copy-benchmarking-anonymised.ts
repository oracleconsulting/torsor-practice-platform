/**
 * Copy benchmarking data from one client to another with name redaction.
 *
 * Creates an anonymous example report for showing prospective clients.
 *
 * Usage:
 *   cd torsor-practice-platform
 *   npx tsx scripts/copy-benchmarking-anonymised.ts
 *
 * Or with explicit env:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/copy-benchmarking-anonymised.ts
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const SOURCE_CLIENT_ID = 'c5c8418a-7ce2-4913-ad27-e4bc339b4346';
const TARGET_CLIENT_ID = '1522309d-3516-4694-8a0a-69f24ab22d28';

const PLACEHOLDER_COMPANY = 'Example Company';
const PLACEHOLDER_CUSTOMER = (i: number) => `Major Client ${String.fromCharCode(65 + i)}`;

// Known customer names that appear in the source report — always redact when copying to example client
const KNOWN_CUSTOMER_NAMES = ['Boldyn', 'Capita', 'GSTT'];

// =============================================================================
// REDACTION HELPERS
// =============================================================================

function redactString(text: string | null | undefined, replacements: Map<string, string>): string {
  if (!text || typeof text !== 'string') return text || '';
  let out = text;
  for (const [original, replacement] of replacements) {
    if (original && replacement) {
      const re = new RegExp(escapeRegex(original), 'gi');
      out = out.replace(re, replacement);
    }
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function redactJson(obj: unknown, replacements: Map<string, string>): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return redactString(obj, replacements);
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map((v) => redactJson(v, replacements));
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = redactJson(v, replacements);
    }
    return out;
  }
  return obj;
}

// Build replacement map from source data
function buildRedactionMap(
  sourceClient: { name?: string; client_company?: string; company?: string } | null,
  pass1Data: unknown,
  supplementary: unknown
): Map<string, string> {
  const map = new Map<string, string>();

  if (sourceClient) {
    const names = [
      sourceClient.name,
      sourceClient.client_company,
      sourceClient.company,
    ].filter(Boolean) as string[];
    for (const n of names) {
      if (n && n.trim()) map.set(n.trim(), PLACEHOLDER_COMPANY);
    }
  }

  // Top customers from pass1_data (supplementary, top_customers, bm_supp_*)
  const dig = (o: unknown, keys: string[]): unknown => {
    if (!o || typeof o !== 'object') return null;
    let v: unknown = o;
    for (const k of keys) {
      v = (v as Record<string, unknown>)?.[k];
      if (v == null) return null;
    }
    return v;
  };
  const candidates = [
    dig(pass1Data, ['supplementary', 'top_customers']),
    dig(pass1Data, ['top_customers']),
    (pass1Data as Record<string, unknown>)?.bm_supp_top_customers,
    (supplementary as Record<string, unknown>)?.top_customers,
  ].filter(Boolean);
  for (const topCustomers of candidates) {
    if (Array.isArray(topCustomers)) {
      topCustomers.forEach((c: { name?: string }, i: number) => {
        const name = typeof c === 'object' && c?.name ? String(c.name) : null;
        if (name) map.set(name, PLACEHOLDER_CUSTOMER(i));
      });
    }
  }

  // Always redact known customer names from the source report (e.g. in narratives)
  KNOWN_CUSTOMER_NAMES.forEach((name, i) => {
    if (name) map.set(name, PLACEHOLDER_CUSTOMER(i));
  });

  return map;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log('Copying benchmarking data (anonymised)...');
  console.log(`  Source client: ${SOURCE_CLIENT_ID}`);
  console.log(`  Target client: ${TARGET_CLIENT_ID}`);

  // 1. Get source engagement
  const { data: sourceEng, error: engErr } = await supabase
    .from('bm_engagements')
    .select('*')
    .eq('client_id', SOURCE_CLIENT_ID)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (engErr || !sourceEng) {
    console.error('Source engagement not found:', engErr?.message || 'No engagement');
    process.exit(1);
  }

  const sourceEngagementId = sourceEng.id;
  const practiceId = sourceEng.practice_id;
  console.log(`  Source engagement: ${sourceEngagementId}`);

  // 2. Get target engagement (or create)
  let targetEng = await supabase
    .from('bm_engagements')
    .select('*')
    .eq('client_id', TARGET_CLIENT_ID)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let targetEngagementId: string;
  if (targetEng.data) {
    targetEngagementId = targetEng.data.id;
    console.log(`  Target engagement exists: ${targetEngagementId}`);
  } else {
    const { data: created, error: createErr } = await supabase
      .from('bm_engagements')
      .insert({
        client_id: TARGET_CLIENT_ID,
        practice_id: practiceId,
        status: 'generated',
      })
      .select('id')
      .single();
    if (createErr || !created) {
      console.error('Failed to create target engagement:', createErr?.message);
      process.exit(1);
    }
    targetEngagementId = created.id;
    console.log(`  Created target engagement: ${targetEngagementId}`);
  }

  // 3. Get source client name for redaction
  const { data: sourceClient } = await supabase
    .from('practice_members')
    .select('name, client_company, company')
    .eq('id', SOURCE_CLIENT_ID)
    .single();

  // 4. Get source report (for redaction map + copy)
  const { data: sourceReport, error: reportErr } = await supabase
    .from('bm_reports')
    .select('*')
    .eq('engagement_id', sourceEngagementId)
    .single();

  if (reportErr || !sourceReport) {
    console.error('Source report not found:', reportErr?.message);
    process.exit(1);
  }

  const pass1Data = typeof sourceReport.pass1_data === 'string'
    ? JSON.parse(sourceReport.pass1_data || '{}')
    : sourceReport.pass1_data || {};
  const supplementary = pass1Data?.supplementary ?? pass1Data?._supplementary ?? {};

  const redactionMap = buildRedactionMap(sourceClient, pass1Data, supplementary);
  console.log(`  Redaction map: ${redactionMap.size} terms`);

  // 5. Build redacted report
  const reportRow = { ...sourceReport };
  reportRow.engagement_id = targetEngagementId;
  delete reportRow.created_at;
  delete reportRow.updated_at;

  const textFields = [
    'headline',
    'executive_summary',
    'position_narrative',
    'strength_narrative',
    'gap_narrative',
    'opportunity_narrative',
  ];
  for (const f of textFields) {
    if (reportRow[f]) reportRow[f] = redactString(reportRow[f], redactionMap);
  }

  const jsonbFields = [
    'metrics_comparison',
    'top_strengths',
    'top_gaps',
    'opportunity_breakdown',
    'admin_talking_points',
    'admin_questions_to_ask',
    'admin_next_steps',
    'admin_tasks',
    'admin_risk_flags',
    'recommendations',
    'pass1_data',
    'surplus_cash',
    'balance_sheet',
    'financial_trends',
    'value_analysis',
    'client_preferences',
    'recommended_services',
    'data_sources',
  ];
  for (const f of jsonbFields) {
    if (reportRow[f] != null) {
      const val = typeof reportRow[f] === 'string' ? JSON.parse(reportRow[f]) : reportRow[f];
      reportRow[f] = redactJson(val, redactionMap);
    }
  }

  const { error: reportInsertErr } = await supabase.from('bm_reports').upsert(reportRow, {
    onConflict: 'engagement_id',
    ignoreDuplicates: false,
  });

  if (reportInsertErr) {
    console.error('Failed to copy report:', reportInsertErr.message);
    process.exit(1);
  }
  console.log('  Copied bm_reports');

  // 6. Copy bm_assessment_responses (engagement_id is PK; need to fetch by engagement then insert for target)
  const { data: sourceAssessment } = await supabase
    .from('bm_assessment_responses')
    .select('*')
    .eq('engagement_id', sourceEngagementId)
    .maybeSingle();

  if (sourceAssessment) {
    const assRow: Record<string, unknown> = { ...sourceAssessment };
    assRow.engagement_id = targetEngagementId;
    delete assRow.created_at;
    delete assRow.updated_at;

    const assTextFields = [
      'business_description',
      'suspected_underperformance',
      'leaving_money',
      'benchmark_magic_fix',
      'blind_spot_fear',
    ];
    for (const f of assTextFields) {
      if (assRow[f]) assRow[f] = redactString(String(assRow[f]), redactionMap);
    }
    if (assRow.responses && typeof assRow.responses === 'object') {
      assRow.responses = redactJson(assRow.responses, redactionMap);
    }

    await supabase.from('bm_assessment_responses').upsert(assRow, {
      onConflict: 'engagement_id',
      ignoreDuplicates: false,
    });
    console.log('  Copied bm_assessment_responses');
  }

  // 7. Copy bm_metric_comparisons
  const { data: sourceMetrics } = await supabase
    .from('bm_metric_comparisons')
    .select('*')
    .eq('engagement_id', sourceEngagementId);

  if (sourceMetrics?.length) {
    const rows = sourceMetrics.map((r) => ({
      ...r,
      id: undefined,
      engagement_id: targetEngagementId,
      created_at: undefined,
    }));
    await supabase.from('bm_metric_comparisons').delete().eq('engagement_id', targetEngagementId);
    await supabase.from('bm_metric_comparisons').insert(rows);
    console.log(`  Copied ${rows.length} bm_metric_comparisons`);
  }

  // 8. Copy client_opportunities
  const { data: sourceOpps } = await supabase
    .from('client_opportunities')
    .select('*')
    .eq('engagement_id', sourceEngagementId);

  if (sourceOpps?.length) {
    await supabase.from('client_opportunities').delete().eq('engagement_id', targetEngagementId);
    const oppRows = sourceOpps.map((o) => {
      const r = { ...o };
      delete r.id;
      r.engagement_id = targetEngagementId;
      r.client_id = TARGET_CLIENT_ID;
      r.title = redactString(r.title, redactionMap);
      r.data_evidence = r.data_evidence ? redactString(String(r.data_evidence), redactionMap) : null;
      r.talking_point = r.talking_point ? redactString(String(r.talking_point), redactionMap) : null;
      r.service_fit_rationale = r.service_fit_rationale
        ? redactString(String(r.service_fit_rationale), redactionMap)
        : null;
      return r;
    });
    await supabase.from('client_opportunities').insert(oppRows);
    console.log(`  Copied ${oppRows.length} client_opportunities`);
  }

  // 9. Copy bm_client_scenarios
  const { data: sourceScenarios } = await supabase
    .from('bm_client_scenarios')
    .select('*')
    .eq('engagement_id', sourceEngagementId);

  if (sourceScenarios?.length) {
    await supabase.from('bm_client_scenarios').delete().eq('engagement_id', targetEngagementId);
    const scenarioRows = sourceScenarios.map((s) => ({
      ...s,
      id: undefined,
      engagement_id: targetEngagementId,
    }));
    await supabase.from('bm_client_scenarios').insert(scenarioRows);
    console.log(`  Copied ${scenarioRows.length} bm_client_scenarios`);
  }

  // 10. Copy bm_engagement_services (pinned services)
  const { data: sourcePinned } = await supabase
    .from('bm_engagement_services')
    .select('*')
    .eq('engagement_id', sourceEngagementId);

  if (sourcePinned?.length) {
    await supabase.from('bm_engagement_services').delete().eq('engagement_id', targetEngagementId);
    const pinnedRows = sourcePinned.map((p) => ({
      ...p,
      id: undefined,
      engagement_id: targetEngagementId,
    }));
    await supabase.from('bm_engagement_services').insert(pinnedRows);
    console.log(`  Copied ${pinnedRows.length} bm_engagement_services`);
  }

  // 11. Optionally update target client display name for demo
  const { error: updateErr } = await supabase
    .from('practice_members')
    .update({
      client_company: PLACEHOLDER_COMPANY,
      updated_at: new Date().toISOString(),
    })
    .eq('id', TARGET_CLIENT_ID);

  if (updateErr) {
    console.warn('  Could not update target client display name (column may not exist):', updateErr.message);
  } else {
    console.log(`  Set target client display name to "${PLACEHOLDER_COMPANY}"`);
  }

  // 12. Ensure report is shared for client view
  await supabase
    .from('bm_engagements')
    .update({
      report_shared_with_client: true,
      status: 'generated',
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetEngagementId);

  console.log('');
  console.log('Done. Anonymous example report is ready for client', TARGET_CLIENT_ID);
  console.log('View at your client portal when logged in as that client.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
