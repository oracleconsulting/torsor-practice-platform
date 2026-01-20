-- Migration: Add test client support across all service lines
-- Test clients allow practitioners to test the full workflow without needing a real client
-- This migration is DEFENSIVE - it only modifies tables that exist

-- Add is_test_client flag to practice_members table (where clients are stored)
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS is_test_client BOOLEAN DEFAULT false;
COMMENT ON COLUMN practice_members.is_test_client IS 'When true, this is a test client for demo/testing purposes. Not counted in real metrics or reports.';
CREATE INDEX IF NOT EXISTS idx_practice_members_is_test ON practice_members(is_test_client);

-- Add is_test flag to engagement tables IF THEY EXIST
DO $$ 
BEGIN
  -- Benchmarking engagements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bm_engagements') THEN
    ALTER TABLE bm_engagements ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
    COMMENT ON COLUMN bm_engagements.is_test IS 'Test engagement for benchmarking service line';
  END IF;
  
  -- HVA engagements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hva_engagements') THEN
    ALTER TABLE hva_engagements ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
    COMMENT ON COLUMN hva_engagements.is_test IS 'Test engagement for HVA service line';
  END IF;
  
  -- MA engagements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ma_engagements') THEN
    ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
    COMMENT ON COLUMN ma_engagements.is_test IS 'Test engagement for MA service line';
  END IF;
  
  -- SA engagements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sa_engagements') THEN
    ALTER TABLE sa_engagements ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
    COMMENT ON COLUMN sa_engagements.is_test IS 'Test engagement for Systems Audit service line';
  END IF;
  
  -- Discovery engagements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discovery_engagements') THEN
    ALTER TABLE discovery_engagements ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
    COMMENT ON COLUMN discovery_engagements.is_test IS 'Test engagement for Discovery service line';
  END IF;
END $$;

-- Function to reset test client data (wipe all engagements and related data)
-- Uses dynamic SQL to handle tables that may or may not exist
CREATE OR REPLACE FUNCTION reset_test_client_data(p_client_id UUID)
RETURNS JSON AS $$
DECLARE
  deleted_counts JSON;
  bm_count INTEGER := 0;
  hva_count INTEGER := 0;
  ma_count INTEGER := 0;
  sa_count INTEGER := 0;
  disc_count INTEGER := 0;
BEGIN
  -- Only allow reset for test clients (check practice_members table)
  IF NOT EXISTS (SELECT 1 FROM practice_members WHERE id = p_client_id AND is_test_client = true) THEN
    RAISE EXCEPTION 'Cannot reset non-test client';
  END IF;

  -- Delete benchmarking data (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bm_engagements') THEN
    DELETE FROM bm_engagements WHERE client_id = p_client_id;
    GET DIAGNOSTICS bm_count = ROW_COUNT;
  END IF;
  
  -- Delete HVA data (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hva_engagements') THEN
    DELETE FROM hva_engagements WHERE client_id = p_client_id;
    GET DIAGNOSTICS hva_count = ROW_COUNT;
  END IF;
  
  -- Delete MA data (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ma_engagements') THEN
    DELETE FROM ma_engagements WHERE client_id = p_client_id;
    GET DIAGNOSTICS ma_count = ROW_COUNT;
  END IF;
  
  -- Delete Systems Audit data (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sa_engagements') THEN
    DELETE FROM sa_engagements WHERE client_id = p_client_id;
    GET DIAGNOSTICS sa_count = ROW_COUNT;
  END IF;
  
  -- Delete Discovery data (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discovery_engagements') THEN
    DELETE FROM discovery_engagements WHERE client_id = p_client_id;
    GET DIAGNOSTICS disc_count = ROW_COUNT;
  END IF;

  -- Build result JSON
  deleted_counts := json_build_object(
    'bm_engagements', bm_count,
    'hva_engagements', hva_count,
    'ma_engagements', ma_count,
    'sa_engagements', sa_count,
    'discovery_engagements', disc_count,
    'total', bm_count + hva_count + ma_count + sa_count + disc_count
  );

  RETURN deleted_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (will be called from edge functions)
GRANT EXECUTE ON FUNCTION reset_test_client_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_test_client_data(UUID) TO service_role;
