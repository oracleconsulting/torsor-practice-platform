-- =====================================================
-- PURGE AI-DISCOVERED CPD RESOURCES
-- =====================================================
-- Purpose: Remove all AI-discovered knowledge documents and courses
--          KEEPS leadership library and manually uploaded content
-- Safe to run multiple times (idempotent)
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Identify what we're keeping vs. deleting
-- =====================================================

-- Preview what will be deleted (KNOWLEDGE DOCUMENTS)
DO $$ 
DECLARE
  v_delete_count INTEGER;
  v_keep_count INTEGER;
BEGIN
  -- Count AI-discovered documents (identified by file_path containing http and file_name containing skill names)
  SELECT COUNT(*) INTO v_delete_count
  FROM knowledge_documents
  WHERE 
    -- AI-discovered documents have URLs in file_path
    (file_path LIKE 'http%')
    OR
    -- AI-discovered documents have specific naming patterns
    (file_name LIKE '%-article-%' OR file_name LIKE '%-webinar-%' OR 
     file_name LIKE '%-video-%' OR file_name LIKE '%-podcast-%' OR 
     file_name LIKE '%-case_study-%')
    OR
    -- AI-discovered documents have 'level' in filename
    (file_name LIKE '%level%');
    
  -- Count documents we're keeping
  SELECT COUNT(*) INTO v_keep_count
  FROM knowledge_documents
  WHERE 
    file_path NOT LIKE 'http%'
    AND file_name NOT LIKE '%-article-%'
    AND file_name NOT LIKE '%-webinar-%'
    AND file_name NOT LIKE '%-video-%'
    AND file_name NOT LIKE '%-podcast-%'
    AND file_name NOT LIKE '%-case_study-%'
    AND file_name NOT LIKE '%level%';
    
  RAISE NOTICE '📊 KNOWLEDGE DOCUMENTS:';
  RAISE NOTICE '  ✅ Keeping (leadership library, manual uploads): %', v_keep_count;
  RAISE NOTICE '  🗑️  Deleting (AI-discovered CPD): %', v_delete_count;
END $$;

-- Preview what will be deleted (EXTERNAL COURSES)
DO $$ 
DECLARE
  v_course_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_course_count
  FROM cpd_external_resources;
    
  RAISE NOTICE '📊 EXTERNAL COURSES:';
  RAISE NOTICE '  🗑️  Deleting (all AI-discovered courses): %', v_course_count;
END $$;

-- =====================================================
-- Step 2: Delete AI-discovered external courses
-- =====================================================

DO $$ 
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM cpd_external_resources
  WHERE type = 'course';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % AI-discovered external courses', v_deleted_count;
END $$;

-- =====================================================
-- Step 3: Delete AI-discovered knowledge documents
-- =====================================================

DO $$ 
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM knowledge_documents
  WHERE 
    -- AI-discovered documents have URLs in file_path
    (file_path LIKE 'http%')
    OR
    -- AI-discovered documents have specific naming patterns
    (file_name LIKE '%-article-%' OR file_name LIKE '%-webinar-%' OR 
     file_name LIKE '%-video-%' OR file_name LIKE '%-podcast-%' OR 
     file_name LIKE '%-case_study-%')
    OR
    -- AI-discovered documents have 'level' in filename
    (file_name LIKE '%level%');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % AI-discovered knowledge documents', v_deleted_count;
END $$;

-- =====================================================
-- Step 4: Clean up related data
-- =====================================================

DO $$ 
DECLARE
  v_activities_deleted INTEGER;
  v_recommendations_deleted INTEGER;
BEGIN
  -- Delete CPD activities linked to deleted documents
  DELETE FROM cpd_activities
  WHERE knowledge_document_id IS NOT NULL
    AND knowledge_document_id NOT IN (SELECT id FROM knowledge_documents);
  
  GET DIAGNOSTICS v_activities_deleted = ROW_COUNT;
  RAISE NOTICE '✅ Cleaned up % orphaned CPD activities', v_activities_deleted;
  
  -- Delete CPD recommendations linked to deleted resources
  DELETE FROM cpd_recommendations
  WHERE 
    (linked_knowledge_doc_id IS NOT NULL 
     AND linked_knowledge_doc_id NOT IN (SELECT id FROM knowledge_documents))
    OR
    (linked_external_resource_id IS NOT NULL 
     AND linked_external_resource_id NOT IN (SELECT id FROM cpd_external_resources));
  
  GET DIAGNOSTICS v_recommendations_deleted = ROW_COUNT;
  RAISE NOTICE '✅ Cleaned up % orphaned CPD recommendations', v_recommendations_deleted;
END $$;

-- =====================================================
-- Step 5: Verify what remains
-- =====================================================

DO $$ 
DECLARE
  v_remaining_docs INTEGER;
  v_remaining_courses INTEGER;
  v_remaining_activities INTEGER;
  v_remaining_recommendations INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining_docs FROM knowledge_documents;
  SELECT COUNT(*) INTO v_remaining_courses FROM cpd_external_resources;
  SELECT COUNT(*) INTO v_remaining_activities FROM cpd_activities;
  SELECT COUNT(*) INTO v_remaining_recommendations FROM cpd_recommendations;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 FINAL STATE:';
  RAISE NOTICE '  📚 Knowledge Documents Remaining: %', v_remaining_docs;
  RAISE NOTICE '  🎓 External Courses Remaining: %', v_remaining_courses;
  RAISE NOTICE '  ✅ CPD Activities Remaining: %', v_remaining_activities;
  RAISE NOTICE '  💡 CPD Recommendations Remaining: %', v_remaining_recommendations;
  RAISE NOTICE '';
  RAISE NOTICE '✅ PURGE COMPLETE - Leadership library and manual uploads preserved!';
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run separately after migration)
-- =====================================================

-- Verify leadership library is intact
-- SELECT COUNT(*) as leadership_docs
-- FROM knowledge_documents
-- WHERE file_path NOT LIKE 'http%';

-- Verify all AI discoveries are gone
-- SELECT COUNT(*) as should_be_zero
-- FROM knowledge_documents
-- WHERE file_path LIKE 'http%';

-- Show remaining documents
-- SELECT id, title, file_name, created_at
-- FROM knowledge_documents
-- ORDER BY created_at DESC
-- LIMIT 10;

