-- ============================================================================
-- ASSESSMENT QUESTIONS DATABASE SCHEMA
-- ============================================================================
-- Stores editable assessment questions for each service line
-- AI can access these for value proposition generation
-- ============================================================================

-- ============================================================================
-- 1. ASSESSMENT QUESTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_line_code text NOT NULL,  -- 'management_accounts', 'systems_audit', 'fractional_executive'
    question_id text NOT NULL,  -- Unique ID like 'ma_relationship_with_numbers'
    section text NOT NULL,
    question_text text NOT NULL,
    question_type text NOT NULL CHECK (question_type IN ('single', 'multi', 'text', 'rank')),
    options jsonb,  -- Array of option strings for choice questions
    placeholder text,  -- For text questions
    char_limit integer,
    max_selections integer,  -- For multi-select
    emotional_anchor text,  -- Key for VP generation
    technical_field text,  -- Key for technical/scope data
    is_required boolean DEFAULT true,
    display_order integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid,  -- Who last edited
    UNIQUE(service_line_code, question_id)
);

-- ============================================================================
-- 2. QUESTION EDIT HISTORY (for audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_question_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid REFERENCES assessment_questions(id) ON DELETE CASCADE,
    field_changed text NOT NULL,
    old_value text,
    new_value text,
    changed_by uuid,
    changed_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assessment_questions_service ON assessment_questions(service_line_code);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_active ON assessment_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_order ON assessment_questions(service_line_code, display_order);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_question_history ENABLE ROW LEVEL SECURITY;

-- Team members can manage questions
CREATE POLICY "Team can manage questions" ON assessment_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Questions are readable by authenticated users (for client assessments)
CREATE POLICY "Authenticated can read active questions" ON assessment_questions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_active = true
  );

-- Team can view history
CREATE POLICY "Team can view history" ON assessment_question_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- ============================================================================
-- 5. SEED MANAGEMENT ACCOUNTS QUESTIONS
-- ============================================================================

INSERT INTO assessment_questions (service_line_code, question_id, section, question_text, question_type, options, placeholder, char_limit, max_selections, emotional_anchor, technical_field, is_required, display_order) VALUES
-- Section 1: Current State
('management_accounts', 'ma_relationship_with_numbers', 'Current State', 'How would you describe your current relationship with your business numbers?', 'single', '["I check them religiously every week", "I look at bank balance, that''s about it", "I wait for my accountant to tell me how we did", "Numbers stress me out - I avoid them", "I want to engage more but don''t know what to look at"]', NULL, NULL, NULL, 'relationship_with_numbers', NULL, true, 1),
('management_accounts', 'ma_reports_insight_frequency', 'Current State', 'When was the last time your financial reports told you something you didn''t already know?', 'single', '["Last week - they''re genuinely useful", "Last month - occasionally insightful", "Last quarter - rare \"aha\" moments", "Can''t remember - they just confirm what I suspected", "Never - I don''t understand them anyway"]', NULL, NULL, NULL, 'reports_insight_frequency', NULL, true, 2),
('management_accounts', 'ma_tuesday_financial_question', 'Current State', 'What''s your "Tuesday morning" financial question? The thing you wish you could instantly answer when you sit down?', 'text', NULL, 'E.g., "How much cash will we have in 30 days?" / "Which client is most profitable?"', 200, NULL, 'tuesday_financial_question', NULL, true, 3),
('management_accounts', 'ma_magic_away_financial', 'Current State', 'If you could magic away ONE financial uncertainty, what would it be?', 'text', NULL, 'Describe the financial worry that keeps you up at night...', 300, NULL, 'magic_away_financial', NULL, true, 4),
-- Section 2: Pain Points
('management_accounts', 'ma_pain_points', 'Pain Points', 'Which of these keep you awake at night? (Select all that apply)', 'multi', '["Not knowing if we''re actually profitable month-to-month", "Cash flow surprises - bills I forgot were coming", "Can''t tell which services/products make money", "Year-end tax bills are always a shock", "Don''t know if we can afford to hire", "No idea what our breakeven point is", "Bank balance looks healthy but profits feel thin", "Staff costs feel high but can''t prove it"]', NULL, NULL, NULL, 'kpi_priorities', NULL, true, 5),
('management_accounts', 'ma_reporting_lag', 'Pain Points', 'How long does it take you to answer "How did we do last month?"', 'single', '["Under a minute - I have it at my fingertips", "About 30 minutes - need to pull some reports", "A few hours - involves spreadsheets and reconciliations", "A few days - need to wait for bookkeeper", "No idea until year-end accounts"]', NULL, NULL, NULL, NULL, 'current_reporting_lag', true, 6),
('management_accounts', 'ma_decision_making_story', 'Pain Points', 'Last time you had a big business decision to make, how did financials inform it?', 'text', NULL, 'E.g., hiring, pricing, investment, taking on a big client...', 300, NULL, 'decision_making_story', NULL, true, 7),
-- Section 3: System Context
('management_accounts', 'ma_accounting_platform', 'System Context', 'What accounting software are you using?', 'single', '["Xero", "QuickBooks Online", "Sage (any version)", "FreeAgent", "Kashflow", "Spreadsheets", "Other"]', NULL, NULL, NULL, NULL, 'accounting_platform', true, 8),
('management_accounts', 'ma_bookkeeping_currency', 'System Context', 'How up-to-date is your bookkeeping typically?', 'single', '["Real-time - everything''s entered within days", "Weekly - usually caught up by Friday", "Monthly - we batch it up", "Quarterly - we do it for VAT", "Whenever someone has time"]', NULL, NULL, NULL, NULL, 'bookkeeping_currency', true, 9),
('management_accounts', 'ma_bookkeeping_owner', 'System Context', 'Who currently does your bookkeeping?', 'single', '["I do it myself", "An internal team member", "An external bookkeeper/accountant", "A mix - different people for different things", "Nobody consistently"]', NULL, NULL, NULL, NULL, 'bookkeeping_owner', true, 10),
-- Section 4: Desired Outcomes
('management_accounts', 'ma_transformation_desires', 'Desired Outcomes', 'If we delivered management accounts that actually worked for you, what would change?', 'multi', '["I''d make faster decisions", "I''d sleep better at night", "I''d have confident conversations with investors/banks", "I''d know when to push growth vs pull back", "I''d stop second-guessing my pricing", "I''d catch problems before they became crises", "I''d finally feel \"in control\" of the finances", "My spouse would stop worrying"]', NULL, NULL, 3, 'ma_transformation_desires', NULL, true, 11),
('management_accounts', 'ma_visibility_vision', 'Desired Outcomes', 'What does "financial visibility" look like to you? Paint the picture.', 'text', NULL, 'Describe your ideal state - how it feels, what you can do, what questions you can answer...', 400, NULL, 'financial_visibility_vision', NULL, true, 12),
-- Section 5: Frequency & Scope
('management_accounts', 'ma_reporting_frequency', 'Frequency & Scope', 'How often do you realistically need to see your numbers to make good decisions?', 'single', '["Weekly - we move fast", "Monthly - that''s the right rhythm", "Quarterly - we''re stable enough", "I don''t know what''s appropriate for us"]', NULL, NULL, NULL, NULL, 'reporting_frequency_preference', true, 13),
('management_accounts', 'ma_additional_reporting', 'Frequency & Scope', 'Beyond standard P&L and Balance Sheet, what would be genuinely useful?', 'multi', '["Cash flow forecasting (where will we be in 30/60/90 days?)", "Customer profitability analysis (who''s actually making us money?)", "Staff cost ratio tracking (are wages sustainable?)", "Gross margin by service/product line", "Debtor ageing (who owes us and how old?)", "Budget vs actual comparison", "Rolling 12-month trend analysis", "I don''t know - help me figure this out"]', NULL, NULL, NULL, NULL, 'additional_reporting_needs', true, 14)
ON CONFLICT (service_line_code, question_id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  updated_at = now();

-- ============================================================================
-- 6. SEED SYSTEMS AUDIT QUESTIONS
-- ============================================================================

INSERT INTO assessment_questions (service_line_code, question_id, section, question_text, question_type, options, placeholder, char_limit, max_selections, emotional_anchor, technical_field, is_required, display_order) VALUES
-- Section 1: Current Pain
('systems_audit', 'sa_breaking_point', 'Current Pain', 'What broke - or is about to break - that made you think about systems?', 'text', NULL, 'Be specific - the incident, the near-miss, the frustration that tipped you over...', 400, NULL, 'systems_breaking_point', NULL, true, 1),
('systems_audit', 'sa_operations_diagnosis', 'Current Pain', 'How would you describe your current operations?', 'single', '["Controlled chaos - it works but I can''t explain how", "Manual heroics - we survive on people''s goodwill", "Death by spreadsheet - everything''s tracked but nothing connects", "Tech Frankenstein - we''ve bolted tools together over years", "Actually pretty good - we just need optimisation"]', NULL, NULL, NULL, 'operations_self_diagnosis', NULL, true, 2),
('systems_audit', 'sa_month_end_shame', 'Current Pain', 'If I followed you through a typical month-end, what would embarrass you most?', 'text', NULL, 'The workaround you''re ashamed of, the process you''d never show an investor...', 300, NULL, 'month_end_shame', NULL, true, 3),
-- Section 2: Impact Quantification
('systems_audit', 'sa_manual_hours', 'Impact Quantification', 'How many hours per month do you estimate your team spends on manual data entry, reconciliation, or "making things match"?', 'single', '["Under 10 hours", "10-20 hours", "20-40 hours", "40-80 hours", "More than 80 hours", "No idea - but it''s significant"]', NULL, NULL, NULL, NULL, 'manual_hours_monthly', true, 4),
('systems_audit', 'sa_month_end_duration', 'Impact Quantification', 'How long does your month-end close currently take?', 'single', '["1-2 days", "3-5 days", "1-2 weeks", "2-4 weeks", "We don''t really \"close\" - it''s ongoing"]', NULL, NULL, NULL, NULL, 'month_end_duration', true, 5),
('systems_audit', 'sa_data_error_frequency', 'Impact Quantification', 'In the last year, how many times have you discovered data errors that affected a business decision?', 'single', '["Never - our data is solid", "Once or twice - minor issues", "Several times - some costly", "Regularly - I don''t fully trust our numbers", "I don''t know - which is the scary part"]', NULL, NULL, NULL, NULL, 'data_error_frequency', true, 6),
('systems_audit', 'sa_expensive_mistake', 'Impact Quantification', 'What''s the most expensive mistake caused by a systems/process gap in the last 2 years?', 'text', NULL, 'Lost client, tax penalty, missed opportunity, overpayment...', 300, NULL, 'expensive_systems_mistake', NULL, true, 7),
-- Section 3: Tech Stack
('systems_audit', 'sa_tech_stack', 'Tech Stack', 'Which software tools does your business use? (Select all that apply)', 'multi', '["Xero / QuickBooks / Sage (Accounting)", "HubSpot / Salesforce / Pipedrive (CRM)", "Asana / Trello / Monday (Projects)", "Slack / Teams (Communication)", "Stripe / GoCardless (Payments)", "BrightPay / Gusto (Payroll)", "Shopify / WooCommerce (E-commerce)", "Google Workspace / Microsoft 365", "Custom/bespoke systems", "Lots of spreadsheets"]', NULL, NULL, NULL, NULL, 'current_tech_stack', true, 8),
('systems_audit', 'sa_integration_health', 'Tech Stack', 'How would you rate the integration between these systems?', 'single', '["Seamless - data flows automatically", "Partial - some connected, some manual", "Minimal - mostly manual transfers", "Non-existent - each system is an island"]', NULL, NULL, NULL, NULL, 'integration_health', true, 9),
('systems_audit', 'sa_spreadsheet_count', 'Tech Stack', 'How many spreadsheets are "critical" to running your business? (Be honest)', 'single', '["None - everything''s in proper systems", "1-3 key spreadsheets", "4-10 spreadsheets", "10-20 spreadsheets", "I''ve lost count"]', NULL, NULL, NULL, NULL, 'spreadsheet_dependency', true, 10),
-- Section 4: Focus Areas
('systems_audit', 'sa_priority_areas', 'Focus Areas', 'Which areas feel most broken right now? (Select top 3)', 'multi', '["Financial reporting / management accounts", "Accounts payable (paying suppliers)", "Accounts receivable (getting paid)", "Inventory / stock management", "Payroll and HR processes", "Sales / CRM / pipeline tracking", "Project management and delivery", "Client onboarding", "Compliance and documentation", "IT infrastructure / security"]', NULL, NULL, 3, NULL, 'priority_areas', true, 11),
('systems_audit', 'sa_magic_fix', 'Focus Areas', 'If you could fix ONE process by magic, which would have the biggest impact?', 'text', NULL, 'Describe the process and why fixing it would matter...', 300, NULL, 'magic_process_fix', NULL, true, 12),
-- Section 5: Readiness
('systems_audit', 'sa_change_appetite', 'Readiness', 'What''s your appetite for change right now?', 'single', '["Urgent - we need to fix this yesterday", "Ready - we''ve budgeted time and money for this", "Cautious - we want to improve but can''t afford disruption", "Exploring - just want to understand options"]', NULL, NULL, NULL, NULL, 'change_appetite', true, 13),
('systems_audit', 'sa_fears', 'Readiness', 'What''s your biggest fear about tackling systems?', 'multi', '["Cost will spiral out of control", "Implementation will disrupt operations", "We''ll invest and it won''t work", "Team won''t adopt new processes", "We''ll become dependent on consultants", "We''ll discover how bad things really are", "We''ll have to let people go"]', NULL, NULL, NULL, 'systems_fears', NULL, true, 14),
('systems_audit', 'sa_champion', 'Readiness', 'Who internally would champion this project?', 'single', '["Me - the founder/owner", "Finance manager/FD", "Operations manager", "Office manager", "IT lead", "We don''t have an obvious person"]', NULL, NULL, NULL, NULL, 'internal_champion', true, 15)
ON CONFLICT (service_line_code, question_id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  updated_at = now();

-- ============================================================================
-- 7. SEED FRACTIONAL EXECUTIVE QUESTIONS
-- ============================================================================

INSERT INTO assessment_questions (service_line_code, question_id, section, question_text, question_type, options, placeholder, char_limit, max_selections, emotional_anchor, technical_field, is_required, display_order) VALUES
-- Section 1: Why Now
('fractional_executive', 'fe_trigger', 'Why Now', 'What''s happening in your business that made you think "I need senior help"?', 'text', NULL, 'The trigger - funding round, growth spike, feeling out of depth, board pressure...', 400, NULL, 'executive_trigger', NULL, true, 1),
('fractional_executive', 'fe_situation', 'Why Now', 'Which statement best describes your current situation?', 'single', '["Growing fast - operations can''t keep up with sales", "Raising capital - need credibility and expertise", "Plateau''d - need strategic clarity to break through", "Struggling - need someone to help turn things around", "Acquiring/being acquired - need M&A experience", "Founder overwhelm - I''m doing everything and burning out"]', NULL, NULL, NULL, 'business_situation', NULL, true, 2),
('fractional_executive', 'fe_first_fix', 'Why Now', 'If you hired a full-time CFO or COO tomorrow, what would you ask them to fix first?', 'text', NULL, 'The most urgent problem you''d hand over...', 300, NULL, 'first_fix_priority', NULL, true, 3),
-- Section 2: Capacity Gap
('fractional_executive', 'fe_gap_areas', 'Capacity Gap', 'Which challenges are keeping you up at night? (Select all that apply)', 'multi', '["Don''t know if we''re actually making money", "Cash flow is unpredictable", "Can''t produce numbers investors would respect", "Don''t understand our unit economics", "Pricing feels like guesswork", "Financial controls are weak or non-existent", "Board reporting is painful and time-consuming", "We need to raise capital but aren''t ready", "Processes are chaos - nothing is documented", "We can''t deliver consistently as we grow", "Team structure doesn''t make sense anymore", "Too many fires to fight - no time for strategy", "We keep missing deadlines/targets", "Customer experience is inconsistent", "Tech systems don''t talk to each other", "I''m the bottleneck for everything"]', NULL, NULL, NULL, 'executive_gap_areas', NULL, true, 4),
('fractional_executive', 'fe_financial_leadership', 'Capacity Gap', 'Who currently handles strategic financial decisions in your business?', 'single', '["Me - I work it out myself", "My accountant - they give advice when asked", "A bookkeeper - they do numbers, not strategy", "A part-time FD - limited hours", "Nobody - we wing it", "We have someone but they''re not senior enough"]', NULL, NULL, NULL, NULL, 'financial_leadership_status', true, 5),
('fractional_executive', 'fe_operational_leadership', 'Capacity Gap', 'Who currently handles operational strategy and execution?', 'single', '["Me - I manage everything day-to-day", "Department heads - but no overall coordination", "An office/ops manager - but they''re not strategic", "Nobody - everyone just does their thing", "We have someone but they''re overwhelmed"]', NULL, NULL, NULL, NULL, 'operational_leadership_status', true, 6),
-- Section 3: Requirements
('fractional_executive', 'fe_priorities', 'Requirements', 'In the next 12 months, what''s most important to you? (Rank top 3)', 'multi', '["Raise investment funding", "Improve profitability", "Fix cash flow problems", "Scale operations for growth", "Prepare for exit/sale", "Improve board/investor reporting", "Implement financial controls", "Reduce founder dependency", "Build management team", "Sort out the mess"]', NULL, NULL, 3, NULL, 'twelve_month_priorities', true, 7),
('fractional_executive', 'fe_upcoming_events', 'Requirements', 'Do you have any of these coming up? (Select all that apply)', 'multi', '["Investment round in next 6 months", "Bank facility review/renewal", "Potential acquisition (us buying)", "Potential exit (us selling)", "Major contract negotiation", "System implementation", "Office move / expansion", "International expansion", "None of these"]', NULL, NULL, NULL, NULL, 'upcoming_events', true, 8),
('fractional_executive', 'fe_governance', 'Requirements', 'What does your board/investor reporting look like currently?', 'single', '["We have a board and report monthly - it''s robust", "We have a board but reporting is basic", "We have investors but no formal board", "No external stakeholders yet", "What board?"]', NULL, NULL, NULL, NULL, 'governance_maturity', true, 9),
-- Section 4: Engagement
('fractional_executive', 'fe_engagement_level', 'Engagement', 'How much support do you think you need?', 'single', '["Light touch - 2 days per month for strategic guidance", "Regular - 1 day per week for consistent involvement", "Heavy - 2-3 days per week, hands-on leadership", "Intensive - full-time equivalent for a project period", "I don''t know - help me figure this out"]', NULL, NULL, NULL, NULL, 'engagement_level_preference', true, 10),
('fractional_executive', 'fe_budget', 'Engagement', 'What''s your budget expectation for this kind of support?', 'single', '["Under £5k/month", "£5k-£10k/month", "£10k-£15k/month", "£15k+/month", "I don''t know what''s reasonable"]', NULL, NULL, NULL, NULL, 'budget_expectation', true, 11),
('fractional_executive', 'fe_success_vision', 'Engagement', 'What would make this engagement a success in your eyes?', 'text', NULL, 'Paint the picture - what''s different 12 months from now?', 400, NULL, 'success_vision', NULL, true, 12),
-- Section 5: Fit
('fractional_executive', 'fe_working_style', 'Fit', 'What''s your working style preference for this person?', 'multi', '["Directive - tell me what to do and I''ll execute", "Collaborative - work alongside me and my team", "Coaching - help me become better at this myself", "Hands-off - just fix things in the background", "Flexible - adapt to what''s needed"]', NULL, NULL, NULL, NULL, 'working_style_preference', true, 13),
('fractional_executive', 'fe_concerns', 'Fit', 'What''s your biggest concern about bringing in senior external help?', 'multi', '["Cost - is it worth it?", "Culture - will they understand us?", "Dependency - will we need them forever?", "Time - more of my time explaining things", "Authority - stepping on existing team members", "Exposure - they''ll see how bad things are", "Commitment - are they really invested in us?"]', NULL, NULL, NULL, 'external_help_concerns', NULL, true, 14)
ON CONFLICT (service_line_code, question_id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  updated_at = now();

-- ============================================================================
-- 8. VERIFICATION
-- ============================================================================

SELECT 
  service_line_code,
  COUNT(*) as question_count,
  COUNT(DISTINCT section) as section_count
FROM assessment_questions
WHERE is_active = true
GROUP BY service_line_code
ORDER BY service_line_code;

