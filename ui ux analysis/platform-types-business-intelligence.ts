// ============================================================================
// MANAGEMENT ACCOUNTS TYPES v2
// ============================================================================

// Enums
export type MATier = 'bronze' | 'silver' | 'gold';
export type MAFrequency = 'monthly' | 'quarterly';
export type MAInsightStatus = 'generating' | 'generated' | 'reviewed' | 'approved' | 'rejected' | 'published';
export type MAHeadlineSentiment = 'positive' | 'neutral' | 'warning' | 'critical';
export type MAInsightUrgency = 'info' | 'consider' | 'action_needed' | 'urgent';
export type MAInsightCategory = 'revenue' | 'margin' | 'cash' | 'efficiency' | 'growth' | 'risk' | 'cost';
export type MAExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// ASSESSMENT RESPONSES
// ============================================================================

export interface MAAssessmentResponses {
  id: string;
  engagementId: string;
  clientId: string;
  
  // Current State
  relationshipWithNumbers?: string;
  reportsInsightFrequency?: string;
  tuesdayFinancialQuestion?: string;
  magicAwayFinancial?: string;
  
  // Pain Points
  kpiPriorities?: string[];
  currentReportingLag?: string;
  decisionMakingStory?: string;
  
  // System Context
  accountingPlatform?: string;
  bookkeepingCurrency?: string;
  bookkeepingOwner?: string;
  
  // Desired Outcomes
  maTransformationDesires?: string[];
  financialVisibilityVision?: string;
  
  // Frequency & Scope
  reportingFrequencyPreference?: string;
  additionalReportingNeeds?: string[];
  
  // Raw responses
  rawResponses?: Record<string, any>;
  
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// EXTRACTED FINANCIALS
// ============================================================================

export interface MAExtractedFinancials {
  id: string;
  documentId: string;
  engagementId: string;
  periodEndDate: string;
  periodLabel?: string;
  
  // P&L
  revenue?: number;
  costOfSales?: number;
  grossProfit?: number;
  grossMarginPct?: number;
  
  staffCosts?: number;
  marketingCosts?: number;
  softwareCosts?: number;
  professionalFees?: number;
  rentUtilities?: number;
  otherOverheads?: number;
  totalOverheads?: number;
  
  operatingProfit?: number;
  operatingMarginPct?: number;
  
  interest?: number;
  netProfit?: number;
  netMarginPct?: number;
  
  // Balance Sheet
  bankBalance?: number;
  tradeDebtors?: number;
  otherCurrentAssets?: number;
  totalCurrentAssets?: number;
  
  tradeCreditors?: number;
  vatPayable?: number;
  payeNicPayable?: number;
  corporationTaxPayable?: number;
  directorLoan?: number;
  otherLiabilities?: number;
  
  netAssets?: number;
  
  // KPIs
  debtorDays?: number;
  creditorDays?: number;
  staffCostPct?: number;
  
  extractionConfidence?: number;
  manualAdjustments?: Record<string, any>;
  
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// TRUE CASH CALCULATION
// ============================================================================

export interface MATrueCashCalculation {
  id: string;
  extractedFinancialsId: string;
  engagementId: string;
  periodEndDate: string;
  
  bankBalance: number;
  lessVatPayable: number;
  lessPayeNic: number;
  lessCorporationTax: number;
  lessDirectorLoan: number;
  lessOtherCommitted: number;
  otherCommittedNotes?: string;
  
  trueCashAvailable: number;
  isPositive: boolean;
  daysRunway?: number;
  
  createdAt?: string;
}

// ============================================================================
// PERIOD COMPARISON
// ============================================================================

export interface MAPeriodComparison {
  id: string;
  engagementId: string;
  currentPeriodId: string;
  priorPeriodId?: string;
  comparisonType: 'mom' | 'yoy' | 'budget';
  
  revenueChange?: number;
  revenueChangePct?: number;
  grossProfitChange?: number;
  grossMarginChangePp?: number;
  operatingProfitChange?: number;
  operatingMarginChangePp?: number;
  netProfitChange?: number;
  
  cashChange?: number;
  debtorsChange?: number;
  debtorDaysChange?: number;
  
  staffCostsChange?: number;
  staffCostsChangePct?: number;
  otherOverheadsChange?: number;
  otherOverheadsChangePct?: number;
  
  createdAt?: string;
}

// ============================================================================
// INSIGHTS
// ============================================================================

export interface MAInsight {
  category: MAInsightCategory;
  finding: string;
  implication: string;
  action?: string;
  urgency: MAInsightUrgency;
  dataPoints: string[];
}

export interface MADecisionEnabled {
  decisionName: string;
  recommendation: string;
  supportingData: string[];
  consideration?: string;
  clientQuoteReferenced?: string;
}

export interface MAWatchItem {
  metric: string;
  currentValue: string;
  alertThreshold: string;
  direction: 'above' | 'below';
  checkFrequency: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MAMonthlyInsights {
  id: string;
  engagementId: string;
  extractedFinancialsId?: string;
  assessmentId?: string;
  periodEndDate: string;
  
  // The Headline
  headlineText: string;
  headlineSentiment: MAHeadlineSentiment;
  
  // True Cash Section
  trueCashNarrative?: string;
  trueCashCalculationId?: string;
  
  // Tuesday Question Answered
  tuesdayQuestionOriginal?: string;
  tuesdayQuestionAnswer?: string;
  tuesdayQuestionSupportingData?: Record<string, any>;
  
  // Insights
  insights: MAInsight[];
  decisionsEnabled: MADecisionEnabled[];
  watchList: MAWatchItem[];
  
  // Their Words
  clientQuotesUsed?: string[];
  
  // Meta
  llmModel: string;
  llmTokensUsed?: number;
  llmCost?: number;
  generationTimeMs?: number;
  promptVersion: string;
  
  // Workflow
  status: MAInsightStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  reviewEdits?: Record<string, any>;
  approvedBy?: string;
  approvedAt?: string;
  
  // Client Visibility
  publishedToClient: boolean;
  publishedAt?: string;
  clientViewedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ExtractFinancialsRequest {
  documentId: string;
  engagementId: string;
}

export interface ExtractFinancialsResponse {
  success: boolean;
  extractedIds?: string[];
  comparisonId?: string;
  trueCashId?: string;
  periodsFound?: number;
  isComparative?: boolean;
  error?: string;
}

export interface GenerateMAInsightsRequest {
  engagementId: string;
  periodEndDate?: string;
  regenerate?: boolean;
}

export interface GenerateMAInsightsResponse {
  success: boolean;
  insightId?: string;
  cached?: boolean;
  usage?: {
    tokens: number;
    cost: number;
    timeMs: number;
  };
  error?: string;
}

// ============================================================================
// CONTEXT FOR GENERATION
// ============================================================================

export interface MAGenerationContext {
  // Client Info
  clientName: string;
  companyName: string;
  industry?: string;
  
  // Assessment Data
  assessment: MAAssessmentResponses;
  
  // Financial Data
  currentPeriod: MAExtractedFinancials;
  priorPeriod?: MAExtractedFinancials;
  comparison?: MAPeriodComparison;
  trueCash: MATrueCashCalculation;
  
  // Benchmarks (if available)
  benchmark?: MAIndustryBenchmark;
  
  // Discovery/365 Data (if available)
  northStar?: string;
  emotionalAnchors?: {
    painPhrases: string[];
    desirePhrases: string[];
  };
}

export interface MAIndustryBenchmark {
  industryName: string;
  revenueBand: string;
  medianOperatingMarginPct?: number;
  topQuartileOperatingMarginPct?: number;
  medianStaffCostPct?: number;
  medianDebtorDays?: number;
}

