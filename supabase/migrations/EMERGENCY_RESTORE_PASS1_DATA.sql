-- ============================================================================
-- EMERGENCY RESTORE: Reconstruct pass1_data top-level assembly from phase keys
-- ============================================================================
-- Use when Phase 1 was run during regeneration and overwrote pass1_data with
-- only { phase1: data }, wiping facts, findings, recommendations, systemsMaps, etc.
-- This merges phase1/phase2/phase3/phase5 back into top-level keys and sets
-- status = 'generated' so the client can see the report again.
--
-- Does NOT restore: systemsMaps (requires Phase 8), executive_summary/headline
-- (require Pass 2). Run Pass 2 separately if narratives are missing.
-- ============================================================================

UPDATE sa_audit_reports
SET
  pass1_data = pass1_data
    || jsonb_build_object(
        'facts',
        COALESCE(pass1_data->'phase1'->'facts', '{}'::jsonb)
          || jsonb_build_object('processes', COALESCE(pass1_data->'phase2'->'processes', '[]'::jsonb))
          || jsonb_build_object('hoursWastedWeekly', pass1_data->'phase2'->'hoursWastedWeekly')
          || jsonb_build_object('annualCostOfChaos', pass1_data->'phase2'->'annualCostOfChaos')
          || jsonb_build_object('projectedCostAtScale', pass1_data->'phase2'->'projectedCostAtScale')
          || jsonb_build_object('aspirationGap', pass1_data->'phase2'->'aspirationGap')
      )
    || jsonb_build_object('scores', COALESCE(pass1_data->'phase2'->'scores', '{}'::jsonb))
    || jsonb_build_object('findings', COALESCE(pass1_data->'phase3'->'findings', '[]'::jsonb))
    || jsonb_build_object('quickWins', COALESCE(pass1_data->'phase3'->'quickWins', '[]'::jsonb))
    || jsonb_build_object('recommendations', COALESCE(pass1_data->'phase5'->'recommendations', '[]'::jsonb))
    || jsonb_build_object('uniquenessBrief', pass1_data->'phase2'->'uniquenessBrief'),
  status = 'generated'
WHERE engagement_id = '80603cc0-1c4d-46ed-8041-04bdbbaffa70'
  AND (pass1_data ? 'phase1')
  AND (NOT (pass1_data ? 'facts') OR (pass1_data->'facts' = '{}'::jsonb));
