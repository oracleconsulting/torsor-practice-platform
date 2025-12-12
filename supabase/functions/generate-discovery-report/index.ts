// ============================================================================
// DISCOVERY REPORT GENERATOR
// ============================================================================
// Generates a comprehensive analysis report from discovery responses
// Positions services as INVESTMENTS with clear ROI projections
// Uses client's own words to build compelling value cases
// 
// Updated: December 2025
// - Upgraded to Claude Opus 4 for premium quality analysis
// - Integrates with pattern detection for pre-analysis
// - Enhanced prompts for capital raising and lifestyle transformation
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Max-Age': '86400',
}

// Use Claude Opus 4.5 for premium quality discovery reports
const MODEL = 'anthropic/claude-opus-4.5';

// ============================================================================
// INLINE COST TRACKING (to avoid module import issues)
// ============================================================================

interface LLMUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  executionTimeMs: number;
}

const PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'anthropic/claude-opus-4.5': { inputPer1M: 15.00, outputPer1M: 75.00 },
  'anthropic/claude-sonnet-4-20250514': { inputPer1M: 3.00, outputPer1M: 15.00 },
  'anthropic/claude-3.5-sonnet': { inputPer1M: 3.00, outputPer1M: 15.00 },
};

function calculateCost(usage: LLMUsage): number {
  const pricing = PRICING[usage.model];
  if (!pricing) return 0;
  return (usage.inputTokens / 1_000_000) * pricing.inputPer1M + 
         (usage.outputTokens / 1_000_000) * pricing.outputPer1M;
}

function extractUsageFromResponse(response: any): { inputTokens: number; outputTokens: number } {
  const usage = response?.usage || {};
  return {
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0
  };
}

async function trackLLMExecution(supabase: any, record: any): Promise<void> {
  const cost = calculateCost(record);
  try {
    await supabase.from('llm_execution_history').insert({
      function_name: record.functionName,
      model: record.model,
      input_tokens: record.inputTokens,
      output_tokens: record.outputTokens,
      cost_usd: cost,
      execution_time_ms: record.executionTimeMs,
      entity_type: record.entityType,
      entity_id: record.entityId,
      success: record.success,
      error_message: record.error,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Error tracking LLM execution:', e);
  }
}

// ============================================================================
// SERVICE LINE DEFINITIONS WITH ACCURATE PRICING (from BSG Launch Strategy)
// ============================================================================

interface ServiceLineTier {
  name: string;
  price: number;  // Annual or one-off price
  isMonthly?: boolean;
  description: string;
}

interface ServiceLine {
  code: string;
  name: string;
  tiers: ServiceLineTier[];
  isRecurring: boolean;  // true = monthly/annual, false = one-off project
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
    tiers: [
      { name: 'Lite', price: 1500, description: 'Survey + plan + one review' },
      { name: 'Growth', price: 4500, description: 'Adds quarterly reviews for 12 months' },
      { name: 'Partner', price: 9000, description: 'Adds strategy day + BSG integration' }
    ],
    isRecurring: false,  // Annual engagement, not monthly
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
    tiers: [
      { name: '2 days/month', price: 4000, isMonthly: true, description: '£3,500-£5,000/month' },
      { name: '1 day/week', price: 7000, isMonthly: true, description: '£6,000-£8,000/month' },
      { name: '2-3 days/week', price: 12500, isMonthly: true, description: '£10,000-£15,000/month' }
    ],
    isRecurring: true,
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
    tiers: [
      { name: '1 area', price: 1500, description: 'Diagnostic - single area focus' },
      { name: '2 areas', price: 2500, description: 'Diagnostic - two areas' },
      { name: 'Comprehensive', price: 4000, description: 'Full diagnostic (3+ areas)' },
      { name: 'Implementation', price: 3500, description: '£2,000-£5,000 to implement fixes' }
    ],
    isRecurring: false,
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
    tiers: [
      { name: 'Monthly', price: 650, isMonthly: true, description: '£650/month with Spotlight analysis' },
      { name: 'Quarterly', price: 1750, description: '£1,750/quarter with Spotlight analysis' }
    ],
    isRecurring: true,
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
    tiers: [
      { name: '2 days/month', price: 3750, isMonthly: true, description: '£3,000-£4,500/month' },
      { name: '1 day/week', price: 6500, isMonthly: true, description: '£5,500-£7,500/month' },
      { name: '2-3 days/week', price: 11500, isMonthly: true, description: '£9,000-£14,000/month' },
      { name: '60-day intensive', price: 55000, description: '£35,000-£75,000 transformation' }
    ],
    isRecurring: true,
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
    tiers: [
      { name: 'Light touch (3 days/month)', price: 7000, isMonthly: true, description: '£6,000-£8,000/month' },
      { name: 'Standard (2 days/week)', price: 15000, isMonthly: true, description: '£12,000-£18,000/month' },
      { name: 'Intensive (3-4 days/week)', price: 24000, isMonthly: true, description: '£20,000-£28,000/month' },
      { name: 'Single practitioner dual-role', price: 14000, isMonthly: true, description: '£10,000-£18,000/month' }
    ],
    isRecurring: true,
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
    tiers: [
      { name: 'Per hour', price: 150, description: '£115-£180/hour' },
      { name: 'Half day', price: 600, description: 'Typically £500-£700' },
      { name: 'Full day', price: 1100, description: 'Typically £1,000-£1,200' },
      { name: 'Monthly retainer', price: 1500, isMonthly: true, description: 'Support & maintenance' }
    ],
    isRecurring: false,
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
    tiers: [
      { name: 'Forecasts', price: 2000, description: '£1,000-£3,000 (execution to full workshop)' },
      { name: 'Valuations', price: 2750, description: '£1,500-£4,000 depending on scope' },
      { name: 'Full Advisory Package', price: 4000, description: 'Forecasts + advisory sessions' }
    ],
    isRecurring: false,
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
  },
  'benchmarking': {
    code: 'benchmarking',
    name: 'Benchmarking Services',
    tiers: [
      { name: 'Simple Report', price: 450, description: 'Base cost report only' },
      { name: 'Report + Consultation', price: 2700, description: '£1,200 report + £1,500 meeting' },
      { name: 'Full Package', price: 3500, description: 'Comprehensive with strategic interpretation' }
    ],
    isRecurring: false,
    typicalROI: {
      timeframeMo: 3,
      multiplier: 5,
      description: 'Benchmarking insights typically drive 5x value through targeted improvements'
    },
    valueDrivers: [
      'Know exactly how you compare to industry peers',
      'Identify specific areas for improvement',
      'Objective data to support strategic decisions',
      'Spot opportunities competitors are missing'
    ],
    costOfNotActing: [
      'Operating blind vs. industry standards',
      'Unknowingly underperforming peers',
      'Missing improvement opportunities'
    ]
  }
};

// ============================================================================
// ANALYSIS PROMPTS - Enhanced December 2025
// ============================================================================

const ANALYSIS_SYSTEM_PROMPT = `You are a senior business advisor with deep expertise in business transformation, personal development, and strategic planning. You are analyzing a discovery assessment for a client who represents a significant opportunity.

CONTEXT:
- This is an EXISTING client relationship (we know their financials)
- Every recommendation must demonstrate clear, quantified ROI
- The client's time is valuable - be direct and insightful
- Pattern analysis has already been performed - use these insights

CRITICAL ANALYSIS REQUIREMENTS:

1. READ BETWEEN THE LINES
Look beyond surface answers. What is the client's TRUE destination? What identity transformation are they seeking (e.g., operator to investor, founder to chairperson)?

When they describe a detailed, time-anchored future vision (specific times, activities, people, feelings), this represents EXCEPTIONAL destination clarity (9-10/10), not poor clarity.

2. ADDRESS VULNERABILITIES WITH CARE
If the client has disclosed sensitive information (imposter syndrome, team secrets, relationship strain), acknowledge it in recommendations without embarrassing them. This disclosure indicates trust.

3. CAPITAL RAISING CONTEXT
If pattern analysis detected capital-raising signals:
- Every service recommendation must demonstrate how it makes them MORE investable
- Quantify the valuation impact of founder dependency
- Frame systems/processes as investor due diligence requirements
- Management accounts become "investor-ready reporting"

4. THE PERSONAL COST IS REAL
Calculate the personal cost of inaction in HUMAN terms:
- Hours with family lost per year
- Health impact of sustained high stress
- Relationship strain trajectory
- What they're sacrificing for the business

5. SERVICE RECOMMENDATIONS
For each recommended service:
- Connect to their EXACT WORDS (quote them 10-15 times throughout)
- Show the transformation pathway from current state to destination
- Specific £ ROI calculation using their financials
- How it reduces founder dependency
- How it accelerates their stated timeline

6. SEQUENCING
- What must come FIRST to unlock everything else?
- What can run in parallel?
- What's the 90-day quick win?

QUOTING REQUIREMENTS:
- Quote their exact words 10-15 times throughout
- Use their language and metaphors back at them
- Reference specific numbers from their context

MINIMUM REQUIREMENTS:
- ALWAYS recommend at least 3 services (most clients need a combination approach)
- NEVER return a destination clarity score lower than what pattern analysis found
- ALWAYS include implementation roadmap with specific timelines

Writing style:
- Direct and confident, backed by specific evidence from their responses
- Empathetic but pragmatic - acknowledge feelings, provide solutions
- Create urgency by contrasting investment cost with inaction cost
- Make the business case irresistible through specific £ calculations`;

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const { clientId, practiceId, discoveryId, skipPatternDetection } = await req.json();

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

    // Get financial context (team-entered data about client's financials)
    const { data: financialContext } = await supabase
      .from('client_financial_context')
      .select('*')
      .eq('client_id', clientId)
      .order('period_end_date', { ascending: false })
      .limit(1)
      .single();

    // Get operational context (team knowledge about the client)
    const { data: operationalContext } = await supabase
      .from('client_operational_context')
      .select('*')
      .eq('client_id', clientId)
      .single();

    // ========================================================================
    // 1.5. RUN PATTERN DETECTION (Stage 2) IF NOT ALREADY DONE
    // ========================================================================

    let patternAnalysis = null;
    
    // Check for existing pattern analysis
    const { data: existingPatterns } = await supabase
      .from('assessment_patterns')
      .select('*')
      .eq('assessment_id', discovery.id)
      .single();

    if (existingPatterns) {
      patternAnalysis = existingPatterns;
      console.log('Using existing pattern analysis, clarity score:', existingPatterns.destination_clarity_score);
    } else if (!skipPatternDetection) {
      // Run pattern detection
      console.log('Running pattern detection for assessment:', discovery.id);
      try {
        const patternResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/detect-assessment-patterns`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ assessmentId: discovery.id })
          }
        );

        if (patternResponse.ok) {
          const patternResult = await patternResponse.json();
          if (patternResult.success) {
            // Fetch the saved pattern
            const { data: newPatterns } = await supabase
              .from('assessment_patterns')
              .select('*')
              .eq('assessment_id', discovery.id)
              .single();
            patternAnalysis = newPatterns;
            console.log('Pattern detection complete, clarity score:', patternResult.patterns?.destinationClarity?.score);
          }
        } else {
          console.warn('Pattern detection failed, continuing without it');
        }
      } catch (patternError) {
        console.warn('Pattern detection error, continuing without it:', patternError);
      }
    }

    // Also check legacy table for backward compatibility
    if (!patternAnalysis) {
      const { data: legacyPatterns } = await supabase
        .from('client_pattern_analysis')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (legacyPatterns) {
        patternAnalysis = legacyPatterns;
        console.log('Using legacy pattern analysis');
      }
    }

    console.log('Loaded context - Financial:', !!financialContext, 'Operational:', !!operationalContext, 'Patterns:', !!patternAnalysis);

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

      // Raw responses (their words) - grouped by section
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
      })) || [],

      // ===== ENHANCED CONTEXT FROM TEAM KNOWLEDGE =====
      
      // Financial context (what we KNOW about their numbers)
      financialContext: financialContext ? {
        periodType: financialContext.period_type,
        periodEnd: financialContext.period_end_date,
        revenue: financialContext.revenue,
        grossProfit: financialContext.gross_profit,
        grossMarginPct: financialContext.gross_margin_pct,
        netProfit: financialContext.net_profit,
        netMarginPct: financialContext.net_margin_pct,
        staffCount: financialContext.staff_count,
        staffCost: financialContext.staff_cost,
        revenuePerHead: financialContext.revenue_per_head,
        revenueGrowthPct: financialContext.revenue_growth_pct,
        cashPosition: financialContext.cash_position,
        debtorsDays: financialContext.debtors_days,
        extractedInsights: financialContext.extracted_insights,
        riskIndicators: financialContext.risk_indicators
      } : null,

      // Operational context (what we OBSERVE about their business)
      operationalContext: operationalContext ? {
        businessType: operationalContext.business_type,
        industry: operationalContext.industry,
        yearsTrading: operationalContext.years_trading,
        yearsAsClient: operationalContext.years_as_client,
        clientCount: operationalContext.client_count,
        topClientRevenuePct: operationalContext.top_client_revenue_pct,
        top3ClientsRevenuePct: operationalContext.top_3_clients_revenue_pct,
        managementTeamSize: operationalContext.management_team_size,
        ownerAgeBracket: operationalContext.owner_age_bracket,
        successionStatus: operationalContext.succession_status,
        servicesUsed: operationalContext.services_used,
        observedStrengths: operationalContext.observed_strengths,
        observedChallenges: operationalContext.observed_challenges,
        opportunityScore: operationalContext.opportunity_score,
        riskFactors: operationalContext.risk_factors
      } : null,

      // Pre-computed patterns (if we've run pattern analysis)
      patternAnalysis: patternAnalysis ? {
        patternsDetected: patternAnalysis.patterns_detected,
        risksIdentified: patternAnalysis.risks_identified,
        opportunitiesIdentified: patternAnalysis.opportunities_identified,
        emotionalAnchors: patternAnalysis.emotional_anchors,
        scores: {
          destinationClarity: patternAnalysis.destination_clarity_score,
          gapSeverity: patternAnalysis.gap_severity_score,
          readiness: patternAnalysis.readiness_score,
          opportunity: patternAnalysis.opportunity_score
        }
      } : null
    };

    // ========================================================================
    // 3. GENERATE AI ANALYSIS
    // ========================================================================

    // Build pattern analysis context for the prompt
    const patternContext = patternAnalysis ? {
      destinationClarityScore: patternAnalysis.destination_clarity_score,
      destinationClarityRationale: patternAnalysis.destination_clarity_rationale,
      visionStrengths: patternAnalysis.vision_strengths,
      visionGaps: patternAnalysis.vision_gaps,
      contradictions: patternAnalysis.contradictions,
      hiddenSignals: patternAnalysis.hidden_signals,
      emotionalState: {
        stressLevel: patternAnalysis.stress_level,
        burnoutRisk: patternAnalysis.burnout_risk,
        imposterSyndrome: patternAnalysis.imposter_syndrome,
        relationshipStrain: patternAnalysis.relationship_strain,
        evidence: patternAnalysis.emotional_evidence
      },
      truePriority: {
        stated: patternAnalysis.stated_priority,
        actual: patternAnalysis.actual_priority,
        gap: patternAnalysis.priority_gap
      },
      capitalRaisingSignals: {
        detected: patternAnalysis.capital_raising_detected,
        evidence: patternAnalysis.capital_raising_evidence,
        urgency: patternAnalysis.capital_raising_urgency
      },
      lifestyleTransformation: {
        detected: patternAnalysis.lifestyle_transformation_detected,
        type: patternAnalysis.transformation_type,
        identity: patternAnalysis.identity_transition
      }
    } : null;

    const analysisPrompt = `
Analyze this discovery assessment for ${client.name} (${client.client_company || 'their business'}) and produce a comprehensive report.

## CLIENT DISCOVERY DATA
${JSON.stringify(clientContext, null, 2)}

## IMPORTANT CONTEXT
This client is an EXISTING client of RPGCC. We already know their financial numbers.
The discovery assessment captures what we DON'T know: their aspirations, frustrations, emotional state, and operational reality from THEIR perspective.

${patternContext ? `
## PATTERN ANALYSIS RESULTS (Stage 2 Pre-Analysis)
This analysis has already been performed by a specialized pattern detection system. USE THESE INSIGHTS.

**Destination Clarity: ${patternContext.destinationClarityScore}/10**
Rationale: ${patternContext.destinationClarityRationale}

Vision Strengths: ${JSON.stringify(patternContext.visionStrengths)}
Vision Gaps: ${JSON.stringify(patternContext.visionGaps)}

**Contradictions Detected (${patternContext.contradictions?.length || 0}):**
${JSON.stringify(patternContext.contradictions, null, 2)}

**Hidden Signals (${patternContext.hiddenSignals?.length || 0}):**
${JSON.stringify(patternContext.hiddenSignals, null, 2)}

**Emotional State:**
- Stress Level: ${patternContext.emotionalState.stressLevel}
- Burnout Risk: ${patternContext.emotionalState.burnoutRisk}
- Imposter Syndrome: ${patternContext.emotionalState.imposterSyndrome}
- Relationship Strain: ${patternContext.emotionalState.relationshipStrain}
- Evidence: ${JSON.stringify(patternContext.emotionalState.evidence)}

**True Priority:**
- Stated: ${patternContext.truePriority.stated}
- Actual: ${patternContext.truePriority.actual}
- Gap: ${patternContext.truePriority.gap}

**Capital Raising: ${patternContext.capitalRaisingSignals.detected ? 'DETECTED - PRIORITIZE INVESTMENT READINESS' : 'Not primary focus'}**
${patternContext.capitalRaisingSignals.detected ? `Evidence: ${JSON.stringify(patternContext.capitalRaisingSignals.evidence)}
Urgency: ${patternContext.capitalRaisingSignals.urgency}` : ''}

**Lifestyle Transformation: ${patternContext.lifestyleTransformation.detected ? 'DETECTED' : 'Not detected'}**
${patternContext.lifestyleTransformation.detected ? `Type: ${patternContext.lifestyleTransformation.type}
Identity Transition: ${JSON.stringify(patternContext.lifestyleTransformation.identity)}` : ''}
` : ''}

${clientContext.financialContext ? `
## WE KNOW THEIR FINANCIALS:
- Revenue: £${clientContext.financialContext.revenue?.toLocaleString() || 'Unknown'}
- Gross Margin: ${clientContext.financialContext.grossMarginPct || 'Unknown'}%
- Net Profit: £${clientContext.financialContext.netProfit?.toLocaleString() || 'Unknown'}
- Staff Count: ${clientContext.financialContext.staffCount || 'Unknown'}
- Revenue/Head: £${clientContext.financialContext.revenuePerHead?.toLocaleString() || 'Unknown'}
- Growth Rate: ${clientContext.financialContext.revenueGrowthPct || 'Unknown'}%

Use these REAL numbers to calculate specific £ impacts in your analysis.
` : ''}

${clientContext.operationalContext ? `
## WE KNOW ABOUT THEIR BUSINESS:
- Years Trading: ${clientContext.operationalContext.yearsTrading || 'Unknown'}
- Years as Client: ${clientContext.operationalContext.yearsAsClient || 'Unknown'}
- Business Type: ${clientContext.operationalContext.businessType || 'Unknown'}
- Client Concentration: Top client = ${clientContext.operationalContext.topClientRevenuePct || 'Unknown'}% of revenue
- Observed Strengths: ${clientContext.operationalContext.observedStrengths?.join(', ') || 'None noted'}
- Observed Challenges: ${clientContext.operationalContext.observedChallenges?.join(', ') || 'None noted'}
` : ''}

## ANALYSIS APPROACH
1. Compare what THEY say (discovery responses) vs what WE know (financial/operational context)
2. Look for disconnects - where their perception differs from reality
3. Use their EXACT WORDS to build rapport and show we've listened
4. Calculate specific £ impacts using their real financial data where available
5. Connect emotional drivers to practical solutions

## AVAILABLE SERVICES & ROI DATA
${JSON.stringify(SERVICE_LINES, null, 2)}

## REQUIRED OUTPUT FORMAT
Generate a JSON object with the following structure.

IMPORTANT: Use the EXACT pricing from the service tiers provided. Different services have different pricing models:
- 365 Alignment Programme: Annual engagements (Lite £1,500 / Growth £4,500 / Partner £9,000)
- Fractional CFO: Monthly retainers (from £3,500-£15,000/month)
- Systems Audit: Project-based (£1,500-£4,000 diagnostic + implementation)
- Management Accounts: Monthly £650 or Quarterly £1,750
- Fractional COO: Monthly retainers (from £3,000-£14,000/month)
- Combined CFO/COO: Monthly retainers (from £6,000-£28,000/month)
- Automation: Hourly/day rates (£115-£180/hour)
- Business Advisory: Project-based (£1,000-£4,000)
- Benchmarking: Project-based (£450-£3,500)

{
  "executiveSummary": {
    "headline": "One powerful sentence capturing their core challenge",
    "situationInTheirWords": "2-3 sentences using their EXACT quotes that summarize their situation",
    "destinationVision": "What they really want - their stated destination",
    "currentReality": "Where they are now and why it's painful",
    "criticalInsight": "The most important insight we've uncovered that they may not fully see",
    "urgencyStatement": "Why acting now matters"
  },
  
  "clientProfile": {
    "businessContext": "What we understand about their business",
    "ownerProfile": {
      "currentState": "How they described their typical day/week",
      "emotionalState": "How they're feeling (frustrated, overwhelmed, etc.)",
      "whatKeepsThemUp": "Their stated worries and concerns"
    },
    "strengthsIdentified": ["Things they're doing well based on their responses"],
    "blindSpots": ["Things they may not be seeing clearly"]
  },
  
  "destinationAnalysis": {
    "fiveYearVision": "Their stated destination in detail",
    "coreEmotionalDrivers": [
      {
        "driver": "e.g., Freedom",
        "evidence": "Exact quote from their response showing this",
        "whatItMeans": "What this tells us about their true priorities"
      }
    ],
    "successMetrics": ["How they'll know they've arrived - specific and measurable"],
    "lifestyleGoals": ["Non-business goals they mentioned (family, health, etc.)"],
    "timelineExpectations": "When they want to achieve this"
  },
  
  "gapAnalysis": {
    "primaryGaps": [
      {
        "gap": "Specific gap identified",
        "category": "Financial|Operational|Strategic|Personal",
        "severity": "critical|high|medium",
        "evidence": "Quote from their responses that shows this gap",
        "currentImpact": {
          "timeImpact": "X hours/week lost to this",
          "financialImpact": "£X per month/year cost",
          "emotionalImpact": "How this makes them feel"
        },
        "rootCause": "Why this gap exists - dig deep",
        "connectedGaps": ["Other gaps this one causes or worsens"],
        "ifUnaddressed": "What happens in 1 year if nothing changes"
      }
    ],
    "hiddenChallenges": [
      {
        "challenge": "Something implied but not stated",
        "evidence": "What in their responses suggests this",
        "potentialImpact": "Why this matters"
      }
    ],
    "costOfInaction": {
      "annualFinancialCost": "£X,XXX - be specific and explain calculation",
      "opportunityCost": "What they're missing out on",
      "personalCost": "Impact on health, relationships, quality of life",
      "businessRisk": "Long-term risk to the business itself",
      "compoundingEffect": "How these costs multiply over time"
    }
  },
  
  "recommendedInvestments": [
    {
      "service": "Service name",
      "code": "service_code",
      "priority": 1,
      "recommendedTier": "Specific tier name",
      "investment": "£X,XXX",
      "investmentFrequency": "per month|per year|one-off",
      "annualInvestment": "£XX,XXX",
      "whyThisTier": "Why this specific tier is right (not higher or lower)",
      "problemsSolved": [
        {
          "problem": "Specific problem from their responses",
          "theirWords": "Exact quote describing this problem",
          "howWeSolveIt": "Specific actions we'll take",
          "expectedResult": "Measurable outcome"
        }
      ],
      "implementationPlan": {
        "phase1": { "weeks": "1-4", "focus": "What happens first", "deliverables": ["Specific outputs"] },
        "phase2": { "weeks": "5-12", "focus": "Next phase", "deliverables": ["Specific outputs"] },
        "ongoing": "What continues after initial implementation"
      },
      "expectedROI": {
        "multiplier": "Xx",
        "timeframe": "X months to break even",
        "calculation": "How we calculated this (be specific)",
        "conservativeEstimate": "Even if half as effective: £X return"
      },
      "expectedOutcomes": [
        {
          "outcome": "Specific measurable outcome",
          "timeline": "When they'll see this",
          "howMeasured": "How we'll know it's achieved"
        }
      ],
      "riskOfNotActing": "Specific consequence of not investing in this"
    }
  ],
  
  "serviceSequencing": {
    "recommendedOrder": "Why services should be done in this order",
    "dependencies": ["Service X enables Service Y because..."],
    "quickWins": ["Things that will show results in first 30 days"],
    "foundationalWork": ["Things that enable everything else"]
  },
  
  "investmentSummary": {
    "totalFirstYearInvestment": "£XX,XXX",
    "breakdownByService": [
      { "service": "Name", "amount": "£X,XXX", "frequency": "one-off|monthly|annual" }
    ],
    "projectedFirstYearReturn": "£XXX,XXX",
    "roiCalculation": "Clear explanation of how returns were calculated",
    "paybackPeriod": "X months",
    "netBenefitYear1": "£XX,XXX (return minus investment)",
    "comparisonToInaction": "Investing costs £X, but NOT investing costs £Y - net benefit of acting: £Z"
  },
  
  "implementationRoadmap": [
    {
      "phase": "Week 1-2",
      "title": "Getting Started",
      "actions": [
        { "action": "Specific action", "owner": "Client|RPGCC", "outcome": "What this achieves" }
      ]
    },
    {
      "phase": "Month 1",
      "title": "Foundation",
      "actions": [...]
    },
    {
      "phase": "Month 2-3",
      "title": "Building Momentum",
      "actions": [...]
    },
    {
      "phase": "Month 4-6",
      "title": "Scaling Impact",
      "actions": [...]
    }
  ],
  
  "successMilestones": [
    {
      "milestone": "First management accounts delivered",
      "timeline": "Month 1",
      "significance": "Why this matters to their destination"
    }
  ],
  
  "closingMessage": {
    "personalNote": "Empathetic message connecting back to their stated goals",
    "callToAction": "Clear next step",
    "urgencyReminder": "Why now - connect to their timeline"
  }
}

CRITICAL REQUIREMENTS:
- Quote their EXACT WORDS at least 8-10 times throughout the report
- Calculate specific £ figures for every cost and benefit - show your working
- Connect every recommendation back to something they specifically said
- Be DETAILED - this report should feel comprehensive and personalized
- Explain the HOW, not just the WHAT for each service
- Show the domino effect: how fixing one thing enables the next
- ALWAYS recommend 2-3 services (minimum 2) - most clients need a combination approach
- If they need financial clarity AND operational systems, recommend BOTH
- Typical combinations: Management Accounts + 365 Method, Fractional CFO + Systems Audit
- Make the comparison crystal clear: investment cost vs. cost of inaction
- Order recommendations by priority (what to start with first)
`;

    console.log(`Generating discovery report using ${MODEL} for ${client.name}`);

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Discovery Report'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16384,  // Increased for comprehensive report with Opus 4
        temperature: 0.4,   // Slightly higher for creativity while maintaining accuracy
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
    const usage = extractUsageFromResponse(openrouterData);
    inputTokens = usage.inputTokens;
    outputTokens = usage.outputTokens;
    console.log('OpenRouter response received, choices:', openrouterData.choices?.length || 0, 'tokens:', inputTokens + outputTokens);
    
    const analysisText = openrouterData.choices?.[0]?.message?.content || '';
    if (!analysisText) {
      console.error('Empty response from OpenRouter:', JSON.stringify(openrouterData));
      throw new Error('Empty response from AI');
    }

    console.log('AI response length:', analysisText.length);
    console.log('AI response preview (first 500 chars):', analysisText.substring(0, 500));
    console.log('AI response end (last 500 chars):', analysisText.substring(analysisText.length - 500));

    // Parse the JSON from the response
    let analysis;
    try {
      // Try to extract JSON from the response
      // First, try to find JSON wrapped in markdown code blocks
      let jsonString = analysisText;
      
      // Remove markdown code blocks if present
      const codeBlockMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
      }
      
      // If not in code block, try to find raw JSON object
      if (!jsonString.startsWith('{')) {
        const jsonStart = analysisText.indexOf('{');
        const jsonEnd = analysisText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonString = analysisText.substring(jsonStart, jsonEnd + 1);
        }
      }
      
      console.log('Extracted JSON length:', jsonString.length);
      console.log('JSON starts with:', jsonString.substring(0, 100));
      
      analysis = JSON.parse(jsonString);
      console.log('Successfully parsed JSON with keys:', Object.keys(analysis).join(', '));
      
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      console.error('Failed to parse AI response:', errorMessage);
      console.log('Full raw response for debugging:', analysisText);
      
      // Try to provide a partial response if we have something
      if (analysisText.length > 100) {
        // Return raw text as fallback
        analysis = {
          executiveSummary: {
            headline: "Analysis generated - manual review needed",
            situationInTheirWords: analysisText.substring(0, 500),
            destinationVision: "See raw analysis",
            currentReality: "Parsing error - raw content available",
            criticalInsight: "AI generated content but JSON parsing failed",
            urgencyStatement: "Please review raw output"
          },
          rawAnalysis: analysisText,
          parseError: errorMessage
        };
        console.log('Using fallback structure with raw analysis');
      } else {
        throw new Error('Failed to parse AI analysis: ' + errorMessage);
      }
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
    // 6. TRACK COSTS AND RETURN REPORT
    // ========================================================================

    const executionTimeMs = Date.now() - startTime;
    const costUsd = calculateCost({ model: MODEL, inputTokens, outputTokens, executionTimeMs });

    // Track LLM execution
    await trackLLMExecution(supabase, {
      functionName: 'generate-discovery-report',
      model: MODEL,
      inputTokens,
      outputTokens,
      executionTimeMs,
      entityType: 'discovery_report',
      entityId: savedReport?.id || discovery.id,
      success: true
    });

    console.log(`Report generation complete. Cost: $${costUsd.toFixed(4)}, Time: ${executionTimeMs}ms`);

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
          // Use pattern analysis score if available, otherwise rule-based
          clarityScore: patternAnalysis?.destination_clarity_score || discovery.destination_clarity_score,
          gapScore: discovery.gap_score
        },
        patternAnalysis: patternContext,
        analysis
      },
      metadata: {
        model: MODEL,
        tokensUsed: inputTokens + outputTokens,
        costUsd,
        executionTimeMs,
        patternAnalysisIncluded: !!patternAnalysis
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    console.error('Error generating report:', error);
    const errorMessage = error?.message || String(error) || 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      metadata: {
        executionTimeMs
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

