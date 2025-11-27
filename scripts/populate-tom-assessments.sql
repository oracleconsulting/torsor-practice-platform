-- Populate Tom's assessments with his actual responses
-- Run this in Supabase SQL Editor

-- First, get Tom's member ID and practice ID
DO $$
DECLARE
    tom_member_id UUID;
    tom_practice_id UUID;
BEGIN
    -- Get Tom's IDs
    SELECT id, practice_id INTO tom_member_id, tom_practice_id
    FROM practice_members
    WHERE email = 'tom@rowgear.com'
    LIMIT 1;

    IF tom_member_id IS NULL THEN
        RAISE EXCEPTION 'Tom not found in practice_members';
    END IF;

    RAISE NOTICE 'Tom member_id: %, practice_id: %', tom_member_id, tom_practice_id;

    -- Delete any existing assessments for Tom (clean slate)
    DELETE FROM client_assessments WHERE client_member_id = tom_member_id;
    RAISE NOTICE 'Cleared existing assessments for Tom';

    -- Insert Part 1: Life Design
    INSERT INTO client_assessments (
        practice_id,
        client_member_id,
        assessment_type,
        responses,
        status,
        completion_percentage,
        started_at,
        completed_at
    ) VALUES (
        tom_practice_id,
        tom_member_id,
        'part1',
        '{
            "tuesday_test": "Part of doing this is to give ourselves the time to be able to have kids so 5 years from now it might be a bit chaotic with children, early starts etc. I also love having a vary varied job and life and no two Tuesdays are the same so its hard to say ''this is exactly what I want to do'' In terms of a day off obviously a late start, coffee in bed gym and lunch with the mrs and not having to worry about when the phone rings all plans are off and one of us has to go back to work. But not every day has to be off I like my business I''d like to stay involved and work a bit I don''t think I would enjoy full retirement yet! I guess the ''not anymore bit'' is we definitely need to get away from being the most vital person and back stop of each business in order to reduce of stress, be able to plan our own time now and think about if not finally start having kids. Not feel as though we are always on call whenever we are off",
            "emergency_log": "Constantly having to still be on jobs fixing rowing machines and being unable to be in the business progressing it. Im all jobs at rowgear all at once. All my days off are filled with txt or phone calls from employees needing help etc etc. I''m also constantly doing fixing and repairs at the salon, Friday night sink leak, sunday all day fixing a lifting floor tile, fitting new equipment, fitting few taps, vanishing wooden tables you name it I do and because of how busy the salon that is all that has to be done on evenings or Sundays. Sleep isn''t really affected in that way as I work hard to protect it. anything after 8pm at night can piss off until morning. I''m not willing to compromise on 2hrs an evening with my wife and sleep",
            "relationship_mirror": "Within the space of a few hours I can want to burn the whole thing down, to feeling like the happiest man alive and back again. It hard work but I like hard work, it gives me a freedom I couldn''t have being employed but I day dream about the day someone puts a cheque in my hand and I get to walk away and never have to worry about it again! maybe its the combination of both businesses and to be fair rowgear is far less stress than the salon overall. I wouldn''t want another job but I would like to step back a bit and enjoy more time with zaneta now while we can do anything and go anywhere and before the kids arrive!",
            "skills_confession": "general manager or operations manager",
            "ninety_day_fantasy": "travel around asia with my wife",
            "full_name": "Tom",
            "company_name": "Rowgear LTD",
            "partner_emails": "",
            "current_income": "£3600 is what I pay myself each month",
            "desired_income": "£10,000",
            "current_turnover": "300,000",
            "target_turnover": "£350-400K from Rowgear assuming we still have salon. Money wise we arn''t far away from the life we want its the fact we only have that currently whilst being so involved",
            "sacrifices": ["Starting/growing a family", "Fitness and health", "Travel and adventure", "Sleep and rest"],
            "growth_trap": ["I could trust someone else with quality", "I understood my numbers better", "I had better systems and processes"],
            "danger_zone": "Key person leaving",
            "commitment_hours": "10-15 hours",
            "has_partners": "No"
        }'::jsonb,
        'completed',
        100,
        '2025-09-15 12:50:00+00',
        '2025-09-15 12:57:42+00'
    )
;

    -- Insert Part 2: Business Deep Dive
    INSERT INTO client_assessments (
        practice_id,
        client_member_id,
        assessment_type,
        responses,
        status,
        completion_percentage,
        started_at,
        completed_at
    ) VALUES (
        tom_practice_id,
        tom_member_id,
        'part2',
        '{
            "trading_name": "Rowgear LTD",
            "companies_house_number": "08859457",
            "years_trading": "10+",
            "ten_year_vision": "Still Britains leading rowing machine and concept2 specialist",
            "external_forces": ["Other"],
            "annual_turnover": "£250k-£500k",
            "primary_revenue_stream": "servicing rowing machine & gym equipment",
            "customer_locations": ["England", "Scotland", "Wales"],
            "environmental_impact": "Know we should care but don''t",
            "winning_2030": "10k a month for me and working 1 or 2 day a week. I don''t need anymore money than that",
            "six_month_shifts": "more staff, better processes and training, a GM",
            "financial_visibility": "Quarterly accounts",
            "profit_eaters": ["Don''t know"],
            "data_driven_level": "Some dashboards",
            "ninety_day_priorities": ["Increase revenue", "Implement new software", "Hire key roles"],
            "priority_confidence": "1",
            "customer_experience_rating": "10",
            "win_business_methods": ["Word of mouth"],
            "decision_maker": "Founder",
            "growth_bottleneck": "finding staff. someone with the skill set and work ethic seems to be impossible. Combined with inconsistent work weeks its always been difficult to hire someone and be consistent with hours. Our business is incredibly niche so teaching a mechanic how to do it takes times. I tried getting gm but no one seems capable of basic organising. I don''t know where to find staff and if we got a great one I don''t know if we can afford to pay them and have anything decent left for me afterwards.. unless we get more work, which means more staff and so the circle repeats!",
            "customer_profitability": "Rough idea",
            "decision_speed": "5",
            "operational_maturity": "Some processes, lots of exceptions",
            "tech_infrastructure": "Mix of tools barely connected",
            "cashflow_review_frequency": "1",
            "innovation_process": "Small experiments running",
            "bookkeeping_status": "Last Quarter",
            "system_reliability": "Rare problems",
            "numbers_confidence": "10",
            "money_worry": "having no idea how to grow a business. I fix stuff with my hands, I''m the best in the country at fixing rowing machines and the rowing world and the crossfit world already know it. We need to expand, have a booking system put a chain of command in a gm more staff, theres so much work out there we could be doing but the thought of that scares the shit out of me I''m just a one man band that got big, I''m not the guy to make it huge but it has to get bigger to make enough money for me to pay replacements for myself so I can step back",
            "team_size": "2-5 people",
            "culture_word": "Collaborative",
            "people_challenge": "Finding talent",
            "core_systems": ["Accounting"],
            "system_integration_level": "0",
            "clunky_systems": "I have no Idea. Pete my 2nd in command handles computer stuff. I don''t know what a live integration is!",
            "monthly_downtime_hours": "0-5 hours",
            "customer_insight_method": "They tell us when happy",
            "product_dev_approach": "Build what we think is best",
            "main_customer_segment": "",
            "customer_rating": "10",
            "market_shift_needed": "Market is massive, we haven''t even begun to max out there is so much more work out there",
            "customer_praise": "favorite contractors all year because we turn up and crack on, no fuss, no problems. nail the job clean up and done",
            "legal_compliance_confidence": "Well covered",
            "gdpr_status": "Should probably look at this",
            "cybersecurity_readiness": "Some security measures",
            "contract_handling": "Basic templates",
            "ethics_training": "Never done it",
            "external_advisers": ["Accountant"],
            "adviser_hours_per_month": "none",
            "adviser_understanding": "10",
            "has_neds": "No",
            "has_fractional_execs": "No",
            "adviser_network_confidence": "0",
            "expertise_needed": "someone who has experience with small niche businesses that become successful and the business owner has no idea where to go next! I know we can''t be the first or last so I know theres a solution - probably getting me out the way because I have no idea what I''m doing!"
        }'::jsonb,
        'completed',
        100,
        '2025-09-15 13:00:00+00',
        '2025-09-15 13:17:53+00'
    )
;

    -- Insert Part 3: Hidden Value Audit
    INSERT INTO client_assessments (
        practice_id,
        client_member_id,
        assessment_type,
        responses,
        status,
        completion_percentage,
        started_at,
        completed_at
    ) VALUES (
        tom_practice_id,
        tom_member_id,
        'part3',
        '{
            "critical_processes_undocumented": ["How we win new customers", "How we deliver our core service", "How we handle customer complaints", "Our pricing methodology", "Our quality control process"],
            "unique_methods": "we are involved in the rowing world and have been for 20+ years we know everyone, we go to events, we run a rowing podcast we are well known and have a great reputation. We have a standard all in one service price to make costs as simple as possible and budgeting easy for schools, colleges, clubs etc. Pricing we offer reductions for 3 and 5 year contracts and 12 month warranty on all work. We joined the british standard agency, got my staff dbs checked, we do risk assessment and rams forms, safety boots and uniform. I have spent a lot of time and money elevating ourselves above any other specialist in the industry who I still just one man bands. Delivering the service is basically perfecting a system that means a team of 2 men can fix up to 40 machines a day where as 10 years ago we could maybe only do half of that",
            "unique_methods_protection": "Don''t know",
            "knowledge_dependency_percentage": "85",
            "customer_data_unutilized": ["Customer feedback and reviews", "Complaints and support tickets", "Customer demographics"],
            "content_assets_unleveraged": ["How-to guides and tutorials", "Webinar recordings"],
            "awareness_rd_tax_credits": "Not aware",
            "awareness_patent_box": "Not aware",
            "awareness_innovation_grants": "Not aware",
            "awareness_creative_tax": "Not aware",
            "hidden_trust_signals": ["Client testimonials and reviews", "Years in business", "Number of clients served", "Industry association memberships"],
            "personal_brand_percentage": "80",
            "reputation_build_time": "More than 10 years",
            "team_story_consistency": "Yes, everyone knows it well",
            "active_customer_advocates": "50",
            "competitive_moat": ["Exclusive contracts or partnerships", "Proprietary technology or systems", "Deep customer relationships", "Unique location advantages", "Specialized expertise/talent", "Brand recognition and trust"],
            "top3_customer_revenue_percentage": "10",
            "external_channel_percentage": "1",
            "last_price_increase": "1-2 years ago",
            "market_intelligence_methods": ["We don''t track systematically"],
            "autonomy_sales": "Would fail",
            "autonomy_delivery": "Needs oversight",
            "autonomy_finance": "Would fail",
            "autonomy_hiring": "Would fail",
            "autonomy_strategy": "Needs oversight",
            "autonomy_quality": "Needs oversight",
            "data_re_entry_frequency": "2-3 times",
            "quality_control_method": "Hope for the best",
            "tech_stack_health_percentage": "80",
            "compliance_automation": ["None automated"],
            "risk_operations_lead": "Crisis situation",
            "risk_sales_lead": "Crisis situation",
            "risk_tech_lead": "Crisis situation",
            "risk_customer_lead": "Crisis situation",
            "risk_finance_lead": "Crisis situation",
            "succession_your_role": "Nobody",
            "succession_operations": "Need to hire",
            "succession_sales": "Need to hire",
            "succession_technical": "Need to hire",
            "succession_customer": "Need to hire",
            "culture_preservation_methods": ["Nothing formal"],
            "team_advocacy_percentage": "100",
            "average_knowledge_transfer_months": "6",
            "documentation_24hr_ready": ["Customer contracts", "Employee contracts"],
            "know_business_worth": "No idea at all",
            "personal_bankruptcy_risks": ["None of these apply"],
            "explored_rd_tax": "Never heard of it",
            "explored_grants": "Never heard of it",
            "explored_eis_seis": "Never heard of it",
            "explored_debt": "Never heard of it",
            "explored_equity": "Never heard of it",
            "investability_assets": ["Proven systems and processes", "Strong brand and reputation", "Talented and stable team", "Long-term contracts", "Strategic relationships", "Market position"]
        }'::jsonb,
        'completed',
        100,
        '2025-09-15 13:20:00+00',
        '2025-09-15 13:31:24+00'
    )
;

    RAISE NOTICE 'Successfully inserted all 3 assessments for Tom';
END $$;

-- Verify the assessments were inserted
SELECT 
    ca.assessment_type,
    ca.status,
    ca.completion_percentage,
    ca.completed_at,
    jsonb_object_keys(ca.responses) as response_keys_sample
FROM client_assessments ca
JOIN practice_members pm ON pm.id = ca.client_member_id
WHERE pm.email = 'tom@rowgear.com'
ORDER BY ca.assessment_type;

