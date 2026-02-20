-- ============================================================================
-- SERVICE PRICING UPDATES
-- Add exclude_from_recommendations flag and improve policies
-- ============================================================================

-- Add exclude_from_recommendations column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_pricing' AND column_name = 'exclude_from_recommendations'
    ) THEN
        ALTER TABLE service_pricing ADD COLUMN exclude_from_recommendations BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Ensure the column has a comment
COMMENT ON COLUMN service_pricing.exclude_from_recommendations IS 
    'When true, this service will not be auto-recommended by AI. Can still be manually recommended via feedback.';

-- Drop existing policies and recreate with member role included
DROP POLICY IF EXISTS "sp_admin_write" ON service_pricing;
DROP POLICY IF EXISTS "spt_admin_write" ON service_pricing_tiers;

-- Recreate with member role included (for team members who manage services)
CREATE POLICY "sp_admin_write" ON service_pricing
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = service_pricing.practice_id
            AND (pm.role IN ('admin', 'owner') OR pm.member_type = 'team')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = service_pricing.practice_id
            AND (pm.role IN ('admin', 'owner') OR pm.member_type = 'team')
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
            AND (pm.role IN ('admin', 'owner') OR pm.member_type = 'team')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM service_pricing sp
            JOIN practice_members pm ON pm.practice_id = sp.practice_id
            WHERE sp.id = service_pricing_tiers.service_pricing_id
            AND pm.user_id = auth.uid()
            AND (pm.role IN ('admin', 'owner') OR pm.member_type = 'team')
        )
    );

