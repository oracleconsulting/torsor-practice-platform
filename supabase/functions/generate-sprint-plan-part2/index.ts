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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { clientId, practiceId } = await req.json();
    
    if (!clientId || !practiceId) {
      throw new Error('clientId and practiceId required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for existing stage
    const { data: existingStages } = await supabase
      .from('roadmap_stages')
      .select('version')
      .eq('client_id', clientId)
      .eq('stage_type', 'sprint_plan_part2')
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version + 1 
      : 1;

    console.log(`Creating sprint_plan_part2 stage with version ${nextVersion}`);

    const { data: stage, error: stageError } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: 'sprint_plan_part2',
        version: nextVersion,
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        model_used: 'anthropic/claude-sonnet-4.5'
      })
      .select()
      .single();

    if (stageError) throw stageError;

    // Fetch dependencies
    const { data: fitStage } = await supabase
      .from('roadmap_stages')
      .select('generated_content, approved_content')
      .eq('client_id', clientId)
      .eq('stage_type', 'fit_assessment')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: part1Stage } = await supabase
      .from('roadmap_stages')
      .select('generated_content, approved_content')
      .eq('client_id', clientId)
      .eq('stage_type', 'sprint_plan_part1')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: visionStage } = await supabase
      .from('roadmap_stages')
      .select('generated_content, approved_content')
      .eq('client_id', clientId)
      .eq('stage_type', 'five_year_vision')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: shiftStage } = await supabase
      .from('roadmap_stages')
      .select('generated_content, approved_content')
      .eq('client_id', clientId)
      .eq('stage_type', 'six_month_shift')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const fitProfile = fitStage?.approved_content || fitStage?.generated_content || {};
    const sprintPart1 = part1Stage?.approved_content || part1Stage?.generated_content;
    const vision = visionStage?.approved_content || visionStage?.generated_content;
    const shift = shiftStage?.approved_content || shiftStage?.generated_content;

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

    const { data: client } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();

    const context = buildSprintContext(part1Data, part2Data, client, fitProfile, vision, shift, sprintPart1);

    console.log(`Generating weeks 7-12 for ${context.userName}...`);

    const sprintPart2 = await generateSprintPart2(context);
    const completeSprint = mergeSprints(sprintPart1, sprintPart2);

    const duration = Date.now() - startTime;
    
    await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: completeSprint,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration
      })
      .eq('id', stage.id);

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

function buildSprintContext(part1: any, part2: any, client: any, fitProfile: any, vision: any, shift: any, sprintPart1: any) {
  return {
    userName: client?.name?.split(' ')[0] || part1.full_name?.split(' ')[0] || 'there',
    companyName: client?.client_company || part2.trading_name || part1.company_name || 'your business',
    
    // From fit profile
    northStar: fitProfile.northStar || vision?.northStar || '',
    archetype: fitProfile.archetype || 'balanced_achiever',
    
    // From vision
    year1Milestone: vision?.yearMilestones?.year1 || {},
    tuesdayTest: part1.tuesday_test || vision?.visualisation || '',
    
    // From shift
    shiftMilestones: shift?.keyMilestones || [],
    tuesdayEvolutionShift: shift?.tuesdayEvolution || {},
    
    // Sprint Part 1 context
    sprintTheme: sprintPart1.sprintTheme,
    sprintPromise: sprintPart1.sprintPromise,
    sprintGoals: sprintPart1.sprintGoals,
    phases: sprintPart1.phases,
    weeks1to6: sprintPart1.weeks,
    tuesdayEvolutionPart1: sprintPart1.tuesdayEvolution,
    
    // Their context
    dangerZone: part1.danger_zone || '',
    relationshipMirror: part1.relationship_mirror || '',
    commitmentHours: part1.commitment_hours || '10-15 hours',
    teamSize: part2.team_size || part2.staff_count || 'small team',
    toolsUsed: part2.tools_used || part2.current_tools || [],
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

async function generateSprintPart2(ctx: any): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  const prompt = buildSprintPrompt(ctx);

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
        max_tokens: 6000,
        temperature: 0.5,
        messages: [
          { 
            role: 'system', 
            content: `You complete transformation journeys, not task lists.
Weeks 7-12 build on weeks 1-6 progress. This is where the transformation becomes sustainable.
Every week has a narrative—WHY it matters.
Every task connects to their North Star.
British English only (organise, colour, £).
Return ONLY valid JSON.`
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
  
  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.warn('Initial JSON parse failed, attempting repair...');
    
    let fixedJson = jsonString;
    
    // 1. Fix trailing commas before } or ]
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    
    // 2. Fix missing commas between properties
    fixedJson = fixedJson.replace(/}(\s*){/g, '},{');
    fixedJson = fixedJson.replace(/](\s*)\[/g, '],[');
    fixedJson = fixedJson.replace(/"(\s*)"(\s*[a-zA-Z])/g, '","$2');
    
    // 3. Fix missing commas between array elements
    fixedJson = fixedJson.replace(/}(\s*)"/g, '},"');
    fixedJson = fixedJson.replace(/"(\s*){/g, '",{');
    
    // 4. Fix unescaped newlines in strings
    fixedJson = fixedJson.replace(/"([^"]*)\n([^"]*)"/g, (match, p1, p2) => {
      return `"${p1} ${p2}"`;
    });
    
    // 5. Fix control characters in strings
    fixedJson = fixedJson.replace(/[\x00-\x1F\x7F]/g, ' ');
    
    // 6. Close unclosed structures
    const openBraces = (fixedJson.match(/\{/g) || []).length;
    const closeBraces = (fixedJson.match(/\}/g) || []).length;
    const openBrackets = (fixedJson.match(/\[/g) || []).length;
    const closeBrackets = (fixedJson.match(/\]/g) || []).length;
    
    if (openBrackets > closeBrackets) {
      console.log(`Closing ${openBrackets - closeBrackets} unclosed brackets`);
      for (let i = 0; i < openBrackets - closeBrackets; i++) fixedJson += ']';
    }
    if (openBraces > closeBraces) {
      console.log(`Closing ${openBraces - closeBraces} unclosed braces`);
      for (let i = 0; i < openBraces - closeBraces; i++) fixedJson += '}';
    }
    
    try {
      const result = JSON.parse(fixedJson);
      console.log('JSON repair successful');
      return result;
    } catch (secondError) {
      console.error('JSON repair failed:', secondError);
      throw new Error(`Failed to parse sprint JSON after repair: ${secondError}`);
    }
  }
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
