-- ============================================================================
-- DISCOVERY ASSESSMENT V2.0
-- ============================================================================
-- Adds new columns for enhanced 40-question Discovery Assessment
-- New emotional anchor fields and detection pattern tracking
-- ============================================================================

-- Add new columns to destination_discovery table
ALTER TABLE destination_discovery 
ADD COLUMN IF NOT EXISTS dd_unlimited_change TEXT,
ADD COLUMN IF NOT EXISTS dd_emergency_log TEXT,
ADD COLUMN IF NOT EXISTS dd_last_real_break TEXT,
ADD COLUMN IF NOT EXISTS dd_relationship_mirror TEXT,
ADD COLUMN IF NOT EXISTS dd_sacrifice_list TEXT,
ADD COLUMN IF NOT EXISTS dd_magic_fix TEXT,
ADD COLUMN IF NOT EXISTS sd_manual_tasks TEXT[],
ADD COLUMN IF NOT EXISTS sd_competitive_position TEXT;

-- Create detection patterns table for tracking special patterns
CREATE TABLE IF NOT EXISTS discovery_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discovery_id UUID REFERENCES destination_discovery(id) ON DELETE CASCADE,
    client_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
    
    -- Burnout detection
    burnout_detected BOOLEAN DEFAULT FALSE,
    burnout_flags INTEGER DEFAULT 0,
    burnout_indicators JSONB DEFAULT '[]'::jsonb,
    
    -- Capital raising detection
    capital_raising_detected BOOLEAN DEFAULT FALSE,
    capital_signals JSONB DEFAULT '[]'::jsonb,
    
    -- Lifestyle transformation detection
    lifestyle_transformation_detected BOOLEAN DEFAULT FALSE,
    lifestyle_signals JSONB DEFAULT '[]'::jsonb,
    
    -- Urgency
    urgency_multiplier DECIMAL(3,2) DEFAULT 1.0,
    change_readiness TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(discovery_id)
);

-- Enable RLS
ALTER TABLE discovery_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for discovery_patterns
DROP POLICY IF EXISTS "Team members can view discovery patterns" ON discovery_patterns;
DROP POLICY IF EXISTS "Service role full access discovery_patterns" ON discovery_patterns;

CREATE POLICY "Team members can view discovery patterns" ON discovery_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            JOIN destination_discovery dd ON dd.id = discovery_patterns.discovery_id
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = dd.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

CREATE POLICY "Service role full access discovery_patterns" ON discovery_patterns
    FOR ALL USING (auth.role() = 'service_role');

-- Create service scoring triggers table for audit trail
CREATE TABLE IF NOT EXISTS discovery_service_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discovery_id UUID REFERENCES destination_discovery(id) ON DELETE CASCADE,
    service_code TEXT NOT NULL,
    trigger_source TEXT NOT NULL,  -- e.g., 'dd_weekly_hours', 'keyword:team'
    trigger_description TEXT NOT NULL,
    points_added INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE discovery_service_triggers ENABLE ROW LEVEL SECURITY;

-- RLS policies for discovery_service_triggers
DROP POLICY IF EXISTS "Team members can view service triggers" ON discovery_service_triggers;
DROP POLICY IF EXISTS "Service role full access service_triggers" ON discovery_service_triggers;

CREATE POLICY "Team members can view service triggers" ON discovery_service_triggers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            JOIN destination_discovery dd ON dd.id = discovery_service_triggers.discovery_id
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = dd.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

CREATE POLICY "Service role full access service_triggers" ON discovery_service_triggers
    FOR ALL USING (auth.role() = 'service_role');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_discovery_patterns_discovery_id ON discovery_patterns(discovery_id);
CREATE INDEX IF NOT EXISTS idx_discovery_patterns_client_id ON discovery_patterns(client_id);
CREATE INDEX IF NOT EXISTS idx_discovery_service_triggers_discovery_id ON discovery_service_triggers(discovery_id);
CREATE INDEX IF NOT EXISTS idx_discovery_service_triggers_service_code ON discovery_service_triggers(service_code);

-- ============================================================================
-- SEED ASSESSMENT QUESTIONS
-- ============================================================================
-- Clear existing discovery questions and insert the new 40-question set
-- NOTE: Disable any audit triggers temporarily to avoid practice_id reference errors

-- Temporarily disable triggers on assessment_questions
ALTER TABLE assessment_questions DISABLE TRIGGER ALL;

-- Clear existing discovery questions
DELETE FROM assessment_questions WHERE service_line_code IN ('destination_discovery', 'service_diagnostic');

-- PART 1: DESTINATION DISCOVERY (25 Questions)
-- Section 1: Your Destination (5 questions)

INSERT INTO assessment_questions (service_line_code, section, question_id, question_text, question_type, options, placeholder, char_limit, is_required, display_order, ai_anchor) VALUES

-- Q1.1 - The Tuesday Test
('destination_discovery', 'Your Destination', 'dd_five_year_vision', 
 'Picture yourself 5 years from now, and everything has worked out exactly as you hoped. Describe a typical TUESDAY in detail.',
 'text', NULL, 
 'Where are you? What time did you wake up? What are you doing? Who are you with? How do you feel? What do you NOT do anymore?',
 800, true, 1, 'five_year_vision'),

-- Q1.2 - Success Definition
('destination_discovery', 'Your Destination', 'dd_success_definition',
 'When you think about "success" for your business, which of these resonates MOST?',
 'single', 
 '["Building something I can sell for a life-changing amount", "Creating a business that runs profitably without me", "Growing to dominate my market/niche", "Having complete control over my time and income", "Building a legacy that outlasts me", "Something else entirely"]',
 NULL, NULL, true, 2, 'success_definition'),

-- Q1.3 - Non-Negotiables
('destination_discovery', 'Your Destination', 'dd_non_negotiables',
 'What are your NON-NEGOTIABLES for the next chapter of your life? (Select up to 4)',
 'multi',
 '["More time with family/loved ones", "Better health and energy", "Less day-to-day stress", "Financial security for retirement", "Doing work that excites me", "Geographic freedom / work from anywhere", "Building wealth beyond the business", "Making a real difference / impact", "Recognition and status in my field"]',
 NULL, NULL, true, 3, 'non_negotiables'),

-- Q1.4 - Unlimited Change
('destination_discovery', 'Your Destination', 'dd_unlimited_change',
 'If money was no object and you could change ONE thing about your business tomorrow, what would it be?',
 'text', NULL,
 'Don''t filter yourself - what would genuinely transform things?',
 400, true, 4, 'unlimited_change'),

-- Q1.5 - Exit Mindset
('destination_discovery', 'Your Destination', 'dd_exit_mindset',
 'When you think about eventually stepping back from the business, what comes to mind?',
 'single',
 '["I''ve already got a clear exit plan", "I think about it but haven''t planned", "I can''t imagine ever stopping", "I''d love to but can''t see how", "The thought terrifies me", "I''ve never really considered it"]',
 NULL, NULL, true, 5, 'exit_mindset'),

-- Section 2: Your Reality (7 questions)

-- Q2.1 - Weekly Hours
('destination_discovery', 'Your Reality', 'dd_weekly_hours',
 'Roughly how many hours do YOU work in a typical week? (Be honest)',
 'single',
 '["Under 30 hours", "30-40 hours", "40-50 hours", "50-60 hours", "60-70 hours", "70+ hours", "I''ve stopped counting"]',
 NULL, NULL, true, 6, 'weekly_hours'),

-- Q2.2 - Firefighting Ratio
('destination_discovery', 'Your Reality', 'dd_time_allocation',
 'Of your working hours, roughly what percentage is spent FIREFIGHTING vs. STRATEGIC work?',
 'single',
 '["90% firefighting / 10% strategic", "70% firefighting / 30% strategic", "50% firefighting / 50% strategic", "30% firefighting / 70% strategic", "10% firefighting / 90% strategic"]',
 NULL, NULL, true, 7, 'time_allocation'),

-- Q2.3 - Last Real Break
('destination_discovery', 'Your Reality', 'dd_last_real_break',
 'When did you last take 2+ weeks completely OFF? (No emails, no calls, no "just checking in")',
 'single',
 '["In the last 6 months", "6-12 months ago", "1-2 years ago", "More than 2 years ago", "I honestly can''t remember", "I''ve never done that"]',
 NULL, NULL, true, 8, 'last_real_break'),

-- Q2.4 - Emergency Log
('destination_discovery', 'Your Reality', 'dd_emergency_log',
 'Think about the last month. What "emergencies" pulled you away from important work - the 2am calls, the "only you can fix this" moments?',
 'text', NULL,
 'Be specific - what actually happened, who called, what broke...',
 400, true, 9, 'emergency_log'),

-- Q2.5 - Scaling Constraint
('destination_discovery', 'Your Reality', 'dd_scaling_constraint',
 'If you had to double your revenue next year, what would BREAK first?',
 'single',
 '["My personal capacity - I''m already maxed", "My team - we''re stretched thin", "Our systems and processes", "Quality would suffer", "Cash flow would be squeezed", "Nothing - we''re ready to scale"]',
 NULL, NULL, true, 10, 'scaling_constraint'),

-- Q2.6 - Sleep Thief
('destination_discovery', 'Your Reality', 'dd_sleep_thief',
 'What''s the ONE thing that keeps you awake at 3am?',
 'single',
 '["Cash flow and paying bills", "A specific client or project problem", "A team member situation", "Not knowing my numbers", "Fear of something going wrong that I can''t see coming", "Competition or market changes", "My own health or burnout", "Nothing - I sleep fine"]',
 NULL, NULL, true, 11, 'sleep_thief'),

-- Q2.7 - Core Frustration
('destination_discovery', 'Your Reality', 'dd_core_frustration',
 'Complete this sentence: "The thing that frustrates me MOST about my business right now is..."',
 'text', NULL,
 'Be specific - what really gets to you?',
 400, true, 12, 'core_frustration'),

-- Section 3: Your Team (5 questions)

-- Q3.1 - Key Person Risk
('destination_discovery', 'Your Team', 'dd_key_person_dependency',
 'If your best person handed in their notice tomorrow, what would happen?',
 'single',
 '["Disaster - the business would struggle badly", "Major disruption for 6+ months", "Significant pain but we''d cope", "We''d miss them but business would continue", "No single person is that critical", "N/A - it''s just me"]',
 NULL, NULL, true, 13, 'key_person_dependency'),

-- Q3.2 - People Challenge
('destination_discovery', 'Your Team', 'dd_people_challenge',
 'What''s your biggest PEOPLE challenge right now?',
 'single',
 '["Finding good people to hire", "Getting the best from current team", "Letting go of the wrong people", "Developing future leaders", "Managing performance consistently", "Team culture and morale", "No major people challenges"]',
 NULL, NULL, true, 14, 'people_challenge'),

-- Q3.3 - Delegation Honesty
('destination_discovery', 'Your Team', 'dd_delegation_ability',
 'Be honest: how good are you at REALLY delegating?',
 'single',
 '["Great - I focus on what only I can do", "Good - but I sometimes take things back", "Average - I delegate but then micromanage", "Poor - I struggle to let go", "Terrible - I end up doing everything myself"]',
 NULL, NULL, true, 15, 'delegation_ability'),

-- Q3.4 - Hidden From Team
('destination_discovery', 'Your Team', 'dd_hidden_from_team',
 'What does your team NOT know about the business that would surprise them?',
 'text', NULL,
 'The stuff you don''t share... the worries, the numbers, the plans...',
 400, false, 16, 'hidden_from_team'),

-- Q3.5 - External View
('destination_discovery', 'Your Team', 'dd_external_perspective',
 'If we asked your spouse/partner or best friend about your work-life balance, what would they REALLY say?',
 'single',
 '["They''d say I''ve got it figured out", "Mostly good with occasional frustrations", "They worry about me sometimes", "They''ve given up complaining", "It''s a significant source of tension", "They''d say I''m married to my business"]',
 NULL, NULL, true, 17, 'external_perspective'),

-- Section 4: Blind Spots (5 questions)

-- Q4.1 - Avoided Conversation
('destination_discovery', 'Blind Spots', 'dd_avoided_conversation',
 'What conversation have you been AVOIDING having?',
 'text', NULL,
 'With a team member, partner, customer, yourself...',
 400, false, 18, 'avoided_conversation'),

-- Q4.2 - Hard Truth
('destination_discovery', 'Blind Spots', 'dd_hard_truth',
 'What''s a hard truth about your business that you''ve been reluctant to face?',
 'text', NULL,
 'The thing you know but don''t want to admit...',
 400, false, 19, 'hard_truth'),

-- Q4.3 - Relationship Mirror
('destination_discovery', 'Blind Spots', 'dd_relationship_mirror',
 'Complete this sentence: "My relationship with my business feels like..."',
 'text', NULL,
 'A bad marriage I can''t leave? A needy child? An exciting puzzle? A ball and chain? A love affair gone stale?',
 300, true, 20, 'relationship_mirror'),

-- Q4.4 - Sacrifice List
('destination_discovery', 'Blind Spots', 'dd_sacrifice_list',
 'What have you given up or sacrificed for this business?',
 'text', NULL,
 'Time with family? Your health? Holidays? Hobbies? Friendships? Peace of mind?',
 400, true, 21, 'sacrifice_list'),

-- Q4.5 - Suspected Truth
('destination_discovery', 'Blind Spots', 'dd_suspected_truth',
 'Complete this: "If I really KNEW my numbers, I''d probably discover that..."',
 'text', NULL,
 'What do you suspect but haven''t confirmed?',
 300, false, 22, 'suspected_truth'),

-- Section 5: Moving Forward (3 questions)

-- Q5.1 - Magic Fix
('destination_discovery', 'Moving Forward', 'dd_magic_fix',
 'Wave a magic wand - what happens in your business in the next 90 days that would change everything?',
 'text', NULL,
 'Be specific - what''s the ONE thing that would transform your situation?',
 400, true, 23, 'magic_fix'),

-- Q5.2 - Change Readiness
('destination_discovery', 'Moving Forward', 'dd_change_readiness',
 'How ready are you to make REAL changes (even uncomfortable ones)?',
 'single',
 '["Completely ready - I''ll do whatever it takes", "Ready - as long as I understand the why", "Open - but I''ll need convincing", "Hesitant - change feels risky", "Resistant - I prefer how things are"]',
 NULL, NULL, true, 24, 'change_readiness'),

-- Q5.3 - Final Insight
('destination_discovery', 'Moving Forward', 'dd_final_insight',
 'If you could tell us ONE thing that would help us help you better, what would it be?',
 'text', NULL,
 'Anything we should know that we haven''t asked...',
 600, false, 25, 'final_insight'),

-- ============================================================================
-- PART 2: SERVICE DIAGNOSTICS (15 Questions)
-- ============================================================================

-- Section 1: Financial Clarity (3 questions)

-- SD Q1.1 - Financial Confidence
('service_diagnostic', 'Financial Clarity', 'sd_financial_confidence',
 'When you need to make a financial decision, how confident are you in your numbers?',
 'single',
 '["Very confident - I trust my data completely", "Fairly confident - most things are accurate", "Uncertain - I''m often surprised", "Not confident - I mostly guess", "I avoid financial decisions because I don''t trust the data"]',
 NULL, NULL, true, 26, 'financial_confidence'),

-- SD Q1.2 - Numbers Into Action
('service_diagnostic', 'Financial Clarity', 'sd_numbers_action_frequency',
 'How often do you look at management information and CHANGE something as a result?',
 'single',
 '["Weekly - I''m actively managing by the numbers", "Monthly - I review and adjust regularly", "Quarterly - when accounts come through", "Rarely - I don''t find them useful", "Never - I don''t get meaningful management information"]',
 NULL, NULL, true, 27, 'numbers_action_frequency'),

-- SD Q1.3 - Benchmark Awareness
('service_diagnostic', 'Financial Clarity', 'sd_benchmark_awareness',
 'Do you know how your financial performance compares to similar businesses?',
 'single',
 '["Yes - I regularly benchmark and know where I stand", "Roughly - I have a general sense", "No - I''d love to know but don''t have access", "Never considered it"]',
 NULL, NULL, true, 28, 'benchmark_awareness'),

-- Section 2: Operational Freedom (4 questions)

-- SD Q2.1 - Founder Dependency
('service_diagnostic', 'Operational Freedom', 'sd_founder_dependency',
 'If you disappeared for a month, what would happen to the business?',
 'single',
 '["It would run fine - I''m optional to daily operations", "Minor issues - but the team would cope", "Significant problems - but wouldn''t collapse", "Chaos - I''m essential to everything", "I honestly don''t know - never tested it"]',
 NULL, NULL, true, 29, 'founder_dependency'),

-- SD Q2.2 - Manual Work Percentage
('service_diagnostic', 'Operational Freedom', 'sd_manual_work_percentage',
 'How much of your team''s time goes into manual, repetitive work?',
 'single',
 '["Almost none - we''ve automated what we can", "Some - maybe 10-20%", "Significant - probably 30-50%", "Too much - over half our effort is manual", "I don''t know - never measured it"]',
 NULL, NULL, true, 30, 'manual_work_percentage'),

-- SD Q2.3 - Manual Tasks
('service_diagnostic', 'Operational Freedom', 'sd_manual_tasks',
 'Which of these manual tasks consume the most team time? (Select all that apply)',
 'multi',
 '["Data entry between systems", "Generating reports manually", "Processing invoices", "Chasing people (emails, follow-ups)", "Creating documents from scratch", "Approval workflows (getting sign-offs)", "Reconciling data between systems", "None of these - we''re highly automated"]',
 NULL, NULL, true, 31, 'manual_tasks'),

-- SD Q2.4 - Problem Awareness
('service_diagnostic', 'Operational Freedom', 'sd_problem_awareness_speed',
 'When something goes wrong, how quickly do you find out?',
 'single',
 '["Immediately - systems alert us", "Same day - someone notices", "Days later - when problems compound", "Often too late - when customers complain", "We''re often blindsided"]',
 NULL, NULL, true, 32, 'problem_awareness_speed'),

-- Section 3: Strategic Direction (3 questions)

-- SD Q3.1 - Plan Clarity
('service_diagnostic', 'Strategic Direction', 'sd_plan_clarity',
 'Do you have a clear, written plan for the next 12 months?',
 'single',
 '["Yes - and I review it regularly", "Sort of - I know what I want to achieve", "I have goals but not a real plan", "I''m too busy to plan", "I''ve given up on planning - things always change"]',
 NULL, NULL, true, 33, 'plan_clarity'),

-- SD Q3.2 - Accountability Source
('service_diagnostic', 'Strategic Direction', 'sd_accountability_source',
 'Who holds you accountable to your business goals?',
 'single',
 '["A formal board or advisory group", "A coach, mentor or peer group", "My business partner", "My spouse/family (informally)", "No one - just me"]',
 NULL, NULL, true, 34, 'accountability_source'),

-- SD Q3.3 - Growth Blocker
('service_diagnostic', 'Strategic Direction', 'sd_growth_blocker',
 'What''s the main thing stopping you from growing faster?',
 'single',
 '["Lack of clarity on where to focus", "Not enough leads or customers", "Can''t deliver more without breaking things", "Don''t have the right people", "Don''t have the capital", "Market conditions / external factors", "Nothing - we''re growing as planned"]',
 NULL, NULL, true, 35, 'growth_blocker'),

-- Section 4: Exit & Protection (3 questions)

-- SD Q4.1 - Documentation Readiness
('service_diagnostic', 'Exit & Protection', 'sd_documentation_readiness',
 'If someone offered to buy your business tomorrow, could you produce documentation within 48 hours?',
 'single',
 '["Yes - we''re investment-ready", "Probably - most things are documented", "It would take weeks to pull together", "Months - things are scattered everywhere", "I don''t know where I''d even start"]',
 NULL, NULL, true, 36, 'documentation_readiness'),

-- SD Q4.2 - Valuation Understanding
('service_diagnostic', 'Exit & Protection', 'sd_valuation_understanding',
 'Do you have a clear understanding of what your business is worth?',
 'single',
 '["Yes - I''ve had a professional valuation", "Roughly - I have a sense of the multiple", "No idea - it''s never come up", "I try not to think about it"]',
 NULL, NULL, true, 37, 'valuation_understanding'),

-- SD Q4.3 - Exit Timeline
('service_diagnostic', 'Exit & Protection', 'sd_exit_timeline',
 'What''s your ideal exit timeline?',
 'single',
 '["Already exploring options", "1-3 years - actively preparing", "3-5 years - need to start thinking", "5-10 years - distant horizon", "Never - I''ll run this forever", "No exit plan - haven''t thought about it"]',
 NULL, NULL, true, 38, 'exit_timeline'),

-- Section 5: Competitive Position (2 questions)

-- SD Q5.1 - Competitive Awareness
('service_diagnostic', 'Competitive Position', 'sd_competitive_position',
 'How do you feel about your competitive position in your market?',
 'single',
 '["We''re the clear market leader", "We''re competitive - holding our own", "We''re losing ground to competitors", "I don''t really know how we compare", "We don''t have direct competitors"]',
 NULL, NULL, true, 39, 'competitive_position'),

-- SD Q5.2 - Operational Frustration
('service_diagnostic', 'Competitive Position', 'sd_operational_frustration',
 'What''s your biggest operational frustration right now?',
 'text', NULL,
 'The thing that makes you think ''why is this so hard?''',
 300, true, 40, 'operational_frustration');

-- Add is_active column if not exists
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure all new questions are active
UPDATE assessment_questions SET is_active = true WHERE service_line_code IN ('destination_discovery', 'service_diagnostic');

-- Re-enable triggers on assessment_questions
ALTER TABLE assessment_questions ENABLE TRIGGER ALL;

