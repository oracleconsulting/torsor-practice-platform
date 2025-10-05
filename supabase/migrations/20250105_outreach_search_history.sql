-- Create outreach_search_history table for saving and recalling searches
CREATE TABLE IF NOT EXISTS outreach_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  search_type TEXT NOT NULL CHECK (search_type IN ('address_match', 'date_range', 'date_comparison')),
  address TEXT,
  date_range JSONB,
  date_ranges JSONB,
  results_count INTEGER DEFAULT 0,
  filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_search_history_practice ON outreach_search_history(practice_id);
CREATE INDEX idx_search_history_created ON outreach_search_history(created_at DESC);
CREATE INDEX idx_search_history_type ON outreach_search_history(search_type);

-- Enable Row Level Security
ALTER TABLE outreach_search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own practice's search history
CREATE POLICY "Users can view their practice's search history"
  ON outreach_search_history
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM user_practice_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their practice's search history"
  ON outreach_search_history
  FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM user_practice_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their practice's search history"
  ON outreach_search_history
  FOR DELETE
  USING (
    practice_id IN (
      SELECT practice_id FROM user_practice_access
      WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_search_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_history_timestamp
  BEFORE UPDATE ON outreach_search_history
  FOR EACH ROW
  EXECUTE FUNCTION update_search_history_timestamp();

-- Add a view for easy access
CREATE OR REPLACE VIEW outreach_search_history_view AS
SELECT 
  sh.*,
  p.name as practice_name
FROM outreach_search_history sh
LEFT JOIN practices p ON sh.practice_id = p.id;

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON outreach_search_history TO authenticated;
GRANT SELECT ON outreach_search_history_view TO authenticated;

