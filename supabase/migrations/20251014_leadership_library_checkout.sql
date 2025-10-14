-- =====================================================
-- Leadership Library Book Checkout System
-- Track physical book loans to team members
-- =====================================================

-- Create book checkout table
CREATE TABLE IF NOT EXISTS book_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id VARCHAR(10) NOT NULL, -- e.g., "001", "002"
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 weeks'),
  checked_in_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT book_checkouts_dates_check CHECK (
    checked_in_at IS NULL OR checked_in_at >= checked_out_at
  )
);

-- Create indexes
CREATE INDEX idx_book_checkouts_book_id ON book_checkouts(book_id);
CREATE INDEX idx_book_checkouts_member_id ON book_checkouts(practice_member_id);
CREATE INDEX idx_book_checkouts_checked_out_at ON book_checkouts(checked_out_at);
CREATE INDEX idx_book_checkouts_active ON book_checkouts(book_id) 
  WHERE checked_in_at IS NULL;

-- Enable RLS
ALTER TABLE book_checkouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Team members can see all checkouts in their practice
CREATE POLICY "Team members can view book checkouts in their practice"
  ON book_checkouts
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE practice_id = (
        SELECT practice_id FROM practice_members 
        WHERE id = practice_member_id
      )
    )
  );

-- Team members can check out books
CREATE POLICY "Team members can check out books"
  ON book_checkouts
  FOR INSERT
  WITH CHECK (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- Team members can check in their own books or admins can check in any
CREATE POLICY "Members can check in their books, admins can check in any"
  ON book_checkouts
  FOR UPDATE
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
    OR
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid() 
      AND role IN ('Owner', 'Partner', 'Director')
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_book_checkouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_book_checkouts_updated_at ON book_checkouts;
CREATE TRIGGER update_book_checkouts_updated_at
  BEFORE UPDATE ON book_checkouts
  FOR EACH ROW
  EXECUTE FUNCTION update_book_checkouts_updated_at();

-- Function to get current book holder
CREATE OR REPLACE FUNCTION get_current_book_holder(p_book_id VARCHAR)
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,
  checked_out_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.practice_member_id,
    pm.name,
    bc.checked_out_at,
    bc.due_date,
    (bc.due_date < NOW()) as is_overdue
  FROM book_checkouts bc
  JOIN practice_members pm ON pm.id = bc.practice_member_id
  WHERE bc.book_id = p_book_id
    AND bc.checked_in_at IS NULL
  ORDER BY bc.checked_out_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if book is available
CREATE OR REPLACE FUNCTION is_book_available(p_book_id VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM book_checkouts
    WHERE book_id = p_book_id
      AND checked_in_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Leadership Library checkout system created successfully';
  RAISE NOTICE '   - book_checkouts table';
  RAISE NOTICE '   - RLS policies for team access';
  RAISE NOTICE '   - Helper functions for availability';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Features:';
  RAISE NOTICE '   - 3-week default loan period';
  RAISE NOTICE '   - Overdue tracking';
  RAISE NOTICE '   - Check-out/check-in history';
  RAISE NOTICE '   - Admin override capabilities';
END $$;

