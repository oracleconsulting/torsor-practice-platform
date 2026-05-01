// ============================================================================
// GET KPI DASHBOARD
// ============================================================================
// Retrieve dashboard data with current values, trends, and history
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
    const engagementId = url.searchParams.get('engagementId');
    const includeHistory = url.searchParams.get('includeHistory') !== 'false';
    const historyMonths = parseInt(url.searchParams.get('historyMonths') || '12');

    if (!engagementId) {
      throw new Error('engagementId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get engagement details
    const { data: engagement } = await supabase
      .from('ma_engagements')
      .select(`
        id,
        tier,
        client:client_id (
          id,
          name,
          client_company
        )
      `)
      .eq('id', engagementId)
      .single();

    if (!engagement) {
      throw new Error('Engagement not found');
    }

    // Get selected KPIs with their definitions
    const { data: selections } = await supabase
      .from('ma_kpi_selections')
      .select(`
        kpi_code,
        display_order,
        custom_target,
        is_mandatory,
        kpi:ma_kpi_definitions (
          code,
          name,
          category,
          description,
          unit,
          decimal_places,
          higher_is_better,
          default_target,
          industry_benchmarks,
          commentary_triggers
        )
      `)
      .eq('engagement_id', engagementId)
      .order('display_order', { ascending: true });

    if (!selections || selections.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          engagement: {
            id: engagement.id,
            tier: engagement.tier,
            clientName: engagement.client?.client_company || engagement.client?.name
          },
          kpis: [],
          summary: { green: 0, amber: 0, red: 0 },
          asOfDate: null,
          message: 'No KPIs selected for this engagement'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const kpiCodes = selections.map(s => s.kpi_code);

    // Get latest values for each KPI
    const { data: latestValues } = await supabase
      .from('ma_kpi_tracking')
      .select('*')
      .eq('engagement_id', engagementId)
      .in('kpi_code', kpiCodes)
      .order('period_end', { ascending: false });

    // Get latest value for each KPI (most recent period_end)
    const latestByKpi = new Map<string, any>();
    latestValues?.forEach(v => {
      if (!latestByKpi.has(v.kpi_code)) {
        latestByKpi.set(v.kpi_code, v);
      }
    });

    // Get history if requested
    let historyByKpi = new Map<string, any[]>();
    if (includeHistory) {
      const historyStartDate = new Date();
      historyStartDate.setMonth(historyStartDate.getMonth() - historyMonths);

      const { data: history } = await supabase
        .from('ma_kpi_tracking')
        .select('kpi_code, period_end, value, target_value, benchmark_value, rag_status')
        .eq('engagement_id', engagementId)
        .in('kpi_code', kpiCodes)
        .gte('period_end', historyStartDate.toISOString().split('T')[0])
        .order('period_end', { ascending: true });

      history?.forEach(h => {
        if (!historyByKpi.has(h.kpi_code)) {
          historyByKpi.set(h.kpi_code, []);
        }
        historyByKpi.get(h.kpi_code)!.push(h);
      });
    }

    // Build dashboard data
    const kpis = selections.map(sel => {
      const def = sel.kpi as any;
      const latest = latestByKpi.get(sel.kpi_code);
      const history = historyByKpi.get(sel.kpi_code) || [];

      return {
        kpi_code: sel.kpi_code,
        kpi_name: def?.name || sel.kpi_code,
        category: def?.category || 'Unknown',
        description: def?.description,
        unit: def?.unit || 'number',
        decimal_places: def?.decimal_places || 2,
        higher_is_better: def?.higher_is_better,
        display_order: sel.display_order,
        is_mandatory: sel.is_mandatory,
        
        // Target (custom or default)
        target_value: sel.custom_target ?? def?.default_target ?? null,
        
        // Current values from latest tracking
        current_value: latest?.value ?? null,
        previous_value: latest?.previous_value ?? null,
        previous_year_value: latest?.previous_year_value ?? null,
        benchmark_value: latest?.benchmark_value ?? def?.industry_benchmarks?.professional_services ?? null,
        
        // Status
        rag_status: latest?.rag_status ?? null,
        trend: latest?.trend ?? null,
        
        // Changes
        change_vs_previous: latest?.change_vs_previous ?? null,
        change_vs_previous_pct: latest?.change_vs_previous_pct ?? null,
        change_vs_previous_year: latest?.change_vs_previous_year ?? null,
        change_vs_previous_year_pct: latest?.change_vs_previous_year_pct ?? null,
        
        // Commentary
        auto_commentary: latest?.auto_commentary ?? null,
        human_commentary: latest?.human_commentary ?? null,
        
        // Period info
        as_of_date: latest?.period_end ?? null,
        
        // History for charts
        history: includeHistory ? history : undefined,
        
        // Benchmarks
        industry_benchmarks: def?.industry_benchmarks || {}
      };
    });

    // Calculate summary
    const summary = {
      green: kpis.filter(k => k.rag_status === 'green').length,
      amber: kpis.filter(k => k.rag_status === 'amber').length,
      red: kpis.filter(k => k.rag_status === 'red').length,
      no_data: kpis.filter(k => k.current_value === null).length,
      improving: kpis.filter(k => k.trend === 'improving').length,
      declining: kpis.filter(k => k.trend === 'declining').length,
      total: kpis.length
    };

    // Get the most recent as-of date
    const asOfDate = kpis
      .map(k => k.as_of_date)
      .filter(d => d)
      .sort()
      .reverse()[0] || null;

    return new Response(
      JSON.stringify({
        success: true,
        engagement: {
          id: engagement.id,
          tier: engagement.tier,
          clientName: engagement.client?.client_company || engagement.client?.name
        },
        kpis,
        summary,
        asOfDate
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[get-kpi-dashboard] Error:', error);
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

