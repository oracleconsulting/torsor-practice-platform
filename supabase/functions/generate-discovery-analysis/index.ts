// ============================================================================
// GENERATE DISCOVERY ANALYSIS - Part 2 of 2-stage report generation
// ============================================================================
// Takes prepared data and generates the full analysis using Claude Opus 4.5
// This is the heavy LLM call - should complete within 60s with prepared data
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Max-Age': '86400',
}

// Use Claude Opus 4.5 for premium quality analysis
const MODEL = 'anthropic/claude-opus-4.5';

// ============================================================================
// DESTINATION CLARITY FALLBACK CALCULATION
// ============================================================================

function calculateFallbackClarity(responses: Record<string, any>): number {
  const vision = responses.dd_five_year_picture || '';
  
  if (!vision || vision.length < 20) return 1;
  
  let score = 0;
  
  // Time specificity (mentions times, days, routines)
  if (/\d{1,2}(am|pm|:\d{2})|0\d{3}/i.test(vision)) score += 2;
  if (/morning|afternoon|evening|night/i.test(vision)) score += 1;
  
  // Activity richness (verbs indicating actions)
  const activities = vision.match(/\b(wake|run|walk|take|drive|meet|call|play|work|travel|read|grab|head|pick|have|spend)\b/gi);
  score += Math.min((activities?.length || 0), 3);
  
  // Relationship mentions
  if (/wife|husband|partner|kids|children|boys|girls|family|friends|mates/i.test(vision)) score += 2;
  
  // Role transformation indicators
  if (/invest|portfolio|board|advisor|chairman|step back|ceo/i.test(vision)) score += 2;
  
  // Length and detail
  if (vision.length > 100) score += 1;
  if (vision.length > 200) score += 1;
  
  return Math.min(score, 10);
}

// ============================================================================
// AFFORDABILITY ASSESSMENT
// ============================================================================

interface AffordabilityProfile {
  stage: 'pre-revenue' | 'early-revenue' | 'established' | 'scaling';
  cashConstrained: boolean;
  activelyRaising: boolean;
  estimatedMonthlyCapacity: 'under_1k' | '1k_5k' | '5k_15k' | '15k_plus';
}

function assessAffordability(
  responses: Record<string, any>,
  financialContext?: any
): AffordabilityProfile {
  
  let stage: AffordabilityProfile['stage'] = 'established';
  
  // Check for pre-revenue signals
  const operationalFrustration = (responses.sd_operational_frustration || '').toLowerCase();
  if (operationalFrustration.includes('mvp') || 
      operationalFrustration.includes('launch') ||
      operationalFrustration.includes('product-market') ||
      operationalFrustration.includes('pre-revenue')) {
    stage = 'pre-revenue';
  }
  
  // Check for early-revenue signals
  if (responses.sd_growth_blocker === "Don't have the capital" &&
      !operationalFrustration.includes('mvp')) {
    stage = stage === 'pre-revenue' ? 'pre-revenue' : 'early-revenue';
  }
  
  // Override with financial context if available
  if (financialContext?.revenue) {
    if (financialContext.revenue < 100000) stage = 'pre-revenue';
    else if (financialContext.revenue < 500000) stage = 'early-revenue';
    else if (financialContext.revenue < 2000000) stage = 'established';
    else stage = 'scaling';
  }
  
  // Cash constraint detection
  const cashConstrained = 
    responses.sd_growth_blocker === "Don't have the capital" ||
    (responses.dd_sleep_thief || []).includes('Cash flow and paying bills');
  
  // Fundraising detection
  const ifIKnew = (responses.dd_if_i_knew || '').toLowerCase();
  const activelyRaising = 
    ifIKnew.includes('capital') ||
    ifIKnew.includes('raise') ||
    ifIKnew.includes('invest') ||
    (responses.sd_exit_readiness || '').includes('investment-ready');
  
  // Estimate monthly capacity
  let estimatedMonthlyCapacity: AffordabilityProfile['estimatedMonthlyCapacity'];
  
  switch (stage) {
    case 'pre-revenue':
      estimatedMonthlyCapacity = activelyRaising ? '1k_5k' : 'under_1k';
      break;
    case 'early-revenue':
      estimatedMonthlyCapacity = cashConstrained ? '1k_5k' : '5k_15k';
      break;
    case 'established':
      estimatedMonthlyCapacity = '5k_15k';
      break;
    case 'scaling':
      estimatedMonthlyCapacity = '15k_plus';
      break;
  }
  
  return { stage, cashConstrained, activelyRaising, estimatedMonthlyCapacity };
}

// ============================================================================
// 365 LIFESTYLE TRANSFORMATION DETECTION
// ============================================================================

interface TransformationSignals {
  lifestyleTransformation: boolean;
  identityShift: boolean;
  burnoutWithReadiness: boolean;
  legacyFocus: boolean;
  reasons: string[];
}

function detect365Triggers(responses: Record<string, any>): TransformationSignals {
  const visionText = (responses.dd_five_year_picture || '').toLowerCase();
  const successDef = responses.dd_success_definition || '';
  const reasons: string[] = [];
  
  // Lifestyle transformation: Vision describes fundamentally different role
  const lifestyleTransformation = 
    visionText.includes('invest') ||
    visionText.includes('portfolio') ||
    visionText.includes('advisory') ||
    visionText.includes('board') ||
    visionText.includes('chairman') ||
    visionText.includes('step back') ||
    (visionText.includes('ceo') && !visionText.includes('my ceo'));
  
  if (lifestyleTransformation) {
    reasons.push('Vision describes fundamentally different role (operator → investor transition)');
  }
  
  // Identity shift: Success defined as business running without them
  const identityShift = 
    successDef === "Creating a business that runs profitably without me" ||
    successDef === "Building a legacy that outlasts me" ||
    successDef === "Building something I can sell for a life-changing amount";
  
  if (identityShift) {
    reasons.push(`Success defined as "${successDef}" - requires structured transition support`);
  }
  
  // Burnout with high readiness
  const burnoutWithReadiness = 
    ['60-70 hours', '70+ hours'].includes(responses.dd_owner_hours || '') &&
    responses.dd_change_readiness === "Completely ready - I'll do whatever it takes";
  
  if (burnoutWithReadiness) {
    reasons.push('Working 60-70+ hours but completely ready for change - needs structured pathway');
  }
  
  // Legacy focus
  const legacyFocus = 
    successDef.includes('legacy') ||
    responses.dd_exit_thoughts === "I've already got a clear exit plan" ||
    ['1-3 years - actively preparing', '3-5 years - need to start thinking'].includes(responses.sd_exit_timeline || '');
  
  if (legacyFocus) {
    reasons.push('Legacy/exit focus requires strategic roadmap');
  }
  
  return { lifestyleTransformation, identityShift, burnoutWithReadiness, legacyFocus, reasons };
}

// Service line definitions (abbreviated for this function)
const SERVICE_LINES = {
  '365_method': { name: '365 Alignment Programme', tiers: [{ name: 'Lite', price: 1500 }, { name: 'Growth', price: 4500 }, { name: 'Partner', price: 9000 }] },
  'fractional_cfo': { name: 'Fractional CFO Services', tiers: [{ name: '2 days/month', price: 4000, isMonthly: true }] },
  'systems_audit': { name: 'Systems Audit', tiers: [{ name: 'Comprehensive', price: 4000 }] },
  'management_accounts': { name: 'Management Accounts', tiers: [{ name: 'Monthly', price: 650, isMonthly: true }] },
  'fractional_coo': { name: 'Fractional COO Services', tiers: [{ name: '2 days/month', price: 3750, isMonthly: true }] },
  'automation': { name: 'Automation Services', tiers: [{ name: 'Per hour', price: 150 }] },
  'business_advisory': { name: 'Business Advisory & Exit Planning', tiers: [{ name: 'Full Package', price: 4000 }] },
  'benchmarking': { name: 'Benchmarking Services', tiers: [{ name: 'Full Package', price: 3500 }] }
};

const SYSTEM_PROMPT = `You are a senior business advisor analyzing a discovery assessment. Generate a comprehensive, personalized report.

CRITICAL REQUIREMENTS:
1. Quote client's EXACT WORDS at least 10 times throughout
2. Calculate specific £ figures for every cost and benefit
3. Connect every recommendation to something they specifically said
4. Recommend services in PHASES based on affordability (see affordability context)
5. Show the domino effect: how fixing one thing enables the next
6. Make the comparison crystal clear: investment cost vs. cost of inaction

INVESTMENT PHASING IS CRITICAL:
- For pre-revenue/cash-constrained clients: PHASE services by affordability
- Phase 1 = Start Now (under £15k/year)
- Phase 2 = After Raise/Revenue (when they can afford it)
- Phase 3 = At Scale (when revenue supports it)
- HEADLINE the affordable number, not the total if-everything number

365 ALIGNMENT PROGRAMME:
This is NOT just for people without plans. It's for founders undergoing TRANSFORMATION:
- OPERATOR → INVESTOR transition
- FOUNDER → CHAIRMAN transition
- BURNOUT → BALANCE transition
If transformation signals are detected, recommend 365 even if they have a business plan.

Writing style:
- Direct and confident, backed by specific evidence
- Empathetic but pragmatic
- Create urgency through specific £ calculations
- For pre-revenue clients: optimise for THEIR outcome, not our revenue`;

serve(async (req) => {
  console.log('=== GENERATE-DISCOVERY-ANALYSIS STARTED ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const { preparedData } = await req.json();

    if (!preparedData) {
      throw new Error('preparedData is required - call prepare-discovery-data first');
    }

    console.log(`Generating analysis for: ${preparedData.client.name}`);

    // ========================================================================
    // CALCULATE CLARITY SCORE (with fallback)
    // ========================================================================
    
    const patternClarityScore = preparedData.patternAnalysis?.destinationClarity?.score;
    const fallbackClarityScore = calculateFallbackClarity(preparedData.discovery.responses);
    const clarityScore = patternClarityScore ?? fallbackClarityScore;
    const claritySource = patternClarityScore ? 'pattern_detection' : 'fallback';
    
    console.log('[Discovery] Clarity score:', {
      patternDetectionScore: patternClarityScore,
      fallbackScore: fallbackClarityScore,
      finalScore: clarityScore,
      source: claritySource
    });

    // ========================================================================
    // ASSESS AFFORDABILITY
    // ========================================================================
    
    const affordability = assessAffordability(
      preparedData.discovery.responses,
      preparedData.financialContext
    );
    
    console.log('[Discovery] Affordability:', affordability);

    // ========================================================================
    // DETECT 365 TRANSFORMATION TRIGGERS
    // ========================================================================
    
    const transformationSignals = detect365Triggers(preparedData.discovery.responses);
    
    console.log('[Discovery] 365 Triggers:', transformationSignals);

    // ========================================================================
    // BUILD THE ANALYSIS PROMPT
    // ========================================================================

    const patternContext = preparedData.patternAnalysis ? `
## PATTERN ANALYSIS (Pre-computed)
- Destination Clarity: ${preparedData.patternAnalysis.destinationClarity?.score || 'N/A'}/10
- Contradictions: ${JSON.stringify(preparedData.patternAnalysis.contradictions || [])}
- Emotional State: Stress=${preparedData.patternAnalysis.emotionalState?.stressLevel}, Burnout Risk=${preparedData.patternAnalysis.emotionalState?.burnoutRisk}
- Capital Raising Detected: ${preparedData.patternAnalysis.capitalRaisingSignals?.detected || false}
- Lifestyle Transformation: ${preparedData.patternAnalysis.lifestyleTransformation?.detected || false}
` : '';

    const financialContext = preparedData.financialContext ? `
## KNOWN FINANCIALS
- Revenue: £${preparedData.financialContext.revenue?.toLocaleString() || 'Unknown'}
- Gross Margin: ${preparedData.financialContext.grossMarginPct || 'Unknown'}%
- Net Profit: £${preparedData.financialContext.netProfit?.toLocaleString() || 'Unknown'}
- Staff Count: ${preparedData.financialContext.staffCount || 'Unknown'}
` : '';

    const documentsContext = preparedData.documents.length > 0 ? `
## UPLOADED DOCUMENTS (USE THIS DATA!)
${preparedData.documents.map((doc: any, i: number) => `
### Document ${i + 1}: ${doc.fileName}
${doc.content}
`).join('\n')}
` : '';

    const analysisPrompt = `
Analyze this discovery assessment for ${preparedData.client.name} (${preparedData.client.company || 'their business'}).

## CLIENT DISCOVERY RESPONSES
${JSON.stringify(preparedData.discovery.responses, null, 2)}

## EXTRACTED EMOTIONAL ANCHORS
${JSON.stringify(preparedData.discovery.extractedAnchors, null, 2)}

## EXISTING SERVICE RECOMMENDATIONS
${JSON.stringify(preparedData.discovery.recommendedServices, null, 2)}

${patternContext}
${financialContext}
${documentsContext}

## AFFORDABILITY ASSESSMENT
- Client Stage: ${affordability.stage}
- Cash Constrained: ${affordability.cashConstrained}
- Actively Raising: ${affordability.activelyRaising}
- Estimated Monthly Capacity: ${affordability.estimatedMonthlyCapacity}

${affordability.stage === 'pre-revenue' ? `
⚠️ PRE-REVENUE CLIENT - PHASE YOUR RECOMMENDATIONS:

Phase 1 - Foundation (Start Now, max £15,000/year):
- Only recommend what they NEED NOW
- Focus on services that help them raise or launch faster
- Management Accounts + Systems Audit are appropriate

Phase 2 - Post-Raise (After funding):
- Fractional executives go here
- Frame as "when you've closed your round"

Phase 3 - At Scale (12+ months, when revenue supports):
- Full operational support
- Only mention as future horizon

CRITICAL: Headline the Phase 1 number. Do NOT say "total investment £150k" to a pre-revenue startup.
` : ''}

${affordability.stage === 'early-revenue' ? `
EARLY-REVENUE CLIENT - PHASE YOUR RECOMMENDATIONS:

Phase 1 - Essential (Start Now, max £36,000/year):
- Management Accounts and Systems Audit
- 365 if transformation needed
- Focus on efficiency gains that pay for themselves

Phase 2 - Growth Support (3-6 months):
- Fractional CFO at lower tier
- As revenue stabilizes

Phase 3 - Full Support (12+ months):
- Full fractional suite when revenue supports
` : ''}

## 365 ALIGNMENT DETECTION
${transformationSignals.reasons.length > 0 ? `
🎯 365 TRANSFORMATION TRIGGERS DETECTED:
${transformationSignals.reasons.map(r => `- ${r}`).join('\n')}

Even if they have a business plan, recommend 365 because they need structured support for their PERSONAL transformation, not just business strategy.

Position 365 as: "You have a business plan. What you don't have is a structured path to becoming the person in your 5-year vision. The 365 programme bridges that gap."
` : 'No specific transformation triggers detected.'}

## AVAILABLE SERVICES
${JSON.stringify(SERVICE_LINES, null, 2)}

## OUTPUT FORMAT
Return a JSON object with:
{
  "executiveSummary": {
    "headline": "One powerful sentence",
    "situationInTheirWords": "2-3 sentences using their EXACT quotes",
    "destinationVision": "What they really want",
    "currentReality": "Where they are now",
    "criticalInsight": "The most important insight",
    "urgencyStatement": "Why acting now matters"
  },
  "destinationAnalysis": {
    "fiveYearVision": "Their stated destination",
    "coreEmotionalDrivers": [{ "driver": "e.g. Freedom", "evidence": "exact quote", "whatItMeans": "interpretation" }],
    "lifestyleGoals": ["non-business goals mentioned"]
  },
  "gapAnalysis": {
    "primaryGaps": [{ "gap": "specific gap", "category": "Financial|Operational|Strategic|Personal", "severity": "critical|high|medium", "evidence": "quote", "currentImpact": { "timeImpact": "X hours/week", "financialImpact": "£X", "emotionalImpact": "how it feels" } }],
    "costOfInaction": { "annualFinancialCost": "£X,XXX with calculation", "personalCost": "impact on life", "compoundingEffect": "how it gets worse" }
  },
  "recommendedInvestments": [
    {
      "service": "Service name",
      "code": "service_code",
      "priority": 1,
      "recommendedTier": "tier name",
      "investment": "£X,XXX",
      "investmentFrequency": "per month|per year|one-off",
      "whyThisTier": "reasoning",
      "problemsSolved": [{ "problem": "from their responses", "theirWords": "exact quote", "howWeSolveIt": "specific actions", "expectedResult": "measurable outcome" }],
      "expectedROI": { "multiplier": "Xx", "timeframe": "X months", "calculation": "how we calculated" },
      "riskOfNotActing": "specific consequence"
    }
  ],
  "investmentSummary": {
    "totalFirstYearInvestment": "£XX,XXX",
    "projectedFirstYearReturn": "£XXX,XXX",
    "paybackPeriod": "X months",
    "comparisonToInaction": "Clear comparison"
  },
  "implementationRoadmap": [
    { "phase": "Week 1-2", "title": "Getting Started", "actions": ["action 1", "action 2"] }
  ],
  "closingMessage": {
    "personalNote": "Empathetic message",
    "callToAction": "Clear next step",
    "urgencyReminder": "Why now"
  }
}

Return ONLY the JSON object.`;

    // ========================================================================
    // CALL CLAUDE OPUS 4.5
    // ========================================================================

    // Log prompt size to help debug token limits
    const promptSize = analysisPrompt.length;
    const systemSize = SYSTEM_PROMPT.length;
    console.log(`Prompt sizes - System: ${systemSize} chars, User: ${promptSize} chars, Total: ${systemSize + promptSize} chars`);
    console.log('Calling Claude Opus 4.5...');
    const llmStartTime = Date.now();

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Discovery Analysis'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 12000,
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: analysisPrompt }
        ]
      })
    });

    const llmTime = Date.now() - llmStartTime;
    console.log(`LLM response in ${llmTime}ms`);

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter error status:', openrouterResponse.status);
      console.error('OpenRouter error body:', errorText);
      
      // Try to parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('OpenRouter error details:', JSON.stringify(errorJson, null, 2));
        throw new Error(`AI analysis failed: ${errorJson?.error?.message || errorJson?.message || openrouterResponse.status}`);
      } catch (e) {
        throw new Error(`AI analysis failed: ${openrouterResponse.status} - ${errorText.substring(0, 200)}`);
      }
    }

    const openrouterData = await openrouterResponse.json();
    const analysisText = openrouterData.choices?.[0]?.message?.content || '';
    
    if (!analysisText) {
      throw new Error('Empty response from AI');
    }

    // Parse JSON from response
    let analysis;
    try {
      let jsonString = analysisText;
      const codeBlockMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
      }
      if (!jsonString.startsWith('{')) {
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        }
      }
      analysis = JSON.parse(jsonString);
    } catch (e) {
      console.error('JSON parse error, using raw text');
      analysis = { rawAnalysis: analysisText, parseError: true };
    }

    // ========================================================================
    // SAVE REPORT TO DATABASE
    // ========================================================================

    const report = {
      client_id: preparedData.client.id,
      practice_id: preparedData.client.practiceId,
      discovery_id: preparedData.discovery.id,
      report_type: 'discovery_analysis',
      report_data: {
        generatedAt: new Date().toISOString(),
        clientName: preparedData.client.name,
        companyName: preparedData.client.company,
        analysis,
        discoveryScores: {
          clarityScore: clarityScore,
          claritySource: claritySource,
          gapScore: preparedData.discovery.gapScore
        },
        affordability: affordability,
        transformationSignals: transformationSignals.reasons.length > 0 ? transformationSignals : null
      },
      created_at: new Date().toISOString()
    };

    const { data: savedReport, error: saveError } = await supabase
      .from('client_reports')
      .insert(report)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
    }

    // Update discovery record
    await supabase
      .from('destination_discovery')
      .update({
        analysis_completed_at: new Date().toISOString(),
        analysis_report_id: savedReport?.id
      })
      .eq('id', preparedData.discovery.id);

    const totalTime = Date.now() - startTime;
    console.log(`Analysis complete in ${totalTime}ms (LLM: ${llmTime}ms)`);

    return new Response(JSON.stringify({
      success: true,
      report: {
        id: savedReport?.id,
        generatedAt: new Date().toISOString(),
        client: preparedData.client,
        practice: preparedData.practice,
        discoveryScores: {
          clarityScore: clarityScore,
          claritySource: claritySource,
          gapScore: preparedData.discovery.gapScore
        },
        affordability: affordability,
        transformationSignals: transformationSignals.reasons.length > 0 ? transformationSignals : null,
        analysis
      },
      metadata: {
        model: MODEL,
        executionTimeMs: totalTime,
        llmTimeMs: llmTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error generating analysis:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
