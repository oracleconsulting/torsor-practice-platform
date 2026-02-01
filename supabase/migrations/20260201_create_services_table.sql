-- ============================================================================
-- SERVICE INTELLIGENCE SYSTEM - PHASE 1
-- Services Catalogue Table
-- ============================================================================
-- Official services we can offer - replaces hardcoded TypeScript
-- This is a living catalogue that grows from client insights

-- Create table if it doesn't exist (minimal schema)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add ALL columns that might be missing from earlier/different schema
-- Core fields
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]';

-- Pricing
ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'monthly';
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_from DECIMAL(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_to DECIMAL(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_unit TEXT DEFAULT '/month';
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_amount DECIMAL(10,2); -- from older schema

-- Delivery
ALTER TABLE services ADD COLUMN IF NOT EXISTS typical_duration TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS time_to_first_value TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS delivery_complexity TEXT DEFAULT 'medium';

-- Skills
ALTER TABLE services ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]';
ALTER TABLE services ADD COLUMN IF NOT EXISTS recommended_seniority TEXT[] DEFAULT '{}';

-- Lifecycle
ALTER TABLE services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE services ADD COLUMN IF NOT EXISTS originated_from TEXT DEFAULT 'manual';
ALTER TABLE services ADD COLUMN IF NOT EXISTS first_delivered_at DATE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS times_recommended INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS times_sold INTEGER DEFAULT 0;

-- Metadata
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_by UUID;

-- Older schema compatibility
ALTER TABLE services ADD COLUMN IF NOT EXISTS typical_roi TEXT;

-- Drop NOT NULL constraint on price_amount if it exists (older schema)
-- This is a bit tricky in Postgres - we need to alter the column
DO $$ 
BEGIN
  ALTER TABLE services ALTER COLUMN price_amount DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Set NOT NULL constraints where needed (only if column has data or default)
-- We can't easily add NOT NULL to existing columns, so we handle it in application layer

-- Update category to have a default for existing rows
UPDATE services SET category = 'uncategorized' WHERE category IS NULL;
UPDATE services SET headline = name WHERE headline IS NULL;
UPDATE services SET pricing_model = 'monthly' WHERE pricing_model IS NULL;
UPDATE services SET price_amount = price_from WHERE price_amount IS NULL AND price_from IS NOT NULL;

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_services_code ON services(code);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);

-- Enable RLS (safe to run multiple times)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy to ensure it exists
DROP POLICY IF EXISTS "services_read_all" ON services;
CREATE POLICY "services_read_all" ON services FOR SELECT USING (true);

-- ============================================================================
-- SEED DATA: BSG Core Services
-- ============================================================================

INSERT INTO services (code, name, category, headline, description, deliverables, pricing_model, price_from, price_to, price_unit, price_amount, typical_duration, time_to_first_value, status, originated_from) VALUES
-- Management Accounts Tiers
('MA_BRONZE', 'Management Accounts - Bronze', 'financial_clarity', 
 'Essential monthly financial visibility', 
 'Monthly management accounts with core KPIs and commentary. Perfect for businesses wanting basic financial visibility.',
 '["Monthly P&L", "Balance sheet", "Cash flow statement", "KPI dashboard", "Brief commentary"]'::jsonb, 
 'monthly', 750, 750, '/month', 750, 'Ongoing', '14 days', 'active', 'founding'),

('MA_SILVER', 'Management Accounts - Silver', 'financial_clarity', 
 'Enhanced financial intelligence', 
 'Everything in Bronze plus deeper analysis, forecasting, and regular review calls.',
 '["Bronze deliverables", "13-week cash forecast", "Variance analysis", "Monthly review call", "Budget vs actual"]'::jsonb, 
 'monthly', 1250, 1250, '/month', 1250, 'Ongoing', '14 days', 'active', 'founding'),

('MA_GOLD', 'Management Accounts - Gold', 'financial_clarity', 
 'Complete financial partnership', 
 'Full management accounting with strategic insights and board-ready reporting.',
 '["Silver deliverables", "Board pack", "Scenario modelling", "Strategic recommendations", "Quarterly deep-dive"]'::jsonb, 
 'monthly', 1750, 1750, '/month', 1750, 'Ongoing', '14 days', 'active', 'founding'),

('MA_PLATINUM', 'Management Accounts - Platinum', 'financial_clarity', 
 'Virtual FD service', 
 'Comprehensive finance function support with unlimited advisory access.',
 '["Gold deliverables", "Unlimited advisory", "Board attendance", "Investor relations support", "M&A support"]'::jsonb, 
 'monthly', 3000, 5000, '/month', 3000, 'Ongoing', '7 days', 'active', 'founding'),

-- Strategic Planning
('GOAL_ALIGNMENT', 'Goal Alignment Programme', 'strategic_planning', 
 '12-month business transformation', 
 'Life-first strategic planning with accountability. Align business goals with personal aspirations.',
 '["5-year vision development", "6-month shift planning", "12-week sprints", "Weekly check-ins", "Quarterly reviews", "Annual reset"]'::jsonb, 
 'monthly', 1500, 4500, '/month', 1500, '12 months', '90 days', 'active', 'founding'),

('BENCHMARKING', 'Hidden Value & Benchmarking', 'strategic_planning', 
 'Industry comparison and hidden value discovery', 
 'Comprehensive benchmarking against industry peers with opportunity quantification.',
 '["Industry comparison", "Percentile positioning", "Gap analysis", "Opportunity quantification", "Scenario modelling", "Action plan"]'::jsonb, 
 'fixed', 2000, 2000, '/project', 2000, '2 weeks', '7 days', 'active', 'founding'),

-- Operational
('SYSTEMS_AUDIT', 'Systems Audit', 'operational', 
 'Comprehensive systems review', 
 'Full review of financial and operational systems with improvement roadmap.',
 '["Current state mapping", "Gap analysis", "Recommendations", "Implementation roadmap", "Vendor shortlist", "ROI projections"]'::jsonb, 
 'fixed', 2000, 5000, '/project', 2000, '2-4 weeks', '14 days', 'active', 'founding'),

-- Tax Efficiency
('PROFIT_EXTRACTION', 'Profit Extraction Strategy', 'tax_efficiency', 
 'Tax-efficient value extraction', 
 'Strategies for extracting value from your business tax-efficiently.',
 '["Current structure review", "Options analysis", "Implementation plan", "Tax modelling", "Ongoing optimisation"]'::jsonb, 
 'fixed', 1500, 3000, '/project', 1500, '1-2 weeks', '7 days', 'active', 'founding'),

-- Leadership
('FRACTIONAL_CFO', 'Fractional CFO', 'leadership', 
 'Part-time finance leadership', 
 'Strategic finance leadership on a fractional basis for growing businesses.',
 '["Board-level input", "Strategic planning", "Investor relations", "Team development", "Finance function design"]'::jsonb, 
 'monthly', 2500, 5000, '/month', 2500, 'Ongoing', '30 days', 'active', 'founding'),

('FRACTIONAL_COO', 'Fractional COO', 'leadership', 
 'Part-time operational leadership', 
 'Operational excellence on a fractional basis.',
 '["Process optimisation", "Team structure", "Systems implementation", "Performance management", "Operational metrics"]'::jsonb, 
 'monthly', 2500, 5000, '/month', 2500, 'Ongoing', '30 days', 'active', 'founding')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  deliverables = EXCLUDED.deliverables,
  pricing_model = EXCLUDED.pricing_model,
  price_from = EXCLUDED.price_from,
  price_to = EXCLUDED.price_to,
  price_unit = EXCLUDED.price_unit,
  price_amount = EXCLUDED.price_amount,
  typical_duration = EXCLUDED.typical_duration,
  time_to_first_value = EXCLUDED.time_to_first_value,
  status = EXCLUDED.status,
  originated_from = EXCLUDED.originated_from,
  updated_at = now();
