import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL or SERVICE_ROLE_KEY not configured');
    }

    const narrativeUrl = `${supabaseUrl}/functions/v1/generate-bm-report-pass2-narrative`;
    console.log(`[BM Pass 2 Shim] Forwarding to narrative function: ${narrativeUrl}`);

    fetch(narrativeUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(err => {
      console.error('[BM Pass 2 Shim] Narrative fire-and-forget rejected:', err);
    });

    console.log('[BM Pass 2 Shim] Narrative triggered. Caller may disconnect.');

    return new Response(
      JSON.stringify({ success: true, forwarded_to: 'generate-bm-report-pass2-narrative', engagementId: body?.engagementId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[BM Pass 2 Shim] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
