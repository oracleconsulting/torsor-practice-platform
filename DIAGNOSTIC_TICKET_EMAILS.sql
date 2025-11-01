-- DIAGNOSTIC: Check if ticket has correct email for notifications
-- Run this to see what email is stored in the ticket

SELECT 
  id,
  subject,
  submitter_email,
  practice_member_id,
  is_anonymous,
  status,
  created_at
FROM support_tickets
ORDER BY created_at DESC
LIMIT 5;

-- Also check the practice_members table to see member emails
SELECT 
  pm.id,
  pm.name,
  pm.email,
  pm.user_id
FROM practice_members pm
ORDER BY pm.created_at DESC
LIMIT 10;

-- Check ticket replies and email status
SELECT 
  tr.id,
  tr.ticket_id,
  tr.message,
  tr.is_admin_reply,
  tr.email_sent,
  tr.email_sent_at,
  tr.created_at,
  st.subject,
  st.submitter_email
FROM ticket_replies tr
JOIN support_tickets st ON tr.ticket_id = st.id
ORDER BY tr.created_at DESC
LIMIT 10;

-- EXPECTED RESULTS:
-- 1. support_tickets.submitter_email should have a valid email (e.g., jameshowardivc@gmail.com)
-- 2. ticket_replies.email_sent should be TRUE if email was sent
-- 3. ticket_replies.email_sent_at should have a timestamp

-- TROUBLESHOOTING:
-- If submitter_email is NULL → Member record has no email
-- If email_sent is FALSE → Email sending failed (check browser console)
-- If email_sent is TRUE but no email received → Check spam folder or Resend logs

