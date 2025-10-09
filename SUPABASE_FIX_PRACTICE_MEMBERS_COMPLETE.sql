-- Complete fix for practice_members table
-- Adds all missing columns needed for assessment submission

-- Step 1: Add missing timestamp columns
ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Add email and name columns
ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Step 3: Make user_id nullable
ALTER TABLE practice_members
ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Add constraints
ALTER TABLE practice_members
DROP CONSTRAINT IF EXISTS practice_members_identity_check;

ALTER TABLE practice_members
ADD CONSTRAINT practice_members_identity_check
CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_practice_members_email ON practice_members(email);
CREATE INDEX IF NOT EXISTS idx_practice_members_user_id ON practice_members(user_id);

-- Step 6: Update unique constraints
DROP INDEX IF EXISTS practice_members_user_id_practice_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS practice_members_user_practice_unique
ON practice_members(user_id, practice_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS practice_members_email_practice_unique
ON practice_members(email, practice_id)
WHERE user_id IS NULL AND email IS NOT NULL;

-- Step 7: Add comments
COMMENT ON COLUMN practice_members.user_id IS 'Optional: Links to auth.users when team member creates account';
COMMENT ON COLUMN practice_members.email IS 'Email address - primary identifier before user account creation';
COMMENT ON COLUMN practice_members.name IS 'Team member display name';

