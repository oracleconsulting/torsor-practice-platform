-- ============================================================================
-- MIGRATE LEGACY DISCOVERY ASSESSMENTS
-- ============================================================================
-- For clients who completed the old discovery assessment, create the necessary
-- discovery_engagements records so they can use the new report system
-- ============================================================================

-- Create discovery_engagements for any destination_discovery records that don't have one
INSERT INTO discovery_engagements (
  id,
  practice_id,
  client_id,
  discovery_id,
  status,
  assessment_started_at,
  assessment_completed_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  dd.practice_id,
  dd.client_id,
  dd.id,
  CASE 
    WHEN dd.completed_at IS NOT NULL THEN 'responses_complete'
    ELSE 'pending_responses'
  END,
  dd.created_at,
  dd.completed_at,
  dd.created_at,
  NOW()
FROM destination_discovery dd
WHERE NOT EXISTS (
  SELECT 1 FROM discovery_engagements de 
  WHERE de.client_id = dd.client_id 
  AND de.practice_id = dd.practice_id
)
ON CONFLICT DO NOTHING;

-- Map any old question keys to new ones if needed
-- The old system used slightly different keys for some questions
-- This creates a helper function to normalize responses

CREATE OR REPLACE FUNCTION normalize_discovery_responses(responses JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  normalized JSONB;
BEGIN
  normalized := responses;
  
  -- Map old keys to new keys if they exist
  -- dd_five_year_picture -> dd_five_year_vision (most important one)
  IF responses ? 'dd_five_year_picture' AND NOT responses ? 'dd_five_year_vision' THEN
    normalized := jsonb_set(normalized, '{dd_five_year_vision}', responses->'dd_five_year_picture');
  END IF;
  
  -- dd_what_would_change -> dd_unlimited_change
  IF responses ? 'dd_what_would_change' AND NOT responses ? 'dd_unlimited_change' THEN
    normalized := jsonb_set(normalized, '{dd_unlimited_change}', responses->'dd_what_would_change');
  END IF;
  
  -- dd_avoided_conversation -> dd_people_challenge (if more detailed)
  -- Keep both as they provide different insights
  
  RETURN normalized;
END;
$$;

-- Update destination_discovery records to normalize the keys
-- This adds the new keys while preserving the old ones
UPDATE destination_discovery
SET responses = normalize_discovery_responses(responses)
WHERE responses IS NOT NULL
AND (
  (responses ? 'dd_five_year_picture' AND NOT responses ? 'dd_five_year_vision')
  OR (responses ? 'dd_what_would_change' AND NOT responses ? 'dd_unlimited_change')
);

-- Log what we migrated
DO $$
DECLARE
  engagement_count INTEGER;
  response_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO engagement_count FROM discovery_engagements;
  SELECT COUNT(*) INTO response_count FROM destination_discovery WHERE responses IS NOT NULL;
  RAISE NOTICE 'Migration complete: % discovery engagements, % responses normalized', engagement_count, response_count;
END;
$$;

