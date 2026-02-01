-- ============================================================================
-- SERVICE INTELLIGENCE SYSTEM - PHASE 1
-- Service Concepts Table (Emerging Ideas Pipeline)
-- ============================================================================
-- New service ideas discovered from client analysis
-- These are NOT yet approved - they're in the development pipeline
-- After review, they become official services

CREATE TABLE IF NOT EXISTS service_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Suggested identity
  suggested_name TEXT NOT NULL,
  suggested_category TEXT,
  
  -- Description
  description TEXT NOT NULL,
  problem_it_solves TEXT NOT NULL,
  suggested_deliverables JSONB DEFAULT '[]',
  suggested_pricing TEXT,
  suggested_duration TEXT,
  
  -- Origin - which client/engagement first surfaced this need
  first_identified_at TIMESTAMPTZ DEFAULT now(),
  first_client_id UUID,
  first_engagement_id UUID,
  
  -- Aggregation - updated as more clients need this
  times_identified INTEGER DEFAULT 1,
  client_ids UUID[] DEFAULT '{}',
  total_opportunity_value DECIMAL(12,2) DEFAULT 0,
  
  -- Analysis
  market_size_estimate TEXT,            -- 'niche', 'moderate', 'broad'
  development_complexity TEXT,          -- 'low', 'medium', 'high'
  skills_likely_required TEXT[] DEFAULT '{}',
  similar_existing_service_code TEXT,   -- If partially covered by existing
  gap_vs_existing TEXT,                 -- Why existing doesn't fully work
  
  -- Review workflow
  review_status TEXT DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected', 'merged'
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  development_priority TEXT,            -- 'immediate', 'short_term', 'medium_term', 'exploratory'
  
  -- If approved → becomes a service
  created_service_id UUID REFERENCES services(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_service_concepts_frequency ON service_concepts(times_identified DESC);
CREATE INDEX IF NOT EXISTS idx_service_concepts_status ON service_concepts(review_status);
CREATE INDEX IF NOT EXISTS idx_service_concepts_name ON service_concepts(suggested_name);
CREATE INDEX IF NOT EXISTS idx_service_concepts_value ON service_concepts(total_opportunity_value DESC);

-- Enable RLS
ALTER TABLE service_concepts ENABLE ROW LEVEL SECURITY;

-- Policies - allow read/write for authenticated users (admin operations)
CREATE POLICY "service_concepts_read" ON service_concepts FOR SELECT USING (true);
CREATE POLICY "service_concepts_insert" ON service_concepts FOR INSERT WITH CHECK (true);
CREATE POLICY "service_concepts_update" ON service_concepts FOR UPDATE USING (true);

