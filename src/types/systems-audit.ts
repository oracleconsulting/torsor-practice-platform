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
