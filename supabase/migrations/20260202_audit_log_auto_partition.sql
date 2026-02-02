-- ============================================================================
-- AUTO-PARTITIONING FOR AUDIT_LOG TABLE
-- ============================================================================
-- Creates partitions automatically - no manual intervention needed ever again
-- ============================================================================

-- First, create any missing partitions for the current and next 12 months
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
  i INTEGER;
BEGIN
  -- Create partitions for current month and 12 months ahead
  FOR i IN 0..12 LOOP
    start_date := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'audit_log_' || TO_CHAR(start_date, 'YYYY_MM');
    
    -- Check if partition exists, create if not
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = partition_name 
      AND schemaname = 'public'
    ) THEN
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        start_date,
        end_date
      );
      RAISE NOTICE 'Created partition: %', partition_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- CREATE FUNCTION TO AUTO-CREATE PARTITIONS
-- ============================================================================
-- This function creates a partition if it doesn't exist for a given date

CREATE OR REPLACE FUNCTION ensure_audit_log_partition(target_date TIMESTAMPTZ)
RETURNS VOID AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  start_date := DATE_TRUNC('month', target_date);
  end_date := start_date + INTERVAL '1 month';
  partition_name := 'audit_log_' || TO_CHAR(start_date, 'YYYY_MM');
  
  -- Check if partition exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = partition_name 
    AND schemaname = 'public'
  ) THEN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      start_date,
      end_date
    );
    RAISE NOTICE 'Auto-created partition: %', partition_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGER TO AUTO-CREATE PARTITIONS BEFORE INSERT
-- ============================================================================
-- This ensures partitions exist before any insert attempt

CREATE OR REPLACE FUNCTION audit_log_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure partition exists for the row being inserted
  PERFORM ensure_audit_log_partition(NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS audit_log_auto_partition_trigger ON audit_log;

CREATE TRIGGER audit_log_auto_partition_trigger
  BEFORE INSERT ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_insert_trigger();

-- ============================================================================
-- SCHEDULED PARTITION CREATION (run monthly via pg_cron if available)
-- ============================================================================
-- This creates partitions 3 months ahead - runs as a safety net

CREATE OR REPLACE FUNCTION create_future_audit_log_partitions()
RETURNS VOID AS $$
DECLARE
  i INTEGER;
BEGIN
  -- Create partitions for next 6 months
  FOR i IN 0..6 LOOP
    PERFORM ensure_audit_log_partition(CURRENT_DATE + (i || ' months')::INTERVAL);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run it now to ensure we have partitions
SELECT create_future_audit_log_partitions();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables 
WHERE tablename LIKE 'audit_log_%'
ORDER BY tablename;

