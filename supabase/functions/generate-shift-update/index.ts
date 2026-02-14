// ============================================================================
// GENERATE SHIFT UPDATE (Phase 4 — Renewal)
// ============================================================================
// New 6-month shift using updated vision + Sprint 1 lessons + BM/SA if available.
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

    const visionUpdate = await fetchStage(supabase, clientId, 'vision_update', sprintNumber);
    const lifeDesignRefresh = await fetchStage(supabase, clientId, 'life_design_refresh', sprintNumber);
    const prevShift =
      (await fetchStage(supabase, clientId, 'six_month_shift', prevSprint)) ||
      (await fetchStage(supabase, clientId, 'shift_update', prevSprint));
    const prevSummaryContent = await fetchStage(supabase, clientId, 'sprint_summary', prevSprint);
    const prevSummary = prevSummaryContent?.summary || {};
    const prevAnalytics = prevSummaryContent?.analytics || {};

    if (!visionUpdate) throw new Error('Vision update not found');
    if (!prevShift) throw new Error('Previous shift not found');

    let bmContext = '';
    let saContext = '';
    try {
      const { data: bmReport } = await supabase
        .from('bm_reports')
        .select('report_data')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (bmReport?.report_data) {
        const d = bmReport.report_data as any;
        bmContext = `
## BENCHMARKING DATA (since Sprint 1)
Industry: ${d.industry || 'N/A'}
Key findings: ${JSON.stringify(d.keyFindings || d.opportunities || [])}
Value gaps: ${JSON.stringify(d.valueGaps || [])}
`;
      }
    } catch (_) {}

    try {
      const { data: eng } = await supabase
        .from('sa_engagements')
        .select('id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (eng?.id) {
        const { data: saReport } = await supabase
          .from('sa_audit_reports')
          .select('findings, recommendations')
          .eq('engagement_id', eng.id)
          .maybeSingle();
        if (saReport) {
          const findings = (saReport.findings as any[]) || [];
          const recs = (saReport.recommendations as any[]) || [];
          saContext = `
## SYSTEMS AUDIT DATA (since Sprint 1)
Key bottlenecks: ${JSON.stringify(findings.filter((f: any) => f.severity === 'high').slice(0, 5))}
Top recommendations: ${JSON.stringify(recs.slice(0, 5))}
`;
        }
      }
    } catch (_) {}

    const renewalContext = `
## SPRINT 1 CONTEXT
Completion: ${prevAnalytics.completionRate ?? 'N/A'}%. Skip rate: ${prevAnalytics.skipRate ?? 'N/A'}%.
Most skipped category: ${prevAnalytics.mostSkippedCategory || 'N/A'}.
Focus areas for next sprint: ${(prevSummary.renewalRecommendations?.focusAreas || []).join(', ') || 'N/A'}.
Tone shift: ${prevSummary.renewalRecommendations?.toneShift || 'N/A'}.
Client priority shift: "${lifeDesignRefresh?.priorityShift || 'N/A'}".
Next sprint wish: "${lifeDesignRefresh?.nextSprintWish || 'N/A'}".
${bmContext}
${saContext}
`;

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const prompt = `You are EVOLVING a 6-month shift after the client completed Sprint 1. Use the UPDATED vision (vision_update) and the previous shift. Incorporate Sprint 1 lessons and any BM/SA data below. Return the SAME JSON structure as the previous shift: shiftStatement, keyMilestones, gapAnalysis, risks, quickWins, tuesdayEvolution, connectionToVision.

## UPDATED VISION (use this North Star and Year 1)
${JSON.stringify(visionUpdate, null, 2)}

## PREVIOUS 6-MONTH SHIFT
${JSON.stringify(prevShift, null, 2)}

${renewalContext}

## YOUR TASK
Evolve the shift. Adjust keyMilestones and quickWins based on what Sprint 1 achieved and what was skipped. Incorporate focus areas and tone shift from renewal recommendations. If BM/SA data is present, reference it in gapAnalysis or keyMilestones. Return ONLY valid JSON. British English.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Shift Update',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        max_tokens: 4000,
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content:
              'You evolve an existing 6-month shift using Sprint 1 evidence and updated vision. Return ONLY valid JSON matching the previous shift structure. British English. No markdown.',
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
    const parsed = JSON.parse(cleaned.substring(start, end + 1));

    const { data: existing } = await supabase
      .from('roadmap_stages')
      .select('version')
      .eq('client_id', clientId)
      .eq('stage_type', 'shift_update')
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
        stage_type: 'shift_update',
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
    console.error('generate-shift-update error:', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
