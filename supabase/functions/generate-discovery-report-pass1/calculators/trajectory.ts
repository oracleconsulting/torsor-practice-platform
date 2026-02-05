// ============================================================================
// TRAJECTORY METRICS CALCULATOR
// ============================================================================
// Calculates revenue trajectory with pre-built phrases for Pass 2
// ============================================================================

import { 
  TrajectoryMetrics, 
  CalculatedMetric,
  formatCurrency,
  formatPercent 
} from '../types/pass1-output.ts';

export interface TrajectoryInputs {
  currentRevenue: number;
  priorRevenue?: number | null;
  twoYearsAgoRevenue?: number | null;
  threeYearsAgoRevenue?: number | null;
  currentProfit?: number | null;
  priorProfit?: number | null;
  ownerPerception?: string;
  marketContext?: string;
}

/**
 * Calculate comprehensive trajectory metrics with pre-built phrases
 */
export function calculateTrajectoryMetrics(
  inputs: TrajectoryInputs
): TrajectoryMetrics {
  const { 
    currentRevenue, 
    priorRevenue,
    threeYearsAgoRevenue,
    currentProfit,
    priorProfit,
    ownerPerception,
    marketContext
  } = inputs;
  
  const now = new Date().toISOString();
  
  // Calculate YoY change
  let yoyChange: number | null = null;
  let yoyAbsolute: number | null = null;
  let trend: 'growing' | 'stable' | 'declining' | 'volatile' | 'unknown' = 'unknown';
  
  if (priorRevenue && priorRevenue > 0) {
    yoyAbsolute = currentRevenue - priorRevenue;
    yoyChange = (yoyAbsolute / priorRevenue) * 100;
    
    if (yoyChange > 5) trend = 'growing';
    else if (yoyChange < -3) trend = 'declining';
    else trend = 'stable';
  }
  
  // Calculate 3-year change
  let threeYearChange: number | null = null;
  let cagr: number | null = null;
  
  if (threeYearsAgoRevenue && threeYearsAgoRevenue > 0) {
    const threeYearAbsolute = currentRevenue - threeYearsAgoRevenue;
    threeYearChange = (threeYearAbsolute / threeYearsAgoRevenue) * 100;
    cagr = (Math.pow(currentRevenue / threeYearsAgoRevenue, 1/3) - 1) * 100;
  }
  
  // Calculate profit change (if available)
  let profitChange: number | null = null;
  if (currentProfit && priorProfit && priorProfit !== 0) {
    profitChange = ((currentProfit - priorProfit) / Math.abs(priorProfit)) * 100;
  }
  
  // Determine confidence and implication
  const hasYoY = yoyChange !== null;
  const confidence = hasYoY ? (threeYearsAgoRevenue ? 90 : 70) : 30;
  
  let implication = '';
  if (trend === 'declining') {
    implication = 'Declining revenue = declining valuation multiple. Buyers pay less for shrinking businesses.';
  } else if (trend === 'growing') {
    implication = 'Growth attracts premium valuations. Momentum matters in a sale.';
  } else if (trend === 'stable') {
    implication = 'Stable revenue is neutral. Neither premium nor discount.';
  }
  
  // Build YoY metric
  const revenueGrowthYoY: CalculatedMetric = {
    value: yoyChange,
    formatted: yoyChange !== null ? formatPercent(yoyChange) : 'Unknown',
    benchmark: 5, // Healthy growth target
    benchmarkSource: 'SME healthy growth benchmark',
    variance: yoyChange !== null ? yoyChange - 5 : null,
    varianceFormatted: yoyChange !== null 
      ? (yoyChange >= 5 ? 'Meeting growth target' : `${(5 - yoyChange).toFixed(1)}% below growth target`)
      : 'No prior year data',
    status: yoyChange === null ? 'neutral' :
            yoyChange > 10 ? 'excellent' :
            yoyChange > 5 ? 'good' :
            yoyChange > 0 ? 'neutral' :
            yoyChange > -5 ? 'concern' : 'critical',
    direction: yoyChange === null ? null :
               yoyChange > 0 ? 'above' : 'below',
    phrases: buildYoYPhrases(yoyChange, yoyAbsolute, trend),
    calculation: {
      formula: '((currentRevenue - priorRevenue) / priorRevenue) × 100',
      inputs: { currentRevenue, priorRevenue: priorRevenue || null },
      timestamp: now
    }
  };
  
  // Build 3-year metric
  let revenueGrowth3Year: CalculatedMetric | null = null;
  if (threeYearChange !== null) {
    revenueGrowth3Year = {
      value: threeYearChange,
      formatted: formatPercent(threeYearChange),
      benchmark: 15, // 5% per year target
      benchmarkSource: '3-year growth benchmark',
      variance: threeYearChange - 15,
      varianceFormatted: threeYearChange >= 15 
        ? 'On track for healthy growth' 
        : `${(15 - threeYearChange).toFixed(1)}% below 3-year target`,
      status: threeYearChange > 20 ? 'excellent' :
              threeYearChange > 10 ? 'good' :
              threeYearChange > 0 ? 'neutral' :
              threeYearChange > -10 ? 'concern' : 'critical',
      direction: threeYearChange > 0 ? 'above' : 'below',
      phrases: {
        headline: `Revenue ${threeYearChange >= 0 ? 'up' : 'down'} ${Math.abs(threeYearChange).toFixed(1)}% over 3 years`,
        impact: cagr !== null ? `CAGR of ${cagr >= 0 ? '+' : ''}${cagr.toFixed(1)}%` : '',
        context: `Longer-term trend ${threeYearChange >= 0 ? 'supports' : 'undermines'} valuation`
      },
      calculation: {
        formula: '((currentRevenue - threeYearsAgoRevenue) / threeYearsAgoRevenue) × 100',
        inputs: { currentRevenue, threeYearsAgoRevenue },
        timestamp: now
      }
    };
  }
  
  // Build profit growth metric
  let profitGrowthYoY: CalculatedMetric | null = null;
  if (profitChange !== null && currentProfit !== null && priorProfit !== null) {
    const profitAbsolute = currentProfit - priorProfit;
    
    profitGrowthYoY = {
      value: profitChange,
      formatted: formatPercent(profitChange),
      benchmark: 5,
      benchmarkSource: 'Healthy profit growth',
      variance: profitChange - 5,
      varianceFormatted: profitChange >= 5 
        ? 'Meeting profit growth target' 
        : `${(5 - profitChange).toFixed(1)}% below target`,
      status: profitChange > 10 ? 'excellent' :
              profitChange > 5 ? 'good' :
              profitChange > 0 ? 'neutral' :
              profitChange > -10 ? 'concern' : 'critical',
      direction: profitChange > 0 ? 'above' : 'below',
      phrases: {
        headline: `Operating profit ${profitChange >= 0 ? 'up' : 'down'} ${Math.abs(profitChange).toFixed(1)}% year-on-year`,
        impact: `${formatCurrency(profitAbsolute)} ${profitChange >= 0 ? 'increase' : 'decrease'} from prior year`,
        context: profitChange < 0 ? 'Profit decline is a red flag for buyers' : 'Profit growth supports valuation'
      },
      calculation: {
        formula: '((currentProfit - priorProfit) / |priorProfit|) × 100',
        inputs: { currentProfit, priorProfit },
        timestamp: now
      }
    };
  }
  
  // Build trend summary
  const trendSummary = {
    classification: trend,
    confidence,
    phrases: {
      headline: buildTrendHeadline(trend, yoyChange, yoyAbsolute),
      context: buildTrendContext(trend, yoyChange, priorRevenue !== null),
      implication
    }
  };
  
  // Build projected trajectory (simple linear projection)
  let projectedTrajectory: TrajectoryMetrics['projectedTrajectory'] = null;
  if (yoyChange !== null) {
    const oneYear = Math.round(currentRevenue * (1 + yoyChange / 100));
    const twoYear = Math.round(oneYear * (1 + yoyChange / 100));
    
    projectedTrajectory = {
      oneYear,
      twoYear,
      phrases: {
        headline: `At current trajectory, revenue will be ${formatCurrency(twoYear)} in 2 years`
      }
    };
  }
  
  return {
    status: 'calculated',
    hasData: true,
    revenueGrowthYoY,
    revenueGrowth3Year,
    profitGrowthYoY,
    trend: trendSummary,
    projectedTrajectory
  };
}

/**
 * Build YoY phrases
 */
function buildYoYPhrases(
  yoyChange: number | null,
  yoyAbsolute: number | null,
  trend: string
): {
  headline: string;
  impact: string;
  context: string;
  monthlyImpact?: string;
  yearlyImpact?: string;
  twoYearImpact?: string;
  comparison?: string;
  actionRequired?: string;
} {
  if (yoyChange === null) {
    return {
      headline: 'Revenue trend unknown',
      impact: 'No prior year data available for comparison',
      context: 'Unable to assess trajectory without historical data'
    };
  }
  
  const direction = yoyChange >= 0 ? 'up' : 'down';
  const absChange = Math.abs(yoyChange);
  const absAbsolute = yoyAbsolute !== null ? Math.abs(yoyAbsolute) : 0;
  
  if (trend === 'declining') {
    return {
      headline: `Revenue down ${absChange.toFixed(1)}% year-on-year`,
      impact: `${formatCurrency(absAbsolute)} decline from prior year`,
      context: 'Core business in decline - this affects buyer confidence',
      yearlyImpact: `${formatCurrency(absAbsolute)} less revenue this year`,
      twoYearImpact: `At this rate, £${Math.round(absAbsolute * 2 / 1000)}k less revenue over 2 years`,
      actionRequired: 'Stabilise revenue before exit or accept lower multiple'
    };
  }
  
  if (trend === 'growing') {
    return {
      headline: `Revenue up ${absChange.toFixed(1)}% year-on-year`,
      impact: `${formatCurrency(absAbsolute)} increase from prior year`,
      context: 'Growth trajectory supports premium valuation',
      yearlyImpact: `${formatCurrency(absAbsolute)} more revenue this year`,
    };
  }
  
  return {
    headline: `Revenue ${direction} ${absChange.toFixed(1)}% year-on-year`,
    impact: yoyAbsolute !== null ? `${formatCurrency(yoyAbsolute)} ${direction === 'up' ? 'increase' : 'decrease'}` : '',
    context: 'Revenue broadly stable year-on-year'
  };
}

/**
 * Build trend headline
 */
function buildTrendHeadline(
  trend: string,
  yoyChange: number | null,
  yoyAbsolute: number | null
): string {
  if (yoyChange === null) return 'Revenue trend: Unknown';
  
  const absChange = Math.abs(yoyChange);
  
  switch (trend) {
    case 'growing':
      return `Revenue growing at ${absChange.toFixed(1)}% per year`;
    case 'declining':
      return `Revenue in slow decline (down ${absChange.toFixed(1)}%)`;
    case 'stable':
      return `Revenue broadly stable (${yoyChange >= 0 ? '+' : ''}${yoyChange.toFixed(1)}%)`;
    default:
      return 'Revenue trend unclear';
  }
}

/**
 * Build trend context
 */
function buildTrendContext(
  trend: string,
  yoyChange: number | null,
  hasPriorYear: boolean
): string {
  if (!hasPriorYear) return 'No prior year data available for trend analysis';
  
  switch (trend) {
    case 'growing':
      return 'Growth trajectory supports valuation - maintain momentum into sale';
    case 'declining':
      return 'Declining revenue reduces buyer confidence and valuation multiple';
    case 'stable':
      return 'Stable revenue is neutral for valuation - neither premium nor discount';
    default:
      return 'Trend assessment requires more historical data';
  }
}

/**
 * Build trajectory gap phrase for narrative blocks
 */
export function buildTrajectoryGapPhrase(
  trajectory: TrajectoryMetrics
): {
  title: string;
  pattern: string;
  financialImpact: string;
  timeImpact: string;
  emotionalImpact: string;
  shiftRequired: string;
} | null {
  if (trajectory.trend.classification !== 'declining') return null;
  
  const yoyChange = trajectory.revenueGrowthYoY.value;
  const yoyFormatted = yoyChange !== null ? Math.abs(yoyChange).toFixed(1) : '?';
  
  return {
    title: `Revenue Sliding ${yoyFormatted}% Year-on-Year`,
    pattern: 'Core business is shrinking',
    financialImpact: trajectory.revenueGrowthYoY.phrases.impact,
    timeImpact: 'Every year of decline reduces your eventual sale price',
    emotionalImpact: 'Buyers discount declining businesses - the clock is ticking',
    shiftRequired: 'Stabilise or explain the decline before going to market'
  };
}
