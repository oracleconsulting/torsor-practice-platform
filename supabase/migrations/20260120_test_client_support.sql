-- Migration: Add test client support across all service lines
-- Test clients allow practitioners to test the full workflow without needing a real client

-- Add is_test_client flag to clients table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_test_client BOOLEAN DEFAULT false;
    COMMENT ON COLUMN clients.is_test_client IS 'When true, this is a test client for demo/testing purposes. Not counted in real metrics or reports.';
    CREATE INDEX IF NOT EXISTS idx_clients_is_test ON clients(is_test_client);
  END IF;
END $$;

-- Add is_test_client flag to practice_members table (where clients are stored)
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS is_test_client BOOLEAN DEFAULT false;
COMMENT ON COLUMN practice_members.is_test_client IS 'When true, this is a test client for demo/testing purposes. Not counted in real metrics or reports.';
CREATE INDEX IF NOT EXISTS idx_practice_members_is_test ON practice_members(is_test_client);

-- Add is_test flag to all engagement tables for consistency
ALTER TABLE bm_engagements ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
ALTER TABLE hva_engagements ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN bm_engagements.is_test IS 'Test engagement for benchmarking service line';
COMMENT ON COLUMN hva_engagements.is_test IS 'Test engagement for HVA service line';
COMMENT ON COLUMN ma_engagements.is_test IS 'Test engagement for MA service line';

-- Function to reset test client data (wipe all engagements and related data)
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

  -- Delete benchmarking data (cascade will handle related tables)
  DELETE FROM bm_engagements WHERE client_id = p_client_id;
  GET DIAGNOSTICS bm_count = ROW_COUNT;
  
  -- Delete HVA data
  DELETE FROM hva_engagements WHERE client_id = p_client_id;
  GET DIAGNOSTICS hva_count = ROW_COUNT;
  
  -- Delete MA data
  DELETE FROM ma_engagements WHERE client_id = p_client_id;
  GET DIAGNOSTICS ma_count = ROW_COUNT;
  
  -- Delete Systems Audit data (if table exists)
  BEGIN
    DELETE FROM sa_engagements WHERE client_id = p_client_id;
    GET DIAGNOSTICS sa_count = ROW_COUNT;
  EXCEPTION WHEN undefined_table THEN
    sa_count := 0;
  END;
  
  -- Delete Discovery data (if table exists)
  BEGIN
    DELETE FROM discovery_engagements WHERE client_id = p_client_id;
    GET DIAGNOSTICS disc_count = ROW_COUNT;
  EXCEPTION WHEN undefined_table THEN
    disc_count := 0;
  END;

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

