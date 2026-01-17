-- ============================================================================
-- Update Management Accounts Assessment to 20 Questions (5 Sections)
-- ============================================================================
-- Replaces the previous 31-question / 8-section structure with the new
-- streamlined 20-question / 5-section structure designed for better client
-- qualification and MA sales flow.
-- ============================================================================

-- Delete existing MA assessment questions
DELETE FROM assessment_questions WHERE service_line_code = 'management_accounts';

-- Insert new 20-question structure
INSERT INTO assessment_questions (
  service_line_code,
  question_id,
  section,
  question_text,
  question_type,
  options,
  placeholder,
  char_limit,
  max_selections,
  emotional_anchor,
  technical_field,
  is_required,
  display_order,
  is_active
) VALUES

-- ============================================================================
-- Section 1: Financial Blind Spots (5 questions)
-- ============================================================================

('management_accounts', 'ma_tuesday_question', 'Financial Blind Spots',
 'It''s Tuesday morning. You sit down with coffee. What''s the ONE financial question you wish you could answer instantly - without logging into anything, pulling reports, or asking anyone?',
 'text', NULL, 'E.g., "Can we afford to hire?" / "Are we actually making money on the Smith contract?" / "What''s our real cash position?"',
 200, NULL, 'tuesday_question', NULL, true, 1, true),

('management_accounts', 'ma_avoided_calculation', 'Financial Blind Spots',
 'What''s the financial calculation you suspect you should do - but haven''t, because you''re not sure you want to know the answer?',
 'text', NULL, 'The thing you''ve been putting off looking at...',
 250, NULL, 'avoided_calculation', NULL, true, 2, true),

('management_accounts', 'ma_yearend_surprise', 'Financial Blind Spots',
 'Think back to your last year-end accounts. Were you surprised by the result?',
 'single', 
 '["Yes, made more profit than expected", "Yes, made less profit than expected", "Yes, tax bill was a shock", "No, roughly what I expected", "I can''t remember / didn''t really look"]',
 NULL, NULL, NULL, 'yearend_surprise', NULL, true, 3, true),

('management_accounts', 'ma_expensive_blindspot', 'Financial Blind Spots',
 'Has a lack of financial visibility ever cost you money or caused a problem? Tell us what happened.',
 'text', NULL, 'A decision you got wrong, a surprise you weren''t prepared for, an opportunity you missed...',
 350, NULL, 'expensive_blindspot', NULL, true, 4, true),

('management_accounts', 'ma_numbers_relationship', 'Financial Blind Spots',
 'How would you describe your current relationship with your business numbers?',
 'single',
 '["I check key metrics weekly - genuinely useful", "I look at bank balance, that''s about it", "I wait for my accountant to tell me how we did", "Numbers stress me out - I avoid them", "I want to engage more but don''t know what to look at"]',
 NULL, NULL, NULL, 'numbers_relationship', NULL, true, 5, true),

-- ============================================================================
-- Section 2: Decision Making (4 questions)
-- ============================================================================

('management_accounts', 'ma_decision_story', 'Decision Making',
 'Tell us about the last significant business decision you made. How did financial information inform it?',
 'text', NULL, 'A hire, a pricing change, an investment, taking on a big client, letting someone go...',
 400, NULL, 'decision_story', NULL, true, 6, true),

('management_accounts', 'ma_decision_speed', 'Decision Making',
 'When you need to make a financial decision, how long does it typically take to get the information you need?',
 'single',
 '["Minutes - I have dashboards/reports ready", "Hours - need to pull some things together", "Days - need to ask accountant/bookkeeper", "Weeks - requires proper investigation", "I usually just go with gut feel"]',
 NULL, NULL, NULL, NULL, 'decision_speed', true, 7, true),

('management_accounts', 'ma_decision_confidence', 'Decision Making',
 'When you make financial decisions, how confident are you in the underlying numbers? (1 = Flying blind, 10 = Complete confidence)',
 'single',
 '["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]',
 NULL, NULL, NULL, 'decision_confidence', NULL, true, 8, true),

('management_accounts', 'ma_upcoming_decisions', 'Decision Making',
 'What decisions are on your horizon in the next 6-12 months where better numbers would help?',
 'multi',
 '["Hiring (who, when, can we afford it?)", "Pricing (are we charging enough?)", "Investment/capex (equipment, premises, systems)", "Taking on a big client or project", "Letting go of a client (are they worth it?)", "Exit planning or sale preparation", "Seeking funding or borrowing", "Partner/shareholder discussions", "Expansion into new services/markets", "None specific - just want general visibility"]',
 NULL, NULL, NULL, 'upcoming_decisions', NULL, true, 9, true),

-- ============================================================================
-- Section 3: Cash & Forecasting (4 questions)
-- ============================================================================

('management_accounts', 'ma_cash_visibility_30day', 'Cash & Forecasting',
 'Right now, without looking anything up - do you know how much cash you''ll have in 30 days?',
 'single',
 '["Yes, within £5k", "Roughly, within £20k", "I could work it out if I had to", "No idea", "It varies too much to predict"]',
 NULL, NULL, NULL, NULL, 'cash_visibility_30day', true, 10, true),

('management_accounts', 'ma_cash_surprises', 'Cash & Forecasting',
 'In the last year, how many times has your cash position surprised you?',
 'single',
 '["Never - I always know where we are", "Once or twice - minor surprises", "Several times - some were uncomfortable", "Regularly - cash is unpredictable", "I don''t track it closely enough to be surprised"]',
 NULL, NULL, NULL, 'cash_surprises', NULL, true, 11, true),

('management_accounts', 'ma_worst_cash_moment', 'Cash & Forecasting',
 'Describe a time when you were caught off guard by your cash position. What happened?',
 'text', NULL, 'A payment you forgot, a shortfall you didn''t see coming, a collision of expenses...',
 300, NULL, 'worst_cash_moment', NULL, false, 12, true),

('management_accounts', 'ma_tax_preparedness', 'Cash & Forecasting',
 'How do you currently handle upcoming VAT and tax payments?',
 'single',
 '["I set aside money each month - always prepared", "I know roughly when they''re due, usually ready", "They always seem to sneak up on me", "I rely on my accountant to warn me", "I''ve been caught short before"]',
 NULL, NULL, NULL, NULL, 'tax_preparedness', true, 13, true),

-- ============================================================================
-- Section 4: Current Reporting (3 questions)
-- ============================================================================

('management_accounts', 'ma_current_reports', 'Current Reporting',
 'What financial reports do you currently receive?',
 'multi',
 '["Monthly P&L", "Balance Sheet", "Cash flow statement", "Management accounts pack", "Budget vs actual comparison", "KPI dashboard", "Bank reconciliation", "Aged debtors/creditors", "Nothing regular - just year-end accounts"]',
 NULL, NULL, NULL, NULL, 'current_reports', true, 14, true),

('management_accounts', 'ma_report_usefulness', 'Current Reporting',
 'When you receive financial reports, how useful are they?',
 'single',
 '["Very useful - I act on them regularly", "Somewhat useful - occasional insights", "Not very useful - I glance and file them", "Confusing - I don''t understand them", "I don''t receive regular reports"]',
 NULL, NULL, NULL, 'report_usefulness', NULL, true, 15, true),

('management_accounts', 'ma_reports_missing', 'Current Reporting',
 'What do your current reports NOT tell you that you wish they did?',
 'text', NULL, 'The question you still can''t answer after looking at them...',
 300, NULL, 'reports_missing', NULL, true, 16, true),

-- ============================================================================
-- Section 5: The Destination (4 questions)
-- ============================================================================

('management_accounts', 'ma_visibility_transformation', 'The Destination',
 'If you had complete financial visibility, what would actually change in how you run the business?',
 'text', NULL, 'Think about decisions, stress levels, confidence, conversations with partners/bank/team...',
 400, NULL, 'visibility_transformation', NULL, true, 17, true),

('management_accounts', 'ma_sleep_better', 'The Destination',
 'What would need to be true for you to genuinely sleep better about your business finances?',
 'text', NULL, 'The knowledge or certainty that would give you peace of mind...',
 300, NULL, 'sleep_better', NULL, true, 18, true),

('management_accounts', 'ma_scenario_interest', 'The Destination',
 'Which "what if" questions would you most want to be able to answer?',
 'multi',
 '["What if we raised prices 10%?", "What if we hired another person?", "What if we lost our biggest client?", "What if we reduced debtor days?", "What if we cut overheads by 15%?", "What if revenue dropped 20%?", "What if we took on that big project?", "What if we invested in new equipment?"]',
 NULL, 3, 'scenario_interest', NULL, true, 19, true),

('management_accounts', 'ma_desired_frequency', 'The Destination',
 'How often would you realistically want to see updated numbers?',
 'single',
 '["Weekly - we move fast", "Monthly - the right rhythm for us", "Quarterly - we''re stable enough", "I''m not sure what''s appropriate"]',
 NULL, NULL, NULL, NULL, 'desired_frequency', true, 20, true);

-- ============================================================================
-- Verify the update
-- ============================================================================

DO $$
DECLARE
  question_count INTEGER;
  section_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO question_count 
  FROM assessment_questions 
  WHERE service_line_code = 'management_accounts' AND is_active = true;
  
  SELECT COUNT(DISTINCT section) INTO section_count 
  FROM assessment_questions 
  WHERE service_line_code = 'management_accounts' AND is_active = true;
  
  RAISE NOTICE '✅ Management Accounts assessment updated:';
  RAISE NOTICE '   - Questions: %', question_count;
  RAISE NOTICE '   - Sections: %', section_count;
  
  IF question_count != 20 THEN
    RAISE EXCEPTION 'Expected 20 questions, got %', question_count;
  END IF;
  
  IF section_count != 5 THEN
    RAISE EXCEPTION 'Expected 5 sections, got %', section_count;
  END IF;
END $$;

-- ============================================================================
-- Summary
-- ============================================================================
COMMENT ON TABLE assessment_questions IS 'Service line assessment questions - MA updated to 20 questions / 5 sections on 2026-01-17';

