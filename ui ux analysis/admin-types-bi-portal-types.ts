// ============================================================================
// BUSINESS INTELLIGENCE TYPE DEFINITIONS
// Renamed from Management Accounts - January 2026
// Re-exported via types/business-intelligence.ts
// ============================================================================

import type { TurnoverBand, PeriodStatus, RAGStatus } from './business-intelligence';

// NEW Tier types (3 tiers instead of 4)
export type TierType = 'clarity' | 'foresight' | 'strategic';
export type FrequencyType = 'monthly' | 'quarterly';

// Legacy tier mapping for migration
export const LEGACY_TIER_MAP: Record<string, TierType> = {
  'bronze': 'clarity',
  'silver': 'foresight',
  'gold': 'foresight',
  'platinum': 'strategic'
};

// Turnover bands for pricing (type from business-intelligence; const here for BI portal)
export const TURNOVER_BANDS = [
  { key: 'under_750k' as TurnoverBand, min: 0, max: 750000, label: 'Under £750k', index: 0 },
  { key: '750k_1.5m' as TurnoverBand, min: 750000, max: 1500000, label: '£750k - £1.5m', index: 1 },
  { key: '1.5m_3m' as TurnoverBand, min: 1500000, max: 3000000, label: '£1.5m - £3m', index: 2 },
  { key: '3m_5m' as TurnoverBand, min: 3000000, max: 5000000, label: '£3m - £5m', index: 3 },
  { key: '5m_plus' as TurnoverBand, min: 5000000, max: null, label: '£5m+', index: 4 }
];

// True Cash Calculation structure
export interface TrueCashCalculation {
  bank_balance: number;
  vat_provision: number;
  paye_ni: number;
  corporation_tax: number;
  committed_payments: number;
  confirmed_receivables: number;
  true_cash: number;
}

// Document types
export type MADocumentType = 
  | 'pnl'
  | 'balance_sheet'
  | 'cash_flow'
  | 'aged_debtors'
  | 'aged_creditors'
  | 'trial_balance'
  | 'bank_reconciliation'
  | 'vat_return'
  | 'management_pack'
  | 'supporting'
  | 'board_pack'
  | 'client_report';

// Insight types
export type MAInsightType = 
  | 'observation'
  | 'warning'
  | 'opportunity'
  | 'recommendation'
  | 'action_required';

// Period status (type from business-intelligence)

// ============================================================================
// NEW TIER FEATURES CONFIGURATION (3 tiers)
// ============================================================================

export const TIER_FEATURES: Record<TierType, {
  name: string;
  label: string;
  tagline: string;
  description: string;
  color: string;
  priceRange: [number, number];
  frequency: string;
  kpiLimit: number | 'unlimited';
  insightLimit: number;
  includesForecast: boolean;
  includesScenarios: boolean;
  scenarioLimit: number | null;
  includesProfitability: boolean;
  includesRecommendations: boolean;
  includesWatchList: boolean;
  includesBoardPack: boolean;
  includesBenchmarking: boolean;
  advisoryCalls: string;
  callMinutes: number;
  quarterlyAvailable: boolean;
  features: string[];
}> = {
  clarity: {
    name: 'Clarity',
    label: 'Clarity',
    tagline: 'See where you are',
    description: 'You see the truth clearly - True Cash, KPIs, insights, and your questions answered',
    color: 'blue',
    priceRange: [2000, 3000],
    frequency: 'monthly or quarterly',
    kpiLimit: 5,
    insightLimit: 7,
    includesForecast: false,
    includesScenarios: false,
    scenarioLimit: 0,
    includesProfitability: false,
    includesRecommendations: false,
    includesWatchList: false,
    includesBoardPack: false,
    includesBenchmarking: false,
    advisoryCalls: 'Monthly/Quarterly',
    callMinutes: 30,
    quarterlyAvailable: true,
    features: [
      'Business Intelligence Portal',
      'True Cash Position',
      'Core KPIs (5)',
      'AI-generated insights',
      'Tuesday Question answered',
      'Monthly/quarterly report',
      'PDF export',
      '30-min review call',
    ],
  },
  foresight: {
    name: 'Foresight',
    label: 'Foresight',
    tagline: 'See where you could be',
    description: 'You get help acting on what you see - recommendations, forecasts, and scenarios',
    color: 'indigo',
    priceRange: [3000, 5000],
    frequency: 'monthly or quarterly',
    kpiLimit: 8,
    insightLimit: 7,
    includesForecast: true,
    includesScenarios: true,
    scenarioLimit: 3,
    includesProfitability: true,
    includesRecommendations: true,
    includesWatchList: true,
    includesBoardPack: false,
    includesBenchmarking: false,
    advisoryCalls: 'Monthly/Quarterly',
    callMinutes: 45,
    quarterlyAvailable: true,
    features: [
      'Everything in Clarity',
      'Extended KPIs (8)',
      'Actionable recommendations',
      '13-week cash forecast',
      '3 pre-built scenarios',
      'Client profitability analysis',
      'Watch list alerts',
      '45-min review call',
    ],
  },
  strategic: {
    name: 'Strategic',
    label: 'Strategic',
    tagline: 'Your financial partner',
    description: 'Board-level support and CFO gateway - unlimited scenarios, board pack, benchmarking',
    color: 'purple',
    priceRange: [5000, 8000],
    frequency: 'monthly',
    kpiLimit: 'unlimited',
    insightLimit: 7,
    includesForecast: true,
    includesScenarios: true,
    scenarioLimit: null, // unlimited
    includesProfitability: true,
    includesRecommendations: true,
    includesWatchList: true,
    includesBoardPack: true,
    includesBenchmarking: true,
    advisoryCalls: 'Monthly + ad-hoc',
    callMinutes: 60,
    quarterlyAvailable: false, // monthly only
    features: [
      'Everything in Foresight',
      'Custom KPIs (unlimited)',
      'Unlimited scenarios',
      'Weekly cash flash',
      'Board pack generation',
      'Industry benchmarking',
      'Ad-hoc advisory access',
      '60-min review call',
    ],
  },
};

// ============================================================================
// PRICING CONFIGURATION
// ============================================================================

export const BI_PRICING = {
  monthly: {
    clarity: [2000, 2250, 2500, 2750, 3000],
    foresight: [3000, 3500, 4000, 4500, 5000],
    strategic: [5000, 5500, 6500, 7500, 8000]
  },
  quarterlyMultiplier: 2.6
};

export function getTurnoverBandIndex(annualTurnover: number): number {
  const band = TURNOVER_BANDS.find(b => 
    annualTurnover >= b.min && (b.max === null || annualTurnover < b.max)
  );
  return band?.index ?? 0;
}

export function getPrice(tier: TierType, turnoverBand: number, frequency: FrequencyType): number {
  const monthlyPrice = BI_PRICING.monthly[tier][turnoverBand];
  
  if (frequency === 'quarterly') {
    if (tier === 'strategic') {
      throw new Error('Strategic tier is monthly only');
    }
    return Math.round(monthlyPrice * BI_PRICING.quarterlyMultiplier);
  }
  
  return monthlyPrice;
}

export function getPriceRange(tier: TierType): string {
  const prices = BI_PRICING.monthly[tier];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return `£${min.toLocaleString()} - £${max.toLocaleString()}/mo`;
}

// ============================================================================
// TIER BADGE STYLING
// ============================================================================

export function getTierBadgeColor(tier: TierType): string {
  switch (tier) {
    case 'clarity': return 'bg-blue-100 text-blue-800';
    case 'foresight': return 'bg-indigo-100 text-indigo-800';
    case 'strategic': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getTierLabel(tier: TierType): string {
  return TIER_FEATURES[tier]?.label || tier;
}

// ============================================================================
// DATABASE ENTITY INTERFACES
// ============================================================================

export interface MAEngagement {
  id: string;
  client_id: string;
  tier: TierType;
  frequency: FrequencyType;
  monthly_fee: number;
  annual_fee?: number;
  turnover_band?: TurnoverBand;
  start_date: string;
  end_date?: string;
  status: 'pending' | 'active' | 'paused' | 'cancelled';
  onboarding_completed_at?: string;
  xero_connected: boolean;
  qbo_connected: boolean;
  assigned_to?: string;
  reviewer?: string;
  discovery_data?: Record<string, unknown>;
  tuesday_question_template?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface MAPeriod {
  id: string;
  engagement_id: string;
  period_type: FrequencyType;
  period_start: string;
  period_end: string;
  period_label?: string;
  status: PeriodStatus;
  due_date?: string;
  delivered_at?: string;
  client_viewed_at?: string;
  tuesday_question?: string;
  tuesday_question_asked_at?: string;
  tuesday_answer?: string;
  tuesday_answer_short?: string;
  tuesday_answer_detail?: string;
  tuesday_answer_format?: 'text' | 'calculation' | 'scenario';
  tuesday_linked_scenario_id?: string;
  review_call_scheduled_at?: string;
  review_call_completed_at?: string;
  review_call_notes?: string;
  review_call_duration_mins?: number;
  created_at: string;
  updated_at: string;
}

export interface MADocument {
  id: string;
  period_id: string;
  engagement_id?: string;
  document_type: MADocumentType;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_required';
  extracted_data?: Record<string, unknown>;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface MAFinancialData {
  id: string;
  period_id: string;
  // P&L
  revenue?: number;
  cost_of_sales?: number;
  gross_profit?: number;
  overheads?: number;
  operating_profit?: number;
  interest?: number;
  tax?: number;
  net_profit?: number;
  // Balance Sheet
  cash_at_bank?: number;
  trade_debtors?: number;
  other_debtors?: number;
  stock?: number;
  wip?: number;
  prepayments?: number;
  fixed_assets?: number;
  trade_creditors?: number;
  other_creditors?: number;
  accruals?: number;
  vat_liability?: number;
  paye_liability?: number;
  corporation_tax_liability?: number;
  loans?: number;
  directors_loans?: number;
  share_capital?: number;
  retained_earnings?: number;
  // Working Capital
  current_assets?: number;
  current_liabilities?: number;
  net_current_assets?: number;
  // True Cash
  true_cash?: number;
  true_cash_calculation?: TrueCashCalculation;
  true_cash_runway_months?: number;
  // Cash Flow Context
  committed_payments?: number;
  confirmed_receivables?: number;
  // Comparatives
  prior_month_revenue?: number;
  prior_year_revenue?: number;
  budget_revenue?: number;
  // Headcount
  fte_count?: number;
  // Operating costs (for runway calculation)
  monthly_operating_costs?: number;
  payroll_costs?: number;
  // Extended data (JSONB columns from Phase 1 enhancements)
  balance_sheet_data?: Record<string, unknown>;
  pl_breakdown?: Record<string, unknown>;
  // Meta
  data_source?: 'xero_api' | 'qbo_api' | 'upload' | 'manual';
  confidence_level?: 'high' | 'medium' | 'low';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MAKPIDefinition {
  code: string;
  name: string;
  category: 'cash_working_capital' | 'revenue_growth' | 'profitability' | 'utilisation_efficiency' | 'client_health';
  description?: string;
  calculation_formula?: string;
  unit: 'currency' | 'percentage' | 'days' | 'ratio' | 'number';
  decimal_places: number;
  higher_is_better?: boolean;
  default_target?: number;
  min_tier: TierType;
  rag_green_threshold?: number;
  rag_amber_threshold?: number;
  rag_red_threshold?: number;
  is_active: boolean;
  display_order: number;
}

export interface MAKPISelection {
  id: string;
  engagement_id: string;
  kpi_code: string;
  is_mandatory: boolean;
  display_order?: number;
  custom_target?: number;
  custom_rag_green?: number;
  custom_rag_amber?: number;
  custom_rag_red?: number;
  selected_at: string;
  selected_by?: string;
}

export interface MAKPIValue {
  id: string;
  period_id: string;
  kpi_code: string;
  kpi_name?: string;
  kpi_unit?: string;
  kpi_category?: string;
  value: number;
  previous_value?: number;
  yoy_value?: number;
  target_value?: number;
  benchmark_value?: number;
  change_absolute?: number;
  change_percentage?: number;
  yoy_change_percentage?: number;
  rag_status?: RAGStatus;
  trend?: 'up' | 'down' | 'stable';
  auto_commentary?: string;
  manual_commentary?: string;
  higher_is_better?: boolean;
  calculated_at: string;
}

export type InsightStatus = 'draft' | 'approved' | 'rejected' | 'edited';
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';
export type InsightTheme = 'tuesday_question' | 'cash_runway' | 'debtor_opportunity' | 'cost_structure' | 'tax_obligations' | 'profitability' | 'client_health' | 'pricing_power';

export interface MAInsight {
  id: string;
  period_id: string;
  engagement_id?: string;
  insight_type: MAInsightType;
  theme?: InsightTheme;
  category?: string;
  title: string;
  description: string;
  recommendation?: string;
  recommendation_priority?: 'high' | 'medium' | 'low';
  recommendation_timing?: string;
  related_kpi_code?: string;
  related_client_id?: string;
  supporting_data?: Record<string, unknown>;
  metric_value?: number;
  metric_comparison?: number;
  metric_unit?: 'currency' | 'percentage' | 'number';
  min_tier?: TierType;
  show_to_client: boolean;
  client_acknowledged_at?: string;
  action_taken?: string;
  action_completed_at?: string;
  display_order?: number;
  created_at: string;
  created_by?: string;
  // Review workflow fields
  status?: InsightStatus;
  priority?: InsightPriority;
  implications?: string;
  data_points?: string[];
  is_auto_generated?: boolean;
  original_content?: Record<string, unknown>;
  approved_at?: string;
  approved_by?: string;
  edited_at?: string;
  // Visualization
  visualization_type?: 'none' | 'comparison' | 'timeline' | 'progress' | 'bar' | 'waterfall' | 'table';
  visualization_data?: Record<string, unknown>;
  // Client voice
  client_quote?: string;
  emotional_anchor?: string;
  scenario_teaser?: string;
  linked_scenario_id?: string;
}

export interface MACashForecast {
  id: string;
  engagement_id: string;
  forecast_type: '13_week' | '6_month';
  created_date: string;
  base_cash_position: number;
  status: 'draft' | 'published' | 'superseded';
  created_at: string;
  created_by?: string;
  published_at?: string;
  notes?: string;
}

export interface MACashForecastPeriod {
  id: string;
  forecast_id: string;
  period_number: number;
  period_start: string;
  period_end: string;
  period_label?: string;
  opening_balance: number;
  forecast_receipts: number;
  receipt_details?: Record<string, unknown>;
  forecast_payments: number;
  payment_details?: Record<string, unknown>;
  net_movement: number;
  closing_balance: number;
  closing_true_cash?: number;
  is_warning: boolean;
  warning_message?: string;
  recommended_actions?: string[];
  actual_receipts?: number;
  actual_payments?: number;
  actual_closing?: number;
  variance_notes?: string;
  rag_status?: RAGStatus;
  runway_at_period_end?: number;
  scenario_variants?: Record<string, unknown>;
}

export interface MAScenario {
  id: string;
  engagement_id: string;
  scenario_type: 'hire' | 'pricing_change' | 'client_loss' | 'client_win' | 'debtor_collection' | 'cost_reduction' | 'investment' | 'custom';
  name: string;
  short_label?: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  is_pre_built: boolean;
  is_featured?: boolean;
  is_template?: boolean;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  impact_summary?: string;
  monthly_cash_impact?: number;
  annual_profit_impact?: number;
  breakeven_months?: number;
  summary_answer?: string;
  recommendation?: 'proceed' | 'caution' | 'dont_proceed' | 'needs_more_info';
  created_at: string;
  created_by?: string;
  last_run_at?: string;
}

export interface MAClientProfitability {
  id: string;
  period_id: string;
  client_name: string;
  client_ref?: string;
  revenue: number;
  revenue_percentage?: number;
  revenue_ytd?: number;
  direct_labour_cost?: number;
  direct_labour_hours?: number;
  subcontractor_cost?: number;
  other_direct_costs?: number;
  total_direct_costs?: number;
  gross_profit?: number;
  gross_margin_pct?: number;
  allocated_overhead?: number;
  overhead_allocation_method?: string;
  net_profit?: number;
  net_margin_pct?: number;
  effective_hourly_rate?: number;
  target_margin_pct?: number;
  margin_vs_target?: number;
  rag_status?: RAGStatus;
  profitability_status?: 'highly_profitable' | 'profitable' | 'marginal' | 'loss_making' | 'unknown';
  payment_terms_days?: number;
  actual_payment_days?: number;
  concentration_risk?: boolean;
  verdict?: 'protect_grow' | 'maintain' | 'reprice' | 'renegotiate' | 'exit';
  analysis_notes?: string;
  team_notes?: string;
  client_notes?: string;
  recommended_action?: string;
  display_order?: number;
  created_at: string;
}

export interface MAWatchListItem {
  id: string;
  engagement_id: string;
  item_type: 'debtor' | 'creditor' | 'kpi_threshold' | 'cash_warning' | 'client_concern' | 'renewal' | 'custom';
  title: string;
  description?: string;
  current_value?: number;
  threshold_value?: number;
  threshold_direction?: 'above' | 'below' | 'approaching';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  priority?: 'high' | 'medium' | 'low';
  due_date?: string;
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

// ============================================================================
// DELIVERY WORKFLOW
// ============================================================================

export interface DeliveryChecklistItem {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export function getDeliveryChecklist(tier: TierType): DeliveryChecklistItem[] {
  const baseItems: DeliveryChecklistItem[] = [
    { id: 'data_uploaded', label: 'Financial data uploaded/received', required: true, completed: false },
    { id: 'data_validated', label: 'Data validated (reconciled to TB)', required: true, completed: false },
    { id: 'true_cash_calculated', label: 'True Cash calculated', required: true, completed: false },
    { id: 'kpis_calculated', label: 'KPIs calculated', required: true, completed: false },
    { id: 'insights_generated', label: 'Insights generated & reviewed', required: true, completed: false },
    { id: 'tuesday_answered', label: 'Tuesday question answered', required: true, completed: false },
    { id: 'reviewed', label: 'Reviewed by second pair of eyes', required: true, completed: false },
    { id: 'report_generated', label: 'Report PDF generated', required: true, completed: false },
  ];

  if (tier === 'foresight' || tier === 'strategic') {
    baseItems.push(
      { id: 'recommendations_added', label: 'Recommendations written', required: true, completed: false },
      { id: 'forecast_updated', label: '13-week forecast updated', required: true, completed: false },
      { id: 'scenarios_reviewed', label: 'Scenarios reviewed', required: false, completed: false },
      { id: 'profitability_updated', label: 'Client profitability updated', required: false, completed: false }
    );
  }

  if (tier === 'strategic') {
    baseItems.push(
      { id: 'board_pack_prepared', label: 'Board pack prepared', required: false, completed: false }
    );
  }

  return baseItems;
}
