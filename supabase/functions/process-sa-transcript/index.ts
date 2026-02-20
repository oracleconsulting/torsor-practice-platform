// ============================================================================
// PROCESS SA TRANSCRIPT — Map transcript to gaps, auto-resolve
// ============================================================================
// Accepts raw transcript, AI extracts answers per gap, updates sa_engagement_gaps
// with resolution + additional_context. Stores transcript and extraction on engagement.
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
    const transcript = body?.transcript;
    if (!engagementId) throw new Error('engagementId is required');
    if (!transcript || String(transcript).trim().length < 50) {
      throw new Error('Transcript is too short — paste the full call notes or transcript');
    }

    const transcriptStr = String(transcript).trim();
    console.log(`[SA Transcript] Processing for engagement: ${engagementId} (${transcriptStr.length} chars)`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: engagement, error: engError } = await supabase
      .from('sa_engagements')
      .select('*')
      .eq('id', engagementId)
      .single();

    if (engError || !engagement) throw new Error(`Engagement not found: ${engError?.message || 'unknown'}`);

    const { data: gaps } = await supabase
      .from('sa_engagement_gaps')
      .select('*')
      .eq('engagement_id', engagementId)
      .eq('status', 'identified');

    let clientName = 'Unknown Client';
    if (engagement.client_id) {
      const { data: client } = await supabase
        .from('practice_members')
        .select('client_company, company')
        .eq('id', engagement.client_id)
        .maybeSingle();
      clientName = client?.client_company || client?.company || clientName;
    }

    if (!gaps || gaps.length === 0) {
      await supabase
        .from('sa_engagements')
        .update({
          follow_up_transcript: transcriptStr,
          follow_up_transcript_uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', engagementId);

      return new Response(
        JSON.stringify({ success: true, resolved: 0, message: 'Transcript stored but no open gaps to resolve' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = buildTranscriptPrompt(clientName, transcriptStr, gaps);

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor SA Transcript Processing',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
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

    const extraction = JSON.parse(cleaned);
    console.log(
      `[SA Transcript] Extracted: ${extraction.resolvedGaps?.length || 0} resolved, ${extraction.unresolvedGaps?.length || 0} unresolved`
    );

    await supabase
      .from('sa_engagements')
      .update({
        follow_up_transcript: transcriptStr,
        follow_up_transcript_uploaded_at: new Date().toISOString(),
        transcript_extraction: extraction,
        transcript_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', engagementId);

    let resolvedCount = 0;
    if (extraction.resolvedGaps && extraction.resolvedGaps.length > 0) {
      for (const resolved of extraction.resolvedGaps) {
        const matchingGap = gaps.find((g: any) => g.gap_tag === resolved.gap_tag);
        if (!matchingGap) continue;

        const { error: gapError } = await supabase
          .from('sa_engagement_gaps')
          .update({
            status: 'resolved',
            resolution: resolved.summary || null,
            additional_context: resolved.additional_context || null,
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', matchingGap.id);

        if (!gapError) resolvedCount++;
        else console.warn(`[SA Transcript] Failed to resolve gap ${resolved.gap_tag}: ${gapError.message}`);
      }
    }

    const elapsedMs = Date.now() - startTime;
    console.log(`[SA Transcript] Complete in ${(elapsedMs / 1000).toFixed(1)}s — ${resolvedCount}/${gaps.length} gaps resolved`);

    return new Response(
      JSON.stringify({
        success: true,
        extraction,
        stats: {
          elapsedMs,
          totalGaps: gaps.length,
          resolved: resolvedCount,
          unresolved: (extraction.unresolvedGaps || []).length,
          additionalInsights: (extraction.additionalInsights || []).length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SA Transcript] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildTranscriptPrompt(clientName: string, transcript: string, gaps: any[]): string {
  const gapsList = gaps
    .map((g: any) => `- gap_tag: "${g.gap_tag || 'untagged'}"\n  Description: ${g.description}`)
    .join('\n\n');

  return `You are processing a follow-up call transcript for ${clientName}'s Systems Audit. The practice team had a call to fill data gaps identified in the preliminary analysis. Your job is to extract specific answers and map them to the gaps they address.

GAPS WE WERE TRYING TO FILL (${gaps.length} total):
${gapsList}

CALL TRANSCRIPT / NOTES:
═══════════════════════════════════════════════════
${transcript}
═══════════════════════════════════════════════════

YOUR TASK:
1. Read the transcript carefully
2. For each gap, determine if the transcript contains a sufficient answer
3. Extract the relevant context — paraphrase and structure it for the report AI, don't just copy-paste raw transcript
4. Flag gaps that weren't addressed (not mentioned, or answer too vague to be useful)
5. Note any ADDITIONAL insights from the call that weren't in the original gaps but would improve the report

Return a JSON object:

{
  "resolvedGaps": [
    {
      "gap_tag": "project_profitability_baseline",
      "summary": "One-sentence summary of what we learned",
      "additional_context": "Structured paragraph for the report AI. Include specific numbers, names, and facts. This text will be appended to the assessment data as supplementary evidence. Format as if writing a consultant's field notes: factual, specific, useful for recommendations.",
      "confidence": "high | medium",
      "transcriptEvidence": "Brief quote or reference showing where in the transcript this came from"
    }
  ],

  "unresolvedGaps": [
    {
      "gap_tag": "lessons_learned_repository",
      "reason": "Not discussed in the call"
    }
  ],

  "additionalInsights": [
    "Things that came up in the call that weren't in the original gaps but are useful for the report."
  ]
}

RULES:
- Use the exact gap_tag string from the list above so we can match and auto-resolve.
- "additional_context" is the most important field — this feeds into the report AI. Be thorough, structured, and specific. Include numbers.
- If an answer partially addresses a gap, still mark it resolved but set confidence to "medium" and note what's still uncertain.
- Don't force resolution — if the transcript doesn't actually answer the gap, leave it unresolved with a clear reason.
- "additionalInsights" should only include genuinely new information, not restatements of existing assessment data.

Return ONLY the JSON object. No markdown wrapping.`;
}
