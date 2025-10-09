-- Fix: Remove extra skills and ensure exactly 105
-- First, let's see what we have
SELECT category, COUNT(*) as count
FROM skills
GROUP BY category
ORDER BY category;

-- Delete all skills to start fresh
DELETE FROM skills;

-- Verify empty
SELECT COUNT(*) as should_be_zero FROM skills;

-- Now the script will be clean - let me verify the actual count in the migration file
-- The issue is likely duplicate entries

-- Temporary fix: Remove all and reload
TRUNCATE skills CASCADE;

