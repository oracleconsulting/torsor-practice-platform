-- ============================================================================
-- SIMPLE CLIENT ACCESS - MINIMAL RLS FIX
-- ============================================================================
-- This is the SIMPLEST possible fix for client access
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: LET USERS SEE THEIR OWN PRACTICE_MEMBERS RECORD
-- ============================================================================
-- THIS IS THE KEY FIX - without this, nothing works!

DROP POLICY IF EXISTS "Team sees members" ON practice_members;
DROP POLICY IF EXISTS "Users see own record or team sees practice" ON practice_members;
DROP POLICY IF EXISTS "Team manages members" ON practice_members;

-- Simple policy: you can see your own record (no recursion!)
CREATE POLICY "Users see own record" ON practice_members
  FOR SELECT USING (user_id = auth.uid());

-- Team can see everyone in their practice  
CREATE POLICY "Team sees all practice members" ON practice_members
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Team can manage members
CREATE POLICY "Team can manage members" ON practice_members
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- ============================================================================
-- STEP 2: LET USERS SEE THEIR PRACTICE
-- ============================================================================

DROP POLICY IF EXISTS "Team sees practice" ON practices;
DROP POLICY IF EXISTS "Public can read practices" ON practices;
DROP POLICY IF EXISTS "Users see own practice" ON practices;

CREATE POLICY "Users see their practice" ON practices
  FOR SELECT USING (
    id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())
  );

-- ============================================================================
-- STEP 3: CLIENT SERVICE LINES
-- ============================================================================

DROP POLICY IF EXISTS "Clients see own services" ON client_service_lines;
DROP POLICY IF EXISTS "Team sees client services" ON client_service_lines;

-- Let clients see their enrolled services
CREATE POLICY "Clients see own services" ON client_service_lines
  FOR SELECT USING (
    client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

-- Let clients update their service status
CREATE POLICY "Clients update own services" ON client_service_lines
  FOR UPDATE USING (
    client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

-- ============================================================================
-- STEP 4: SERVICE LINES (PUBLIC READ)
-- ============================================================================

DROP POLICY IF EXISTS "Service lines public read" ON service_lines;
CREATE POLICY "Service lines public read" ON service_lines
  FOR SELECT USING (true);

-- ============================================================================
-- STEP 5: AUDIT LOG PARTITION (REQUIRED FOR INSERTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log_2025_12 PARTITION OF audit_log
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify policies are in place:

SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('practice_members', 'practices', 'client_service_lines', 'service_lines')
ORDER BY tablename, policyname;

