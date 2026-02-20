// ============================================================================
// GENERATE SA CALL SCRIPT — Follow-up call script from accepted gaps
// ============================================================================
// Loads identified gaps + preliminary analysis, generates conversational
// script. Stores on sa_engagements.follow_up_script.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const engagementId = body?.engagementId;
    if (!engagementId) throw new Error('engagementId is required');

    console.log(`[SA Call Script] Generating for engagement: ${engagementId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: engagement, error: engError } = await supabase
      .from('sa_engagements')
      .select('*')
      .eq('id', engagementId)
      .single();

    if (engError || !engagement) throw new Error(`Engagement not found: ${engError?.message || 'unknown'}`);

    const preliminary = engagement.preliminary_analysis;
    if (!preliminary) throw new Error('No preliminary analysis found — run preliminary analysis first');

    const { data: gaps } = await supabase
      .from('sa_engagement_gaps')
      .select('*')
      .eq('engagement_id', engagementId)
      .eq('status', 'identified')
      .order('created_at', { ascending: true });

    if (!gaps || gaps.length === 0) {
      return new Response(
        JSON.stringify({ success: true, script: null, message: 'No gaps to script — all dismissed or resolved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let clientName = 'the client';
    let contactName = 'the founder';
    if (engagement.client_id) {
      const { data: client } = await supabase
        .from('practice_members')
        .select('client_company, company, name')
        .eq('id', engagement.client_id)
        .maybeSingle();
      clientName = client?.client_company || client?.company || clientName;
      contactName = client?.name || contactName;
    }

    const prompt = buildScriptPrompt(clientName, contactName, preliminary, gaps);

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor SA Call Script',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${errText}`);
    }

    let fullContent = '';
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((l: string) => l.startsWith('data: '));
      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) fullContent += delta;
        } catch {
          /* skip */
        }
      }
    }

    let cleaned = fullContent
      .replace(/^```[a-z]*\s*\n?/gi, '')
      .replace(/\n?```\s*$/g, '')
      .trim();
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) cleaned = cleaned.substring(firstBrace);
    let braceCount = 0;
    let lastBrace = -1;
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '{') braceCount++;
      if (cleaned[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          lastBrace = i;
          break;
        }
      }
    }
    if (lastBrace > 0) cleaned = cleaned.substring(0, lastBrace + 1);

    const script = JSON.parse(cleaned);
    console.log(`[SA Call Script] Generated: ${script.sections?.length || 0} sections, ~${script.estimatedMinutes ?? '?'} mins`);

    const { error: updateError } = await supabase
      .from('sa_engagements')
      .update({
        follow_up_script: script,
        follow_up_script_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', engagementId);

    if (updateError) throw new Error(`Failed to store script: ${updateError.message}`);

    const elapsedMs = Date.now() - startTime;
    console.log(`[SA Call Script] Complete in ${(elapsedMs / 1000).toFixed(1)}s`);

    return new Response(
      JSON.stringify({ success: true, script, stats: { elapsedMs, gapsAddressed: gaps.length } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SA Call Script] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildScriptPrompt(
  clientName: string,
  contactName: string,
  preliminary: any,
  gaps: any[]
): string {
  const snapshot = preliminary.businessSnapshot || {};
  const contradictions = preliminary.contradictions || [];

  const gapsByArea: Record<string, any[]> = {};
  for (const gap of gaps) {
    const area = gap.gap_area || 'cross_cutting';
    if (!gapsByArea[area]) gapsByArea[area] = [];
    gapsByArea[area].push(gap);
  }

  const gapsText = Object.entries(gapsByArea)
    .map(
      ([area, areaGaps]) =>
        `\n### ${area.toUpperCase().replace(/_/g, ' ')}\n` +
        areaGaps
          .map((g: any) => `- ${g.gap_tag || 'gap'}: ${g.description}`)
          .join('\n')
    )
    .join('\n');

  const contradictionsText =
    contradictions.length > 0
      ? contradictions
          .map(
            (c: any) =>
              `- ${c.claim_a} vs ${c.claim_b}\n  Resolution needed: ${c.suggested_resolution}`
          )
          .join('\n')
      : 'None identified.';

  return `You are writing a follow-up call script for a practice team member who needs to fill data gaps identified in a Systems Audit assessment. The call is with ${contactName} at ${clientName}.

BUSINESS CONTEXT:
${snapshot.companyType || clientName}
${snapshot.headline_pain || ''}
${snapshot.growth_stage || ''}

GAPS TO ADDRESS (${gaps.length} total):
${gapsText}

CONTRADICTIONS TO CLARIFY:
${contradictionsText}

SCRIPT RULES:
1. This is a CONVERSATION, not an interrogation. The caller already has a relationship with the client.
2. Group questions by natural topic flow, NOT by gap ID. A good grouping might be: "Let's talk about project profitability for a minute" → covers 3 gaps naturally.
3. Start with a warm opener that explains why the call is happening: "We've reviewed everything and the picture is really clear — just a few areas where I want to make sure our recommendations are spot-on."
4. For each topic, give the caller:
   - A natural lead-in sentence (how to introduce the topic without it feeling like an audit)
   - The core question(s) to ask — conversational, not clinical
   - What "good enough" looks like (so they know when to move on)
   - A follow-up prompt if the answer is vague
5. Include contradictions as gentle clarifications, not accusations: "You mentioned X in the assessment — I just want to make sure I'm reading that right..."
6. End with an open question: "Is there anything else that would help us get this right?"
7. Estimate 25-30 minutes total. Flag if the gap count suggests it needs longer.
8. CRITICAL: For each question/topic, note which gap_tags it addresses (so transcript processing can map answers back).

Return a JSON object:

{
  "opener": "The warm opening paragraph the caller reads/paraphrases",
  "estimatedMinutes": 25,
  "sections": [
    {
      "topic": "Short topic name (e.g., 'Project Profitability')",
      "leadIn": "How to introduce this topic naturally",
      "questions": [
        {
          "question": "The actual question to ask, conversationally phrased",
          "followUp": "If they give a vague answer, ask this",
          "goodEnough": "What constitutes a sufficient answer",
          "addressesGapTags": ["project_profitability_baseline", "scope_creep_quantification"]
        }
      ],
      "estimatedMinutes": 5
    }
  ],
  "contradictions": [
    {
      "topic": "What this is about",
      "question": "How to ask about it naturally",
      "addressesGapTags": ["relevant_tag"]
    }
  ],
  "closer": "The closing question and sign-off",
  "callerNotes": "Any tips for the caller — tone, things to watch for, potential sensitivities"
}

Return ONLY the JSON object. No markdown wrapping.`;
}
