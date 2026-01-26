// ============================================================================
// PAYROLL METRICS CALCULATOR
// ============================================================================
// Calculates payroll efficiency metrics with pre-built phrases for Pass 2
// ============================================================================

import { 
  PayrollMetrics, 
  CalculatedMetric,
  formatCurrency,
  formatPercent 
} from '../types/pass1-output.ts';

import { IndustryBenchmark, getPayrollStatus } from '../benchmarks/industry-benchmarks.ts';

export interface PayrollInputs {
  turnover: number;
  staffCosts: number;
  grossProfit?: number;
  directorSalary?: number;
  employeeCount?: number;
}

/**
 * Calculate comprehensive payroll metrics with pre-built phrases
 */
export function calculatePayrollMetrics(
  inputs: PayrollInputs,
  benchmark: IndustryBenchmark
): PayrollMetrics {
  const { turnover, staffCosts, grossProfit, directorSalary } = inputs;
  const now = new Date().toISOString();
  
  // Core calculation
  const staffCostsPct = (staffCosts / turnover) * 100;
  const excessPct = Math.max(0, staffCostsPct - benchmark.payroll.good);
  const annualExcess = Math.round((excessPct / 100) * turnover);
  const monthlyExcess = Math.round(annualExcess / 12);
  const twoYearExcess = annualExcess * 2;
  
  const assessment = getPayrollStatus(staffCostsPct, benchmark);
  const isOverstaffed = staffCostsPct > benchmark.payroll.good;
  
  // Build staff costs percent metric
  const staffCostsPercentMetric: CalculatedMetric = {
    value: staffCostsPct,
    formatted: formatPercent(staffCostsPct),
    benchmark: benchmark.payroll.good,
    benchmarkSource: `${benchmark.name} industry`,
    variance: staffCostsPct - benchmark.payroll.good,
    varianceFormatted: excessPct > 0 ? `${excessPct.toFixed(1)}% above` : 'Within benchmark',
    status: mapAssessmentToStatus(assessment),
    direction: staffCostsPct > benchmark.payroll.good ? 'above' : 
               staffCostsPct < benchmark.payroll.good ? 'below' : 'at',
    phrases: {
      headline: `Payroll at ${formatPercent(staffCostsPct)} of revenue`,
      impact: isOverstaffed 
        ? `${formatCurrency(annualExcess)}/year excess - staff costs at ${formatPercent(staffCostsPct)} vs the ${benchmark.payroll.good}% benchmark`
        : `Staff costs within benchmark at ${formatPercent(staffCostsPct)}`,
      context: `Staff costs are ${excessPct > 0 ? excessPct.toFixed(1) + '% above' : 'within'} the ${benchmark.payroll.good}% industry benchmark for ${benchmark.name.toLowerCase()}`,
      comparison: `${formatPercent(staffCostsPct)} vs the ${benchmark.payroll.good}% benchmark for ${benchmark.name.toLowerCase()}`,
      monthlyImpact: isOverstaffed ? `${formatCurrency(monthlyExcess)} walks out the door every month` : undefined,
      yearlyImpact: isOverstaffed ? `${formatCurrency(annualExcess)}/year that could be profit or sale price` : undefined,
      twoYearImpact: isOverstaffed ? `${formatCurrency(twoYearExcess)} over the next two years` : undefined,
      actionRequired: isOverstaffed ? 'Right-size the team before a buyer does it for you' : undefined
    },
    calculation: {
      formula: '(staffCosts / turnover) × 100',
      inputs: { staffCosts, turnover },
      timestamp: now
    }
  };
  
  // Build annual excess metric
  const annualExcessMetric: CalculatedMetric = {
    value: annualExcess,
    formatted: formatCurrency(annualExcess),
    benchmark: 0,
    benchmarkSource: 'Zero excess is target',
    variance: annualExcess,
    varianceFormatted: formatCurrency(annualExcess),
    status: annualExcess > 100000 ? 'critical' : 
            annualExcess > 50000 ? 'concern' : 
            annualExcess > 0 ? 'neutral' : 'good',
    direction: annualExcess > 0 ? 'above' : 'at',
    phrases: {
      headline: `${formatCurrency(annualExcess)}/year payroll excess`,
      impact: `${formatCurrency(annualExcess)}/year excess - staff costs at ${formatPercent(staffCostsPct)} vs the ${benchmark.payroll.good}% benchmark`,
      context: `The gap between your ${formatPercent(staffCostsPct)} and the ${benchmark.payroll.good}% benchmark equals ${formatCurrency(annualExcess)} annually`,
      monthlyImpact: `${formatCurrency(monthlyExcess)} walks out the door every month`,
      yearlyImpact: `${formatCurrency(annualExcess)}/year that could be profit`,
      twoYearImpact: `${formatCurrency(twoYearExcess)} over the next two years`,
      comparison: `${formatCurrency(annualExcess)}/year excess on ${formatCurrency(turnover)} turnover`,
      actionRequired: 'Address this before exit to maximise valuation'
    },
    calculation: {
      formula: '((staffCostsPct - benchmarkGood) / 100) × turnover',
      inputs: { staffCostsPct, benchmarkGood: benchmark.payroll.good, turnover },
      timestamp: now
    }
  };
  
  // Build monthly excess metric
  const monthlyExcessMetric: CalculatedMetric = {
    value: monthlyExcess,
    formatted: formatCurrency(monthlyExcess),
    benchmark: 0,
    benchmarkSource: 'Zero excess is target',
    variance: monthlyExcess,
    varianceFormatted: formatCurrency(monthlyExcess),
    status: monthlyExcess > 10000 ? 'critical' : 
            monthlyExcess > 5000 ? 'concern' : 
            monthlyExcess > 0 ? 'neutral' : 'good',
    direction: monthlyExcess > 0 ? 'above' : 'at',
    phrases: {
      headline: `${formatCurrency(monthlyExcess)}/month payroll excess`,
      impact: `${formatCurrency(monthlyExcess)} walks out the door every month`,
      context: `Every month you wait costs another ${formatCurrency(monthlyExcess)}`,
    },
    calculation: {
      formula: 'annualExcess / 12',
      inputs: { annualExcess },
      timestamp: now
    }
  };
  
  // Build two-year excess metric
  const twoYearExcessMetric: CalculatedMetric = {
    value: twoYearExcess,
    formatted: formatCurrency(twoYearExcess),
    benchmark: 0,
    benchmarkSource: 'Zero excess is target',
    variance: twoYearExcess,
    varianceFormatted: formatCurrency(twoYearExcess),
    status: twoYearExcess > 200000 ? 'critical' : 
            twoYearExcess > 100000 ? 'concern' : 
            twoYearExcess > 0 ? 'neutral' : 'good',
    direction: twoYearExcess > 0 ? 'above' : 'at',
    phrases: {
      headline: `${formatCurrency(twoYearExcess)} payroll excess over two years`,
      impact: `${formatCurrency(twoYearExcess)} over the next two years`,
      context: `If you wait two years to address payroll, you'll have burned through ${formatCurrency(twoYearExcess)}`,
    },
    calculation: {
      formula: 'annualExcess × 2',
      inputs: { annualExcess },
      timestamp: now
    }
  };
  
  // Build director compensation metric (if available)
  let directorCompensationMetric: CalculatedMetric | null = null;
  if (directorSalary) {
    const typicalDirectorSalary = 75000; // UK average
    const directorVariance = directorSalary - typicalDirectorSalary;
    
    directorCompensationMetric = {
      value: directorSalary,
      formatted: formatCurrency(directorSalary),
      benchmark: typicalDirectorSalary,
      benchmarkSource: 'UK SME typical director salary',
      variance: directorVariance,
      varianceFormatted: directorVariance > 0 
        ? `${formatCurrency(directorVariance)} above typical` 
        : `${formatCurrency(Math.abs(directorVariance))} below typical`,
      status: directorVariance > 30000 ? 'concern' : 
              directorVariance > 10000 ? 'neutral' : 'good',
      direction: directorVariance > 0 ? 'above' : 'below',
      phrases: {
        headline: `Director compensation at ${formatCurrency(directorSalary)}`,
        impact: directorVariance > 10000 
          ? `${formatCurrency(directorVariance)} above typical - may need normalising for valuation`
          : 'Director salary within typical range',
        context: `Compared to ${formatCurrency(typicalDirectorSalary)} typical for UK SME directors`,
      },
      calculation: {
        formula: 'Direct extraction from accounts',
        inputs: { directorSalary, typicalDirectorSalary },
        timestamp: now
      }
    };
  }
  
  // Build staff costs as % of gross profit (if available)
  let staffCostsAsPercentOfGrossProfitMetric: CalculatedMetric | null = null;
  if (grossProfit && grossProfit > 0) {
    const staffPctOfGross = (staffCosts / grossProfit) * 100;
    const benchmarkPctOfGross = 55; // Typical healthy target
    
    staffCostsAsPercentOfGrossProfitMetric = {
      value: staffPctOfGross,
      formatted: formatPercent(staffPctOfGross),
      benchmark: benchmarkPctOfGross,
      benchmarkSource: 'Healthy SME target',
      variance: staffPctOfGross - benchmarkPctOfGross,
      varianceFormatted: staffPctOfGross > benchmarkPctOfGross
        ? `${(staffPctOfGross - benchmarkPctOfGross).toFixed(1)}% above target`
        : 'Within target',
      status: staffPctOfGross > 70 ? 'critical' :
              staffPctOfGross > 60 ? 'concern' :
              staffPctOfGross > 50 ? 'neutral' : 'good',
      direction: staffPctOfGross > benchmarkPctOfGross ? 'above' : 'below',
      phrases: {
        headline: `Staff costs consuming ${formatPercent(staffPctOfGross)} of gross profit`,
        impact: staffPctOfGross > 60 
          ? 'High proportion of margin going to payroll'
          : 'Healthy proportion of margin to payroll',
        context: `Target is below ${benchmarkPctOfGross}% - yours is ${formatPercent(staffPctOfGross)}`,
      },
      calculation: {
        formula: '(staffCosts / grossProfit) × 100',
        inputs: { staffCosts, grossProfit },
        timestamp: now
      }
    };
  }
  
  return {
    staffCostsPercent: staffCostsPercentMetric,
    annualExcess: annualExcessMetric,
    monthlyExcess: monthlyExcessMetric,
    twoYearExcess: twoYearExcessMetric,
    directorCompensation: directorCompensationMetric,
    staffCostsAsPercentOfGrossProfit: staffCostsAsPercentOfGrossProfitMetric,
    summary: {
      isOverstaffed,
      excessPercentage: excessPct,
      assessment,
      benchmark: {
        good: benchmark.payroll.good,
        typical: benchmark.payroll.typical,
        concern: benchmark.payroll.concern,
        source: `${benchmark.name} industry benchmarks`
      }
    }
  };
}

/**
 * Map assessment string to status
 */
function mapAssessmentToStatus(
  assessment: 'efficient' | 'typical' | 'elevated' | 'concerning'
): 'excellent' | 'good' | 'neutral' | 'concern' | 'critical' {
  switch (assessment) {
    case 'efficient': return 'excellent';
    case 'typical': return 'good';
    case 'elevated': return 'concern';
    case 'concerning': return 'critical';
    default: return 'neutral';
  }
}

/**
 * Build payroll gap phrase for narrative blocks
 */
export function buildPayrollGapPhrase(
  payroll: PayrollMetrics,
  clientQuote?: string
): {
  title: string;
  pattern: string;
  financialImpact: string;
  timeImpact: string;
  emotionalImpact: string;
  shiftRequired: string;
} | null {
  if (!payroll.summary.isOverstaffed) return null;
  
  const annualK = Math.round((payroll.annualExcess.value || 0) / 1000);
  const monthlyK = Math.round((payroll.monthlyExcess.value || 0) / 1000);
  
  return {
    title: `£${annualK}k Walking Out The Door Every Year`,
    pattern: clientQuote || 'Payroll has grown faster than revenue',
    financialImpact: payroll.annualExcess.phrases.impact,
    timeImpact: `Every month this continues, £${monthlyK}k walks out the door`,
    emotionalImpact: 'This is money that could be in your pocket - or on the sale price',
    shiftRequired: payroll.staffCostsPercent.phrases.actionRequired || 'Right-size the team before exit'
  };
}

