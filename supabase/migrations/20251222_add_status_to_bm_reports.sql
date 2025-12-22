-- Add status field to bm_reports to track generation progress
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pass1_complete' 
CHECK (status IN ('pass1_complete', 'pass2_complete', 'generated', 'approved', 'published', 'pass1_failed', 'pass2_failed'));

-- Update existing reports to have appropriate status
UPDATE bm_reports 
SET status = CASE 
  WHEN headline IS NOT NULL AND executive_summary IS NOT NULL THEN 'generated'
  WHEN pass1_data IS NOT NULL THEN 'pass1_complete'
  ELSE 'pass1_complete'
END
WHERE status IS NULL;

