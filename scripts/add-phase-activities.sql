-- ============================================================================
-- PHASE ACTIVITIES & SKILL MATCHING
-- ============================================================================
-- Define activities within workflow phases and match them to skills
-- ============================================================================

-- ============================================================================
-- 1. PHASE ACTIVITIES (Bullet points within each phase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS phase_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id uuid REFERENCES service_workflow_phases(id) ON DELETE CASCADE,
    activity_name text NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    estimated_hours numeric,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phase_activities_phase ON phase_activities(phase_id);

-- ============================================================================
-- 2. ACTIVITY SKILL MAPPINGS
-- ============================================================================
-- Link activities to skills they require

CREATE TABLE IF NOT EXISTS activity_skill_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id uuid REFERENCES phase_activities(id) ON DELETE CASCADE,
    skill_id uuid,  -- References skills table
    skill_name text NOT NULL,  -- Denormalized for display
    importance text DEFAULT 'required',  -- 'required', 'helpful', 'nice_to_have'
    minimum_level integer DEFAULT 3,
    created_at timestamptz DEFAULT now(),
    UNIQUE(activity_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_activity_skills_activity ON activity_skill_mappings(activity_id);

-- ============================================================================
-- 3. TEAM PHASE ASSIGNMENTS
-- ============================================================================
-- Assign team members to specific phases within a delivery team

CREATE TABLE IF NOT EXISTS team_phase_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES delivery_teams(id) ON DELETE CASCADE,
    member_id uuid NOT NULL,  -- References practice_members
    phase_id uuid REFERENCES service_workflow_phases(id) ON DELETE CASCADE,
    is_phase_lead boolean DEFAULT false,
    allocated_hours numeric,
    fit_score integer,  -- Calculated fit based on skills
    notes text,
    assigned_at timestamptz DEFAULT now(),
    UNIQUE(team_id, member_id, phase_id)
);

CREATE INDEX IF NOT EXISTS idx_team_phase_assignments_team ON team_phase_assignments(team_id);

-- ============================================================================
-- 4. SEED SOME EXAMPLE ACTIVITIES
-- ============================================================================

-- Get 365 method phase IDs and insert activities
DO $$
DECLARE
    discovery_id uuid;
    design_id uuid;
    deliver_id uuid;
    review_id uuid;
BEGIN
    -- Get phase IDs for 365_method
    SELECT id INTO discovery_id FROM service_workflow_phases 
    WHERE service_line_code = '365_method' AND phase_code = 'discovery' AND practice_id IS NULL LIMIT 1;
    
    SELECT id INTO design_id FROM service_workflow_phases 
    WHERE service_line_code = '365_method' AND phase_code = 'design' AND practice_id IS NULL LIMIT 1;
    
    SELECT id INTO deliver_id FROM service_workflow_phases 
    WHERE service_line_code = '365_method' AND phase_code = 'deliver' AND practice_id IS NULL LIMIT 1;
    
    SELECT id INTO review_id FROM service_workflow_phases 
    WHERE service_line_code = '365_method' AND phase_code = 'review' AND practice_id IS NULL LIMIT 1;

    -- Discovery phase activities
    IF discovery_id IS NOT NULL THEN
        INSERT INTO phase_activities (phase_id, activity_name, description, display_order) VALUES
        (discovery_id, 'Initial consultation call', 'Understand client goals, pain points, current situation', 1),
        (discovery_id, 'Business deep-dive questionnaire', 'Gather detailed information about operations, financials, team', 2),
        (discovery_id, 'Hidden value assessment', 'Identify untapped opportunities and risks', 3),
        (discovery_id, 'Stakeholder mapping', 'Understand key people, relationships, decision-makers', 4)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Design phase activities  
    IF design_id IS NOT NULL THEN
        INSERT INTO phase_activities (phase_id, activity_name, description, display_order) VALUES
        (design_id, '5-year vision creation', 'Develop compelling long-term narrative', 1),
        (design_id, '6-month shift planning', 'Define key transformations and milestones', 2),
        (design_id, '12-week sprint design', 'Create actionable weekly plan', 3),
        (design_id, 'North Star definition', 'Crystallize the core driving purpose', 4),
        (design_id, 'Roadmap presentation', 'Present and refine with client', 5)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Deliver phase activities
    IF deliver_id IS NOT NULL THEN
        INSERT INTO phase_activities (phase_id, activity_name, description, display_order) VALUES
        (deliver_id, 'Weekly accountability check-in', 'Brief progress and blockers review', 1),
        (deliver_id, 'Monthly strategy session', 'Deep-dive on priorities and adjustments', 2),
        (deliver_id, 'Task tracking and follow-up', 'Ensure sprint tasks are progressing', 3),
        (deliver_id, 'Resource and referral connections', 'Connect to network as needed', 4),
        (deliver_id, 'Board meeting facilitation', 'Run strategic board discussions', 5)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Review phase activities
    IF review_id IS NOT NULL THEN
        INSERT INTO phase_activities (phase_id, activity_name, description, display_order) VALUES
        (review_id, 'Quarterly progress assessment', 'Measure against 12-week sprint goals', 1),
        (review_id, 'Vision alignment check', 'Ensure still on track to 5-year vision', 2),
        (review_id, 'Roadmap recalibration', 'Adjust next quarter based on learnings', 3),
        (review_id, 'Client satisfaction review', 'Gather feedback, refine approach', 4)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE phase_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_skill_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_phase_assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can read activities (they're referenced from global templates)
CREATE POLICY "Read phase activities" ON phase_activities
    FOR SELECT USING (true);

CREATE POLICY "Read activity skills" ON activity_skill_mappings
    FOR SELECT USING (true);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_members') THEN
        DROP POLICY IF EXISTS "Manage phase assignments" ON team_phase_assignments;
        CREATE POLICY "Manage phase assignments" ON team_phase_assignments
            FOR ALL USING (
                team_id IN (
                    SELECT id FROM delivery_teams WHERE practice_id IN (
                        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                    )
                )
            );
    END IF;
END $$;

-- ============================================================================
-- 6. VERIFICATION
-- ============================================================================

SELECT 
    swp.phase_name,
    COUNT(pa.id) as activity_count
FROM service_workflow_phases swp
LEFT JOIN phase_activities pa ON pa.phase_id = swp.id
WHERE swp.service_line_code = '365_method'
GROUP BY swp.phase_name, swp.display_order
ORDER BY swp.display_order;

