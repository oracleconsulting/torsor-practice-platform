// ============================================================================
// HIDDEN ASSETS CALCULATOR
// ============================================================================
// Identifies and values hidden assets with pre-built phrases for Pass 2
// ============================================================================

import { 
  HiddenAssetsMetrics, 
  HiddenAssetItem,
  CalculatedMetric,
  formatCurrency
} from '../types/pass1-output.ts';

export interface HiddenAssetsInputs {
  fixedAssets?: number | null;
  cash?: number | null;
  turnover?: number;
  workingCapitalRequired?: number;
  stock?: number | null;
  debtors?: number | null;
  propertyIndicated?: boolean;
  propertyDescription?: string;
}

/**
 * Calculate hidden assets metrics with pre-built phrases
 */
export function calculateHiddenAssetsMetrics(
  inputs: HiddenAssetsInputs
): HiddenAssetsMetrics {
  const { 
    fixedAssets, 
    cash, 
    turnover = 0,
    workingCapitalRequired = 0,
    stock,
    propertyIndicated,
    propertyDescription
  } = inputs;
  
  const now = new Date().toISOString();
  const hiddenAssetsList: HiddenAssetItem[] = [];
  let totalHiddenAssets = 0;
  
  // Detect freehold property
  let freeholdPropertyMetric: CalculatedMetric | null = null;
  const freeholdValue = fixedAssets && fixedAssets > 100000 ? fixedAssets : null;
  
  if (freeholdValue || propertyIndicated) {
    const value = freeholdValue || 500000; // Default estimate if property indicated but not valued
    
    freeholdPropertyMetric = {
      value,
      formatted: formatCurrency(value),
      benchmark: null,
      benchmarkSource: 'Book value',
      variance: null,
      varianceFormatted: 'May be worth more at market value',
      status: 'good',
      direction: null,
      phrases: {
        headline: `Freehold property at ${formatCurrency(value)} book value`,
        impact: 'This sits outside the earnings-based valuation',
        context: propertyDescription || 'Property likely worth more than book value'
      },
      calculation: {
        formula: 'Fixed assets value (if property indicated)',
        inputs: { fixedAssets, propertyIndicated: propertyIndicated || false },
        timestamp: now
      }
    };
    
    hiddenAssetsList.push({
      type: 'freehold_property',
      value,
      formatted: formatCurrency(value),
      description: `Freehold property (book value ${formatCurrency(value)})`,
      source: 'accounts'
    });
    
    totalHiddenAssets += value;
  }
  
  // Detect excess cash
  let excessCashMetric: CalculatedMetric | null = null;
  if (cash && turnover) {
    // Estimate working capital need as ~10% of turnover if not provided
    const wcRequired = workingCapitalRequired || Math.round(turnover * 0.10);
    const excessCash = Math.max(0, cash - wcRequired);
    
    if (excessCash > 50000) {
      excessCashMetric = {
        value: excessCash,
        formatted: formatCurrency(excessCash),
        benchmark: wcRequired,
        benchmarkSource: 'Working capital requirement',
        variance: excessCash,
        varianceFormatted: `${formatCurrency(excessCash)} above working capital needs`,
        status: 'excellent',
        direction: 'above',
        phrases: {
          headline: `${formatCurrency(excessCash)} excess cash above working capital needs`,
          impact: 'This is a hidden asset not reflected in earnings valuation',
          context: `Total cash ${formatCurrency(cash)} minus ${formatCurrency(wcRequired)} working capital = ${formatCurrency(excessCash)} excess`
        },
        calculation: {
          formula: 'cash - workingCapitalRequired',
          inputs: { cash, wcRequired },
          timestamp: now
        }
      };
      
      hiddenAssetsList.push({
        type: 'excess_cash',
        value: excessCash,
        formatted: formatCurrency(excessCash),
        description: `Excess cash (${formatCurrency(cash)} - ${formatCurrency(wcRequired)} working capital)`,
        source: 'calculated'
      });
      
      totalHiddenAssets += excessCash;
    }
  }
  
  // Build total hidden assets metric
  const totalHiddenAssetsMetric: CalculatedMetric = {
    value: totalHiddenAssets,
    formatted: formatCurrency(totalHiddenAssets),
    benchmark: null,
    benchmarkSource: 'N/A',
    variance: null,
    varianceFormatted: '',
    status: totalHiddenAssets > 500000 ? 'excellent' :
            totalHiddenAssets > 200000 ? 'good' :
            totalHiddenAssets > 50000 ? 'neutral' : 'neutral',
    direction: null,
    phrases: buildTotalHiddenAssetsPhrases(totalHiddenAssets, hiddenAssetsList),
    calculation: {
      formula: 'Sum of all hidden assets',
      inputs: { 
        freeholdProperty: freeholdValue || null, 
        excessCash: excessCashMetric?.value || null 
      },
      timestamp: now
    }
  };
  
  return {
    freeholdProperty: freeholdPropertyMetric,
    excessCash: excessCashMetric,
    undervaluedStock: null, // Could add stock analysis
    intellectualProperty: null, // Would need assessment data
    totalHiddenAssets: totalHiddenAssetsMetric,
    hiddenAssetsList
  };
}

/**
 * Build total hidden assets phrases
 */
function buildTotalHiddenAssetsPhrases(
  total: number,
  assets: HiddenAssetItem[]
): {
  headline: string;
  impact: string;
  context: string;
} {
  if (total === 0) {
    return {
      headline: 'No significant hidden assets identified',
      impact: 'Valuation based primarily on earnings multiple',
      context: 'Standard earnings-based valuation applies'
    };
  }
  
  const assetDescriptions = assets.map(a => {
    if (a.type === 'freehold_property') return `${a.formatted} freehold`;
    if (a.type === 'excess_cash') return `${a.formatted} excess cash`;
    return `${a.formatted} ${a.type}`;
  }).join(' + ');
  
  return {
    headline: `Total hidden assets: ${formatCurrency(total)}`,
    impact: `These assets sit OUTSIDE the earnings-based valuation`,
    context: assetDescriptions
  };
}

/**
 * Extract property signals from assessment responses
 */
export function extractPropertySignals(
  responses: Record<string, any>
): {
  propertyIndicated: boolean;
  propertyDescription: string | null;
} {
  const allText = JSON.stringify(responses).toLowerCase();
  
  const propertyIndicated = allText.includes('freehold') ||
                           allText.includes('own the building') ||
                           allText.includes('property') ||
                           allText.includes('premises we own');
  
  let propertyDescription: string | null = null;
  if (propertyIndicated) {
    if (allText.includes('freehold')) propertyDescription = 'Freehold property owned';
    else if (allText.includes('building')) propertyDescription = 'Business premises owned';
    else propertyDescription = 'Property asset indicated';
  }
  
  return { propertyIndicated, propertyDescription };
}

