// ============================================================================
// GENERATE SIX-MONTH SHIFT
// ============================================================================
// Purpose: Create the bridge between where they are and Year 1
// This is the first chapter of their transformation, not a project plan
// 
// Key: Parse THEIR "six_month_shifts" answer into concrete milestones
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inlined context enrichment (avoids "Module not found" when Dashboard deploys only index.ts).
// Canonical: supabase/functions/_shared/context-enrichment.ts
async function enrichRoadmapContext(supabase: SupabaseClient, clientId: string): Promise<{ promptContext: string }> {
  const log = (msg: string) => console.log(`[ContextEnrichment] ${msg}`);
  log(`Enriching context for client ${clientId}`);
  interface Fin { source: string; summary: string }
  interface Sys { source: string; stage: string; systemsCount: number; integrationScore: number | null; automationScore: number | null; painPoints: string[]; findings: Array<{ title: string; severity: string; category: string }>; manualHoursMonthly: number | null; summary: string }
  interface Mkt { source: string; industry: string | null; subSector: string | null; belowMedian: string[]; aboveMedian: string[]; opportunities: Array<{ area: string; potential: string }>; summary: string }
  interface VA { source: string; summary: string }
  interface Disc { responses: Record<string, unknown>; serviceScores: Record<string, number>; summary: string }
  const [financial, systems, market, valueAnalysis, discovery] = await Promise.all([
    (async (): Promise<Fin | null> => {
      try {
        const { data: d } = await supabase.from('client_financial_data').select('*').eq('client_id', clientId).order('period_end', { ascending: false }).limit(1).maybeSingle();
        if (d) { const rev = d.revenue ?? d.turnover; const s = rev ? `Revenue: £${(Number(rev) / 1000).toFixed(0)}k` : ''; const g = d.gross_margin != null ? `; Gross margin: ${(Number(d.gross_margin) * 100).toFixed(1)}%` : ''; return { source: 'uploaded_accounts', summary: (s + g || 'Uploaded accounts data.') + '.' }; }
        const { data: bm } = await supabase.from('bm_assessment_responses').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (bm) return { source: 'bm_assessment', summary: bm.revenue_numeric ? `Revenue: £${(bm.revenue_numeric / 1000).toFixed(0)}k` : 'BM assessment data.' };
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
        const { data: r } = await supabase.from('bm_reports').select('report_data').eq('client_id', clientId).in('status', ['generated', 'approved', 'published', 'delivered']).order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (!r?.report_data) return null;
        const d = r.report_data as Record<string, unknown>;
        const percentiles = (d.percentiles || d.rankings || {}) as Record<string, number>;
        const below: string[] = []; const above: string[] = [];
        for (const [k, v] of Object.entries(percentiles)) { if (typeof v === 'number') { if (v < 50) below.push(k); else above.push(k); } }
        const opps = ((d.opportunities as any[]) || []).slice(0, 5).map((o: any) => ({ area: o.area || o.title || '', potential: o.potential || o.value || '' }));
        return { source: 'bm_report', industry: (d.industry as string) ?? null, subSector: (d.classification as any)?.sub_sector ?? null, belowMedian: below, aboveMedian: above, opportunities: opps, summary: `Industry: ${(d.industry as string) || 'N/A'}; below median: ${below.join(', ') || 'none'}.` };
      } catch (e) { console.warn('[ContextEnrichment] Market failed', e); return null; }
    })(),
    (async (): Promise<VA | null> => {
      try {
        const { data: bm } = await supabase.from('bm_reports').select('value_analysis').eq('client_id', clientId).not('value_analysis', 'is', null).order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (!bm?.value_analysis) return null;
        const va = bm.value_analysis as any;
        const s = `Exit readiness: ${va.exitReadinessScore?.overall ?? va.exitReadiness?.score ?? 'N/A'}; hidden assets: ${(va.hiddenAssets || []).length}.`;
        return { source: 'bm_report', summary: s };
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
  return { promptContext };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { clientId, practiceId } = await req.json();
    
    if (!clientId || !practiceId) {
      throw new Error('clientId and practiceId required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for existing stage record
    const { data: existingStages } = await supabase
      .from('roadmap_stages')
      .select('version')
      .eq('client_id', clientId)
      .eq('stage_type', 'six_month_shift')
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version + 1 
      : 1;

    console.log(`Creating six_month_shift stage with version ${nextVersion}`);

    // Create stage record
    const { data: stage, error: stageError } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: 'six_month_shift',
        version: nextVersion,
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        model_used: 'anthropic/claude-sonnet-4.5'
      })
      .select()
      .single();

    if (stageError) throw stageError;

    // Fetch vision (dependency)
    const { data: visionStage } = await supabase
      .from('roadmap_stages')
      .select('generated_content, approved_content')
      .eq('client_id', clientId)
      .eq('stage_type', 'five_year_vision')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const vision = visionStage?.approved_content || visionStage?.generated_content;
    if (!vision) throw new Error('Vision not found - cannot generate shift');

    // Fetch fit profile for North Star and archetype
    const { data: fitStage } = await supabase
      .from('roadmap_stages')
      .select('generated_content, approved_content')
      .eq('client_id', clientId)
      .eq('stage_type', 'fit_assessment')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const fitProfile = fitStage?.approved_content || fitStage?.generated_content || {};

    // Fetch assessment data
    const { data: assessments } = await supabase
      .from('client_assessments')
      .select('assessment_type, responses')
      .eq('client_id', clientId)
      .in('assessment_type', ['part1', 'part2']);

    const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
    const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};

    // Fetch client details
    const { data: client } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();

    // Fetch financial context if available
    const { data: financialContext } = await supabase
      .from('client_context')
      .select('content')
      .eq('client_id', clientId)
      .eq('data_source_type', 'accounts')
      .limit(1)
      .maybeSingle();

    // Build context
    const context = buildShiftContext(part1, part2, client, vision, fitProfile, financialContext);

    let enrichedContext: Awaited<ReturnType<typeof enrichRoadmapContext>> | null = null;
    try {
      enrichedContext = await enrichRoadmapContext(supabase, clientId);
      if (enrichedContext?.hasEnrichment) console.log('[generate-six-month-shift] Cross-service enrichment available');
    } catch (err) {
      console.warn('[generate-six-month-shift] Enrichment not available:', err);
    }
    const { data: assessmentMeta } = await supabase.from('client_assessments').select('metadata').eq('client_id', clientId).eq('assessment_type', 'part2').maybeSingle();
    if (assessmentMeta?.metadata?.adaptive) {
      console.log('[generate-six-month-shift] Adaptive assessment — skipped sections:', assessmentMeta.metadata.skippedSections?.map((s: any) => s.sectionId).join(', '));
    }

    console.log(`Generating 6-month shift for ${context.userName}...`);

    // Generate shift (with optional enrichment)
    const shift = await generateShift(context, enrichedContext?.promptContext || '');

    const duration = Date.now() - startTime;

    // Update stage
    const { error: updateError } = await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: shift,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration
      })
      .eq('id', stage.id);

    if (updateError) {
      console.error('Failed to update stage record:', updateError);
      throw updateError;
    }

    console.log(`Six month shift generated for client ${clientId} in ${duration}ms`);

    return new Response(JSON.stringify({ 
      success: true, 
      stageId: stage.id, 
      duration,
      preview: {
        shiftStatement: shift.shiftStatement?.substring(0, 100) + '...',
        milestoneCount: shift.keyMilestones?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Shift generation error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

function buildShiftContext(part1: any, part2: any, client: any, vision: any, fitProfile: any, financialContext: any) {
  return {
    userName: client?.name?.split(' ')[0] || part1.full_name?.split(' ')[0] || 'there',
    companyName: client?.client_company || part2.trading_name || part1.company_name || 'your business',
    
    // From fit profile
    northStar: fitProfile.northStar || vision.northStar || '',
    archetype: fitProfile.archetype || 'balanced_achiever',
    
    // From vision
    year1Milestone: vision.yearMilestones?.year1 || {},
    tagline: vision.tagline || '',
    
    // CRITICAL: Their explicit 6-month answer
    sixMonthShifts: part2.six_month_shifts || part2.sixMonthShifts || part1.six_month_shifts || '',
    
    // Their current state
    currentWorkingHours: part2.current_working_hours || part1.working_hours || '50',
    targetWorkingHours: part2.target_working_hours || part1.ideal_working_hours || '20',
    relationshipMirror: part1.relationship_mirror || '',
    
    // Their pain points
    mondayFrustration: part2.monday_frustration || part1.monday_frustration || '',
    growthBottleneck: part2.growth_bottleneck || part1.growth_bottleneck || '',
    magicAwayTask: part1.magic_away_task || '',
    dangerZone: part1.danger_zone || '',
    emergencyLog: part1.emergency_log || '',
    
    // Their priorities
    ninetyDayPriorities: part2.ninety_day_priorities || part1.ninety_day_priorities || [],
    
    // Context
    commitmentHours: part1.commitment_hours || '10-15 hours',
    teamSize: part2.team_size || part2.staff_count || 'small team',
    toolsUsed: part2.tools_used || part2.current_tools || [],
    
    // Financial context
    financialSummary: financialContext?.content || null
  };
}

// ============================================================================
// SHIFT GENERATOR
// ============================================================================

async function generateShift(ctx: any, enrichmentBlock = ''): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  const fullPrompt = buildShiftPrompt(ctx) + enrichmentBlock;

  console.log('Calling LLM for 6-month shift...');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor 365 Shift'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      max_tokens: 4000,
      temperature: 0.6,
      messages: [
        { 
          role: 'system', 
          content: `You create the bridge between where someone is now and their Year 1 milestone.
This is not a project plan—it's the first chapter of their transformation.
Parse THEIR "six_month_shifts" answer into concrete milestones. Don't invent things they didn't ask for.
Use their exact words. Be specific to their situation.

ANTI-AI-SLOP RULES:
BANNED: Additionally, delve, crucial, pivotal, testament, underscores, showcases, fostering, tapestry, landscape, synergy, leverage, scalable, holistic, impactful, ecosystem
BANNED STRUCTURES: "Not only X but also Y", "It's important to note", "In summary", rule of three lists, "-ing" phrase endings
THE TEST: If it sounds corporate, rewrite it. Sound like a human advisor.

British English only (organise, colour, £). Return ONLY valid JSON.`
        },
        { role: 'user', content: fullPrompt }
      ]
    })
  });

  console.log(`OpenRouter response status: ${response.status}`);

  if (!response.ok) {
    const error = await response.text();
    console.error(`LLM API error: ${response.status} - ${error}`);
    throw new Error(`LLM error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  console.log(`LLM response length: ${content.length} characters`);
  
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error('Failed to parse shift JSON - no JSON object found');
  }
  
  try {
  return JSON.parse(cleaned.substring(start, end + 1));
  } catch (parseError) {
    console.error('JSON parse error, attempting repair...');
    let fixedJson = cleaned.substring(start, end + 1);
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(fixedJson);
  }
}

function buildShiftPrompt(ctx: any): string {
  return `Create a 6-Month Shift plan for ${ctx.userName} at ${ctx.companyName}.

## THE GAP TO BRIDGE

From: ${ctx.currentWorkingHours} hours/week → To: Year 1 target
From: "${ctx.mondayFrustration || 'Current frustrations'}" → To: "${ctx.year1Milestone?.emotionalShift || 'Year 1 relief'}"
From: "${ctx.relationshipMirror || 'Current relationship with business'}" → To: Year 1 reality

## THEIR OWN ANSWER (THIS IS GOLD - USE IT)

When asked "What needs to shift in the next 6 months?", they said:
"${ctx.sixMonthShifts}"

This is your source material. Parse it. Don't invent—refine.

## THE VISION WE'RE BUILDING TOWARD

North Star: "${ctx.northStar}"
Year 1 Headline: "${ctx.year1Milestone?.headline || 'The Reclamation'}"
Year 1 Emotional Shift: "${ctx.year1Milestone?.emotionalShift || ''}"
Archetype: ${ctx.archetype}

## THEIR PAIN POINTS (use these words)

Monday frustration: "${ctx.mondayFrustration}"
Growth bottleneck: "${ctx.growthBottleneck}"
What they'd magic away: "${ctx.magicAwayTask}"
Emergency log: "${ctx.emergencyLog}"
Danger zone: "${ctx.dangerZone}"

## THEIR CONSTRAINTS

Time available: ${ctx.commitmentHours}
Team: ${ctx.teamSize}
Tools they use: ${ctx.toolsUsed?.join(', ') || 'Not specified'}

## 90-DAY PRIORITIES (what they selected)
${ctx.ninetyDayPriorities?.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || 'Not specified'}

${ctx.financialSummary ? `
## FINANCIAL CONTEXT (from their accounts)
${ctx.financialSummary}

If this shows problems (e.g., profit dropping, margin compression), address it in the plan.
` : ''}

---

## YOUR TASK

Return this JSON structure:

{
  "shiftStatement": "2-3 sentences. Transform their six_month_shifts answer into a vivid statement of what's TRUE at Month 6. Not what they'll DO—what will be TRUE. Example: 'In 6 months, ${ctx.companyName} has documented processes, a trained team that can operate independently, and the foundation for a GM—so ${ctx.userName} is no longer the only person who can fix everything.'",
  
  "keyMilestones": [
    {
      "milestone": "PARSE FROM THEIR six_month_shifts ANSWER - element 1",
      "description": "What this specifically means for ${ctx.companyName}",
      "measurable": "Concrete, verifiable outcome",
      "targetMonth": 2,
      "whyItMatters": "Connection to their north star or immediate pain"
    },
    {
      "milestone": "PARSE FROM THEIR ANSWER - element 2",
      "description": "What this specifically means",
      "measurable": "Concrete outcome",
      "targetMonth": 4,
      "whyItMatters": "Connection to their goals"
    },
    {
      "milestone": "PARSE FROM THEIR ANSWER - element 3",
      "description": "What this means",
      "measurable": "Concrete outcome",
      "targetMonth": 6,
      "whyItMatters": "Sets up Year 1"
    }
  ],
  
  "gapAnalysis": [
    {
      "category": "Work Pattern",
      "current": "What's true now (from their answers)",
      "month6": "What's true at month 6",
      "bridgeAction": "How we get there"
    },
    {
      "category": "Systems & Processes",
      "current": "Current state",
      "month6": "Target state",
      "bridgeAction": "Key action"
    },
    {
      "category": "Team & Delegation",
      "current": "Current state",
      "month6": "Target state",
      "bridgeAction": "Key action"
    }
  ],
  
  "risks": [
    {
      "risk": "${ctx.dangerZone || 'Reverting to old patterns'}",
      "mitigation": "Specific strategy to prevent this",
      "earlyWarning": "Sign that this is happening"
    }
  ],
  
  "quickWins": [
    {
      "timing": "This Week",
      "win": "Something achievable related to their magic_away_task: '${ctx.magicAwayTask}'",
      "impact": "Why this matters emotionally—what it proves is possible"
    },
    {
      "timing": "Month 1",
      "win": "First visible progress on their stated shifts",
      "impact": "The emotional payoff"
    }
  ],
  
  "tuesdayEvolution": {
    "month1": "How their Tuesday looks in Month 1—still fighting fires but [first sign of change]",
    "month3": "Month 3—[breathing room appearing, specific improvement]",
    "month6": "Month 6—[approaching the Year 1 vision, specific freedom gained]"
  },
  
  ${ctx.financialSummary ? `"financialRealityCheck": {
    "insight": "Key finding from their accounts",
    "implication": "What this means for the 6-month plan",
    "action": "Specific action to address it"
  },` : ''}
  
  "connectionToVision": "One paragraph: How completing this 6-month shift moves ${ctx.userName} toward their North Star: '${ctx.northStar}'"
}

## CRITICAL RULES

1. Their "six_month_shifts" answer IS your source for milestones—parse it, don't invent
2. If they said "more staff, better processes, a GM"—those become your 3 milestones
3. Every milestone needs a measurable target
4. The Tuesday Evolution shows EMOTIONAL progress, not just business metrics
5. Quick wins MUST connect to their magic_away_task specifically
6. Risk mitigation must address their stated danger_zone
7. If financial data shows a problem, include financialRealityCheck
8. Use their exact words wherever possible`;
}
