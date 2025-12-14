-- ============================================================================
-- STAGED ROADMAP ARCHITECTURE
-- ============================================================================
-- Migration: 20251216_staged_roadmap_architecture.sql
-- Purpose: Enable staged generation with review gates and learning loops
-- ============================================================================

-- 1. GENERATION STATUS TRACKING
-- ============================================================================

-- Status enum for each component
DO $$ BEGIN
  CREATE TYPE generation_status AS ENUM (
    'not_started',
    'generating',
    'generated',      -- LLM complete, awaiting review
    'pending_review', -- Flagged for team attention
    'approved',       -- Team approved, not yet visible to client
    'published',      -- Client can see
    'rejected'        -- Needs regeneration
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Track each stage independently
CREATE TABLE IF NOT EXISTS roadmap_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id),
  client_id UUID NOT NULL REFERENCES practice_members(id),
  
  -- Stage identification
  stage_type TEXT NOT NULL, -- 'fit_assessment' | 'five_year_vision' | 'six_month_shift' | 'sprint_plan' | 'value_analysis'
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Content
  generated_content JSONB,
  approved_content JSONB,  -- After edits, this is what gets published
  
  -- Status tracking
  status generation_status NOT NULL DEFAULT 'not_started',
  
  -- Generation metadata
  model_used TEXT,
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  generation_duration_ms INTEGER,
  tokens_used INTEGER,
  
  -- Review metadata
  reviewed_by UUID REFERENCES practice_members(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Publishing
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES practice_members(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(client_id, stage_type, version)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_roadmap_stages_client ON roadmap_stages(client_id, stage_type);
CREATE INDEX IF NOT EXISTS idx_roadmap_stages_status ON roadmap_stages(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_stages_practice ON roadmap_stages(practice_id, status);

-- 2. LEARNING DATABASE
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE edit_type AS ENUM (
    'factual_correction',   -- Wrong information (e.g., "SEO" for referral business)
    'tone_adjustment',      -- Too formal, too casual, wrong voice
    'removal',              -- Removed irrelevant content
    'addition',             -- Added missing content
    'rewrite',              -- Significant restructure
    'refinement'            -- Minor polish
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE feedback_source AS ENUM (
    'practice_edit',        -- Team edited before publishing
    'client_task_feedback', -- Client feedback on completed task
    'client_general'        -- General client feedback
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS generation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id),
  client_id UUID REFERENCES practice_members(id),
  
  -- Source
  feedback_source feedback_source NOT NULL,
  
  -- What was edited/flagged
  stage_type TEXT,                    -- 'vision' | 'shift' | 'sprint' | 'task'
  stage_id UUID REFERENCES roadmap_stages(id),
  task_id UUID REFERENCES client_tasks(id),  -- If task-level feedback
  
  -- The content
  original_content JSONB,
  edited_content JSONB,               -- NULL for client feedback
  edit_type edit_type,                -- NULL for client feedback
  
  -- Feedback text
  feedback_text TEXT,                 -- Why they changed it / what went wrong
  what_went_well TEXT,                -- For client task feedback
  what_didnt_work TEXT,               -- For client task feedback
  
  -- Classification (for pattern detection)
  client_industry TEXT,
  client_revenue_stage TEXT,
  client_business_type TEXT,
  
  -- Pattern flagging
  is_pattern BOOLEAN DEFAULT FALSE,           -- Practice flagged as recurring issue
  pattern_notes TEXT,
  incorporated_into_prompts BOOLEAN DEFAULT FALSE,
  incorporated_at TIMESTAMPTZ,
  
  -- Meta
  submitted_by UUID REFERENCES practice_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for pattern analysis
CREATE INDEX IF NOT EXISTS idx_feedback_source ON generation_feedback(feedback_source);
CREATE INDEX IF NOT EXISTS idx_feedback_stage ON generation_feedback(stage_type);
CREATE INDEX IF NOT EXISTS idx_feedback_edit_type ON generation_feedback(edit_type);
CREATE INDEX IF NOT EXISTS idx_feedback_industry ON generation_feedback(client_industry);
CREATE INDEX IF NOT EXISTS idx_feedback_is_pattern ON generation_feedback(is_pattern) WHERE is_pattern = TRUE;
CREATE INDEX IF NOT EXISTS idx_feedback_incorporated ON generation_feedback(incorporated_into_prompts) WHERE incorporated_into_prompts = FALSE;

-- 3. TASK COMPLETION TRACKING (Enhanced)
-- ============================================================================

-- Add feedback columns to existing client_tasks table
DO $$ BEGIN
  ALTER TABLE client_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
  ALTER TABLE client_tasks ADD COLUMN IF NOT EXISTS completion_feedback JSONB;
  ALTER TABLE client_tasks ADD COLUMN IF NOT EXISTS feedback_reviewed BOOLEAN DEFAULT FALSE;
  ALTER TABLE client_tasks ADD COLUMN IF NOT EXISTS feedback_reviewed_by UUID REFERENCES practice_members(id);
  ALTER TABLE client_tasks ADD COLUMN IF NOT EXISTS feedback_flagged_as_pattern BOOLEAN DEFAULT FALSE;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 4. GENERATION QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id),
  client_id UUID NOT NULL REFERENCES practice_members(id),
  
  stage_type TEXT NOT NULL,
  priority INTEGER DEFAULT 0,  -- Higher = more urgent
  
  -- Dependencies
  depends_on_stage TEXT,       -- Must complete before this runs
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Timing
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_queue_status ON generation_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_queue_client ON generation_queue(client_id, status);

-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Get current stage status for a client
CREATE OR REPLACE FUNCTION get_client_roadmap_status(p_client_id UUID)
RETURNS TABLE (
  stage_type TEXT,
  status generation_status,
  version INTEGER,
  has_edits BOOLEAN,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.stage_type,
    rs.status,
    rs.version,
    rs.approved_content IS DISTINCT FROM rs.generated_content AS has_edits,
    rs.updated_at
  FROM roadmap_stages rs
  WHERE rs.client_id = p_client_id
  AND rs.version = (
    SELECT MAX(version) 
    FROM roadmap_stages 
    WHERE client_id = p_client_id 
    AND stage_type = rs.stage_type
  )
  ORDER BY 
    CASE rs.stage_type
      WHEN 'fit_assessment' THEN 1
      WHEN 'five_year_vision' THEN 2
      WHEN 'six_month_shift' THEN 3
      WHEN 'sprint_plan' THEN 4
      WHEN 'value_analysis' THEN 5
    END;
END;
$$ LANGUAGE plpgsql;

-- Trigger next stage generation
CREATE OR REPLACE FUNCTION trigger_next_stage()
RETURNS TRIGGER AS $$
DECLARE
  next_stage TEXT;
BEGIN
  -- Only trigger on status change to 'generated'
  IF NEW.status = 'generated' AND (OLD.status IS NULL OR OLD.status = 'generating') THEN
    -- Determine next stage
    next_stage := CASE NEW.stage_type
      WHEN 'fit_assessment' THEN 'five_year_vision'
      WHEN 'five_year_vision' THEN 'six_month_shift'
      WHEN 'six_month_shift' THEN 'sprint_plan'
      ELSE NULL
    END;
    
    -- Queue next stage if exists
    IF next_stage IS NOT NULL THEN
      INSERT INTO generation_queue (practice_id, client_id, stage_type, depends_on_stage)
      VALUES (NEW.practice_id, NEW.client_id, next_stage, NEW.stage_type)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trg_auto_chain_generation ON roadmap_stages;
CREATE TRIGGER trg_auto_chain_generation
  AFTER UPDATE ON roadmap_stages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_next_stage();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_roadmap_stages_updated_at ON roadmap_stages;
CREATE TRIGGER trg_update_roadmap_stages_updated_at
  BEFORE UPDATE ON roadmap_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE roadmap_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;

-- Practice members can see their own practice's stages
CREATE POLICY "Practice members can view their practice's roadmap stages"
  ON roadmap_stages FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

-- Practice members can update their practice's stages
CREATE POLICY "Practice members can update their practice's roadmap stages"
  ON roadmap_stages FOR UPDATE
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

-- Practice members can insert stages for their practice
CREATE POLICY "Practice members can insert roadmap stages"
  ON roadmap_stages FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

-- Similar policies for generation_feedback and generation_queue
CREATE POLICY "Practice members can view their practice's feedback"
  ON generation_feedback FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Practice members can insert feedback"
  ON generation_feedback FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Practice members can view their practice's queue"
  ON generation_queue FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

