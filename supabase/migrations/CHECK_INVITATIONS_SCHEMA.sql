-- Check invitations table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

