-- Check what columns assessment_insights actually has
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assessment_insights'
ORDER BY ordinal_position;

