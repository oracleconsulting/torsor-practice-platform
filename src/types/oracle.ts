export interface VisionMilestone {
  headline: string;
  story: string;
  measurable: string;
}

export interface FiveYearVision {
  vision_narrative: string;
  year_1: VisionMilestone;
  year_3: VisionMilestone;
  year_5: VisionMilestone;
  north_star: string;
  archetype: string;
  emotional_core: string;
  emotional_anchors?: {
    pain_phrases: string[];
    desire_phrases: string[];
    metaphors: string[];
    time_patterns: string[];
    transformation_signals: string[];
    repeated_themes: string[];
  };
}

export interface ShiftItem {
  area: 'People' | 'Systems' | 'Mindset' | 'Structure';
  from: string;
  to: string;
  why_critical: string;
  success_metric: string;
}

export interface SixMonthShift {
  shift_narrative: string;
  shifts: ShiftItem[];
  biggest_unlock: string;
  resources_needed: string[];
}

export interface SprintTask {
  task: string;
  time: string;
  output: string;
}

export interface SprintWeek {
  week: number;
  theme: string;
  focus: string;
  tasks: SprintTask[];
}

export interface ThreeMonthSprint {
  sprint_theme: string;
  sprint_goals: string[];
  weeks: SprintWeek[];
  success_metrics: {
    week_4: string;
    week_8: string;
    week_12: string;
  };
  biggest_risk: string;
  support_needed: string[];
}

export interface ROIImpact {
  revenue_opportunities: {
    revenue_potential: {
      value: string;
      description: string;
      calculation: string;
    };
  };
  growth_accelerators: Record<string, any>;
  value_creation: Record<string, any>;
  opportunity_type: string;
  total_opportunity_value: string;
  total_opportunity_value_numeric: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface BoardRecommendation {
  board: string[];
  rationale: Record<string, string>;
  scores: Record<string, number>;
  board_composition: string;
  session_type: string;
}

export interface Roadmap {
  method: string;
  generated_at: string;
  group_id: string;
  five_year_vision: FiveYearVision;
  six_month_shift: SixMonthShift;
  three_month_sprint: ThreeMonthSprint;
  roi_impact: ROIImpact;
  board_recommendation: BoardRecommendation;
  sprint_iteration: number;
  next_review_date: string;
  founder_context: {
    archetype: string;
    current_revenue: number;
    time_commitment: string;
    biggest_challenge: string | null;
    industry: string;
  };
} 