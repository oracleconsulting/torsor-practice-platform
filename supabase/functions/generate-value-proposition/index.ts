// ============================================================================
// EDGE FUNCTION: generate-value-proposition
// ============================================================================
// Generates personalized value propositions for each service line
// Based on client assessment responses and their financial snapshot
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VPRequest {
  clientId: string;
  serviceLineCode: string;
  responses: Record<string, any>;
  extractedInsights: Record<string, any>;
}

// LLM Call helper
async function callLLM(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

// Extract JSON from response
function extractJson(text: string): any {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  
  // Find JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.slice(start, end + 1);
  }
  
  return JSON.parse(cleaned);
}

// Fetch questions from database for AI context
async function fetchQuestionsForAI(supabase: any, serviceLineCode: string) {
  const { data: questions } = await supabase
    .from('assessment_questions')
    .select('question_id, section, question_text, emotional_anchor, technical_field')
    .eq('service_line_code', serviceLineCode)
    .eq('is_active', true)
    .order('display_order');

  return {
    questions: questions || [],
    emotionalAnchors: questions?.filter((q: any) => q.emotional_anchor).map((q: any) => ({
      key: q.emotional_anchor,
      question: q.question_text
    })) || [],
    technicalFields: questions?.filter((q: any) => q.technical_field).map((q: any) => ({
      key: q.technical_field,
      question: q.question_text
    })) || []
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { clientId, serviceLineCode, responses, extractedInsights }: VPRequest = await req.json();

    // Get client info and financial snapshot
    const { data: client } = await supabase
      .from('practice_members')
      .select('name, email, client_company, financial_snapshot')
      .eq('id', clientId)
      .single();

    const financials = client?.financial_snapshot || {};

    // Fetch questions from database for AI context
    const questionContext = await fetchQuestionsForAI(supabase, serviceLineCode);
    console.log(`Loaded ${questionContext.questions.length} questions for AI context`);

    // Generate VP based on service line (now with question context)
    let valueProposition: any;

    if (serviceLineCode === 'management_accounts') {
      valueProposition = await generateMAValueProposition(extractedInsights, financials, client?.name || '', questionContext);
    } else if (serviceLineCode === 'systems_audit') {
      valueProposition = await generateSAValueProposition(extractedInsights, financials, client?.name || '', questionContext);
    } else if (serviceLineCode === 'fractional_executive') {
      valueProposition = await generateFEValueProposition(extractedInsights, financials, client?.name || '', questionContext);
    } else {
      throw new Error(`Unknown service line: ${serviceLineCode}`);
    }

    // Get service line ID
    const { data: sl } = await supabase
      .from('service_lines')
      .select('id')
      .eq('code', serviceLineCode)
      .single();

    // Update client_service_lines with VP
    if (sl?.id) {
      await supabase
        .from('client_service_lines')
        .update({
          value_proposition: valueProposition,
          recommended_tier: valueProposition.recommendedTier,
          recommended_price: valueProposition.recommendedPrice,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('service_line_id', sl.id);
    }

    return new Response(
      JSON.stringify({ success: true, valueProposition }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('VP generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// MANAGEMENT ACCOUNTS VP GENERATOR
// ============================================================================

async function generateMAValueProposition(insights: Record<string, any>, financials: any, clientName: string, questionContext: any) {
  // Build context from database questions
  const questionsList = questionContext.emotionalAnchors
    .map((a: any) => `- ${a.key}: Question was "${a.question}"`)
    .join('\n');

  const systemPrompt = `You are a senior accountant creating a personalized value proposition for management accounts services. Your goal is to show the client you understand their specific pain and can transform their financial visibility.

Be warm but professional. Use their exact words where possible. Focus on emotional impact, not just features.

QUESTIONS ASKED (from database - these may have been customized):
${questionsList}`;

  const prompt = `Generate a value proposition for ${clientName} based on their Financial Visibility Diagnostic responses.

CLIENT INSIGHTS (mapped from their assessment answers):
- Relationship with numbers: ${insights.relationship_with_numbers || 'Not specified'}
- Their Tuesday financial question: "${insights.tuesday_financial_question || 'Not specified'}"
- What they'd magic away: "${insights.magic_away_financial || 'Not specified'}"
- Pain points: ${JSON.stringify(insights.kpi_priorities || [])}
- Current reporting lag: ${insights.current_reporting_lag || 'Not specified'}
- Decision making story: "${insights.decision_making_story || 'Not specified'}"
- Transformation desires: ${JSON.stringify(insights.ma_transformation_desires || [])}
- Visibility vision: "${insights.financial_visibility_vision || 'Not specified'}"
- Preferred frequency: ${insights.reporting_frequency_preference || 'Not specified'}
- Additional needs: ${JSON.stringify(insights.additional_reporting_needs || [])}

THEIR FINANCIALS (if available):
- Annual revenue: £${financials.annual_revenue || 'Unknown'}
- Current gross margin: ${financials.gross_margin || 'Unknown'}%
- Staff cost ratio: ${financials.staff_cost_ratio || 'Unknown'}%
- Debtor days: ${financials.debtor_days || 'Unknown'}

Return a JSON object with:
{
  "understandingNarrative": "2-3 sentences showing you GET their situation, referencing their exact words",
  "transformationPromise": "2-3 sentences painting what changes for THEM specifically",
  "roiIndicators": [
    { "metric": "description", "impact": "quantified impact or benefit" }
  ],
  "recommendedTier": "monthly or quarterly",
  "recommendedPrice": 650 or 1750,
  "tierRationale": "why this tier suits them",
  "keyDeliverables": ["list", "of", "specific", "deliverables"],
  "nextSteps": ["action 1", "action 2", "action 3"]
}`;

  try {
    const response = await callLLM(prompt, systemPrompt);
    const vp = extractJson(response);
    vp.serviceCode = 'management_accounts';
    vp.generatedAt = new Date().toISOString();
    return vp;
  } catch (error) {
    console.error('MA VP generation error:', error);
    // Return fallback VP
    return {
      serviceCode: 'management_accounts',
      understandingNarrative: `Based on your responses, we can see you're looking for greater financial clarity. Your desire to answer "${insights.tuesday_financial_question || 'key financial questions'}" quickly resonates with many of our clients.`,
      transformationPromise: "With monthly management accounts, you'll have the visibility you need to make confident decisions and finally feel in control of your numbers.",
      roiIndicators: [
        { metric: "Decision speed", impact: "From days to minutes for financial questions" },
        { metric: "Confidence", impact: "Data-driven decisions instead of gut feel" }
      ],
      recommendedTier: insights.reporting_frequency_preference?.includes('Monthly') ? 'monthly' : 'quarterly',
      recommendedPrice: insights.reporting_frequency_preference?.includes('Monthly') ? 650 : 1750,
      tierRationale: "Based on your business rhythm and decision-making needs",
      keyDeliverables: ["Monthly P&L", "Balance Sheet", "Cash Flow Waterfall", "KPI Commentary", "Spotlight Analysis"],
      nextSteps: ["Schedule a call to discuss your specific needs", "Share access to your accounting software", "Receive your first management accounts pack"],
      generatedAt: new Date().toISOString()
    };
  }
}

// ============================================================================
// SYSTEMS AUDIT VP GENERATOR
// ============================================================================

async function generateSAValueProposition(insights: Record<string, any>, financials: any, clientName: string, questionContext: any) {
  const questionsList = questionContext.emotionalAnchors
    .map((a: any) => `- ${a.key}: "${a.question}"`)
    .join('\n');

  const systemPrompt = `You are a systems and operations consultant creating a personalized audit proposal. Show the client you understand their operational pain and can quantify the hidden costs they're experiencing.

Be direct about the problems but optimistic about solutions. Use their own descriptions of chaos and frustration.

ASSESSMENT QUESTIONS (from database):
${questionsList}`;

  const prompt = `Generate a value proposition for ${clientName} based on their Operations Health Check responses.

CLIENT INSIGHTS:
- What broke/triggered this: "${insights.systems_breaking_point || 'Not specified'}"
- Self-diagnosis: ${insights.operations_self_diagnosis || 'Not specified'}
- Their month-end shame: "${insights.month_end_shame || 'Not specified'}"
- Manual hours monthly: ${insights.manual_hours_monthly || 'Not specified'}
- Month-end duration: ${insights.month_end_duration || 'Not specified'}
- Data error frequency: ${insights.data_error_frequency || 'Not specified'}
- Expensive mistake: "${insights.expensive_systems_mistake || 'Not specified'}"
- Tech stack: ${JSON.stringify(insights.current_tech_stack || [])}
- Integration health: ${insights.integration_health || 'Not specified'}
- Spreadsheet dependency: ${insights.spreadsheet_dependency || 'Not specified'}
- Priority areas: ${JSON.stringify(insights.priority_areas || [])}
- Magic fix: "${insights.magic_process_fix || 'Not specified'}"
- Change appetite: ${insights.change_appetite || 'Not specified'}
- Fears: ${JSON.stringify(insights.systems_fears || [])}
- Internal champion: ${insights.internal_champion || 'Not specified'}

THEIR FINANCIALS:
- Annual revenue: £${financials.annual_revenue || 'Unknown'}
- Team size: ${financials.team_size || 'Unknown'}
- Monthly staff costs: £${financials.monthly_staff_costs || 'Unknown'}

Return a JSON object with:
{
  "understandingNarrative": "2-3 sentences showing you GET their operational pain",
  "impactQuantification": {
    "hiddenCostsMonthly": 0,
    "hoursRecoverable": 0,
    "calculation": "explanation of how you calculated this"
  },
  "recommendedScope": "single_area, two_areas, or comprehensive",
  "recommendedPrice": 7500 or 12000 or 18000,
  "scopeRationale": "why this scope suits them",
  "priorityAreas": ["ranked", "list", "of", "areas"],
  "roiProjection": {
    "yearOneSavings": 0,
    "paybackMonths": 0,
    "riskReduction": "description"
  },
  "addressingFears": [
    { "fear": "their fear", "reassurance": "how we address it" }
  ],
  "nextSteps": ["action 1", "action 2", "action 3"]
}`;

  try {
    const response = await callLLM(prompt, systemPrompt);
    const vp = extractJson(response);
    vp.serviceCode = 'systems_audit';
    vp.generatedAt = new Date().toISOString();
    return vp;
  } catch (error) {
    console.error('SA VP generation error:', error);
    // Return fallback VP
    const priorityCount = (insights.priority_areas || []).length;
    let scope = 'single_area', price = 7500;
    if (priorityCount >= 3) { scope = 'comprehensive'; price = 18000; }
    else if (priorityCount >= 2) { scope = 'two_areas'; price = 12000; }

    return {
      serviceCode: 'systems_audit',
      understandingNarrative: `Your description of "${insights.operations_self_diagnosis || 'operational challenges'}" tells us you're ready for change. The ${insights.month_end_duration || 'extended'} month-end close is costing you time and clarity.`,
      impactQuantification: {
        hiddenCostsMonthly: 2500,
        hoursRecoverable: parseInt(insights.manual_hours_monthly?.split('-')[0] || '20'),
        calculation: "Based on manual hours and typical process inefficiencies"
      },
      recommendedScope: scope,
      recommendedPrice: price,
      scopeRationale: `Based on your ${priorityCount} priority areas`,
      priorityAreas: insights.priority_areas || [],
      roiProjection: {
        yearOneSavings: 30000,
        paybackMonths: 4,
        riskReduction: "Reduced data errors and faster month-end"
      },
      addressingFears: (insights.systems_fears || []).slice(0, 3).map((fear: string) => ({
        fear,
        reassurance: "We address this through phased implementation and clear milestones"
      })),
      nextSteps: ["Discovery call to map current processes", "Stakeholder interviews", "Receive detailed audit report with recommendations"],
      generatedAt: new Date().toISOString()
    };
  }
}

// ============================================================================
// FRACTIONAL EXECUTIVE VP GENERATOR
// ============================================================================

async function generateFEValueProposition(insights: Record<string, any>, financials: any, clientName: string, questionContext: any) {
  const questionsList = questionContext.emotionalAnchors
    .map((a: any) => `- ${a.key}: "${a.question}"`)
    .join('\n');

  const systemPrompt = `You are a senior executive presenting a fractional CFO/COO engagement proposal. Show the client you understand their leadership gap and can fill it effectively.

Be confident but not arrogant. Acknowledge the courage it takes to bring in external help.

ASSESSMENT QUESTIONS (from database):
${questionsList}`;

  // Determine CFO vs COO based on gap areas
  const gapAreas = insights.executive_gap_areas || [];
  const financialGaps = gapAreas.filter((g: string) => 
    g.includes('money') || g.includes('cash') || g.includes('investors') || 
    g.includes('unit economics') || g.includes('pricing') || g.includes('controls') ||
    g.includes('board') || g.includes('capital')
  ).length;
  const operationalGaps = gapAreas.filter((g: string) => 
    g.includes('chaos') || g.includes('deliver') || g.includes('team') || 
    g.includes('fires') || g.includes('deadlines') || g.includes('customer') ||
    g.includes('systems') || g.includes('bottleneck')
  ).length;

  const executiveType = financialGaps > operationalGaps ? 'CFO' : 
                        operationalGaps > financialGaps ? 'COO' : 'CFO/COO';

  const prompt = `Generate a value proposition for ${clientName} based on their Executive Capacity Diagnostic responses.

CLIENT INSIGHTS:
- Trigger: "${insights.executive_trigger || 'Not specified'}"
- Current situation: ${insights.business_situation || 'Not specified'}
- First fix priority: "${insights.first_fix_priority || 'Not specified'}"
- Gap areas: ${JSON.stringify(gapAreas)}
- Financial leadership status: ${insights.financial_leadership_status || 'Not specified'}
- Operational leadership status: ${insights.operational_leadership_status || 'Not specified'}
- 12-month priorities: ${JSON.stringify(insights.twelve_month_priorities || [])}
- Upcoming events: ${JSON.stringify(insights.upcoming_events || [])}
- Governance maturity: ${insights.governance_maturity || 'Not specified'}
- Engagement preference: ${insights.engagement_level_preference || 'Not specified'}
- Budget expectation: ${insights.budget_expectation || 'Not specified'}
- Success vision: "${insights.success_vision || 'Not specified'}"
- Working style: ${JSON.stringify(insights.working_style_preference || [])}
- Concerns: ${JSON.stringify(insights.external_help_concerns || [])}

DETERMINED EXECUTIVE TYPE: ${executiveType}

THEIR FINANCIALS:
- Annual revenue: £${financials.annual_revenue || 'Unknown'}
- Growth rate: ${financials.growth_rate || 'Unknown'}%
- Team size: ${financials.team_size || 'Unknown'}
- Monthly burn: £${financials.monthly_burn || 'Unknown'}

Return a JSON object with:
{
  "executiveRecommendation": "CFO or COO or Both",
  "understandingNarrative": "2-3 sentences showing you understand why they need senior help NOW",
  "capabilityMatch": [
    { "priority": "their priority", "howWeDeliver": "specific capability" }
  ],
  "roiProjection": {
    "fullTimeCost": 175000,
    "ourCost": 0,
    "annualSaving": 0,
    "valueCreated": "specific value they'll get"
  },
  "recommendedTier": "light, regular, or heavy",
  "recommendedPrice": 3500 or 6000 or 12000,
  "tierRationale": "why this level of engagement",
  "addressingConcerns": [
    { "concern": "their concern", "response": "how we address it" }
  ],
  "successRoadmap": [
    { "month": "1-2", "milestone": "what we'll achieve" },
    { "month": "3-4", "milestone": "what we'll achieve" },
    { "month": "5-6", "milestone": "what we'll achieve" }
  ],
  "nextSteps": ["action 1", "action 2", "action 3"]
}`;

  try {
    const response = await callLLM(prompt, systemPrompt);
    const vp = extractJson(response);
    vp.serviceCode = 'fractional_executive';
    vp.generatedAt = new Date().toISOString();
    return vp;
  } catch (error) {
    console.error('FE VP generation error:', error);
    
    // Determine price based on engagement preference
    let tier = 'regular', price = 6000;
    if (insights.engagement_level_preference?.includes('Light')) { tier = 'light'; price = 3500; }
    else if (insights.engagement_level_preference?.includes('Heavy')) { tier = 'heavy'; price = 12000; }

    return {
      serviceCode: 'fractional_executive',
      executiveRecommendation: executiveType,
      understandingNarrative: `Your trigger of "${insights.executive_trigger || 'needing senior help'}" is a common inflection point. You're at a stage where ${executiveType} expertise can make the difference between scaling successfully and burning out.`,
      capabilityMatch: (insights.twelve_month_priorities || []).slice(0, 3).map((p: string) => ({
        priority: p,
        howWeDeliver: `Direct ${executiveType} involvement and expertise`
      })),
      roiProjection: {
        fullTimeCost: 175000,
        ourCost: price * 12,
        annualSaving: 175000 - (price * 12),
        valueCreated: "Strategic leadership without full-time commitment"
      },
      recommendedTier: tier,
      recommendedPrice: price,
      tierRationale: `Based on your ${insights.engagement_level_preference || 'stated'} engagement preference`,
      addressingConcerns: (insights.external_help_concerns || []).slice(0, 3).map((c: string) => ({
        concern: c,
        response: "We address this through clear KPIs and regular reviews"
      })),
      successRoadmap: [
        { month: "1-2", milestone: "Initial assessment and quick wins" },
        { month: "3-4", milestone: "Process improvements and team alignment" },
        { month: "5-6", milestone: "Strategic initiatives and measurable results" }
      ],
      nextSteps: ["Chemistry call to ensure fit", "Scope agreement and KPIs", "Begin engagement with 90-day plan"],
      generatedAt: new Date().toISOString()
    };
  }
}

