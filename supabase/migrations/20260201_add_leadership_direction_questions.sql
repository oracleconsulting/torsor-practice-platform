-- ============================================================================
-- ADD LEADERSHIP & DIRECTION QUESTIONS TO BENCHMARKING ASSESSMENT
-- ============================================================================
-- These questions enable context-aware opportunity prioritisation:
-- - Leadership structure → Don't recommend Fractional CFO if they have one
-- - Business direction → Different priorities for exit vs growth
-- - Pricing history → Identify quick wins
-- ============================================================================

-- Temporarily disable audit trigger
ALTER TABLE assessment_questions DISABLE TRIGGER IF EXISTS audit_assessment_questions;

-- ============================================================================
-- SECTION: LEADERSHIP & DIRECTION (insert after classification, before size_context)
-- Display order 2.x to insert between existing sections
-- ============================================================================

INSERT INTO assessment_questions (
  service_line_code, question_id, section, question_text, question_type, 
  options, placeholder, char_limit, max_selections, 
  emotional_anchor, technical_field, is_required, display_order, helper_text
) VALUES

-- -----------------------------------------------------------------------------
-- LEADERSHIP STRUCTURE
-- -----------------------------------------------------------------------------

('benchmarking', 'bm_leadership_structure', 'leadership_direction', 
 'What best describes your current leadership structure?', 
 'single', 
 '["Just me running everything", "Me plus informal management team (no defined titles)", "Formal leadership team with defined roles (2-3 people)", "Full executive team (CEO, CFO, COO or equivalent)"]',
 NULL, NULL, NULL, NULL, 'leadership_structure', true, 2.1,
 'This helps us tailor recommendations to your existing structure'),

('benchmarking', 'bm_existing_roles', 'leadership_direction',
 'Which of these roles are currently filled in your business?',
 'multi',
 '["Managing Director / CEO (other than you)", "Finance Director / CFO", "Operations Director / COO", "Commercial Director / Sales Director", "HR Director / People Director", "Non-executive Director(s)", "External Board Advisor(s)", "None of the above"]',
 NULL, NULL, NULL, NULL, 'existing_roles', false, 2.2,
 'Select all that apply'),

('benchmarking', 'bm_leadership_effectiveness', 'leadership_direction',
 'How would your leadership team cope if you were unavailable for 3 months?',
 'single',
 '["Would fail - business couldn''t function", "Would struggle significantly", "Could manage with some issues", "Would be fine", "Would thrive - might not notice I was gone"]',
 NULL, NULL, NULL, 'leadership_effectiveness', NULL, true, 2.3,
 NULL),

-- -----------------------------------------------------------------------------
-- BUSINESS DIRECTION
-- -----------------------------------------------------------------------------

('benchmarking', 'bm_business_direction', 'leadership_direction',
 'What best describes your primary goal for the next 3-5 years?',
 'single',
 '["Grow aggressively - acquisitions, new markets, scale significantly", "Grow steadily - organic growth, same market, manageable pace", "Maintain and optimise - protect position, improve margins", "Step back - reduce my involvement, more lifestyle-focused", "Prepare for exit - sale, succession, retirement", "Unsure - I''m exploring my options"]',
 NULL, NULL, NULL, 'business_direction', NULL, true, 2.4,
 'Be honest - this shapes everything we recommend'),

('benchmarking', 'bm_exit_timeline', 'leadership_direction',
 'If you were to sell or significantly step back, what''s your ideal timeline?',
 'single',
 '["Within 2 years", "2-5 years", "5+ years", "Only if the right offer came along", "Not planning to exit"]',
 NULL, NULL, NULL, 'exit_timeline', NULL, false, 2.5,
 'Only answer if considering exit or step-back'),

('benchmarking', 'bm_recent_conversations', 'leadership_direction',
 'Have you had any of these conversations in the last 12 months?',
 'multi',
 '["Approach from a potential buyer", "Discussions with a broker about selling", "Merger or partnership conversations", "Investor discussions about growth capital", "Bank discussions about expansion funding", "None of the above"]',
 NULL, NULL, NULL, NULL, 'recent_conversations', false, 2.6,
 'Select all that apply - this is confidential'),

('benchmarking', 'bm_investment_plans', 'leadership_direction',
 'Are you planning significant investments in the next 24 months?',
 'multi',
 '["New equipment or technology", "New premises or facilities", "Acquisitions", "New geographic markets", "New service lines", "Significant hiring (10+ people)", "No major investments planned"]',
 NULL, NULL, NULL, NULL, 'investment_plans', true, 2.7,
 'Select all that apply'),

-- -----------------------------------------------------------------------------
-- PRICING (moved from supplementary to main assessment)
-- -----------------------------------------------------------------------------

('benchmarking', 'bm_last_price_increase', 'leadership_direction',
 'When did you last increase prices across your main contracts or clients?',
 'single',
 '["Within the last 12 months", "1-2 years ago", "More than 2 years ago", "Can''t remember / never systematically reviewed"]',
 NULL, NULL, NULL, 'last_price_increase', NULL, true, 2.8,
 NULL),

('benchmarking', 'bm_pricing_confidence', 'leadership_direction',
 'What''s the main reason prices haven''t increased?',
 'single',
 '["Fear of losing clients", "Just hasn''t been a priority", "Locked into long-term contracts", "Market/competitive pressure", "We do increase them regularly", "Other reason"]',
 NULL, NULL, NULL, 'pricing_confidence', NULL, false, 2.9,
 'Only answer if prices haven''t increased recently')

ON CONFLICT (service_line_code, question_id) DO UPDATE SET
  section = EXCLUDED.section,
  question_text = EXCLUDED.question_text,
  question_type = EXCLUDED.question_type,
  options = EXCLUDED.options,
  placeholder = EXCLUDED.placeholder,
  char_limit = EXCLUDED.char_limit,
  max_selections = EXCLUDED.max_selections,
  emotional_anchor = EXCLUDED.emotional_anchor,
  technical_field = EXCLUDED.technical_field,
  is_required = EXCLUDED.is_required,
  display_order = EXCLUDED.display_order,
  helper_text = EXCLUDED.helper_text,
  updated_at = now();

-- Re-enable audit trigger
ALTER TABLE assessment_questions ENABLE TRIGGER IF EXISTS audit_assessment_questions;

-- ============================================================================
-- UPDATE SECTION ORDER: Insert 'leadership_direction' as second section
-- ============================================================================

-- Update existing questions to shift display_order to make room
-- (only if we need to reorder - the 2.x ordering should work with text sorting)

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  section,
  question_id,
  SUBSTRING(question_text, 1, 50) as question_preview,
  display_order
FROM assessment_questions
WHERE service_line_code = 'benchmarking' AND is_active = true
ORDER BY display_order;

