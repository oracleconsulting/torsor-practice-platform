// ============================================================================
// MANAGEMENT ACCOUNTS REPORT - PASS 1: EXTRACTION & ANALYSIS
// ============================================================================
// Purpose: Extract all facts, numbers, quotes from assessment. Analyze patterns.
// Generate admin guidance for follow-up call.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Declare EdgeRuntime for Supabase Edge Functions
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<any>) => void;
} | undefined;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MAPass1Output {
  clientStage: 'pre_revenue' | 'early_stage' | 'established';
  clientProfile: {
    companyName: string;
    annualRevenue: string;
    headcount: number;
    industry: string;
    discoveryLinked: boolean;
    stageIndicators?: string[];
  };
  clientQuotes: {
    tuesdayQuestion: string;
    avoidedCalculation: string;
    expensiveBlindspot: string;
    decisionStory: string;
    worstCashMoment: string | null;
    reportsMissing: string;
    visibilityTransformation: string;
    sleepBetter: string;
  };
  extractedFacts: {
    specificNames: string[];
    specificAmounts: string[];
    specificEvents: string[];
    timeframes: string[];
  };
  assessmentAnswers: {
    yearendSurprise: string;
    numbersRelationship: string;
    decisionSpeed: string;
    decisionConfidence: number;
    upcomingDecisions: string[];
    cashVisibility30Day: string;
    cashSurprises: string;
    taxPreparedness: string;
    currentReports: string[];
    reportUsefulness: string;
    scenarioInterest: string[];
    desiredFrequency: string;
  };
  painAnalysis: {
    primaryPain: {
      category: 'cash_visibility' | 'profitability' | 'decision_confidence' | 'reporting_gap';
      confidence: 'high' | 'medium' | 'low';
      evidence: string[];
    };
    secondaryPains: Array<{
      category: string;
      confidence: string;
      evidence: string[];
    }>;
  };
  findings: Array<{
    id: string;
    title: string;
    finding: string;
    implication: string;
    recommendedAction: string;
    severity: 'critical' | 'significant' | 'moderate';
    category: 'cash' | 'profitability' | 'decisions' | 'reporting' | 'operations';
  }>;
  quickWins: Array<{
    title: string;
    description: string;
    timing: string;
    benefit: string;
  }>;
  tierRecommendation: {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    rationale: string;
    keyDrivers: string[];
  };
  adminGuidance: {
    quickProfile: {
      primaryPain: string;
      secondaryPain: string;
      confidenceScore: number;
      desiredFrequency: string;
      recommendedTier: string;
    };
    quotesToUse: Array<{
      quote: string;
      context: string;
    }>;
    gapsToFill: Array<{
      gap: string;
      suggestedQuestion: string;
      whyNeeded: string;
    }>;
    questionsToAsk: Array<{
      question: string;
      purpose: string;
      listenFor: string;
    }>;
    objectionHandling: Array<{
      objection: string;
      response: string;
      theirDataToReference: string;
    }>;
    scenariosToBuild: Array<{
      type: string;
      name: string;
      reason: string;
    }>;
  };
  discoveryContext?: {
    sleepThieves: string[];
    scalingConstraint: string;
    coreFrustration: string;
    successDefinition: string;
    fiveYearVision: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId, clientId, practiceId } = await req.json();

    if (!engagementId && !clientId) {
      throw new Error('Either engagementId or clientId is required');
    }

    console.log('[MA Pass1] Starting extraction for:', engagementId ? `engagement ${engagementId}` : `client ${clientId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let clientData: any = null;
    let effectiveClientId = clientId;
    let effectivePracticeId = practiceId;
    let effectiveEngagementId = engagementId;

    // If engagementId provided, get details from engagement
    if (engagementId) {
      const { data: engagement, error: engagementError } = await supabase
        .from('ma_engagements')
        .select(`
          *,
          client:client_id (
            id, name, email, client_company
          ),
          practice:practice_id (
            id, name
          )
        `)
        .eq('id', engagementId)
        .single();

      if (engagementError || !engagement) {
        throw new Error(`Engagement not found: ${engagementError?.message}`);
      }

      clientData = engagement.client;
      effectiveClientId = engagement.client_id;
      effectivePracticeId = engagement.practice_id;
      console.log('[MA Pass1] Found engagement for client:', clientData?.name);
    } else {
      // No engagement - fetch client details from practice_members
      const { data: client, error: clientError } = await supabase
        .from('practice_members')
        .select('id, name, email, client_company, practice_id')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        throw new Error(`Client not found: ${clientError?.message}`);
      }

      clientData = client;
      effectiveClientId = clientId;
      effectivePracticeId = client.practice_id; // Get practice from the client record
      console.log('[MA Pass1] Working with client directly (no engagement):', clientData?.name);
    }

    // Get assessment responses from service_line_assessments
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('service_line_assessments')
      .select('responses, extracted_insights, completed_at')
      .eq('client_id', effectiveClientId)
      .eq('service_line_code', 'management_accounts')
      .single();

    if (assessmentError || !assessmentData?.responses) {
      throw new Error(`Assessment responses not found: ${assessmentError?.message}`);
    }

    console.log('[MA Pass1] Found assessment responses:', Object.keys(assessmentData.responses).length, 'answers');

    // Check for linked discovery engagement (only if we have an engagement with discovery link)
    let discoveryData = null;
    // Try to find discovery data via discovery_engagements for this client
    const { data: discoveryEngagement } = await supabase
      .from('discovery_engagements')
      .select('*')
      .eq('client_id', effectiveClientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (discoveryEngagement) {
      discoveryData = discoveryEngagement;
      console.log('[MA Pass1] Found linked discovery data');
    }

    // Create or update report record
    // First try to find existing report by client_id (since we may not have engagement)
    let existingReport = null;
    if (effectiveEngagementId) {
      const { data } = await supabase
        .from('ma_assessment_reports')
        .select('id')
        .eq('engagement_id', effectiveEngagementId)
        .maybeSingle();
      existingReport = data;
    }
    
    // Also check by client_id if no engagement
    if (!existingReport && effectiveClientId) {
      const { data } = await supabase
        .from('ma_assessment_reports')
        .select('id')
        .eq('client_id', effectiveClientId)
        .maybeSingle();
      existingReport = data;
    }

    let reportId: string;
    if (existingReport) {
      reportId = existingReport.id;
      await supabase
        .from('ma_assessment_reports')
        .update({ 
          status: 'pass1_running',
          error_message: null,
          error_at: null
        })
        .eq('id', reportId);
    } else {
      const { data: newReport, error: createError } = await supabase
        .from('ma_assessment_reports')
        .insert({
          client_id: effectiveClientId,
          practice_id: effectivePracticeId,
          engagement_id: effectiveEngagementId || null,
          status: 'pass1_running',
          discovery_engagement_id: discoveryData?.id || null
        })
        .select('id')
        .single();

      if (createError) throw createError;
      reportId = newReport.id;
    }

    console.log('[MA Pass1] Report ID:', reportId);

    // Return immediately - the frontend will poll for status
    // Process the AI work in the background
    const backgroundProcess = async () => {
      try {
        // Build the prompt
        const prompt = buildPass1Prompt(
          assessmentData.responses,
          clientData,
          discoveryData
        );

        // Call Claude API
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
        if (!openRouterKey) {
          throw new Error('OPENROUTER_API_KEY not configured');
        }

        console.log('[MA Pass1] Calling Claude Sonnet 4.5 via OpenRouter...');

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://torsor.co.uk',
            'X-Title': 'Torsor MA Report Pass1',
          },
          body: JSON.stringify({
            model: 'anthropic/claude-sonnet-4.5',
            max_tokens: 8000,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }

        const openRouterResponse = await response.json();
        const content = openRouterResponse.choices?.[0]?.message?.content || '';
        
        if (!content) {
          throw new Error('Empty response from AI');
        }

        // Parse JSON response
        let pass1Data: MAPass1Output;
        try {
          // Extract JSON from response (handle markdown code blocks)
          let jsonStr = content;
          if (content.includes('```json')) {
            jsonStr = content.split('```json')[1].split('```')[0].trim();
          } else if (content.includes('```')) {
            jsonStr = content.split('```')[1].split('```')[0].trim();
          }
          pass1Data = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('[MA Pass1] JSON parse error:', parseError);
          console.error('[MA Pass1] Raw content:', content.substring(0, 500));
          throw new Error('Failed to parse Claude response as JSON');
        }

        // Calculate cost (OpenRouter uses OpenAI-style usage format)
        const inputTokens = openRouterResponse.usage?.prompt_tokens || 0;
        const outputTokens = openRouterResponse.usage?.completion_tokens || 0;
        const cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;

        // Update report with pass1 data
        const { error: updateError } = await supabase
          .from('ma_assessment_reports')
          .update({
            status: 'pass1_complete',
            pass1_data: pass1Data,
            pass1_completed_at: new Date().toISOString(),
            pass1_model: 'anthropic/claude-sonnet-4.5',
            pass1_cost: cost,
            admin_view: pass1Data.adminGuidance, // Admin view is primarily from pass1
          })
          .eq('id', reportId);

        if (updateError) {
          throw new Error(`Failed to update report: ${updateError.message}`);
        }

        console.log('[MA Pass1] Pass 1 complete. Triggering Pass 2...');

        // Trigger Pass 2 automatically - pass reportId so pass2 can find the report
        const pass2Response = await fetch(
          `${supabaseUrl}/functions/v1/generate-ma-report-pass2`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ 
              reportId,
              engagementId: effectiveEngagementId,
              clientId: effectiveClientId 
            }),
          }
        );

        if (!pass2Response.ok) {
          console.error('[MA Pass1] Pass 2 trigger failed, but Pass 1 is complete');
        }

        console.log('[MA Pass1] Background processing complete');

      } catch (bgError: any) {
        console.error('[MA Pass1] Background processing error:', bgError);
        // Update report with error status
        await supabase
          .from('ma_assessment_reports')
          .update({
            status: 'error',
            error_message: bgError.message,
            error_at: new Date().toISOString(),
          })
          .eq('id', reportId);
      }
    };

    // Start background processing (don't await - let it run)
    // Use EdgeRuntime.waitUntil if available, otherwise just start the promise
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundProcess());
    } else {
      // Fallback: start the promise without awaiting
      backgroundProcess();
    }

    // Return immediately with report ID - frontend will poll for status
    return new Response(
      JSON.stringify({
        success: true,
        reportId,
        status: 'pass1_running',
        message: 'Report generation started. Poll for status updates.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[MA Pass1] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildPass1Prompt(
  assessmentResponses: Record<string, any>,
  clientData: any,
  discoveryData: any
): string {
  const companyName = clientData?.client_company || clientData?.name || 'Unknown Company';
  
  return `You are analyzing a Management Accounts assessment for a UK accountancy practice.

## YOUR TASK
Extract ALL facts, numbers, names, and quotes from the assessment responses.
Analyze the patterns to identify pain points and recommendations.
Generate practical admin guidance for the follow-up call.

## CLIENT STAGE DETECTION (CRITICAL)
First, determine the client's business stage. This affects everything else:

**PRE_REVENUE** - Identify if ANY of these apply:
- Zero MRR/ARR, no customers yet
- "Pre-revenue", "haven't started trading", "startup", "no revenue yet"
- Only has runway/burn rate, no income
- Building product but no sales
- Seeking seed funding before revenue

**EARLY_STAGE** - Less than 2 years of trading OR:
- Under £250k annual revenue
- Still finding product-market fit
- Erratic/unpredictable revenue patterns
- Small customer base (<10 customers)

**ESTABLISHED** - Default if neither above:
- Predictable revenue patterns
- Multiple years of trading history
- Stable customer base
- Historical data to analyze

The client stage MUST be set correctly as it determines:
- Which gaps to ask about
- What value proposition to show
- How to frame recommendations

## ASSESSMENT RESPONSES
${JSON.stringify(assessmentResponses, null, 2)}

## CLIENT DETAILS
Company: ${companyName}
Contact: ${clientData?.name || 'Unknown'}
Email: ${clientData?.email || 'Unknown'}

${discoveryData ? `
## DISCOVERY ASSESSMENT DATA (from earlier assessment)
This client previously completed a Discovery assessment. Use this context:
${JSON.stringify(discoveryData, null, 2)}
` : ''}

## EXTRACTION RULES
1. Extract EVERY specific name mentioned (people, companies, contracts) - e.g., "Sarah", "Henderson contract", "Hartley & Co"
2. Extract EVERY specific number/amount mentioned - e.g., "£95k", "£180k", "30 days"
3. Extract EVERY specific event or incident described - e.g., "February crisis", "delayed hire"
4. Preserve exact quotes - do not paraphrase. Use their actual words.
5. Note timeframes and sequences - "four months", "last year"

## ANALYSIS RULES
1. Primary pain = the thing that comes up most often with most evidence
2. Confidence score comes from their self-assessment (question about decision confidence)
3. Tier recommendation based on CLIENT STAGE + needs:

   **For PRE-REVENUE clients:**
   - Bronze: Basic burn rate tracking, simple runway monitoring
   - Silver: Scenario modelling for hiring decisions, runway planning
   - Gold (often best): Investor-ready financials, milestone tracking, comprehensive scenario planning
   - Platinum: Multiple stakeholders, board reporting, complex cap table

   **For EARLY-STAGE clients:**
   - Bronze: Basic MRR tracking, simple cash position
   - Silver: Growth trend analysis, unit economics starting
   - Gold: Full scenario modelling, break-even planning, hiring decisions
   - Platinum: Board-level reporting, multiple product lines

   **For ESTABLISHED clients:**
   - Bronze (£750): Just wants basics, low engagement with numbers, stable business
   - Silver (£1,500): Wants trends and insights, medium engagement, some decisions coming
   - Gold (£3,000): Wants scenarios and forecasting, upcoming major decisions, cash concerns
   - Platinum (£5,000): Complex needs, board reporting, high frequency, multiple stakeholders

## ADMIN GUIDANCE RULES
1. Gaps to fill = information we need but don't have for accurate forecasting
2. Questions to ask should use their specific situation, not generic questions
3. Objection handling must reference their own data/stories from the assessment
4. Quotes to use = short, punchy, emotional - not full paragraphs

## MANDATORY GAPS TO FILL (Adjust based on client stage):

### FOR ALL CLIENTS:
- Current bank balance: "What's your current bank balance, roughly?"
- Year-end date: "When does your financial year end?"
- VAT status: "Are you VAT registered? When's your next VAT payment due?"
- Imminent expenses: "Any large expenses or investments coming up in the next 3 months?"

### FOR PRE-REVENUE CLIENTS (add these):
- Monthly burn rate: "What's your monthly burn rate / operating cost?"
- Runway calculation: "How many months of runway do you have?"
- Funding timeline: "When are you planning to raise, and how much?"
- Revenue projections: "Do you have revenue projections? What assumptions?"
- First customer target: "When do you expect your first customer?"
- Key milestones: "What milestones trigger next decisions (e.g., hiring, funding)?"

### FOR EARLY-STAGE CLIENTS (add these):
- Current MRR/ARR: "What's your current MRR and ARR?"
- Customer count: "How many paying customers do you have?"
- Monthly burn vs revenue: "What's the gap between income and costs?"
- Break-even timeline: "When do you expect to break even?"
- Hiring plans: If mentioned - "What roles, when, and at what salary?"

### FOR ESTABLISHED CLIENTS (add these):
- Expected receivables: "Any significant invoices you're expecting payment on soon?"
- Seasonal patterns: "Does your business have seasonal cash patterns?"
- Major contracts: "Any large contracts coming up for renewal?"
- Growth plans: "What growth initiatives are you considering?"

Add these to gapsToFill with appropriate suggested questions based on their specific context and stage.

## FINDINGS RULES
1. Maximum 5 findings, prioritize by severity and impact
2. Each finding must reference specific details from their responses
3. Recommendations should be actionable and specific

## QUICK WINS RULES
1. Exactly 3 quick wins
2. Things they can implement immediately with existing data
3. Demonstrate competence before formal engagement

## KPI RECOMMENDATION RULES
Recommend KPIs based on the client's situation. Available KPIs by code:

**Cash & Working Capital:**
- true_cash (ALWAYS include - mandatory)
- debtor_days (if they mention collection issues, cash problems)
- creditor_days (if they pay suppliers slowly or manage cash flow)
- cash_conversion_cycle (for service businesses with WIP)
- working_capital_ratio (if cash tight or balance sheet concerns)

**Revenue & Growth:**
- monthly_revenue (basic tracking)
- yoy_revenue_growth (if comparing to last year)
- avg_project_value (agencies, consultancies)
- revenue_per_employee (if headcount/efficiency mentioned)
- recurring_revenue_pct (subscription/retainer businesses)

**Profitability:**
- gross_margin (if direct costs, pricing issues)
- operating_margin (overall profitability concerns)
- net_margin (bottom line focus)
- revenue_per_salary (if salaries high burden)
- overhead_pct (if overhead/cost control mentioned)

**Utilisation & Efficiency:**
- billable_utilisation (time-based businesses)
- effective_hourly_rate (if rate leakage or discounting)
- wip_value (if billing delays, unbilled work)
- project_margin (client profitability analysis)

**Client Health:**
- client_concentration (if dependent on key clients)
- client_retention (if churn concerns)
- client_lifetime_value (strategic client focus)
- new_client_revenue_pct (business development balance)

Recommend based on tier limits:
- Bronze: 3 KPIs (true_cash + 2 most relevant)
- Silver: 5 KPIs (true_cash + 4 most relevant)
- Gold: 8 KPIs (true_cash + 7 most relevant)
- Platinum: Recommend comprehensive set

## OUTPUT FORMAT
Return ONLY valid JSON matching this exact structure (no markdown, no explanation):

{
  "clientStage": "pre_revenue|early_stage|established",
  "clientProfile": {
    "companyName": "string",
    "annualRevenue": "string estimate based on context",
    "headcount": number,
    "industry": "string",
    "discoveryLinked": boolean,
    "stageIndicators": ["evidence for chosen stage"]
  },
  "clientQuotes": {
    "tuesdayQuestion": "their exact Tuesday question",
    "avoidedCalculation": "what they avoid calculating",
    "expensiveBlindspot": "their costly blind spot story",
    "decisionStory": "their decision-making story",
    "worstCashMoment": "their cash crisis story or null",
    "reportsMissing": "what reports don't tell them",
    "visibilityTransformation": "what would change with visibility",
    "sleepBetter": "what would help them sleep better"
  },
  "extractedFacts": {
    "specificNames": ["array of names mentioned"],
    "specificAmounts": ["array of amounts mentioned"],
    "specificEvents": ["array of events/incidents"],
    "timeframes": ["array of timeframes mentioned"]
  },
  "assessmentAnswers": {
    "yearendSurprise": "their answer",
    "numbersRelationship": "their answer",
    "decisionSpeed": "their answer",
    "decisionConfidence": number 1-10,
    "upcomingDecisions": ["array"],
    "cashVisibility30Day": "their answer",
    "cashSurprises": "their answer",
    "taxPreparedness": "their answer",
    "currentReports": ["array"],
    "reportUsefulness": "their answer",
    "scenarioInterest": ["array"],
    "desiredFrequency": "their answer"
  },
  "painAnalysis": {
    "primaryPain": {
      "category": "cash_visibility|profitability|decision_confidence|reporting_gap",
      "confidence": "high|medium|low",
      "evidence": ["evidence strings"]
    },
    "secondaryPains": [{"category": "string", "confidence": "string", "evidence": ["strings"]}]
  },
  "findings": [
    {
      "id": "finding_1",
      "title": "Short punchy title",
      "finding": "What we found using their specifics",
      "implication": "Why it matters",
      "recommendedAction": "What to do",
      "severity": "critical|significant|moderate",
      "category": "cash|profitability|decisions|reporting|operations"
    }
  ],
  "quickWins": [
    {
      "title": "Quick win title",
      "description": "What to do",
      "timing": "When/how long",
      "benefit": "What they'll gain"
    }
  ],
  "tierRecommendation": {
    "tier": "bronze|silver|gold|platinum",
    "rationale": "Why this tier",
    "keyDrivers": ["What drove this recommendation"]
  },
  "kpiRecommendations": [
    {
      "kpi_code": "KPI code from list below",
      "priority": 1,
      "rationale": "Why this KPI matters for this client"
    }
  ],
  "adminGuidance": {
    "quickProfile": {
      "primaryPain": "One line summary",
      "secondaryPain": "One line summary",
      "confidenceScore": number,
      "desiredFrequency": "string",
      "recommendedTier": "string"
    },
    "quotesToUse": [
      {"quote": "Short quote", "context": "When to use it"}
    ],
    "gapsToFill": [
      {"gap": "What's missing", "suggestedQuestion": "How to ask", "whyNeeded": "Why we need it"}
    ],
    "questionsToAsk": [
      {"question": "The question", "purpose": "Why ask", "listenFor": "What to note"}
    ],
    "objectionHandling": [
      {"objection": "Common objection", "response": "How to respond", "theirDataToReference": "Their data to use"}
    ],
    "scenariosToBuild": [
      {"type": "hire|price|client_loss", "name": "Scenario name", "reason": "Why build this"}
    ]
  }${discoveryData ? `,
  "discoveryContext": {
    "sleepThieves": ["from discovery"],
    "scalingConstraint": "from discovery",
    "coreFrustration": "from discovery",
    "successDefinition": "from discovery",
    "fiveYearVision": "from discovery"
  }` : ''}
}`;
}

