-- Migration: Add status field to client_roadmaps
-- Date: 2025-01-XX
-- Description: Add status field to track roadmap review and publication workflow

ALTER TABLE client_roadmaps 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_review' 
CHECK (status IN ('pending_review', 'ready_for_client', 'published'));

COMMENT ON COLUMN client_roadmaps.status IS 'Roadmap status: pending_review (being reviewed), ready_for_client (ready to send), published (visible to client)';

-- Update existing roadmaps to have a status
UPDATE client_roadmaps 
SET status = 'published' 
WHERE status IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON client_roadmaps(status) WHERE is_active = true;
