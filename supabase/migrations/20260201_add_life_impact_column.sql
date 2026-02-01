-- Add life_impact column to client_opportunities
-- This captures the personal/lifestyle impact for the business owner

ALTER TABLE client_opportunities
ADD COLUMN IF NOT EXISTS life_impact TEXT;

COMMENT ON COLUMN client_opportunities.life_impact IS 'What this opportunity means for the owner personally - connects business metrics to life goals';

