import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { engagementId } = await req.json();
    if (!engagementId) throw new Error('engagementId required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: discovery } = await supabase
      .from('sa_discovery_responses')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();

    if (!discovery) throw new Error('No discovery responses found');

    const { data: systems } = await supabase
      .from('sa_system_inventory')
      .select('system_name, category_code, criticality')
      .eq('engagement_id', engagementId);

    const prompt = `You are helping design a systems audit for a UK SMB. Based on their Stage 1 assessment responses, suggest 2-5 industry-specific process chains that should be investigated IN ADDITION to the 7 core business chains (Quote-to-Cash, Procure-to-Pay, Hire-to-Retire, Record-to-Report, Lead-to-Client, Comply-to-Confirm, Project-to-Delivery).

These custom chains should capture processes that are UNIQUE to this company's industry, size, or operational model. Do NOT suggest chains that duplicate the 7 core chains.

COMPANY CONTEXT:
Industry: ${discovery.industry_sector || 'Unknown'}
Team size: ${discovery.team_size || 'Unknown'}
Revenue: ${discovery.revenue_band || 'Unknown'}
Work location: ${discovery.raw_responses?.work_location || 'Unknown'}
What broke: "${discovery.systems_breaking_point || ''}"
Operations self-diagnosis: "${discovery.operations_self_diagnosis || ''}"
Month-end shame: "${discovery.month_end_shame || ''}"
Expensive mistake: "${discovery.expensive_systems_mistake || ''}"
Magic fix: "${discovery.raw_responses?.magic_process_fix || ''}"
Broken areas: ${JSON.stringify(discovery.broken_areas || discovery.raw_responses?.broken_areas || [])}
Software tools: ${JSON.stringify(discovery.software_tools_used || discovery.raw_responses?.current_tech_stack || [])}
Systems in inventory: ${(systems || []).map((s: any) => `${s.system_name} (${s.category_code})`).join(', ') || 'Not yet entered'}

Return ONLY this JSON:
{
  "suggestedChains": [
    {
      "chain_code": "snake_case_unique_code",
      "chain_name": "Human Readable Name (Category)",
      "description": "One sentence: from X to Y",
      "reasoning": "Why this company needs this deep dive — reference specific things they said or tools they use",
      "process_steps": ["Step 1", "Step 2", "Step 3", "..."],
      "estimated_duration_mins": 15,
      "sections": [
        {
          "name": "Section Name",
          "questions": [
            {
              "question": "The question text — specific to this process, referencing their industry",
              "type": "text|select|number",
              "field": "snake_case_field_name",
              "aiAnchor": true,
              "options": [{"value": "opt1", "label": "Option 1"}]
            }
          ]
        }
      ]
    }
  ]
}

RULES:
- chain_code must be unique, snake_case, descriptive (e.g. "site_delivery", "subcontractor_management", "job_costing")
- Each chain should have 2-3 sections with 3-5 questions each
- Mark 2-3 questions per chain as aiAnchor: true (these become key insights in the report)
- Questions should be specific to the industry, not generic business questions
- Include a mix of text (freeform), select (multiple choice), and number types
- For select questions, provide relevant options with value/label pairs
- If you can't identify any industry-specific processes, return { "suggestedChains": [] }
- Think about what makes THIS business different: field operations, physical logistics, regulated activities, specialist workflows

Return ONLY valid JSON.`;

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    const json = await response.json();
    let content = (json.choices?.[0]?.message?.content ?? '').trim();
    content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
    const result = JSON.parse(content);

    await supabase.from('sa_engagements').update({
      suggested_chains: result,
      chain_suggestions_generated_at: new Date().toISOString(),
    }).eq('id', engagementId);

    for (const chain of (result.suggestedChains || [])) {
      const questionConfig = {
        name: chain.chain_name,
        description: chain.description,
        estimatedMins: chain.estimated_duration_mins || 15,
        sections: (chain.sections || []).map((s: any, sIdx: number) => ({
          name: s.name,
          questions: (s.questions || []).map((q: any, qIdx: number) => ({
            id: `${chain.chain_code}_s${sIdx}_q${qIdx}`,
            question: q.question,
            type: q.type || 'text',
            field: q.field || `${chain.chain_code}_${(s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_')}_q${qIdx}`,
            aiAnchor: q.aiAnchor || false,
            required: false,
            ...(q.options ? { options: q.options } : {}),
            ...(q.placeholder ? { placeholder: q.placeholder } : {}),
          })),
        })),
      };

      await supabase.from('sa_process_chains').upsert({
        chain_code: chain.chain_code,
        chain_name: chain.chain_name,
        description: chain.description,
        process_steps: chain.process_steps || [],
        estimated_duration_mins: chain.estimated_duration_mins || 15,
        display_order: 100,
        is_core: false,
        engagement_id: engagementId,
        source: 'ai_suggested',
        question_config: questionConfig,
        ai_reasoning: chain.reasoning,
        chain_status: 'suggested',
      }, {
        onConflict: 'chain_code,engagement_id',
        ignoreDuplicates: false,
      });
    }

    return new Response(
      JSON.stringify({ success: true, suggestedChains: result.suggestedChains?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
