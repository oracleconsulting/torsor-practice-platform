// ============================================================================
// MANAGEMENT ACCOUNTS TYPES
// ============================================================================
// Types for the Management Accounts AI Layer
// Philosophy: Transform "here are your numbers" into "here's what your numbers
//             mean for your journey to [North Star]"
// ============================================================================

// ============================================================================
// ENUMS / LITERAL TYPES
// ============================================================================

export type MATier = 'bronze' | 'silver' | 'gold';
export type MAFrequency = 'monthly' | 'quarterly';
export type MAConnectionStatus = 'not_connected' | 'connected' | 'error' | 'expired';
export type MAEngagementStatus = 'pending' | 'active' | 'paused' | 'cancelled';
export type MAInsightStatus = 'generating' | 'generated' | 'approved' | 'rejected' | 'shared';
export type MAHeadlineSentiment = 'positive' | 'neutral' | 'warning' | 'critical';
export type MANorthStarSentiment = 'closer' | 'stable' | 'further';
export type MAInsightUrgency = 'info' | 'consider' | 'action_needed';
export type MAInsightCategory = 'revenue' | 'margin' | 'cash' | 'efficiency' | 'growth' | 'risk';
export type MADataSource = 'xero' | 'qbo' | 'manual' | 'upload';
export type MARevenueBand = 'under_250k' | '250k_500k' | '500k_1m' | '1m_2m' | '2m_5m' | '5m_10m' | 'over_10m';
export type MABenchmarkSource = 'fame' | 'orbis' | 'internal' | 'industry_body' | 'research';
export type MAConfidenceLevel = 'low' | 'medium' | 'high';
export type MAFeedbackSource = 'practice_team' | 'client';
export type MABenchmarkPosition = 'above_top' | 'top_quartile' | 'above_median' | 'below_median' | 'bottom_quartile';

// ============================================================================
// ENGAGEMENT
// ============================================================================

export interface MAEngagement {
  id: string;
  clientId: string;
  practiceId: string;
  tier: MATier;
  frequency: MAFrequency;
  startDate: string;
  endDate?: string;
  xeroTenantId?: string;
  xeroConnectionStatus: MAConnectionStatus;
  xeroLastSync?: string;
  qboRealmId?: string;
  qboConnectionStatus: MAConnectionStatus;
  qboLastSync?: string;
  settings: MAEngagementSettings;
  monthlyFee?: number;
  status: MAEngagementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MAEngagementSettings {
  kpiFocusAreas: string[];
  customMetrics: MACustomMetric[];
  reportRecipients: string[];
  autoGenerateInsights: boolean;
  includeBenchmarks: boolean;
}

export interface MACustomMetric {
  name: string;
  formula?: string;
  target?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}

// Database row type (snake_case from Supabase)
export interface MAEngagementRow {
  id: string;
  client_id: string;
  practice_id: string;
  tier: MATier;
  frequency: MAFrequency;
  start_date: string;
  end_date?: string;
  xero_tenant_id?: string;
  xero_connection_status: MAConnectionStatus;
  xero_last_sync?: string;
  qbo_realm_id?: string;
  qbo_connection_status: MAConnectionStatus;
  qbo_last_sync?: string;
  settings: MAEngagementSettings;
  monthly_fee?: number;
  status: MAEngagementStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FINANCIAL SNAPSHOT
// ============================================================================

export interface MAFinancialSnapshot {
  id: string;
  engagementId: string;
  periodEndDate: string;
  periodType: 'month' | 'quarter';
  
  // P&L
  revenue?: number;
  costOfSales?: number;
  grossProfit?: number;
  grossMarginPct?: number;
  overheads?: number;
  operatingProfit?: number;
  operatingMarginPct?: number;
  netProfit?: number;
  netMarginPct?: number;
  
  // Balance Sheet
  cashPosition?: number;
  debtorsTotal?: number;
  debtorsDays?: number;
  creditorsTotal?: number;
  creditorsDays?: number;
  inventoryValue?: number;
  netAssets?: number;
  
  // Comparatives
  revenueVsPriorMonth?: number;
  revenueVsPriorMonthPct?: number;
  revenueVsPriorYear?: number;
  revenueVsPriorYearPct?: number;
  revenueVsBudget?: number;
  revenueVsBudgetPct?: number;
  profitVsBudget?: number;
  profitVsBudgetPct?: number;
  cashVsPriorMonth?: number;
  
  // Staffing
  headcount?: number;
  revenuePerHead?: number;
  staffCosts?: number;
  staffCostPctRevenue?: number;
  
  // Meta
  source: MADataSource;
  sourceSyncId?: string;
  rawData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Database row type (snake_case from Supabase)
export interface MAFinancialSnapshotRow {
  id: string;
  engagement_id: string;
  period_end_date: string;
  period_type: 'month' | 'quarter';
  
  // P&L
  revenue?: number;
  cost_of_sales?: number;
  gross_profit?: number;
  gross_margin_pct?: number;
  overheads?: number;
  operating_profit?: number;
  operating_margin_pct?: number;
  net_profit?: number;
  net_margin_pct?: number;
  
  // Balance Sheet
  cash_position?: number;
  debtors_total?: number;
  debtors_days?: number;
  creditors_total?: number;
  creditors_days?: number;
  inventory_value?: number;
  net_assets?: number;
  
  // Comparatives
  revenue_vs_prior_month?: number;
  revenue_vs_prior_month_pct?: number;
  revenue_vs_prior_year?: number;
  revenue_vs_prior_year_pct?: number;
  revenue_vs_budget?: number;
  revenue_vs_budget_pct?: number;
  profit_vs_budget?: number;
  profit_vs_budget_pct?: number;
  cash_vs_prior_month?: number;
  
  // Staffing
  headcount?: number;
  revenue_per_head?: number;
  staff_costs?: number;
  staff_cost_pct_revenue?: number;
  
  // Meta
  source: MADataSource;
  source_sync_id?: string;
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INSIGHTS
// ============================================================================

export interface MAMonthlyInsights {
  id: string;
  snapshotId: string;
  engagementId: string;
  periodEndDate: string;
  
  // The Headline
  headlineText: string;
  headlineSentiment: MAHeadlineSentiment;
  
  // Structured Insights
  insights: MAInsight[];
  decisionsEnabled: MADecision[];
  watchList: MAWatchItem[];
  
  // North Star
  northStarConnection?: string;
  northStarSentiment?: MANorthStarSentiment;
  
  // Benchmarks
  benchmarkComparison?: MABenchmarkComparison;
  
  // Generation Meta
  llmModel: string;
  llmTokensUsed?: number;
  llmCost?: number;
  generationTimeMs?: number;
  generationPromptVersion?: string;
  
  // Workflow
  status: MAInsightStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  sharedWithClient: boolean;
  sharedAt?: string;
  sharedBy?: string;
  
  // Client Feedback
  clientFeedback?: Record<string, unknown>;
  
  createdAt: string;
  updatedAt: string;
}

export interface MAInsight {
  category: MAInsightCategory;
  finding: string;
  implication: string;
  action?: string;
  urgency: MAInsightUrgency;
}

export interface MADecision {
  decision: string;
  supportingData: string[];
  consideration?: string;
}

export interface MAWatchItem {
  metric: string;
  currentValue: string;
  threshold: string;
  checkDate: string;
}

export interface MABenchmarkComparison {
  industryName: string;
  revenueBand: string;
  metrics: MABenchmarkMetric[];
  highlights?: {
    strengths: string[];
    concerns: string[];
  };
}

export interface MABenchmarkMetric {
  name: string;
  clientValue: number;
  industryMedian: number;
  topQuartile: number;
  position: MABenchmarkPosition;
}

// Database row type (snake_case from Supabase)
export interface MAMonthlyInsightsRow {
  id: string;
  snapshot_id: string;
  engagement_id: string;
  period_end_date: string;
  headline_text: string;
  headline_sentiment: MAHeadlineSentiment;
  insights: MAInsight[];
  decisions_enabled: MADecision[];
  watch_list: MAWatchItem[];
  north_star_connection?: string;
  north_star_sentiment?: MANorthStarSentiment;
  benchmark_comparison?: MABenchmarkComparison;
  llm_model: string;
  llm_tokens_used?: number;
  llm_cost?: number;
  generation_time_ms?: number;
  generation_prompt_version?: string;
  status: MAInsightStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  approved_by?: string;
  approved_at?: string;
  shared_with_client: boolean;
  shared_at?: string;
  shared_by?: string;
  client_feedback?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INDUSTRY BENCHMARKS
// ============================================================================

export interface MAIndustryBenchmark {
  id: string;
  practiceId?: string;
  industryCode: string;
  industryName: string;
  revenueBand: MARevenueBand;
  periodYear: number;
  
  // Margin Benchmarks
  medianGrossMarginPct?: number;
  medianNetMarginPct?: number;
  topQuartileGrossMarginPct?: number;
  topQuartileNetMarginPct?: number;
  bottomQuartileGrossMarginPct?: number;
  bottomQuartileNetMarginPct?: number;
  
  // Working Capital Benchmarks
  medianDebtorDays?: number;
  medianCreditorDays?: number;
  topQuartileDebtorDays?: number;
  topQuartileCreditorDays?: number;
  
  // Efficiency Benchmarks
  medianRevenuePerHead?: number;
  medianStaffCostPct?: number;
  topQuartileRevenuePerHead?: number;
  
  // Source & Quality
  sampleSize?: number;
  dataSource: MABenchmarkSource;
  confidenceLevel: MAConfidenceLevel;
  
  createdAt: string;
  updatedAt: string;
}

// Database row type (snake_case from Supabase)
export interface MAIndustryBenchmarkRow {
  id: string;
  practice_id?: string;
  industry_code: string;
  industry_name: string;
  revenue_band: MARevenueBand;
  period_year: number;
  median_gross_margin_pct?: number;
  median_net_margin_pct?: number;
  top_quartile_gross_margin_pct?: number;
  top_quartile_net_margin_pct?: number;
  bottom_quartile_gross_margin_pct?: number;
  bottom_quartile_net_margin_pct?: number;
  median_debtor_days?: number;
  median_creditor_days?: number;
  top_quartile_debtor_days?: number;
  top_quartile_creditor_days?: number;
  median_revenue_per_head?: number;
  median_staff_cost_pct?: number;
  top_quartile_revenue_per_head?: number;
  sample_size?: number;
  data_source: MABenchmarkSource;
  confidence_level: MAConfidenceLevel;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FEEDBACK
// ============================================================================

export interface MAInsightFeedback {
  id: string;
  insightId: string;
  feedbackSource: MAFeedbackSource;
  feedbackBy?: string;
  headlineAccuracy?: number;
  insightRelevance?: number;
  actionUsefulness?: number;
  northStarConnectionQuality?: number;
  overallRating?: number;
  whatWasValuable?: string;
  whatWasMissing?: string;
  whatWasWrong?: string;
  suggestedImprovements?: string;
  editsMade?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// CLIENT CONTEXT (for insight generation)
// ============================================================================

export interface MAClientContext {
  clientId: string;
  clientName: string;
  companyName: string;
  industry: string;
  industryCode?: string;
  
  // From Discovery/365
  northStar?: string;
  archetype?: string;
  emotionalAnchors: {
    painPhrases: string[];
    desirePhrases: string[];
  };
  knownGoals: string[];
  
  // From Advisor Notes
  recentDecisions: string[];
  upcomingEvents: string[];
  advisorNotes: string[];
}

// ============================================================================
// API TYPES
// ============================================================================

export interface GenerateMAInsightsRequest {
  snapshotId: string;
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

export interface MAInsightGenerationInput {
  snapshot: MAFinancialSnapshotRow;
  priorSnapshots: MAFinancialSnapshotRow[];
  clientContext: MAClientContext;
  benchmark?: MAIndustryBenchmarkRow;
  engagementSettings: MAEngagementSettings;
}

// ============================================================================
// LLM RESPONSE TYPES
// ============================================================================

export interface MALLMResponse {
  headline: {
    text: string;
    sentiment: MAHeadlineSentiment;
  };
  insights: MAInsight[];
  decisionsEnabled: MADecision[];
  watchList: MAWatchItem[];
  northStarConnection: {
    narrative: string;
    sentiment: MANorthStarSentiment;
  };
  benchmarkHighlights?: {
    strengths: string[];
    concerns: string[];
  };
}

// ============================================================================
// HELPER FUNCTIONS FOR TYPE CONVERSION
// ============================================================================

export function engagementRowToEngagement(row: MAEngagementRow): MAEngagement {
  return {
    id: row.id,
    clientId: row.client_id,
    practiceId: row.practice_id,
    tier: row.tier,
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date,
    xeroTenantId: row.xero_tenant_id,
    xeroConnectionStatus: row.xero_connection_status,
    xeroLastSync: row.xero_last_sync,
    qboRealmId: row.qbo_realm_id,
    qboConnectionStatus: row.qbo_connection_status,
    qboLastSync: row.qbo_last_sync,
    settings: row.settings,
    monthlyFee: row.monthly_fee,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function snapshotRowToSnapshot(row: MAFinancialSnapshotRow): MAFinancialSnapshot {
  return {
    id: row.id,
    engagementId: row.engagement_id,
    periodEndDate: row.period_end_date,
    periodType: row.period_type,
    revenue: row.revenue,
    costOfSales: row.cost_of_sales,
    grossProfit: row.gross_profit,
    grossMarginPct: row.gross_margin_pct,
    overheads: row.overheads,
    operatingProfit: row.operating_profit,
    operatingMarginPct: row.operating_margin_pct,
    netProfit: row.net_profit,
    netMarginPct: row.net_margin_pct,
    cashPosition: row.cash_position,
    debtorsTotal: row.debtors_total,
    debtorsDays: row.debtors_days,
    creditorsTotal: row.creditors_total,
    creditorsDays: row.creditors_days,
    inventoryValue: row.inventory_value,
    netAssets: row.net_assets,
    revenueVsPriorMonth: row.revenue_vs_prior_month,
    revenueVsPriorMonthPct: row.revenue_vs_prior_month_pct,
    revenueVsPriorYear: row.revenue_vs_prior_year,
    revenueVsPriorYearPct: row.revenue_vs_prior_year_pct,
    revenueVsBudget: row.revenue_vs_budget,
    revenueVsBudgetPct: row.revenue_vs_budget_pct,
    profitVsBudget: row.profit_vs_budget,
    profitVsBudgetPct: row.profit_vs_budget_pct,
    cashVsPriorMonth: row.cash_vs_prior_month,
    headcount: row.headcount,
    revenuePerHead: row.revenue_per_head,
    staffCosts: row.staff_costs,
    staffCostPctRevenue: row.staff_cost_pct_revenue,
    source: row.source,
    sourceSyncId: row.source_sync_id,
    rawData: row.raw_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function insightsRowToInsights(row: MAMonthlyInsightsRow): MAMonthlyInsights {
  return {
    id: row.id,
    snapshotId: row.snapshot_id,
    engagementId: row.engagement_id,
    periodEndDate: row.period_end_date,
    headlineText: row.headline_text,
    headlineSentiment: row.headline_sentiment,
    insights: row.insights,
    decisionsEnabled: row.decisions_enabled,
    watchList: row.watch_list,
    northStarConnection: row.north_star_connection,
    northStarSentiment: row.north_star_sentiment,
    benchmarkComparison: row.benchmark_comparison,
    llmModel: row.llm_model,
    llmTokensUsed: row.llm_tokens_used,
    llmCost: row.llm_cost,
    generationTimeMs: row.generation_time_ms,
    generationPromptVersion: row.generation_prompt_version,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    sharedWithClient: row.shared_with_client,
    sharedAt: row.shared_at,
    sharedBy: row.shared_by,
    clientFeedback: row.client_feedback,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

