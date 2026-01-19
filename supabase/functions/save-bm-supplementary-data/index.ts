import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// SAVE BENCHMARKING SUPPLEMENTARY DATA
// =============================================================================
// Saves additional metrics collected during admin-client conversations
// This data enriches the assessment for more accurate benchmarking analysis
// Called from the Data Collection panel in the admin view
// =============================================================================

interface SupplementaryData {
  // Operational metrics
  utilisation_rate?: number;       // % of time on billable work
  blended_hourly_rate?: number;    // Average hourly rate in £
  avg_project_margin?: number;     // % gross margin on projects
  
  // Financial metrics
  gross_margin?: number;           // Gross profit %
  net_margin?: number;             // Net profit %
  ebitda_margin?: number;          // EBITDA %
  revenue_growth?: number;         // YoY growth %
  
  // Cash flow metrics
  debtor_days?: number;            // Average days to collect
  creditor_days?: number;          // Average days to pay
  
  // Risk metrics
  client_concentration_top3?: number; // % revenue from top 3 clients
  
  // Other metrics
  employee_turnover?: number;      // Annual turnover %
  nps_score?: number;              // Net Promoter Score
  customer_acquisition_cost?: number; // CAC in £
}

interface SaveRequest {
  engagementId: string;
  data: SupplementaryData;
  collectedBy?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: SaveRequest = await req.json();
    const { engagementId, data, collectedBy, notes } = body;

    if (!engagementId) {
      throw new Error('engagementId is required');
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error('No data provided to save');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[BM Supplementary] Saving data for engagement:', engagementId);
    console.log('[BM Supplementary] Data fields:', Object.keys(data));

    // =========================================================================
    // STEP 1: Validate engagement exists
    // =========================================================================
    
    const { data: engagement, error: engagementError } = await supabase
      .from('bm_engagements')
      .select('id, client_id, practice_id, status')
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      throw new Error(`Engagement not found: ${engagementError?.message || 'Not found'}`);
    }

    // =========================================================================
    // STEP 2: Get existing assessment responses
    // =========================================================================
    
    const { data: existingAssessment, error: assessmentError } = await supabase
      .from('bm_assessment_responses')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();

    if (assessmentError) {
      console.warn('[BM Supplementary] No existing assessment, will create supplementary record only');
    }

    // =========================================================================
    // STEP 3: Merge supplementary data into responses JSONB
    // =========================================================================
    
    // The responses field stores the full assessment including supplementary data
    const existingResponses = existingAssessment?.responses || {};
    
    // Prefix supplementary data with 'bm_supp_' to distinguish from original assessment
    const supplementaryResponses: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        supplementaryResponses[`bm_supp_${key}`] = value;
        // Also store without prefix for direct use
        supplementaryResponses[key] = value;
      }
    }

    const mergedResponses = {
      ...existingResponses,
      ...supplementaryResponses,
      _supplementary_collected_at: new Date().toISOString(),
      _supplementary_collected_by: collectedBy || 'admin',
      _supplementary_notes: notes
    };

    // =========================================================================
    // STEP 4: Update assessment responses
    // =========================================================================
    
    if (existingAssessment) {
      const { error: updateError } = await supabase
        .from('bm_assessment_responses')
        .update({
          responses: mergedResponses,
          updated_at: new Date().toISOString()
        })
        .eq('engagement_id', engagementId);

      if (updateError) {
        throw new Error(`Failed to update assessment: ${updateError.message}`);
      }
      
      console.log('[BM Supplementary] Updated existing assessment with supplementary data');
    } else {
      // Create a minimal assessment record with just the supplementary data
      const { error: insertError } = await supabase
        .from('bm_assessment_responses')
        .insert({
          engagement_id: engagementId,
          responses: mergedResponses,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        throw new Error(`Failed to create assessment: ${insertError.message}`);
      }
      
      console.log('[BM Supplementary] Created new assessment record with supplementary data');
    }

    // =========================================================================
    // STEP 5: Log the data collection for audit
    // =========================================================================
    
    await supabase.from('benchmark_search_log').insert({
      industry_code: existingAssessment?.industry_code || 'unknown',
      industry_name: 'Supplementary Data Collection',
      search_provider: 'manual',
      model_used: 'admin-collection',
      search_query: `Collected: ${Object.keys(data).join(', ')}`,
      status: 'success',
      metrics_found: Object.keys(data).length,
      triggered_by: 'manual',
      engagement_id: engagementId,
      completed_at: new Date().toISOString()
    }).catch(err => {
      console.warn('[BM Supplementary] Failed to log collection (non-fatal):', err);
    });

    // =========================================================================
    // STEP 6: Return success with summary
    // =========================================================================
    
    const fieldsCollected = Object.entries(data)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => ({ field: k, value: v }));

    return new Response(
      JSON.stringify({
        success: true,
        engagementId,
        fieldsCollected,
        fieldCount: fieldsCollected.length,
        message: `Successfully saved ${fieldsCollected.length} supplementary data fields`,
        readyForRegeneration: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BM Supplementary] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

