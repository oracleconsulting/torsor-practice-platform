// ============================================================================
// PROFITABILITY METRICS CALCULATOR
// ============================================================================
// Calculates profitability metrics with pre-built phrases for Pass 2
// ============================================================================

import { 
  ProfitabilityMetrics, 
  CalculatedMetric,
  formatCurrency,
  formatPercent 
} from '../types/pass1-output.ts';

import { IndustryBenchmark, getGrossMarginStatus } from '../benchmarks/industry-benchmarks.ts';

export interface ProfitabilityInputs {
  turnover: number;
  grossProfit?: number | null;
  operatingProfit?: number | null;
  netProfit?: number | null;
  ebitda?: number | null;
  depreciation?: number;
  amortisation?: number;
}

/**
 * Calculate comprehensive profitability metrics with pre-built phrases
 */
export function calculateProfitabilityMetrics(
  inputs: ProfitabilityInputs,
  benchmark: IndustryBenchmark
): ProfitabilityMetrics {
  const { 
    turnover, 
    grossProfit, 
    operatingProfit, 
    netProfit, 
    ebitda,
    depreciation = 0,
    amortisation = 0
  } = inputs;
  
  const now = new Date().toISOString();
  
  // Calculate gross margin
  const grossMarginPct = grossProfit ? (grossProfit / turnover) * 100 : null;
  const grossMarginStatus = grossMarginPct !== null 
    ? getGrossMarginStatus(grossMarginPct, benchmark) 
    : 'typical';
  
  const grossMarginMetric: CalculatedMetric = {
    value: grossMarginPct,
    formatted: grossMarginPct !== null ? formatPercent(grossMarginPct) : 'Unknown',
    benchmark: benchmark.grossMargin.typical,
    benchmarkSource: `${benchmark.name} industry`,
    variance: grossMarginPct !== null ? grossMarginPct - benchmark.grossMargin.typical : null,
    varianceFormatted: grossMarginPct !== null 
      ? `${(grossMarginPct - benchmark.grossMargin.typical).toFixed(1)}% ${grossMarginPct >= benchmark.grossMargin.typical ? 'above' : 'below'} typical`
      : 'No data',
    status: grossMarginStatus === 'excellent' ? 'excellent' :
            grossMarginStatus === 'healthy' ? 'good' :
            grossMarginStatus === 'typical' ? 'neutral' : 'concern',
    direction: grossMarginPct !== null 
      ? (grossMarginPct >= benchmark.grossMargin.typical ? 'above' : 'below') 
      : null,
    phrases: buildGrossMarginPhrases(grossMarginPct, benchmark, grossMarginStatus),
    calculation: {
      formula: '(grossProfit / turnover) × 100',
      inputs: { grossProfit, turnover },
      timestamp: now
    }
  };
  
  // Calculate operating margin
  let operatingMarginMetric: CalculatedMetric | null = null;
  if (operatingProfit !== null && operatingProfit !== undefined) {
    const operatingMarginPct = (operatingProfit / turnover) * 100;
    const operatingBenchmark = 12; // UK SME typical
    
    operatingMarginMetric = {
      value: operatingMarginPct,
      formatted: formatPercent(operatingMarginPct),
      benchmark: operatingBenchmark,
      benchmarkSource: 'UK SME typical',
      variance: operatingMarginPct - operatingBenchmark,
      varianceFormatted: `${(operatingMarginPct - operatingBenchmark).toFixed(1)}% ${operatingMarginPct >= operatingBenchmark ? 'above' : 'below'} typical`,
      status: operatingMarginPct > 18 ? 'excellent' :
              operatingMarginPct > 12 ? 'good' :
              operatingMarginPct > 8 ? 'neutral' : 'concern',
      direction: operatingMarginPct >= operatingBenchmark ? 'above' : 'below',
      phrases: {
        headline: `Operating margin of ${formatPercent(operatingMarginPct)}`,
        impact: operatingMarginPct > operatingBenchmark 
          ? `${formatPercent(operatingMarginPct - operatingBenchmark)} above UK SME average`
          : `${formatPercent(operatingBenchmark - operatingMarginPct)} below UK SME average`,
        context: `Compared to ${operatingBenchmark}% typical for UK SMEs`
      },
      calculation: {
        formula: '(operatingProfit / turnover) × 100',
        inputs: { operatingProfit, turnover },
        timestamp: now
      }
    };
  }
  
  // Calculate net margin
  let netMarginMetric: CalculatedMetric | null = null;
  if (netProfit !== null && netProfit !== undefined) {
    const netMarginPct = (netProfit / turnover) * 100;
    
    netMarginMetric = {
      value: netMarginPct,
      formatted: formatPercent(netMarginPct),
      benchmark: 8, // UK SME typical
      benchmarkSource: 'UK SME typical',
      variance: netMarginPct - 8,
      varianceFormatted: `${(netMarginPct - 8).toFixed(1)}% ${netMarginPct >= 8 ? 'above' : 'below'} typical`,
      status: netMarginPct > 15 ? 'excellent' :
              netMarginPct > 8 ? 'good' :
              netMarginPct > 5 ? 'neutral' : 'concern',
      direction: netMarginPct >= 8 ? 'above' : 'below',
      phrases: {
        headline: `Net margin of ${formatPercent(netMarginPct)}`,
        impact: `${formatPercent(netMarginPct)} of revenue flows through to bottom line`,
        context: ''
      },
      calculation: {
        formula: '(netProfit / turnover) × 100',
        inputs: { netProfit, turnover },
        timestamp: now
      }
    };
  }
  
  // Calculate EBITDA and EBITDA margin
  let ebitdaMarginMetric: CalculatedMetric | null = null;
  let ebitdaMetric: CalculatedMetric | null = null;
  
  const calculatedEbitda = ebitda || (operatingProfit ? operatingProfit + depreciation + amortisation : null);
  
  if (calculatedEbitda !== null) {
    const ebitdaMarginPct = (calculatedEbitda / turnover) * 100;
    
    ebitdaMarginMetric = {
      value: ebitdaMarginPct,
      formatted: formatPercent(ebitdaMarginPct),
      benchmark: 15, // Healthy SME target
      benchmarkSource: 'Healthy SME target',
      variance: ebitdaMarginPct - 15,
      varianceFormatted: `${(ebitdaMarginPct - 15).toFixed(1)}% ${ebitdaMarginPct >= 15 ? 'above' : 'below'} target`,
      status: ebitdaMarginPct > 20 ? 'excellent' :
              ebitdaMarginPct > 15 ? 'good' :
              ebitdaMarginPct > 10 ? 'neutral' : 'concern',
      direction: ebitdaMarginPct >= 15 ? 'above' : 'below',
      phrases: {
        headline: `EBITDA margin of ${formatPercent(ebitdaMarginPct)}`,
        impact: `Strong cash generation at ${formatPercent(ebitdaMarginPct)}`,
        context: 'EBITDA margin is what buyers focus on'
      },
      calculation: {
        formula: '(EBITDA / turnover) × 100',
        inputs: { ebitda: calculatedEbitda, turnover },
        timestamp: now
      }
    };
    
    ebitdaMetric = {
      value: calculatedEbitda,
      formatted: formatCurrency(calculatedEbitda),
      benchmark: null,
      benchmarkSource: 'N/A',
      variance: null,
      varianceFormatted: '',
      status: calculatedEbitda > 500000 ? 'excellent' :
              calculatedEbitda > 250000 ? 'good' :
              calculatedEbitda > 100000 ? 'neutral' : 'concern',
      direction: null,
      phrases: {
        headline: `EBITDA of ${formatCurrency(calculatedEbitda)}`,
        impact: `This is the earnings figure buyers will focus on`,
        context: `${formatCurrency(calculatedEbitda)} available for debt service, investment, or extraction`
      },
      calculation: {
        formula: 'Operating Profit + Depreciation + Amortisation',
        inputs: { operatingProfit, depreciation, amortisation },
        timestamp: now
      }
    };
  }
  
  return {
    grossMargin: grossMarginMetric,
    operatingMargin: operatingMarginMetric,
    netMargin: netMarginMetric,
    ebitdaMargin: ebitdaMarginMetric,
    ebitda: ebitdaMetric
  };
}

/**
 * Build gross margin phrases
 */
function buildGrossMarginPhrases(
  grossMarginPct: number | null,
  benchmark: IndustryBenchmark,
  status: string
): {
  headline: string;
  impact: string;
  context: string;
} {
  if (grossMarginPct === null) {
    return {
      headline: 'Gross margin: Unknown',
      impact: 'No gross profit data available',
      context: 'Cannot assess pricing power without gross profit figure'
    };
  }
  
  const formatted = formatPercent(grossMarginPct);
  const typical = benchmark.grossMargin.typical;
  const variance = grossMarginPct - typical;
  
  if (status === 'excellent') {
    return {
      headline: `Gross margin of ${formatted} - excellent for the industry`,
      impact: `${formatPercent(variance)} above the ${typical}% industry benchmark`,
      context: 'Strong pricing power and cost control'
    };
  }
  
  if (status === 'healthy') {
    return {
      headline: `Gross margin of ${formatted} - healthy`,
      impact: `In line with the ${typical}% industry benchmark`,
      context: 'Good pricing position in the market'
    };
  }
  
  if (status === 'typical') {
    return {
      headline: `Gross margin of ${formatted}`,
      impact: `${formatPercent(Math.abs(variance))} ${variance >= 0 ? 'above' : 'below'} the ${typical}% benchmark`,
      context: 'Average margin for the sector'
    };
  }
  
  return {
    headline: `Gross margin of ${formatted} - needs attention`,
    impact: `${formatPercent(Math.abs(variance))} below the ${typical}% benchmark`,
    context: 'Pricing or cost issues may be compressing margin'
  };
}

