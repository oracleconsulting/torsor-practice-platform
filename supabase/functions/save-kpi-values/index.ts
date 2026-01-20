// ============================================================================
// SAVE KPI VALUES
// ============================================================================
// Record monthly KPI values, calculate RAG status and trends
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KPIValueInput {
  kpi_code: string;
  value: number;
  target_value?: number;
  supporting_data?: Record<string, any>;
  human_commentary?: string;
  data_source?: string;
  data_quality?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      engagementId, 
      periodStart, 
      periodEnd, 
      values,
      userId 
    } = await req.json() as {
      engagementId: string;
      periodStart: string;
      periodEnd: string;
      values: KPIValueInput[];
      userId?: string;
    };

    if (!engagementId || !periodEnd || !values || values.length === 0) {
      throw new Error('engagementId, periodEnd, and values are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get KPI definitions for calculations
    const kpiCodes = values.map(v => v.kpi_code);
    const { data: definitions } = await supabase
      .from('ma_kpi_definitions')
      .select('*')
      .in('code', kpiCodes);

    const defMap = new Map(definitions?.map(d => [d.code, d]) || []);

    // Get previous period values for comparison
    const { data: previousValues } = await supabase
      .from('ma_kpi_tracking')
      .select('kpi_code, value, period_end')
      .eq('engagement_id', engagementId)
      .in('kpi_code', kpiCodes)
      .order('period_end', { ascending: false });

    // Group previous values by KPI code
    const previousMap = new Map<string, { value: number; period_end: string }>();
    previousValues?.forEach(pv => {
      if (!previousMap.has(pv.kpi_code)) {
        previousMap.set(pv.kpi_code, { value: pv.value, period_end: pv.period_end });
      }
    });

    // Get same period last year for YoY comparison
    const lastYearDate = new Date(periodEnd);
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
    const lastYearPeriodEnd = lastYearDate.toISOString().split('T')[0];

    const { data: lastYearValues } = await supabase
      .from('ma_kpi_tracking')
      .select('kpi_code, value')
      .eq('engagement_id', engagementId)
      .in('kpi_code', kpiCodes)
      .gte('period_end', lastYearPeriodEnd)
      .lte('period_end', lastYearPeriodEnd);

    const lastYearMap = new Map(lastYearValues?.map(v => [v.kpi_code, v.value]) || []);

    // Calculate RAG status based on KPI definition
    function calculateRAG(
      value: number,
      target: number | null,
      definition: any
    ): 'green' | 'amber' | 'red' | null {
      if (target === null || target === undefined) return null;

      const thresholds = definition?.rag_thresholds || {};
      const amberPct = thresholds.amber_pct ?? 10;
      const redPct = thresholds.red_pct ?? 20;
      const higherIsBetter = definition?.higher_is_better;

      if (higherIsBetter === null) return null;

      if (higherIsBetter) {
        // Higher is better (e.g., profit margin)
        if (value >= target) return 'green';
        if (value >= target * (1 - amberPct / 100)) return 'amber';
        return 'red';
      } else {
        // Lower is better (e.g., debtor days)
        if (value <= target) return 'green';
        if (value <= target * (1 + amberPct / 100)) return 'amber';
        return 'red';
      }
    }

    // Calculate trend based on last 3 values
    async function calculateTrend(
      engagementId: string,
      kpiCode: string,
      currentValue: number,
      definition: any
    ): Promise<'improving' | 'stable' | 'declining' | null> {
      const { data: recentValues } = await supabase
        .from('ma_kpi_tracking')
        .select('value')
        .eq('engagement_id', engagementId)
        .eq('kpi_code', kpiCode)
        .order('period_end', { ascending: false })
        .limit(2);

      if (!recentValues || recentValues.length < 1) return null;

      const values = [currentValue, ...recentValues.map(r => r.value)];
      const avgChange = (values[0] - values[values.length - 1]) / (values.length - 1);
      const higherIsBetter = definition?.higher_is_better;

      // Small changes are stable
      if (Math.abs(avgChange) < 0.5) return 'stable';

      if (higherIsBetter === null) {
        return avgChange > 0 ? 'improving' : 'declining';
      }

      if ((avgChange > 0 && higherIsBetter) || (avgChange < 0 && !higherIsBetter)) {
        return 'improving';
      }
      return 'declining';
    }

    // Generate auto-commentary based on triggers
    function generateAutoCommentary(
      value: number,
      previousValue: number | null,
      target: number | null,
      definition: any
    ): string | null {
      const triggers = definition?.commentary_triggers || [];
      const comments: string[] = [];

      for (const trigger of triggers) {
        const { condition, template } = trigger;
        
        // Simple condition evaluation
        if (condition.includes('value >') && target) {
          const threshold = parseFloat(condition.split('>')[1].trim());
          if (value > threshold) {
            comments.push(
              template
                .replace('{value}', value.toString())
                .replace('{target}', target?.toString() || '')
            );
          }
        }
        
        if (condition.includes('value <') && target) {
          const threshold = parseFloat(condition.split('<')[1].trim());
          if (value < threshold) {
            comments.push(
              template
                .replace('{value}', value.toString())
                .replace('{target}', target?.toString() || '')
            );
          }
        }

        // Change-based triggers
        if (previousValue !== null && condition.includes('change')) {
          const change = value - previousValue;
          const changePct = (change / previousValue) * 100;

          if (condition.includes('change_pct') && condition.includes('<')) {
            const threshold = parseFloat(condition.match(/-?\d+/)?.[0] || '0');
            if (changePct < threshold) {
              comments.push(
                template
                  .replace('{change_pct}', changePct.toFixed(1))
                  .replace('{change}', change.toFixed(1))
              );
            }
          }
        }
      }

      return comments.length > 0 ? comments.join(' ') : null;
    }

    // Process each KPI value
    const records = [];
    for (const input of values) {
      const definition = defMap.get(input.kpi_code);
      const previous = previousMap.get(input.kpi_code);
      const previousYear = lastYearMap.get(input.kpi_code);

      // Calculate changes
      const changeVsPrevious = previous ? input.value - previous.value : null;
      const changeVsPreviousPct = previous && previous.value !== 0 
        ? ((input.value - previous.value) / previous.value) * 100 
        : null;
      const changeVsPreviousYear = previousYear !== undefined 
        ? input.value - previousYear 
        : null;
      const changeVsPreviousYearPct = previousYear !== undefined && previousYear !== 0
        ? ((input.value - previousYear) / previousYear) * 100
        : null;

      // Determine target (custom or default)
      const target = input.target_value ?? definition?.default_target ?? null;

      // Calculate RAG and trend
      const ragStatus = calculateRAG(input.value, target, definition);
      const trend = await calculateTrend(engagementId, input.kpi_code, input.value, definition);

      // Generate auto-commentary
      const autoCommentary = generateAutoCommentary(
        input.value,
        previous?.value ?? null,
        target,
        definition
      );

      records.push({
        engagement_id: engagementId,
        kpi_code: input.kpi_code,
        period_start: periodStart || periodEnd,
        period_end: periodEnd,
        value: input.value,
        previous_value: previous?.value ?? null,
        previous_year_value: previousYear ?? null,
        target_value: target,
        benchmark_value: definition?.industry_benchmarks?.professional_services ?? null,
        rag_status: ragStatus,
        trend,
        change_vs_previous: changeVsPrevious,
        change_vs_previous_pct: changeVsPreviousPct,
        change_vs_previous_year: changeVsPreviousYear,
        change_vs_previous_year_pct: changeVsPreviousYearPct,
        auto_commentary: autoCommentary,
        human_commentary: input.human_commentary,
        supporting_data: input.supporting_data,
        data_source: input.data_source || 'manual',
        data_quality: input.data_quality || 'verified',
        created_by: userId
      });
    }

    // Upsert records (update if exists for same period, insert otherwise)
    const { data: inserted, error: insertError } = await supabase
      .from('ma_kpi_tracking')
      .upsert(records, {
        onConflict: 'engagement_id,kpi_code,period_end'
      })
      .select();

    if (insertError) {
      throw new Error(`Failed to save KPI values: ${insertError.message}`);
    }

    // Summary stats
    const summary = {
      green: records.filter(r => r.rag_status === 'green').length,
      amber: records.filter(r => r.rag_status === 'amber').length,
      red: records.filter(r => r.rag_status === 'red').length,
      improving: records.filter(r => r.trend === 'improving').length,
      declining: records.filter(r => r.trend === 'declining').length
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: `Saved ${inserted?.length || 0} KPI values for period ending ${periodEnd}`,
        values: inserted,
        summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[save-kpi-values] Error:', error);
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

