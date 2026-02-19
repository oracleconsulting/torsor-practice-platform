// Systems Audit — engagement gaps (pre-generation review) and engagement shape

export interface SAEngagementGap {
  id: string;
  engagement_id: string;

  gap_area: 'stage_1_discovery' | 'stage_2_inventory' | 'stage_3_process' | 'cross_cutting';
  gap_tag: string | null;

  description: string;
  source_question: string | null;

  resolution: string | null;
  additional_context: string | null;

  status: 'identified' | 'resolved' | 'not_applicable' | 'deferred';

  created_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SAEngagementReview {
  review_status: 'not_started' | 'in_progress' | 'complete';
  review_completed_at?: string;
  review_completed_by?: string;
  review_notes?: string;
}

// Preliminary analysis (Part 3 — two-phase report generation)
export type GapArea = 'stage_1_discovery' | 'stage_2_inventory' | 'stage_3_process' | 'cross_cutting';

export interface PreliminaryAnalysis {
  businessSnapshot: {
    companyType: string;
    revenue_model: string;
    growth_stage: string;
    systems_count: number;
    headline_pain: string;
  };
  confidenceScores: {
    area: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
    questionsCited: string[];
  }[];
  suggestedGaps: {
    gap_area: GapArea;
    gap_tag: string;
    description: string;
    source_question: string | null;
    severity: 'blocking' | 'important' | 'nice_to_have';
  }[];
  contradictions: {
    claim_a: string;
    claim_b: string;
    source_a: string;
    source_b: string;
    suggested_resolution: string;
  }[];
  topInsights: string[];
  questionsAnswered: number;
  questionsSkipped: number;
  totalQuestions: number;
  chainsCompleted: number;
  totalChains: number;
}
