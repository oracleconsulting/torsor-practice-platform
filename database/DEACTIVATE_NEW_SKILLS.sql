-- Mark the 12 new skills (that have no historical data) as inactive
-- This will remove them from heatmaps and service readiness calculations

UPDATE skills 
SET is_active = false 
WHERE name IN (
  'Business Development',
  'Project Management',
  'Regulatory Compliance',
  'Risk Management',
  'Leadership & Mentoring',
  'Client Relationship Management',
  'Communication & Presentation',
  'Problem Solving',
  'Financial Modelling & Forecasting',
  'Strategic Financial Planning',
  'Tax Planning & Advisory',
  'Management Accounting'
);

-- Verify the change
SELECT 
  category,
  COUNT(*) as skill_count,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
FROM skills
GROUP BY category
ORDER BY category;

