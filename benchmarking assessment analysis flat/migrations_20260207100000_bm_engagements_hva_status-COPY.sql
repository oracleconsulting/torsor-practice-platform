-- Add HVA (Hidden Value Audit) status tracking to bm_engagements
-- Used by benchmarking admin view to show status badge and "Request Updated HVA" for stale (>90 days)

ALTER TABLE bm_engagements
  ADD COLUMN IF NOT EXISTS hva_status TEXT DEFAULT 'pending'
    CHECK (hva_status IN ('pending', 'current', 'stale', 'completed'));

ALTER TABLE bm_engagements
  ADD COLUMN IF NOT EXISTS hva_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN bm_engagements.hva_status IS 'Hidden Value Audit status: pending (awaiting client), current/completed (done), stale (>90 days — review recommended)';
COMMENT ON COLUMN bm_engagements.hva_completed_at IS 'When HVA was last completed (Discovery/Part 3); used to compute age for stale badge';
