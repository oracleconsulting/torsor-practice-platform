import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

const PRODUCT_ALIASES: Record<string, string> = {
  'receipt bank': 'dext',
  'integromat': 'make',
  'sendinblue': 'brevo',
  'gsuite': 'google_workspace',
  'g suite': 'google_workspace',
  'google apps': 'google_workspace',
  'ms teams': 'microsoft_teams',
  'office 365': 'microsoft_teams',
  'o365': 'microsoft_teams',
  'qbo': 'quickbooks',
  'quickbooks online': 'quickbooks',
  'qb online': 'quickbooks',
  'hubspot': 'hubspot_crm',
  'monday': 'monday',
  'monday.com': 'monday',
  'toggl track': 'toggl',
  'clockify.me': 'clockify',
  'charlie': 'charlie_hr',
  'breathe': 'breathehr',
  'breathe hr': 'breathehr',
  'float app': 'float_cashflow',
  'float.com': 'float_resource',
  'n8n.io': 'n8n',
  'pandadoc': 'pandadoc',
  'panda doc': 'pandadoc',
  'productive': 'productive_io',
  'teamwork projects': 'teamwork',
  'teamwork.com': 'teamwork',
  'sage': 'sage_50',
  'sage 50': 'sage_50',
  'sage accounts': 'sage_50',
  'free agent': 'freeagent',
  'go cardless': 'gocardless',
  'click up': 'clickup',
  'base camp': 'basecamp',
  'hub spot': 'hubspot_crm',
  'pipe drive': 'pipedrive',
  'mail chimp': 'mailchimp',
};

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function extractJson(text: string): string {
  let s = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/g, '').trim();
  const first = s.indexOf('{');
  if (first >= 0) s = s.slice(first);
  let depth = 0;
  let end = -1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') depth++;
    if (s[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  return end > 0 ? s.slice(0, end) : s;
}

async function fuzzyMatch(
  supabase: any,
  productNameRaw: string
): Promise<{ product: any; confidence: 'high' | 'medium' | 'low' } | null> {
  const slug = toSlug(productNameRaw);
  const nameLower = productNameRaw.toLowerCase().trim();

  const aliasSlug = PRODUCT_ALIASES[nameLower];
  if (aliasSlug) {
    const { data: byAlias } = await supabase
      .from('sa_tech_products')
      .select('*')
      .eq('product_slug', aliasSlug)
      .eq('is_active', true)
      .maybeSingle();
    if (byAlias) return { product: byAlias, confidence: 'high' };
  }

  const { data: exactSlug } = await supabase
    .from('sa_tech_products')
    .select('*')
    .eq('product_slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (exactSlug) return { product: exactSlug, confidence: 'high' };

  const { data: exactName } = await supabase
    .from('sa_tech_products')
    .select('*')
    .eq('is_active', true)
    .ilike('product_name', productNameRaw)
    .maybeSingle();
  if (exactName) return { product: exactName, confidence: 'high' };

  const { data: partialList } = await supabase
    .from('sa_tech_products')
    .select('*')
    .eq('is_active', true)
    .limit(50);
  const partial = partialList?.find((p: any) =>
    (p.product_name || '').toLowerCase().includes(nameLower) ||
    nameLower.includes((p.product_name || '').toLowerCase())
  );
  if (partial) return { product: partial, confidence: 'medium' };

  const { data: reverse } = await supabase
    .from('sa_tech_products')
    .select('*')
    .eq('is_active', true)
    .limit(50);
  if (reverse?.length) {
    const found = reverse.find((p: any) =>
      nameLower.includes(p.product_name?.toLowerCase() || '') ||
      (p.product_name?.toLowerCase() || '').includes(nameLower)
    );
    if (found) return { product: found, confidence: 'low' };
  }

  return null;
}

async function anthropicMessage(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${err}`);
  }
  const data = await res.json();
  const block = data.content?.find((c: any) => c.type === 'text');
  return block?.text?.trim() || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const product_name_raw = body.product_name_raw as string;
    const category_code = body.category_code as string | undefined;
    const engagement_id = body.engagement_id as string | undefined;
    const mode = (body.mode as 'match_only' | 'full_research') || 'match_only';

    if (!product_name_raw?.trim()) {
      return new Response(
        JSON.stringify({ status: 'error', confidence: 'low', is_new: false, message: 'product_name_raw is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const match = await fuzzyMatch(supabase, product_name_raw.trim());
    if (match) {
      await supabase.from('sa_auto_discovery_log').insert({
        product_name_raw: product_name_raw.trim(),
        matched_product_slug: match.product.product_slug,
        engagement_id: engagement_id || null,
        category_code: category_code || null,
        status: 'matched_existing',
        processed_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          status: 'matched',
          product_slug: match.product.product_slug,
          product_name: match.product.product_name,
          confidence: match.confidence,
          is_new: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mode === 'match_only') {
      return new Response(
        JSON.stringify({
          status: 'not_found',
          confidence: 'low',
          is_new: false,
          message: 'No matching product in database',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ status: 'error', confidence: 'low', is_new: false, message: 'ANTHROPIC_API_KEY not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: logRow, error: logErr } = await supabase
      .from('sa_auto_discovery_log')
      .insert({
        product_name_raw: product_name_raw.trim(),
        engagement_id: engagement_id || null,
        category_code: category_code || null,
        status: 'researching',
      })
      .select('id')
      .single();

    if (logErr || !logRow?.id) {
      console.error('[discover-sa-tech-product] Log insert failed:', logErr);
    }

    const productName = product_name_raw.trim();
    const researchPrompts = [
      `${productName} pricing UK 2026 per user month`,
      `${productName} software features review 2025`,
      `${productName} Zapier integration triggers actions`,
      `${productName} Make integromat integration modules`,
      `${productName} API documentation REST webhooks`,
    ];

    let researchText = '';
    for (let i = 0; i < researchPrompts.length; i++) {
      try {
        const snippet = await anthropicMessage(
          apiKey,
          'You are a research assistant. Reply with a concise summary (max 350 words). Use only facts; if you do not know, say so briefly.',
          `Research the following and summarize: ${researchPrompts[i]}`
        );
        researchText += `\n\n--- Research ${i + 1} ---\n${snippet}`;
      } catch (e) {
        console.warn(`[discover-sa-tech-product] Research ${i + 1} failed:`, e);
        researchText += `\n\n--- Research ${i + 1} ---\n[Error: ${(e as Error).message}]`;
      }
    }

    const systemPrompt = `You are analysing a software product for a tech stack intelligence database.
Based on the research data, extract structured product information.
Return ONLY valid JSON — no markdown, no explanation, no backticks.

Product name as entered: ${product_name_raw}
Category hint: ${category_code || 'unknown'}

Return this exact JSON structure:
{
  "product_name": "Official product name",
  "vendor": "Company name",
  "product_slug": "lowercase_underscored_no_spaces",
  "website_url": "https://...",
  "primary_category": "one of: accounting_software, invoicing_billing, expense_management, payment_collection, bank_feeds, financial_reporting, budgeting_forecasting, crm_platform, proposals_quotes, e_signatures, core_hris, payroll, time_attendance, time_tracking, project_management, resource_planning, task_management, document_management, workflow_automation, email, chat_messaging, video_conferencing, email_marketing, marketing_automation, social_media, website_cms, analytics, psa, booking_scheduling, pos, ecommerce, other",
  "additional_categories": [],
  "can_replace": [],
  "market_position": "market_leader|established|challenger|specialist|emerging",
  "sweet_spot_min_employees": 1,
  "sweet_spot_max_employees": 200,
  "uk_market_strong": true,
  "pricing_model": "per_user|flat|tiered|usage_based|freemium|free|quote_only",
  "has_free_tier": false,
  "free_tier_limits": null,
  "price_entry_gbp": null,
  "price_mid_gbp": null,
  "price_top_gbp": null,
  "price_per_user": true,
  "pricing_notes": "Detailed pricing breakdown",
  "score_ease_of_use": 3,
  "score_feature_depth": 3,
  "score_integration_ecosystem": 3,
  "score_reporting": 3,
  "score_scalability": 3,
  "score_support": 3,
  "score_value_for_money": 3,
  "key_strengths": [],
  "key_weaknesses": [],
  "best_for": [],
  "not_ideal_for": [],
  "has_zapier": false,
  "zapier_triggers": [],
  "zapier_actions": [],
  "has_make": false,
  "make_triggers": [],
  "make_actions": [],
  "has_native_api": false,
  "has_webhooks": false,
  "api_quality": "unknown",
  "migration_complexity_from": "medium",
  "typical_setup_hours": 4.0,
  "known_native_integrations": [],
  "confidence": "high|medium|low"
}

Rules:
- All prices in GBP monthly ex-VAT. Convert USD at 0.82 if needed.
- Scores 1-5 where 3 is average. Be conservative.
- product_slug: lowercase, alphanumeric + underscores only
- If pricing not found publicly, set prices to null and pricing_model to "quote_only"
- known_native_integrations: array of objects with product_slug, quality, data_flows, bidirectional for products from our list (xero, quickbooks, sage_50, freeagent, etc.)`;

    let analysisText = '';
    try {
      analysisText = await anthropicMessage(
        apiKey,
        systemPrompt,
        `Research data for "${productName}":\n${researchText}\n\nExtract the JSON product record as specified.`,
        4096
      );
    } catch (e) {
      console.error('[discover-sa-tech-product] Analysis call failed:', e);
      if (logRow?.id) {
        await supabase.from('sa_auto_discovery_log').update({ status: 'pending' }).eq('id', logRow.id);
      }
      return new Response(
        JSON.stringify({
          status: 'error',
          confidence: 'low',
          is_new: false,
          message: (e as Error).message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsed: any;
    try {
      const jsonStr = extractJson(analysisText);
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[discover-sa-tech-product] JSON parse failed:', parseErr);
      if (logRow?.id) {
        await supabase.from('sa_auto_discovery_log').update({
          status: 'pending',
          research_data: { raw: analysisText?.slice(0, 2000), parseError: String(parseErr) },
        }).eq('id', logRow.id);
      }
      return new Response(
        JSON.stringify({
          status: 'error',
          confidence: 'low',
          is_new: false,
          message: 'Failed to parse AI response as JSON',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const slug = (parsed.product_slug || toSlug(parsed.product_name || productName)).replace(/[^a-z0-9_]/g, '_').replace(/^_|_$/g, '') || toSlug(productName);

    const productPayload = {
      product_name: parsed.product_name || productName,
      vendor: parsed.vendor || '',
      product_slug: slug,
      website_url: parsed.website_url || null,
      primary_category: parsed.primary_category || 'other',
      additional_categories: Array.isArray(parsed.additional_categories) ? parsed.additional_categories : [],
      can_replace: Array.isArray(parsed.can_replace) ? parsed.can_replace : [],
      market_position: parsed.market_position || 'established',
      sweet_spot_min_employees: Number(parsed.sweet_spot_min_employees) || 1,
      sweet_spot_max_employees: Number(parsed.sweet_spot_max_employees) || 200,
      uk_market_strong: Boolean(parsed.uk_market_strong),
      pricing_model: parsed.pricing_model || 'quote_only',
      has_free_tier: Boolean(parsed.has_free_tier),
      free_tier_limits: parsed.free_tier_limits ?? null,
      price_entry_gbp: parsed.price_entry_gbp != null ? Number(parsed.price_entry_gbp) : null,
      price_mid_gbp: parsed.price_mid_gbp != null ? Number(parsed.price_mid_gbp) : null,
      price_top_gbp: parsed.price_top_gbp != null ? Number(parsed.price_top_gbp) : null,
      price_per_user: Boolean(parsed.price_per_user !== false),
      pricing_notes: parsed.pricing_notes ?? null,
      score_ease_of_use: Math.min(5, Math.max(1, Number(parsed.score_ease_of_use) || 3)),
      score_feature_depth: Math.min(5, Math.max(1, Number(parsed.score_feature_depth) || 3)),
      score_integration_ecosystem: Math.min(5, Math.max(1, Number(parsed.score_integration_ecosystem) || 3)),
      score_reporting: Math.min(5, Math.max(1, Number(parsed.score_reporting) || 3)),
      score_scalability: Math.min(5, Math.max(1, Number(parsed.score_scalability) || 3)),
      score_support: Math.min(5, Math.max(1, Number(parsed.score_support) || 3)),
      score_value_for_money: Math.min(5, Math.max(1, Number(parsed.score_value_for_money) || 3)),
      key_strengths: Array.isArray(parsed.key_strengths) ? parsed.key_strengths : [],
      key_weaknesses: Array.isArray(parsed.key_weaknesses) ? parsed.key_weaknesses : [],
      best_for: Array.isArray(parsed.best_for) ? parsed.best_for : [],
      not_ideal_for: Array.isArray(parsed.not_ideal_for) ? parsed.not_ideal_for : [],
      migration_complexity_from: parsed.migration_complexity_from || 'medium',
      typical_setup_hours: parsed.typical_setup_hours != null ? Number(parsed.typical_setup_hours) : null,
      has_zapier: Boolean(parsed.has_zapier),
      has_make: Boolean(parsed.has_make),
      has_native_api: Boolean(parsed.has_native_api),
      has_webhooks: Boolean(parsed.has_webhooks),
      api_quality: parsed.api_quality || 'unknown',
      data_source: 'auto_discovered',
      review_confidence: parsed.confidence || 'medium',
    };

    let productId: string;
    const { data: inserted, error: insertErr } = await supabase
      .from('sa_tech_products')
      .insert(productPayload)
      .select('id')
      .single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        const { data: existing } = await supabase
          .from('sa_tech_products')
          .select('id, product_slug, product_name')
          .eq('product_slug', slug)
          .single();
        if (existing) {
          if (logRow?.id) {
            await supabase.from('sa_auto_discovery_log').update({
              status: 'matched_existing',
              matched_product_slug: existing.product_slug,
              processed_at: new Date().toISOString(),
            }).eq('id', logRow.id);
          }
          return new Response(
            JSON.stringify({
              status: 'matched',
              product_slug: existing.product_slug,
              product_name: existing.product_name,
              confidence: 'high',
              is_new: false,
              message: 'Product already existed (duplicate slug)',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      throw insertErr;
    }
    productId = inserted.id;

    if (parsed.has_zapier && (parsed.zapier_triggers?.length || parsed.zapier_actions?.length)) {
      await supabase.from('sa_middleware_capabilities').upsert({
        product_slug: slug,
        platform: 'zapier',
        triggers: parsed.zapier_triggers || [],
        actions: parsed.zapier_actions || [],
        reliability: 'good',
      }, { onConflict: 'product_slug,platform' });
    }
    if (parsed.has_make && (parsed.make_triggers?.length || parsed.make_actions?.length)) {
      await supabase.from('sa_middleware_capabilities').upsert({
        product_slug: slug,
        platform: 'make',
        triggers: parsed.make_triggers || [],
        actions: parsed.make_actions || [],
        reliability: 'good',
      }, { onConflict: 'product_slug,platform' });
    }

    const knownNative = Array.isArray(parsed.known_native_integrations) ? parsed.known_native_integrations : [];
    for (const n of knownNative) {
      const otherSlug = n.product_slug || n.slug;
      if (!otherSlug) continue;
      const { data: other } = await supabase.from('sa_tech_products').select('product_slug').eq('product_slug', otherSlug).maybeSingle();
      if (!other) continue;
      const a = slug < otherSlug ? slug : otherSlug;
      const b = slug < otherSlug ? otherSlug : slug;
      await supabase.from('sa_tech_integrations').upsert({
        product_a_slug: a,
        product_b_slug: b,
        integration_type: 'native',
        integration_quality: n.quality || 'basic',
        data_flows: Array.isArray(n.data_flows) ? n.data_flows : [],
        bidirectional: Boolean(n.bidirectional),
        setup_complexity: 'configuration_needed',
        monthly_cost_gbp: 0,
        known_limitations: [],
        known_issues: [],
      }, { onConflict: 'product_a_slug,product_b_slug' });
    }

    const { data: zapierProducts } = await supabase
      .from('sa_middleware_capabilities')
      .select('product_slug, triggers, actions')
      .eq('platform', 'zapier');
    const newTriggers = (parsed.zapier_triggers || []).length;
    const newActions = (parsed.zapier_actions || []).length;
    for (const row of zapierProducts || []) {
      if (row.product_slug === slug) continue;
      const hasBridge =
        (newTriggers > 0 && (row.actions || []).length > 0) ||
        (newActions > 0 && (row.triggers || []).length > 0);
      if (!hasBridge) continue;
      const a = slug < row.product_slug ? slug : row.product_slug;
      const b = slug < row.product_slug ? row.product_slug : slug;
      await supabase.from('sa_tech_integrations').upsert({
        product_a_slug: a,
        product_b_slug: b,
        integration_type: 'zapier',
        integration_quality: 'basic',
        bidirectional: false,
        data_flows: [],
        setup_complexity: 'configuration_needed',
        monthly_cost_gbp: 0,
        known_limitations: ['Auto-inferred — not tested'],
        known_issues: [],
      }, { onConflict: 'product_a_slug,product_b_slug' });
    }

    if (logRow?.id) {
      await supabase.from('sa_auto_discovery_log').update({
        status: 'added',
        research_data: parsed,
        added_product_id: productId,
        processed_at: new Date().toISOString(),
      }).eq('id', logRow.id);
    }

    return new Response(
      JSON.stringify({
        status: 'discovered',
        product_slug: slug,
        product_name: productPayload.product_name,
        confidence: (productPayload.review_confidence as 'high' | 'medium' | 'low') || 'medium',
        is_new: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[discover-sa-tech-product]', err);
    return new Response(
      JSON.stringify({
        status: 'error',
        confidence: 'low',
        is_new: false,
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
