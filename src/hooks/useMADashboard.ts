import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { 
  MAReportConfig, 
  MAChartData, 
  MAScenario, 
  MADashboardInsight
} from '../types/ma-dashboard';
import type { MAFinancialData, MAKPIValue } from '../types/ma';

interface MADashboardData {
  engagement: any | null;
  period: any | null;
  reportConfig: MAReportConfig | null;
  chartData: Record<string, MAChartData>;
  insights: MADashboardInsight[];
  scenarios: MAScenario[];
  financialData: MAFinancialData | null;
  kpis: MAKPIValue[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMADashboard(engagementId: string, periodId: string): MADashboardData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [period, setPeriod] = useState<any>(null);
  const [reportConfig, setReportConfig] = useState<MAReportConfig | null>(null);
  const [chartData, setChartData] = useState<Record<string, MAChartData>>({});
  const [insights, setInsights] = useState<MADashboardInsight[]>([]);
  const [scenarios, setScenarios] = useState<MAScenario[]>([]);
  const [financialData, setFinancialData] = useState<MAFinancialData | null>(null);
  const [kpis, setKpis] = useState<MAKPIValue[]>([]);

  const fetchData = useCallback(async () => {
    if (!engagementId || !periodId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch engagement with client
      const { data: engagementData, error: engError } = await supabase
        .from('ma_engagements')
        .select('*, client:practice_members!client_id(id, name, email)')
        .eq('id', engagementId)
        .single();
      
      if (engError) throw new Error(`Failed to load engagement: ${engError.message}`);
      setEngagement(engagementData);

      // Fetch period
      const { data: periodData, error: periodError } = await supabase
        .from('ma_periods')
        .select('*')
        .eq('id', periodId)
        .single();
      
      if (periodError) throw new Error(`Failed to load period: ${periodError.message}`);
      setPeriod(periodData);

      // Fetch report config (may not exist yet)
      const { data: configData } = await supabase
        .from('ma_report_config')
        .select('*')
        .eq('period_id', periodId)
        .single();
      setReportConfig(configData);

      // Fetch chart data
      const { data: chartDataArr } = await supabase
        .from('ma_chart_data')
        .select('*')
        .eq('period_id', periodId);
      
      const chartDataMap: Record<string, MAChartData> = {};
      chartDataArr?.forEach(cd => {
        chartDataMap[cd.chart_type] = cd;
      });
      setChartData(chartDataMap);

      // Fetch insights
      const { data: insightsData } = await supabase
        .from('ma_insights')
        .select('*')
        .eq('period_id', periodId)
        .eq('status', 'approved')
        .order('display_order', { ascending: true });
      setInsights(insightsData || []);

      // Fetch featured scenarios
      const { data: scenariosData } = await supabase
        .from('ma_scenarios')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('is_featured', true)
        .order('created_at', { ascending: true });
      setScenarios(scenariosData || []);

      // Fetch financial data
      const { data: finData } = await supabase
        .from('ma_financial_data')
        .select('*')
        .eq('period_id', periodId)
        .single();
      setFinancialData(finData);

      // Fetch KPIs
      const { data: kpiData } = await supabase
        .from('ma_kpi_tracking')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false });
      setKpis(kpiData || []);

    } catch (err: any) {
      console.error('[useMADashboard] Error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [engagementId, periodId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    engagement,
    period,
    reportConfig,
    chartData,
    insights,
    scenarios,
    financialData,
    kpis,
    refetch: fetchData,
  };
}

