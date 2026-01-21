/**
 * Business Intelligence Service Types
 * Version 2.0 - January 2026
 * 
 * Three-tier model: Clarity / Foresight / Strategic
 * "Sell the destination, not the plane"
 */

// ============================================
// TIER & PRICING
// ============================================

export type BITier = 'clarity' | 'foresight' | 'strategic';
export type BIFrequency = 'monthly' | 'quarterly';
export type TurnoverBand = 'under_750k' | '750k_1.5m' | '1.5m_3m' | '3m_5m' | '5m_plus';

export interface PriceAdjustment {
  type: 'group_structure' | 'high_transaction_volume' | 'complex_industry';
  percentage: number;
  label: string;
}

export const PRICING_MATRIX = {
  bands: [
    { min: 0, max: 750000, label: 'Under £750k', key: 'under_750k' as TurnoverBand },
    { min: 750000, max: 1500000, label: '£750k - £1.5m', key: '750k_1.5m' as TurnoverBand },
    { min: 1500000, max: 3000000, label: '£1.5m - £3m', key: '1.5m_3m' as TurnoverBand },
    { min: 3000000, max: 5000000, label: '£3m - £5m', key: '3m_5m' as TurnoverBand },
    { min: 5000000, max: null, label: '£5m+', key: '5m_plus' as TurnoverBand }
  ],
  monthly: {
    clarity: [2000, 2250, 2500, 2750, 3000],
    foresight: [3000, 3500, 4000, 4500, 5000],
    strategic: [5000, 5500, 6500, 7500, 8000]
  },
  quarterlyMultiplier: 2.6,
  adjustments: {
    groupStructure: { min: 0.15, max: 0.25, label: 'Group structure' },
    highTransactionVolume: { min: 0.10, max: 0.20, label: 'High transaction volume' },
    complexIndustry: { min: 0.10, max: 0.15, label: 'Complex industry requirements' }
  }
} as const;

// ============================================
// ENGAGEMENT
// ============================================

export interface BIEngagement {
  id: string;
  practice_id: string;
  client_id: string;
  
  tier: BITier;
  frequency: BIFrequency;
  
  monthly_fee: number | null;
  quarterly_fee: number | null;
  turnover_band: TurnoverBand | null;
  price_adjustments: PriceAdjustment[];
  
  kpi_count: number;
  scenario_limit: number | null; // null = unlimited
  call_duration_minutes: number;
  
  status: 'pending' | 'active' | 'paused' | 'cancelled';
  start_date: string | null;
  
  discovery_data: DiscoveryData | null;
  tuesday_question_template: string | null;
  
  created_at: string;
  updated_at: string;
  
  // Joined relations
  client?: {
    id: string;
    name: string;
    company_name?: string;
  };
}

export interface DiscoveryData {
  sleep_better?: string;
  worst_cash_moment?: string;
  expensive_blindspot?: string;
  transformation?: string;
  decision_confidence?: number;
  key_quotes?: string[];
}

// ============================================
// PERIODS
// ============================================

export type PeriodStatus = 
  | 'pending'
  | 'documents_uploaded'
  | 'data_extracted'
  | 'insights_generated'
  | 'team_review'
  | 'ready_for_call'
  | 'call_complete'
  | 'delivered';

export interface BIPeriod {
  id: string;
  engagement_id: string;
  
  period_type: 'monthly' | 'quarterly';
  period_start: string;
  period_end: string;
  period_label: string | null;
  
  status: PeriodStatus;
  
  tuesday_question: string | null;
  tuesday_answer_short: string | null;
  tuesday_answer_detail: string | null;
  tuesday_linked_scenario_id: string | null;
  
  call_scheduled_at: string | null;
  call_completed_at: string | null;
  call_notes: string | null;
  call_recording_url: string | null;
  
  assigned_to: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  
  created_at: string;
  updated_at: string;
  
  // Joined relations
  engagement?: BIEngagement;
}

// ============================================
// FINANCIAL DATA
// ============================================

export interface BIFinancialData {
  id: string;
  period_id: string;
  
  // P&L
  revenue: number | null;
  cost_of_sales: number | null;
  gross_profit: number | null;
  overheads: number | null;
  operating_profit: number | null;
  net_profit: number | null;
  
  // Balance Sheet - Assets
  cash_at_bank: number | null;
  trade_debtors: number | null;
  other_debtors: number | null;
  stock: number | null;
  fixed_assets: number | null;
  
  // Balance Sheet - Liabilities
  trade_creditors: number | null;
  other_creditors: number | null;
  vat_liability: number | null;
  paye_liability: number | null;
  corporation_tax_liability: number | null;
  bank_loans: number | null;
  director_loans: number | null;
  
  // Cash Flow Context
  committed_payments: number | null;
  confirmed_receivables: number | null;
  
  // Operational
  monthly_operating_costs: number | null;
  monthly_payroll_costs: number | null;
  fte_count: number | null;
  
  // Comparative
  prior_revenue: number | null;
  prior_gross_profit: number | null;
  prior_operating_profit: number | null;
  prior_net_profit: number | null;
  prior_cash_at_bank: number | null;
  yoy_revenue: number | null;
  
  // Data quality
  data_source: 'manual' | 'xero' | 'quickbooks' | 'sage' | 'extracted' | null;
  data_confidence: 'high' | 'medium' | 'low' | null;
  data_notes: string | null;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// KPIs
// ============================================

export type KPICategory = 
  | 'cash_working_capital'
  | 'revenue_growth'
  | 'profitability'
  | 'efficiency'
  | 'client_health';

export type RAGStatus = 'green' | 'amber' | 'red' | 'neutral';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface BIKPIDefinition {
  id: string;
  code: string;
  name: string;
  category: KPICategory;
  description: string | null;
  calculation_formula: string | null;
  calculation_code: string | null;
  
  default_green_threshold: number | null;
  default_green_operator: '>=' | '<=' | '>' | '<' | '=' | null;
  default_amber_min: number | null;
  default_amber_max: number | null;
  default_red_threshold: number | null;
  default_red_operator: '>=' | '<=' | '>' | '<' | '=' | null;
  
  unit: 'currency' | 'percentage' | 'days' | 'ratio' | 'months' | 'number' | null;
  decimal_places: number;
  
  min_tier: BITier;
  is_core: boolean;
  display_order: number;
  is_active: boolean;
}

export interface BIKPIValue {
  id: string;
  period_id: string;
  kpi_definition_id: string;
  
  value: number | null;
  formatted_value: string | null;
  
  rag_status: RAGStatus | null;
  rag_override: string | null;
  rag_override_reason: string | null;
  
  prior_value: number | null;
  change_amount: number | null;
  change_percentage: number | null;
  trend_direction: TrendDirection | null;
  trend_is_positive: boolean | null;
  
  is_featured: boolean;
  display_order: number | null;
  
  calculated_at: string;
  
  // Joined
  definition?: BIKPIDefinition;
}

// ============================================
// INSIGHTS (Theme-based)
// ============================================

export type InsightTheme = 
  | 'tuesday_question'
  | 'cash_runway'
  | 'debtor_opportunity'
  | 'cost_structure'
  | 'tax_obligations'
  | 'profitability'
  | 'client_health'
  | 'pricing_power';

export type InsightPriority = 'critical' | 'warning' | 'opportunity' | 'positive';

export type VisualizationType = 
  | 'none'
  | 'comparison'
  | 'timeline'
  | 'progress'
  | 'bar'
  | 'waterfall'
  | 'table';

export interface BIInsight {
  id: string;
  period_id: string;
  
  theme: InsightTheme;
  priority: InsightPriority;
  
  title: string;
  summary: string;
  detail: string | null;
  
  client_quote: string | null;
  emotional_anchor: string | null;
  
  recommendation: string | null;
  scenario_teaser: string | null;
  linked_scenario_id: string | null;
  
  visualization_type: VisualizationType;
  visualization_data: Record<string, unknown> | null;
  
  is_tuesday_answer: boolean;
  is_active: boolean;
  display_order: number | null;
  
  edited_by: string | null;
  edited_at: string | null;
  original_content: Record<string, unknown> | null;
  
  created_at: string;
  
  // Joined
  linked_scenario?: BIScenario;
}

// ============================================
// SCENARIOS
// ============================================

export type ScenarioType = 
  | 'hire'
  | 'pricing_change'
  | 'client_loss'
  | 'client_win'
  | 'debtor_collection'
  | 'cost_reduction'
  | 'investment'
  | 'custom';

export interface HireParameters {
  name: string;
  salary: number;
  additional_costs?: number;
  start_date: string;
  expected_utilisation?: number;
  revenue_impact_monthly?: number;
}

export interface PricingChangeParameters {
  change_percentage: number;
  affected_clients?: string[];
  implementation_date: string;
}

export interface ClientLossParameters {
  client_name: string;
  monthly_revenue: number;
  probability: number;
  notice_period?: number;
}

export interface DebtorCollectionParameters {
  target_collection_pct: number;
  timeline_weeks: number;
}

export type ScenarioParameters = 
  | HireParameters 
  | PricingChangeParameters 
  | ClientLossParameters 
  | DebtorCollectionParameters 
  | Record<string, unknown>;

export interface BIScenario {
  id: string;
  engagement_id: string;
  period_id: string | null;
  
  scenario_type: ScenarioType;
  name: string;
  short_label: string | null;
  description: string | null;
  
  parameters: ScenarioParameters;
  
  impact_summary: string | null;
  monthly_cash_impact: number | null;
  annual_profit_impact: number | null;
  breakeven_months: number | null;
  
  is_featured: boolean;
  is_template: boolean;
  is_active: boolean;
  
  created_at: string;
  created_by: string | null;
}

// ============================================
// FORECASTING
// ============================================

export interface BICashForecast {
  id: string;
  period_id: string;
  
  forecast_type: '13_week' | '6_month';
  
  opening_cash: number | null;
  opening_true_cash: number | null;
  
  assumptions: ForecastAssumption[] | null;
  
  created_at: string;
  updated_at: string;
  
  // Joined
  periods?: BICashForecastPeriod[];
}

export interface ForecastAssumption {
  category: string;
  assumption: string;
  value: number;
}

export interface BICashForecastPeriod {
  id: string;
  forecast_id: string;
  
  period_number: number;
  period_label: string | null;
  period_start: string | null;
  period_end: string | null;
  
  expected_inflows: number | null;
  expected_outflows: number | null;
  net_flow: number | null;
  
  closing_cash: number | null;
  closing_true_cash: number | null;
  
  rag_status: RAGStatus | null;
  runway_at_period_end: number | null;
  
  scenario_variants: Record<string, ScenarioVariant>;
  
  display_order: number | null;
}

export interface ScenarioVariant {
  closing_cash: number;
  closing_true_cash: number;
  rag_status: RAGStatus;
}

// ============================================
// CLIENT PROFITABILITY
// ============================================

export type ProfitabilityStatus = 
  | 'highly_profitable'
  | 'profitable'
  | 'marginal'
  | 'loss_making'
  | 'unknown';

export interface BIClientProfitability {
  id: string;
  period_id: string;
  
  client_name: string;
  
  revenue: number | null;
  revenue_percentage: number | null;
  
  direct_costs: number | null;
  allocated_overheads: number | null;
  total_costs: number | null;
  
  gross_margin: number | null;
  gross_margin_percentage: number | null;
  net_margin: number | null;
  net_margin_percentage: number | null;
  
  profitability_status: ProfitabilityStatus | null;
  
  payment_terms_days: number | null;
  actual_payment_days: number | null;
  concentration_risk: boolean | null;
  
  team_notes: string | null;
  client_notes: string | null;
  
  display_order: number | null;
  
  created_at: string;
}

// ============================================
// WATCH LIST
// ============================================

export type WatchType = 
  | 'debtor'
  | 'client'
  | 'kpi'
  | 'cash_threshold'
  | 'date'
  | 'custom';

export interface BIWatchListItem {
  id: string;
  engagement_id: string;
  
  watch_type: WatchType;
  name: string;
  description: string | null;
  
  trigger_kpi_id: string | null;
  trigger_threshold: number | null;
  trigger_operator: '>' | '<' | '>=' | '<=' | '=' | null;
  trigger_date: string | null;
  
  status: 'watching' | 'triggered' | 'resolved' | 'snoozed';
  triggered_at: string | null;
  triggered_value: number | null;
  
  alert_team: boolean;
  alert_client: boolean;
  
  created_at: string;
  snoozed_until: string | null;
}

// ============================================
// REPORT CONFIG
// ============================================

export interface SectionConfig {
  key: string;
  visible: boolean;
  order: number;
}

export interface BIReportConfig {
  id: string;
  engagement_id: string;
  
  sections: SectionConfig[];
  
  include_logo: boolean;
  primary_color: string;
  
  auto_send_email: boolean;
  email_recipients: string[];
  
  updated_at: string;
}

// ============================================
// FEATURE FLAGS BY TIER
// ============================================

export interface TierFeatures {
  kpiCount: number;
  showForecast: boolean;
  showScenarios: boolean;
  scenarioLimit: number | null;
  showRecommendations: boolean;
  showClientProfitability: boolean;
  showWatchList: boolean;
  showBoardPack: boolean;
  showBenchmarking: boolean;
  callDuration: number;
}

export const TIER_FEATURES: Record<BITier, TierFeatures> = {
  clarity: {
    kpiCount: 5,
    showForecast: false,
    showScenarios: false,
    scenarioLimit: 0,
    showRecommendations: false,
    showClientProfitability: false,
    showWatchList: false,
    showBoardPack: false,
    showBenchmarking: false,
    callDuration: 30
  },
  foresight: {
    kpiCount: 8,
    showForecast: true,
    showScenarios: true,
    scenarioLimit: 3,
    showRecommendations: true,
    showClientProfitability: true,
    showWatchList: true,
    showBoardPack: false,
    showBenchmarking: false,
    callDuration: 45
  },
  strategic: {
    kpiCount: -1, // Custom
    showForecast: true,
    showScenarios: true,
    scenarioLimit: null, // Unlimited
    showRecommendations: true,
    showClientProfitability: true,
    showWatchList: true,
    showBoardPack: true,
    showBenchmarking: true,
    callDuration: 60
  }
};

// ============================================
// INSIGHT GENERATION
// ============================================

export const INSIGHT_THEMES: InsightTheme[] = [
  'tuesday_question',
  'cash_runway',
  'debtor_opportunity',
  'cost_structure',
  'tax_obligations',
  'profitability',
  'client_health',
  'pricing_power'
];

export const BANNED_PHRASES = [
  'masks a dangerous reality',
  'crystallize over the next',
  'it is important to note',
  'it should be noted',
  'comprehensive analysis reveals',
  'strategic implications',
  'holistic view',
  'synergies',
  'leverage',
  'paradigm',
  'deep dive',
  'unpack',
  'at the end of the day',
  'moving forward',
  'in terms of',
  'best practices'
];

export const MAX_INSIGHTS = 7;

