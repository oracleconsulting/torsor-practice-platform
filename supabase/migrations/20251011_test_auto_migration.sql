-- =====================================================
-- TEST MIGRATION: Auto-Migration System Verification
-- Date: October 11, 2025
-- Purpose: Verify GitHub Actions + Railway auto-apply
-- =====================================================

-- Create a test table to verify auto-migration works
CREATE TABLE IF NOT EXISTS _migration_test (
  id SERIAL PRIMARY KEY,
  test_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  deployed_via TEXT DEFAULT 'auto-migration'
);

-- Insert a test record with timestamp
INSERT INTO _migration_test (test_name, deployed_via)
VALUES 
  ('GitHub Actions Test ' || NOW()::TEXT, 'github-action')
ON CONFLICT DO NOTHING;

-- Log success
DO $$ 
BEGIN
  RAISE NOTICE '✅ TEST MIGRATION SUCCESSFUL!';
  RAISE NOTICE '   Auto-migration system is working!';
  RAISE NOTICE '   Table: _migration_test created';
  RAISE NOTICE '   Test record inserted';
END $$;

