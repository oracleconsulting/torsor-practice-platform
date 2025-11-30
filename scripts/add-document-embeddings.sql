-- ============================================================================
-- Document Embeddings Table for Vector Search
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  context_id uuid REFERENCES client_context(id) ON DELETE CASCADE,
  
  -- Document info
  file_name text NOT NULL,
  file_url text,
  chunk_index integer NOT NULL DEFAULT 0,
  total_chunks integer NOT NULL DEFAULT 1,
  
  -- Content and embedding
  content text NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  
  -- Roadmap relevance
  applies_to text[] DEFAULT ARRAY['sprint'],
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_client ON document_embeddings(client_id);
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_practice ON document_embeddings(practice_id);
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_context ON document_embeddings(context_id);
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_applies_to ON document_embeddings USING GIN(applies_to);

-- Vector similarity search index (IVFFlat for faster approximate search)
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_vector ON document_embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Enable RLS
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Team members can view embeddings in their practice
CREATE POLICY "Team can view practice embeddings" ON document_embeddings
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Team members can insert embeddings in their practice
CREATE POLICY "Team can insert practice embeddings" ON document_embeddings
  FOR INSERT WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Clients can view their own embeddings
CREATE POLICY "Clients can view own embeddings" ON document_embeddings
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- Service role can do anything (for Edge Functions)
CREATE POLICY "Service role full access" ON document_embeddings
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- VECTOR SEARCH FUNCTION
-- ============================================================================

-- Function to search for relevant document chunks
CREATE OR REPLACE FUNCTION search_document_chunks(
  p_client_id uuid,
  p_query_embedding vector(1536),
  p_applies_to text[] DEFAULT ARRAY['sprint'],
  p_limit integer DEFAULT 10,
  p_similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  file_name text,
  content text,
  similarity float,
  chunk_index integer,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.file_name,
    de.content,
    1 - (de.embedding <=> p_query_embedding) as similarity,
    de.chunk_index,
    de.metadata
  FROM document_embeddings de
  WHERE de.client_id = p_client_id
    AND de.applies_to && p_applies_to  -- Array overlap
    AND 1 - (de.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY de.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- HELPER: Get all document context for a client
-- ============================================================================

CREATE OR REPLACE FUNCTION get_client_document_context(
  p_client_id uuid,
  p_applies_to text[] DEFAULT ARRAY['sprint']
)
RETURNS TABLE (
  file_name text,
  total_chunks integer,
  combined_content text,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.file_name,
    MAX(de.total_chunks)::integer as total_chunks,
    STRING_AGG(de.content, '\n\n' ORDER BY de.chunk_index) as combined_content,
    MIN(de.created_at) as created_at
  FROM document_embeddings de
  WHERE de.client_id = p_client_id
    AND de.applies_to && p_applies_to
  GROUP BY de.file_name
  ORDER BY MIN(de.created_at) DESC;
END;
$$;

-- ============================================================================
-- Update client_context table to support metadata
-- ============================================================================

ALTER TABLE client_context ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- ============================================================================
-- VERIFY SETUP
-- ============================================================================

SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('document_embeddings', 'client_context');

SELECT 'Vector extension:' as info;
SELECT * FROM pg_extension WHERE extname = 'vector';

SELECT 'Functions created:' as info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('search_document_chunks', 'get_client_document_context');

