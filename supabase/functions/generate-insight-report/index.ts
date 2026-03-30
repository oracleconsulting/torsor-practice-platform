// ============================================================================
// GENERATE INSIGHT REPORT — Quarterly client-facing review
// ============================================================================
// Manually triggered by the practice before a catch-up. Summarises life
// metrics, business progress, surfaces one key insight, previews next sprint.
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
    const sprint = sprintNumber || 1;
    console.log(`[InsightReport] Generating for client: ${clientId}, sprint: ${sprint}`);

    // 1. Client info
    const { data: client } = await supabase.from('practice_members').select('name, client_company').eq('id', clientId).single();

    // 2. Sprint tasks
    const { data: tasks } = await supabase.from('client_tasks').select('title, week_number, status, category, completion_feedback, completed_at').eq('client_id', clientId).eq('sprint_number', sprint).order('week_number');
    const allTasks = tasks || [];
    const completed = allTasks.filter(t => t.status === 'completed');
    const skipped = allTasks.filter(t => t.status === 'skipped');
    const lifeTasks = allTasks.filter(t => ((t.category as string) || '').startsWith('life_'));
    const lifeCompleted = lifeTasks.filter(t => t.status === 'completed');

    // 3. Sprint content (themes, milestones)
    const { data: sprintStage } = await supabase.from('roadmap_stages').select('generated_content, approved_content').eq('client_id', clientId).in('stage_type', ['sprint_plan_part2', 'sprint_plan']).order('version', { ascending: false }).limit(1).maybeSingle();
    const sprintContent = sprintStage?.approved_content || sprintStage?.generated_content;
    const weekThemes = (sprintContent?.weeks || []).map((w: any) => `Week ${w.weekNumber}: ${w.theme}`).join('; ');

    // 4. Value analysis
    const { data: vaStage } = await supabase.from('roadmap_stages').select('generated_content').eq('client_id', clientId).eq('stage_type', 'value_analysis').in('status', ['generated', 'approved']).order('version', { ascending: false }).limit(1).maybeSingle();
    const va = vaStage?.generated_content;

    // 5. Fit profile (North Star)
    const { data: fitStage } = await supabase.from('roadmap_stages').select('generated_content').eq('client_id', clientId).eq('stage_type', 'fit_assessment').in('status', ['generated', 'approved']).order('version', { ascending: false }).limit(1).maybeSingle();
    const fitProfile = fitStage?.generated_content;

    // 6. BM data
    let bmSummary = '';
    const { data: bmEng } = await supabase.from('bm_engagements').select('id').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (bmEng?.id) {
      const { data: bmRpt } = await supabase.from('bm_reports').select('pass1_data, total_annual_opportunity, overall_percentile').eq('engagement_id', bmEng.id).in('status', ['pass1_complete', 'generated', 'approved', 'published', 'delivered']).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (bmRpt?.pass1_data) {
        const p1 = bmRpt.pass1_data as any;
        const pts: string[] = [];
        if (p1._enriched_revenue) pts.push(`Revenue: £${(p1._enriched_revenue / 1000).toFixed(0)}k`);
        if (p1.gross_margin) pts.push(`GM: ${p1.gross_margin}%`);
        if (p1.net_margin) pts.push(`NM: ${p1.net_margin}%`);
        if (p1.debtor_days) pts.push(`Debtor days: ${p1.debtor_days}`);
        if (bmRpt.total_annual_opportunity) pts.push(`Opportunity: £${bmRpt.total_annual_opportunity.toLocaleString()}`);
        bmSummary = pts.join('; ');
      }
    }

    // 7. Life check
    const { data: lifeCheck } = await supabase.from('quarterly_life_checks').select('*').eq('client_id', clientId).eq('sprint_number', sprint).maybeSingle();

    // 8. Advisory brief
    const { data: briefStage } = await supabase.from('roadmap_stages').select('generated_content').eq('client_id', clientId).eq('stage_type', 'advisory_brief').in('status', ['generated', 'approved']).order('version', { ascending: false }).limit(1).maybeSingle();
    const advisoryBrief = briefStage?.generated_content;

    // 9. Feedback highlights
    const feedback = completed.filter(t => (t.completion_feedback as any)?.whatWentWell || (t.completion_feedback as any)?.whatDidntWork).map(t => ({ title: t.title, well: (t.completion_feedback as any)?.whatWentWell, didnt: (t.completion_feedback as any)?.whatDidntWork }));

    // Build LLM prompt
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const prompt = `You are writing a personal quarterly review for a client — warm, specific, data-grounded. This is sent TO the client before a catch-up. One page when printed. Not corporate.

## CLIENT
${client?.name || 'Client'} at ${client?.client_company || 'their business'}
North Star: "${fitProfile?.northStar || 'Freedom and presence'}"

## SPRINT ${sprint} COMPLETION
Tasks: ${completed.length}/${allTasks.length} completed (${allTasks.length > 0 ? Math.round(completed.length / allTasks.length * 100) : 0}%)
Skipped: ${skipped.length} — ${skipped.map(t => t.title).join(', ') || 'none'}
Life tasks: ${lifeCompleted.length}/${lifeTasks.length} completed
Week themes: ${weekThemes || 'N/A'}

## TASK FEEDBACK (client's own words)
${feedback.length > 0 ? feedback.map(f => `"${f.title}": Well: ${f.well || 'N/A'} | Didn't: ${f.didnt || 'N/A'}`).join('\n') : 'No detailed feedback.'}

## LIFE CHECK (if completed)
${lifeCheck ? `Tuesday now: "${lifeCheck.tuesday_test_update || 'N/A'}"
Time reclaimed: "${lifeCheck.time_reclaim_progress || 'N/A'}"
Biggest win: "${lifeCheck.biggest_win || 'N/A'}"
Frustration: "${lifeCheck.biggest_frustration || 'N/A'}"
Goal shift: "${lifeCheck.priority_shift || 'N/A'}"
Wish: "${lifeCheck.next_sprint_wish || 'N/A'}"` : 'Not yet completed.'}

## FINANCIAL CONTEXT
${bmSummary || 'No BM data.'}
${va ? `Value analysis score: ${va.overallScore || 'N/A'}/100, opportunity: £${va.totalOpportunity?.toLocaleString() || 'N/A'}` : ''}

${advisoryBrief?.insight ? `## ADVISORY INSIGHT (for reference)\n${advisoryBrief.insight.headline || ''}: ${advisoryBrief.insight.detail || ''}` : ''}

## TASK
Produce a quarterly insight report as JSON:
{
  "sprintNumber": ${sprint},
  "lifeMetrics": { "summary": "2-3 sentences on life progress using their data", "highlight": "the best life result", "gap": "what didn't happen that should have" },
  "businessMetrics": { "summary": "2-3 sentences on business progress", "taskCompletion": { "total": ${allTasks.length}, "completed": ${completed.length}, "skipped": ${skipped.length}, "rate": "${allTasks.length > 0 ? Math.round(completed.length / allTasks.length * 100) : 0}%" }, "keyWins": ["..."], "systemsBuilt": ["..."] },
  "insight": { "headline": "one data-grounded insight they haven't seen", "detail": "2-3 sentences explaining it", "action": "what to do about it" },
  "question": { "forCatchUp": "one specific question for the catch-up conversation" },
  "nextSprint": { "preview": "1-2 sentences on what Sprint ${sprint + 1} focuses on", "themes": ["..."] }
}
Write as a trusted advisor, not a report. Use their name. Reference specific tasks and numbers. British English. Return ONLY valid JSON.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://torsor.co.uk', 'X-Title': 'Torsor Insight Report' },
      body: JSON.stringify({ model: 'anthropic/claude-sonnet-4.5', max_tokens: 3000, temperature: 0.4, messages: [
        { role: 'system', content: 'You write personal quarterly review notes for clients. Warm, specific, data-grounded. British English. Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ] }),
    });

    if (!response.ok) { const err = await response.text(); throw new Error(`LLM error: ${response.status}`); }
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const js = cleaned.indexOf('{'); const je = cleaned.lastIndexOf('}');

    let report: any;
    try { report = JSON.parse(cleaned.substring(js, je + 1)); }
    catch { report = { sprintNumber: sprint, _parseError: true, lifeMetrics: { summary: 'Report generation needs review.' } }; }

    report.sprintNumber = sprint;
    report.generatedAt = new Date().toISOString();

    const { data: existing } = await supabase.from('roadmap_stages').select('version').eq('client_id', clientId).eq('stage_type', 'insight_report').eq('sprint_number', sprint).order('version', { ascending: false }).limit(1).maybeSingle();
    const nextVersion = existing ? existing.version + 1 : 1;

    const { error: writeError } = await supabase.from('roadmap_stages').insert({
      practice_id: practiceId, client_id: clientId, stage_type: 'insight_report',
      sprint_number: sprint, version: nextVersion, status: 'generated',
      generated_content: report, generation_completed_at: new Date().toISOString(),
      generation_duration_ms: Date.now() - startTime, model_used: 'anthropic/claude-sonnet-4.5',
    });
    if (writeError) throw writeError;

    console.log(`[InsightReport] Complete in ${Date.now() - startTime}ms`);
    return new Response(JSON.stringify({ success: true, sprintNumber: sprint }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[InsightReport] Error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
