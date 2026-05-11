-- ============================================================================
-- Migration: 20260510000030_bm_integrity_foundation.sql
-- Purpose : Add integrity-pass infrastructure to the benchmarking pipeline.
-- ============================================================================

BEGIN;

-- SECTION 1: INTEGRITY COLUMNS ON bm_reports

ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS entity_allowlist JSONB;
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS numeric_anchors JSONB;
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS data_integrity_manifest JSONB;
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS entity_violations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS numeric_violations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS narrative_quality TEXT DEFAULT 'unverified'
  CHECK (narrative_quality IN ('unverified', 'clean', 'requires_review'));
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS data_integrity TEXT DEFAULT 'unknown'
  CHECK (data_integrity IN ('unknown', 'complete', 'incomplete'));
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS quality_override JSONB;
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS reprompt_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN bm_reports.entity_allowlist IS 'Deterministic allowlist of entities Pass 2 may name.';
COMMENT ON COLUMN bm_reports.numeric_anchors IS 'List of numeric facts Pass 2 may claim, with tolerances.';
COMMENT ON COLUMN bm_reports.data_integrity_manifest IS 'Per-input record showing value, source, and whether a default was substituted.';
COMMENT ON COLUMN bm_reports.entity_violations IS 'Entities in narrative that did not match the allowlist.';
COMMENT ON COLUMN bm_reports.numeric_violations IS 'Numeric claims that did not reconcile to an anchor.';
COMMENT ON COLUMN bm_reports.narrative_quality IS 'Quality gate: unverified / clean / requires_review.';
COMMENT ON COLUMN bm_reports.data_integrity IS 'Input gate: unknown / complete / incomplete.';
COMMENT ON COLUMN bm_reports.quality_override IS 'Audit trail for admin overrides of quality gates.';
COMMENT ON COLUMN bm_reports.reprompt_history IS 'Per-attempt record of Pass 2 reprompts triggered by violations.';

-- SECTION 2: INDUSTRY SAFE COMPARABLES REGISTRY

CREATE TABLE IF NOT EXISTS industry_safe_comparables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_code TEXT NOT NULL,
  business_stage TEXT NOT NULL CHECK (business_stage IN ('pre_revenue','early_revenue','growth','operating','mature','all')),
  company_name TEXT NOT NULL,
  source_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  added_by TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (industry_code, business_stage, company_name)
);

CREATE INDEX IF NOT EXISTS idx_industry_safe_comparables_lookup
  ON industry_safe_comparables (industry_code, business_stage) WHERE is_active = TRUE;

ALTER TABLE industry_safe_comparables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read industry_safe_comparables" ON industry_safe_comparables
  FOR SELECT USING (auth.role() = 'authenticated');

-- SECTION 3: SEED SAFE COMPARABLES

INSERT INTO industry_safe_comparables (industry_code, business_stage, company_name, notes) VALUES
  ('SAAS_REGTECH','all','Themis','UK regtech compliance platform; relevant pre-revenue funding history'),
  ('SAAS_REGTECH','all','Skillcast','UK compliance training platform; established competitor'),
  ('SAAS_REGTECH','all','ComplyAdvantage','UK regtech AML/sanctions screening platform'),
  ('SAAS_REGTECH','all','Onfido','UK identity verification regtech'),
  ('SAAS_REGTECH','all','Featurespace','UK fraud detection regtech (acquired by Visa 2024)'),
  ('SAAS_REGTECH','all','VinciWorks','UK compliance learning and risk management platform'),
  ('SAAS_REGTECH','all','Quantexa','UK decision intelligence regtech (financial crime)'),
  ('SAAS_REGTECH','all','Napier AI','UK AML compliance platform'),
  ('SAAS_REGTECH','all','Encompass','UK KYC automation regtech'),
  ('SAAS_REGTECH','all','Datatonic','UK data platform with regtech adjacency'),
  ('AGENCY_DEV','all','Bytes Technology Group','UK reseller-adjacent listed comparable')
ON CONFLICT (industry_code, business_stage, company_name) DO NOTHING;

-- SECTION 4: VERIFICATION

DO $$
DECLARE col_count INTEGER; seed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count FROM information_schema.columns
  WHERE table_schema='public' AND table_name='bm_reports'
    AND column_name IN ('entity_allowlist','numeric_anchors','data_integrity_manifest',
      'entity_violations','numeric_violations','narrative_quality','data_integrity',
      'quality_override','reprompt_history');
  IF col_count <> 9 THEN RAISE EXCEPTION 'Expected 9 new columns, found %', col_count; END IF;

  SELECT COUNT(*) INTO seed_count FROM industry_safe_comparables;
  IF seed_count < 10 THEN RAISE EXCEPTION 'Seed count too low: %', seed_count; END IF;

  RAISE NOTICE 'Integrity foundation: % columns, % comparables', col_count, seed_count;
END $$;

COMMIT;
