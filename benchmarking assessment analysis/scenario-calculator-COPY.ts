/**
 * Scenario Calculator for Benchmarking Service
 * Provides client-side calculations for "what-if" improvement scenarios
 */

export interface BaselineMetrics {
  revenue: number;
  grossMargin: number;
  grossProfit: number;
  netMargin: number;
  netProfit: number;
  ebitda: number;
  ebitdaMargin: number;
  employeeCount: number;
  revenuePerEmployee: number;
  debtorDays: number;
  creditorDays: number;
  clientConcentration?: number;
  averageRate?: number;
  utilisationRate?: number;
}

export type ScenarioType = 
  | 'margin' 
  | 'pricing' 
  | 'cash' 
  | 'efficiency' 
  | 'diversification' 
  | 'exit';

export interface ScenarioResult {
  type: ScenarioType;
  title: string;
  primaryMetric: {
    label: string;
    current: number;
    projected: number;
    delta: number;
    format: 'currency' | 'percent' | 'number' | 'days';
  };
  secondaryMetrics: Array<{
    label: string;
    impact: number;
    description: string;
    format: 'currency' | 'percent' | 'days';
  }>;
  businessValueImpact: number;
  summary: string;
  howToAchieve: string[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}k`;
  return value.toFixed(0);
}

export function formatValue(value: number, format: 'currency' | 'percent' | 'number' | 'days'): string {
  switch (format) {
    case 'currency':
      return `£${formatCurrency(value)}`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'days':
      return `${Math.round(value)} days`;
    default:
      return formatCurrency(value);
  }
}

// =============================================================================
// MARGIN IMPROVEMENT SCENARIO
// =============================================================================

export function calculateMarginScenario(
  baseline: BaselineMetrics,
  targetGrossMargin: number
): ScenarioResult {
  const currentGM = baseline.grossMargin;
  const revenue = baseline.revenue;
  
  // Primary impact: Additional gross profit
  const currentGP = revenue * (currentGM / 100);
  const projectedGP = revenue * (targetGrossMargin / 100);
  const additionalGP = projectedGP - currentGP;
  
  // Secondary: Flow-through to net profit (typically 40-60% after overheads)
  const flowThrough = 0.45;
  const netImpact = additionalGP * flowThrough;
  
  // Secondary: Business value impact (at typical 5x EBITDA multiple)
  const valueMultiple = 5;
  const valueImpact = netImpact * valueMultiple;
  
  // Calculate margin gap improvement
  const marginImprovement = targetGrossMargin - currentGM;
  
  return {
    type: 'margin',
    title: 'Margin Improvement',
    primaryMetric: {
      label: 'Additional Gross Profit',
      current: currentGP,
      projected: projectedGP,
      delta: additionalGP,
      format: 'currency',
    },
    secondaryMetrics: [
      {
        label: 'Net Profit Impact',
        impact: netImpact,
        description: `At ${Math.round(flowThrough * 100)}% flow-through after overheads`,
        format: 'currency',
      },
      {
        label: 'Business Value Impact',
        impact: valueImpact,
        description: `At ${valueMultiple}x EBITDA multiple`,
        format: 'currency',
      },
      {
        label: 'Margin Improvement',
        impact: marginImprovement,
        description: `From ${currentGM.toFixed(1)}% to ${targetGrossMargin.toFixed(1)}%`,
        format: 'percent',
      },
    ],
    businessValueImpact: valueImpact,
    summary: `Improving gross margin from ${currentGM.toFixed(1)}% to ${targetGrossMargin.toFixed(1)}% would generate £${formatCurrency(additionalGP)} additional gross profit annually. After overheads, this translates to approximately £${formatCurrency(netImpact)} on the bottom line, potentially adding £${formatCurrency(valueImpact)} to business value.`,
    howToAchieve: [
      'Review pricing structure — when did you last increase rates?',
      'Analyse project profitability by client and service type',
      'Identify and eliminate margin-diluting work',
      'Negotiate better terms with suppliers and subcontractors',
      'Improve utilisation of billable staff',
      'Consider value-based pricing for high-impact projects',
    ],
  };
}

// =============================================================================
// PRICING POWER SCENARIO
// =============================================================================

export function calculatePricingScenario(
  baseline: BaselineMetrics,
  rateIncreasePercent: number,
  volumeRetention: number = 95
): ScenarioResult {
  const currentRevenue = baseline.revenue;
  const newRateMultiplier = 1 + (rateIncreasePercent / 100);
  const retentionMultiplier = volumeRetention / 100;
  
  // Revenue from retained clients at new rates
  const newRevenue = currentRevenue * newRateMultiplier * retentionMultiplier;
  const revenueChange = newRevenue - currentRevenue;
  
  // Rate increases flow 100% to margin (no additional COGS for same work)
  const marginImpact = currentRevenue * (rateIncreasePercent / 100) * retentionMultiplier;
  
  // Calculate break-even point (how much volume you can lose before being worse off)
  const breakEvenRetention = 1 / newRateMultiplier;
  const breakEvenVolumeLoss = (1 - breakEvenRetention) * 100;
  
  // Value impact at 5x multiple
  const valueImpact = marginImpact * 5;
  
  return {
    type: 'pricing',
    title: 'Pricing Power',
    primaryMetric: {
      label: 'Direct Margin Impact',
      current: 0,
      projected: marginImpact,
      delta: marginImpact,
      format: 'currency',
    },
    secondaryMetrics: [
      {
        label: 'Revenue Change',
        impact: revenueChange,
        description: `With ${volumeRetention}% client retention`,
        format: 'currency',
      },
      {
        label: 'Break-even Volume Loss',
        impact: breakEvenVolumeLoss,
        description: `You could lose up to ${breakEvenVolumeLoss.toFixed(1)}% and still be better off`,
        format: 'percent',
      },
      {
        label: 'Business Value Impact',
        impact: valueImpact,
        description: 'At 5x EBITDA multiple',
        format: 'currency',
      },
    ],
    businessValueImpact: valueImpact,
    summary: `A ${rateIncreasePercent}% rate increase with ${volumeRetention}% client retention would add £${formatCurrency(marginImpact)} directly to your bottom line. Rate increases flow straight to profit since you're doing the same work. You could lose up to ${breakEvenVolumeLoss.toFixed(1)}% of volume and still be better off — most clients won't leave over a ${rateIncreasePercent}% increase.`,
    howToAchieve: [
      'Communicate the value you deliver before discussing price',
      'Start price increases with new clients, then existing relationships',
      'Consider tiered pricing for different service levels',
      'Review market rates and position appropriately',
      'Focus on results delivered, not hours worked',
      'Bundle services to increase perceived value',
    ],
  };
}

// =============================================================================
// CASH OPTIMISATION SCENARIO
// =============================================================================

export function calculateCashScenario(
  baseline: BaselineMetrics,
  targetDebtorDays: number
): ScenarioResult {
  const revenue = baseline.revenue;
  const dailyRevenue = revenue / 365;
  
  // Current working capital tied up in debtors
  const currentDebtorFunding = dailyRevenue * baseline.debtorDays;
  const targetDebtorFunding = dailyRevenue * targetDebtorDays;
  const cashReleased = currentDebtorFunding - targetDebtorFunding;
  
  // Interest saving (at typical overdraft/invoice finance rate)
  const interestRate = 0.08; // 8% effective rate
  const interestSaving = cashReleased * interestRate;
  
  // Days improvement
  const daysImprovement = baseline.debtorDays - targetDebtorDays;
  
  return {
    type: 'cash',
    title: 'Cash Optimisation',
    primaryMetric: {
      label: 'Working Capital Released',
      current: currentDebtorFunding,
      projected: targetDebtorFunding,
      delta: cashReleased,
      format: 'currency',
    },
    secondaryMetrics: [
      {
        label: 'Annual Interest Saving',
        impact: interestSaving,
        description: 'At 8% effective borrowing rate',
        format: 'currency',
      },
      {
        label: 'Days Improvement',
        impact: daysImprovement,
        description: `From ${baseline.debtorDays} to ${targetDebtorDays} days`,
        format: 'days',
      },
    ],
    businessValueImpact: cashReleased, // Cash is direct value
    summary: `Reducing debtor days from ${baseline.debtorDays} to ${targetDebtorDays} would release £${formatCurrency(cashReleased)} from working capital. This is money currently tied up waiting for clients to pay. If you're using any form of borrowing, that's £${formatCurrency(interestSaving)} saved in interest annually.`,
    howToAchieve: [
      'Implement proactive credit control process',
      'Send invoices immediately on milestone completion',
      'Offer early payment discounts (e.g., 2% for payment within 7 days)',
      'Review payment terms on new contracts',
      'Automate invoice reminders at 7, 14, 21 days',
      'Consider invoice financing for persistent slow payers',
      'Add late payment charges to your terms',
    ],
  };
}

// =============================================================================
// EFFICIENCY GAINS SCENARIO
// =============================================================================

export function calculateEfficiencyScenario(
  baseline: BaselineMetrics,
  targetRevenuePerEmployee: number
): ScenarioResult {
  const currentRPE = baseline.revenuePerEmployee;
  const headcount = baseline.employeeCount;
  const revenue = baseline.revenue;
  
  // Option 1: Additional revenue at current headcount
  const additionalRevenue = (targetRevenuePerEmployee - currentRPE) * headcount;
  const additionalProfit = additionalRevenue * (baseline.netMargin / 100);
  
  // Option 2: Headcount needed at target RPE for current revenue
  const efficientHeadcount = Math.ceil(revenue / targetRevenuePerEmployee);
  const headcountReduction = headcount - efficientHeadcount;
  const averageCostPerHead = 55000; // Assume £55k avg total cost (salary + NI + pension + overheads)
  const costSaving = headcountReduction * averageCostPerHead;
  
  // Efficiency improvement percentage
  const efficiencyImprovement = ((targetRevenuePerEmployee / currentRPE) - 1) * 100;
  
  return {
    type: 'efficiency',
    title: 'Efficiency Gains',
    primaryMetric: {
      label: 'Revenue Capacity Unlocked',
      current: revenue,
      projected: revenue + additionalRevenue,
      delta: additionalRevenue,
      format: 'currency',
    },
    secondaryMetrics: [
      {
        label: 'Additional Profit (if capacity filled)',
        impact: additionalProfit,
        description: `At your current ${baseline.netMargin.toFixed(1)}% net margin`,
        format: 'currency',
      },
      {
        label: 'Alternative: Cost Saving',
        impact: costSaving,
        description: `Deliver current revenue with ${headcountReduction} fewer people`,
        format: 'currency',
      },
      {
        label: 'Efficiency Improvement',
        impact: efficiencyImprovement,
        description: `From £${formatCurrency(currentRPE)} to £${formatCurrency(targetRevenuePerEmployee)}/employee`,
        format: 'percent',
      },
    ],
    businessValueImpact: Math.max(additionalProfit, costSaving) * 5,
    summary: `Improving revenue per employee from £${formatCurrency(currentRPE)} to £${formatCurrency(targetRevenuePerEmployee)} would unlock £${formatCurrency(additionalRevenue)} in additional revenue capacity with your current team. Alternatively, you could deliver your current revenue with ${headcountReduction} fewer people, saving £${formatCurrency(costSaving)} annually.`,
    howToAchieve: [
      'Improve utilisation through better resource planning',
      'Reduce non-billable time and admin burden',
      'Automate repetitive tasks and reporting',
      'Focus team on higher-value work',
      'Review team structure for efficiency',
      'Invest in tools that multiply output',
      'Cross-train team members to reduce bottlenecks',
    ],
  };
}

// =============================================================================
// CUSTOMER DIVERSIFICATION SCENARIO
// =============================================================================

export function calculateDiversificationScenario(
  baseline: BaselineMetrics,
  targetConcentration: number
): ScenarioResult {
  const currentConcentration = baseline.clientConcentration || 50;
  const revenue = baseline.revenue;
  
  // Revenue at risk from concentration
  const currentRevenueAtRisk = revenue * (currentConcentration / 100) / 3; // Per top client
  const targetRevenueAtRisk = revenue * (targetConcentration / 100) / 3;
  const riskReduction = currentRevenueAtRisk - targetRevenueAtRisk;
  
  // Valuation discount reduction (high concentration typically causes 20-30% discount)
  const currentDiscountPercent = currentConcentration >= 80 ? 25 : currentConcentration >= 60 ? 15 : 5;
  const targetDiscountPercent = targetConcentration >= 80 ? 25 : targetConcentration >= 60 ? 15 : 5;
  const discountReduction = currentDiscountPercent - targetDiscountPercent;
  
  // Estimated business value impact
  const baseValue = baseline.netProfit * 5;
  const currentDiscountedValue = baseValue * (1 - currentDiscountPercent / 100);
  const targetDiscountedValue = baseValue * (1 - targetDiscountPercent / 100);
  const valueImprovement = targetDiscountedValue - currentDiscountedValue;
  
  return {
    type: 'diversification',
    title: 'Customer Diversification',
    primaryMetric: {
      label: 'Risk Reduction per Major Client',
      current: currentRevenueAtRisk,
      projected: targetRevenueAtRisk,
      delta: riskReduction,
      format: 'currency',
    },
    secondaryMetrics: [
      {
        label: 'Valuation Discount Reduction',
        impact: discountReduction,
        description: `Buyers penalise high concentration`,
        format: 'percent',
      },
      {
        label: 'Business Value Improvement',
        impact: valueImprovement,
        description: 'From reduced concentration discount',
        format: 'currency',
      },
    ],
    businessValueImpact: valueImprovement,
    summary: `Reducing customer concentration from ${currentConcentration}% to ${targetConcentration}% would reduce your risk exposure per major client from £${formatCurrency(currentRevenueAtRisk)} to £${formatCurrency(targetRevenueAtRisk)}. This also improves your attractiveness to acquirers — high concentration typically causes a 15-25% valuation discount.`,
    howToAchieve: [
      'Proactively develop relationships with new target clients',
      'Expand services within existing smaller accounts',
      'Build recurring revenue streams less dependent on project wins',
      'Develop marketing capability to generate inbound leads',
      'Consider strategic partnerships for new market access',
      'Don\'t let existing large clients crowd out growth',
    ],
  };
}

// =============================================================================
// EXIT READINESS SCENARIO (Valuation Calculator)
// =============================================================================

export function calculateExitScenario(
  baseline: BaselineMetrics,
  targetMultiple: number = 5,
  founderRiskScore: number = 50
): ScenarioResult {
  const ebitda = baseline.ebitda || (baseline.netProfit / 0.8); // Estimate if not provided
  
  // Base valuation
  const baseValuation = ebitda * targetMultiple;
  
  // Apply discounts
  const concentrationDiscount = (baseline.clientConcentration || 50) >= 60 ? 0.15 : 0.05;
  const founderDiscount = founderRiskScore >= 60 ? 0.25 : founderRiskScore >= 40 ? 0.15 : 0.05;
  const totalDiscount = 1 - (1 - concentrationDiscount) * (1 - founderDiscount);
  
  const adjustedValuation = baseValuation * (1 - totalDiscount);
  const discountAmount = baseValuation - adjustedValuation;
  
  return {
    type: 'exit',
    title: 'Exit Readiness',
    primaryMetric: {
      label: 'Estimated Business Value',
      current: baseValuation,
      projected: adjustedValuation,
      delta: -discountAmount,
      format: 'currency',
    },
    secondaryMetrics: [
      {
        label: 'Base Valuation (no discounts)',
        impact: baseValuation,
        description: `EBITDA £${formatCurrency(ebitda)} × ${targetMultiple}`,
        format: 'currency',
      },
      {
        label: 'Total Discount Applied',
        impact: totalDiscount * 100,
        description: `Concentration + founder risk`,
        format: 'percent',
      },
      {
        label: 'Value Lost to Discounts',
        impact: discountAmount,
        description: 'Addressable through risk reduction',
        format: 'currency',
      },
    ],
    businessValueImpact: adjustedValuation,
    summary: `Your business could be worth £${formatCurrency(baseValuation)} at a ${targetMultiple}x EBITDA multiple. However, buyer discounts for customer concentration and founder dependency reduce this to approximately £${formatCurrency(adjustedValuation)}. Addressing these risks could recover £${formatCurrency(discountAmount)} in value.`,
    howToAchieve: [
      'Document all processes and reduce founder dependency',
      'Diversify customer base to reduce concentration risk',
      'Build a management team that can run the business',
      'Establish recurring revenue where possible',
      'Clean up financials and maintain clear records',
      'Consider earn-out structures if founder transition needed',
    ],
  };
}

