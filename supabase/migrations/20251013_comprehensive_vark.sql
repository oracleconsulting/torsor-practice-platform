-- Comprehensive VARK Learning Styles Assessment System
-- Date: 2025-10-13
-- Replaces basic VARK with detailed preference tracking

-- Drop existing table if it exists (backup data first in production!)
DROP TABLE IF EXISTS learning_preferences CASCADE;

-- Create comprehensive learning_preferences table
CREATE TABLE learning_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Raw scores (number of questions answered for each type)
  visual_score INTEGER DEFAULT 0,
  auditory_score INTEGER DEFAULT 0,
  read_write_score INTEGER DEFAULT 0,
  kinesthetic_score INTEGER DEFAULT 0,
  
  -- Percentages (0-100)
  visual_percentage INTEGER DEFAULT 0,
  auditory_percentage INTEGER DEFAULT 0,
  read_write_percentage INTEGER DEFAULT 0,
  kinesthetic_percentage INTEGER DEFAULT 0,
  
  -- Learning type classification
  learning_type TEXT, -- e.g., "Strong Visual", "Bimodal (V + K)", "Multimodal (VARK)"
  dominant_styles TEXT[], -- Array of dominant learning styles
  
  -- Full response data (JSONB for flexibility)
  responses JSONB, -- Array of { questionId, type }
  
  -- Assessment metadata
  assessment_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(team_member_id)
);

-- Create indexes for performance
CREATE INDEX idx_learning_preferences_member ON learning_preferences(team_member_id);
CREATE INDEX idx_learning_preferences_learning_type ON learning_preferences(learning_type);
CREATE INDEX idx_learning_preferences_dominant_styles ON learning_preferences USING GIN(dominant_styles);

-- Create trigger for updated_at
CREATE TRIGGER update_learning_preferences_updated_at
  BEFORE UPDATE ON learning_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate VARK compatibility between two members
CREATE OR REPLACE FUNCTION calculate_vark_compatibility(
  member1_id UUID,
  member2_id UUID
) RETURNS INTEGER AS $$
DECLARE
  member1_prefs learning_preferences%ROWTYPE;
  member2_prefs learning_preferences%ROWTYPE;
  compatibility_score INTEGER := 0;
  shared_styles INTEGER := 0;
BEGIN
  -- Get preferences for both members
  SELECT * INTO member1_prefs FROM learning_preferences WHERE team_member_id = member1_id;
  SELECT * INTO member2_prefs FROM learning_preferences WHERE team_member_id = member2_id;
  
  -- If either doesn't have preferences, return 0
  IF member1_prefs.id IS NULL OR member2_prefs.id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count shared dominant styles
  SELECT COUNT(*)
  INTO shared_styles
  FROM unnest(member1_prefs.dominant_styles) AS style1
  WHERE style1 = ANY(member2_prefs.dominant_styles);
  
  -- Base compatibility on shared styles
  IF shared_styles > 0 THEN
    compatibility_score := compatibility_score + (shared_styles * 30); -- +30 per shared style
  END IF;
  
  -- Add points for complementary styles (different but balanced)
  IF array_length(member1_prefs.dominant_styles, 1) > 1 
     AND array_length(member2_prefs.dominant_styles, 1) > 1 THEN
    compatibility_score := compatibility_score + 20; -- +20 for both being multimodal
  END IF;
  
  -- Cap at 100
  IF compatibility_score > 100 THEN
    compatibility_score := 100;
  END IF;
  
  RETURN compatibility_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get learning style recommendations for a member
CREATE OR REPLACE FUNCTION get_learning_recommendations(
  member_id UUID
) RETURNS TABLE (
  style TEXT,
  percentage INTEGER,
  learning_strategies TEXT[],
  mentoring_strategies TEXT[]
) AS $$
DECLARE
  prefs learning_preferences%ROWTYPE;
BEGIN
  SELECT * INTO prefs FROM learning_preferences WHERE team_member_id = member_id;
  
  IF prefs.id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return recommendations for each style above 25%
  IF prefs.visual_percentage >= 25 THEN
    RETURN QUERY SELECT 
      'Visual'::TEXT,
      prefs.visual_percentage,
      ARRAY[
        'Use diagrams, flowcharts, and mind maps',
        'Color-code notes and materials',
        'Watch video tutorials and demonstrations',
        'Create visual summaries and infographics',
        'Use whiteboards for brainstorming'
      ],
      ARRAY[
        'Share visual examples and case studies',
        'Use screen sharing for demonstrations',
        'Provide visual roadmaps and timelines',
        'Draw concepts while explaining'
      ];
  END IF;
  
  IF prefs.auditory_percentage >= 25 THEN
    RETURN QUERY SELECT 
      'Auditory'::TEXT,
      prefs.auditory_percentage,
      ARRAY[
        'Participate in group discussions',
        'Listen to podcasts and audio materials',
        'Read notes aloud when studying',
        'Use voice recordings for review',
        'Explain concepts to others verbally'
      ],
      ARRAY[
        'Schedule regular verbal check-ins',
        'Use storytelling to explain concepts',
        'Encourage questions and dialogue',
        'Provide verbal feedback frequently'
      ];
  END IF;
  
  IF prefs.read_write_percentage >= 25 THEN
    RETURN QUERY SELECT 
      'Read/Write'::TEXT,
      prefs.read_write_percentage,
      ARRAY[
        'Take detailed written notes',
        'Create written summaries and reports',
        'Read documentation thoroughly',
        'Keep learning journals',
        'Email questions for clarification'
      ],
      ARRAY[
        'Provide written feedback and comments',
        'Share detailed documentation',
        'Use email for complex explanations',
        'Create written action plans'
      ];
  END IF;
  
  IF prefs.kinesthetic_percentage >= 25 THEN
    RETURN QUERY SELECT 
      'Kinesthetic'::TEXT,
      prefs.kinesthetic_percentage,
      ARRAY[
        'Practice with real-world scenarios',
        'Take breaks to move around while learning',
        'Use hands-on simulations',
        'Learn by doing and experimenting',
        'Apply concepts immediately'
      ],
      ARRAY[
        'Provide hands-on practice opportunities',
        'Use role-playing exercises',
        'Walk through processes step-by-step',
        'Encourage trial and error learning'
      ];
  END IF;
END;
$$ LANGUAGE plpgsql;

-- View for easy querying of member learning profiles
CREATE OR REPLACE VIEW member_learning_profiles AS
SELECT 
  pm.id as member_id,
  pm.name,
  pm.email,
  pm.role,
  lp.learning_type,
  lp.dominant_styles,
  lp.visual_percentage,
  lp.auditory_percentage,
  lp.read_write_percentage,
  lp.kinesthetic_percentage,
  lp.assessment_date
FROM practice_members pm
LEFT JOIN learning_preferences lp ON pm.id = lp.team_member_id;

-- Comments for documentation
COMMENT ON TABLE learning_preferences IS 'Stores comprehensive VARK learning style assessment results for team members';
COMMENT ON COLUMN learning_preferences.visual_score IS 'Number of Visual preference responses (0-16)';
COMMENT ON COLUMN learning_preferences.auditory_score IS 'Number of Auditory preference responses (0-16)';
COMMENT ON COLUMN learning_preferences.read_write_score IS 'Number of Read/Write preference responses (0-16)';
COMMENT ON COLUMN learning_preferences.kinesthetic_score IS 'Number of Kinesthetic preference responses (0-16)';
COMMENT ON COLUMN learning_preferences.learning_type IS 'Classification: Strong X, Bimodal, Trimodal, or Multimodal';
COMMENT ON COLUMN learning_preferences.dominant_styles IS 'Array of dominant learning styles (visual, auditory, readWrite, kinesthetic)';
COMMENT ON COLUMN learning_preferences.responses IS 'JSONB array of all question responses for full assessment history';

COMMENT ON FUNCTION calculate_vark_compatibility IS 'Calculate compatibility score (0-100) between two members based on learning styles';
COMMENT ON FUNCTION get_learning_recommendations IS 'Get personalized learning and mentoring strategies for a member';

-- Grant permissions (adjust based on your RLS policies)
-- GRANT ALL ON learning_preferences TO authenticated;
-- GRANT SELECT ON member_learning_profiles TO authenticated;

