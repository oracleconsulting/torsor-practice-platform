// ============================================================================
// START DISCOVERY REPORT - Async Job Initiator
// ============================================================================
// Creates a report job and triggers async processing
// Returns immediately with job ID for polling
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { clientId, practiceId, discoveryId } = await req.json();

    if (!clientId) {
      throw new Error('clientId is required');
    }

    // Get client info
    const { data: client } = await supabase
      .from('practice_members')
      .select('name, client_company, practice_id')
      .eq('id', clientId)
      .single();

    if (!client) {
      throw new Error('Client not found');
    }

    // Create a job record
    const jobId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('report_jobs')
      .insert({
        id: jobId,
        client_id: clientId,
        practice_id: practiceId || client.practice_id,
        discovery_id: discoveryId,
        job_type: 'discovery_report',
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating job:', insertError);
      throw new Error('Failed to create report job');
    }

    // Trigger the async processor (fire and forget)
    // This calls the heavy function but doesn't wait for it
    const processorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-discovery-report`;
    
    fetch(processorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ jobId })
    }).catch(err => {
      console.log('Async processor triggered (fire and forget):', err?.message || 'sent');
    });

    // Return immediately with job ID
    return new Response(JSON.stringify({
      success: true,
      jobId,
      status: 'processing',
      message: 'Report generation started. Poll for completion.',
      pollUrl: `/functions/v1/get-discovery-report?jobId=${jobId}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error starting report:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

