-- Add missing assessed_at column to skill_assessments table
-- This is required by the backend submission endpoint

-- Add the missing columns
ALTER TABLE skill_assessments
ADD COLUMN IF NOT EXISTS assessed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill assessed_at for existing records (if any)
UPDATE skill_assessments
SET assessed_at = created_at
WHERE assessed_at IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_skill_assessments_assessed_at ON skill_assessments(assessed_at);

-- Verification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'skill_assessments' 
ORDER BY ordinal_position;

