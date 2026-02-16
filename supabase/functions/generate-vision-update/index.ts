// ============================================================================
// GENERATE VISION UPDATE (Phase 4 — Renewal)
// ============================================================================
// Evolves the 5-year vision using Sprint 1 summary + life check. LLM stage.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchStage(
  supabase: any,
  clientId: string,
  stageType: string,
  sprintNumber: number
) {
  const { data } = await supabase
    .from('roadmap_stages')
    .select('generated_content, approved_content')
    .eq('client_id', clientId)
    .eq('stage_type', stageType)
    .eq('sprint_number', sprintNumber)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.approved_content || data?.generated_content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { clientId, practiceId, sprintNumber = 2 } = await req.json();
    if (!clientId || !practiceId) throw new Error('clientId and practiceId required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const prevSprint = sprintNumber - 1;

    const lifeDesignRefresh = await fetchStage(supabase, clientId, 'life_design_refresh', sprintNumber);
    const prevVision =
      (await fetchStage(supabase, clientId, 'five_year_vision', prevSprint)) ||
      (await fetchStage(supabase, clientId, 'vision_update', prevSprint));
    const prevSummaryContent = await fetchStage(supabase, clientId, 'sprint_summary', prevSprint);
    const prevSummary = prevSummaryContent?.summary || {};
    const prevAnalytics = prevSummaryContent?.analytics || {};

    if (!prevVision) throw new Error('Previous vision not found');
    if (!lifeDesignRefresh) throw new Error('Life design refresh not found');

    const renewalContext = `
## SPRINT 1 CONTEXT (Renewal — Sprint ${sprintNumber})

Sprint 1 Headline: ${prevSummary.headlineAchievement || 'N/A'}
Completion Rate: ${prevAnalytics.completionRate ?? 'N/A'}%
Skip Rate: ${prevAnalytics.skipRate ?? 'N/A'}%

Strengths Revealed:
${(prevSummary.strengthsRevealed || []).map((s: any) => `- ${s.strength}: ${s.evidence}`).join('\n') || 'None'}

Growth Areas:
${(prevSummary.growthAreas || []).map((g: any) => `- ${g.area}: ${g.evidence}`).join('\n') || 'None'}

Tuesday Test Evolution:
- Original: "${lifeDesignRefresh.originalTuesdayTest || ''}"
- After Sprint 1: "${lifeDesignRefresh.updatedTuesdayTest || lifeDesignRefresh.originalTuesdayTest || ''}"
- Progress: ${prevSummary.tuesdayTestComparison?.progress || 'N/A'}

Their #1 wish for this sprint: "${lifeDesignRefresh.nextSprintWish || 'N/A'}"
Priority shift: "${lifeDesignRefresh.priorityShift || 'N/A'}"

Renewal Recommendations:
- Focus areas: ${(prevSummary.renewalRecommendations?.focusAreas || []).join(', ') || 'N/A'}
- Tone shift: ${prevSummary.renewalRecommendations?.toneShift || 'N/A'}
- Life design adjustment: ${prevSummary.renewalRecommendations?.lifeDesignAdjustment || 'N/A'}
`;

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const prompt = `You are EVOLVING a 5-year vision after the client completed Sprint 1. Do NOT start from scratch. Build on what Sprint 1 confirmed. Adjust what the evidence says needs adjusting. The North Star should strengthen or refine, not wildly change. Year 1 milestones should reflect Sprint 1 progress—some may be partially achieved already.

## PREVIOUS VISION (JSON)
${JSON.stringify(prevVision, null, 2)}

${renewalContext}

## YOUR TASK
Return the SAME JSON structure as the previous vision (tagline, transformationNarrative, yearMilestones, theChoice, northStar, visualisation). EVOLVE the content:
- Update transformationNarrative to reflect where they are NOW (post–Sprint 1) and where they're heading.
- Adjust yearMilestones.year1 to reflect what's been partially achieved or what remains.
- Refine northStar and visualisation using their updated Tuesday Test and next sprint wish.
- Keep British English. No corporate jargon. Return ONLY valid JSON.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Vision Update',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        max_tokens: 4000,
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content:
              'You evolve an existing 5-year vision using Sprint 1 evidence. Return ONLY valid JSON matching the previous vision structure. British English. No markdown.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('LLM error:', err);
      throw new Error(`LLM error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Failed to find JSON in response');
    let parsed;
    try {
      parsed = JSON.parse(cleaned.substring(start, end + 1));
    } catch {
      const fixed = cleaned.substring(start, end + 1).replace(/,(\s*[}\]])/g, '$1');
      parsed = JSON.parse(fixed);
    }

    const { data: existing } = await supabase
      .from('roadmap_stages')
      .select('version')
      .eq('client_id', clientId)
      .eq('stage_type', 'vision_update')
      .eq('sprint_number', sprintNumber)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = existing ? existing.version + 1 : 1;

    const { data: stage, error: stageErr } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: 'vision_update',
        sprint_number: sprintNumber,
        version: nextVersion,
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        model_used: 'anthropic/claude-sonnet-4.5',
      })
      .select()
      .single();

    if (stageErr) throw stageErr;

    await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: parsed,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: Date.now() - startTime,
      })
      .eq('id', stage.id);

    return new Response(
      JSON.stringify({ success: true, stageId: stage.id, sprintNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('generate-vision-update error:', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
