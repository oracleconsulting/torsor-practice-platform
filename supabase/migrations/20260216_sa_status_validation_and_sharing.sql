-- ============================================================================
-- SYSTEMS AUDIT: STATUS TRANSITION + SHARING + HOURLY RATE
-- ============================================================================
-- Migration: 20260216_sa_status_validation_and_sharing.sql
--
-- 1. Status transition validation trigger on sa_engagements
-- 2. Add is_shared_with_client column
-- 3. Add hourly_rate column (default 45 for cost-of-chaos calculations)
-- 4. Index for shared lookup
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. STATUS TRANSITION VALIDATION
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION validate_sa_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "pending": ["stage_1_complete"],
    "stage_1_complete": ["stage_2_complete"],
    "stage_2_complete": ["stage_3_scheduled", "stage_3_complete"],
    "stage_3_scheduled": ["stage_3_complete"],
    "stage_3_complete": ["analysis_complete"],
    "analysis_complete": ["report_delivered"],
    "report_delivered": ["implementation", "completed"],
    "implementation": ["completed"]
  }'::jsonb;
  allowed_next jsonb;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  allowed_next := valid_transitions -> OLD.status;

  IF allowed_next IS NULL THEN
    RAISE EXCEPTION 'Cannot transition from status "%"', OLD.status;
  END IF;

  IF NOT (allowed_next ? NEW.status) THEN
    RAISE EXCEPTION 'Invalid status transition: "%" → "%". Allowed: %',
      OLD.status, NEW.status, allowed_next;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_sa_status_transition ON sa_engagements;
CREATE TRIGGER enforce_sa_status_transition
  BEFORE UPDATE OF status ON sa_engagements
  FOR EACH ROW
  EXECUTE FUNCTION validate_sa_status_transition();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. is_shared_with_client
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS is_shared_with_client BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_sa_engagements_shared
  ON sa_engagements (client_id)
  WHERE is_shared_with_client = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. hourly_rate (for cost-of-chaos calculations)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 45.00;

COMMENT ON COLUMN sa_engagements.hourly_rate IS
  'Blended hourly rate for cost-of-chaos calculations. Default £45. Admin can override per client.';
