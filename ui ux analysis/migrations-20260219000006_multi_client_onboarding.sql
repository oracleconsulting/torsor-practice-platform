-- ============================================================================
-- 4D: MULTI-CLIENT ONBOARDING
-- ============================================================================
-- Batch enrollment, enrollment pipeline tracking, sprint templates
-- ============================================================================

-- 1. Sprint Templates (create first — enrollment_entries references it)
CREATE TABLE IF NOT EXISTS sprint_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('exit', 'scaling', 'lifestyle', 'turnaround', 'startup', 'general')),

  template_data JSONB NOT NULL DEFAULT '{}',

  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES practice_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sprint_templates_practice
  ON sprint_templates(practice_id, is_active);

ALTER TABLE sprint_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practice can manage templates" ON sprint_templates;
CREATE POLICY "Practice can manage templates"
  ON sprint_templates FOR ALL
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

COMMENT ON TABLE sprint_templates IS
  'Pre-built sprint structure templates for common client types. Templates guide LLM generation — they do not replace personalisation.';


-- 2. Enrollment Batches
CREATE TABLE IF NOT EXISTS enrollment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES practice_members(id),

  name TEXT NOT NULL,
  description TEXT,
  services TEXT[] NOT NULL DEFAULT '{}',
  default_tier TEXT,
  default_advisor_id UUID REFERENCES practice_members(id),
  sprint_start_date DATE,

  total_clients INTEGER DEFAULT 0,
  invited_count INTEGER DEFAULT 0,
  registered_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'active', 'complete', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_batches_practice
  ON enrollment_batches(practice_id, status);

ALTER TABLE enrollment_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practice can manage batches" ON enrollment_batches;
CREATE POLICY "Practice can manage batches"
  ON enrollment_batches FOR ALL
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

COMMENT ON TABLE enrollment_batches IS
  'Batch enrollment groups. Tracks progress through the onboarding funnel.';


-- 3. Enrollment Entries (individual clients within a batch)
CREATE TABLE IF NOT EXISTS enrollment_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES enrollment_batches(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,

  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_company TEXT,
  client_industry TEXT,
  client_stage TEXT,

  practice_member_id UUID REFERENCES practice_members(id),
  assigned_advisor_id UUID REFERENCES practice_members(id),
  tier_name TEXT,
  advisor_notes TEXT,
  template_id UUID REFERENCES sprint_templates(id),

  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'invited', 'registered', 'assessment_started',
    'assessment_complete', 'generating', 'review_pending', 'published', 'failed'
  )),

  invited_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  assessment_started_at TIMESTAMPTZ,
  assessment_completed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_reminder_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  failure_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_entries_batch
  ON enrollment_entries(batch_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollment_entries_member
  ON enrollment_entries(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_entries_practice
  ON enrollment_entries(practice_id, status);

ALTER TABLE enrollment_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practice can manage entries" ON enrollment_entries;
CREATE POLICY "Practice can manage entries"
  ON enrollment_entries FOR ALL
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

COMMENT ON TABLE enrollment_entries IS
  'Individual client enrollment within a batch. Tracks: pending → invited → registered → assessment → generating → review → published.';


-- 4. Update trigger for batch counters
CREATE OR REPLACE FUNCTION update_enrollment_batch_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE enrollment_batches SET
    total_clients = (SELECT COUNT(*) FROM enrollment_entries WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id)),
    invited_count = (SELECT COUNT(*) FROM enrollment_entries WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id) AND status != 'pending'),
    registered_count = (SELECT COUNT(*) FROM enrollment_entries WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id) AND status NOT IN ('pending', 'invited')),
    completed_count = (SELECT COUNT(*) FROM enrollment_entries WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id) AND status = 'published'),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.batch_id, OLD.batch_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollment_batch_counts ON enrollment_entries;
CREATE TRIGGER trg_enrollment_batch_counts
  AFTER INSERT OR UPDATE OR DELETE ON enrollment_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_batch_counts();
