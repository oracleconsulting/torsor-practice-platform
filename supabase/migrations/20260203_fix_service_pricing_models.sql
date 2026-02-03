-- ============================================================================
-- FIX SERVICE PRICING MODELS
-- ============================================================================
-- Ensures all services have correct pricing_model and price_display values
-- Critical for proper display in Discovery recommendations
-- ============================================================================

-- 1. Ensure pricing_model column exists
ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'fixed';
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_display TEXT;

-- 2. Update ANNUAL services (one-time engagement fee)
UPDATE services SET 
  pricing_model = 'annual',
  price_display = CONCAT('£', price_amount::text)
WHERE code IN (
  'goal_alignment',
  'goal_alignment_growth',
  'benchmarking',
  'benchmarking_full',
  'hidden_value_audit',
  'hidden_value',
  'systems_audit',
  '365_method',
  'discovery'
) AND (pricing_model IS NULL OR pricing_model != 'annual');

-- 3. Update MONTHLY services (recurring retainer)
UPDATE services SET 
  pricing_model = 'monthly',
  price_display = CONCAT('£', price_amount::text, '/mo')
WHERE code IN (
  'management_accounts',
  'management_accounts_silver',
  'management_accounts_gold',
  'business_intelligence',
  'business_intelligence_silver',
  'business_intelligence_gold',
  'fractional_cfo',
  'fractional_coo'
) AND (pricing_model IS NULL OR pricing_model != 'monthly');

-- 4. Fix Goal Alignment price (should be £4,500 annual, not monthly)
UPDATE services SET 
  price_amount = 4500,
  pricing_model = 'annual',
  price_display = '£4,500'
WHERE code = 'goal_alignment' AND price_amount < 4000;

-- 5. Fix Industry Benchmarking price
UPDATE services SET 
  price_amount = 2000,
  pricing_model = 'annual',
  price_display = '£2,000'
WHERE code = 'benchmarking' AND price_amount < 1500;

-- 6. Fix Hidden Value Audit price
UPDATE services SET 
  price_amount = 2000,
  pricing_model = 'annual',
  price_display = '£2,000'
WHERE code IN ('hidden_value_audit', 'hidden_value') AND price_amount < 1500;

-- 7. Fix Systems Audit price
UPDATE services SET 
  price_amount = 3500,
  pricing_model = 'annual',
  price_display = '£3,500'
WHERE code = 'systems_audit' AND price_amount < 3000;

-- 8. Fix 365 Method price
UPDATE services SET 
  price_amount = 4500,
  pricing_model = 'annual',
  price_display = '£4,500'
WHERE code = '365_method' AND price_amount < 4000;

-- 9. Rename Management Accounts to Business Intelligence where needed
UPDATE services SET 
  name = 'Business Intelligence - Silver',
  short_description = 'Monthly financial visibility, KPI tracking, and actionable insights'
WHERE code = 'management_accounts_silver';

UPDATE services SET 
  name = 'Business Intelligence - Gold',
  short_description = 'Comprehensive financial intelligence with advisory and strategic insights'
WHERE code = 'management_accounts_gold';

-- 10. Log the updates
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Service pricing models updated:';
  FOR r IN 
    SELECT code, name, pricing_model, price_amount, price_display 
    FROM services 
    WHERE status = 'active'
    ORDER BY pricing_model, code
  LOOP
    RAISE NOTICE '  % (%) - £% [%]', r.code, r.pricing_model, r.price_amount, r.price_display;
  END LOOP;
END $$;
