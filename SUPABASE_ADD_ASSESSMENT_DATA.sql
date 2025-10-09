-- Add assessment_data column to invitations table
-- This stores the skills assessment responses directly in the invitation record
-- No authentication required for data collection!

ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS assessment_data JSONB DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN invitations.assessment_data IS 'Skills assessment responses (collected before authentication setup)';

-- Verify column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invitations' 
AND column_name = 'assessment_data';

