-- =============================================================================
-- Migration: Add quantitative vs qualitative impact attribution to opportunities
-- Date: 2026-05-12
-- Patch: 19
-- Purpose: Pass 3 writes mechanical £ figures for every opportunity; for some,
--          value is real but not reducible to a single £ today. Adds columns to
--          mark qualitative opportunities and store a prose summary.
-- =============================================================================

-- 1. Impact mode: 'quantitative' (default) or 'qualitative' (amount NULL)
ALTER TABLE client_opportunities
  ADD COLUMN IF NOT EXISTS impact_mode TEXT
    CHECK (impact_mode IN ('quantitative', 'qualitative'))
    DEFAULT 'quantitative';

COMMENT ON COLUMN client_opportunities.impact_mode IS
  'quantitative = financial_impact_amount is a defensible GBP figure with confidence and calculation; qualitative = use qualitative_impact_summary instead. Existing rows default to quantitative.';

-- 2. Qualitative summary where a single £ would be misleading
ALTER TABLE client_opportunities
  ADD COLUMN IF NOT EXISTS qualitative_impact_summary TEXT;

COMMENT ON COLUMN client_opportunities.qualitative_impact_summary IS
  'Where impact cannot be reduced to one GBP figure: prose on long-term benefit. Populated when impact_mode = qualitative.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'client_opportunities' AND column_name = 'impact_mode'
  ) THEN
    RAISE EXCEPTION 'impact_mode column missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'client_opportunities' AND column_name = 'qualitative_impact_summary'
  ) THEN
    RAISE EXCEPTION 'qualitative_impact_summary column missing';
  END IF;

  RAISE NOTICE 'Migration 20260512000001 applied successfully';
END $$;
