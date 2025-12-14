// ============================================================================
// ROADMAP ORCHESTRATOR
// ============================================================================
// Polls the generation queue and triggers appropriate stage functions
// Run via pg_cron every 30 seconds or via webhook
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STAGE_FUNCTIONS: Record<string, string> = {
  'fit_assessment': 'generate-fit-profile',
  'five_year_vision': 'generate-five-year-vision',
  'six_month_shift': 'generate-six-month-shift',
  'sprint_plan': 'generate-sprint-plan',
  'value_analysis': 'generate-value-analysis',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get next item from queue
    const { data: queueItem, error: queueError } = await supabase
      .from('generation_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('queued_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (queueError || !queueItem) {
      return new Response(JSON.stringify({ message: 'Queue empty' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check dependency is complete
    if (queueItem.depends_on_stage) {
      const { data: depStage } = await supabase
        .from('roadmap_stages')
        .select('status')
        .eq('client_id', queueItem.client_id)
        .eq('stage_type', queueItem.depends_on_stage)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!depStage || depStage.status !== 'generated' && depStage.status !== 'approved' && depStage.status !== 'published') {
        // Dependency not ready, skip for now
        return new Response(JSON.stringify({ message: 'Waiting on dependency' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Mark as processing
    await supabase
      .from('generation_queue')
      .update({ 
        status: 'processing', 
        started_at: new Date().toISOString(),
        attempts: queueItem.attempts + 1
      })
      .eq('id', queueItem.id);

    // Call the appropriate stage function
    const functionName = STAGE_FUNCTIONS[queueItem.stage_type];
    if (!functionName) {
      throw new Error(`Unknown stage type: ${queueItem.stage_type}`);
    }

    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`;
    
    console.log(`Calling ${functionName} for client ${queueItem.client_id}, stage ${queueItem.stage_type}`);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: queueItem.client_id,
        practiceId: queueItem.practice_id,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Function ${functionName} failed:`, error);
      
      // Mark as failed
      await supabase
        .from('generation_queue')
        .update({ 
          status: 'failed', 
          last_error: error.substring(0, 500),
          completed_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);
      
      throw new Error(`Function ${functionName} failed: ${error}`);
    }

    // Mark as completed
    await supabase
      .from('generation_queue')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', queueItem.id);

    return new Response(JSON.stringify({ 
      success: true, 
      stage: queueItem.stage_type,
      clientId: queueItem.client_id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Orchestrator error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

