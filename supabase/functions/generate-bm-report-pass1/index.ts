import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// PASS 1: EXTRACTION & ANALYSIS (Sonnet)
// Compares client metrics to industry benchmarks
// Calculates percentile positions and annual £ impact
// Saves to bm_reports with status 'pass1_complete'
// Triggers Pass 2 automatically
// =============================================================================

function buildPass1Prompt(
  assessment: any,
  benchmarks: any[],
  maData: any | null,
  hvaData: any,
  clientName: string,
  industry: any
): string {
  // Format benchmarks for prompt
  const benchmarkDetails = benchmarks.map(b => {
    const metric = b.benchmark_metrics;
    return `
${metric?.name || b.metric_code} (${b.metric_code}):
  - P25: ${b.p25 ?? 'N/A'}
  - P50 (Median): ${b.p50 ?? 'N/A'}
  - P75: ${b.p75 ?? 'N/A'}
  - Sample: ${b.sample_size ?? 'Unknown'} businesses
  - Source: ${b.data_source || 'Unknown'}
`;
  }).join('\n');

  // Extract HVA (Hidden Value Audit) metrics - ALL clients have this
  const hvaMetricsText = hvaData ? `
HIDDEN VALUE AUDIT DATA (All clients complete this):
- Recurring Revenue %: ${hvaData.recurringRevenuePercent || 'N/A'}%
- Top 3 Customer Concentration: ${hvaData.customerConcentration || 'N/A'}%
- Knowledge Dependency: ${hvaData.knowledgeDependency || 'N/A'}%
- Personal vs Business Brand: ${hvaData.personalBrandPercent || 'N/A'}%
- Competitive Moat: ${hvaData.competitiveMoat || 'N/A'}
- Vacation Test: ${hvaData.vacationTest || 'N/A'}
- Succession Depth: ${hvaData.successionDepth || 'N/A'}
- Financial Documentation Quality: ${hvaData.financialDocumentation || 'N/A'}
- Exit Timeline: ${hvaData.exitTimeline || 'N/A'}
- IP Assets: ${hvaData.ipAssets || 'N/A'}
` : 'No HVA data available (unexpected - all clients should have this).';

  // Extract MA metrics if available
  const maMetricsText = maData ? `
FINANCIAL METRICS FROM MANAGEMENT ACCOUNTS:
- Revenue: £${maData.revenue?.toLocaleString() || 'N/A'}
- Gross Profit: £${maData.gross_profit?.toLocaleString() || 'N/A'} (${((maData.gross_profit / maData.revenue) * 100).toFixed(1)}%)
- Net Profit: £${maData.net_profit?.toLocaleString() || 'N/A'} (${((maData.net_profit / maData.revenue) * 100).toFixed(1)}%)
- Revenue per Employee: £${maData.revenue_per_employee?.toLocaleString() || 'N/A'}
- Debtor Days: ${maData.debtor_days || 'N/A'}
- Creditor Days: ${maData.creditor_days || 'N/A'}
` : 'No Management Accounts data available - will need to estimate or flag for collection.';

  return `
You are a financial analyst preparing a benchmarking report for a UK business.

═══════════════════════════════════════════════════════════════════════════════
CLIENT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

BUSINESS: ${clientName}
INDUSTRY: ${industry?.name || assessment.industry_code} (${assessment.industry_code})
REVENUE BAND: ${assessment.revenue_band}
EMPLOYEES: ${assessment.employee_count}
LOCATION: ${assessment.location_type}

THEIR DESCRIPTION:
"${assessment.business_description}"

═══════════════════════════════════════════════════════════════════════════════
THEIR ASSESSMENT RESPONSES
═══════════════════════════════════════════════════════════════════════════════

PERFORMANCE PERCEPTION: ${assessment.performance_perception}
METRICS THEY TRACK: ${(assessment.current_tracking || []).join(', ')}
CURRENT COMPARISON METHOD: "${assessment.comparison_method}"

SUSPECTED UNDERPERFORMANCE: "${assessment.suspected_underperformance}"
WHERE THEY'RE LEAVING MONEY: "${assessment.leaving_money}"
TOP QUARTILE AMBITIONS: ${(assessment.top_quartile_ambition || []).join(', ')}
COMPETITOR ENVY: "${assessment.competitor_envy || 'Not specified'}"

MAGIC FIX: "${assessment.benchmark_magic_fix}"
ACTION READINESS: ${assessment.action_readiness}
BLIND SPOT FEAR: "${assessment.blind_spot_fear || 'Not specified'}"

═══════════════════════════════════════════════════════════════════════════════
HIDDEN VALUE AUDIT DATA (Standard metrics for all clients)
═══════════════════════════════════════════════════════════════════════════════

${hvaMetricsText}

═══════════════════════════════════════════════════════════════════════════════
CLIENT'S ACTUAL METRICS (from MA data if available)
═══════════════════════════════════════════════════════════════════════════════

${maMetricsText}

═══════════════════════════════════════════════════════════════════════════════
INDUSTRY BENCHMARKS
═══════════════════════════════════════════════════════════════════════════════

${benchmarkDetails}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Analyze this client against the benchmarks and produce a structured JSON output.

RULES:
1. Compare EVERY available metric
2. Calculate percentile position for each (where client value falls between p25/p50/p75)
3. Quantify the annual £ impact of gaps (difference vs median × revenue)
4. Use their EXACT WORDS when referencing their concerns
5. Generate actionable admin guidance
6. Flag any data gaps that need collection

OUTPUT FORMAT (JSON):
{
  "classification": {
    "industryCode": "${assessment.industry_code}",
    "industryConfidence": number,
    "revenueBand": "${assessment.revenue_band}",
    "employeeBand": "calculated_from_employee_count"
  },
  
  "metricsComparison": [
    {
      "metricCode": "string",
      "metricName": "string",
      "clientValue": number | null,
      "clientValueSource": "ma_data" | "assessment" | "calculated" | "missing",
      "p25": number,
      "p50": number,
      "p75": number,
      "percentile": number,
      "assessment": "top_10" | "top_quartile" | "above_median" | "below_median" | "bottom_quartile" | "bottom_10",
      "vsMedian": number,
      "vsTopQuartile": number,
      "annualImpact": number,
      "impactCalculation": "string explaining the calculation",
      "isPrimary": boolean
    }
  ],
  
  "overallPosition": {
    "percentile": number,
    "summary": "string",
    "strengthCount": number,
    "gapCount": number
  },
  
  "topStrengths": [
    {
      "metric": "string",
      "position": "string",
      "clientQuoteRelevant": "string or null",
      "implication": "string"
    }
  ],
  
  "topGaps": [
    {
      "metric": "string",
      "position": "string",
      "annualImpact": number,
      "clientQuoteRelevant": "string or null",
      "rootCauseHypothesis": "string"
    }
  ],
  
  "opportunitySizing": {
    "totalAnnualOpportunity": number,
    "breakdown": [
      {
        "metric": "string",
        "currentValue": number,
        "targetValue": number,
        "annualImpact": number,
        "difficulty": "easy" | "medium" | "hard",
        "timeframe": "string"
      }
    ]
  },
  
  "recommendations": [
    {
      "priority": number,
      "title": "string",
      "description": "string",
      "metricImpacted": "string",
      "expectedImprovement": number,
      "annualValue": number,
      "difficulty": "easy" | "medium" | "hard",
      "timeframe": "string",
      "linkedService": "string or null"
    }
  ],
  
  "adminGuidance": {
    "talkingPoints": [
      {
        "topic": "string",
        "point": "string",
        "clientQuoteToReference": "string",
        "dataPoint": "string",
        "importance": "critical" | "high" | "medium"
      }
    ],
    "questionsToAsk": [
      {
        "question": "string",
        "purpose": "string",
        "expectedInsight": "string",
        "followUp": "string"
      }
    ],
    "nextSteps": [
      {
        "action": "string",
        "owner": "practice" | "client" | "joint",
        "timing": "string",
        "outcome": "string",
        "priority": number
      }
    ],
    "tasks": [
      {
        "task": "string",
        "assignTo": "string",
        "dueDate": "string",
        "deliverable": "string"
      }
    ],
    "riskFlags": [
      {
        "flag": "string",
        "mitigation": "string",
        "severity": "high" | "medium" | "low"
      }
    ]
  },
  
  "dataGaps": [
    {
      "metric": "string",
      "needed": "string",
      "source": "string",
      "critical": boolean
    }
  ],
  
  "clientQuotes": {
    "suspectedUnderperformance": "${assessment.suspected_underperformance}",
    "leavingMoney": "${assessment.leaving_money}",
    "competitorEnvy": "${assessment.competitor_envy || ''}",
    "magicFix": "${assessment.benchmark_magic_fix}",
    "blindSpotFear": "${assessment.blind_spot_fear || ''}"
  }
}

IMPORTANT:
- Every gap must have a calculated £ annual impact
- Reference their exact words in talking points
- Recommendations must link to specific metrics
- Flag gaps in their data that would improve the analysis
- Percentile calculation: Use linear interpolation between percentiles if client value falls between p25/p50/p75

Return ONLY valid JSON.
`;
}

function calculateEmployeeBand(employeeCount: number): string {
  if (employeeCount <= 5) return '1_5';
  if (employeeCount <= 10) return '6_10';
  if (employeeCount <= 25) return '11_25';
  if (employeeCount <= 50) return '26_50';
  if (employeeCount <= 100) return '51_100';
  return '100_plus';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();
    
    if (!engagementId) {
      throw new Error('engagementId is required');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('[BM Pass 1] Starting extraction for:', engagementId);
    
    // Fetch all data
    const [
      { data: engagement, error: engagementError },
      { data: assessment, error: assessmentError },
      { data: industry, error: industryError }
    ] = await Promise.all([
      supabaseClient.from('bm_engagements').select('*, clients:client_id(*)').eq('id', engagementId).single(),
      supabaseClient.from('bm_assessment_responses').select('*').eq('engagement_id', engagementId).single(),
      supabaseClient.from('industries').select('*').eq('code', assessment?.industry_code || '').maybeSingle()
    ]);
    
    if (engagementError || !engagement) {
      throw new Error(`Failed to fetch engagement: ${engagementError?.message || 'Not found'}`);
    }
    
    if (assessmentError || !assessment) {
      throw new Error(`Failed to fetch assessment: ${assessmentError?.message || 'Not found'}`);
    }
    
    // Get client name
    let clientName = 'the business';
    if (engagement.client_id) {
      const { data: client } = await supabaseClient
        .from('practice_members')
        .select('client_company, company, name')
        .eq('id', engagement.client_id)
        .maybeSingle();
      clientName = client?.client_company || client?.company || client?.name || 'the business';
    }
    
    // Get benchmarks for this industry/size
    const employeeBand = calculateEmployeeBand(assessment.employee_count || 0);
    const { data: benchmarks } = await supabaseClient
      .from('benchmark_data')
      .select(`
        *,
        benchmark_metrics (*)
      `)
      .eq('industry_code', assessment.industry_code)
      .or(`revenue_band.eq.${assessment.revenue_band},revenue_band.eq.all`)
      .or(`employee_band.eq.${employeeBand},employee_band.eq.all`)
      .eq('is_current', true);
    
    // Get HVA (Hidden Value Audit) data - ALL clients have this
    const { data: hvaData } = await supabaseClient
      .from('client_assessments')
      .select('responses, value_analysis_data')
      .eq('client_id', engagement.client_id)
      .eq('assessment_type', 'part3')
      .maybeSingle();
    
    // Extract HVA metrics from responses
    const hvaMetrics = hvaData?.responses || {};
    const hvaContext = {
      recurringRevenuePercent: hvaMetrics.recurring_revenue_percentage,
      customerConcentration: hvaMetrics.top3_customer_revenue_percentage,
      knowledgeDependency: hvaMetrics.knowledge_dependency_percentage,
      personalBrandPercent: hvaMetrics.personal_brand_percentage,
      competitiveMoat: hvaMetrics.competitive_moat,
      vacationTest: hvaMetrics.vacation_test,
      successionDepth: hvaMetrics.succession_depth,
      financialDocumentation: hvaMetrics.financial_documentation,
      exitTimeline: hvaMetrics.exit_timeline,
      ipAssets: hvaMetrics.ip_assets,
    };
    
    // Get MA data if available
    const { data: maData } = await supabaseClient
      .from('ma_reports')
      .select('*')
      .eq('client_id', engagement.client_id)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    
    // Build and send prompt
    console.log('[BM Pass 1] Calling Sonnet for extraction...');
    const startTime = Date.now();
    
    const prompt = buildPass1Prompt(
      assessment,
      benchmarks || [],
      maData,
      hvaContext,
      clientName,
      industry || {}
    );
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const pass1Data = JSON.parse(result.choices[0].message.content);
    const tokensUsed = result.usage?.total_tokens || 0;
    const cost = (tokensUsed / 1000) * 0.003; // Approximate cost for Sonnet 4
    const generationTime = Date.now() - startTime;
    
    console.log('[BM Pass 1] Extraction complete. Tokens:', tokensUsed, 'Cost: £', cost.toFixed(4));
    
    // Calculate employee band
    const calculatedEmployeeBand = calculateEmployeeBand(assessment.employee_count || 0);
    
    // Save to database
    const { data: report, error: saveError } = await supabaseClient
      .from('bm_reports')
      .upsert({
        engagement_id: engagementId,
        industry_code: pass1Data.classification.industryCode,
        revenue_band: pass1Data.classification.revenueBand,
        employee_band: calculatedEmployeeBand,
        metrics_comparison: pass1Data.metricsComparison,
        overall_percentile: pass1Data.overallPosition.percentile,
        strength_count: pass1Data.overallPosition.strengthCount,
        gap_count: pass1Data.overallPosition.gapCount,
        top_strengths: pass1Data.topStrengths,
        top_gaps: pass1Data.topGaps,
        total_annual_opportunity: pass1Data.opportunitySizing.totalAnnualOpportunity,
        opportunity_breakdown: pass1Data.opportunitySizing.breakdown,
        recommendations: pass1Data.recommendations,
        admin_talking_points: pass1Data.adminGuidance.talkingPoints,
        admin_questions_to_ask: pass1Data.adminGuidance.questionsToAsk,
        admin_next_steps: pass1Data.adminGuidance.nextSteps,
        admin_tasks: pass1Data.adminGuidance.tasks,
        admin_risk_flags: pass1Data.adminGuidance.riskFlags,
        pass1_data: pass1Data,
        llm_model: 'claude-sonnet-4',
        llm_tokens_used: tokensUsed,
        llm_cost: cost,
        generation_time_ms: generationTime,
        benchmark_data_as_of: new Date().toISOString().split('T')[0],
        data_sources: benchmarks?.map((b: any) => b.data_source).filter(Boolean) || []
      }, { onConflict: 'engagement_id' })
      .select()
      .single();
    
    if (saveError || !report) {
      throw saveError || new Error('Failed to save report');
    }
    
    // Save individual metric comparisons
    await supabaseClient.from('bm_metric_comparisons').delete().eq('engagement_id', engagementId);
    
    for (const [index, metric] of pass1Data.metricsComparison.entries()) {
      await supabaseClient.from('bm_metric_comparisons').insert({
        engagement_id: engagementId,
        metric_code: metric.metricCode,
        metric_name: metric.metricName,
        client_value: metric.clientValue,
        client_value_source: metric.clientValueSource,
        p25: metric.p25,
        p50: metric.p50,
        p75: metric.p75,
        percentile: metric.percentile,
        assessment: metric.assessment,
        vs_median: metric.vsMedian,
        vs_top_quartile: metric.vsTopQuartile,
        annual_impact: metric.annualImpact,
        impact_calculation: metric.impactCalculation,
        is_primary: metric.isPrimary,
        display_order: index
      });
    }
    
    // Update engagement status
    await supabaseClient
      .from('bm_engagements')
      .update({ status: 'pass1_complete' })
      .eq('id', engagementId);
    
    console.log('[BM Pass 1] Saved. Triggering Pass 2...');
    
    // Trigger Pass 2 asynchronously
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && serviceRoleKey) {
      setTimeout(async () => {
        try {
          console.log('[BM Pass 1] Calling Pass 2 function...');
          const pass2Response = await fetch(`${supabaseUrl}/functions/v1/generate-bm-report-pass2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({ engagementId })
          });
          
          if (!pass2Response.ok) {
            const errorText = await pass2Response.text();
            console.error('[BM Pass 1] Pass 2 trigger failed:', pass2Response.status, errorText);
          } else {
            console.log('[BM Pass 1] Pass 2 triggered successfully');
          }
        } catch (err) {
          console.error('[BM Pass 1] Failed to trigger Pass 2:', err);
        }
      }, 2000);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        engagementId,
        status: 'pass1_complete',
        overallPercentile: pass1Data.overallPosition.percentile,
        totalOpportunity: pass1Data.opportunitySizing.totalAnnualOpportunity,
        strengthsCount: pass1Data.overallPosition.strengthCount,
        gapsCount: pass1Data.overallPosition.gapCount,
        tokensUsed,
        cost: `£${cost.toFixed(4)}`,
        generationTimeMs: generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[BM Pass 1] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

