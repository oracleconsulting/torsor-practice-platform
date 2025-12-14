// ============================================================================
// GENERATE SIX-MONTH SHIFT
// ============================================================================
// Standalone function for 6-month shift generation
// Model: Sonnet 4.5
// Timeout budget: 60s
// Depends on: five_year_vision
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// QUALITY RULES
// ============================================================================

const QUALITY_RULES = `
## CRITICAL RULES

### 1. USE THEIR EXPLICIT ANSWERS
- "six_month_shifts" → This IS what they want in 6 months
- Parse their answer and create milestones from it
- DO NOT add milestones they didn't ask for

### 2. NO INVENTED STATISTICS
Every claim needs a source (DIRECT_QUOTE, ASSESSMENT_RESPONSE, CALCULATED, FINANCIAL_DATA)

### 3. BRITISH ENGLISH
- organise not organize
- colour not color
- £ not $

### 4. CONCRETE MILESTONES
Each milestone must have:
- Specific target month
- Measurable outcome
- Connection to their stated need
`;

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

    // Check for existing stage record to determine version
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
        model_used: 'anthropic/claude-sonnet-4-20250514'
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

    // Use approved content if available, otherwise generated
    const vision = visionStage?.approved_content || visionStage?.generated_content;
    if (!vision) throw new Error('Vision not found - cannot generate shift');

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

    // Build context
    const context = buildShiftContext(part1, part2, client, vision);

    // Generate shift
    const shift = await generateShift(context);

    // Update stage
    const duration = Date.now() - startTime;
    await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: shift,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration
      })
      .eq('id', stage.id);

    return new Response(JSON.stringify({ success: true, stageId: stage.id, duration }), {
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

function buildShiftContext(part1: any, part2: any, client: any, vision: any) {
  return {
    userName: client?.name?.split(' ')[0] || 'there',
    companyName: client?.client_company || part2.trading_name || part1.company_name || 'your business',
    
    // Vision context
    northStar: vision.northStar,
    yearOneMilestone: vision.yearMilestones?.year1,
    
    // CRITICAL: Their explicit 6-month answer
    sixMonthShifts: part2.six_month_shifts || part2.sixMonthShifts || '',
    
    // Their priorities
    ninetyDayPriorities: part2.ninety_day_priorities || part1.ninety_day_priorities || [],
    growthBottleneck: part2.growth_bottleneck || part1.growth_bottleneck || '',
    magicAwayTask: part1.magic_away_task || '',
    mondayFrustration: part2.monday_frustration || part1.monday_frustration || '',
    dangerZone: part1.danger_zone || '',
    
    // Context
    commitmentHours: part1.commitment_hours || '10-15 hours',
    teamSize: part2.team_size || 'solo',
    toolsUsed: part2.tools_used || part2.current_tools || []
  };
}

// ============================================================================
// SHIFT GENERATOR
// ============================================================================

async function generateShift(ctx: any): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  const prompt = `Create a 6-Month Shift plan for ${ctx.userName} at ${ctx.companyName}.

## CRITICAL: THEY ALREADY TOLD YOU WHAT THEY WANT

### Their "Six Month Shifts" Answer:
"${ctx.sixMonthShifts}"

This is what THEY said they need in 6 months. Your milestones MUST be based on this.

### Their North Star:
${ctx.northStar}

### Year 1 Milestone:
${JSON.stringify(ctx.yearOneMilestone)}

### Their Stated Problems:
- Growth Bottleneck: "${ctx.growthBottleneck}"
- Monday Frustration: "${ctx.mondayFrustration}"
- Magic Away Task: "${ctx.magicAwayTask}"
- Danger Zone: "${ctx.dangerZone}"

### Their 90-Day Priorities:
${ctx.ninetyDayPriorities?.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || 'Not specified'}

### Their Available Time:
${ctx.commitmentHours}

## YOUR TASK

Parse their "six_month_shifts" answer and create CONCRETE milestones from it.

Example: If they said "more staff, better processes and training, a GM":
- Milestone 1: Processes documented (month 2)
- Milestone 2: Team trained to deliver without oversight (month 4)
- Milestone 3: GM role defined and recruiting (month 6)

DO NOT add milestones they didn't ask for (no SEO, no marketing unless they mentioned it).

Return as JSON:

{
  "shiftStatement": "One sentence: what is TRUE in 6 months that isn't true today. Based directly on their sixMonthShifts answer.",
  
  "keyMilestones": [
    {
      "milestone": "[Directly from their answer - element 1]",
      "description": "What this means for their specific business",
      "measurable": "Concrete, verifiable target",
      "targetMonth": 2,
      "source": "From their 'Six Month Shifts' response"
    },
    {
      "milestone": "[Directly from their answer - element 2]",
      "description": "What this means specifically",
      "measurable": "Concrete target",
      "targetMonth": 4,
      "source": "From their 'Six Month Shifts' response"
    },
    {
      "milestone": "[Directly from their answer - element 3]",
      "description": "What this means specifically",
      "targetMonth": 6,
      "source": "From their 'Six Month Shifts' response"
    }
  ],
  
  "gapAnalysis": {
    "current": {
      "work": "[From their relationship_mirror if available]",
      "systems": "[From their tools and operational context]",
      "team": "[From their team context]"
    },
    "sixMonths": {
      "work": "[Based on their stated shifts]",
      "systems": "[What's systematised]",
      "team": "[Based on their needs]"
    }
  },
  
  "risks": [
    {
      "risk": "${ctx.dangerZone}",
      "mitigation": "How the plan addresses this",
      "source": "From their Danger Zone response"
    }
  ],
  
  "quickWins": [
    "Something achievable THIS WEEK related to their magic_away_task",
    "Something achievable in first month"
  ],
  
  "connectionToVision": "How completing this shift moves toward: ${ctx.northStar}"
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor 365 Shift'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.4,
      messages: [
        { 
          role: 'system', 
          content: `Create milestone-based 6-month plans. Use their exact words. No invented recommendations. Return only valid JSON.
${QUALITY_RULES}`
        },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error('Failed to parse shift JSON');
  }
  
  return JSON.parse(cleaned.substring(start, end + 1));
}


