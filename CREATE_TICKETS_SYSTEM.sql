-- Tickets System Database Schema
-- Creates tables for team member tickets, replies, and notifications

-- Main tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID REFERENCES practice_members(id) ON DELETE SET NULL,
  practice_id UUID NOT NULL REFERENCES accountancy_practices(id) ON DELETE CASCADE,
  
  -- Ticket details
  category VARCHAR(50) NOT NULL CHECK (category IN ('issue', 'question', 'suggestion', 'feedback', 'other')),
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Privacy
  is_anonymous BOOLEAN DEFAULT FALSE,
  submitter_email VARCHAR(255), -- Stored even if anonymous for notifications
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Ticket replies table
CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  
  -- Reply details
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN DEFAULT TRUE, -- TRUE = admin reply, FALSE = member follow-up
  author_id UUID, -- If admin, references user; if member, references practice_team_members
  author_name VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Email notification tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_practice ON support_tickets(practice_id);
CREATE INDEX IF NOT EXISTS idx_tickets_member ON support_tickets(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_created ON ticket_replies(created_at DESC);

-- RLS Policies for security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

-- Team members can view their own tickets (or all non-anonymous tickets in their practice)
CREATE POLICY "Members can view tickets" ON support_tickets
  FOR SELECT
  USING (
    practice_member_id = (SELECT id FROM practice_members WHERE user_id = auth.uid())
    OR practice_id = (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())
  );

-- Team members can insert their own tickets
CREATE POLICY "Members can create tickets" ON support_tickets
  FOR INSERT
  WITH CHECK (
    practice_member_id = (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

-- Team members can update their own tickets (to add follow-up info)
CREATE POLICY "Members can update own tickets" ON support_tickets
  FOR UPDATE
  USING (
    practice_member_id = (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

-- Admin/owner can view all tickets in their practice
CREATE POLICY "Admins can view all practice tickets" ON support_tickets
  FOR ALL
  USING (
    practice_id IN (
      SELECT id FROM accountancy_practices 
      WHERE owner_id = auth.uid()
    )
  );

-- Members can view replies to their tickets
CREATE POLICY "Members can view ticket replies" ON ticket_replies
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE practice_member_id = (SELECT id FROM practice_members WHERE user_id = auth.uid())
    )
  );

-- Members can add follow-up replies to their own tickets
CREATE POLICY "Members can reply to own tickets" ON ticket_replies
  FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE practice_member_id = (SELECT id FROM practice_members WHERE user_id = auth.uid())
    )
  );

-- Admins can manage all replies in their practice
CREATE POLICY "Admins can manage replies" ON ticket_replies
  FOR ALL
  USING (
    ticket_id IN (
      SELECT st.id FROM support_tickets st
      INNER JOIN accountancy_practices ap ON st.practice_id = ap.id
      WHERE ap.owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_ticket_timestamp
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamp();

-- Sample data (optional - remove in production)
-- To add sample data, replace the UUIDs and values below with your actual practice and member IDs:
-- 
-- INSERT INTO support_tickets (practice_id, practice_member_id, category, subject, description, is_anonymous, submitter_email)
-- VALUES (
--   '[YOUR_PRACTICE_ID]',
--   (SELECT id FROM practice_members WHERE email = 'james.howard@example.com' LIMIT 1),
--   'question',
--   'How do I update my VARK assessment?',
--   'I completed the VARK assessment last month but my learning style has changed. Can I retake it?',
--   FALSE,
--   'james.howard@example.com'
-- );

COMMENT ON TABLE support_tickets IS 'Support tickets raised by team members - issues, questions, suggestions';
COMMENT ON TABLE ticket_replies IS 'Admin and member replies to support tickets';
COMMENT ON COLUMN support_tickets.is_anonymous IS 'If TRUE, admin cannot see who submitted the ticket';
COMMENT ON COLUMN support_tickets.submitter_email IS 'Email for notifications - stored even for anonymous tickets';

