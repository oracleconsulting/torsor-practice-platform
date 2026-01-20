// ============================================================================
// GET KPI DEFINITIONS
// ============================================================================
// Fetch available KPI definitions, optionally filtered by category or tier
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const tier = url.searchParams.get('tier');
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabase
      .from('ma_kpi_definitions')
      .select('*')
      .order('display_order', { ascending: true });

    // Filter by active status
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data: kpis, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch KPI definitions: ${error.message}`);
    }

    // Get tier limit if tier provided
    let tierLimit = 999;
    if (tier) {
      const tierLimits: Record<string, number> = {
        'bronze': 3,
        'silver': 5,
        'gold': 8,
        'platinum': 999
      };
      tierLimit = tierLimits[tier] || 999;
    }

    // Group by category for easier frontend consumption
    const categories: Record<string, any[]> = {};
    const categoryOrder = [
      'Cash & Working Capital',
      'Revenue & Growth',
      'Profitability',
      'Utilisation & Efficiency',
      'Client Health'
    ];

    kpis?.forEach(kpi => {
      if (!categories[kpi.category]) {
        categories[kpi.category] = [];
      }
      categories[kpi.category].push(kpi);
    });

    // Sort categories by predefined order
    const sortedCategories = categoryOrder
      .filter(cat => categories[cat])
      .map(cat => ({
        name: cat,
        kpis: categories[cat]
      }));

    return new Response(
      JSON.stringify({
        success: true,
        kpis: kpis || [],
        categories: sortedCategories,
        tierLimit,
        totalCount: kpis?.length || 0,
        mandatoryKpis: kpis?.filter(k => k.is_mandatory) || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[get-kpi-definitions] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

