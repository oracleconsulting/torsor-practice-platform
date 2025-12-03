-- ============================================================================
-- DELETE TEST USER - Complete cleanup for fresh signup testing
-- ============================================================================
-- Run this to completely remove a test user and start fresh
-- ============================================================================

-- Delete by email (catches orphaned records too)
DELETE FROM client_service_lines WHERE client_id IN (
  SELECT id FROM practice_members WHERE email = 'laspartnership@googlemail.com'
);

DELETE FROM service_line_assessments WHERE client_id IN (
  SELECT id FROM practice_members WHERE email = 'laspartnership@googlemail.com'
);

DELETE FROM client_assessments WHERE client_id IN (
  SELECT id FROM practice_members WHERE email = 'laspartnership@googlemail.com'
);

DELETE FROM client_roadmaps WHERE client_id IN (
  SELECT id FROM practice_members WHERE email = 'laspartnership@googlemail.com'
);

DELETE FROM practice_members WHERE email = 'laspartnership@googlemail.com';

DELETE FROM auth.users WHERE email = 'laspartnership@googlemail.com';

-- Verify cleanup
SELECT 'Auth users remaining:' as check, count(*) FROM auth.users WHERE email = 'laspartnership@googlemail.com';
SELECT 'Practice members remaining:' as check, count(*) FROM practice_members WHERE email = 'laspartnership@googlemail.com';

