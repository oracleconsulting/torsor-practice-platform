-- Fix CPD Hours Tracking
-- This migration creates triggers to automatically update member CPD hours

-- ============================================
-- 1. CREATE FUNCTION TO UPDATE CPD HOURS
-- ============================================

CREATE OR REPLACE FUNCTION update_member_cpd_hours()
RETURNS TRIGGER AS $$
DECLARE
  total_hours DECIMAL(10,2);
  determined_hours DECIMAL(10,2);
  self_allocated_hours DECIMAL(10,2);
BEGIN
  -- Calculate total hours for this member
  SELECT 
    COALESCE(SUM(hours_claimed), 0)
  INTO total_hours
  FROM cpd_activities
  WHERE practice_member_id = NEW.practice_member_id
    AND status = 'completed';

  -- For now, treat all hours as self-allocated
  -- In future, you can add category field to cpd_activities to distinguish
  self_allocated_hours := total_hours;
  determined_hours := 0;

  -- Update practice_members table
  UPDATE practice_members
  SET 
    cpd_completed_hours = total_hours,
    cpd_determined_completed = determined_hours,
    cpd_self_allocated_completed = self_allocated_hours
  WHERE id = NEW.practice_member_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_member_cpd_hours() IS 'Automatically updates member CPD hour totals when activities are logged';

-- ============================================
-- 2. CREATE TRIGGER FOR NEW/UPDATED ACTIVITIES
-- ============================================

DROP TRIGGER IF EXISTS update_cpd_hours_on_activity ON cpd_activities;

CREATE TRIGGER update_cpd_hours_on_activity
  AFTER INSERT OR UPDATE OF status, hours_claimed ON cpd_activities
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_member_cpd_hours();

COMMENT ON TRIGGER update_cpd_hours_on_activity ON cpd_activities IS 'Updates member CPD totals when activities are completed';

-- ============================================
-- 3. SYNC EXISTING CPD ACTIVITIES (ONE-TIME)
-- ============================================

-- Update all existing members based on their completed activities
WITH member_totals AS (
  SELECT 
    practice_member_id,
    COALESCE(SUM(hours_claimed), 0) as total_hours
  FROM cpd_activities
  WHERE status = 'completed'
  GROUP BY practice_member_id
)
UPDATE practice_members pm
SET 
  cpd_completed_hours = COALESCE(mt.total_hours, 0),
  cpd_self_allocated_completed = COALESCE(mt.total_hours, 0),
  cpd_determined_completed = 0
FROM member_totals mt
WHERE pm.id = mt.practice_member_id;

-- Also initialize members with no CPD to 0
UPDATE practice_members
SET 
  cpd_completed_hours = COALESCE(cpd_completed_hours, 0),
  cpd_determined_completed = COALESCE(cpd_determined_completed, 0),
  cpd_self_allocated_completed = COALESCE(cpd_self_allocated_completed, 0)
WHERE cpd_completed_hours IS NULL;

-- ============================================
-- 4. ADD CATEGORY TO CPD ACTIVITIES (OPTIONAL)
-- ============================================

-- Add category column if it doesn't exist to distinguish determined vs self-allocated
ALTER TABLE cpd_activities 
ADD COLUMN IF NOT EXISTS cpd_category VARCHAR(20) 
CHECK (cpd_category IN ('determined', 'self_allocated', 'verifiable'));

COMMENT ON COLUMN cpd_activities.cpd_category IS 'Type of CPD: determined (practice-assigned) or self_allocated (personal choice)';

-- Default existing activities to self_allocated
UPDATE cpd_activities 
SET cpd_category = 'self_allocated' 
WHERE cpd_category IS NULL;

-- ============================================
-- 5. CREATE ADMIN VIEW FOR CPD OVERVIEW
-- ============================================

CREATE OR REPLACE VIEW admin_cpd_overview AS
SELECT 
  pm.id as member_id,
  pm.name as member_name,
  pm.role,
  pm.practice_id,
  
  -- Requirements from practice
  p.cpd_total_expected_hours as hours_required,
  p.cpd_determined_hours as determined_required,
  p.cpd_self_allocated_hours as self_allocated_required,
  
  -- Completed hours
  pm.cpd_completed_hours as hours_completed,
  pm.cpd_determined_completed as determined_completed,
  pm.cpd_self_allocated_completed as self_allocated_completed,
  
  -- Progress
  CASE 
    WHEN p.cpd_total_expected_hours > 0 
    THEN ROUND((pm.cpd_completed_hours * 100.0 / p.cpd_total_expected_hours)::numeric, 1)
    ELSE 0 
  END as progress_percentage,
  
  -- Remaining hours
  GREATEST(0, p.cpd_total_expected_hours - pm.cpd_completed_hours) as hours_remaining,
  
  -- Activity counts
  (SELECT COUNT(*) 
   FROM cpd_activities ca 
   WHERE ca.practice_member_id = pm.id 
     AND ca.status = 'completed') as activities_completed,
  
  -- Last activity
  (SELECT MAX(activity_date)
   FROM cpd_activities ca
   WHERE ca.practice_member_id = pm.id
     AND ca.status = 'completed') as last_cpd_date,
  
  -- Exemption status
  pm.cpd_exempt,
  pm.cpd_notes

FROM practice_members pm
LEFT JOIN practices p ON pm.practice_id = p.id
WHERE pm.is_active = true
ORDER BY pm.name;

COMMENT ON VIEW admin_cpd_overview IS 'Admin dashboard view of all team member CPD progress';

-- ============================================
-- 6. CREATE FUNCTION TO RECALCULATE HOURS
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_all_cpd_hours()
RETURNS TABLE (
  member_id UUID,
  member_name VARCHAR,
  old_hours DECIMAL,
  new_hours DECIMAL,
  difference DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH calculations AS (
    SELECT 
      pm.id,
      pm.name,
      pm.cpd_completed_hours as old_total,
      COALESCE(SUM(ca.hours_claimed), 0) as new_total
    FROM practice_members pm
    LEFT JOIN cpd_activities ca ON pm.id = ca.practice_member_id 
      AND ca.status = 'completed'
    GROUP BY pm.id, pm.name, pm.cpd_completed_hours
  )
  SELECT 
    c.id,
    c.name,
    c.old_total,
    c.new_total,
    c.new_total - COALESCE(c.old_total, 0)
  FROM calculations c
  WHERE c.new_total != COALESCE(c.old_total, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_all_cpd_hours() IS 'Utility function to check and recalculate CPD hours for all members';

