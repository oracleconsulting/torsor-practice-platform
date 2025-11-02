-- Add content_type and duration_minutes to knowledge_documents for better categorization

-- Add content_type column (article, webinar, video, podcast, case_study)
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) CHECK (content_type IN ('article', 'webinar', 'video', 'podcast', 'case_study', 'other'));

-- Add duration_minutes column (estimated time to complete)
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Add index for content_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_content_type ON knowledge_documents(content_type);

-- Add index for duration for filtering by time available
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_duration ON knowledge_documents(duration_minutes);

COMMENT ON COLUMN knowledge_documents.content_type IS 'Type of content: article, webinar, video, podcast, case_study, or other';
COMMENT ON COLUMN knowledge_documents.duration_minutes IS 'Estimated time in minutes to complete/consume the resource';

