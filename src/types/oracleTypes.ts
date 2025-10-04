// Oracle Dashboard Type Definitions

export interface Part1Responses {
  full_name: string;
  company_name: string;
  has_partners: string;
  commitment_hours: string;
  danger_zone: string;
  ninety_day_fantasy: string;
  tuesday_test: string;
  emergency_log: string;
  relationship_mirror: string;
  skills_confession: string;
  sacrifices: string[];
  growth_trap: string[];
  money_truth: {
    current_income: string;
    desired_income: string;
  };
  business_turnover: {
    current_turnover: string;
    target_turnover: string;
  };
}

export interface Part2Responses {
  trading_name: string;
  years_trading: string;
  annual_turnover: string;
  team_size: string;
  financial_visibility: string;
  operational_maturity: string;
  tech_infrastructure: string;
  competitive_position: string;
  three_experts_needed: string;
  growth_bottleneck: string;
  profit_eaters: string[];
  core_systems: string[];
  ninety_day_priorities: string[];
  [key: string]: any; // For additional fields
}

export interface RoadmapWeek {
  week_number: number;
  theme: string;
  focus: string;
  priority_level: string;
  time_budget: string;
  actions: string[];
  expected_outcome: string;
}

export interface RoadmapData {
  header?: {
    business_name: string;
    tagline: string;
    date: string;
    time_commitment: string;
    potential_roi: string;
  };
  summary: {
    currentRevenue: string;
    targetRevenue90Days: string;
    currentHours: number;
    targetHours90Days: number;
    userName?: string;
    businessName?: string;
  };
  week_0_preparation?: {
    title: string;
    time_required: string;
    tasks: string[];
    expected_outcome: string;
  };
  three_month_sprint?: {
    weeks: RoadmapWeek[];
    total_weeks: number;
    weekly_hours: number;
    daily_minutes: number;
  };
  roi_analysis: {
    total_annual_value: string;
    total_annual_value_numeric: number;
    potential_savings?: Record<string, string>;
    growth_opportunities?: Record<string, string>;
  };
  six_month_stretch?: {
    vision_statement: string;
    key_metrics: {
      revenue: string;
      time_freedom: string;
      team: string;
      systems?: string;
    };
    major_milestones: string[];
    warning_signs?: string[];
  };
}

export interface ClientIntake {
  id: string;
  created_at: string;
  email: string;
  responses: Part1Responses;
  fit_message: string;
  group_id: string;
  is_primary: boolean;
  status: string;
}

export interface ClientIntakePart2 {
  id: string;
  created_at: string;
  group_id: string;
  responses: Part2Responses;
  extracted_insights?: Record<string, any>;
  roadmap_generated: boolean;
}

export interface ClientConfig {
  id: string;
  group_id: string;
  board: string[];
  rationale: Record<string, string>;
  scores: Record<string, number>;
  board_composition: string;
  session_type?: string;
  roadmap?: RoadmapData;
  roadmap_narrative?: {
    opening_hook?: string;
    the_journey?: string;
    transformation_story?: Record<string, string>;
    success_metrics?: Record<string, string>;
    motivational_anchors?: Record<string, string>;
  };
  industry?: string;
  founder_state?: string;
  business_stage?: string;
  annual_value_potential?: number;
  generated_at?: string;
  revenue?: number;
  location?: string;
  team_size?: string;
  time_commitment?: string;
}