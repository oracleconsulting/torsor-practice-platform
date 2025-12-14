// ============================================================================
// GENERATE FIVE-YEAR VISION
// ============================================================================
// Standalone function for vision generation
// Model: Opus 4.5 (quality matters most here)
// Timeout budget: 60s
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// QUALITY RULES (Shared)
// ============================================================================

const QUALITY_RULES = `
## CRITICAL RULES - READ CAREFULLY

### 1. USE THEIR EXPLICIT ANSWERS
The client answered specific questions. You MUST use their exact words:
- "tuesday_test" → This IS their 5-year vision
- "winning_2030" → This IS their success definition  
- "desired_income" → This IS their target income
- "current_income" → This IS their starting point

### 2. NO INVENTED STATISTICS
Every claim needs a source:
- DIRECT_QUOTE: Their exact words in quotes
- ASSESSMENT_RESPONSE: "Based on your [question] response"
- CALCULATED: Show the math (e.g., "£10,000 - £3,600 = £6,400 gap")
- FINANCIAL_DATA: "Your accounts show..."

If you cannot source it, DO NOT say it.

### 3. NO HALLUCINATED RECOMMENDATIONS
Do NOT add generic business advice like:
- SEO optimisation (unless they mentioned it)
- Email marketing (unless they mentioned it)
- Social media (unless they mentioned it)

Stick to what THEY said they need.

### 4. BRITISH ENGLISH
- organise not organize
- colour not color  
- £ not $
- DD/MM/YYYY not MM/DD/YYYY

### 5. CONCISE NORTH STAR
The North Star should be ONE REFINED SENTENCE, not a wall of text.
Take their rambling answer and distill it to the essence.
`;

// ============================================================================
// CONTEXT INTERFACES
// ============================================================================

interface VisionContext {
  userName: string;
  companyName: string;
  industry: string;
  
  // Their explicit answers (MUST USE)
  tuesdayTest: string;
  winningBy2030: string;
  tenYearVision: string;
  desiredIncome: string;
  currentIncome: string;
  currentWorkingHours: string;
  targetWorkingHours: string;
  sacrifices: string[];
  relationshipMirror: string;
  familyFeedback: string;
  dangerZone: string;
  secretPride: string;
  
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

    // Check for existing stage record to determine version
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
        model_used: 'anthropic/claude-opus-4'
      })
      .select()
      .single();

    if (stageError) throw stageError;

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

    // Fetch any financial context
    const { data: financialContext } = await supabase
      .from('client_context')
      .select('content')
      .eq('client_id', clientId)
      .eq('data_source_type', 'accounts')
      .limit(1)
      .maybeSingle();

    // Build context
    const context = buildVisionContext(part1, part2, client, financialContext);

    // Generate vision
    const vision = await generateVision(context);

    // Calculate duration
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

    // Notify practice (could be webhook, email, or just rely on polling)
    console.log(`Vision generated for client ${clientId} in ${duration}ms`);

    return new Response(JSON.stringify({
      success: true,
      stageId: stage.id,
      duration
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
  financialContext: any
): VisionContext {
  const currentIncome = parseIncome(part1.current_income);
  const desiredIncome = parseIncome(part1.desired_income);
  
  // Detect industry
  const allText = JSON.stringify({ ...part1, ...part2 }).toLowerCase();
  let industry = 'general_business';
  if (allText.includes('rowing') || allText.includes('fitness') || allText.includes('gym') || allText.includes('equipment')) industry = 'fitness_equipment';
  else if (allText.includes('consult') || allText.includes('advisor') || allText.includes('coach')) industry = 'consulting';
  else if (allText.includes('software') || allText.includes('saas') || allText.includes('tech') || allText.includes('app')) industry = 'technology';
  else if (allText.includes('agency') || allText.includes('marketing') || allText.includes('creative') || allText.includes('design')) industry = 'agency';
  else if (allText.includes('trade') || allText.includes('construction') || allText.includes('plumb') || allText.includes('electric')) industry = 'trades';
  
  return {
    userName: client?.name?.split(' ')[0] || 'there',
    companyName: client?.client_company || part2.trading_name || part1.company_name || 'your business',
    industry,
    
    tuesdayTest: part1.tuesday_test || part1.ninety_day_fantasy || '',
    winningBy2030: part2.winning_2030 || part1.ten_year_vision || '',
    tenYearVision: part1.ten_year_vision || part2.ten_year_vision || '',
    desiredIncome: part1.desired_income || '',
    currentIncome: part1.current_income || '',
    currentWorkingHours: part2.current_working_hours || '50',
    targetWorkingHours: part2.target_working_hours || part1.ideal_working_hours || '20',
    sacrifices: part1.sacrifices || [],
    relationshipMirror: part1.relationship_mirror || '',
    familyFeedback: part1.family_feedback || '',
    dangerZone: part1.danger_zone || '',
    secretPride: part1.secret_pride || '',
    
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
// VISION GENERATOR
// ============================================================================

async function generateVision(ctx: VisionContext): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

  const prompt = buildVisionPrompt(ctx);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor 365 Vision'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-opus-4',
      max_tokens: 6000,
      temperature: 0.4,
      messages: [
        { 
          role: 'system', 
          content: `You create deeply personal 5-year visions for business owners. 
Use their EXACT words. Be specific to their situation. 
Return ONLY valid JSON - no markdown, no explanation.
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
  
  // Extract JSON
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error('Failed to parse vision JSON');
  }
  
  return JSON.parse(cleaned.substring(start, end + 1));
}

function buildVisionPrompt(ctx: VisionContext): string {
  return `Create a 5-Year Vision for ${ctx.userName} at ${ctx.companyName}.

## THEIR EXACT WORDS (USE THESE)

### Tuesday Test / Ideal Life:
"${ctx.tuesdayTest}"

### Winning by 2030:
"${ctx.winningBy2030}"

### 10-Year Vision:
"${ctx.tenYearVision}"

### Current Income: ${ctx.currentIncome}
### Desired Income: ${ctx.desiredIncome}
### Income Gap: £${ctx.incomeGap.toLocaleString()}/month to close

### Current Working Hours: ${ctx.currentWorkingHours} hours/week
### Target Working Hours: ${ctx.targetWorkingHours} hours/week

### What They're Sacrificing Now:
${ctx.sacrifices.length > 0 ? ctx.sacrifices.join(', ') : 'Not specified'}

### Relationship with Business:
"${ctx.relationshipMirror}"

### Family Feedback:
"${ctx.familyFeedback}"

### Danger Zone:
"${ctx.dangerZone}"

### Secret Pride:
"${ctx.secretPride}"

${ctx.financialSummary ? `
### Financial Context (from accounts):
${ctx.financialSummary}
` : ''}

## YOUR TASK

Create a structured 5-Year Vision. The North Star must be ONE REFINED SENTENCE distilled from their rambling answers - not a copy-paste of their entire response.

Return as JSON:

{
  "northStar": "One powerful sentence capturing their core desire. Distill their tuesday_test and winning_2030 into ~20-30 words max. Example: 'Working 1-2 days a week, earning £10k/month, with kids and freedom to travel - without being the backstop.'",
  
  "tagline": "Short headline for their journey (5-8 words). Example: 'Britain's Leading Rowing Specialist - With Freedom'",
  
  "keyElements": [
    {
      "area": "Work Pattern",
      "current": "[From their current_working_hours and relationship_mirror]",
      "future": "[From their target_working_hours and tuesday_test]",
      "source": "From their [specific question] response"
    },
    {
      "area": "Income",
      "current": "${ctx.currentIncome}",
      "future": "${ctx.desiredIncome}",
      "gap": "£${ctx.incomeGap.toLocaleString()}/month",
      "source": "From their income responses"
    },
    {
      "area": "Role in Business",
      "current": "[From relationship_mirror - what role do they play now?]",
      "future": "[From tuesday_test - what role do they want?]",
      "source": "From their [specific question] response"
    },
    {
      "area": "Lifestyle",
      "current": "Sacrificing: ${ctx.sacrifices.join(', ') || 'their time'}",
      "future": "[Specific lifestyle elements from their tuesday_test]",
      "source": "From their sacrifices and tuesday_test responses"
    }
  ],
  
  "visualisation": "A vivid 100-150 word paragraph painting their ideal Tuesday in 5 years. Use SPECIFIC details from their tuesday_test. Include: when they wake, what they do first, who they're with, what the business is doing WITHOUT them. Make it feel real and personal - not generic.",
  
  "anchorMetrics": [
    {
      "metric": "Days worked per week",
      "current": "[Calculated from hours]",
      "target": "[From their responses]",
      "source": "Calculated from working hours"
    },
    {
      "metric": "Monthly income",
      "current": "${ctx.currentIncome}",
      "target": "${ctx.desiredIncome}",
      "source": "From income responses"
    },
    {
      "metric": "[Third metric specific to them - e.g., 'Holidays per year' or 'Days without work calls']",
      "current": "[Current state]",
      "target": "[Target from their vision]",
      "source": "[Which response]"
    }
  ],
  
  "yearMilestones": {
    "year1": {
      "headline": "Year 1: [Specific milestone]",
      "description": "What's true by end of year 1",
      "measurable": "Specific metric achieved"
    },
    "year3": {
      "headline": "Year 3: [Specific milestone]",
      "description": "What's true by end of year 3",
      "measurable": "Specific metric achieved"
    },
    "year5": {
      "headline": "Year 5: [Their tuesday_test realised]",
      "description": "Their full vision brought to life",
      "measurable": "Their winning_2030 criteria met"
    }
  },
  
  "emotionalCore": "2-3 sentences on what they're REALLY seeking underneath it all. Reference their family_feedback and sacrifices. Why does this matter to them specifically?"
}`;
}


