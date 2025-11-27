// ============================================================================
// EDGE FUNCTION: Generate Roadmap
// ============================================================================
// Takes Part 2 assessment responses and generates a personalized 13-week roadmap
// Uses Claude Sonnet 4 for best quality/cost balance

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoadmapRequest {
  clientId: string;
  practiceId: string;
  part1Responses: Record<string, unknown>;
  part2Responses: Record<string, unknown>;
}

const ROADMAP_PROMPT = `
You are an expert business strategist creating a personalized 90-day transformation roadmap for a business owner.

## Client Profile
{clientProfile}

## Part 1 Assessment (Life Design)
{part1Responses}

## Part 2 Assessment (Business Deep Dive)
{part2Responses}

## Your Task
Create a comprehensive 13-week roadmap that:

1. **Identifies 3-5 Strategic Priorities** based on their biggest opportunities and pain points
2. **Sequences tasks logically** - dependencies respected, quick wins early
3. **Balances across categories** - Financial, Operations, Team, Marketing, Product, Systems
4. **Matches their capacity** - Consider their available time and resources
5. **Includes measurable milestones** - Clear success criteria for each week

## Constraints
- Maximum 5 tasks per week (3-4 is ideal for most clients)
- Each task should take 1-4 hours to complete
- Critical tasks should be front-loaded
- Include at least one "quick win" in Week 1

## Output Format (JSON)
{
  "summary": {
    "headline": "string (compelling summary of their transformation)",
    "keyInsight": "string (the most important thing you noticed)",
    "expectedOutcome": "string (what success looks like at 90 days)"
  },
  "priorities": [
    {
      "rank": 1,
      "title": "string",
      "description": "string",
      "category": "Financial" | "Operations" | "Team" | "Marketing" | "Product" | "Systems",
      "targetOutcome": "string",
      "weekSpan": [1, 13]
    }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "string (e.g., 'Foundation & Quick Wins')",
      "focus": "string (primary priority for this week)",
      "tasks": [
        {
          "id": "w1-t1",
          "title": "string",
          "description": "string (clear, actionable instructions)",
          "category": "string",
          "priority": "critical" | "high" | "medium",
          "estimatedHours": number,
          "dependsOn": ["task-id"] | null,
          "deliverable": "string (what they should have completed)",
          "resources": ["string"] | null
        }
      ],
      "milestone": "string (what success looks like this week)" | null,
      "advisorCheckpoint": boolean
    }
  ],
  "successMetrics": [
    {
      "metric": "string",
      "baseline": "string (current state)",
      "target": "string (90-day goal)",
      "measurementMethod": "string"
    }
  ]
}
`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { clientId, practiceId, part1Responses, part2Responses } = 
      await req.json() as RoadmapRequest;

    // Validate required fields
    if (!clientId || !practiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt with client data
    const prompt = ROADMAP_PROMPT
      .replace('{clientProfile}', JSON.stringify({ clientId, practiceId }))
      .replace('{part1Responses}', JSON.stringify(part1Responses, null, 2))
      .replace('{part2Responses}', JSON.stringify(part2Responses, null, 2));

    // Call OpenRouter API
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const startTime = Date.now();
    
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co',
        'X-Title': 'Torsor 365 Client Portal'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
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
    
    // Parse the roadmap from the LLM response
    const roadmapContent = llmData.choices[0].message.content;
    const roadmapData = JSON.parse(roadmapContent);
    
    // Calculate cost
    const usage = llmData.usage;
    const cost = ((usage?.prompt_tokens || 0) * 0.000003) + 
                 ((usage?.completion_tokens || 0) * 0.000015);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save the roadmap to database
    const { data: savedRoadmap, error: saveError } = await supabase
      .from('client_roadmaps')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        roadmap_data: roadmapData,
        llm_model_used: 'anthropic/claude-sonnet-4-20250514',
        prompt_version: '1.0.0',
        generation_cost: cost,
        generation_duration_ms: duration,
        is_active: true
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving roadmap:', saveError);
    }

    // Log LLM usage
    await supabase.from('llm_usage_log').insert({
      practice_id: practiceId,
      client_id: clientId,
      task_type: 'roadmap_generation',
      model_used: 'anthropic/claude-sonnet-4-20250514',
      tokens_input: usage?.prompt_tokens || 0,
      tokens_output: usage?.completion_tokens || 0,
      cost_usd: cost,
      duration_ms: duration,
      success: true
    });

    // Create tasks from the roadmap
    if (savedRoadmap && roadmapData.weeks) {
      const tasks = roadmapData.weeks.flatMap((week: any) => 
        week.tasks.map((task: any, index: number) => ({
          practice_id: practiceId,
          client_id: clientId,
          roadmap_id: savedRoadmap.id,
          week_number: week.weekNumber,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          sort_order: index,
          status: 'pending'
        }))
      );

      await supabase.from('client_tasks').insert(tasks);
    }

    return new Response(
      JSON.stringify({
        success: true,
        roadmap: roadmapData,
        roadmapId: savedRoadmap?.id,
        usage: {
          model: 'anthropic/claude-sonnet-4-20250514',
          tokensInput: usage?.prompt_tokens,
          tokensOutput: usage?.completion_tokens,
          cost,
          durationMs: duration
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating roadmap:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

