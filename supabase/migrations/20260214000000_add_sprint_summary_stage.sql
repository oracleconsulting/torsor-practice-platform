-- ============================================================================
-- ADD SPRINT SUMMARY TO PIPELINE
-- ============================================================================
-- Purpose: Document sprint_summary stage; index for sprint-specific queries.
-- sprint_summary is triggered by client-side when all 12 weeks are resolved,
-- not by the DB trigger chain.
-- ============================================================================

-- Index for sprint-specific stage lookups
CREATE INDEX IF NOT EXISTS idx_roadmap_stages_sprint
  ON roadmap_stages(client_id, stage_type, sprint_number);

COMMENT ON TABLE roadmap_stages IS
  'Stores generated content for each pipeline stage. Stage types: fit_assessment, five_year_vision, six_month_shift, sprint_plan_part1, sprint_plan_part2, value_analysis, sprint_summary. sprint_summary is generated after all sprint tasks are resolved.';
