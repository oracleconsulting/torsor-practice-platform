-- ============================================================================
-- SERVICE WORKFLOW & TIERS SYSTEM
-- ============================================================================
-- Define workflow phases, service tiers, and deliverable assignments
-- ============================================================================

-- ============================================================================
-- 1. WORKFLOW PHASES
-- ============================================================================
-- Define standard phases that can be customized per service

CREATE TABLE IF NOT EXISTS service_workflow_phases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id uuid,  -- NULL = global template, UUID = practice-specific
    service_line_code text NOT NULL,
    phase_code text NOT NULL,
    phase_name text NOT NULL,
    description text,
    typical_duration text,  -- e.g., "1-2 weeks", "Ongoing"
    display_order integer DEFAULT 0,
    icon text,  -- lucide icon name
    color text DEFAULT 'gray',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(practice_id, service_line_code, phase_code)
);

-- Seed default workflow phases (global templates)
INSERT INTO service_workflow_phases (practice_id, service_line_code, phase_code, phase_name, description, typical_duration, display_order, icon, color) VALUES
-- 365 Alignment
(NULL, '365_method', 'discovery', 'Discovery', 'Understand goals, challenges, and current state', '1-2 weeks', 1, 'Search', 'blue'),
(NULL, '365_method', 'design', 'Design', 'Create 5-year vision, 6-month shift, 12-week sprint', '1 week', 2, 'Pencil', 'violet'),
(NULL, '365_method', 'deliver', 'Deliver', 'Weekly accountability, monthly strategy sessions', 'Ongoing', 3, 'Rocket', 'emerald'),
(NULL, '365_method', 'review', 'Review', 'Quarterly progress review and roadmap adjustment', 'Quarterly', 4, 'RefreshCw', 'amber'),

-- Management Accounts
(NULL, 'management_accounts', 'onboard', 'Onboarding', 'System access, KPI definition, template setup', '1-2 weeks', 1, 'Settings', 'blue'),
(NULL, 'management_accounts', 'prepare', 'Preparation', 'Data extraction, reconciliation, pack creation', 'Monthly', 2, 'FileText', 'violet'),
(NULL, 'management_accounts', 'analyze', 'Analysis', 'Commentary, variance analysis, insights', 'Monthly', 3, 'BarChart3', 'emerald'),
(NULL, 'management_accounts', 'present', 'Presentation', 'Review call, strategic recommendations', 'Monthly', 4, 'Presentation', 'amber'),

-- Fractional CFO
(NULL, 'fractional_cfo', 'assess', 'Assessment', 'Financial health check, priority identification', '2 weeks', 1, 'ClipboardCheck', 'blue'),
(NULL, 'fractional_cfo', 'strategize', 'Strategy', 'Financial roadmap, funding strategy, board prep', 'Ongoing', 2, 'Target', 'violet'),
(NULL, 'fractional_cfo', 'execute', 'Execution', 'Cash management, investor relations, modeling', 'Ongoing', 3, 'Zap', 'emerald'),
(NULL, 'fractional_cfo', 'report', 'Reporting', 'Board packs, investor updates, KPI tracking', 'Monthly', 4, 'FileBarChart', 'amber'),

-- Systems Audit
(NULL, 'systems_audit', 'discover', 'Discovery', 'Map current systems, integrations, pain points', '1 week', 1, 'Search', 'blue'),
(NULL, 'systems_audit', 'diagnose', 'Diagnosis', 'Gap analysis, inefficiency identification', '1 week', 2, 'Stethoscope', 'violet'),
(NULL, 'systems_audit', 'recommend', 'Recommendations', 'Prioritized roadmap, vendor evaluation', '1 week', 3, 'Lightbulb', 'emerald'),
(NULL, 'systems_audit', 'implement', 'Implementation', 'Oversee changes, training, optimization', 'Ongoing', 4, 'Wrench', 'amber')

ON CONFLICT (practice_id, service_line_code, phase_code) DO UPDATE SET
    phase_name = EXCLUDED.phase_name,
    description = EXCLUDED.description,
    updated_at = now();

-- ============================================================================
-- 2. SERVICE TIERS
-- ============================================================================
-- Define pricing tiers for each service

CREATE TABLE IF NOT EXISTS service_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id uuid,  -- NULL = global template
    service_line_code text NOT NULL,
    tier_code text NOT NULL,
    tier_name text NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    
    -- Pricing
    monthly_fee numeric,
    setup_fee numeric,
    included_hours_per_month numeric,
    additional_hour_rate numeric,
    
    -- Features
    is_popular boolean DEFAULT false,  -- Highlight as recommended
    is_active boolean DEFAULT true,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(practice_id, service_line_code, tier_code)
);

-- Seed default tiers
INSERT INTO service_tiers (practice_id, service_line_code, tier_code, tier_name, description, display_order, monthly_fee, setup_fee, included_hours_per_month, is_popular) VALUES
-- 365 Alignment
(NULL, '365_method', 'essentials', 'Essentials', 'Monthly strategy session + weekly check-ins', 1, 750, 500, 4, false),
(NULL, '365_method', 'professional', 'Professional', 'Full 365 programme with board meetings', 2, 1500, 750, 8, true),
(NULL, '365_method', 'premium', 'Premium', 'Intensive support with unlimited access', 3, 2500, 1000, 16, false),

-- Management Accounts
(NULL, 'management_accounts', 'core', 'Core', 'Monthly P&L, Balance Sheet, basic KPIs', 1, 650, 350, 6, false),
(NULL, 'management_accounts', 'enhanced', 'Enhanced', 'Full pack with commentary and spotlights', 2, 950, 500, 10, true),
(NULL, 'management_accounts', 'strategic', 'Strategic', 'Deep analysis, forecasting, board-ready', 3, 1500, 750, 16, false),

-- Fractional CFO
(NULL, 'fractional_cfo', 'advisory', 'Advisory', 'Monthly strategic finance input', 1, 2000, 1000, 8, false),
(NULL, 'fractional_cfo', 'embedded', 'Embedded', 'Weekly involvement, cash & investor focus', 2, 4000, 1500, 16, true),
(NULL, 'fractional_cfo', 'executive', 'Executive', 'Near full-time strategic finance partner', 3, 7500, 2500, 32, false),

-- Systems Audit
(NULL, 'systems_audit', 'review', 'Review', 'One-time systems health check', 1, 2000, 0, 12, false),
(NULL, 'systems_audit', 'optimize', 'Optimize', 'Review + implementation support', 2, 4000, 0, 24, true),
(NULL, 'systems_audit', 'transform', 'Transform', 'Full systems overhaul with ongoing support', 3, 8000, 0, 48, false)

ON CONFLICT (practice_id, service_line_code, tier_code) DO UPDATE SET
    tier_name = EXCLUDED.tier_name,
    monthly_fee = EXCLUDED.monthly_fee,
    updated_at = now();

-- ============================================================================
-- 3. UPDATE DELIVERABLES WITH TIER & PHASE ASSIGNMENTS
-- ============================================================================

-- Add columns to service_deliverables
ALTER TABLE service_deliverables ADD COLUMN IF NOT EXISTS workflow_phase_code text;
ALTER TABLE service_deliverables ADD COLUMN IF NOT EXISTS included_in_tiers text[] DEFAULT '{}';
ALTER TABLE service_deliverables ADD COLUMN IF NOT EXISTS is_addon boolean DEFAULT false;
ALTER TABLE service_deliverables ADD COLUMN IF NOT EXISTS addon_price numeric;

-- Update existing deliverables with phase and tier assignments
UPDATE service_deliverables SET 
    workflow_phase_code = 'deliver',
    included_in_tiers = ARRAY['essentials', 'professional', 'premium']
WHERE service_line_code = '365_method' AND code = '365_strategy_session';

UPDATE service_deliverables SET 
    workflow_phase_code = 'deliver',
    included_in_tiers = ARRAY['essentials', 'professional', 'premium']
WHERE service_line_code = '365_method' AND code = '365_weekly_checkin';

UPDATE service_deliverables SET 
    workflow_phase_code = 'review',
    included_in_tiers = ARRAY['professional', 'premium']
WHERE service_line_code = '365_method' AND code = '365_quarterly_review';

UPDATE service_deliverables SET 
    workflow_phase_code = 'design',
    included_in_tiers = ARRAY['essentials', 'professional', 'premium']
WHERE service_line_code = '365_method' AND code = '365_roadmap_generation';

UPDATE service_deliverables SET 
    workflow_phase_code = 'deliver',
    included_in_tiers = ARRAY['professional', 'premium']
WHERE service_line_code = '365_method' AND code = '365_board_meeting';

-- Management Accounts
UPDATE service_deliverables SET 
    workflow_phase_code = 'prepare',
    included_in_tiers = ARRAY['core', 'enhanced', 'strategic']
WHERE service_line_code = 'management_accounts' AND code = 'ma_monthly_pack';

UPDATE service_deliverables SET 
    workflow_phase_code = 'analyze',
    included_in_tiers = ARRAY['enhanced', 'strategic']
WHERE service_line_code = 'management_accounts' AND code = 'ma_commentary';

UPDATE service_deliverables SET 
    workflow_phase_code = 'analyze',
    included_in_tiers = ARRAY['core', 'enhanced', 'strategic']
WHERE service_line_code = 'management_accounts' AND code = 'ma_kpi_dashboard';

UPDATE service_deliverables SET 
    workflow_phase_code = 'analyze',
    included_in_tiers = ARRAY['strategic'],
    is_addon = true,
    addon_price = 250
WHERE service_line_code = 'management_accounts' AND code = 'ma_spotlight';

UPDATE service_deliverables SET 
    workflow_phase_code = 'present',
    included_in_tiers = ARRAY['enhanced', 'strategic']
WHERE service_line_code = 'management_accounts' AND code = 'ma_review_call';

-- ============================================================================
-- 4. SERVICE LINE CONFIGURATION
-- ============================================================================
-- Store practice-specific service line settings

CREATE TABLE IF NOT EXISTS service_line_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id uuid NOT NULL,
    service_line_code text NOT NULL,
    
    -- Display
    custom_name text,  -- Override default name
    tagline text,
    detailed_description text,
    
    -- Status
    is_offered boolean DEFAULT true,
    is_accepting_clients boolean DEFAULT true,
    waitlist_enabled boolean DEFAULT false,
    
    -- Capacity
    max_clients_total integer,
    current_client_count integer DEFAULT 0,
    
    -- Custom settings (JSON for flexibility)
    custom_settings jsonb DEFAULT '{}',
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(practice_id, service_line_code)
);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workflow_phases_service ON service_workflow_phases(service_line_code);
CREATE INDEX IF NOT EXISTS idx_service_tiers_service ON service_tiers(service_line_code);
CREATE INDEX IF NOT EXISTS idx_service_line_config_practice ON service_line_config(practice_id);

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE service_workflow_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_line_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read global templates (practice_id IS NULL)
-- Team members can read/write their practice's config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_members') THEN
        DROP POLICY IF EXISTS "Read workflow phases" ON service_workflow_phases;
        CREATE POLICY "Read workflow phases" ON service_workflow_phases
            FOR SELECT USING (
                practice_id IS NULL OR
                practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())
            );

        DROP POLICY IF EXISTS "Manage workflow phases" ON service_workflow_phases;
        CREATE POLICY "Manage workflow phases" ON service_workflow_phases
            FOR ALL USING (
                practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())
            );

        DROP POLICY IF EXISTS "Read service tiers" ON service_tiers;
        CREATE POLICY "Read service tiers" ON service_tiers
            FOR SELECT USING (
                practice_id IS NULL OR
                practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())
            );

        DROP POLICY IF EXISTS "Manage service tiers" ON service_tiers;
        CREATE POLICY "Manage service tiers" ON service_tiers
            FOR ALL USING (
                practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())
            );

        DROP POLICY IF EXISTS "Manage service config" ON service_line_config;
        CREATE POLICY "Manage service config" ON service_line_config
            FOR ALL USING (
                practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())
            );
    END IF;
END $$;

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

SELECT 'service_workflow_phases' as table_name, COUNT(*) as rows FROM service_workflow_phases
UNION ALL SELECT 'service_tiers', COUNT(*) FROM service_tiers
UNION ALL SELECT 'service_line_config', COUNT(*) FROM service_line_config;

