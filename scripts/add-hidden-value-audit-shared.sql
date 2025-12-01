-- ============================================================================
-- HIDDEN VALUE AUDIT - SHARED ACROSS ALL SERVICE LINES
-- ============================================================================
-- Makes the Hidden Value Audit available after ANY service line onboarding
-- ============================================================================

-- ============================================================================
-- 1. ADD HIDDEN VALUE AUDIT AS A SHARED SERVICE
-- ============================================================================

INSERT INTO service_lines (code, name, short_description, full_description, icon, base_pricing, display_order, is_active) VALUES
(
  'hidden_value_audit',
  'Hidden Value Audit',
  'Discover the hidden value in your business that could transform its worth',
  'A comprehensive analysis of your intellectual capital, brand equity, market position, and operational value. Identify untapped opportunities and risks that affect your business valuation.',
  'Gem',
  '{"included_with_any_service": true, "standalone": 2500}',
  10,
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = now();

-- ============================================================================
-- 2. ADD CLIENT SERVICE LINE FLAGS FOR VALUE AUDIT
-- ============================================================================

ALTER TABLE client_service_lines 
  ADD COLUMN IF NOT EXISTS value_audit_unlocked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS value_audit_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS value_audit_results jsonb;

-- ============================================================================
-- 3. SEED HIDDEN VALUE AUDIT QUESTIONS
-- ============================================================================

-- Section 1: Intellectual Capital Audit
INSERT INTO assessment_questions (service_line_code, question_id, section, question_text, question_type, options, placeholder, char_limit, max_selections, emotional_anchor, technical_field, is_required, display_order) VALUES
('hidden_value_audit', 'hva_process_documentation', 'Intellectual Capital', 'Which of these critical processes exist only in your head or someone else''s?', 'multi', '["How we win new customers", "How we deliver our core service", "How we handle customer complaints", "How we onboard new team members", "How we manage finances", "How we make key decisions", "Our pricing methodology", "Our quality control process"]', NULL, NULL, NULL, 'critical_processes_undocumented', NULL, true, 1),
('hidden_value_audit', 'hva_unique_methods', 'Intellectual Capital', 'What unique ways of doing things give you an edge over competitors?', 'text', NULL, 'Describe your unique methods, processes, or approaches that competitors can''t easily replicate', 500, NULL, 'unique_methods', NULL, true, 2),
('hidden_value_audit', 'hva_unique_methods_protection', 'Intellectual Capital', 'How are these unique methods protected?', 'single', '["Patent filed or granted", "Trade secret (documented internally)", "Not formally protected", "Don''t know"]', NULL, NULL, NULL, 'unique_methods_protection', NULL, true, 3),
('hidden_value_audit', 'hva_knowledge_dependency', 'Intellectual Capital', 'If you were unavailable for 90 days, what % of your business knowledge would be inaccessible?', 'single', '["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"]', NULL, NULL, NULL, 'knowledge_dependency_percentage', NULL, true, 4),
('hidden_value_audit', 'hva_customer_data_unutilized', 'Intellectual Capital', 'What customer data do you collect but never analyze?', 'multi', '["Purchase patterns and frequency", "Customer feedback and reviews", "Complaints and support tickets", "Usage data and engagement metrics", "Customer demographics", "Referral sources", "Lifetime value data", "Churn reasons"]', NULL, NULL, NULL, 'customer_data_unutilized', NULL, true, 5),
('hidden_value_audit', 'hva_content_assets', 'Intellectual Capital', 'Which valuable content have you created but not leveraged?', 'multi', '["Case studies and success stories", "How-to guides and tutorials", "Training materials and courses", "Process documentation", "Research and insights", "Templates and tools", "Webinar recordings", "Customer testimonials"]', NULL, NULL, NULL, 'content_assets_unleveraged', NULL, true, 6),
('hidden_value_audit', 'hva_ip_funding_awareness', 'Intellectual Capital', 'Are you aware of UK funding/tax benefits for innovation?', 'multi', '["R&D Tax Credits - Currently using", "R&D Tax Credits - Aware but not using", "Patent Box relief - Currently using", "Patent Box relief - Aware but not using", "Innovate UK grants - Currently using", "Innovate UK grants - Aware but not using"]', NULL, NULL, NULL, 'ip_funding_awareness', NULL, true, 7),

-- Section 2: Brand & Trust Equity
('hidden_value_audit', 'hva_hidden_trust_signals', 'Brand & Trust Equity', 'Which credibility markers do you have but don''t display prominently?', 'multi', '["Industry awards and recognition", "Professional certifications", "Client testimonials and reviews", "Case studies with metrics", "Media mentions and press", "Years in business", "Number of clients served", "Industry association memberships"]', NULL, NULL, NULL, 'hidden_trust_signals', NULL, true, 8),
('hidden_value_audit', 'hva_personal_brand', 'Brand & Trust Equity', 'What % of customers buy from your business vs buying from YOU personally?', 'single', '["0-20% personal (business brand dominant)", "21-40% personal", "41-60% personal (balanced)", "61-80% personal", "81-100% personal (you ARE the business)"]', NULL, NULL, NULL, 'personal_brand_percentage', NULL, true, 9),
('hidden_value_audit', 'hva_reputation_time', 'Brand & Trust Equity', 'How long would it take a competitor to build your reputation from scratch?', 'single', '["6 months or less", "1 year", "2-5 years", "5-10 years", "More than 10 years", "They could do it immediately"]', NULL, NULL, NULL, 'reputation_build_time', NULL, true, 10),
('hidden_value_audit', 'hva_story_consistency', 'Brand & Trust Equity', 'Can your team consistently tell your company''s origin story and values?', 'single', '["Yes, everyone knows it well", "Some can tell it well", "Only I can tell it properly", "We don''t have a clear story"]', NULL, NULL, NULL, 'team_story_consistency', NULL, true, 11),
('hidden_value_audit', 'hva_customer_advocates', 'Brand & Trust Equity', 'How many customers actively refer others without being asked?', 'text', NULL, 'Enter a number (e.g., 5, 10, 50)', 10, NULL, 'active_customer_advocates', NULL, true, 12),

-- Section 3: Market Position Vulnerabilities
('hidden_value_audit', 'hva_competitive_moat', 'Market Position', 'What prevents a well-funded competitor from replicating your business?', 'multi', '["Exclusive contracts or partnerships", "Proprietary technology or systems", "Regulatory barriers or licenses", "Deep customer relationships", "Unique location advantages", "Specialized expertise/talent", "Brand recognition and trust", "Nothing - we compete on price"]', NULL, NULL, NULL, 'competitive_moat', NULL, true, 13),
('hidden_value_audit', 'hva_customer_concentration', 'Market Position', 'What % of revenue comes from your top 3 customers?', 'single', '["Under 10%", "10-25%", "26-50%", "51-75%", "Over 75%"]', NULL, NULL, NULL, 'top3_customer_revenue_percentage', NULL, true, 14),
('hidden_value_audit', 'hva_channel_dependency', 'Market Position', 'How much revenue flows through channels you don''t control?', 'single', '["Under 10%", "10-30%", "31-50%", "51-70%", "Over 70%"]', NULL, NULL, NULL, 'external_channel_percentage', NULL, true, 15),
('hidden_value_audit', 'hva_price_increase', 'Market Position', 'When did you last raise prices without losing customers?', 'single', '["Within last 6 months", "6-12 months ago", "1-2 years ago", "More than 2 years ago", "Never raised prices"]', NULL, NULL, NULL, 'last_price_increase', NULL, true, 16),
('hidden_value_audit', 'hva_market_intelligence', 'Market Position', 'How do you track competitor moves and market changes?', 'multi', '["Industry publications and reports", "Customer feedback", "Social media monitoring", "Trade shows and networking", "Competitor website tracking", "Mystery shopping", "No formal tracking"]', NULL, NULL, NULL, 'market_intelligence_methods', NULL, true, 17),

-- Section 4: Operational Value Levers
('hidden_value_audit', 'hva_capacity_utilization', 'Operational Value', 'At what % capacity is your business operating?', 'single', '["Under 50%", "50-70%", "71-85%", "86-95%", "Over 95% (maxed out)"]', NULL, NULL, NULL, 'capacity_utilization', NULL, true, 18),
('hidden_value_audit', 'hva_scalability_blockers', 'Operational Value', 'What stops you from doubling revenue without doubling costs?', 'multi', '["Time limitations", "Staff capacity", "Physical space", "Technology limitations", "Capital constraints", "Supplier limitations", "Customer acquisition cost", "Nothing - we could scale tomorrow"]', NULL, NULL, NULL, 'scalability_blockers', NULL, true, 19),
('hidden_value_audit', 'hva_recurring_revenue', 'Operational Value', 'What % of your revenue is recurring or contracted?', 'single', '["Under 10%", "10-25%", "26-50%", "51-75%", "Over 75%"]', NULL, NULL, NULL, 'recurring_revenue_percentage', NULL, true, 20),
('hidden_value_audit', 'hva_supplier_alternatives', 'Operational Value', 'How quickly could you replace your key suppliers?', 'single', '["Within a week", "Within a month", "1-3 months", "3-6 months", "Over 6 months or not possible"]', NULL, NULL, NULL, 'supplier_replacement_time', NULL, true, 21),
('hidden_value_audit', 'hva_key_person_dependency', 'Operational Value', 'If your top performer left tomorrow, what % of revenue would be at risk?', 'single', '["Under 10%", "10-25%", "26-40%", "41-60%", "Over 60%"]', NULL, NULL, NULL, 'key_person_revenue_risk', NULL, true, 22),

-- Section 5: Financial Hidden Value
('hidden_value_audit', 'hva_pricing_methodology', 'Financial Value', 'How do you set your prices?', 'single', '["Cost-plus margin", "Competitor benchmarking", "Value-based pricing", "Customer willingness testing", "We guess and adjust", "Haven''t changed them in years"]', NULL, NULL, NULL, 'pricing_methodology', NULL, true, 23),
('hidden_value_audit', 'hva_price_increase_potential', 'Financial Value', 'What''s the highest price increase you could implement without losing significant customers?', 'single', '["0% - We''d lose customers", "1-5%", "6-10%", "11-20%", "Over 20%", "Don''t know"]', NULL, NULL, NULL, 'price_increase_tolerance', NULL, true, 24),
('hidden_value_audit', 'hva_underpriced_services', 'Financial Value', 'Which of your services do you suspect are underpriced?', 'text', NULL, 'List any services you feel should cost more', 300, NULL, 'underpriced_services', NULL, true, 25),
('hidden_value_audit', 'hva_hidden_costs', 'Financial Value', 'Which costs do you regularly absorb that should be charged to clients?', 'multi', '["Travel and expenses", "Overtime and rush work", "Revisions and amendments", "Training and handholding", "Support and maintenance", "Materials and supplies", "None - we charge for everything"]', NULL, NULL, NULL, 'hidden_costs_absorbed', NULL, true, 26),

-- Section 6: Exit & Strategic Readiness
('hidden_value_audit', 'hva_exit_timeline', 'Exit Readiness', 'When do you ideally want to step back or exit the business?', 'single', '["Within 2 years", "2-5 years", "5-10 years", "More than 10 years", "Never - this is my legacy", "Haven''t thought about it"]', NULL, NULL, NULL, 'exit_timeline', NULL, true, 27),
('hidden_value_audit', 'hva_business_sellable', 'Exit Readiness', 'If someone offered to buy your business today, could you sell it?', 'single', '["Yes - it could run without me", "Probably - with 3-6 months transition", "Maybe - would need 1-2 years transition", "No - it''s entirely dependent on me"]', NULL, NULL, NULL, 'business_sellability', NULL, true, 28),
('hidden_value_audit', 'hva_documentation_score', 'Exit Readiness', 'Rate your business documentation and systemization (1-10)', 'single', '["1-2 (nothing documented)", "3-4 (basic documentation)", "5-6 (some systems in place)", "7-8 (well documented)", "9-10 (fully systemized)"]', NULL, NULL, NULL, 'documentation_score', NULL, true, 29),
('hidden_value_audit', 'hva_succession_plan', 'Exit Readiness', 'Do you have anyone who could run the business if you couldn''t?', 'single', '["Yes - fully trained successor", "Partially - someone could manage temporarily", "No - I am the business"]', NULL, NULL, NULL, 'succession_readiness', NULL, true, 30),
('hidden_value_audit', 'hva_value_increase_priority', 'Exit Readiness', 'What would you most want to change to increase business value?', 'text', NULL, 'Describe the single biggest change that would make your business more valuable', 500, NULL, 'value_increase_priority', NULL, true, 31),
('hidden_value_audit', 'hva_hidden_opportunity', 'Exit Readiness', 'What opportunity are you not pursuing that could transform your business?', 'text', NULL, 'Describe an untapped opportunity you''ve been thinking about', 500, NULL, 'hidden_opportunity', NULL, true, 32)

ON CONFLICT (service_line_code, question_id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  placeholder = EXCLUDED.placeholder,
  updated_at = now();

-- ============================================================================
-- 4. CREATE FUNCTION TO UNLOCK VALUE AUDIT
-- ============================================================================

CREATE OR REPLACE FUNCTION unlock_value_audit_for_client(p_client_id uuid)
RETURNS void AS $$
BEGIN
  -- Unlock value audit for all service lines where onboarding is complete
  UPDATE client_service_lines
  SET value_audit_unlocked = true
  WHERE client_id = p_client_id
    AND onboarding_completed_at IS NOT NULL
    AND value_audit_unlocked = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. TRIGGER TO AUTO-UNLOCK VALUE AUDIT ON ONBOARDING COMPLETE
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_unlock_value_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.onboarding_completed_at IS NOT NULL AND OLD.onboarding_completed_at IS NULL THEN
    NEW.value_audit_unlocked := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_unlock_value_audit ON client_service_lines;
CREATE TRIGGER trigger_auto_unlock_value_audit
  BEFORE UPDATE ON client_service_lines
  FOR EACH ROW
  EXECUTE FUNCTION auto_unlock_value_audit();

-- ============================================================================
-- 6. VERIFICATION
-- ============================================================================

SELECT 
  service_line_code,
  COUNT(*) as question_count,
  COUNT(DISTINCT section) as section_count
FROM assessment_questions
WHERE service_line_code = 'hidden_value_audit'
  AND is_active = true
GROUP BY service_line_code;

-- Show all service lines
SELECT code, name, is_active FROM service_lines ORDER BY display_order;

