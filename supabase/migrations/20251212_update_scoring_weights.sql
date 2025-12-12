-- ============================================================================
-- UPDATE SERVICE SCORING WEIGHTS
-- ============================================================================
-- Adds new scoring weight categories for:
-- - Investment readiness (capital raising signals)
-- - Founder dependency
-- - Lifestyle/burnout indicators
-- ============================================================================

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_scoring_weights' 
                   AND column_name = 'category') THEN
        ALTER TABLE service_scoring_weights ADD COLUMN category TEXT;
    END IF;
END $$;

-- ============================================================================
-- INVESTMENT READINESS WEIGHTS
-- ============================================================================
-- Clients showing capital raising signals need CFO and advisory support

INSERT INTO service_scoring_weights (question_id, response_value, service_code, weight, category)
VALUES
  -- Capital blocker signals → CFO, Advisory, Management Accounts
  ('sd_growth_blocker', 'Dont have the capital', 'fractional_cfo', 50, 'investment_readiness'),
  ('sd_growth_blocker', 'Dont have the capital', 'business_advisory', 40, 'investment_readiness'),
  ('sd_growth_blocker', 'Dont have the capital', 'management_accounts', 30, 'investment_readiness'),
  
  -- Investment readiness signals → CFO, Management Accounts
  ('sd_exit_readiness', 'Yes - were investment-ready', 'fractional_cfo', 40, 'investment_readiness'),
  ('sd_exit_readiness', 'Yes - were investment-ready', 'management_accounts', 30, 'investment_readiness'),
  
  -- Professional valuation → CFO, Advisory
  ('sd_valuation_clarity', 'Yes - Ive had a professional valuation', 'fractional_cfo', 30, 'investment_readiness'),
  ('sd_valuation_clarity', 'Yes - Ive had a professional valuation', 'business_advisory', 25, 'investment_readiness')
ON CONFLICT (question_id, response_value, service_code) 
DO UPDATE SET weight = EXCLUDED.weight, category = EXCLUDED.category;

-- ============================================================================
-- FOUNDER DEPENDENCY WEIGHTS
-- ============================================================================
-- Clients with high founder dependency need systems and operational support

INSERT INTO service_scoring_weights (question_id, response_value, service_code, weight, category)
VALUES
  -- Chaos if founder disappears → Systems, COO, 365 Method
  ('sd_founder_dependency', 'Chaos - Im essential to everything', 'systems_audit', 60, 'founder_dependency'),
  ('sd_founder_dependency', 'Chaos - Im essential to everything', 'fractional_coo', 50, 'founder_dependency'),
  ('sd_founder_dependency', 'Chaos - Im essential to everything', '365_method', 40, 'founder_dependency'),
  
  -- Key person risk = disaster → Systems, COO
  ('dd_key_person_risk', 'Disaster - the business would struggle badly', 'systems_audit', 50, 'founder_dependency'),
  ('dd_key_person_risk', 'Disaster - the business would struggle badly', 'fractional_coo', 45, 'founder_dependency'),
  
  -- I'm the key person risk (self-awareness) → 365 Method, Systems
  ('dd_key_person_risk', 'Im the key person risk', 'systems_audit', 45, 'founder_dependency'),
  ('dd_key_person_risk', 'Im the key person risk', '365_method', 40, 'founder_dependency'),
  
  -- Poor delegation → 365 Method, COO
  ('dd_delegation_honest', 'Poor - I struggle to let go', '365_method', 40, 'founder_dependency'),
  ('dd_delegation_honest', 'Poor - I struggle to let go', 'fractional_coo', 35, 'founder_dependency'),
  ('dd_delegation_honest', 'Terrible - I end up doing everything myself', '365_method', 50, 'founder_dependency'),
  ('dd_delegation_honest', 'Terrible - I end up doing everything myself', 'fractional_coo', 45, 'founder_dependency')
ON CONFLICT (question_id, response_value, service_code) 
DO UPDATE SET weight = EXCLUDED.weight, category = EXCLUDED.category;

-- ============================================================================
-- LIFESTYLE / BURNOUT WEIGHTS
-- ============================================================================
-- Clients showing burnout signals need 365 Alignment for work-life balance

INSERT INTO service_scoring_weights (question_id, response_value, service_code, weight, category)
VALUES
  -- Excessive hours → 365 Method
  ('dd_owner_hours', '60-70 hours', '365_method', 40, 'lifestyle'),
  ('dd_owner_hours', '70+ hours', '365_method', 50, 'lifestyle'),
  
  -- Never taken a real break → 365 Method (burnout risk)
  ('dd_holiday_reality', 'Ive never done that', '365_method', 45, 'lifestyle'),
  ('dd_holiday_reality', 'I honestly cant remember', '365_method', 40, 'lifestyle'),
  ('dd_holiday_reality', 'More than 2 years ago', '365_method', 35, 'lifestyle'),
  
  -- Relationship strain → 365 Method
  ('dd_external_view', 'Its a significant source of tension', '365_method', 50, 'lifestyle'),
  ('dd_external_view', 'Theyd say Im married to my business', '365_method', 55, 'lifestyle'),
  ('dd_external_view', 'Theyve given up complaining', '365_method', 45, 'lifestyle'),
  
  -- Firefighting time ratio → 365 Method, Systems
  ('dd_time_breakdown', '90% firefighting / 10% strategic', '365_method', 45, 'lifestyle'),
  ('dd_time_breakdown', '90% firefighting / 10% strategic', 'systems_audit', 40, 'lifestyle'),
  ('dd_time_breakdown', '70% firefighting / 30% strategic', '365_method', 35, 'lifestyle'),
  
  -- Better work-life balance priority → 365 Method
  ('dd_priority_focus', 'Getting my time and energy back', '365_method', 55, 'lifestyle'),
  ('dd_priority_focus', 'Getting my time and energy back', 'fractional_coo', 40, 'lifestyle')
ON CONFLICT (question_id, response_value, service_code) 
DO UPDATE SET weight = EXCLUDED.weight, category = EXCLUDED.category;

-- ============================================================================
-- SUCCESS DEFINITION WEIGHTS
-- ============================================================================
-- Client's definition of success maps to specific services

INSERT INTO service_scoring_weights (question_id, response_value, service_code, weight, category)
VALUES
  -- Business running without me → Systems, COO, 365
  ('dd_success_definition', 'Creating a business that runs profitably without me', 'systems_audit', 50, 'success_definition'),
  ('dd_success_definition', 'Creating a business that runs profitably without me', 'fractional_coo', 45, 'success_definition'),
  ('dd_success_definition', 'Creating a business that runs profitably without me', '365_method', 40, 'success_definition'),
  
  -- Build to sell → Advisory, CFO
  ('dd_success_definition', 'Building something I can sell for a life-changing amount', 'business_advisory', 55, 'success_definition'),
  ('dd_success_definition', 'Building something I can sell for a life-changing amount', 'fractional_cfo', 45, 'success_definition'),
  
  -- Legacy → 365, Advisory
  ('dd_success_definition', 'Building a legacy that outlasts me', '365_method', 45, 'success_definition'),
  ('dd_success_definition', 'Building a legacy that outlasts me', 'business_advisory', 40, 'success_definition'),
  
  -- Time control → 365, Systems
  ('dd_success_definition', 'Having complete control over my time and income', '365_method', 50, 'success_definition'),
  ('dd_success_definition', 'Having complete control over my time and income', 'systems_audit', 35, 'success_definition'),
  
  -- Less stress → 365
  ('dd_success_definition', 'Simply enjoying what I do without constant stress', '365_method', 50, 'success_definition')
ON CONFLICT (question_id, response_value, service_code) 
DO UPDATE SET weight = EXCLUDED.weight, category = EXCLUDED.category;

-- ============================================================================
-- EXIT TIMELINE WEIGHTS
-- ============================================================================
-- Exit planning urgency maps to advisory services

INSERT INTO service_scoring_weights (question_id, response_value, service_code, weight, category)
VALUES
  -- Active exit exploration → Advisory (high urgency)
  ('sd_exit_timeline', 'Already exploring options', 'business_advisory', 60, 'exit_planning'),
  ('sd_exit_timeline', 'Already exploring options', 'fractional_cfo', 45, 'exit_planning'),
  
  -- 1-3 year horizon → Advisory, CFO
  ('sd_exit_timeline', '1-3 years - actively preparing', 'business_advisory', 55, 'exit_planning'),
  ('sd_exit_timeline', '1-3 years - actively preparing', 'fractional_cfo', 40, 'exit_planning'),
  
  -- 3-5 year horizon → Advisory
  ('sd_exit_timeline', '3-5 years - need to start thinking', 'business_advisory', 45, 'exit_planning'),
  
  -- Build to sell mindset → Advisory, CFO, Systems
  ('sd_exit_timeline', 'Build to sell even if I never do', 'business_advisory', 40, 'exit_planning'),
  ('sd_exit_timeline', 'Build to sell even if I never do', 'fractional_cfo', 35, 'exit_planning'),
  ('sd_exit_timeline', 'Build to sell even if I never do', 'systems_audit', 30, 'exit_planning')
ON CONFLICT (question_id, response_value, service_code) 
DO UPDATE SET weight = EXCLUDED.weight, category = EXCLUDED.category;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT category, COUNT(*) as weight_count
FROM service_scoring_weights
WHERE category IS NOT NULL
GROUP BY category
ORDER BY weight_count DESC;
