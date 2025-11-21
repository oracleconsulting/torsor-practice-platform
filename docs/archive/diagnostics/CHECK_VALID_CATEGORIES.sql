-- Find the valid_category constraint definition
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'ai_prompts'::regclass
  AND conname = 'valid_category';

-- Also check if there are any existing prompts to see what categories are used
SELECT DISTINCT prompt_category
FROM ai_prompts
ORDER BY prompt_category;

