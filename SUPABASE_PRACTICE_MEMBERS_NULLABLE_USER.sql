-- Make user_id nullable in practice_members table
-- This allows creating practice_members from assessment submissions
-- before the user has created an account

-- Make user_id nullable (if it isn't already)
ALTER TABLE practice_members
ALTER COLUMN user_id DROP NOT NULL;

-- Add a check to ensure we have either user_id OR email
ALTER TABLE practice_members
ADD CONSTRAINT practice_members_identity_check
CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_practice_members_email ON practice_members(email);

-- Update the unique constraint to allow multiple records with NULL user_id
-- but still enforce uniqueness when user_id is present
DROP INDEX IF EXISTS practice_members_user_id_practice_id_key;

CREATE UNIQUE INDEX practice_members_user_practice_unique
ON practice_members(user_id, practice_id)
WHERE user_id IS NOT NULL;

-- Add unique constraint on email + practice_id for team members without users
CREATE UNIQUE INDEX IF NOT EXISTS practice_members_email_practice_unique
ON practice_members(email, practice_id)
WHERE user_id IS NULL;

-- Comments for clarity
COMMENT ON COLUMN practice_members.user_id IS 'Optional: Links to auth.users when team member creates account';
COMMENT ON COLUMN practice_members.email IS 'Required: Primary identifier for team members';

