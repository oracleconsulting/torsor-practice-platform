-- Add skip_value_analysis column for clients who don't need Part 3
-- (e.g., Tom & Zaneta in the 365 Alignment Program)

-- Add column to practice_members
ALTER TABLE practice_members 
ADD COLUMN IF NOT EXISTS skip_value_analysis BOOLEAN DEFAULT false;

-- Add column to track fit_profile in client_assessments
ALTER TABLE client_assessments
ADD COLUMN IF NOT EXISTS fit_profile JSONB;

-- Set Tom to skip value analysis
UPDATE practice_members 
SET skip_value_analysis = true 
WHERE email = 'tom@rowgear.com';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_practice_members_skip_value_analysis 
ON practice_members(skip_value_analysis) WHERE skip_value_analysis = true;

-- Comment for clarity
COMMENT ON COLUMN practice_members.skip_value_analysis IS 
'When true, client skips Part 3 (Hidden Value Audit). Used for 365 Alignment clients like Tom/Zaneta.';

COMMENT ON COLUMN client_assessments.fit_profile IS 
'Generated after Part 1 completion. Contains fit signals, personalized message, and journey recommendation.';

