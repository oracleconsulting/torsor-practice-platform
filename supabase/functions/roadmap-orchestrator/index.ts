// ============================================================================
// ROADMAP ORCHESTRATOR
// ============================================================================
// Processes the generation queue and triggers appropriate stage functions
// Called manually when roadmap regeneration is requested
// Processes all queued stages in sequence until complete
//
// ACTIONS:
// - process (default): Process pending queue items
// - resume: Resume from last successful stage for a client
// - retry: Retry a specific failed stage
// - status: Get current pipeline status for a client
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
  'sprint_plan_part1': 'generate-sprint-plan-part1',
  'sprint_plan_part2': 'generate-sprint-plan-part2',
  'value_analysis': 'generate-value-analysis',
};

// Ordered pipeline stages
const STAGE_ORDER = [
  'fit_assessment',
  'five_year_vision', 
  'six_month_shift',
  'sprint_plan_part1',
  'sprint_plan_part2',
  'value_analysis'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse request body for action and parameters
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON - use defaults
    }

    const action = body.action || 'process';
    const clientId = body.clientId;

    // Handle different actions
    if (action === 'status' && clientId) {
      return await handleStatus(supabase, clientId);
    }

    if (action === 'resume' && clientId) {
      return await handleResume(supabase, clientId, body.practiceId);
    }

    if (action === 'retry' && clientId && body.stageType) {
      return await handleRetry(supabase, clientId, body.practiceId, body.stageType);
    }

    // Default: process queue

    const processedStages: string[] = [];
    const maxIterations = 20; // Increased to handle all 5 stages plus retries
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

      // SMART CHECK: See if this stage is already generated (handles timeout recovery)
      const { data: existingStage } = await supabase
        .from('roadmap_stages')
        .select('id, status, version')
        .eq('client_id', queueItem.client_id)
        .eq('stage_type', queueItem.stage_type)
        .in('status', ['generated', 'approved', 'published'])
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingStage) {
        console.log(`✓ Stage ${queueItem.stage_type} already generated (v${existingStage.version}), marking queue as complete`);
        await supabase
          .from('generation_queue')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString() 
          })
          .eq('id', queueItem.id);
        
        processedStages.push(`${queueItem.stage_type} (already done)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
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
      
      // Build request body - value_analysis needs additional params
      const requestBody: Record<string, any> = {
        clientId: queueItem.client_id,
        practiceId: queueItem.practice_id,
      };
      
      // Value analysis requires action and part3Responses
      if (queueItem.stage_type === 'value_analysis') {
        requestBody.action = 'generate-analysis';
        requestBody.part3Responses = {}; // Empty object - will use defaults from assessment data
      }
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

      // Wait longer to allow database triggers to fire and queue next stage
      // Also check if a new item was queued before continuing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // After waiting, check if a new item was queued by the trigger
      // This ensures we process value_analysis even if it was queued after we started
      const { data: newQueueItem } = await supabase
        .from('generation_queue')
        .select('*')
        .eq('status', 'pending')
        .eq('client_id', queueItem.client_id)
        .order('priority', { ascending: false })
        .order('queued_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (newQueueItem) {
        console.log(`New item queued after ${queueItem.stage_type} completed: ${newQueueItem.stage_type}`);
        // Don't increment iterations here - we'll process it in the next loop iteration
      }
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

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Get pipeline status for a client - shows which stages are complete
 */
async function handleStatus(supabase: any, clientId: string) {
  // Get all generated stages for this client
  const { data: stages, error } = await supabase
    .from('roadmap_stages')
    .select('stage_type, status, version, updated_at')
    .eq('client_id', clientId)
    .in('status', ['generated', 'approved', 'published'])
    .order('version', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get unique stages (latest version only)
  const latestStages: Record<string, any> = {};
  for (const stage of stages || []) {
    if (!latestStages[stage.stage_type]) {
      latestStages[stage.stage_type] = stage;
    }
  }

  // Determine pipeline status
  const completedStages = Object.keys(latestStages);
  const nextStage = STAGE_ORDER.find(s => !completedStages.includes(s)) || null;
  const isComplete = completedStages.length === STAGE_ORDER.length;

  // Get pending/processing queue items
  const { data: queueItems } = await supabase
    .from('generation_queue')
    .select('stage_type, status, queued_at')
    .eq('client_id', clientId)
    .in('status', ['pending', 'processing'])
    .order('queued_at', { ascending: false });

  return new Response(JSON.stringify({
    success: true,
    clientId,
    completedStages: Object.entries(latestStages).map(([type, data]: [string, any]) => ({
      stage: type,
      version: data.version,
      status: data.status,
      updatedAt: data.updated_at
    })),
    pendingStages: queueItems || [],
    nextStage,
    isComplete,
    stageOrder: STAGE_ORDER
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Resume pipeline from the last successful stage
 * Cleans up stuck items and queues the next needed stage
 */
async function handleResume(supabase: any, clientId: string, practiceId?: string) {
  console.log(`Resuming pipeline for client ${clientId}`);

  // Get completed stages
  const { data: stages } = await supabase
    .from('roadmap_stages')
    .select('stage_type, status, version, practice_id')
    .eq('client_id', clientId)
    .in('status', ['generated', 'approved', 'published'])
    .order('version', { ascending: false });

  const completedStages = new Set<string>();
  let foundPracticeId = practiceId;
  
  for (const stage of stages || []) {
    if (!completedStages.has(stage.stage_type)) {
      completedStages.add(stage.stage_type);
      if (!foundPracticeId) foundPracticeId = stage.practice_id;
    }
  }

  if (!foundPracticeId) {
    return new Response(JSON.stringify({ 
      error: 'Could not determine practice_id. Please provide it.' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Find next stage to run
  const nextStage = STAGE_ORDER.find(s => !completedStages.has(s));
  
  if (!nextStage) {
    return new Response(JSON.stringify({
      success: true,
      message: 'Pipeline already complete',
      completedStages: Array.from(completedStages)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Clean up any stuck processing/pending items for stages that are already complete
  for (const completed of completedStages) {
    await supabase
      .from('generation_queue')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .eq('stage_type', completed)
      .in('status', ['pending', 'processing']);
  }

  // Check if next stage is already queued
  const { data: existingQueue } = await supabase
    .from('generation_queue')
    .select('id, status')
    .eq('client_id', clientId)
    .eq('stage_type', nextStage)
    .in('status', ['pending', 'processing'])
    .maybeSingle();

  if (existingQueue) {
    // Reset to pending if stuck in processing
    if (existingQueue.status === 'processing') {
      await supabase
        .from('generation_queue')
        .update({ status: 'pending', started_at: null, attempts: 0 })
        .eq('id', existingQueue.id);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `Stage ${nextStage} already queued, reset to pending`,
      nextStage,
      completedStages: Array.from(completedStages)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Queue the next stage
  const prevStageIndex = STAGE_ORDER.indexOf(nextStage) - 1;
  const dependsOn = prevStageIndex >= 0 ? STAGE_ORDER[prevStageIndex] : null;

  const { error: insertError } = await supabase
    .from('generation_queue')
    .insert({
      practice_id: foundPracticeId,
      client_id: clientId,
      stage_type: nextStage,
      depends_on_stage: dependsOn,
      status: 'pending'
    });

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: `Queued ${nextStage} (resuming from ${Array.from(completedStages).pop() || 'start'})`,
    nextStage,
    completedStages: Array.from(completedStages),
    queuedStage: nextStage
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Retry a specific stage (useful for failed stages)
 */
async function handleRetry(supabase: any, clientId: string, practiceId: string, stageType: string) {
  console.log(`Retrying ${stageType} for client ${clientId}`);

  if (!STAGE_FUNCTIONS[stageType]) {
    return new Response(JSON.stringify({ 
      error: `Invalid stage type: ${stageType}` 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get practice_id if not provided
  if (!practiceId) {
    const { data: stage } = await supabase
      .from('roadmap_stages')
      .select('practice_id')
      .eq('client_id', clientId)
      .limit(1)
      .maybeSingle();
    
    practiceId = stage?.practice_id;
  }

  if (!practiceId) {
    return new Response(JSON.stringify({ 
      error: 'Could not determine practice_id' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Mark any existing queue items for this stage as failed
  await supabase
    .from('generation_queue')
    .update({ status: 'failed', last_error: 'Superseded by retry request' })
    .eq('client_id', clientId)
    .eq('stage_type', stageType)
    .in('status', ['pending', 'processing']);

  // Determine dependency
  const stageIndex = STAGE_ORDER.indexOf(stageType);
  const dependsOn = stageIndex > 0 ? STAGE_ORDER[stageIndex - 1] : null;

  // Queue the retry
  const { error: insertError } = await supabase
    .from('generation_queue')
    .insert({
      practice_id: practiceId,
      client_id: clientId,
      stage_type: stageType,
      depends_on_stage: dependsOn,
      status: 'pending',
      priority: 5 // Higher priority for retries
    });

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: `Queued retry for ${stageType}`,
    stageType,
    clientId
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
