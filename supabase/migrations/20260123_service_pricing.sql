-- ============================================================================
-- SERVICE PRICING CONFIGURATION
-- Allows practices to manage their own service pricing through the admin portal
-- instead of hardcoding in edge functions
-- ============================================================================

-- ============================================================================
-- TABLE: service_pricing
-- Master table for service line pricing configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    
    -- Service identification
    service_code TEXT NOT NULL,  -- e.g., 'management_accounts', 'fractional_cfo'
    service_name TEXT NOT NULL,  -- Display name e.g., 'Management Accounts'
    
    -- Service metadata
    description TEXT,
    category TEXT DEFAULT 'advisory' CHECK (category IN (
        'financial',      -- Management accounts, CFO services
        'operational',    -- COO services, systems audit
        'strategic',      -- 365/Goal Alignment, Business Advisory
        'implementation', -- Automation, Systems implementation
        'analysis'        -- Benchmarking, Hidden Value Audit
    )),
    
    -- Pricing model
    pricing_model TEXT NOT NULL DEFAULT 'tiered' CHECK (pricing_model IN (
        'tiered',         -- Multiple tiers with different prices
        'fixed',          -- Single fixed price
        'hourly',         -- Hourly rate
        'custom'          -- Price on application
    )),
    
    -- For display ordering
    display_order INTEGER DEFAULT 100,
    
    -- Active status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Unique constraint: one service code per practice
    UNIQUE(practice_id, service_code)
);

-- ============================================================================
-- TABLE: service_pricing_tiers
-- Individual pricing tiers for each service
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_pricing_id UUID NOT NULL REFERENCES service_pricing(id) ON DELETE CASCADE,
    
    -- Tier identification
    tier_name TEXT NOT NULL,  -- e.g., 'Lite', 'Growth', 'Partner'
    tier_code TEXT NOT NULL,  -- e.g., 'lite', 'growth', 'partner'
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    
    -- Pricing frequency
    frequency TEXT NOT NULL DEFAULT 'one_time' CHECK (frequency IN (
        'one_time',       -- Single payment
        'monthly',        -- Monthly recurring
        'quarterly',      -- Quarterly
        'annual'          -- Annual
    )),
    
    -- What's included
    description TEXT,
    features JSONB DEFAULT '[]',  -- Array of feature strings
    
    -- For recommendation engine
    min_revenue INTEGER,          -- Minimum client revenue for this tier
    max_revenue INTEGER,          -- Maximum client revenue for this tier
    recommended_for TEXT[],       -- Array of client stages e.g., ['pre-revenue', 'scaling']
    
    -- Display
    display_order INTEGER DEFAULT 1,
    is_popular BOOLEAN DEFAULT FALSE,  -- Highlight as most popular
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sp_practice ON service_pricing(practice_id);
CREATE INDEX idx_sp_code ON service_pricing(service_code);
CREATE INDEX idx_sp_active ON service_pricing(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_spt_service ON service_pricing_tiers(service_pricing_id);
CREATE INDEX idx_spt_active ON service_pricing_tiers(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Service pricing policies
CREATE POLICY "sp_practice_read" ON service_pricing
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = service_pricing.practice_id
        )
    );

CREATE POLICY "sp_admin_write" ON service_pricing
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = service_pricing.practice_id
            AND pm.role IN ('admin', 'owner')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = service_pricing.practice_id
            AND pm.role IN ('admin', 'owner')
        )
    );

-- Service role access for edge functions
CREATE POLICY "sp_service_role" ON service_pricing
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Tier policies
CREATE POLICY "spt_practice_read" ON service_pricing_tiers
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM service_pricing sp
            JOIN practice_members pm ON pm.practice_id = sp.practice_id
            WHERE sp.id = service_pricing_tiers.service_pricing_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "spt_admin_write" ON service_pricing_tiers
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM service_pricing sp
            JOIN practice_members pm ON pm.practice_id = sp.practice_id
            WHERE sp.id = service_pricing_tiers.service_pricing_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'owner')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM service_pricing sp
            JOIN practice_members pm ON pm.practice_id = sp.practice_id
            WHERE sp.id = service_pricing_tiers.service_pricing_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'owner')
        )
    );

CREATE POLICY "spt_service_role" ON service_pricing_tiers
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- ============================================================================
-- FUNCTION: Get service pricing for a practice
-- Returns all services with their tiers in the format edge functions expect
-- ============================================================================

CREATE OR REPLACE FUNCTION get_service_pricing(p_practice_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB := '{}';
    service_row RECORD;
    tiers_json JSONB;
BEGIN
    FOR service_row IN 
        SELECT 
            sp.service_code,
            sp.service_name,
            sp.description,
            sp.category,
            sp.pricing_model
        FROM service_pricing sp
        WHERE sp.practice_id = p_practice_id
        AND sp.is_active = TRUE
        ORDER BY sp.display_order, sp.service_name
    LOOP
        -- Get tiers for this service
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'name', t.tier_name,
                'code', t.tier_code,
                'price', t.price,
                'frequency', t.frequency,
                'description', t.description,
                'features', t.features,
                'isPopular', t.is_popular
            ) ORDER BY t.display_order
        ), '[]'::jsonb)
        INTO tiers_json
        FROM service_pricing_tiers t
        JOIN service_pricing sp ON sp.id = t.service_pricing_id
        WHERE sp.service_code = service_row.service_code
        AND sp.practice_id = p_practice_id
        AND t.is_active = TRUE;

        -- Add to result
        result := result || jsonb_build_object(
            service_row.service_code,
            jsonb_build_object(
                'name', service_row.service_name,
                'description', service_row.description,
                'category', service_row.category,
                'tiers', tiers_json
            )
        );
    END LOOP;

    RETURN result;
END;
$$;

-- ============================================================================
-- SEED DATA: Default Oracle Consulting service pricing
-- This populates the initial pricing that was previously hardcoded
-- ============================================================================

-- Note: This INSERT will need to be run with the actual practice_id
-- For now, we create a function to seed defaults for any practice

CREATE OR REPLACE FUNCTION seed_default_service_pricing(p_practice_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_service_id UUID;
BEGIN
    -- ========================================
    -- Goal Alignment Programme (365 Method)
    -- ========================================
    INSERT INTO service_pricing (practice_id, service_code, service_name, description, category, pricing_model, display_order, created_by)
    VALUES (p_practice_id, '365_method', 'Goal Alignment Programme', 'Strategic planning and accountability for business owners', 'strategic', 'tiered', 10, p_user_id)
    ON CONFLICT (practice_id, service_code) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_service_id;
    
    INSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description, display_order)
    VALUES 
        (v_service_id, 'Lite', 'lite', 1500, 'annual', 'Survey + plan + one review', 1),
        (v_service_id, 'Growth', 'growth', 4500, 'annual', 'Adds quarterly reviews for 12 months', 2),
        (v_service_id, 'Partner', 'partner', 9000, 'annual', 'Adds strategy day + BSG integration', 3)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- Management Accounts
    -- ========================================
    INSERT INTO service_pricing (practice_id, service_code, service_name, description, category, pricing_model, display_order, created_by)
    VALUES (p_practice_id, 'management_accounts', 'Management Accounts', 'Monthly financial visibility and reporting', 'financial', 'tiered', 20, p_user_id)
    ON CONFLICT (practice_id, service_code) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_service_id;
    
    INSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description, display_order)
    VALUES 
        (v_service_id, 'Monthly', 'monthly', 650, 'monthly', 'Monthly management accounts', 1),
        (v_service_id, 'Quarterly', 'quarterly', 1750, 'quarterly', 'Quarterly management accounts', 2)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- Benchmarking Services
    -- ========================================
    INSERT INTO service_pricing (practice_id, service_code, service_name, description, category, pricing_model, display_order, created_by)
    VALUES (p_practice_id, 'benchmarking', 'Benchmarking Services', 'Industry comparison and competitive positioning', 'analysis', 'tiered', 30, p_user_id)
    ON CONFLICT (practice_id, service_code) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_service_id;
    
    INSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description, display_order)
    VALUES 
        (v_service_id, 'Snapshot', 'snapshot', 450, 'one_time', 'Single benchmark report', 1),
        (v_service_id, 'Full Package', 'full', 3500, 'one_time', 'Comprehensive benchmarking with recommendations', 2)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- Systems Audit
    -- ========================================
    INSERT INTO service_pricing (practice_id, service_code, service_name, description, category, pricing_model, display_order, created_by)
    VALUES (p_practice_id, 'systems_audit', 'Systems Audit', 'Operational efficiency assessment', 'operational', 'tiered', 40, p_user_id)
    ON CONFLICT (practice_id, service_code) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_service_id;
    
    INSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description, display_order)
    VALUES 
        (v_service_id, 'Diagnostic', 'diagnostic', 1500, 'one_time', 'Quick diagnostic assessment', 1),
        (v_service_id, 'Comprehensive', 'comprehensive', 4000, 'one_time', 'Full systems audit with roadmap', 2)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- Fractional CFO
    -- ========================================
    INSERT INTO service_pricing (practice_id, service_code, service_name, description, category, pricing_model, display_order, created_by)
    VALUES (p_practice_id, 'fractional_cfo', 'Fractional CFO Services', 'Part-time strategic financial leadership', 'financial', 'tiered', 50, p_user_id)
    ON CONFLICT (practice_id, service_code) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_service_id;
    
    INSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description, display_order)
    VALUES 
        (v_service_id, '1 day/month', '1day', 2000, 'monthly', '1 day per month', 1),
        (v_service_id, '2 days/month', '2day', 4000, 'monthly', '2 days per month', 2),
        (v_service_id, '4 days/month', '4day', 7500, 'monthly', '4 days per month', 3)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- Fractional COO
    -- ========================================
    INSERT INTO service_pricing (practice_id, service_code, service_name, description, category, pricing_model, display_order, created_by)
    VALUES (p_practice_id, 'fractional_coo', 'Fractional COO Services', 'Part-time operational leadership', 'operational', 'tiered', 60, p_user_id)
    ON CONFLICT (practice_id, service_code) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_service_id;
    
    INSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description, display_order)
    VALUES 
        (v_service_id, '1 day/month', '1day', 1875, 'monthly', '1 day per month', 1),
        (v_service_id, '2 days/month', '2day', 3750, 'monthly', '2 days per month', 2),
        (v_service_id, '4 days/month', '4day', 7000, 'monthly', '4 days per month', 3)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- Combined Advisory
    -- ========================================
    INSERT INTO service_pricing (practice_id, service_code, service_name, description, category, pricing_model, display_order, created_by)
    VALUES (p_practice_id, 'combined_advisory', 'Combined CFO/COO Advisory', 'Combined financial and operational leadership', 'operational', 'tiered', 70, p_user_id)
    ON CONFLICT (practice_id, service_code) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_service_id;
    
    INSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description, display_order)
    VALUES 
        (v_service_id, '2 days each', '2each', 7500, 'monthly', '2 days CFO + 2 days COO per month', 1),
        (v_service_id, '4 days each', '4each', 14000, 'monthly', '4 days CFO + 4 days COO per month', 2)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- Business Advisory
    -- ========================================
    INSERT INTO service_pricing (practice_id, service_code, service_name, description, category, pricing_model, display_order, created_by)
    VALUES (p_practice_id, 'business_advisory', 'Business Advisory & Exit Planning', 'Strategic business advice and exit preparation', 'strategic', 'tiered', 80, p_user_id)
    ON CONFLICT (practice_id, service_code) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_service_id;
    
    INSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description, display_order)
    VALUES 
        (v_service_id, 'Valuation', 'valuation', 1000, 'one_time', 'Business valuation assessment', 1),
        (v_service_id, 'Full Package', 'full', 4000, 'one_time', 'Full advisory package with exit planning', 2)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- Automation Services
    -- ========================================
    INSERT INTO service_pricing (practice_id, service_code, service_name, description, category, pricing_model, display_order, created_by)
    VALUES (p_practice_id, 'automation', 'Automation Services', 'Process automation and implementation', 'implementation', 'tiered', 90, p_user_id)
    ON CONFLICT (practice_id, service_code) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_service_id;
    
    INSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description, display_order)
    VALUES 
        (v_service_id, 'Per hour', 'hourly', 150, 'one_time', 'Hourly automation work', 1),
        (v_service_id, 'Day rate', 'daily', 1000, 'one_time', 'Full day automation work', 2)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- Hidden Value Audit
    -- ========================================
    INSERT INTO service_pricing (practice_id, service_code, service_name, description, category, pricing_model, display_order, created_by)
    VALUES (p_practice_id, 'hidden_value_audit', 'Hidden Value Audit', 'Identify value leakage and opportunities', 'analysis', 'tiered', 100, p_user_id)
    ON CONFLICT (practice_id, service_code) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_service_id;
    
    INSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description, display_order)
    VALUES 
        (v_service_id, 'Standard', 'standard', 2500, 'one_time', 'Standard hidden value audit', 1),
        (v_service_id, 'Comprehensive', 'comprehensive', 4000, 'one_time', 'Comprehensive audit with implementation support', 2)
    ON CONFLICT DO NOTHING;

END;
$$;

-- Comments
COMMENT ON TABLE service_pricing IS 'Service line pricing configuration per practice. Replaces hardcoded pricing in edge functions.';
COMMENT ON TABLE service_pricing_tiers IS 'Individual pricing tiers for each service. Multiple tiers per service allowed.';
COMMENT ON FUNCTION get_service_pricing(UUID) IS 'Returns all active service pricing for a practice in the format expected by edge functions.';
COMMENT ON FUNCTION seed_default_service_pricing(UUID, UUID) IS 'Seeds default Oracle Consulting pricing for a new practice.';

