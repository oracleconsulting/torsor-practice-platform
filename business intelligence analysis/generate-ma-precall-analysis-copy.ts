// ============================================================================
// Generate MA Pre-Call Analysis
// ============================================================================
// AI-powered analysis of MA assessment responses for pre-call preparation
// Generates: pain points, tier recommendation, talking points, objection handling
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssessmentResponses {
  ma_tuesday_question?: string;
  ma_avoided_calculation?: string;
  ma_yearend_surprise?: string;
  ma_expensive_blindspot?: string;
  ma_numbers_relationship?: string;
  ma_decision_story?: string;
  ma_decision_speed?: string;
  ma_decision_confidence?: number;
  ma_upcoming_decisions?: string[];
  ma_cash_visibility_30day?: string;
  ma_cash_surprises?: string;
  ma_worst_cash_moment?: string;
  ma_tax_preparedness?: string;
  ma_current_reports?: string[];
  ma_report_usefulness?: string;
  ma_reports_missing?: string;
  ma_visibility_transformation?: string;
  ma_sleep_better?: string;
  ma_scenario_interest?: string[];
  ma_desired_frequency?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();

    if (!engagementId) {
      return new Response(
        JSON.stringify({ error: 'engagementId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get engagement and responses
    const { data: engagement, error: engagementError } = await supabase
      .from('ma_engagements')
      .select('*, client:practice_members!ma_engagements_client_id_fkey(id, name, client_company)')
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      return new Response(
        JSON.stringify({ error: 'Engagement not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: responsesData } = await supabase
      .from('ma_assessment_responses')
      .select('responses')
      .eq('engagement_id', engagementId)
      .maybeSingle();

    const responses: AssessmentResponses = responsesData?.responses || {};

    // Get discovery data if linked
    let discoveryData: any = null;
    if (engagement.discovery_engagement_id) {
      const { data: discovery } = await supabase
        .from('discovery_responses')
        .select('*')
        .eq('engagement_id', engagement.discovery_engagement_id)
        .maybeSingle();
      discoveryData = discovery;
    }

    // Generate AI analysis
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisPrompt = buildAnalysisPrompt(responses, engagement.client, discoveryData);
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert financial advisor helping accountants prepare for Management Accounts sales calls. 
Your task is to analyze client assessment responses and generate:
1. Primary pain points with evidence and quotes
2. Tier recommendation with rationale
3. Scenarios to pre-build
4. Talking points for the call
5. Objection handling responses

Be specific, use the client's exact words where possible, and focus on high-value insights.
Return your analysis as valid JSON.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI error:', error);
      throw new Error('Failed to generate analysis');
    }

    const aiResult = await openaiResponse.json();
    const analysis = JSON.parse(aiResult.choices[0].message.content);

    // Update engagement with analysis
    await supabase
      .from('ma_engagements')
      .update({
        ai_analysis: analysis,
        ai_analysis_generated_at: new Date().toISOString(),
        recommended_tier: analysis.tier_recommendation?.tier || 'gold',
        tier_rationale: analysis.tier_recommendation?.rationale
      })
      .eq('id', engagementId);

    // Generate talking points
    const talkingPoints = generateTalkingPoints(analysis, responses);
    
    // Delete existing talking points
    await supabase
      .from('ma_talking_points')
      .delete()
      .eq('engagement_id', engagementId);

    // Insert new talking points
    if (talkingPoints.length > 0) {
      await supabase
        .from('ma_talking_points')
        .insert(talkingPoints.map((point, idx) => ({
          engagement_id: engagementId,
          ...point,
          display_order: idx
        })));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        talkingPointsCount: talkingPoints.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildAnalysisPrompt(
  responses: AssessmentResponses, 
  client: { name: string; client_company: string | null },
  discoveryData: any
): string {
  const clientName = client.client_company || client.name;
  
  let prompt = `
# Client: ${clientName}

## Assessment Responses

### Financial Blind Spots
- Tuesday Question: "${responses.ma_tuesday_question || 'Not provided'}"
- Avoided Calculation: "${responses.ma_avoided_calculation || 'Not provided'}"
- Year-End Surprise: ${responses.ma_yearend_surprise || 'Not provided'}
- Expensive Blindspot: "${responses.ma_expensive_blindspot || 'Not provided'}"
- Numbers Relationship: ${responses.ma_numbers_relationship || 'Not provided'}

### Decision Making
- Decision Story: "${responses.ma_decision_story || 'Not provided'}"
- Decision Speed: ${responses.ma_decision_speed || 'Not provided'}
- Decision Confidence: ${responses.ma_decision_confidence || 'Not provided'}/10
- Upcoming Decisions: ${responses.ma_upcoming_decisions?.join(', ') || 'Not provided'}

### Cash & Forecasting
- 30-Day Cash Visibility: ${responses.ma_cash_visibility_30day || 'Not provided'}
- Cash Surprises: ${responses.ma_cash_surprises || 'Not provided'}
- Worst Cash Moment: "${responses.ma_worst_cash_moment || 'Not provided'}"
- Tax Preparedness: ${responses.ma_tax_preparedness || 'Not provided'}

### Current Reporting
- Current Reports: ${responses.ma_current_reports?.join(', ') || 'Not provided'}
- Report Usefulness: ${responses.ma_report_usefulness || 'Not provided'}
- What's Missing: "${responses.ma_reports_missing || 'Not provided'}"

### Desired Outcomes
- Visibility Transformation: "${responses.ma_visibility_transformation || 'Not provided'}"
- Sleep Better: "${responses.ma_sleep_better || 'Not provided'}"
- Scenario Interest: ${responses.ma_scenario_interest?.join(', ') || 'Not provided'}
- Desired Frequency: ${responses.ma_desired_frequency || 'Not provided'}
`;

  if (discoveryData) {
    prompt += `
## Discovery Assessment Context
- Sleep Thieves: ${discoveryData.sleep_thieves || 'Not provided'}
- Scaling Constraint: "${discoveryData.scaling_constraint || 'Not provided'}"
- Core Frustration: "${discoveryData.core_frustration || 'Not provided'}"
- Success Definition: "${discoveryData.success_definition || 'Not provided'}"
`;
  }

  prompt += `
## Required Output (JSON format)

Generate a JSON object with the following structure:
{
  "primary_pain_points": [
    {
      "title": "Pain point title (e.g., 'CASH VISIBILITY')",
      "confidence": "high|medium|low",
      "evidence": ["Evidence point 1", "Evidence point 2"],
      "quote": "Direct quote from their responses if available"
    }
  ],
  "tier_recommendation": {
    "tier": "bronze|silver|gold|platinum",
    "rationale": "Why this tier is recommended",
    "key_factors": ["Factor 1", "Factor 2"]
  },
  "scenarios_to_build": ["Scenario 1", "Scenario 2", "Scenario 3"],
  "opening_hook": "Suggested opening line using their Tuesday question",
  "key_quotes_to_reference": [
    {
      "context": "When to use this",
      "quote": "Their exact words",
      "follow_up": "What to say after"
    }
  ],
  "objections_anticipated": [
    {
      "objection": "The objection they might raise",
      "response": "How to handle it using their own words/situation"
    }
  ]
}

Focus on:
1. Identifying the top 2-3 pain points with HIGH confidence
2. Recommending the right tier based on their decision complexity and urgency
3. Using their EXACT words for quotes
4. Creating personalized objection handling
`;

  return prompt;
}

function generateTalkingPoints(analysis: any, responses: AssessmentResponses): any[] {
  const points: any[] = [];

  // Opening points
  if (analysis.opening_hook) {
    points.push({
      point_category: 'opening',
      point_title: 'Open With',
      point_content: analysis.opening_hook,
      source_question_id: 'ma_tuesday_question',
      source_answer: responses.ma_tuesday_question
    });
  }

  // Pain reference points
  analysis.key_quotes_to_reference?.forEach((quote: any) => {
    points.push({
      point_category: 'pain_reference',
      point_title: quote.context,
      point_content: `"${quote.quote}" - ${quote.follow_up}`,
      source_answer: quote.quote
    });
  });

  // Destination points
  if (responses.ma_visibility_transformation) {
    points.push({
      point_category: 'destination',
      point_title: 'Paint the Destination',
      point_content: `You said if you had visibility, "${responses.ma_visibility_transformation}". That's what we're building for you.`,
      source_question_id: 'ma_visibility_transformation',
      source_answer: responses.ma_visibility_transformation
    });
  }

  if (responses.ma_sleep_better) {
    points.push({
      point_category: 'destination',
      point_title: 'Sleep Better',
      point_content: `You want to "${responses.ma_sleep_better}". Let me show you what that actually looks like...`,
      source_question_id: 'ma_sleep_better',
      source_answer: responses.ma_sleep_better
    });
  }

  // Questions to ask
  if (responses.ma_decision_story) {
    points.push({
      point_category: 'question',
      point_title: 'Deepen Understanding - Decision',
      point_content: `"You mentioned [their decision]. If you'd had clear numbers, what would you have done differently?"`,
      source_question_id: 'ma_decision_story',
      source_answer: responses.ma_decision_story
    });
  }

  if (responses.ma_reports_missing) {
    points.push({
      point_category: 'question',
      point_title: 'Deepen Understanding - Reports',
      point_content: `"When you say '${responses.ma_reports_missing}', what would that actually look like? What format, how often?"`,
      source_question_id: 'ma_reports_missing',
      source_answer: responses.ma_reports_missing
    });
  }

  // Objection handling
  analysis.objections_anticipated?.forEach((obj: any) => {
    points.push({
      point_category: 'objection',
      point_title: obj.objection,
      point_content: obj.response,
      objection_response: obj.response
    });
  });

  // Standard objections with personalization
  const standardObjections = [
    {
      point_title: 'I already get accounts from my bookkeeper',
      point_content: `You mentioned those reports "${responses.ma_report_usefulness || 'weren\'t very useful'}". The difference is we're not just recording history - we're giving you forward-looking intelligence. Your bookkeeper tells you what happened. We tell you what's about to happen and what to do about it.`
    },
    {
      point_title: "That's expensive / I need to think about it",
      point_content: `You told me "${responses.ma_expensive_blindspot || 'a lack of visibility'}" cost you money. What did that actually cost? The service is £X/month. How many months before it pays for itself just by preventing one of those situations?`
    },
    {
      point_title: "I don't have time to look at reports",
      point_content: `That's exactly why you need this. You said getting answers takes "${responses.ma_decision_speed || 'too long'}". We give you a one-page summary that answers your Tuesday question in 30 seconds. Plus a monthly call where we walk through it together. You spend less time on numbers, not more.`
    }
  ];

  standardObjections.forEach(obj => {
    // Only add if not already covered by AI objections
    if (!points.find(p => p.point_title.toLowerCase().includes(obj.point_title.toLowerCase().substring(0, 20)))) {
      points.push({
        point_category: 'objection',
        point_title: obj.point_title,
        point_content: obj.point_content,
        objection_response: obj.point_content
      });
    }
  });

  return points;
}

