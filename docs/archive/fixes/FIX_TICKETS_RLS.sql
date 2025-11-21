-- =====================================================
-- FIX TICKETS SYSTEM RLS POLICIES
-- Issue: Admin cannot reply to tickets due to RLS policy
-- Root cause: practices table has no owner_id column
-- Solution: Use email whitelist for admin access
-- =====================================================

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Members can view tickets" ON support_tickets;
DROP POLICY IF EXISTS "Members can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Members can update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all practice tickets" ON support_tickets;
DROP POLICY IF EXISTS "Members can view ticket replies" ON ticket_replies;
DROP POLICY IF EXISTS "Members can reply to own tickets" ON ticket_replies;
DROP POLICY IF EXISTS "Admins can manage replies" ON ticket_replies;

-- =====================================================
-- SUPPORT_TICKETS POLICIES
-- =====================================================

-- Team members can view their own tickets
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

-- Admin can view and manage all tickets (using email whitelist)
CREATE POLICY "Admins can view all practice tickets" ON support_tickets
  FOR ALL
  USING (
    -- Admin is jhoward@rpgcc.co.uk
    auth.jwt() ->> 'email' = 'jhoward@rpgcc.co.uk'
  );

-- =====================================================
-- TICKET_REPLIES POLICIES
-- =====================================================

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

-- Admins can manage all replies (using email whitelist)
CREATE POLICY "Admins can manage replies" ON ticket_replies
  FOR ALL
  USING (
    -- Admin is jhoward@rpgcc.co.uk
    auth.jwt() ->> 'email' = 'jhoward@rpgcc.co.uk'
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tickets RLS policies fixed!';
  RAISE NOTICE '✅ Admin (jhoward@rpgcc.co.uk) can now reply to all tickets';
  RAISE NOTICE '✅ Members can still view/create/reply to their own tickets';
END $$;

