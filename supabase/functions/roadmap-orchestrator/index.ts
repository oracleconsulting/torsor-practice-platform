// ============================================================================
// ROADMAP ORCHESTRATOR
// ============================================================================
// Processes the generation queue and triggers appropriate stage functions
// Called manually when roadmap regeneration is requested
// Processes all queued stages in sequence until complete
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

    const processedStages: string[] = [];
    const maxIterations = 10; // Prevent infinite loops
    let iterations = 0;

    // Process queue items in sequence until queue is empty or dependencies aren't ready
    while (iterations < maxIterations) {
      iterations++;

      // Get next item from queue
      const { data: queueItem, error: queueError } = await supabase
        .from('generation_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('queued_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (queueError) {
        console.error('Error querying queue:', queueError);
        break;
      }

      if (!queueItem) {
        // Queue is empty - log for debugging
        console.log(`[${iterations}] No pending items in queue`);
        break;
      }

      console.log(`[${iterations}] Found queue item: ${queueItem.stage_type} for client ${queueItem.client_id}`);

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

        if (!depStage || (depStage.status !== 'generated' && depStage.status !== 'approved' && depStage.status !== 'published')) {
          // Dependency not ready yet - wait a moment and check again
          console.log(`Dependency ${queueItem.depends_on_stage} not ready for ${queueItem.stage_type}, waiting...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          // Check one more time
          const { data: depStageRetry } = await supabase
            .from('roadmap_stages')
            .select('status')
            .eq('client_id', queueItem.client_id)
            .eq('stage_type', queueItem.depends_on_stage)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (!depStageRetry || (depStageRetry.status !== 'generated' && depStageRetry.status !== 'approved' && depStageRetry.status !== 'published')) {
            // Still not ready, break and let user retry if needed
            console.log(`Dependency still not ready after wait`);
            break;
          }
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
        console.error(`Unknown stage type: ${queueItem.stage_type}`);
        await supabase
          .from('generation_queue')
          .update({ 
            status: 'failed', 
            last_error: `Unknown stage type: ${queueItem.stage_type}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', queueItem.id);
        continue;
      }

      const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`;
      
      console.log(`[${iterations}] Calling ${functionName} for client ${queueItem.client_id}, stage ${queueItem.stage_type}`);
      
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
        const errorText = await response.text();
        console.error(`Function ${functionName} failed (status ${response.status}):`, errorText);
        
        // Try to parse error for better logging
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorText;
        } catch {
          // Not JSON, use as-is
        }
        
        // Mark as failed
        await supabase
          .from('generation_queue')
          .update({ 
            status: 'failed', 
            last_error: errorMessage.substring(0, 500),
            completed_at: new Date().toISOString()
          })
          .eq('id', queueItem.id);
        
        // Continue to next item instead of throwing
        continue;
      }

      // Mark as completed
      await supabase
        .from('generation_queue')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', queueItem.id);

      processedStages.push(queueItem.stage_type);
      console.log(`✓ Completed ${queueItem.stage_type}`);

      // Small delay to allow database triggers to fire and queue next stage
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: processedStages,
      iterations,
      message: processedStages.length > 0 
        ? `Processed ${processedStages.length} stage(s): ${processedStages.join(', ')}`
        : 'No items to process'
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


