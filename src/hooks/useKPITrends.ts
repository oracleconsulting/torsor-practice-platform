/**
 * Hook for fetching KPI trend data across periods
 * Provides historical KPI values for trend analysis
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface KPIDataPoint {
  period_id: string;
  period_label: string;
  period_end_date: string;
  value: number;
  target?: number;
  rag_status?: 'red' | 'amber' | 'green';
}

export interface KPITrend {
  kpi_code: string;
  kpi_name: string;
  unit: string;
  format: 'currency' | 'percentage' | 'number' | 'days';
  data_points: KPIDataPoint[];
  current_value: number;
  previous_value?: number;
  change_pct?: number;
  trend_direction: 'up' | 'down' | 'flat';
  is_improvement: boolean;
}

export interface KPITrendsResult {
  trends: KPITrend[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateTrend(current: number, previous: number | undefined, higherIsBetter: boolean): {
  change_pct: number | undefined;
  trend_direction: 'up' | 'down' | 'flat';
  is_improvement: boolean;
} {
  if (previous === undefined || previous === 0) {
    return { change_pct: undefined, trend_direction: 'flat', is_improvement: false };
  }
  
  const change_pct = ((current - previous) / Math.abs(previous)) * 100;
  const trend_direction = change_pct > 2 ? 'up' : change_pct < -2 ? 'down' : 'flat';
  const is_improvement = higherIsBetter ? change_pct > 0 : change_pct < 0;
  
  return { change_pct, trend_direction, is_improvement };
}

// KPIs where higher is better
const HIGHER_IS_BETTER = new Set([
  'gross_margin', 'net_margin', 'revenue_growth', 'cash_runway',
  'current_ratio', 'quick_ratio', 'true_cash', 'revenue_per_fte'
]);

// ============================================================================
// HOOK
// ============================================================================

export function useKPITrends(
  engagementId: string | null | undefined,
  options: { 
    periodsBack?: number;
    kpiCodes?: string[];
  } = {}
): KPITrendsResult {
  const { periodsBack = 6, kpiCodes } = options;
  
  const [trends, setTrends] = useState<KPITrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchTrends = useCallback(async () => {
    if (!engagementId) {
      setTrends([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Get recent periods for this engagement
      const { data: periods, error: periodsError } = await supabase
        .from('bi_periods')
        .select('id, period_label, period_end_date')
        .eq('engagement_id', engagementId)
        .order('period_end_date', { ascending: false })
        .limit(periodsBack);
      
      if (periodsError) throw periodsError;
      if (!periods || periods.length === 0) {
        setTrends([]);
        return;
      }
      
      const periodIds = periods.map(p => p.id);
      
      // 2. Get KPI values for these periods
      let query = supabase
        .from('bi_kpi_values')
        .select(`
          id,
          period_id,
          kpi_code,
          value,
          target_value,
          rag_status
        `)
        .in('period_id', periodIds);
      
      if (kpiCodes && kpiCodes.length > 0) {
        query = query.in('kpi_code', kpiCodes);
      }
      
      const { data: kpiValues, error: kpiError } = await query;
      if (kpiError) throw kpiError;
      
      // 3. Get KPI definitions for names and formatting
      const uniqueKpiCodes = [...new Set(kpiValues?.map(k => k.kpi_code) || [])];
      const { data: kpiDefs } = await supabase
        .from('bi_kpi_definitions')
        .select('code, name, unit, format')
        .in('code', uniqueKpiCodes);
      
      const kpiDefMap = new Map(kpiDefs?.map(d => [d.code, d]) || []);
      
      // 4. Build period lookup
      const periodMap = new Map(periods.map(p => [p.id, p]));
      
      // 5. Group values by KPI code
      const kpiGroups = new Map<string, KPIDataPoint[]>();
      
      for (const kv of kpiValues || []) {
        const period = periodMap.get(kv.period_id);
        if (!period) continue;
        
        if (!kpiGroups.has(kv.kpi_code)) {
          kpiGroups.set(kv.kpi_code, []);
        }
        
        kpiGroups.get(kv.kpi_code)!.push({
          period_id: kv.period_id,
          period_label: period.period_label,
          period_end_date: period.period_end_date,
          value: kv.value,
          target: kv.target_value,
          rag_status: kv.rag_status
        });
      }
      
      // 6. Build trend objects
      const trendResults: KPITrend[] = [];
      
      for (const [kpiCode, dataPoints] of kpiGroups) {
        // Sort by date ascending for trend display
        const sortedPoints = dataPoints.sort((a, b) => 
          new Date(a.period_end_date).getTime() - new Date(b.period_end_date).getTime()
        );
        
        const def = kpiDefMap.get(kpiCode);
        const currentValue = sortedPoints[sortedPoints.length - 1]?.value || 0;
        const previousValue = sortedPoints.length > 1 ? sortedPoints[sortedPoints.length - 2]?.value : undefined;
        
        const higherIsBetter = HIGHER_IS_BETTER.has(kpiCode);
        const { change_pct, trend_direction, is_improvement } = calculateTrend(currentValue, previousValue, higherIsBetter);
        
        trendResults.push({
          kpi_code: kpiCode,
          kpi_name: def?.name || kpiCode.replace(/_/g, ' '),
          unit: def?.unit || '',
          format: (def?.format as KPITrend['format']) || 'number',
          data_points: sortedPoints,
          current_value: currentValue,
          previous_value: previousValue,
          change_pct,
          trend_direction,
          is_improvement
        });
      }
      
      // Sort by KPI name
      trendResults.sort((a, b) => a.kpi_name.localeCompare(b.kpi_name));
      
      setTrends(trendResults);
    } catch (err) {
      console.error('[useKPITrends] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch KPI trends');
    } finally {
      setLoading(false);
    }
  }, [engagementId, periodsBack, kpiCodes]);
  
  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);
  
  return {
    trends,
    loading,
    error,
    refetch: fetchTrends
  };
}

export default useKPITrends;

