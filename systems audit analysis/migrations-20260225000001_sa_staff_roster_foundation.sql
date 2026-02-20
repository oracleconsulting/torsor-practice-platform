-- ============================================================================
-- SA STAFF ROSTER — FOUNDATION
-- ============================================================================
-- 1. Create sa_staff_members table (Stage 1 roster, referenced in Stage 2/3)
-- 2. Add staff_member_ids to sa_system_inventory (who uses each system)
-- 3. Fix cost-of-chaos trigger to use engagement.hourly_rate instead of £35
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. sa_staff_members
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sa_staff_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    role_title TEXT,
    department TEXT CHECK (department IN (
        'finance', 'operations', 'sales', 'delivery',
        'admin', 'leadership', 'it', 'hr', 'other'
    )),
    hourly_rate DECIMAL(8,2) NOT NULL,
    hours_per_week DECIMAL(4,1) DEFAULT 37.5,

    is_key_person BOOLEAN DEFAULT FALSE,
    added_at_stage TEXT DEFAULT 'stage_1' CHECK (added_at_stage IN ('stage_1', 'stage_2', 'stage_3')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(engagement_id, name)
);

CREATE INDEX idx_sa_staff_members_engagement ON sa_staff_members(engagement_id);

CREATE OR REPLACE FUNCTION update_sa_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sa_staff_members_updated
    BEFORE UPDATE ON sa_staff_members FOR EACH ROW EXECUTE FUNCTION update_sa_timestamp();

ALTER TABLE sa_staff_members ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own staff roster (engagement belongs to their client_id)
CREATE POLICY "sa_staff_members_client_all" ON sa_staff_members
    FOR ALL USING (
        engagement_id IN (
            SELECT id FROM sa_engagements e
            WHERE e.client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
        )
    )
    WITH CHECK (
        engagement_id IN (
            SELECT id FROM sa_engagements e
            WHERE e.client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
        )
    );

-- Practice team can manage staff for their practice's engagements
CREATE POLICY "sa_staff_members_practice_all" ON sa_staff_members
    FOR ALL USING (
        engagement_id IN (
            SELECT e.id FROM sa_engagements e
            JOIN practice_members pm ON pm.practice_id = e.practice_id
            WHERE pm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        engagement_id IN (
            SELECT e.id FROM sa_engagements e
            JOIN practice_members pm ON pm.practice_id = e.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. staff_member_ids on sa_system_inventory
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE sa_system_inventory
    ADD COLUMN IF NOT EXISTS staff_member_ids UUID[];

COMMENT ON COLUMN sa_system_inventory.staff_member_ids IS
    'References to sa_staff_members who use this system. Replaces generic primary_users when roster exists.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Cost-of-chaos trigger: use engagement.hourly_rate
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_sa_cost_of_chaos()
RETURNS TRIGGER AS $$
DECLARE
    eng_hourly_rate DECIMAL;
    weeks_per_year INTEGER := 52;
    discovery_record RECORD;
BEGIN
    -- Use engagement's blended hourly rate (from roster or default £45)
    SELECT COALESCE(hourly_rate, 45.00) INTO eng_hourly_rate
    FROM sa_engagements
    WHERE id = NEW.engagement_id;

    -- Get discovery data for growth multiplier
    SELECT * INTO discovery_record
    FROM sa_discovery_responses
    WHERE engagement_id = NEW.engagement_id;

    IF discovery_record.expected_team_size_12mo IS NOT NULL
       AND discovery_record.team_size IS NOT NULL
       AND discovery_record.team_size > 0 THEN
        NEW.growth_multiplier := discovery_record.expected_team_size_12mo::DECIMAL / discovery_record.team_size;
    ELSE
        NEW.growth_multiplier := 1.5;
    END IF;

    IF NEW.total_hours_wasted_weekly IS NOT NULL THEN
        NEW.total_annual_cost_of_chaos := NEW.total_hours_wasted_weekly * eng_hourly_rate * weeks_per_year;
        NEW.projected_cost_at_scale := NEW.total_annual_cost_of_chaos * NEW.growth_multiplier;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists; function replacement is enough
-- CREATE TRIGGER trg_sa_reports_calculate_costs ...
