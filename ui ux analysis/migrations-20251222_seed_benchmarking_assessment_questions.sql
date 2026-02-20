-- ============================================================================
-- SEED BENCHMARKING ASSESSMENT QUESTIONS (Revised - 15 questions)
-- ============================================================================
-- Integrates with Hidden Value Audit (HVA) to avoid duplicate questions
-- ============================================================================

-- Temporarily disable audit trigger for assessment_questions (reference data, not client data)
ALTER TABLE assessment_questions DISABLE TRIGGER audit_assessment_questions;

INSERT INTO assessment_questions (service_line_code, question_id, section, question_text, question_type, options, placeholder, char_limit, max_selections, emotional_anchor, technical_field, is_required, display_order) VALUES

-- ═══════════════════════════════════════════════════════════════
-- SECTION 1: INDUSTRY CLASSIFICATION
-- ═══════════════════════════════════════════════════════════════

('benchmarking', 'bm_business_description', 'classification', 'Describe what your business does in 2-3 sentences', 'text', NULL, 'e.g., "We run a chain of 4 dental practices in Manchester, offering NHS and private dentistry. About 60% of our revenue is NHS."', 500, NULL, 'business_description', NULL, true, 1),

('benchmarking', 'bm_industry_suggestion', 'classification', 'Which industry best describes your business?', 'single', '["Accountancy & Tax Services", "Legal Services", "Management Consultancy", "Recruitment & Staffing", "Marketing & PR Agencies", "Dental Practice", "Veterinary Practice", "Restaurant / Café", "Pub / Bar", "Hotel / B&B", "E-commerce & Online Retail", "SaaS / Software Products", "General Retail", "Main Contractor / Builder", "Estate Agency", "Other"]', NULL, NULL, NULL, NULL, 'industry_code', true, 2),

('benchmarking', 'bm_sub_sector', 'classification', 'Any specific niche or specialisation?', 'text', NULL, 'e.g., "Cosmetic dentistry", "SaaS for recruitment agencies", "Vegan restaurant"', 200, NULL, NULL, NULL, false, 3),

('benchmarking', 'bm_sic_code', 'classification', 'SIC code (if known)', 'text', NULL, 'e.g., 69201', 10, NULL, NULL, 'sic_code', false, 4),

-- ═══════════════════════════════════════════════════════════════
-- SECTION 2: SIZE & CONTEXT
-- ═══════════════════════════════════════════════════════════════

('benchmarking', 'bm_revenue_exact', 'size_context', 'What was your revenue/turnover in the last 12 months?', 'text', NULL, 'e.g., 1500000', NULL, NULL, NULL, 'revenue_exact', true, 5),

('benchmarking', 'bm_employee_count', 'size_context', 'How many employees (including owners)?', 'text', NULL, 'Enter number', NULL, NULL, NULL, 'employee_count', true, 6),

('benchmarking', 'bm_business_age', 'size_context', 'How long has the business been trading?', 'single', '["Under 2 years", "2-5 years", "5-10 years", "10+ years"]', NULL, NULL, NULL, NULL, 'business_age', true, 7),

('benchmarking', 'bm_location_type', 'size_context', 'Where do you primarily operate?', 'single', '["London", "South East England", "Midlands", "North of England", "Scotland", "Wales", "Northern Ireland", "National/Multi-region", "International"]', NULL, NULL, NULL, NULL, 'location_type', true, 8),

-- ═══════════════════════════════════════════════════════════════
-- SECTION 3: PERCEPTION & TRACKING
-- ═══════════════════════════════════════════════════════════════

('benchmarking', 'bm_performance_perception', 'perception', 'How do you rate your business performance vs competitors?', 'single', '["Top 10% - Industry leader", "Top 25% - Above average", "Middle of the pack", "Below average", "Honestly, I don''t know"]', NULL, NULL, NULL, 'performance_perception', NULL, true, 9),

('benchmarking', 'bm_current_tracking', 'perception', 'Which metrics do you currently track regularly?', 'multi', '["Revenue/Turnover", "Gross Profit %", "Net Profit %", "Cash Flow", "Debtor Days", "Revenue per Employee", "Customer Retention / LTV", "Industry-specific KPIs", "We don''t track many metrics"]', NULL, NULL, NULL, NULL, 'current_tracking', true, 10),

('benchmarking', 'bm_comparison_method', 'perception', 'How do you currently compare yourself to competitors?', 'text', NULL, 'e.g., "We look at their pricing", "We don''t really", "Industry surveys"', 300, NULL, NULL, NULL, true, 11),

-- ═══════════════════════════════════════════════════════════════
-- SECTION 4: PRIORITY AREAS
-- ═══════════════════════════════════════════════════════════════

('benchmarking', 'bm_suspected_underperformance', 'priorities', 'Which area of your business do you SUSPECT underperforms vs industry?', 'text', NULL, 'Be specific - "I think our gross margins are lower than they should be" or "Our debtor days feel too long"', 400, NULL, 'suspected_underperformance', NULL, true, 12),

('benchmarking', 'bm_leaving_money', 'priorities', 'Where do you feel you might be leaving money on the table?', 'text', NULL, 'Pricing too low? Costs too high? Missing revenue streams?', 400, NULL, 'leaving_money', NULL, true, 13),

('benchmarking', 'bm_top_quartile_ambition', 'priorities', 'Where would you most like to be TOP QUARTILE? (Select up to 3)', 'multi', '["Profitability (margins)", "Revenue Growth", "Efficiency (revenue per head)", "Cash Management", "Customer Metrics", "Pricing Power", "Scalability"]', NULL, NULL, 3, NULL, 'top_quartile_ambition', true, 14),

-- ═══════════════════════════════════════════════════════════════
-- SECTION 5: MAGIC FIX
-- ═══════════════════════════════════════════════════════════════

('benchmarking', 'bm_benchmark_magic_fix', 'magic_action', 'If you could see EXACTLY how you compare to the best in your industry, what would you do with that information?', 'text', NULL, 'Be specific - "I''d restructure our pricing", "I''d have an honest conversation with my team about productivity"', 500, NULL, 'benchmark_magic_fix', NULL, true, 15),

('benchmarking', 'bm_action_readiness', 'magic_action', 'If the benchmarking reveals clear improvement opportunities, how ready are you to act?', 'single', '["Ready to act immediately", "Will feed into planning for next quarter", "Just want awareness for now", "Need to share with team/board first"]', NULL, NULL, NULL, NULL, 'action_readiness', true, 16),

('benchmarking', 'bm_blind_spot_fear', 'magic_action', 'What blind spot are you most afraid this might reveal?', 'text', NULL, 'The thing you hope ISN''T true about your business...', 300, NULL, 'blind_spot_fear', NULL, false, 17)

ON CONFLICT (service_line_code, question_id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  placeholder = EXCLUDED.placeholder,
  char_limit = EXCLUDED.char_limit,
  max_selections = EXCLUDED.max_selections,
  emotional_anchor = EXCLUDED.emotional_anchor,
  technical_field = EXCLUDED.technical_field,
  updated_at = now();

-- Re-enable audit trigger
ALTER TABLE assessment_questions ENABLE TRIGGER audit_assessment_questions;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  service_line_code,
  section,
  COUNT(*) as question_count
FROM assessment_questions
WHERE service_line_code = 'benchmarking' AND is_active = true
GROUP BY service_line_code, section
ORDER BY MIN(display_order);

