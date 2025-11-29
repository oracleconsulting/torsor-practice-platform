-- Insert sample roadmap for Tom based on his assessment responses
-- This demonstrates the narrative-driven Oracle Method approach

DO $$
DECLARE
    tom_id UUID;
    tom_practice_id UUID;
    roadmap_id UUID;
BEGIN
    -- Get Tom's IDs
    SELECT id, practice_id INTO tom_id, tom_practice_id
    FROM practice_members
    WHERE email = 'tom@rowgear.com'
    LIMIT 1;

    IF tom_id IS NULL THEN
        RAISE EXCEPTION 'Tom not found in practice_members';
    END IF;

    RAISE NOTICE 'Creating roadmap for Tom (id: %)', tom_id;

    -- Deactivate any existing roadmaps
    UPDATE client_roadmaps SET is_active = false WHERE client_id = tom_id;

    -- Insert the roadmap with narrative structure
    INSERT INTO client_roadmaps (
        id,
        practice_id,
        client_id,
        roadmap_data,
        value_analysis,
        llm_model_used,
        prompt_version,
        generation_cost,
        generation_duration_ms,
        is_active
    ) VALUES (
        gen_random_uuid(),
        tom_practice_id,
        tom_id,
        '{
            "fiveYearVision": {
                "narrative": "Tom, you''ve built something remarkable with Rowgear - Britain''s leading rowing machine specialist, with 20+ years of relationships in the rowing world and a podcast that gives you unique access. But right now you''re trapped. You described wanting to give yourselves time to have kids, yet every day off is filled with texts and calls from employees needing help. Within hours you swing from wanting to burn it all down to feeling like the happiest man alive. This isn''t sustainable - and deep down you know it.\n\nThe turning point comes when you realize that your goal of £10k monthly income with 1-2 days work per week isn''t about working less - it''s about building something that doesn''t need YOU to be the backstop for every emergency. Your unique position in the rowing world isn''t a constraint, it''s an asset that can be systematized.\n\nBy year 5, Rowgear runs on systems, not heroics. You''re still involved - you enjoy the variety - but you choose when. The phone doesn''t control your dinner time with your wife. And those kids you mentioned? They fit into a life that finally has space for them.",
                "year1": {
                    "headline": "From Firefighter to Founder",
                    "story": "The constant calls and texts reduce by 80%. Your team handles routine issues. You spend your 10-15 hours on growing the business, not fixing machines. That salon floor and sink? Someone else handles it now.",
                    "measurable": "£300k+ turnover maintained, 2 trained technicians, documented SOPs for 80% of work"
                },
                "year3": {
                    "headline": "The GM Hire That Changes Everything",
                    "story": "You found that operations manager with the right work ethic. Rowgear runs day-to-day without you. The podcast brings in leads automatically. You''re working ON the business 2 days a week.",
                    "measurable": "£400k+ turnover, GM in place, recurring service contracts covering 60% of revenue"
                },
                "year5": {
                    "headline": "Britain''s #1 - Now It Runs Itself",
                    "story": "Still Britain''s leading Concept2 specialist - but now it''s a business, not a job. Your £10k monthly is secured. Kids or not, you have the time. The variety you love comes from choice, not obligation.",
                    "measurable": "£500k+ turnover, 3+ technicians, you work 1-2 days by choice, ready to sell if you ever want"
                },
                "northStar": "Build the business that builds the life - time for family, work by choice, not obligation",
                "emotionalCore": "Seeking freedom from being the constant backstop"
            },
            "sixMonthShift": {
                "overview": "Six months to transform from ''constantly on jobs fixing rowing machines'' to having a team that handles 80% of service calls. You''ll finally be able to be IN the business progressing it, not stuck ON jobs.",
                "month1_2": {
                    "theme": "Document & Delegate",
                    "focus": "Capture the knowledge that''s trapped in your head",
                    "keyActions": [
                        "Document your top 10 most common repair procedures",
                        "Create a decision tree for staff: when to call Tom, when to handle it",
                        "Identify which salon tasks can be outsourced"
                    ],
                    "successMetrics": ["50% reduction in daily calls/texts", "10 SOPs created"],
                    "timeCommitment": "10-15 hours on documentation and training"
                },
                "month3_4": {
                    "theme": "Systems & Staff Development",
                    "focus": "Build the team''s capability and confidence",
                    "keyActions": [
                        "Upskill existing 2-5 staff on documented procedures",
                        "Start recruiting for that GM/Ops Manager role",
                        "Implement scheduling software to reduce your coordination overhead"
                    ],
                    "successMetrics": ["Staff handling 70% of jobs independently", "GM job spec created"],
                    "timeCommitment": "10-15 hours on training and hiring"
                },
                "month5_6": {
                    "theme": "Revenue Optimization",
                    "focus": "Move toward £350-400k target while working less",
                    "keyActions": [
                        "Launch recurring service contracts (passive revenue)",
                        "Price increase for non-contract work (you''ve not raised in too long)",
                        "Leverage podcast for lead generation"
                    ],
                    "successMetrics": ["£30k+ in recurring contracts signed", "15% price increase implemented"],
                    "timeCommitment": "10-15 hours on sales and marketing"
                },
                "quickWins": [
                    "Create a ''Do Not Call Tom'' list for common issues - share with team this week",
                    "Book a handyman for the salon maintenance - stop doing it yourself"
                ],
                "dangerMitigation": "Key person leaving is your #1 fear - we''re addressing it by documenting everything so no single person (including you) is irreplaceable",
                "northStarAlignment": "Every action reduces your ''on call'' burden and moves toward that £10k/month at 1-2 days work"
            },
            "summary": {
                "headline": "From Constant On-Call to Choosing When You Work",
                "keyInsight": "You''ve built Britain''s leading rowing machine specialist, but you''re still doing the work of a technician. The business has value - your relationships, your podcast, your expertise - but it''s all trapped in YOU. This roadmap systematically extracts that value into a business that can run without you.",
                "expectedOutcome": "In 12 weeks: 80% fewer emergency calls, documented procedures, staff empowered to handle most issues, and the first recurring service contracts signed. You''ll see what ''being in the business'' feels like instead of on jobs."
            },
            "priorities": [
                {
                    "rank": 1,
                    "title": "Knowledge Extraction",
                    "description": "Get what''s in your head into documented SOPs so staff can handle issues without calling you",
                    "category": "Operations",
                    "targetOutcome": "10 core procedures documented"
                },
                {
                    "rank": 2,
                    "title": "Team Enablement",
                    "description": "Train and trust your existing team to make decisions independently",
                    "category": "People",
                    "targetOutcome": "Staff handling 70% of jobs without escalation"
                },
                {
                    "rank": 3,
                    "title": "Revenue Stability",
                    "description": "Build recurring service contracts for predictable income",
                    "category": "Financial",
                    "targetOutcome": "£30k in annual recurring contracts"
                }
            ],
            "weeks": [
                {
                    "weekNumber": 1,
                    "theme": "Quick Wins & Immediate Relief",
                    "focus": "Stop the bleeding - create boundaries that give you breathing room",
                    "tasks": [
                        {"id": "w1-t1", "title": "Create the ''Do Not Call Tom'' List", "description": "Document 10 common issues staff should handle themselves, with solutions. Share with team.", "category": "Operations", "priority": "critical", "estimatedHours": 2},
                        {"id": "w1-t2", "title": "Book External Help for Salon Maintenance", "description": "Find a handyman/contractor for salon repairs. Stop doing it yourself on evenings/Sundays.", "category": "Operations", "priority": "high", "estimatedHours": 1},
                        {"id": "w1-t3", "title": "Set Phone Boundaries", "description": "Communicate to team: 8pm-8am is emergency only. Define what counts as emergency.", "category": "People", "priority": "high", "estimatedHours": 1}
                    ],
                    "milestone": "First week where you don''t work on Sunday"
                },
                {
                    "weekNumber": 2,
                    "theme": "Documentation Foundation",
                    "focus": "Start capturing the knowledge trapped in your head",
                    "tasks": [
                        {"id": "w2-t1", "title": "Document Top 3 Repair Procedures", "description": "Video yourself doing the 3 most common repairs. Staff can watch instead of calling.", "category": "Operations", "priority": "critical", "estimatedHours": 3},
                        {"id": "w2-t2", "title": "Create Customer Decision Tree", "description": "When to offer on-site vs bring-to-shop vs replacement. Staff need this.", "category": "Operations", "priority": "high", "estimatedHours": 2}
                    ],
                    "milestone": "3 procedures documented with video"
                },
                {
                    "weekNumber": 3,
                    "theme": "Staff Empowerment",
                    "focus": "Train your team on the documented procedures",
                    "tasks": [
                        {"id": "w3-t1", "title": "Run First Training Session", "description": "Walk team through procedures and decision tree. Let them ask questions.", "category": "People", "priority": "critical", "estimatedHours": 2},
                        {"id": "w3-t2", "title": "Set Up Escalation Protocol", "description": "Create clear guidelines: try X first, if Y happens then call Tom.", "category": "Operations", "priority": "high", "estimatedHours": 1},
                        {"id": "w3-t3", "title": "Document 3 More Procedures", "description": "Continue building your SOP library.", "category": "Operations", "priority": "medium", "estimatedHours": 2}
                    ],
                    "milestone": "Team has tools to handle 30% of issues independently"
                },
                {
                    "weekNumber": 4,
                    "theme": "Systems Setup",
                    "focus": "Put technology in place to reduce coordination overhead",
                    "tasks": [
                        {"id": "w4-t1", "title": "Implement Scheduling Software", "description": "Set up a tool for job booking/dispatch. Stop being the human scheduler.", "category": "Systems", "priority": "critical", "estimatedHours": 3},
                        {"id": "w4-t2", "title": "Create Customer Communication Templates", "description": "Standard emails/texts for booking, follow-up, etc. Staff can use without asking.", "category": "Systems", "priority": "high", "estimatedHours": 2}
                    ],
                    "milestone": "🎯 Foundation Complete - First month of breathing room"
                },
                {
                    "weekNumber": 5,
                    "theme": "Knowledge Transfer Acceleration",
                    "focus": "Document the trickier procedures",
                    "tasks": [
                        {"id": "w5-t1", "title": "Document Complex Repairs", "description": "The ones that usually result in ''call Tom''. Make them learnable.", "category": "Operations", "priority": "high", "estimatedHours": 3},
                        {"id": "w5-t2", "title": "Create Troubleshooting Guide", "description": "Diagnostic flowchart for common Concept2 issues.", "category": "Operations", "priority": "high", "estimatedHours": 2}
                    ],
                    "milestone": "70% of common issues documented"
                },
                {
                    "weekNumber": 6,
                    "theme": "Revenue Opportunity: Recurring Contracts",
                    "focus": "Start building passive income stream",
                    "tasks": [
                        {"id": "w6-t1", "title": "Design Annual Service Contract", "description": "What''s included, pricing, terms. Make it attractive to gyms/schools.", "category": "Financial", "priority": "critical", "estimatedHours": 2},
                        {"id": "w6-t2", "title": "Identify Top 20 Contract Prospects", "description": "Existing customers who would benefit from annual coverage.", "category": "Marketing", "priority": "high", "estimatedHours": 1},
                        {"id": "w6-t3", "title": "Create Contract Pitch Materials", "description": "One-pager explaining value: predictable costs, priority service, peace of mind.", "category": "Marketing", "priority": "high", "estimatedHours": 2}
                    ],
                    "milestone": "Service contract product ready to sell"
                },
                {
                    "weekNumber": 7,
                    "theme": "Contract Sales Push",
                    "focus": "Start converting prospects to recurring revenue",
                    "tasks": [
                        {"id": "w7-t1", "title": "Reach Out to First 10 Prospects", "description": "Personalized outreach to best-fit customers. Mention you''re limiting spots.", "category": "Marketing", "priority": "critical", "estimatedHours": 2},
                        {"id": "w7-t2", "title": "Follow Up on Week 6 Leads", "description": "Anyone who showed interest - close them.", "category": "Marketing", "priority": "high", "estimatedHours": 1}
                    ],
                    "milestone": "First 3 contracts signed"
                },
                {
                    "weekNumber": 8,
                    "theme": "Midpoint Review & Adjustment",
                    "focus": "Measure progress and adjust",
                    "tasks": [
                        {"id": "w8-t1", "title": "Count Your Calls/Texts", "description": "Compare to week 1. How much has it reduced?", "category": "Operations", "priority": "critical", "estimatedHours": 0.5},
                        {"id": "w8-t2", "title": "Team Feedback Session", "description": "What''s working? What do they still need? What''s unclear?", "category": "People", "priority": "high", "estimatedHours": 1},
                        {"id": "w8-t3", "title": "Continue Contract Outreach", "description": "Next 10 prospects.", "category": "Marketing", "priority": "high", "estimatedHours": 2}
                    ],
                    "milestone": "📈 Midpoint: 50%+ reduction in escalations"
                },
                {
                    "weekNumber": 9,
                    "theme": "Podcast Leverage",
                    "focus": "Use your unique asset for lead generation",
                    "tasks": [
                        {"id": "w9-t1", "title": "Plan Service-Focused Podcast Episode", "description": "Topic: ''Why rowing machines fail and how to prevent it'' - subtle pitch for service contracts.", "category": "Marketing", "priority": "high", "estimatedHours": 2},
                        {"id": "w9-t2", "title": "Add CTA to Podcast Description", "description": "Mention service contracts, link to booking page.", "category": "Marketing", "priority": "medium", "estimatedHours": 0.5}
                    ],
                    "milestone": "Podcast working as lead gen"
                },
                {
                    "weekNumber": 10,
                    "theme": "Price Positioning",
                    "focus": "You haven''t raised prices in too long",
                    "tasks": [
                        {"id": "w10-t1", "title": "Analyze Current Pricing", "description": "Compare to market. You''re likely underpriced.", "category": "Financial", "priority": "high", "estimatedHours": 1},
                        {"id": "w10-t2", "title": "Plan Price Increase", "description": "10-15% for non-contract work. Grandfather existing contracts.", "category": "Financial", "priority": "high", "estimatedHours": 1},
                        {"id": "w10-t3", "title": "Communicate Price Change", "description": "Email existing customers with 30-day notice.", "category": "Financial", "priority": "critical", "estimatedHours": 1}
                    ],
                    "milestone": "Price increase announced"
                },
                {
                    "weekNumber": 11,
                    "theme": "GM Role Preparation",
                    "focus": "Start building for your biggest need: an operations manager",
                    "tasks": [
                        {"id": "w11-t1", "title": "Write GM Job Description", "description": "What does this person actually do day-to-day? What skills do they need?", "category": "People", "priority": "critical", "estimatedHours": 2},
                        {"id": "w11-t2", "title": "Define GM Success Metrics", "description": "How will you know they''re succeeding?", "category": "People", "priority": "high", "estimatedHours": 1}
                    ],
                    "milestone": "GM role fully defined"
                },
                {
                    "weekNumber": 12,
                    "theme": "Transformation Review",
                    "focus": "Celebrate progress and plan next phase",
                    "tasks": [
                        {"id": "w12-t1", "title": "Measure All Metrics", "description": "Calls/texts reduction, contracts signed, revenue change, hours worked.", "category": "Operations", "priority": "critical", "estimatedHours": 1},
                        {"id": "w12-t2", "title": "Document What Worked", "description": "What had the biggest impact? What should continue?", "category": "Operations", "priority": "high", "estimatedHours": 1},
                        {"id": "w12-t3", "title": "Plan Next 12 Weeks", "description": "Now that foundations are set, what''s next? Likely: GM hiring.", "category": "Strategy", "priority": "high", "estimatedHours": 2}
                    ],
                    "milestone": "🏆 Transformation Complete: 80% fewer escalations, £30k+ in contracts, GM ready to hire"
                }
            ],
            "successMetrics": [
                {"metric": "Daily Calls/Texts from Staff", "baseline": "10-15 per day", "target": "2-3 per day"},
                {"metric": "Weekend Work", "baseline": "Every weekend", "target": "Rare emergencies only"},
                {"metric": "Recurring Contract Revenue", "baseline": "£0", "target": "£30,000/year signed"},
                {"metric": "Documented SOPs", "baseline": "0 (all in Tom''s head)", "target": "10 core procedures"}
            ]
        }'::jsonb,
        '{
            "assetScores": [
                {"category": "Intellectual Capital", "score": 35, "maxScore": 100, "percentage": 35, "issues": ["85% knowledge dependency on founder", "Key processes undocumented"], "opportunities": ["Document repair procedures", "Create training materials"]},
                {"category": "Brand & Trust", "score": 75, "maxScore": 100, "percentage": 75, "issues": ["80% buy from Tom personally"], "opportunities": ["20+ years of rowing world relationships", "Podcast reach"]},
                {"category": "Market Position", "score": 70, "maxScore": 100, "percentage": 70, "issues": [], "opportunities": ["Britain''s leading Concept2 specialist", "Exclusive relationships"]},
                {"category": "Systems & Scale", "score": 30, "maxScore": 100, "percentage": 30, "issues": ["Sales would fail without Tom", "Delivery needs oversight", "Finance would fail"], "opportunities": ["Systematize common repairs", "Scheduling software"]},
                {"category": "People & Culture", "score": 40, "maxScore": 100, "percentage": 40, "issues": ["No succession for Tom''s role", "Key person leaving is top fear"], "opportunities": ["Train existing staff", "Define GM role"]},
                {"category": "Financial & Exit", "score": 45, "maxScore": 100, "percentage": 45, "issues": ["No idea of business value"], "opportunities": ["Strong brand assets", "Recurring revenue potential"]}
            ],
            "overallScore": 49,
            "riskRegister": [
                {"title": "Extreme Founder Dependency", "severity": "Critical", "impact": "85% of knowledge in Tom''s head", "mitigation": "Document all procedures, train staff"},
                {"title": "Key Person Risk", "severity": "High", "impact": "Tom identified ''key person leaving'' as #1 fear", "mitigation": "Cross-train, document, build culture"},
                {"title": "No Succession Plan", "severity": "High", "impact": "Nobody can step into Tom''s role", "mitigation": "Hire and develop GM over 6-12 months"}
            ],
            "valueGaps": [
                {"area": "Process Documentation", "gap": 150000, "effort": "Medium", "actions": ["Document top 10 repair procedures"]},
                {"area": "Recurring Revenue", "gap": 100000, "effort": "Medium", "actions": ["Launch service contracts"]},
                {"area": "Brand Separation", "gap": 80000, "effort": "High", "actions": ["Build business brand vs Tom''s personal brand"]}
            ],
            "totalOpportunity": 330000,
            "generatedAt": "2025-11-29T12:00:00Z"
        }'::jsonb,
        'anthropic/claude-sonnet-4',
        '2.0.0-narrative',
        0.08,
        25000,
        true
    )
    RETURNING id INTO roadmap_id;

    RAISE NOTICE 'Created roadmap with id: %', roadmap_id;

    -- Create tasks from the roadmap
    INSERT INTO client_tasks (practice_id, client_id, roadmap_id, week_number, title, description, category, priority, sort_order, status)
    VALUES
        (tom_practice_id, tom_id, roadmap_id, 1, 'Create the ''Do Not Call Tom'' List', 'Document 10 common issues staff should handle themselves, with solutions. Share with team.', 'Operations', 'critical', 0, 'pending'),
        (tom_practice_id, tom_id, roadmap_id, 1, 'Book External Help for Salon Maintenance', 'Find a handyman/contractor for salon repairs. Stop doing it yourself on evenings/Sundays.', 'Operations', 'high', 1, 'pending'),
        (tom_practice_id, tom_id, roadmap_id, 1, 'Set Phone Boundaries', 'Communicate to team: 8pm-8am is emergency only. Define what counts as emergency.', 'People', 'high', 2, 'pending'),
        (tom_practice_id, tom_id, roadmap_id, 2, 'Document Top 3 Repair Procedures', 'Video yourself doing the 3 most common repairs. Staff can watch instead of calling.', 'Operations', 'critical', 0, 'pending'),
        (tom_practice_id, tom_id, roadmap_id, 2, 'Create Customer Decision Tree', 'When to offer on-site vs bring-to-shop vs replacement. Staff need this.', 'Operations', 'high', 1, 'pending'),
        (tom_practice_id, tom_id, roadmap_id, 3, 'Run First Training Session', 'Walk team through procedures and decision tree. Let them ask questions.', 'People', 'critical', 0, 'pending'),
        (tom_practice_id, tom_id, roadmap_id, 3, 'Set Up Escalation Protocol', 'Create clear guidelines: try X first, if Y happens then call Tom.', 'Operations', 'high', 1, 'pending'),
        (tom_practice_id, tom_id, roadmap_id, 3, 'Document 3 More Procedures', 'Continue building your SOP library.', 'Operations', 'medium', 2, 'pending'),
        (tom_practice_id, tom_id, roadmap_id, 4, 'Implement Scheduling Software', 'Set up a tool for job booking/dispatch. Stop being the human scheduler.', 'Systems', 'critical', 0, 'pending'),
        (tom_practice_id, tom_id, roadmap_id, 4, 'Create Customer Communication Templates', 'Standard emails/texts for booking, follow-up, etc. Staff can use without asking.', 'Systems', 'high', 1, 'pending');

    RAISE NOTICE 'Created tasks for Tom''s roadmap';

END $$;

-- Verify
SELECT 
    rm.id as roadmap_id,
    rm.is_active,
    rm.roadmap_data->'summary'->>'headline' as headline,
    rm.value_analysis->>'overallScore' as value_score,
    (SELECT COUNT(*) FROM client_tasks WHERE roadmap_id = rm.id) as task_count
FROM client_roadmaps rm
JOIN practice_members pm ON pm.id = rm.client_id
WHERE pm.email = 'tom@rowgear.com' AND rm.is_active = true;

