-- ============================================================================
-- Knowledge Base and AI Corrections System
-- Run this in Supabase SQL editor
-- ============================================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- KNOWLEDGE BASE - Store Torsor methodology and best practices
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Content categorization
  category text NOT NULL CHECK (category IN (
    'methodology',    -- How Torsor does things
    'example',        -- Good examples to reference
    'objection',      -- How to handle common objections
    'correction',     -- AI corrections (what NOT to do)
    'template',       -- Reusable templates
    'industry_insight' -- Industry-specific knowledge
  )),
  
  -- Content
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  industry text,  -- If industry-specific
  
  -- Vector embedding for semantic search
  embedding vector(1536),  -- OpenAI ada-002 dimension
  
  -- Metadata
  approved_by uuid REFERENCES practice_members(id),
  usage_count integer DEFAULT 0,
  effectiveness_score numeric(3,2),  -- 0.00 to 1.00
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Full text search index
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED
);

-- Indexes for knowledge base
CREATE INDEX IF NOT EXISTS idx_knowledge_base_practice ON knowledge_base(practice_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search ON knowledge_base USING GIN(search_vector);

-- Vector similarity search index (only create if you have many rows)
-- CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- AI CORRECTIONS - Capture when advisors correct AI suggestions
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  
  -- What was corrected
  source_type text NOT NULL CHECK (source_type IN (
    'roadmap_task',      -- Task in sprint
    'roadmap_vision',    -- Vision content
    'roadmap_shift',     -- Shift content
    'chat_response',     -- AI chat response
    'recommendation'     -- Board/other recommendation
  )),
  source_id uuid,  -- Reference to original item
  
  -- The correction
  original_output text NOT NULL,
  corrected_output text NOT NULL,
  correction_reason text,
  
  -- Categorization
  correction_type text NOT NULL CHECK (correction_type IN (
    'tone',           -- Wrong tone/voice
    'methodology',    -- Not how Torsor does it
    'inaccurate',     -- Factually wrong
    'incomplete',     -- Missing important context
    'inappropriate',  -- Not appropriate for situation
    'too_generic'     -- Not specific enough
  )),
  
  -- Application scope
  apply_globally boolean DEFAULT false,  -- Apply to all clients?
  industry text,  -- If industry-specific
  revenue_stage text,  -- If stage-specific
  
  -- For RAG integration
  embedding vector(1536),
  
  -- Who made the correction
  corrected_by uuid REFERENCES practice_members(id),
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Indexes for corrections
CREATE INDEX IF NOT EXISTS idx_ai_corrections_practice ON ai_corrections(practice_id);
CREATE INDEX IF NOT EXISTS idx_ai_corrections_type ON ai_corrections(correction_type);
CREATE INDEX IF NOT EXISTS idx_ai_corrections_global ON ai_corrections(apply_globally) WHERE apply_globally = true;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_corrections ENABLE ROW LEVEL SECURITY;

-- Knowledge base: Team can read/write
CREATE POLICY "Team can view knowledge base" ON knowledge_base
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

CREATE POLICY "Team can insert knowledge" ON knowledge_base
  FOR INSERT WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

CREATE POLICY "Team can update knowledge" ON knowledge_base
  FOR UPDATE USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- AI Corrections: Team can read/write
CREATE POLICY "Team can view corrections" ON ai_corrections
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

CREATE POLICY "Team can insert corrections" ON ai_corrections
  FOR INSERT WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Search knowledge base by text (full-text search)
CREATE OR REPLACE FUNCTION search_knowledge(
  p_practice_id uuid,
  p_query text,
  p_category text DEFAULT NULL,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  relevance real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    ts_rank(kb.search_vector, plainto_tsquery('english', p_query)) as relevance
  FROM knowledge_base kb
  WHERE kb.practice_id = p_practice_id
    AND (p_category IS NULL OR kb.category = p_category)
    AND kb.search_vector @@ plainto_tsquery('english', p_query)
  ORDER BY relevance DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get relevant corrections before generation (for RAG)
CREATE OR REPLACE FUNCTION get_relevant_corrections(
  p_practice_id uuid,
  p_industry text DEFAULT NULL,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  source_type text,
  original_output text,
  corrected_output text,
  correction_type text,
  correction_reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.source_type,
    ac.original_output,
    ac.corrected_output,
    ac.correction_type,
    ac.correction_reason
  FROM ai_corrections ac
  WHERE (ac.practice_id = p_practice_id OR ac.apply_globally = true)
    AND (p_industry IS NULL OR ac.industry IS NULL OR ac.industry = p_industry)
  ORDER BY ac.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment knowledge usage count
CREATE OR REPLACE FUNCTION increment_knowledge_usage(p_knowledge_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE knowledge_base
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE id = p_knowledge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL SEED DATA - Torsor Methodology
-- ============================================================================

-- Note: Run this after creating the practice if needed
-- Replace 'YOUR_PRACTICE_ID' with actual practice UUID

-- INSERT INTO knowledge_base (practice_id, category, title, content, tags) VALUES
-- ('YOUR_PRACTICE_ID', 'methodology', 'The 365 Method Core Philosophy', 
--  'The 365 Method is about life-first transformation, not just business growth. We believe that working fewer hours with slightly less income often creates far more happiness than grinding endless hours for marginally more money. Every business decision should be evaluated against its impact on life quality, not just revenue.',
--  ARRAY['365-method', 'philosophy', 'core']),
--  
-- ('YOUR_PRACTICE_ID', 'methodology', 'Tuesday Test', 
--  'The Tuesday Test asks clients to describe their ideal Tuesday in 90 days. This reveals what they truly want from their business - often freedom, control, and quality time rather than pure income. Always reference their specific Tuesday test language in roadmaps.',
--  ARRAY['tuesday-test', 'assessment', 'core']),
--
-- ('YOUR_PRACTICE_ID', 'methodology', 'Relationship Mirror', 
--  'The Relationship Mirror question reveals how clients truly feel about their business. Answers like "abusive relationship", "demanding child", or "needy partner" expose emotional patterns that must be addressed. Use their exact metaphors in the roadmap.',
--  ARRAY['relationship-mirror', 'emotional', 'core']);

