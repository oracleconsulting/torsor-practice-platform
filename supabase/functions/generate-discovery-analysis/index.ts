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

// Use Claude Opus 4.5 for premium quality
const MODEL = 'anthropic/claude-opus-4.5';

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
4. Recommend at least 3 services - most clients need a combination
5. Show the domino effect: how fixing one thing enables the next
6. Make the comparison crystal clear: investment cost vs. cost of inaction

Writing style:
- Direct and confident, backed by specific evidence
- Empathetic but pragmatic
- Create urgency through specific £ calculations`;

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
      console.error('OpenRouter error:', errorText);
      throw new Error(`AI analysis failed: ${openrouterResponse.status}`);
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
          clarityScore: preparedData.patternAnalysis?.destinationClarity?.score || preparedData.discovery.destinationClarityScore,
          gapScore: preparedData.discovery.gapScore
        }
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
          clarityScore: preparedData.patternAnalysis?.destinationClarity?.score || preparedData.discovery.destinationClarityScore,
          gapScore: preparedData.discovery.gapScore
        },
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
