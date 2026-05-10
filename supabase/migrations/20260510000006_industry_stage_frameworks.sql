-- Link valuation frameworks to industry x stage with weights
BEGIN;

CREATE TABLE IF NOT EXISTS industry_stage_frameworks (
  industry_code TEXT NOT NULL REFERENCES industries(code) ON DELETE CASCADE,
  business_stage TEXT NOT NULL,
  framework_code TEXT NOT NULL REFERENCES valuation_frameworks(code) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  weight NUMERIC,
  display_order INTEGER,
  PRIMARY KEY (industry_code, business_stage, framework_code)
);

ALTER TABLE industry_stage_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read industry_stage_frameworks" ON industry_stage_frameworks
  FOR SELECT USING (auth.role() = 'authenticated');

INSERT INTO industry_stage_frameworks (industry_code, business_stage, framework_code, is_primary, weight, display_order) VALUES
  ('SAAS_REGTECH','pre_revenue','BERKUS',false,0.20,1),
  ('SAAS_REGTECH','pre_revenue','SCORECARD',true,0.30,2),
  ('SAAS_REGTECH','pre_revenue','RISK_FACTOR_SUMMATION',false,0.20,3),
  ('SAAS_REGTECH','pre_revenue','VC_METHOD',true,0.20,4),
  ('SAAS_REGTECH','pre_revenue','COMPARABLE_ROUNDS',true,0.10,5),
  ('SAAS_REGTECH','early_revenue','VC_METHOD',true,0.30,1),
  ('SAAS_REGTECH','early_revenue','COMPARABLE_ROUNDS',true,0.40,2),
  ('SAAS_REGTECH','early_revenue','SCORECARD',false,0.20,3),
  ('SAAS_REGTECH','early_revenue','FIRST_CHICAGO',false,0.10,4)
ON CONFLICT DO NOTHING;

COMMIT;
