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

// Inlined context enrichment (avoids "Module not found" when Dashboard deploys only index.ts).
// Canonical: supabase/functions/_shared/context-enrichment.ts
async function enrichRoadmapContext(supabase: SupabaseClient, clientId: string): Promise<{ promptContext: string; hasEnrichment?: boolean; sources?: { financial: boolean; systems: boolean; market: boolean; valueAnalysis: boolean; discovery: boolean } }> {
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

    const { data: assessmentMeta } = await supabase.from('client_assessments').select('metadata').eq('client_id', clientId).eq('assessment_type', 'part2').maybeSingle();
    if (assessmentMeta?.metadata?.adaptive) {
      console.log('[generate-sprint-plan-part1] Adaptive assessment — skipped sections:', assessmentMeta.metadata.skippedSections?.map((s: any) => s.sectionId).join(', '));
    }

    console.log(`Generating weeks 1-6 for ${context.userName}...`);

    const sprintPart1 = await generateSprintPart1(context, (enrichedContext?.promptContext || '') + advisorNotesBlock);

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
            content: `You create transformation journeys, not task lists.
Every week has a narrative—WHY it matters to their LIFE, not just business.
Every task connects to their North Star.
Use their exact words. Be specific to their situation.

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
    parsed = repairComplexJson(jsonString);
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
      description: `This is your life commitment, not a business task. ${recurring.measurable || ''}`,
      category: `life_${recurring.category}`,
      whyThisMatters: "You identified this as essential to the life you're building. The business exists to make this possible.",
      timeEstimate: '1 hour',
      deliverable: recurring.measurable || 'Honour this commitment.',
      celebrationMoment: 'Notice how it feels to honour this commitment to yourself.'
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
  const weeks: any[] = [];
  
  // Find each week object by looking for weekNumber patterns
  const weekPattern = /\{\s*"weekNumber"\s*:\s*(\d+)[^}]*?"theme"\s*:\s*"([^"]+)"[^}]*?"narrative"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/g;
  
  let match;
  while ((match = weekPattern.exec(input)) !== null) {
    const weekNum = parseInt(match[1]);
    if (weekNum >= 1 && weekNum <= 6) {
      weeks.push({
        weekNumber: weekNum,
        theme: match[2],
        narrative: match[3].replace(/\\"/g, '"').replace(/\\n/g, ' '),
        phase: weekNum <= 2 ? 'Immediate Relief' : weekNum <= 4 ? 'Foundation' : 'Implementation',
        tasks: extractTasksForWeek(input, weekNum),
        weekMilestone: extractStringAfterPattern(input, `week ${weekNum}`, 'weekMilestone') || `Week ${weekNum} milestone achieved`,
        tuesdayCheckIn: extractStringAfterPattern(input, `week ${weekNum}`, 'tuesdayCheckIn') || `How do I feel about progress?`
      });
    }
  }
  
  // Sort by week number and deduplicate
  const seen = new Set();
  return weeks
    .filter(w => {
      if (seen.has(w.weekNumber)) return false;
      seen.add(w.weekNumber);
      return true;
    })
    .sort((a, b) => a.weekNumber - b.weekNumber);
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
