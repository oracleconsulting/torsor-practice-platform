-- ============================================================================
-- FIX CLIENT RLS POLICIES - NO INFINITE RECURSION
-- ============================================================================
-- ROOT CAUSE: practice_members policy queries itself → infinite recursion
-- SOLUTION: Users can ALWAYS see their own record (direct auth.uid() match)
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX PRACTICE_MEMBERS (THE ROOT CAUSE!)
-- ============================================================================
-- The old policy only allowed TEAM members to see records, causing clients 
-- to hit infinite recursion when loading their session

DROP POLICY IF EXISTS "Team sees members" ON practice_members;

-- New policy: Users can see their own record OR team members can see their practice
CREATE POLICY "Users see own record or team sees practice" ON practice_members
  FOR SELECT USING (
    -- Users can ALWAYS see their own record (no recursion - direct match)
    user_id = auth.uid()
    OR
    -- Team members can see all members in their practice
    (
      practice_id IN (
        SELECT pm.practice_id 
        FROM practice_members pm 
        WHERE pm.user_id = auth.uid() 
        AND pm.member_type = 'team'
      )
    )
  );

-- Team members can INSERT/UPDATE/DELETE members in their practice
CREATE POLICY "Team manages members" ON practice_members
  FOR ALL USING (
    practice_id IN (
      SELECT pm.practice_id 
      FROM practice_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.member_type = 'team'
    )
  );

-- ============================================================================
-- STEP 2: FIX PRACTICES TABLE
-- ============================================================================
-- Allow clients to see their practice (needed for dashboard)

DROP POLICY IF EXISTS "Team sees practice" ON practices;
DROP POLICY IF EXISTS "Public can read practices" ON practices;

CREATE POLICY "Users see own practice" ON practices
  FOR SELECT USING (
    id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())
  );

-- ============================================================================
-- STEP 3: FIX CLIENT ASSESSMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Client sees own assessments" ON client_assessments;
DROP POLICY IF EXISTS "Client direct access" ON client_assessments;
DROP POLICY IF EXISTS "Clients can insert own assessments" ON client_assessments;
DROP POLICY IF EXISTS "Clients can update own assessments" ON client_assessments;

-- Clients can read/write their own assessments (direct user_id match via join)
CREATE POLICY "Client direct access" ON client_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM practice_members 
      WHERE practice_members.id = client_assessments.client_id 
      AND practice_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 4: FIX CLIENT ROADMAPS
-- ============================================================================

DROP POLICY IF EXISTS "Client sees own roadmap" ON client_roadmaps;
DROP POLICY IF EXISTS "Client roadmap direct access" ON client_roadmaps;

CREATE POLICY "Client roadmap direct access" ON client_roadmaps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM practice_members 
      WHERE practice_members.id = client_roadmaps.client_id 
      AND practice_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 5: FIX CLIENT SERVICE LINES
-- ============================================================================

DROP POLICY IF EXISTS "Clients see own services" ON client_service_lines;
DROP POLICY IF EXISTS "Team sees client services" ON client_service_lines;

CREATE POLICY "Clients see own services" ON client_service_lines
  FOR ALL USING (
    client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team sees client services" ON client_service_lines
  FOR ALL USING (
    client_id IN (
      SELECT id FROM practice_members 
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members 
        WHERE user_id = auth.uid() AND member_type = 'team'
      )
    )
  );

-- ============================================================================
-- STEP 6: FIX SERVICE LINE ASSESSMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Clients see own service assessments" ON service_line_assessments;
DROP POLICY IF EXISTS "Team sees service assessments" ON service_line_assessments;

CREATE POLICY "Clients see own service assessments" ON service_line_assessments
  FOR ALL USING (
    client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team sees service assessments" ON service_line_assessments
  FOR ALL USING (
    client_id IN (
      SELECT id FROM practice_members 
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members 
        WHERE user_id = auth.uid() AND member_type = 'team'
      )
    )
  );

-- ============================================================================
-- VERIFICATION: Run this to check policies are correct
-- ============================================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('practice_members', 'practices', 'client_assessments', 'client_service_lines')
-- ORDER BY tablename, policyname;
