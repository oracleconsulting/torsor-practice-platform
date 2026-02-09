-- ============================================================================
-- PUBLISH ALEX (POLAR) DISCOVERY REPORT FOR CLIENT PORTAL
-- ============================================================================
-- Run this in Supabase SQL Editor to fix Alex's client portal so it shows
-- the Pass 2 (5-page) report instead of the legacy report.
--
-- RLS requires: discovery_reports.status = 'published' AND ready_for_client = TRUE
-- for the client to be able to SELECT the row. Until this is run, the client
-- gets no row from discovery_reports and the app falls back to client_reports.
-- ============================================================================

-- Publish discovery_reports (Pass 2) for Polar/Alex
UPDATE discovery_reports
SET
  status = 'published',
  ready_for_client = TRUE,
  published_to_client_at = NOW(),
  updated_at = NOW()
WHERE engagement_id IN (
  SELECT de.id
  FROM discovery_engagements de
  JOIN practice_members pm ON pm.id = de.client_id
  WHERE LOWER(pm.client_company) LIKE '%polar%'
     OR LOWER(pm.name) LIKE '%alex%'
)
  AND (destination_report IS NOT NULL OR page1_destination IS NOT NULL);

-- Publish discovery_engagements for same client(s)
UPDATE discovery_engagements
SET
  status = 'published',
  updated_at = NOW()
WHERE id IN (
  SELECT de.id
  FROM discovery_engagements de
  JOIN practice_members pm ON pm.id = de.client_id
  WHERE LOWER(pm.client_company) LIKE '%polar%'
     OR LOWER(pm.name) LIKE '%alex%'
);

-- Verify: show what the client will now see
SELECT
  dr.id,
  dr.engagement_id,
  dr.status,
  dr.ready_for_client,
  dr.published_to_client_at,
  dr.page1_destination IS NOT NULL AS has_page1,
  dr.destination_report IS NOT NULL AS has_destination_report,
  pm.name AS client_name,
  pm.client_company
FROM discovery_reports dr
JOIN discovery_engagements de ON de.id = dr.engagement_id
JOIN practice_members pm ON pm.id = de.client_id
WHERE LOWER(pm.client_company) LIKE '%polar%'
   OR LOWER(pm.name) LIKE '%alex%'
ORDER BY dr.created_at DESC
LIMIT 3;
