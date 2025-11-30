-- ============================================================================
-- ADD SHARED DOCUMENTS SUPPORT
-- ============================================================================
-- Enables documents to be marked as shared between multiple clients
-- with client-specific context extraction
-- ============================================================================

-- Add shared document fields to client_context
ALTER TABLE client_context 
  ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_with_clients uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_client_id uuid,
  ADD COLUMN IF NOT EXISTS extracted_for_client jsonb DEFAULT '{}';

-- Add data source priority to track where information comes from
ALTER TABLE client_context 
  ADD COLUMN IF NOT EXISTS data_source_type text DEFAULT 'general';
  -- Values: 'accounts', 'transcript', 'meeting_notes', 'email', 'general'

-- Add priority ranking (accounts should override transcripts for numbers)
ALTER TABLE client_context 
  ADD COLUMN IF NOT EXISTS priority_level integer DEFAULT 50;
  -- 100 = highest (official accounts), 50 = normal, 10 = supplementary

-- Create client-specific extractions table
CREATE TABLE IF NOT EXISTS client_document_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_context_id uuid REFERENCES client_context(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  practice_id uuid,
  extracted_content text,
  extracted_financials jsonb DEFAULT '{}',
  extracted_insights jsonb DEFAULT '{}',
  relevance_score float DEFAULT 0.0,
  entity_mentions integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_extractions_client ON client_document_extractions(client_id);
CREATE INDEX IF NOT EXISTS idx_extractions_source ON client_document_extractions(source_context_id);

-- RLS for client_document_extractions
ALTER TABLE client_document_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage extractions" ON client_document_extractions
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

CREATE POLICY "Clients can view their extractions" ON client_document_extractions
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'client'
    )
  );

-- Update existing context entries with default priority
UPDATE client_context 
SET data_source_type = 'accounts', priority_level = 100
WHERE content ILIKE '%turnover%' OR content ILIKE '%revenue%' OR content ILIKE '%profit%';

UPDATE client_context 
SET data_source_type = 'transcript', priority_level = 30
WHERE content ILIKE '%transcript%' OR content ILIKE '%meeting%' OR content ILIKE '%recording%';

COMMENT ON TABLE client_document_extractions IS 'Stores client-specific extractions from shared documents';

