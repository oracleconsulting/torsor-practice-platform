// ============================================================================
// MANAGE KPI SELECTIONS
// ============================================================================
// Save, update, and retrieve KPI selections for an engagement
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KPISelectionInput {
  kpi_code: string;
  display_order?: number;
  custom_target?: number | null;
  selection_notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // GET: Retrieve selections for an engagement
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const engagementId = url.searchParams.get('engagementId');

      if (!engagementId) {
        throw new Error('engagementId is required');
      }

      // Get selections with KPI definition details
      const { data: selections, error } = await supabase
        .from('ma_kpi_selections')
        .select(`
          *,
          kpi:ma_kpi_definitions(*)
        `)
        .eq('engagement_id', engagementId)
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch selections: ${error.message}`);
      }

      // Get the engagement tier to check limits
      const { data: engagement } = await supabase
        .from('ma_engagements')
        .select('tier')
        .eq('id', engagementId)
        .single();

      const tierLimits: Record<string, number> = {
        'bronze': 3,
        'silver': 5,
        'gold': 8,
        'platinum': 999
      };
      const maxKPIs = tierLimits[engagement?.tier || 'bronze'] || 3;

      return new Response(
        JSON.stringify({
          success: true,
          selections: selections || [],
          count: selections?.length || 0,
          maxKPIs,
          remainingSlots: maxKPIs - (selections?.length || 0)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // POST: Save or update selections
    if (req.method === 'POST') {
      const { engagementId, selections, userId } = await req.json() as {
        engagementId: string;
        selections: KPISelectionInput[];
        userId?: string;
      };

      if (!engagementId || !selections) {
        throw new Error('engagementId and selections are required');
      }

      // Get engagement to check tier limits
      const { data: engagement } = await supabase
        .from('ma_engagements')
        .select('tier')
        .eq('id', engagementId)
        .single();

      const tierLimits: Record<string, number> = {
        'bronze': 3,
        'silver': 5,
        'gold': 8,
        'platinum': 999
      };
      const maxKPIs = tierLimits[engagement?.tier || 'bronze'] || 3;

      // Validate selection count
      if (selections.length > maxKPIs) {
        throw new Error(`Too many KPIs selected. Maximum for ${engagement?.tier || 'bronze'} tier is ${maxKPIs}`);
      }

      // Get mandatory KPIs
      const { data: mandatoryKpis } = await supabase
        .from('ma_kpi_definitions')
        .select('code')
        .eq('is_mandatory', true);

      const mandatoryCodes = mandatoryKpis?.map(k => k.code) || [];

      // Ensure mandatory KPIs are included
      const selectedCodes = selections.map(s => s.kpi_code);
      const missingMandatory = mandatoryCodes.filter(code => !selectedCodes.includes(code));
      
      if (missingMandatory.length > 0) {
        throw new Error(`Missing mandatory KPIs: ${missingMandatory.join(', ')}`);
      }

      // Delete existing selections (we'll replace them)
      await supabase
        .from('ma_kpi_selections')
        .delete()
        .eq('engagement_id', engagementId);

      // Insert new selections
      const selectionsToInsert = selections.map((sel, index) => ({
        engagement_id: engagementId,
        kpi_code: sel.kpi_code,
        display_order: sel.display_order ?? index + 1,
        custom_target: sel.custom_target,
        selection_notes: sel.selection_notes,
        selected_by: userId,
        is_mandatory: mandatoryCodes.includes(sel.kpi_code)
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('ma_kpi_selections')
        .insert(selectionsToInsert)
        .select();

      if (insertError) {
        throw new Error(`Failed to save selections: ${insertError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Saved ${inserted?.length || 0} KPI selections`,
          selections: inserted,
          count: inserted?.length || 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // DELETE: Remove a specific selection
    if (req.method === 'DELETE') {
      const { engagementId, kpiCode } = await req.json();

      if (!engagementId || !kpiCode) {
        throw new Error('engagementId and kpiCode are required');
      }

      // Check if it's mandatory
      const { data: kpi } = await supabase
        .from('ma_kpi_definitions')
        .select('is_mandatory')
        .eq('code', kpiCode)
        .single();

      if (kpi?.is_mandatory) {
        throw new Error('Cannot remove mandatory KPI');
      }

      const { error } = await supabase
        .from('ma_kpi_selections')
        .delete()
        .eq('engagement_id', engagementId)
        .eq('kpi_code', kpiCode);

      if (error) {
        throw new Error(`Failed to delete selection: ${error.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Removed KPI: ${kpiCode}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error(`Unsupported method: ${req.method}`);
  } catch (error) {
    console.error('[manage-kpi-selections] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

