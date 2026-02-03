-- ============================================================================
-- NEW SERVICES FOR CLIENT TYPE-SPECIFIC RECOMMENDATIONS
-- ============================================================================
-- These services fill gaps where existing services don't fit certain client types:
-- - Investment vehicles (property portfolios)
-- - Funded startups (pre/early revenue)
-- - Agencies (contractor models)
-- - Urgent decision support
-- ============================================================================

-- ============================================================================
-- 1. WEALTH & SUCCESSION SERVICES (for Investment Vehicles)
-- ============================================================================

-- IHT Planning Workshop
INSERT INTO services (
  code, name, short_description, description, category, 
  pricing_model, base_price, typical_duration, 
  deliverables, ideal_client_type, status
) VALUES (
  'iht_planning',
  'IHT Planning Workshop',
  'Understand your inheritance tax exposure and options',
  'A focused half-day workshop to map your current IHT exposure, understand available structures (trusts, gifts, business property relief), and create a clear action plan to work through with your solicitor. We connect you with specialist tax advisors where needed.',
  'wealth',
  'fixed',
  2500,
  '4-6 hours + follow-up',
  '["Current IHT liability calculation", "Structure options comparison", "Action plan for solicitor", "Tax advisor introduction where needed", "Follow-up review call"]',
  '["investment_vehicle", "lifestyle_business"]',
  'active'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  ideal_client_type = EXCLUDED.ideal_client_type;

-- Property Portfolio Health Check
INSERT INTO services (
  code, name, short_description, description, category, 
  pricing_model, base_price, typical_duration, 
  deliverables, ideal_client_type, status
) VALUES (
  'property_health_check',
  'Property Portfolio Health Check',
  'Performance analysis and rationalisation strategy for your property portfolio',
  'Comprehensive review of your property portfolio: yield analysis by property, LTV review, maintenance cost trends, tenant quality assessment, and rationalisation strategy. Identifies which properties to keep, improve, or dispose of.',
  'wealth',
  'fixed',
  3500,
  '2-3 weeks',
  '["Yield analysis by property", "LTV and equity position", "Maintenance cost trends", "Tenant quality assessment", "Rationalisation recommendations", "5-year portfolio projection"]',
  '["investment_vehicle"]',
  'active'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price;

-- Family Wealth Transfer Strategy
INSERT INTO services (
  code, name, short_description, description, category, 
  pricing_model, base_price, typical_duration, 
  deliverables, ideal_client_type, status
) VALUES (
  'wealth_transfer_strategy',
  'Family Wealth Transfer Strategy',
  'Comprehensive succession planning for investment portfolios',
  'Beyond IHT: full succession planning including family governance, next-generation readiness assessment, trust structuring options, property management succession, and family communication planning. Coordinates with solicitors, tax advisors, and financial planners.',
  'wealth',
  'fixed',
  5500,
  '6-8 weeks',
  '["Family governance framework", "Next-gen readiness assessment", "Trust structure recommendations", "Management succession plan", "Family meeting facilitation", "Advisor coordination"]',
  '["investment_vehicle"]',
  'active'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price;

-- Property Management Sourcing
INSERT INTO services (
  code, name, short_description, description, category, 
  pricing_model, base_price, typical_duration, 
  deliverables, ideal_client_type, status
) VALUES (
  'property_management_sourcing',
  'Property Management Sourcing',
  'Find the reliable property manager you''ve been looking for',
  'We find, vet, and introduce property management companies suited to your portfolio. Includes brief development, candidate evaluation, reference checks, and contract negotiation support.',
  'operational',
  'fixed',
  1500,
  '3-4 weeks',
  '["Property manager brief", "3-5 vetted candidates", "Reference checks", "Interview support", "Contract review support", "90-day check-in"]',
  '["investment_vehicle"]',
  'active'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price;

-- ============================================================================
-- 2. STARTUP SERVICES (for Funded Startups)
-- ============================================================================

-- Founder Financial Foundations
INSERT INTO services (
  code, name, short_description, description, category, 
  pricing_model, base_price, typical_duration, 
  deliverables, ideal_client_type, status
) VALUES (
  'founder_financial_foundations',
  'Founder Financial Foundations',
  'Financial literacy and runway management for funded founders',
  'Build the financial infrastructure every funded startup needs: runway analysis, burn rate management, board deck templates, investor reporting setup, and founder financial literacy. Prepares you for next fundraise conversations.',
  'financial',
  'fixed',
  2500,
  '4-6 weeks',
  '["Runway analysis model", "Monthly burn tracking", "Board deck template", "Investor update template", "Financial literacy workshop", "Next-raise readiness checklist"]',
  '["funded_startup"]',
  'active'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price;

-- Post-Launch Operations Setup
INSERT INTO services (
  code, name, short_description, description, category, 
  pricing_model, base_price, typical_duration, 
  deliverables, ideal_client_type, status
) VALUES (
  'post_launch_ops',
  'Post-Launch Operations Setup',
  'Operational foundations for startups going live',
  'Light-touch operational setup for startups moving from build to operate: customer onboarding processes, support triage, basic financial rhythms, team communication structures. Not transformation - foundations.',
  'operational',
  'fixed',
  3500,
  '4-6 weeks',
  '["Customer onboarding process", "Support triage system", "Weekly financial rhythm", "Team standup structure", "Key metrics dashboard", "Escalation framework"]',
  '["funded_startup"]',
  'active'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price;

-- ============================================================================
-- 3. AGENCY SERVICES (for Creative/Digital Agencies)
-- ============================================================================

-- Agency Profitability Audit
INSERT INTO services (
  code, name, short_description, description, category, 
  pricing_model, base_price, typical_duration, 
  deliverables, ideal_client_type, status
) VALUES (
  'agency_profitability_audit',
  'Agency Profitability Audit',
  'Client-by-client, project-by-project profitability analysis',
  'Deep dive into agency economics: client profitability breakdown, utilisation rates, rate card analysis, contractor vs permanent cost comparison, and margin improvement roadmap. Built for agencies, not generic businesses.',
  'financial',
  'fixed',
  2000,
  '2-3 weeks',
  '["Client profitability matrix", "Utilisation rate analysis", "Rate card benchmarking", "Contractor vs permanent comparison", "Margin improvement roadmap", "Pricing recommendations"]',
  '["trading_agency"]',
  'active'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price;

-- Agency Cash Flow Navigator
INSERT INTO services (
  code, name, short_description, description, category, 
  pricing_model, base_price, typical_duration, 
  deliverables, ideal_client_type, status
) VALUES (
  'agency_cash_navigator',
  'Agency Cash Flow Navigator',
  'Cash visibility for project-based businesses',
  'Weekly cash visibility for agencies: project billing forecasting, contractor payment scheduling, retainer tracking, and creditor management. Stops the 3am worry about whether you can make payroll.',
  'financial',
  'monthly',
  1200,
  'Ongoing monthly',
  '["Weekly cash position report", "13-week rolling forecast", "Project billing calendar", "Contractor payment schedule", "Early warning alerts", "Monthly cash strategy call"]',
  '["trading_agency"]',
  'active'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price;

-- ============================================================================
-- 4. UNIVERSAL SERVICES (for All Client Types)
-- ============================================================================

-- Rapid Decision Support
INSERT INTO services (
  code, name, short_description, description, category, 
  pricing_model, base_price, typical_duration, 
  deliverables, ideal_client_type, status
) VALUES (
  'rapid_decision_support',
  'Rapid Decision Support',
  '48-hour analysis for urgent business decisions',
  'Quick-turnaround analysis for time-sensitive decisions: senior hire economics, major purchase ROI, contract negotiation support, or any decision that can''t wait for full analysis. Delivered in 48 hours.',
  'financial',
  'fixed',
  750,
  '48 hours',
  '["Decision-specific P&L model", "Scenario comparison (2-3 options)", "Risk assessment", "Recommendation with supporting numbers", "30-min discussion call"]',
  '["trading_product", "trading_agency", "professional_practice"]',
  'active'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price;

-- Restructuring Support Programme
INSERT INTO services (
  code, name, short_description, description, category, 
  pricing_model, base_price, typical_duration, 
  deliverables, ideal_client_type, status
) VALUES (
  'restructuring_support',
  'Restructuring Support Programme',
  'Navigate redundancy and restructuring with confidence',
  'Support through difficult people decisions: redundancy process design, financial impact modelling, retention strategy for key staff, HR and legal framework, communication planning, and ongoing support through execution.',
  'operational',
  'fixed',
  3500,
  '4-8 weeks',
  '["Redundancy process design", "Financial impact model", "Key staff retention plan", "HR/legal framework guidance", "Communication templates", "Weekly support calls during execution"]',
  '["trading_product", "trading_agency"]',
  'active'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price;

-- ============================================================================
-- 5. ADD WEALTH CATEGORY IF NOT EXISTS
-- ============================================================================

-- Create enum value for wealth category if using check constraint
-- This depends on your existing category structure

-- ============================================================================
-- 6. UPDATE SERVICE_LINE_METADATA FOR NEW SERVICES
-- ============================================================================

INSERT INTO service_line_metadata (
  code, name, category, core_function, problems_addressed, pricing
) VALUES 
  ('iht_planning', 'IHT Planning Workshop', 'wealth', 
   'Map inheritance tax exposure and create action plan for wealth protection.',
   '["Unknown IHT liability", "No succession structure", "Family wealth transfer concerns"]',
   '{"standard": 2500}'
  ),
  ('property_health_check', 'Property Portfolio Health Check', 'wealth',
   'Analyse property portfolio performance and identify rationalisation opportunities.',
   '["Unknown property yields", "No portfolio strategy", "Property management challenges"]',
   '{"standard": 3500}'
  ),
  ('wealth_transfer_strategy', 'Family Wealth Transfer Strategy', 'wealth',
   'Comprehensive succession planning for investment portfolios.',
   '["No succession plan", "Next-generation readiness", "Complex family dynamics"]',
   '{"standard": 5500}'
  ),
  ('property_management_sourcing', 'Property Management Sourcing', 'operational',
   'Find and vet property management companies.',
   '["Poor property management", "Need to delegate", "Unreliable current providers"]',
   '{"standard": 1500}'
  ),
  ('founder_financial_foundations', 'Founder Financial Foundations', 'financial',
   'Build financial infrastructure for funded startups.',
   '["No runway visibility", "Poor board reporting", "Financial literacy gaps"]',
   '{"standard": 2500}'
  ),
  ('post_launch_ops', 'Post-Launch Operations Setup', 'operational',
   'Operational foundations for startups going live.',
   '["No onboarding process", "Chaos at launch", "No operational rhythms"]',
   '{"standard": 3500}'
  ),
  ('agency_profitability_audit', 'Agency Profitability Audit', 'financial',
   'Deep dive into agency economics and profitability.',
   '["Unknown client profitability", "Low utilisation", "Margin compression"]',
   '{"standard": 2000}'
  ),
  ('agency_cash_navigator', 'Agency Cash Flow Navigator', 'financial',
   'Weekly cash visibility for project-based businesses.',
   '["Cash flow anxiety", "Lumpy project revenue", "Payroll stress"]',
   '{"monthly": 1200}'
  ),
  ('rapid_decision_support', 'Rapid Decision Support', 'financial',
   '48-hour analysis for urgent business decisions.',
   '["Urgent hire decision", "Time-sensitive opportunity", "Contract negotiation"]',
   '{"standard": 750}'
  ),
  ('restructuring_support', 'Restructuring Support Programme', 'operational',
   'Navigate redundancy and restructuring with confidence.',
   '["Avoided redundancy conversation", "Team right-sizing", "Difficult people decisions"]',
   '{"standard": 3500}'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  core_function = EXCLUDED.core_function,
  problems_addressed = EXCLUDED.problems_addressed,
  pricing = EXCLUDED.pricing;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON COLUMN services.ideal_client_type IS 
'JSON array of client types this service is appropriate for: trading_product, trading_agency, professional_practice, investment_vehicle, funded_startup, lifestyle_business';

