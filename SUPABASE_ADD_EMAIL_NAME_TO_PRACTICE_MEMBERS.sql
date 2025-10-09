-- Add email and name columns to practice_members table
-- This allows creating practice_members before users have accounts

-- Step 1: Add the columns
ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Step 2: Make user_id nullable
ALTER TABLE practice_members
ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Add constraints
-- Either user_id OR email must be present
ALTER TABLE practice_members
DROP CONSTRAINT IF EXISTS practice_members_identity_check;

ALTER TABLE practice_members
ADD CONSTRAINT practice_members_identity_check
CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_members_email ON practice_members(email);
CREATE INDEX IF NOT EXISTS idx_practice_members_user_id ON practice_members(user_id);

-- Step 5: Update unique constraints
-- Allow multiple NULL user_ids but enforce uniqueness when present
DROP INDEX IF EXISTS practice_members_user_id_practice_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS practice_members_user_practice_unique
ON practice_members(user_id, practice_id)
WHERE user_id IS NOT NULL;

-- Enforce unique email per practice when user_id is NULL
CREATE UNIQUE INDEX IF NOT EXISTS practice_members_email_practice_unique
ON practice_members(email, practice_id)
WHERE user_id IS NULL AND email IS NOT NULL;

-- Step 6: Add helpful comments
COMMENT ON COLUMN practice_members.user_id IS 'Optional: Links to auth.users when team member creates account';
COMMENT ON COLUMN practice_members.email IS 'Email address - used as primary identifier before user account creation';
COMMENT ON COLUMN practice_members.name IS 'Team member display name';

-- Step 7: Backfill name from users table where user_id exists (optional, for existing data)
UPDATE practice_members pm
SET email = u.email,
    name = COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE pm.user_id = u.id
  AND pm.email IS NULL;

