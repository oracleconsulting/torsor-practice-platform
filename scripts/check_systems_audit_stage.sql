-- ============================================================================
-- CHECK SYSTEMS AUDIT STAGE COMPLETION STATUS
-- ============================================================================
-- Run this to see the current state of Systems Audit engagements
-- ============================================================================

-- Check engagement status
SELECT 
    sa.id as engagement_id,
    sa.client_id,
    pm.email as client_email,
    pm.name as client_name,
    sa.status,
    sa.stage_1_completed_at,
    sa.stage_2_completed_at,
    sa.stage_3_completed_at,
    sa.created_at,
    sa.updated_at
FROM sa_engagements sa
JOIN practice_members pm ON sa.client_id = pm.id
ORDER BY sa.created_at DESC;

-- Check if discovery responses exist
SELECT 
    sar.id,
    sar.engagement_id,
    sar.client_id,
    sar.completed_at,
    sar.created_at,
    CASE 
        WHEN sar.systems_breaking_point IS NOT NULL THEN 'Has breaking point'
        ELSE 'Missing breaking point'
    END as has_breaking_point,
    CASE 
        WHEN sar.raw_responses IS NOT NULL THEN 'Has raw responses'
        ELSE 'No raw responses'
    END as has_raw_responses
FROM sa_discovery_responses sar
ORDER BY sar.created_at DESC;

-- Check service_line_assessments for Systems Audit
SELECT 
    sla.id,
    sla.client_id,
    sla.service_line_code,
    sla.completion_percentage,
    sla.completed_at,
    sla.created_at
FROM service_line_assessments sla
WHERE sla.service_line_code = 'systems_audit'
ORDER BY sla.created_at DESC;

