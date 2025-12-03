-- ============================================================================
-- ADD MISSING AUDIT LOG PARTITIONS
-- ============================================================================
-- The audit_log trigger fires on practice_members insert
-- Need partitions for current month
-- ============================================================================

-- Create December 2025 partition
CREATE TABLE IF NOT EXISTS audit_log_2025_12 PARTITION OF audit_log
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Create January 2026 (for safety)
CREATE TABLE IF NOT EXISTS audit_log_2026_01 PARTITION OF audit_log
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Verify partitions
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE tablename LIKE 'audit_log_%' 
ORDER BY tablename;

