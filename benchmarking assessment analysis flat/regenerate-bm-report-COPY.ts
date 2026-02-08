import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// REGENERATE BENCHMARKING REPORT
// =============================================================================
// Re-runs the benchmarking analysis on existing assessment data
// Forces a refresh of benchmark data to get latest industry figures
// Useful for:
//   - Updating reports with fresher industry data
//   - Re-analyzing after benchmark methodology improvements
//   - Monthly fractional CFO refreshes
// =============================================================================

interface RegenerateOptions {
  engagementId: string;
  forceRefreshBenchmarks?: boolean; // Default: true - always get fresh data
  preserveExistingReport?: boolean; // Default: false - overwrite existing
  reason?: string; // Audit trail for why regeneration was requested
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const options: RegenerateOptions = {
      engagementId: body.engagementId,
      forceRefreshBenchmarks: body.forceRefreshBenchmarks ?? true,
      preserveExistingReport: body.preserveExistingReport ?? false,
      reason: body.reason || 'Manual regeneration request'
    };

    if (!options.engagementId) {
      throw new Error('engagementId is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[BM Regenerate] Starting regeneration for:', options.engagementId);
    console.log('[BM Regenerate] Options:', {
      forceRefreshBenchmarks: options.forceRefreshBenchmarks,
      preserveExistingReport: options.preserveExistingReport,
      reason: options.reason
    });

    // =========================================================================
    // STEP 1: Validate engagement exists and has assessment data
    // =========================================================================
    
    const { data: engagement, error: engagementError } = await supabase
      .from('bm_engagements')
      .select('*, clients:client_id(*)')
      .eq('id', options.engagementId)
      .single();

    if (engagementError || !engagement) {
      throw new Error(`Engagement not found: ${engagementError?.message || 'Not found'}`);
    }

    const { data: assessment, error: assessmentError } = await supabase
      .from('bm_assessment_responses')
      .select('*')
      .eq('engagement_id', options.engagementId)
      .single();

    if (assessmentError || !assessment) {
      throw new Error(`Assessment data not found: ${assessmentError?.message || 'Not found'}`);
    }

    console.log('[BM Regenerate] Found engagement and assessment data');

    // =========================================================================
    // STEP 2: Get existing report for comparison (if preserving)
    // =========================================================================
    
    let existingReport: any = null;
    const { data: currentReport } = await supabase
      .from('bm_reports')
      .select('*')
      .eq('engagement_id', options.engagementId)
      .single();

    if (currentReport) {
      existingReport = {
        previousPercentile: currentReport.overall_percentile,
        previousOpportunity: currentReport.total_annual_opportunity,
        previousGeneratedAt: currentReport.created_at,
        previousBenchmarkDate: currentReport.benchmark_data_as_of,
        previousDataSources: currentReport.data_sources
      };
      console.log('[BM Regenerate] Existing report found:', existingReport);
    }

    // =========================================================================
    // STEP 3: Force refresh benchmark data if requested
    // =========================================================================
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Get industry details
    const industryCode = assessment.industry_code || assessment.responses?.industry_code;
    
    const { data: industry } = await supabase
      .from('industries')
      .select('name, code')
      .eq('code', industryCode)
      .maybeSingle();

    if (options.forceRefreshBenchmarks && industryCode) {
      console.log('[BM Regenerate] Forcing benchmark data refresh for:', industryCode);
      
      try {
        const refreshResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-industry-benchmarks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({
            industryCode: industryCode,
            industryName: industry?.name || industryCode,
            revenueBand: assessment.revenue_band || assessment.responses?.bm_revenue_band,
            employeeBand: calculateEmployeeBand(assessment.employee_count || assessment.responses?.bm_employee_count || 0),
            forceRefresh: true, // Always force refresh on regenerate
            triggeredBy: 'scheduled_refresh', // or 'manual' based on context
            engagementId: options.engagementId
          })
        });

        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          console.log('[BM Regenerate] Benchmark refresh result:', {
            source: refreshResult.source,
            metricsCount: refreshResult.metricCount,
            updated: refreshResult.metricsUpdated,
            created: refreshResult.metricsCreated,
            confidence: refreshResult.confidenceScore
          });
        } else {
          console.warn('[BM Regenerate] Benchmark refresh returned error:', refreshResponse.status);
        }
      } catch (refreshError) {
        console.warn('[BM Regenerate] Benchmark refresh failed (continuing anyway):', refreshError);
      }
    }

    // =========================================================================
    // STEP 4: Archive existing report if not overwriting
    // =========================================================================
    
    if (options.preserveExistingReport && currentReport) {
      // Could implement archiving here - save to bm_report_history table
      console.log('[BM Regenerate] Preserving existing report (archiving not yet implemented)');
    }

    // =========================================================================
    // STEP 5: Reset engagement status for regeneration
    // =========================================================================
    
    await supabase
      .from('bm_engagements')
      .update({ 
        status: 'assessment_complete',
        generated_at: null 
      })
      .eq('id', options.engagementId);

    // =========================================================================
    // STEP 6: Trigger Pass 1 to regenerate analysis
    // =========================================================================
    
    console.log('[BM Regenerate] Triggering Pass 1...');
    
    const pass1Response = await fetch(`${supabaseUrl}/functions/v1/generate-bm-report-pass1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ engagementId: options.engagementId })
    });

    if (!pass1Response.ok) {
      const errorText = await pass1Response.text();
      throw new Error(`Pass 1 failed: ${pass1Response.status} - ${errorText}`);
    }

    const pass1Result = await pass1Response.json();
    console.log('[BM Regenerate] Pass 1 triggered successfully:', pass1Result);

    // =========================================================================
    // STEP 7: Return immediately - let frontend poll for completion
    // =========================================================================
    // IMPORTANT: Don't wait here! The HTTP connection will timeout.
    // Pass 1 triggers Pass 2 automatically, and the frontend polls for status.
    
    console.log('[BM Regenerate] Returning immediately - frontend will poll for completion');
    
    // Get the current report state (might be pass1_complete or still processing)
    const { data: currentState } = await supabase
      .from('bm_reports')
      .select('id, status')
      .eq('engagement_id', options.engagementId)
      .single();
    
    const newReport = currentState;

    // =========================================================================
    // STEP 8: Log the regeneration for audit
    // =========================================================================
    
    await supabase.from('benchmark_search_log').insert({
      industry_code: industryCode,
      industry_name: industry?.name || industryCode,
      search_provider: 'regeneration',
      model_used: 'regenerate-bm-report',
      search_query: `Regeneration: ${options.reason}`,
      status: 'success',
      metrics_found: newReport?.metrics_comparison?.length || 0,
      confidence_score: null,
      triggered_by: 'manual',
      engagement_id: options.engagementId,
      completed_at: new Date().toISOString()
    });

    // =========================================================================
    // STEP 9: Return comparison results
    // =========================================================================
    
    const comparison = existingReport ? {
      previousPercentile: existingReport.previousPercentile,
      newPercentile: newReport?.overall_percentile,
      percentileChange: (newReport?.overall_percentile || 0) - (existingReport.previousPercentile || 0),
      previousOpportunity: existingReport.previousOpportunity,
      newOpportunity: newReport?.total_annual_opportunity,
      opportunityChange: (newReport?.total_annual_opportunity || 0) - (existingReport.previousOpportunity || 0),
      previousBenchmarkDate: existingReport.previousBenchmarkDate,
      newBenchmarkDate: newReport?.benchmark_data_as_of,
      newDataSources: newReport?.data_sources
    } : null;

    return new Response(
      JSON.stringify({
        success: true,
        engagementId: options.engagementId,
        status: newReport?.status || 'regenerating',
        regeneratedAt: new Date().toISOString(),
        reason: options.reason,
        benchmarksRefreshed: options.forceRefreshBenchmarks,
        comparison,
        report: newReport ? {
          overallPercentile: newReport.overall_percentile,
          totalOpportunity: newReport.total_annual_opportunity,
          strengthCount: newReport.strength_count,
          gapCount: newReport.gap_count,
          benchmarkDataAsOf: newReport.benchmark_data_as_of,
          dataSources: newReport.data_sources
        } : null,
        message: comparison 
          ? `Report regenerated. Percentile changed from ${comparison.previousPercentile} to ${comparison.newPercentile} (${comparison.percentileChange >= 0 ? '+' : ''}${comparison.percentileChange}).`
          : 'Report generated successfully.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BM Regenerate] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function (duplicated from pass1 for now)
function calculateEmployeeBand(employeeCount: number): string {
  if (employeeCount <= 5) return '1_5';
  if (employeeCount <= 10) return '6_10';
  if (employeeCount <= 25) return '11_25';
  if (employeeCount <= 50) return '26_50';
  if (employeeCount <= 100) return '51_100';
  return '100_plus';
}

