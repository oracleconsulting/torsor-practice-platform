-- Fix the self-referencing foreign key for reporting lines
-- Drop the old constraint if it exists
ALTER TABLE practice_members 
DROP CONSTRAINT IF EXISTS practice_members_reports_to_id_fkey;

-- Add the correct self-referencing foreign key
ALTER TABLE practice_members
ADD CONSTRAINT practice_members_reports_to_id_fkey 
FOREIGN KEY (reports_to_id) 
REFERENCES practice_members(id) 
ON DELETE SET NULL;

-- Verify
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname = 'practice_members_reports_to_id_fkey';

