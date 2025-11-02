-- Fix RLS policy for cpd_notifications to allow trigger inserts
-- The trigger function needs to be able to insert notifications

-- Drop existing policies
DROP POLICY IF EXISTS cpd_notifications_member_select ON cpd_notifications;
DROP POLICY IF EXISTS cpd_notifications_member_update ON cpd_notifications;
DROP POLICY IF EXISTS cpd_notifications_admin_all ON cpd_notifications;
DROP POLICY IF EXISTS cpd_notifications_trigger_insert ON cpd_notifications;

-- Recreate policies with proper permissions

-- Members can view their own notifications
CREATE POLICY cpd_notifications_member_select ON cpd_notifications
  FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- Members can update (mark as read) their own notifications
CREATE POLICY cpd_notifications_member_update ON cpd_notifications
  FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY cpd_notifications_admin_all ON cpd_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM practice_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow trigger functions to insert notifications (bypass RLS for service role)
-- This is needed because triggers run as the user but need system-level insert
CREATE POLICY cpd_notifications_trigger_insert ON cpd_notifications
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts (RLS is bypassed by triggers anyway via SECURITY DEFINER)

COMMENT ON POLICY cpd_notifications_trigger_insert ON cpd_notifications IS 
  'Allows database triggers to insert notifications for any member';

