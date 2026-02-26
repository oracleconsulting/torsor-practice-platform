// ============================================================================
// MASTER ORCHESTRATOR - "Calculate Once, Narrate Forever"
// ============================================================================
// Coordinates all calculators to produce complete Pass 1 output
// ============================================================================

import { 
  Pass1Output, 
  CalculationMeta,
  NarrativeBlocks,
  formatCurrency
} from '../types/pass1-output.ts';

import { getBenchmark, detectIndustry, IndustryBenchmark } from '../benchmarks/industry-benchmarks.ts';

import { calculatePayrollMetrics, buildPayrollGapPhrase, PayrollInputs } from './payroll.ts';
import { calculateValuationMetrics, buildValuationGapPhrase, extractValuationSignals, ValuationInputs } from './valuation.ts';
import { calculateTrajectoryMetrics, buildTrajectoryGapPhrase, TrajectoryInputs } from './trajectory.ts';
import { calculateProductivityMetrics, buildProductivityGapPhrase, ProductivityInputs } from './productivity.ts';
import { calculateProfitabilityMetrics, ProfitabilityInputs } from './profitability.ts';
import { calculateHiddenAssetsMetrics, extractPropertySignals, HiddenAssetsInputs } from './hidden-assets.ts';
import { calculateExitReadinessMetrics, extractExitReadinessSignals, ExitReadinessInputs } from './exit-readiness.ts';
import { calculateCostOfInactionMetrics, buildCostOfInactionPhrase, CostOfInactionInputs } from './cost-of-inaction.ts';
import { calculateAchievementsMetrics, buildAchievementsPhrase, AchievementsInputs } from './achievements.ts';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface ExtractedFinancials {
  hasAccounts: boolean;
  source?: string;
  
  // Core P&L
  turnover?: number;
  turnoverPriorYear?: number;
  grossProfit?: number;
  operatingProfit?: number;
  netProfit?: number;
  ebitda?: number;
  
  // Staff
  totalStaffCosts?: number;
  employeeCount?: number;
  directorSalary?: number;
  
  // Balance Sheet
  netAssets?: number;
  cash?: number;
  debtors?: number;
  creditors?: number;
  stock?: number;
  fixedAssets?: number;
  
  // Depreciation
  depreciation?: number;
  amortisation?: number;
}

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

export interface OrchestratorInputs {
  engagementId: string;
  clientId: string;
  clientName: string;
  companyName: string;
  
  financials: ExtractedFinancials;
  responses: Record<string, any>;
  
  // Client type classification (from classification result)
  clientType?: ClientBusinessType;
  frameworkOverrides?: FrameworkOverrides;
}

// ============================================================================
// MAIN ORCHESTRATOR FUNCTION
// ============================================================================

/**
 * Run all calculations and produce complete Pass 1 output
 */
export function orchestratePass1Calculations(
  inputs: OrchestratorInputs
): Pass1Output {
  const { 
    engagementId, 
    clientId, 
    clientName, 
    companyName, 
    financials, 
    responses,
    clientType,
    frameworkOverrides
  } = inputs;
  const now = new Date().toISOString();
  
  console.log('[Orchestrator] Starting Pass 1 calculations for:', companyName);
  console.log('[Orchestrator] Client type:', clientType, 'Framework overrides:', frameworkOverrides);
  
  // ========================================================================
  // STEP 1: DETECT INDUSTRY & GET BENCHMARKS
  // ========================================================================
  
  const detectedIndustry = detectIndustry(responses, companyName);
  const benchmark = getBenchmark(detectedIndustry);
  
  console.log('[Orchestrator] Detected industry:', detectedIndustry, benchmark.name);
  
  // ========================================================================
  // STEP 2: EXTRACT SIGNALS FROM RESPONSES
  // ========================================================================
  
  const valuationSignals = extractValuationSignals(responses);
  const propertySignals = extractPropertySignals(responses);
  const exitReadinessSignals = extractExitReadinessSignals(responses);
  
  console.log('[Orchestrator] Extracted signals:', {
    isMarketLeader: valuationSignals.isMarketLeader,
    founderDependencyLow: valuationSignals.founderDependencyLow,
    propertyIndicated: propertySignals.propertyIndicated
  });
  
  // ========================================================================
  // STEP 3: RUN CORE FINANCIAL CALCULATIONS
  // ========================================================================
  
  // Profitability
  const profitability = calculateProfitabilityMetrics({
    turnover: financials.turnover || 0,
    grossProfit: financials.grossProfit,
    operatingProfit: financials.operatingProfit,
    netProfit: financials.netProfit,
    ebitda: financials.ebitda,
    depreciation: financials.depreciation,
    amortisation: financials.amortisation
  }, benchmark);
  
  console.log('[Orchestrator] Profitability calculated:', {
    grossMargin: profitability.grossMargin.formatted,
    ebitda: profitability.ebitda?.formatted
  });
  
  // Payroll
  let payroll = null;
  if (financials.turnover && financials.totalStaffCosts) {
    // For agencies, include contractor costs in payroll calculation
    const consultingCosts = (financials as any).consultingCosts || (financials as any).consultancyFees || (financials as any).subcontractorCosts || 0;
    const contractorCountEstimate = (financials as any).contractorCountEstimate || undefined;
    
    const payrollResult = calculatePayrollMetrics({
      turnover: financials.turnover,
      staffCosts: financials.totalStaffCosts,
      grossProfit: financials.grossProfit,
      directorSalary: financials.directorSalary,
      employeeCount: financials.employeeCount,
      consultingCosts: consultingCosts > 0 ? consultingCosts : undefined,
      contractorCountEstimate
    }, benchmark, clientType, frameworkOverrides);
    
    // Handle status-based return
    if (payrollResult && 'status' in payrollResult && payrollResult.status === 'calculated') {
      payroll = payrollResult;
      console.log('[Orchestrator] Payroll calculated:', {
        staffCostsPct: payroll.staffCostsPercent.formatted,
        annualExcess: payroll.annualExcess.formatted,
        isOverstaffed: payroll.summary.isOverstaffed
      });
    } else if (payrollResult && 'status' in payrollResult) {
      console.log('[Orchestrator] Payroll:', payrollResult.status, payrollResult.notApplicableReason || '');
    }
  }
  
  // Trajectory
  const trajectory = calculateTrajectoryMetrics({
    currentRevenue: financials.turnover || 0,
    priorRevenue: financials.turnoverPriorYear,
    currentProfit: financials.operatingProfit,
  });
  
  console.log('[Orchestrator] Trajectory calculated:', {
    yoyChange: trajectory.revenueGrowthYoY.formatted,
    trend: trajectory.trend.classification
  });
  
  // Productivity
  let productivity = null;
  if (financials.turnover && financials.employeeCount) {
    // For agencies, pass contractor count estimate
    const contractorCountEstimate = (financials as any).contractorCountEstimate || undefined;
    
    const productivityResult = calculateProductivityMetrics({
      revenue: financials.turnover,
      employeeCount: financials.employeeCount,
      operatingProfit: financials.operatingProfit,
      staffCosts: financials.totalStaffCosts,
      contractorCountEstimate
    }, benchmark, clientType, frameworkOverrides);
    
    // Handle status-based return
    if (productivityResult && 'status' in productivityResult && productivityResult.status === 'calculated') {
      productivity = productivityResult;
      console.log('[Orchestrator] Productivity calculated:', {
        revenuePerHead: productivity.revenuePerHead.formatted,
        excessHeadcount: productivity.excessHeadcount.formatted
      });
    } else if (productivityResult && 'status' in productivityResult) {
      console.log('[Orchestrator] Productivity:', productivityResult.status, productivityResult.notApplicableReason || '');
    }
  }
  
  // Hidden Assets
  const hiddenAssets = calculateHiddenAssetsMetrics({
    fixedAssets: financials.fixedAssets,
    cash: financials.cash,
    turnover: financials.turnover,
    stock: financials.stock,
    propertyIndicated: propertySignals.propertyIndicated,
    propertyDescription: propertySignals.propertyDescription
  });
  
  console.log('[Orchestrator] Hidden assets:', {
    total: hiddenAssets.totalHiddenAssets.formatted,
    items: hiddenAssets.hiddenAssetsList.length
  });
  
  // Valuation
  const valuationResult = calculateValuationMetrics({
    operatingProfit: financials.operatingProfit,
    ebitda: financials.ebitda,
    depreciation: financials.depreciation,
    amortisation: financials.amortisation,
    netAssets: financials.netAssets,
    directorSalary: financials.directorSalary,
    turnover: financials.turnover,
    isMarketLeader: valuationSignals.isMarketLeader,
    hasRecurringRevenue: valuationSignals.hasRecurringRevenue,
    founderDependencyLow: valuationSignals.founderDependencyLow,
    trajectoryDeclining: trajectory.trend.classification === 'declining',
    hiddenAssetsTotal: hiddenAssets.totalHiddenAssets.value || 0
  }, benchmark, clientType, frameworkOverrides);
  
  let valuation = null;
  if (valuationResult && 'status' in valuationResult && valuationResult.status === 'calculated') {
    valuation = valuationResult;
    console.log('[Orchestrator] Valuation calculated:', {
      adjustedEbitda: valuation.adjustedEbitda.formatted,
      enterpriseValue: valuation.enterpriseValue.formatted
    });
  } else if (valuationResult && 'status' in valuationResult) {
    console.log('[Orchestrator] Valuation:', valuationResult.status, valuationResult.notApplicableReason || '');
  }
  
  // Exit Readiness
  const exitReadinessResult = calculateExitReadinessMetrics({
    ...exitReadinessSignals,
    trajectoryDeclining: trajectory.trend.classification === 'declining',
    payrollOverstaffed: payroll?.summary.isOverstaffed || false,
    hasValuationBaseline: false // Assume no baseline unless indicated
  }, clientType, frameworkOverrides);
  
  let exitReadiness: ReturnType<typeof calculateExitReadinessMetrics>;
  if (exitReadinessResult && 'status' in exitReadinessResult && exitReadinessResult.status === 'calculated') {
    exitReadiness = exitReadinessResult;
    console.log('[Orchestrator] Exit readiness:', {
      score: exitReadiness.overallScore.formatted,
      strengths: exitReadiness.strengths.length,
      blockers: exitReadiness.blockers.length
    });
  } else if (exitReadinessResult && 'status' in exitReadinessResult) {
    exitReadiness = exitReadinessResult as any; // Will be handled as not applicable
    console.log('[Orchestrator] Exit readiness:', exitReadinessResult.status, exitReadinessResult.notApplicableReason || '');
  } else {
    exitReadiness = exitReadinessResult;
  }
  
  // Cost of Inaction
  // Extract client revenue concentration from financials if available
  const clientRevenueConcentration = (financials as any).clientRevenueConcentration || 
                                     (financials as any).client_revenue_concentration || 
                                     undefined;
  
  // Get admin flags from frameworkOverrides or pass as separate param
  const adminFlags = (inputs as any).adminFlags || undefined;
  
  const costOfInaction = calculateCostOfInactionMetrics({
    payroll,
    trajectory,
    valuation,
    exitTimeline: valuationSignals.exitMindset || undefined,
    turnover: financials.turnover,
    responses: inputs.responses,
    adminFlags,
    clientRevenueConcentration
  });
  
  console.log('[Orchestrator] Cost of inaction:', {
    total: costOfInaction.totalCostOfInaction.formatted.overHorizon,
    timeHorizon: costOfInaction.totalCostOfInaction.timeHorizon
  });
  
  // Achievements
  const achievements = calculateAchievementsMetrics({
    responses,
    payroll,
    profitability,
    exitReadiness,
    isMarketLeader: valuationSignals.isMarketLeader,
    businessRunsWithout: valuationSignals.founderDependencyLow,
    trajectoryGrowing: trajectory.trend.classification === 'growing'
  });
  
  console.log('[Orchestrator] Achievements:', achievements.achievements.length);
  
  // ========================================================================
  // STEP 4: BUILD NARRATIVE BLOCKS
  // ========================================================================
  
  const narrativeBlocks = buildNarrativeBlocks({
    payroll,
    valuation,
    trajectory,
    productivity,
    exitReadiness,
    costOfInaction,
    achievements,
    responses,
    companyName
  });
  
  // ========================================================================
  // STEP 5: BUILD METADATA
  // ========================================================================
  
  const availableMetrics: string[] = [];
  const missingMetrics: string[] = [];
  
  if (profitability.grossMargin.value !== null) availableMetrics.push('grossMargin');
  else missingMetrics.push('grossMargin');
  
  if (payroll) availableMetrics.push('payroll');
  else missingMetrics.push('payroll');
  
  if (trajectory.revenueGrowthYoY.value !== null) availableMetrics.push('trajectory');
  else missingMetrics.push('trajectory');
  
  if (productivity) availableMetrics.push('productivity');
  else missingMetrics.push('productivity');
  
  if (valuation) availableMetrics.push('valuation');
  else missingMetrics.push('valuation');
  
  if (hiddenAssets.hiddenAssetsList.length > 0) availableMetrics.push('hiddenAssets');
  
  availableMetrics.push('exitReadiness'); // Always calculated
  availableMetrics.push('costOfInaction'); // Always calculated
  
  const dataQuality: 'comprehensive' | 'partial' | 'limited' = 
    availableMetrics.length >= 6 ? 'comprehensive' :
    availableMetrics.length >= 4 ? 'partial' : 'limited';
  
  const meta: CalculationMeta = {
    engagementId,
    clientId,
    clientName,
    companyName,
    detectedIndustry,
    industryBenchmarkSource: benchmark.name,
    dataQuality,
    availableMetrics,
    missingMetrics,
    calculatedAt: now,
    calculationVersion: 'v2.0-structured'
  };
  
  console.log('[Orchestrator] Complete. Data quality:', dataQuality);
  
  // ========================================================================
  // STEP 6: RETURN COMPLETE OUTPUT
  // ========================================================================
  
  return {
    meta,
    profitability,
    liquidity: {
      currentRatio: null,
      quickRatio: null,
      cashPosition: null,
      workingCapitalRatio: null,
      excessCash: hiddenAssets.excessCash
    },
    efficiency: {
      debtorDays: null,
      creditorDays: null,
      stockDays: null,
      cashConversionCycle: null,
      assetTurnover: null
    },
    leverage: {
      debtToEquity: null,
      interestCover: null,
      gearing: null,
      netDebt: null
    },
    productivity: productivity || {
      revenuePerHead: createEmptyMetric('Revenue per head unknown'),
      profitPerHead: null,
      revenuePerPayrollPound: null,
      excessHeadcount: createEmptyMetric('Cannot calculate without employee count')
    },
    payroll: payroll || createEmptyPayrollMetrics(benchmark),
    workingCapital: {
      workingCapital: null,
      workingCapitalDays: null,
      workingCapitalRequirement: null,
      workingCapitalExcess: null,
      seasonalVariation: null
    },
    trajectory,
    valuation: valuation || createEmptyValuationMetrics(),
    hiddenAssets,
    exitReadiness,
    concentration: {
      topCustomerPercent: null,
      topFiveCustomersPercent: null,
      recurringRevenuePercent: null,
      singleSupplierRisk: null,
      phrases: {
        customerConcentration: 'Customer concentration not assessed',
        revenueQuality: 'Revenue quality not assessed'
      }
    },
    founderDependency: {
      overallScore: exitReadiness.founderDependency,
      hoursWorked: null,
      criticalDecisions: null,
      clientRelationships: null,
      phrases: {
        summary: exitReadiness.founderDependency.phrases.impact,
        buyerView: exitReadiness.founderDependency.phrases.context
      }
    },
    costOfInaction,
    achievements,
    narrativeBlocks
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface NarrativeBlocksInputs {
  payroll: ReturnType<typeof calculatePayrollMetrics> | null;
  valuation: ReturnType<typeof calculateValuationMetrics> | null;
  trajectory: ReturnType<typeof calculateTrajectoryMetrics>;
  productivity: ReturnType<typeof calculateProductivityMetrics> | null;
  exitReadiness: ReturnType<typeof calculateExitReadinessMetrics>;
  costOfInaction: ReturnType<typeof calculateCostOfInactionMetrics>;
  achievements: ReturnType<typeof calculateAchievementsMetrics>;
  responses: Record<string, any>;
  companyName: string;
}

function buildNarrativeBlocks(inputs: NarrativeBlocksInputs): NarrativeBlocks {
  const { payroll, valuation, trajectory, productivity, exitReadiness, costOfInaction, achievements, responses } = inputs;
  
  // Find best quote from responses
  const keyQuote = findKeyQuote(responses);
  
  // Build opening based on achievements
  const openingLine = achievements.achievements.length > 0 && achievements.achievements[0].significance === 'high'
    ? achievements.achievements[0].phrase
    : "Let's talk about where you're at.";
  
  // Build situation statement based on biggest gap
  let situationStatement = '';
  if (payroll?.summary.isOverstaffed) {
    situationStatement = `Now you need to address the payroll drag before you sell.`;
  } else if (trajectory.trend.classification === 'declining') {
    situationStatement = `The declining trajectory needs addressing before exit.`;
  } else {
    situationStatement = `${achievements.phrases.foundationStatement}`;
  }
  
  // Build gap phrases
  const payrollGap = payroll ? buildPayrollGapPhrase(payroll, findQuote(responses, ['payroll', 'staff', 'team'])) : null;
  const valuationGap = buildValuationGapPhrase(valuation, false); // Assume no baseline
  const trajectoryGap = buildTrajectoryGapPhrase(trajectory);
  const productivityGap = productivity ? buildProductivityGapPhrase(productivity) : null;
  
  // Build closing phrases
  const neverHadBreak = detectNeverHadBreak(responses);
  
  return {
    executiveSummary: {
      openingLine,
      situationStatement,
      keyQuote
    },
    gapPhrases: {
      payroll: payrollGap,
      valuation: valuationGap,
      trajectory: trajectoryGap,
      productivity: productivityGap,
      founderDependency: null // Could add if high dependency
    },
    investmentPhrases: {
      costOfStayingLabour: payroll?.annualExcess.phrases.impact || 'Payroll efficiency not calculated',
      costOfStayingMargin: trajectory.trend.classification === 'declining' 
        ? trajectory.revenueGrowthYoY.phrases.impact 
        : 'Revenue stable',
      costOfStayingTime: `${costOfInaction.totalCostOfInaction.phrases.urgency}`,
      personalCost: findPersonalCost(responses)
    },
    closingPhrases: {
      theAsk: buildTheAsk(responses, exitReadiness),
      urgencyAnchor: buildUrgencyAnchor(responses, costOfInaction),
      neverHadBreak
    }
  };
}

function findKeyQuote(responses: Record<string, any>): string {
  // Look for powerful quotes in vision or stress-related questions
  const visionFields = ['dd_five_year_picture', 'dd_five_year_vision', 'sd_tuesday_test'];
  for (const field of visionFields) {
    if (responses[field] && responses[field].length > 20) {
      return responses[field];
    }
  }
  return '';
}

function findQuote(responses: Record<string, any>, keywords: string[]): string | undefined {
  const allText = JSON.stringify(responses).toLowerCase();
  for (const key of Object.keys(responses)) {
    const value = String(responses[key] || '').toLowerCase();
    for (const keyword of keywords) {
      if (value.includes(keyword)) {
        return responses[key];
      }
    }
  }
  return undefined;
}

function findPersonalCost(responses: Record<string, any>): string {
  const stressFields = ['dd_stress_level', 'sd_health_impact', 'dd_health_impact', 'dd_biggest_frustration'];
  for (const field of stressFields) {
    if (responses[field]) {
      return responses[field];
    }
  }
  return 'Personal toll not captured';
}

function detectNeverHadBreak(responses: Record<string, any>): string | null {
  const breakFields = ['rl_last_break', 'dd_last_real_break', 'last_break'];
  for (const field of breakFields) {
    const value = String(responses[field] || '').toLowerCase();
    if (value.includes('never') || value.includes('not once') || value.includes("haven't") || value.includes("can't remember")) {
      return "You've never taken a proper break. Not once.";
    }
  }
  return null;
}

function buildTheAsk(responses: Record<string, any>, exitReadiness: ReturnType<typeof calculateExitReadinessMetrics>): string {
  const readiness = exitReadiness.overallScore.value || 0;
  
  if (readiness >= 70) {
    return "You're close. Let's close the gaps and get you to the finish line.";
  } else if (readiness >= 50) {
    return "The foundation is there. Let's build on it and get you exit-ready.";
  } else {
    return "There's work to do, but it's achievable. Let's start.";
  }
}

function buildUrgencyAnchor(
  responses: Record<string, any>, 
  costOfInaction: ReturnType<typeof calculateCostOfInactionMetrics>
): string {
  const monthly = costOfInaction.totalCostOfInaction.monthly;
  if (monthly > 10000) {
    return `Every month you wait costs £${Math.round(monthly / 1000)}k. The clock is ticking.`;
  }
  return "The sooner you start, the sooner you're free.";
}

function createEmptyMetric(message: string): any {
  return {
    value: null,
    formatted: 'Unknown',
    benchmark: null,
    benchmarkSource: 'N/A',
    variance: null,
    varianceFormatted: '',
    status: 'neutral',
    direction: null,
    phrases: {
      headline: message,
      impact: '',
      context: ''
    },
    calculation: {
      formula: 'N/A',
      inputs: {},
      timestamp: new Date().toISOString()
    }
  };
}

function createEmptyPayrollMetrics(benchmark: IndustryBenchmark): any {
  return {
    staffCostsPercent: createEmptyMetric('Staff costs percentage unknown'),
    annualExcess: createEmptyMetric('Annual excess unknown'),
    monthlyExcess: createEmptyMetric('Monthly excess unknown'),
    twoYearExcess: createEmptyMetric('Two-year excess unknown'),
    directorCompensation: null,
    staffCostsAsPercentOfGrossProfit: null,
    summary: {
      isOverstaffed: false,
      excessPercentage: 0,
      assessment: 'typical' as const,
      benchmark: {
        good: benchmark.payroll.good,
        typical: benchmark.payroll.typical,
        concern: benchmark.payroll.concern,
        source: benchmark.name
      }
    }
  };
}

function createEmptyValuationMetrics(): any {
  return {
    adjustedEbitda: createEmptyMetric('EBITDA unknown'),
    operatingProfit: null,
    multipleRange: {
      low: 3.0,
      high: 5.0,
      basis: 'Default SME range',
      adjustments: [],
      phrases: {
        headline: 'Multiple range: 3-5x EBITDA (estimate)',
        context: 'Cannot calculate without financial data'
      }
    },
    earningsBasedValue: {
      low: null,
      high: null,
      formatted: 'Unknown',
      phrases: {
        headline: 'Earnings-based value: Unknown',
        impact: 'Need financial data to calculate',
        context: ''
      }
    },
    enterpriseValue: {
      low: null,
      high: null,
      formatted: 'Unknown',
      includesHiddenAssets: false,
      phrases: {
        headline: 'Enterprise value: Unknown',
        impact: 'Need financial data to calculate',
        context: ''
      }
    },
    pricePerShare: null
  };
}
