/**
 * Hook for fetching and managing KPI alerts
 * Provides alert data and actions for acknowledgment
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface KPIAlert {
  id: string;
  period_id: string;
  kpi_code: string;
  alert_type: 'threshold_breach' | 'trend_change' | 'target_miss' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  current_value: number | null;
  threshold_value: number | null;
  previous_value: number | null;
  title: string;
  description: string | null;
  recommendation: string | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface AlertsResult {
  alerts: KPIAlert[];
  unacknowledgedCount: number;
  loading: boolean;
  error: string | null;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  acknowledgeAll: () => Promise<void>;
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAlerts(
  engagementId: string | null | undefined,
  options: {
    periodId?: string;
    includeAcknowledged?: boolean;
  } = {}
): AlertsResult {
  const { periodId, includeAcknowledged = true } = options;
  
  const [alerts, setAlerts] = useState<KPIAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAlerts = useCallback(async () => {
    if (!engagementId) {
      setAlerts([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First get period IDs for this engagement
      let periodQuery = supabase
        .from('bi_periods')
        .select('id')
        .eq('engagement_id', engagementId);
      
      if (periodId) {
        periodQuery = periodQuery.eq('id', periodId);
      }
      
      const { data: periods, error: periodsError } = await periodQuery;
      if (periodsError) throw periodsError;
      
      if (!periods || periods.length === 0) {
        setAlerts([]);
        return;
      }
      
      const periodIds = periods.map(p => p.id);
      
      // Fetch alerts for these periods
      let alertsQuery = supabase
        .from('bi_kpi_alerts')
        .select('*')
        .in('period_id', periodIds)
        .order('created_at', { ascending: false });
      
      if (!includeAcknowledged) {
        alertsQuery = alertsQuery.eq('is_acknowledged', false);
      }
      
      const { data: alertsData, error: alertsError } = await alertsQuery;
      if (alertsError) throw alertsError;
      
      setAlerts(alertsData || []);
    } catch (err) {
      console.error('[useAlerts] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [engagementId, periodId, includeAcknowledged]);
  
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);
  
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('bi_kpi_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setAlerts(prev => prev.map(a => 
        a.id === alertId 
          ? { ...a, is_acknowledged: true, acknowledged_at: new Date().toISOString() }
          : a
      ));
    } catch (err) {
      console.error('[useAlerts] Acknowledge error:', err);
      throw err;
    }
  }, []);
  
  const acknowledgeAll = useCallback(async () => {
    const unacknowledgedIds = alerts
      .filter(a => !a.is_acknowledged)
      .map(a => a.id);
    
    if (unacknowledgedIds.length === 0) return;
    
    try {
      const { error: updateError } = await supabase
        .from('bi_kpi_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .in('id', unacknowledgedIds);
      
      if (updateError) throw updateError;
      
      // Update local state
      setAlerts(prev => prev.map(a => ({
        ...a,
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString()
      })));
    } catch (err) {
      console.error('[useAlerts] Acknowledge all error:', err);
      throw err;
    }
  }, [alerts]);
  
  const unacknowledgedCount = alerts.filter(a => !a.is_acknowledged).length;
  
  return {
    alerts,
    unacknowledgedCount,
    loading,
    error,
    acknowledgeAlert,
    acknowledgeAll,
    refetch: fetchAlerts
  };
}

export default useAlerts;

