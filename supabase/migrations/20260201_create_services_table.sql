-- ============================================================================
-- SERVICE INTELLIGENCE SYSTEM - PHASE 1
-- Services Catalogue Table
-- ============================================================================
-- Official services we can offer - replaces hardcoded TypeScript
-- This is a living catalogue that grows from client insights

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT,
  deliverables JSONB DEFAULT '[]',
  pricing_model TEXT NOT NULL DEFAULT 'monthly',
  price_from DECIMAL(10,2),
  price_to DECIMAL(10,2),
  price_unit TEXT DEFAULT '/month',
  typical_duration TEXT,
  time_to_first_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns that might be missing from earlier schema
ALTER TABLE services ADD COLUMN IF NOT EXISTS delivery_complexity TEXT DEFAULT 'medium';
ALTER TABLE services ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]';
ALTER TABLE services ADD COLUMN IF NOT EXISTS recommended_seniority TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE services ADD COLUMN IF NOT EXISTS originated_from TEXT DEFAULT 'manual';
ALTER TABLE services ADD COLUMN IF NOT EXISTS first_delivered_at DATE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS times_recommended INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS times_sold INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_by UUID;

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

INSERT INTO services (code, name, category, headline, description, deliverables, pricing_model, price_from, price_to, price_unit, typical_duration, time_to_first_value, status, originated_from) VALUES
-- Management Accounts Tiers
('MA_BRONZE', 'Management Accounts - Bronze', 'financial_clarity', 
 'Essential monthly financial visibility', 
 'Monthly management accounts with core KPIs and commentary. Perfect for businesses wanting basic financial visibility.',
 '["Monthly P&L", "Balance sheet", "Cash flow statement", "KPI dashboard", "Brief commentary"]'::jsonb, 
 'monthly', 750, 750, '/month', 'Ongoing', '14 days', 'active', 'founding'),

('MA_SILVER', 'Management Accounts - Silver', 'financial_clarity', 
 'Enhanced financial intelligence', 
 'Everything in Bronze plus deeper analysis, forecasting, and regular review calls.',
 '["Bronze deliverables", "13-week cash forecast", "Variance analysis", "Monthly review call", "Budget vs actual"]'::jsonb, 
 'monthly', 1250, 1250, '/month', 'Ongoing', '14 days', 'active', 'founding'),

('MA_GOLD', 'Management Accounts - Gold', 'financial_clarity', 
 'Complete financial partnership', 
 'Full management accounting with strategic insights and board-ready reporting.',
 '["Silver deliverables", "Board pack", "Scenario modelling", "Strategic recommendations", "Quarterly deep-dive"]'::jsonb, 
 'monthly', 1750, 1750, '/month', 'Ongoing', '14 days', 'active', 'founding'),

('MA_PLATINUM', 'Management Accounts - Platinum', 'financial_clarity', 
 'Virtual FD service', 
 'Comprehensive finance function support with unlimited advisory access.',
 '["Gold deliverables", "Unlimited advisory", "Board attendance", "Investor relations support", "M&A support"]'::jsonb, 
 'monthly', 3000, 5000, '/month', 'Ongoing', '7 days', 'active', 'founding'),

-- Strategic Planning
('GOAL_ALIGNMENT', 'Goal Alignment Programme', 'strategic_planning', 
 '12-month business transformation', 
 'Life-first strategic planning with accountability. Align business goals with personal aspirations.',
 '["5-year vision development", "6-month shift planning", "12-week sprints", "Weekly check-ins", "Quarterly reviews", "Annual reset"]'::jsonb, 
 'monthly', 1500, 4500, '/month', '12 months', '90 days', 'active', 'founding'),

('BENCHMARKING', 'Hidden Value & Benchmarking', 'strategic_planning', 
 'Industry comparison and hidden value discovery', 
 'Comprehensive benchmarking against industry peers with opportunity quantification.',
 '["Industry comparison", "Percentile positioning", "Gap analysis", "Opportunity quantification", "Scenario modelling", "Action plan"]'::jsonb, 
 'fixed', 2000, 2000, '/project', '2 weeks', '7 days', 'active', 'founding'),

-- Operational
('SYSTEMS_AUDIT', 'Systems Audit', 'operational', 
 'Comprehensive systems review', 
 'Full review of financial and operational systems with improvement roadmap.',
 '["Current state mapping", "Gap analysis", "Recommendations", "Implementation roadmap", "Vendor shortlist", "ROI projections"]'::jsonb, 
 'fixed', 2000, 5000, '/project', '2-4 weeks', '14 days', 'active', 'founding'),

-- Tax Efficiency
('PROFIT_EXTRACTION', 'Profit Extraction Strategy', 'tax_efficiency', 
 'Tax-efficient value extraction', 
 'Strategies for extracting value from your business tax-efficiently.',
 '["Current structure review", "Options analysis", "Implementation plan", "Tax modelling", "Ongoing optimisation"]'::jsonb, 
 'fixed', 1500, 3000, '/project', '1-2 weeks', '7 days', 'active', 'founding'),

-- Leadership
('FRACTIONAL_CFO', 'Fractional CFO', 'leadership', 
 'Part-time finance leadership', 
 'Strategic finance leadership on a fractional basis for growing businesses.',
 '["Board-level input", "Strategic planning", "Investor relations", "Team development", "Finance function design"]'::jsonb, 
 'monthly', 2500, 5000, '/month', 'Ongoing', '30 days', 'active', 'founding'),

('FRACTIONAL_COO', 'Fractional COO', 'leadership', 
 'Part-time operational leadership', 
 'Operational excellence on a fractional basis.',
 '["Process optimisation", "Team structure", "Systems implementation", "Performance management", "Operational metrics"]'::jsonb, 
 'monthly', 2500, 5000, '/month', 'Ongoing', '30 days', 'active', 'founding')

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
  typical_duration = EXCLUDED.typical_duration,
  time_to_first_value = EXCLUDED.time_to_first_value,
  updated_at = now();
