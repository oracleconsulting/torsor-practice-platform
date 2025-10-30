-- ============================================================================
-- FIX: RLS POLICIES FOR COMPREHENSIVE ASSESSMENT SYSTEM
-- Replaces current_user_email() with Supabase auth functions
-- ============================================================================

-- First, drop all existing policies for the new tables
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
-- RLS POLICIES: WORKING PREFERENCES (CORRECTED)
-- ============================================================================

-- Members can view their own working preferences
CREATE POLICY working_prefs_member_view ON working_preferences
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all working preferences in their practice
CREATE POLICY working_prefs_admin_view ON working_preferences
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- Members can insert/update their own working preferences
CREATE POLICY working_prefs_member_manage ON working_preferences
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: BELBIN ASSESSMENTS (CORRECTED)
-- ============================================================================

CREATE POLICY belbin_member_view ON belbin_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY belbin_admin_view ON belbin_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY belbin_member_manage ON belbin_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: MOTIVATIONAL DRIVERS (CORRECTED)
-- ============================================================================

CREATE POLICY motiv_member_view ON motivational_drivers
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY motiv_admin_view ON motivational_drivers
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY motiv_member_manage ON motivational_drivers
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: EQ ASSESSMENTS (CORRECTED)
-- ============================================================================

CREATE POLICY eq_member_view ON eq_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY eq_admin_view ON eq_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY eq_member_manage ON eq_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: CONFLICT STYLE ASSESSMENTS (CORRECTED)
-- ============================================================================

CREATE POLICY conflict_member_view ON conflict_style_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY conflict_admin_view ON conflict_style_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY conflict_member_manage ON conflict_style_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies fixed successfully!';
  RAISE NOTICE '   - All policies now use auth.uid() instead of current_user_email()';
  RAISE NOTICE '   - Members can view/manage their own assessments';
  RAISE NOTICE '   - Admins can view all assessments in their practice';
END $$;

