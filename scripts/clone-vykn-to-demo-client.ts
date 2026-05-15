/**
 * Clone VYKN client-facing data into a demo/test client with recursive redaction.
 *
 * This is intentionally a one-off operational script, not a migration. Migrations
 * should not contain copied client data, even redacted copies.
 *
 * Default mode is DRY RUN. Add --execute to write.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/clone-vykn-to-demo-client.ts --target-email test@testing.com
 *
 * Optional:
 *   --execute                 Actually write rows
 *   --create-target           Create practice_members row if target email is absent
 *   --target-client-id <uuid> Use an existing practice_members.id directly
 *   --demo-company "DemoCo"   Display company name
 *   --demo-person "Alex"      Replacement founder/contact name
 *   --source-client-id <uuid> Override source client
 *   --source-engagement-id <uuid> Override source BM engagement
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type AnyRow = Record<string, any>;

const DEFAULT_SOURCE_CLIENT_ID = 'd62c6019-9070-473f-b379-7bfe55d6aed7'; // VYKN / Damon Wilson
const DEFAULT_SOURCE_ENGAGEMENT_ID = '62d0332c-bd5d-44d7-9405-d53be891d58e';
const DEFAULT_TARGET_EMAIL = 'test@torsor.co.uk';
const DEFAULT_DEMO_COMPANY = 'Demo Client Ltd';
const DEFAULT_DEMO_PERSON = 'Sam Carter';

const DEFAULT_REDACTIONS = [
  'VYKN',
  'Vykn',
  'vykn',
  'Damon Wilson',
  'Damon',
  'Wilson',
  'Jo',
  'Mark Lewis',
  'Mark',
  'dwilson@vykn.com',
  'vykn.com',
  'Alex Morgan',
  'Alex',
  'Fundbank',
  'Themis',
  'Datox AI',
  'Onfido',
  'Rawlinson & Hunter',
  'CapitalBridge',
  'CIBC FCIB',
  'CIBC',
  'FCIB',
];

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_RE = /\bhttps?:\/\/[^\s)"']+/gi;
const DOMAIN_RE = /\b(?:[a-z0-9-]+\.)+(?:com|co\.uk|io|ai|net|org|uk)\b/gi;

const SENSITIVE_KEY_RE =
  /(client|customer|competitor|partner|supplier|vendor|founder|director|advisor|contact|company|person|name|email|domain|website|url)/i;

const TABLES_TO_TRY = [
  'client_service_lines',
  'service_line_assessments',
  'client_assessments',
  'destination_discovery',
  'client_reports',
  'client_context',
];

const BM_SUPPORT_TABLES = [
  'bm_metric_comparisons',
  'client_opportunities',
  'bm_client_scenarios',
  'bm_engagement_services',
];

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const body = readFileSync(filePath, 'utf8');
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!key || process.env[key]) continue;
    process.env[key] = rest.join('=').replace(/^['"]|['"]$/g, '');
  }
}

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replacementRegex(term: string): RegExp {
  const escaped = escapeRegex(term);
  if (/^[\w\s'-]+$/.test(term)) return new RegExp(`\\b${escaped}\\b`, 'gi');
  return new RegExp(escaped, 'gi');
}

function redactString(input: string, replacements: Map<string, string>): string {
  let out = input;

  for (const [from, to] of replacements) {
    if (!from || from.trim().length < 2) continue;
    out = out.replace(replacementRegex(from), to);
  }

  out = out.replace(EMAIL_RE, 'demo@example.com');
  out = out.replace(URL_RE, 'https://demo.example.com');
  out = out.replace(DOMAIN_RE, (domain) => {
    if (/rpgcc|torsor/i.test(domain)) return domain;
    return 'demo.example.com';
  });

  return out;
}

function redactJson(value: unknown, replacements: Map<string, string>): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value, replacements);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map((item) => redactJson(item, replacements));
  if (typeof value === 'object') {
    const out: AnyRow = {};
    for (const [key, child] of Object.entries(value as AnyRow)) {
      out[key] = redactJson(child, replacements);
    }
    return out;
  }
  return value;
}

function addStringTerm(map: Map<string, string>, raw: unknown, replacement: string) {
  if (typeof raw !== 'string') return;
  const value = raw.trim();
  if (!value || value.length < 2 || value.length > 120) return;
  if (/^(true|false|null|none|n\/a|unknown)$/i.test(value)) return;
  if (/^\d+([.,]\d+)?%?$/.test(value)) return;
  map.set(value, replacement);
}

function collectSensitiveTerms(value: unknown, map: Map<string, string>, demoCompany: string, demoPerson: string, keyPath: string[] = []) {
  if (value == null) return;

  const key = keyPath[keyPath.length - 1] || '';
  const pathText = keyPath.join('.');

  if (typeof value === 'string') {
    if (/email/i.test(key)) map.set(value, 'demo@example.com');
    if (/(company|client|customer|competitor|partner|supplier|vendor|domain|website|url)/i.test(pathText)) {
      addStringTerm(map, value, demoCompany);
    } else if (/(founder|director|advisor|contact|person|name)/i.test(pathText)) {
      addStringTerm(map, value, demoPerson);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, idx) => collectSensitiveTerms(item, map, demoCompany, demoPerson, [...keyPath, String(idx)]));
    return;
  }

  if (typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value as AnyRow)) {
      if (SENSITIVE_KEY_RE.test(childKey) && typeof child === 'string') {
        const replacement = /(customer|competitor|partner|supplier|vendor|company|client)/i.test(childKey)
          ? demoCompany
          : demoPerson;
        addStringTerm(map, child, replacement);
      }
      collectSensitiveTerms(child, map, demoCompany, demoPerson, [...keyPath, childKey]);
    }
  }
}

function scanRemainingSensitive(value: unknown, terms: string[], hits = new Map<string, number>()): Map<string, number> {
  if (value == null) return hits;
  if (typeof value === 'string') {
    for (const term of terms) {
      if (term.length < 2) continue;
      const matches = value.match(replacementRegex(term));
      if (matches?.length) hits.set(term, (hits.get(term) || 0) + matches.length);
    }
    const emailHits = value.match(EMAIL_RE);
    if (emailHits?.length) hits.set('[email]', (hits.get('[email]') || 0) + emailHits.length);
    return hits;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => scanRemainingSensitive(item, terms, hits));
    return hits;
  }
  if (typeof value === 'object') {
    Object.values(value as AnyRow).forEach((child) => scanRemainingSensitive(child, terms, hits));
  }
  return hits;
}

function cleanRowForInsert(row: AnyRow, overrides: AnyRow, removeKeys: string[] = []) {
  const out: AnyRow = { ...row, ...overrides };
  for (const key of ['id', 'created_at', 'updated_at', ...removeKeys]) delete out[key];
  return out;
}

async function maybeSelect(supabase: any, table: string, query: (from: any) => any): Promise<AnyRow[]> {
  const { data, error } = await query(supabase.from(table));
  if (error) {
    console.warn(`  Skipping ${table}: ${error.message}`);
    return [];
  }
  return data || [];
}

async function maybeDelete(supabase: any, table: string, column: string, value: string, execute: boolean) {
  if (!execute) return;
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) console.warn(`  Could not delete ${table}: ${error.message}`);
}

async function maybeInsert(supabase: any, table: string, rows: AnyRow[], execute: boolean) {
  if (!rows.length) return;
  if (!execute) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) console.warn(`  Could not insert ${table}: ${error.message}`);
}

async function main() {
  const root = process.cwd();
  loadEnvFile(path.join(root, '.env'));
  loadEnvFile(path.join(root, '.env.local'));

  const args = parseArgs(process.argv.slice(2));
  const execute = Boolean(args.execute);
  const createTarget = Boolean(args['create-target']);
  const sourceClientId = String(args['source-client-id'] || DEFAULT_SOURCE_CLIENT_ID);
  const sourceEngagementIdOverride = args['source-engagement-id'] ? String(args['source-engagement-id']) : undefined;
  const targetEmail = String(args['target-email'] || DEFAULT_TARGET_EMAIL).toLowerCase();
  const targetClientIdArg = args['target-client-id'] ? String(args['target-client-id']) : undefined;
  const demoCompany = String(args['demo-company'] || DEFAULT_DEMO_COMPANY);
  const demoPerson = String(args['demo-person'] || DEFAULT_DEMO_PERSON);

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`${execute ? 'EXECUTE' : 'DRY RUN'}: clone VYKN data to demo client`);
  console.log(`  source client: ${sourceClientId}`);
  console.log(`  target: ${targetClientIdArg || targetEmail}`);
  console.log(`  demo company: ${demoCompany}`);
  console.log(`  demo person: ${demoPerson}`);

  const { data: sourceClient, error: sourceClientError } = await supabase
    .from('practice_members')
    .select('*')
    .eq('id', sourceClientId)
    .maybeSingle();

  if (sourceClientError || !sourceClient) {
    throw new Error(`Source client not found: ${sourceClientError?.message || sourceClientId}`);
  }

  let targetClient: AnyRow | null = null;
  if (targetClientIdArg) {
    const { data } = await supabase.from('practice_members').select('*').eq('id', targetClientIdArg).maybeSingle();
    targetClient = data;
  } else {
    const { data } = await supabase.from('practice_members').select('*').eq('email', targetEmail).maybeSingle();
    targetClient = data;
  }

  if (!targetClient && createTarget) {
    const newTarget = {
      practice_id: sourceClient.practice_id,
      name: demoPerson,
      email: targetEmail,
      member_type: 'client',
      role: 'member',
      client_company: demoCompany,
      company: demoCompany,
      program_status: 'active',
      program_enrolled_at: new Date().toISOString(),
    };
    if (execute) {
      const { data, error } = await supabase.from('practice_members').insert(newTarget).select('*').single();
      if (error) throw new Error(`Failed to create target client: ${error.message}`);
      targetClient = data;
    } else {
      targetClient = { id: '[created-on-execute]', ...newTarget };
    }
  }

  if (!targetClient) {
    throw new Error(`Target client not found. Create/invite ${targetEmail}, pass --target-client-id, or use --create-target.`);
  }

  const targetClientId = targetClient.id;
  if (!targetClientId || targetClientId === '[created-on-execute]') {
    console.log('  Target client would be created on execute; skipping row clone in dry run.');
    return;
  }

  const { data: sourceEngagement, error: sourceEngagementError } = await supabase
    .from('bm_engagements')
    .select('*')
    .eq(sourceEngagementIdOverride ? 'id' : 'client_id', sourceEngagementIdOverride || sourceClientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sourceEngagementError || !sourceEngagement) {
    throw new Error(`Source BM engagement not found: ${sourceEngagementError?.message || sourceEngagementIdOverride || sourceClientId}`);
  }

  if (sourceEngagementIdOverride && sourceEngagement.id !== sourceEngagementIdOverride) {
    throw new Error(`Unexpected source engagement ${sourceEngagement.id}`);
  }

  const sourceEngagementId = sourceEngagement.id || DEFAULT_SOURCE_ENGAGEMENT_ID;
  const { data: sourceReport, error: sourceReportError } = await supabase
    .from('bm_reports')
    .select('*')
    .eq('engagement_id', sourceEngagementId)
    .maybeSingle();

  if (sourceReportError || !sourceReport) {
    throw new Error(`Source bm_reports row not found: ${sourceReportError?.message || sourceEngagementId}`);
  }

  const redactionMap = new Map<string, string>();
  DEFAULT_REDACTIONS.forEach((term) => {
    if (/damon|wilson|jo|mark|alex/i.test(term)) redactionMap.set(term, demoPerson);
    else if (/fundbank/i.test(term)) redactionMap.set(term, 'CapitalBridge');
    else if (/themis/i.test(term)) redactionMap.set(term, 'RegulaOne');
    else if (/datox/i.test(term)) redactionMap.set(term, 'SignalForge AI');
    else if (/onfido/i.test(term)) redactionMap.set(term, 'VerifyNova');
    else if (/rawlinson|hunter/i.test(term)) redactionMap.set(term, 'Northbridge Advisory');
    else if (/capitalbridge/i.test(term)) redactionMap.set(term, 'Northstar Capital');
    else if (/cibc|fcib/i.test(term)) redactionMap.set(term, 'Sterling Growth Bank');
    else redactionMap.set(term, demoCompany);
  });

  addStringTerm(redactionMap, sourceClient.name, demoPerson);
  addStringTerm(redactionMap, sourceClient.email, 'demo@example.com');
  addStringTerm(redactionMap, sourceClient.client_company, demoCompany);
  addStringTerm(redactionMap, sourceClient.company, demoCompany);

  collectSensitiveTerms(sourceReport, redactionMap, demoCompany, demoPerson);

  const copiedPayloads: AnyRow[] = [];
  const addPayloadForAudit = (payload: unknown) => copiedPayloads.push(payload as AnyRow);

  let targetEngagementId: string;
  const { data: existingTargetEngagement } = await supabase
    .from('bm_engagements')
    .select('*')
    .eq('client_id', targetClientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingTargetEngagement) {
    targetEngagementId = existingTargetEngagement.id;
  } else if (execute) {
    const engagementRow = cleanRowForInsert(redactJson(sourceEngagement, redactionMap) as AnyRow, {
      client_id: targetClientId,
      practice_id: sourceClient.practice_id,
      status: 'generated',
      report_shared_with_client: true,
      report_shared_at: new Date().toISOString(),
    });
    const { data, error } = await supabase.from('bm_engagements').insert(engagementRow).select('id').single();
    if (error) throw new Error(`Failed to create target BM engagement: ${error.message}`);
    targetEngagementId = data.id;
  } else {
    targetEngagementId = '[created-on-execute]';
  }

  console.log(`  source BM engagement: ${sourceEngagementId}`);
  console.log(`  target BM engagement: ${targetEngagementId}`);
  console.log(`  redaction terms: ${redactionMap.size}`);

  if (targetEngagementId === '[created-on-execute]') {
    console.log('  Target engagement would be created on execute; dry-run audit continues with synthetic id.');
  }

  const redactedReport = redactJson(sourceReport, redactionMap) as AnyRow;
  const reportRow = {
    ...redactedReport,
    engagement_id: targetEngagementId,
    is_shared_with_client: true,
    shared_at: new Date().toISOString(),
    shared_by: null,
  };
  delete reportRow.created_at;
  delete reportRow.updated_at;
  addPayloadForAudit(reportRow);

  if (execute) {
    const { error } = await supabase.from('bm_reports').upsert(reportRow, { onConflict: 'engagement_id' });
    if (error) throw new Error(`Failed to upsert bm_reports: ${error.message}`);
  }
  console.log('  Prepared bm_reports');

  // Generic client-level tables
  for (const table of TABLES_TO_TRY) {
    const rows = await maybeSelect(supabase, table, (from) => from.select('*').eq('client_id', sourceClientId));
    if (!rows.length) continue;
    const cloned = rows.map((row) => cleanRowForInsert(redactJson(row, redactionMap) as AnyRow, { client_id: targetClientId }));
    cloned.forEach(addPayloadForAudit);
    await maybeDelete(supabase, table, 'client_id', targetClientId, execute);
    await maybeInsert(supabase, table, cloned, execute);
    console.log(`  Prepared ${table}: ${cloned.length}`);
  }

  // BM assessment response, usually one row per engagement.
  const { data: bmAssessment } = await supabase
    .from('bm_assessment_responses')
    .select('*')
    .eq('engagement_id', sourceEngagementId)
    .maybeSingle();
  if (bmAssessment) {
    const row = cleanRowForInsert(redactJson(bmAssessment, redactionMap) as AnyRow, { engagement_id: targetEngagementId });
    addPayloadForAudit(row);
    if (execute) {
      const { error } = await supabase.from('bm_assessment_responses').upsert(row, { onConflict: 'engagement_id' });
      if (error) console.warn(`  Could not upsert bm_assessment_responses: ${error.message}`);
    }
    console.log('  Prepared bm_assessment_responses');
  }

  for (const table of BM_SUPPORT_TABLES) {
    const rows = await maybeSelect(supabase, table, (from) => from.select('*').eq('engagement_id', sourceEngagementId));
    if (!rows.length) continue;
    const cloned = rows.map((row) => {
      const base = redactJson(row, redactionMap) as AnyRow;
      const overrides: AnyRow = { engagement_id: targetEngagementId };
      if ('client_id' in base) overrides.client_id = targetClientId;
      return cleanRowForInsert(base, overrides);
    });
    cloned.forEach(addPayloadForAudit);
    await maybeDelete(supabase, table, 'engagement_id', targetEngagementId, execute);
    await maybeInsert(supabase, table, cloned, execute);
    console.log(`  Prepared ${table}: ${cloned.length}`);
  }

  // Discovery engagement + report, if present.
  const { data: sourceDiscoveryEng } = await supabase
    .from('discovery_engagements')
    .select('*')
    .eq('client_id', sourceClientId)
    .maybeSingle();
  if (sourceDiscoveryEng) {
    let targetDiscoveryEngagementId = '[created-on-execute]';
    const { data: existingTargetDiscoveryEng } = await supabase
      .from('discovery_engagements')
      .select('*')
      .eq('client_id', targetClientId)
      .maybeSingle();

    if (existingTargetDiscoveryEng) {
      targetDiscoveryEngagementId = existingTargetDiscoveryEng.id;
    } else if (execute) {
      const row = cleanRowForInsert(redactJson(sourceDiscoveryEng, redactionMap) as AnyRow, {
        client_id: targetClientId,
        practice_id: sourceClient.practice_id,
      });
      const { data, error } = await supabase.from('discovery_engagements').insert(row).select('id').single();
      if (error) console.warn(`  Could not create discovery_engagements: ${error.message}`);
      else targetDiscoveryEngagementId = data.id;
    }

    if (targetDiscoveryEngagementId !== '[created-on-execute]') {
      const reports = await maybeSelect(supabase, 'discovery_reports', (from) => from.select('*').eq('engagement_id', sourceDiscoveryEng.id));
      if (reports.length) {
        const cloned = reports.map((row) => cleanRowForInsert(redactJson(row, redactionMap) as AnyRow, {
          engagement_id: targetDiscoveryEngagementId,
        }));
        cloned.forEach(addPayloadForAudit);
        await maybeDelete(supabase, 'discovery_reports', 'engagement_id', targetDiscoveryEngagementId, execute);
        await maybeInsert(supabase, 'discovery_reports', cloned, execute);
        console.log(`  Prepared discovery_reports: ${cloned.length}`);
      }
    }
  }

  const targetClientUpdate = {
    name: demoPerson,
    client_company: demoCompany,
    company: demoCompany,
    program_status: 'active',
  };
  addPayloadForAudit(targetClientUpdate);
  if (execute) {
    const { error } = await supabase.from('practice_members').update(targetClientUpdate).eq('id', targetClientId);
    if (error) console.warn(`  Could not update target practice_members: ${error.message}`);
    const { error: shareError } = await supabase
      .from('bm_engagements')
      .update({
        report_shared_with_client: true,
        report_shared_at: new Date().toISOString(),
        status: 'generated',
      })
      .eq('id', targetEngagementId);
    if (shareError) console.warn(`  Could not share target engagement: ${shareError.message}`);
  }

  const auditTerms = Array.from(redactionMap.keys()).concat(DEFAULT_REDACTIONS);
  const remainingHits = new Map<string, number>();
  copiedPayloads.forEach((payload) => scanRemainingSensitive(payload, auditTerms, remainingHits));

  console.log('');
  console.log('Redaction audit');
  console.log(`  payload groups checked: ${copiedPayloads.length}`);
  console.log(`  remaining explicit sensitive hits: ${remainingHits.size}`);
  if (remainingHits.size) {
    for (const [term, count] of [...remainingHits.entries()].sort((a, b) => b[1] - a[1])) {
      console.warn(`  - ${term}: ${count}`);
    }
  }

  console.log('');
  if (execute) {
    console.log(`Done. Demo client ${targetClientId} is ready and benchmarking report is shared.`);
  } else {
    console.log('Dry run complete. Re-run with --execute to write changes.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
