import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Live schema: slug, category, uk_strong, score_ease, score_features, score_integrations, etc.
interface TechProductRow {
  slug: string;
  product_name: string;
  vendor: string;
  category: string;
  market_position: string;
  uk_strong: boolean;
  pricing_model: string;
  price_entry_gbp: number | null;
  price_mid_gbp: number | null;
  price_top_gbp: number | null;
  is_per_user: boolean;
  score_ease: number | null;
  score_features: number | null;
  score_integrations: number | null;
  score_reporting: number | null;
  score_scalability: number | null;
  score_support: number | null;
  score_value: number | null;
  key_strengths: string[] | null;
  key_weaknesses: string[] | null;
  best_for: string | null;
  not_ideal_for: string | null;
  sweet_min_employees: number | null;
  sweet_max_employees: number | null;
  has_zapier: boolean;
  has_make: boolean;
  has_api: boolean;
  [key: string]: unknown;
}

function findProductMatch(productName: string, products: TechProductRow[]): TechProductRow | null {
  const normalised = productName.toLowerCase().trim();
  const slugFromName = normalised.replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');

  // 1. Exact slug match
  const slugMatch = products.find((p) => p.slug === slugFromName || p.slug === normalised.replace(/\s+/g, '_'));
  if (slugMatch) return slugMatch;

  // 2. Exact product_name match (case-insensitive)
  const nameMatch = products.find((p) => p.product_name?.toLowerCase() === normalised);
  if (nameMatch) return nameMatch;

  // 3. Contains match
  const containsMatch = products.find(
    (p) =>
      normalised.includes((p.product_name ?? '').toLowerCase()) ||
      (p.product_name ?? '').toLowerCase().includes(normalised)
  );
  if (containsMatch) return containsMatch;

  // 4. Slug partial match
  const slugPartial = products.find(
    (p) =>
      (p.slug && p.slug.startsWith(slugFromName)) ||
      (slugFromName && p.slug && slugFromName.startsWith(p.slug))
  );
  if (slugPartial) return slugPartial;

  return null;
}

function buildProductPayload(
  p: TechProductRow,
  integrationCount: number,
  middlewareCount: number,
  integrationsList: { product_b_slug: string; product_b_name: string; integration_type: string; quality: string; data_flows: string }[],
  productNameBySlug: Map<string, string>
) {
  return {
    slug: p.slug,
    product_name: p.product_name,
    vendor: p.vendor ?? '',
    category: p.category ?? '',
    market_position: p.market_position ?? '',
    uk_strong: !!p.uk_strong,
    pricing: {
      model: p.pricing_model ?? 'quote_only',
      entry_gbp: p.price_entry_gbp,
      mid_gbp: p.price_mid_gbp,
      top_gbp: p.price_top_gbp,
      is_per_user: !!p.is_per_user,
    },
    scores: {
      ease: p.score_ease ?? 3,
      features: p.score_features ?? 3,
      integrations: p.score_integrations ?? 3,
      reporting: p.score_reporting ?? 3,
      scalability: p.score_scalability ?? 3,
      support: p.score_support ?? 3,
      value: p.score_value ?? 3,
    },
    integration_count: integrationCount,
    middleware_count: middlewareCount,
    key_strengths: p.key_strengths ?? [],
    key_weaknesses: p.key_weaknesses ?? [],
    best_for: p.best_for ?? '',
    sweet_spot: {
      min_employees: p.sweet_min_employees ?? 1,
      max_employees: p.sweet_max_employees ?? 200,
    },
    integrations: integrationsList.map((i) => ({
      product_b_slug: i.product_b_slug,
      product_b_name: productNameBySlug.get(i.product_b_slug) ?? i.product_b_slug,
      integration_type: i.integration_type,
      quality: i.quality,
      data_flows: i.data_flows,
    })),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = (body.action as 'lookup' | 'lookup_batch' | 'discover') || 'lookup';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ---- discover (stub) ----
    if (action === 'discover') {
      return new Response(
        JSON.stringify({
          found: false,
          message: 'Product not in database. Auto-discovery coming soon.',
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // ---- Load all products (live schema: slug, category, ...) ----
    const { data: products, error: productsError } = await supabase
      .from('sa_tech_products')
      .select('*')
      .order('product_name');

    if (productsError || !products?.length) {
      return new Response(
        JSON.stringify({ found: false, product: null, integrations: null, message: 'No products in database' }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const productList = products as TechProductRow[];
    const productNameBySlug = new Map<string, string>();
    productList.forEach((p) => productNameBySlug.set(p.slug, p.product_name ?? p.slug));

    // ---- Load integrations and middleware counts ----
    const { data: integrations } = await supabase.from('sa_tech_integrations').select('product_a_slug, product_b_slug, integration_type, quality, data_flows');
    const integrationsList = (integrations ?? []) as { product_a_slug: string; product_b_slug: string; integration_type: string; quality: string; data_flows: string }[];

    const { data: middlewareRows } = await supabase.from('sa_middleware_capabilities').select('product_slug');
    const middlewareCountBySlug = new Map<string, number>();
    (middlewareRows ?? []).forEach((r: { product_slug: string }) => {
      middlewareCountBySlug.set(r.product_slug, (middlewareCountBySlug.get(r.product_slug) ?? 0) + 1);
    });

    const integrationCountBySlug = new Map<string, number>();
    integrationsList.forEach((i) => {
      integrationCountBySlug.set(i.product_a_slug, (integrationCountBySlug.get(i.product_a_slug) ?? 0) + 1);
      integrationCountBySlug.set(i.product_b_slug, (integrationCountBySlug.get(i.product_b_slug) ?? 0) + 1);
    });

    // ---- lookup_batch ----
    if (action === 'lookup_batch') {
      const productNames = (body.productNames as string[]) ?? [];
      const results: Record<string, { found: boolean; slug: string | null; product_name: string | null; category: string | null; integration_count: number }> = {};
      for (const name of productNames) {
        if (!name || typeof name !== 'string') continue;
        const matched = findProductMatch(name.trim(), productList);
        if (matched) {
          results[name] = {
            found: true,
            slug: matched.slug,
            product_name: matched.product_name,
            category: matched.category,
            integration_count: integrationCountBySlug.get(matched.slug) ?? 0,
          };
        } else {
          results[name] = { found: false, slug: null, product_name: null, category: null, integration_count: 0 };
        }
      }
      return new Response(JSON.stringify({ results }), { status: 200, headers: jsonHeaders });
    }

    // ---- lookup (single) ----
    const productName = (body.productName as string)?.trim();
    if (!productName) {
      return new Response(
        JSON.stringify({ found: false, product: null, integrations: null, message: 'productName is required for lookup' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const matched = findProductMatch(productName, productList);
    if (!matched) {
      return new Response(
        JSON.stringify({
          found: false,
          product: null,
          integrations: null,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const slug = matched.slug;
    const integrationCount = integrationCountBySlug.get(slug) ?? 0;
    const middlewareCount = middlewareCountBySlug.get(slug) ?? 0;

    const integrationsForProduct = integrationsList
      .filter((i) => i.product_a_slug === slug || i.product_b_slug === slug)
      .map((i) => {
        const otherSlug = i.product_a_slug === slug ? i.product_b_slug : i.product_a_slug;
        return {
          product_b_slug: otherSlug,
          product_b_name: productNameBySlug.get(otherSlug) ?? otherSlug,
          integration_type: i.integration_type,
          quality: i.quality,
          data_flows: typeof i.data_flows === 'string' ? i.data_flows : (i.data_flows ?? ''),
        };
      });

    const productPayload = buildProductPayload(
      matched,
      integrationCount,
      middlewareCount,
      integrationsForProduct,
      productNameBySlug
    );

    return new Response(
      JSON.stringify({
        found: true,
        product: productPayload,
        integrations: integrationsForProduct,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (e) {
    console.error('[discover-sa-tech-product]', e);
    return new Response(
      JSON.stringify({ found: false, product: null, integrations: null, message: (e as Error).message }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
