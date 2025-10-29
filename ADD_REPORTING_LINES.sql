-- Add reporting lines to practice_members table
-- This enables managers to oversee their direct reports

-- Add reports_to_id column (self-referencing foreign key)
ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS reports_to_id UUID REFERENCES practice_members(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_practice_members_reports_to 
ON practice_members(reports_to_id) 
WHERE reports_to_id IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'practice_members'
  AND column_name = 'reports_to_id';
