// ============================================================================
// Management Accounts Types
// ============================================================================

// ---- ENUMS ----

export type MATier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type MAFrequency = 'monthly' | 'quarterly';

export type MAEngagementStatus = 'pending' | 'active' | 'paused' | 'cancelled';

export type MAPeriodStatus = 
  | 'pending'
  | 'data_received'
  | 'in_progress'
  | 'review'
  | 'approved'
  | 'delivered'
  | 'client_reviewed';

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

export type MAInsightType = 
  | 'observation'
  | 'warning'
  | 'opportunity'
  | 'recommendation'
  | 'action_required';

export type MAInsightCategory = 
  | 'cash'
  | 'profitability'
  | 'clients'
  | 'operations'
  | 'growth'
  | 'efficiency'
  | 'risk'
  | 'tax'
  | 'compliance';

export type MAWatchItemType = 
  | 'debtor'
  | 'creditor'
  | 'kpi_threshold'
  | 'cash_warning'
  | 'client_concern'
  | 'renewal'
  | 'vat_quarter'
  | 'year_end'
  | 'custom';

export type MAScenarioType = 
  | 'hire'
  | 'pricing'
  | 'client_loss'
  | 'investment'
  | 'expansion'
  | 'custom';

export type RAGStatus = 'green' | 'amber' | 'red' | 'grey';

export type ClientVerdict = 
  | 'protect_grow'
  | 'maintain'
  | 'reprice'
  | 'renegotiate'
  | 'exit';

// ---- CORE ENTITIES ----

export interface MAEngagement {
  id: string;
  client_id: string;
  practice_id: string;
  tier: MATier;
  frequency: MAFrequency;
  monthly_fee: number;
  start_date: string;
  end_date?: string;
  status: MAEngagementStatus;
  onboarding_completed_at?: string;
  xero_connected: boolean;
  qbo_connected: boolean;
  default_tuesday_question?: string;
  assigned_to?: string;
  reviewer_id?: string;
  financial_year_end_month?: number;
  vat_registered: boolean;
  vat_quarter_end_month?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined fields
  client_name?: string;
  client_company?: string;
  assigned_to_name?: string;
}

export interface MAPeriod {
  id: string;
  engagement_id: string;
  period_type: MAFrequency;
  period_start: string;
  period_end: string;
  period_label: string;
  status: MAPeriodStatus;
  due_date?: string;
  data_received_at?: string;
  delivered_at?: string;
  client_viewed_at?: string;
  tuesday_question?: string;
  tuesday_question_asked_at?: string;
  tuesday_answer?: string;
  tuesday_answer_format?: 'text' | 'calculation' | 'scenario' | 'chart';
  review_call_scheduled_at?: string;
  review_call_completed_at?: string;
  review_call_notes?: string;
  review_call_duration_mins?: number;
  checklist_status?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  prepared_by?: string;
  reviewed_by?: string;
}

export interface MADocument {
  id: string;
  period_id: string;
  engagement_id: string;
  document_type: MADocumentType;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_required';
  extracted_data?: Record<string, any>;
  extraction_error?: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface MAFinancialData {
  id: string;
  period_id: string;
  engagement_id: string;
  // P&L
  revenue?: number;
  cost_of_sales?: number;
  gross_profit?: number;
  overheads?: number;
  operating_profit?: number;
  interest?: number;
  tax_charge?: number;
  net_profit?: number;
  revenue_breakdown?: Record<string, number>;
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
  headcount_breakdown?: Record<string, number>;
  monthly_operating_costs?: number;
  // Meta
  data_source?: 'xero_api' | 'qbo_api' | 'upload' | 'manual';
  confidence_level?: 'high' | 'medium' | 'low';
  data_notes?: string;
  created_at: string;
  updated_at: string;
  entered_by?: string;
}

export interface TrueCashCalculation {
  bank_balance: number;
  vat_provision: number;
  paye_ni: number;
  corporation_tax: number;
  committed_payments: number;
  confirmed_receivables: number;
  true_cash: number;
}

export interface MAInsight {
  id: string;
  period_id: string;
  engagement_id: string;
  insight_type: MAInsightType;
  category?: MAInsightCategory;
  title: string;
  description: string;
  metric_value?: number;
  metric_comparison?: number;
  metric_unit?: string;
  recommendation?: string;
  recommendation_priority?: 'high' | 'medium' | 'low';
  recommendation_timing?: string;
  related_kpi_code?: string;
  related_client_name?: string;
  supporting_data?: Record<string, any>;
  min_tier: MATier;
  show_to_client: boolean;
  client_acknowledged_at?: string;
  action_taken?: string;
  action_completed_at?: string;
  display_order?: number;
  is_auto_generated: boolean;
  created_at: string;
  created_by?: string;
}

export interface MAWatchItem {
  id: string;
  engagement_id: string;
  item_type: MAWatchItemType;
  title: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  current_value?: number;
  threshold_value?: number;
  threshold_direction?: 'above' | 'below' | 'approaching' | 'overdue';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  priority?: 'high' | 'medium' | 'low';
  due_date?: string;
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  origin_period_id?: string;
  created_at: string;
  created_by?: string;
}

// ---- FORECASTS (Gold+) ----

export interface MACashForecast {
  id: string;
  engagement_id: string;
  period_id?: string;
  forecast_type: '13_week' | '6_month' | '12_month';
  forecast_date: string;
  base_cash_position: number;
  status: 'draft' | 'published' | 'superseded';
  has_warnings: boolean;
  first_warning_week?: number;
  lowest_balance?: number;
  lowest_balance_week?: number;
  created_at: string;
  created_by?: string;
  published_at?: string;
  notes?: string;
  // Joined
  periods?: MACashForecastPeriod[];
}

export interface MACashForecastPeriod {
  id: string;
  forecast_id: string;
  period_number: number;
  period_start: string;
  period_end: string;
  period_label: string;
  opening_balance: number;
  forecast_receipts: number;
  receipt_details: Array<{ name: string; amount: number; confidence?: string }>;
  forecast_payments: number;
  payment_details: Array<{ name: string; amount: number; type?: string }>;
  net_movement: number;
  closing_balance: number;
  is_warning: boolean;
  warning_message?: string;
  warning_severity?: 'watch' | 'caution' | 'critical';
  recommended_actions: string[];
  actual_receipts?: number;
  actual_payments?: number;
  actual_closing?: number;
  variance_receipts?: number;
  variance_payments?: number;
  variance_notes?: string;
}

// ---- SCENARIOS (Gold+) ----

export interface MAScenario {
  id: string;
  engagement_id: string;
  scenario_type: MAScenarioType;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  is_pre_built: boolean;
  inputs: ScenarioInputs;
  outputs?: ScenarioOutputs;
  summary_headline?: string;
  summary_detail?: string;
  recommendation?: 'proceed' | 'caution' | 'dont_proceed' | 'needs_more_info';
  break_even_months?: number;
  first_year_impact?: number;
  cash_impact_monthly?: number;
  created_at: string;
  created_by?: string;
  last_run_at?: string;
  updated_at: string;
}

export interface ScenarioInputs {
  // Hire scenario
  role?: string;
  salary?: number;
  employer_ni?: number;
  pension?: number;
  other_costs?: number;
  start_date?: string;
  expected_utilisation?: number;
  ramp_months?: number;
  charge_rate?: number;
  // Pricing scenario
  price_change_pct?: number;
  affected_clients?: string[];
  implementation_date?: string;
  expected_churn_pct?: number;
  // Client loss scenario
  client_name?: string;
  client_revenue?: number;
  associated_costs?: number;
  // Investment scenario
  investment_amount?: number;
  expected_return_pct?: number;
  payback_months?: number;
  // Custom
  custom_inputs?: Record<string, any>;
}

export interface ScenarioOutputs {
  total_annual_cost?: number;
  monthly_cost?: number;
  breakeven_month?: number;
  first_year_contribution?: number;
  cash_impact_by_month?: number[];
  sensitivity_analysis?: Record<string, any>;
  // Custom outputs
  [key: string]: any;
}

// ---- CLIENT PROFITABILITY (Gold+) ----

export interface MAClientProfitability {
  id: string;
  period_id: string;
  engagement_id: string;
  client_name: string;
  client_ref?: string;
  revenue: number;
  revenue_ytd?: number;
  revenue_prior_year?: number;
  direct_labour_cost?: number;
  direct_labour_hours?: number;
  subcontractor_cost?: number;
  other_direct_costs?: number;
  total_direct_costs?: number;
  gross_profit?: number;
  gross_margin_pct?: number;
  allocated_overhead?: number;
  overhead_allocation_method?: 'revenue_proportion' | 'labour_hours' | 'fixed' | 'none';
  net_profit?: number;
  net_margin_pct?: number;
  effective_hourly_rate?: number;
  target_margin_pct?: number;
  margin_vs_target?: number;
  rag_status?: RAGStatus;
  verdict?: ClientVerdict;
  analysis_notes?: string;
  recommended_action?: string;
  created_at: string;
  created_by?: string;
}

// ---- KPIs ----

export interface MAKPIValue {
  id: string;
  period_id?: string;
  engagement_id: string;
  kpi_code: string;
  period_end: string;
  value: number;
  previous_value?: number;
  previous_year_value?: number;
  target_value?: number;
  benchmark_value?: number;
  rag_status?: RAGStatus;
  trend?: 'improving' | 'stable' | 'declining';
  change_vs_previous?: number;
  change_vs_previous_pct?: number;
  auto_commentary?: string;
  human_commentary?: string;
  // Joined
  kpi_name?: string;
  kpi_unit?: string;
  kpi_category?: string;
  higher_is_better?: boolean;
}

// ---- TIER FEATURES ----

export interface TierFeatures {
  tier: MATier;
  kpi_limit: number;
  insight_count: number;
  has_recommendations: boolean;
  has_watch_list: boolean;
  has_cash_forecast: boolean;
  has_scenarios: boolean;
  scenario_limit?: number;
  has_client_profitability: boolean;
  has_benchmarks: boolean;
  has_board_pack: boolean;
  call_frequency: 'none' | 'quarterly' | 'monthly' | 'fortnightly';
}

export const TIER_FEATURES: Record<MATier, TierFeatures> = {
  bronze: {
    tier: 'bronze',
    kpi_limit: 3,
    insight_count: 3,
    has_recommendations: false,
    has_watch_list: false,
    has_cash_forecast: false,
    has_scenarios: false,
    has_client_profitability: false,
    has_benchmarks: false,
    has_board_pack: false,
    call_frequency: 'none',
  },
  silver: {
    tier: 'silver',
    kpi_limit: 5,
    insight_count: 5,
    has_recommendations: true,
    has_watch_list: true,
    has_cash_forecast: false,
    has_scenarios: false,
    has_client_profitability: false,
    has_benchmarks: false,
    has_board_pack: false,
    call_frequency: 'quarterly',
  },
  gold: {
    tier: 'gold',
    kpi_limit: 8,
    insight_count: 7,
    has_recommendations: true,
    has_watch_list: true,
    has_cash_forecast: true,
    has_scenarios: true,
    scenario_limit: 3,
    has_client_profitability: true,
    has_benchmarks: false,
    has_board_pack: false,
    call_frequency: 'monthly',
  },
  platinum: {
    tier: 'platinum',
    kpi_limit: 999,
    insight_count: 10,
    has_recommendations: true,
    has_watch_list: true,
    has_cash_forecast: true,
    has_scenarios: true,
    scenario_limit: 999,
    has_client_profitability: true,
    has_benchmarks: true,
    has_board_pack: true,
    call_frequency: 'fortnightly',
  },
};

// ---- DELIVERY CHECKLIST ----

export interface DeliveryChecklistItem {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  min_tier?: MATier;
}

export function getDeliveryChecklist(tier: MATier, periodData: {
  documents: MADocument[];
  kpis: MAKPIValue[];
  insights: MAInsight[];
  period: MAPeriod;
  forecast?: MACashForecast;
}): DeliveryChecklistItem[] {
  const features = TIER_FEATURES[tier];
  const { documents, kpis, insights, period, forecast } = periodData;

  const items: DeliveryChecklistItem[] = [
    {
      id: 'documents_uploaded',
      label: 'Management accounts uploaded',
      required: true,
      completed: documents.some(d => 
        d.document_type === 'management_pack' || 
        (documents.some(d => d.document_type === 'pnl') && documents.some(d => d.document_type === 'balance_sheet'))
      ),
    },
    {
      id: 'true_cash_calculated',
      label: 'True Cash Position calculated',
      required: true,
      completed: kpis.some(k => k.kpi_code === 'true_cash' && k.value !== null),
    },
    {
      id: 'kpis_calculated',
      label: 'All selected KPIs calculated',
      required: true,
      completed: kpis.length >= features.kpi_limit && kpis.every(k => k.value !== null),
    },
    {
      id: 'tuesday_question_answered',
      label: 'Tuesday Question answered',
      required: true,
      completed: !!period.tuesday_answer,
    },
    {
      id: 'insights_added',
      label: `Key insights added (min ${features.insight_count})`,
      required: true,
      completed: insights.length >= features.insight_count,
    },
  ];

  // Silver+ items
  if (features.has_recommendations) {
    items.push({
      id: 'recommendations_added',
      label: 'Recommendations added to insights',
      required: true,
      completed: insights.filter(i => i.recommendation).length >= 3,
      min_tier: 'silver',
    });
    items.push({
      id: 'watch_list_reviewed',
      label: 'Watch list reviewed and updated',
      required: true,
      completed: true, // Would need actual data
      min_tier: 'silver',
    });
  }

  // Gold+ items
  if (features.has_cash_forecast) {
    items.push({
      id: 'forecast_updated',
      label: 'Cash forecast updated',
      required: true,
      completed: !!forecast && forecast.status === 'published',
      min_tier: 'gold',
    });
    items.push({
      id: 'profitability_analysed',
      label: 'Client profitability analysed',
      required: true,
      completed: true, // Would need actual data
      min_tier: 'gold',
    });
  }

  // Platinum items
  if (features.has_benchmarks) {
    items.push({
      id: 'benchmarks_added',
      label: 'Industry benchmarks added',
      required: true,
      completed: kpis.every(k => k.benchmark_value !== null),
      min_tier: 'platinum',
    });
  }

  if (features.has_board_pack) {
    items.push({
      id: 'board_pack_ready',
      label: 'Board pack prepared',
      required: false,
      completed: documents.some(d => d.document_type === 'board_pack'),
      min_tier: 'platinum',
    });
  }

  // Final step
  items.push({
    id: 'quality_review',
    label: 'Quality review completed',
    required: true,
    completed: period.status === 'approved' || period.status === 'delivered',
  });

  return items;
}

