// ============================================================================
// ANALYZE SA PRELIMINARY — Part 3 Two-Phase Report Generation
// ============================================================================
// Single fast AI call to assess data quality and suggest gaps before full
// report. Output stored on sa_engagements.preliminary_analysis.
// Idempotent: re-run overwrites previous analysis.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

const TRUNCATE = (s: string | undefined | null, maxLen: number) =>
  (s == null ? '' : String(s)).length <= maxLen ? (s ?? '') : (s ?? '').slice(0, maxLen) + '…';

const MAX_FIELD = 500;
const MAX_SYSTEMS = 25;
const MAX_DEEP_DIVES = 12;

function buildPreliminaryPrompt(
  discovery: any,
  systems: any[],
  deepDives: any[],
  clientName: string
): string {
  const raw = discovery?.raw_responses || {};
  const stage1Text = Object.entries(raw)
    .map(([k, v]) => `${k}: ${TRUNCATE(typeof v === 'string' ? v : JSON.stringify(v), MAX_FIELD)}`)
    .join('\n');

  const systemsSlice = (systems || []).slice(0, MAX_SYSTEMS);
  const stage2Text = systemsSlice
    .map(
      (s: any) =>
        `- ${s.system_name} (${s.category_code}): criticality=${s.criticality}, cost=£${s.monthly_cost || 0}/mo, integration=${s.integration_method || 'none'}, issues="${TRUNCATE(s.known_issues || '', 200)}"`
    )
    .join('\n');

  const deepSlice = (deepDives || []).slice(0, MAX_DEEP_DIVES);
  const stage3Text = deepSlice
    .map((dd: any) => {
      const pains = (dd.key_pain_points || []).slice(0, 10);
      const responses = dd.responses || {};
      const respLines = Object.entries(responses)
        .slice(0, 15)
        .map(([k, v]) => `  ${k}: ${TRUNCATE(JSON.stringify(v), 300)}`);
      return `### ${dd.chain_code}\nPain points: ${pains.map((p: string) => `"${TRUNCATE(p, 150)}"`).join('; ')}\nResponses:\n${respLines.join('\n')}`;
    })
    .join('\n\n');

  const totalQuestions = 32;
  const answered = stage1Text ? Object.keys(raw).filter((k) => raw[k] != null && String(raw[k]).trim() !== '').length : 0;
  const totalChains = 7;
  const chainsDone = deepSlice.length;

  return `You are reviewing a completed Systems Audit assessment for a UK SMB. Your job is NOT to write the report — it's to assess the quality and completeness of the data collected, identify gaps that would prevent strong recommendations, and flag contradictions.

Think like a senior consultant reviewing a junior's intake notes before the client presentation. What would you send them back to clarify?

Company context: ${clientName}

═══════════════════════════════════════════════════════════════════════════════
STAGE 1 RESPONSES (discovery)
═══════════════════════════════════════════════════════════════════════════════

${stage1Text || '(no responses)'}

═══════════════════════════════════════════════════════════════════════════════
STAGE 2 SYSTEM INVENTORY (${systemsSlice.length} systems)
═══════════════════════════════════════════════════════════════════════════════

${stage2Text || '(none)'}

═══════════════════════════════════════════════════════════════════════════════
STAGE 3 PROCESS DEEP DIVES (${deepSlice.length} chains)
═══════════════════════════════════════════════════════════════════════════════

${stage3Text || '(none)'}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK — Return ONLY a single JSON object, no markdown
═══════════════════════════════════════════════════════════════════════════════

{
  "businessSnapshot": {
    "companyType": "e.g. 16-person digital agency, Brighton",
    "revenue_model": "e.g. Mixed project/retainer",
    "growth_stage": "e.g. Scaling — hiring blocked by process gaps",
    "systems_count": ${systemsSlice.length},
    "headline_pain": "One-sentence summary of the core issue"
  },
  "confidenceScores": [
    {
      "area": "Financial processes",
      "confidence": "high" | "medium" | "low",
      "reason": "Why this level",
      "questionsCited": ["question_id_1", "question_id_2"]
    }
  ],
  "suggestedGaps": [
    {
      "gap_area": "stage_1_discovery" | "stage_2_inventory" | "stage_3_process" | "cross_cutting",
      "gap_tag": "snake_case_tag",
      "description": "Specific thing missing — be concrete, cite question IDs where relevant",
      "source_question": "question_id or null",
      "severity": "blocking" | "important" | "nice_to_have"
    }
  ],
  "contradictions": [
    {
      "claim_a": "e.g. Stage 1: 'integration health is partial'",
      "claim_b": "e.g. Stage 2: '0 native integrations logged'",
      "source_a": "question or source",
      "source_b": "question or source",
      "suggested_resolution": "What to clarify"
    }
  ],
  "topInsights": ["3 to 5 headline observations"],
  "questionsAnswered": ${answered},
  "questionsSkipped": ${totalQuestions - answered},
  "totalQuestions": ${totalQuestions},
  "chainsCompleted": ${chainsDone},
  "totalChains": ${totalChains}
}

RULES:
- For suggestedGaps: "blocking" = report would be materially wrong without this; "important" = report weaker but not wrong; "nice_to_have" = would add depth only. Be specific in descriptions — don't say "need more detail on financial processes", say "Client mentions project profitability unknown (ptd_budget_visibility) but hasn't specified if they capture billable hours consistently; clarify time tracking compliance."
- For confidenceScores, assess: Financial processes, Project delivery, People operations, Sales & client management, Technology integration, Compliance, Resource planning. Use question IDs in questionsCited where possible.
- Return ONLY valid JSON, no \`\`\` or explanation.`;
}

function parseJsonFromContent(content: string): string {
  content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
  const firstBrace = content.indexOf('{');
  if (firstBrace > 0) content = content.substring(firstBrace);
  return content;
}

function normalizeAnalysis(data: any): any {
  const snap = data?.businessSnapshot || {};
  const companyProfile = snap.companyProfile ?? snap.companyType ?? '';
  const revenueModel = snap.revenueModel ?? snap.revenue_model ?? '';
  const growthStage = snap.growthStage ?? snap.growth_stage ?? '';
  const headlinePain = snap.headlinePain ?? snap.headline_pain ?? '';
  const systemsCount = typeof snap.systemsCount === 'number' ? snap.systemsCount : (snap.systems_count ?? 0);
  return {
    businessSnapshot: {
      companyProfile,
      companyType: companyProfile,
      revenueModel,
      revenue_model: revenueModel,
      growthStage,
      growth_stage: growthStage,
      headlinePain,
      headline_pain: headlinePain,
      systemsCount,
      systems_count: systemsCount,
    },
    confidenceScores: Array.isArray(data?.confidenceScores) ? data.confidenceScores : [],
    suggestedGaps: Array.isArray(data?.suggestedGaps) ? data.suggestedGaps : [],
    contradictions: Array.isArray(data?.contradictions) ? data.contradictions : [],
    topInsights: Array.isArray(data?.topInsights) ? data.topInsights : [],
    questionsAnswered: typeof data?.questionsAnswered === 'number' ? data.questionsAnswered : 0,
    questionsSkipped: typeof data?.questionsSkipped === 'number' ? data.questionsSkipped : 0,
    totalQuestions: typeof data?.totalQuestions === 'number' ? data.totalQuestions : 32,
    chainsCompleted: typeof data?.chainsCompleted === 'number' ? data.chainsCompleted : 0,
    totalChains: typeof data?.totalChains === 'number' ? data.totalChains : 7,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let engagementId: string | null = null;

  try {
    const body = await req.json();
    engagementId = body?.engagementId ?? null;

    if (!engagementId) {
      throw new Error('engagementId is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const [
      { data: engagement, error: engErr },
      { data: discovery, error: discErr },
      { data: systems },
      { data: deepDives },
    ] = await Promise.all([
      supabase.from('sa_engagements').select('*').eq('id', engagementId).single(),
      supabase.from('sa_discovery_responses').select('*').eq('engagement_id', engagementId).single(),
      supabase.from('sa_system_inventory').select('*').eq('engagement_id', engagementId),
      supabase.from('sa_process_deep_dives').select('*').eq('engagement_id', engagementId),
    ]);

    if (engErr || !engagement) {
      throw new Error(`Engagement not found: ${engErr?.message || 'unknown'}`);
    }
    if (discErr || !discovery) {
      throw new Error(`Discovery not found: ${discErr?.message || 'unknown'}`);
    }

    let clientName = 'the business';
    if (engagement.client_id) {
      const { data: client } = await supabase
        .from('practice_members')
        .select('client_company, company, name')
        .eq('id', engagement.client_id)
        .maybeSingle();
      clientName = client?.client_company || client?.company || client?.name || clientName;
    }

    const prompt = buildPreliminaryPrompt(discovery, systems || [], deepDives || [], clientName);

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    console.log('[analyze-sa-preliminary] Calling Sonnet...');
    const start = Date.now();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor SA Preliminary',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 12000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter failed (${response.status}): ${errText}`);
    }

    const json = await response.json();
    const choice = json?.choices?.[0];
    const content = choice?.message?.content ?? '';
    const finishReason = choice?.finish_reason ?? 'unknown';
    const elapsed = Date.now() - start;
    console.log(`[analyze-sa-preliminary] Response in ${elapsed}ms, ${content.length} chars, finish_reason=${finishReason}`);

    if (finishReason === 'length') {
      console.error('[analyze-sa-preliminary] Model hit token limit — response was truncated. Increase max_tokens or shorten prompt.');
    }

    const rawContent = parseJsonFromContent(content);
    let data: any;
    try {
      data = JSON.parse(rawContent);
    } catch (e) {
      const preview = rawContent.slice(0, 400);
      const tail = rawContent.slice(-300);
      console.error('[analyze-sa-preliminary] JSON parse failed. Length:', rawContent.length);
      console.error('[analyze-sa-preliminary] Start:', preview);
      console.error('[analyze-sa-preliminary] End (last 300 chars):', tail);
      throw new Error('Preliminary analysis returned invalid or truncated JSON. Check logs for details.');
    }

    const analysis = normalizeAnalysis(data);

    const { error: updateErr } = await supabase
      .from('sa_engagements')
      .update({
        preliminary_analysis: analysis,
        preliminary_analysis_at: new Date().toISOString(),
        review_status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', engagementId);

    if (updateErr) {
      throw new Error(`Failed to store analysis: ${updateErr.message}`);
    }

    // Auto-create suggested gaps (re-run clears existing AI-suggested gaps first)
    if (analysis.suggestedGaps && analysis.suggestedGaps.length > 0) {
      await supabase
        .from('sa_engagement_gaps')
        .delete()
        .eq('engagement_id', engagementId)
        .eq('source', 'ai_preliminary');

      const gapRows = analysis.suggestedGaps.map((gap: any) => ({
        engagement_id: engagementId,
        gap_area: gap.gap_area || 'cross_cutting',
        gap_tag: gap.gap_tag || '',
        description: gap.description || '',
        source_question: gap.source_question || null,
        status: 'identified',
        source: 'ai_preliminary',
        severity: gap.severity || 'important',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: gapError } = await supabase
        .from('sa_engagement_gaps')
        .insert(gapRows);

      if (gapError) {
        console.warn('[analyze-sa-preliminary] Failed to insert gaps:', gapError.message);
      } else {
        console.log(`[analyze-sa-preliminary] Inserted ${gapRows.length} suggested gaps`);
      }
    }

    const elapsedMs = Date.now() - start;

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        stats: {
          elapsedMs,
          suggestedGaps: analysis.suggestedGaps?.length || 0,
          contradictions: analysis.contradictions?.length || 0,
          confidenceScores: analysis.confidenceScores?.length || 0,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[analyze-sa-preliminary]', msg);

    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
