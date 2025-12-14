// ============================================================================
// GENERATE SIX-MONTH SHIFT
// ============================================================================
// Purpose: Create the bridge between where they are and Year 1
// This is the first chapter of their transformation, not a project plan
// 
// Key: Parse THEIR "six_month_shifts" answer into concrete milestones
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    console.log(`Generating 6-month shift for ${context.userName}...`);

    // Generate shift
    const shift = await generateShift(context);

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

async function generateShift(ctx: any): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  const prompt = buildShiftPrompt(ctx);

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
British English only (organise, colour, £).
Return ONLY valid JSON.`
        },
        { role: 'user', content: prompt }
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
