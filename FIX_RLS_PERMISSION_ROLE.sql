-- ============================================================================
-- FIX: Update RLS policies to use permission_role instead of is_admin
-- The system uses permission_role ('staff', 'manager', 'director', 'partner', 'admin')
-- Admin access = 'partner' OR 'admin' roles
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS working_prefs_member_view ON working_preferences;
DROP POLICY IF EXISTS working_prefs_admin_view ON working_preferences;
DROP POLICY IF EXISTS working_prefs_member_manage ON working_preferences;
DROP POLICY IF EXISTS belbin_member_view ON belbin_assessments;
DROP POLICY IF EXISTS belbin_admin_view ON belbin_assessments;
DROP POLICY IF EXISTS belbin_member_manage ON belbin_assessments;
DROP POLICY IF EXISTS motiv_member_view ON motivational_drivers;
DROP POLICY IF EXISTS motiv_admin_view ON motivational_drivers;
DROP POLICY IF EXISTS motiv_member_manage ON motivational_drivers;
DROP POLICY IF EXISTS eq_member_view ON eq_assessments;
DROP POLICY IF EXISTS eq_admin_view ON eq_assessments;
DROP POLICY IF EXISTS eq_member_manage ON eq_assessments;
DROP POLICY IF EXISTS conflict_member_view ON conflict_style_assessments;
DROP POLICY IF EXISTS conflict_admin_view ON conflict_style_assessments;
DROP POLICY IF EXISTS conflict_member_manage ON conflict_style_assessments;

-- ============================================================================
-- CORRECTED RLS POLICIES: WORKING PREFERENCES
-- ============================================================================

CREATE POLICY working_prefs_member_view ON working_preferences
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY working_prefs_admin_view ON working_preferences
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
        AND permission_role IN ('partner', 'admin')
    )
  );

CREATE POLICY working_prefs_member_manage ON working_preferences
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CORRECTED RLS POLICIES: BELBIN ASSESSMENTS
-- ============================================================================

CREATE POLICY belbin_member_view ON belbin_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY belbin_admin_view ON belbin_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
        AND permission_role IN ('partner', 'admin')
    )
  );

CREATE POLICY belbin_member_manage ON belbin_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CORRECTED RLS POLICIES: MOTIVATIONAL DRIVERS
-- ============================================================================

CREATE POLICY motiv_member_view ON motivational_drivers
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY motiv_admin_view ON motivational_drivers
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
        AND permission_role IN ('partner', 'admin')
    )
  );

CREATE POLICY motiv_member_manage ON motivational_drivers
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CORRECTED RLS POLICIES: EQ ASSESSMENTS
-- ============================================================================

CREATE POLICY eq_member_view ON eq_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY eq_admin_view ON eq_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
        AND permission_role IN ('partner', 'admin')
    )
  );

CREATE POLICY eq_member_manage ON eq_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CORRECTED RLS POLICIES: CONFLICT STYLE ASSESSMENTS
-- ============================================================================

CREATE POLICY conflict_member_view ON conflict_style_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY conflict_admin_view ON conflict_style_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
        AND permission_role IN ('partner', 'admin')
    )
  );

CREATE POLICY conflict_member_manage ON conflict_style_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies corrected successfully!';
  RAISE NOTICE '   - Changed is_admin → permission_role IN (''partner'', ''admin'')';
  RAISE NOTICE '   - 15 policies updated (3 per table)';
  RAISE NOTICE '   - Members can view/manage their own assessments ✓';
  RAISE NOTICE '   - Partners and Admins can view all assessments in their practice ✓';
END $$;

