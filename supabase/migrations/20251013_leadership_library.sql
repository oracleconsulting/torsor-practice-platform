-- =====================================================
-- LEADERSHIP LIBRARY
-- Gallery of leadership books with summaries
-- Integrated with CPD and development recommendations
-- Date: October 13, 2025
-- =====================================================

-- Create leadership_library table
CREATE TABLE IF NOT EXISTS leadership_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Book Details
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20),
  publication_year INTEGER,
  
  -- Visual
  cover_image_path VARCHAR(500) NOT NULL, -- Path to cover image in /public/images/leadership-library/
  
  -- Summaries
  short_summary TEXT NOT NULL, -- 2-3 sentences for gallery view
  key_points TEXT[], -- Array of key takeaways (5-10 points)
  detailed_summary TEXT, -- Full summary for AI/recommendations
  
  -- Categorization
  primary_category VARCHAR(100) NOT NULL, -- Leadership, Communication, Personal Development, etc.
  secondary_categories TEXT[], -- Additional categories
  difficulty_level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, advanced
  
  -- Skills & Topics
  relevant_skills TEXT[], -- Array of skill IDs or names this book addresses
  topics TEXT[], -- Management, Delegation, Emotional Intelligence, etc.
  target_audience TEXT[], -- Directors, Managers, All Levels, etc.
  
  -- Recommendations
  recommended_for_roles TEXT[], -- When to recommend this book
  recommended_reading_time_hours INTEGER, -- Estimated reading time
  practical_exercises BOOLEAN DEFAULT false, -- Contains practical exercises
  
  -- Metadata
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- External Links
  amazon_link VARCHAR(500),
  audible_link VARCHAR(500),
  goodreads_link VARCHAR(500),
  
  -- Engagement
  times_recommended INTEGER DEFAULT 0,
  times_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00
);

-- Create indexes
CREATE INDEX idx_leadership_library_category ON leadership_library(primary_category);
CREATE INDEX idx_leadership_library_active ON leadership_library(is_active);
CREATE INDEX idx_leadership_library_added_at ON leadership_library(added_at DESC);

-- Create book_assignments table (track who's been assigned which books)
CREATE TABLE IF NOT EXISTS book_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES leadership_library(id) ON DELETE CASCADE,
  practice_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Assignment details
  assigned_by UUID REFERENCES practice_members(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date DATE,
  
  -- Progress tracking
  status VARCHAR(50) DEFAULT 'assigned', -- assigned, in_progress, completed, skipped
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Feedback
  member_rating INTEGER CHECK (member_rating BETWEEN 1 AND 5),
  member_notes TEXT,
  key_learnings TEXT[],
  
  -- Integration with development plan
  linked_to_skill_id UUID,
  linked_to_cpd_activity UUID REFERENCES cpd_activities(id),
  
  UNIQUE(book_id, practice_member_id)
);

-- Create indexes for book_assignments
CREATE INDEX idx_book_assignments_member ON book_assignments(practice_member_id);
CREATE INDEX idx_book_assignments_status ON book_assignments(status);
CREATE INDEX idx_book_assignments_book ON book_assignments(book_id);

-- Create updated_at trigger
CREATE TRIGGER update_leadership_library_updated_at 
  BEFORE UPDATE ON leadership_library 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for recommended books per member
CREATE OR REPLACE VIEW member_book_recommendations AS
SELECT 
  pm.id as member_id,
  pm.name as member_name,
  pm.role,
  lb.id as book_id,
  lb.title,
  lb.author,
  lb.cover_image_path,
  lb.short_summary,
  lb.primary_category,
  lb.recommended_reading_time_hours,
  COALESCE(ba.status, 'not_assigned') as assignment_status,
  ba.assigned_at,
  ba.due_date
FROM practice_members pm
CROSS JOIN leadership_library lb
LEFT JOIN book_assignments ba ON ba.book_id = lb.id AND ba.practice_member_id = pm.id
WHERE lb.is_active = true
  AND pm.is_active = true;

-- RLS Policies
ALTER TABLE leadership_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_assignments ENABLE ROW LEVEL SECURITY;

-- Leadership library - all authenticated users can view
CREATE POLICY "Users can view active books"
ON leadership_library FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins can manage books
CREATE POLICY "Admins can manage books"
ON leadership_library FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM practice_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.permission_role IN ('admin', 'partner')
  )
);

-- Book assignments - users can view their own
CREATE POLICY "Users can view their assignments"
ON book_assignments FOR SELECT
TO authenticated
USING (
  practice_member_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
);

-- Managers can view team assignments
CREATE POLICY "Managers can view team assignments"
ON book_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM practice_members pm1
    JOIN practice_members pm2 ON pm1.practice_id = pm2.practice_id
    WHERE pm1.user_id = auth.uid()
    AND pm2.id = book_assignments.practice_member_id
    AND pm1.permission_role IN ('admin', 'partner', 'director', 'manager')
  )
);

-- Managers can assign books
CREATE POLICY "Managers can assign books"
ON book_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_members pm1
    JOIN practice_members pm2 ON pm1.practice_id = pm2.practice_id
    WHERE pm1.user_id = auth.uid()
    AND pm2.id = book_assignments.practice_member_id
    AND pm1.permission_role IN ('admin', 'partner', 'director', 'manager')
  )
);

-- Users can update their own assignment progress
CREATE POLICY "Users can update their assignments"
ON book_assignments FOR UPDATE
TO authenticated
USING (
  practice_member_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
);

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM pg_tables 
  WHERE tablename IN ('leadership_library', 'book_assignments');
  
  IF table_count = 2 THEN
    RAISE NOTICE '✅ Leadership Library tables created successfully';
    RAISE NOTICE '📚 Ready to add books!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Add book cover images to: public/images/leadership-library/';
    RAISE NOTICE '2. Insert book data using the provided JSON format';
    RAISE NOTICE '3. Access via: /accountancy/team?tab=resources → Leadership Library';
  ELSE
    RAISE NOTICE '❌ Failed to create Leadership Library tables';
  END IF;
END $$;


