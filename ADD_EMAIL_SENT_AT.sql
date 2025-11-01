-- Add email_sent_at column to ticket_replies
-- This tracks when the email notification was sent

ALTER TABLE ticket_replies 
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN ticket_replies.email_sent_at IS 'Timestamp when email notification was sent';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Added email_sent_at column to ticket_replies';
  RAISE NOTICE '✅ Email notifications will now track send time';
END $$;

