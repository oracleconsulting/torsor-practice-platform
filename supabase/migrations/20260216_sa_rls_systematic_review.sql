-- ============================================================================
-- SYSTEMS AUDIT: COMPREHENSIVE RLS REVIEW
-- ============================================================================
-- Replaces ALL existing SA table policies with a systematic approach using
-- helper functions: is_practice_team(), user_practice_ids(), user_client_ids()
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_practice_team()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM practice_members
    WHERE user_id = auth.uid()
    AND (
      member_type = 'team'
      OR role IN ('admin', 'member', 'owner')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_practice_ids()
RETURNS SETOF UUID AS $$
  SELECT practice_id FROM practice_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_client_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM practice_members
  WHERE user_id = auth.uid()
  AND member_type = 'client';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. sa_engagements
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sa_engagements')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sa_engagements', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "sa_engagements_team_select" ON sa_engagements
  FOR SELECT USING (practice_id IN (SELECT user_practice_ids()) AND is_practice_team());

CREATE POLICY "sa_engagements_team_insert" ON sa_engagements
  FOR INSERT WITH CHECK (practice_id IN (SELECT user_practice_ids()) AND is_practice_team());

CREATE POLICY "sa_engagements_team_update" ON sa_engagements
  FOR UPDATE USING (practice_id IN (SELECT user_practice_ids()) AND is_practice_team());

CREATE POLICY "sa_engagements_client_select" ON sa_engagements
  FOR SELECT USING (client_id IN (SELECT user_client_ids()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. sa_discovery_responses
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sa_discovery_responses')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sa_discovery_responses', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "sa_discovery_team_select" ON sa_discovery_responses
  FOR SELECT USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );

CREATE POLICY "sa_discovery_client_select" ON sa_discovery_responses
  FOR SELECT USING (client_id IN (SELECT user_client_ids()));

CREATE POLICY "sa_discovery_client_insert" ON sa_discovery_responses
  FOR INSERT WITH CHECK (client_id IN (SELECT user_client_ids()));

CREATE POLICY "sa_discovery_client_update" ON sa_discovery_responses
  FOR UPDATE USING (client_id IN (SELECT user_client_ids()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. sa_system_inventory
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sa_system_inventory')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sa_system_inventory', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "sa_inventory_team_select" ON sa_system_inventory
  FOR SELECT USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );

CREATE POLICY "sa_inventory_client_select" ON sa_system_inventory
  FOR SELECT USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE client_id IN (SELECT user_client_ids()))
  );

CREATE POLICY "sa_inventory_client_insert" ON sa_system_inventory
  FOR INSERT WITH CHECK (
    engagement_id IN (SELECT id FROM sa_engagements WHERE client_id IN (SELECT user_client_ids()))
  );

CREATE POLICY "sa_inventory_client_update" ON sa_system_inventory
  FOR UPDATE USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE client_id IN (SELECT user_client_ids()))
  );

CREATE POLICY "sa_inventory_client_delete" ON sa_system_inventory
  FOR DELETE USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE client_id IN (SELECT user_client_ids()))
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. sa_process_deep_dives
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sa_process_deep_dives')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sa_process_deep_dives', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "sa_deep_dives_team_select" ON sa_process_deep_dives
  FOR SELECT USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );

CREATE POLICY "sa_deep_dives_client_select" ON sa_process_deep_dives
  FOR SELECT USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE client_id IN (SELECT user_client_ids()))
  );

CREATE POLICY "sa_deep_dives_client_insert" ON sa_process_deep_dives
  FOR INSERT WITH CHECK (
    engagement_id IN (SELECT id FROM sa_engagements WHERE client_id IN (SELECT user_client_ids()))
  );

CREATE POLICY "sa_deep_dives_client_update" ON sa_process_deep_dives
  FOR UPDATE USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE client_id IN (SELECT user_client_ids()))
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. sa_audit_reports — client sees only when shared + status in (generated,...)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sa_audit_reports')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sa_audit_reports', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "sa_reports_team_select" ON sa_audit_reports
  FOR SELECT USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );

CREATE POLICY "sa_reports_team_update" ON sa_audit_reports
  FOR UPDATE USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );

CREATE POLICY "sa_reports_client_select" ON sa_audit_reports
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM sa_engagements
      WHERE client_id IN (SELECT user_client_ids())
      AND is_shared_with_client = TRUE
    )
    AND status IN ('generated', 'approved', 'published', 'delivered')
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. sa_findings
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sa_findings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sa_findings', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "sa_findings_team_select" ON sa_findings
  FOR SELECT USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );

CREATE POLICY "sa_findings_client_select" ON sa_findings
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM sa_engagements
      WHERE client_id IN (SELECT user_client_ids())
      AND is_shared_with_client = TRUE
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. sa_recommendations
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sa_recommendations')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sa_recommendations', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "sa_recs_team_select" ON sa_recommendations
  FOR SELECT USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );

CREATE POLICY "sa_recs_client_select" ON sa_recommendations
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM sa_engagements
      WHERE client_id IN (SELECT user_client_ids())
      AND is_shared_with_client = TRUE
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. sa_documents + sa_context_notes — team only
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sa_documents')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sa_documents', r.policyname);
  END LOOP;
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sa_context_notes')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sa_context_notes', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "sa_documents_team_all" ON sa_documents
  FOR ALL USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );

CREATE POLICY "sa_context_notes_team_all" ON sa_context_notes
  FOR ALL USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );
