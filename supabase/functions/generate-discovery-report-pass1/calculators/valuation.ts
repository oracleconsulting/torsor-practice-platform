// ============================================================================
// VALUATION METRICS CALCULATOR
// ============================================================================
// Calculates indicative valuation with pre-built phrases for Pass 2
// ============================================================================

import { 
  ValuationMetrics, 
  CalculatedMetric,
  formatCurrency,
  formatPercent 
} from '../types/pass1-output.ts';

import { IndustryBenchmark } from '../benchmarks/industry-benchmarks.ts';

export interface ValuationInputs {
  operatingProfit: number | null;
  ebitda?: number | null;
  depreciation?: number;
  amortisation?: number;
  netAssets?: number | null;
  directorSalary?: number;
  normalizedDirectorSalary?: number;
  turnover?: number;
  isMarketLeader?: boolean;
  hasRecurringRevenue?: boolean;
  founderDependencyLow?: boolean;
  trajectoryDeclining?: boolean;
  hiddenAssetsTotal?: number;
}

export interface ValuationAdjustment {
  factor: string;
  impact: number;  // +/- to multiple
  reason: string;
}

/**
 * Calculate comprehensive valuation metrics with pre-built phrases
 */
export function calculateValuationMetrics(
  inputs: ValuationInputs,
  benchmark: IndustryBenchmark
): ValuationMetrics | null {
  const { 
    operatingProfit, 
    ebitda, 
    depreciation = 0,
    amortisation = 0,
    directorSalary,
    normalizedDirectorSalary = 75000,
    isMarketLeader,
    hasRecurringRevenue,
    founderDependencyLow,
    trajectoryDeclining,
    hiddenAssetsTotal = 0
  } = inputs;
  
  // Need at least operating profit or EBITDA
  if (!operatingProfit && !ebitda) return null;
  
  const now = new Date().toISOString();
  
  // Calculate EBITDA if not provided
  const calculatedEbitda = ebitda || (operatingProfit || 0) + depreciation + amortisation;
  
  // Normalize director salary if applicable
  const salaryAdjustment = directorSalary && directorSalary > normalizedDirectorSalary
    ? directorSalary - normalizedDirectorSalary
    : 0;
  
  const adjustedEbitda = calculatedEbitda + salaryAdjustment;
  
  // Build adjustments
  const adjustments: ValuationAdjustment[] = [];
  let multipleDelta = 0;
  
  if (isMarketLeader) {
    adjustments.push({ factor: 'Market Leader', impact: 0.5, reason: 'Clear market position adds premium' });
    multipleDelta += 0.5;
  }
  
  if (hasRecurringRevenue) {
    adjustments.push({ factor: 'Recurring Revenue', impact: 0.5, reason: 'Predictable income stream' });
    multipleDelta += 0.5;
  }
  
  if (founderDependencyLow) {
    adjustments.push({ factor: 'Low Founder Dependency', impact: 0.5, reason: 'Business runs without owner' });
    multipleDelta += 0.5;
  }
  
  if (trajectoryDeclining) {
    adjustments.push({ factor: 'Declining Revenue', impact: -0.5, reason: 'Growth concerns for buyers' });
    multipleDelta -= 0.5;
  }
  
  // Calculate adjusted multiples
  const baseLow = benchmark.ebitdaMultiple.low;
  const baseHigh = benchmark.ebitdaMultiple.high;
  const adjustedLow = Math.max(2.0, baseLow + multipleDelta);
  const adjustedHigh = Math.max(2.5, baseHigh + multipleDelta);
  
  // Calculate values
  const earningsLow = Math.round(adjustedEbitda * adjustedLow);
  const earningsHigh = Math.round(adjustedEbitda * adjustedHigh);
  const enterpriseLow = earningsLow + hiddenAssetsTotal;
  const enterpriseHigh = earningsHigh + hiddenAssetsTotal;
  
  // Format for display
  const earningsFormatted = `${formatCurrency(earningsLow)}-${formatCurrency(earningsHigh)}`;
  const enterpriseFormatted = `${formatCurrency(enterpriseLow)}-${formatCurrency(enterpriseHigh)}`;
  const adjustedEbitdaFormatted = formatCurrency(adjustedEbitda);
  
  // Build adjusted EBITDA metric
  const adjustedEbitdaMetric: CalculatedMetric = {
    value: adjustedEbitda,
    formatted: adjustedEbitdaFormatted,
    benchmark: null,
    benchmarkSource: 'N/A',
    variance: salaryAdjustment,
    varianceFormatted: salaryAdjustment > 0 
      ? `+${formatCurrency(salaryAdjustment)} after normalising director salary`
      : 'No normalisation needed',
    status: adjustedEbitda > 500000 ? 'excellent' :
            adjustedEbitda > 250000 ? 'good' :
            adjustedEbitda > 100000 ? 'neutral' : 'concern',
    direction: null,
    phrases: {
      headline: `Adjusted EBITDA of ${adjustedEbitdaFormatted}`,
      impact: `This is the earnings figure buyers will focus on`,
      context: salaryAdjustment > 0 
        ? `After normalising director salary (+${formatCurrency(salaryAdjustment)})`
        : 'No adjustments required',
    },
    calculation: {
      formula: 'EBITDA + director salary normalisation',
      inputs: { 
        ebitda: calculatedEbitda, 
        salaryAdjustment,
        directorSalary: directorSalary || null,
        normalizedDirectorSalary 
      },
      timestamp: now
    }
  };
  
  // Build operating profit metric (if available)
  let operatingProfitMetric: CalculatedMetric | null = null;
  if (operatingProfit) {
    operatingProfitMetric = {
      value: operatingProfit,
      formatted: formatCurrency(operatingProfit),
      benchmark: null,
      benchmarkSource: 'N/A',
      variance: null,
      varianceFormatted: '',
      status: operatingProfit > 500000 ? 'excellent' :
              operatingProfit > 250000 ? 'good' :
              operatingProfit > 100000 ? 'neutral' : 'concern',
      direction: null,
      phrases: {
        headline: `Operating profit of ${formatCurrency(operatingProfit)}`,
        impact: `This demonstrates the earning power of the business`,
        context: '',
      },
      calculation: {
        formula: 'Extracted from accounts',
        inputs: { operatingProfit },
        timestamp: now
      }
    };
  }
  
  // Build multiple range
  const multipleRange = {
    low: adjustedLow,
    high: adjustedHigh,
    basis: `${benchmark.name} sector, adjusted for business characteristics`,
    adjustments: adjustments,
    phrases: {
      headline: `Multiple range: ${adjustedLow.toFixed(1)}-${adjustedHigh.toFixed(1)}x EBITDA`,
      context: `Based on ${benchmark.name.toLowerCase()} sector${adjustments.length > 0 ? ', adjusted for ' + adjustments.map(a => a.factor.toLowerCase()).join(', ') : ''}`
    }
  };
  
  // Build earnings-based value
  const earningsBasedValue = {
    low: earningsLow,
    high: earningsHigh,
    formatted: earningsFormatted,
    phrases: {
      headline: `Earnings-based value: ${earningsFormatted}`,
      impact: `Based on ${adjustedEbitdaFormatted} adjusted EBITDA at ${adjustedLow.toFixed(1)}-${adjustedHigh.toFixed(1)}x`,
      context: `This is the value a buyer would pay for the trading business`
    }
  };
  
  // Build enterprise value
  const enterpriseValue = {
    low: enterpriseLow,
    high: enterpriseHigh,
    formatted: enterpriseFormatted,
    includesHiddenAssets: hiddenAssetsTotal > 0,
    phrases: {
      headline: `Indicative enterprise value: ${enterpriseFormatted}`,
      impact: `This is what you could walk away with`,
      context: hiddenAssetsTotal > 0 
        ? `Includes ${formatCurrency(hiddenAssetsTotal)} of hidden assets (property, excess cash)`
        : 'Based purely on earnings multiple'
    }
  };
  
  return {
    adjustedEbitda: adjustedEbitdaMetric,
    operatingProfit: operatingProfitMetric,
    multipleRange,
    earningsBasedValue,
    enterpriseValue,
    pricePerShare: null // Calculate if share count available
  };
}

/**
 * Build valuation gap phrase for narrative blocks
 */
export function buildValuationGapPhrase(
  valuation: ValuationMetrics | null,
  hasBaseline: boolean
): {
  title: string;
  pattern: string;
  financialImpact: string;
  timeImpact: string;
  emotionalImpact: string;
  shiftRequired: string;
} | null {
  if (hasBaseline) return null; // No gap if they already have a valuation baseline
  
  const range = valuation?.enterpriseValue.formatted || 'Unknown';
  const multipleRange = valuation 
    ? `${valuation.multipleRange.low.toFixed(1)}-${valuation.multipleRange.high.toFixed(1)}x`
    : 'Unknown';
  
  return {
    title: `You Don't Know What It's Worth`,
    pattern: 'No baseline valuation to negotiate from',
    financialImpact: valuation 
      ? `Indicative range: ${range} - but you need a proper baseline`
      : 'Cannot estimate without financial data',
    timeImpact: `The difference between a ${multipleRange} multiple could be hundreds of thousands`,
    emotionalImpact: 'Walking into a negotiation blind is the most expensive mistake',
    shiftRequired: 'Get a baseline valuation before entertaining any offers'
  };
}

/**
 * Extract valuation signals from assessment responses
 */
export function extractValuationSignals(
  responses: Record<string, any>
): {
  isMarketLeader: boolean;
  hasRecurringRevenue: boolean;
  founderDependencyLow: boolean;
  exitMindset: string | null;
} {
  const allText = JSON.stringify(responses).toLowerCase();
  
  return {
    isMarketLeader: allText.includes('market leader') || 
                    allText.includes('we are the') ||
                    allText.includes('leading') ||
                    allText.includes('dominant'),
    hasRecurringRevenue: allText.includes('recurring') || 
                         allText.includes('subscription') ||
                         allText.includes('repeat customer'),
    founderDependencyLow: allText.includes('runs without') ||
                          allText.includes('ticks along') ||
                          allText.includes('team handles') ||
                          allText.includes('under 30 hours'),
    exitMindset: responses.dd_exit_mindset || 
                 responses.sd_exit_timeline || 
                 null
  };
}
