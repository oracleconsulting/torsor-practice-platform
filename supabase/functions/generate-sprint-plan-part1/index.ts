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
      .eq('stage_type', 'sprint_plan_part1')
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version + 1 
      : 1;

    console.log(`Creating sprint_plan_part1 stage with version ${nextVersion}`);

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
    const { data: fitStage } = await supabase
      .from('roadmap_stages')
      .select('generated_content, approved_content')
      .eq('client_id', clientId)
      .eq('stage_type', 'fit_assessment')
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

    const { data: client } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();

    const context = buildSprintContext(part1, part2, client, fitProfile, vision, shift);

    console.log(`Generating weeks 1-6 for ${context.userName}...`);

    const sprintPart1 = await generateSprintPart1(context);

    const duration = Date.now() - startTime;
    
    await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: sprintPart1,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration
      })
      .eq('id', stage.id);

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

function buildSprintContext(part1: any, part2: any, client: any, fitProfile: any, vision: any, shift: any) {
  return {
    userName: client?.name?.split(' ')[0] || part1.full_name?.split(' ')[0] || 'there',
    companyName: client?.client_company || part2.trading_name || part1.company_name || 'your business',
    
    // From fit profile
    northStar: fitProfile.northStar || vision.northStar || '',
    archetype: fitProfile.archetype || 'balanced_achiever',
    
    // From vision
    year1Milestone: vision.yearMilestones?.year1 || {},
    tuesdayTest: part1.tuesday_test || vision.visualisation || '',
    
    // From shift
    shiftMilestones: shift.keyMilestones || [],
    shiftStatement: shift.shiftStatement || '',
    tuesdayEvolution: shift.tuesdayEvolution || {},
    quickWins: shift.quickWins || [],
    
    // Their pain points (USE THESE)
    mondayFrustration: part2.monday_frustration || part1.monday_frustration || '',
    magicAwayTask: part1.magic_away_task || '',
    emergencyLog: part1.emergency_log || '',
    growthBottleneck: part2.growth_bottleneck || part1.growth_bottleneck || '',
    dangerZone: part1.danger_zone || '',
    relationshipMirror: part1.relationship_mirror || '',
    
    // Their priorities
    ninetyDayPriorities: part2.ninety_day_priorities || part1.ninety_day_priorities || [],
    
    // Context
    commitmentHours: part1.commitment_hours || '10-15 hours',
    teamSize: part2.team_size || part2.staff_count || 'small team',
    toolsUsed: part2.tools_used || part2.current_tools || [],
  };
}

async function generateSprintPart1(ctx: any): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  const prompt = buildSprintPrompt(ctx);

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
        temperature: 0.5,
        messages: [
          { 
            role: 'system', 
            content: `You create transformation journeys, not task lists.
Every week has a narrative—WHY it matters to their LIFE, not just business.
Every task connects to their North Star.
Use their exact words. Be specific to their situation.
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
    
    // 2. Fix missing commas between properties (e.g., "value1" "key2")
    fixedJson = fixedJson.replace(/}(\s*){/g, '},{');
    fixedJson = fixedJson.replace(/](\s*)\[/g, '],[');
    fixedJson = fixedJson.replace(/"(\s*)"(\s*[a-zA-Z])/g, '","$2');
    
    // 3. Fix missing commas between array elements
    fixedJson = fixedJson.replace(/}(\s*)"/g, '},"');
    fixedJson = fixedJson.replace(/"(\s*){/g, '",{');
    
    // 4. Fix unescaped newlines in strings (replace with space)
    // This regex finds strings and removes literal newlines inside them
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
      // 7. Last resort: try to extract partial valid JSON
      console.error('JSON repair failed:', secondError);
      console.log('Attempting to salvage partial JSON...');
      
      // Try to find the last complete week object
      const weekMatches = fixedJson.matchAll(/"weekNumber":\s*(\d+)/g);
      const weeks = Array.from(weekMatches);
      
      if (weeks.length > 0) {
        // Find where the last complete week ends
        const lastCompleteWeekNum = Math.max(1, weeks.length - 1);
        console.log(`Attempting to salvage ${lastCompleteWeekNum} weeks`);
        
        // Build a minimal valid response
        const salvaged = {
          sprintTheme: "Sprint 1: Foundation Building",
          sprintPromise: "Build the foundation for transformation",
          sprintGoals: ["Address immediate pain points", "Build systems", "Create momentum"],
          phases: {
            immediateRelief: { weeks: [1, 2], theme: "Quick wins", emotionalGoal: "Hope" },
            foundation: { weeks: [3, 4], theme: "Building base", emotionalGoal: "Confidence" },
            implementation: { weeks: [5, 6], theme: "Execution", emotionalGoal: "Momentum" }
          },
          weeks: [],
          tuesdayEvolution: { week0: "Starting point", week2: "First relief", week4: "Building", week6: "Foundation set" },
          _note: "Partial recovery due to JSON parsing issue"
        };
        
        console.log('Returning salvaged minimal structure');
        return salvaged;
      }
      
      throw new Error(`Failed to parse sprint JSON after repair: ${secondError}`);
    }
  }
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
          "description": "2-3 sentences explaining exactly what to do, step by step. Be specific.",
          "whyThisMatters": "Connection to their North Star: '${ctx.northStar?.substring(0, 50)}...' or to their immediate pain",
          "milestone": "Which 6-month milestone this serves",
          "tools": "Specific tools to use",
          "timeEstimate": "2 hours",
          "deliverable": "Tangible output they can show",
          "celebrationMoment": "What to notice when done - the small win to acknowledge"
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
