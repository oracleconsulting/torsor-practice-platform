-- ============================================================================
-- ADD UNIQUE CONSTRAINT FOR ma_monthly_insights (v2 mode)
-- ============================================================================
-- In v2 mode, insights are generated per engagement + period_end_date
-- (not per snapshot). We need a unique constraint to ensure data integrity.
-- ============================================================================

-- Add unique partial index on (engagement_id, period_end_date) for v2 insights
-- This ensures one insight per engagement per period for v2 mode
-- (where snapshot_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ma_insights_engagement_period 
ON ma_monthly_insights(engagement_id, period_end_date)
WHERE snapshot_id IS NULL; -- Only for v2 insights (no snapshot_id)

-- Note: For v1 insights (with snapshot_id), the snapshot_id itself provides
-- uniqueness. The WHERE clause ensures we only enforce uniqueness for v2 insights
-- that don't have a snapshot_id.

COMMENT ON INDEX idx_ma_insights_engagement_period IS 
'Ensures one insight per engagement per period for v2 mode (extracted financials based). Partial index for v2 insights only (snapshot_id IS NULL).';

