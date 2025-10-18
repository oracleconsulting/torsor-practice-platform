-- Add learnings_captured column to cpd_activities table
-- This field stores what the user learned from completing CPD activities

ALTER TABLE public.cpd_activities 
ADD COLUMN IF NOT EXISTS learnings_captured TEXT;

COMMENT ON COLUMN public.cpd_activities.learnings_captured IS 'Knowledge capture - what the user learned from this CPD activity';

-- Create index for searching learnings
CREATE INDEX IF NOT EXISTS idx_cpd_activities_learnings ON public.cpd_activities USING gin(to_tsvector('english', learnings_captured));

-- Fix cpd_roi_dashboard view to use correct column names
DROP VIEW IF EXISTS cpd_roi_dashboard CASCADE;

CREATE OR REPLACE VIEW cpd_roi_dashboard AS
SELECT 
  pm.id as member_id,
  pm.name as member_name,
  pm.role,
  
  -- CPD Summary (using actual column names)
  COUNT(DISTINCT ca.id) as total_cpd_activities,
  COALESCE(SUM(ca.hours_claimed), 0) as total_cpd_hours,
  COALESCE(SUM(ca.cost), 0) as total_cpd_cost,
  
  -- Skill Improvements
  COUNT(DISTINCT csm.skill_id) as skills_targeted,
  COALESCE(AVG(csm.improvement_achieved), 0) as avg_improvement_achieved,
  COALESCE(AVG(csm.effectiveness_percentage), 0) as avg_effectiveness_percentage,
  
  -- ROI Metrics
  CASE 
    WHEN SUM(csm.improvement_achieved) > 0 
    THEN SUM(ca.hours_claimed) / SUM(csm.improvement_achieved)
    ELSE NULL 
  END as hours_per_skill_level,
  
  CASE 
    WHEN SUM(csm.improvement_achieved) > 0 
    THEN SUM(ca.cost) / SUM(csm.improvement_achieved)
    ELSE NULL 
  END as cost_per_skill_level,
  
  -- Team capability score (average skill level)
  (SELECT AVG(current_level) 
   FROM skill_assessments sa
   WHERE sa.team_member_id = pm.id) as current_avg_skill_level
  
FROM practice_members pm
LEFT JOIN cpd_activities ca ON pm.id = ca.practice_member_id
LEFT JOIN cpd_skill_mappings csm ON ca.id = csm.cpd_activity_id
WHERE ca.status = 'completed'
GROUP BY pm.id, pm.name, pm.role;

COMMENT ON VIEW cpd_roi_dashboard IS 'Comprehensive view of CPD return on investment with correct column references';


