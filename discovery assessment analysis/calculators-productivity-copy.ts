// ============================================================================
// PRODUCTIVITY METRICS CALCULATOR
// ============================================================================
// Calculates productivity metrics with pre-built phrases for Pass 2
// ============================================================================

import { 
  ProductivityMetrics, 
  CalculatedMetric,
  formatCurrency
} from '../types/pass1-output.ts';

import { IndustryBenchmark, getRevenuePerHeadStatus } from '../benchmarks/industry-benchmarks.ts';

type ClientBusinessType = 
  | 'trading_product'
  | 'trading_agency'
  | 'trading_construction'
  | 'trading_recruitment'
  | 'trading_hospitality'
  | 'professional_practice'
  | 'investment_vehicle'
  | 'funded_startup'
  | 'lifestyle_business';

interface FrameworkOverrides {
  useEarningsValuation: boolean;
  useAssetValuation: boolean;
  benchmarkAgainst: string | null;
  exitReadinessRelevant: boolean;
  payrollBenchmarkRelevant: boolean;
  appropriateServices: string[];
  inappropriateServices: string[];
  reportFraming: 'transformation' | 'wealth_protection' | 'foundations' | 'optimisation';
  maxRecommendedInvestment: number | null;
}

export interface ProductivityInputs {
  revenue: number;
  employeeCount: number;
  operatingProfit?: number | null;
  staffCosts?: number;
  contractorCountEstimate?: number;  // For agencies: estimated contractor count
}

/**
 * Calculate comprehensive productivity metrics with pre-built phrases
 */
export function calculateProductivityMetrics(
  inputs: ProductivityInputs,
  benchmark: IndustryBenchmark,
  clientType?: ClientBusinessType,
  frameworkOverrides?: FrameworkOverrides
): ProductivityMetrics | { status: 'not_applicable'; notApplicableReason: string; hasData: false } | { status: 'no_data'; hasData: false; notApplicableReason: string } {
  // ========================================================================
  // APPLICABILITY CHECK
  // ========================================================================
  // Productivity benchmarking is not applicable when benchmarks don't apply:
  // - trading_agency (contractor models break benchmarks) ⚠️
  // - investment_vehicle (no productivity relevance)
  // - funded_startup (pre-revenue or early stage, benchmarks don't apply)
  
  if (frameworkOverrides && (!frameworkOverrides.benchmarkAgainst || !frameworkOverrides.payrollBenchmarkRelevant)) {
    const reason = clientType === 'trading_agency' 
      ? 'Productivity benchmarking not applicable for agency contractor model'
      : clientType === 'investment_vehicle'
      ? 'Productivity benchmarking not relevant for investment vehicles'
      : clientType === 'funded_startup'
      ? 'Productivity benchmarking not applicable for early-stage funded startups'
      : 'Productivity benchmarking not applicable for this client type';
    
    console.log('[Productivity] Not applicable:', reason);
    return {
      status: 'not_applicable',
      notApplicableReason: reason,
      hasData: false
    };
  }
  
  // Check if we have required data
  if (!inputs.revenue || !inputs.employeeCount) {
    console.log('[Productivity] No data: Missing revenue or employee count');
    return {
      status: 'no_data',
      hasData: false,
      notApplicableReason: 'Missing required data: revenue or employee count'
    };
  }
  
  const { revenue, employeeCount, operatingProfit, staffCosts, contractorCountEstimate } = inputs;
  const now = new Date().toISOString();
  
  // For agencies, adjust headcount to include contractors
  const isAgency = clientType === 'trading_agency';
  const productiveHeadcount = isAgency && contractorCountEstimate 
    ? employeeCount + contractorCountEstimate
    : employeeCount;
  
  // Calculate revenue per head (or per productive head for agencies)
  const revenuePerHead = revenue / productiveHeadcount;
  const benchmarkLow = benchmark.revenuePerHead.low;
  const benchmarkTypical = benchmark.revenuePerHead.typical;
  const gap = revenuePerHead - benchmarkTypical;
  
  // Calculate implied headcount at benchmark
  const impliedHeadcount = Math.round(revenue / benchmarkTypical);
  const excessHeadcount = Math.max(0, employeeCount - impliedHeadcount);
  
  // Calculate profit per head (if available)
  const profitPerHead = operatingProfit ? operatingProfit / employeeCount : null;
  
  // Calculate revenue per payroll pound (if available)
  const revenuePerPayrollPound = staffCosts && staffCosts > 0 
    ? revenue / staffCosts 
    : null;
  
  // Status assessment
  const status = getRevenuePerHeadStatus(revenuePerHead, benchmark);
  
  // Build revenue per head metric
  const revenuePerHeadMetric: CalculatedMetric = {
    value: revenuePerHead,
    formatted: formatCurrency(revenuePerHead),
    benchmark: benchmarkTypical,
    benchmarkSource: `${benchmark.name} industry`,
    variance: gap,
    varianceFormatted: gap >= 0 
      ? `${formatCurrency(gap)} above benchmark` 
      : `${formatCurrency(Math.abs(gap))} below benchmark`,
    status: status === 'excellent' ? 'excellent' :
            status === 'good' ? 'good' :
            status === 'typical' ? 'neutral' : 'concern',
    direction: gap >= 0 ? 'above' : 'below',
    phrases: buildRevenuePerHeadPhrases(
      revenuePerHead, 
      benchmarkTypical, 
      gap, 
      benchmark.name,
      isAgency ? ` (per productive head: ${employeeCount} FT + ${contractorCountEstimate || 0} contractors)` : undefined
    ),
    calculation: {
      formula: isAgency ? `revenue / (employeeCount + contractorCountEstimate)` : 'revenue / employeeCount',
      inputs: isAgency ? { revenue, employeeCount, contractorCountEstimate, productiveHeadcount } : { revenue, employeeCount },
      timestamp: now
    }
  };
  
  // Build profit per head metric
  let profitPerHeadMetric: CalculatedMetric | null = null;
  if (profitPerHead !== null) {
    const profitBenchmark = 25000; // UK SME typical
    const profitGap = profitPerHead - profitBenchmark;
    
    profitPerHeadMetric = {
      value: profitPerHead,
      formatted: formatCurrency(profitPerHead),
      benchmark: profitBenchmark,
      benchmarkSource: 'UK SME typical',
      variance: profitGap,
      varianceFormatted: profitGap >= 0 
        ? `${formatCurrency(profitGap)} above benchmark` 
        : `${formatCurrency(Math.abs(profitGap))} below benchmark`,
      status: profitPerHead > 35000 ? 'excellent' :
              profitPerHead > 25000 ? 'good' :
              profitPerHead > 15000 ? 'neutral' : 'concern',
      direction: profitGap >= 0 ? 'above' : 'below',
      phrases: {
        headline: `Profit per head at ${formatCurrency(profitPerHead)}`,
        impact: profitGap < 0 
          ? `${formatCurrency(Math.abs(profitGap))} below typical per employee`
          : `${formatCurrency(profitGap)} above typical per employee`,
        context: `Compared to ${formatCurrency(profitBenchmark)} UK SME benchmark`
      },
      calculation: {
        formula: 'operatingProfit / employeeCount',
        inputs: { operatingProfit, employeeCount },
        timestamp: now
      }
    };
  }
  
  // Build revenue per payroll pound metric
  let revenuePerPayrollPoundMetric: CalculatedMetric | null = null;
  if (revenuePerPayrollPound !== null) {
    const payrollBenchmark = 3.50; // £3.50 revenue per £1 payroll
    const payrollGap = revenuePerPayrollPound - payrollBenchmark;
    
    revenuePerPayrollPoundMetric = {
      value: revenuePerPayrollPound,
      formatted: `£${revenuePerPayrollPound.toFixed(2)}`,
      benchmark: payrollBenchmark,
      benchmarkSource: 'Efficient SME benchmark',
      variance: payrollGap,
      varianceFormatted: payrollGap >= 0 
        ? `£${payrollGap.toFixed(2)} above benchmark` 
        : `£${Math.abs(payrollGap).toFixed(2)} below benchmark`,
      status: revenuePerPayrollPound > 4.0 ? 'excellent' :
              revenuePerPayrollPound > 3.5 ? 'good' :
              revenuePerPayrollPound > 3.0 ? 'neutral' : 'concern',
      direction: payrollGap >= 0 ? 'above' : 'below',
      phrases: {
        headline: `£${revenuePerPayrollPound.toFixed(2)} revenue per £1 of payroll`,
        impact: payrollGap < 0 
          ? `Below the £${payrollBenchmark.toFixed(2)} efficiency benchmark`
          : `Above the £${payrollBenchmark.toFixed(2)} efficiency benchmark`,
        context: `Target is £${payrollBenchmark.toFixed(2)}+ revenue per pound spent on staff`
      },
      calculation: {
        formula: 'revenue / staffCosts',
        inputs: { revenue, staffCosts: staffCosts || null },
        timestamp: now
      }
    };
  }
  
  // Build excess headcount metric
  const excessHeadcountMetric: CalculatedMetric = {
    value: excessHeadcount,
    formatted: `${excessHeadcount} employees`,
    benchmark: 0,
    benchmarkSource: 'Zero excess is target',
    variance: excessHeadcount,
    varianceFormatted: excessHeadcount > 0 
      ? `${excessHeadcount} more than benchmark suggests` 
      : 'Team size appropriate for revenue',
    status: excessHeadcount >= 3 ? 'critical' :
            excessHeadcount >= 2 ? 'concern' :
            excessHeadcount >= 1 ? 'neutral' : 'good',
    direction: excessHeadcount > 0 ? 'above' : 'at',
    phrases: buildExcessHeadcountPhrases(excessHeadcount, revenuePerHead, benchmarkTypical, employeeCount, impliedHeadcount),
    calculation: {
      formula: 'employeeCount - (revenue / benchmarkRevenuePerHead)',
      inputs: { employeeCount, revenue, benchmarkTypical },
      timestamp: now
    }
  };
  
  return {
    status: 'calculated',
    hasData: true,
    revenuePerHead: revenuePerHeadMetric,
    profitPerHead: profitPerHeadMetric,
    revenuePerPayrollPound: revenuePerPayrollPoundMetric,
    excessHeadcount: excessHeadcountMetric
  };
}

/**
 * Build revenue per head phrases
 */
function buildRevenuePerHeadPhrases(
  revenuePerHead: number,
  benchmark: number,
  gap: number,
  industryName: string,
  note?: string
): {
  headline: string;
  impact: string;
  context: string;
  comparison?: string;
  actionRequired?: string;
} {
  const formatted = formatCurrency(revenuePerHead);
  const benchmarkFormatted = formatCurrency(benchmark);
  
  const headline = note 
    ? `Revenue per productive head at ${formatted}${note}`
    : `Revenue per head at ${formatted}`;
  
  if (gap >= 0) {
    return {
      headline,
      impact: `${formatCurrency(gap)} above the ${benchmarkFormatted} benchmark`,
      context: `Team productivity is strong for ${industryName.toLowerCase()}${note ? ' (includes contractors)' : ''}`,
      comparison: `${formatted} vs the ${benchmarkFormatted} benchmark${note ? note : ''}`
    };
  }
  
  return {
    headline,
    impact: `${formatCurrency(Math.abs(gap))} below the ${benchmarkFormatted} benchmark`,
    context: `The team generates ${formatCurrency(Math.abs(gap))} less per person than industry standard${note ? ' (includes contractors)' : ''}`,
    comparison: `${formatted} vs the ${benchmarkFormatted} benchmark for ${industryName.toLowerCase()}${note ? note : ''}`,
    actionRequired: 'Improve productivity or right-size the team'
  };
}

/**
 * Build excess headcount phrases
 */
function buildExcessHeadcountPhrases(
  excessHeadcount: number,
  revenuePerHead: number,
  benchmark: number,
  actual: number,
  implied: number
): {
  headline: string;
  impact: string;
  context: string;
  comparison?: string;
  actionRequired?: string;
} {
  if (excessHeadcount <= 0) {
    return {
      headline: 'Team size appropriate for revenue',
      impact: 'No productivity gap identified',
      context: `${actual} employees generating ${formatCurrency(revenuePerHead)} each - at or above benchmark`
    };
  }
  
  return {
    headline: `Approximately ${excessHeadcount} excess employees`,
    impact: `Based on revenue per head comparison`,
    context: `${actual} employees at ${formatCurrency(revenuePerHead)}/head vs ${implied} at benchmark ${formatCurrency(benchmark)}/head`,
    comparison: `${actual} actual vs ${implied} implied by benchmark`,
    actionRequired: 'This independently validates the payroll excess finding'
  };
}

/**
 * Build productivity gap phrase for narrative blocks
 */
export function buildProductivityGapPhrase(
  productivity: ProductivityMetrics
): {
  title: string;
  pattern: string;
  financialImpact: string;
  timeImpact: string;
  emotionalImpact: string;
  shiftRequired: string;
} | null {
  const excessHeadcount = productivity.excessHeadcount.value || 0;
  if (excessHeadcount < 1) return null;
  
  return {
    title: `Revenue Per Head Suggests ${excessHeadcount} Excess Employees`,
    pattern: 'Productivity below industry benchmark',
    financialImpact: productivity.revenuePerHead.phrases.impact,
    timeImpact: 'This independently validates the payroll finding from a different angle',
    emotionalImpact: 'The numbers don\'t lie - the team is larger than the revenue supports',
    shiftRequired: productivity.excessHeadcount.phrases.actionRequired || 'Address before exit'
  };
}
