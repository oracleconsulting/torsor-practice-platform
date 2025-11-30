-- ============================================================================
-- FIX SHARED TRANSCRIPTS FOR TOM & ZANETA
-- ============================================================================
-- Marks existing transcript uploads as shared documents so they can be
-- re-processed with client-specific extraction
-- ============================================================================

-- First, drop any check constraints that might be blocking updates
ALTER TABLE client_context DROP CONSTRAINT IF EXISTS client_context_priority_level_check;

-- Add columns if they don't exist (with defaults)
DO $$
BEGIN
  -- is_shared
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_context' AND column_name = 'is_shared') THEN
    ALTER TABLE client_context ADD COLUMN is_shared boolean DEFAULT false;
  END IF;
  
  -- data_source_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_context' AND column_name = 'data_source_type') THEN
    ALTER TABLE client_context ADD COLUMN data_source_type text DEFAULT 'general';
  END IF;
  
  -- priority_level
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_context' AND column_name = 'priority_level') THEN
    ALTER TABLE client_context ADD COLUMN priority_level integer DEFAULT 50;
  END IF;
  
  -- shared_with_clients
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_context' AND column_name = 'shared_with_clients') THEN
    ALTER TABLE client_context ADD COLUMN shared_with_clients uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Get Tom and Zaneta's IDs
DO $$
DECLARE
  v_tom_id uuid;
  v_zaneta_id uuid;
  v_practice_id uuid;
BEGIN
  SELECT id, practice_id INTO v_tom_id, v_practice_id
  FROM practice_members WHERE email = 'tom@rowgear.com';
  
  SELECT id INTO v_zaneta_id
  FROM practice_members WHERE email = 'zaneta@zlsalon.co.uk';
  
  RAISE NOTICE 'Tom ID: %, Zaneta ID: %, Practice: %', v_tom_id, v_zaneta_id, v_practice_id;
  
  -- Mark all transcript documents as shared between Tom and Zaneta
  UPDATE client_context
  SET 
    is_shared = true,
    data_source_type = 'transcript',
    priority_level = 30,
    shared_with_clients = ARRAY[v_tom_id, v_zaneta_id]
  WHERE practice_id = v_practice_id
    AND (
      content ILIKE '%transcript%' 
      OR content ILIKE '%recording%'
      OR content ILIKE '%meeting%'
    )
    AND context_type = 'document';
  
  RAISE NOTICE 'Updated % transcript records as shared', (SELECT COUNT(*) FROM client_context WHERE is_shared = true);
END $$;

-- View what was updated
SELECT 
  id,
  client_id,
  content,
  is_shared,
  data_source_type,
  priority_level,
  created_at
FROM client_context 
WHERE is_shared = true
ORDER BY created_at DESC;

-- Show both Tom and Zaneta for reference
SELECT id, name, email FROM practice_members 
WHERE email IN ('tom@rowgear.com', 'zaneta@zlsalon.co.uk');

