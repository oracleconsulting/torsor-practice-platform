/**
 * PROMOTE SERVICE LINE
 *
 * Applies an approved service line blueprint to the live system:
 * - services table (global catalogue)
 * - service_pricing + service_pricing_tiers (practice-scoped)
 * - assessment_questions
 * - service_scoring_weights
 *
 * Registry and scorer code updates remain manual (copy from blueprint.implementation).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlueprintIdentity {
  code: string;
  name: string;
  displayName: string;
  category: string;
  description: string;
}

interface BlueprintPricing {
  tiers: Array<{
    name: string;
    tagline: string;
    pricingModel: string;
    price?: number;
    priceRanges?: Array<{ price: number }>;
    period: string;
    priceFormatted?: string;
    priceFromFormatted?: string;
  }>;
  defaultTierIndex: number;
}

interface BlueprintAssessment {
  sections: Array<{
    name: string;
    questions: Array<{
      questionId: string;
      questionText: string;
      questionType: string;
      options?: string[];
      placeholder?: string;
      charLimit?: number;
      isRequired: boolean;
      displayOrder: number;
      aiAnchor: string;
    }>;
  }>;
}

interface BlueprintScoring {
  choiceTriggers: Array<{
    questionId: string;
    responseValue: string;
    points: number;
    triggerDescription: string;
  }>;
}

interface ServiceLineBlueprint {
  identity: BlueprintIdentity;
  pricing: BlueprintPricing;
  assessment: BlueprintAssessment;
  scoring?: BlueprintScoring;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let body: { blueprintId: string; practiceId: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { blueprintId, practiceId } = body;
  if (!blueprintId || !practiceId) {
    return new Response(JSON.stringify({ error: 'blueprintId and practiceId are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: row, error: fetchError } = await supabase
    .from('service_line_blueprints')
    .select('*')
    .eq('id', blueprintId)
    .eq('practice_id', practiceId)
    .single();

  if (fetchError || !row) {
    return new Response(JSON.stringify({ error: 'Blueprint not found or access denied' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (row.status !== 'approved') {
    return new Response(
      JSON.stringify({ error: 'Blueprint must be in approved status to implement' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const blueprint = row.blueprint as ServiceLineBlueprint;
  const code = blueprint.identity?.code;
  if (!code) {
    return new Response(JSON.stringify({ error: 'Blueprint missing identity.code' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const defaultTier = blueprint.pricing?.tiers?.[blueprint.pricing.defaultTierIndex ?? 0];
  const priceAmount = defaultTier?.price ?? defaultTier?.priceRanges?.[0]?.price ?? 0;
  const priceDisplay = defaultTier?.priceFormatted ?? defaultTier?.priceFromFormatted ?? 'TBD';
  const period = defaultTier?.period ?? 'one-off';
  const pricePeriod = period === 'one-off' ? 'one-off' : period;

  // 1. Upsert services (global catalogue - code unique)
  const { error: serviceError } = await supabase.from('services').upsert(
    {
      code,
      name: blueprint.identity.name,
      category: blueprint.identity.category,
      description: blueprint.identity.description || '',
      status: 'active',
      price_amount: priceAmount,
      price_period: pricePeriod,
      price_display: priceDisplay,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'code' }
  );

  if (serviceError) {
    return new Response(
      JSON.stringify({ error: 'Failed to upsert service: ' + serviceError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 2. Upsert service_pricing for this practice
  const { data: pricingRow, error: pricingFetchError } = await supabase
    .from('service_pricing')
    .upsert(
      {
        practice_id: practiceId,
        service_code: code,
        service_name: blueprint.identity.name,
        description: blueprint.identity.description || '',
        category: blueprint.identity.category,
        pricing_model: 'tiered',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'practice_id,service_code' }
    )
    .select('id')
    .single();

  if (pricingFetchError) {
    return new Response(
      JSON.stringify({ error: 'Failed to upsert service_pricing: ' + pricingFetchError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const servicePricingId = pricingRow?.id;

  // 3. Replace service_pricing_tiers (delete existing, insert new)
  if (servicePricingId && blueprint.pricing?.tiers?.length) {
    await supabase.from('service_pricing_tiers').delete().eq('service_pricing_id', servicePricingId);
    for (let i = 0; i < blueprint.pricing.tiers.length; i++) {
      const tier = blueprint.pricing.tiers[i];
      const price = tier.price ?? tier.priceRanges?.[0]?.price ?? 0;
      const freq = tier.period === 'monthly' ? 'monthly' : tier.period === 'annual' ? 'annual' : tier.period === 'quarterly' ? 'quarterly' : 'one_time';
      const tierCode = (tier.name || `tier_${i + 1}`).toLowerCase().replace(/\s+/g, '_');
      await supabase.from('service_pricing_tiers').insert({
        service_pricing_id: servicePricingId,
        tier_name: tier.name,
        tier_code: tierCode,
        price,
        frequency: freq,
        description: tier.tagline || '',
        display_order: i + 1,
        is_active: true,
      });
    }
  }

  // 4. Insert assessment_questions
  let displayOrder = 1;
  for (const section of blueprint.assessment?.sections || []) {
    for (const q of section.questions || []) {
      await supabase.from('assessment_questions').upsert(
        {
          service_line_code: code,
          section: section.name,
          question_id: q.questionId,
          question_text: q.questionText,
          question_type: q.questionType,
          options: q.options?.length ? q.options : null,
          placeholder: q.placeholder || null,
          char_limit: q.charLimit ?? null,
          is_required: q.isRequired ?? true,
          display_order: displayOrder++,
          ai_anchor: q.aiAnchor || null,
          is_active: true,
        },
        { onConflict: 'service_line_code,question_id' }
      );
    }
  }

  // 5. Insert service_scoring_weights (choice triggers only)
  for (const trigger of blueprint.scoring?.choiceTriggers || []) {
    await supabase.from('service_scoring_weights').upsert(
      {
        question_id: trigger.questionId,
        response_value: trigger.responseValue,
        service_code: code,
        weight: trigger.points,
        category: 'service_trigger',
      },
      { onConflict: 'question_id,response_value,service_code' }
    );
  }

  // 6. Update blueprint status
  await supabase
    .from('service_line_blueprints')
    .update({
      status: 'implemented',
      implemented_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', blueprintId);

  // 7. Update source concept if applicable
  if (row.source_concept_id) {
    await supabase
      .from('service_concepts')
      .update({ review_status: 'implemented', updated_at: new Date().toISOString() })
      .eq('id', row.source_concept_id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      serviceCode: code,
      message: `${blueprint.identity.name} is now live. Copy registry and scorer snippets from the blueprint Implementation tab and redeploy edge functions.`,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});