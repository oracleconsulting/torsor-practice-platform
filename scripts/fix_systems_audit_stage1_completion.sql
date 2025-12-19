-- ============================================================================
-- FIX SYSTEMS AUDIT STAGE 1 COMPLETION
-- ============================================================================
-- This script will:
-- 1. Find Systems Audit service_line_assessments that are complete
-- 2. Create/update sa_engagements with stage_1_completed_at
-- 3. Sync responses to sa_discovery_responses if missing
-- ============================================================================

-- Step 1: Find clients with completed Systems Audit assessments
WITH completed_assessments AS (
    SELECT 
        sla.client_id,
        sla.practice_id,
        sla.responses,
        sla.completed_at,
        sla.created_at
    FROM service_line_assessments sla
    WHERE sla.service_line_code = 'systems_audit'
    AND sla.completion_percentage = 100
    AND sla.completed_at IS NOT NULL
)
-- Step 2: Create or update engagements
INSERT INTO sa_engagements (
    client_id,
    practice_id,
    status,
    stage_1_completed_at,
    created_at,
    updated_at
)
SELECT 
    ca.client_id,
    ca.practice_id,
    'stage_1_complete',
    ca.completed_at,
    COALESCE(ca.created_at, NOW()),
    NOW()
FROM completed_assessments ca
WHERE NOT EXISTS (
    SELECT 1 FROM sa_engagements sa 
    WHERE sa.client_id = ca.client_id
)
ON CONFLICT DO NOTHING;

-- Step 3: Update existing engagements that don't have stage_1_completed_at
UPDATE sa_engagements sa
SET 
    status = 'stage_1_complete',
    stage_1_completed_at = sla.completed_at,
    updated_at = NOW()
FROM service_line_assessments sla
WHERE sa.client_id = sla.client_id
AND sla.service_line_code = 'systems_audit'
AND sla.completion_percentage = 100
AND sla.completed_at IS NOT NULL
AND sa.stage_1_completed_at IS NULL;

-- Step 4: Sync discovery responses if missing
-- Note: This is a simplified sync - you may need to map the responses manually
INSERT INTO sa_discovery_responses (
    engagement_id,
    client_id,
    raw_responses,
    completed_at,
    created_at,
    updated_at
)
SELECT 
    sa.id as engagement_id,
    sa.client_id,
    sla.responses as raw_responses,
    sla.completed_at,
    sla.created_at,
    NOW()
FROM sa_engagements sa
JOIN service_line_assessments sla ON sa.client_id = sla.client_id
WHERE sla.service_line_code = 'systems_audit'
AND sla.completion_percentage = 100
AND NOT EXISTS (
    SELECT 1 FROM sa_discovery_responses sar 
    WHERE sar.engagement_id = sa.id
);

-- Verify the fix
SELECT 
    sa.id,
    sa.client_id,
    pm.email,
    sa.status,
    sa.stage_1_completed_at,
    CASE 
        WHEN sar.id IS NOT NULL THEN 'Has discovery responses'
        ELSE 'Missing discovery responses'
    END as discovery_status
FROM sa_engagements sa
JOIN practice_members pm ON sa.client_id = pm.id
LEFT JOIN sa_discovery_responses sar ON sar.engagement_id = sa.id
WHERE sa.stage_1_completed_at IS NOT NULL
ORDER BY sa.stage_1_completed_at DESC;

