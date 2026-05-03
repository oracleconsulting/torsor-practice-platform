// ============================================================================
// GENERATE DIRECTOR ALIGNMENT MAP — Multi-Director GA Clients
// ============================================================================
// Manually triggered. Compares 2-3 directors from the same company to
// identify shared goals, tensions, blind spots, and sprint dependencies.
// Partner-tier feature for family business alignment sessions.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { recordLlmCost } from '../_shared/llm-cost-logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { directorIds, practiceId, primaryDirectorId } = await req.json();
    if (!directorIds?.length || !practiceId) throw new Error('directorIds[] and practiceId required');
    console.log(`[DirectorAlignment] Generating for ${directorIds.length} directors`);

    // Gather data for each director
    const directors: any[] = [];
    for (const dirId of directorIds) {
      const { data: member } = await supabase.from('practice_members').select('name, email, client_company').eq('id', dirId).single();

      const { data: assessments } = await supabase.from('client_assessments').select('assessment_type, responses').eq('client_id', dirId).in('assessment_type', ['part1', 'part2']);
      const p1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
      const p2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};

      const { data: fitStage } = await supabase.from('roadmap_stages').select('generated_content').eq('client_id', dirId).eq('stage_type', 'fit_assessment').in('status', ['generated', 'approved']).order('version', { ascending: false }).limit(1).maybeSingle();
      const fit = fitStage?.generated_content || {};

      directors.push({
        id: dirId,
        name: member?.name || 'Unknown',
        company: member?.client_company || p2.trading_name || 'Unknown',
        northStar: fit.northStar || '',
        archetype: fit.archetype || 'unknown',
        tuesdayTest: (p1.tuesday_test || '').substring(0, 400),
        dangerZone: p1.danger_zone || '',
        relationshipMirror: p1.relationship_mirror || '',
        sacrifices: p1.sacrifices || [],
        commitmentHours: p1.commitment_hours || 'N/A',
        currentIncome: p1.current_income || '',
        desiredIncome: p1.desired_income || '',
        magicAwayTask: p1.magic_away_task || p2.magic_away_task || '',
        emergencyLog: (p1.emergency_log || '').substring(0, 300),
        cultureWord: p2.culture_word || '',
        decisionMaker: p2.decision_maker || '',
        threeExperts: p2.three_experts_needed || '',
        tenHoursBack: p2.ten_hours_back || '',
        enoughNumber: p2.lb_enough_number || '',
        biggestBlocker: p2.lb_biggest_blocker || '',
        quarterPriority: p2.lb_quarter_priority || '',
        changeSource: (p2.lb_change_source || '').substring(0, 200),
        growthBottleneck: p2.growth_bottleneck || '',
        currentHours: p2.current_working_hours || p1.working_hours || '',
        hasAssessment: !!p1.full_name,
      });
    }

    // BM context (shared company data)
    let bmContext = 'No BM data available.';
    const { data: bmEng } = await supabase.from('bm_engagements').select('id').in('client_id', directorIds).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (bmEng?.id) {
      const { data: bmRpt } = await supabase.from('bm_reports').select('pass1_data, total_annual_opportunity, overall_percentile').eq('engagement_id', bmEng.id).in('status', ['pass1_complete', 'generated', 'approved', 'published', 'delivered']).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (bmRpt?.pass1_data) {
        const p1 = bmRpt.pass1_data as any;
        bmContext = `Revenue: £${p1._enriched_revenue ? (p1._enriched_revenue / 1000000).toFixed(1) + 'M' : 'N/A'}. GM: ${p1.gross_margin || 'N/A'}%. NM: ${p1.net_margin || 'N/A'}%. ${bmRpt.overall_percentile ? `Percentile: ${bmRpt.overall_percentile}th.` : ''} ${bmRpt.total_annual_opportunity ? `Opportunity: £${bmRpt.total_annual_opportunity.toLocaleString()}.` : ''}`;
      }
    }

    // LLM generation
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const prompt = `You are a senior advisor facilitating a family business alignment session. You have assessment data from ${directors.length} directors of the same company. Produce a Director Alignment Map.

## DIRECTOR PROFILES
${directors.map(d => `
### ${d.name}
- North Star: "${d.northStar}"
- Archetype: ${d.archetype}
- Tuesday Test: ${d.tuesdayTest}
- Danger zone: "${d.dangerZone}"
- Business relationship: "${d.relationshipMirror}"
- Commitment hours: ${d.commitmentHours}
- Enough number: £${d.enoughNumber}/month
- Magic away: "${d.magicAwayTask}"
- Biggest blocker: "${d.biggestBlocker}"
- Quarter priority: "${d.quarterPriority}"
- Change source: "${d.changeSource}"
- 10 hours back: "${d.tenHoursBack}"
- Current hours: ${d.currentHours || 'Unknown'}
- Sacrifices: ${Array.isArray(d.sacrifices) ? d.sacrifices.join(', ') : d.sacrifices}
- Growth bottleneck: "${d.growthBottleneck}"
- Culture word: "${d.cultureWord}"
- Decision maker: "${d.decisionMaker}"
`).join('\n')}

## COMPANY FINANCIAL CONTEXT
${bmContext}

## TASK
Produce a JSON alignment map:
{
  "snapshots": [{ "name": "...", "summary": "2-3 sentence core need and state" }],
  "alignmentZone": { "sharedGoals": ["..."], "commonGround": "what they all agree on" },
  "tensionMap": [{ "tension": "specific conflict", "directors": ["name1", "name2"], "impact": "what happens if unresolved", "resolution": "suggested approach" }],
  "blindSpots": ["things NONE of them mentioned that the data reveals"],
  "shared12MonthGoal": { "goal": "one measurable goal all can commit to", "measurable": "how to know it's achieved", "whyThisOne": "why this one matters most" },
  "successionFramework": { "phases": [{ "phase": "name", "timeline": "months", "responsibilities": "what transfers", "from": "who", "to": "who", "risk": "what could go wrong" }] },
  "sprintCoordination": [{ "dependency": "what links their sprints", "blockingRisk": "what happens if one stalls" }],
  "facilitationQuestions": ["specific questions to surface real tensions"]
}
Be direct, specific, data-grounded. Reference their exact words. British English. Return ONLY valid JSON.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://torsor.co.uk', 'X-Title': 'Torsor Director Alignment' },
      body: JSON.stringify({ model: 'anthropic/claude-sonnet-4.5', max_tokens: 6000, temperature: 0.3, messages: [
        { role: 'system', content: 'You are a family business alignment advisor. Produce specific, data-grounded alignment analysis. Return ONLY valid JSON. British English.' },
        { role: 'user', content: prompt }
      ] }),
    });

    if (!response.ok) throw new Error(`LLM error: ${response.status}`);
    const data = await response.json();

    // Cost tracking — silent on failure. Anchored to the primary director
    // so spend is attributed to the lead client of the alignment map.
    try {
      if (practiceId) {
        await recordLlmCost({
          supabase,
          practiceId,
          clientId: primaryDirectorId ?? directorIds?.[0] ?? null,
          operationType: 'director_alignment_generation',
          sourceFunction: 'generate-director-alignment',
          model: 'anthropic/claude-sonnet-4.5',
          inputTokens: data?.usage?.prompt_tokens ?? 0,
          outputTokens: data?.usage?.completion_tokens ?? 0,
          serviceLineCode: '365_method',
          metadata: { directorCount: directorIds?.length ?? 0, primaryDirectorId },
        });
      }
    } catch (_) { /* ignore */ }

    const raw = data.choices?.[0]?.message?.content || '{}';
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const js = cleaned.indexOf('{'); const je = cleaned.lastIndexOf('}');

    let alignmentMap: any;
    try { alignmentMap = JSON.parse(cleaned.substring(js, je + 1)); }
    catch { alignmentMap = { snapshots: directors.map(d => ({ name: d.name, summary: 'Assessment data available — alignment analysis needs manual review.' })), _parseError: true }; }

    alignmentMap.generatedAt = new Date().toISOString();
    alignmentMap._directors = directors.map(d => ({ id: d.id, name: d.name, hasAssessment: d.hasAssessment }));
    alignmentMap._company = directors[0]?.company || 'Unknown';

    const primaryId = primaryDirectorId || directorIds[0];
    const { data: existing } = await supabase.from('roadmap_stages').select('version').eq('client_id', primaryId).eq('stage_type', 'director_alignment').order('version', { ascending: false }).limit(1).maybeSingle();

    const { error: writeError } = await supabase.from('roadmap_stages').insert({
      practice_id: practiceId, client_id: primaryId, stage_type: 'director_alignment',
      version: existing ? existing.version + 1 : 1, status: 'generated',
      generated_content: alignmentMap, generation_completed_at: new Date().toISOString(),
      generation_duration_ms: Date.now() - startTime, model_used: 'anthropic/claude-sonnet-4.5',
    });
    if (writeError) throw writeError;

    console.log(`[DirectorAlignment] Complete in ${Date.now() - startTime}ms for ${directors.length} directors`);
    return new Response(JSON.stringify({ success: true, directors: directors.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[DirectorAlignment] Error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
