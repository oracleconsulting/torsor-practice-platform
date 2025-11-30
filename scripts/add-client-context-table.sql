-- ============================================================================
-- Add client_context table for practice platform
-- Run this in Supabase SQL editor
-- ============================================================================

-- Create client_context table for storing additional context
-- (transcripts, emails, notes, priorities)
CREATE TABLE IF NOT EXISTS client_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  context_type text NOT NULL CHECK (context_type IN ('transcript', 'email', 'note', 'priority')),
  content text NOT NULL,
  source_file_url text,
  added_by uuid REFERENCES practice_members(id),
  priority_level text DEFAULT 'normal' CHECK (priority_level IN ('normal', 'high', 'critical')),
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_context_client_id ON client_context(client_id);
CREATE INDEX IF NOT EXISTS idx_client_context_practice_id ON client_context(practice_id);
CREATE INDEX IF NOT EXISTS idx_client_context_type ON client_context(context_type);
CREATE INDEX IF NOT EXISTS idx_client_context_processed ON client_context(processed);

-- Enable RLS
ALTER TABLE client_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Team members can see all context in their practice
CREATE POLICY "Team can view practice context" ON client_context
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Team members can insert context in their practice
CREATE POLICY "Team can insert practice context" ON client_context
  FOR INSERT WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Team members can update context in their practice
CREATE POLICY "Team can update practice context" ON client_context
  FOR UPDATE USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Team members can delete context in their practice
CREATE POLICY "Team can delete practice context" ON client_context
  FOR DELETE USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_client_context_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_client_context_updated_at ON client_context;
CREATE TRIGGER update_client_context_updated_at
  BEFORE UPDATE ON client_context
  FOR EACH ROW
  EXECUTE FUNCTION update_client_context_updated_at();

-- ============================================================================
-- Also add version column to client_roadmaps for re-processing
-- ============================================================================
ALTER TABLE client_roadmaps 
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS context_snapshot jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN client_roadmaps.version IS 'Incremented each time roadmap is regenerated';
COMMENT ON COLUMN client_roadmaps.context_snapshot IS 'Snapshot of client_context at time of generation';

-- Add helper function to get unprocessed context for a client
CREATE OR REPLACE FUNCTION get_unprocessed_context(p_client_id uuid)
RETURNS TABLE (
  id uuid,
  context_type text,
  content text,
  priority_level text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.context_type,
    cc.content,
    cc.priority_level,
    cc.created_at
  FROM client_context cc
  WHERE cc.client_id = p_client_id
    AND cc.processed = false
  ORDER BY 
    CASE cc.priority_level 
      WHEN 'critical' THEN 1 
      WHEN 'high' THEN 2 
      ELSE 3 
    END,
    cc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark context as processed
CREATE OR REPLACE FUNCTION mark_context_processed(p_context_ids uuid[])
RETURNS void AS $$
BEGIN
  UPDATE client_context
  SET processed = true, updated_at = now()
  WHERE id = ANY(p_context_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

