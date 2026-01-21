// ============================================================================
// MANAGEMENT ACCOUNTS TYPE DEFINITIONS
// ============================================================================

// Tier types
export type TierType = 'bronze' | 'silver' | 'gold' | 'platinum';
export type FrequencyType = 'monthly' | 'quarterly';
export type RAGStatus = 'green' | 'amber' | 'red' | 'grey';

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

// Period status
export type PeriodStatus = 
  | 'pending'
  | 'data_received'
  | 'in_progress'
  | 'review'
  | 'approved'
  | 'delivered'
  | 'client_reviewed';

// ============================================================================
// TIER FEATURES CONFIGURATION
// ============================================================================

export const TIER_FEATURES: Record<TierType, {
  name: string;
  price: number;
  frequency: string;
  kpiLimit: number | 'unlimited';
  insightLimit: number;
  includesForecast: boolean;
  includesScenarios: boolean;
  scenarioLimit: number;
  includesProfitability: boolean;
  includesRecommendations: boolean;
  advisoryCalls: string;
  features: string[];
}> = {
  bronze: {
    name: 'Bronze - Essentials',
    price: 750,
    frequency: 'monthly',
    kpiLimit: 3,
    insightLimit: 3,
    includesForecast: false,
    includesScenarios: false,
    scenarioLimit: 0,
    includesProfitability: false,
    includesRecommendations: false,
    advisoryCalls: 'None',
    features: [
      'Monthly P&L & Balance Sheet',
      'True Cash calculation',
      'Tuesday question answered',
      '3 key insights',
      'Watch list (3 metrics)',
    ],
  },
  silver: {
    name: 'Silver - Full Picture',
    price: 1500,
    frequency: 'monthly',
    kpiLimit: 5,
    insightLimit: 5,
    includesForecast: false,
    includesScenarios: false,
    scenarioLimit: 0,
    includesProfitability: false,
    includesRecommendations: true,
    advisoryCalls: 'Quarterly',
    features: [
      'Everything in Bronze',
      '6-month trend analysis',
      '5 key insights',
      'Watch list (5 metrics)',
      'Optimisation suggestions',
      'Quarterly advisory call',
    ],
  },
  gold: {
    name: 'Gold - Decision-Ready',
    price: 3000,
    frequency: 'monthly',
    kpiLimit: 10,
    insightLimit: 10,
    includesForecast: true,
    includesScenarios: true,
    scenarioLimit: 3,
    includesProfitability: true,
    includesRecommendations: true,
    advisoryCalls: 'Monthly',
    features: [
      'Everything in Silver',
      '13-week cash forecast',
      'Scenario dashboard',
      '3 pre-built scenarios',
      'Monthly advisory call',
      'Budget vs actual tracking',
    ],
  },
  platinum: {
    name: 'Platinum - Board-Level',
    price: 5000,
    frequency: 'monthly',
    kpiLimit: 'unlimited',
    insightLimit: 20,
    includesForecast: true,
    includesScenarios: true,
    scenarioLimit: -1, // unlimited
    includesProfitability: true,
    includesRecommendations: true,
    advisoryCalls: 'Fortnightly',
    features: [
      'Everything in Gold',
      'Weekly flash reports',
      'Unlimited scenarios',
      'Custom KPI dashboard',
      'Fortnightly calls',
      'Benchmarking included',
      'Board pack preparation',
    ],
  },
};

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
  start_date: string;
  end_date?: string;
  status: 'pending' | 'active' | 'paused' | 'cancelled';
  onboarding_completed_at?: string;
  xero_connected: boolean;
  qbo_connected: boolean;
  assigned_to?: string;
  reviewer?: string;
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
  tuesday_answer_format?: 'text' | 'calculation' | 'scenario';
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
  // Comparatives
  prior_month_revenue?: number;
  prior_year_revenue?: number;
  budget_revenue?: number;
  // Headcount
  fte_count?: number;
  // Operating costs (for runway calculation)
  monthly_operating_costs?: number;
  payroll_costs?: number;
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

export interface MAInsight {
  id: string;
  period_id: string;
  engagement_id?: string;
  insight_type: MAInsightType;
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
  // New review workflow fields
  status?: InsightStatus;
  priority?: InsightPriority;
  implications?: string;
  data_points?: string[];
  is_auto_generated?: boolean;
  original_content?: Record<string, unknown>;
  approved_at?: string;
  approved_by?: string;
  edited_at?: string;
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
  is_warning: boolean;
  warning_message?: string;
  recommended_actions?: string[];
  actual_receipts?: number;
  actual_payments?: number;
  actual_closing?: number;
  variance_notes?: string;
}

export interface MAScenario {
  id: string;
  engagement_id: string;
  scenario_type: 'hire' | 'pricing' | 'client_loss' | 'investment' | 'custom';
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  is_pre_built: boolean;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
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
  verdict?: 'protect_grow' | 'maintain' | 'reprice' | 'renegotiate' | 'exit';
  analysis_notes?: string;
  recommended_action?: string;
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
    { id: 'insights_generated', label: 'Insights written', required: true, completed: false },
    { id: 'tuesday_answered', label: 'Tuesday question answered', required: true, completed: false },
    { id: 'reviewed', label: 'Reviewed by second pair of eyes', required: true, completed: false },
    { id: 'report_generated', label: 'Report PDF generated', required: true, completed: false },
  ];

  if (tier === 'silver' || tier === 'gold' || tier === 'platinum') {
    baseItems.push(
      { id: 'recommendations_added', label: 'Recommendations written', required: true, completed: false }
    );
  }

  if (tier === 'gold' || tier === 'platinum') {
    baseItems.push(
      { id: 'forecast_updated', label: '13-week forecast updated', required: true, completed: false },
      { id: 'scenarios_reviewed', label: 'Scenarios reviewed', required: false, completed: false },
      { id: 'profitability_updated', label: 'Client profitability updated', required: false, completed: false }
    );
  }

  if (tier === 'platinum') {
    baseItems.push(
      { id: 'board_pack_prepared', label: 'Board pack prepared', required: false, completed: false }
    );
  }

  return baseItems;
}
