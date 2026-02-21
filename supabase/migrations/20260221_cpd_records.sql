-- ============================================================================
-- CPD RECORDS & TARGETS
-- ============================================================================
-- Tables for tracking Continuing Professional Development activities and
-- per-member annual targets. Replaces hardcoded sample data in CPDTrackerPage.
-- ============================================================================

-- Shared trigger function for updated_at (idempotent; may already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Valid skill categories (must match skills table)
CREATE TABLE IF NOT EXISTS cpd_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id),
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'course', 'webinar', 'reading', 'conference', 'mentoring', 'workshop',
    'on_the_job', 'shadowing'
  )),
  title TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  hours NUMERIC(5,2) NOT NULL CHECK (hours > 0),
  date_completed DATE NOT NULL,
  skill_category TEXT NOT NULL CHECK (skill_category IN (
    'Advisory & Consulting',
    'Client Management & Development',
    'Communication & Presentation',
    'Financial Analysis & Reporting',
    'Financial Planning',
    'Leadership & Management',
    'Personal Effectiveness',
    'Software & Technical',
    'Tax & Compliance',
    'Working Capital & Business Finance'
  )),
  skill_ids UUID[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES practice_members(id),
  verified_at TIMESTAMPTZ,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cpd_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id),
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  target_hours NUMERIC(5,2) NOT NULL DEFAULT 40,
  category_targets JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cpd_records_practice_id ON cpd_records(practice_id);
CREATE INDEX IF NOT EXISTS idx_cpd_records_member_id ON cpd_records(member_id);
CREATE INDEX IF NOT EXISTS idx_cpd_records_date_completed ON cpd_records(date_completed);
CREATE INDEX IF NOT EXISTS idx_cpd_records_skill_category ON cpd_records(skill_category);
CREATE INDEX IF NOT EXISTS idx_cpd_targets_member_year ON cpd_targets(member_id, year);

-- Trigger for cpd_records.updated_at
DROP TRIGGER IF EXISTS cpd_records_updated_at ON cpd_records;
CREATE TRIGGER cpd_records_updated_at
  BEFORE UPDATE ON cpd_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE cpd_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpd_targets ENABLE ROW LEVEL SECURITY;

-- cpd_records: practice staff can view all records in their practice
CREATE POLICY "cpd_records_select_staff" ON cpd_records
  FOR SELECT USING (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
    )
  );

-- cpd_records: practice staff can insert (practice_id must match)
CREATE POLICY "cpd_records_insert_staff" ON cpd_records
  FOR INSERT WITH CHECK (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
    )
  );

-- cpd_records: practice staff can update records in their practice
CREATE POLICY "cpd_records_update_staff" ON cpd_records
  FOR UPDATE USING (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
    )
  );

-- cpd_records: only admin/owner can delete
CREATE POLICY "cpd_records_delete_admin" ON cpd_records
  FOR DELETE USING (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'owner')
    )
  );

-- cpd_targets: practice staff can view targets for their practice
CREATE POLICY "cpd_targets_select_staff" ON cpd_targets
  FOR SELECT USING (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
    )
  );

-- cpd_targets: only admin/owner can insert
CREATE POLICY "cpd_targets_insert_admin" ON cpd_targets
  FOR INSERT WITH CHECK (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'owner')
    )
  );

-- cpd_targets: only admin/owner can update
CREATE POLICY "cpd_targets_update_admin" ON cpd_targets
  FOR UPDATE USING (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'owner')
    )
  );

-- cpd_targets: only admin/owner can delete
CREATE POLICY "cpd_targets_delete_admin" ON cpd_targets
  FOR DELETE USING (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'owner')
    )
  );

COMMENT ON TABLE cpd_records IS 'CPD activities completed by practice members';
COMMENT ON TABLE cpd_targets IS 'Per-member annual CPD hour targets';
