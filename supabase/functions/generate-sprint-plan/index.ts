// ============================================================================
// GENERATE SPRINT PLAN (12-Week Breakdown)
// ============================================================================
// Standalone function for sprint plan generation
// Model: Sonnet 4.5
// Timeout budget: 60s
// Depends on: six_month_shift
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
      .eq('stage_type', 'sprint_plan')
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version + 1 
      : 1;

    console.log(`Creating sprint_plan stage with version ${nextVersion}`);

    // Create stage record
    const { data: stage, error: stageError } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: 'sprint_plan',
        version: nextVersion,
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        model_used: 'anthropic/claude-sonnet-4'
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

    // Generate sprint
    const sprint = await generateSprint(context);

    // Update stage
    const duration = Date.now() - startTime;
    await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: sprint,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration
      })
      .eq('id', stage.id);

    return new Response(JSON.stringify({ success: true, stageId: stage.id, duration }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sprint generation error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

function buildSprintContext(part1: any, part2: any, client: any, vision: any, shift: any) {
  // Determine board members (simplified)
  const boardMembers = [
    { role: 'CEO', focus: 'Strategic direction' },
    { role: 'CFO', focus: 'Financial health' },
    { role: 'COO', focus: 'Operations efficiency' }
  ];

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
    threeExpertsNeeded: part2.three_experts_needed || part1.three_experts_needed || '',
    
    // Board members
    boardMembers
  };
}

// ============================================================================
// SPRINT GENERATOR
// ============================================================================

async function generateSprint(ctx: any): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  const prompt = `Create a 12-Week Sprint plan for ${ctx.userName} at ${ctx.companyName}.

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
${ctx.toolsUsed?.length > 0 ? ctx.toolsUsed.map((t: string) => `- ${t}`).join('\n') : '- No specific tools mentioned - recommend appropriate ones'}

## THEIR TIME BUDGET
Available: ${ctx.commitmentHours}
Team: ${ctx.teamSize}

## CONTEXT
- Business: ${ctx.companyName}
- North Star: ${ctx.northStar}
- Year 1 Target: ${ctx.yearOneMilestone?.measurable || 'Not specified'}

## YOUR TASK

Create 12 weeks of tasks where:
1. EVERY task connects to a 6-month milestone (specify which one)
2. Weeks 1-2 address their immediate pain (monday_frustration, magic_away_task)
3. Weeks 3-4 build foundation for their stated priorities
4. Weeks 5-8 implement changes
5. Weeks 9-12 embed and measure

Return as JSON:

{
  "sprintTheme": "90 days to [their specific outcome from tuesday_test]",
  
  "sprintPromise": "Transform from '${ctx.relationshipMirror}' to '[their tuesday_test outcome]'",
  
  "sprintGoals": [
    "${ctx.ninetyDayPriorities?.[0] || 'Address immediate pain points'}",
    "${ctx.ninetyDayPriorities?.[1] || 'Build foundation for growth'}",
    "Eliminate: ${ctx.magicAwayTask}"
  ],
  
  "phases": {
    "weeks1_2": { 
      "name": "Immediate Relief", 
      "purpose": "Address: '${ctx.mondayFrustration || ctx.magicAwayTask}'",
      "milestone": "[Which 6-month milestone this serves]"
    },
    "weeks3_4": { 
      "name": "Foundation", 
      "purpose": "Build systems for: '${ctx.growthBottleneck}'",
      "milestone": "[Which 6-month milestone this serves]"
    },
    "weeks5_6": { 
      "name": "Implementation", 
      "purpose": "Execute changes",
      "milestone": "[Which 6-month milestone this serves]"
    },
    "weeks7_8": { 
      "name": "Momentum", 
      "purpose": "Scale what works",
      "milestone": "[Which 6-month milestone this serves]"
    },
    "weeks9_10": { 
      "name": "Embed", 
      "purpose": "Lock in gains",
      "milestone": "[Which 6-month milestone this serves]"
    },
    "weeks11_12": { 
      "name": "Measure", 
      "purpose": "Assess and plan next sprint",
      "milestone": "[Which 6-month milestone this serves]"
    }
  },
  
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Immediate Relief",
      "theme": "Week 1: [Specific action addressing monday_frustration]",
      "focus": "Address: '${ctx.mondayFrustration?.substring(0, 50) || ctx.magicAwayTask?.substring(0, 50) || 'immediate pain'}'",
      "enablesMilestone": "[6-month milestone name]",
      "tasks": [
        {
          "id": "w1_t1",
          "title": "[SPECIFIC action with SPECIFIC tool]",
          "description": "[Step-by-step what to do - 2-3 sentences]",
          "why": "Addresses your stated frustration: '${ctx.mondayFrustration?.substring(0, 50) || ''}...'",
          "category": "Operations|Financial|Team|Systems|Marketing|Product",
          "priority": "critical|high|medium",
          "estimatedHours": 2,
          "tool": "[Specific tool from their list or recommendation]",
          "boardOwner": "${ctx.boardMembers[0]?.role}",
          "deliverable": "[Tangible output - document, system, decision]",
          "enablesMilestone": "[6-month milestone name]",
          "enablesVision": "[Which 5-year keyElement this builds toward]",
          "source": "Addresses your [question_name] response"
        }
      ],
      "weekMilestone": "By end of Week 1: [specific, verifiable outcome]",
      "checkIn": "Ask yourself: [question to evaluate success]"
    }
    // ... continue for weeks 2-12, each with 3-5 specific tasks
  ],
  
  "tuesdayEvolution": {
    "week0": "${ctx.relationshipMirror || 'Current Tuesday chaos'}",
    "week4": "First signs of relief - [specific change]",
    "week8": "New patterns forming - [specific change]",
    "week12": "Progress toward: '${ctx.tuesdayTest?.substring(0, 50) || 'your vision'}...'"
  },
  
  "backslidePreventions": [
    {
      "trigger": "${ctx.dangerZone}",
      "response": "If this happens, [specific action]",
      "source": "From your 'Danger Zone' response"
    }
  ],
  
  "nextSprintPreview": "Sprint 2 will build on this foundation to [next phase toward 6-month shift]"
}

## TASK QUALITY CHECKLIST

Before including any task, verify:
□ Has specific action (not "improve X")
□ Has specific tool
□ Has time estimate
□ Has tangible deliverable
□ Has milestone connection
□ Addresses something THEY mentioned
□ Uses British English`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor 365 Sprint'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      max_tokens: 16000, // Increased to handle large sprint plans
      temperature: 0.4,
      messages: [
        { 
          role: 'system', 
          content: `Create 12-week sprint plans with specific, actionable tasks. Every task must link to a milestone. Use their exact words. Return only valid JSON.
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
    throw new Error('Failed to parse sprint JSON: No JSON object found in response');
  }
  
  const jsonString = cleaned.substring(start, end + 1);
  
  // Check if JSON appears to be truncated (common when hitting token limits)
  const openBraces = (jsonString.match(/\{/g) || []).length;
  const closeBraces = (jsonString.match(/\}/g) || []).length;
  const openBrackets = (jsonString.match(/\[/g) || []).length;
  const closeBrackets = (jsonString.match(/\]/g) || []).length;
  
  if (openBraces > closeBraces || openBrackets > closeBrackets) {
    console.warn(`JSON appears incomplete: ${openBraces - closeBraces} unclosed braces, ${openBrackets - closeBrackets} unclosed brackets`);
    console.warn('This likely means the LLM response was truncated. Attempting to close incomplete structures...');
    
    // Try to close incomplete structures
    let fixedJson = jsonString;
    // Close any unclosed arrays first
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixedJson += ']';
    }
    // Close any unclosed objects
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixedJson += '}';
    }
    
    console.log('Attempting to parse fixed (closed) JSON...');
    try {
      return JSON.parse(fixedJson);
    } catch (fixError) {
      console.error('Failed to parse even after closing structures:', fixError);
      // Fall through to original error handling
    }
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('JSON string length:', jsonString.length);
    console.error('JSON string preview (first 500 chars):', jsonString.substring(0, 500));
    console.error('JSON string preview (last 500 chars):', jsonString.substring(Math.max(0, jsonString.length - 500)));
    
    // Try to find and fix common JSON issues
    let fixedJson = jsonString;
    
    // Fix trailing commas in arrays and objects
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    
    // Try parsing again
    try {
      return JSON.parse(fixedJson);
    } catch (secondError) {
      console.error('JSON parse error after fix attempt:', secondError);
      throw new Error(`Failed to parse sprint JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}. JSON length: ${jsonString.length}, Position: ${parseError instanceof SyntaxError && 'position' in parseError ? parseError.position : 'unknown'}`);
    }
  }
}


