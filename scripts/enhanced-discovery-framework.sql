-- ============================================================================
-- ENHANCED DISCOVERY FRAMEWORK FOR EXISTING CLIENTS
-- ============================================================================
-- Focus: Uncover what you DON'T know about existing clients
-- NOT asking: Revenue, profit, basic financials (you already have these)
-- ASKING: Emotions, aspirations, hidden frustrations, operational reality
-- ============================================================================

-- ============================================================================
-- 1. REFINED DISCOVERY QUESTIONS (25 Questions)
-- ============================================================================

-- Clear existing questions and insert refined set
DELETE FROM assessment_questions WHERE service_line_code = 'destination_discovery';

INSERT INTO assessment_questions (service_line_code, question_id, section, question_text, question_type, options, placeholder, char_limit, max_selections, emotional_anchor, technical_field, is_required, display_order) VALUES

-- ============================================================================
-- SECTION 1: YOUR DESTINATION (5 questions) - Where they WANT to be
-- ============================================================================
('destination_discovery', 'dd_five_year_picture', 'Your Destination', 
 'Picture yourself 5 years from now, and everything has worked out exactly as you hoped. Describe a typical TUESDAY in detail.',
 'text', NULL, 
 'Where are you? What time did you wake up? What are you doing? Who are you with? How do you feel?', 
 800, NULL, 'five_year_vision', NULL, true, 1),

('destination_discovery', 'dd_success_definition', 'Your Destination', 
 'When you think about "success" for your business, which of these resonates MOST?',
 'single', 
 '["Building something I can sell for a life-changing amount", "Creating a business that runs profitably without me", "Growing to dominate my market/niche", "Having complete control over my time and income", "Building a legacy that outlasts me", "Simply enjoying what I do without constant stress"]', 
 NULL, NULL, NULL, 'success_definition', NULL, true, 2),

('destination_discovery', 'dd_non_negotiables', 'Your Destination', 
 'What are your NON-NEGOTIABLES for the next chapter of your life? (Select all that apply)',
 'multi', 
 '["More time with family/loved ones", "Better health and energy", "Less day-to-day stress", "Financial security for retirement", "Doing work that excites me", "Recognition for what I''ve built", "More holidays and time off", "Handing over to the next generation", "Making a bigger impact/difference"]', 
 NULL, NULL, 4, 'non_negotiables', NULL, true, 3),

('destination_discovery', 'dd_what_would_change', 'Your Destination', 
 'If money was no object and you could change ONE thing about your business tomorrow, what would it be?',
 'text', NULL, 
 'Don''t filter yourself - what would genuinely transform things?', 
 400, NULL, 'unlimited_change', NULL, true, 4),

('destination_discovery', 'dd_exit_thoughts', 'Your Destination', 
 'When you think about eventually stepping back from the business, what comes to mind?',
 'single', 
 '["I''ve already got a clear exit plan", "I think about it but haven''t planned", "I can''t imagine ever stopping", "I''d love to but can''t see how", "The thought terrifies me", "I''m actively looking to exit soon"]', 
 NULL, NULL, NULL, 'exit_mindset', NULL, true, 5),

-- ============================================================================
-- SECTION 2: YOUR REALITY (7 questions) - What's ACTUALLY happening
-- ============================================================================
('destination_discovery', 'dd_honest_assessment', 'Your Reality', 
 'If you were being BRUTALLY honest with yourself, how close are you to your vision?',
 'single', 
 '["Almost there - just need to fine-tune", "Making good progress - can see the path", "Halfway - some things working, some not", "Stuck - feel like I''m spinning wheels", "Going backwards - things are getting harder", "Lost - I''m not even sure what I want anymore"]', 
 NULL, NULL, NULL, 'reality_assessment', NULL, true, 6),

('destination_discovery', 'dd_owner_hours', 'Your Reality', 
 'Roughly how many hours do YOU work in a typical week? (Be honest)',
 'single', 
 '["Under 30 hours", "30-40 hours", "40-50 hours", "50-60 hours", "60-70 hours", "70+ hours", "It varies wildly week to week"]', 
 NULL, NULL, NULL, 'weekly_hours', NULL, true, 7),

('destination_discovery', 'dd_time_breakdown', 'Your Reality', 
 'Of your working hours, roughly what percentage is spent FIREFIGHTING vs. STRATEGIC work?',
 'single', 
 '["90% firefighting / 10% strategic", "70% firefighting / 30% strategic", "50% firefighting / 50% strategic", "30% firefighting / 70% strategic", "10% firefighting / 90% strategic"]', 
 NULL, NULL, NULL, 'time_allocation', NULL, true, 8),

('destination_discovery', 'dd_holiday_reality', 'Your Reality', 
 'When did you last take 2+ weeks completely OFF (no emails, no calls, no "just checking in")?',
 'single', 
 '["In the last 6 months", "6-12 months ago", "1-2 years ago", "More than 2 years ago", "I honestly can''t remember", "I''ve never done that"]', 
 NULL, NULL, NULL, 'last_real_break', NULL, true, 9),

('destination_discovery', 'dd_what_breaks_first', 'Your Reality', 
 'If you had to double your revenue next year, what would BREAK first?',
 'single', 
 '["My personal capacity - I''m already maxed", "My team - we''re stretched thin", "Our systems and processes", "Quality would suffer", "Cash flow would be squeezed", "Actually, we could handle it"]', 
 NULL, NULL, NULL, 'scaling_constraint', NULL, true, 10),

('destination_discovery', 'dd_sleep_thief', 'Your Reality', 
 'What keeps you awake at 3am? (Select up to 2)',
 'multi', 
 '["Cash flow and paying bills", "A specific client or project", "A team member situation", "Not knowing the numbers", "Fear of something going wrong", "Worry about the future", "Nothing - I sleep fine", "Too many things to list"]', 
 NULL, NULL, 2, 'sleep_thieves', NULL, true, 11),

('destination_discovery', 'dd_biggest_frustration', 'Your Reality', 
 'Complete this sentence: "The thing that frustrates me MOST about my business right now is..."',
 'text', NULL, 
 'Be specific - what really gets to you?', 
 400, NULL, 'core_frustration', NULL, true, 12),

-- ============================================================================
-- SECTION 3: YOUR TEAM & PEOPLE (5 questions) - The human side
-- ============================================================================
('destination_discovery', 'dd_team_confidence', 'Your Team', 
 'If you had to rate your confidence in your current team (1-10), what would you give?',
 'single', 
 '["1-3: Major concerns", "4-5: Some good people but significant gaps", "6-7: Solid team but room for improvement", "8-9: Strong team I trust", "10: Dream team - couldn''t be better", "N/A: It''s just me"]', 
 NULL, NULL, NULL, 'team_confidence', NULL, true, 13),

('destination_discovery', 'dd_key_person_risk', 'Your Team', 
 'If your best person handed in their notice tomorrow, what would happen?',
 'single', 
 '["Disaster - the business would struggle badly", "Major disruption for 6+ months", "Significant pain but we''d cope", "We''d miss them but business would continue", "No single person is that critical", "I''m the key person risk"]', 
 NULL, NULL, NULL, 'key_person_dependency', NULL, true, 14),

('destination_discovery', 'dd_people_challenge', 'Your Team', 
 'What''s your biggest PEOPLE challenge right now?',
 'single', 
 '["Finding good people to hire", "Getting the best from current team", "Letting go of the wrong people", "Developing future leaders", "Managing performance", "Team morale/culture", "No major people challenges"]', 
 NULL, NULL, NULL, 'people_challenge', NULL, true, 15),

('destination_discovery', 'dd_delegation_honest', 'Your Team', 
 'Be honest: how good are you at REALLY delegating?',
 'single', 
 '["Great - I focus on what only I can do", "Good - but I sometimes take things back", "Average - I delegate but micromanage", "Poor - I struggle to let go", "Terrible - I end up doing everything myself"]', 
 NULL, NULL, NULL, 'delegation_ability', NULL, true, 16),

('destination_discovery', 'dd_team_secret', 'Your Team', 
 'What does your team NOT know about the business that would surprise them?',
 'text', NULL, 
 'The stuff you don''t share...', 
 400, NULL, 'hidden_from_team', NULL, false, 17),

-- ============================================================================
-- SECTION 4: YOUR BLIND SPOTS (4 questions) - What they might be missing
-- ============================================================================
('destination_discovery', 'dd_avoided_conversation', 'Blind Spots', 
 'What conversation have you been AVOIDING having?',
 'text', NULL, 
 'With a team member, partner, customer, yourself...', 
 400, NULL, 'avoided_conversation', NULL, false, 18),

('destination_discovery', 'dd_hard_truth', 'Blind Spots', 
 'What''s a hard truth about your business that you''ve been reluctant to face?',
 'text', NULL, 
 'The thing you know but don''t want to admit...', 
 400, NULL, 'hard_truth', NULL, false, 19),

('destination_discovery', 'dd_external_view', 'Blind Spots', 
 'If we asked your spouse/partner or best friend about your work-life balance, what would they REALLY say?',
 'single', 
 '["They''d say I''ve got it figured out", "Mostly good with occasional frustrations", "They worry about me sometimes", "They''ve given up complaining", "It''s a significant source of tension", "They''d say I''m married to my business"]', 
 NULL, NULL, NULL, 'external_perspective', NULL, true, 20),

('destination_discovery', 'dd_if_i_knew', 'Blind Spots', 
 'Complete this: "If I really KNEW my numbers, I''d probably discover that..."',
 'text', NULL, 
 'What do you suspect but haven''t confirmed?', 
 300, NULL, 'suspected_truth', NULL, false, 21),

-- ============================================================================
-- SECTION 5: MOVING FORWARD (4 questions) - Ready for action
-- ============================================================================
('destination_discovery', 'dd_priority_focus', 'Moving Forward', 
 'If you could wave a magic wand and fix ONE area of your business this year, what would have the biggest impact?',
 'single', 
 '["Getting real financial visibility and control", "Building a business that runs without me", "Having strategic direction and accountability", "Scaling without scaling the chaos", "Protecting the value I''ve built", "Getting my time and energy back", "Something else entirely"]', 
 NULL, NULL, NULL, 'priority_area', NULL, true, 22),

('destination_discovery', 'dd_change_readiness', 'Moving Forward', 
 'How ready are you to make REAL changes (even uncomfortable ones)?',
 'single', 
 '["Completely ready - I''ll do whatever it takes", "Ready - as long as I understand the why", "Open - but I''ll need convincing", "Hesitant - change feels risky", "Resistant - I prefer how things are"]', 
 NULL, NULL, NULL, 'change_readiness', NULL, true, 23),

('destination_discovery', 'dd_past_blockers', 'Moving Forward', 
 'What''s stopped you from making these changes before now?',
 'multi', 
 '["Didn''t know what changes to make", "Couldn''t find the right help", "Didn''t have time to implement", "Wasn''t painful enough yet", "Fear of making things worse", "Cost concerns", "Nothing - this is my first serious attempt"]', 
 NULL, NULL, 3, 'historical_blockers', NULL, true, 24),

('destination_discovery', 'dd_final_message', 'Moving Forward', 
 'If you could tell us ONE thing that would help us help you better, what would it be?',
 'text', NULL, 
 'Anything we should know...', 
 600, NULL, 'final_insight', NULL, false, 25)

ON CONFLICT (service_line_code, question_id) DO UPDATE SET
  section = EXCLUDED.section,
  question_text = EXCLUDED.question_text,
  question_type = EXCLUDED.question_type,
  options = EXCLUDED.options,
  placeholder = EXCLUDED.placeholder,
  char_limit = EXCLUDED.char_limit,
  max_selections = EXCLUDED.max_selections,
  emotional_anchor = EXCLUDED.emotional_anchor,
  is_required = EXCLUDED.is_required,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- ============================================================================
-- 2. DATABASE SCHEMA FOR DOCUMENT INTELLIGENCE
-- ============================================================================

-- Structured financial data extracted from documents (uploaded by team, not client)
CREATE TABLE IF NOT EXISTS client_financial_context (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id uuid REFERENCES practices(id),
    
    -- Period info
    period_type text, -- 'annual', 'ytd', 'quarterly', 'monthly'
    period_end_date date,
    
    -- Core financials (from your existing knowledge)
    revenue numeric,
    gross_profit numeric,
    gross_margin_pct numeric,
    operating_costs numeric,
    net_profit numeric,
    net_margin_pct numeric,
    
    -- Working capital
    debtors_days numeric,
    creditors_days numeric,
    cash_position numeric,
    
    -- People metrics
    staff_count integer,
    staff_cost numeric,
    revenue_per_head numeric,
    
    -- Trends (YoY)
    revenue_growth_pct numeric,
    profit_growth_pct numeric,
    
    -- Analysis flags
    extracted_insights jsonb DEFAULT '{}',
    risk_indicators jsonb DEFAULT '[]',
    
    -- Metadata
    data_source text, -- 'xero', 'sage', 'manual', 'spotlight', 'accounts'
    last_updated timestamptz DEFAULT now(),
    updated_by uuid,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_financial_context_client ON client_financial_context(client_id);

-- Client operational context (things team knows/observes)
CREATE TABLE IF NOT EXISTS client_operational_context (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id uuid REFERENCES practices(id),
    
    -- Business profile
    business_type text, -- 'service', 'product', 'hybrid'
    industry text,
    years_trading integer,
    
    -- Client concentration
    top_client_revenue_pct numeric, -- % from biggest client
    top_3_clients_revenue_pct numeric, -- % from top 3
    client_count integer,
    
    -- Team structure
    management_team_size integer,
    owner_age_bracket text,
    succession_status text, -- 'planned', 'considering', 'not_discussed', 'urgent'
    
    -- Engagement history
    years_as_client integer,
    services_used text[], -- array of service codes
    last_major_engagement text,
    
    -- Team observations (soft intelligence)
    observed_strengths text[],
    observed_challenges text[],
    relationship_notes text,
    
    -- Analysis
    opportunity_score integer, -- 1-10 internal rating
    risk_factors text[],
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_operational_context_client ON client_operational_context(client_id);

-- Pattern analysis results (AI-generated insights)
CREATE TABLE IF NOT EXISTS client_pattern_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id uuid REFERENCES practices(id),
    
    -- Analysis type
    analysis_type text NOT NULL, -- 'discovery_complete', 'financial_review', 'combined'
    
    -- Detected patterns
    patterns_detected jsonb DEFAULT '[]',
    /* Structure:
    [
      {
        "pattern": "Owner dependency",
        "evidence": ["works 60+ hours", "can't take holidays", "team confidence 4/10"],
        "severity": "high",
        "service_fit": ["365_method", "fractional_coo"]
      }
    ]
    */
    
    -- Risk indicators
    risks_identified jsonb DEFAULT '[]',
    /* Structure:
    [
      {
        "risk": "Key person dependency",
        "description": "Business heavily reliant on owner",
        "impact": "Exit value, burnout risk",
        "urgency": "high"
      }
    ]
    */
    
    -- Opportunity indicators
    opportunities_identified jsonb DEFAULT '[]',
    /* Structure:
    [
      {
        "opportunity": "Financial visibility improvement",
        "current_state": "No management accounts",
        "potential_value": "Better decisions, cash control",
        "recommended_service": "management_accounts"
      }
    ]
    */
    
    -- Emotional anchors extracted
    emotional_anchors jsonb DEFAULT '{}',
    /* Structure:
    {
      "freedom": ["take 3 months off", "not be trapped"],
      "family": ["present for kids", "work-life balance"],
      "control": ["know my numbers", "not be surprised"]
    }
    */
    
    -- Overall scores
    destination_clarity_score integer, -- 1-10
    gap_severity_score integer, -- 1-10
    readiness_score integer, -- 1-10
    opportunity_score integer, -- 1-10
    
    -- Service recommendations
    recommended_services jsonb DEFAULT '[]',
    
    created_at timestamptz DEFAULT now(),
    source_discovery_id uuid
);

CREATE INDEX IF NOT EXISTS idx_client_pattern_analysis_client ON client_pattern_analysis(client_id);

-- Enable RLS
ALTER TABLE client_financial_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_operational_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_pattern_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies - team only (not client visible)
CREATE POLICY "Team manages financial context" ON client_financial_context
    FOR ALL USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid() AND member_type = 'team'
        )
    );

CREATE POLICY "Team manages operational context" ON client_operational_context
    FOR ALL USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid() AND member_type = 'team'
        )
    );

CREATE POLICY "Team manages pattern analysis" ON client_pattern_analysis
    FOR ALL USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid() AND member_type = 'team'
        )
    );

-- ============================================================================
-- 3. UPDATE DESTINATION_DISCOVERY TABLE FOR ENHANCED ANALYSIS
-- ============================================================================

ALTER TABLE destination_discovery
ADD COLUMN IF NOT EXISTS section_scores jsonb DEFAULT '{}',
-- e.g., {"destination": 8, "reality": 5, "team": 6, "blindspots": 7, "readiness": 9}

ADD COLUMN IF NOT EXISTS emotional_intensity_score integer,
-- How emotionally charged are their responses (1-10)

ADD COLUMN IF NOT EXISTS urgency_indicators jsonb DEFAULT '[]',
-- Specific phrases/responses indicating urgency

ADD COLUMN IF NOT EXISTS pattern_matches jsonb DEFAULT '[]';
-- Which service patterns their responses match

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================

SELECT 'Discovery Questions' as type, COUNT(*) as count 
FROM assessment_questions WHERE service_line_code = 'destination_discovery'
UNION ALL
SELECT 'Financial Context Records', COUNT(*) FROM client_financial_context
UNION ALL
SELECT 'Operational Context Records', COUNT(*) FROM client_operational_context
UNION ALL
SELECT 'Pattern Analysis Records', COUNT(*) FROM client_pattern_analysis;

