-- ============================================================================
-- COMPLETE ZANETA SETUP SCRIPT
-- ============================================================================
-- Email: zaneta@zlsalon.co.uk
-- Password: Torsor365! (set in Supabase Auth)
-- Business: ZL Salon Limited
-- ============================================================================

-- ============================================================================
-- STEP 1: ENSURE TABLES EXIST
-- ============================================================================

-- Ensure practice_members has all needed columns
ALTER TABLE practice_members 
  ADD COLUMN IF NOT EXISTS practice_id uuid;

ALTER TABLE practice_members
  ADD COLUMN IF NOT EXISTS program_status text DEFAULT 'pending';

-- Client assessments table
CREATE TABLE IF NOT EXISTS client_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  practice_id uuid,
  assessment_type text NOT NULL, -- 'part1', 'part2', 'part3', 'followup'
  status text DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  responses jsonb DEFAULT '{}',
  fit_profile jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client roadmaps table
CREATE TABLE IF NOT EXISTS client_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  practice_id uuid,
  roadmap_data jsonb DEFAULT '{}',
  value_analysis jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- STEP 2: GET OR CREATE RPGCC PRACTICE
-- ============================================================================

-- Use the practice that already has Tom
DO $$
DECLARE
    v_practice_id uuid;
BEGIN
    -- Find the practice Tom belongs to
    SELECT practice_id INTO v_practice_id
    FROM practice_members
    WHERE email = 'tom@rowgear.com'
    LIMIT 1;
    
    IF v_practice_id IS NOT NULL THEN
        RAISE NOTICE '✓ Found existing practice: %', v_practice_id;
    ELSE
        -- Use default RPGCC practice ID
        v_practice_id := '8624cd8c-b4c2-4fc3-85b8-e559d14b0568';
        RAISE NOTICE 'Using default practice ID: %', v_practice_id;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE AUTH USER FOR ZANETA
-- ============================================================================
-- NOTE: Run this FIRST in the Supabase Dashboard > Authentication > Users > Add User:
-- Email: zaneta@zlsalon.co.uk
-- Password: Torsor365!
-- Auto Confirm: YES
-- 
-- Then copy her user_id and replace below:

-- After creating the auth user, get her ID:
-- SELECT id FROM auth.users WHERE email = 'zaneta@zlsalon.co.uk';

-- ============================================================================
-- STEP 4: ADD ZANETA AS PRACTICE MEMBER
-- ============================================================================

-- First check if she exists
DO $$
DECLARE
    v_zaneta_user_id uuid;
    v_zaneta_member_id uuid;
    v_practice_id uuid;
BEGIN
    -- Get practice_id from Tom's record (same practice)
    SELECT practice_id INTO v_practice_id
    FROM practice_members
    WHERE email = 'tom@rowgear.com'
    LIMIT 1;
    
    -- Fallback to default if Tom not found
    IF v_practice_id IS NULL THEN
        v_practice_id := '8624cd8c-b4c2-4fc3-85b8-e559d14b0568';
    END IF;
    
    RAISE NOTICE 'Using practice_id: %', v_practice_id;
    -- Get Zaneta's auth user ID
    SELECT id INTO v_zaneta_user_id 
    FROM auth.users 
    WHERE email = 'zaneta@zlsalon.co.uk';

    IF v_zaneta_user_id IS NULL THEN
        RAISE NOTICE '❌ Zaneta auth user not found! Create user first in Supabase Dashboard with email: zaneta@zlsalon.co.uk';
        RAISE NOTICE 'Go to: Authentication > Users > Add User > Create new user';
        RAISE NOTICE 'Email: zaneta@zlsalon.co.uk, Password: Torsor365!, Auto Confirm: YES';
    ELSE
        RAISE NOTICE '✓ Found Zaneta auth user: %', v_zaneta_user_id;

        -- Check if she already exists in practice_members
        SELECT id INTO v_zaneta_member_id
        FROM practice_members
        WHERE email = 'zaneta@zlsalon.co.uk';

        IF v_zaneta_member_id IS NOT NULL THEN
            -- Update existing record
            UPDATE practice_members SET
                user_id = v_zaneta_user_id,
                practice_id = v_practice_id,
                name = 'Zaneta Clark',
                member_type = 'client',
                program_status = 'active',
                updated_at = now()
            WHERE id = v_zaneta_member_id;
            
            RAISE NOTICE '✓ Updated existing Zaneta record: %', v_zaneta_member_id;
        ELSE
            -- Create new record
            INSERT INTO practice_members (
                user_id,
                practice_id,
                name,
                email,
                role,
                member_type,
                program_status,
                invited_at,
                created_at
            ) VALUES (
                v_zaneta_user_id,
                v_practice_id,
                'Zaneta Clark',
                'zaneta@zlsalon.co.uk',
                'Client',
                'client',
                'active',
                now(),
                now()
            )
            RETURNING id INTO v_zaneta_member_id;
            
            RAISE NOTICE '✓ Created new Zaneta record: %', v_zaneta_member_id;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- STEP 5: POPULATE ZANETA'S ASSESSMENTS
-- ============================================================================

-- Get Zaneta's IDs
DO $$
DECLARE
    v_zaneta_id uuid;
    v_practice_id uuid;
BEGIN
    -- Get practice_id from Tom's record (same practice)
    SELECT practice_id INTO v_practice_id
    FROM practice_members
    WHERE email = 'tom@rowgear.com'
    LIMIT 1;
    
    -- Fallback to default if Tom not found
    IF v_practice_id IS NULL THEN
        v_practice_id := '8624cd8c-b4c2-4fc3-85b8-e559d14b0568';
    END IF;
    -- Get her practice_members ID
    SELECT id INTO v_zaneta_id
    FROM practice_members
    WHERE email = 'zaneta@zlsalon.co.uk';

    IF v_zaneta_id IS NULL THEN
        RAISE NOTICE '❌ Zaneta not found in practice_members. Run auth user creation first.';
        RETURN;
    END IF;

    RAISE NOTICE '✓ Creating assessments for Zaneta: %', v_zaneta_id;

    -- Part 1: Life Design
    INSERT INTO client_assessments (
        client_id,
        practice_id,
        assessment_type,
        status,
        started_at,
        completed_at,
        responses
    ) VALUES (
        v_zaneta_id,
        v_practice_id,
        'part1',
        'completed',
        '2025-09-15T13:45:00Z',
        '2025-09-15T13:49:05Z',
        '{
            "full_name": "Zaneta Clark",
            "company_name": "ZL Salon Limited",
            "partner_emails": "",
            "has_partners": "No",
            "tuesday_test": "living outside of Oxford in a forever home. 2 kids and being a mum and a home maker, take them to school, go to gym, cooking, not working. I''d like to work 2 days a week max but also be able to bee off when the kids are.",
            "emergency_log": "all day every day at work I have my own clients but i also run the whole salon and the team, keep an eye on all work going on, answer phone, chat to clients and host",
            "relationship_mirror": "anxiety in my stomach every day, because Im the only one in charge of 14 staff and 65 clients every day and they all what a bit of me",
            "skills_confession": "organisation, general admin, controlling hours - general manager.",
            "ninety_day_fantasy": "pack and travel - go to Czech and spend time with my fmaily, travle South America, Asia.",
            "current_income": "3600",
            "desired_income": "10000",
            "current_turnover": "500000",
            "target_turnover": "600000",
            "sacrifices": ["Starting/growing a family", "Hobbies I used to love", "Friendships", "Travel and adventure", "Sleep and rest"],
            "growth_trap": ["I understood my numbers better", "I had more hours in the day"],
            "danger_zone": "System/tech failure",
            "commitment_hours": "10-15 hours"
        }'::jsonb
    )
    ON CONFLICT DO NOTHING;

    -- Part 2: Business Deep Dive
    INSERT INTO client_assessments (
        client_id,
        practice_id,
        assessment_type,
        status,
        started_at,
        completed_at,
        responses
    ) VALUES (
        v_zaneta_id,
        v_practice_id,
        'part2',
        'completed',
        '2025-09-15T13:50:00Z',
        '2025-09-15T13:59:28Z',
        '{
            "trading_name": "ZL Salon Limited",
            "companies_house_number": "12048781",
            "years_trading": "6-10",
            "ten_year_vision": "Superior customer service from a small highly skilled team.",
            "external_forces": ["Economic downturn"],
            "annual_turnover": "£250k-£500k",
            "primary_revenue_stream": "hair cutting",
            "customer_locations": ["England"],
            "environmental_impact": "Working on a plan",
            "winning_2030": "full staff line up and full chairs so the buisiness works in a way I can work 2 days a week and make £10,000 a month",
            "six_month_shifts": "train the new highered staff, social media improvements",
            "financial_visibility": "Flying blind",
            "profit_eaters": ["Don''t know"],
            "data_driven_level": "Gut feel",
            "ninety_day_priorities": ["Increase revenue", "Hire key roles", "Get out of the day to day", "Improve marketing"],
            "priority_confidence": "1",
            "customer_experience_rating": "10",
            "win_business_methods": ["Word of mouth", "Digital marketing"],
            "decision_maker": "Founder",
            "growth_bottleneck": "finding staff with a high enough skill level",
            "customer_profitability": "Rough idea",
            "decision_speed": "1",
            "operational_maturity": "Chaos - reinvent wheel daily",
            "tech_infrastructure": "Spreadsheets and prayers",
            "cashflow_review_frequency": "5",
            "innovation_process": "Small experiments running",
            "bookkeeping_status": "Last Quarter",
            "system_reliability": "Weekly issues",
            "numbers_confidence": "0",
            "money_worry": "staff costs and training costs",
            "team_size": "6-25",
            "culture_word": "Thriving",
            "people_challenge": "Performance issues",
            "core_systems": ["Accounting"],
            "system_integration_level": "0",
            "clunky_systems": "dont know",
            "monthly_downtime_hours": "0-5 hours",
            "customer_insight_method": "They tell us when happy",
            "product_dev_approach": "Build what we think is best",
            "main_customer_segment": "",
            "customer_rating": "10",
            "market_shift_needed": "dont know",
            "customer_praise": "how I run the whole salon and lead the team and they see it",
            "legal_compliance_confidence": "Think we''re okay",
            "gdpr_status": "Basic measures in place",
            "cybersecurity_readiness": "Some security measures",
            "ethics_training": "Never done it",
            "external_advisers": ["Accountant"],
            "adviser_hours_per_month": "",
            "adviser_understanding": "0",
            "has_neds": "No",
            "has_fractional_execs": "No",
            "adviser_network_confidence": "0",
            "expertise_needed": "admin/GM"
        }'::jsonb
    )
    ON CONFLICT DO NOTHING;

    -- Part 3: Hidden Value Audit
    INSERT INTO client_assessments (
        client_id,
        practice_id,
        assessment_type,
        status,
        started_at,
        completed_at,
        responses
    ) VALUES (
        v_zaneta_id,
        v_practice_id,
        'part3',
        'completed',
        '2025-09-15T14:00:00Z',
        '2025-09-15T14:10:54Z',
        '{
            "critical_processes_undocumented": ["How we win new customers", "How we deliver our core service", "How we handle customer complaints", "How we onboard new team members", "How we make key decisions", "Our pricing methodology", "Our quality control process"],
            "unique_methods": "treating the staff better than anyone would and really looking afterthem and building a close hard working team that feels appreciated. Our overall salon experience and atmosphere is carefully put together.",
            "unique_methods_protection": "Don''t know",
            "knowledge_dependency_percentage": "10",
            "customer_data_unutilized": ["Purchase patterns and frequency", "Usage data and engagement metrics", "Lifetime value data"],
            "content_assets_unleveraged": [],
            "awareness_rd_tax_credits": "Not aware",
            "awareness_patent_box": "Not aware",
            "awareness_innovation_grants": "Not aware",
            "awareness_creative_tax": "Not aware",
            "hidden_trust_signals": ["Industry awards and recognition", "Professional certifications", "Client testimonials and reviews", "Media mentions and press", "Years in business", "Number of clients served", "Industry association memberships"],
            "personal_brand_percentage": "5",
            "reputation_build_time": "More than 10 years",
            "team_story_consistency": "Yes, everyone knows it well",
            "active_customer_advocates": "60",
            "competitive_moat": ["Deep customer relationships", "Specialized expertise/talent", "Brand recognition and trust"],
            "top3_customer_revenue_percentage": "0.1",
            "external_channel_percentage": "",
            "last_price_increase": "6-12 months ago",
            "market_intelligence_methods": ["Google alerts for competitors", "Social media monitoring"],
            "autonomy_delivery": "Runs perfectly",
            "autonomy_finance": "Runs perfectly",
            "autonomy_hiring": "Needs oversight",
            "autonomy_strategy": "Needs oversight",
            "autonomy_quality": "Needs oversight",
            "data_re_entry_frequency": "Never - fully integrated",
            "quality_control_method": "Team culture and training",
            "tech_stack_health_percentage": "0",
            "compliance_automation": ["Insurance renewals", "Company filings"],
            "risk_operations_lead": "Disrupted for weeks",
            "succession_your_role": "Nobody",
            "succession_operations": "Need 1 month",
            "succession_technical": "Need to hire",
            "culture_preservation_methods": ["Regular culture activities", "Performance reviews include culture", "Team rituals and traditions"],
            "team_advocacy_percentage": "100",
            "average_knowledge_transfer_months": "24",
            "documentation_24hr_ready": ["Last 3 years P&L", "Employee contracts"],
            "know_business_worth": "No idea at all",
            "personal_bankruptcy_risks": ["None of these apply"],
            "explored_rd_tax": "Never heard of it",
            "explored_grants": "Never heard of it",
            "explored_eis_seis": "Never heard of it",
            "explored_debt": "Never heard of it",
            "explored_equity": "Never heard of it",
            "investability_assets": ["Strong brand and reputation", "Talented and stable team", "Long-term contracts", "Market position"]
        }'::jsonb
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✓ Assessments created for Zaneta';
END $$;

-- ============================================================================
-- STEP 6: VERIFY SETUP
-- ============================================================================

SELECT '=== ZANETA SETUP VERIFICATION ===' as status;

-- Check auth user
SELECT 'Auth User:' as check_type;
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'zaneta@zlsalon.co.uk';

-- Check practice member
SELECT 'Practice Member:' as check_type;
SELECT id, name, email, member_type, program_status, practice_id
FROM practice_members 
WHERE email = 'zaneta@zlsalon.co.uk';

-- Check assessments
SELECT 'Assessments:' as check_type;
SELECT 
    ca.assessment_type,
    ca.status,
    ca.completed_at,
    ca.responses->>'company_name' as company
FROM client_assessments ca
JOIN practice_members pm ON ca.client_id = pm.id
WHERE pm.email = 'zaneta@zlsalon.co.uk'
ORDER BY ca.assessment_type;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 
-- 1. FIRST: Go to Supabase Dashboard > Authentication > Users > Add User
--    - Email: zaneta@zlsalon.co.uk
--    - Password: Torsor365!
--    - Auto Confirm: YES
--    - Click Create User
--
-- 2. THEN: Run this entire SQL script in SQL Editor
--
-- 3. Zaneta can now log in at client.torsor.co.uk with:
--    - Email: zaneta@zlsalon.co.uk
--    - Password: Torsor365!
--
-- ============================================================================

