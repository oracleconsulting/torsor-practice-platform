-- ============================================================================
-- PUBLISH DISCOVERY REPORT FOR CLIENT PORTAL
-- ============================================================================
-- Run in Supabase SQL Editor when the client portal shows the wrong (legacy)
-- report instead of the Pass 2 (5-page) report.
--
-- Step 1: Run the DIAGNOSTIC block to see what the client currently sees.
-- Step 2: Run the FIX block with the correct engagement_id (from Step 1).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: DIAGNOSTIC — What does the client see for this client?
-- ----------------------------------------------------------------------------
-- Replace '%polar%' / '%alex%' with the client name or company to find.

SELECT
  de.id AS engagement_id,
  de.status AS engagement_status,
  de.client_id,
  pm.name AS client_name,
  pm.client_company
FROM discovery_engagements de
JOIN practice_members pm ON pm.id = de.client_id
WHERE LOWER(pm.client_company) LIKE '%polar%'
   OR LOWER(pm.name) LIKE '%alex%'
ORDER BY de.created_at DESC
LIMIT 3;

-- discovery_reports (Pass 2)
SELECT
  dr.id,
  dr.engagement_id,
  dr.status,
  dr.ready_for_client,
  dr.published_to_client_at,
  dr.page1_destination IS NOT NULL AS has_page1,
  dr.destination_report IS NOT NULL AS has_destination_report,
  dr.created_at
FROM discovery_reports dr
JOIN discovery_engagements de ON de.id = dr.engagement_id
JOIN practice_members pm ON pm.id = de.client_id
WHERE LOWER(pm.client_company) LIKE '%polar%'
   OR LOWER(pm.name) LIKE '%alex%'
ORDER BY dr.created_at DESC
LIMIT 3;

-- client_reports (legacy)
SELECT
  cr.id,
  cr.report_type,
  cr.is_shared_with_client,
  cr.report_data IS NOT NULL AS has_data,
  cr.created_at
FROM client_reports cr
JOIN practice_members pm ON pm.id = cr.client_id
WHERE (LOWER(pm.client_company) LIKE '%polar%' OR LOWER(pm.name) LIKE '%alex%')
  AND cr.report_type = 'discovery_analysis'
ORDER BY cr.created_at DESC
LIMIT 3;

-- ----------------------------------------------------------------------------
-- STEP 2: FIX — Publish Pass 2 so client portal shows it
-- ----------------------------------------------------------------------------
-- Replace the engagement_id below with the engagement_id from Step 1.

/*
UPDATE discovery_reports
SET
  status = 'published',
  ready_for_client = TRUE,
  published_to_client_at = NOW(),
  updated_at = NOW()
WHERE engagement_id = '6cfb2a1c-d81a-4f97-afac-98c3132f92fa'
  AND status != 'published';

UPDATE discovery_engagements
SET
  status = 'published',
  updated_at = NOW()
WHERE id = '6cfb2a1c-d81a-4f97-afac-98c3132f92fa'
  AND status != 'published';

-- Verify
SELECT
  dr.id,
  dr.status,
  dr.ready_for_client,
  dr.published_to_client_at,
  dr.destination_report IS NOT NULL AS has_report_data
FROM discovery_reports dr
WHERE dr.engagement_id = '6cfb2a1c-d81a-4f97-afac-98c3132f92fa';
*/
