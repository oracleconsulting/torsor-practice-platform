/**
 * AI-assisted bespoke period summary → bi_period_summaries (draft).
 * Clarity tier: rejected (manual only).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const started = Date.now();
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { periodId } = await req.json();
    if (!periodId) throw new Error('periodId required');

    const { data: period, error: pErr } = await supabase
      .from('bi_periods')
      .select('*, engagement:engagement_id(*)')
      .eq('id', periodId)
      .single();
    if (pErr || !period) throw new Error('Period not found');

    const tier = String((period.engagement as { tier?: string })?.tier || 'foresight').toLowerCase();
    if (tier === 'clarity') {
      return new Response(JSON.stringify({ success: false, error: 'AI period summary is disabled for Clarity tier' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: fin } = await supabase.from('bi_financial_data').select('*').eq('period_id', periodId).maybeSingle();

    const { data: priors } = await supabase
      .from('bi_periods')
      .select('id, period_end')
      .eq('engagement_id', period.engagement_id)
      .lt('period_end', period.period_end)
      .order('period_end', { ascending: false })
      .limit(3);

    const priorFinancials: unknown[] = [];
    for (const p of priors ?? []) {
      const { data: fd } = await supabase.from('bi_financial_data').select('*').eq('period_id', p.id).maybeSingle();
      if (fd) priorFinancials.push({ period_end: p.period_end, ...fd });
    }

    const { data: ratioVals } = await supabase.from('bi_ratio_values').select('*').eq('period_id', periodId);
    const { data: varVals } = await supabase.from('bi_variance_values').select('*').eq('period_id', periodId);

    const { data: selRatios } = await supabase
      .from('bi_ratio_selections')
      .select('ratio_code')
      .eq('engagement_id', period.engagement_id);
    const selectedRatioCodes = new Set((selRatios ?? []).map((r: { ratio_code: string }) => r.ratio_code));
    const { data: allRatioDefs } = await supabase.from('bi_ratio_definitions').select('code,name').eq('is_active', true);
    const unselectedRatios = (allRatioDefs ?? []).filter((d: { code: string }) => !selectedRatioCodes.has(d.code)).slice(0, 8);

    const discoveryData = (period.engagement as { discovery_data?: unknown })?.discovery_data ?? {};

    const prompt = `You are writing a monthly MI commentary for a UK SME owner.

Financial snapshot (current period): ${JSON.stringify(fin)}
Prior periods (up to 3): ${JSON.stringify(priorFinancials)}
Ratio values computed: ${JSON.stringify(ratioVals)}
Variance values: ${JSON.stringify(varVals)}
Ratios NOT yet on the client's dashboard (suggest one to track): ${JSON.stringify(unselectedRatios.map((u: { code: string; name: string }) => u.code + ':' + u.name))}
Discovery context: ${JSON.stringify(discoveryData)}

Return ONLY valid JSON:
{
  "headline": "2-3 sentences max",
  "narrative": "4-6 short paragraphs, cite specific numbers",
  "recommendations": [
    { "title": "", "body": "", "priority": "high|medium|low", "rationale": "", "suggested_metric_to_track": "" }
  ]
}
Include 3-6 recommendations; at least one recommendation must suggest tracking a metric from the unselected list with rationale.`;

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    let content = '';
    let modelUsed = '';

    if (anthropicKey) {
      modelUsed = 'claude-sonnet-4-20250514';
      const ar = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelUsed,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!ar.ok) throw new Error(await ar.text());
      const aj = await ar.json();
      content = aj.content?.[0]?.text || '';
    } else if (openRouterKey) {
      modelUsed = 'anthropic/claude-sonnet-4';
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://torsor.io',
          'X-Title': 'Torsor BI Period Summary',
        },
        body: JSON.stringify({
          model: modelUsed,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 4096,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      content = data.choices?.[0]?.message?.content || '';
    } else {
      throw new Error('ANTHROPIC_API_KEY or OPENROUTER_API_KEY required');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Model did not return JSON');
    const parsed = JSON.parse(jsonMatch[0]) as {
      headline: string;
      narrative: string;
      recommendations: Array<Record<string, string>>;
    };

    const generationTimeMs = Date.now() - started;

    const { data: inserted, error: insErr } = await supabase
      .from('bi_period_summaries')
      .upsert(
        {
          period_id: periodId,
          engagement_id: period.engagement_id,
          headline: parsed.headline,
          narrative: parsed.narrative,
          recommendations: parsed.recommendations,
          status: 'draft',
          is_auto_generated: true,
          original_content: parsed as unknown as Record<string, unknown>,
          llm_model: modelUsed,
          llm_tokens_used: null,
          generation_time_ms: generationTimeMs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'period_id' },
      )
      .select('id')
      .single();

    if (insErr) throw new Error(insErr.message);

    return new Response(
      JSON.stringify({ success: true, summaryId: inserted?.id, generationTimeMs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
