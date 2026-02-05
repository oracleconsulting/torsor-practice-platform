// ============================================================================
// PASS 1 OUTPUT TYPES - "Calculate Once, Narrate Forever"
// ============================================================================
// Every metric includes pre-built phrases that Pass 2 uses verbatim.
// Pass 2 NEVER calculates - it only selects and narrates.
// ============================================================================

// =============================================================================
// STANDARD METRIC FORMAT
// =============================================================================

export interface MetricPhrases {
  headline: string;           // "Payroll at 36.5% vs 28% benchmark"
  impact: string;             // "£193k/year excess"
  context: string;            // "Staff costs are 8.5% above industry benchmark"
  monthlyImpact?: string;     // "£16k walks out the door every month"
  yearlyImpact?: string;      // "£193k/year that could be profit"
  twoYearImpact?: string;     // "£387k over the next two years"
  comparison?: string;        // "36.5% vs the 28% benchmark for keys/lockers wholesalers"
  actionRequired?: string;    // "Right-size the team before exit"
}

export interface CalculationAudit {
  formula: string;
  inputs: Record<string, number | string | null>;
  timestamp: string;
}

export interface CalculatedMetric {
  // Raw values
  value: number | null;
  formatted: string;
  
  // Comparison
  benchmark: number | null;
  benchmarkSource: string;
  variance: number | null;
  varianceFormatted: string;
  
  // Assessment
  status: 'excellent' | 'good' | 'neutral' | 'concern' | 'critical';
  direction: 'above' | 'below' | 'at' | null;
  
  // Pre-built phrases (Pass 2 uses these verbatim)
  phrases: MetricPhrases;
  
  // Calculation audit trail
  calculation: CalculationAudit;
}

// =============================================================================
// PAYROLL METRICS
// =============================================================================

export interface PayrollMetrics {
  status: 'calculated' | 'no_data' | 'not_applicable';
  hasData: boolean; // Backward compatibility: true when status is 'calculated', false otherwise
  notApplicableReason?: string;
  
  staffCostsPercent: CalculatedMetric;
  annualExcess: CalculatedMetric;
  monthlyExcess: CalculatedMetric;
  twoYearExcess: CalculatedMetric;
  directorCompensation: CalculatedMetric | null;
  staffCostsAsPercentOfGrossProfit: CalculatedMetric | null;
  
  // Summary
  summary: {
    isOverstaffed: boolean;
    excessPercentage: number;
    assessment: 'efficient' | 'typical' | 'elevated' | 'concerning';
    benchmark: {
      good: number;
      typical: number;
      concern: number;
      source: string;
    };
  };
}

// =============================================================================
// VALUATION METRICS
// =============================================================================

export interface ValuationMetrics {
  status: 'calculated' | 'no_data' | 'not_applicable';
  hasData: boolean; // Backward compatibility: true when status is 'calculated', false otherwise
  notApplicableReason?: string;
  
  adjustedEbitda: CalculatedMetric;
  operatingProfit: CalculatedMetric | null;
  
  multipleRange: {
    low: number;
    high: number;
    basis: string;
    adjustments: Array<{ factor: string; impact: number; reason: string }>;
    phrases: {
      headline: string;
      context: string;
    };
  };
  
  earningsBasedValue: {
    low: number | null;
    high: number | null;
    formatted: string;
    phrases: MetricPhrases;
  };
  
  enterpriseValue: {
    low: number | null;
    high: number | null;
    formatted: string;
    includesHiddenAssets: boolean;
    phrases: MetricPhrases;
  };
  
  pricePerShare: CalculatedMetric | null;
}

// =============================================================================
// TRAJECTORY METRICS
// =============================================================================

export interface TrajectoryMetrics {
  status: 'calculated' | 'no_data' | 'not_applicable';
  hasData: boolean; // Backward compatibility: true when status is 'calculated', false otherwise
  notApplicableReason?: string;
  
  revenueGrowthYoY: CalculatedMetric;
  revenueGrowth3Year: CalculatedMetric | null;
  profitGrowthYoY: CalculatedMetric | null;
  
  trend: {
    classification: 'growing' | 'stable' | 'declining' | 'volatile' | 'unknown';
    confidence: number;
    phrases: {
      headline: string;
      context: string;
      implication: string;
    };
  };
  
  projectedTrajectory: {
    oneYear: number | null;
    twoYear: number | null;
    phrases: {
      headline: string;
    };
  } | null;
}

// =============================================================================
// PRODUCTIVITY METRICS
// =============================================================================

export interface ProductivityMetrics {
  status: 'calculated' | 'no_data' | 'not_applicable';
  hasData: boolean; // Backward compatibility: true when status is 'calculated', false otherwise
  notApplicableReason?: string;
  
  revenuePerHead: CalculatedMetric;
  profitPerHead: CalculatedMetric | null;
  revenuePerPayrollPound: CalculatedMetric | null;
  excessHeadcount: CalculatedMetric;
}

// =============================================================================
// PROFITABILITY METRICS
// =============================================================================

export interface ProfitabilityMetrics {
  status: 'calculated' | 'no_data' | 'not_applicable';
  hasData: boolean; // Backward compatibility: true when status is 'calculated', false otherwise
  notApplicableReason?: string;
  
  grossMargin: CalculatedMetric;
  operatingMargin: CalculatedMetric | null;
  netMargin: CalculatedMetric | null;
  ebitdaMargin: CalculatedMetric | null;
  ebitda: CalculatedMetric | null;
}

// =============================================================================
// LIQUIDITY METRICS
// =============================================================================

export interface LiquidityMetrics {
  currentRatio: CalculatedMetric | null;
  quickRatio: CalculatedMetric | null;
  cashPosition: CalculatedMetric | null;
  workingCapitalRatio: CalculatedMetric | null;
  excessCash: CalculatedMetric | null;
}

// =============================================================================
// EFFICIENCY METRICS
// =============================================================================

export interface EfficiencyMetrics {
  debtorDays: CalculatedMetric | null;
  creditorDays: CalculatedMetric | null;
  stockDays: CalculatedMetric | null;
  cashConversionCycle: CalculatedMetric | null;
  assetTurnover: CalculatedMetric | null;
}

// =============================================================================
// LEVERAGE METRICS
// =============================================================================

export interface LeverageMetrics {
  debtToEquity: CalculatedMetric | null;
  interestCover: CalculatedMetric | null;
  gearing: CalculatedMetric | null;
  netDebt: CalculatedMetric | null;
}

// =============================================================================
// WORKING CAPITAL METRICS
// =============================================================================

export interface WorkingCapitalMetrics {
  workingCapital: CalculatedMetric | null;
  workingCapitalDays: CalculatedMetric | null;
  workingCapitalRequirement: CalculatedMetric | null;
  workingCapitalExcess: CalculatedMetric | null;
  seasonalVariation: CalculatedMetric | null;
}

// =============================================================================
// HIDDEN ASSETS METRICS
// =============================================================================

export interface HiddenAssetItem {
  type: 'freehold_property' | 'excess_cash' | 'undervalued_stock' | 'intellectual_property' | 'contracts' | 'other';
  value: number;
  formatted: string;
  description: string;
  source: 'accounts' | 'assessment' | 'calculated';
}

export interface HiddenAssetsMetrics {
  status: 'calculated' | 'no_data' | 'not_applicable';
  hasData: boolean; // Backward compatibility: true when status is 'calculated', false otherwise
  notApplicableReason?: string;
  
  freeholdProperty: CalculatedMetric | null;
  excessCash: CalculatedMetric | null;
  undervaluedStock: CalculatedMetric | null;
  intellectualProperty: CalculatedMetric | null;
  totalHiddenAssets: CalculatedMetric;
  hiddenAssetsList: HiddenAssetItem[];
}

// =============================================================================
// EXIT READINESS METRICS
// =============================================================================

export interface ExitReadinessFactor {
  name: string;
  score: number;
  maxScore: number;
  status: 'green' | 'amber' | 'red';
  note: string;
}

export interface ExitReadinessMetrics {
  status: 'calculated' | 'no_data' | 'not_applicable';
  hasData: boolean; // Backward compatibility: true when status is 'calculated', false otherwise
  notApplicableReason?: string;
  
  overallScore: CalculatedMetric;
  founderDependency: CalculatedMetric;
  documentationScore: CalculatedMetric | null;
  systemsScore: CalculatedMetric | null;
  teamScore: CalculatedMetric | null;
  
  factors: ExitReadinessFactor[];
  strengths: string[];
  blockers: string[];
  
  phrases: {
    summary: string;
    topStrength: string;
    topBlocker: string;
  };
}

// =============================================================================
// CONCENTRATION METRICS
// =============================================================================

export interface ConcentrationMetrics {
  topCustomerPercent: CalculatedMetric | null;
  topFiveCustomersPercent: CalculatedMetric | null;
  recurringRevenuePercent: CalculatedMetric | null;
  singleSupplierRisk: CalculatedMetric | null;
  
  phrases: {
    customerConcentration: string;
    revenueQuality: string;
  };
}

// =============================================================================
// FOUNDER DEPENDENCY METRICS
// =============================================================================

export interface FounderDependencyMetrics {
  overallScore: CalculatedMetric;
  hoursWorked: CalculatedMetric | null;
  criticalDecisions: CalculatedMetric | null;
  clientRelationships: CalculatedMetric | null;
  
  phrases: {
    summary: string;
    buyerView: string;
  };
}

// =============================================================================
// COST OF INACTION METRICS
// =============================================================================

export interface CostComponent {
  category: string;
  monthly: number;
  annual: number;
  overHorizon: number;
  formatted: {
    monthly: string;
    annual: string;
    overHorizon: string;
  };
  phrases: {
    monthly: string;
    annual: string;
    overHorizon: string;
  };
  confidence: 'calculated' | 'estimated' | 'inferred';
}

export interface CostOfInactionMetrics {
  status: 'calculated' | 'no_data' | 'not_applicable';
  hasData: boolean; // Backward compatibility: true when status is 'calculated', false otherwise
  notApplicableReason?: string;
  
  payrollExcess: CostComponent | null;
  marginLeakage: CostComponent | null;
  efficiencyLoss: CostComponent | null;
  valuationImpact: CostComponent | null;
  
  totalCostOfInaction: {
    monthly: number;
    annual: number;
    overHorizon: number;
    timeHorizon: number;
    formatted: {
      monthly: string;
      annual: string;
      overHorizon: string;
    };
    phrases: {
      headline: string;
      breakdown: string;
      urgency: string;
    };
  };
}

// =============================================================================
// ACHIEVEMENTS METRICS
// =============================================================================

export interface Achievement {
  category: 'operational' | 'financial' | 'strategic' | 'personal';
  achievement: string;
  evidence: string;
  significance: 'high' | 'medium' | 'low';
  phrase: string;
}

export interface AchievementsMetrics {
  status: 'calculated' | 'no_data' | 'not_applicable';
  hasData: boolean; // Backward compatibility: true when status is 'calculated', false otherwise
  notApplicableReason?: string;
  
  achievements: Achievement[];
  phrases: {
    topAchievements: string;
    foundationStatement: string;
  };
}

// =============================================================================
// NARRATIVE BLOCKS (Pre-built for Pass 2)
// =============================================================================

export interface GapPhrase {
  title: string;
  pattern: string;
  financialImpact: string;
  timeImpact: string;
  emotionalImpact: string;
  shiftRequired: string;
}

export interface NarrativeBlocks {
  executiveSummary: {
    openingLine: string;
    situationStatement: string;
    keyQuote: string;
  };
  
  gapPhrases: {
    payroll: GapPhrase | null;
    valuation: GapPhrase | null;
    trajectory: GapPhrase | null;
    productivity: GapPhrase | null;
    founderDependency: GapPhrase | null;
  };
  
  investmentPhrases: {
    costOfStayingLabour: string;
    costOfStayingMargin: string;
    costOfStayingTime: string;
    personalCost: string;
  };
  
  closingPhrases: {
    theAsk: string;
    urgencyAnchor: string;
    neverHadBreak: string | null;
  };
}

// =============================================================================
// CALCULATION METADATA
// =============================================================================

export interface CalculationMeta {
  engagementId: string;
  clientId: string;
  clientName: string;
  companyName: string;
  
  detectedIndustry: string;
  industryBenchmarkSource: string;
  
  dataQuality: 'comprehensive' | 'partial' | 'limited';
  availableMetrics: string[];
  missingMetrics: string[];
  
  calculatedAt: string;
  calculationVersion: string;
}

// =============================================================================
// COMPLETE PASS 1 OUTPUT
// =============================================================================

export interface Pass1Output {
  meta: CalculationMeta;
  
  // Core Financial Metrics
  profitability: ProfitabilityMetrics;
  liquidity: LiquidityMetrics;
  efficiency: EfficiencyMetrics;
  leverage: LeverageMetrics;
  
  // Operational Metrics
  productivity: ProductivityMetrics;
  payroll: PayrollMetrics;
  workingCapital: WorkingCapitalMetrics;
  
  // Growth & Trajectory
  trajectory: TrajectoryMetrics;
  
  // Valuation & Exit
  valuation: ValuationMetrics;
  hiddenAssets: HiddenAssetsMetrics;
  exitReadiness: ExitReadinessMetrics;
  
  // Risk Analysis
  concentration: ConcentrationMetrics;
  founderDependency: FounderDependencyMetrics;
  
  // Cost of Inaction
  costOfInaction: CostOfInactionMetrics;
  
  // Achievements
  achievements: AchievementsMetrics;
  
  // Pre-built narrative blocks
  narrativeBlocks: NarrativeBlocks;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function formatCurrency(value: number | null): string {
  if (value === null) return 'Unknown';
  if (Math.abs(value) >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `£${Math.round(value / 1000)}k`;
  }
  return `£${value.toLocaleString()}`;
}

export function formatPercent(value: number | null, decimals: number = 1): string {
  if (value === null) return 'Unknown';
  return `${value.toFixed(decimals)}%`;
}

export function formatDays(value: number | null): string {
  if (value === null) return 'Unknown';
  return `${Math.round(value)} days`;
}

export function formatRatio(value: number | null): string {
  if (value === null) return 'Unknown';
  return `${value.toFixed(1)}:1`;
}

export function getStatus(
  value: number | null, 
  benchmark: number, 
  direction: 'higher_is_better' | 'lower_is_better',
  thresholds: { excellent: number; good: number; concern: number }
): 'excellent' | 'good' | 'neutral' | 'concern' | 'critical' {
  if (value === null) return 'neutral';
  
  const variance = direction === 'higher_is_better' 
    ? value - benchmark 
    : benchmark - value;
  
  if (variance >= thresholds.excellent) return 'excellent';
  if (variance >= thresholds.good) return 'good';
  if (variance >= 0) return 'neutral';
  if (variance >= -thresholds.concern) return 'concern';
  return 'critical';
}
