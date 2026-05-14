-- =============================================================================
-- Migration: Pre-revenue signals — raise-centric fields
-- Date: 2026-05-12
-- Patch: B1 (Workstream B, schema layer)
-- =============================================================================

BEGIN;

ALTER TABLE bm_pre_revenue_signals
  ADD COLUMN IF NOT EXISTS use_of_funds JSONB;

COMMENT ON COLUMN bm_pre_revenue_signals.use_of_funds IS
  'Array of {category, amount, percent_of_total, notes} entries describing how the round will be deployed. Category is free text in v1; percent_of_total is stored (not computed).';

ALTER TABLE bm_pre_revenue_signals
  ADD COLUMN IF NOT EXISTS pipeline_deals JSONB;

COMMENT ON COLUMN bm_pre_revenue_signals.pipeline_deals IS
  'Array of {prospect_name, stage, expected_acv, expected_close_date, discount_offered, notes}.';

ALTER TABLE bm_pre_revenue_signals
  ADD COLUMN IF NOT EXISTS pricing_strategy_notes TEXT;

COMMENT ON COLUMN bm_pre_revenue_signals.pricing_strategy_notes IS
  'Freetext capture of pricing strategy for Pass 2 narrative.';

ALTER TABLE bm_pre_revenue_signals
  ADD COLUMN IF NOT EXISTS incorporation_status TEXT
    CHECK (incorporation_status IN (
      'pre_incorporation',
      'basic_incorporated',
      'restructure_in_progress',
      'fully_structured'
    ));

COMMENT ON COLUMN bm_pre_revenue_signals.incorporation_status IS
  'Sequencing status of legal corporate setup. Distinct from ip_holding_entity and corporate_structure_clean.';

ALTER TABLE bm_pre_revenue_signals
  ADD COLUMN IF NOT EXISTS investor_commitments JSONB;

COMMENT ON COLUMN bm_pre_revenue_signals.investor_commitments IS
  'Array of {investor_name, amount, status, role, notes}.';

COMMIT;

-- -----------------------------------------------------------------------------
-- Verification (optional — run in SQL editor after migrate)
-- -----------------------------------------------------------------------------

/*
SELECT
  column_name,
  data_type,
  is_nullable,
  CASE
    WHEN column_name IN (
      'use_of_funds', 'pipeline_deals', 'pricing_strategy_notes',
      'incorporation_status', 'investor_commitments'
    ) THEN 'new'
    ELSE 'existing'
  END AS check_result
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bm_pre_revenue_signals'
  AND column_name IN (
    'use_of_funds',
    'pipeline_deals',
    'pricing_strategy_notes',
    'incorporation_status',
    'investor_commitments'
  )
ORDER BY column_name;

DO $$
BEGIN
  BEGIN
    INSERT INTO bm_pre_revenue_signals (engagement_id, incorporation_status)
    VALUES ('00000000-0000-0000-0000-000000000000', 'this_should_fail');
    RAISE EXCEPTION 'CHECK constraint did not fire';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'incorporation_status CHECK enforced';
    WHEN foreign_key_violation THEN
      RAISE NOTICE 'FK fired before CHECK (constraint still valid on schema)';
  END;
END $$;

SELECT
  COUNT(*) AS total_signals_rows,
  COUNT(use_of_funds) AS with_use_of_funds,
  COUNT(pipeline_deals) AS with_pipeline_deals,
  COUNT(pricing_strategy_notes) AS with_pricing_notes,
  COUNT(incorporation_status) AS with_incorp_status,
  COUNT(investor_commitments) AS with_investor_commits
FROM bm_pre_revenue_signals;
*/
