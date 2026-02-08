-- COPY - Do not edit. Reference only. Source: see DISCOVERY_SYSTEM_LIVE_SUMMARY.md
-- ============================================================================
-- Fix destination_discovery duplicate records
-- ============================================================================
-- This migration:
-- 1. Cleans up duplicate records (keeps most recent with responses)
-- 2. Adds unique constraint to prevent future duplicates
-- 3. Ensures data integrity for client-specific discovery assessments
-- ============================================================================

-- Step 1: Clean up duplicate records
-- For each client, keep only the most recent record with responses
-- If there are multiple records, keep the one with:
--   - Most recent created_at
--   - Has responses (not empty)
--   - If multiple have responses, keep the one with completed_at set (if any)

DO $$
DECLARE
  client_record RECORD;
  records_to_delete UUID[];
  best_record_id UUID;
  best_record RECORD;
BEGIN
  -- Find all clients with multiple discovery records
  FOR client_record IN 
    SELECT client_id, COUNT(*) as record_count
    FROM destination_discovery
    GROUP BY client_id
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE 'Processing client_id: % with % records', client_record.client_id, client_record.record_count;
    
    -- Find the best record to keep (most recent with responses, prefer completed)
    SELECT id INTO best_record_id
    FROM destination_discovery
    WHERE client_id = client_record.client_id
    ORDER BY 
      -- Prefer records with responses
      CASE WHEN responses IS NOT NULL AND responses != '{}'::jsonb THEN 0 ELSE 1 END,
      -- Prefer completed records
      CASE WHEN completed_at IS NOT NULL THEN 0 ELSE 1 END,
      -- Then by most recent
      created_at DESC
    LIMIT 1;
    
    -- Get all other records for this client
    SELECT ARRAY_AGG(id) INTO records_to_delete
    FROM destination_discovery
    WHERE client_id = client_record.client_id
      AND id != best_record_id;
    
    -- Delete duplicate records
    IF records_to_delete IS NOT NULL AND array_length(records_to_delete, 1) > 0 THEN
      DELETE FROM destination_discovery
      WHERE id = ANY(records_to_delete);
      
      RAISE NOTICE 'Deleted % duplicate records for client_id: %, kept record: %', 
        array_length(records_to_delete, 1), 
        client_record.client_id, 
        best_record_id;
    END IF;
  END LOOP;
END $$;

-- Step 2: Add unique constraint on client_id for incomplete records
-- This prevents multiple incomplete discovery records per client
-- Completed records can exist alongside incomplete ones (for history)

-- First, create a partial unique index for incomplete records
CREATE UNIQUE INDEX IF NOT EXISTS destination_discovery_client_id_incomplete_unique 
ON destination_discovery (client_id) 
WHERE completed_at IS NULL;

-- Step 3: Add comment explaining the constraint
COMMENT ON INDEX destination_discovery_client_id_incomplete_unique IS 
'Ensures only one incomplete discovery assessment per client. Completed assessments can coexist for historical purposes.';

-- Step 4: Update any records with null practice_id to use the client's practice_id
UPDATE destination_discovery dd
SET practice_id = pm.practice_id
FROM practice_members pm
WHERE dd.client_id = pm.id
  AND dd.practice_id IS NULL
  AND pm.member_type = 'client';



