-- Add unique constraint to skill_assessments table
-- This ensures one assessment per skill per team member
-- Run this in Supabase SQL Editor

-- Add the unique constraint if it doesn't exist
ALTER TABLE skill_assessments 
ADD CONSTRAINT skill_assessments_unique_member_skill 
UNIQUE (team_member_id, skill_id);

-- Verify the constraint was added
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'skill_assessments'
AND con.contype = 'u';

