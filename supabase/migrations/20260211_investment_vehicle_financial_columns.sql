-- Add investment vehicle columns to client_financial_data
-- These are ADDITIVE columns — existing rows will have NULL values
-- which is correct (trading businesses don't have investment property)

ALTER TABLE client_financial_data
  ADD COLUMN IF NOT EXISTS investment_property DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS deferred_tax DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS bank_loans DECIMAL(15,2);

COMMENT ON COLUMN client_financial_data.investment_property IS 'Investment property at fair value (property investment companies)';
COMMENT ON COLUMN client_financial_data.deferred_tax IS 'Deferred tax provision (often large for property revaluation)';
COMMENT ON COLUMN client_financial_data.bank_loans IS 'Bank loans secured on property (long-term liabilities)';

-- Fix trailing commas in names (Issue #11)
UPDATE practice_members SET name = TRIM(TRAILING ',' FROM name) WHERE name LIKE '%,';
