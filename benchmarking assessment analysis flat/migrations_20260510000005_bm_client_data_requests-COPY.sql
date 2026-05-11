-- Client data request tracking for gap-fill loop
BEGIN;

ALTER TABLE bm_reports
  ADD COLUMN IF NOT EXISTS pre_revenue_data_gaps JSONB;

CREATE TABLE IF NOT EXISTS bm_client_data_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID NOT NULL REFERENCES bm_engagements(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  source_table TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','answered','skipped')),
  client_response JSONB,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (engagement_id, field)
);

ALTER TABLE bm_client_data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice manages bm_client_data_requests" ON bm_client_data_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_client_data_requests.engagement_id
        AND pm.id = auth.uid()
        AND pm.role IN ('admin', 'consultant')
    )
  );

CREATE POLICY "Client can view and answer own bm_client_data_requests" ON bm_client_data_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      WHERE bme.id = bm_client_data_requests.engagement_id
        AND bme.client_id = auth.uid()
    )
  );

COMMIT;
