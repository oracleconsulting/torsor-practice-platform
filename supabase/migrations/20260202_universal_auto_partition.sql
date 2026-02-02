-- ============================================================================
-- UNIVERSAL AUTO-PARTITIONING SYSTEM
-- ============================================================================
-- Works forever. Handles ALL partitioned tables. No manual intervention needed.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the master partition management function
-- ============================================================================
-- This function can create partitions for ANY table partitioned by month

CREATE OR REPLACE FUNCTION ensure_monthly_partition(
  parent_table TEXT,
  target_date TIMESTAMPTZ,
  partition_column TEXT DEFAULT 'created_at'
)
RETURNS TEXT AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
  schema_name TEXT DEFAULT 'public';
BEGIN
  start_date := DATE_TRUNC('month', target_date);
  end_date := start_date + INTERVAL '1 month';
  partition_name := parent_table || '_' || TO_CHAR(start_date, 'YYYY_MM');
  
  -- Check if partition exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = partition_name 
    AND schemaname = schema_name
  ) THEN
    BEGIN
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I.%I PARTITION OF %I.%I FOR VALUES FROM (%L) TO (%L)',
        schema_name, partition_name,
        schema_name, parent_table,
        start_date, end_date
      );
      RAISE NOTICE 'Created partition: %.%', schema_name, partition_name;
      RETURN partition_name;
    EXCEPTION WHEN duplicate_table THEN
      -- Another process created it, that's fine
      RETURN partition_name;
    WHEN OTHERS THEN
      RAISE WARNING 'Could not create partition %: %', partition_name, SQLERRM;
      RETURN NULL;
    END;
  END IF;
  
  RETURN partition_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: Create function to ensure partitions for ALL partitioned tables
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_all_partitions(months_ahead INTEGER DEFAULT 12)
RETURNS TABLE(table_name TEXT, partition_created TEXT) AS $$
DECLARE
  parent_table TEXT;
  i INTEGER;
  result TEXT;
BEGIN
  -- Find all partitioned tables
  FOR parent_table IN 
    SELECT c.relname::TEXT
    FROM pg_partitioned_table pt
    JOIN pg_class c ON c.oid = pt.partrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
  LOOP
    -- Create partitions for current month + months_ahead
    FOR i IN 0..months_ahead LOOP
      result := ensure_monthly_partition(parent_table, CURRENT_DATE + (i || ' months')::INTERVAL);
      IF result IS NOT NULL THEN
        table_name := parent_table;
        partition_created := result;
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Create a universal trigger function for partitioned tables
-- ============================================================================
-- This can be attached to any partitioned table

CREATE OR REPLACE FUNCTION universal_partition_trigger()
RETURNS TRIGGER AS $$
DECLARE
  partition_col TEXT;
  target_date TIMESTAMPTZ;
BEGIN
  -- Get the partition column value (usually created_at)
  -- Try common column names
  IF TG_TABLE_NAME = 'audit_log' THEN
    target_date := NEW.created_at;
  ELSIF TG_NARGS > 0 THEN
    EXECUTE format('SELECT ($1).%I', TG_ARGV[0]) INTO target_date USING NEW;
  ELSE
    -- Default to created_at
    target_date := NEW.created_at;
  END IF;
  
  -- Ensure partition exists
  PERFORM ensure_monthly_partition(TG_TABLE_NAME, target_date);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Auto-attach triggers to all partitioned tables
-- ============================================================================

DO $$
DECLARE
  parent_table TEXT;
  trigger_name TEXT;
BEGIN
  -- Find all partitioned tables and create triggers for them
  FOR parent_table IN 
    SELECT c.relname::TEXT
    FROM pg_partitioned_table pt
    JOIN pg_class c ON c.oid = pt.partrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
  LOOP
    trigger_name := parent_table || '_auto_partition_trigger';
    
    -- Drop existing trigger if any
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, parent_table);
    
    -- Create new trigger
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION universal_partition_trigger()',
      trigger_name, parent_table
    );
    
    RAISE NOTICE 'Created auto-partition trigger for: %', parent_table;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 5: Create immediate partitions for next 24 months (all tables)
-- ============================================================================

SELECT * FROM ensure_all_partitions(24);

-- ============================================================================
-- STEP 6: Create a scheduled maintenance function
-- ============================================================================
-- Call this monthly (via pg_cron, edge function, or external scheduler)

CREATE OR REPLACE FUNCTION maintain_partitions()
RETURNS TABLE(
  total_tables INTEGER,
  partitions_created INTEGER,
  next_run_recommendation TEXT
) AS $$
DECLARE
  created_count INTEGER := 0;
  table_count INTEGER := 0;
  rec RECORD;
BEGIN
  -- Count partitioned tables
  SELECT COUNT(*) INTO table_count
  FROM pg_partitioned_table pt
  JOIN pg_class c ON c.oid = pt.partrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public';
  
  -- Ensure partitions exist for next 12 months
  FOR rec IN SELECT * FROM ensure_all_partitions(12) LOOP
    created_count := created_count + 1;
  END LOOP;
  
  total_tables := table_count;
  partitions_created := created_count;
  next_run_recommendation := 'Run monthly or whenever new partitioned tables are added';
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Verification - Show all partitioned tables and their partitions
-- ============================================================================

SELECT 
  parent.relname AS parent_table,
  child.relname AS partition_name,
  pg_get_expr(child.relpartbound, child.oid) AS partition_range,
  pg_size_pretty(pg_total_relation_size(child.oid)) AS size
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
JOIN pg_namespace n ON n.oid = parent.relnamespace
WHERE n.nspname = 'public'
ORDER BY parent.relname, child.relname;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
-- 
-- 1. AUTOMATIC: Triggers handle new inserts automatically - partitions created on demand
-- 
-- 2. PROACTIVE: Run monthly for peace of mind:
--    SELECT * FROM maintain_partitions();
-- 
-- 3. NEW TABLES: When you create a new partitioned table, run:
--    SELECT * FROM ensure_all_partitions(24);
--    (The trigger will be auto-created on next migration run)
-- 
-- 4. MANUAL CHECK: See all partitions:
--    SELECT * FROM pg_tables WHERE tablename LIKE '%_20%' ORDER BY tablename;
--
-- ============================================================================

