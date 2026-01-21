-- ============================================================================
-- Migration: 20260121_ma_insights_review_workflow.sql
-- Purpose: Add review workflow columns to ma_insights for AI-generated insights
-- ============================================================================

-- Add status column for review workflow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_insights' AND column_name = 'status'
  ) THEN
    ALTER TABLE ma_insights ADD COLUMN status VARCHAR(20) DEFAULT 'draft' 
      CHECK (status IN ('draft', 'approved', 'rejected', 'edited'));
  END IF;
END $$;

-- Add priority column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_insights' AND column_name = 'priority'
  ) THEN
    ALTER TABLE ma_insights ADD COLUMN priority VARCHAR(20) DEFAULT 'medium'
      CHECK (priority IN ('critical', 'high', 'medium', 'low'));
  END IF;
END $$;

-- Add implications column for business impact
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_insights' AND column_name = 'implications'
  ) THEN
    ALTER TABLE ma_insights ADD COLUMN implications TEXT;
  END IF;
END $$;

-- Add data_points array for supporting evidence
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_insights' AND column_name = 'data_points'
  ) THEN
    ALTER TABLE ma_insights ADD COLUMN data_points TEXT[];
  END IF;
END $$;

-- Add approved_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_insights' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE ma_insights ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add approved_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_insights' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE ma_insights ADD COLUMN approved_by UUID;
  END IF;
END $$;

-- Add edited_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_insights' AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE ma_insights ADD COLUMN edited_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add original_content to store AI version before edits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_insights' AND column_name = 'original_content'
  ) THEN
    ALTER TABLE ma_insights ADD COLUMN original_content JSONB;
  END IF;
END $$;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_ma_insights_status ON ma_insights(status);
CREATE INDEX IF NOT EXISTS idx_ma_insights_priority ON ma_insights(priority);

COMMENT ON COLUMN ma_insights.status IS 'Review workflow status: draft (AI generated), approved, rejected, edited';
COMMENT ON COLUMN ma_insights.priority IS 'Business priority: critical, high, medium, low';
COMMENT ON COLUMN ma_insights.implications IS 'Plain English explanation of what this means for the business';
COMMENT ON COLUMN ma_insights.data_points IS 'Array of specific data points supporting this insight';
COMMENT ON COLUMN ma_insights.original_content IS 'JSON snapshot of original AI-generated content before edits';

