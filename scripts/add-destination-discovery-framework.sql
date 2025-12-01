-- ============================================================================
-- DESTINATION-FIRST DISCOVERY FRAMEWORK
-- ============================================================================
-- Complete service line mapping with destination discovery and diagnostics
-- "Sell the destination, not the plane"
-- ============================================================================

-- ============================================================================
-- 1. EXPAND SERVICE LINES TO ALL 9
-- ============================================================================

-- Clear existing service lines and add all 9
DELETE FROM service_lines WHERE code NOT IN ('365_method', 'hidden_value_audit');

INSERT INTO service_lines (code, name, short_description, full_description, icon, base_pricing, display_order, is_active) VALUES
-- Week 1 Ready
('365_method', '365 Alignment Programme', 
  'Life-first business transformation with strategic clarity and accountability',
  'A 12-month programme that starts with your life goals and works backwards to create a business that serves you. 5-year vision, 6-month shift, 12-week sprints.',
  'Target', '{"monthly": 5000, "annual": 50000}', 1, true),

('fractional_cfo', 'Fractional CFO Services',
  'Strategic financial leadership without the full-time cost',
  'Senior CFO expertise for cash flow management, investor readiness, financial strategy, and board-level reporting. Get the financial clarity and control you need.',
  'TrendingUp', '{"light": 3500, "regular": 6000, "intensive": 12000}', 2, true),

('systems_audit', 'Systems Audit',
  'Identify and fix the operational bottlenecks holding you back',
  'Comprehensive review of your tech stack, processes, and integrations. Find the manual workarounds and data silos, then get a clear roadmap to fix them.',
  'Settings', '{"single_area": 7500, "two_areas": 12000, "comprehensive": 18000, "monthly_retainer": 3000}', 3, true),

('management_accounts', 'Management Accounts',
  'Monthly financial visibility that drives better decisions',
  'P&L, Balance Sheet, KPI Commentary, Cash Flow Waterfall, and Spotlight Analysis. Know exactly where you stand every month.',
  'LineChart', '{"monthly": 650, "quarterly": 1750}', 4, true),

-- Week 2-3 Ready
('combined_advisory', 'Combined CFO/COO Advisory',
  'Executive partnership covering both financial and operational strategy',
  'For businesses that need both strategic financial oversight AND operational excellence. Board-level thinking without board-level cost.',
  'Users', '{"monthly": 8000, "intensive": 15000}', 5, true),

('fractional_coo', 'Fractional COO Services',
  'Operational leadership to build systems that run without you',
  'Senior COO expertise for process documentation, team structure, capacity planning, and operational excellence. Build a business that doesnt depend on you.',
  'Cog', '{"light": 3000, "regular": 5500, "intensive": 10000}', 6, true),

-- Week 2-4 Development
('business_advisory', 'Business Advisory & Exit Planning',
  'Protect and maximise the value youve built',
  'Strategic advisory for succession planning, business valuation, exit preparation, and value maximisation. Whether youre exiting in 2 years or 20.',
  'Shield', '{"monthly": 9000, "project": 25000}', 7, true),

('automation', 'Automation Services',
  'Eliminate manual work and unlock your teams potential',
  'Identify automation opportunities, implement solutions, and free your team from repetitive tasks. More output, less effort.',
  'Zap', '{"assessment": 2500, "implementation": 10000, "monthly": 1500}', 8, true),

-- Month 2 Development
('benchmarking', 'Benchmarking Services',
  'Know exactly how you compare to your industry peers',
  'Comprehensive performance benchmarking with strategic interpretation. Understand where youre ahead, where youre behind, and what to prioritise.',
  'BarChart3', '{"quarterly": 2000, "annual": 6000}', 9, true)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  icon = EXCLUDED.icon,
  base_pricing = EXCLUDED.base_pricing,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- ============================================================================
-- 2. DESTINATION DISCOVERY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS destination_discovery (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id uuid,
    responses jsonb NOT NULL DEFAULT '{}',
    extracted_anchors jsonb DEFAULT '{}',  -- Their emotional words
    destination_clarity_score integer,  -- 1-10
    gap_score integer,  -- 1-10  
    recommended_services jsonb,  -- Scored recommendations
    value_propositions jsonb,  -- Generated VPs using their words
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_destination_discovery_client ON destination_discovery(client_id);

ALTER TABLE destination_discovery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can manage discovery" ON destination_discovery
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

CREATE POLICY "Clients can manage own discovery" ON destination_discovery
  FOR ALL USING (
    client_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'client'
    )
  );

-- ============================================================================
-- 3. DESTINATION DISCOVERY QUESTIONS (20 Questions)
-- ============================================================================

INSERT INTO assessment_questions (service_line_code, question_id, section, question_text, question_type, options, placeholder, char_limit, max_selections, emotional_anchor, technical_field, is_required, display_order) VALUES

-- Section 1: The Dream (5 questions)
('destination_discovery', 'dd_five_year_story', 'The Dream', 'Imagine its 5 years from now and everything has gone RIGHT. Describe a typical day in your life.', 'text', NULL, 'Paint the picture - where are you? What are you doing? Who are you with? How do you feel?', 600, NULL, 'five_year_vision', NULL, true, 1),
('destination_discovery', 'dd_biggest_change', 'The Dream', 'Whats the SINGLE biggest thing that needs to change for that vision to become reality?', 'text', NULL, 'Be specific - whats the one thing?', 300, NULL, 'biggest_change_needed', NULL, true, 2),
('destination_discovery', 'dd_destination_words', 'The Dream', 'Complete this sentence: "In 5 years, I want to be known as someone who..."', 'text', NULL, 'How do you want to be seen?', 200, NULL, 'identity_aspiration', NULL, true, 3),
('destination_discovery', 'dd_freed_time', 'The Dream', 'If you had 20 extra hours a week, what would you actually DO with that time?', 'text', NULL, 'Be honest - work, family, hobbies, rest?', 300, NULL, 'freed_time_vision', NULL, true, 4),
('destination_discovery', 'dd_success_feeling', 'The Dream', 'When you imagine achieving your goals, what FEELING are you chasing?', 'single', '["Freedom - to do what I want, when I want", "Security - knowing my family is protected", "Pride - proving what I can achieve", "Peace - no more stress and anxiety", "Impact - making a difference to others", "Recognition - being respected in my field", "Balance - enjoying all parts of my life"]', NULL, NULL, NULL, 'core_feeling_desired', NULL, true, 5),

-- Section 2: The Gap (5 questions)
('destination_discovery', 'dd_current_reality', 'The Gap', 'How would you honestly describe where you are RIGHT NOW vs where you want to be?', 'single', '["Close - I can see the path clearly", "Halfway - making progress but its slow", "Far away - I know where I want to go but not how", "Lost - I dont even know what I want anymore", "Stuck - I keep trying but nothing changes"]', NULL, NULL, NULL, 'current_gap_assessment', NULL, true, 6),
('destination_discovery', 'dd_main_obstacle', 'The Gap', 'Whats the MAIN thing standing between you and your vision?', 'single', '["Time - I dont have enough hours", "Money - I need more revenue/profit", "People - I dont have the right team", "Knowledge - I dont know HOW to get there", "Me - I get in my own way", "Clarity - I dont know what to focus on", "Energy - Im too exhausted to push forward"]', NULL, NULL, NULL, 'primary_obstacle', NULL, true, 7),
('destination_discovery', 'dd_tried_before', 'The Gap', 'What have you already tried to close this gap?', 'multi', '["Hired a coach or mentor", "Read books and courses", "Worked harder/longer hours", "Hired more staff", "Implemented new systems", "Changed my business model", "Nothing - I havent known where to start", "Given up and accepted the status quo"]', NULL, NULL, NULL, 'previous_attempts', NULL, true, 8),
('destination_discovery', 'dd_why_not_worked', 'The Gap', 'Why do you think those attempts havent fully worked?', 'text', NULL, 'Be honest - what went wrong or what was missing?', 400, NULL, 'failure_insight', NULL, true, 9),
('destination_discovery', 'dd_cost_of_staying', 'The Gap', 'If nothing changes in the next 3 years, whats that going to cost you?', 'text', NULL, 'Think beyond money - health, relationships, opportunities, dreams...', 400, NULL, 'cost_of_inaction', NULL, true, 10),

-- Section 3: The Tuesday Test (5 questions)
('destination_discovery', 'dd_tuesday_wake', 'Tuesday Reality', 'Think about last Tuesday at 7am. What was your first thought when you woke up?', 'text', NULL, 'Be honest - what was on your mind?', 200, NULL, 'tuesday_first_thought', NULL, true, 11),
('destination_discovery', 'dd_tuesday_frustration', 'Tuesday Reality', 'What frustrated you most last Tuesday?', 'text', NULL, 'The thing that made you think "why is this so hard?"', 300, NULL, 'tuesday_frustration', NULL, true, 12),
('destination_discovery', 'dd_tuesday_question', 'Tuesday Reality', 'What question kept coming up that you couldnt easily answer?', 'text', NULL, 'The thing you needed to know but didnt', 200, NULL, 'tuesday_unanswered', NULL, true, 13),
('destination_discovery', 'dd_tuesday_magic', 'Tuesday Reality', 'If you could magic away ONE thing from your typical Tuesday, what would it be?', 'text', NULL, 'The task, person, or situation you wish would just disappear', 200, NULL, 'tuesday_magic_wand', NULL, true, 14),
('destination_discovery', 'dd_tuesday_energy', 'Tuesday Reality', 'By 6pm last Tuesday, how did you feel?', 'single', '["Energised - I love what I do", "Satisfied - a good productive day", "Tired but good - normal day", "Drained - nothing left in the tank", "Frustrated - spinning wheels", "Anxious - still worrying about work"]', NULL, NULL, NULL, 'tuesday_end_state', NULL, true, 15),

-- Section 4: The Real Question (5 questions)
('destination_discovery', 'dd_honest_priority', 'The Real Question', 'If you could only fix ONE aspect of your business/life this year, what would have the biggest impact?', 'single', '["Financial clarity and control", "My business running without me", "Strategic direction and accountability", "Growing without growing problems", "Protecting what Ive built", "Better work-life balance", "Something else"]', NULL, NULL, NULL, 'single_priority', NULL, true, 16),
('destination_discovery', 'dd_investment_comfort', 'The Real Question', 'Whats your honest comfort level for investing in solving this?', 'single', '["Under £1,000/month", "£1,000-£3,000/month", "£3,000-£5,000/month", "£5,000-£10,000/month", "Over £10,000/month", "Whatever it takes if the ROI is clear"]', NULL, NULL, NULL, 'investment_capacity', NULL, true, 17),
('destination_discovery', 'dd_timeline_urgency', 'The Real Question', 'How urgently do you need to see change?', 'single', '["Critical - I cant continue like this", "Important - within the next 3 months", "Significant - within the next 6 months", "Moderate - sometime this year", "Low - whenever the time is right"]', NULL, NULL, NULL, 'urgency_level', NULL, true, 18),
('destination_discovery', 'dd_decision_blocker', 'The Real Question', 'Whats the main thing that would stop you from getting help with this?', 'single', '["Cost - I need to see clear ROI", "Trust - I need to know you understand my business", "Time - I dont have capacity to implement change", "Past experience - Ive been burned before", "Control - I struggle to delegate", "Nothing - Im ready to move"]', NULL, NULL, NULL, 'decision_blocker', NULL, true, 19),
('destination_discovery', 'dd_anything_else', 'The Real Question', 'Is there anything else you want us to know before we recommend a path forward?', 'text', NULL, 'Anything we havent asked that matters...', 500, NULL, 'additional_context', NULL, false, 20)

ON CONFLICT (service_line_code, question_id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  placeholder = EXCLUDED.placeholder,
  updated_at = now();

-- ============================================================================
-- 4. SERVICE DIAGNOSTIC QUESTIONS (15 Questions)
-- ============================================================================

INSERT INTO assessment_questions (service_line_code, question_id, section, question_text, question_type, options, placeholder, char_limit, max_selections, emotional_anchor, technical_field, is_required, display_order) VALUES

-- Financial Clarity Diagnostic (3 questions)
('service_diagnostic', 'sd_financial_confidence', 'Financial Clarity', 'When you need to make a financial decision, how confident are you in your numbers?', 'single', '["Very confident - I trust my data completely", "Fairly confident - most things are accurate", "Uncertain - Im often surprised", "Not confident - I mostly guess", "I avoid financial decisions because I dont trust the data"]', NULL, NULL, NULL, 'financial_confidence', 'maps_management_accounts,maps_fractional_cfo', true, 1),
('service_diagnostic', 'sd_numbers_action', 'Financial Clarity', 'How often do you look at management information and CHANGE something as a result?', 'single', '["Weekly - Im actively managing by the numbers", "Monthly - I review and adjust regularly", "Quarterly - when accounts come through", "Rarely - I dont find them useful", "Never - I dont get meaningful management information"]', NULL, NULL, NULL, 'numbers_action_frequency', 'maps_management_accounts', true, 2),
('service_diagnostic', 'sd_benchmark_awareness', 'Financial Clarity', 'Do you know how your financial performance compares to similar businesses?', 'single', '["Yes - I regularly benchmark and know where I stand", "Roughly - I have a general sense", "No - Id love to know but dont have access", "Never considered it"]', NULL, NULL, NULL, 'benchmark_awareness', 'maps_benchmarking', true, 3),

-- Operational Freedom Diagnostic (3 questions)
('service_diagnostic', 'sd_founder_dependency', 'Operational Freedom', 'If you disappeared for a month, what would happen to the business?', 'single', '["It would run fine - Im optional to daily operations", "Minor issues - but the team would cope", "Significant problems - but wouldnt collapse", "Chaos - Im essential to everything", "I honestly dont know - never tested it"]', NULL, NULL, NULL, 'founder_dependency', 'maps_systems_audit,maps_fractional_coo', true, 4),
('service_diagnostic', 'sd_manual_work', 'Operational Freedom', 'How much of your teams time goes into manual, repetitive work?', 'single', '["Almost none - weve automated what we can", "Some - maybe 10-20%", "Significant - probably 30-50%", "Too much - over half our effort is manual", "I dont know - never measured it"]', NULL, NULL, NULL, 'manual_work_percentage', 'maps_automation,maps_systems_audit', true, 5),
('service_diagnostic', 'sd_problem_awareness', 'Operational Freedom', 'When something goes wrong, how quickly do you find out?', 'single', '["Immediately - systems alert us", "Same day - someone notices", "Days later - when problems compound", "Often too late - when customers complain", "Were often blindsided"]', NULL, NULL, NULL, 'problem_awareness_speed', 'maps_systems_audit', true, 6),

-- Strategic Direction Diagnostic (3 questions)
('service_diagnostic', 'sd_plan_clarity', 'Strategic Direction', 'Do you have a clear, written plan for the next 12 months?', 'single', '["Yes - and I review it regularly", "Sort of - I know what I want to achieve", "I have goals but not a real plan", "Im too busy to plan", "Ive given up on planning - things always change"]', NULL, NULL, NULL, 'plan_clarity', 'maps_365_method', true, 7),
('service_diagnostic', 'sd_accountability', 'Strategic Direction', 'Who holds you accountable to your business goals?', 'single', '["A formal board or advisory group", "A coach, mentor or peer group", "My business partner", "My spouse/family (informally)", "No one - just me"]', NULL, NULL, NULL, 'accountability_source', 'maps_365_method,maps_combined_advisory', true, 8),
('service_diagnostic', 'sd_decision_partner', 'Strategic Direction', 'When you face a major business decision, who do you talk it through with?', 'single', '["A trusted advisor who understands my business", "Other business owners in similar situations", "Friends or family (not business experts)", "I figure it out myself", "I avoid major decisions"]', NULL, NULL, NULL, 'decision_support', 'maps_combined_advisory,maps_fractional_cfo', true, 9),

-- Growth Readiness Diagnostic (3 questions)
('service_diagnostic', 'sd_growth_blocker', 'Growth Readiness', 'Whats the main thing stopping you from growing faster?', 'single', '["Lack of clarity on where to focus", "Not enough leads/customers", "Cant deliver more without breaking", "Dont have the right people", "Dont have the capital", "Im not sure I want to grow faster", "Something else"]', NULL, NULL, NULL, 'growth_blocker', 'maps_multiple', true, 10),
('service_diagnostic', 'sd_double_revenue', 'Growth Readiness', 'If revenue doubled next year, what would break first?', 'single', '["Financial systems and controls", "Operational processes", "Team capacity", "My personal capacity", "Quality would suffer", "Nothing - were ready to scale"]', NULL, NULL, NULL, 'scaling_vulnerability', 'maps_multiple', true, 11),
('service_diagnostic', 'sd_operational_frustration', 'Growth Readiness', 'Whats your biggest operational frustration right now?', 'text', NULL, 'The thing that makes you think "why is this so hard?"', 300, NULL, 'operational_frustration', 'maps_multiple', true, 12),

-- Exit & Protection Diagnostic (3 questions)
('service_diagnostic', 'sd_exit_readiness', 'Exit & Protection', 'If someone offered to buy your business tomorrow, could you produce documentation within 48 hours?', 'single', '["Yes - were investment-ready", "Probably - most things are documented", "It would take weeks to pull together", "Months - things are scattered", "I dont know where to start"]', NULL, NULL, NULL, 'documentation_readiness', 'maps_business_advisory', true, 13),
('service_diagnostic', 'sd_valuation_clarity', 'Exit & Protection', 'Do you have a clear understanding of what your business is worth?', 'single', '["Yes - Ive had a professional valuation", "Roughly - I have a sense of the multiple", "No idea - its never come up", "I try not to think about it"]', NULL, NULL, NULL, 'valuation_understanding', 'maps_business_advisory', true, 14),
('service_diagnostic', 'sd_exit_timeline', 'Exit & Protection', 'Whats your ideal exit timeline?', 'single', '["Already exploring options", "1-3 years - actively preparing", "3-5 years - need to start thinking", "5-10 years - distant horizon", "Never - Ill run this forever", "Build to sell even if I never do"]', NULL, NULL, NULL, 'exit_timeline', 'maps_business_advisory', true, 15)

ON CONFLICT (service_line_code, question_id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  placeholder = EXCLUDED.placeholder,
  updated_at = now();

-- ============================================================================
-- 5. SERVICE SCORING WEIGHTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_scoring_weights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id text NOT NULL,
    response_value text NOT NULL,
    service_code text NOT NULL REFERENCES service_lines(code),
    weight integer NOT NULL DEFAULT 1,  -- 1-5 scale
    created_at timestamptz DEFAULT now()
);

-- Scoring weights for each response → service mapping
-- Financial Clarity → Management Accounts, Fractional CFO, Benchmarking
INSERT INTO service_scoring_weights (question_id, response_value, service_code, weight) VALUES
('sd_financial_confidence', 'Uncertain - Im often surprised', 'management_accounts', 3),
('sd_financial_confidence', 'Not confident - I mostly guess', 'management_accounts', 5),
('sd_financial_confidence', 'I avoid financial decisions because I dont trust the data', 'management_accounts', 5),
('sd_financial_confidence', 'Uncertain - Im often surprised', 'fractional_cfo', 2),
('sd_financial_confidence', 'Not confident - I mostly guess', 'fractional_cfo', 3),
('sd_numbers_action', 'Rarely - I dont find them useful', 'management_accounts', 4),
('sd_numbers_action', 'Never - I dont get meaningful management information', 'management_accounts', 5),
('sd_benchmark_awareness', 'No - Id love to know but dont have access', 'benchmarking', 5),
('sd_benchmark_awareness', 'Never considered it', 'benchmarking', 3),

-- Operational Freedom → Systems Audit, Automation, Fractional COO
('sd_founder_dependency', 'Chaos - Im essential to everything', 'systems_audit', 5),
('sd_founder_dependency', 'Chaos - Im essential to everything', 'fractional_coo', 4),
('sd_founder_dependency', 'Significant problems - but wouldnt collapse', 'systems_audit', 3),
('sd_manual_work', 'Too much - over half our effort is manual', 'automation', 5),
('sd_manual_work', 'Significant - probably 30-50%', 'automation', 3),
('sd_manual_work', 'Too much - over half our effort is manual', 'systems_audit', 3),
('sd_problem_awareness', 'Often too late - when customers complain', 'systems_audit', 4),
('sd_problem_awareness', 'Were often blindsided', 'systems_audit', 5),

-- Strategic Direction → 365 Method, Combined Advisory
('sd_plan_clarity', 'I have goals but not a real plan', '365_method', 4),
('sd_plan_clarity', 'Im too busy to plan', '365_method', 5),
('sd_plan_clarity', 'Ive given up on planning - things always change', '365_method', 5),
('sd_accountability', 'No one - just me', '365_method', 5),
('sd_accountability', 'My spouse/family (informally)', '365_method', 3),
('sd_decision_partner', 'I figure it out myself', 'combined_advisory', 4),
('sd_decision_partner', 'I avoid major decisions', 'combined_advisory', 5),
('sd_decision_partner', 'I figure it out myself', 'fractional_cfo', 3),

-- Growth Readiness → Multiple
('sd_growth_blocker', 'Lack of clarity on where to focus', '365_method', 4),
('sd_growth_blocker', 'Cant deliver more without breaking', 'systems_audit', 5),
('sd_growth_blocker', 'Cant deliver more without breaking', 'fractional_coo', 4),
('sd_growth_blocker', 'Dont have the right people', 'fractional_coo', 5),
('sd_growth_blocker', 'Dont have the capital', 'fractional_cfo', 5),
('sd_growth_blocker', 'Dont have the capital', 'business_advisory', 3),
('sd_double_revenue', 'Financial systems and controls', 'management_accounts', 4),
('sd_double_revenue', 'Financial systems and controls', 'fractional_cfo', 3),
('sd_double_revenue', 'Operational processes', 'systems_audit', 5),
('sd_double_revenue', 'Team capacity', 'fractional_coo', 4),
('sd_double_revenue', 'My personal capacity', '365_method', 4),

-- Exit & Protection → Business Advisory
('sd_exit_readiness', 'Months - things are scattered', 'business_advisory', 4),
('sd_exit_readiness', 'I dont know where to start', 'business_advisory', 5),
('sd_valuation_clarity', 'No idea - its never come up', 'business_advisory', 4),
('sd_valuation_clarity', 'I try not to think about it', 'business_advisory', 5),
('sd_exit_timeline', '1-3 years - actively preparing', 'business_advisory', 5),
('sd_exit_timeline', '3-5 years - need to start thinking', 'business_advisory', 4),
('sd_exit_timeline', 'Build to sell even if I never do', 'business_advisory', 3);

-- ============================================================================
-- 6. UPDATE CLIENT_INVITATIONS FOR DISCOVERY
-- ============================================================================

ALTER TABLE client_invitations
  ADD COLUMN IF NOT EXISTS include_discovery boolean DEFAULT false;

COMMENT ON COLUMN client_invitations.include_discovery IS 'If true, client starts with Destination Discovery questionnaire';

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

SELECT 'Service Lines' as type, COUNT(*) as count FROM service_lines WHERE is_active = true
UNION ALL
SELECT 'Discovery Questions', COUNT(*) FROM assessment_questions WHERE service_line_code = 'destination_discovery'
UNION ALL
SELECT 'Diagnostic Questions', COUNT(*) FROM assessment_questions WHERE service_line_code = 'service_diagnostic'
UNION ALL
SELECT 'Scoring Weights', COUNT(*) FROM service_scoring_weights;

