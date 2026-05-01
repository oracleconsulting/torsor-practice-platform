/**
 * BI Alert Service
 * Detects KPI threshold breaches and generates alerts
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface AlertThreshold {
  kpi_code: string;
  red_below?: number;
  red_above?: number;
  amber_below?: number;
  amber_above?: number;
  description?: string;
}

export interface DetectedAlert {
  kpi_code: string;
  alert_type: 'threshold_breach' | 'trend_change' | 'target_miss' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  current_value: number;
  threshold_value?: number;
  previous_value?: number;
  title: string;
  description: string;
  recommendation?: string;
}

// ============================================================================
// DEFAULT THRESHOLDS
// ============================================================================

const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  // Cash & Liquidity
  { 
    kpi_code: 'true_cash_runway',
    red_below: 3,
    amber_below: 6,
    description: 'Months of cash runway'
  },
  { 
    kpi_code: 'current_ratio',
    red_below: 1.0,
    amber_below: 1.5,
    description: 'Current assets / Current liabilities'
  },
  { 
    kpi_code: 'quick_ratio',
    red_below: 0.8,
    amber_below: 1.0,
    description: 'Quick assets / Current liabilities'
  },
  
  // Profitability
  { 
    kpi_code: 'gross_margin',
    red_below: 30,
    amber_below: 40,
    description: 'Gross profit as % of revenue'
  },
  { 
    kpi_code: 'net_margin',
    red_below: 5,
    amber_below: 10,
    description: 'Net profit as % of revenue'
  },
  
  // Working Capital
  { 
    kpi_code: 'debtor_days',
    red_above: 90,
    amber_above: 60,
    description: 'Average days to collect receivables'
  },
  { 
    kpi_code: 'creditor_days',
    amber_below: 14,
    red_below: 7,
    description: 'Average days to pay suppliers'
  },
  
  // Growth
  { 
    kpi_code: 'revenue_growth',
    red_below: -10,
    amber_below: 0,
    description: 'Year-over-year revenue change'
  },
  
  // Efficiency
  { 
    kpi_code: 'revenue_per_fte',
    red_below: 80000,
    amber_below: 100000,
    description: 'Revenue per full-time equivalent'
  }
];

// ============================================================================
// ALERT GENERATION HELPERS
// ============================================================================

function determineAlertSeverity(
  value: number,
  threshold: AlertThreshold
): { severity: 'low' | 'medium' | 'high' | 'critical'; breached: boolean } {
  // Check for red thresholds (critical)
  if (threshold.red_below !== undefined && value < threshold.red_below) {
    return { severity: 'critical', breached: true };
  }
  if (threshold.red_above !== undefined && value > threshold.red_above) {
    return { severity: 'critical', breached: true };
  }
  
  // Check for amber thresholds (high)
  if (threshold.amber_below !== undefined && value < threshold.amber_below) {
    return { severity: 'high', breached: true };
  }
  if (threshold.amber_above !== undefined && value > threshold.amber_above) {
    return { severity: 'high', breached: true };
  }
  
  return { severity: 'low', breached: false };
}

function generateAlertTitle(kpiCode: string, severity: string): string {
  const kpiName = kpiCode.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  switch (severity) {
    case 'critical':
      return `🔴 Critical: ${kpiName} threshold breached`;
    case 'high':
      return `🟠 Warning: ${kpiName} needs attention`;
    default:
      return `${kpiName} alert`;
  }
}

function generateAlertDescription(
  kpiCode: string,
  value: number,
  threshold: AlertThreshold,
  _severity: string
): string {
  const kpiName = kpiCode.replace(/_/g, ' ');
  
  if (threshold.red_below !== undefined && value < threshold.red_below) {
    return `${kpiName} has dropped to ${value.toFixed(1)}, which is below the critical threshold of ${threshold.red_below}. ${threshold.description || ''}`;
  }
  if (threshold.red_above !== undefined && value > threshold.red_above) {
    return `${kpiName} has risen to ${value.toFixed(1)}, which exceeds the critical threshold of ${threshold.red_above}. ${threshold.description || ''}`;
  }
  if (threshold.amber_below !== undefined && value < threshold.amber_below) {
    return `${kpiName} is at ${value.toFixed(1)}, approaching the critical threshold of ${threshold.red_below || 'N/A'}. ${threshold.description || ''}`;
  }
  if (threshold.amber_above !== undefined && value > threshold.amber_above) {
    return `${kpiName} is at ${value.toFixed(1)}, approaching the critical threshold of ${threshold.red_above || 'N/A'}. ${threshold.description || ''}`;
  }
  
  return `${kpiName} is at ${value.toFixed(1)}. ${threshold.description || ''}`;
}

function generateRecommendation(kpiCode: string, _severity: string): string {
  const recommendations: Record<string, string> = {
    true_cash_runway: 'Review cash flow projections and consider actions to extend runway: reduce costs, accelerate collections, or explore financing options.',
    current_ratio: 'Consider strategies to improve liquidity: negotiate longer payment terms with suppliers, accelerate collections, or review inventory levels.',
    quick_ratio: 'Focus on converting current assets to cash more quickly. Review debtor collection processes and consider invoice financing.',
    gross_margin: 'Analyze pricing strategy and cost of sales. Look for opportunities to increase prices or reduce direct costs.',
    net_margin: 'Review overhead costs and identify areas for efficiency improvements. Consider whether current pricing supports sustainable margins.',
    debtor_days: 'Implement stricter credit control procedures. Consider offering early payment discounts or using invoice factoring.',
    creditor_days: 'Negotiate better payment terms with suppliers to improve cash flow timing.',
    revenue_growth: 'Review sales pipeline and marketing activities. Consider new revenue streams or market expansion.',
    revenue_per_fte: 'Evaluate team productivity and consider automation opportunities. Review if current headcount is optimal for revenue.'
  };
  
  return recommendations[kpiCode] || 'Review this metric and identify appropriate corrective actions.';
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export const BIAlertService = {
  /**
   * Analyze KPIs for a period and generate alerts
   */
  async analyzeKPIs(periodId: string): Promise<DetectedAlert[]> {
    const alerts: DetectedAlert[] = [];
    
    // Get KPI values for the period
    const { data: kpiValues, error } = await supabase
      .from('bi_kpi_values')
      .select('*')
      .eq('period_id', periodId);
    
    if (error) throw error;
    if (!kpiValues || kpiValues.length === 0) return [];
    
    // Get previous period KPIs for trend analysis
    const { data: period } = await supabase
      .from('bi_periods')
      .select('engagement_id, period_end')
      .eq('id', periodId)
      .single();
    
    let previousKpis: Record<string, number> = {};
    if (period) {
      const { data: prevPeriod } = await supabase
        .from('bi_periods')
        .select('id')
        .eq('engagement_id', period.engagement_id)
        .lt('period_end', period.period_end)
        .order('period_end', { ascending: false })
        .limit(1)
        .single();
      
      if (prevPeriod) {
        const { data: prevKpis } = await supabase
          .from('bi_kpi_values')
          .select('kpi_code, value')
          .eq('period_id', prevPeriod.id);
        
        if (prevKpis) {
          previousKpis = Object.fromEntries(
            prevKpis.map(k => [k.kpi_code, k.value])
          );
        }
      }
    }
    
    // Analyze each KPI
    for (const kpi of kpiValues) {
      const threshold = DEFAULT_THRESHOLDS.find(t => t.kpi_code === kpi.kpi_code);
      if (!threshold) continue;
      
      const { severity, breached } = determineAlertSeverity(kpi.value, threshold);
      
      if (breached) {
        alerts.push({
          kpi_code: kpi.kpi_code,
          alert_type: 'threshold_breach',
          severity,
          current_value: kpi.value,
          threshold_value: threshold.red_below || threshold.red_above || threshold.amber_below || threshold.amber_above,
          previous_value: previousKpis[kpi.kpi_code],
          title: generateAlertTitle(kpi.kpi_code, severity),
          description: generateAlertDescription(kpi.kpi_code, kpi.value, threshold, severity),
          recommendation: generateRecommendation(kpi.kpi_code, severity)
        });
      }
      
      // Check for significant trend changes
      const prevValue = previousKpis[kpi.kpi_code];
      if (prevValue !== undefined && prevValue !== 0) {
        const changePct = ((kpi.value - prevValue) / Math.abs(prevValue)) * 100;
        
        // Alert on >20% negative change for important metrics
        if (changePct < -20 && ['gross_margin', 'net_margin', 'revenue_growth', 'true_cash_runway'].includes(kpi.kpi_code)) {
          alerts.push({
            kpi_code: kpi.kpi_code,
            alert_type: 'trend_change',
            severity: changePct < -30 ? 'high' : 'medium',
            current_value: kpi.value,
            previous_value: prevValue,
            title: `📉 Significant decline in ${kpi.kpi_code.replace(/_/g, ' ')}`,
            description: `This metric has dropped by ${Math.abs(changePct).toFixed(1)}% compared to the previous period.`,
            recommendation: generateRecommendation(kpi.kpi_code, 'medium')
          });
        }
      }
      
      // Check for target miss
      if (kpi.target_value && kpi.value < kpi.target_value) {
        const missPct = ((kpi.target_value - kpi.value) / kpi.target_value) * 100;
        
        if (missPct > 10) {
          alerts.push({
            kpi_code: kpi.kpi_code,
            alert_type: 'target_miss',
            severity: missPct > 25 ? 'high' : 'medium',
            current_value: kpi.value,
            threshold_value: kpi.target_value,
            title: `🎯 Target missed: ${kpi.kpi_code.replace(/_/g, ' ')}`,
            description: `Current value (${kpi.value.toFixed(1)}) is ${missPct.toFixed(1)}% below target (${kpi.target_value}).`,
            recommendation: 'Review factors contributing to target miss and adjust action plans accordingly.'
          });
        }
      }
    }
    
    return alerts;
  },
  
  /**
   * Save detected alerts to database
   */
  async saveAlerts(periodId: string, alerts: DetectedAlert[]): Promise<void> {
    if (alerts.length === 0) return;
    
    // Check for existing alerts to avoid duplicates
    const { data: existing } = await supabase
      .from('bi_kpi_alerts')
      .select('kpi_code, alert_type')
      .eq('period_id', periodId);
    
    const existingKeys = new Set(
      (existing || []).map(a => `${a.kpi_code}:${a.alert_type}`)
    );
    
    const newAlerts = alerts.filter(
      a => !existingKeys.has(`${a.kpi_code}:${a.alert_type}`)
    );
    
    if (newAlerts.length === 0) return;
    
    const { error } = await supabase
      .from('bi_kpi_alerts')
      .insert(
        newAlerts.map(alert => ({
          period_id: periodId,
          kpi_code: alert.kpi_code,
          alert_type: alert.alert_type,
          severity: alert.severity,
          current_value: alert.current_value,
          threshold_value: alert.threshold_value,
          previous_value: alert.previous_value,
          title: alert.title,
          description: alert.description,
          recommendation: alert.recommendation
        }))
      );
    
    if (error) throw error;
  },
  
  /**
   * Run full alert analysis for a period
   */
  async runAnalysis(periodId: string): Promise<{ alertsGenerated: number; alerts: DetectedAlert[] }> {
    const alerts = await this.analyzeKPIs(periodId);
    await this.saveAlerts(periodId, alerts);
    return { alertsGenerated: alerts.length, alerts };
  }
};

export default BIAlertService;

