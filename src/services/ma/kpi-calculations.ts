// ============================================================================
// KPI CALCULATION SERVICE
// ============================================================================
// Calculate all KPIs from financial data with auto-commentary
// ============================================================================

import { supabase } from '../../lib/supabase';
import type { MAFinancialData, RAGStatus } from '../../types/business-intelligence';

export interface KPICalculationResult {
  code: string;
  name: string;
  value: number;
  unit: 'currency' | 'percentage' | 'days' | 'ratio' | 'number';
  previousValue?: number;
  target?: number;
  benchmark?: number;
  changeAbsolute?: number;
  changePercent?: number;
  ragStatus: RAGStatus;
  higherIsBetter: boolean | null;
  autoCommentary: string;
  category: string;
}

interface CalculationInputs {
  current: MAFinancialData;
  previous?: MAFinancialData;
  priorYear?: MAFinancialData;
  targets?: Record<string, number>;
  benchmarks?: Record<string, number>;
}

// ============================================================================
// KPI CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate Debtor Days
 * Formula: (Trade Debtors / Annual Revenue) × 365
 */
function calculateDebtorDays(data: MAFinancialData, isAnnual = false): number | null {
  if (!data.trade_debtors || !data.revenue) return null;
  
  // Annualize revenue if monthly
  const annualRevenue = isAnnual ? data.revenue : data.revenue * 12;
  return (data.trade_debtors / annualRevenue) * 365;
}

/**
 * Calculate Creditor Days
 * Formula: (Trade Creditors / Annual Purchases) × 365
 */
function calculateCreditorDays(data: MAFinancialData, isAnnual = false): number | null {
  if (!data.trade_creditors) return null;
  
  // Use cost of sales + overheads as proxy for purchases
  const purchases = (data.cost_of_sales || 0) + (data.overheads || 0);
  if (purchases === 0) return null;
  
  const annualPurchases = isAnnual ? purchases : purchases * 12;
  return (data.trade_creditors / annualPurchases) * 365;
}

/**
 * Calculate Cash Conversion Cycle
 * Formula: Debtor Days + Stock Days - Creditor Days
 */
function calculateCashConversionCycle(data: MAFinancialData): number | null {
  const debtorDays = calculateDebtorDays(data);
  const creditorDays = calculateCreditorDays(data);
  
  if (debtorDays === null || creditorDays === null) return null;
  
  // For service businesses, stock days is typically 0
  const stockDays = 0;
  
  return debtorDays + stockDays - creditorDays;
}

/**
 * Calculate Working Capital Ratio
 * Formula: Current Assets / Current Liabilities
 */
function calculateWorkingCapitalRatio(data: MAFinancialData): number | null {
  if (!data.current_assets || !data.current_liabilities || data.current_liabilities === 0) return null;
  return data.current_assets / data.current_liabilities;
}

/**
 * Calculate Gross Margin %
 * Formula: (Gross Profit / Revenue) × 100
 */
function calculateGrossMargin(data: MAFinancialData): number | null {
  if (!data.revenue || data.revenue === 0) return null;
  const grossProfit = data.gross_profit ?? (data.revenue - (data.cost_of_sales || 0));
  return (grossProfit / data.revenue) * 100;
}

/**
 * Calculate Operating Margin %
 * Formula: (Operating Profit / Revenue) × 100
 */
function calculateOperatingMargin(data: MAFinancialData): number | null {
  if (!data.revenue || data.revenue === 0 || data.operating_profit === undefined) return null;
  return (data.operating_profit / data.revenue) * 100;
}

/**
 * Calculate Net Margin %
 * Formula: (Net Profit / Revenue) × 100
 */
function calculateNetMargin(data: MAFinancialData): number | null {
  if (!data.revenue || data.revenue === 0 || data.net_profit === undefined) return null;
  return (data.net_profit / data.revenue) * 100;
}

/**
 * Calculate Revenue per Employee
 * Formula: Annualized Revenue / FTE Count
 */
function calculateRevenuePerEmployee(data: MAFinancialData, isAnnual = false): number | null {
  if (!data.revenue || !data.fte_count || data.fte_count === 0) return null;
  const annualRevenue = isAnnual ? data.revenue : data.revenue * 12;
  return annualRevenue / data.fte_count;
}

/**
 * Calculate Overhead as % of Revenue
 * Formula: (Overheads / Revenue) × 100
 */
function calculateOverheadPercent(data: MAFinancialData): number | null {
  if (!data.revenue || data.revenue === 0 || data.overheads === undefined) return null;
  return (data.overheads / data.revenue) * 100;
}

/**
 * Calculate YoY Growth %
 * Formula: ((Current - Prior Year) / Prior Year) × 100
 */
function calculateYoYGrowth(current: number, priorYear: number): number | null {
  if (!priorYear || priorYear === 0) return null;
  return ((current - priorYear) / priorYear) * 100;
}

// ============================================================================
// RAG STATUS DETERMINATION
// ============================================================================

function determineRAGStatus(
  value: number,
  thresholds: { green: number; amber: number },
  higherIsBetter: boolean | null
): RAGStatus {
  if (higherIsBetter === null) return 'grey';
  
  if (higherIsBetter) {
    if (value >= thresholds.green) return 'green';
    if (value >= thresholds.amber) return 'amber';
    return 'red';
  } else {
    if (value <= thresholds.green) return 'green';
    if (value <= thresholds.amber) return 'amber';
    return 'red';
  }
}

// ============================================================================
// COMMENTARY GENERATION
// ============================================================================

function generateCommentary(
  code: string,
  value: number,
  previousValue?: number,
  ragStatus?: RAGStatus
): string {
  const formatCurrency = (n: number) => `£${Math.abs(n).toLocaleString()}`;
  const formatPercent = (n: number) => `${n.toFixed(1)}%`;
  const formatDays = (n: number) => `${Math.round(n)} days`;

  const change = previousValue !== undefined ? value - previousValue : null;
  const changeText = change !== null && previousValue !== 0
    ? ` (${change >= 0 ? 'up' : 'down'} ${Math.abs((change / previousValue!) * 100).toFixed(1)}% from last period)`
    : '';

  switch (code) {
    case 'debtor_days':
      return `Collecting payment in ${formatDays(value)} on average${changeText}. ${
        value > 45 ? 'This is slower than typical. Review overdue invoices.' :
        value > 35 ? 'Acceptable, but monitor for any deterioration.' :
        'Good collection performance.'
      }`;
    
    case 'creditor_days':
      return `Paying suppliers in ${formatDays(value)} on average${changeText}. ${
        value < 20 ? 'You may be paying too quickly - consider preserving cash.' :
        value > 60 ? 'Slower payments help cash flow but monitor supplier relationships.' :
        'Within normal range.'
      }`;
    
    case 'cash_conversion_cycle':
      return `Cash conversion cycle of ${formatDays(value)}${changeText}. ${
        value < 0 ? 'Excellent - you receive payment before paying suppliers.' :
        value > 60 ? 'Long cycle ties up working capital. Look at debtor collection.' :
        'Reasonable working capital efficiency.'
      }`;
    
    case 'working_capital_ratio':
      return `Working capital ratio of ${value.toFixed(2)}${changeText}. ${
        value < 1 ? 'Current liabilities exceed current assets - liquidity risk.' :
        value < 1.5 ? 'Acceptable but tight. Monitor closely.' :
        value > 3 ? 'Strong liquidity, but capital may be underutilised.' :
        'Healthy liquidity position.'
      }`;
    
    case 'gross_margin':
      return `Gross margin of ${formatPercent(value)}${changeText}. ${
        ragStatus === 'red' ? 'Below target - review pricing and direct costs.' :
        ragStatus === 'amber' ? 'Monitor for any deterioration.' :
        'Healthy margin on services.'
      }`;
    
    case 'operating_margin':
      return `Operating margin of ${formatPercent(value)}${changeText}. ${
        value < 5 ? 'Thin margin - limited buffer for unexpected costs.' :
        value < 15 ? 'Acceptable for many businesses, room to improve.' :
        'Strong operational profitability.'
      }`;
    
    case 'net_margin':
      return `Net margin of ${formatPercent(value)}${changeText}. ${
        value < 5 ? 'Low bottom line - review all cost lines.' :
        value < 10 ? 'Reasonable profitability.' :
        'Strong net profitability.'
      }`;
    
    case 'revenue_per_employee':
      return `Generating ${formatCurrency(value)} revenue per FTE (annualized)${changeText}. ${
        value < 100000 ? 'Below typical for professional services.' :
        value < 150000 ? 'Within normal range for the sector.' :
        'Strong productivity per head.'
      }`;
    
    case 'overhead_pct':
      return `Overheads represent ${formatPercent(value)} of revenue${changeText}. ${
        value > 45 ? 'High overhead burden - review fixed costs.' :
        value > 30 ? 'Moderate overhead level.' :
        'Well-controlled overhead structure.'
      }`;
    
    case 'yoy_growth':
      return `Revenue is ${value >= 0 ? 'up' : 'down'} ${formatPercent(Math.abs(value))} vs same period last year. ${
        value < 0 ? 'Declining revenue requires attention.' :
        value < 5 ? 'Modest growth - in line with inflation.' :
        value < 15 ? 'Solid growth performance.' :
        'Strong growth trajectory.'
      }`;
    
    case 'monthly_revenue':
      return `Revenue of ${formatCurrency(value)} this period${changeText}.`;
    
    default:
      return `Value: ${value}${changeText}`;
  }
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate all KPIs for a period based on financial data
 */
export function calculateAllKPIs(
  inputs: CalculationInputs,
  selectedKPIs: string[]
): KPICalculationResult[] {
  const results: KPICalculationResult[] = [];
  const { current, previous, priorYear, targets = {}, benchmarks = {} } = inputs;

  // Helper to add result if KPI is selected
  const addResult = (
    code: string,
    name: string,
    value: number | null,
    unit: KPICalculationResult['unit'],
    category: string,
    higherIsBetter: boolean | null,
    thresholds: { green: number; amber: number }
  ) => {
    if (!selectedKPIs.includes(code) || value === null) return;
    
    const previousValue = previous ? calculateKPIValue(code, previous) : undefined;
    const ragStatus = determineRAGStatus(value, thresholds, higherIsBetter);
    
    results.push({
      code,
      name,
      value,
      unit,
      previousValue: previousValue ?? undefined,
      target: targets[code],
      benchmark: benchmarks[code],
    changeAbsolute: previousValue !== undefined && previousValue !== null ? value - previousValue : undefined,
    changePercent: previousValue !== undefined && previousValue !== null && previousValue !== 0 
      ? ((value - previousValue) / previousValue) * 100 
      : undefined,
      ragStatus,
      higherIsBetter,
      autoCommentary: generateCommentary(code, value, previousValue ?? undefined, ragStatus),
      category,
    });
  };

  // Cash & Working Capital
  addResult('debtor_days', 'Debtor Days', calculateDebtorDays(current), 'days', 'Cash & Working Capital', false, { green: 35, amber: 45 });
  addResult('creditor_days', 'Creditor Days', calculateCreditorDays(current), 'days', 'Cash & Working Capital', null, { green: 30, amber: 60 });
  addResult('cash_conversion_cycle', 'Cash Conversion Cycle', calculateCashConversionCycle(current), 'days', 'Cash & Working Capital', false, { green: 30, amber: 60 });
  addResult('working_capital_ratio', 'Working Capital Ratio', calculateWorkingCapitalRatio(current), 'ratio', 'Cash & Working Capital', true, { green: 1.5, amber: 1.0 });

  // Revenue & Growth
  addResult('monthly_revenue', 'Monthly Revenue', current.revenue ?? null, 'currency', 'Revenue & Growth', true, { green: 0, amber: 0 });
  if (current.revenue && priorYear?.revenue) {
    addResult('yoy_growth', 'Year-on-Year Growth', calculateYoYGrowth(current.revenue, priorYear.revenue), 'percentage', 'Revenue & Growth', true, { green: 10, amber: 0 });
  }
  addResult('revenue_per_employee', 'Revenue per Employee', calculateRevenuePerEmployee(current), 'currency', 'Revenue & Growth', true, { green: 150000, amber: 100000 });

  // Profitability
  addResult('gross_margin', 'Gross Margin', calculateGrossMargin(current), 'percentage', 'Profitability', true, { green: 40, amber: 25 });
  addResult('operating_margin', 'Operating Margin', calculateOperatingMargin(current), 'percentage', 'Profitability', true, { green: 15, amber: 5 });
  addResult('net_margin', 'Net Margin', calculateNetMargin(current), 'percentage', 'Profitability', true, { green: 10, amber: 5 });
  addResult('overhead_pct', 'Overhead %', calculateOverheadPercent(current), 'percentage', 'Profitability', false, { green: 30, amber: 45 });

  return results;
}

/**
 * Calculate a single KPI value from financial data
 */
function calculateKPIValue(code: string, data: MAFinancialData): number | null {
  switch (code) {
    case 'debtor_days': return calculateDebtorDays(data);
    case 'creditor_days': return calculateCreditorDays(data);
    case 'cash_conversion_cycle': return calculateCashConversionCycle(data);
    case 'working_capital_ratio': return calculateWorkingCapitalRatio(data);
    case 'gross_margin': return calculateGrossMargin(data);
    case 'operating_margin': return calculateOperatingMargin(data);
    case 'net_margin': return calculateNetMargin(data);
    case 'revenue_per_employee': return calculateRevenuePerEmployee(data);
    case 'overhead_pct': return calculateOverheadPercent(data);
    case 'monthly_revenue': return data.revenue ?? null;
    default: return null;
  }
}

/**
 * Save calculated KPIs to the database
 */
export async function saveCalculatedKPIs(
  engagementId: string,
  periodEnd: string,
  results: KPICalculationResult[]
): Promise<void> {
  const records = results.map(r => ({
    engagement_id: engagementId,
    kpi_code: r.code,
    period_start: periodEnd,
    period_end: periodEnd,
    value: r.value,
    previous_value: r.previousValue,
    target_value: r.target,
    benchmark_value: r.benchmark,
    rag_status: r.ragStatus,
    change_vs_previous: r.changeAbsolute,
    change_vs_previous_pct: r.changePercent,
    auto_commentary: r.autoCommentary,
    data_source: 'calculated',
    data_quality: 'verified',
  }));

  const { error } = await supabase
    .from('ma_kpi_tracking')
    .upsert(records, { onConflict: 'engagement_id,kpi_code,period_end' });

  if (error) {
    console.error('[KPI Calculation] Error saving KPIs:', error);
    throw error;
  }
}

/**
 * Run full KPI calculation for a period
 */
export async function runKPICalculation(
  engagementId: string,
  periodId: string
): Promise<KPICalculationResult[]> {
  // Get selected KPIs for engagement
  const { data: selections } = await supabase
    .from('ma_kpi_selections')
    .select('kpi_code')
    .eq('engagement_id', engagementId);

  const selectedKPIs = selections?.map((s: { kpi_code: string }) => s.kpi_code) || ['debtor_days', 'operating_margin', 'true_cash'];

  // Get current period financial data
  const { data: currentData } = await supabase
    .from('ma_financial_data')
    .select('*')
    .eq('period_id', periodId)
    .single();

  if (!currentData) {
    throw new Error('No financial data found for period');
  }

  // Get period details
  const { data: period } = await supabase
    .from('ma_periods')
    .select('period_end, period_start')
    .eq('id', periodId)
    .single();

  if (!period) {
    throw new Error('Period not found');
  }

  // Get previous period data
  const { data: previousData } = await supabase
    .from('ma_financial_data')
    .select('*')
    .eq('engagement_id', engagementId)
    .lt('period_id', periodId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Calculate KPIs
  const results = calculateAllKPIs(
    {
      current: currentData as MAFinancialData,
      previous: previousData as MAFinancialData | undefined,
    },
    selectedKPIs
  );

  // Save results
  await saveCalculatedKPIs(engagementId, period.period_end, results);

  return results;
}

