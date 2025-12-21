-- ============================================================================
-- DIAGNOSTIC QUERY: Check Systems Audit Report Status
-- ============================================================================
-- Run this query in Supabase SQL Editor to check if the report exists
-- and what its status is
-- ============================================================================

-- Replace this engagement_id with the actual engagement ID from the logs
-- From the logs: engagementId: '6bbc7e3b-c0a1-4b41-942f-c5c178006d87'
WITH engagement_check AS (
  SELECT 
    id,
    client_id,
    practice_id,
    status as engagement_status,
    stage_1_completed_at,
    stage_2_completed_at,
    stage_3_completed_at
  FROM sa_engagements
  WHERE id = '6bbc7e3b-c0a1-4b41-942f-c5c178006d87'
),
report_check AS (
  SELECT 
    r.id as report_id,
    r.engagement_id,
    r.status as report_status,
    r.created_at as report_created_at,
    r.approved_at,
    r.approved_by,
    r.headline,
    r.total_hours_wasted_weekly,
    r.total_annual_cost_of_chaos
  FROM sa_audit_reports r
  WHERE r.engagement_id = '6bbc7e3b-c0a1-4b41-942f-c5c178006d87'
)
SELECT 
  e.id as engagement_id,
  e.client_id,
  e.practice_id,
  e.engagement_status,
  e.stage_1_completed_at IS NOT NULL as stage_1_complete,
  e.stage_2_completed_at IS NOT NULL as stage_2_complete,
  e.stage_3_completed_at IS NOT NULL as stage_3_complete,
  r.report_id,
  r.report_status,
  r.report_created_at,
  r.approved_at,
  r.approved_by,
  r.headline,
  CASE 
    WHEN r.report_id IS NULL THEN '❌ NO REPORT FOUND'
    WHEN r.report_status IN ('approved', 'published', 'delivered') THEN '✅ APPROVED - Client should see this'
    ELSE '⚠️ REPORT EXISTS BUT NOT APPROVED - Status: ' || r.report_status
  END as client_visibility_status
FROM engagement_check e
LEFT JOIN report_check r ON r.engagement_id = e.id;

-- ============================================================================
-- QUICK FIX: If report exists but status is not 'approved', run this:
-- ============================================================================
-- UPDATE sa_audit_reports
-- SET 
--   status = 'approved',
--   approved_at = NOW(),
--   approved_by = (SELECT id FROM practice_members WHERE member_type = 'admin' LIMIT 1)
-- WHERE engagement_id = '6bbc7e3b-c0a1-4b41-942f-c5c178006d87'
--   AND status != 'approved';

