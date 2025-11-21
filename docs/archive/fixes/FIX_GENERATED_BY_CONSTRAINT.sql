-- Fix generated_profiles foreign key constraint
-- Make generated_by nullable since auth user might not be a practice member

ALTER TABLE generated_profiles 
ALTER COLUMN generated_by DROP NOT NULL;

-- Also update the existing constraint to allow NULL
COMMENT ON COLUMN generated_profiles.generated_by IS 'User who generated the profile (can be null if auto-generated)';

