-- ============================================================================
-- TEMP: Add Map 4 (Optimal Stack) for display when only 3 maps exist
-- ============================================================================
-- Run in Supabase SQL Editor before your meeting. Duplicates "Fully Connected"
-- as "Optimal Stack" so the client portal shows 4 map tabs.
-- Replace the engagement_id below if needed.
-- ============================================================================

UPDATE sa_audit_reports
SET pass1_data = jsonb_set(
  pass1_data,
  '{systemsMaps}',
  (COALESCE(pass1_data->'systemsMaps', '[]'::jsonb))
    || jsonb_build_array(
      (COALESCE(pass1_data->'systemsMaps'->2, '{}'::jsonb))
        || '{"title":"Optimal Stack","subtitle":"Best-in-class replacements","recommended":false}'::jsonb
    )
)
WHERE engagement_id = '80603cc0-1c4d-46ed-8041-04bdbbaffa70'
  AND jsonb_array_length(COALESCE(pass1_data->'systemsMaps', '[]'::jsonb)) = 3;
