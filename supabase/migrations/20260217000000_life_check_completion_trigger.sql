-- ============================================================================
-- AUTO-UPDATE RENEWAL STATUS ON LIFE CHECK COMPLETION
-- ============================================================================
-- When a client completes their quarterly life check (completed_at is set),
-- automatically advance renewal_status to 'life_check_complete'.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_renewal_status_on_life_check()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire when completed_at transitions from NULL to a value
  IF NEW.completed_at IS NOT NULL AND (OLD IS NULL OR OLD.completed_at IS NULL) THEN
    UPDATE client_service_lines csl
    SET renewal_status = 'life_check_complete'
    FROM service_lines sl
    WHERE csl.client_id = NEW.client_id
      AND csl.service_line_id = sl.id
      AND sl.code = '365_method'
      AND csl.renewal_status = 'life_check_pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_life_check_completion ON quarterly_life_checks;
CREATE TRIGGER trg_life_check_completion
  AFTER INSERT OR UPDATE ON quarterly_life_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_renewal_status_on_life_check();
