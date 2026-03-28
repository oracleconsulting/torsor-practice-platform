// ============================================================================
// GENERATE SPRINT PLAN PART 2 (Weeks 7-12)
// ============================================================================
// Purpose: Complete the transformation journey
// Weeks 7-8: Momentum - Scale what works
// Weeks 9-10: Embed - Lock in gains, create habits
// Weeks 11-12: Measure - Assess progress, plan next sprint
// 
// This is where the transformation becomes real and sustainable
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      .eq('stage_type', 'sprint_plan_part2')
      .eq('sprint_number', sprintNumber)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version + 1 
      : 1;

    console.log(`Creating sprint_plan_part2 stage with version ${nextVersion}, sprint ${sprintNumber}`);

    const { data: stage, error: stageError } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: 'sprint_plan_part2',
        sprint_number: sprintNumber,
        version: nextVersion,
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        model_used: 'anthropic/claude-sonnet-4.5'
      })
      .select()
      .single();

    if (stageError) throw stageError;

    // Fetch dependencies: part1 must be same sprint; vision/shift/fit for renewal use updated stages
    const fitProfile = sprintNumber > 1
      ? (await fetchStage('life_design_refresh', sprintNumber)) || {}
      : (await fetchStage('fit_assessment', 1)) || {};
    const sprintPart1 = await fetchStage('sprint_plan_part1', sprintNumber);
    const vision = sprintNumber > 1
      ? await fetchStage('vision_update', sprintNumber)
      : await fetchStage('five_year_vision', 1);
    const shift = sprintNumber > 1
      ? await fetchStage('shift_update', sprintNumber)
      : await fetchStage('six_month_shift', 1);
    const lifeDesignProfile = await fetchStage('life_design_profile', 1);

    if (!sprintPart1) {
      throw new Error('Sprint part 1 not found - cannot generate part 2');
    }

    // Fetch assessment data
    const { data: assessments } = await supabase
      .from('client_assessments')
      .select('assessment_type, responses')
      .eq('client_id', clientId)
      .in('assessment_type', ['part1', 'part2']);

    const part1Data = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
    const part2Data = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};
    const enoughNumber = part2Data?.lb_enough_number ?? null;
    const quarterlyLifePriority = part2Data?.lb_quarter_priority ?? null;
    const biggestLifeBlocker = part2Data?.lb_biggest_blocker ?? null;
    const monthOffVision = part2Data?.lb_month_off ?? null;
    const externalPerspective = part2Data?.lb_external_perspective ?? null;

    const { data: client } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();

    const context = buildSprintContext(part1Data, part2Data, client, fitProfile, vision, shift, sprintPart1, lifeDesignProfile, enoughNumber, quarterlyLifePriority, biggestLifeBlocker, monthOffVision, externalPerspective);

    let enrichedContext: Awaited<ReturnType<typeof enrichRoadmapContext>> | null = null;
    try {
      enrichedContext = await enrichRoadmapContext(supabase, clientId);
      if (enrichedContext?.hasEnrichment) console.log('[generate-sprint-plan-part2] Cross-service enrichment available');
    } catch (err) {
      console.warn('[generate-sprint-plan-part2] Enrichment not available:', err);
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
            console.log('[generate-sprint-plan-part2] Advisor notes included');
          }
        }
      } catch (err) {
        console.warn('[generate-sprint-plan-part2] Failed to fetch advisor notes:', err);
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
          console.log('[generate-sprint-plan-part2] Life alignment context included');
        }
      } catch (err) {
        console.warn('[generate-sprint-plan-part2] Failed to fetch life alignment:', err);
      }
    }

    const { data: assessmentMeta } = await supabase.from('client_assessments').select('metadata').eq('client_id', clientId).eq('assessment_type', 'part2').maybeSingle();
    if (assessmentMeta?.metadata?.adaptive) {
      const skipped = assessmentMeta.metadata.skippedSections || [];
      console.log('[generate-sprint-plan-part2] Adaptive assessment — skipped sections:', skipped.map((s: any) => s.sectionId).join(', '));
      const skippedNames = skipped.map((s: any) => s.sectionId).join(', ');
      if (skippedNames) {
        advisorNotesBlock += `\n\nNote: Client used adaptive assessment and skipped Part 2 sections: ${skippedNames}. For these areas, rely on the cross-service enrichment data provided above (BM/SA/financial data) rather than Part 2 responses.`;
      }
    }

    // Fetch BM report summary for cross-service context
    let bmSummaryBlock = '';
    try {
      const { data: bmEng2 } = await supabase.from('bm_engagements').select('id').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      let bmRpt: any = null;
      if (bmEng2?.id) { const { data: rpt } = await supabase.from('bm_reports').select('pass1_data, value_analysis, total_annual_opportunity, overall_percentile, enhanced_suppressors, exit_readiness_breakdown, top_strengths, top_gaps').eq('engagement_id', bmEng2.id).in('status', ['pass1_complete', 'generated', 'approved', 'published', 'delivered']).order('updated_at', { ascending: false }).limit(1).maybeSingle(); bmRpt = rpt; }
      if (bmRpt?.pass1_data) { bmSummaryBlock = buildBmSummaryBlock(bmRpt); console.log(`[Sprint2] BM summary block: ${bmSummaryBlock.length} chars`); }
    } catch (e) { console.warn('[Sprint2] BM fetch failed:', e); }

    console.log(`Generating weeks 7-12 for ${context.userName}...`);

    const sprintPart2 = await generateSprintPart2(context, (enrichedContext?.promptContext || '') + advisorNotesBlock + lifeAlignmentBlock + (bmSummaryBlock ? '\n\n' + bmSummaryBlock : ''));

    // Enforce Life Design Thread — every week must have at least one life task
    if (Array.isArray(sprintPart2?.weeks)) {
      const lifeCtx: LifeTaskSource = {
        tuesdayTest: context.tuesdayTest || context.relationshipMirror || '',
        sacrifices: context.sacrifices || [],
        northStar: context.northStar || '',
        quarterlyLifePriority: context.quarterlyLifePriority || context.lbQuarterPriority || '',
        magicAwayTask: context.magicAwayTask || '',
        targetWorkingHours: String(context.targetWorkingHours || context.commitmentHours || ''),
        lifeCommitments: context.lifeCommitments || []
      };
      sprintPart2.weeks = enforceLifeDesignThread(sprintPart2.weeks, lifeCtx, { min: 7, max: 12 });
    }

    // Enforce task field completeness
    if (Array.isArray(sprintPart2?.weeks)) {
      const taskCtx: TaskEnforcementContext = {
        northStar: context.northStar || '', shiftMilestones: context.shiftMilestones || [],
        tuesdayTest: context.tuesdayTest || '', magicAwayTask: context.magicAwayTask || '',
        dangerZone: context.dangerZone || '', commitmentHours: context.commitmentHours || ''
      };
      sprintPart2.weeks = enforceTaskFields(sprintPart2.weeks, taskCtx);
    }

    const completeSprint = mergeSprints(sprintPart1, sprintPart2);

    const duration = Date.now() - startTime;

    try {
      await supabase
        .from('roadmap_stages')
        .update({
          status: 'generated',
          generated_content: completeSprint,
          generation_completed_at: new Date().toISOString(),
          generation_duration_ms: duration,
          metadata: {
            ...((stage as any)?.metadata || {}),
            enrichmentSources: enrichedContext?.sources ?? null,
          },
        })
        .eq('id', stage.id);
    } catch (metaErr) {
      console.warn('[generate-sprint-plan-part2] Metadata save failed (non-blocking):', metaErr);
      await supabase
        .from('roadmap_stages')
        .update({
          status: 'generated',
          generated_content: completeSprint,
          generation_completed_at: new Date().toISOString(),
          generation_duration_ms: duration,
        })
        .eq('id', stage.id);
    }

    // Sync tasks to client_tasks table for tracking
    console.log('Syncing sprint tasks to client_tasks table...');
    try {
      // Delete existing tasks for this client (fresh sync)
      await supabase
        .from('client_tasks')
        .delete()
        .eq('client_id', clientId);

      // Insert all tasks from the complete sprint
      const tasksToInsert: any[] = [];
      for (const week of completeSprint.weeks || []) {
        const weekNumber = week.weekNumber || week.week;
        for (let i = 0; i < (week.tasks || []).length; i++) {
          const task = week.tasks[i];
          tasksToInsert.push({
            client_id: clientId,
            practice_id: practiceId,
            week_number: weekNumber,
            title: task.title,
            description: task.description,
            category: task.category || 'general', // Don't use week.phase - may violate CHECK constraint
            priority: task.priority || 'medium',
            status: 'pending',
            sort_order: i,
            estimated_hours: task.timeEstimate ? parseFloat(task.timeEstimate) || null : null,
            metadata: {
              whyThisMatters: task.whyThisMatters,
              milestone: task.milestone,
              tools: task.tools,
              deliverable: task.deliverable,
              phase: week.phase // Store phase in metadata instead
            }
          });
        }
      }

      if (tasksToInsert.length > 0) {
        const { error: taskError } = await supabase
          .from('client_tasks')
          .insert(tasksToInsert);

        if (taskError) {
          console.error('Error syncing tasks:', taskError);
        } else {
          console.log(`Synced ${tasksToInsert.length} tasks to client_tasks`);
        }
      }
    } catch (syncError) {
      console.error('Task sync error (non-fatal):', syncError);
    }

    console.log(`Sprint plan part 2 (weeks 7-12) generated for client ${clientId} in ${duration}ms`);

    return new Response(JSON.stringify({ success: true, stageId: stage.id, duration }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sprint part 2 generation error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildSprintContext(part1: any, part2: any, client: any, fitProfile: any, vision: any, shift: any, sprintPart1: any, lifeDesignProfile: any = null, enoughNumber: number | null = null, quarterlyLifePriority: string | null = null, _biggestLifeBlocker?: string | null, _monthOffVision?: string | null, _externalPerspective?: string | null) {
  return {
    userName: client?.name?.split(' ')[0] || part1.full_name?.split(' ')[0] || 'there',
    companyName: client?.client_company || part2.trading_name || part1.company_name || 'your business',
    northStar: fitProfile.northStar || vision?.northStar || '',
    archetype: fitProfile.archetype || 'balanced_achiever',
    year1Milestone: vision?.yearMilestones?.year1 || {},
    tuesdayTest: part1.tuesday_test || vision?.visualisation || '',
    shiftMilestones: shift?.keyMilestones || [],
    tuesdayEvolutionShift: shift?.tuesdayEvolution || {},
    sprintTheme: sprintPart1.sprintTheme,
    sprintPromise: sprintPart1.sprintPromise,
    sprintGoals: sprintPart1.sprintGoals,
    phases: sprintPart1.phases,
    weeks1to6: sprintPart1.weeks,
    tuesdayEvolutionPart1: sprintPart1.tuesdayEvolution,
    dangerZone: part1.danger_zone || '',
    relationshipMirror: part1.relationship_mirror || '',
    commitmentHours: part1.commitment_hours || '10-15 hours',
    teamSize: part2.team_size || part2.staff_count || 'small team',
    toolsUsed: part2.tools_used || part2.current_tools || [],
    lifeDesignProfile,
    lifeCommitments: lifeDesignProfile?.lifeCommitments || [],
    enoughNumber,
    quarterlyLifePriority,
    targetWeeklyHours: lifeDesignProfile?.targetWeeklyHours ?? part2?.target_working_hours ?? 35,
  };
}

function mergeSprints(part1: any, part2: any): any {
  const allWeeks = [...(part1.weeks || []), ...(part2.weeks || [])];
  
  return {
    sprintTheme: part1.sprintTheme,
    sprintPromise: part1.sprintPromise,
    sprintGoals: part1.sprintGoals,
    phases: {
      ...part1.phases,
      ...part2.phases
    },
    weeks: allWeeks,
    tuesdayEvolution: {
      ...part1.tuesdayEvolution,
      ...part2.tuesdayEvolution
    },
    backslidePreventions: part2.backslidePreventions || [],
    nextSprintPreview: part2.nextSprintPreview || 'Sprint 2 will build on this foundation'
  };
}

async function generateSprintPart2(ctx: any, enrichmentBlock = ''): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  const prompt = buildSprintPrompt(ctx) + enrichmentBlock;

  console.log('Making OpenRouter API request for sprint part 2...');
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
        'X-Title': 'Torsor 365 Sprint Part 2'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        max_tokens: 8000,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { 
            role: 'system', 
            content: `You complete transformation journeys, not task lists.
Weeks 7-12 build on weeks 1-6 progress. This is where the transformation becomes sustainable.
Every week has a narrative—WHY it matters.
Every task connects to their North Star.

ANTI-AI-SLOP RULES:
BANNED: Additionally, delve, crucial, pivotal, testament, underscores, showcases, fostering, tapestry, landscape, synergy, leverage, scalable, holistic, impactful, ecosystem
BANNED STRUCTURES: "Not only X but also Y", "It's important to note", "In summary", rule of three lists, "-ing" phrase endings
THE TEST: If it sounds corporate, rewrite it. Sound like a transformation story.

British English only (organise, colour, £). Return ONLY valid JSON. Ensure all strings are properly escaped.`
          },
          { role: 'user', content: prompt }
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
    parsed = repairComplexJsonPart2(jsonString);
  }
  injectLifeTasksIfMissing(parsed, ctx?.lifeDesignProfile);
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
      description: `This is your life commitment. ${recurring.measurable || ''}`,
      category: `life_${recurring.category}`,
      whyThisMatters: "You identified this as essential to the life you're building.",
      timeEstimate: '1 hour',
      deliverable: recurring.measurable || 'Honour this commitment.',
      celebrationMoment: 'Notice how it feels to honour this commitment to yourself.'
    });
    console.warn(`[Sprint Part 2] Week ${wNum} missing life task — injected from commitments`);
  }
}

/**
 * Advanced JSON repair for complex LLM output (Part 2 - Weeks 7-12)
 */
function repairComplexJsonPart2(input: string): any {
  let json = input;
  
  // Step 1: Remove control characters except newlines/tabs
  json = json.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Step 2: Fix strings with unescaped internal quotes
  json = fixUnescapedQuotesPart2(json);
  
  // Step 3: Fix trailing commas
  json = json.replace(/,(\s*[}\]])/g, '$1');
  
  // Step 4: Fix missing commas between elements
  json = json.replace(/\}(\s*)\{/g, '},\n{');
  json = json.replace(/\](\s*)\[/g, '],\n[');
  json = json.replace(/"(\s*)\{/g, '",{');
  json = json.replace(/\}(\s*)"/g, '},\n"');
  json = json.replace(/"(\s+)"([a-zA-Z_])/g, '",\n"$2');
  
  // Step 5: Close unclosed structures
  json = closeUnclosedStructuresPart2(json);
  
  // Step 6: Try to parse
  try {
    const result = JSON.parse(json);
    console.log('Advanced JSON repair successful');
    return result;
  } catch (e1) {
    console.warn('First repair attempt failed, trying extraction method...');
    return extractAndRebuildPart2(input);
  }
}

function fixUnescapedQuotesPart2(json: string): string {
  const result: string[] = [];
  let inString = false;
  let i = 0;
  
  while (i < json.length) {
    const char = json[i];
    const prevChar = i > 0 ? json[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        result.push(char);
      } else {
        const lookAhead = json.substring(i + 1, i + 20).trim();
        if (/^[\s]*[:,\}\]\n]/.test(lookAhead) || lookAhead === '') {
          inString = false;
          result.push(char);
        } else {
          result.push('\\"');
        }
      }
    } else if (char === '\n' && inString) {
      result.push('\\n');
    } else {
      result.push(char);
    }
    i++;
  }
  
  return result.join('');
}

function closeUnclosedStructuresPart2(json: string): string {
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
  
  if (stack.length > 0) {
    console.log(`Closing ${stack.length} unclosed structures`);
    json = json.replace(/,\s*$/, '');
    json = json.replace(/"[^"]*$/, '""');
    json += stack.reverse().join('');
  }
  
  return json;
}

function extractAndRebuildPart2(input: string): any {
  console.log('Attempting structured extraction for Part 2...');
  
  const extracted: any = {
    weeks: extractWeeksArrayPart2(input),
    tuesdayEvolution: extractTuesdayEvolutionPart2(input),
    backslidePreventions: extractBackslidePreventions(input),
    nextSprintPreview: extractStringValuePart2(input, 'nextSprintPreview') || 'Building on your foundation for continued growth'
  };
  
  console.log(`Extracted: ${extracted.weeks.length} weeks for Part 2`);
  
  if (extracted.weeks.length === 0) {
    console.warn('Could not extract any weeks, using minimal structure');
    extracted.weeks = generateMinimalWeeksPart2();
    extracted._note = 'Weeks regenerated due to parsing issues';
  }
  
  return extracted;
}

function extractStringValuePart2(input: string, key: string): string | null {
  const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*(?:\\\\"[^"]*)*)"`, 's');
  const match = input.match(regex);
  return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, ' ') : null;
}

function extractWeeksArrayPart2(input: string): any[] {
  // PASS 1: Try full JSON parse
  try {
    const jsonStart = input.indexOf('{');
    const jsonEnd = input.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonStr = input.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonStr);

      const weeks = parsed.weeks || parsed.sprint?.weeks || [];
      if (Array.isArray(weeks) && weeks.length > 0) {
        const validated = weeks
          .filter((w: any) => w.weekNumber && w.weekNumber >= 7 && w.weekNumber <= 12)
          .map((w: any) => ({
            weekNumber: w.weekNumber,
            theme: w.theme || `Week ${w.weekNumber}`,
            narrative: w.narrative || '',
            phase: w.phase || (w.weekNumber <= 8 ? 'Momentum' : w.weekNumber <= 10 ? 'Embed' : 'Measure'),
            tasks: normaliseTasksPart2(w.tasks || [], w.weekNumber),
            weekMilestone: w.weekMilestone || `Week ${w.weekNumber} milestone achieved`,
            tuesdayCheckIn: w.tuesdayCheckIn || 'How sustainable does this feel?'
          }));

        if (validated.length > 0) {
          console.log(`[extractWeeksArrayPart2] JSON parse succeeded: ${validated.length} weeks extracted`);
          return validated;
        }
      }
    }
  } catch (e) {
    console.log(`[extractWeeksArrayPart2] Full JSON parse failed, trying regex: ${(e as Error).message}`);
  }

  // PASS 2: Regex-based extraction (field-order independent)
  return extractWeeksWithRegexPart2(input);
}

function extractWeeksWithRegexPart2(input: string): any[] {
  const weeks: any[] = [];

  const weekNumPattern = /"weekNumber"\s*:\s*(\d+)/g;
  let match;
  const positions: { weekNum: number; pos: number }[] = [];

  while ((match = weekNumPattern.exec(input)) !== null) {
    const weekNum = parseInt(match[1]);
    if (weekNum >= 7 && weekNum <= 12) {
      positions.push({ weekNum, pos: match.index });
    }
  }

  for (let i = 0; i < positions.length; i++) {
    const start = findObjectStartPart2(input, positions[i].pos);
    const end = i < positions.length - 1
      ? findObjectStartPart2(input, positions[i + 1].pos) - 1
      : findObjectEndPart2(input, positions[i].pos);

    if (start === -1 || end <= start) continue;
    const chunk = input.substring(start, end + 1);
    const weekNum = positions[i].weekNum;

    const theme = extractFieldValuePart2(chunk, 'theme') || `Week ${weekNum}`;
    const narrative = extractFieldValuePart2(chunk, 'narrative') || '';
    const phase = extractFieldValuePart2(chunk, 'phase') || (weekNum <= 8 ? 'Momentum' : weekNum <= 10 ? 'Embed' : 'Measure');
    const weekMilestone = extractFieldValuePart2(chunk, 'weekMilestone') || `Week ${weekNum} milestone achieved`;
    const tuesdayCheckIn = extractFieldValuePart2(chunk, 'tuesdayCheckIn') || 'How sustainable does this feel?';
    const tasks = extractTasksForWeekPart2(input, weekNum);

    weeks.push({ weekNumber: weekNum, theme, narrative, phase, tasks, weekMilestone, tuesdayCheckIn });
  }

  console.log(`[extractWeeksArrayPart2] Regex extraction: ${weeks.length} weeks found`);

  const seen = new Set<number>();
  return weeks
    .filter(w => { if (seen.has(w.weekNumber)) return false; seen.add(w.weekNumber); return true; })
    .sort((a, b) => a.weekNumber - b.weekNumber);
}

function extractFieldValuePart2(chunk: string, fieldName: string): string | null {
  const pattern = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
  const m = chunk.match(pattern);
  if (m) return m[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\\\\/g, '\\').trim();
  return null;
}

function findObjectStartPart2(input: string, fromPos: number): number {
  let depth = 0;
  for (let i = fromPos; i >= 0; i--) {
    if (input[i] === '}') depth++;
    if (input[i] === '{') { if (depth === 0) return i; depth--; }
  }
  return -1;
}

function findObjectEndPart2(input: string, fromPos: number): number {
  let depth = 0;
  for (let i = fromPos; i < input.length; i++) {
    if (input[i] === '{') depth++;
    if (input[i] === '}') { depth--; if (depth <= 0) return i; }
  }
  return input.length - 1;
}

function normaliseTasksPart2(tasks: any[], weekNum: number): any[] {
  if (!Array.isArray(tasks) || tasks.length === 0) return generateMinimalTasksPart2(weekNum);
  return tasks.map((t: any, i: number) => ({
    id: t.id || `w${weekNum}_t${i + 1}`,
    title: t.title || `Task ${i + 1}`,
    description: t.description || '',
    whyThisMatters: t.whyThisMatters || 'Sustains your transformation',
    category: t.category || 'operations',
    milestone: t.milestone || '',
    tools: t.tools || '',
    timeEstimate: t.timeEstimate || '1-2 hours',
    deliverable: t.deliverable || '',
    celebrationMoment: t.celebrationMoment || '',
    priority: t.priority || 'medium'
  }));
}

function extractTasksForWeekPart2(input: string, weekNum: number): any[] {
  const weekStart = input.indexOf(`"weekNumber": ${weekNum}`);
  if (weekStart === -1) return generateMinimalTasksPart2(weekNum);
  
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
      whyThisMatters: 'Sustains your transformation',
      timeEstimate: '2-3 hours'
    });
    count++;
  }
  
  return tasks.length > 0 ? tasks : generateMinimalTasksPart2(weekNum);
}

function extractTuesdayEvolutionPart2(input: string): any {
  try {
    const match = input.match(/"tuesdayEvolution"\s*:\s*\{([^}]+)\}/);
    if (match) {
      return JSON.parse('{' + match[1] + '}');
    }
  } catch (e) {}
  
  return {
    week8: "Transformation taking hold",
    week10: "New normal emerging",
    week12: "Foundation complete - ready for next level"
  };
}

function extractBackslidePreventions(input: string): any[] {
  try {
    const match = input.match(/"backslidePreventions"\s*:\s*\[([^\]]+)\]/);
    if (match) {
      return JSON.parse('[' + match[1] + ']');
    }
  } catch (e) {}
  
  return [
    { trigger: "Feeling overwhelmed", response: "Return to your North Star", reminder: "You've built the foundation" },
    { trigger: "Old patterns returning", response: "Review Week 1-2 wins", reminder: "You've proven you can change" }
  ];
}

function generateMinimalWeeksPart2(): any[] {
  return [7, 8, 9, 10, 11, 12].map(n => ({
    weekNumber: n,
    theme: n <= 8 ? 'Building Momentum' : n <= 10 ? 'Embedding Changes' : 'Measuring Success',
    phase: n <= 8 ? 'Momentum' : n <= 10 ? 'Embed' : 'Measure',
    narrative: `Week ${n} continues building on your transformation journey.`,
    tasks: generateMinimalTasksPart2(n),
    weekMilestone: `Complete Week ${n} objectives`,
    tuesdayCheckIn: 'How sustainable does this feel?'
  }));
}

function generateMinimalTasksPart2(weekNum: number): any[] {
  return [
    { id: `w${weekNum}_t1`, title: 'Primary focus task', description: 'Main task for this week', whyThisMatters: 'Key step forward', timeEstimate: '2 hours' },
    { id: `w${weekNum}_t2`, title: 'Supporting task', description: 'Supporting activity', whyThisMatters: 'Builds foundation', timeEstimate: '1 hour' },
    { id: `w${weekNum}_t3`, title: 'Review and refine', description: 'Assess progress and adjust', whyThisMatters: 'Ensures sustainability', timeEstimate: '30 mins' }
  ];
}

function buildSprintPrompt(ctx: any): string {
  const weeks1to6Summary = ctx.weeks1to6?.map((w: any) => 
    `Week ${w.weekNumber}: "${w.theme}" - ${w.tasks?.length || 0} tasks - Milestone: ${w.weekMilestone || 'Set'}`
  ).join('\n') || 'Weeks 1-6 completed';

  return `Create Weeks 7-12 of the transformation journey for ${ctx.userName} at ${ctx.companyName}.

## THE NORTH STAR
"${ctx.northStar}"

## CONTEXT FROM WEEKS 1-6 (already completed)

Sprint Theme: ${ctx.sprintTheme}
Sprint Promise: ${ctx.sprintPromise}

Progress Made:
${weeks1to6Summary}

Tuesday Evolution So Far:
- Week 0: ${ctx.tuesdayEvolutionPart1?.week0 || ctx.relationshipMirror || 'Starting point'}
- Week 2: ${ctx.tuesdayEvolutionPart1?.week2 || 'First signs of relief'}
- Week 4: ${ctx.tuesdayEvolutionPart1?.week4 || 'Building momentum'}
- Week 6: ${ctx.tuesdayEvolutionPart1?.week6 || 'Foundation in place'}

## THE 6-MONTH MILESTONES
${ctx.shiftMilestones?.map((m: any, i: number) => `
Milestone ${i + 1}: ${m.milestone}
- Target Month: ${m.targetMonth}
- Measurable: ${m.measurable || 'Progress indicator'}
`).join('\n') || 'Continue toward goals'}

## YEAR 1 DESTINATION
Headline: ${ctx.year1Milestone?.headline || 'The Reclamation'}
Emotional Shift: ${ctx.year1Milestone?.emotionalShift || 'From trapped to free'}

## THEIR DANGER ZONE (watch for this)
"${ctx.dangerZone}"

## THEIR CONSTRAINTS
Time: ${ctx.commitmentHours}
Team: ${ctx.teamSize}
Tools: ${ctx.toolsUsed?.join(', ') || 'Not specified'}
${(ctx.lifeCommitments?.length > 0) ? `
## LIFE DESIGN THREAD — NON-NEGOTIABLE

Life commitments for ${ctx.userName} (must appear as tasks in weeks 7-12):
${(ctx.lifeCommitments || []).map((c: any) => `- ${c.commitment} (${c.category}, ${c.frequency})`).join('\n')}

${ctx.quarterlyLifePriority ? `QUARTERLY LIFE PRIORITY: "${ctx.quarterlyLifePriority}"\n` : ''}
${ctx.enoughNumber ? `"ENOUGH" INCOME: £${ctx.enoughNumber}/month.\n` : ''}
TARGET WEEKLY HOURS: ${ctx.targetWeeklyHours}
Every week MUST include at least 1 life task (category: life_time, life_relationship, life_health, life_experience, life_identity). If over hours budget, cut BUSINESS tasks first, never life tasks.
` : ''}

---

## YOUR TASK: Create Weeks 7-12

Each week needs:
1. **Theme** - Max 6 words, emotionally resonant
2. **Narrative** - 2-3 sentences on WHY this week matters
3. **Tasks** - 3-4 tasks with "whyThisMatters"
4. **Week Milestone** - What's TRUE by Friday
5. **Tuesday Check-In** - Emotional progress question

Return this JSON:

{
  "phases": {
    "momentum": {
      "weeks": [7, 8],
      "theme": "Scaling what works",
      "emotionalGoal": "From 'this might work' to 'this IS working'"
    },
    "embed": {
      "weeks": [9, 10],
      "theme": "Locking in gains",
      "emotionalGoal": "From effort to habit"
    },
    "measure": {
      "weeks": [11, 12],
      "theme": "Assessing and planning",
      "emotionalGoal": "From uncertainty to clarity"
    }
  },
  
  "weeks": [
    {
      "weekNumber": 7,
      "theme": "The Revenue Visibility Dashboard",
      "phase": "Momentum",
      "narrative": "You've built the foundation. Now let's see what's working. This week is about getting clear visibility on the numbers that matter—because you can't scale what you can't see.",
      "tasks": [
        {
          "id": "w7_t1",
          "title": "Specific action title",
          "description": "2-3 sentences, step by step",
          "whyThisMatters": "Connection to their North Star or Year 1 goal",
          "category": "life_time | life_relationship | life_health | life_experience | life_identity | financial | operations | team | marketing | product | systems | strategy",
          "milestone": "Which 6-month milestone this serves",
          "tools": "Specific tools",
          "timeEstimate": "2 hours",
          "deliverable": "Tangible output",
          "celebrationMoment": "What to notice when done"
        }
      ],
      "weekMilestone": "By end of Week 7: [specific, measurable achievement]",
      "tuesdayCheckIn": "Do I feel [emotion]? Am I seeing [indicator]?"
    }
    // Weeks 8-12 follow same structure
  ],
  
  "tuesdayEvolution": {
    "week8": "Systems starting to run themselves - [specific change]",
    "week10": "New habits forming - [specific change]",
    "week12": "Approaching the vision: '${ctx.tuesdayTest?.substring(0, 50) || ctx.year1Milestone?.emotionalShift || 'their transformation'}...'"
  },
  
  "backslidePreventions": [
    {
      "trigger": "When ${ctx.dangerZone || 'old patterns emerge'}",
      "response": "Specific action to take",
      "reminder": "Why this matters - connection to North Star"
    }
  ],
  
  "nextSprintPreview": "Sprint 2 will build on this foundation by [specific next phase toward Year 1 milestone]"
}

## CRITICAL RULES

1. BUILD on weeks 1-6—don't repeat tasks
2. Every task needs "whyThisMatters" connecting to North Star
3. Week themes should feel like chapter titles, not project phases
4. Tuesday check-ins measure EMOTIONAL state
5. Backslide preventions must address their stated danger_zone
6. Week 12 should feel like an achievement AND a launchpad for Sprint 2
7. Use their exact words where possible`;
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
    return 'This addresses the immediate friction you described.';
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
