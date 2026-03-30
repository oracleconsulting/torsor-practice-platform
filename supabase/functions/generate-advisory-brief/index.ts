// ============================================================================
// GENERATE ADVISORY BRIEF (Practice-Only)
// ============================================================================
// Synthesises GA assessment + BM report + HVA + value analysis into a
// strategic advisory preparation document for the practice partner.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { clientId, practiceId, sprintNumber } = await req.json();
    if (!clientId || !practiceId) throw new Error('clientId and practiceId required');
    console.log(`[AdvisoryBrief] Generating for client: ${clientId}, sprint: ${sprintNumber}`);

    // 1. Client info
    const { data: client } = await supabase.from('practice_members').select('name, email, client_company').eq('id', clientId).single();

    // 2. GA Assessment
    const { data: assessments } = await supabase.from('client_assessments').select('assessment_type, responses').eq('client_id', clientId).in('assessment_type', ['part1', 'part2']);
    const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
    const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};

    // 3. Pipeline stages
    const { data: stages } = await supabase.from('roadmap_stages').select('stage_type, generated_content, approved_content').eq('client_id', clientId).in('status', ['generated', 'approved', 'published']).order('version', { ascending: false });
    const getStage = (type: string) => { const s = stages?.find(s => s.stage_type === type); return s?.approved_content || s?.generated_content; };
    const fitProfile = getStage('fit_assessment');
    const valueAnalysis = getStage('value_analysis');

    // 4. BM Report (via engagement join)
    let bmData: any = null;
    let bmAssessment: any = null;
    const { data: bmEng } = await supabase.from('bm_engagements').select('id').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (bmEng?.id) {
      const { data: bmReport } = await supabase.from('bm_reports').select('pass1_data, overall_percentile, total_annual_opportunity, exit_readiness_breakdown, enhanced_suppressors, value_analysis, historical_financials').eq('engagement_id', bmEng.id).in('status', ['pass1_complete', 'generated', 'approved', 'published', 'delivered']).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      bmData = bmReport;
      const { data: bmResp } = await supabase.from('bm_assessment_responses').select('responses').eq('engagement_id', bmEng.id).maybeSingle();
      bmAssessment = bmResp?.responses;
    }

    const hasBm = !!bmData?.pass1_data;
    const hasExit = !!bmData?.exit_readiness_breakdown;
    const hasSuppressors = Array.isArray(bmData?.enhanced_suppressors) && bmData.enhanced_suppressors.length > 0;

    // 5. Build LLM prompt
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const prompt = `You are a senior strategic advisor at a UK chartered accountancy practice. Prepare an advisory brief for the practice partner ahead of a client catch-up. This is PRACTICE-ONLY — the client never sees it. Be direct, analytical, specific. Include numbers. Flag risks bluntly.

## CLIENT
Name: ${client?.name || 'Unknown'}
Company: ${client?.client_company || part2.trading_name || 'Unknown'}
${part1.current_income ? `Personal income: ${part1.current_income}/month` : ''}
${part1.desired_income ? `Desired: ${part1.desired_income}/month` : ''}
${part2.annual_turnover ? `Turnover band: ${part2.annual_turnover}` : ''}
${part2.team_size ? `Team: ${part2.team_size}` : ''}

## GA ASSESSMENT
North Star: "${fitProfile?.northStar || ''}"
Archetype: ${fitProfile?.archetype || 'Unknown'}
Danger zone: "${part1.danger_zone || ''}"
Business relationship: "${part1.relationship_mirror || ''}"
Commitment: ${part1.commitment_hours || 'N/A'}
Tuesday Test: ${(part1.tuesday_test || '').substring(0, 400)}
Growth bottleneck: "${part2.growth_bottleneck || ''}"
Magic away: "${part1.magic_away_task || ''}"
Customer profitability: "${part2.customer_profitability || ''}"
Three experts: "${part2.three_experts_needed || ''}"
Decision maker: "${part2.decision_maker || ''}"

${hasBm ? `## BM FINANCIAL DATA
Revenue: £${bmData.pass1_data._enriched_revenue?.toLocaleString() || 'N/A'}
Gross margin: ${bmData.pass1_data.gross_margin || 'N/A'}%
Net margin: ${bmData.pass1_data.net_margin || 'N/A'}%
RPE: £${bmData.pass1_data.revenue_per_employee?.toLocaleString() || 'N/A'}
Debtor days: ${bmData.pass1_data.debtor_days || 'N/A'}
Percentile: ${bmData.overall_percentile || 'N/A'}th
Opportunity: £${bmData.total_annual_opportunity?.toLocaleString() || 'N/A'}` : '## NO BM DATA'}

${hasExit ? `## EXIT READINESS
Score: ${bmData.exit_readiness_breakdown.totalScore}/100 (${bmData.exit_readiness_breakdown.levelLabel || ''})
${(bmData.exit_readiness_breakdown.components || []).map((c: any) => `- ${c.name}: ${c.currentScore}/${c.maxScore}`).join('\n')}
Path to 70: ${bmData.exit_readiness_breakdown.pathTo70?.actions?.join('; ') || 'N/A'}` : ''}

${hasSuppressors ? `## VALUE SUPPRESSORS
${bmData.enhanced_suppressors.map((s: any) => `- ${s.name} (${s.severity}): ${s.evidence || ''}`).join('\n')}` : ''}

${bmAssessment ? `## BM ASSESSMENT CONTEXT
Exit timeline: "${bmAssessment.bm_exit_timeline || ''}" "${bmAssessment.bm_exit_timeline_context || ''}"
Blind spot: "${bmAssessment.bm_blind_spot_fear || ''}"
Pricing confidence: "${bmAssessment.bm_pricing_confidence || ''}" "${bmAssessment.bm_pricing_confidence_context || ''}"
Investment plans: "${bmAssessment.bm_investment_plans_context || ''}"` : ''}

## VALUE ANALYSIS
${valueAnalysis ? `Score: ${valueAnalysis.overallScore || 'N/A'}/100 | Opportunity: £${valueAnalysis.totalOpportunity?.toLocaleString() || 'N/A'} | Valuation: £${(valueAnalysis.businessValuation?.currentValue || valueAnalysis.businessValuation?.baselineValue || 0).toLocaleString()} → £${(valueAnalysis.businessValuation?.potentialValue || 0).toLocaleString()} | Risks: ${valueAnalysis.riskRegister?.length || 0}` : 'None'}

## TASK
Produce a JSON advisory brief:
{
  "executiveSummary": "3-4 sentences — the single most important thing about this client now",
  "financialHealth": { "assessment": "...", "keyMetrics": ["metric: value", ...], "concerns": ["..."] },
  "alignmentGap": { "lifeGoal": "...", "businessReality": "...", "specificBottleneck": "...", "pathToClose": "..." },
  "catchUpTalkingPoints": [{ "topic": "...", "dataPoint": "...", "suggestedAction": "..." }],
  "sprintAdvisoryTasks": [{ "title": "...", "description": "...", "category": "financial|systems|team|strategy", "whyItMatters": "...", "suggestedWeek": 0 }],
  "crossServiceOpportunities": [{ "service": "...", "trigger": "...", "timing": "...", "valueAtStake": "..." }],
  "riskRegister": [{ "risk": "...", "severity": "Critical|High|Medium", "trigger": "...", "mitigation": "..." }],
  "renewalPreparation": { "sprint2Themes": ["..."], "questionsToExplore": ["..."], "dataToGather": ["..."] }
}
Return ONLY valid JSON. British English. No markdown.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://torsor.co.uk', 'X-Title': 'Torsor Advisory Brief' },
      body: JSON.stringify({ model: 'anthropic/claude-sonnet-4.5', max_tokens: 6000, temperature: 0.3, messages: [
        { role: 'system', content: 'You are a senior UK chartered accountant preparing a strategic advisory brief. Practice-only. Direct, analytical, data-grounded. Return ONLY valid JSON. British English.' },
        { role: 'user', content: prompt }
      ] }),
    });

    if (!response.ok) { const err = await response.text(); throw new Error(`LLM error: ${response.status} — ${err.substring(0, 200)}`); }
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');

    let advisoryBrief: any;
    try {
      advisoryBrief = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
    } catch {
      console.error('[AdvisoryBrief] JSON parse failed, using fallback');
      advisoryBrief = { executiveSummary: 'Advisory brief generation failed — manual preparation required.', _parseError: true };
    }

    advisoryBrief.generatedAt = new Date().toISOString();
    advisoryBrief._dataSources = { gaAssessment: !!part1.full_name, bmReport: hasBm, financials: hasBm, exitReadiness: hasExit, suppressors: hasSuppressors, bmAssessment: !!bmAssessment };

    // Version handling
    const { data: existing } = await supabase.from('roadmap_stages').select('version').eq('client_id', clientId).eq('stage_type', 'advisory_brief').order('version', { ascending: false }).limit(1).maybeSingle();
    const nextVersion = existing ? existing.version + 1 : 1;

    const { error: writeError } = await supabase.from('roadmap_stages').insert({
      practice_id: practiceId, client_id: clientId, stage_type: 'advisory_brief',
      sprint_number: sprintNumber || 1, version: nextVersion, status: 'generated',
      generated_content: advisoryBrief, generation_completed_at: new Date().toISOString(),
      generation_duration_ms: Date.now() - startTime, model_used: 'anthropic/claude-sonnet-4.5',
    });
    if (writeError) throw writeError;

    console.log(`[AdvisoryBrief] Complete in ${Date.now() - startTime}ms`);
    return new Response(JSON.stringify({ success: true, sprintNumber }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[AdvisoryBrief] Error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
