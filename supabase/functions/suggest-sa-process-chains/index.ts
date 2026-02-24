import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplateRow {
  id: string;
  chain_code: string;
  chain_name: string;
  description: string;
  trigger_areas: string[] | null;
  process_steps: string[] | null;
  estimated_duration_mins: number;
  display_order: number;
  question_config: unknown;
  industry_tags: string[] | null;
  trigger_keywords: string[] | null;
}

function findIndustryTemplates(
  templates: TemplateRow[],
  clientIndustry: string,
  brokenAreas: string[],
  magicFix: string,
  allStage1Text: string
): { template: TemplateRow; score: number; suggestion_reason: string }[] {
  const searchText = `${clientIndustry} ${(brokenAreas || []).join(' ')} ${magicFix} ${allStage1Text}`.toLowerCase();
  const matches: { template: TemplateRow; score: number; suggestion_reason: string }[] = [];

  for (const template of templates) {
    let score = 0;
    let reason = '';

    const industryMatch = (template.industry_tags || []).some((tag: string) =>
      searchText.includes(tag.toLowerCase())
    );
    if (industryMatch) score += 3;

    const keywordMatches = (template.trigger_keywords || []).filter((kw: string) =>
      searchText.includes(kw.toLowerCase())
    );
    score += keywordMatches.length * 2;

    const triggerAreas = template.trigger_areas || [];
    const areaMatches = triggerAreas.filter((area: string) =>
      (brokenAreas || []).some(
        (ba: string) =>
          ba.toLowerCase().includes(area.toLowerCase()) ||
          area.toLowerCase().includes(ba.toLowerCase())
      )
    );
    score += areaMatches.length * 3;

    if (score >= 3) {
      if (areaMatches.length > 0) {
        reason = `You flagged ${areaMatches.map((a: string) => a.replace(/_/g, ' ')).join(', ')} as a key concern`;
      } else if (keywordMatches.length > 0) {
        reason = `Based on your mention of ${keywordMatches.slice(0, 2).join(' and ')}`;
      } else {
        reason = `Recommended for ${clientIndustry || 'your industry'} businesses`;
      }
      matches.push({ template, score, suggestion_reason: reason });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { engagementId, maxChains = 3, autoAccept = false } = body;
    if (!engagementId) throw new Error('engagementId required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: engagement } = await supabase
      .from('sa_engagements')
      .select('id')
      .eq('id', engagementId)
      .single();
    if (!engagement) throw new Error('Engagement not found');

    const { data: discovery } = await supabase
      .from('sa_discovery_responses')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();
    if (!discovery) throw new Error('No discovery responses found');

    const { count: existingCount } = await supabase
      .from('sa_process_chains')
      .select('id', { count: 'exact', head: true })
      .eq('engagement_id', engagementId)
      .eq('is_core', false);
    const existingCustom = existingCount ?? 0;
    let remainingSlots = Math.max(0, (maxChains || 3) - existingCustom);
    if (remainingSlots <= 0) {
      return new Response(
        JSON.stringify({ success: true, suggestedChains: 0, reason: 'max_reached' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let createdFromTemplates = 0;

    const { data: templates } = await supabase
      .from('sa_process_chains')
      .select('id, chain_code, chain_name, description, trigger_areas, process_steps, estimated_duration_mins, display_order, question_config, industry_tags, trigger_keywords')
      .eq('is_industry_template', true);
    const rawResponses = (discovery as any).raw_responses || {};
    const brokenAreas = (discovery as any).broken_areas || rawResponses.broken_areas || [];
    const magicFix = (discovery as any).magic_process_fix || rawResponses.magic_process_fix || '';
    const clientIndustry = (discovery as any).industry_sector || rawResponses.industry_sector || '';
    const allStage1Text = JSON.stringify(rawResponses) + ' ' + (discovery as any).systems_breaking_point + ' ' + (discovery as any).month_end_shame + ' ' + (discovery as any).expensive_systems_mistake || '';

    if (templates && templates.length > 0) {
      const matched = findIndustryTemplates(
        templates as TemplateRow[],
        clientIndustry,
        Array.isArray(brokenAreas) ? brokenAreas : [],
        magicFix,
        allStage1Text
      );
      const prefix = engagementId.slice(0, 8);
      for (const { template, suggestion_reason } of matched.slice(0, remainingSlots)) {
        const existingChain = await supabase
          .from('sa_process_chains')
          .select('id')
          .eq('engagement_id', engagementId)
          .eq('source_template_id', template.id)
          .maybeSingle();
        if (existingChain?.data) continue;
        const chainCode = `${template.chain_code}_${prefix}`;
        const { error: insertErr } = await supabase.from('sa_process_chains').insert({
          chain_code: chainCode,
          chain_name: template.chain_name,
          description: template.description,
          trigger_areas: template.trigger_areas,
          process_steps: template.process_steps,
          estimated_duration_mins: template.estimated_duration_mins ?? 15,
          display_order: template.display_order ?? 100,
          is_core: false,
          engagement_id: engagementId,
          question_config: template.question_config,
          chain_status: autoAccept ? 'active' : 'suggested',
          suggestion_reason,
          source_template_id: template.id,
        });
        if (!insertErr) createdFromTemplates++;
      }
      remainingSlots -= createdFromTemplates;
    }

    let createdFromAi = 0;
    if (remainingSlots > 0) {
      const { data: systems } = await supabase
        .from('sa_system_inventory')
        .select('system_name, category_code, criticality')
        .eq('engagement_id', engagementId);

      const prompt = `You are helping design a systems audit for a UK SMB. Based on their Stage 1 assessment responses, suggest up to ${remainingSlots} industry-specific process chains that should be investigated IN ADDITION to the 7 core business chains (Quote-to-Cash, Procure-to-Pay, Hire-to-Retire, Record-to-Report, Lead-to-Client, Comply-to-Confirm, Project-to-Delivery).

These custom chains should capture processes that are UNIQUE to this company's industry, size, or operational model. Do NOT suggest chains that duplicate the 7 core chains. Return AT MOST ${remainingSlots} chains.

COMPANY CONTEXT:
Industry: ${(discovery as any).industry_sector || 'Unknown'}
Team size: ${(discovery as any).team_size || 'Unknown'}
Revenue: ${(discovery as any).revenue_band || 'Unknown'}
Work location: ${rawResponses.work_location || 'Unknown'}
What broke: "${(discovery as any).systems_breaking_point || ''}"
Operations self-diagnosis: "${(discovery as any).operations_self_diagnosis || ''}"
Month-end shame: "${(discovery as any).month_end_shame || ''}"
Expensive mistake: "${(discovery as any).expensive_systems_mistake || ''}"
Magic fix: "${magicFix}"
Broken areas: ${JSON.stringify(brokenAreas)}
Software tools: ${JSON.stringify((discovery as any).software_tools_used || rawResponses.current_tech_stack || [])}
Systems in inventory: ${(systems || []).map((s: any) => `${s.system_name} (${s.category_code})`).join(', ') || 'Not yet entered'}

Return ONLY this JSON:
{
  "suggestedChains": [
    {
      "chain_code": "snake_case_unique_code",
      "chain_name": "Human Readable Name (Category)",
      "description": "One sentence: from X to Y",
      "reasoning": "Why this company needs this deep dive",
      "process_steps": ["Step 1", "Step 2", "..."],
      "estimated_duration_mins": 15,
      "sections": [
        {
          "name": "Section Name",
          "questions": [
            {
              "question": "The question text",
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
Return at most ${remainingSlots} chains. If you can't identify any, return { "suggestedChains": [] }. Return ONLY valid JSON.`;

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
      const result = JSON.parse(content || '{"suggestedChains":[]}');
      const aiChains = (result.suggestedChains || []).slice(0, remainingSlots);

      for (const chain of aiChains) {
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
        const { error: upsertErr } = await supabase.from('sa_process_chains').upsert({
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
          chain_status: autoAccept ? 'active' : 'suggested',
          suggestion_reason: chain.reasoning || 'Suggested based on your assessment',
        }, {
          onConflict: 'chain_code,engagement_id',
          ignoreDuplicates: false,
        });
        if (!upsertErr) createdFromAi++;
      }
    }

    const totalCreated = createdFromTemplates + createdFromAi;
    await supabase
      .from('sa_engagements')
      .update({
        auto_suggested_at: new Date().toISOString(),
        chain_suggestions_generated_at: new Date().toISOString(),
      })
      .eq('id', engagementId);

    return new Response(
      JSON.stringify({
        success: true,
        suggestedChains: totalCreated,
        fromTemplates: createdFromTemplates,
        fromAi: createdFromAi,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
