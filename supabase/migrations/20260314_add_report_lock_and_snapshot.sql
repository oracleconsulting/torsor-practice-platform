-- Add report locking, schema versioning, and Pass 1 snapshot columns
-- These support the lock-on-publish feature and future layout migration

ALTER TABLE discovery_reports
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS locked_by UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS pass1_snapshot JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS generation_config JSONB DEFAULT NULL;

COMMENT ON COLUMN discovery_reports.locked_at IS 'When set, prevents regeneration. Auto-set on publish.';
COMMENT ON COLUMN discovery_reports.locked_by IS 'User who locked (or NULL for auto-lock on publish)';
COMMENT ON COLUMN discovery_reports.schema_version IS 'Report schema version for layout migration';
COMMENT ON COLUMN discovery_reports.pass1_snapshot IS 'Frozen Pass 1 output — raw calculated data that survives layout changes';
COMMENT ON COLUMN discovery_reports.generation_config IS 'Config used to generate this report (industry, benchmarks, models, etc.)';

ALTER TABLE discovery_engagements
  ADD COLUMN IF NOT EXISTS report_locked BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN discovery_engagements.report_locked IS 'Quick-check flag mirroring discovery_reports.locked_at';

-- Unlock RPC function
CREATE OR REPLACE FUNCTION unlock_discovery_report(p_engagement_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE discovery_reports
  SET locked_at = NULL, locked_by = NULL
  WHERE engagement_id = p_engagement_id;

  UPDATE discovery_engagements
  SET report_locked = FALSE
  WHERE id = p_engagement_id;

  INSERT INTO discovery_context_notes (
    engagement_id, note_type, title, content, created_by
  ) VALUES (
    p_engagement_id,
    'advisor_observation',
    'Report unlocked for regeneration',
    'Report was unlocked at ' || NOW()::text || '. Previous version preserved in pass1_snapshot.',
    p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
