-- ============================================================================
-- DELIVERY MANAGEMENT SYSTEM
-- ============================================================================
-- Links service lines with skills, roles, teams, and capacity
-- Enables client-specific delivery teams and capacity planning
-- ============================================================================

-- ============================================================================
-- 1. SERVICE DELIVERABLES
-- ============================================================================
-- Break down each service into specific deliverable components

CREATE TABLE IF NOT EXISTS service_deliverables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_line_code text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    delivery_frequency text,  -- 'weekly', 'monthly', 'quarterly', 'one-time', 'ongoing'
    estimated_hours_per_cycle numeric,  -- Hours needed per delivery cycle
    is_core boolean DEFAULT true,  -- Core vs optional deliverable
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(service_line_code, code)
);

-- Seed deliverables for each service
INSERT INTO service_deliverables (service_line_code, code, name, description, delivery_frequency, estimated_hours_per_cycle, is_core, display_order) VALUES
-- 365 Alignment Programme
('365_method', '365_strategy_session', 'Monthly Strategy Session', '90-minute deep-dive on progress and priorities', 'monthly', 2, true, 1),
('365_method', '365_weekly_checkin', 'Weekly Check-in', 'Quick pulse check on sprint tasks', 'weekly', 0.5, true, 2),
('365_method', '365_quarterly_review', 'Quarterly Vision Review', 'Review and adjust 5-year vision and 6-month shift', 'quarterly', 3, true, 3),
('365_method', '365_roadmap_generation', 'Roadmap Generation', 'Initial 5-year vision, 6-month shift, 12-week sprint', 'one-time', 4, true, 4),
('365_method', '365_board_meeting', 'Virtual Board Meeting', 'Strategic board-level discussion', 'monthly', 2, false, 5),

-- Management Accounts
('management_accounts', 'ma_monthly_pack', 'Monthly Management Pack', 'P&L, Balance Sheet, Cash Flow, KPIs', 'monthly', 6, true, 1),
('management_accounts', 'ma_commentary', 'Performance Commentary', 'Written analysis of variances and trends', 'monthly', 2, true, 2),
('management_accounts', 'ma_kpi_dashboard', 'KPI Dashboard', 'Visual dashboard of key metrics', 'monthly', 1, true, 3),
('management_accounts', 'ma_spotlight', 'Spotlight Analysis', 'Deep dive into one area each month', 'monthly', 2, false, 4),
('management_accounts', 'ma_review_call', 'Review Call', 'Walkthrough of the pack with client', 'monthly', 1, true, 5),

-- Fractional CFO
('fractional_cfo', 'cfo_strategic_finance', 'Strategic Financial Planning', 'Budgets, forecasts, scenario planning', 'monthly', 8, true, 1),
('fractional_cfo', 'cfo_cash_management', 'Cash Flow Management', 'Weekly cash forecasting and monitoring', 'weekly', 2, true, 2),
('fractional_cfo', 'cfo_board_pack', 'Board Pack Preparation', 'Investor/board-ready financial reporting', 'monthly', 4, false, 3),
('fractional_cfo', 'cfo_fundraising', 'Fundraising Support', 'Pitch deck financials, investor conversations', 'ongoing', 8, false, 4),
('fractional_cfo', 'cfo_ad_hoc', 'Ad-hoc Financial Support', 'Decision support, deal analysis', 'ongoing', 4, true, 5),

-- Fractional COO
('fractional_coo', 'coo_ops_review', 'Operations Review', 'Process audit and improvement', 'monthly', 6, true, 1),
('fractional_coo', 'coo_team_structure', 'Team Structure Design', 'Org chart, roles, responsibilities', 'quarterly', 4, true, 2),
('fractional_coo', 'coo_process_docs', 'Process Documentation', 'SOPs and playbooks', 'ongoing', 4, true, 3),
('fractional_coo', 'coo_kpi_setup', 'Operational KPI Setup', 'Define and track operational metrics', 'one-time', 6, true, 4),
('fractional_coo', 'coo_team_coaching', 'Team Coaching', 'Management coaching and development', 'weekly', 2, false, 5),

-- Systems Audit
('systems_audit', 'sa_discovery', 'Systems Discovery', 'Map current tech stack and integrations', 'one-time', 8, true, 1),
('systems_audit', 'sa_gap_analysis', 'Gap Analysis', 'Identify inefficiencies and manual workarounds', 'one-time', 6, true, 2),
('systems_audit', 'sa_roadmap', 'Systems Roadmap', 'Prioritized improvement recommendations', 'one-time', 4, true, 3),
('systems_audit', 'sa_implementation', 'Implementation Support', 'Oversee system improvements', 'ongoing', 6, false, 4),
('systems_audit', 'sa_retainer', 'Monthly Systems Retainer', 'Ongoing optimization and support', 'monthly', 4, false, 5),

-- Business Advisory & Exit
('business_advisory', 'ba_valuation', 'Business Valuation', 'Professional valuation analysis', 'quarterly', 8, true, 1),
('business_advisory', 'ba_exit_planning', 'Exit Planning', 'Timeline, preparation checklist', 'quarterly', 4, true, 2),
('business_advisory', 'ba_succession', 'Succession Planning', 'Key person and ownership transition', 'quarterly', 4, false, 3),
('business_advisory', 'ba_tax_strategy', 'Tax Efficiency Review', 'Extraction and structure optimization', 'quarterly', 4, false, 4),
('business_advisory', 'ba_strategic_review', 'Strategic Review', 'Business model and market position', 'monthly', 3, true, 5),

-- Benchmarking
('benchmarking', 'bm_industry_report', 'Industry Benchmark Report', 'Comparison vs peer group', 'quarterly', 4, true, 1),
('benchmarking', 'bm_interpretation', 'Strategic Interpretation', 'What the numbers mean for you', 'quarterly', 2, true, 2),
('benchmarking', 'bm_action_plan', 'Improvement Action Plan', 'Specific improvements to close gaps', 'quarterly', 2, true, 3)

ON CONFLICT (service_line_code, code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now();

-- ============================================================================
-- 2. SERVICE ROLES
-- ============================================================================
-- Define roles needed for each service delivery

CREATE TABLE IF NOT EXISTS service_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_line_code text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    is_lead boolean DEFAULT false,  -- Is this the lead role?
    min_hours_per_client numeric,  -- Minimum hours per client per month
    max_hours_per_client numeric,  -- Maximum hours per client per month
    required_skill_level text DEFAULT 'intermediate',  -- 'foundational', 'intermediate', 'advanced', 'expert'
    is_required boolean DEFAULT true,  -- Must this role be filled?
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(service_line_code, code)
);

-- Seed roles for each service
INSERT INTO service_roles (service_line_code, code, name, description, is_lead, min_hours_per_client, max_hours_per_client, required_skill_level, is_required, display_order) VALUES
-- 365 Alignment
('365_method', '365_lead_coach', 'Lead Coach', 'Primary strategist and accountability partner', true, 4, 8, 'expert', true, 1),
('365_method', '365_support_coach', 'Support Coach', 'Backup and session support', false, 1, 3, 'advanced', false, 2),
('365_method', '365_analyst', 'Business Analyst', 'Roadmap generation and analysis', false, 2, 4, 'intermediate', true, 3),

-- Management Accounts
('management_accounts', 'ma_lead', 'Lead Accountant', 'Primary preparer and reviewer', true, 4, 8, 'advanced', true, 1),
('management_accounts', 'ma_preparer', 'Accounts Preparer', 'Monthly pack preparation', false, 4, 8, 'intermediate', true, 2),
('management_accounts', 'ma_analyst', 'Financial Analyst', 'Commentary and analysis', false, 2, 4, 'intermediate', false, 3),

-- Fractional CFO
('fractional_cfo', 'cfo_lead', 'Lead CFO', 'Strategic finance partner', true, 8, 20, 'expert', true, 1),
('fractional_cfo', 'cfo_analyst', 'Financial Analyst', 'Modelling and analysis support', false, 4, 10, 'advanced', false, 2),

-- Fractional COO
('fractional_coo', 'coo_lead', 'Lead COO', 'Operational leadership', true, 8, 20, 'expert', true, 1),
('fractional_coo', 'coo_pm', 'Project Manager', 'Implementation and follow-through', false, 4, 10, 'advanced', false, 2),

-- Systems Audit
('systems_audit', 'sa_lead', 'Systems Lead', 'Technical architecture and strategy', true, 6, 12, 'expert', true, 1),
('systems_audit', 'sa_analyst', 'Systems Analyst', 'Discovery and documentation', false, 4, 10, 'intermediate', true, 2),
('systems_audit', 'sa_implementer', 'Implementation Specialist', 'Technical implementation', false, 4, 12, 'advanced', false, 3),

-- Business Advisory
('business_advisory', 'ba_lead', 'Lead Advisor', 'Strategic advisory partner', true, 6, 12, 'expert', true, 1),
('business_advisory', 'ba_analyst', 'Business Analyst', 'Valuation and analysis', false, 4, 8, 'advanced', true, 2),

-- Benchmarking
('benchmarking', 'bm_lead', 'Benchmarking Lead', 'Strategic interpretation', true, 2, 4, 'expert', true, 1),
('benchmarking', 'bm_analyst', 'Data Analyst', 'Data collection and comparison', false, 2, 4, 'intermediate', true, 2)

ON CONFLICT (service_line_code, code) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

-- ============================================================================
-- 3. SERVICE ROLE SKILLS
-- ============================================================================
-- Map skills to service roles

CREATE TABLE IF NOT EXISTS service_role_skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_role_id uuid REFERENCES service_roles(id) ON DELETE CASCADE,
    skill_id uuid,  -- References your existing skills table
    skill_name text NOT NULL,  -- Denormalized for easy display
    importance text DEFAULT 'required',  -- 'required', 'preferred', 'nice_to_have'
    created_at timestamptz DEFAULT now(),
    UNIQUE(service_role_id, skill_name)
);

-- ============================================================================
-- 4. DELIVERY TEAMS
-- ============================================================================
-- Teams that can deliver services

CREATE TABLE IF NOT EXISTS delivery_teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id uuid NOT NULL,
    service_line_code text NOT NULL,
    name text NOT NULL,
    description text,
    is_default boolean DEFAULT false,  -- Default team for this service
    max_clients integer,  -- Maximum clients this team can handle
    current_client_count integer DEFAULT 0,
    status text DEFAULT 'active',  -- 'active', 'at_capacity', 'paused'
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_teams_practice ON delivery_teams(practice_id);
CREATE INDEX IF NOT EXISTS idx_delivery_teams_service ON delivery_teams(service_line_code);

-- ============================================================================
-- 5. TEAM MEMBER ASSIGNMENTS
-- ============================================================================
-- Assign practice members to delivery teams with specific roles

CREATE TABLE IF NOT EXISTS team_member_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES delivery_teams(id) ON DELETE CASCADE,
    member_id uuid NOT NULL,  -- References practice_members
    service_role_id uuid REFERENCES service_roles(id),
    role_name text NOT NULL,  -- Denormalized
    is_team_lead boolean DEFAULT false,
    allocated_hours_per_week numeric,  -- Hours allocated to this team
    status text DEFAULT 'active',  -- 'active', 'backup', 'training'
    assigned_at timestamptz DEFAULT now(),
    UNIQUE(team_id, member_id)
);

-- ============================================================================
-- 6. CLIENT ENGAGEMENTS
-- ============================================================================
-- Track which team is assigned to which client

CREATE TABLE IF NOT EXISTS client_engagements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,  -- References practice_members (client)
    practice_id uuid NOT NULL,
    service_line_code text NOT NULL,
    team_id uuid REFERENCES delivery_teams(id),
    
    -- Engagement details
    status text DEFAULT 'active',  -- 'prospect', 'onboarding', 'active', 'paused', 'completed', 'churned'
    start_date date,
    end_date date,
    
    -- Commercials
    monthly_fee numeric,
    contract_months integer,
    
    -- Capacity
    estimated_hours_per_month numeric,
    actual_hours_this_month numeric DEFAULT 0,
    
    -- Tracking
    last_delivery_date date,
    next_delivery_date date,
    health_score integer,  -- 1-10
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(client_id, service_line_code)
);

CREATE INDEX IF NOT EXISTS idx_client_engagements_practice ON client_engagements(practice_id);
CREATE INDEX IF NOT EXISTS idx_client_engagements_team ON client_engagements(team_id);
CREATE INDEX IF NOT EXISTS idx_client_engagements_status ON client_engagements(status);

-- ============================================================================
-- 7. ENGAGEMENT TEAM MEMBERS
-- ============================================================================
-- Specific team members assigned to a client engagement

CREATE TABLE IF NOT EXISTS engagement_team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id uuid REFERENCES client_engagements(id) ON DELETE CASCADE,
    member_id uuid NOT NULL,  -- References practice_members
    service_role_id uuid REFERENCES service_roles(id),
    role_name text NOT NULL,
    is_primary boolean DEFAULT false,  -- Primary contact for this role
    allocated_hours_per_month numeric,
    assigned_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 8. CAPACITY TRACKING
-- ============================================================================
-- Track member capacity across services

CREATE TABLE IF NOT EXISTS member_capacity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL,  -- References practice_members
    practice_id uuid NOT NULL,
    
    -- Weekly capacity
    total_hours_per_week numeric DEFAULT 40,
    available_hours_per_week numeric DEFAULT 35,
    allocated_hours_per_week numeric DEFAULT 0,
    
    -- By service line (JSONB for flexibility)
    service_allocations jsonb DEFAULT '{}',
    -- Example: { "365_method": 8, "management_accounts": 12, "fractional_cfo": 10 }
    
    -- Preferences
    preferred_services text[],  -- Service codes they prefer
    avoid_services text[],  -- Service codes to avoid
    
    -- Capacity status
    capacity_status text DEFAULT 'available',  -- 'available', 'limited', 'full', 'overloaded'
    next_availability_date date,  -- When they'll have capacity
    
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(member_id, practice_id)
);

-- ============================================================================
-- 9. MARKET DEMAND TRACKING
-- ============================================================================
-- Track interest/demand for each service

CREATE TABLE IF NOT EXISTS service_demand (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id uuid NOT NULL,
    service_line_code text NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    
    -- Demand metrics
    inquiries_count integer DEFAULT 0,
    proposals_sent integer DEFAULT 0,
    conversions integer DEFAULT 0,
    active_clients integer DEFAULT 0,
    
    -- Revenue
    monthly_recurring_revenue numeric DEFAULT 0,
    project_revenue numeric DEFAULT 0,
    
    -- Capacity
    team_capacity_hours numeric DEFAULT 0,
    team_utilized_hours numeric DEFAULT 0,
    utilization_rate numeric GENERATED ALWAYS AS (
        CASE WHEN team_capacity_hours > 0 
        THEN ROUND((team_utilized_hours / team_capacity_hours) * 100, 1) 
        ELSE 0 END
    ) STORED,
    
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(practice_id, service_line_code, period_start)
);

-- ============================================================================
-- 10. HELPER VIEWS
-- ============================================================================

-- Team capacity overview (no external dependencies)
CREATE OR REPLACE VIEW v_team_capacity AS
SELECT 
    dt.id as team_id,
    dt.practice_id,
    dt.service_line_code,
    dt.name as team_name,
    dt.max_clients,
    dt.current_client_count,
    COUNT(DISTINCT tma.member_id) as team_size,
    COALESCE(SUM(tma.allocated_hours_per_week), 0) as total_allocated_hours,
    dt.status
FROM delivery_teams dt
LEFT JOIN team_member_assignments tma ON tma.team_id = dt.id AND tma.status = 'active'
GROUP BY dt.id;

-- Member workload overview (depends on practice_members - created only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_members') THEN
        EXECUTE '
            CREATE OR REPLACE VIEW v_member_workload AS
            SELECT 
                mc.member_id,
                mc.practice_id,
                pm.name as member_name,
                mc.total_hours_per_week,
                mc.available_hours_per_week,
                mc.allocated_hours_per_week,
                (mc.available_hours_per_week - mc.allocated_hours_per_week) as spare_capacity,
                mc.capacity_status,
                mc.preferred_services,
                COUNT(DISTINCT etm.engagement_id) as active_engagements
            FROM member_capacity mc
            JOIN practice_members pm ON pm.id = mc.member_id
            LEFT JOIN engagement_team_members etm ON etm.member_id = mc.member_id
            LEFT JOIN client_engagements ce ON ce.id = etm.engagement_id AND ce.status = ''active''
            GROUP BY mc.id, pm.name, mc.member_id, mc.practice_id, mc.total_hours_per_week, 
                     mc.available_hours_per_week, mc.allocated_hours_per_week, mc.capacity_status, mc.preferred_services
        ';
    END IF;
END $$;

-- Service delivery summary (depends on service_lines - created only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_lines') THEN
        EXECUTE '
            CREATE OR REPLACE VIEW v_service_delivery_summary AS
            SELECT 
                sl.code as service_line_code,
                sl.name as service_name,
                COUNT(DISTINCT dt.id) as team_count,
                COUNT(DISTINCT ce.id) FILTER (WHERE ce.status = ''active'') as active_clients,
                SUM(ce.monthly_fee) FILTER (WHERE ce.status = ''active'') as monthly_revenue,
                AVG(ce.health_score) FILTER (WHERE ce.status = ''active'') as avg_health_score
            FROM service_lines sl
            LEFT JOIN delivery_teams dt ON dt.service_line_code = sl.code
            LEFT JOIN client_engagements ce ON ce.service_line_code = sl.code
            GROUP BY sl.code, sl.name
        ';
    END IF;
END $$;

-- ============================================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE delivery_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_capacity ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only created if practice_members table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_members') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Team sees practice teams" ON delivery_teams;
        DROP POLICY IF EXISTS "Team sees practice assignments" ON team_member_assignments;
        DROP POLICY IF EXISTS "Team sees practice engagements" ON client_engagements;
        DROP POLICY IF EXISTS "Team sees engagement members" ON engagement_team_members;
        DROP POLICY IF EXISTS "Team sees capacity" ON member_capacity;
        
        -- Create policies
        CREATE POLICY "Team sees practice teams" ON delivery_teams
            FOR ALL USING (
                practice_id IN (
                    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                )
            );

        CREATE POLICY "Team sees practice assignments" ON team_member_assignments
            FOR ALL USING (
                team_id IN (
                    SELECT id FROM delivery_teams WHERE practice_id IN (
                        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                    )
                )
            );

        CREATE POLICY "Team sees practice engagements" ON client_engagements
            FOR ALL USING (
                practice_id IN (
                    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                )
            );

        CREATE POLICY "Team sees engagement members" ON engagement_team_members
            FOR ALL USING (
                engagement_id IN (
                    SELECT id FROM client_engagements WHERE practice_id IN (
                        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                    )
                )
            );

        CREATE POLICY "Team sees capacity" ON member_capacity
            FOR ALL USING (
                practice_id IN (
                    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                )
            );
    ELSE
        RAISE NOTICE 'Skipping RLS policies - practice_members table not found. Run these policies after practice_members exists.';
    END IF;
END $$;

-- ============================================================================
-- 12. VERIFICATION
-- ============================================================================

SELECT 'service_deliverables' as table_name, COUNT(*) as rows FROM service_deliverables
UNION ALL SELECT 'service_roles', COUNT(*) FROM service_roles
UNION ALL SELECT 'delivery_teams', COUNT(*) FROM delivery_teams
UNION ALL SELECT 'client_engagements', COUNT(*) FROM client_engagements;

