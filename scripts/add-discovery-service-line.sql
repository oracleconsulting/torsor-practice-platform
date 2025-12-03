-- ============================================================================
-- ADD DISCOVERY SERVICE LINE
-- ============================================================================
-- For clients who sign up directly via the public signup link
-- ============================================================================

-- Add Discovery service line
INSERT INTO service_lines (code, name, short_description, display_order, is_active)
VALUES (
  'discovery',
  'Discovery',
  'Initial client discovery and assessment',
  0,
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description;

-- Add program_status column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'practice_members' AND column_name = 'program_status'
  ) THEN
    ALTER TABLE practice_members ADD COLUMN program_status text DEFAULT 'active';
  END IF;
END $$;

-- Add discovery_recommendations column to client_service_lines
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'client_service_lines' AND column_name = 'discovery_recommendations'
  ) THEN
    ALTER TABLE client_service_lines ADD COLUMN discovery_recommendations jsonb;
  END IF;
END $$;

-- Add discovery_completed_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'client_service_lines' AND column_name = 'discovery_completed_at'
  ) THEN
    ALTER TABLE client_service_lines ADD COLUMN discovery_completed_at timestamptz;
  END IF;
END $$;

-- Create index for faster discovery client lookups
CREATE INDEX IF NOT EXISTS idx_members_program_status ON practice_members(program_status);

-- View for discovery clients with recommendations
CREATE OR REPLACE VIEW v_discovery_clients AS
SELECT 
  pm.id,
  pm.name,
  pm.email,
  pm.program_status,
  pm.practice_id,
  pm.created_at,
  csl.discovery_recommendations,
  csl.discovery_completed_at,
  CASE 
    WHEN pm.program_status = 'discovery_complete' THEN 'Review Pending'
    WHEN pm.program_status = 'discovery' THEN 'Assessment In Progress'
    ELSE 'Not Started'
  END as discovery_status
FROM practice_members pm
LEFT JOIN client_service_lines csl ON csl.client_id = pm.id
LEFT JOIN service_lines sl ON sl.id = csl.service_line_id AND sl.code = 'discovery'
WHERE pm.member_type = 'client'
  AND (pm.program_status IN ('discovery', 'discovery_complete') OR sl.code = 'discovery');

