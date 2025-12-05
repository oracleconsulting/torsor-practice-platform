// ============================================================================
// DISCOVERY REPORT GENERATOR
// ============================================================================
// Generates a comprehensive analysis report from discovery responses
// Positions services as INVESTMENTS with clear ROI projections
// Uses client's own words to build compelling value cases
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// SERVICE LINE DEFINITIONS WITH ROI DATA
// ============================================================================

interface ServiceLine {
  code: string;
  name: string;
  monthlyInvestment: { min: number; max: number };
  typicalROI: {
    timeframeMo: number;
    multiplier: number;
    description: string;
  };
  valueDrivers: string[];
  costOfNotActing: string[];
}

const SERVICE_LINES: Record<string, ServiceLine> = {
  '365_method': {
    code: '365_method',
    name: '365 Alignment Programme',
    monthlyInvestment: { min: 5000, max: 5000 },
    typicalROI: {
      timeframeMo: 12,
      multiplier: 3,
      description: 'Clients typically see 3x ROI within 12 months through focused execution and strategic clarity'
    },
    valueDrivers: [
      'Clarity on 5-year direction saves months of wasted effort',
      'Accountability drives 40% better execution on strategic priorities',
      '12-week sprints accelerate results vs. annual planning',
      'Life-first approach prevents burnout and maintains motivation'
    ],
    costOfNotActing: [
      'Another year of drifting without progress',
      'Continued feeling of being trapped in your own business',
      'Missed opportunities from lack of strategic focus'
    ]
  },
  'fractional_cfo': {
    code: 'fractional_cfo',
    name: 'Fractional CFO Services',
    monthlyInvestment: { min: 3500, max: 12000 },
    typicalROI: {
      timeframeMo: 6,
      multiplier: 5,
      description: 'Financial clarity typically returns 5x investment through better decisions, cash management, and pricing'
    },
    valueDrivers: [
      'Cash flow forecasting prevents liquidity crises',
      'Pricing optimization typically adds 5-15% to margins',
      'Board-quality financial reporting supports growth funding',
      'Strategic financial planning enables confident decision-making'
    ],
    costOfNotActing: [
      'Decisions made without full financial picture',
      'Cash flow surprises causing sleepless nights',
      'Missed opportunities from lack of investor-ready financials',
      'Pricing left on the table due to uncertainty'
    ]
  },
  'systems_audit': {
    code: 'systems_audit',
    name: 'Systems Audit',
    monthlyInvestment: { min: 3000, max: 3000 },
    typicalROI: {
      timeframeMo: 3,
      multiplier: 4,
      description: 'Systems improvements typically return 4x in time savings and error reduction within 3 months'
    },
    valueDrivers: [
      'Identify hidden inefficiencies costing hours per week',
      'Integration opportunities reduce manual data entry',
      'Clear roadmap prioritizes highest-impact fixes',
      'Foundation for automation and scaling'
    ],
    costOfNotActing: [
      'Team time wasted on manual workarounds',
      'Errors from disconnected systems',
      'Inability to scale without chaos',
      'Key person dependencies creating risk'
    ]
  },
  'management_accounts': {
    code: 'management_accounts',
    name: 'Management Accounts',
    monthlyInvestment: { min: 650, max: 650 },
    typicalROI: {
      timeframeMo: 2,
      multiplier: 10,
      description: 'Monthly visibility pays for itself many times over through informed decisions'
    },
    valueDrivers: [
      'Monthly P&L with commentary, not just numbers',
      'Cash flow visibility prevents surprises',
      'KPI tracking shows what actually matters',
      'Trend analysis spots problems before they become crises'
    ],
    costOfNotActing: [
      'Flying blind on financial performance',
      'Decisions based on gut feel rather than data',
      'Problems discovered too late to address easily'
    ]
  },
  'fractional_coo': {
    code: 'fractional_coo',
    name: 'Fractional COO Services',
    monthlyInvestment: { min: 3000, max: 10000 },
    typicalROI: {
      timeframeMo: 6,
      multiplier: 4,
      description: 'Operational leadership typically delivers 4x ROI through team productivity and owner time liberation'
    },
    valueDrivers: [
      'Systems and processes that run without you',
      'Team management and performance optimization',
      'Capacity planning prevents feast-or-famine cycles',
      'Owner time freed for strategic work'
    ],
    costOfNotActing: [
      'Remaining the bottleneck in your own business',
      'Unable to take meaningful time off',
      'Team issues consuming your strategic time',
      'Scaling limited by your personal capacity'
    ]
  },
  'combined_advisory': {
    code: 'combined_advisory',
    name: 'Combined CFO/COO Advisory',
    monthlyInvestment: { min: 8000, max: 15000 },
    typicalROI: {
      timeframeMo: 6,
      multiplier: 5,
      description: 'Executive partnership across finance and operations delivers comprehensive transformation'
    },
    valueDrivers: [
      'Holistic view of financial AND operational performance',
      'Single point of accountability for business performance',
      'Strategic decisions supported by complete picture',
      'Board-level thinking available on-demand'
    ],
    costOfNotActing: [
      'Making decisions with incomplete information',
      'Operational and financial issues addressed in silos',
      'No executive partner to pressure-test your thinking'
    ]
  },
  'automation': {
    code: 'automation',
    name: 'Automation Services',
    monthlyInvestment: { min: 1500, max: 1500 },
    typicalROI: {
      timeframeMo: 3,
      multiplier: 8,
      description: 'Automation typically delivers 8x ROI through eliminated manual work and reduced errors'
    },
    valueDrivers: [
      'Repetitive tasks eliminated permanently',
      'Zero-error execution on routine processes',
      'Team freed for higher-value work',
      'Scales without adding headcount'
    ],
    costOfNotActing: [
      'Team time wasted on tasks machines should do',
      'Human errors in repetitive processes',
      'Scaling requires proportional headcount increases'
    ]
  },
  'business_advisory': {
    code: 'business_advisory',
    name: 'Business Advisory & Exit Planning',
    monthlyInvestment: { min: 9000, max: 9000 },
    typicalROI: {
      timeframeMo: 24,
      multiplier: 10,
      description: 'Exit planning typically increases final sale value by 2-3x through proper preparation'
    },
    valueDrivers: [
      'Understand true business value today',
      'Identify and fix value-detractors before sale',
      'Build relationships with potential acquirers',
      'Maximize value when you do decide to exit'
    ],
    costOfNotActing: [
      'Selling for fraction of potential value',
      'Value-detractors discovered during due diligence',
      'Rushed exit due to unforeseen circumstances',
      'Years of work not reflected in sale price'
    ]
  }
};

// ============================================================================
// ANALYSIS PROMPTS
// ============================================================================

const ANALYSIS_SYSTEM_PROMPT = `You are a senior business advisor at RPGCC, a boutique accountancy and advisory practice. 
You are analyzing a discovery assessment to produce a comprehensive report for the practice team.

Your role is to:
1. Deeply understand what the client REALLY wants (their destination)
2. Identify the gaps between where they are and where they want to be
3. Diagnose the root causes of their challenges
4. Recommend specific services that will get them to their destination
5. Frame every recommendation as an INVESTMENT with clear ROI, not a cost

Key principles:
- Use the client's OWN WORDS from their responses - they should feel heard
- Be specific and actionable, not generic
- Quantify the impact wherever possible
- Focus on outcomes, not activities
- Position inaction as the risky choice
- Show how the investment pays for itself

Writing style:
- Direct and confident, not salesy
- Empathetic but pragmatic
- Business-focused with emotional intelligence
- Clear section headers and bullet points for skimmability`;

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const { clientId, practiceId, discoveryId } = await req.json();

    if (!clientId) {
      throw new Error('clientId is required');
    }

    // ========================================================================
    // 1. FETCH ALL CLIENT DATA
    // ========================================================================

    // Get client info
    const { data: client } = await supabase
      .from('practice_members')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!client) {
      throw new Error('Client not found');
    }

    // Get discovery data
    const { data: discovery } = await supabase
      .from('destination_discovery')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!discovery) {
      throw new Error('No discovery data found for this client');
    }

    // Get any uploaded documents/context
    const { data: contextDocs } = await supabase
      .from('client_context')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    // Get practice info for branding
    const { data: practice } = await supabase
      .from('practices')
      .select('name, branding')
      .eq('id', practiceId || client.practice_id)
      .single();

    // ========================================================================
    // 2. PREPARE CONTEXT FOR AI ANALYSIS
    // ========================================================================

    const responses = discovery.responses || {};
    const anchors = discovery.extracted_anchors || {};
    const recommendations = discovery.recommended_services || [];

    // Build comprehensive context
    const clientContext = {
      // Basic info
      name: client.name,
      company: client.client_company || 'Not provided',
      email: client.email,

      // Discovery scores
      destinationClarityScore: discovery.destination_clarity_score,
      gapScore: discovery.gap_score,

      // Raw responses (their words)
      responses: Object.entries(responses).map(([key, value]) => ({
        question: key,
        answer: value
      })),

      // Extracted emotional anchors
      emotionalAnchors: anchors,

      // AI recommendations from discovery
      serviceRecommendations: recommendations.map((r: any) => ({
        service: r.service?.name || r.code,
        score: r.score,
        valueProposition: r.valueProposition
      })),

      // Additional context from documents
      additionalContext: contextDocs?.map(doc => ({
        type: doc.context_type,
        content: doc.content?.substring(0, 500),
        date: doc.created_at
      })) || []
    };

    // ========================================================================
    // 3. GENERATE AI ANALYSIS
    // ========================================================================

    const analysisPrompt = `
Analyze this discovery assessment for ${client.name} (${client.client_company || 'their business'}) and produce a comprehensive report.

## CLIENT DISCOVERY DATA
${JSON.stringify(clientContext, null, 2)}

## AVAILABLE SERVICES & ROI DATA
${JSON.stringify(SERVICE_LINES, null, 2)}

## REQUIRED OUTPUT FORMAT
Generate a JSON object with the following structure:

{
  "executiveSummary": {
    "headline": "One powerful sentence that captures their situation",
    "destinationVision": "What they really want, in their own words",
    "currentReality": "Where they are now and why it's painful",
    "keyInsight": "The most important thing we've learned about them"
  },
  "destinationAnalysis": {
    "fiveYearVision": "Their destination summarized",
    "emotionalDrivers": ["What really motivates them - their emotional anchors"],
    "successMetrics": "How they'll know they've arrived"
  },
  "gapAnalysis": {
    "primaryGaps": [
      {
        "gap": "Description of gap",
        "impact": "What this is costing them",
        "urgency": "high|medium|low",
        "rootCause": "Why this gap exists"
      }
    ],
    "hiddenChallenges": ["Things they may not have articulated but are implied"],
    "costOfInaction": {
      "annual": "Estimated annual cost of doing nothing",
      "description": "What staying the same will cost them"
    }
  },
  "recommendedInvestments": [
    {
      "service": "Service name",
      "code": "service_code",
      "priority": 1,
      "monthlyInvestment": "£X,XXX",
      "annualInvestment": "£XX,XXX",
      "expectedROI": {
        "multiplier": "Xx",
        "timeframe": "X months",
        "description": "How the investment pays back"
      },
      "whyThisService": "Specific reason this service addresses their needs",
      "theirWordsConnection": "Quote from their responses that this addresses",
      "expectedOutcomes": ["Specific outcomes they can expect"],
      "alternativeToNotActing": "What happens if they don't invest in this"
    }
  ],
  "investmentSummary": {
    "totalMonthlyInvestment": "£X,XXX",
    "totalAnnualInvestment": "£XX,XXX",
    "projectedAnnualReturn": "£XXX,XXX",
    "paybackPeriod": "X months",
    "riskOfNotInvesting": "Summary of what they stand to lose"
  },
  "recommendedNextSteps": [
    {
      "step": 1,
      "action": "Specific action",
      "owner": "Client|RPGCC",
      "timing": "When this should happen"
    }
  ],
  "closingMessage": "A motivating, action-oriented closing that connects back to their destination"
}

Important:
- Use their EXACT WORDS from responses where possible (quote them)
- Be specific with numbers and timeframes
- Frame everything as investment vs return, not cost
- Make the cost of inaction feel more risky than investing
- Keep recommendations to top 2-3 services max (focused)
- Ensure recommendations match their stated priorities and gaps
`;

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Discovery Report'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: analysisPrompt }
        ]
      })
    });

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`AI analysis failed: ${openrouterResponse.status}`);
    }

    const openrouterData = await openrouterResponse.json();
    const analysisText = openrouterData.choices?.[0]?.message?.content || '';

    // Parse the JSON from the response
    let analysis;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw response:', analysisText);
      throw new Error('Failed to parse AI analysis');
    }

    // ========================================================================
    // 4. SAVE REPORT TO DATABASE
    // ========================================================================

    const report = {
      client_id: clientId,
      practice_id: practiceId || client.practice_id,
      discovery_id: discovery.id,
      report_type: 'discovery_analysis',
      report_data: {
        generatedAt: new Date().toISOString(),
        clientName: client.name,
        companyName: client.client_company,
        analysis,
        discoveryScores: {
          clarityScore: discovery.destination_clarity_score,
          gapScore: discovery.gap_score
        },
        sourceData: {
          responseCount: Object.keys(responses).length,
          hasEmotionalAnchors: Object.keys(anchors).length > 0,
          contextDocsCount: contextDocs?.length || 0
        }
      },
      created_at: new Date().toISOString()
    };

    // Store the report
    const { data: savedReport, error: saveError } = await supabase
      .from('client_reports')
      .insert(report)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
      // Continue anyway - we can still return the report
    }

    // ========================================================================
    // 5. UPDATE DISCOVERY RECORD WITH ANALYSIS
    // ========================================================================

    await supabase
      .from('destination_discovery')
      .update({
        analysis_completed_at: new Date().toISOString(),
        analysis_report_id: savedReport?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', discovery.id);

    // ========================================================================
    // 6. RETURN REPORT
    // ========================================================================

    return new Response(JSON.stringify({
      success: true,
      report: {
        id: savedReport?.id,
        generatedAt: new Date().toISOString(),
        client: {
          name: client.name,
          company: client.client_company,
          email: client.email
        },
        practice: {
          name: practice?.name || 'RPGCC'
        },
        discoveryScores: {
          clarityScore: discovery.destination_clarity_score,
          gapScore: discovery.gap_score
        },
        analysis
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

