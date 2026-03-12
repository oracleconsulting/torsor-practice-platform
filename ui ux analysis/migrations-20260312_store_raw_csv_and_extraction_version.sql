ALTER TABLE client_accounts_uploads
  ADD COLUMN IF NOT EXISTS raw_content TEXT DEFAULT NULL;

COMMENT ON COLUMN client_accounts_uploads.raw_content IS 'Raw CSV/text content for re-extraction when schema changes';

ALTER TABLE client_financial_data
  ADD COLUMN IF NOT EXISTS extraction_version INTEGER DEFAULT 1;

COMMENT ON COLUMN client_financial_data.extraction_version IS 'Schema version used for extraction. Increment when adding fields to trigger re-extraction.';
