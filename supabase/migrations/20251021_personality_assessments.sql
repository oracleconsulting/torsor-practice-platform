-- ================================================================
-- OCEAN (Big Five) Personality Assessment System
-- Extends VARK with comprehensive personality profiling
-- ================================================================

-- ================================================================
-- 1. Personality Assessments Table
-- ================================================================
CREATE TABLE IF NOT EXISTS personality_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  assessment_version VARCHAR(10) DEFAULT '1.0',
  
  -- Big Five Scores (0-100 scale)
  openness_score DECIMAL(5,2) NOT NULL,
  conscientiousness_score DECIMAL(5,2) NOT NULL,
  extraversion_score DECIMAL(5,2) NOT NULL,
  agreeableness_score DECIMAL(5,2) NOT NULL,
  neuroticism_score DECIMAL(5,2) NOT NULL,
  emotional_stability_score DECIMAL(5,2), -- Inverse of neuroticism
  
  -- Facet scores (6 per trait, stored as JSONB)
  facet_scores JSONB,
  
  -- Percentile ranks (compared to professional population)
  openness_percentile INTEGER,
  conscientiousness_percentile INTEGER,
  extraversion_percentile INTEGER,
  agreeableness_percentile INTEGER,
  neuroticism_percentile INTEGER,
  
  -- Derived insights
  dominant_traits TEXT[], -- Top 2 traits
  work_style VARCHAR(50), -- Derived from combination
  communication_style VARCHAR(50),
  stress_response VARCHAR(50),
  
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_time_seconds INTEGER,
  responses JSONB, -- Store raw responses for analysis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one assessment per member (can be updated)
  UNIQUE(team_member_id)
);

-- Indexes for performance
CREATE INDEX idx_personality_assessments_member ON personality_assessments(team_member_id);
CREATE INDEX idx_personality_assessments_completed ON personality_assessments(completed_at);
CREATE INDEX idx_personality_assessments_work_style ON personality_assessments(work_style);

-- ================================================================
-- 2. Combined Team Member Profiles (VARK + OCEAN)
-- ================================================================
CREATE TABLE IF NOT EXISTS team_member_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Combined scores
  personality_profile JSONB, -- Big Five scores as object
  learning_style VARCHAR(50), -- From VARK (visual, auditory, reading_writing, kinesthetic)
  cognitive_style VARCHAR(50), -- Derived from both assessments
  
  -- Work preferences (derived from both assessments)
  preferred_work_environment TEXT[],
  preferred_communication_channels TEXT[],
  preferred_feedback_style VARCHAR(50),
  preferred_recognition_type VARCHAR(50),
  
  -- Team compatibility factors
  ideal_team_size VARCHAR(20), -- 'small' (2-4), 'medium' (5-8), 'large' (9+)
  collaboration_preference DECIMAL(3,2), -- 0-1 scale (low to high)
  leadership_potential DECIMAL(3,2), -- 0-1 scale
  specialist_vs_generalist DECIMAL(3,2), -- 0=specialist, 1=generalist
  
  -- Role affinities (0-100 scores for different roles)
  role_affinities JSONB, -- {project_manager: 85, analyst: 72, client_liaison: 90, ...}
  
  -- Profile completeness
  vark_completed BOOLEAN DEFAULT FALSE,
  ocean_completed BOOLEAN DEFAULT FALSE,
  profile_strength DECIMAL(3,2), -- 0-1 based on completeness
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- One profile per member
  UNIQUE(team_member_id)
);

-- Indexes
CREATE INDEX idx_team_member_profiles_member ON team_member_profiles(team_member_id);
CREATE INDEX idx_team_member_profiles_completeness ON team_member_profiles(vark_completed, ocean_completed);
CREATE INDEX idx_team_member_profiles_leadership ON team_member_profiles(leadership_potential);

-- ================================================================
-- 3. Team Compositions Analysis
-- ================================================================
CREATE TABLE IF NOT EXISTS team_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  team_name VARCHAR(255),
  
  -- Aggregate metrics
  personality_diversity_score DECIMAL(3,2), -- 0-1 (higher = more diverse)
  learning_style_coverage JSONB, -- {visual: 3, auditory: 2, reading_writing: 4, kinesthetic: 1}
  team_size INTEGER,
  
  -- Balance indicators (-1 to 1 scales)
  extraversion_balance DECIMAL(3,2), -- Negative=introverted team, Positive=extraverted
  thinking_feeling_balance DECIMAL(3,2), -- Low agreeableness vs high
  detail_big_picture_balance DECIMAL(3,2), -- High conscientiousness vs high openness
  stability_index DECIMAL(3,2), -- Based on neuroticism scores
  
  -- Predicted dynamics (0-1 scales)
  innovation_potential DECIMAL(3,2), -- High openness + diversity
  execution_capability DECIMAL(3,2), -- High conscientiousness + low variance
  conflict_risk DECIMAL(3,2), -- Based on agreeableness variance + neuroticism
  communication_efficiency DECIMAL(3,2), -- Based on style compatibility
  
  -- Identified gaps and recommendations
  missing_roles TEXT[],
  overrepresented_traits TEXT[],
  underrepresented_traits TEXT[],
  recommended_additions JSONB, -- Suggested personality profiles to add
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  calculation_version VARCHAR(10) DEFAULT '1.0',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_team_compositions_practice ON team_compositions(practice_id);
CREATE INDEX idx_team_compositions_diversity ON team_compositions(personality_diversity_score);
CREATE INDEX idx_team_compositions_calculated ON team_compositions(calculated_at);

-- ================================================================
-- 4. Enable RLS
-- ================================================================
ALTER TABLE personality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_compositions ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 5. RLS Policies for personality_assessments
-- ================================================================

-- Team members can view and update their own assessment
CREATE POLICY "Team members can manage their own personality assessment"
ON personality_assessments
FOR ALL
USING (
  auth.uid() = (
    SELECT user_id 
    FROM practice_members 
    WHERE id = personality_assessments.team_member_id
  )
);

-- Managers/admins/directors can view all team assessments
CREATE POLICY "Managers and admins can view all personality assessments"
ON personality_assessments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM practice_members pm
    WHERE pm.user_id = auth.uid()
    AND LOWER(pm.role) IN ('owner', 'admin', 'manager', 'director', 'partner', 'associate director', 'senior manager')
  )
);

-- ================================================================
-- 6. RLS Policies for team_member_profiles
-- ================================================================

-- Team members can view their own profile
CREATE POLICY "Team members can view their own profile"
ON team_member_profiles
FOR SELECT
USING (
  auth.uid() = (
    SELECT user_id 
    FROM practice_members 
    WHERE id = team_member_profiles.team_member_id
  )
);

-- System can update profiles (for automated profile generation)
CREATE POLICY "System can manage profiles"
ON team_member_profiles
FOR ALL
USING (true);

-- Managers/admins can view all profiles
CREATE POLICY "Managers and admins can view all profiles"
ON team_member_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM practice_members pm
    WHERE pm.user_id = auth.uid()
    AND LOWER(pm.role) IN ('owner', 'admin', 'manager', 'director', 'partner', 'associate director', 'senior manager')
  )
);

-- ================================================================
-- 7. RLS Policies for team_compositions
-- ================================================================

-- Practice members can view their practice's composition
CREATE POLICY "Practice members can view team composition"
ON team_compositions
FOR SELECT
USING (
  practice_id IN (
    SELECT practice_id 
    FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

-- Managers can update composition analysis
CREATE POLICY "Managers can update team composition"
ON team_compositions
FOR ALL
USING (
  practice_id IN (
    SELECT pm.practice_id
    FROM practice_members pm
    WHERE pm.user_id = auth.uid()
    AND LOWER(pm.role) IN ('owner', 'admin', 'manager', 'director', 'partner', 'associate director', 'senior manager')
  )
);

-- ================================================================
-- 8. Triggers for updated_at
-- ================================================================

CREATE OR REPLACE FUNCTION update_personality_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personality_assessments_updated_at
BEFORE UPDATE ON personality_assessments
FOR EACH ROW
EXECUTE FUNCTION update_personality_assessment_updated_at();

CREATE OR REPLACE FUNCTION update_team_member_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_member_profiles_updated_at
BEFORE UPDATE ON team_member_profiles
FOR EACH ROW
EXECUTE FUNCTION update_team_member_profiles_updated_at();

CREATE OR REPLACE FUNCTION update_team_compositions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_compositions_updated_at
BEFORE UPDATE ON team_compositions
FOR EACH ROW
EXECUTE FUNCTION update_team_compositions_updated_at();

-- ================================================================
-- 9. Views for Admin Dashboard
-- ================================================================

-- View: Team Assessment Overview
CREATE OR REPLACE VIEW team_assessment_overview AS
SELECT 
  pm.id as member_id,
  pm.name as member_name,
  pm.email,
  pm.role,
  pm.practice_id,
  
  -- VARK data
  pm.vark_assessment_completed,
  pm.learning_style,
  
  -- OCEAN data
  pa.openness_score,
  pa.conscientiousness_score,
  pa.extraversion_score,
  pa.agreeableness_score,
  pa.neuroticism_score,
  pa.emotional_stability_score,
  pa.work_style,
  pa.communication_style,
  pa.completed_at as ocean_completed_at,
  
  -- Combined profile
  tmp.cognitive_style,
  tmp.leadership_potential,
  tmp.collaboration_preference,
  tmp.profile_strength,
  tmp.vark_completed,
  tmp.ocean_completed,
  
  -- Completeness flag
  CASE 
    WHEN pm.vark_assessment_completed AND pa.id IS NOT NULL THEN 'complete'
    WHEN pm.vark_assessment_completed OR pa.id IS NOT NULL THEN 'partial'
    ELSE 'not_started'
  END as assessment_status

FROM practice_members pm
LEFT JOIN personality_assessments pa ON pm.id = pa.team_member_id
LEFT JOIN team_member_profiles tmp ON pm.id = tmp.team_member_id
WHERE pm.is_active = true
ORDER BY pm.name;

COMMENT ON VIEW team_assessment_overview IS 'Combined view of VARK and OCEAN assessments for admin dashboard';

-- View: Practice Team Composition Summary
CREATE OR REPLACE VIEW practice_team_composition_summary AS
SELECT 
  p.id as practice_id,
  p.name as practice_name,
  COUNT(DISTINCT pm.id) as total_members,
  COUNT(DISTINCT CASE WHEN pm.vark_assessment_completed THEN pm.id END) as vark_completed_count,
  COUNT(DISTINCT pa.team_member_id) as ocean_completed_count,
  COUNT(DISTINCT CASE WHEN pm.vark_assessment_completed AND pa.team_member_id IS NOT NULL THEN pm.id END) as both_completed_count,
  
  -- Average scores
  ROUND(AVG(pa.openness_score)::numeric, 2) as avg_openness,
  ROUND(AVG(pa.conscientiousness_score)::numeric, 2) as avg_conscientiousness,
  ROUND(AVG(pa.extraversion_score)::numeric, 2) as avg_extraversion,
  ROUND(AVG(pa.agreeableness_score)::numeric, 2) as avg_agreeableness,
  ROUND(AVG(pa.neuroticism_score)::numeric, 2) as avg_neuroticism,
  ROUND(AVG(pa.emotional_stability_score)::numeric, 2) as avg_emotional_stability,
  
  -- Learning style distribution
  COUNT(DISTINCT CASE WHEN pm.learning_style = 'visual' THEN pm.id END) as visual_count,
  COUNT(DISTINCT CASE WHEN pm.learning_style = 'auditory' THEN pm.id END) as auditory_count,
  COUNT(DISTINCT CASE WHEN pm.learning_style = 'reading_writing' THEN pm.id END) as reading_writing_count,
  COUNT(DISTINCT CASE WHEN pm.learning_style = 'kinesthetic' THEN pm.id END) as kinesthetic_count

FROM practices p
LEFT JOIN practice_members pm ON p.id = pm.practice_id AND pm.is_active = true
LEFT JOIN personality_assessments pa ON pm.id = pa.team_member_id
GROUP BY p.id, p.name;

COMMENT ON VIEW practice_team_composition_summary IS 'Summary statistics for practice team personality and learning style composition';

-- ================================================================
-- 10. Helper Functions
-- ================================================================

-- Function to calculate team diversity score
CREATE OR REPLACE FUNCTION calculate_team_diversity(p_practice_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  diversity_score DECIMAL;
BEGIN
  -- Calculate standard deviation across all Big Five traits
  -- Higher variance = more diversity
  SELECT 
    (
      STDDEV(pa.openness_score) +
      STDDEV(pa.conscientiousness_score) +
      STDDEV(pa.extraversion_score) +
      STDDEV(pa.agreeableness_score) +
      STDDEV(pa.neuroticism_score)
    ) / 500.0 -- Normalize to 0-1 scale
  INTO diversity_score
  FROM personality_assessments pa
  JOIN practice_members pm ON pa.team_member_id = pm.id
  WHERE pm.practice_id = p_practice_id
  AND pm.is_active = true;
  
  RETURN COALESCE(diversity_score, 0);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 11. Sample Data Comments
-- ================================================================

-- Big Five Trait Interpretations:
-- OPENNESS (Innovation & Adaptability)
--   High (70-100): Creative, curious, embraces change
--   Moderate (30-69): Balanced, practical innovation
--   Low (0-29): Traditional, prefers established methods

-- CONSCIENTIOUSNESS (Organization & Reliability)
--   High (70-100): Organized, detail-oriented, disciplined
--   Moderate (30-69): Flexible structure
--   Low (0-29): Spontaneous, adaptable

-- EXTRAVERSION (Social Energy & Assertiveness)
--   High (70-100): Outgoing, energized by interaction
--   Moderate (30-69): Ambivert, balanced
--   Low (0-29): Reserved, prefers independent work

-- AGREEABLENESS (Cooperation & Trust)
--   High (70-100): Collaborative, empathetic, team-focused
--   Moderate (30-69): Balanced cooperation and assertiveness
--   Low (0-29): Direct, competitive, results-focused

-- NEUROTICISM (Emotional Stability - inverse)
--   High Neuroticism (70-100): Sensitive, reactive to stress
--   Moderate (30-69): Normal stress response
--   Low Neuroticism (0-29): Calm, emotionally stable
--   Note: Emotional Stability = 100 - Neuroticism

COMMENT ON TABLE personality_assessments IS 'OCEAN (Big Five) personality assessment results for team members';
COMMENT ON TABLE team_member_profiles IS 'Combined VARK + OCEAN profiles with work preferences and role affinities';
COMMENT ON TABLE team_compositions IS 'Team-level analysis of personality diversity, balance, and predicted dynamics';





