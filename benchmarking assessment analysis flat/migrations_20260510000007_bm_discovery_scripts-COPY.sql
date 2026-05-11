-- Registry-driven discovery scripts per industry x stage
BEGIN;

CREATE TABLE IF NOT EXISTS bm_discovery_scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_code TEXT REFERENCES industries(code),
  business_stage TEXT NOT NULL CHECK (business_stage IN ('pre_revenue','early_revenue','growth','operating','mature')),
  section_title TEXT NOT NULL,
  section_order INTEGER NOT NULL,
  questions JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bm_discovery_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read bm_discovery_scripts" ON bm_discovery_scripts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Seed default pre-revenue discovery script sections
INSERT INTO bm_discovery_scripts (industry_code, business_stage, section_title, section_order, questions, is_default) VALUES
(NULL, 'pre_revenue', 'Exit and Trajectory', 1,
 '[{"purpose":"Establish the North Star","question":"What is your target exit valuation and timeline?","followUp":"What does that mean for your equity at current ownership after dilution?"},{"purpose":"Required ARR path","question":"If we hit 10x ARR at exit, walk me through years 1-7: what is plausible, what is a stretch?","followUp":"Rough headcount plan to support that ARR?"},{"purpose":"Founder conviction check","question":"What makes you confident this target is engineering, not aspiration?","followUp":"What would make you revise it downward?"}]'::jsonb,
 true),
(NULL, 'pre_revenue', 'Pipeline and Conversion', 2,
 '[{"purpose":"Pipeline quality","question":"Of your qualified pipeline, how much is signed LOI vs verbal vs active discussion?","followUp":"What is the longest-hanging deal and why has it not closed?"},{"purpose":"Conversion evidence","question":"What conversion rate are you modelling and what evidence supports it?","followUp":"Beyond the current top 3, what is the next 3-month wave?"},{"purpose":"First revenue ETA","question":"When do you expect first contracted revenue?","followUp":"What needs to happen between now and then?"}]'::jsonb,
 true),
(NULL, 'pre_revenue', 'Structure and Readiness', 3,
 '[{"purpose":"Tax structuring","question":"Have you explored Family Investment Companies or holdco structuring while the company has nil value?","followUp":"Any dormant entities that need dissolving?"},{"purpose":"IP location","question":"Where does IP currently sit? Same entity as trading?","followUp":"Has anyone reviewed the IP ownership for investment structuring?"},{"purpose":"Cap table and governance","question":"Walk me through the cap table today and post-close. Where do EIS investors sit?","followUp":"Who is on the board after the close? Any NED candidates?"},{"purpose":"Data room","question":"How complete is your data room? What are the biggest gaps?","followUp":"Is corporate structure clean enough for due diligence?"}]'::jsonb,
 true);

COMMIT;
