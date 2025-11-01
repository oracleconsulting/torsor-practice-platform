-- =====================================================
-- FIX TICKETS SYSTEM RLS POLICIES
-- Issue: Admin cannot reply to tickets due to RLS policy
-- Root cause: practices table has no owner_id column
-- Solution: Use email whitelist for admin access
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all practice tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can manage replies" ON ticket_replies;

-- Recreate admin policy for support_tickets using email whitelist
CREATE POLICY "Admins can view all practice tickets" ON support_tickets
  FOR ALL
  USING (
    -- Admin is jhoward@rpgcc.co.uk
    auth.jwt() ->> 'email' = 'jhoward@rpgcc.co.uk'
  );

-- Recreate admin policy for ticket_replies using email whitelist
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

