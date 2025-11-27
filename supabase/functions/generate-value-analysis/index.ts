// ============================================================================
// EDGE FUNCTION: Generate Value Analysis
// ============================================================================
// Takes Part 3 assessment responses and generates hidden value & exit readiness analysis
// Uses Claude Sonnet 4 for accuracy in financial analysis

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValueAnalysisRequest {
  clientId: string;
  practiceId: string;
  part3Responses: Record<string, unknown>;
  roadmapSummary?: string;
}

const VALUE_ANALYSIS_PROMPT = `
You are a business valuation expert analyzing a company's hidden value and exit readiness for the 365 Alignment Program.

## Client Profile
{clientProfile}

## Part 3 Assessment (Hidden Value Audit)
{part3Responses}

## Previous Roadmap Context
{roadmapSummary}

## Your Task
Analyze their responses to identify:

1. **Hidden Assets** - Undervalued or unrecognized value in the business
2. **Value Destroyers** - Risks that could reduce business value
3. **Quick Value Wins** - Immediate actions to increase value
4. **Exit Readiness** - How prepared they are for a future exit (even if not planned)

## Analysis Categories

### Hidden Assets to Look For:
- Intellectual property (processes, systems, brand)
- Customer relationships and lifetime value
- Recurring revenue potential
- Team expertise and institutional knowledge
- Data and analytics capabilities
- Strategic partnerships
- Underutilized assets

### Value Destroyers to Identify:
- Key person dependencies
- Customer concentration
- Undocumented processes
- Technical debt
- Compliance gaps
- Owner involvement requirements

## Output Format (JSON)
{
  "executiveSummary": "string (2-3 paragraphs summarizing findings)",
  
  "exitReadinessScore": {
    "overall": number (0-100),
    "breakdown": {
      "financials": number,
      "operations": number,
      "team": number,
      "documentation": number,
      "customerBase": number,
      "marketPosition": number
    },
    "interpretation": "string"
  },
  
  "hiddenAssets": [
    {
      "asset": "string",
      "currentState": "string",
      "potentialValue": "string (estimated £ range)",
      "unlockStrategy": "string",
      "timeToRealize": "string",
      "priority": "high" | "medium" | "low"
    }
  ],
  
  "valueDestroyers": [
    {
      "risk": "string",
      "currentImpact": "string",
      "potentialImpact": "string",
      "mitigationStrategy": "string",
      "urgency": "critical" | "high" | "medium" | "low"
    }
  ],
  
  "quickWins": [
    {
      "action": "string",
      "valueImpact": "string",
      "effort": "low" | "medium" | "high",
      "timeline": "string"
    }
  ],
  
  "valuationInsights": {
    "estimatedCurrentMultiple": "string (e.g., '2-3x revenue')",
    "potentialMultiple": "string (with improvements)",
    "keyDrivers": ["string"],
    "comparables": "string (industry context)"
  },
  
  "recommendedFocus": {
    "immediate": ["string", "string"],
    "shortTerm": ["string", "string"],
    "longTerm": ["string", "string"]
  }
}
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { clientId, practiceId, part3Responses, roadmapSummary } = 
      await req.json() as ValueAnalysisRequest;

    if (!clientId || !practiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = VALUE_ANALYSIS_PROMPT
      .replace('{clientProfile}', JSON.stringify({ clientId, practiceId }))
      .replace('{part3Responses}', JSON.stringify(part3Responses, null, 2))
      .replace('{roadmapSummary}', roadmapSummary || 'No roadmap generated yet');

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
    
    const analysisContent = llmData.choices[0].message.content;
    const analysisData = JSON.parse(analysisContent);
    
    const usage = llmData.usage;
    const cost = ((usage?.prompt_tokens || 0) * 0.000003) + 
                 ((usage?.completion_tokens || 0) * 0.000015);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update the roadmap with value analysis
    const { error: updateError } = await supabase
      .from('client_roadmaps')
      .update({
        value_analysis: analysisData
      })
      .eq('client_id', clientId)
      .eq('is_active', true);

    if (updateError) {
      console.error('Error updating roadmap with value analysis:', updateError);
    }

    // Log LLM usage
    await supabase.from('llm_usage_log').insert({
      practice_id: practiceId,
      client_id: clientId,
      task_type: 'value_analysis',
      model_used: 'anthropic/claude-sonnet-4-20250514',
      tokens_input: usage?.prompt_tokens || 0,
      tokens_output: usage?.completion_tokens || 0,
      cost_usd: cost,
      duration_ms: duration,
      success: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisData,
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
    console.error('Error generating value analysis:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

