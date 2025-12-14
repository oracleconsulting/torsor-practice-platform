// ============================================================================
// GENERATE SPRINT PLAN PART 2 (Weeks 7-12)
// ============================================================================
// Generates second half of sprint plan: Momentum + Embed + Measure
// Model: Claude Sonnet 4.5
// Timeout budget: 60s
// Depends on: sprint_plan_part1
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const QUALITY_RULES = `
## CRITICAL RULES

### 1. CONTINUATION
- Build on Weeks 1-6 progress
- Reference completed milestones
- Avoid repeating tasks from Part 1

### 2. TASK SPECIFICITY
Every task MUST have:
- Specific action (not "improve marketing")
- Time estimate
- Deliverable (tangible output)
- Connection to 6-month milestone

### 3. NO FILLER WEEKS
- Every week must have meaningful tasks
- No generic "review progress" tasks

### 4. BRITISH ENGLISH
- organise not organize
- £ not $

### 5. LINK TO MILESTONES
Every task must show which 6-month milestone it enables.
`;

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
      .eq('stage_type', 'sprint_plan_part2')
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version + 1 
      : 1;

    console.log(`Creating sprint_plan_part2 stage with version ${nextVersion}`);

    // Create stage record
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

    // Fetch dependencies - need part1, vision, and shift
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

    // Fetch client details
    const { data: client } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();

    // Build context
    const context = buildSprintContext(part1Data, part2Data, client, vision, shift, sprintPart1);

    console.log(`Calling LLM for sprint_plan_part2 (weeks 7-12) generation (client: ${clientId})...`);

    // Generate sprint part 2
    const sprintPart2 = await generateSprintPart2(context);

    // Merge with part 1 to create complete sprint plan
    const completeSprint = mergeSprints(sprintPart1, sprintPart2);

    console.log(`LLM response received, updating stage record...`);

    // Update stage with merged result
    const duration = Date.now() - startTime;
    const { error: updateError } = await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: completeSprint,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration
      })
      .eq('id', stage.id);

    if (updateError) {
      console.error('Failed to update stage record:', updateError);
      throw updateError;
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

function buildSprintContext(part1: any, part2: any, client: any, vision: any, shift: any, sprintPart1: any) {
  return {
    userName: client?.name?.split(' ')[0] || 'there',
    companyName: client?.client_company || part2.trading_name || part1.company_name || 'your business',
    
    // Vision & Shift context
    northStar: vision?.northStar,
    yearOneMilestone: vision?.yearMilestones?.year1,
    shiftMilestones: shift?.keyMilestones || [],
    
    // Sprint Part 1 context (what's already been planned)
    sprintTheme: sprintPart1.sprintTheme,
    sprintGoals: sprintPart1.sprintGoals,
    phases: sprintPart1.phases,
    weeks1to6: sprintPart1.weeks,
    tuesdayEvolutionSoFar: sprintPart1.tuesdayEvolution,
    
    // Their answers for context
    dangerZone: part1.danger_zone || '',
    relationshipMirror: part1.relationship_mirror || '',
    tuesdayTest: part1.tuesday_test || '',
    commitmentHours: part1.commitment_hours || '10-15 hours',
    teamSize: part2.team_size || 'solo',
  };
}

function mergeSprints(part1: any, part2: any): any {
  // Combine the weeks arrays
  const allWeeks = [...(part1.weeks || []), ...(part2.weeks || [])];
  
  // Merge phases
  const mergedPhases = {
    ...part1.phases,
    ...part2.phases
  };
  
  // Merge tuesday evolution
  const mergedTuesdayEvolution = {
    ...part1.tuesdayEvolution,
    ...part2.tuesdayEvolution
  };
  
  return {
    sprintTheme: part1.sprintTheme,
    sprintPromise: part1.sprintPromise,
    sprintGoals: part1.sprintGoals,
    phases: mergedPhases,
    weeks: allWeeks,
    tuesdayEvolution: mergedTuesdayEvolution,
    backslidePreventions: part2.backslidePreventions || [],
    nextSprintPreview: part2.nextSprintPreview || 'Sprint 2 will build on this foundation'
  };
}

async function generateSprintPart2(ctx: any): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  // Summarize weeks 1-6 for context
  const weeks1to6Summary = ctx.weeks1to6?.map((w: any) => 
    `Week ${w.weekNumber} (${w.phase}): ${w.theme} - ${w.tasks?.length || 0} tasks`
  ).join('\n') || 'Weeks 1-6 planned';
  
  const prompt = `Create Weeks 7-12 of a Sprint plan for ${ctx.userName} at ${ctx.companyName}.

## CONTEXT FROM WEEKS 1-6 (already generated)

Sprint Theme: ${ctx.sprintTheme}
Goals: ${ctx.sprintGoals?.join(', ')}

What's been covered:
${weeks1to6Summary}

Tuesday Evolution so far:
- Week 0: ${ctx.tuesdayEvolutionSoFar?.week0}
- Week 4: ${ctx.tuesdayEvolutionSoFar?.week4}

## THE 6-MONTH MILESTONES

${ctx.shiftMilestones?.map((m: any, i: number) => `
Milestone ${i + 1}: ${m.milestone}
- Target Month: ${m.targetMonth}
`).join('\n') || 'Continue toward goals'}

## THEIR TIME BUDGET
Available: ${ctx.commitmentHours}
Team: ${ctx.teamSize}

## YOUR TASK: Generate ONLY Weeks 7-12

Create weeks 7-12 where:
- Weeks 7-8: "Momentum" - Scale what works from weeks 1-6
- Weeks 9-10: "Embed" - Lock in gains, create habits
- Weeks 11-12: "Measure" - Assess progress, plan next sprint

Return as JSON:

{
  "phases": {
    "weeks7_8": { "name": "Momentum", "purpose": "Scale what works" },
    "weeks9_10": { "name": "Embed", "purpose": "Lock in gains" },
    "weeks11_12": { "name": "Measure", "purpose": "Assess and plan next sprint" }
  },
  "weeks": [
    {
      "weekNumber": 7,
      "phase": "Momentum",
      "theme": "Week 7: [Specific action building on weeks 1-6]",
      "focus": "Scale successful changes",
      "tasks": [
        {
          "id": "w7_t1",
          "title": "[SPECIFIC action]",
          "description": "[Step-by-step - 2-3 sentences]",
          "why": "Builds on weeks 1-6 progress",
          "category": "Operations|Financial|Team|Systems|Marketing|Product",
          "priority": "high|medium",
          "estimatedHours": 2,
          "deliverable": "[Tangible output]",
          "enablesMilestone": "[6-month milestone name]"
        }
      ],
      "weekMilestone": "By end of Week 7: [specific outcome]"
    }
    // Continue for weeks 8-12
  ],
  "tuesdayEvolution": {
    "week8": "New patterns forming - [specific change]",
    "week12": "Progress toward: '${ctx.tuesdayTest?.substring(0, 50) || 'your vision'}...'"
  },
  "backslidePreventions": [
    {
      "trigger": "${ctx.dangerZone}",
      "response": "If this happens, [specific action]"
    }
  ],
  "nextSprintPreview": "Sprint 2 will build on this foundation to [next phase]"
}

Generate 3-4 tasks per week. Use British English. Don't repeat tasks from weeks 1-6.`;

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
        temperature: 0.4,
        messages: [
          { 
            role: 'system', 
            content: `Create sprint plans (weeks 7-12 only) continuing from weeks 1-6. Return only valid JSON.
${QUALITY_RULES}`
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
      console.error(`OpenRouter error response: ${error}`);
      throw new Error(`LLM error: ${response.status} - ${error}`);
    }

    data = await response.json();
    console.log(`OpenRouter response received, content length: ${data.choices?.[0]?.message?.content?.length || 0} chars`);
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    if (fetchError.name === 'AbortError') {
      throw new Error('OpenRouter request timed out after 50 seconds');
    }
    console.error('Fetch error:', fetchError);
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
  
  // Try to parse as-is first
  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    // This is expected - LLMs often produce slightly malformed JSON
    console.warn('Initial JSON parse failed (will attempt repair):', parseError);
    console.log('Attempting JSON repair...');
    
    // Apply fixes in sequence
    let fixedJson = jsonString;
    
    // 1. Fix trailing commas before } or ]
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    
    // 2. Fix missing commas between elements (common LLM issue)
    fixedJson = fixedJson.replace(/}(\s*){/g, '},{');
    fixedJson = fixedJson.replace(/](\s*)\[/g, '],[');
    fixedJson = fixedJson.replace(/"(\s*)"/g, '","');
    
    // 3. Fix unclosed structures
    const openBraces = (fixedJson.match(/\{/g) || []).length;
    const closeBraces = (fixedJson.match(/\}/g) || []).length;
    const openBrackets = (fixedJson.match(/\[/g) || []).length;
    const closeBrackets = (fixedJson.match(/\]/g) || []).length;
    
    if (openBrackets > closeBrackets) {
      console.log(`Closing ${openBrackets - closeBrackets} unclosed brackets`);
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += ']';
      }
    }
    if (openBraces > closeBraces) {
      console.log(`Closing ${openBraces - closeBraces} unclosed braces`);
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += '}';
      }
    }
    
    // 4. Try to parse fixed JSON
    try {
      const result = JSON.parse(fixedJson);
      console.log('JSON repair successful');
      return result;
    } catch (secondError) {
      console.error('JSON repair failed:', secondError);
      console.error('JSON preview (first 500):', fixedJson.substring(0, 500));
      throw new Error(`Failed to parse sprint JSON after repair: ${secondError}`);
    }
  }
}
