-- Quick fix: Manually set Jimmy's flag to false
UPDATE practice_members
SET password_change_required = false,
    last_password_change = NOW()
WHERE email = 'jameshowardivc@gmail.com';

-- Verify
SELECT name, email, password_change_required, last_password_change
FROM practice_members
WHERE email = 'jameshowardivc@gmail.com';

