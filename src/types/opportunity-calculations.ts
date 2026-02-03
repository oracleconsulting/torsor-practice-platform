// =============================================================================
// OPPORTUNITY CALCULATION TYPES
// Full calculation transparency for benchmarking reports
// =============================================================================

/**
 * Single step in a calculation breakdown
 */
export interface CalculationStep {
  description: string;
  formula: string;
  values: Record<string, number | string>;
  result: number;
  unit: string;
}

/**
 * Assumption used in a calculation
 */
export interface Assumption {
  name: string;
  value: string;
  rationale: string;
  source: 'industry_data' | 'client_data' | 'professional_judgement';
}

/**
 * Adjustment applied to a calculation
 */
export interface Adjustment {
  name: string;
  factor: number;
  rationale: string;
}

/**
 * Full opportunity calculation with transparency
 */
export interface OpportunityCalculation {
  id: string;
  title: string;
  headlineValue: number;
  calculationType: 'margin_gap' | 'efficiency_gap' | 'pricing_gap' | 'cost_saving' | 'revenue_growth';
  
  // The full working
  calculation: {
    steps: CalculationStep[];
    assumptions: Assumption[];
    adjustments: Adjustment[];
    finalValue: number;
  };
  
  // What it means
  interpretation: {
    whatThisMeans: string;
    whyThisMatters: string;
    caveat: string;
  };
  
  // How to capture it
  pathToCapture: {
    fullCapture: string;
    realisticCapture: string;
    quickWin: string;
    timeframe: string;
  };
}

// =============================================================================
// ENHANCED VALUE SUPPRESSOR TYPES
// =============================================================================

/**
 * Enhanced value suppressor with full current/target/recovery data
 */
export interface EnhancedValueSuppressor {
  code: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  
  // Current state
  current: {
    value: string;
    metric: string;
    discountPercent: number;
    discountValue: number;
  };
  
  // Target state
  target: {
    value: string;
    metric: string;
    discountPercent: number;
    discountValue: number;
  };
  
  // Value recovery
  recovery: {
    valueRecoverable: number;
    percentageRecovery: number;
    timeframe: string;
  };
  
  // Evidence and context
  evidence: string;
  whyThisDiscount: string;
  industryContext: string;
  
  // Path to fix
  pathToFix: {
    summary: string;
    steps: string[];
    investment: number;
    dependencies: string[];
  };
  
  // Flags
  fixable: boolean;
  category: 'concentration' | 'founder' | 'succession' | 'revenue_model' | 'governance' | 'other';
}

// =============================================================================
// EXIT READINESS TYPES
// =============================================================================

/**
 * Single component of exit readiness score
 */
export interface ExitReadinessComponent {
  id: string;
  name: string;
  currentScore: number;
  maxScore: number;
  targetScore: number;
  gap: string;
  improvementActions: string[];
}

/**
 * Full exit readiness score with component breakdown
 */
export interface ExitReadinessScore {
  totalScore: number;
  maxScore: number;
  level: 'not_ready' | 'needs_work' | 'progressing' | 'credibly_ready' | 'exit_ready';
  levelLabel: string;
  components: ExitReadinessComponent[];
  pathTo70: {
    actions: string[];
    timeframe: string;
    investment: number;
    valueUnlocked: number;
  };
}

// =============================================================================
// SURPLUS CASH TYPES
// =============================================================================

/**
 * Detailed surplus cash breakdown
 */
export interface SurplusCashData {
  actualCash: number;
  requiredCash: number;
  surplusCash: number;
  surplusAsPercentOfRevenue: number;
  components: {
    operatingBuffer: number;
    workingCapitalRequirement: number;
    staffCostsQuarterly: number;
    adminExpensesQuarterly: number;
    debtors: number;
    creditors: number;
    stock: number;
    netWorkingCapital: number;
  };
  methodology: string;
  confidence: 'high' | 'medium' | 'low';
}

// =============================================================================
// TWO PATHS NARRATIVE TYPES
// =============================================================================

/**
 * "Two Paths, One Goal" narrative connecting operational and strategic
 */
export interface TwoPathsNarrative {
  headline: string;
  explanation: string;
  ownerJourney: {
    year1: string;
    year2: string;
    year3: string;
  };
  bottomLine: string;
}
