-- ============================================================================
-- 4B: ADAPTIVE ASSESSMENT — Status view
-- ============================================================================
-- Convenience view to check which clients have BM/SA/financial data.
-- No new tables — adaptive metadata stored in client_assessments.metadata JSONB.
--
-- IMPORTANT: bm_assessment_responses joins via bm_engagements (engagement_id → client_id)
--            sa_discovery_responses joins via sa_engagements (engagement_id → client_id)
-- ============================================================================

CREATE OR REPLACE VIEW adaptive_assessment_status AS
SELECT
  pm.id AS client_id,
  pm.practice_id,
  -- BM data: must join through bm_engagements
  EXISTS(
    SELECT 1 FROM bm_engagements be
    WHERE be.client_id = pm.id
      AND be.status NOT IN ('draft')
  ) AS has_bm_data,
  -- SA data: must join through sa_engagements
  EXISTS(
    SELECT 1 FROM sa_engagements se
    JOIN sa_discovery_responses sdr ON sdr.engagement_id = se.id
    WHERE se.client_id = pm.id
  ) AS has_sa_data,
  -- Financial data: direct client_id
  EXISTS(
    SELECT 1 FROM client_financial_data cfd
    WHERE cfd.client_id = pm.id
  ) AS has_financial_data,
  -- Also check service_line_assessments as fallback for BM
  EXISTS(
    SELECT 1 FROM service_line_assessments sla
    WHERE sla.client_id = pm.id
      AND sla.service_line_code = 'benchmarking'
      AND sla.status = 'completed'
  ) AS has_bm_sla_data
FROM practice_members pm
WHERE pm.member_type = 'client';

COMMENT ON VIEW adaptive_assessment_status IS
  'Convenience view: which clients have BM, SA, or financial data that could allow Part 2 sections to be skipped. Used by adaptive assessment hook.';
