-- Check what AI prompts are configured
SELECT 
  prompt_key,
  model_name,
  LEFT(system_prompt, 100) as system_prompt_preview,
  LEFT(user_prompt_template, 100) as user_prompt_preview,
  is_active
FROM ai_prompts
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
AND prompt_key IN ('gap_analysis', 'team_composition_analysis')
ORDER BY prompt_key;
