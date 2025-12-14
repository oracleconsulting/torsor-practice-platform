// ============================================================================
// GENERATE SPRINT PLAN PART 1 (Weeks 1-6)
// ============================================================================
// Generates first half of sprint plan: Immediate Relief + Foundation + Implementation
// Model: Claude Sonnet 4.5
// Timeout budget: 60s
// Depends on: six_month_shift
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const QUALITY_RULES = `
## CRITICAL RULES

### 1. USE THEIR EXPLICIT ANSWERS
- "monday_frustration" → Address in Week 1-2
- "magic_away_task" → Eliminate early
- "ninety_day_priorities" → Must address at least 2 in Weeks 1-4
- "tools_used" → Use these tools in tasks

### 2. TASK SPECIFICITY
Every task MUST have:
- Specific action (not "improve marketing")
- Specific tool (from their list or recommended)
- Time estimate
- Deliverable (tangible output)
- Connection to 6-month milestone

### 3. NO FILLER WEEKS
- No "journal for 15 minutes" × 3
- Every week must have meaningful tasks
- No generic "review progress" tasks

### 4. BRITISH ENGLISH
- organise not organize
- colour not color
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
      .eq('stage_type', 'sprint_plan_part1')
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version + 1 
      : 1;

    console.log(`Creating sprint_plan_part1 stage with version ${nextVersion}`);

    // Create stage record
    const { data: stage, error: stageError } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: 'sprint_plan_part1',
        version: nextVersion,
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        model_used: 'anthropic/claude-sonnet-4.5'
      })
      .select()
      .single();

    if (stageError) throw stageError;

    // Fetch dependencies
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

    const vision = visionStage?.approved_content || visionStage?.generated_content;
    const shift = shiftStage?.approved_content || shiftStage?.generated_content;

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

    // Fetch client details
    const { data: client } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();

    // Build context
    const context = buildSprintContext(part1, part2, client, vision, shift);

    console.log(`Calling LLM for sprint_plan_part1 (weeks 1-6) generation (client: ${clientId})...`);

    // Generate sprint part 1
    const sprintPart1 = await generateSprintPart1(context);

    console.log(`LLM response received, updating stage record...`);

    // Update stage
    const duration = Date.now() - startTime;
    const { error: updateError } = await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: sprintPart1,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration
      })
      .eq('id', stage.id);

    if (updateError) {
      console.error('Failed to update stage record:', updateError);
      throw updateError;
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

function buildSprintContext(part1: any, part2: any, client: any, vision: any, shift: any) {
  return {
    userName: client?.name?.split(' ')[0] || 'there',
    companyName: client?.client_company || part2.trading_name || part1.company_name || 'your business',
    
    // Vision & Shift context
    northStar: vision.northStar,
    yearOneMilestone: vision.yearMilestones?.year1,
    shiftMilestones: shift.keyMilestones || [],
    
    // Their explicit answers
    mondayFrustration: part2.monday_frustration || part1.monday_frustration || '',
    magicAwayTask: part1.magic_away_task || '',
    ninetyDayPriorities: part2.ninety_day_priorities || part1.ninety_day_priorities || [],
    growthBottleneck: part2.growth_bottleneck || part1.growth_bottleneck || '',
    dangerZone: part1.danger_zone || '',
    relationshipMirror: part1.relationship_mirror || '',
    tuesdayTest: part1.tuesday_test || '',
    
    // Context
    commitmentHours: part1.commitment_hours || '10-15 hours',
    teamSize: part2.team_size || 'solo',
    toolsUsed: part2.tools_used || part2.current_tools || [],
  };
}

async function generateSprintPart1(ctx: any): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  const prompt = `Create Weeks 1-6 of a Sprint plan for ${ctx.userName} at ${ctx.companyName}.

## THE 6-MONTH MILESTONES (every task must connect to one)

${ctx.shiftMilestones.map((m: any, i: number) => `
Milestone ${i + 1}: ${m.milestone}
- Target Month: ${m.targetMonth}
- Measurable: ${m.measurable}
`).join('\n')}

## THEIR IMMEDIATE PROBLEMS (address in Weeks 1-4)

### Monday Frustration (Week 1-2):
"${ctx.mondayFrustration}"

### Magic Away Task (eliminate early):
"${ctx.magicAwayTask}"

### 90-Day Priorities (they selected these):
${ctx.ninetyDayPriorities?.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || 'Not specified'}

### Growth Bottleneck:
"${ctx.growthBottleneck}"

## THEIR TOOLS (use these in tasks)
${ctx.toolsUsed?.length > 0 ? ctx.toolsUsed.map((t: string) => `- ${t}`).join('\n') : '- No specific tools mentioned'}

## THEIR TIME BUDGET
Available: ${ctx.commitmentHours}
Team: ${ctx.teamSize}

## CONTEXT
- North Star: ${ctx.northStar}
- Year 1 Target: ${ctx.yearOneMilestone?.measurable || 'Not specified'}

## YOUR TASK: Generate ONLY Weeks 1-6

Create weeks 1-6 where:
- Weeks 1-2: "Immediate Relief" - address monday_frustration, magic_away_task
- Weeks 3-4: "Foundation" - build systems for growth_bottleneck
- Weeks 5-6: "Implementation" - execute changes

Return as JSON:

{
  "sprintTheme": "90 days to [their specific outcome]",
  "sprintPromise": "Transform from '${ctx.relationshipMirror}' to '[their tuesday_test outcome]'",
  "sprintGoals": [
    "${ctx.ninetyDayPriorities?.[0] || 'Address immediate pain points'}",
    "${ctx.ninetyDayPriorities?.[1] || 'Build foundation for growth'}",
    "Eliminate: ${ctx.magicAwayTask}"
  ],
  "phases": {
    "weeks1_2": { "name": "Immediate Relief", "purpose": "Address: '${ctx.mondayFrustration || ctx.magicAwayTask}'" },
    "weeks3_4": { "name": "Foundation", "purpose": "Build systems for: '${ctx.growthBottleneck}'" },
    "weeks5_6": { "name": "Implementation", "purpose": "Execute changes" }
  },
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Immediate Relief",
      "theme": "Week 1: [Specific action]",
      "focus": "Address: '${ctx.mondayFrustration?.substring(0, 50) || 'immediate pain'}'",
      "tasks": [
        {
          "id": "w1_t1",
          "title": "[SPECIFIC action]",
          "description": "[Step-by-step - 2-3 sentences]",
          "why": "Addresses your stated frustration",
          "category": "Operations|Financial|Team|Systems|Marketing|Product",
          "priority": "critical|high|medium",
          "estimatedHours": 2,
          "deliverable": "[Tangible output]",
          "enablesMilestone": "[6-month milestone name]"
        }
      ],
      "weekMilestone": "By end of Week 1: [specific outcome]"
    }
    // Continue for weeks 2-6
  ],
  "tuesdayEvolution": {
    "week0": "${ctx.relationshipMirror || 'Current state'}",
    "week4": "First signs of relief - [specific change]"
  }
}

Generate 3-4 tasks per week. Use British English.`;

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
        max_tokens: 6000,
        temperature: 0.4,
        messages: [
          { 
            role: 'system', 
            content: `Create sprint plans (weeks 1-6 only) with specific, actionable tasks. Return only valid JSON.
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
      console.error('JSON preview (around error):', fixedJson.substring(23300, 23500));
      throw new Error(`Failed to parse sprint JSON after repair: ${secondError}`);
    }
  }
}
