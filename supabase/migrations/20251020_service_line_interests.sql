-- ================================================================
-- Service Line Interest Rankings
-- Store team member preferences for BSG service lines
-- ================================================================

-- Create service_line_interests table
CREATE TABLE IF NOT EXISTS service_line_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- What service line
  service_line TEXT NOT NULL,
  
  -- Interest ranking (1 = most interested, higher = less interested)
  interest_rank INTEGER NOT NULL CHECK (interest_rank > 0),
  
  -- Why they're interested / notes
  notes TEXT,
  
  -- Experience level in this service line (0-5 scale)
  current_experience_level INTEGER DEFAULT 0 CHECK (current_experience_level BETWEEN 0 AND 5),
  
  -- Desired involvement (percentage or hours per month)
  desired_involvement_pct INTEGER DEFAULT 0 CHECK (desired_involvement_pct BETWEEN 0 AND 100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: one ranking per member per service line
  UNIQUE(practice_member_id, service_line)
);

-- Create index for faster lookups
CREATE INDEX idx_service_line_interests_member ON service_line_interests(practice_member_id);
CREATE INDEX idx_service_line_interests_service_line ON service_line_interests(service_line);
CREATE INDEX idx_service_line_interests_rank ON service_line_interests(interest_rank);

-- Enable RLS
ALTER TABLE service_line_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Team members can view and edit their own interests
CREATE POLICY "Team members can manage their own service line interests"
ON service_line_interests
FOR ALL
USING (
  auth.uid() = (
    SELECT user_id 
    FROM practice_members 
    WHERE id = service_line_interests.practice_member_id
  )
);

-- RLS Policy: Managers/admins can view all team interests
CREATE POLICY "Managers and admins can view all service line interests"
ON service_line_interests
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM practice_members pm
    WHERE pm.user_id = auth.uid()
    AND LOWER(pm.role) IN ('owner', 'admin', 'manager', 'director', 'partner', 'associate director', 'senior manager')
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_line_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_line_interests_updated_at
BEFORE UPDATE ON service_line_interests
FOR EACH ROW
EXECUTE FUNCTION update_service_line_interests_updated_at();

-- Seed BSG Service Lines (as reference comments)
-- Active service lines from BSG Skills Matrix:
-- 1. Automation
-- 2. Management Accounts
-- 3. Future Financial Information / Advisory Accelerator
-- 4. Benchmarking - External and Internal
-- 5. Profit Extraction / Remuneration Strategies
-- 6. 365 Alignment Programme
-- Coming Soon: Systems Audit

-- View for service line coverage analysis
-- Note: Simplified to avoid column existence issues across different schema versions
CREATE OR REPLACE VIEW service_line_coverage AS
SELECT 
  pm.id as member_id,
  pm.name as member_name,
  pm.role,
  sli.service_line,
  sli.interest_rank,
  sli.current_experience_level,
  sli.desired_involvement_pct,
  
  -- Calculate average skill level for this service line
  COALESCE(AVG(sa.current_level), 0) as avg_skill_level_in_service_line,
  
  -- Count skills assessed in this service line
  COUNT(DISTINCT s.id) as skills_count_in_service_line,
  
  -- Match score (interest + experience + skills)
  (
    (10 - COALESCE(sli.interest_rank, 10)) * 10 +  -- Interest (lower rank = higher score)
    COALESCE(sli.current_experience_level, 0) * 10 + -- Experience
    COALESCE(AVG(sa.current_level), 0) * 20 -- Current skills (weighted most)
  ) as match_score

FROM practice_members pm
LEFT JOIN service_line_interests sli ON pm.id = sli.practice_member_id
LEFT JOIN skill_assessments sa ON pm.id = sa.team_member_id
LEFT JOIN skills s ON sa.skill_id = s.id AND s.service_line = sli.service_line
GROUP BY pm.id, pm.name, pm.role, sli.service_line, sli.interest_rank, 
         sli.current_experience_level, sli.desired_involvement_pct
ORDER BY pm.name, sli.interest_rank;

COMMENT ON VIEW service_line_coverage IS 'Strategic view combining member interests, experience, and skills for service line deployment planning';

