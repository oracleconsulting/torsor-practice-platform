-- Add surplus_cash column (data is calculated but nowhere to store)
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS surplus_cash JSONB;

-- Add founder risk columns (for HVA integration)
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS founder_risk_level TEXT;
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS founder_risk_score INTEGER;
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS founder_risk_factors JSONB;
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS valuation_impact TEXT;

-- Add unique constraint for metric comparisons upsert if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bm_metric_comparisons_engagement_metric_unique'
  ) THEN
    ALTER TABLE bm_metric_comparisons 
    ADD CONSTRAINT bm_metric_comparisons_engagement_metric_unique 
    UNIQUE (engagement_id, metric_code);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

