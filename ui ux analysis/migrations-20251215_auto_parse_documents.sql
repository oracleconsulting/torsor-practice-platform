-- ============================================================================
-- AUTO-PARSE DOCUMENTS PIPELINE
-- ============================================================================
-- Ensures financial data is automatically extracted when documents are uploaded
-- ============================================================================

-- 1. Add parsing status columns to client_context
ALTER TABLE client_context 
ADD COLUMN IF NOT EXISTS parsing_status TEXT DEFAULT 'pending' 
  CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed', 'manual_required'));

ALTER TABLE client_context 
ADD COLUMN IF NOT EXISTS parsing_error TEXT;

ALTER TABLE client_context 
ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE client_context 
ADD COLUMN IF NOT EXISTS financial_data_quality TEXT DEFAULT 'unknown'
  CHECK (financial_data_quality IN ('unknown', 'none', 'partial', 'complete', 'verified'));

-- 2. Create a queue table for document parsing jobs
CREATE TABLE IF NOT EXISTS document_parse_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_context_id UUID REFERENCES client_context(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  practice_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(client_context_id, status) -- Prevent duplicate pending entries
);

CREATE INDEX IF NOT EXISTS idx_parse_queue_status ON document_parse_queue(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_parse_queue_client ON document_parse_queue(client_id);

-- 3. Function to queue document for parsing when inserted
CREATE OR REPLACE FUNCTION queue_document_for_parsing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue documents that have file attachments (source_file_url)
  IF NEW.source_file_url IS NOT NULL AND NEW.source_file_url != '[]' AND NEW.source_file_url != '' THEN
    -- Check if this looks like it has PDF files
    IF NEW.source_file_url::text LIKE '%application/pdf%' THEN
      -- Set status to pending
      NEW.parsing_status := 'pending';
      NEW.financial_data_quality := 'unknown';
      
      -- Queue for parsing (with conflict handling)
      INSERT INTO document_parse_queue (
        client_context_id,
        client_id,
        practice_id,
        status,
        priority
      ) VALUES (
        NEW.id,
        NEW.client_id,
        NEW.practice_id,
        'pending',
        CASE 
          WHEN NEW.context_type = 'document' AND NEW.priority_level = 'high' THEN 10
          WHEN NEW.applies_to::text LIKE '%valueAnalysis%' THEN 8
          ELSE 5
        END
      )
      ON CONFLICT (client_context_id, status) DO NOTHING;
      
      RAISE NOTICE 'Queued document % for parsing', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on client_context
DROP TRIGGER IF EXISTS trigger_queue_document_parsing ON client_context;
CREATE TRIGGER trigger_queue_document_parsing
  BEFORE INSERT OR UPDATE OF source_file_url
  ON client_context
  FOR EACH ROW
  EXECUTE FUNCTION queue_document_for_parsing();

-- 5. Function to call edge function for parsing (called by pg_cron or manually)
-- Note: This requires pg_net extension for HTTP calls
CREATE OR REPLACE FUNCTION process_document_parse_queue()
RETURNS INTEGER AS $$
DECLARE
  processed_count INTEGER := 0;
  queue_item RECORD;
  edge_function_url TEXT;
BEGIN
  -- Get Supabase URL from environment (set this in your Supabase project settings)
  edge_function_url := current_setting('app.supabase_url', true) || '/functions/v1/parse-document';
  
  -- Process up to 5 pending items
  FOR queue_item IN 
    SELECT dq.*, cc.client_id
    FROM document_parse_queue dq
    JOIN client_context cc ON cc.id = dq.client_context_id
    WHERE dq.status = 'pending'
    AND dq.attempts < dq.max_attempts
    ORDER BY dq.priority DESC, dq.created_at
    LIMIT 5
  LOOP
    -- Mark as processing
    UPDATE document_parse_queue 
    SET status = 'processing', 
        started_at = NOW(),
        attempts = attempts + 1
    WHERE id = queue_item.id;
    
    -- The actual HTTP call would be done by pg_net or an external scheduler
    -- For now, just log that it needs processing
    RAISE NOTICE 'Document % ready for parsing (client: %)', queue_item.client_context_id, queue_item.client_id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Helper function to mark parsing complete
CREATE OR REPLACE FUNCTION mark_document_parsed(
  p_client_context_id UUID,
  p_extracted_metrics JSONB,
  p_extracted_content TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update client_context with extracted data
  UPDATE client_context SET
    extracted_metrics = COALESCE(p_extracted_metrics, extracted_metrics),
    content = COALESCE(p_extracted_content, content),
    parsing_status = 'completed',
    parsed_at = NOW(),
    financial_data_quality = CASE
      WHEN p_extracted_metrics ? 'turnover' AND p_extracted_metrics ? 'turnover_2024' THEN 'complete'
      WHEN p_extracted_metrics ? 'turnover' THEN 'partial'
      ELSE 'none'
    END,
    updated_at = NOW()
  WHERE id = p_client_context_id;
  
  -- Update queue
  UPDATE document_parse_queue SET
    status = 'completed',
    completed_at = NOW()
  WHERE client_context_id = p_client_context_id
  AND status IN ('pending', 'processing');
END;
$$ LANGUAGE plpgsql;

-- 7. Helper function to mark parsing failed
CREATE OR REPLACE FUNCTION mark_document_parse_failed(
  p_client_context_id UUID,
  p_error TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update client_context
  UPDATE client_context SET
    parsing_status = CASE 
      WHEN parsing_status = 'failed' THEN 'manual_required'
      ELSE 'failed'
    END,
    parsing_error = p_error,
    updated_at = NOW()
  WHERE id = p_client_context_id;
  
  -- Update queue
  UPDATE document_parse_queue SET
    status = 'failed',
    last_error = p_error,
    completed_at = NOW()
  WHERE client_context_id = p_client_context_id
  AND status IN ('pending', 'processing');
END;
$$ LANGUAGE plpgsql;

-- 8. View for monitoring document parsing status
CREATE OR REPLACE VIEW v_document_parsing_status AS
SELECT 
  cc.id,
  cc.client_id,
  COALESCE(pm.name, pm.email) as client_name,
  cc.context_type,
  cc.parsing_status,
  cc.financial_data_quality,
  cc.parsed_at,
  cc.parsing_error,
  CASE 
    WHEN cc.extracted_metrics ? 'turnover' THEN (cc.extracted_metrics->>'turnover')::numeric
    ELSE NULL
  END as extracted_turnover,
  CASE 
    WHEN cc.extracted_metrics ? 'turnover_2024' THEN (cc.extracted_metrics->>'turnover_2024')::numeric
    ELSE NULL
  END as prior_year_turnover,
  CASE 
    WHEN cc.extracted_metrics ? 'turnover' AND cc.extracted_metrics ? 'turnover_2024' THEN
      ROUND(
        ((cc.extracted_metrics->>'turnover')::numeric - (cc.extracted_metrics->>'turnover_2024')::numeric) 
        / (cc.extracted_metrics->>'turnover_2024')::numeric * 100,
        1
      )
    ELSE NULL
  END as yoy_growth_pct,
  cc.created_at,
  cc.updated_at
FROM client_context cc
LEFT JOIN practice_members pm ON pm.id = cc.client_id
WHERE cc.context_type = 'document'
ORDER BY cc.created_at DESC;

-- 9. Queue any existing documents that need parsing
INSERT INTO document_parse_queue (client_context_id, client_id, practice_id, status, priority)
SELECT 
  cc.id,
  cc.client_id,
  cc.practice_id,
  'pending',
  8
FROM client_context cc
WHERE cc.source_file_url IS NOT NULL 
AND cc.source_file_url::text LIKE '%application/pdf%'
AND (cc.extracted_metrics IS NULL OR cc.extracted_metrics = '{}'::jsonb)
AND NOT EXISTS (
  SELECT 1 FROM document_parse_queue dq 
  WHERE dq.client_context_id = cc.id 
  AND dq.status IN ('pending', 'processing')
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE document_parse_queue IS 'Queue for documents awaiting PDF parsing and financial data extraction';
COMMENT ON VIEW v_document_parsing_status IS 'View showing document parsing status and extracted financial data';



