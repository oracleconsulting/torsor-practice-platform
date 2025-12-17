-- ============================================================================
-- CREATE CLIENT_TASKS TABLE
-- ============================================================================
-- Migration: 20251217_create_client_tasks_table.sql
-- Purpose: Create client_tasks table for sprint task tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id),
  client_id UUID NOT NULL REFERENCES practice_members(id),
  
  -- Task identification
  week_number INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Task metadata
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  
  -- Time estimates
  estimated_hours DECIMAL(5,2),
  
  -- Flexible metadata for task properties
  metadata JSONB DEFAULT '{}',
  
  -- Completion tracking (added by 20251216_staged_roadmap_architecture.sql)
  completed_at TIMESTAMPTZ,
  completion_feedback JSONB,
  feedback_reviewed BOOLEAN DEFAULT FALSE,
  feedback_reviewed_by UUID REFERENCES practice_members(id),
  feedback_flagged_as_pattern BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(client_id, week_number, title)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_tasks_client ON client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_week ON client_tasks(client_id, week_number);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status ON client_tasks(client_id, status);
CREATE INDEX IF NOT EXISTS idx_client_tasks_practice ON client_tasks(practice_id);

-- Add metadata column if table exists but column doesn't
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_tasks') THEN
    ALTER TABLE client_tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    
    -- Ensure unique constraint exists for ON CONFLICT to work
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'client_tasks_client_id_week_number_title_key'
    ) THEN
      ALTER TABLE client_tasks ADD CONSTRAINT client_tasks_client_id_week_number_title_key 
      UNIQUE (client_id, week_number, title);
    END IF;
  END IF;
END $$;

COMMENT ON TABLE client_tasks IS 'Tracks sprint tasks for clients with completion status and feedback';
COMMENT ON COLUMN client_tasks.metadata IS 'Flexible JSONB storage for task properties like whyThisMatters, milestone, tools, etc.';
