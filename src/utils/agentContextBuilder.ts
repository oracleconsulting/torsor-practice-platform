// =============================================================================
// AGENT CONTEXT BUILDER
// =============================================================================
// Aggregates everything the advisory agent needs to know about a client into
// a compact set of context strings. Runs in the browser, then the result is
// passed through the GDPRTokeniser before being sent to the edge function.
//
// Design:
//   - Returns an `AgentContext` object with one string per "section" so the
//     edge function can include or omit pieces based on token budget.
//   - Each section is hard-capped (substring) to keep total prompt size
//     bounded; the agent doesn't need every word, just the shape.
//   - All Supabase reads go through the user's session, so RLS still
//     applies — staff can only see clients they're scoped to.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

export interface AgentContext {
  clientSummary: string;
  roadmapData: string;
  financialData: string;
  assessmentData: string;
  callNotes: string;
  currentSprintStatus: string;
  /** Total characters across all sections (cheap proxy for token count). */
  totalChars: number;
}

export interface ContextSnapshotShape {
  clientName?: string;
  companyName?: string;
  tier?: string;
  sprintNumber?: number;
  sprintStartDate?: string | null;
  stages?: Array<{ stage_type: string; status: string; version: number }>;
}

// Truncation budgets. Both Sonnet 4.5 and Opus 4.7 have 1M-token context
// windows so we can afford to be generous here. Earlier values (1500 per
// stage / 8000 per section) were sized for a 200K window and blocked the
// agent from doing full-stage batch rewrites — see the WS2 system_observation
// "Agent context truncates roadmap stage content, blocking full-stage rewrite
// batches". A second iteration showed sprint_plan_part1 was still cut at
// Week 6 with a 30K cap, so the per-stage cap was raised again to 100K to
// safely cover even the largest published sprint plans (typically 40-60K
// chars). Section cap then bounds the cumulative roadmap content so we
// don't accidentally ship a million-token request when a client has many
// regenerated versions.
const SECTION_CHAR_CAP = 50_000;
const ROADMAP_SECTION_CAP = 500_000;
const PER_STAGE_CAP = 100_000;

function clip(s: string, n = SECTION_CHAR_CAP): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n)}\n...[truncated]` : s;
}

function safeStringify(value: unknown, maxChars = SECTION_CHAR_CAP): string {
  try {
    const json = JSON.stringify(value, null, 2);
    return json.length > maxChars ? `${json.slice(0, maxChars)}\n...[truncated]` : json;
  } catch {
    return String(value).slice(0, maxChars);
  }
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export async function buildAgentContext(
  supabase: SupabaseClient,
  clientId: string,
): Promise<AgentContext> {
  const [
    clientRecord,
    serviceLines,
    roadmapStages,
    contextNotes,
    bmEngagements,
  ] = await Promise.all([
    supabase
      .from('practice_members')
      .select('id, name, email, client_company, member_type')
      .eq('id', clientId)
      .maybeSingle(),
    supabase
      .from('client_service_lines')
      .select('service_line_id, tier_name, current_sprint_number, sprint_start_date, status, service_lines(code, name)')
      .eq('client_id', clientId),
    supabase
      .from('roadmap_stages')
      .select('id, stage_type, version, status, generated_content, approved_content, sprint_number, manually_edited, last_edited_at')
      .eq('client_id', clientId)
      .in('status', ['published', 'approved', 'generated'])
      .order('version', { ascending: false }),
    supabase
      .from('client_context_notes')
      .select('note_type, content, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('bm_engagements')
      .select('id, sprint_number, status, bm_reports(pass1_data, pass2_data, status)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const sprintGA = (serviceLines.data ?? []).find((sl: any) => {
    const code = Array.isArray(sl.service_lines) ? sl.service_lines[0]?.code : sl.service_lines?.code;
    return code === '365_method' || code === '365_alignment';
  });

  // ----- 1. Client summary -----
  const clientSummary = buildClientSummary(clientRecord.data, sprintGA);

  // ----- 2. Roadmap content (latest version per stage) -----
  const roadmapData = buildRoadmapContext(roadmapStages.data ?? []);

  // ----- 3. Financial data (BM pass1) -----
  const financialData = buildFinancialContext(bmEngagements.data ?? []);

  // ----- 4. Assessment responses (Q&A pairs) -----
  const assessmentData = await buildAssessmentContext(supabase, clientId);

  // ----- 5. Recent call notes / context notes -----
  const callNotes = buildCallNotesContext(contextNotes.data ?? []);

  // ----- 6. Sprint progress -----
  const currentSprintStatus = await buildSprintStatus(supabase, clientId, sprintGA);

  const sections = [clientSummary, roadmapData, financialData, assessmentData, callNotes, currentSprintStatus];
  const totalChars = sections.reduce((sum, s) => sum + (s?.length ?? 0), 0);

  return {
    clientSummary,
    roadmapData,
    financialData,
    assessmentData,
    callNotes,
    currentSprintStatus,
    totalChars,
  };
}

/** Build a compact JSON snapshot suitable for `client_chat_threads.context_snapshot`. */
export function buildContextSnapshot(client: {
  name?: string | null;
  client_company?: string | null;
  tier?: string | null;
  sprintNumber?: number | null;
  sprintStartDate?: string | null;
  stages?: Array<{ stage_type: string; status: string; version: number }>;
}): ContextSnapshotShape {
  return {
    clientName: client.name ?? undefined,
    companyName: client.client_company ?? undefined,
    tier: client.tier ?? undefined,
    sprintNumber: client.sprintNumber ?? undefined,
    sprintStartDate: client.sprintStartDate ?? undefined,
    stages: client.stages ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildClientSummary(client: any, sprintGA: any): string {
  if (!client) return 'CLIENT SUMMARY: (not found)';
  const lines = [
    'CLIENT SUMMARY:',
    `Name: ${client.name ?? '(unknown)'}`,
    `Company: ${client.client_company ?? '(unknown)'}`,
    sprintGA ? `GA Tier: ${sprintGA.tier_name ?? 'unknown'}` : 'GA Tier: not enrolled',
    sprintGA ? `Sprint: ${sprintGA.current_sprint_number ?? 1}` : null,
    sprintGA ? `Sprint Start: ${sprintGA.sprint_start_date ?? 'not set'}` : null,
  ].filter(Boolean);
  return lines.join('\n');
}

function buildRoadmapContext(stages: any[]): string {
  if (stages.length === 0) return 'ROADMAP CONTENT: (no stages yet)';

  // Keep latest version per stage_type
  const latestPerType = new Map<string, any>();
  for (const s of stages) {
    if (!latestPerType.has(s.stage_type)) latestPerType.set(s.stage_type, s);
  }

  const lines: string[] = ['ROADMAP CONTENT (latest version per stage):'];
  for (const stage of latestPerType.values()) {
    const flag = stage.manually_edited ? ' [edited]' : '';
    const content = stage.approved_content ?? stage.generated_content ?? null;
    lines.push(`\n--- ${stage.stage_type} (status=${stage.status}, v${stage.version})${flag} ---`);
    lines.push(safeStringify(content, PER_STAGE_CAP));
  }
  return clip(lines.join('\n'), ROADMAP_SECTION_CAP);
}

function buildFinancialContext(engagements: any[]): string {
  if (engagements.length === 0) return 'FINANCIAL DATA: (no benchmarking report yet)';
  const eng = engagements[0];
  const reports = Array.isArray(eng.bm_reports) ? eng.bm_reports : (eng.bm_reports ? [eng.bm_reports] : []);
  const latest = reports[0];
  if (!latest) return 'FINANCIAL DATA: (engagement exists but no report)';

  const pass1 = latest.pass1_data ?? null;
  const summary = {
    revenue: pass1?.financialData?.revenue,
    grossProfit: pass1?.financialData?.grossProfit,
    netProfit: pass1?.financialData?.netProfit,
    employeeCount: pass1?.financialData?.employees,
    industry: pass1?.industry,
    yearsTrading: pass1?.yearsTrading,
    keyRatios: pass1?.financialData?.ratios ?? null,
  };
  return `FINANCIAL DATA (Benchmarking pass1):\n${safeStringify(summary, 5_000)}`;
}

async function buildAssessmentContext(
  supabase: SupabaseClient,
  clientId: string,
): Promise<string> {
  // Check both common assessment table names — older schemas use
  // service_line_assessments, newer ones use ga_assessment_responses.
  const tries = [
    { table: 'ga_assessment_responses', select: 'part_number, responses' },
    { table: 'service_line_assessments', select: 'service_line_code, responses, completed_at' },
  ];

  for (const t of tries) {
    try {
      const { data } = await supabase.from(t.table).select(t.select).eq('client_id', clientId);
      if (data && data.length > 0) {
        return `ASSESSMENT RESPONSES (from ${t.table}):\n${safeStringify(data, 30_000)}`;
      }
    } catch {
      // Table doesn't exist or access denied — try next.
    }
  }

  return 'ASSESSMENT RESPONSES: (none found)';
}

function buildCallNotesContext(notes: any[]): string {
  if (notes.length === 0) return 'CALL NOTES: (none)';
  const lines: string[] = ['RECENT CALL / CONTEXT NOTES:'];
  for (const n of notes) {
    const when = n.created_at ? new Date(n.created_at).toISOString().slice(0, 10) : '?';
    // Per-note cap raised from 400 to 2000 so longer call summaries
    // aren't cut mid-sentence.
    lines.push(`- [${when}] ${n.note_type ?? 'note'}: ${String(n.content ?? '').slice(0, 2_000)}`);
  }
  return clip(lines.join('\n'), 30_000);
}

async function buildSprintStatus(
  supabase: SupabaseClient,
  clientId: string,
  sprintGA: any,
): Promise<string> {
  if (!sprintGA) return 'SPRINT PROGRESS: (no active GA sprint)';

  const sprintNumber = sprintGA.current_sprint_number ?? 1;
  const [tasksRes, pulseRes] = await Promise.all([
    supabase
      .from('client_tasks')
      .select('week_number, status, category')
      .eq('client_id', clientId)
      .eq('sprint_number', sprintNumber),
    supabase
      .from('life_pulse_entries')
      .select('week_number, alignment_rating')
      .eq('client_id', clientId)
      .eq('sprint_number', sprintNumber)
      .order('week_number', { ascending: true }),
  ]);

  const tasks = tasksRes.data ?? [];
  const pulse = pulseRes.data ?? [];
  const completed = tasks.filter((t: any) => t.status === 'completed').length;
  const skipped = tasks.filter((t: any) => t.status === 'skipped').length;
  const pulseWeeks = pulse.map((p: any) => p.week_number).join(', ') || 'none';
  const avgPulse =
    pulse.length > 0
      ? (pulse.reduce((s: number, p: any) => s + Number(p.alignment_rating || 0), 0) / pulse.length).toFixed(2)
      : 'n/a';

  return `SPRINT PROGRESS (sprint ${sprintNumber}):
Tasks: ${completed} completed, ${skipped} skipped, ${tasks.length} total
Life Pulse submitted weeks: ${pulseWeeks}
Average alignment rating: ${avgPulse}/5
Sprint start date: ${sprintGA.sprint_start_date ?? 'not chosen'}`;
}

// ---------------------------------------------------------------------------
// Format the AgentContext into a single multi-section string for the LLM
// ---------------------------------------------------------------------------

export function formatContextForPrompt(ctx: AgentContext): string {
  return [
    ctx.clientSummary,
    ctx.currentSprintStatus,
    ctx.financialData,
    ctx.assessmentData,
    ctx.roadmapData,
    ctx.callNotes,
  ]
    .filter((s) => s && s.trim().length > 0)
    .join('\n\n');
}
