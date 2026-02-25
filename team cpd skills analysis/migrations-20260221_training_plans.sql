-- ============================================================================
-- TRAINING PLANS & MODULES
-- ============================================================================
-- Tables for training plans and modules linked to skills. Replaces hardcoded
-- sample data in TrainingPlansPage. Modules can link completion to CPD records.
-- ============================================================================
-- Depends on: 20260221_cpd_records.sql (training_modules.cpd_record_id)

CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id),
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  skill_ids UUID[] NOT NULL DEFAULT '{}',
  service_line_id TEXT,
  target_level INTEGER CHECK (target_level BETWEEN 1 AND 5),
  current_progress INTEGER DEFAULT 0 CHECK (current_progress BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'completed', 'paused', 'cancelled'
  )),
  start_date DATE,
  target_date DATE,
  created_by UUID REFERENCES practice_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  module_type TEXT NOT NULL CHECK (module_type IN (
    'video', 'reading', 'exercise', 'assessment', 'workshop', 'on_the_job',
    'shadowing', 'mentoring', 'client_delivery'
  )),
  duration_hours NUMERIC(5,2) NOT NULL DEFAULT 1,
  skill_category TEXT CHECK (skill_category IN (
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
  resource_url TEXT,
  sort_order INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  cpd_record_id UUID REFERENCES cpd_records(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_plans_practice_id ON training_plans(practice_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_member_id ON training_plans(member_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_status ON training_plans(status);
CREATE INDEX IF NOT EXISTS idx_training_modules_plan_id ON training_modules(training_plan_id);
CREATE INDEX IF NOT EXISTS idx_training_modules_cpd_record_id ON training_modules(cpd_record_id);

-- updated_at trigger (reuse function from 20260221_cpd_records)
DROP TRIGGER IF EXISTS training_plans_updated_at ON training_plans;
CREATE TRIGGER training_plans_updated_at
  BEFORE UPDATE ON training_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;

-- training_plans: practice staff can view all plans in their practice
CREATE POLICY "training_plans_select_staff" ON training_plans
  FOR SELECT USING (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
    )
  );

CREATE POLICY "training_plans_insert_staff" ON training_plans
  FOR INSERT WITH CHECK (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
    )
  );

CREATE POLICY "training_plans_update_staff" ON training_plans
  FOR UPDATE USING (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
    )
  );

CREATE POLICY "training_plans_delete_admin" ON training_plans
  FOR DELETE USING (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'owner')
    )
  );

-- training_modules: practice staff can view modules for plans in their practice
CREATE POLICY "training_modules_select_staff" ON training_modules
  FOR SELECT USING (
    training_plan_id IN (
      SELECT tp.id FROM training_plans tp
      JOIN practice_members pm ON pm.practice_id = tp.practice_id AND pm.user_id = auth.uid()
      WHERE pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner')
    )
  );

CREATE POLICY "training_modules_insert_staff" ON training_modules
  FOR INSERT WITH CHECK (
    training_plan_id IN (
      SELECT tp.id FROM training_plans tp
      JOIN practice_members pm ON pm.practice_id = tp.practice_id AND pm.user_id = auth.uid()
      WHERE pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner')
    )
  );

CREATE POLICY "training_modules_update_staff" ON training_modules
  FOR UPDATE USING (
    training_plan_id IN (
      SELECT tp.id FROM training_plans tp
      JOIN practice_members pm ON pm.practice_id = tp.practice_id AND pm.user_id = auth.uid()
      WHERE pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner')
    )
  );

CREATE POLICY "training_modules_delete_admin" ON training_modules
  FOR DELETE USING (
    training_plan_id IN (
      SELECT tp.id FROM training_plans tp
      JOIN practice_members pm ON pm.practice_id = tp.practice_id AND pm.user_id = auth.uid()
      WHERE pm.role IN ('admin', 'owner')
    )
  );

COMMENT ON TABLE training_plans IS 'Development plans targeting skills; links to training_modules';
COMMENT ON TABLE training_modules IS 'Individual modules within a plan; can link completion to CPD via cpd_record_id';
