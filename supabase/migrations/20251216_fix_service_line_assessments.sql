-- ============================================================================
-- FIX SERVICE LINE ASSESSMENTS TABLE
-- ============================================================================
-- The table was missing columns needed by the client portal
-- Also fixes the unique constraint and RLS policies
-- ============================================================================

-- Add missing columns to service_line_assessments
ALTER TABLE service_line_assessments 
ADD COLUMN IF NOT EXISTS practice_id uuid REFERENCES practices(id) ON DELETE CASCADE;

ALTER TABLE service_line_assessments 
ADD COLUMN IF NOT EXISTS service_line_code text;

ALTER TABLE service_line_assessments 
ADD COLUMN IF NOT EXISTS completion_percentage int DEFAULT 0;

ALTER TABLE service_line_assessments 
ADD COLUMN IF NOT EXISTS extracted_insights jsonb;

ALTER TABLE service_line_assessments 
ADD COLUMN IF NOT EXISTS started_at timestamptz;

ALTER TABLE service_line_assessments 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create unique constraint on client_id + service_line_code for upsert
-- Drop existing constraint if any
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_line_assessments_client_code_unique'
  ) THEN
    ALTER TABLE service_line_assessments DROP CONSTRAINT service_line_assessments_client_code_unique;
  END IF;
END $$;

-- Add unique constraint for upsert
ALTER TABLE service_line_assessments 
ADD CONSTRAINT service_line_assessments_client_code_unique 
UNIQUE (client_id, service_line_code);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_line_assessments_client 
ON service_line_assessments(client_id);

CREATE INDEX IF NOT EXISTS idx_service_line_assessments_code 
ON service_line_assessments(service_line_code);

CREATE INDEX IF NOT EXISTS idx_service_line_assessments_practice 
ON service_line_assessments(practice_id);

-- ============================================================================
-- FIX RLS POLICIES
-- ============================================================================

-- Enable RLS if not already
ALTER TABLE service_line_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Clients see own service assessments" ON service_line_assessments;
DROP POLICY IF EXISTS "Team sees service assessments" ON service_line_assessments;
DROP POLICY IF EXISTS "Clients manage own service assessments" ON service_line_assessments;

-- Create policies that allow clients to INSERT, UPDATE, SELECT their own assessments
CREATE POLICY "Clients manage own service assessments" ON service_line_assessments
  FOR ALL USING (
    client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

-- Allow team members to view all assessments for their practice
CREATE POLICY "Team sees service assessments" ON service_line_assessments
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- ============================================================================
-- FIX CLIENT_ROADMAPS RLS
-- ============================================================================

-- Drop and recreate client_roadmaps policies
DROP POLICY IF EXISTS "Client sees own roadmap" ON client_roadmaps;
DROP POLICY IF EXISTS "Client roadmap direct access" ON client_roadmaps;
DROP POLICY IF EXISTS "Team sees roadmaps" ON client_roadmaps;

-- Clients can see their own roadmaps
CREATE POLICY "Client sees own roadmap" ON client_roadmaps
  FOR SELECT USING (
    client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

-- Team can manage all roadmaps for their practice
CREATE POLICY "Team manages roadmaps" ON client_roadmaps
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Add status column if missing (needed for published/pending workflow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'client_roadmaps' AND column_name = 'status'
  ) THEN
    ALTER TABLE client_roadmaps ADD COLUMN status text DEFAULT 'pending_review';
  END IF;
END $$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON service_line_assessments TO authenticated;
GRANT SELECT ON client_roadmaps TO authenticated;

-- Migration complete: service_line_assessments and client_roadmaps fixed

