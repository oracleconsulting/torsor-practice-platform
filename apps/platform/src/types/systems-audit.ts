// ============================================================================
// SYSTEMS AUDIT TYPES
// ============================================================================

export interface SAEngagement {
  id: string;
  client_id: string;
  practice_id: string;
  engagement_type: 'diagnostic' | 'full_audit' | 'implementation' | 'review';
  scope_areas: string[];
  quoted_price?: number;
  
  stage_1_completed_at?: string;
  stage_2_completed_at?: string;
  stage_3_completed_at?: string;
  stage_3_scheduled_at?: string;
  stage_3_consultant_id?: string;
  
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  
  status: 'pending' | 'stage_1_complete' | 'stage_2_complete' | 'stage_3_scheduled' | 'stage_3_complete' | 'analysis_complete' | 'report_delivered' | 'implementation' | 'completed';
  
  created_at: string;
  updated_at: string;
}

export interface SADiscoveryResponse {
  id: string;
  engagement_id: string;
  client_id: string;
  
  systems_breaking_point?: string;
  operations_self_diagnosis?: 'controlled_chaos' | 'manual_heroics' | 'death_by_spreadsheet' | 'tech_frankenstein' | 'actually_good';
  month_end_shame?: string;
  
  manual_hours_monthly?: 'under_10' | '10_20' | '20_40' | '40_80' | 'over_80';
  month_end_close_duration?: '1_2_days' | '3_5_days' | '1_2_weeks' | '2_4_weeks' | 'ongoing';
  data_error_frequency?: 'never' | 'once_twice' | 'several' | 'regularly' | 'dont_know';
  expensive_systems_mistake?: string;
  information_access_frequency?: 'never' | '1_2_times' | 'weekly' | 'daily' | 'constantly';
  
  software_tools_used?: string[];
  integration_rating?: 'seamless' | 'partial' | 'minimal' | 'none';
  critical_spreadsheets?: 'none' | '1_3' | '4_10' | '10_20' | 'lost_count';
  
  broken_areas?: string[];
  magic_process_fix?: string;
  
  change_appetite?: 'urgent' | 'ready' | 'cautious' | 'exploring';
  systems_fears?: string[];
  internal_champion?: 'founder' | 'finance_manager' | 'operations_manager' | 'office_manager' | 'it_lead' | 'other';
  
  team_size?: number;
  expected_team_size_12mo?: number;
  revenue_band?: 'under_250k' | '250k_500k' | '500k_1m' | '1m_2m' | '2m_5m' | '5m_10m' | 'over_10m';
  industry_sector?: string;
  
  raw_responses?: Record<string, any>;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SASystemCategory {
  id: string;
  category_code: string;
  category_name: string;
  parent_category?: string;
  display_order: number;
  common_systems: string[];
  created_at: string;
}

export interface SASystemInventory {
  id: string;
  engagement_id: string;
  
  system_name: string;
  category_code: string;
  sub_category?: string;
  vendor?: string;
  website_url?: string;
  
  primary_users: string[];
  number_of_users?: number;
  usage_frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  criticality: 'critical' | 'important' | 'nice_to_have';
  
  pricing_model: 'monthly' | 'annual' | 'per_user' | 'one_time' | 'free';
  monthly_cost?: number;
  annual_cost?: number;
  cost_trend: 'increasing' | 'stable' | 'decreasing' | 'dont_know';
  
  integrates_with?: string[];
  integrates_with_names?: string[];
  integration_method: 'native' | 'zapier_make' | 'custom_api' | 'manual' | 'none';
  manual_transfer_required: boolean;
  manual_hours_monthly?: number;
  manual_process_description?: string;
  
  data_quality_score?: number;
  data_entry_method?: 'single_point' | 'duplicated' | 'dont_know';
  
  user_satisfaction?: number;
  fit_for_purpose?: number;
  would_recommend?: 'yes' | 'maybe' | 'no';
  
  known_issues?: string;
  workarounds_in_use?: string;
  change_one_thing?: string;
  
  future_plan: 'keep' | 'replace' | 'upgrade' | 'unsure';
  replacement_candidate?: string;
  contract_end_date?: string;
  
  created_at: string;
  updated_at: string;
}

export interface SAProcessChain {
  id: string;
  chain_code: string;
  chain_name: string;
  description?: string;
  trigger_areas: string[];
  process_steps: string[];
  estimated_duration_mins: number;
  display_order: number;
  created_at: string;
}

export interface SAProcessDeepDive {
  id: string;
  engagement_id: string;
  chain_code: string;
  
  consultant_id?: string;
  scheduled_at?: string;
  conducted_at?: string;
  duration_mins?: number;
  
  responses: Record<string, any>;
  key_pain_points?: string[];
  hours_identified?: number;
  
  notes?: string;
  recording_url?: string;
  
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SAFinding {
  id: string;
  engagement_id: string;
  finding_code: string;
  source_stage: 'stage_1' | 'stage_2' | 'stage_3' | 'ai_generated';
  source_chain?: string;
  
  category: 'integration_gap' | 'manual_process' | 'data_silo' | 'single_point_failure' | 'scalability_risk' | 'compliance_risk' | 'cost_inefficiency' | 'user_experience';
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  title: string;
  description: string;
  evidence: string[];
  client_quote?: string;
  
  hours_wasted_weekly?: number;
  annual_cost_impact?: number;
  risk_exposure?: string;
  scalability_impact?: string;
  
  affected_systems?: string[];
  affected_processes?: string[];
  affected_roles?: string[];
  
  recommendation?: string;
  estimated_fix_cost?: number;
  estimated_fix_hours?: number;
  fix_complexity?: 'quick_win' | 'moderate' | 'significant' | 'major';
  
  payback_months?: number;
  annual_benefit?: number;
  
  status: 'identified' | 'validated' | 'accepted' | 'in_progress' | 'resolved' | 'wont_fix';
  
  created_at: string;
  updated_at: string;
}

export interface SARecommendation {
  id: string;
  engagement_id: string;
  priority_rank: number;
  title: string;
  description: string;
  
  category: 'quick_win' | 'foundation' | 'strategic' | 'optimization';
  implementation_phase?: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  
  estimated_duration_days?: number;
  estimated_cost?: number;
  internal_hours_required?: number;
  external_support_needed: boolean;
  
  hours_saved_weekly?: number;
  annual_cost_savings?: number;
  risk_reduction?: string;
  scalability_unlocked?: string;
  
  depends_on?: string[];
  enables?: string[];
  finding_ids?: string[];
  
  time_reclaimed_weekly?: number;
  freedom_unlocked?: string;
  
  created_at: string;
}

export interface SAAuditReport {
  id: string;
  engagement_id: string;
  
  headline?: string;
  executive_summary: string;
  executive_summary_sentiment?: 'strong_foundation' | 'good_with_gaps' | 'significant_issues' | 'critical_attention';
  
  total_hours_wasted_weekly?: number;
  total_annual_cost_of_chaos?: number;
  growth_multiplier?: number;
  projected_cost_at_scale?: number;
  cost_of_chaos_narrative?: string;
  
  systems_count?: number;
  integration_score?: number;
  automation_score?: number;
  data_accessibility_score?: number;
  scalability_score?: number;
  
  critical_findings_count: number;
  high_findings_count: number;
  medium_findings_count: number;
  low_findings_count: number;
  
  quick_wins?: any[];
  
  total_recommended_investment?: number;
  total_annual_benefit?: number;
  overall_payback_months?: number;
  roi_ratio?: string;
  
  hours_reclaimable_weekly?: number;
  time_freedom_narrative?: string;
  what_this_enables?: string[];
  
  client_quotes_used?: string[];
  
  llm_model?: string;
  llm_tokens_used?: number;
  llm_cost?: number;
  generation_time_ms?: number;
  prompt_version: string;
  
  status: 'generating' | 'generated' | 'approved' | 'published' | 'delivered';
  generated_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  review_edits?: Record<string, any>;
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  delivered_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface GenerateSAReportRequest {
  engagementId: string;
}

export interface GenerateSAReportResponse {
  success: boolean;
  reportId: string;
  headline?: string;
  costOfChaos?: number;
  tokensUsed?: number;
  cost?: number;
  generationTimeMs?: number;
  error?: string;
}

