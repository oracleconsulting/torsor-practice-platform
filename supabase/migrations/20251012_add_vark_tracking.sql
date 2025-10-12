-- Add VARK assessment tracking to practice_members
-- This tracks whether a team member has completed their VARK learning style assessment

ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS vark_assessment_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vark_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vark_result JSONB,
ADD COLUMN IF NOT EXISTS needs_password_setup BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN practice_members.vark_assessment_completed IS 'Whether the team member has completed their VARK learning style assessment';
COMMENT ON COLUMN practice_members.vark_completed_at IS 'Timestamp when VARK assessment was completed';
COMMENT ON COLUMN practice_members.vark_result IS 'JSON object containing VARK assessment results (Visual, Auditory, Reading, Kinesthetic scores)';
COMMENT ON COLUMN practice_members.needs_password_setup IS 'Whether the team member needs to set up their password (for new invites)';

-- Create index for filtering members who need to complete VARK
CREATE INDEX IF NOT EXISTS idx_practice_members_vark_pending 
ON practice_members(practice_id, vark_assessment_completed) 
WHERE vark_assessment_completed = FALSE AND is_active = TRUE;

-- Function to mark VARK as complete
CREATE OR REPLACE FUNCTION complete_vark_assessment(
  p_member_id UUID,
  p_vark_result JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE practice_members
  SET 
    vark_assessment_completed = TRUE,
    vark_completed_at = NOW(),
    vark_result = p_vark_result
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_vark_assessment(UUID, JSONB) TO authenticated;

