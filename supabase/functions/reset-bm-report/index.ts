import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { engagement_id } = await req.json();

    if (!engagement_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'engagement_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Reset BM Report] Resetting report for engagement: ${engagement_id}`);

    // Delete the report
    const { error: deleteError, data: deleteData } = await supabaseAdmin
      .from('bm_reports')
      .delete()
      .eq('engagement_id', engagement_id)
      .select();

    if (deleteError) {
      console.error('[Reset BM Report] Delete error:', deleteError);
      // If delete fails, try updating status to null
      const { error: updateError } = await supabaseAdmin
        .from('bm_reports')
        .update({ 
          status: null,
          headline: null,
          executive_summary: null,
        })
        .eq('engagement_id', engagement_id);

      if (updateError) {
        throw new Error(`Failed to delete or update: ${updateError.message}`);
      }
      console.log('[Reset BM Report] Report status cleared via update');
    } else {
      console.log('[Reset BM Report] Report deleted successfully:', deleteData);
    }

    // Reset engagement status
    const { error: engError } = await supabaseAdmin
      .from('bm_engagements')
      .update({ status: 'assessment_complete' })
      .eq('id', engagement_id);

    if (engError) {
      console.warn('[Reset BM Report] Could not reset engagement status:', engError);
    } else {
      console.log('[Reset BM Report] Engagement status reset');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Report reset successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Reset BM Report] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
