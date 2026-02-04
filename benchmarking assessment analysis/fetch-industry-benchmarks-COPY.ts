import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// FETCH INDUSTRY BENCHMARKS
// =============================================================================
// Uses Perplexity Sonar Pro via OpenRouter to fetch live industry benchmarks
// Caches results in benchmark_data table with source tracking
// Called by benchmarking service line before report generation
// =============================================================================

interface BenchmarkQuery {
  industryCode: string;
  industryName: string;
  revenueBand?: string;
  employeeBand?: string;
  forceRefresh?: boolean; // Skip cache check
  triggeredBy?: 'benchmarking_service' | 'scheduled_refresh' | 'manual' | 'other_service';
  engagementId?: string;
}

interface MetricData {
  metricCode: string;
  metricName: string;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90?: number | null;
  unit: 'percent' | 'currency' | 'days' | 'ratio' | 'number';
  source: string;
  sourceUrl?: string;
  confidence: number;
}

interface SearchResult {
  success: boolean;
  metrics: MetricData[];
  sources: string[];
  confidenceScore: number;
  rawResponse?: any;
  tokensUsed: number;
  responseTimeMs: number;
}

// Standard benchmark metrics we want to collect
const CORE_METRICS = [
  { code: 'revenue_per_employee', name: 'Revenue per Employee', unit: 'currency', higherIsBetter: true },
  { code: 'gross_margin', name: 'Gross Profit Margin', unit: 'percent', higherIsBetter: true },
  { code: 'net_margin', name: 'Net Profit Margin', unit: 'percent', higherIsBetter: true },
  { code: 'operating_margin', name: 'Operating Margin', unit: 'percent', higherIsBetter: true },
  { code: 'ebitda_margin', name: 'EBITDA Margin', unit: 'percent', higherIsBetter: true },
  { code: 'revenue_growth', name: 'Annual Revenue Growth', unit: 'percent', higherIsBetter: true },
  { code: 'employee_turnover', name: 'Employee Turnover Rate', unit: 'percent', higherIsBetter: false },
  { code: 'debtor_days', name: 'Debtor Days (DSO)', unit: 'days', higherIsBetter: false },
  { code: 'creditor_days', name: 'Creditor Days (DPO)', unit: 'days', higherIsBetter: true },
  { code: 'current_ratio', name: 'Current Ratio', unit: 'ratio', higherIsBetter: true },
  { code: 'quick_ratio', name: 'Quick Ratio', unit: 'ratio', higherIsBetter: true },
  { code: 'client_concentration', name: 'Top 3 Client Concentration', unit: 'percent', higherIsBetter: false },
  { code: 'utilisation_rate', name: 'Staff Utilisation Rate', unit: 'percent', higherIsBetter: true },
  { code: 'average_project_value', name: 'Average Project Value', unit: 'currency', higherIsBetter: true },
  { code: 'customer_acquisition_cost', name: 'Customer Acquisition Cost', unit: 'currency', higherIsBetter: false },
  { code: 'ltv_cac_ratio', name: 'LTV:CAC Ratio', unit: 'ratio', higherIsBetter: true },
];

/**
 * Build the search prompt for Perplexity
 */
function buildSearchPrompt(query: BenchmarkQuery): string {
  const sizeContext = query.revenueBand 
    ? `with annual revenue ${formatRevenueBand(query.revenueBand)}` 
    : '';
  
  const employeeContext = query.employeeBand
    ? `and ${formatEmployeeBand(query.employeeBand)} employees`
    : '';

  return `
You are a financial analyst researching current UK industry benchmarks for ${query.industryName} businesses ${sizeContext} ${employeeContext}.

Find the most recent and authoritative benchmark data for this industry. Focus on:

1. **Revenue per Employee** - What is typical revenue per head for UK ${query.industryName} businesses?
2. **Gross Profit Margin** - What gross margins are typical in this sector?
3. **Net Profit Margin** - What net margins do businesses achieve?
4. **Operating/EBITDA Margins** - Operating profitability benchmarks
5. **Revenue Growth** - Annual growth rates for the sector
6. **Staff Turnover** - Employee retention rates
7. **Debtor Days** - How long do businesses take to collect payment?
8. **Current Ratio** - Liquidity benchmarks
9. **Utilisation Rate** (if applicable for service businesses) - Billable utilisation
10. **Client Concentration** - Revenue concentration in top clients

For each metric, provide:
- 25th percentile (below average performers)
- 50th percentile (median/typical)
- 75th percentile (above average performers)
- 90th percentile (top performers) if available

CRITICAL REQUIREMENTS:
- Use UK-specific data where possible (ONS, UK trade associations, Companies House analysis)
- Cite your sources with URLs where possible
- Include the year/date of the data
- If data is from different regions, note this
- Be specific about business size ranges if the benchmarks vary by company size
- If you cannot find reliable data for a metric, say so rather than guess

Respond in this exact JSON format:
{
  "metrics": [
    {
      "metricCode": "revenue_per_employee",
      "metricName": "Revenue per Employee",
      "p25": 75000,
      "p50": 95000,
      "p75": 125000,
      "p90": 165000,
      "unit": "currency",
      "source": "ONS Annual Business Survey 2024",
      "sourceUrl": "https://www.ons.gov.uk/...",
      "dataYear": 2024,
      "confidence": 0.9,
      "notes": "UK-specific data for professional services sector"
    }
  ],
  "sources": [
    {
      "name": "ONS Annual Business Survey",
      "url": "https://...",
      "type": "government",
      "relevance": 0.95
    }
  ],
  "overallConfidence": 0.85,
  "dataQualityNotes": "Good coverage for core financial metrics, limited data on operational metrics",
  "marketContext": "Brief 2-3 sentence overview of current market conditions for this industry"
}

Remember: Precision matters. Only include metrics you have reliable data for. It's better to return fewer high-confidence metrics than many low-confidence guesses.
`;
}

function formatRevenueBand(band: string): string {
  const bands: Record<string, string> = {
    'under_250k': 'under £250,000',
    '250k_500k': '£250,000 to £500,000',
    '500k_1m': '£500,000 to £1 million',
    '1m_2m': '£1 million to £2 million',
    '2m_5m': '£2 million to £5 million',
    '5m_10m': '£5 million to £10 million',
    '10m_plus': 'over £10 million',
    'all': 'of all sizes'
  };
  return bands[band] || band;
}

function formatEmployeeBand(band: string): string {
  const bands: Record<string, string> = {
    '1_5': '1-5',
    '6_10': '6-10',
    '11_25': '11-25',
    '26_50': '26-50',
    '51_100': '51-100',
    '100_plus': 'over 100',
    'all': 'any number of'
  };
  return bands[band] || band;
}

/**
 * Check if cached benchmarks are fresh enough
 */
async function checkCache(
  supabase: any,
  industryCode: string,
  maxAgeDays: number = 30
): Promise<{ isFresh: boolean; lastUpdated: Date | null; metricCount: number }> {
  const { data, error } = await supabase.rpc('check_benchmark_freshness', {
    p_industry_code: industryCode,
    p_max_age_days: maxAgeDays
  });

  if (error || !data || data.length === 0) {
    console.log('[Benchmark Search] Cache check failed or no data:', error?.message);
    return { isFresh: false, lastUpdated: null, metricCount: 0 };
  }

  const result = data[0];
  return {
    isFresh: !result.needs_refresh,
    lastUpdated: result.last_updated ? new Date(result.last_updated) : null,
    metricCount: result.metric_count || 0
  };
}

/**
 * Call Perplexity Sonar Pro via OpenRouter for live search
 */
async function performLiveSearch(
  query: BenchmarkQuery,
  openRouterKey: string
): Promise<SearchResult> {
  const startTime = Date.now();
  
  console.log(`[Benchmark Search] Calling Perplexity Sonar Pro for ${query.industryName}...`);
  
  const prompt = buildSearchPrompt(query);
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': Deno.env.get('OPENROUTER_REFERRER_URL') || 'https://torsor.io',
    },
    body: JSON.stringify({
      model: 'perplexity/sonar-pro', // Perplexity's best model with live search
      messages: [
        {
          role: 'system',
          content: 'You are a financial research analyst specializing in UK SME industry benchmarks. Always cite sources and provide data with confidence levels. Use UK-specific data where possible.'
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      temperature: 0.1, // Low temperature for factual accuracy
      max_tokens: 4000,
    }),
  });

  const responseTimeMs = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Benchmark Search] Perplexity API error:', response.status, errorText);
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || '';
  const tokensUsed = result.usage?.total_tokens || 0;

  console.log(`[Benchmark Search] Response received. Tokens: ${tokensUsed}, Time: ${responseTimeMs}ms`);

  // Parse the JSON response
  let parsedData: any;
  try {
    // Try to extract JSON from the response (it might be wrapped in markdown)
    let jsonContent = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/i, '');
      jsonContent = jsonContent.replace(/\n?```$/i, '');
      jsonContent = jsonContent.trim();
    }
    
    parsedData = JSON.parse(jsonContent);
  } catch (parseError) {
    console.error('[Benchmark Search] Failed to parse response:', parseError);
    console.error('[Benchmark Search] Raw content:', content.substring(0, 500));
    
    // Return partial result
    return {
      success: false,
      metrics: [],
      sources: [],
      confidenceScore: 0,
      rawResponse: { content, error: 'Parse failed' },
      tokensUsed,
      responseTimeMs
    };
  }

  // Extract and validate metrics
  const metrics: MetricData[] = [];
  
  if (parsedData.metrics && Array.isArray(parsedData.metrics)) {
    for (const m of parsedData.metrics) {
      // Validate the metric has required fields
      if (m.metricCode && (m.p50 !== undefined || m.p25 !== undefined || m.p75 !== undefined)) {
        // Validate values are reasonable
        if (validateMetricValues(m)) {
          metrics.push({
            metricCode: m.metricCode,
            metricName: m.metricName || m.metricCode,
            p25: m.p25 ?? null,
            p50: m.p50 ?? null,
            p75: m.p75 ?? null,
            p90: m.p90 ?? null,
            unit: m.unit || 'number',
            source: m.source || 'Perplexity Live Search',
            sourceUrl: m.sourceUrl,
            confidence: m.confidence || 0.5
          });
        } else {
          console.warn(`[Benchmark Search] Skipping invalid metric values for ${m.metricCode}:`, m);
        }
      }
    }
  }

  // Extract sources
  const sources: string[] = [];
  if (parsedData.sources && Array.isArray(parsedData.sources)) {
    for (const s of parsedData.sources) {
      if (s.url) {
        sources.push(s.url);
      } else if (s.name) {
        sources.push(s.name);
      }
    }
  }

  return {
    success: metrics.length > 0,
    metrics,
    sources,
    confidenceScore: parsedData.overallConfidence || (metrics.length > 0 ? 0.7 : 0),
    rawResponse: parsedData,
    tokensUsed,
    responseTimeMs
  };
}

/**
 * Validate metric values are within reasonable bounds
 */
function validateMetricValues(metric: any): boolean {
  const { metricCode, p25, p50, p75, p90, unit } = metric;
  
  // Check for obviously wrong values
  if (unit === 'percent') {
    const values = [p25, p50, p75, p90].filter(v => v !== null && v !== undefined);
    // Percentages should generally be 0-100 (allow some margin for growth rates)
    if (values.some(v => v < -50 || v > 200)) {
      console.warn(`[Benchmark Search] Suspicious percentage values for ${metricCode}`);
      return false;
    }
  }
  
  if (unit === 'currency') {
    const values = [p25, p50, p75, p90].filter(v => v !== null && v !== undefined);
    // Currency values should be positive (for most business metrics)
    if (values.some(v => v < 0)) {
      console.warn(`[Benchmark Search] Negative currency value for ${metricCode}`);
      return false;
    }
    // Revenue per employee shouldn't be > £1M typically for SMEs
    if (metricCode === 'revenue_per_employee' && values.some(v => v > 1000000)) {
      console.warn(`[Benchmark Search] Suspiciously high revenue per employee: ${values}`);
      return false;
    }
  }
  
  if (unit === 'days') {
    const values = [p25, p50, p75, p90].filter(v => v !== null && v !== undefined);
    // Days should be reasonable (0-365)
    if (values.some(v => v < 0 || v > 365)) {
      console.warn(`[Benchmark Search] Suspicious days value for ${metricCode}`);
      return false;
    }
  }
  
  // Check percentile ordering (p25 <= p50 <= p75 <= p90 for most metrics)
  // Note: For "lower is better" metrics like debtor_days, this is reversed
  // We'll allow either ordering for now
  
  return true;
}

/**
 * Save benchmark data to database
 */
async function saveBenchmarkData(
  supabase: any,
  industryCode: string,
  metrics: MetricData[],
  sources: string[],
  rawResponse: any,
  revenueBand: string = 'all',
  employeeBand: string = 'all'
): Promise<{ updated: number; created: number }> {
  let updated = 0;
  let created = 0;

  for (const metric of metrics) {
    // Check if metric exists in benchmark_metrics
    const { data: metricDef } = await supabase
      .from('benchmark_metrics')
      .select('code')
      .eq('code', metric.metricCode)
      .maybeSingle();

    // If metric doesn't exist, create it
    if (!metricDef) {
      const coreMetric = CORE_METRICS.find(m => m.code === metric.metricCode);
      await supabase.from('benchmark_metrics').insert({
        code: metric.metricCode,
        name: metric.metricName,
        unit: metric.unit,
        higher_is_better: coreMetric?.higherIsBetter ?? true,
        description: `Auto-created from live search`
      });
    }

    // Upsert benchmark data
    const { data: existing } = await supabase
      .from('benchmark_data')
      .select('id, version')
      .eq('industry_code', industryCode)
      .eq('metric_code', metric.metricCode)
      .eq('revenue_band', revenueBand)
      .eq('employee_band', employeeBand)
      .eq('is_current', true)
      .maybeSingle();

    const benchmarkRecord = {
      industry_code: industryCode,
      metric_code: metric.metricCode,
      revenue_band: revenueBand,
      employee_band: employeeBand,
      p25: metric.p25,
      p50: metric.p50,
      p75: metric.p75,
      p90: metric.p90,
      data_source: metric.source,
      source_url: metric.sourceUrl,
      confidence_level: metric.confidence >= 0.8 ? 'high' : metric.confidence >= 0.5 ? 'medium' : 'low',
      data_year: new Date().getFullYear(),
      is_current: true,
      fetched_via: 'live_search',
      sources: sources,
      confidence_score: metric.confidence,
      last_verified_at: new Date().toISOString(),
      raw_search_response: rawResponse,
      region: 'UK',
      updated_at: new Date().toISOString()
    };

    if (existing) {
      // Update existing record
      await supabase
        .from('benchmark_data')
        .update(benchmarkRecord)
        .eq('id', existing.id);
      updated++;
    } else {
      // Create new record
      await supabase
        .from('benchmark_data')
        .insert({
          ...benchmarkRecord,
          version: 1,
          valid_from: new Date().toISOString().split('T')[0]
        });
      created++;
    }
  }

  return { updated, created };
}

/**
 * Log the search for audit
 */
async function logSearch(
  supabase: any,
  query: BenchmarkQuery,
  result: SearchResult,
  saveResult: { updated: number; created: number },
  status: 'success' | 'partial' | 'failed'
): Promise<void> {
  // Estimate cost (Perplexity via OpenRouter is approximately $1/1M tokens)
  const estimatedCost = (result.tokensUsed / 1000000) * 1;

  await supabase.from('benchmark_search_log').insert({
    industry_code: query.industryCode,
    industry_name: query.industryName,
    revenue_band: query.revenueBand || 'all',
    employee_band: query.employeeBand || 'all',
    search_provider: 'perplexity',
    model_used: 'perplexity/sonar-pro',
    search_query: buildSearchPrompt(query).substring(0, 1000), // Truncate for storage
    status,
    metrics_found: result.metrics.length,
    metrics_updated: saveResult.updated,
    metrics_created: saveResult.created,
    sources_found: result.sources,
    source_count: result.sources.length,
    confidence_score: result.confidenceScore,
    raw_response: result.rawResponse,
    parsed_metrics: result.metrics,
    tokens_used: result.tokensUsed,
    estimated_cost: estimatedCost,
    response_time_ms: result.responseTimeMs,
    completed_at: new Date().toISOString(),
    triggered_by: query.triggeredBy || 'manual',
    engagement_id: query.engagementId
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const query: BenchmarkQuery = {
      industryCode: body.industryCode,
      industryName: body.industryName,
      revenueBand: body.revenueBand,
      employeeBand: body.employeeBand,
      forceRefresh: body.forceRefresh || false,
      triggeredBy: body.triggeredBy || 'manual',
      engagementId: body.engagementId
    };

    if (!query.industryCode || !query.industryName) {
      throw new Error('industryCode and industryName are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[Benchmark Search] Starting for ${query.industryName} (${query.industryCode})`);

    // Check cache unless force refresh
    if (!query.forceRefresh) {
      const cache = await checkCache(supabase, query.industryCode, 30);
      
      if (cache.isFresh && cache.metricCount >= 5) {
        console.log(`[Benchmark Search] Using cached data (${cache.metricCount} metrics, last updated ${cache.lastUpdated})`);
        
        // Return cached benchmarks
        const { data: cachedBenchmarks } = await supabase
          .from('benchmark_data')
          .select('*, benchmark_metrics(*)')
          .eq('industry_code', query.industryCode)
          .eq('is_current', true);

        return new Response(
          JSON.stringify({
            success: true,
            source: 'cache',
            industryCode: query.industryCode,
            metrics: cachedBenchmarks || [],
            metricCount: cachedBenchmarks?.length || 0,
            lastUpdated: cache.lastUpdated,
            message: 'Using cached benchmark data (less than 30 days old)'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`[Benchmark Search] Cache stale or insufficient (${cache.metricCount} metrics, ${cache.lastUpdated ? 'last updated ' + cache.lastUpdated : 'no cache'}). Fetching fresh data...`);
    }

    // Get OpenRouter API key
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Perform live search
    const searchResult = await performLiveSearch(query, openRouterKey);

    // Save results if successful
    let saveResult = { updated: 0, created: 0 };
    let status: 'success' | 'partial' | 'failed' = 'failed';

    if (searchResult.success && searchResult.metrics.length > 0) {
      saveResult = await saveBenchmarkData(
        supabase,
        query.industryCode,
        searchResult.metrics,
        searchResult.sources,
        searchResult.rawResponse,
        query.revenueBand || 'all',
        query.employeeBand || 'all'
      );
      
      status = searchResult.metrics.length >= 5 ? 'success' : 'partial';
      console.log(`[Benchmark Search] Saved ${saveResult.created} new, ${saveResult.updated} updated metrics`);
    }

    // Log the search
    await logSearch(supabase, query, searchResult, saveResult, status);

    // Fetch updated benchmarks to return
    const { data: updatedBenchmarks } = await supabase
      .from('benchmark_data')
      .select('*, benchmark_metrics(*)')
      .eq('industry_code', query.industryCode)
      .eq('is_current', true);

    return new Response(
      JSON.stringify({
        success: searchResult.success,
        source: 'live_search',
        industryCode: query.industryCode,
        metrics: updatedBenchmarks || [],
        metricCount: updatedBenchmarks?.length || 0,
        metricsFound: searchResult.metrics.length,
        metricsUpdated: saveResult.updated,
        metricsCreated: saveResult.created,
        sources: searchResult.sources,
        confidenceScore: searchResult.confidenceScore,
        tokensUsed: searchResult.tokensUsed,
        responseTimeMs: searchResult.responseTimeMs,
        estimatedCost: `£${((searchResult.tokensUsed / 1000000) * 1).toFixed(4)}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Benchmark Search] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


