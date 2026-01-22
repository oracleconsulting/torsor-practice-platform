/**
 * Business Intelligence Comparison Service
 * Handles P&L comparisons, budget variance calculations, and YTD aggregations
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface VarianceResult {
  amount: number;
  pct: number;
}

export interface FinancialComparison {
  actual: number;
  budget: number | null;
  priorMonth: number | null;
  priorYear: number | null;
  variances: {
    vsBudget: VarianceResult | null;
    vsPriorMonth: VarianceResult | null;
    vsPriorYear: VarianceResult | null;
  };
}

export interface PLComparison {
  revenue: FinancialComparison;
  costOfSales: FinancialComparison;
  grossProfit: FinancialComparison;
  grossMarginPct: FinancialComparison;
  overheads: FinancialComparison;
  operatingProfit: FinancialComparison;
  operatingMarginPct: FinancialComparison;
  netProfit: FinancialComparison;
  netMarginPct: FinancialComparison;
}

export interface YTDComparison {
  actual: number;
  budget: number | null;
  priorYear: number | null;
  variances: {
    vsBudget: VarianceResult | null;
    vsPriorYear: VarianceResult | null;
  };
}

export interface FullComparisonData {
  period: PLComparison;
  ytd: {
    revenue: YTDComparison;
    costOfSales: YTDComparison;
    grossProfit: YTDComparison;
    overheads: YTDComparison;
    operatingProfit: YTDComparison;
    netProfit: YTDComparison;
  };
  metadata: {
    periodLabel: string;
    priorMonthLabel: string | null;
    priorYearLabel: string | null;
    hasBudget: boolean;
    calculatedAt: string;
  };
}

interface FinancialData {
  revenue?: number;
  cost_of_sales?: number;
  gross_profit?: number;
  overheads?: number;
  operating_profit?: number;
  net_profit?: number;
  [key: string]: number | undefined;
}

// ============================================================================
// COMPARISON SERVICE
// ============================================================================

export class BIComparisonService {
  
  /**
   * Generate empty comparison structure when data is unavailable
   */
  private static emptyComparisonData(periodLabel: string): FullComparisonData {
    const emptyLine = (): FinancialComparison => ({
      actual: 0,
      budget: null,
      priorMonth: null,
      priorYear: null,
      variances: { vsBudget: null, vsPriorMonth: null, vsPriorYear: null }
    });
    
    const emptyYTD = (): YTDComparison => ({
      actual: 0,
      budget: null,
      priorYear: null,
      variances: { vsBudget: null, vsPriorYear: null }
    });
    
    return {
      period: {
        revenue: emptyLine(),
        costOfSales: emptyLine(),
        grossProfit: emptyLine(),
        grossMarginPct: emptyLine(),
        overheads: emptyLine(),
        operatingProfit: emptyLine(),
        operatingMarginPct: emptyLine(),
        netProfit: emptyLine(),
        netMarginPct: emptyLine()
      },
      ytd: {
        revenue: emptyYTD(),
        costOfSales: emptyYTD(),
        grossProfit: emptyYTD(),
        overheads: emptyYTD(),
        operatingProfit: emptyYTD(),
        netProfit: emptyYTD()
      },
      metadata: {
        periodLabel,
        priorMonthLabel: null,
        priorYearLabel: null,
        hasBudget: false,
        calculatedAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * Calculate all comparisons for a period
   */
  static async calculateComparisons(periodId: string): Promise<FullComparisonData> {
    // Get current period with engagement and financial data
    const { data: period, error: periodError } = await supabase
      .from('bi_periods')
      .select(`
        *,
        engagement:bi_engagements(
          id,
          tier,
          client:clients(id, name, company_name)
        )
      `)
      .eq('id', periodId)
      .single();
    
    if (periodError || !period) {
      console.warn('[BIComparisonService] Period not found or error:', periodError);
      throw new Error('Period not found');
    }
    
    // Get financial data for this period
    const { data: financialData, error: finError } = await supabase
      .from('bi_financial_data')
      .select('*')
      .eq('period_id', periodId)
      .single();
    
    if (!financialData || finError) {
      // Return empty comparison structure if no financial data
      console.warn('[BIComparisonService] No financial data for period:', periodId);
      return this.emptyComparisonData(period.period_label || 'Current Period');
    }
    
    const engagementId = period.engagement_id;
    const periodStart = new Date(period.period_start);
    
    // Get comparison data in parallel
    const [priorMonthData, priorYearData, budgetData, ytdData] = await Promise.all([
      this.getPriorMonthData(engagementId, periodStart),
      this.getPriorYearData(engagementId, periodStart),
      this.getBudgetForMonth(engagementId, periodStart),
      this.getYTDData(engagementId, periodStart)
    ]);
    
    // Build period comparison
    const periodComparison = this.buildPLComparison(
      financialData,
      budgetData,
      priorMonthData?.financial || null,
      priorYearData?.financial || null
    );
    
    // Build YTD comparison
    const ytdComparison = this.buildYTDComparison(
      ytdData.actual,
      ytdData.budget,
      ytdData.priorYear
    );
    
    // Format period labels
    const formatPeriodLabel = (date: Date) => {
      return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    };
    
    return {
      period: periodComparison,
      ytd: ytdComparison,
      metadata: {
        periodLabel: period.period_label || formatPeriodLabel(periodStart),
        priorMonthLabel: priorMonthData?.period?.period_label || null,
        priorYearLabel: priorYearData?.period?.period_label || null,
        hasBudget: budgetData !== null,
        calculatedAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * Get prior month's data
   */
  private static async getPriorMonthData(
    engagementId: string, 
    currentPeriodStart: Date
  ): Promise<{ period: any; financial: FinancialData } | null> {
    const priorMonth = new Date(currentPeriodStart);
    priorMonth.setMonth(priorMonth.getMonth() - 1);
    const priorMonthStr = priorMonth.toISOString().split('T')[0];
    
    const { data: period } = await supabase
      .from('bi_periods')
      .select('id, period_label, period_start')
      .eq('engagement_id', engagementId)
      .eq('period_start', priorMonthStr)
      .single();
    
    if (!period) return null;
    
    const { data: financial } = await supabase
      .from('bi_financial_data')
      .select('*')
      .eq('period_id', period.id)
      .single();
    
    return { period, financial: financial || {} };
  }
  
  /**
   * Get prior year same month's data
   */
  private static async getPriorYearData(
    engagementId: string, 
    currentPeriodStart: Date
  ): Promise<{ period: any; financial: FinancialData } | null> {
    const priorYear = new Date(currentPeriodStart);
    priorYear.setFullYear(priorYear.getFullYear() - 1);
    const priorYearStr = priorYear.toISOString().split('T')[0];
    
    const { data: period } = await supabase
      .from('bi_periods')
      .select('id, period_label, period_start')
      .eq('engagement_id', engagementId)
      .eq('period_start', priorYearStr)
      .single();
    
    if (!period) return null;
    
    const { data: financial } = await supabase
      .from('bi_financial_data')
      .select('*')
      .eq('period_id', period.id)
      .single();
    
    return { period, financial: financial || {} };
  }
  
  /**
   * Get budget for a specific month
   */
  private static async getBudgetForMonth(
    engagementId: string, 
    periodStart: Date
  ): Promise<FinancialData | null> {
    const monthKey = periodStart.toISOString().slice(0, 7); // "2026-01"
    const periodDateStr = periodStart.toISOString().split('T')[0];
    
    const { data: budget } = await supabase
      .from('bi_budgets')
      .select('monthly_budgets')
      .eq('engagement_id', engagementId)
      .lte('financial_year_start', periodDateStr)
      .gte('financial_year_end', periodDateStr)
      .single();
    
    if (!budget?.monthly_budgets) return null;
    
    const monthBudget = budget.monthly_budgets[monthKey];
    return monthBudget || null;
  }
  
  /**
   * Get YTD aggregated data
   */
  private static async getYTDData(
    engagementId: string,
    currentPeriodStart: Date
  ): Promise<{
    actual: FinancialData;
    budget: FinancialData | null;
    priorYear: FinancialData | null;
  }> {
    // Determine financial year start (assume April year end, adjust as needed)
    const yearStart = new Date(currentPeriodStart);
    if (currentPeriodStart.getMonth() >= 3) { // April onwards
      yearStart.setMonth(3, 1); // April 1st of current calendar year
    } else { // Jan-March
      yearStart.setFullYear(yearStart.getFullYear() - 1);
      yearStart.setMonth(3, 1); // April 1st of previous calendar year
    }
    
    // Get all periods in the YTD range
    const { data: periods } = await supabase
      .from('bi_periods')
      .select('id, period_start')
      .eq('engagement_id', engagementId)
      .gte('period_start', yearStart.toISOString().split('T')[0])
      .lte('period_start', currentPeriodStart.toISOString().split('T')[0]);
    
    // Aggregate actual YTD
    let actualYTD: FinancialData = {
      revenue: 0,
      cost_of_sales: 0,
      gross_profit: 0,
      overheads: 0,
      operating_profit: 0,
      net_profit: 0
    };
    
    if (periods && periods.length > 0) {
      const periodIds = periods.map(p => p.id);
      const { data: financials } = await supabase
        .from('bi_financial_data')
        .select('*')
        .in('period_id', periodIds);
      
      if (financials) {
        financials.forEach(f => {
          actualYTD.revenue = (actualYTD.revenue || 0) + (f.revenue || 0);
          actualYTD.cost_of_sales = (actualYTD.cost_of_sales || 0) + (f.cost_of_sales || 0);
          actualYTD.gross_profit = (actualYTD.gross_profit || 0) + (f.gross_profit || 0);
          actualYTD.overheads = (actualYTD.overheads || 0) + (f.overheads || 0);
          actualYTD.operating_profit = (actualYTD.operating_profit || 0) + (f.operating_profit || 0);
          actualYTD.net_profit = (actualYTD.net_profit || 0) + (f.net_profit || 0);
        });
      }
    }
    
    // Get budget YTD
    const { data: budget } = await supabase
      .from('bi_budgets')
      .select('monthly_budgets')
      .eq('engagement_id', engagementId)
      .lte('financial_year_start', currentPeriodStart.toISOString().split('T')[0])
      .gte('financial_year_end', currentPeriodStart.toISOString().split('T')[0])
      .single();
    
    let budgetYTD: FinancialData | null = null;
    if (budget?.monthly_budgets) {
      budgetYTD = {
        revenue: 0,
        cost_of_sales: 0,
        gross_profit: 0,
        overheads: 0,
        operating_profit: 0,
        net_profit: 0
      };
      
      // Sum budget months up to current period
      const currentMonthKey = currentPeriodStart.toISOString().slice(0, 7);
      Object.entries(budget.monthly_budgets).forEach(([monthKey, data]) => {
        if (monthKey <= currentMonthKey) {
          const monthData = data as FinancialData;
          budgetYTD!.revenue = (budgetYTD!.revenue || 0) + (monthData.revenue || 0);
          budgetYTD!.cost_of_sales = (budgetYTD!.cost_of_sales || 0) + (monthData.cost_of_sales || 0);
          budgetYTD!.gross_profit = (budgetYTD!.gross_profit || 0) + (monthData.gross_profit || 0);
          budgetYTD!.overheads = (budgetYTD!.overheads || 0) + (monthData.overheads || 0);
          budgetYTD!.operating_profit = (budgetYTD!.operating_profit || 0) + (monthData.operating_profit || 0);
          budgetYTD!.net_profit = (budgetYTD!.net_profit || 0) + (monthData.net_profit || 0);
        }
      });
    }
    
    // Get prior year YTD (simplified - would need same period count in prior year)
    const priorYearStart = new Date(yearStart);
    priorYearStart.setFullYear(priorYearStart.getFullYear() - 1);
    const priorYearEnd = new Date(currentPeriodStart);
    priorYearEnd.setFullYear(priorYearEnd.getFullYear() - 1);
    
    const { data: priorPeriods } = await supabase
      .from('bi_periods')
      .select('id')
      .eq('engagement_id', engagementId)
      .gte('period_start', priorYearStart.toISOString().split('T')[0])
      .lte('period_start', priorYearEnd.toISOString().split('T')[0]);
    
    let priorYearYTD: FinancialData | null = null;
    if (priorPeriods && priorPeriods.length > 0) {
      priorYearYTD = {
        revenue: 0,
        cost_of_sales: 0,
        gross_profit: 0,
        overheads: 0,
        operating_profit: 0,
        net_profit: 0
      };
      
      const priorPeriodIds = priorPeriods.map(p => p.id);
      const { data: priorFinancials } = await supabase
        .from('bi_financial_data')
        .select('*')
        .in('period_id', priorPeriodIds);
      
      if (priorFinancials) {
        priorFinancials.forEach(f => {
          priorYearYTD!.revenue = (priorYearYTD!.revenue || 0) + (f.revenue || 0);
          priorYearYTD!.cost_of_sales = (priorYearYTD!.cost_of_sales || 0) + (f.cost_of_sales || 0);
          priorYearYTD!.gross_profit = (priorYearYTD!.gross_profit || 0) + (f.gross_profit || 0);
          priorYearYTD!.overheads = (priorYearYTD!.overheads || 0) + (f.overheads || 0);
          priorYearYTD!.operating_profit = (priorYearYTD!.operating_profit || 0) + (f.operating_profit || 0);
          priorYearYTD!.net_profit = (priorYearYTD!.net_profit || 0) + (f.net_profit || 0);
        });
      }
    }
    
    return {
      actual: actualYTD,
      budget: budgetYTD,
      priorYear: priorYearYTD
    };
  }
  
  /**
   * Build P&L comparison object
   */
  private static buildPLComparison(
    current: FinancialData,
    budget: FinancialData | null,
    priorMonth: FinancialData | null,
    priorYear: FinancialData | null
  ): PLComparison {
    const compare = (fieldName: string): FinancialComparison => {
      const actual = (current[fieldName] as number) || 0;
      const budgetVal = budget?.[fieldName] as number | undefined;
      const priorMonthVal = priorMonth?.[fieldName] as number | undefined;
      const priorYearVal = priorYear?.[fieldName] as number | undefined;
      
      return {
        actual,
        budget: budgetVal ?? null,
        priorMonth: priorMonthVal ?? null,
        priorYear: priorYearVal ?? null,
        variances: {
          vsBudget: budgetVal != null ? this.calcVariance(actual, budgetVal) : null,
          vsPriorMonth: priorMonthVal != null ? this.calcVariance(actual, priorMonthVal) : null,
          vsPriorYear: priorYearVal != null ? this.calcVariance(actual, priorYearVal) : null
        }
      };
    };
    
    // Calculate percentages
    const calcMargin = (profit: number, revenue: number) => revenue > 0 ? (profit / revenue) * 100 : 0;
    
    const currentRevenue = current.revenue || 0;
    const grossMarginPct = calcMargin(current.gross_profit || 0, currentRevenue);
    const operatingMarginPct = calcMargin(current.operating_profit || 0, currentRevenue);
    const netMarginPct = calcMargin(current.net_profit || 0, currentRevenue);
    
    const budgetGrossMargin = budget?.revenue ? calcMargin(budget.gross_profit || 0, budget.revenue) : null;
    const budgetOperatingMargin = budget?.revenue ? calcMargin(budget.operating_profit || 0, budget.revenue) : null;
    const budgetNetMargin = budget?.revenue ? calcMargin(budget.net_profit || 0, budget.revenue) : null;
    
    const priorMonthGrossMargin = priorMonth?.revenue ? calcMargin(priorMonth.gross_profit || 0, priorMonth.revenue) : null;
    const priorMonthOperatingMargin = priorMonth?.revenue ? calcMargin(priorMonth.operating_profit || 0, priorMonth.revenue) : null;
    const priorMonthNetMargin = priorMonth?.revenue ? calcMargin(priorMonth.net_profit || 0, priorMonth.revenue) : null;
    
    const priorYearGrossMargin = priorYear?.revenue ? calcMargin(priorYear.gross_profit || 0, priorYear.revenue) : null;
    const priorYearOperatingMargin = priorYear?.revenue ? calcMargin(priorYear.operating_profit || 0, priorYear.revenue) : null;
    const priorYearNetMargin = priorYear?.revenue ? calcMargin(priorYear.net_profit || 0, priorYear.revenue) : null;
    
    return {
      revenue: compare('revenue'),
      costOfSales: compare('cost_of_sales'),
      grossProfit: compare('gross_profit'),
      grossMarginPct: {
        actual: grossMarginPct,
        budget: budgetGrossMargin,
        priorMonth: priorMonthGrossMargin,
        priorYear: priorYearGrossMargin,
        variances: {
          vsBudget: budgetGrossMargin != null ? this.calcVariancePct(grossMarginPct, budgetGrossMargin) : null,
          vsPriorMonth: priorMonthGrossMargin != null ? this.calcVariancePct(grossMarginPct, priorMonthGrossMargin) : null,
          vsPriorYear: priorYearGrossMargin != null ? this.calcVariancePct(grossMarginPct, priorYearGrossMargin) : null
        }
      },
      overheads: compare('overheads'),
      operatingProfit: compare('operating_profit'),
      operatingMarginPct: {
        actual: operatingMarginPct,
        budget: budgetOperatingMargin,
        priorMonth: priorMonthOperatingMargin,
        priorYear: priorYearOperatingMargin,
        variances: {
          vsBudget: budgetOperatingMargin != null ? this.calcVariancePct(operatingMarginPct, budgetOperatingMargin) : null,
          vsPriorMonth: priorMonthOperatingMargin != null ? this.calcVariancePct(operatingMarginPct, priorMonthOperatingMargin) : null,
          vsPriorYear: priorYearOperatingMargin != null ? this.calcVariancePct(operatingMarginPct, priorYearOperatingMargin) : null
        }
      },
      netProfit: compare('net_profit'),
      netMarginPct: {
        actual: netMarginPct,
        budget: budgetNetMargin,
        priorMonth: priorMonthNetMargin,
        priorYear: priorYearNetMargin,
        variances: {
          vsBudget: budgetNetMargin != null ? this.calcVariancePct(netMarginPct, budgetNetMargin) : null,
          vsPriorMonth: priorMonthNetMargin != null ? this.calcVariancePct(netMarginPct, priorMonthNetMargin) : null,
          vsPriorYear: priorYearNetMargin != null ? this.calcVariancePct(netMarginPct, priorYearNetMargin) : null
        }
      }
    };
  }
  
  /**
   * Build YTD comparison object
   */
  private static buildYTDComparison(
    actual: FinancialData,
    budget: FinancialData | null,
    priorYear: FinancialData | null
  ): FullComparisonData['ytd'] {
    const compareYTD = (fieldName: string): YTDComparison => {
      const actualVal = (actual[fieldName] as number) || 0;
      const budgetVal = budget?.[fieldName] as number | undefined;
      const priorYearVal = priorYear?.[fieldName] as number | undefined;
      
      return {
        actual: actualVal,
        budget: budgetVal ?? null,
        priorYear: priorYearVal ?? null,
        variances: {
          vsBudget: budgetVal != null ? this.calcVariance(actualVal, budgetVal) : null,
          vsPriorYear: priorYearVal != null ? this.calcVariance(actualVal, priorYearVal) : null
        }
      };
    };
    
    return {
      revenue: compareYTD('revenue'),
      costOfSales: compareYTD('cost_of_sales'),
      grossProfit: compareYTD('gross_profit'),
      overheads: compareYTD('overheads'),
      operatingProfit: compareYTD('operating_profit'),
      netProfit: compareYTD('net_profit')
    };
  }
  
  /**
   * Calculate variance between actual and comparison value
   */
  private static calcVariance(actual: number, compareTo: number): VarianceResult {
    const amount = actual - compareTo;
    const pct = compareTo !== 0 ? (amount / Math.abs(compareTo)) * 100 : 0;
    return { amount, pct: Math.round(pct * 10) / 10 };
  }
  
  /**
   * Calculate variance for percentage values (simple difference)
   */
  private static calcVariancePct(actual: number, compareTo: number): VarianceResult {
    const amount = actual - compareTo;
    return { amount: Math.round(amount * 10) / 10, pct: Math.round(amount * 10) / 10 };
  }
  
  /**
   * Save/update budget for an engagement
   */
  static async saveBudget(
    engagementId: string,
    financialYearStart: string,
    financialYearEnd: string,
    monthlyBudgets: Record<string, FinancialData>,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('bi_budgets')
      .upsert({
        engagement_id: engagementId,
        financial_year_start: financialYearStart,
        financial_year_end: financialYearEnd,
        monthly_budgets: monthlyBudgets,
        notes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'engagement_id,financial_year_start'
      });
    
    if (error) {
      console.error('Failed to save budget:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  }
  
  /**
   * Get budget for an engagement
   */
  static async getBudget(
    engagementId: string,
    financialYearStart?: string
  ): Promise<{
    id: string;
    financial_year_start: string;
    financial_year_end: string;
    monthly_budgets: Record<string, FinancialData>;
    notes?: string;
  } | null> {
    let query = supabase
      .from('bi_budgets')
      .select('*')
      .eq('engagement_id', engagementId);
    
    if (financialYearStart) {
      query = query.eq('financial_year_start', financialYearStart);
    } else {
      query = query.order('financial_year_start', { ascending: false }).limit(1);
    }
    
    const { data } = await query.single();
    return data;
  }
}

export default BIComparisonService;

