-- ============================================================================
-- FIX: Ensure ma_engagements table has all required columns
-- ============================================================================

-- First, ensure the table exists with all columns
-- If it doesn't exist, create it fresh
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ma_engagements') THEN
    CREATE TABLE ma_engagements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES practice_members(id) NOT NULL,
      practice_id UUID REFERENCES practices(id) NOT NULL,
      tier VARCHAR(20) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
      frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly')),
      monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
      start_date DATE NOT NULL DEFAULT CURRENT_DATE,
      end_date DATE,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'cancelled')),
      onboarding_completed_at TIMESTAMPTZ,
      xero_connected BOOLEAN DEFAULT FALSE,
      qbo_connected BOOLEAN DEFAULT FALSE,
      default_tuesday_question TEXT,
      assigned_to UUID REFERENCES practice_members(id),
      reviewer_id UUID REFERENCES practice_members(id),
      financial_year_end_month INTEGER CHECK (financial_year_end_month BETWEEN 1 AND 12),
      vat_registered BOOLEAN DEFAULT FALSE,
      vat_quarter_end_month INTEGER CHECK (vat_quarter_end_month BETWEEN 1 AND 12),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id)
    );
  END IF;
END $$;

-- Add missing columns if table already existed but incomplete
DO $$
BEGIN
  -- Add assigned_to if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'assigned_to') THEN
    ALTER TABLE ma_engagements ADD COLUMN assigned_to UUID REFERENCES practice_members(id);
  END IF;
  
  -- Add reviewer_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'reviewer_id') THEN
    ALTER TABLE ma_engagements ADD COLUMN reviewer_id UUID REFERENCES practice_members(id);
  END IF;
  
  -- Add practice_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'practice_id') THEN
    ALTER TABLE ma_engagements ADD COLUMN practice_id UUID REFERENCES practices(id);
  END IF;
  
  -- Add tier if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'tier') THEN
    ALTER TABLE ma_engagements ADD COLUMN tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'));
  END IF;
  
  -- Add frequency if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'frequency') THEN
    ALTER TABLE ma_engagements ADD COLUMN frequency VARCHAR(20) DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly'));
  END IF;
  
  -- Add monthly_fee if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'monthly_fee') THEN
    ALTER TABLE ma_engagements ADD COLUMN monthly_fee DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Add start_date if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'start_date') THEN
    ALTER TABLE ma_engagements ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
  END IF;
  
  -- Add status if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'status') THEN
    ALTER TABLE ma_engagements ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'cancelled'));
  END IF;
  
  -- Add onboarding_completed_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'onboarding_completed_at') THEN
    ALTER TABLE ma_engagements ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
  END IF;
  
  -- Add xero_connected if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'xero_connected') THEN
    ALTER TABLE ma_engagements ADD COLUMN xero_connected BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add qbo_connected if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'qbo_connected') THEN
    ALTER TABLE ma_engagements ADD COLUMN qbo_connected BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add default_tuesday_question if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'default_tuesday_question') THEN
    ALTER TABLE ma_engagements ADD COLUMN default_tuesday_question TEXT;
  END IF;
  
  -- Add financial_year_end_month if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'financial_year_end_month') THEN
    ALTER TABLE ma_engagements ADD COLUMN financial_year_end_month INTEGER CHECK (financial_year_end_month BETWEEN 1 AND 12);
  END IF;
  
  -- Add vat_registered if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'vat_registered') THEN
    ALTER TABLE ma_engagements ADD COLUMN vat_registered BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add vat_quarter_end_month if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'vat_quarter_end_month') THEN
    ALTER TABLE ma_engagements ADD COLUMN vat_quarter_end_month INTEGER CHECK (vat_quarter_end_month BETWEEN 1 AND 12);
  END IF;
  
  -- Add timestamps if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'created_at') THEN
    ALTER TABLE ma_engagements ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'updated_at') THEN
    ALTER TABLE ma_engagements ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'created_by') THEN
    ALTER TABLE ma_engagements ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ma_engagements' AND column_name = 'end_date') THEN
    ALTER TABLE ma_engagements ADD COLUMN end_date DATE;
  END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_ma_engagements_client ON ma_engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_ma_engagements_practice ON ma_engagements(practice_id);
CREATE INDEX IF NOT EXISTS idx_ma_engagements_status ON ma_engagements(status);
CREATE INDEX IF NOT EXISTS idx_ma_engagements_assigned ON ma_engagements(assigned_to);

-- Enable RLS
ALTER TABLE ma_engagements ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (safe to run multiple times)
DROP POLICY IF EXISTS "Practice members can view engagements" ON ma_engagements;
DROP POLICY IF EXISTS "Practice members can insert engagements" ON ma_engagements;
DROP POLICY IF EXISTS "Practice members can update engagements" ON ma_engagements;

CREATE POLICY "Practice members can view engagements"
ON ma_engagements FOR SELECT
TO authenticated
USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Practice members can insert engagements"
ON ma_engagements FOR INSERT
TO authenticated
WITH CHECK (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Practice members can update engagements"
ON ma_engagements FOR UPDATE
TO authenticated
USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

-- Now recreate the views
DROP VIEW IF EXISTS ma_engagement_summary;
DROP VIEW IF EXISTS ma_period_summary;

CREATE OR REPLACE VIEW ma_engagement_summary AS
SELECT 
  e.id,
  e.client_id,
  pm.name AS client_name,
  pm.client_company,
  e.practice_id,
  e.tier,
  e.frequency,
  e.monthly_fee,
  e.status,
  e.start_date,
  e.assigned_to,
  assignee.name AS assigned_to_name,
  -- Current period info
  cp.id AS current_period_id,
  cp.period_label AS current_period_label,
  cp.status AS current_period_status,
  cp.due_date AS current_period_due_date,
  -- Counts
  (SELECT COUNT(*) FROM ma_periods WHERE engagement_id = e.id) AS total_periods,
  (SELECT COUNT(*) FROM ma_periods WHERE engagement_id = e.id AND status = 'delivered') AS delivered_periods
FROM ma_engagements e
LEFT JOIN practice_members pm ON e.client_id = pm.id
LEFT JOIN practice_members assignee ON e.assigned_to = assignee.id
LEFT JOIN LATERAL (
  SELECT * FROM ma_periods 
  WHERE engagement_id = e.id 
  ORDER BY period_end DESC 
  LIMIT 1
) cp ON true;

CREATE OR REPLACE VIEW ma_period_summary AS
SELECT 
  p.id,
  p.engagement_id,
  p.period_label,
  p.period_start,
  p.period_end,
  p.status,
  p.due_date,
  p.delivered_at,
  p.tuesday_question,
  p.tuesday_answer,
  e.tier,
  e.client_id,
  pm.name AS client_name,
  -- Financial summary
  fd.revenue,
  fd.net_profit,
  fd.true_cash,
  fd.true_cash_runway_months,
  -- KPI summary
  (SELECT COUNT(*) FROM ma_kpi_tracking kt WHERE kt.engagement_id = p.engagement_id AND kt.period_end = p.period_end) AS kpi_count,
  (SELECT COUNT(*) FROM ma_kpi_tracking kt WHERE kt.engagement_id = p.engagement_id AND kt.period_end = p.period_end AND kt.rag_status = 'red') AS red_kpis,
  -- Insight summary
  (SELECT COUNT(*) FROM ma_insights i WHERE i.period_id = p.id) AS insight_count,
  (SELECT COUNT(*) FROM ma_insights i WHERE i.period_id = p.id AND i.insight_type = 'action_required') AS action_required_count
FROM ma_periods p
JOIN ma_engagements e ON p.engagement_id = e.id
LEFT JOIN practice_members pm ON e.client_id = pm.id
LEFT JOIN ma_financial_data fd ON fd.period_id = p.id;

