-- =====================================================
-- CPD CONFIGURATION SYSTEM
-- Allows admins to set practice-wide CPD requirements
-- =====================================================

-- ============================================
-- 1. ADD CPD CONFIGURATION TO PRACTICES
-- ============================================

ALTER TABLE practices 
ADD COLUMN IF NOT EXISTS cpd_total_expected_hours INT DEFAULT 40,
ADD COLUMN IF NOT EXISTS cpd_determined_hours INT DEFAULT 20,
ADD COLUMN IF NOT EXISTS cpd_self_allocated_hours INT DEFAULT 20,
ADD COLUMN IF NOT EXISTS cpd_year_start_month INT DEFAULT 1 CHECK (cpd_year_start_month BETWEEN 1 AND 12),
ADD COLUMN IF NOT EXISTS cpd_tracking_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cpd_settings JSONB DEFAULT '{
  "require_evidence": true,
  "allow_carryover": false,
  "carryover_max_hours": 10,
  "reminder_frequency_days": 30,
  "quarterly_review": true
}'::jsonb;

COMMENT ON COLUMN practices.cpd_total_expected_hours IS 'Total CPD hours expected per year';
COMMENT ON COLUMN practices.cpd_determined_hours IS 'Hours set by practice (structured learning)';
COMMENT ON COLUMN practices.cpd_self_allocated_hours IS 'Hours chosen by team member (self-directed)';
COMMENT ON COLUMN practices.cpd_year_start_month IS 'Month CPD year starts (1=Jan, 7=Jul)';
COMMENT ON COLUMN practices.cpd_settings IS 'Additional CPD tracking settings';

-- ============================================
-- 2. ADD CPD TRACKING TO PRACTICE MEMBERS
-- ============================================

ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS cpd_completed_hours INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpd_determined_completed INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpd_self_allocated_completed INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpd_year_start_date DATE,
ADD COLUMN IF NOT EXISTS cpd_exempt BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cpd_notes TEXT;

COMMENT ON COLUMN practice_members.cpd_completed_hours IS 'Total CPD hours completed this year';
COMMENT ON COLUMN practice_members.cpd_determined_completed IS 'Determined CPD hours completed';
COMMENT ON COLUMN practice_members.cpd_self_allocated_completed IS 'Self-allocated CPD hours completed';
COMMENT ON COLUMN practice_members.cpd_exempt IS 'Whether member is exempt from CPD requirements';

CREATE INDEX IF NOT EXISTS idx_practice_members_cpd_year ON practice_members(cpd_year_start_date);

-- ============================================
-- 3. ENHANCE CPD TRACKER TABLE
-- ============================================

-- Check if cpd_tracker table exists, if not create it
CREATE TABLE IF NOT EXISTS cpd_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_title VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'course', 'seminar', 'webinar', 'conference', 
    'reading', 'self_study', 'mentoring', 'other'
  )),
  activity_category VARCHAR(20) NOT NULL CHECK (activity_category IN ('determined', 'self_allocated')),
  
  -- Hours
  hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
  
  -- Dates
  activity_date DATE NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evidence
  provider VARCHAR(255),
  description TEXT,
  evidence_url TEXT,
  certificate_url TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  tags TEXT[],
  skills_practiced TEXT[],
  reflection TEXT
);

-- Add columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cpd_tracker' 
                   AND column_name = 'activity_category') THEN
        ALTER TABLE cpd_tracker ADD COLUMN activity_category VARCHAR(20) DEFAULT 'self_allocated';
        ALTER TABLE cpd_tracker ADD CONSTRAINT cpd_tracker_category_check 
          CHECK (activity_category IN ('determined', 'self_allocated'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cpd_tracker' 
                   AND column_name = 'verified') THEN
        ALTER TABLE cpd_tracker ADD COLUMN verified BOOLEAN DEFAULT false;
        ALTER TABLE cpd_tracker ADD COLUMN verified_by UUID REFERENCES auth.users(id);
        ALTER TABLE cpd_tracker ADD COLUMN verified_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cpd_tracker_member ON cpd_tracker(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_cpd_tracker_date ON cpd_tracker(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_cpd_tracker_category ON cpd_tracker(activity_category);

COMMENT ON TABLE cpd_tracker IS 'CPD activity tracking with determined vs self-allocated categorization';

-- ============================================
-- 4. CPD PROGRESS VIEW
-- ============================================

CREATE OR REPLACE VIEW cpd_progress_view AS
SELECT 
  pm.id as practice_member_id,
  pm.practice_id,
  p.cpd_total_expected_hours,
  p.cpd_determined_hours,
  p.cpd_self_allocated_hours,
  
  -- Completed hours
  COALESCE(SUM(CASE WHEN ct.activity_category = 'determined' THEN ct.hours ELSE 0 END), 0) as determined_completed,
  COALESCE(SUM(CASE WHEN ct.activity_category = 'self_allocated' THEN ct.hours ELSE 0 END), 0) as self_allocated_completed,
  COALESCE(SUM(ct.hours), 0) as total_completed,
  
  -- Progress percentages
  ROUND(
    (COALESCE(SUM(CASE WHEN ct.activity_category = 'determined' THEN ct.hours ELSE 0 END), 0) / 
    NULLIF(p.cpd_determined_hours, 0)) * 100, 
    1
  ) as determined_progress_pct,
  
  ROUND(
    (COALESCE(SUM(CASE WHEN ct.activity_category = 'self_allocated' THEN ct.hours ELSE 0 END), 0) / 
    NULLIF(p.cpd_self_allocated_hours, 0)) * 100, 
    1
  ) as self_allocated_progress_pct,
  
  ROUND(
    (COALESCE(SUM(ct.hours), 0) / NULLIF(p.cpd_total_expected_hours, 0)) * 100, 
    1
  ) as total_progress_pct,
  
  -- Remaining hours
  GREATEST(0, p.cpd_determined_hours - COALESCE(SUM(CASE WHEN ct.activity_category = 'determined' THEN ct.hours ELSE 0 END), 0)) as determined_remaining,
  GREATEST(0, p.cpd_self_allocated_hours - COALESCE(SUM(CASE WHEN ct.activity_category = 'self_allocated' THEN ct.hours ELSE 0 END), 0)) as self_allocated_remaining,
  GREATEST(0, p.cpd_total_expected_hours - COALESCE(SUM(ct.hours), 0)) as total_remaining,
  
  -- Status
  CASE 
    WHEN COALESCE(SUM(ct.hours), 0) >= p.cpd_total_expected_hours THEN 'complete'
    WHEN COALESCE(SUM(ct.hours), 0) >= p.cpd_total_expected_hours * 0.75 THEN 'on_track'
    WHEN COALESCE(SUM(ct.hours), 0) >= p.cpd_total_expected_hours * 0.5 THEN 'attention'
    ELSE 'behind'
  END as status,
  
  -- Counts
  COUNT(ct.id) as activity_count,
  COUNT(CASE WHEN ct.verified = true THEN 1 END) as verified_count
  
FROM practice_members pm
JOIN practices p ON pm.practice_id = p.id
LEFT JOIN cpd_tracker ct ON pm.id = ct.practice_member_id 
  AND EXTRACT(YEAR FROM ct.activity_date) = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE pm.cpd_exempt = false
GROUP BY 
  pm.id, pm.practice_id, 
  p.cpd_total_expected_hours, 
  p.cpd_determined_hours, 
  p.cpd_self_allocated_hours;

COMMENT ON VIEW cpd_progress_view IS 'Real-time CPD progress for all practice members';

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to get practice CPD summary
CREATE OR REPLACE FUNCTION get_practice_cpd_summary(p_practice_id UUID)
RETURNS TABLE (
  total_members BIGINT,
  on_track BIGINT,
  behind BIGINT,
  complete BIGINT,
  avg_completion_pct DECIMAL,
  total_hours_logged DECIMAL,
  avg_hours_per_member DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_members,
    COUNT(CASE WHEN status IN ('complete', 'on_track') THEN 1 END)::BIGINT as on_track,
    COUNT(CASE WHEN status IN ('behind', 'attention') THEN 1 END)::BIGINT as behind,
    COUNT(CASE WHEN status = 'complete' THEN 1 END)::BIGINT as complete,
    ROUND(AVG(total_progress_pct), 1) as avg_completion_pct,
    SUM(total_completed) as total_hours_logged,
    ROUND(AVG(total_completed), 1) as avg_hours_per_member
  FROM cpd_progress_view
  WHERE practice_id = p_practice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log CPD activity
CREATE OR REPLACE FUNCTION log_cpd_activity(
  p_practice_member_id UUID,
  p_activity_title VARCHAR,
  p_activity_type VARCHAR,
  p_activity_category VARCHAR,
  p_hours DECIMAL,
  p_activity_date DATE,
  p_provider VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_evidence_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO cpd_tracker (
    practice_member_id,
    activity_title,
    activity_type,
    activity_category,
    hours,
    activity_date,
    provider,
    description,
    evidence_url
  ) VALUES (
    p_practice_member_id,
    p_activity_title,
    p_activity_type,
    p_activity_category,
    p_hours,
    p_activity_date,
    p_provider,
    p_description,
    p_evidence_url
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE cpd_tracker ENABLE ROW LEVEL SECURITY;

-- Team members can view their own CPD records
CREATE POLICY "Users can view own CPD records"
ON cpd_tracker FOR SELECT
USING (
  practice_member_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
);

-- Team members can manage their own CPD records
CREATE POLICY "Users can manage own CPD records"
ON cpd_tracker FOR ALL
USING (
  practice_member_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
);

-- Practice admins can view all CPD records in their practice
CREATE POLICY "Admins can view practice CPD records"
ON cpd_tracker FOR SELECT
USING (
  practice_member_id IN (
    SELECT pm.id FROM practice_members pm
    WHERE pm.practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- 7. SUMMARY
-- ============================================

SELECT 
  '✅ CPD Configuration System Created!' as status,
  (SELECT cpd_total_expected_hours FROM practices LIMIT 1) as default_total_hours,
  (SELECT cpd_determined_hours FROM practices LIMIT 1) as default_determined_hours,
  (SELECT cpd_self_allocated_hours FROM practices LIMIT 1) as default_self_allocated_hours,
  'Practices can now configure CPD requirements' as note;


