-- ============================================================================
-- SERVICE LINES SCHEMA
-- ============================================================================
-- Enables multiple service offerings (365 Method, Management Accounts, 
-- Systems Audit, Fractional CFO/COO) with per-service onboarding assessments
-- ============================================================================

-- ============================================================================
-- 1. SERVICE LINE DEFINITIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,  -- 'management_accounts', 'systems_audit', 'fractional_executive', '365_method'
    name text NOT NULL,
    short_description text,
    full_description text,
    icon text,  -- Lucide icon name
    base_pricing jsonb,  -- Pricing tiers
    assessment_config jsonb,  -- Question structure for onboarding
    vp_generation_prompt text,  -- LLM prompt template for value proposition
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. CLIENT SERVICE LINE ENROLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_service_lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id uuid NOT NULL,
    service_line_id uuid NOT NULL REFERENCES service_lines(id) ON DELETE CASCADE,
    status text DEFAULT 'invited',  -- 'invited', 'onboarding', 'proposal_sent', 'active', 'paused', 'completed'
    invited_at timestamptz,
    invited_by uuid,  -- Team member who invited
    onboarding_started_at timestamptz,
    onboarding_completed_at timestamptz,
    value_proposition jsonb,  -- Generated VP
    recommended_tier text,
    recommended_price decimal(10,2),
    proposal_sent_at timestamptz,
    accepted_at timestamptz,
    accepted_tier text,
    accepted_price decimal(10,2),
    declined_at timestamptz,
    decline_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(client_id, service_line_id)
);

-- ============================================================================
-- 3. SERVICE LINE ASSESSMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_line_assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_service_line_id uuid REFERENCES client_service_lines(id) ON DELETE CASCADE,
    client_id uuid NOT NULL,
    practice_id uuid,
    service_line_code text NOT NULL,  -- For easy querying
    responses jsonb NOT NULL DEFAULT '{}',
    extracted_insights jsonb,  -- Emotional anchors, pain points, etc.
    completion_percentage integer DEFAULT 0,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. CLIENT INVITATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id uuid NOT NULL,
    invited_by uuid NOT NULL,  -- Team member who invited
    email text NOT NULL,
    name text,
    service_line_ids uuid[] DEFAULT '{}',  -- Which services they're invited to
    invitation_token text UNIQUE NOT NULL,
    status text DEFAULT 'pending',  -- 'pending', 'accepted', 'expired', 'cancelled'
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    created_client_id uuid,  -- Populated when they sign up
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. CLIENT FINANCIAL SNAPSHOT (for VP generation)
-- ============================================================================

ALTER TABLE practice_members 
  ADD COLUMN IF NOT EXISTS financial_snapshot jsonb DEFAULT '{}';
-- Structure: {
--   annual_revenue: number,
--   monthly_revenue: number,
--   gross_margin: number,
--   staff_cost_ratio: number,
--   debtor_days: number,
--   team_size: number,
--   growth_rate: number,
--   monthly_burn: number,
--   runway_months: number,
--   snapshot_date: timestamp
-- }

-- ============================================================================
-- 6. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_client_service_lines_client ON client_service_lines(client_id);
CREATE INDEX IF NOT EXISTS idx_client_service_lines_service ON client_service_lines(service_line_id);
CREATE INDEX IF NOT EXISTS idx_client_service_lines_status ON client_service_lines(status);
CREATE INDEX IF NOT EXISTS idx_service_line_assessments_client ON service_line_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(invitation_token);

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_line_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Service lines are public (read)
CREATE POLICY "Anyone can view active service lines" ON service_lines
  FOR SELECT USING (is_active = true);

-- Team members can manage service lines for their practice
CREATE POLICY "Team can manage client service lines" ON client_service_lines
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Clients can view their own service lines
CREATE POLICY "Clients can view own service lines" ON client_service_lines
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'client'
    )
  );

-- Team can manage assessments
CREATE POLICY "Team can manage assessments" ON service_line_assessments
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Clients can manage their own assessments
CREATE POLICY "Clients can manage own assessments" ON service_line_assessments
  FOR ALL USING (
    client_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'client'
    )
  );

-- Team can manage invitations
CREATE POLICY "Team can manage invitations" ON client_invitations
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- ============================================================================
-- 8. SEED SERVICE LINE DATA
-- ============================================================================

INSERT INTO service_lines (code, name, short_description, full_description, icon, base_pricing, display_order) VALUES
(
  '365_method',
  '365 Alignment Program',
  'Transform your business and life with our comprehensive 12-month program',
  'The 365 Method is our flagship transformation program that aligns your business with your life goals. Through three assessments, we create a personalized 5-year vision, 6-month shift plan, and 12-week sprint.',
  'Compass',
  '{"monthly": 650, "annual": 6500}',
  1
),
(
  'management_accounts',
  'Management Accounts',
  'Monthly financial visibility that drives better decisions',
  'P&L, Balance Sheet, KPI Commentary, Cash Flow Waterfall, and Spotlight Analysis delivered within 10 working days of month-end. Finally understand your numbers.',
  'LineChart',
  '{"monthly": 650, "quarterly": 1750}',
  2
),
(
  'systems_audit',
  'Systems Audit',
  'Identify and fix the operational bottlenecks holding you back',
  'Comprehensive review of your tech stack, processes, and integrations. We find the manual workarounds, data silos, and inefficiencies, then recommend solutions.',
  'Settings',
  '{"single_area": 7500, "two_areas": 12000, "comprehensive": 18000, "implementation_from": 10000}',
  3
),
(
  'fractional_executive',
  'Fractional CFO/COO',
  'Executive expertise without the full-time cost',
  'Senior financial or operational leadership on a part-time basis. Perfect for scaling businesses that need strategic guidance but arent ready for a full-time hire.',
  'Users',
  '{"cfo_light": 3500, "cfo_regular": 6000, "cfo_intensive": 12000, "coo_light": 3000, "coo_regular": 5500, "coo_intensive": 10000}',
  4
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  icon = EXCLUDED.icon,
  base_pricing = EXCLUDED.base_pricing,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- ============================================================================
-- 9. LINK EXISTING 365 METHOD CLIENTS
-- ============================================================================

-- For existing clients with roadmaps, create 365_method enrolments
INSERT INTO client_service_lines (client_id, practice_id, service_line_id, status, onboarding_completed_at, created_at)
SELECT 
  pm.id,
  pm.practice_id,
  (SELECT id FROM service_lines WHERE code = '365_method'),
  'active',
  cr.created_at,
  cr.created_at
FROM practice_members pm
JOIN client_roadmaps cr ON cr.client_id = pm.id
WHERE pm.member_type = 'client'
ON CONFLICT (client_id, service_line_id) DO NOTHING;

-- Verification
SELECT 
  sl.name as service_line,
  COUNT(csl.id) as enrolled_clients,
  COUNT(CASE WHEN csl.status = 'active' THEN 1 END) as active
FROM service_lines sl
LEFT JOIN client_service_lines csl ON csl.service_line_id = sl.id
GROUP BY sl.id, sl.name
ORDER BY sl.display_order;

