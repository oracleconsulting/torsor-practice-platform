// ============================================================================
// EDGE FUNCTION: Fit Assessment
// ============================================================================
// Analyzes Part 1 responses to determine program fit and generate welcome message
// Uses Claude Haiku for speed (simple classification task)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cleanAllStrings } from '../_shared/cleanup.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FitAssessmentRequest {
  clientId: string;
  practiceId: string;
  part1Responses: Record<string, unknown>;
}

const FIT_ASSESSMENT_PROMPT = `
You are evaluating a potential client's fit for the 365 Alignment Programme, a comprehensive business transformation service.

CRITICAL LANGUAGE QUALITY RULES - NEVER USE THESE PATTERNS:
- "Here's the truth:", "Here's what I see:", "Here's what I also see:"
- "In a world where...", "The reality is...", "Let's be clear..."
- "I want to be direct with you" (just be direct, don't announce it)
- "Let me be honest...", "To be frank..."
- "You've done the hard work of [X]" (patronising)
- "It's not about X. It's about Y."
- "That's not a fantasy.", "That's not a dream."
- "At the end of the day", "To be honest", "Moving forward"

Use British English: "organise" not "organize", "analyse" not "analyze", "programme" not "program", "behaviour" not "behavior", "colour" not "color", "favour" not "favor", "centre" not "center", "specialise" not "specialize", "£" not "$".

## Assessment Responses
{part1Responses}

## Your Task
Analyse these responses to determine programme fit.

IMPORTANT: 
- Quote their actual words when describing their situation
- Don't paraphrase into corporate speak
- Be specific about what you observed in their responses

## Fit Criteria
- **Excellent Fit (80-100):** Clear goals, growth mindset, time commitment available, business has potential
- **Good Fit (60-79):** Most criteria met, some areas need attention
- **Moderate Fit (40-59):** Significant gaps, may need pre-programme work
- **Poor Fit (0-39):** Major blockers, not ready for programme

## Output Format (JSON)
{
  "fitScore": number,
  "fitCategory": "excellent" | "good" | "moderate" | "poor",
  "strengths": ["Quote their words or cite specific response - e.g., 'You mentioned wanting to be home for dinner by 6pm'"],
  "challenges": ["Based on their response to X - e.g., 'You said you work 60+ hours which limits capacity'"],
  "recommendedFocus": "One sentence on primary focus area",
  "welcomeMessage": "2-3 sentences. Warm and personal. Reference something SPECIFIC they said. Not generic.",
  "advisorNotes": "Internal notes for the team - concerns, opportunities, suggested approach"
}

CLAIM SOURCES - every factual claim must come from ONE of these:
1. DIRECT QUOTE from their assessment responses (use their exact words in quotes)
2. CALCULATION you can show working for (show the maths)
3. INDUSTRY BENCHMARK you can cite (state the source)
4. PATTERN FROM THEIR DATA (be explicit it's a pattern)

NEVER invent statistics, quotes, or facts. If you don't have data, say "based on typical patterns" not fake specifics.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { clientId, practiceId, part1Responses } = 
      await req.json() as FitAssessmentRequest;

    if (!clientId || !practiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = FIT_ASSESSMENT_PROMPT
      .replace('{part1Responses}', JSON.stringify(part1Responses, null, 2));

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const startTime = Date.now();
    
    // Use Haiku for speed - this is a simple classification task
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co',
        'X-Title': 'Torsor 365 Client Portal'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.3, // Lower temp for more consistent classification (already optimal)
        response_format: { type: 'json_object' },
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      throw new Error(`OpenRouter API error: ${errorText}`);
    }

    const llmData = await llmResponse.json();
    const duration = Date.now() - startTime;
    
    const assessmentContent = llmData.choices[0].message.content;
    const rawFitAssessment = JSON.parse(assessmentContent);
    // Apply cleanup to all string fields
    const fitAssessment = cleanAllStrings(rawFitAssessment);
    
    const usage = llmData.usage;
    const cost = ((usage?.prompt_tokens || 0) * 0.00000025) + 
                 ((usage?.completion_tokens || 0) * 0.00000125);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store fit assessment in roadmap (will be created later with full roadmap)
    // For now, store as a placeholder roadmap record
    const { data: existingRoadmap } = await supabase
      .from('client_roadmaps')
      .select('id')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single();

    if (existingRoadmap) {
      await supabase
        .from('client_roadmaps')
        .update({ fit_assessment: fitAssessment })
        .eq('id', existingRoadmap.id);
    } else {
      await supabase
        .from('client_roadmaps')
        .insert({
          practice_id: practiceId,
          client_id: clientId,
          roadmap_data: {}, // Will be populated when Part 2 is complete
          fit_assessment: fitAssessment,
          llm_model_used: 'anthropic/claude-3-haiku-20240307',
          is_active: true
        });
    }

    // Log LLM usage
    await supabase.from('llm_usage_log').insert({
      practice_id: practiceId,
      client_id: clientId,
      task_type: 'fit_assessment',
      model_used: 'anthropic/claude-3-haiku-20240307',
      tokens_input: usage?.prompt_tokens || 0,
      tokens_output: usage?.completion_tokens || 0,
      cost_usd: cost,
      duration_ms: duration,
      success: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        assessment: fitAssessment,
        usage: {
          model: 'anthropic/claude-3-haiku-20240307',
          tokensInput: usage?.prompt_tokens,
          tokensOutput: usage?.completion_tokens,
          cost,
          durationMs: duration
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating fit assessment:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

