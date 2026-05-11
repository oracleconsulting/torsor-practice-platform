// ============================================================================
// generate-bm-report-pass2-validate / index.ts
// ============================================================================
// Pass 2 — validator half. Reads narratives + allowlist, runs the entity
// check, performs ONE reprompt to Opus if violations found, writes back,
// and decides: clean / chain to itself for next attempt / terminal review.
//
// Single Opus call per invocation. ~30–60s. Well under 150s timeout.
// Self-chains via fire-and-forget when more attempts are needed.
//
// Reads:
//   - bm_reports.{headline, executive_summary, position_narrative,
//                 strength_narrative, gap_narrative, opportunity_narrative,
//                 entity_allowlist, reprompt_attempt_count,
//                 entity_violations, reprompt_history}
//   - bm_engagements
//
// Writes (each invocation, regardless of outcome):
//   - bm_reports.reprompt_attempt_count (incremented)
//   - bm_reports.entity_violations
//   - bm_reports.reprompt_history (appended)
//   - bm_reports.{narrative_quality, narratives if reprompt rewrote them}
//
// Writes (terminal — clean):
//   - bm_engagements.status = 'generated'
//   - bm_reports.narrative_quality = 'clean'
//   - Triggers Pass 3 (fire-and-forget)
//
// Writes (terminal — cap reached with violations):
//   - bm_engagements.status = 'generated'   // narrative still usable, just flagged
//   - bm_reports.narrative_quality = 'requires_review'
//   - Triggers Pass 3 (fire-and-forget)  // Pass 3 still runs; the gate is
//                                           // narrative_quality on the
//                                           // admin "Share with client" button
//
// Writes (non-terminal — more attempts to come):
//   - Self-invoke fire-and-forget. No engagement status change yet.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reprompt budget. Each invocation does one reprompt; this is the max number
// of invocations after the initial narrative generation. With cap=3 the total
// budget is: initial generation + 3 reprompts.
const MAX_REPROMPT_ATTEMPTS = 3;

// ────────────────────────────────────────────────────────────────────────────
// SECTION 1: Proper-noun extraction (mirrors integrity pass and patch 08d)
// ────────────────────────────────────────────────────────────────────────────

const PROPER_NOUN_STOP_WORDS = new Set<string>([
  'The','This','That','These','Those','There','Their','They','Them',
  'What','When','Where','Which','While','Who','Whose','Why','How',
  'From','With','Without','About','After','Before','Between','During',
  'Through','Against','Among','Within','Above','Below','Across','Around',
  'Each','Every','Some','Such','Both','Either','Neither','All','Any',
  'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'First','Second','Third','Fourth','Fifth','Sixth','Last','Next',
  'Year','Month','Week','Day','Today','Tomorrow','Yesterday',
  'Yes','Yet','Still','Then','Than','Thus','Therefore',
  'Annual','Revenue','Growth','Margin','Value','Investment','Investors',
  'Business','Market','Industry','Current','Target','Readiness','Ready',
  'Pipeline','Contract','Contracts','Enterprise','Platform','Compliance',
  'Regulatory','Financial','Corporate','Defensible','Milestone','Advisory',
  'Governance','Structuring','Forecast','Forecasts','Strategy','Strategic',
  'Operations','Operational','Conservative','Stretch','Base','High','Low',
  'Customer','Customers','Sales','Marketing','Team','Teams','Head','Heads',
  'Success','Path','Paths','North','Star','Deep','Strong','Weak',
  'Build','Building','Built','Move','Moving','Hit','Hitting',
  'Lock','Locking','Position','Positioning','Prove','Proving',
  'Score','Scorecard','Berkus','Method',
]);

function extractProperNouns(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const candidates = new Set<string>();
  for (const m of text.match(/\b[A-Z][A-Z0-9]{2,}\b/g) || []) candidates.add(m);
  for (const m of text.match(/\b[A-Z][a-z]+(?:[A-Z][a-zA-Z]+)+\b/g) || []) candidates.add(m);
  for (const m of text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || []) candidates.add(m);
  for (const m of text.match(/\b[A-Z][a-z]{3,}\b/g) || []) {
    if (!PROPER_NOUN_STOP_WORDS.has(m)) candidates.add(m);
  }
  return Array.from(candidates);
}

function isAllowed(candidate: string, allowlist: Set<string>): boolean {
  if (allowlist.has(candidate)) return true;
  for (const entry of allowlist) {
    if (entry.length <= candidate.length) continue;
    const wordRegex = new RegExp(
      `(^|\\s)${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`
    );
    if (wordRegex.test(entry)) return true;
  }
  return false;
}

interface ViolationDetail {
  entity: string;
  field: string;
  sentence: string;
}

function detectEntityViolations(
  narratives: Record<string, string | undefined>,
  allowlist: Set<string>,
  fieldsToCheck: string[]
): { unmatched: ViolationDetail[]; totalCandidates: number } {
  const unmatched: ViolationDetail[] = [];
  let totalCandidates = 0;
  for (const fieldKey of fieldsToCheck) {
    const text = narratives[fieldKey];
    if (!text || typeof text !== 'string') continue;
    const sentences = text.split(/(?<=[.!?])\s+/);
    for (const sentence of sentences) {
      const candidates = extractProperNouns(sentence);
      totalCandidates += candidates.length;
      for (const c of candidates) {
        if (!isAllowed(c, allowlist)) {
          unmatched.push({ entity: c, field: fieldKey, sentence: sentence.trim() });
        }
      }
    }
  }
  return { unmatched, totalCandidates };
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 2: JSON extraction (08d-hotfix)
// ────────────────────────────────────────────────────────────────────────────

function extractFirstJsonObject(text: string): string | null {
  const startIdx = text.indexOf('{');
  if (startIdx === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"' && !escape) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.substring(startIdx, i + 1);
    }
  }
  return text.substring(startIdx);
}

function safeJsonParse(content: string): any | null {
  try {
    return JSON.parse(content.trim());
  } catch {
    const extracted = extractFirstJsonObject(content);
    if (!extracted) return null;
    try {
      return JSON.parse(extracted);
    } catch {
      return null;
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 3: Helpers for chain triggering
// ────────────────────────────────────────────────────────────────────────────

async function fireAndForget(url: string, body: any, label: string): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(`[BM Pass 2 Validate] ❌ Missing env vars — cannot trigger ${label}`);
    return;
  }
  console.log(`[BM Pass 2 Validate] Triggering ${label} (fire-and-forget): ${url}`);
  try {
    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).catch(err => {
      console.error(`[BM Pass 2 Validate] ❌ ${label} fire-and-forget rejected:`, err);
    });
    console.log(`[BM Pass 2 Validate] ✅ ${label} triggered`);
  } catch (triggerErr) {
    console.error(`[BM Pass 2 Validate] ❌ Failed to invoke ${label}:`, triggerErr);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();
    if (!engagementId) throw new Error('engagementId is required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ────────────────────────────────────────────────────────────────────
    // Load state
    // ────────────────────────────────────────────────────────────────────

    const { data: report, error: reportError } = await supabase
      .from('bm_reports')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();
    if (reportError || !report) {
      throw new Error(`Failed to fetch report: ${reportError?.message || 'Not found'}`);
    }

    const currentAttempt: number = report.reprompt_attempt_count ?? 0;
    console.log(`[BM Pass 2 Validate] Starting attempt ${currentAttempt + 1} of ${MAX_REPROMPT_ATTEMPTS} for engagement ${engagementId}`);

    const allowlistPayload = (report as any).entity_allowlist;
    const entityAllowlistEntries: string[] = allowlistPayload?.entries || [];
    const entityAllowlistSet = new Set<string>(entityAllowlistEntries);

    if (entityAllowlistSet.size === 0) {
      // No allowlist — can't validate. Mark unverified, trigger Pass 3, exit.
      console.warn('[BM Pass 2 Validate] ⚠ No allowlist on report — marking unverified, proceeding to Pass 3');
      await supabase
        .from('bm_reports')
        .update({ narrative_quality: 'unverified' })
        .eq('engagement_id', engagementId);
      await supabase
        .from('bm_engagements')
        .update({ status: 'generated' })
        .eq('id', engagementId);
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      await fireAndForget(
        `${supabaseUrl}/functions/v1/generate-bm-opportunities`,
        { engagementId },
        'Pass 3 (opportunities)'
      );
      return new Response(
        JSON.stringify({ success: true, status: 'unverified', engagementId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reconstruct narratives object from report columns
    const narratives: Record<string, string> = {
      headline: report.headline || '',
      executiveSummary: report.executive_summary || '',
      positionNarrative: report.position_narrative || '',
      strengthNarrative: report.strength_narrative || '',
      gapNarrative: report.gap_narrative || '',
      opportunityNarrative: report.opportunity_narrative || '',
    };

    const narrativeFieldKeys = Object.keys(narratives);

    // ────────────────────────────────────────────────────────────────────
    // Detect violations on current state
    // ────────────────────────────────────────────────────────────────────

    const detection = detectEntityViolations(narratives, entityAllowlistSet, narrativeFieldKeys);
    console.log(`[BM Pass 2 Validate] Detection: ${detection.unmatched.length} of ${detection.totalCandidates} candidates unmatched`);

    // ────────────────────────────────────────────────────────────────────
    // TERMINAL STATE 1 — CLEAN
    // ────────────────────────────────────────────────────────────────────

    if (detection.unmatched.length === 0) {
      console.log('[BM Pass 2 Validate] ✅ Narrative is clean. Marking generated, triggering Pass 3.');
      await supabase
        .from('bm_reports')
        .update({
          narrative_quality: 'clean',
          entity_violations: [],
        })
        .eq('engagement_id', engagementId);
      await supabase
        .from('bm_engagements')
        .update({ status: 'generated' })
        .eq('id', engagementId);
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      await fireAndForget(
        `${supabaseUrl}/functions/v1/generate-bm-opportunities`,
        { engagementId },
        'Pass 3 (opportunities)'
      );
      return new Response(
        JSON.stringify({ success: true, status: 'clean', engagementId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ────────────────────────────────────────────────────────────────────
    // TERMINAL STATE 2 — CAP REACHED, VIOLATIONS REMAIN
    // ────────────────────────────────────────────────────────────────────

    if (currentAttempt >= MAX_REPROMPT_ATTEMPTS) {
      console.warn(`[BM Pass 2 Validate] ⚠ Cap reached (${MAX_REPROMPT_ATTEMPTS}) with ${detection.unmatched.length} violations. Marking requires_review, proceeding to Pass 3.`);
      await supabase
        .from('bm_reports')
        .update({
          narrative_quality: 'requires_review',
          entity_violations: detection.unmatched,
        })
        .eq('engagement_id', engagementId);
      await supabase
        .from('bm_engagements')
        .update({ status: 'generated' })
        .eq('id', engagementId);
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      await fireAndForget(
        `${supabaseUrl}/functions/v1/generate-bm-opportunities`,
        { engagementId },
        'Pass 3 (opportunities)'
      );
      return new Response(
        JSON.stringify({
          success: true,
          status: 'requires_review',
          engagementId,
          violations_remaining: detection.unmatched.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ────────────────────────────────────────────────────────────────────
    // NON-TERMINAL — REPROMPT OPUS, WRITE STATE, SELF-CHAIN
    // ────────────────────────────────────────────────────────────────────

    const nextAttempt = currentAttempt + 1;
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const violationDetail = detection.unmatched.map(v =>
      `- "${v.entity}" in ${v.field}: "${v.sentence}"`
    ).join('\n');
    const affectedFields = [...new Set(detection.unmatched.map(v => v.field))].join(', ');

    const repromptInstruction = `
Your previous narrative contained these entities that are not on the approved list:

${violationDetail}

Rewrite ONLY the affected fields (${affectedFields}). Replace each unapproved entity with a generic descriptor ("comparable firms in the sector", "industry peers", "the founder", etc.). Do not introduce any new proper noun. Return JSON containing the rewritten fields (and any unchanged fields you wish to preserve verbatim).

APPROVED ENTITY LIST (UNCHANGED):
${entityAllowlistEntries.map(e => `  - ${e}`).join('\n')}

CURRENT NARRATIVES:
${JSON.stringify(narratives, null, 2)}
`.trim();

    console.log(`[BM Pass 2 Validate] Calling Opus reprompt (attempt ${nextAttempt}) to fix ${detection.unmatched.length} violations in: ${affectedFields}`);
    const startTime = Date.now();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4',
        messages: [
          { role: 'system', content: 'You rewrite report narratives to comply with strict entity-naming constraints. Return valid JSON.' },
          { role: 'user', content: repromptInstruction },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    let repromptSucceeded = false;
    let fieldsRewritten: string[] = [];
    let repromptTokens = 0;
    let repromptCost = 0;

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[BM Pass 2 Validate] Reprompt HTTP ${response.status}: ${errorText}. Will self-chain and let next attempt try (or hit cap).`);
    } else {
      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      repromptTokens = result.usage?.total_tokens || 0;
      repromptCost = (repromptTokens / 1000) * 0.015;

      const rewritten = safeJsonParse(content);
      if (rewritten && typeof rewritten === 'object') {
        for (const key of narrativeFieldKeys) {
          if (typeof rewritten[key] === 'string' && rewritten[key] !== narratives[key]) {
            narratives[key] = rewritten[key];
            fieldsRewritten.push(key);
          }
        }
        repromptSucceeded = true;
        console.log(`[BM Pass 2 Validate] Reprompt parsed. Rewritten fields: ${fieldsRewritten.join(', ') || '(none — Opus returned same content)'}`);
      } else {
        console.warn('[BM Pass 2 Validate] Reprompt returned unparseable JSON. Narrative unchanged for this attempt.');
      }
    }

    const generationTime = Date.now() - startTime;

    // Re-detect on rewritten narratives (or unchanged if reprompt failed)
    const postDetection = detectEntityViolations(narratives, entityAllowlistSet, narrativeFieldKeys);
    console.log(`[BM Pass 2 Validate] After reprompt: ${postDetection.unmatched.length} violations remain`);

    // Append to reprompt_history
    const existingHistory: any[] = Array.isArray(report.reprompt_history) ? report.reprompt_history : [];
    const newHistoryEntry = {
      attempt: nextAttempt,
      triggered_by: 'entity_violation',
      violations_before: detection.unmatched.length,
      violations_after: postDetection.unmatched.length,
      fields_rewritten: fieldsRewritten,
      reprompt_succeeded: repromptSucceeded,
      tokens_used: repromptTokens,
      cost: repromptCost,
      generation_time_ms: generationTime,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [...existingHistory, newHistoryEntry];

    // ────────────────────────────────────────────────────────────────────
    // Write state (always, regardless of next chain decision)
    // ────────────────────────────────────────────────────────────────────

    const writePayload: Record<string, any> = {
      reprompt_attempt_count: nextAttempt,
      entity_violations: postDetection.unmatched,
      reprompt_history: updatedHistory,
      llm_tokens_used: (report.llm_tokens_used || 0) + repromptTokens,
      llm_cost: (report.llm_cost || 0) + repromptCost,
      generation_time_ms: (report.generation_time_ms || 0) + generationTime,
    };
    if (fieldsRewritten.includes('headline')) writePayload.headline = narratives.headline;
    if (fieldsRewritten.includes('executiveSummary')) writePayload.executive_summary = narratives.executiveSummary;
    if (fieldsRewritten.includes('positionNarrative')) writePayload.position_narrative = narratives.positionNarrative;
    if (fieldsRewritten.includes('strengthNarrative')) writePayload.strength_narrative = narratives.strengthNarrative;
    if (fieldsRewritten.includes('gapNarrative')) writePayload.gap_narrative = narratives.gapNarrative;
    if (fieldsRewritten.includes('opportunityNarrative')) writePayload.opportunity_narrative = narratives.opportunityNarrative;

    const { error: updateErr } = await supabase
      .from('bm_reports')
      .update(writePayload)
      .eq('engagement_id', engagementId);
    if (updateErr) throw updateErr;

    // ────────────────────────────────────────────────────────────────────
    // Self-chain via fire-and-forget. The next invocation will re-evaluate
    // and either: detect clean (terminal), hit cap (terminal), or chain
    // again. Engagement status stays at narrative_generated.
    // ────────────────────────────────────────────────────────────────────

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    await fireAndForget(
      `${supabaseUrl}/functions/v1/generate-bm-report-pass2-validate`,
      { engagementId },
      `Validator (next attempt: ${nextAttempt + 1}/${MAX_REPROMPT_ATTEMPTS})`
    );

    return new Response(
      JSON.stringify({
        success: true,
        engagementId,
        status: 'chained',
        attempt: nextAttempt,
        violations_remaining: postDetection.unmatched.length,
        fields_rewritten: fieldsRewritten,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BM Pass 2 Validate] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
