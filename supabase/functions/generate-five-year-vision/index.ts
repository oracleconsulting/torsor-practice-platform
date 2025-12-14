// ============================================================================
// GENERATE FIVE-YEAR VISION
// ============================================================================
// Purpose: Write the opening chapter of someone's transformation story
// This is NOT a business plan—it's the future they can TASTE
// 
// Philosophy: McKinsey rigour, Tolkien wonder, human truth
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// CONTEXT INTERFACES
// ============================================================================

interface VisionContext {
  userName: string;
  companyName: string;
  industry: string;
  yearsTrading: string;
  
  // Their explicit answers (USE THEIR EXACT WORDS)
  tuesdayTest: string;
  winningBy2030: string;
  tenYearVision: string;
  desiredIncome: string;
  currentIncome: string;
  currentWorkingHours: string;
  targetWorkingHours: string;
  annualTurnover: string;
  teamSize: string;
  
  // Emotional context
  sacrifices: string[];
  relationshipMirror: string;
  familyFeedback: string;
  dangerZone: string;
  secretPride: string;
  emergencyLog: string;
  moneyWorry: string;
  magicAwayTask: string;
  
  // From fit profile (previous stage)
  northStar: string;
  archetype: string;
  
  // Financial context (if available)
  financialSummary: string | null;
  
  // Calculated
  incomeGap: number;
}

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
      .eq('stage_type', 'five_year_vision')
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version + 1 
      : 1;

    console.log(`Creating five_year_vision stage with version ${nextVersion}`);

    // Create stage record
    const { data: stage, error: stageError } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: 'five_year_vision',
        version: nextVersion,
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        model_used: 'anthropic/claude-sonnet-4.5'
      })
      .select()
      .single();

    if (stageError) throw stageError;

    // Fetch assessment data
    const { data: assessments } = await supabase
      .from('client_assessments')
      .select('assessment_type, responses, fit_profile')
      .eq('client_id', clientId)
      .in('assessment_type', ['part1', 'part2']);

    const part1Data = assessments?.find(a => a.assessment_type === 'part1');
    const part1 = part1Data?.responses || {};
    const fitProfile = part1Data?.fit_profile || {};
    const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};

    // Fetch client details
    const { data: client } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();

    // Fetch any financial context
    const { data: financialContext } = await supabase
      .from('client_context')
      .select('content')
      .eq('client_id', clientId)
      .eq('data_source_type', 'accounts')
      .limit(1)
      .maybeSingle();

    // Build context
    const context = buildVisionContext(part1, part2, client, financialContext, fitProfile);

    console.log(`Generating transformation narrative for ${context.userName}...`);

    // Generate vision
    const vision = await generateTransformationNarrative(context);

    const duration = Date.now() - startTime;

    // Update stage record
    await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: vision,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration
      })
      .eq('id', stage.id);

    console.log(`Transformation narrative generated for client ${clientId} in ${duration}ms`);

    return new Response(JSON.stringify({
      success: true,
      stageId: stage.id,
      duration,
      preview: {
        tagline: vision.tagline,
        year1Headline: vision.yearMilestones?.year1?.headline
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Vision generation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

function buildVisionContext(
  part1: Record<string, any>,
  part2: Record<string, any>,
  client: any,
  financialContext: any,
  fitProfile: any
): VisionContext {
  const currentIncome = parseIncome(part1.current_income);
  const desiredIncome = parseIncome(part1.desired_income);
  
  // Detect industry
  const allText = JSON.stringify({ ...part1, ...part2 }).toLowerCase();
  let industry = 'general business';
  if (allText.includes('rowing') || allText.includes('fitness') || allText.includes('gym') || allText.includes('equipment')) industry = 'fitness equipment';
  else if (allText.includes('consult') || allText.includes('advisor') || allText.includes('coach')) industry = 'consulting';
  else if (allText.includes('software') || allText.includes('saas') || allText.includes('tech') || allText.includes('app')) industry = 'technology';
  else if (allText.includes('agency') || allText.includes('marketing') || allText.includes('creative') || allText.includes('design')) industry = 'agency';
  else if (allText.includes('trade') || allText.includes('construction') || allText.includes('plumb') || allText.includes('electric')) industry = 'trades';
  else if (allText.includes('salon') || allText.includes('beauty') || allText.includes('hair')) industry = 'beauty/salon';
  
  return {
    userName: client?.name?.split(' ')[0] || part1.full_name?.split(' ')[0] || 'there',
    companyName: client?.client_company || part2.trading_name || part1.company_name || 'your business',
    industry,
    yearsTrading: part2.years_trading || part1.years_in_business || 'several',
    
    tuesdayTest: part1.tuesday_test || part1.ninety_day_fantasy || '',
    winningBy2030: part2.winning_2030 || part1.winning_by_2030 || part1.ten_year_vision || '',
    tenYearVision: part1.ten_year_vision || part2.ten_year_vision || '',
    desiredIncome: part1.desired_income || '',
    currentIncome: part1.current_income || '',
    currentWorkingHours: part2.current_working_hours || part1.working_hours || '50',
    targetWorkingHours: part2.target_working_hours || part1.ideal_working_hours || part1.desired_hours || '20',
    annualTurnover: part2.annual_turnover || part2.revenue || '',
    teamSize: part2.team_size || part2.staff_count || part1.team || '',
    
    sacrifices: part1.sacrifices || [],
    relationshipMirror: part1.relationship_mirror || '',
    familyFeedback: part1.family_feedback || '',
    dangerZone: part1.danger_zone || '',
    secretPride: part1.secret_pride || '',
    emergencyLog: part1.emergency_log || '',
    moneyWorry: part1.money_worry || '',
    magicAwayTask: part1.magic_away_task || '',
    
    northStar: fitProfile.northStar || '',
    archetype: fitProfile.archetype || 'balanced_achiever',
    
    financialSummary: financialContext?.content || null,
    
    incomeGap: desiredIncome - currentIncome
  };
}

function parseIncome(str: string | undefined): number {
  if (!str) return 0;
  const cleaned = str.replace(/[£,\s]/g, '').replace(/k$/i, '000');
  return parseInt(cleaned) || 0;
}

// ============================================================================
// TRANSFORMATION NARRATIVE GENERATOR
// ============================================================================

async function generateTransformationNarrative(ctx: VisionContext): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

  const prompt = buildNarrativePrompt(ctx);

  console.log('Calling LLM for transformation narrative...');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor 365 Vision'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        { 
          role: 'system', 
          content: `You are writing the opening chapter of someone's transformation story. 
This is not a business plan—it's the future they can taste, told so vividly they can feel the coffee cup in their hands on that Tuesday morning five years from now.

Use THEIR exact words. Be specific to THEIR situation. Make them feel SEEN.
Return ONLY valid JSON - no markdown, no explanation.

British English only (organise, colour, £).`
        },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`LLM error: ${response.status} - ${error}`);
    throw new Error(`LLM error: ${response.status}`);
  }

  const data = await response.json();
  console.log('LLM response received');
  
  const content = data.choices[0].message.content;
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    console.error('Failed to find JSON in response');
    throw new Error('Failed to parse vision JSON');
  }
  
  try {
    const parsed = JSON.parse(cleaned.substring(start, end + 1));
    console.log('Transformation narrative parsed successfully');
    return parsed;
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    // Try to repair JSON
    let fixedJson = cleaned.substring(start, end + 1);
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(fixedJson);
  }
}

function buildNarrativePrompt(ctx: VisionContext): string {
  return `You are writing the opening chapter of ${ctx.userName}'s transformation story.

## THE PROTAGONIST
Name: ${ctx.userName}
Company: ${ctx.companyName}
Industry: ${ctx.industry}
Years trading: ${ctx.yearsTrading}
Current reality: ${ctx.annualTurnover ? `£${ctx.annualTurnover} turnover, ` : ''}working ${ctx.currentWorkingHours} hours/week
Team: ${ctx.teamSize || 'Small team'}

## THE CONFLICT (their exact words)

Their ideal Tuesday:
"${ctx.tuesdayTest}"

Their relationship with the business:
"${ctx.relationshipMirror}"

What their family says:
"${ctx.familyFeedback}"

Emergency log (what pulls them back in):
"${ctx.emergencyLog}"

What keeps them up at night:
"${ctx.moneyWorry}"

What they'd magic away:
"${ctx.magicAwayTask}"

Their danger zone:
"${ctx.dangerZone}"

## THE DESIRE (their exact words)

What winning looks like to them:
"${ctx.winningBy2030}"

Their 10-year vision:
"${ctx.tenYearVision}"

What they're secretly proud of:
"${ctx.secretPride}"

What they've sacrificed:
${ctx.sacrifices.length > 0 ? ctx.sacrifices.join(', ') : 'Not specified'}

## THEIR NUMBERS
Current income: ${ctx.currentIncome || 'Not specified'}
Desired income: ${ctx.desiredIncome || 'Not specified'}
${ctx.incomeGap > 0 ? `Income gap: £${ctx.incomeGap.toLocaleString()}/month to close` : ''}
Current hours: ${ctx.currentWorkingHours} hours/week
Target hours: ${ctx.targetWorkingHours} hours/week

## FROM THEIR FIT PROFILE
North Star: "${ctx.northStar}"
Archetype: ${ctx.archetype}

${ctx.financialSummary ? `
## FINANCIAL CONTEXT (from accounts)
${ctx.financialSummary}
` : ''}

---

## YOUR TASK: Create their Transformation Story

Return this JSON structure:

{
  "tagline": "Max 10 words. Their business identity + life aspiration. Example: 'Britain's Rowing Specialist—With Freedom to Live'",
  
  "transformationNarrative": {
    "currentReality": "PARAGRAPH 1 (~100 words): Make it visceral. Start in a specific moment of their current life. Use their EXACT words. Example opening: 'You're standing in your unit at 6pm on a Friday, phone buzzing again...' Reference their emergency_log, relationship_mirror, family_feedback. Make them feel the weight of where they are now.",
    
    "turningPoint": "PARAGRAPH 2 (~80 words): The insight they need. Not what they need to DO—what they need to BECOME. Reference their archetype. Example: 'What you're building toward isn't just a more profitable business. It's freedom from being the only person who can fix everything. The business is the vehicle, not the destination.'",
    
    "achievedVision": "PARAGRAPH 3 (~120 words): Five years from now, specific Tuesday morning. Make it SENSORY. What do they see, hear, feel? Use their tuesday_test but elevated and expanded. Include: time of day, who they're with (use names if mentioned), what they're doing, what the business is doing WITHOUT them, how it FEELS. Make it so vivid they can taste the coffee."
  },
  
  "yearMilestones": {
    "year1": {
      "headline": "The Reclamation",
      "story": "2-3 sentences. Year 1 is about getting their LIFE back, not growing the business. Reference their immediate pain points from emergency_log and magic_away_task. The goal is RELIEF, not revenue.",
      "measurable": "Specific numbers tied to their stated goals. Example: 'Working ${ctx.targetWorkingHours} days/week, £X/month income, taking consecutive days off without emergency calls'",
      "emotionalShift": "From '[current emotion from their words]' to '[new emotion]'. Example: 'From I can't take a day off without my phone exploding to I took Tuesday off and nothing caught fire.'"
    },
    "year3": {
      "headline": "The Crossing",
      "story": "2-3 sentences. They've crossed from operator to owner. The business runs without heroics. Their life goals (family, travel, freedom) are progressing. Reference specific life goals they mentioned.",
      "measurable": "Their specific targets progressing. If they mentioned family/kids/partner, include that.",
      "emotionalShift": "From '[operator feeling]' to '[owner feeling]'. Example: 'From the business runs on me to the business runs beside me.'"
    },
    "year5": {
      "headline": "The Arrival",
      "story": "2-3 sentences using their EXACT words from winning_2030 or ten_year_vision. This is their specific vision achieved, not a generic success story.",
      "measurable": "Their stated vision quantified: income, hours, lifestyle elements they mentioned.",
      "emotionalShift": "Reference what their family says about them NOW vs THEN. Use their family_feedback as the 'before' and imagine the 'after'."
    }
  },
  
  "theChoice": "One paragraph (~60 words). What they must give up, let go of, or face to get there. Not scary—honest. This is their growth edge. Reference their danger_zone and what holds them back. Example: 'This will mean letting go of being the hero who saves every situation. It will mean trusting others to represent your standards. It will mean accepting that good enough, done by someone else, beats perfect, done by you.'",
  
  "northStar": "${ctx.northStar || 'Use their tuesday_test and winning_2030 to create a powerful one-sentence North Star (max 30 words)'}",
  
  "visualisation": "A vivid 100-word paragraph painting their ideal Tuesday in 5 years. SENSORY details: what time they wake, what they smell, what they see, who's there, what sounds they hear, what they're wearing, what they're doing. Make it feel REAL and PERSONAL."
}

## CRITICAL RULES
1. Use THEIR words—if they said 'burn it down,' write 'burn it down'
2. If they mentioned a partner/spouse name, USE IT
3. If they mentioned kids, family, travel—those go in Year 3 and Year 5
4. The Tuesday scene must be SENSORY (see/hear/feel/smell)
5. Year milestones must connect to THEIR stated goals, not generic business targets
6. The emotionalShift must name actual EMOTIONS (not 'feeling better')
7. This should make them slightly emotional to read
8. Every paragraph should contain at least one direct quote or clear reference to their specific answers`;
}
