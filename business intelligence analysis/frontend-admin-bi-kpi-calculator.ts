/**
 * Business Intelligence KPI Calculator
 * Auto-calculates all 23 KPIs from financial data
 */

import type { BIFinancialData, RAGStatus, TrendDirection } from '../../types/business-intelligence';

export interface KPICalculationResult {
  kpi_code: string;
  value: number;
  formatted_value: string;
  rag_status: RAGStatus;
  prior_value?: number;
  change_amount?: number;
  change_percentage?: number;
  trend_direction?: TrendDirection;
  trend_is_positive?: boolean;
}

export class BIKpiCalculator {
  /**
   * Calculate all KPIs from financial data
   */
  static calculateAll(
    data: BIFinancialData,
    selectedKpis: string[]
  ): KPICalculationResult[] {
    const results: KPICalculationResult[] = [];
    
    // Always calculate True Cash first (needed for other calculations)
    const trueCash = this.calculateTrueCash(data);
    if (selectedKpis.includes('true_cash')) {
      results.push(trueCash);
    }
    
    // Calculate remaining KPIs
    if (selectedKpis.includes('cash_runway')) {
      results.push(this.calculateCashRunway(data, trueCash.value));
    }
    
    if (selectedKpis.includes('monthly_burn')) {
      results.push(this.calculateMonthlyBurn(data));
    }
    
    if (selectedKpis.includes('debtor_days')) {
      results.push(this.calculateDebtorDays(data));
    }
    
    if (selectedKpis.includes('creditor_days')) {
      results.push(this.calculateCreditorDays(data));
    }
    
    if (selectedKpis.includes('working_capital_ratio')) {
      results.push(this.calculateWorkingCapitalRatio(data));
    }
    
    if (selectedKpis.includes('cash_conversion_cycle')) {
      const debtorDays = this.calculateDebtorDays(data).value;
      const creditorDays = this.calculateCreditorDays(data).value;
      results.push(this.calculateCashConversionCycle(debtorDays, creditorDays));
    }
    
    if (selectedKpis.includes('monthly_revenue')) {
      results.push(this.calculateMonthlyRevenue(data));
    }
    
    if (selectedKpis.includes('yoy_growth')) {
      results.push(this.calculateYoYGrowth(data));
    }
    
    if (selectedKpis.includes('revenue_per_employee')) {
      results.push(this.calculateRevenuePerEmployee(data));
    }
    
    if (selectedKpis.includes('gross_margin')) {
      results.push(this.calculateGrossMargin(data));
    }
    
    if (selectedKpis.includes('operating_margin')) {
      results.push(this.calculateOperatingMargin(data));
    }
    
    if (selectedKpis.includes('net_margin')) {
      results.push(this.calculateNetMargin(data));
    }
    
    if (selectedKpis.includes('overhead_ratio')) {
      results.push(this.calculateOverheadRatio(data));
    }
    
    if (selectedKpis.includes('revenue_per_salary')) {
      results.push(this.calculateRevenuePerSalary(data));
    }
    
    return results;
  }
  
  /**
   * TRUE CASH POSITION
   * cash_at_bank - vat - paye - corp_tax - committed + confirmed_receivables
   */
  static calculateTrueCash(data: BIFinancialData): KPICalculationResult {
    const cashAtBank = data.cash_at_bank || 0;
    const vatLiability = data.vat_liability || 0;
    const payeLiability = data.paye_liability || 0;
    const corpTaxLiability = data.corporation_tax_liability || 0;
    const committedPayments = data.committed_payments || 0;
    const confirmedReceivables = data.confirmed_receivables || 0;
    
    const value = cashAtBank - vatLiability - payeLiability - corpTaxLiability - committedPayments + confirmedReceivables;
    
    // RAG based on runway
    const monthlyOpCosts = data.monthly_operating_costs || 1;
    const runway = value / monthlyOpCosts;
    
    let rag: RAGStatus = 'green';
    if (runway < 1) rag = 'red';
    else if (runway < 3) rag = 'amber';
    
    return {
      kpi_code: 'true_cash',
      value,
      formatted_value: this.formatCurrency(value),
      rag_status: value < 0 ? 'red' : rag
    };
  }
  
  /**
   * CASH RUNWAY
   * true_cash / monthly_operating_costs
   */
  static calculateCashRunway(data: BIFinancialData, trueCash: number): KPICalculationResult {
    const monthlyOpCosts = data.monthly_operating_costs || 0;
    const value = monthlyOpCosts > 0 ? trueCash / monthlyOpCosts : 0;
    
    let rag: RAGStatus = 'green';
    if (value < 1) rag = 'red';
    else if (value < 3) rag = 'amber';
    
    return {
      kpi_code: 'cash_runway',
      value,
      formatted_value: `${value.toFixed(1)} months`,
      rag_status: rag
    };
  }
  
  /**
   * MONTHLY BURN RATE
   */
  static calculateMonthlyBurn(data: BIFinancialData): KPICalculationResult {
    const value = (data.monthly_operating_costs || 0) + (data.monthly_payroll_costs || 0);
    
    return {
      kpi_code: 'monthly_burn',
      value,
      formatted_value: this.formatCurrency(value),
      rag_status: 'neutral'
    };
  }
  
  /**
   * DEBTOR DAYS
   * (trade_debtors / revenue) × 30
   */
  static calculateDebtorDays(data: BIFinancialData): KPICalculationResult {
    const revenue = data.revenue || 0;
    const debtors = data.trade_debtors || 0;
    
    const value = revenue > 0 ? (debtors / revenue) * 30 : 0;
    
    let rag: RAGStatus = 'green';
    if (value > 45) rag = 'red';
    else if (value > 30) rag = 'amber';
    
    return {
      kpi_code: 'debtor_days',
      value,
      formatted_value: `${Math.round(value)} days`,
      rag_status: rag
    };
  }
  
  /**
   * CREDITOR DAYS
   * (trade_creditors / cost_of_sales) × 30
   */
  static calculateCreditorDays(data: BIFinancialData): KPICalculationResult {
    const costOfSales = data.cost_of_sales || 0;
    const creditors = data.trade_creditors || 0;
    
    const value = costOfSales > 0 ? (creditors / costOfSales) * 30 : 0;
    
    // Lower is not necessarily better - paying too fast wastes cash
    let rag: RAGStatus = 'green';
    if (value < 20) rag = 'amber'; // Paying too fast
    
    return {
      kpi_code: 'creditor_days',
      value,
      formatted_value: `${Math.round(value)} days`,
      rag_status: rag
    };
  }
  
  /**
   * WORKING CAPITAL RATIO
   * (cash + debtors + stock) / (creditors + vat + paye)
   */
  static calculateWorkingCapitalRatio(data: BIFinancialData): KPICalculationResult {
    const currentAssets = (data.cash_at_bank || 0) + (data.trade_debtors || 0) + (data.stock || 0);
    const currentLiabilities = (data.trade_creditors || 0) + (data.vat_liability || 0) + (data.paye_liability || 0);
    
    const value = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    
    let rag: RAGStatus = 'green';
    if (value < 1.0) rag = 'red';
    else if (value < 1.5) rag = 'amber';
    
    return {
      kpi_code: 'working_capital_ratio',
      value,
      formatted_value: `${value.toFixed(2)}:1`,
      rag_status: rag
    };
  }
  
  /**
   * CASH CONVERSION CYCLE
   * debtor_days + inventory_days - creditor_days
   */
  static calculateCashConversionCycle(debtorDays: number, creditorDays: number, inventoryDays: number = 0): KPICalculationResult {
    const value = debtorDays + inventoryDays - creditorDays;
    
    let rag: RAGStatus = 'green';
    if (value > 75) rag = 'red';
    else if (value > 45) rag = 'amber';
    
    return {
      kpi_code: 'cash_conversion_cycle',
      value,
      formatted_value: `${Math.round(value)} days`,
      rag_status: rag
    };
  }
  
  /**
   * MONTHLY REVENUE
   */
  static calculateMonthlyRevenue(data: BIFinancialData): KPICalculationResult {
    const value = data.revenue || 0;
    
    // Compare to prior if available
    let trend_direction: TrendDirection | undefined;
    let change_amount: number | undefined;
    let change_percentage: number | undefined;
    
    if (data.prior_revenue && data.prior_revenue > 0) {
      change_amount = value - data.prior_revenue;
      change_percentage = (change_amount / data.prior_revenue) * 100;
      trend_direction = change_amount > 0 ? 'up' : change_amount < 0 ? 'down' : 'flat';
    }
    
    return {
      kpi_code: 'monthly_revenue',
      value,
      formatted_value: this.formatCurrency(value),
      rag_status: 'neutral',
      prior_value: data.prior_revenue || undefined,
      change_amount,
      change_percentage,
      trend_direction,
      trend_is_positive: trend_direction === 'up'
    };
  }
  
  /**
   * YoY REVENUE GROWTH
   * ((revenue - yoy_revenue) / yoy_revenue) × 100
   */
  static calculateYoYGrowth(data: BIFinancialData): KPICalculationResult {
    const revenue = data.revenue || 0;
    const yoyRevenue = data.yoy_revenue || 0;
    
    const value = yoyRevenue > 0 ? ((revenue - yoyRevenue) / yoyRevenue) * 100 : 0;
    
    let rag: RAGStatus = 'green';
    if (value < 0) rag = 'red';
    else if (value < 10) rag = 'amber';
    
    return {
      kpi_code: 'yoy_growth',
      value,
      formatted_value: `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`,
      rag_status: rag,
      trend_direction: value > 0 ? 'up' : value < 0 ? 'down' : 'flat',
      trend_is_positive: value >= 0
    };
  }
  
  /**
   * REVENUE PER EMPLOYEE
   * (revenue × 12) / fte_count
   */
  static calculateRevenuePerEmployee(data: BIFinancialData): KPICalculationResult {
    const revenue = data.revenue || 0;
    const fteCount = data.fte_count || 0;
    
    const annualisedRevenue = revenue * 12;
    const value = fteCount > 0 ? annualisedRevenue / fteCount : 0;
    
    let rag: RAGStatus = 'green';
    if (value < 75000) rag = 'red';
    else if (value < 100000) rag = 'amber';
    
    return {
      kpi_code: 'revenue_per_employee',
      value,
      formatted_value: this.formatCurrency(value),
      rag_status: rag
    };
  }
  
  /**
   * GROSS MARGIN %
   * (gross_profit / revenue) × 100
   */
  static calculateGrossMargin(data: BIFinancialData): KPICalculationResult {
    const revenue = data.revenue || 0;
    const grossProfit = data.gross_profit || 0;
    
    const value = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    
    let rag: RAGStatus = 'green';
    if (value < 25) rag = 'red';
    else if (value < 40) rag = 'amber';
    
    return {
      kpi_code: 'gross_margin',
      value,
      formatted_value: `${value.toFixed(1)}%`,
      rag_status: rag
    };
  }
  
  /**
   * OPERATING MARGIN %
   * (operating_profit / revenue) × 100
   */
  static calculateOperatingMargin(data: BIFinancialData): KPICalculationResult {
    const revenue = data.revenue || 0;
    const operatingProfit = data.operating_profit || 0;
    
    const value = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;
    
    let rag: RAGStatus = 'green';
    if (value < 8) rag = 'red';
    else if (value < 15) rag = 'amber';
    
    return {
      kpi_code: 'operating_margin',
      value,
      formatted_value: `${value.toFixed(1)}%`,
      rag_status: rag
    };
  }
  
  /**
   * NET MARGIN %
   * (net_profit / revenue) × 100
   */
  static calculateNetMargin(data: BIFinancialData): KPICalculationResult {
    const revenue = data.revenue || 0;
    const netProfit = data.net_profit || 0;
    
    const value = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    let rag: RAGStatus = 'green';
    if (value < 5) rag = 'red';
    else if (value < 10) rag = 'amber';
    
    return {
      kpi_code: 'net_margin',
      value,
      formatted_value: `${value.toFixed(1)}%`,
      rag_status: rag
    };
  }
  
  /**
   * OVERHEAD RATIO
   * (overheads / revenue) × 100
   */
  static calculateOverheadRatio(data: BIFinancialData): KPICalculationResult {
    const revenue = data.revenue || 0;
    const overheads = data.overheads || 0;
    
    const value = revenue > 0 ? (overheads / revenue) * 100 : 0;
    
    // Lower is better
    let rag: RAGStatus = 'green';
    if (value > 45) rag = 'red';
    else if (value > 30) rag = 'amber';
    
    return {
      kpi_code: 'overhead_ratio',
      value,
      formatted_value: `${value.toFixed(1)}%`,
      rag_status: rag
    };
  }
  
  /**
   * REVENUE PER £1 SALARY
   * revenue / monthly_payroll_costs
   */
  static calculateRevenuePerSalary(data: BIFinancialData): KPICalculationResult {
    const revenue = data.revenue || 0;
    const payroll = data.monthly_payroll_costs || 0;
    
    const value = payroll > 0 ? revenue / payroll : 0;
    
    let rag: RAGStatus = 'green';
    if (value < 2) rag = 'red';
    else if (value < 3) rag = 'amber';
    
    return {
      kpi_code: 'revenue_per_salary',
      value,
      formatted_value: `${value.toFixed(2)}:1`,
      rag_status: rag
    };
  }
  
  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  static formatCurrency(value: number): string {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue >= 1000000) {
      return `${sign}£${(absValue / 1000000).toFixed(1)}m`;
    } else if (absValue >= 1000) {
      return `${sign}£${(absValue / 1000).toFixed(0)}k`;
    } else {
      return `${sign}£${absValue.toFixed(0)}`;
    }
  }
  
  static formatFullCurrency(value: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}

/**
 * Get core KPIs for Clarity tier (5 KPIs)
 */
export const CORE_KPIS = [
  'true_cash',
  'cash_runway',
  'debtor_days',
  'gross_margin',
  'revenue_per_employee'
];

/**
 * Get expanded KPIs for Foresight tier (8 KPIs)
 */
export const FORESIGHT_KPIS = [
  ...CORE_KPIS,
  'working_capital_ratio',
  'overhead_ratio',
  'yoy_growth'
];

/**
 * Get KPIs by tier
 */
export function getKPIsForTier(tier: 'clarity' | 'foresight' | 'strategic'): string[] {
  switch (tier) {
    case 'clarity':
      return CORE_KPIS;
    case 'foresight':
      return FORESIGHT_KPIS;
    case 'strategic':
      // Custom - return all available
      return [
        'true_cash', 'cash_runway', 'monthly_burn',
        'debtor_days', 'creditor_days', 'working_capital_ratio', 'cash_conversion_cycle',
        'monthly_revenue', 'yoy_growth', 'revenue_per_employee',
        'gross_margin', 'operating_margin', 'net_margin', 'overhead_ratio', 'revenue_per_salary'
      ];
    default:
      return CORE_KPIS;
  }
}

