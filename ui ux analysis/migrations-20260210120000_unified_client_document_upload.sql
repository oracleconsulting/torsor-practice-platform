-- Unified client document upload: one table for all financial document uploads
-- Discovery, Benchmarking, and any other flow use client_accounts_uploads.
-- One processor (process-accounts-upload) writes to client_financial_data.
-- Everything reads from client_financial_data (Pass 1, benchmarking, etc.).

-- Link uploads to discovery engagement when uploaded from Discovery report
ALTER TABLE client_accounts_uploads
  ADD COLUMN IF NOT EXISTS engagement_id UUID REFERENCES discovery_engagements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload';

COMMENT ON COLUMN client_accounts_uploads.engagement_id IS 'Set when uploaded from Discovery report; links to engagement for document list.';
COMMENT ON COLUMN client_accounts_uploads.source IS 'Origin: upload (benchmarking/default), discovery, manual.';

CREATE INDEX IF NOT EXISTS idx_client_accounts_uploads_engagement
  ON client_accounts_uploads(engagement_id)
  WHERE engagement_id IS NOT NULL;
