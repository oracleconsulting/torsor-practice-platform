-- Verify CPD System Installation

-- Check all 5 tables exist and show their column counts
SELECT 
    '✅ CPD Tables Created' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cpd_activities') as cpd_activities,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cpd_external_resources') as cpd_external_resources,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge_documents') as knowledge_documents,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cpd_requirements') as cpd_requirements,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'development_plan_cpd') as development_plan_cpd;

-- Show sample data was loaded
SELECT 
    '📚 Sample Data Loaded' as status,
    (SELECT COUNT(*) FROM public.cpd_requirements) as cpd_requirements_rows,
    (SELECT COUNT(*) FROM public.cpd_external_resources) as external_resources_rows;

-- Show column details for cpd_activities (the main table)
SELECT 
    'cpd_activities structure' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'cpd_activities'
ORDER BY ordinal_position;

