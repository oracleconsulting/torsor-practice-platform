// ============================================================================
// GENERATE SPRINT PLAN PART 1 (Weeks 1-6)
// ============================================================================
// Purpose: Create a transformation journey, not a task list
// Weeks 1-2: Immediate Relief - prove they're not trapped
// Weeks 3-4: Foundation - build the base
// Weeks 5-6: Implementation - execute changes
// 
// Philosophy: Every task serves their North Star, not just business metrics
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GA_SYSTEM_PROMPT } from '../_shared/ga-system-prompt.ts';
import { validateGAContent } from '../_shared/ga-content-validator.ts';
import { buildResearchContext } from '../_shared/ga-research-base.ts';

// Inlined context enrichment (avoids "Module not found" when Dashboard deploys only index.ts).
// Canonical: supabase/functions/_shared/context-enrichment.ts
async function enrichRoadmapContext(supabase: SupabaseClient, clientId: string): Promise<{ promptContext: string; hasEnrichment?: boolean; sources?: { financial: boolean; systems: boolean; market: boolean; valueAnalysis: boolean; discovery: boolean } }> {
  const log = (msg: string) => console.log(`[ContextEnrichment] ${msg}`);
  log(`Enriching context for client ${clientId}`);
  interface Fin { source: string; summary: string }
  interface Sys { source: string; stage: string; systemsCount: number; integrationScore: number | null; automationScore: number | null; painPoints: string[]; findings: Array<{ title: string; severity: string; category: string }>; manualHoursMonthly: number | null; summary: string }
  interface Mkt { source: string; summary: string }
  interface VA { source: string; summary: string }
  interface Disc { responses: Record<string, unknown>; serviceScores: Record<string, number>; summary: string }

  let bmEngId: string | null = null;
  try { const { data: eng } = await supabase.from('bm_engagements').select('id').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle(); bmEngId = eng?.id || null; } catch (_) {}

  const [financial, systems, market, valueAnalysis, discovery] = await Promise.all([
    (async (): Promise<Fin | null> => {
      try {
        const { data: d } = await supabase.from('client_financial_data').select('*').eq('client_id', clientId).order('period_end', { ascending: false }).limit(1).maybeSingle();
        if (d) { const rev = d.revenue ?? d.turnover; const s = rev ? `Revenue: £${(Number(rev) / 1000).toFixed(0)}k` : ''; const g = d.gross_margin != null ? `; Gross margin: ${(Number(d.gross_margin) * 100).toFixed(1)}%` : ''; return { source: 'uploaded_accounts', summary: (s + g || 'Uploaded accounts data.') + '.' }; }
        if (bmEngId) {
          const { data: bmRpt } = await supabase.from('bm_reports').select('pass1_data, total_annual_opportunity, overall_percentile, historical_financials').eq('engagement_id', bmEngId).in('status', ['pass1_complete', 'generated', 'approved', 'published', 'delivered']).order('updated_at', { ascending: false }).limit(1).maybeSingle();
          if (bmRpt?.pass1_data) { const p1 = bmRpt.pass1_data as Record<string, any>; const rev = p1._enriched_revenue; const gm = p1.gross_margin; const nm = p1.net_margin; const pts: string[] = []; if (rev) pts.push(`Revenue: £${(rev / 1000).toFixed(0)}k`); if (gm) pts.push(`Gross margin: ${typeof gm === 'number' && gm < 1 ? (gm * 100).toFixed(1) : gm}%`); if (nm) pts.push(`Net margin: ${typeof nm === 'number' && nm < 1 ? (nm * 100).toFixed(1) : nm}%`); if (bmRpt.total_annual_opportunity) pts.push(`Opportunity: £${bmRpt.total_annual_opportunity.toLocaleString()}`); if (pts.length) return { source: 'bm_report', summary: pts.join('; ') + '.' }; }
          const { data: bmResp } = await supabase.from('bm_assessment_responses').select('responses').eq('engagement_id', bmEngId).limit(1).maybeSingle();
          if (bmResp?.responses) { const r = bmResp.responses as Record<string, any>; if (r.bm_revenue) return { source: 'bm_assessment', summary: `Revenue: £${(Number(r.bm_revenue) / 1000).toFixed(0)}k.` }; return { source: 'bm_assessment', summary: 'BM assessment data available.' }; }
        }
        const { data: bi } = await supabase.from('service_line_assessments').select('responses').eq('client_id', clientId).in('service_line_code', ['business_intelligence', 'management_accounts']).order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (bi?.responses) return { source: 'bi_assessment', summary: 'Financial data from BI assessment.' };
        return null;
      } catch (e) { console.warn('[ContextEnrichment] Financial failed', e); return null; }
    })(),
    (async (): Promise<Sys | null> => {
      try {
        const { data: eng } = await supabase.from('sa_engagements').select('id, status').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (!eng || eng.status === 'pending') return null;
        const out: Sys = { source: 'sa_engagement', stage: eng.status, systemsCount: 0, integrationScore: null, automationScore: null, painPoints: [], findings: [], manualHoursMonthly: null, summary: '' };
        const { count } = await supabase.from('sa_system_inventory').select('id', { count: 'exact', head: true }).eq('engagement_id', eng.id);
        out.systemsCount = count ?? 0;
        const { data: rep } = await supabase.from('sa_audit_reports').select('integration_score, automation_score').eq('engagement_id', eng.id).maybeSingle();
        if (rep) { out.integrationScore = rep.integration_score; out.automationScore = rep.automation_score; }
        out.summary = `Systems audit: ${out.stage}; ${out.systemsCount} systems.`;
        return out;
      } catch (e) { console.warn('[ContextEnrichment] Systems failed', e); return null; }
    })(),
    (async (): Promise<Mkt | null> => {
      try {
        if (!bmEngId) return null;
        const { data: r } = await supabase.from('bm_reports').select('pass1_data, overall_percentile, total_annual_opportunity, top_strengths, top_gaps').eq('engagement_id', bmEngId).in('status', ['pass1_complete', 'generated', 'approved', 'published', 'delivered']).order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (!r?.pass1_data) return null;
        const d = r.pass1_data as Record<string, any>;
        const metricsArr = (d.metricsComparison || []) as any[];
        const below: string[] = []; const above: string[] = [];
        for (const m of metricsArr) { if (typeof m.percentile === 'number') { if (m.percentile < 50) below.push(m.metricName || m.metricCode); else above.push(m.metricName || m.metricCode); } }
        const opps = ((d.opportunitySizing as any)?.breakdown || []).slice(0, 5).map((o: any) => `${o.metric || o.title || ''}: £${o.annualImpact?.toLocaleString() || 'N/A'}`);
        return { source: 'bm_report', summary: `Overall ${r.overall_percentile || 'N/A'}th pctile; below median: ${below.join(', ') || 'none'}; opportunity: £${(r.total_annual_opportunity || 0).toLocaleString()}. ${opps.length ? 'Gaps: ' + opps.join('; ') : ''}` };
      } catch (e) { console.warn('[ContextEnrichment] Market failed', e); return null; }
    })(),
    (async (): Promise<VA | null> => {
      try {
        if (!bmEngId) return null;
        const { data: bm } = await supabase.from('bm_reports').select('value_analysis, exit_readiness_breakdown, enhanced_suppressors').eq('engagement_id', bmEngId).not('value_analysis', 'is', null).order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (!bm?.value_analysis) return null;
        const va = bm.value_analysis as any;
        const exitScore = bm.exit_readiness_breakdown?.totalScore || va.exitReadinessScore?.overall || va.exitReadiness?.score || 'N/A';
        const suppressorCount = (bm.enhanced_suppressors || []).length;
        return { source: 'bm_report', summary: `Exit readiness: ${exitScore}/100; value suppressors: ${suppressorCount}.` };
      } catch (e) { console.warn('[ContextEnrichment] Value analysis failed', e); return null; }
    })(),
    (async (): Promise<Disc | null> => {
      try {
        const { data: eng } = await supabase.from('discovery_engagements').select('responses, service_scores').eq('client_id', clientId).in('status', ['completed', 'report_generated', 'report_delivered']).order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (!eng?.responses) return null;
        return { responses: eng.responses, serviceScores: (eng.service_scores as Record<string, number>) || {}, summary: `Discovery: ${JSON.stringify(eng.service_scores || {})}` };
      } catch (e) { console.warn('[ContextEnrichment] Discovery failed', e); return null; }
    })()
  ]);
  const parts: string[] = [];
  if (financial) parts.push(`## Financial (${financial.source})\n${financial.summary}`);
  if (systems) parts.push(`## Systems & Operations (${systems.stage})\n${systems.summary}`);
  if (market) parts.push(`## Market & Competitive\n${market.summary}`);
  if (valueAnalysis) parts.push(`## Value Analysis\n${valueAnalysis.summary}`);
  if (discovery) parts.push(`## Discovery\n${discovery.summary}`);
  const promptContext = parts.length > 0 ? `\n\n# ENRICHMENT DATA FROM OTHER SERVICE LINES\nUse as authoritative context.\n\n${parts.join('\n\n')}` : '';
  log(`Complete. financial=${!!financial}, systems=${!!systems}, market=${!!market}, valueAnalysis=${!!valueAnalysis}, discovery=${!!discovery}`);
  return {
    promptContext,
    hasEnrichment: parts.length > 0,
    sources: {
      financial: !!financial,
      systems: !!systems,
      market: !!market,
      valueAnalysis: !!valueAnalysis,
      discovery: !!discovery,
    },
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { clientId, practiceId, sprintNumber: bodySprintNumber } = await req.json();
    const sprintNumber = bodySprintNumber ?? 1;

    if (!clientId || !practiceId) {
      throw new Error('clientId and practiceId required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    async function fetchStage(stageType: string, sn: number) {
      let q = supabase
        .from('roadmap_stages')
        .select('generated_content, approved_content')
        .eq('client_id', clientId)
        .eq('stage_type', stageType)
        .order('version', { ascending: false })
        .limit(1);
      if (sn != null) q = q.eq('sprint_number', sn);
      const { data } = await q.maybeSingle();
      return data?.approved_content || data?.generated_content;
    }

    // Check for existing stage (same sprint)
    const { data: existingStages } = await supabase
      .from('roadmap_stages')
      .select('version')
      .eq('client_id', clientId)
      .eq('stage_type', 'sprint_plan_part1')
      .eq('sprint_number', sprintNumber)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version + 1 
      : 1;

    console.log(`Creating sprint_plan_part1 stage with version ${nextVersion}, sprint ${sprintNumber}`);

    const { data: stage, error: stageError } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: 'sprint_plan_part1',
        sprint_number: sprintNumber,
        version: nextVersion,
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        model_used: 'anthropic/claude-sonnet-4.5'
      })
      .select()
      .single();

    if (stageError) throw stageError;

    // Fetch dependencies: renewal uses vision_update, shift_update, life_design_refresh
    const fitProfile = sprintNumber > 1
      ? (await fetchStage('life_design_refresh', sprintNumber)) || {}
      : (await fetchStage('fit_assessment', 1)) || {};
    const vision = sprintNumber > 1
      ? await fetchStage('vision_update', sprintNumber)
      : await fetchStage('five_year_vision', 1);
    const shift = sprintNumber > 1
      ? await fetchStage('shift_update', sprintNumber)
      : await fetchStage('six_month_shift', 1);
    const lifeDesignProfile = await fetchStage('life_design_profile', 1);

    if (!vision || !shift) {
      throw new Error('Vision or shift not found - cannot generate sprint');
    }

    // Fetch assessment data
    const { data: assessments } = await supabase
      .from('client_assessments')
      .select('assessment_type, responses')
      .eq('client_id', clientId)
      .in('assessment_type', ['part1', 'part2']);

    const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
    const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};
    const enoughNumber = part2?.lb_enough_number ?? null;
    const quarterlyLifePriority = part2?.lb_quarter_priority ?? null;
    const biggestLifeBlocker = part2?.lb_biggest_blocker ?? null;
    const monthOffVision = part2?.lb_month_off ?? null;
    const externalPerspective = part2?.lb_external_perspective ?? null;

    const { data: client } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();

    const context = buildSprintContext(part1, part2, client, fitProfile, vision, shift, lifeDesignProfile, enoughNumber, quarterlyLifePriority, biggestLifeBlocker, monthOffVision, externalPerspective);

    let enrichedContext: Awaited<ReturnType<typeof enrichRoadmapContext>> | null = null;
    try {
      enrichedContext = await enrichRoadmapContext(supabase, clientId);
      if (enrichedContext?.hasEnrichment) console.log('[generate-sprint-plan-part1] Cross-service enrichment available');
    } catch (err) {
      console.warn('[generate-sprint-plan-part1] Enrichment not available:', err);
    }

    let advisorNotesBlock = '';
    if (sprintNumber > 1) {
      try {
        const { data: sl } = await supabase.from('service_lines').select('id').eq('code', '365_method').maybeSingle();
        if (sl?.id) {
          const { data: enrollment } = await supabase
            .from('client_service_lines')
            .select('advisor_notes')
            .eq('client_id', clientId)
            .eq('service_line_id', sl.id)
            .maybeSingle();
          if (enrollment?.advisor_notes?.trim()) {
            advisorNotesBlock = `\n\n# ADVISOR NOTES\nThe following notes are from the client's advisor. Treat as high-priority context when designing tasks:\n\n${enrollment.advisor_notes.trim()}`;
            console.log('[generate-sprint-plan-part1] Advisor notes included');
          }
        }
      } catch (err) {
        console.warn('[generate-sprint-plan-part1] Failed to fetch advisor notes:', err);
      }
    }

    let lifeAlignmentBlock = '';
    if (sprintNumber > 1) {
      try {
        const { data: lifeScores } = await supabase
          .from('life_alignment_scores')
          .select('*')
          .eq('client_id', clientId)
          .eq('sprint_number', sprintNumber - 1)
          .order('week_number', { ascending: false })
          .limit(12);

        if (lifeScores?.length) {
          const avgScore = lifeScores.reduce((s, r) => s + Number(r.overall_score), 0) / lifeScores.length;
          const lastScore = lifeScores[0];
          const catScores = (lastScore.category_scores || {}) as Record<string, number>;
          const lowCategories = Object.entries(catScores)
            .filter(([, v]) => (v as number) < 50)
            .map(([k]) => k);
          const highCategories = Object.entries(catScores)
            .filter(([, v]) => (v as number) >= 70)
            .map(([k]) => k);

          lifeAlignmentBlock = `\n\n# LIFE ALIGNMENT CONTEXT (from Sprint ${sprintNumber - 1})
Average life alignment score: ${avgScore.toFixed(0)}/100 (${avgScore >= 70 ? 'strong' : avgScore >= 40 ? 'moderate' : 'needs attention'})
Trend: ${lastScore.trend}
${lowCategories.length ? `LOW-scoring categories (need MORE life tasks): ${lowCategories.join(', ')}` : 'All categories adequately covered.'}
${highCategories.length ? `HIGH-scoring categories (maintain): ${highCategories.join(', ')}` : ''}
Action: Increase life tasks in low-scoring categories. Maintain high-scoring ones with lighter touch.`;
          console.log('[generate-sprint-plan-part1] Life alignment context included');
        }
      } catch (err) {
        console.warn('[generate-sprint-plan-part1] Failed to fetch life alignment:', err);
      }
    }

    const { data: assessmentMeta } = await supabase.from('client_assessments').select('metadata').eq('client_id', clientId).eq('assessment_type', 'part2').maybeSingle();
    if (assessmentMeta?.metadata?.adaptive) {
      const skipped = assessmentMeta.metadata.skippedSections || [];
      console.log('[generate-sprint-plan-part1] Adaptive assessment — skipped sections:', skipped.map((s: any) => s.sectionId).join(', '));
      const skippedNames = skipped.map((s: any) => s.sectionId).join(', ');
      if (skippedNames) {
        advisorNotesBlock += `\n\nNote: Client used adaptive assessment and skipped Part 2 sections: ${skippedNames}. For these areas, rely on the cross-service enrichment data provided above (BM/SA/financial data) rather than Part 2 responses.`;
      }
    }

    // Sprint carry-forward (Sprint 2+)
    let sprintCarryForward = '';
    if (sprintNumber > 1) {
      const prevSprintNum = sprintNumber - 1;
      const refreshStage = await fetchStage('life_design_refresh', sprintNumber);
      const sprintCtx = refreshStage?._sprintContext;
      const lc = sprintCtx?.lifeCheck;
      const ts = sprintCtx?.taskSummary;
      const prevSprintContent = await fetchStage('sprint_plan_part2', prevSprintNum);
      const prevThemes = (prevSprintContent?.weeks || []).map((w: any) => `Week ${w.weekNumber}: ${w.theme}`).join(', ');
      if (ts || lc) {
        sprintCarryForward = `\n\n## SPRINT ${prevSprintNum} OUTCOMES (Build on these — don't repeat them)\n\n### Task Completion\n- ${ts?.completed || 0}/${ts?.total || 0} tasks completed (${ts?.completionRate || 0}%)\n- Life tasks: ${ts?.lifeTasksCompleted || 0}/${ts?.lifeTasksTotal || 0}\n${ts?.skippedTitles?.length ? `- Skipped: ${ts.skippedTitles.join(', ')}` : ''}\n\n### Client's Own Words (quarterly life check)\n${lc ? `- Tuesday now: "${lc.tuesday_test_update || 'N/A'}"\n- Time reclaimed: "${lc.time_reclaim_progress || 'N/A'}"\n- Biggest win: "${lc.biggest_win || 'N/A'}"\n- Still frustrating: "${lc.biggest_frustration || 'N/A'}"\n- Goal shift: "${lc.priority_shift || 'N/A'}"\n- Wish: "${lc.next_sprint_wish || 'N/A'}"` : 'No life check.'}\n\n### Previous Sprint Themes (don't repeat — evolve)\n${prevThemes || 'N/A'}\n\n### SPRINT ${sprintNumber} RULES\n1. DO NOT repeat Sprint ${prevSprintNum} tasks.\n2. Skipped tasks may return in different form or be dropped.\n3. Client's frustration → priority. Client's wish → theme in weeks 1-3.\n4. Life tasks evolve (if writing was established, deepen it).\n5. Reference Sprint ${prevSprintNum} achievements: "Last sprint you proved X. This sprint we make it permanent."`;
        console.log(`[Sprint1] Carry-forward context: ${sprintCarryForward.length} chars`);
      }
    }

    // Fetch BM report summary for cross-service context
    let bmSummaryBlock = '';
    try {
      const { data: bmEng2 } = await supabase.from('bm_engagements').select('id').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      let bmRpt: any = null;
      if (bmEng2?.id) { const { data: rpt } = await supabase.from('bm_reports').select('pass1_data, value_analysis, total_annual_opportunity, overall_percentile, enhanced_suppressors, exit_readiness_breakdown, top_strengths, top_gaps').eq('engagement_id', bmEng2.id).in('status', ['pass1_complete', 'generated', 'approved', 'published', 'delivered']).order('updated_at', { ascending: false }).limit(1).maybeSingle(); bmRpt = rpt; }
      if (bmRpt?.pass1_data) { bmSummaryBlock = buildBmSummaryBlock(bmRpt); console.log(`[Sprint1] BM summary block: ${bmSummaryBlock.length} chars`); }
    } catch (e) { console.warn('[Sprint1] BM fetch failed:', e); }

    console.log(`Generating weeks 1-6 for ${context.userName}...`);

    const sprintPart1 = await generateSprintPart1(context, (enrichedContext?.promptContext || '') + advisorNotesBlock + lifeAlignmentBlock + sprintCarryForward + (bmSummaryBlock ? '\n\n' + bmSummaryBlock : ''));

    // Guarantee all 6 weeks exist — fill any gaps the LLM missed
    if (Array.isArray(sprintPart1?.weeks)) {
      const existingNums = new Set(sprintPart1.weeks.map((w: any) => w.weekNumber));
      for (let wn = 1; wn <= 6; wn++) {
        if (!existingNums.has(wn)) {
          console.warn(`[SprintPart1] Week ${wn} missing — generating fallback`);
          const phase = wn <= 2 ? 'Immediate Relief' : wn <= 4 ? 'Foundation' : 'Implementation';
          const adj = sprintPart1.weeks.find((w: any) => w.weekNumber === wn - 1 || w.weekNumber === wn + 1);
          sprintPart1.weeks.push({
            weekNumber: wn, phase,
            theme: wn <= 2 ? 'Quick Wins' : wn <= 4 ? 'Building Systems' : wn === 5 ? 'Go Live with Changes' : 'Prove the New Rhythm Works',
            narrative: `Week ${wn} builds on what you've established. ${wn === 6 ? 'This is the week where you prove the new rhythm can hold without you watching it constantly.' : 'The foundations are taking shape — this week tests whether they hold.'}`,
            tasks: [
              { id: `w${wn}_t1`, title: adj ? `Refine the systems from Week ${wn > 1 ? wn - 1 : wn + 1}` : 'Review and refine what you\'ve built', description: 'Look at what\'s working and what needs adjusting.', whyThisMatters: 'Systems need iteration.', category: 'systems', timeEstimate: '1 hour', deliverable: 'Updated system with one improvement', celebrationMoment: 'You improved without starting over.' },
              { id: `w${wn}_t2`, title: 'Document what you\'ve learned', description: 'Write down three things that surprised you. What worked? What failed?', whyThisMatters: 'Progress is invisible without reflection.', category: 'strategy', timeEstimate: '30 mins', deliverable: 'Reflection notes', celebrationMoment: 'You can see your own progress.' }
            ],
            weekMilestone: `By end of Week ${wn}: ${wn === 6 ? 'The new rhythm holds on its own' : 'Systems running with less attention'}`,
            tuesdayCheckIn: wn === 6 ? 'Do I feel like I\'m holding things together, or are they holding themselves?' : 'Is this getting easier?'
          });
        }
      }
      sprintPart1.weeks.sort((a: any, b: any) => a.weekNumber - b.weekNumber);
    }

    // Enforce Life Design Thread — every week must have at least one life task
    if (Array.isArray(sprintPart1?.weeks)) {
      const lifeCtx: LifeTaskSource = {
        tuesdayTest: context.tuesdayTest || context.relationshipMirror || '',
        sacrifices: context.sacrifices || [],
        northStar: context.northStar || '',
        quarterlyLifePriority: context.quarterlyLifePriority || context.lbQuarterPriority || '',
        magicAwayTask: context.magicAwayTask || '',
        targetWorkingHours: String(context.targetWorkingHours || context.commitmentHours || ''),
        lifeCommitments: context.lifeCommitments || []
      };
      sprintPart1.weeks = enforceLifeDesignThread(sprintPart1.weeks, lifeCtx, { min: 1, max: 6 });
    }

    // Enforce task field completeness
    if (Array.isArray(sprintPart1?.weeks)) {
      const taskCtx: TaskEnforcementContext = {
        northStar: context.northStar || '', shiftMilestones: context.shiftMilestones || [],
        tuesdayTest: context.tuesdayTest || '', magicAwayTask: context.magicAwayTask || '',
        dangerZone: context.dangerZone || '', commitmentHours: context.commitmentHours || ''
      };
      sprintPart1.weeks = enforceTaskFields(sprintPart1.weeks, taskCtx);
    }

    // Normalise field names so both admin and client portal find them
    if (Array.isArray(sprintPart1?.weeks)) {
      sprintPart1.weeks = normaliseFieldNames(sprintPart1.weeks);
    }

    const duration = Date.now() - startTime;

    try {
      await supabase
        .from('roadmap_stages')
        .update({
          status: 'generated',
          generated_content: sprintPart1,
          generation_completed_at: new Date().toISOString(),
          generation_duration_ms: duration,
          metadata: {
            ...((stage as any)?.metadata || {}),
            enrichmentSources: enrichedContext?.sources ?? null,
          },
        })
        .eq('id', stage.id);
    } catch (metaErr) {
      console.warn('[generate-sprint-plan-part1] Metadata save failed (non-blocking):', metaErr);
      await supabase
        .from('roadmap_stages')
        .update({
          status: 'generated',
          generated_content: sprintPart1,
          generation_completed_at: new Date().toISOString(),
          generation_duration_ms: duration,
        })
        .eq('id', stage.id);
    }

    console.log(`Sprint plan part 1 (weeks 1-6) generated for client ${clientId} in ${duration}ms`);

    return new Response(JSON.stringify({ success: true, stageId: stage.id, duration }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sprint part 1 generation error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildSprintContext(part1: any, part2: any, client: any, fitProfile: any, vision: any, shift: any, lifeDesignProfile: any = null, enoughNumber: number | null = null, quarterlyLifePriority: string | null = null, biggestLifeBlocker: string | null = null, monthOffVision: string | null = null, externalPerspective: string | null = null) {
  return {
    userName: client?.name?.split(' ')[0] || part1.full_name?.split(' ')[0] || 'there',
    companyName: client?.client_company || part2.trading_name || part1.company_name || 'your business',
    northStar: fitProfile.northStar || vision.northStar || '',
    archetype: fitProfile.archetype || 'balanced_achiever',
    year1Milestone: vision.yearMilestones?.year1 || {},
    tuesdayTest: part1.tuesday_test || vision.visualisation || '',
    shiftMilestones: shift.keyMilestones || [],
    shiftStatement: shift.shiftStatement || '',
    tuesdayEvolution: shift.tuesdayEvolution || {},
    quickWins: shift.quickWins || [],
    mondayFrustration: part2.monday_frustration || part1.monday_frustration || '',
    magicAwayTask: part1.magic_away_task || '',
    emergencyLog: part1.emergency_log || '',
    growthBottleneck: part2.growth_bottleneck || part1.growth_bottleneck || '',
    dangerZone: part1.danger_zone || '',
    relationshipMirror: part1.relationship_mirror || '',
    ninetyDayPriorities: part2.ninety_day_priorities || part1.ninety_day_priorities || [],
    commitmentHours: part1.commitment_hours || '10-15 hours',
    teamSize: part2.team_size || part2.staff_count || 'small team',
    toolsUsed: part2.tools_used || part2.current_tools || [],
    lifeDesignProfile,
    lifeCommitments: lifeDesignProfile?.lifeCommitments || [],
    enoughNumber,
    quarterlyLifePriority,
    biggestLifeBlocker,
    monthOffVision,
    externalPerspective,
    targetWeeklyHours: lifeDesignProfile?.targetWeeklyHours ?? part2?.target_working_hours ?? 35,
  };
}

async function generateSprintPart1(ctx: any, enrichmentBlock = ''): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  const prompt = buildSprintPrompt(ctx) + enrichmentBlock;

  console.log('Making OpenRouter API request for sprint part 1...');
  console.log(`Prompt length: ${prompt.length} characters`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('OpenRouter request timed out after 50 seconds');
    controller.abort();
  }, 50000);

  let data: any;
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor 365 Sprint Part 1'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        max_tokens: 8000,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: GA_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt + buildResearchContext(['habit_formation', 'accountability', 'time_blocking', 'delegation', 'failure_tolerance']),
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`OpenRouter response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM error: ${response.status} - ${error}`);
    }

    data = await response.json();
    console.log(`OpenRouter response received, content length: ${data.choices?.[0]?.message?.content?.length || 0} chars`);
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    if (fetchError.name === 'AbortError') {
      throw new Error('OpenRouter request timed out after 50 seconds');
    }
    throw fetchError;
  }

  const content = data.choices[0].message.content;
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error('Failed to parse sprint JSON');
  }
  
  let jsonString = cleaned.substring(start, end + 1);
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (parseError) {
    console.warn('Initial JSON parse failed, attempting advanced repair...');
    parsed = repairComplexJson(jsonString);
  }
  injectLifeTasksIfMissing(parsed, ctx?.lifeDesignProfile);

  // Tone validation: log violations and auto-fix em dashes before persisting
  const validation = validateGAContent(JSON.stringify(parsed));
  if (!validation.passed) {
    console.warn('[GA Validator] generate-sprint-plan-part1 content violations:', validation.violations);
    try {
      const refixed = JSON.parse(validation.autoFixed);
      if (JSON.stringify(refixed) !== JSON.stringify(parsed)) {
        parsed = refixed;
        console.log('[GA Validator] Auto-fixed em dashes in sprint plan part 1');
      }
    } catch (fixErr) {
      console.warn('[GA Validator] auto-fix re-parse failed, keeping original:', fixErr);
    }
  }

  return parsed;
}

function injectLifeTasksIfMissing(generated: any, lifeDesignProfile: any) {
  if (!lifeDesignProfile?.lifeCommitments?.length || !Array.isArray(generated.weeks)) return;
  for (const week of generated.weeks) {
    const tasks = week.tasks || [];
    const hasLifeTask = tasks.some((t: any) => t.category?.startsWith?.('life_'));
    if (hasLifeTask) continue;
    const recurring = lifeDesignProfile.lifeCommitments.find((c: any) => c.frequency === 'weekly' || c.frequency === 'daily');
    if (!recurring) continue;
    const wNum = week.weekNumber ?? 0;
    week.tasks = week.tasks || [];
    week.tasks.push({
      id: `w${wNum}_life`,
      title: recurring.commitment,
      description: `This is your life commitment, not a business task. ${recurring.measurable || ''}`,
      category: `life_${recurring.category}`,
      whyThisMatters: "You said this matters. The business should make space for it, not the other way round.",
      timeEstimate: '1 hour',
      deliverable: recurring.measurable || 'Block the time and protect it.',
      celebrationMoment: 'Done. Keep going next week.'
    });
    console.warn(`[Sprint] Week ${wNum} missing life task — injected from commitments`);
  }
}

/**
 * Advanced JSON repair for complex LLM output
 * Handles: unescaped quotes, missing commas, control chars, truncated output
 */
function repairComplexJson(input: string): any {
  let json = input;
  
  // Step 1: Remove control characters except newlines/tabs
  json = json.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Step 2: Fix strings with unescaped internal quotes
  // This is the most common issue - quotes inside narrative text
  json = fixUnescapedQuotes(json);
  
  // Step 3: Fix trailing commas
  json = json.replace(/,(\s*[}\]])/g, '$1');
  
  // Step 4: Fix missing commas between elements
  // Between objects: }{ -> },{
  json = json.replace(/\}(\s*)\{/g, '},\n{');
  // Between array items: ][ -> ],[
  json = json.replace(/\](\s*)\[/g, '],\n[');
  // Between string and object: "text"{ -> "text",{
  json = json.replace(/"(\s*)\{/g, '",{');
  // Between object and string: }" -> },"
  json = json.replace(/\}(\s*)"/g, '},\n"');
  // Between strings in object context: "value" "key" -> "value", "key"
  json = json.replace(/"(\s+)"([a-zA-Z_])/g, '",\n"$2');
  
  // Step 5: Close unclosed structures intelligently
  json = closeUnclosedStructures(json);
  
  // Step 6: Try to parse
  try {
    const result = JSON.parse(json);
    console.log('Advanced JSON repair successful');
    return result;
  } catch (e1) {
    console.warn('First repair attempt failed, trying extraction method...');
    
    // Step 7: Try to extract valid portions
    return extractAndRebuild(input);
  }
}

/**
 * Fix unescaped quotes within JSON string values
 */
function fixUnescapedQuotes(json: string): string {
  const result: string[] = [];
  let inString = false;
  let i = 0;
  
  while (i < json.length) {
    const char = json[i];
    const prevChar = i > 0 ? json[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      if (!inString) {
        // Starting a string
        inString = true;
        result.push(char);
      } else {
        // Could be end of string or unescaped quote
        // Look ahead to determine context
        const lookAhead = json.substring(i + 1, i + 20).trim();
        
        // If followed by :, ,, }, ], or end - it's a real string terminator
        if (/^[\s]*[:,\}\]\n]/.test(lookAhead) || lookAhead === '') {
          inString = false;
          result.push(char);
        } else {
          // It's an unescaped quote inside the string - escape it
          result.push('\\"');
        }
      }
    } else if (char === '\n' && inString) {
      // Replace newlines in strings with escaped newlines
      result.push('\\n');
    } else {
      result.push(char);
    }
    i++;
  }
  
  return result.join('');
}

/**
 * Intelligently close unclosed JSON structures
 */
function closeUnclosedStructures(json: string): string {
  const stack: string[] = [];
  let inString = false;
  
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    const prevChar = i > 0 ? json[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    } else if (!inString) {
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }
  
  // Close any unclosed structures
  if (stack.length > 0) {
    console.log(`Closing ${stack.length} unclosed structures`);
    // Remove any trailing partial content before closing
    json = json.replace(/,\s*$/, '');
    json = json.replace(/"[^"]*$/, '""');  // Close partial string
    json += stack.reverse().join('');
  }
  
  return json;
}

/**
 * Extract valid JSON objects and rebuild the structure
 */
function extractAndRebuild(input: string): any {
  console.log('Attempting structured extraction...');
  
  // Try to extract key sections
  const extracted: any = {
    sprintTheme: extractStringValue(input, 'sprintTheme') || 'Sprint 1: Building Your Foundation',
    sprintPromise: extractStringValue(input, 'sprintPromise') || 'Transform from overwhelmed to in control',
    sprintGoals: extractArrayValue(input, 'sprintGoals') || ['Address immediate pain', 'Build systems', 'Create momentum'],
    phases: extractPhasesObject(input),
    weeks: extractWeeksArray(input),
    tuesdayEvolution: extractTuesdayEvolution(input)
  };
  
  console.log(`Extracted: ${extracted.weeks.length} weeks, theme: "${extracted.sprintTheme.substring(0, 50)}..."`);
  
  if (extracted.weeks.length === 0) {
    console.warn('Could not extract any weeks, using minimal structure');
    extracted.weeks = generateMinimalWeeks();
    extracted._note = 'Weeks regenerated due to parsing issues';
  }
  
  return extracted;
}

function extractStringValue(input: string, key: string): string | null {
  const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*(?:\\\\"[^"]*)*)"`, 's');
  const match = input.match(regex);
  return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, ' ') : null;
}

function extractArrayValue(input: string, key: string): string[] | null {
  const regex = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]+)\\]`);
  const match = input.match(regex);
  if (!match) return null;
  
  const items = match[1].match(/"([^"]+)"/g);
  return items ? items.map(s => s.replace(/"/g, '')) : null;
}

function extractPhasesObject(input: string): any {
  // Try to extract phases or return default
  try {
    const phasesMatch = input.match(/"phases"\s*:\s*(\{[^}]*\{[^}]*\}[^}]*\{[^}]*\}[^}]*\{[^}]*\}[^}]*\})/s);
    if (phasesMatch) {
      return JSON.parse(phasesMatch[1]);
    }
  } catch (e) {
    // Fall through to default
  }
  
  return {
    immediateRelief: { weeks: [1, 2], theme: "Quick wins and breathing room", emotionalGoal: "From overwhelmed to hopeful" },
    foundation: { weeks: [3, 4], theme: "Building the base", emotionalGoal: "From reactive to proactive" },
    implementation: { weeks: [5, 6], theme: "Executing changes", emotionalGoal: "From planning to doing" }
  };
}

function extractWeeksArray(input: string): any[] {
  // PASS 1: Try full JSON parse (handles 90%+ of cases)
  try {
    const jsonStart = input.indexOf('{');
    const jsonEnd = input.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonStr = input.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonStr);

      const weeks = parsed.weeks || parsed.sprint?.weeks || [];
      if (Array.isArray(weeks) && weeks.length > 0) {
        const validated = weeks
          .filter((w: any) => w.weekNumber && w.weekNumber >= 1 && w.weekNumber <= 6)
          .map((w: any) => ({
            weekNumber: w.weekNumber,
            theme: w.theme || `Week ${w.weekNumber}`,
            narrative: w.narrative || '',
            phase: w.phase || (w.weekNumber <= 2 ? 'Immediate Relief' : w.weekNumber <= 4 ? 'Foundation' : 'Implementation'),
            tasks: normaliseTasks(w.tasks || [], w.weekNumber),
            weekMilestone: w.weekMilestone || `Week ${w.weekNumber} milestone achieved`,
            tuesdayCheckIn: w.tuesdayCheckIn || 'How do I feel about progress?'
          }));

        if (validated.length > 0) {
          console.log(`[extractWeeksArray] JSON parse succeeded: ${validated.length} weeks extracted`);
          return validated;
        }
      }
    }
  } catch (e) {
    console.log(`[extractWeeksArray] Full JSON parse failed, trying regex extraction: ${(e as Error).message}`);
  }

  // PASS 2: Regex-based extraction (handles malformed JSON / field reordering)
  return extractWeeksWithRegex(input, 1, 6);
}

function extractWeeksWithRegex(input: string, minWeek: number, maxWeek: number): any[] {
  const weeks: any[] = [];

  const weekNumPattern = /"weekNumber"\s*:\s*(\d+)/g;
  let match;
  const positions: { weekNum: number; pos: number }[] = [];

  while ((match = weekNumPattern.exec(input)) !== null) {
    const weekNum = parseInt(match[1]);
    if (weekNum >= minWeek && weekNum <= maxWeek) {
      positions.push({ weekNum, pos: match.index });
    }
  }

  for (let i = 0; i < positions.length; i++) {
    const start = findObjectStart(input, positions[i].pos);
    const end = i < positions.length - 1
      ? findObjectStart(input, positions[i + 1].pos) - 1
      : findObjectEnd(input, positions[i].pos);

    if (start === -1 || end <= start) continue;
    const chunk = input.substring(start, end + 1);
    const weekNum = positions[i].weekNum;

    const theme = extractFieldValue(chunk, 'theme') || `Week ${weekNum}`;
    const narrative = extractFieldValue(chunk, 'narrative') || '';
    const phase = extractFieldValue(chunk, 'phase') || (weekNum <= 2 ? 'Immediate Relief' : weekNum <= 4 ? 'Foundation' : 'Implementation');
    const weekMilestone = extractFieldValue(chunk, 'weekMilestone') || `Week ${weekNum} milestone achieved`;
    const tuesdayCheckIn = extractFieldValue(chunk, 'tuesdayCheckIn') || 'How do I feel about progress?';
    const tasks = extractTasksForWeek(input, weekNum);

    weeks.push({ weekNumber: weekNum, theme, narrative, phase, tasks, weekMilestone, tuesdayCheckIn });
  }

  console.log(`[extractWeeksArray] Regex extraction: ${weeks.length} weeks found`);

  const seen = new Set<number>();
  return weeks
    .filter(w => { if (seen.has(w.weekNumber)) return false; seen.add(w.weekNumber); return true; })
    .sort((a, b) => a.weekNumber - b.weekNumber);
}

function extractFieldValue(chunk: string, fieldName: string): string | null {
  const pattern = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
  const match = chunk.match(pattern);
  if (match) return match[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\\\\/g, '\\').trim();
  return null;
}

function findObjectStart(input: string, fromPos: number): number {
  let depth = 0;
  for (let i = fromPos; i >= 0; i--) {
    if (input[i] === '}') depth++;
    if (input[i] === '{') { if (depth === 0) return i; depth--; }
  }
  return -1;
}

function findObjectEnd(input: string, fromPos: number): number {
  let depth = 0;
  for (let i = fromPos; i < input.length; i++) {
    if (input[i] === '{') depth++;
    if (input[i] === '}') { depth--; if (depth <= 0) return i; }
  }
  return input.length - 1;
}

function normaliseTasks(tasks: any[], weekNum: number): any[] {
  if (!Array.isArray(tasks) || tasks.length === 0) return generateMinimalTasks(weekNum);
  return tasks.map((t: any, i: number) => ({
    id: t.id || `w${weekNum}_t${i + 1}`,
    title: t.title || `Task ${i + 1}`,
    description: t.description || '',
    whyThisMatters: t.whyThisMatters || '',
    category: t.category || 'operations',
    milestone: t.milestone || '',
    tools: t.tools || '',
    timeEstimate: t.timeEstimate || '1-2 hours',
    deliverable: t.deliverable || '',
    celebrationMoment: t.celebrationMoment || '',
    priority: t.priority || 'medium'
  }));
}

function extractTasksForWeek(input: string, weekNum: number): any[] {
  // Find tasks section for this week
  const weekStart = input.indexOf(`"weekNumber": ${weekNum}`);
  if (weekStart === -1) return generateMinimalTasks(weekNum);
  
  const weekSection = input.substring(weekStart, weekStart + 3000);
  const tasks: any[] = [];
  
  const taskPattern = /"title"\s*:\s*"([^"]+)"[^}]*?"description"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/g;
  let match;
  let count = 0;
  
  while ((match = taskPattern.exec(weekSection)) !== null && count < 4) {
    tasks.push({
      id: `w${weekNum}_t${count + 1}`,
      title: match[1],
      description: match[2].replace(/\\"/g, '"'),
      whyThisMatters: 'Connects to your North Star vision',
      timeEstimate: '2-3 hours'
    });
    count++;
  }
  
  return tasks.length > 0 ? tasks : generateMinimalTasks(weekNum);
}

function extractStringAfterPattern(input: string, context: string, key: string): string | null {
  const contextIdx = input.toLowerCase().indexOf(context.toLowerCase());
  if (contextIdx === -1) return null;
  
  const section = input.substring(contextIdx, contextIdx + 1000);
  const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`);
  const match = section.match(regex);
  return match ? match[1] : null;
}

function extractTuesdayEvolution(input: string): any {
  try {
    const match = input.match(/"tuesdayEvolution"\s*:\s*\{([^}]+)\}/);
    if (match) {
      const inner = '{' + match[1] + '}';
      return JSON.parse(inner);
    }
  } catch (e) {
    // Fall through
  }
  
  return {
    week0: "Current state - feeling the weight",
    week2: "First signs of relief",
    week4: "Building momentum",
    week6: "Foundation in place"
  };
}

function generateMinimalWeeks(): any[] {
  return [1, 2, 3, 4, 5, 6].map(n => ({
    weekNumber: n,
    theme: n <= 2 ? 'Quick Wins' : n <= 4 ? 'Building Systems' : 'Execution',
    phase: n <= 2 ? 'Immediate Relief' : n <= 4 ? 'Foundation' : 'Implementation',
    narrative: `Week ${n} focuses on building momentum toward your transformation.`,
    tasks: generateMinimalTasks(n),
    weekMilestone: `Complete Week ${n} objectives`,
    tuesdayCheckIn: 'How am I feeling about my progress?'
  }));
}

function generateMinimalTasks(weekNum: number): any[] {
  return [
    { id: `w${weekNum}_t1`, title: 'Primary focus task', description: 'Main task for this week', whyThisMatters: 'Key step forward', timeEstimate: '2 hours' },
    { id: `w${weekNum}_t2`, title: 'Supporting task', description: 'Supporting activity', whyThisMatters: 'Builds foundation', timeEstimate: '1 hour' },
    { id: `w${weekNum}_t3`, title: 'Quick win', description: 'Something achievable today', whyThisMatters: 'Creates momentum', timeEstimate: '30 mins' }
  ];
}

function buildSprintPrompt(ctx: any): string {
  return `Create Weeks 1-6 of a transformation journey for ${ctx.userName} at ${ctx.companyName}.

## THE NORTH STAR (filter every task through this)
"${ctx.northStar}"

## THE 6-MONTH MILESTONES (every task serves one of these)
${ctx.shiftMilestones.map((m: any, i: number) => `
Milestone ${i + 1}: ${m.milestone}
- Target Month: ${m.targetMonth}
- Measurable: ${m.measurable}
- Why it matters: ${m.whyItMatters || 'Key step toward their vision'}
`).join('\n')}

## THEIR IMMEDIATE PAIN (address in Weeks 1-2)

Monday frustration: "${ctx.mondayFrustration}"
What they'd magic away: "${ctx.magicAwayTask}"
Emergency log: "${ctx.emergencyLog}"
Their relationship with business: "${ctx.relationshipMirror}"
Danger zone: "${ctx.dangerZone}"

## THEIR 90-DAY PRIORITIES (they selected these)
${ctx.ninetyDayPriorities?.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || 'Not specified'}

## QUICK WINS FROM SHIFT PLAN
${ctx.quickWins?.map((qw: any) => `- ${qw.timing}: ${qw.win}`).join('\n') || 'Week 1: Address magic_away_task'}

## THEIR CONSTRAINTS
Time available: ${ctx.commitmentHours}
Team: ${ctx.teamSize}
Tools they use: ${ctx.toolsUsed?.join(', ') || 'Not specified'}
${(ctx.lifeCommitments?.length > 0) ? `
## LIFE DESIGN THREAD — NON-NEGOTIABLE

The following life commitments come from ${ctx.userName}'s Life Design Profile. These must appear as tasks in the sprint.

LIFE COMMITMENTS:
${(ctx.lifeCommitments || []).map((c: any) => `- ${c.commitment} (${c.category}, ${c.frequency}, source: "${c.source}")`).join('\n')}

${ctx.quarterlyLifePriority ? `QUARTERLY LIFE PRIORITY: "${ctx.quarterlyLifePriority}"\n` : ''}
${ctx.enoughNumber ? `"ENOUGH" INCOME TARGET: £${ctx.enoughNumber}/month. If the business already earns this, prioritise HOURS REDUCTION over revenue growth.\n` : ''}
TARGET WEEKLY HOURS: ${ctx.targetWeeklyHours}

LIFE TASK RULES:
1. Every week MUST include at least 1 life task. Non-negotiable.
2. Life task categories: life_time, life_relationship, life_health, life_experience, life_identity
3. Recurring life commitments (daily/weekly) appear in every relevant week with EVOLVING language (Week 1: "This is new. Do it anyway." — Week 4: "Fourth time. Notice: did anything break?" — Week 8: "This should feel normal now.")
4. One-off commitments (e.g. "book the holiday") go where they have most emotional impact.
5. Life tasks have title, description, whyThisMatters, timeEstimate, deliverable, celebrationMoment. whyThisMatters connects to their LIFE goal, not business.
6. HOURS GUARD: Total task hours per week must not exceed ${ctx.commitmentHours}. If over budget, remove the lowest-priority BUSINESS task. NEVER remove a life task to make room for business work.
7. Week 1 MUST include a life task as the client's FIRST or SECOND action.
` : ''}

---

## YOUR TASK: Create Weeks 1-6

Each week needs:
1. **Theme** - Max 6 words, emotionally resonant (not "Process Documentation Phase")
2. **Narrative** - 2-3 sentences on WHY this week matters to their LIFE
3. **Tasks** - 3-4 specific tasks with "whyThisMatters" connecting to their north star
4. **Week Milestone** - What's TRUE by Friday
5. **Tuesday Check-In** - Emotional progress question

Return this JSON:

{
  "sprintTheme": "One sentence: the overarching transformation theme",
  "sprintPromise": "What's TRUE about ${ctx.userName}'s life at Week 6 that isn't true today",
  "sprintGoals": ["3-4 high-level outcomes tied to their priorities"],
  
  "phases": {
    "immediateRelief": {
      "weeks": [1, 2],
      "theme": "Quick wins and hope restoration",
      "emotionalGoal": "From overwhelmed to 'I can do this'"
    },
    "foundation": {
      "weeks": [3, 4],
      "theme": "Building the base",
      "emotionalGoal": "From reactive to proactive"
    },
    "implementation": {
      "weeks": [5, 6],
      "theme": "Executing changes",
      "emotionalGoal": "From planning to doing"
    }
  },
  
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Reclaim Your Mornings",
      "phase": "Immediate Relief",
      "narrative": "This week is about one thing: proving to yourself that you're not trapped. You said '${ctx.magicAwayTask?.substring(0, 50) || ctx.mondayFrustration?.substring(0, 50)}...' Let's address that first. By Friday, you'll feel the first crack of daylight.",
      "tasks": [
        {
          "id": "w1_t1",
          "title": "Action-oriented, specific title",
          "description": "2-3 sentences explaining exactly what to do.",
          "whyThisMatters": "Connection to their North Star or immediate pain",
          "category": "life_time | life_relationship | life_health | life_experience | life_identity | financial | operations | team | marketing | product | systems | strategy",
          "milestone": "Which 6-month milestone this serves",
          "tools": "Specific tools to use",
          "timeEstimate": "2 hours",
          "deliverable": "Tangible output they can show",
          "celebrationMoment": "What to notice when done"
        }
      ],
      "weekMilestone": "By end of Week 1: [specific, measurable, feels like an achievement]",
      "tuesdayCheckIn": "Do I feel [specific emotion]? Have I [specific indicator]?"
    }
    // Weeks 2-6 follow same structure
  ],
  
  "tuesdayEvolution": {
    "week0": "${ctx.relationshipMirror || 'Current state - the weight they carry'}",
    "week2": "First signs of relief - [specific change]",
    "week4": "Building momentum - [specific change]",
    "week6": "Foundation in place - [specific change approaching shift.tuesdayEvolution.month1]"
  }
}

## CRITICAL RULES

1. Week 1-2 MUST address magic_away_task and monday_frustration
2. Every task needs "whyThisMatters" connecting to their North Star or immediate pain
3. Tasks must fit within their stated commitment_hours (${ctx.commitmentHours})
4. Use their specific tools (${ctx.toolsUsed?.join(', ') || 'or recommend appropriate ones'})
5. The narrative for each week should make them FEEL something
6. Tuesday check-ins measure EMOTIONAL state, not task completion
7. Week themes should be memorable (not "Week 1: Process Review")
8. Celebration moments help them recognise progress they might miss`;
}

// ============================================================================
// LIFE DESIGN THREAD ENFORCEMENT
// ============================================================================

interface LifeTaskSource {
  tuesdayTest: string;
  sacrifices: string[];
  northStar: string;
  quarterlyLifePriority: string;
  magicAwayTask: string;
  targetWorkingHours: string;
  lifeCommitments: any[];
}

function getMaxLifeTasksPerWeek(hours: string): number {
  const h = (hours || '').toLowerCase();
  if (h.includes('less than 5') || h.includes('< 5') || h.includes('under 5')) return 1;
  if (h.includes('5-10') || h.includes('5 to 10')) return 1;
  if (h.includes('10-15')) return 2;
  return 1;
}

function enforceLifeDesignThread(weeks: any[], ctx: LifeTaskSource, weekRange: { min: number; max: number }): any[] {
  if (!weeks || weeks.length === 0) return weeks;
  const pool = buildLifeTaskPool(ctx);
  let poolIdx = 0;
  const maxPerWeek = getMaxLifeTasksPerWeek(ctx.targetWorkingHours || '');
  for (const week of weeks) {
    if (week.weekNumber < weekRange.min || week.weekNumber > weekRange.max) continue;
    const tasks = week.tasks || [];
    const existingLife = tasks.filter((t: any) => { const c = (t.category || '').toLowerCase(); return c.startsWith('life_') || c === 'personal' || c === 'wellbeing'; });
    if (existingLife.length >= maxPerWeek) continue;
    if (existingLife.length === 0) {
      const base = pool[poolIdx % pool.length]; poolIdx++;
      const evolved = evolveLifeTaskLanguage(base, week.weekNumber, weekRange);
      const insertPos = tasks.length > 0 && tasks[tasks.length - 1]?.title?.toLowerCase().includes('review') ? tasks.length - 1 : tasks.length;
      tasks.splice(insertPos, 0, evolved);
      week.tasks = tasks;
      console.log(`[LifeDesignThread] Inserted life task in Week ${week.weekNumber}: "${evolved.title}"`);
    }
  }
  return weeks;
}

function buildLifeTaskPool(ctx: LifeTaskSource): any[] {
  const pool: any[] = [];
  if (ctx.lifeCommitments?.length > 0) {
    for (const c of ctx.lifeCommitments) {
      pool.push({ id: `life_${c.id || pool.length + 1}`, title: c.commitment || 'Honour your life commitment', description: `This comes from what you told us matters most. ${c.source || ''}`.trim(), whyThisMatters: 'Your North Star includes this. Without protecting it, the business changes mean nothing.', category: c.category || 'life_time', milestone: 'Life Design Thread', timeEstimate: c.frequency === 'daily' ? '30 mins' : '1-2 hours', deliverable: 'Protected time, honoured', celebrationMoment: 'Notice how it feels when you keep this promise to yourself', source: 'life_commitment' });
    }
  }
  if (ctx.tuesdayTest) {
    const t = ctx.tuesdayTest.toLowerCase();
    if (t.includes('writ') || t.includes('personal writing')) pool.push({ id: `life_writing_${pool.length+1}`, title: 'Protect your writing time — one session this week', description: 'Block one 2-hour writing session this week. Close the laptop. Silence the phone. This is non-negotiable — you said so yourself.', whyThisMatters: 'You described writing as part of your ideal Tuesday. One session per week is the starting point.', category: 'life_identity', milestone: 'Life Design Thread', timeEstimate: '2 hours', deliverable: 'One writing session completed, undisturbed', celebrationMoment: 'You wrote. That\'s enough.', source: 'tuesday_test' });
    if (t.includes('children') || t.includes('kids') || t.includes('family') || t.includes('wife') || t.includes('partner') || t.includes('husband')) pool.push({ id: `life_family_${pool.length+1}`, title: 'Be fully present with your family this evening', description: 'Leave work at the time you said you want to. No checking emails. Be there — properly.', whyThisMatters: 'You said you want evenings free from urgent fires.', category: 'life_relationship', milestone: 'Life Design Thread', timeEstimate: 'An evening', deliverable: 'One evening fully present, phone away', celebrationMoment: 'Ask yourself: did anyone at work even notice I wasn\'t available?', source: 'tuesday_test' });
    if (t.includes('exercise') || t.includes('run') || t.includes('gym') || t.includes('bike') || t.includes('walk') || t.includes('swim')) pool.push({ id: `life_exercise_${pool.length+1}`, title: 'Move your body — on your terms', description: 'You mentioned exercise as part of your ideal day. Schedule it. Protect it.', whyThisMatters: 'You listed this in your ideal Tuesday.', category: 'life_health', milestone: 'Life Design Thread', timeEstimate: '30-60 mins', deliverable: 'Exercise session completed', celebrationMoment: 'Notice your energy for the rest of the day', source: 'tuesday_test' });
    const timeMatch = t.match(/finish.*?(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:am|pm|o'clock))/i) || t.match(/wrap.*?(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:am|pm|o'clock))/i) || t.match(/leave.*?(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:am|pm|o'clock))/i);
    if (timeMatch) pool.push({ id: `life_boundary_${pool.length+1}`, title: `Close the laptop by ${timeMatch[1]}`, description: `You said you want to finish work at ${timeMatch[1]}. This week, do it at least twice.`, whyThisMatters: 'Every week you don\'t honour this boundary, you prove the business owns your time.', category: 'life_time', milestone: 'Life Design Thread', timeEstimate: 'N/A', deliverable: `Two days where you stopped at ${timeMatch[1]}`, celebrationMoment: 'The world didn\'t end.', source: 'tuesday_test' });
  }
  if (ctx.sacrifices?.length > 0) {
    for (const sac of ctx.sacrifices.slice(0, 2)) {
      const sl = sac.toLowerCase();
      if (sl.includes('hobby') || sl.includes('hobbies')) pool.push({ id: `life_hobby_${pool.length+1}`, title: 'Reclaim one hour for something you used to love', description: 'You said you\'ve sacrificed hobbies. Take one hour back.', whyThisMatters: 'The business took your hobbies. You\'re taking them back.', category: 'life_experience', milestone: 'Life Design Thread', timeEstimate: '1 hour', deliverable: 'One hour for you', celebrationMoment: 'Did it feel indulgent? Good.', source: 'sacrifices' });
      if (sl.includes('sleep') || sl.includes('rest')) pool.push({ id: `life_rest_${pool.length+1}`, title: 'Get to bed on time — three nights this week', description: 'You said you\'ve sacrificed sleep. Be in bed by your target time at least three nights.', whyThisMatters: 'You can\'t build freedom if you\'re running on empty.', category: 'life_health', milestone: 'Life Design Thread', timeEstimate: 'N/A', deliverable: 'Three nights of proper rest', celebrationMoment: 'How did Thursday morning feel?', source: 'sacrifices' });
      if (sl.includes('fitness') || sl.includes('health')) pool.push({ id: `life_fitness_${pool.length+1}`, title: 'Move your body this week', description: 'You said you\'ve sacrificed fitness. One session this week — anything counts.', whyThisMatters: 'Your body is keeping score.', category: 'life_health', milestone: 'Life Design Thread', timeEstimate: '30-60 mins', deliverable: 'One exercise session', celebrationMoment: 'You showed up for yourself.', source: 'sacrifices' });
    }
  }
  if (ctx.quarterlyLifePriority) pool.push({ id: `life_quarterly_${pool.length+1}`, title: 'Check in on your quarterly life priority', description: `You said your priority this quarter is: "${ctx.quarterlyLifePriority}". What's one small step this week?`, whyThisMatters: 'This is what you said matters most right now — outside the business.', category: 'life_experience', milestone: 'Life Design Thread', timeEstimate: '15 mins + action', deliverable: 'One step taken', celebrationMoment: 'Progress, not perfection', source: 'quarterly_priority' });
  if (pool.length === 0) pool.push({ id: 'life_generic_1', title: 'Protect one hour for yourself this week', description: 'Block one hour for something that has nothing to do with the business. Walk. Read. Sit quietly.', whyThisMatters: `Your North Star: "${ctx.northStar?.substring(0, 80) || 'A life worth building'}..." — this only happens if you practise it.`, category: 'life_time', milestone: 'Life Design Thread', timeEstimate: '1 hour', deliverable: 'One protected hour, used', celebrationMoment: 'You chose yourself.', source: 'fallback' });
  return pool;
}

function evolveLifeTaskLanguage(task: any, weekNumber: number, weekRange: { min: number; max: number }): any {
  const evolved = { ...task };
  const rel = weekNumber - weekRange.min + 1;
  if (rel <= 2) { evolved.description = `This is new. It might feel indulgent or uncomfortable. Do it anyway. ${task.description}`; evolved.celebrationMoment = task.celebrationMoment || 'You started. That\'s the hardest part.'; }
  else if (rel <= 4) { evolved.description = `You've done this before. Notice: is it getting easier? ${task.description}`; evolved.celebrationMoment = task.celebrationMoment || 'Third time. Did the world end? Keep going.'; }
  else { evolved.description = `This should feel normal now. If it still feels like a fight, that's a signal about your systems. ${task.description}`; evolved.celebrationMoment = task.celebrationMoment || 'This is becoming who you are.'; }
  evolved.id = `${task.id}_w${weekNumber}`;
  return evolved;
}

// ============================================================================
// SPRINT TASK QUALITY ENFORCEMENT
// ============================================================================

interface TaskEnforcementContext {
  northStar: string;
  shiftMilestones: Array<{ milestone: string; targetMonth: number; measurable?: string }>;
  tuesdayTest: string;
  magicAwayTask: string;
  dangerZone: string;
  commitmentHours: string;
}

function enforceTaskFields(weeks: any[], ctx: TaskEnforcementContext): any[] {
  for (const week of weeks) {
    if (!week.tasks || !Array.isArray(week.tasks)) continue;
    for (let i = 0; i < week.tasks.length; i++) {
      const t = week.tasks[i];
      if (!t.id) t.id = `w${week.weekNumber}_t${i + 1}`;
      if (!t.category || t.category === 'undefined' || t.category === '') t.category = detectCategory(t.title || '', t.description || '');
      if (!t.whyThisMatters || t.whyThisMatters.length < 10) t.whyThisMatters = genWhyMatters(t, week, ctx);
      if (!t.timeEstimate || t.timeEstimate === '') t.timeEstimate = estTime(t.title || '', t.description || '');
      if (!t.deliverable || t.deliverable === '') t.deliverable = genDeliverable(t.title || '', t.description || '');
      if (!t.celebrationMoment || t.celebrationMoment === '') t.celebrationMoment = genCelebration(t, week.weekNumber);
      if (!t.milestone || t.milestone === '') t.milestone = nearestMilestone(week.weekNumber, ctx.shiftMilestones);
      if (!t.priority) t.priority = i === 0 ? 'high' : i === 1 ? 'medium' : 'low';
    }
  }
  return weeks;
}

function detectCategory(title: string, desc: string): string {
  const t = (title + ' ' + desc).toLowerCase();
  if (t.includes('writ') && (t.includes('personal') || t.includes('undisturb'))) return 'life_identity';
  if (t.includes('family') || t.includes('children') || t.includes('kids') || t.includes('wife') || t.includes('partner') || t.includes('husband') || t.includes('evening')) return 'life_relationship';
  if (t.includes('exercise') || t.includes('run ') || t.includes('gym') || t.includes('bike') || t.includes('sleep') || t.includes('rest') || t.includes('health')) return 'life_health';
  if (t.includes('hobby') || t.includes('holiday') || t.includes('travel')) return 'life_experience';
  if (t.includes('protect') && t.includes('time')) return 'life_time';
  if (t.includes('boundary') || (t.includes('laptop') && t.includes('close'))) return 'life_time';
  if (t.includes('price') || t.includes('pricing') || t.includes('margin') || t.includes('invoice') || t.includes('payment') || t.includes('cash') || t.includes('revenue') || t.includes('profit') || t.includes('financial') || t.includes('cost')) return 'financial';
  if (t.includes('hire') || t.includes('recruit') || t.includes('team') || t.includes('delegate') || t.includes('staff') || t.includes('train')) return 'team';
  if (t.includes('process') || t.includes('workflow') || t.includes('system') || t.includes('automat') || t.includes('sop')) return 'systems';
  if (t.includes('customer') || t.includes('client') || t.includes('sales') || t.includes('lead') || t.includes('market')) return 'marketing';
  if (t.includes('strateg') || t.includes('vision') || t.includes('review') || t.includes('kpi')) return 'strategy';
  return 'operations';
}

function genWhyMatters(task: any, week: any, ctx: TaskEnforcementContext): string {
  const wn = week.weekNumber || 0;
  if (wn <= 3) {
    if (ctx.magicAwayTask) return `You said you'd magic away "${ctx.magicAwayTask.substring(0, 40)}" — this is the first step.`;
    if (ctx.dangerZone) return `Your danger zone is "${ctx.dangerZone.substring(0, 40)}" — this reduces that risk.`;
    return 'This addresses the immediate friction you described. Small step, real relief.';
  }
  if (wn <= 8) { const m = nearestMilestone(wn, ctx.shiftMilestones); return m ? `Moves you toward: "${m.substring(0, 50)}". Each step compounds.` : 'Building on the foundation. This is where momentum starts.'; }
  return `Connects to your North Star: "${ctx.northStar?.substring(0, 60) || 'the life you described'}..."`;
}

function estTime(title: string, desc: string): string {
  const t = (title + ' ' + desc).toLowerCase();
  if (t.includes('quick') || t.includes('list') || t.includes('check')) return '30 mins';
  if (t.includes('conversation') || t.includes('call') || t.includes('meeting')) return '30-60 mins';
  if (t.includes('document') || t.includes('write') || t.includes('draft') || t.includes('create')) return '1-2 hours';
  if (t.includes('spreadsheet') || t.includes('analysis') || t.includes('research') || t.includes('audit')) return '2-3 hours';
  if (t.includes('implement') || t.includes('restructure')) return '3-4 hours';
  return '1-2 hours';
}

function genDeliverable(title: string, desc: string): string {
  const t = (title + ' ' + desc).toLowerCase();
  if (t.includes('list') || t.includes('document')) return 'A written document you can reference';
  if (t.includes('conversation') || t.includes('call')) return 'Notes and agreed next steps';
  if (t.includes('spreadsheet') || t.includes('data')) return 'A spreadsheet with the data captured';
  if (t.includes('schedule') || t.includes('plan')) return 'A schedule someone else can follow';
  if (t.includes('framework') || t.includes('process')) return 'A documented framework ready to share';
  return 'A tangible output you can point to';
}

function genCelebration(task: any, weekNum: number): string {
  const c = (task.category || '').toLowerCase();
  if (c.startsWith('life_')) return 'You chose yourself. That\'s the shift.';
  if (c === 'financial') return 'You looked at the numbers honestly. Most people don\'t.';
  if (c === 'team') return 'You trusted someone else with this. That\'s leadership.';
  if (c === 'systems') return 'This process now exists outside your head. That\'s freedom.';
  if (weekNum <= 3) return 'You started. That\'s the hardest part.';
  if (weekNum <= 8) return 'Notice how this is getting easier. That\'s the compound effect.';
  return 'Look how far you\'ve come from Week 1.';
}

function nearestMilestone(weekNum: number, milestones: any[]): string {
  if (!milestones?.length) return '';
  const approxMonth = Math.ceil(weekNum / 2);
  let best = milestones[0], minDist = Math.abs((best.targetMonth || 2) - approxMonth);
  for (const m of milestones) { const d = Math.abs((m.targetMonth || 2) - approxMonth); if (d < minDist) { best = m; minDist = d; } }
  return best.milestone || best.title || '';
}

// ============================================================================
// BM SUMMARY BLOCK BUILDER
// ============================================================================

function buildBmSummaryBlock(bmReport: any): string {
  if (!bmReport?.pass1_data) return '';
  const d = bmReport.pass1_data as Record<string, any>;
  const p: string[] = ['## BENCHMARKING REPORT FINDINGS (use to make tasks more specific)', ''];
  const rev = d._enriched_revenue; const gm = d.gross_margin; const nm = d.net_margin;
  const finPts: string[] = [];
  if (rev) finPts.push(`Revenue: £${(rev / 1000).toFixed(0)}k`);
  if (gm) finPts.push(`Gross margin: ${typeof gm === 'number' && gm < 1 ? (gm * 100).toFixed(1) : gm}%`);
  if (nm) finPts.push(`Net margin: ${typeof nm === 'number' && nm < 1 ? (nm * 100).toFixed(1) : nm}%`);
  if (finPts.length) { p.push(`Financials: ${finPts.join('; ')}`); p.push(''); }
  const strengths = d.topStrengths || bmReport.top_strengths || [];
  if (strengths.length) { p.push('Strengths (protect):'); for (const s of strengths.slice(0, 3)) p.push(`- ${s.metric || s.metricName || s.name}: ${s.position || s.assessment || ''}`); p.push(''); }
  const gaps = d.topGaps || bmReport.top_gaps || [];
  if (gaps.length) { p.push('Gaps (address in tasks):'); for (const g of gaps.slice(0, 3)) { const imp = g.annualImpact || g.annual_impact; p.push(`- ${g.metric || g.metricName || g.name}: ${g.position || ''} ${imp ? `(£${typeof imp === 'number' ? imp.toLocaleString() : imp} annual)` : ''}`); if (g.rootCauseHypothesis || g.root_cause) p.push(`  Root cause: ${g.rootCauseHypothesis || g.root_cause}`); } p.push(''); }
  const opp = d.opportunitySizing || {};
  const total = opp.totalAnnualOpportunity || bmReport.total_annual_opportunity;
  if (total) p.push(`Total annual opportunity: £${typeof total === 'number' ? total.toLocaleString() : total}`);
  if (bmReport.overall_percentile) p.push(`Overall percentile: ${bmReport.overall_percentile}th`);
  const va = bmReport.value_analysis;
  if (va) { const es = bmReport.exit_readiness_breakdown?.totalScore || va.exitReadinessScore?.overall || va.exitReadiness?.score; if (es) { p.push(`\nExit readiness: ${es}/100`); const sup = bmReport.enhanced_suppressors || va.valueSuppressors || va.value_suppressors || []; if (sup.length) { p.push('Value suppressors:'); for (const s of sup.slice(0, 3)) p.push(`- ${s.name || s.title || s.suppressor}: ${s.description || ''}`); } } }
  p.push(''); p.push('Reference specific BM findings in tasks. Translate numbers into actions, don\'t just repeat them.');
  return p.join('\n');
}

// ============================================================================
// FIELD NAME NORMALISATION
// ============================================================================

function normaliseFieldNames(weeks: any[]): any[] {
  for (const week of weeks) {
    if (week.weekMilestone && !week.milestone) week.milestone = week.weekMilestone;
    if (week.milestone && !week.weekMilestone) week.weekMilestone = week.milestone;
    if (week.tuesdayCheckIn && !week.tuesdayTransformation) week.tuesdayTransformation = week.tuesdayCheckIn;
    if (week.tuesdayTransformation && !week.tuesdayCheckIn) week.tuesdayCheckIn = week.tuesdayTransformation;
    if (week.narrative && !week.focus) week.focus = week.narrative;
    for (const task of week.tasks || []) {
      if (task.whyThisMatters && !task.why) task.why = task.whyThisMatters;
      if (task.why && !task.whyThisMatters) task.whyThisMatters = task.why;
      if (task.timeEstimate && !task.estimatedHours) { const m = task.timeEstimate.match(/([\d.]+)/); if (m) task.estimatedHours = parseFloat(m[1]); }
      if (task.estimatedHours && !task.timeEstimate) task.timeEstimate = `${task.estimatedHours} hours`;
    }
  }
  return weeks;
}
