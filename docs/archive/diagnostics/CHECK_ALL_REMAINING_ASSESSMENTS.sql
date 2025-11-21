-- Check ALL assessment table structures in one go
-- EQ Assessments
SELECT 'eq_assessments' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'eq_assessments'
ORDER BY ordinal_position;

-- Working Preferences
SELECT 'working_preferences' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'working_preferences'
ORDER BY ordinal_position;

-- Conflict Style Assessments
SELECT 'conflict_style_assessments' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'conflict_style_assessments'
ORDER BY ordinal_position;

-- Motivational Drivers
SELECT 'motivational_drivers' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'motivational_drivers'
ORDER BY ordinal_position;

-- Assessment Insights
SELECT 'assessment_insights' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'assessment_insights'
ORDER BY ordinal_position;

