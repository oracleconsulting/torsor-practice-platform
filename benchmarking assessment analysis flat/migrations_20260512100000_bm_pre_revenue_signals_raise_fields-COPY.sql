-- =============================================================================
-- Migration: B1 raise-fields on bm_pre_revenue_signals (re-issue)
-- Date: 2026-05-12
-- Purpose: Adds 5 nullable raise-context columns; named CHECK on
--          incorporation_status; PostgREST schema reload.
-- Idempotent alongside 20260512000002_pre_revenue_signals_raise_fields.sql
-- =============================================================================

BEGIN;

ALTER TABLE bm_pre_revenue_signals
  ADD COLUMN IF NOT EXISTS use_of_funds JSONB,
  ADD COLUMN IF NOT EXISTS pipeline_deals JSONB,
  ADD COLUMN IF NOT EXISTS investor_commitments JSONB,
  ADD COLUMN IF NOT EXISTS pricing_strategy_notes TEXT,
  ADD COLUMN IF NOT EXISTS incorporation_status TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'bm_pre_revenue_signals_incorporation_status_check'
  ) THEN
    ALTER TABLE bm_pre_revenue_signals
      ADD CONSTRAINT bm_pre_revenue_signals_incorporation_status_check
      CHECK (incorporation_status IS NULL OR incorporation_status IN (
        'pre_incorporation',
        'basic_incorporated',
        'restructure_in_progress',
        'fully_structured'
      ));
  END IF;
END $$;

COMMENT ON COLUMN bm_pre_revenue_signals.use_of_funds IS
  'JSONB array of {category, amount, percent_of_total, notes} — how the round will be deployed. NULL when not yet captured.';
COMMENT ON COLUMN bm_pre_revenue_signals.pipeline_deals IS
  'JSONB array of {prospect_name, stage, expected_acv, expected_close_date, discount_offered, notes}. Stage values: signed_contract|signed_loi|verbal_commitment|active_discussion|cold_outreach. NULL when not yet captured.';
COMMENT ON COLUMN bm_pre_revenue_signals.investor_commitments IS
  'JSONB array of {investor_name, amount, status, role, notes}. Status is commitment stage (admin UI; not column CHECK). Role values: lead|co_lead|follower|passive. NULL when not yet captured.';
COMMENT ON COLUMN bm_pre_revenue_signals.pricing_strategy_notes IS
  'Free-text notes on pricing strategy for the raise period (early adopter discounts, list price evolution, etc).';
COMMENT ON COLUMN bm_pre_revenue_signals.incorporation_status IS
  'CHECK enum: pre_incorporation, basic_incorporated, restructure_in_progress, fully_structured. NULL when not yet captured.';

NOTIFY pgrst, 'reload schema';

COMMIT;
