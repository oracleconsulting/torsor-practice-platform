// =============================================================================
// BENCHMARKING & VALUATION TYPES
// =============================================================================

/**
 * Business Valuation Analysis
 * Calculates baseline value, identifies value suppressors from HVA data,
 * and produces a value bridge showing current vs potential value.
 */
export interface ValueAnalysis {
  asOfDate: string;
  
  // Baseline valuation
  baseline: {
    method: 'EBITDA' | 'Revenue' | 'SDE';
    ebitda: number;
    ebitdaMargin: number;
    multipleRange: { low: number; mid: number; high: number };
    baseValue: { low: number; mid: number; high: number };
    surplusCash: number;
    enterpriseValue: { low: number; mid: number; high: number };
    multipleJustification: string;
    totalBaseline?: number; // Added for value bridge calculation
  };
  
  // Value suppressors from HVA
  suppressors: ValueSuppressor[];

  // Adjusted EV = enterprise value after operating-risk discounts (before adding surplus cash)
  adjustedEV?: { low: number; mid: number; high: number };
  
  // Aggregate calculations (handles overlapping discounts)
  aggregateDiscount: {
    percentRange: { low: number; mid: number; high: number };
    methodology: string;
  };
  
  // Final values
  currentMarketValue: { low: number; mid: number; high: number };
  valueGap: { low: number; mid: number; high: number };
  valueGapPercent: number;
  
  // Exit readiness assessment
  exitReadiness: {
    score: number;  // 0-100
    verdict: 'ready' | 'needs_work' | 'not_ready';
    blockers: string[];
    strengths: string[];
  };
  
  // Potential value recovery
  potentialValue: { low: number; mid: number; high: number };
  pathToValue: {
    timeframeMonths: number;
    recoverableValue: { low: number; mid: number; high: number };
    keyActions: string[];
  };
  
  // Value enhancers (positive factors)
  enhancers: ValueEnhancer[];
}

/**
 * Value Suppressor - A factor that reduces business value
 */
export interface ValueSuppressor {
  id: string;
  name: string;
  category: 'founder_dependency' | 'concentration' | 'documentation' | 'succession' | 'trajectory' | 'recurring_revenue' | 'other';
  hvaField: string;           // Source field from HVA
  hvaValue: string | number;  // What they answered
  evidence: string;           // Human readable explanation
  discountPercent: { low: number; high: number };
  impactAmount: { low: number; high: number };
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediable: boolean;
  remediationService?: string;
  remediationTimeMonths?: number;
  talkingPoint?: string;      // For adviser
  questionToAsk?: string;     // Discovery question
}

/**
 * Value Enhancer - A factor that protects or adds value
 */
export interface ValueEnhancer {
  id: string;
  name: string;
  evidence: string;
  impact: 'premium_protection' | 'additive' | 'trajectory';
  value?: number;
}

/**
 * Industry EBITDA multiples for valuation
 */
export interface IndustryMultiples {
  industryCode: string;
  multiples: { low: number; mid: number; high: number };
  factors: string[];  // What drives higher/lower multiples
}

// =============================================================================
// BENCHMARKING DATA TYPES
// =============================================================================

export interface MetricComparison {
  metricCode: string;
  metricName: string;
  clientValue: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  percentile: number | null;
  annualImpact: number | null;
  category: string;
}

export interface BenchmarkReport {
  id: string;
  engagementId: string;
  industryCode: string;
  status: string;
  pass1Data: Pass1Data | null;
  headline?: string;
  executiveSummary?: string;
  strengthNarrative?: string;
  gapNarrative?: string;
  opportunityNarrative?: string;
  valueAnalysis?: ValueAnalysis;
  founderRiskLevel?: string;
  founderRiskScore?: number;
  founderRiskFactors?: string[];
  founderRiskValuationImpact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pass1Data {
  classification?: {
    revenueBand?: string;
    employeeBand?: string;
    industryCode?: string;
  };
  enrichedData?: {
    revenue?: number;
    revenueGrowth?: number;
    grossMargin?: number;
    grossMarginTrend?: 'improving' | 'stable' | 'declining';
    netMargin?: number;
    ebitdaMargin?: number;
    employeeCount?: number;
    revenuePerEmployee?: number;
    debtorDays?: number;
    creditorDays?: number;
    currentRatio?: number;
  };
  balanceSheet?: {
    cash?: number;
    netAssets?: number;
    freeholdProperty?: number;
    investments?: number;
    totalAssets?: number;
    currentAssets?: number;
    currentLiabilities?: number;
  };
  surplusCash?: {
    hasData: boolean;
    actualCash?: number;
    requiredCash?: number;
    surplusCash?: number;
    supplierFundedWorkingCapital?: number;
  };
  metricsComparison?: MetricComparison[];
  overallPosition?: {
    percentile: number;
    strengthCount: number;
    gapCount: number;
    narrative: string;
  };
  topStrengths?: string[];
  topGaps?: string[];
  opportunitySizing?: {
    totalAnnualOpportunity: number;
    breakdown: Record<string, number>;
  };
  financialTrends?: Array<{
    metric: string;
    direction: 'improving' | 'stable' | 'declining' | 'volatile';
    isRecovering: boolean;
    narrative: string;
  }>;
  valueAnalysis?: ValueAnalysis;
  founderRisk?: {
    level: string;
    score: number;
    factors: string[];
    valuationImpact: string;
  };
  supplementary?: Record<string, any>;
  collectedData?: boolean;
  client_concentration_top3?: number;
  client_concentration_details?: any;
}

// =============================================================================
// HVA (HIDDEN VALUE AUDIT) TYPES
// =============================================================================

export interface HVAResponses {
  // Founder dependency
  knowledge_dependency_percentage?: number | string;
  personal_brand_percentage?: number | string;
  
  // Succession
  succession_your_role?: string;
  succession_sales?: string;
  succession_technical?: string;
  succession_operations?: string;
  
  // Autonomy
  autonomy_finance?: string;
  autonomy_strategy?: string;
  autonomy_sales?: string;
  autonomy_delivery?: string;
  
  // Key person risk
  risk_tech_lead?: string;
  risk_sales_lead?: string;
  risk_finance_lead?: string;
  risk_operations_lead?: string;
  
  // Concentration
  top3_customer_revenue_percentage?: number | string;
  client_concentration_top3?: number | string;
  
  // IP & Documentation
  unique_methods_protection?: string;
  unique_methods?: string;
  critical_processes_undocumented?: string[];
  documentation_score?: string | number;
  
  // Revenue model
  recurring_revenue_percentage?: number | string;
  contract_backlog_months?: number;
  
  // Team
  team_advocacy_percentage?: number | string;
  employee_turnover_rate?: number | string;
  
  // Systems
  tech_stack_health_percentage?: number | string;
  
  // Pricing
  last_price_increase?: string;
  price_setting_method?: string;
  
  // Growth
  competitive_moat?: string[];
  average_client_tenure?: string;
  
  // Other
  [key: string]: any;
}

