-- ============================================================================
-- APPLY SERVICE CATALOGUE (for "Enabled by" / service recommendation popups)
-- ============================================================================
-- Run this in Supabase → SQL Editor if you see:
--   "Could not find the table 'public.service_catalogue' in the schema cache"
-- when clicking "Enabled by" or "Learn more" on a service.
--
-- Creates service_catalogue + service_tiers and seeds Benchmarking, Systems
-- Audit, Quarterly BI, Profit Extraction, Goal Alignment, Fractional CFO.
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_catalogue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  tagline TEXT,
  short_description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES service_catalogue(id) ON DELETE CASCADE,
  tier_code TEXT NOT NULL,
  tier_name TEXT NOT NULL,
  short_description TEXT,
  price_display TEXT NOT NULL,
  price_amount INTEGER,
  price_type TEXT DEFAULT 'one_off' CHECK (price_type IN ('one_off', 'monthly', 'quarterly', 'annual')),
  example_url TEXT,
  example_label TEXT DEFAULT 'View Example',
  features JSONB DEFAULT '[]',
  is_recommended BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, tier_code)
);

CREATE INDEX IF NOT EXISTS idx_service_tiers_service_id ON service_tiers(service_id);
CREATE INDEX IF NOT EXISTS idx_service_catalogue_code ON service_catalogue(code);
CREATE INDEX IF NOT EXISTS idx_service_catalogue_active ON service_catalogue(is_active) WHERE is_active = true;

ALTER TABLE service_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_catalogue_read" ON service_catalogue;
CREATE POLICY "service_catalogue_read" ON service_catalogue FOR SELECT USING (true);
DROP POLICY IF EXISTS "service_catalogue_manage" ON service_catalogue;
CREATE POLICY "service_catalogue_manage" ON service_catalogue FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "service_tiers_read" ON service_tiers;
CREATE POLICY "service_tiers_read" ON service_tiers FOR SELECT USING (true);
DROP POLICY IF EXISTS "service_tiers_manage" ON service_tiers;
CREATE POLICY "service_tiers_manage" ON service_tiers FOR ALL USING (auth.role() = 'authenticated');

INSERT INTO service_catalogue (code, name, display_name, tagline, short_description, category, display_order) VALUES
('benchmarking', 'Industry Benchmarking', 'Industry Benchmarking (Full Package)', 'You''ll Know Where You Stand', 'See exactly how your business compares to others in your industry — revenue, margins, staffing, and hidden value.', 'analysis', 1),
('systems_audit', 'Systems Audit', 'Systems & Process Audit', 'See What''s Actually Running Your Business', 'A comprehensive review of your operational systems, processes, and dependencies — identifying what''s documented, what''s assumed, and where the risks are.', 'operations', 2),
('quarterly_bi', 'Quarterly BI & Benchmarking', 'Quarterly BI & Benchmarking', 'Turn Your Numbers Into Decisions', 'Transform your management accounts into strategic intelligence with ongoing benchmarking against industry peers.', 'analysis', 3),
('profit_extraction', 'Profit Extraction Strategy', 'Profit Extraction Strategy', 'Make Your Cash Work Harder', 'Tax-efficient strategies for extracting value from surplus cash and retained earnings.', 'advisory', 4),
('goal_alignment', 'Goal Alignment Programme', 'Goal Alignment Programme', 'Align Your Business With Your Life', 'Life-first business transformation connecting your personal goals to business strategy through structured planning and accountability.', 'advisory', 5),
('fractional_cfo', 'Fractional CFO', 'Fractional CFO Services', 'Strategic Financial Leadership', 'Senior financial leadership without the full-time cost — strategy, forecasting, and decision support.', 'advisory', 6)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, display_name = EXCLUDED.display_name, tagline = EXCLUDED.tagline, short_description = EXCLUDED.short_description, category = EXCLUDED.category, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO service_tiers (service_id, tier_code, tier_name, short_description, price_display, price_amount, price_type, display_order) VALUES
((SELECT id FROM service_catalogue WHERE code = 'benchmarking'), 'tier1', 'Tier 1', 'Industry comparison and baseline', '£2,000', 200000, 'one_off', 1),
((SELECT id FROM service_catalogue WHERE code = 'benchmarking'), 'tier2', 'Tier 2', 'Deep-dive with action plan', '£4,500', 450000, 'one_off', 2)
ON CONFLICT (service_id, tier_code) DO UPDATE SET tier_name = EXCLUDED.tier_name, short_description = EXCLUDED.short_description, price_display = EXCLUDED.price_display, price_amount = EXCLUDED.price_amount, price_type = EXCLUDED.price_type, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO service_tiers (service_id, tier_code, tier_name, short_description, price_display, price_amount, price_type, display_order) VALUES
((SELECT id FROM service_catalogue WHERE code = 'systems_audit'), 'standard', 'Standard', 'Comprehensive systems review', '£2,000 – £5,000', 200000, 'one_off', 1)
ON CONFLICT (service_id, tier_code) DO UPDATE SET tier_name = EXCLUDED.tier_name, short_description = EXCLUDED.short_description, price_display = EXCLUDED.price_display, price_amount = EXCLUDED.price_amount, price_type = EXCLUDED.price_type, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO service_tiers (service_id, tier_code, tier_name, short_description, price_display, price_amount, price_type, display_order) VALUES
((SELECT id FROM service_catalogue WHERE code = 'quarterly_bi'), 'monthly', 'Monthly', 'Monthly reporting and benchmarking', '£500 – £1,000/month', 50000, 'monthly', 1),
((SELECT id FROM service_catalogue WHERE code = 'quarterly_bi'), 'quarterly', 'Quarterly', 'Quarterly deep-dive sessions', '£1,500 – £3,000/quarter', 150000, 'quarterly', 2)
ON CONFLICT (service_id, tier_code) DO UPDATE SET tier_name = EXCLUDED.tier_name, short_description = EXCLUDED.short_description, price_display = EXCLUDED.price_display, price_amount = EXCLUDED.price_amount, price_type = EXCLUDED.price_type, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO service_tiers (service_id, tier_code, tier_name, short_description, price_display, price_amount, price_type, display_order) VALUES
((SELECT id FROM service_catalogue WHERE code = 'profit_extraction'), 'standard', 'Standard', 'Full strategy and implementation plan', '£1,500 – £3,000', 150000, 'one_off', 1)
ON CONFLICT (service_id, tier_code) DO UPDATE SET tier_name = EXCLUDED.tier_name, short_description = EXCLUDED.short_description, price_display = EXCLUDED.price_display, price_amount = EXCLUDED.price_amount, price_type = EXCLUDED.price_type, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO service_tiers (service_id, tier_code, tier_name, short_description, price_display, price_amount, price_type, display_order) VALUES
((SELECT id FROM service_catalogue WHERE code = 'goal_alignment'), 'standard', 'Standard', '5-year vision, 6-month shift, 12-week sprints', '£1,500 – £4,500/month', 150000, 'monthly', 1)
ON CONFLICT (service_id, tier_code) DO UPDATE SET tier_name = EXCLUDED.tier_name, short_description = EXCLUDED.short_description, price_display = EXCLUDED.price_display, price_amount = EXCLUDED.price_amount, price_type = EXCLUDED.price_type, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO service_tiers (service_id, tier_code, tier_name, short_description, price_display, price_amount, price_type, display_order) VALUES
((SELECT id FROM service_catalogue WHERE code = 'fractional_cfo'), 'standard', 'Standard', 'Part-time CFO support', '£2,500 – £5,000/month', 250000, 'monthly', 1)
ON CONFLICT (service_id, tier_code) DO UPDATE SET tier_name = EXCLUDED.tier_name, short_description = EXCLUDED.short_description, price_display = EXCLUDED.price_display, price_amount = EXCLUDED.price_amount, price_type = EXCLUDED.price_type, display_order = EXCLUDED.display_order, updated_at = NOW();
