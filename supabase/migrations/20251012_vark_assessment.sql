-- VARK Learning Styles Assessment Database Schema
-- Creates tables for storing VARK assessment results and learning preferences
-- Date: 2025-10-12

-- Create learning_preferences table
CREATE TABLE IF NOT EXISTS learning_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- VARK Scores (0-100 percentage)
  visual_score INTEGER DEFAULT 0 CHECK (visual_score BETWEEN 0 AND 100),
  auditory_score INTEGER DEFAULT 0 CHECK (auditory_score BETWEEN 0 AND 100),
  reading_writing_score INTEGER DEFAULT 0 CHECK (reading_writing_score BETWEEN 0 AND 100),
  kinesthetic_score INTEGER DEFAULT 0 CHECK (kinesthetic_score BETWEEN 0 AND 100),
  
  -- Primary learning style (highest score)
  primary_style VARCHAR(20) CHECK (primary_style IN ('visual', 'auditory', 'reading_writing', 'kinesthetic', 'multimodal')),
  
  -- Is multimodal? (2+ styles with similar scores)
  is_multimodal BOOLEAN DEFAULT false,
  
  -- Raw assessment data (JSON)
  assessment_answers JSONB,
  
  -- Metadata
  assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_by UUID REFERENCES auth.users(id),
  assessment_version VARCHAR(10) DEFAULT '1.0',
  
  -- Recommendations based on learning style
  learning_recommendations TEXT[],
  
  -- Updated timestamp
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one assessment per team member (most recent)
  UNIQUE(team_member_id)
);

-- Create VARK questions reference table (for consistency)
CREATE TABLE IF NOT EXISTS vark_questions (
  id SERIAL PRIMARY KEY,
  question_number INTEGER NOT NULL UNIQUE,
  question_text TEXT NOT NULL,
  category VARCHAR(50),
  
  -- Answer options
  option_a TEXT NOT NULL,
  option_a_style VARCHAR(20) NOT NULL,
  
  option_b TEXT NOT NULL,
  option_b_style VARCHAR(20) NOT NULL,
  
  option_c TEXT NOT NULL,
  option_c_style VARCHAR(20) NOT NULL,
  
  option_d TEXT NOT NULL,
  option_d_style VARCHAR(20) NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard 16 VARK questions
INSERT INTO vark_questions (question_number, question_text, category, 
  option_a, option_a_style, 
  option_b, option_b_style, 
  option_c, option_c_style, 
  option_d, option_d_style) VALUES

(1, 'You are helping someone who wants to go to your airport, the center of town or railway station. You would:', 'Navigation',
  'go with her', 'kinesthetic',
  'tell her the directions', 'auditory',
  'write down the directions', 'reading_writing',
  'draw, or show her a map', 'visual'),

(2, 'A website has a video showing how to make a special graph. There is a person speaking, some lists and words describing what to do and some diagrams. You would learn most from:', 'Learning',
  'seeing the diagrams', 'visual',
  'listening to the speaker', 'auditory',
  'reading the words', 'reading_writing',
  'watching the actions', 'kinesthetic'),

(3, 'You are planning a vacation for a group. You want some feedback from them about the plan. You would:', 'Communication',
  'use a map or website to show them places', 'visual',
  'phone, text or email them', 'reading_writing',
  'give them a copy of the itinerary', 'reading_writing',
  'describe some of the highlights they will experience', 'auditory'),

(4, 'You are going to cook something as a special treat. You would:', 'Learning New Skills',
  'cook something you know without the need for instructions', 'kinesthetic',
  'ask friends for suggestions', 'auditory',
  'look at a cookbook for ideas from the pictures', 'visual',
  'use a cookbook where you know there is a good recipe', 'reading_writing'),

(5, 'A group of tourists wants to learn about the parks or wildlife reserves in your area. You would:', 'Teaching',
  'take them to a park or reserve', 'kinesthetic',
  'show them maps and internet pictures', 'visual',
  'tell them about the parks', 'auditory',
  'give them pamphlets or book about parks', 'reading_writing'),

(6, 'You are about to purchase a digital camera or mobile phone. Other than price, what would most influence your decision?', 'Decision Making',
  'trying or testing it', 'kinesthetic',
  'reading the details or checking its features online', 'reading_writing',
  'it is a modern design and looks good', 'visual',
  'the salesperson telling me about its features', 'auditory'),

(7, 'Remember a time when you learned how to do something new. Avoid choosing a physical skill, e.g. riding a bike. You learned best by:', 'Recall',
  'watching a demonstration', 'visual',
  'listening to somebody explaining it and asking questions', 'auditory',
  'diagrams, maps, and charts - visual clues', 'visual',
  'written instructions - e.g. a manual or book', 'reading_writing'),

(8, 'You have a problem with your heart. You would prefer that the doctor:', 'Health Information',
  'gave you something to read to explain what was wrong', 'reading_writing',
  'used a plastic model to show what was wrong', 'kinesthetic',
  'described what was wrong', 'auditory',
  'showed you a diagram of what was wrong', 'visual'),

(9, 'You want to learn a new program, skill or game on a computer. You would:', 'Technology Learning',
  'read the written instructions that came with the program', 'reading_writing',
  'talk with people who know about the program', 'auditory',
  'use the controls or keyboard', 'kinesthetic',
  'follow the diagrams in the book that came with it', 'visual'),

(10, 'I like websites that have:', 'Web Preferences',
  'things I can click on, shift or try', 'kinesthetic',
  'interesting design and visual features', 'visual',
  'interesting written descriptions, lists and explanations', 'reading_writing',
  'audio channels where I can hear music, radio programs or interviews', 'auditory'),

(11, 'Other than price, what would most influence your decision to buy a new non-fiction book?', 'Book Selection',
  'the way it looks is appealing', 'visual',
  'quickly reading parts of it', 'reading_writing',
  'a friend talks about it and recommends it', 'auditory',
  'it has real-life stories, experiences and examples', 'kinesthetic'),

(12, 'You are using a book, CD or website to learn how to take photos with your new digital camera. You would like to have:', 'Technical Learning',
  'a chance to ask questions and talk about the camera and its features', 'auditory',
  'clear written instructions with lists and bullet points about what to do', 'reading_writing',
  'diagrams showing the camera and what each part does', 'visual',
  'many examples of good and poor photos and how to improve them', 'kinesthetic'),

(13, 'Do you prefer a presenter or a teacher who uses:', 'Presentation Style',
  'demonstrations, models or practical sessions', 'kinesthetic',
  'question and answer, talk, group discussion, or guest speakers', 'auditory',
  'handouts, books, or readings', 'reading_writing',
  'diagrams, charts, maps or graphs', 'visual'),

(14, 'You have finished a competition or test and would like some feedback. You would like to have feedback:', 'Feedback Preference',
  'using examples from what you have done', 'kinesthetic',
  'using a written description of your results', 'reading_writing',
  'from somebody who talks it through with you', 'auditory',
  'using graphs showing what you had achieved', 'visual'),

(15, 'You are going to choose food at a restaurant or cafe. You would:', 'Menu Selection',
  'choose something that you have had there before', 'kinesthetic',
  'listen to the waiter or ask friends to recommend choices', 'auditory',
  'choose from the descriptions in the menu', 'reading_writing',
  'look at what others are eating or look at pictures of each dish', 'visual'),

(16, 'You have to make an important speech at a conference or special occasion. You would:', 'Preparation',
  'write a few key words and practice saying your speech over and over', 'auditory',
  'write out your speech and learn from reading it over several times', 'reading_writing',
  'gather many examples and stories to make the talk real and practical', 'kinesthetic',
  'make diagrams or get graphs to help explain things', 'visual');

-- Create indexes for performance
CREATE INDEX idx_learning_preferences_member ON learning_preferences(team_member_id);
CREATE INDEX idx_learning_preferences_primary_style ON learning_preferences(primary_style);
CREATE INDEX idx_learning_preferences_assessed_at ON learning_preferences(assessed_at);
CREATE INDEX idx_vark_questions_number ON vark_questions(question_number);
CREATE INDEX idx_vark_questions_active ON vark_questions(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_learning_preferences_updated_at 
  BEFORE UPDATE ON learning_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate primary learning style
CREATE OR REPLACE FUNCTION calculate_primary_learning_style(
  v_score INTEGER,
  a_score INTEGER,
  r_score INTEGER,
  k_score INTEGER
) RETURNS VARCHAR(20) AS $$
DECLARE
  max_score INTEGER;
  style_count INTEGER;
BEGIN
  max_score := GREATEST(v_score, a_score, r_score, k_score);
  
  -- Count how many styles have the max score (multimodal check)
  style_count := 0;
  IF v_score = max_score THEN style_count := style_count + 1; END IF;
  IF a_score = max_score THEN style_count := style_count + 1; END IF;
  IF r_score = max_score THEN style_count := style_count + 1; END IF;
  IF k_score = max_score THEN style_count := style_count + 1; END IF;
  
  -- If 2+ styles are equal, it's multimodal
  IF style_count >= 2 THEN
    RETURN 'multimodal';
  END IF;
  
  -- Return the primary style
  IF v_score = max_score THEN RETURN 'visual'; END IF;
  IF a_score = max_score THEN RETURN 'auditory'; END IF;
  IF r_score = max_score THEN RETURN 'reading_writing'; END IF;
  IF k_score = max_score THEN RETURN 'kinesthetic'; END IF;
  
  RETURN 'multimodal'; -- Fallback
END;
$$ LANGUAGE plpgsql;

-- Add learning style column to practice_members for quick reference
ALTER TABLE practice_members 
ADD COLUMN IF NOT EXISTS learning_style VARCHAR(20),
ADD COLUMN IF NOT EXISTS vark_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vark_completed_at TIMESTAMP;

-- Create view for team learning styles overview
CREATE OR REPLACE VIEW team_learning_styles_overview AS
SELECT 
  pm.id as member_id,
  pm.practice_id,
  pm.user_id,
  lp.primary_style,
  lp.is_multimodal,
  lp.visual_score,
  lp.auditory_score,
  lp.reading_writing_score,
  lp.kinesthetic_score,
  lp.assessed_at,
  pm.role,
  pm.is_active
FROM practice_members pm
LEFT JOIN learning_preferences lp ON pm.id = lp.team_member_id
WHERE pm.is_active = true;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON learning_preferences TO authenticated;
-- GRANT SELECT ON vark_questions TO authenticated;
-- GRANT SELECT ON team_learning_styles_overview TO authenticated;

-- Comments for documentation
COMMENT ON TABLE learning_preferences IS 'Stores VARK learning style assessment results for team members';
COMMENT ON TABLE vark_questions IS 'Reference table containing the 16 standard VARK assessment questions';
COMMENT ON COLUMN learning_preferences.primary_style IS 'The dominant learning style based on highest score';
COMMENT ON COLUMN learning_preferences.is_multimodal IS 'True if 2+ learning styles have similar scores (within 10%)';
COMMENT ON FUNCTION calculate_primary_learning_style IS 'Determines the primary learning style from VARK scores';

