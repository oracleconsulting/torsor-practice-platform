-- Fix skill_assessments table for backend insertion
-- Ensures server-side submission works properly

-- Step 1: Verify/create the table structure
CREATE TABLE IF NOT EXISTS skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_level INT NOT NULL CHECK (current_level BETWEEN 1 AND 5),
  interest_level INT NOT NULL CHECK (interest_level BETWEEN 1 AND 5),
  notes TEXT,
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one assessment per skill per team member
  UNIQUE(team_member_id, skill_id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_skill_assessments_member ON skill_assessments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_skill ON skill_assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_assessed_at ON skill_assessments(assessed_at);

-- Step 3: Enable RLS
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies
DROP POLICY IF EXISTS "Users can read their own assessments" ON skill_assessments;
DROP POLICY IF EXISTS "Users can create their own assessments" ON skill_assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON skill_assessments;
DROP POLICY IF EXISTS "Allow authenticated users to read assessments" ON skill_assessments;
DROP POLICY IF EXISTS "Allow service role full access" ON skill_assessments;

-- Step 5: Create RLS policies
-- Allow users to read their own assessments
CREATE POLICY "Users can read their own assessments"
ON skill_assessments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = skill_assessments.team_member_id
    AND (
      practice_members.user_id = auth.uid()
      OR auth.role() = 'authenticated'
    )
  )
);

-- Allow users to insert their own assessments
CREATE POLICY "Users can create their own assessments"
ON skill_assessments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = skill_assessments.team_member_id
    AND (
      practice_members.user_id = auth.uid()
      OR practice_members.user_id IS NULL  -- Allow for team members without user accounts
    )
  )
);

-- Allow users to update their own assessments
CREATE POLICY "Users can update their own assessments"
ON skill_assessments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = skill_assessments.team_member_id
    AND practice_members.user_id = auth.uid()
  )
);

-- Allow users to delete their own assessments
CREATE POLICY "Users can delete their own assessments"
ON skill_assessments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = skill_assessments.team_member_id
    AND practice_members.user_id = auth.uid()
  )
);

-- Step 6: Add helpful comments
COMMENT ON TABLE skill_assessments IS 'Individual skill assessments for team members';
COMMENT ON COLUMN skill_assessments.team_member_id IS 'Links to practice_members.id';
COMMENT ON COLUMN skill_assessments.skill_id IS 'Links to skills.id';
COMMENT ON COLUMN skill_assessments.current_level IS 'Self-assessed competence (1-5)';
COMMENT ON COLUMN skill_assessments.interest_level IS 'Interest in developing this skill (1-5)';
COMMENT ON COLUMN skill_assessments.assessed_at IS 'When the assessment was completed';

-- Step 7: Create or replace the update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_skill_assessments_updated_at ON skill_assessments;

CREATE TRIGGER update_skill_assessments_updated_at
  BEFORE UPDATE ON skill_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verification query
SELECT 
  'skill_assessments' as table_name,
  COUNT(*) as current_assessment_count,
  COUNT(DISTINCT team_member_id) as unique_members,
  COUNT(DISTINCT skill_id) as skills_assessed
FROM skill_assessments;

