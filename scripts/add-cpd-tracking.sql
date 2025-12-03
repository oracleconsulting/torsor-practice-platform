-- ============================================================================
-- CPD TRACKING TABLES
-- ============================================================================
-- Track Continuing Professional Development for team members
-- ============================================================================

-- CPD Records
CREATE TABLE IF NOT EXISTS cpd_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  member_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type text NOT NULL CHECK (activity_type IN ('course', 'webinar', 'reading', 'conference', 'mentoring', 'other')),
  title text NOT NULL,
  provider text,
  description text,
  
  -- Hours and dates
  hours numeric(5,2) NOT NULL,
  date_completed date NOT NULL,
  
  -- Categorization
  category text NOT NULL CHECK (category IN ('technical', 'ethics', 'business', 'leadership', 'industry')),
  
  -- Verification
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES practice_members(id),
  verified_at timestamptz,
  certificate_url text,
  
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CPD Targets (annual targets per member)
CREATE TABLE IF NOT EXISTS cpd_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  member_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
  year int NOT NULL,
  target_hours numeric(5,2) NOT NULL DEFAULT 40,
  
  -- Category breakdown targets (optional)
  technical_hours numeric(5,2),
  ethics_hours numeric(5,2),
  business_hours numeric(5,2),
  leadership_hours numeric(5,2),
  industry_hours numeric(5,2),
  
  created_at timestamptz DEFAULT now(),
  UNIQUE(member_id, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cpd_member ON cpd_records(member_id);
CREATE INDEX IF NOT EXISTS idx_cpd_practice ON cpd_records(practice_id);
CREATE INDEX IF NOT EXISTS idx_cpd_date ON cpd_records(date_completed DESC);
CREATE INDEX IF NOT EXISTS idx_cpd_category ON cpd_records(category);

-- RLS
ALTER TABLE cpd_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpd_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team sees practice CPD" ON cpd_records;
CREATE POLICY "Team sees practice CPD" ON cpd_records
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

DROP POLICY IF EXISTS "Team sees practice CPD targets" ON cpd_targets;
CREATE POLICY "Team sees practice CPD targets" ON cpd_targets
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- View for CPD summary
CREATE OR REPLACE VIEW v_cpd_summary AS
SELECT 
  pm.id as member_id,
  pm.name as member_name,
  pm.practice_id,
  EXTRACT(YEAR FROM CURRENT_DATE)::int as year,
  COALESCE(t.target_hours, 40) as target_hours,
  COALESCE(SUM(r.hours), 0) as completed_hours,
  ROUND((COALESCE(SUM(r.hours), 0) / COALESCE(t.target_hours, 40) * 100)::numeric, 1) as progress_pct,
  COUNT(r.id) as activities_count,
  jsonb_object_agg(
    COALESCE(r.category, 'none'), 
    COALESCE(cat_sum.cat_hours, 0)
  ) FILTER (WHERE r.category IS NOT NULL) as hours_by_category
FROM practice_members pm
LEFT JOIN cpd_targets t ON t.member_id = pm.id AND t.year = EXTRACT(YEAR FROM CURRENT_DATE)
LEFT JOIN cpd_records r ON r.member_id = pm.id AND EXTRACT(YEAR FROM r.date_completed) = EXTRACT(YEAR FROM CURRENT_DATE)
LEFT JOIN LATERAL (
  SELECT category, SUM(hours) as cat_hours
  FROM cpd_records
  WHERE member_id = pm.id AND EXTRACT(YEAR FROM date_completed) = EXTRACT(YEAR FROM CURRENT_DATE)
  GROUP BY category
) cat_sum ON cat_sum.category = r.category
WHERE pm.member_type = 'team'
GROUP BY pm.id, pm.name, pm.practice_id, t.target_hours;

