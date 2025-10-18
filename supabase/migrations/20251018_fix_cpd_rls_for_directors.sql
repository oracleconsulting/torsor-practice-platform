-- Fix CPD RLS Policy to include Directors
-- Directors should be able to view team CPD activities

-- Drop ALL existing manager/director policies (might have multiple from different migrations)
DROP POLICY IF EXISTS "Managers can view team CPD activities" ON public.cpd_activities;
DROP POLICY IF EXISTS "Managers and Directors can view team CPD" ON public.cpd_activities;
DROP POLICY IF EXISTS "Managers can view team CPD" ON public.cpd_activities;

-- Create the new policy with expanded roles
CREATE POLICY "Managers and Directors can view team CPD"
    ON public.cpd_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.practice_members pm1
            WHERE pm1.id = cpd_activities.practice_member_id
            AND pm1.practice_id IN (
                SELECT pm2.practice_id FROM public.practice_members pm2
                WHERE pm2.user_id = auth.uid() 
                AND LOWER(pm2.role) IN ('owner', 'admin', 'manager', 'director', 'partner', 'associate director', 'senior manager')
            )
        )
    );

COMMENT ON POLICY "Managers and Directors can view team CPD" ON public.cpd_activities IS 
'Allows practice owners, admins, managers, directors, partners, and senior roles to view all CPD activities for team members in their practice';

