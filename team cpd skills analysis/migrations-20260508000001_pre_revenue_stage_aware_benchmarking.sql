-- ============================================================================
-- Migration: 20260508_pre_revenue_stage_aware_benchmarking.sql
-- Purpose : Add business-stage awareness to benchmarking, plus knowledge base
--           tables for industry valuation methodology, pre-revenue signals,
--           and valuation frameworks. Seed UK regtech/compliance SaaS data
--           and broader industry valuation registry from research brief.
-- Author  : Torsor / RPGCC
-- Date    : 2026-05-08
-- ============================================================================
-- This migration is additive only. No existing columns are dropped or altered
-- in a way that breaks the current benchmarking pipeline. All new columns are
-- nullable or defaulted so existing engagements keep running unchanged.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1 : ENGAGEMENT-LEVEL STAGE FLAGS
-- ============================================================================

ALTER TABLE bm_engagements
  ADD COLUMN IF NOT EXISTS business_stage TEXT DEFAULT 'operating'
    CHECK (business_stage IN ('pre_revenue', 'early_revenue', 'growth', 'operating', 'mature'));

ALTER TABLE bm_engagements
  ADD COLUMN IF NOT EXISTS exit_horizon_years INTEGER;

ALTER TABLE bm_engagements
  ADD COLUMN IF NOT EXISTS target_exit_valuation NUMERIC;

ALTER TABLE bm_engagements
  ADD COLUMN IF NOT EXISTS target_exit_method TEXT
    CHECK (target_exit_method IN ('EBITDA', 'Revenue', 'ARR', 'GMV', 'SDE', 'NFI', 'GRF', 'rNPV', 'Comparable_Round', 'Berkus_Scorecard'));

ALTER TABLE bm_engagements
  ADD COLUMN IF NOT EXISTS exit_strategy TEXT
    CHECK (exit_strategy IN ('trade_sale', 'pe_buyout', 'ipo', 'mbo', 'lifestyle', 'undecided'));

COMMENT ON COLUMN bm_engagements.business_stage IS 'Business stage drives valuation method, suppressor set, and assessment routing. Defaults to operating so existing engagements behave unchanged.';
COMMENT ON COLUMN bm_engagements.exit_horizon_years IS 'Years to planned exit. Used by VC Method back-solve for pre-revenue engagements.';
COMMENT ON COLUMN bm_engagements.target_exit_valuation IS 'Owner-stated target exit valuation in GBP. Anchor for forward valuation bridge.';
COMMENT ON COLUMN bm_engagements.target_exit_method IS 'Industry-appropriate exit valuation method. Auto-suggested from industry_valuation_basis.';
COMMENT ON COLUMN bm_engagements.exit_strategy IS 'Intended exit route - shapes which buyer-type discounts and premiums apply.';

CREATE INDEX IF NOT EXISTS idx_bm_engagements_business_stage
  ON bm_engagements(business_stage);


-- ============================================================================
-- SECTION 2 : INDUSTRY VALUATION BASIS REGISTRY (KNOWLEDGE BASE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS industry_valuation_basis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_code TEXT NOT NULL REFERENCES industries(code) ON DELETE CASCADE,
  business_stage TEXT NOT NULL CHECK (business_stage IN ('pre_revenue', 'early_revenue', 'growth', 'operating', 'mature')),
  primary_method TEXT NOT NULL CHECK (primary_method IN
    ('EBITDA', 'Revenue', 'ARR', 'GMV', 'SDE', 'NFI', 'GRF', 'rNPV',
     'Comparable_Round', 'Berkus_Scorecard', 'DCF', 'Asset_Based', 'Cap_Rate')),
  secondary_method TEXT CHECK (secondary_method IN
    ('EBITDA', 'Revenue', 'ARR', 'GMV', 'SDE', 'NFI', 'GRF', 'rNPV',
     'Comparable_Round', 'Berkus_Scorecard', 'DCF', 'Asset_Based', 'Cap_Rate')),
  multiple_low NUMERIC,
  multiple_mid NUMERIC,
  multiple_high NUMERIC,
  pre_money_anchor_low NUMERIC,
  pre_money_anchor_mid NUMERIC,
  pre_money_anchor_high NUMERIC,
  primary_metric TEXT NOT NULL,
  multiple_expansion_drivers TEXT[],
  key_operational_metrics JSONB,
  uk_specific_notes TEXT,
  uk_discount_vs_us NUMERIC,
  typical_buyer_types TEXT[],
  methodology_note TEXT NOT NULL,
  sources TEXT[] NOT NULL,
  confidence_level TEXT CHECK (confidence_level IN ('strong', 'moderate', 'limited')),
  data_year INTEGER,
  last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT industry_valuation_basis_unique
    UNIQUE (industry_code, business_stage, data_year)
);

CREATE INDEX IF NOT EXISTS idx_ivb_industry_stage
  ON industry_valuation_basis(industry_code, business_stage)
  WHERE is_current = true;

COMMENT ON TABLE industry_valuation_basis IS 'Canonical valuation methodology by industry x stage. Drives Pass 1 valuation calculator.';


-- ============================================================================
-- SECTION 3 : VALUATION FRAMEWORKS REFERENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS valuation_frameworks (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  best_used_for TEXT[],
  not_appropriate_for TEXT[],
  parameters JSONB NOT NULL,
  typical_max_implied_value NUMERIC,
  source TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE valuation_frameworks IS 'Pre-revenue valuation framework definitions. Picked up by pre_revenue calculator based on stage and industry.';


-- ============================================================================
-- SECTION 4 : PRE-REVENUE SIGNALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bm_pre_revenue_signals (
  engagement_id UUID PRIMARY KEY REFERENCES bm_engagements(id) ON DELETE CASCADE,
  founder_capital_invested NUMERIC,
  founder_capital_basis TEXT,
  current_runway_months INTEGER,
  monthly_burn NUMERIC,
  capital_raised_to_date NUMERIC,
  forecast_year_1 JSONB,
  forecast_year_2 JSONB,
  forecast_year_3 JSONB,
  forecast_assumptions TEXT,
  forecast_confidence TEXT CHECK (forecast_confidence IN ('high', 'medium', 'low')),
  pipeline_qualified_acv NUMERIC,
  pipeline_top3_acv NUMERIC,
  pipeline_top3_concentration_pct NUMERIC,
  pipeline_signed_loi_count INTEGER DEFAULT 0,
  pipeline_verbal_count INTEGER DEFAULT 0,
  pipeline_cold_count INTEGER DEFAULT 0,
  pipeline_expected_conversion_pct NUMERIC,
  pipeline_first_revenue_eta DATE,
  pipeline_evidence_strength TEXT CHECK (pipeline_evidence_strength IN
    ('signed_contracts', 'signed_lois', 'verbal_commitments', 'active_discussions', 'cold_outreach')),
  round_size_target NUMERIC,
  round_pre_money_target NUMERIC,
  round_pre_money_min NUMERIC,
  round_seis_eis_eligible BOOLEAN,
  round_seis_eis_advance_assurance BOOLEAN DEFAULT false,
  round_lead_investor_status TEXT CHECK (round_lead_investor_status IN
    ('signed_termsheet', 'soft_circled', 'in_discussion', 'searching', 'none')),
  round_committed_to_date NUMERIC,
  round_closing_target_date DATE,
  follow_on_round_size NUMERIC,
  follow_on_milestones TEXT[],
  cap_table_complexity TEXT CHECK (cap_table_complexity IN ('clean', 'moderate', 'complex', 'problematic')),
  cap_table_share_classes TEXT[],
  cap_table_eis_friendly BOOLEAN,
  cap_table_voting_structure_notes TEXT,
  founder_ownership_current_pct NUMERIC,
  team_size_current INTEGER,
  team_gaps_critical TEXT[],
  hire_plan_12mo JSONB,
  founder_pedigree_summary TEXT,
  founder_prior_exits BOOLEAN DEFAULT false,
  ip_holding_entity TEXT,
  ip_protection_status TEXT[],
  corporate_structure_clean BOOLEAN,
  ip_migration_required BOOLEAN DEFAULT false,
  ip_migration_notes TEXT,
  data_room_completeness_pct INTEGER CHECK (data_room_completeness_pct BETWEEN 0 AND 100),
  data_room_gaps TEXT[],
  governance_board_status TEXT CHECK (governance_board_status IN
    ('formal_board_with_neds', 'founder_only_board', 'advisory_board_only', 'none')),
  governance_neds_count INTEGER DEFAULT 0,
  governance_advisors_count INTEGER DEFAULT 0,
  context_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bm_pre_revenue_signals IS 'Pre-revenue engagement signals. Read by Pass 1 pre-revenue calculator. Only populated when business_stage IN (pre_revenue, early_revenue).';


-- ============================================================================
-- SECTION 5 : RLS POLICIES
-- ============================================================================

ALTER TABLE bm_pre_revenue_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_valuation_basis ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuation_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice can view bm_pre_revenue_signals" ON bm_pre_revenue_signals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_pre_revenue_signals.engagement_id
        AND pm.id = auth.uid()
        AND pm.role IN ('admin', 'consultant')
    )
  );

CREATE POLICY "Practice can insert bm_pre_revenue_signals" ON bm_pre_revenue_signals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_pre_revenue_signals.engagement_id
        AND pm.id = auth.uid()
        AND pm.role IN ('admin', 'consultant')
    )
  );

CREATE POLICY "Practice can update bm_pre_revenue_signals" ON bm_pre_revenue_signals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_pre_revenue_signals.engagement_id
        AND pm.id = auth.uid()
        AND pm.role IN ('admin', 'consultant')
    )
  );

CREATE POLICY "Clients can view own bm_pre_revenue_signals" ON bm_pre_revenue_signals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      WHERE bme.id = bm_pre_revenue_signals.engagement_id
        AND bme.client_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated read industry_valuation_basis" ON industry_valuation_basis
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read valuation_frameworks" ON valuation_frameworks
  FOR SELECT USING (auth.role() = 'authenticated');


-- ============================================================================
-- SECTION 6 : SEED VALUATION FRAMEWORKS
-- ============================================================================

INSERT INTO valuation_frameworks (code, name, description, best_used_for, parameters, typical_max_implied_value, source) VALUES
  ('BERKUS', 'Berkus Method',
   'Assigns up to a fixed maximum (typically 400-500k GBP) to each of five risk-mitigating factors: sound idea, prototype, quality management, strategic relationships, product rollout.',
   ARRAY['pre_revenue_tech', 'pre_revenue_consumer', 'pre_revenue_b2b'],
   '{"factors": ["sound_idea", "prototype", "management_team", "strategic_relationships", "product_rollout"], "max_per_factor_gbp": 400000, "max_total_gbp": 2000000}'::jsonb,
   2000000, 'Dave Berkus (1990s, modernised 2010s)'),
  ('SCORECARD', 'Scorecard / Bill Payne Method',
   'Compares target to median pre-money valuations of similar funded peers in the region/sector, then adjusts using weighted factors.',
   ARRAY['pre_revenue_tech', 'pre_revenue_b2b', 'early_revenue'],
   '{"factors": [{"name":"management_team","weight":0.30},{"name":"opportunity_size","weight":0.25},{"name":"product_technology","weight":0.15},{"name":"competitive_environment","weight":0.10},{"name":"marketing_sales_partnerships","weight":0.10},{"name":"need_additional_investment","weight":0.05},{"name":"other","weight":0.05}], "uk_regional_median_gbp": 3500000}'::jsonb,
   NULL, 'Bill Payne (Angel Capital Association)'),
  ('RISK_FACTOR_SUMMATION', 'Risk Factor Summation',
   'Adjusts a base regional pre-money up or down by +/-200-400k for each of 12 risk factors.',
   ARRAY['pre_revenue_tech', 'pre_revenue_consumer', 'early_revenue'],
   '{"factors": ["management","stage","legislation","manufacturing","sales_marketing","funding","competition","technology","litigation","international","reputation","exit"], "adjustment_per_factor_gbp": [-400000, 400000]}'::jsonb,
   NULL, 'Ohio TechAngels'),
  ('VC_METHOD', 'Venture Capital Method',
   'Back-solves todays pre-money from a future exit value: estimate exit value at year N, discount to present at investor IRR, adjust for dilution, subtract round size.',
   ARRAY['pre_revenue_tech', 'early_revenue', 'growth'],
   '{"default_exit_horizon_years": 6, "default_irr_seed": 0.40, "default_irr_series_a": 0.30, "default_dilution_to_exit": 0.50}'::jsonb,
   NULL, 'Bill Sahlman, Harvard Business School'),
  ('COMPARABLE_ROUNDS', 'Comparable Round Analysis',
   'Identifies recent rounds in same sector/stage/geography; adjusts for size, growth, and traction.',
   ARRAY['pre_revenue_tech', 'early_revenue', 'growth'],
   '{"data_sources": ["beauhurst","crunchbase","pitchbook","dealroom","tracxn"], "minimum_comps": 5}'::jsonb,
   NULL, 'Industry standard'),
  ('FIRST_CHICAGO', 'First Chicago Method',
   'Probability-weighted sum of three scenarios (success / sideways / failure), each individually DCF-valued.',
   ARRAY['biotech', 'capital_intensive_growth'],
   '{"scenarios": ["success","sideways","failure"], "default_probabilities": [0.25, 0.50, 0.25]}'::jsonb,
   NULL, 'First Chicago Bank (1980s)'),
  ('rNPV', 'Risk-Adjusted Net Present Value',
   'Phase-by-phase probability-of-success-adjusted NPV. Gold standard for development-stage biotech and pharma assets.',
   ARRAY['biotech', 'pharma_development'],
   '{"discount_rate_range": [0.15, 0.40], "phase_probabilities": {"phase_1": 0.10, "phase_2": 0.25, "phase_3": 0.50, "filed": 0.85}}'::jsonb,
   NULL, 'BiopharmaVantage; Damodaran NYU')
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- SECTION 7 : INDUSTRY VALUATION BASIS SEED DATA
-- ============================================================================

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES (
  'SAAS_REGTECH', 'Regtech / Compliance SaaS', 'technology',
  'Regulatory technology and compliance SaaS - financial crime, AML/KYC, governance, compliance training and reporting platforms serving regulated industries.',
  ARRAY['62012','62020','58290','85590'],
  ARRAY['regtech','compliance','aml','kyc','financial crime','sanctions','governance','rcm','grc','compliance training','dnfbp','regulatory'],
  true
) ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description, keywords = EXCLUDED.keywords, is_active = true;

UPDATE industries
SET benchmark_profile = jsonb_build_object(
  'comparable_rounds', jsonb_build_array(
    jsonb_build_object('company','Themis','stage','seed','year',2021,'amount_gbp',1670000,'pre_money_implied','low_single_digit_m','notes','Pre-revenue/very early revenue at the time'),
    jsonb_build_object('company','Themis','stage','pre_series_a','year',2023,'amount_gbp',3100000,'post_money_gbp',15400000,'notes','Already had paying customers, 57% YoY revenue growth'),
    jsonb_build_object('company','Themis','stage','scale_up','year',2024,'amount_gbp',7250000,'notes','Cornerstone contracts with regulators and sovereign wealth funds'),
    jsonb_build_object('company','ComplyAdvantage','stage','series_a','year',2016,'amount_usd',8200000,'notes','Led by Balderton; founder had prior exit'),
    jsonb_build_object('company','ComplyAdvantage','stage','series_b','year',2018,'amount_usd',30000000,'notes','Led by Index Ventures'),
    jsonb_build_object('company','Datox AI','stage','pre_seed','year',2024,'amount_gbp_estimate','200k_500k','notes','UK regtech regulatory reporting SaaS'),
    jsonb_build_object('company','Onfido','stage','seed','year',2012,'amount_usd',1500000,'notes','Oxford Said student-led; acquired by Entrust 2024')
  ),
  'public_anchor', jsonb_build_object(
    'company','Skillcast Group plc','ticker','LSE:SKL',
    'market_cap_gbp_range','43m_to_57m_in_2025_26','revenue_2024_gbp_estimate',12000000,
    'pe_range','42_to_53','revenue_multiple','3x_to_5x',
    'notes','Profitable, listed UK compliance training competitor.'
  ),
  'sector_size', jsonb_build_object(
    'uk_regtech_total_2024_gbp',6600000000,
    'uk_compliance_training_tam_estimate_gbp_range','200m_to_500m',
    'global_compliance_training_2024_usd',5800000000,
    'cagr_estimate_pct','8_to_11'
  ),
  'arr_multiple_ranges', jsonb_build_object(
    'sub_1m_arr_bootstrapped','2_to_4','sub_1m_arr_healthy_growth','3_to_5',
    'sub_1m_arr_top_quartile','5_to_7','1m_to_5m_arr_healthy_growth','4_to_7',
    'note','UK private SaaS trades at 15-30% discount to comparable US deals.'
  ),
  'operational_benchmarks', jsonb_build_object(
    'gross_margin_target_pct',75,'nrr_target_pct',105,'nrr_top_quartile_pct',120,
    'rule_of_40_target',40,'enterprise_sales_cycle_days_median',134,
    'cac_payback_months_compliance','18_to_30','contract_length_target_years','2_to_3'
  ),
  'recent_exits', jsonb_build_array(
    jsonb_build_object('company','Onfido','year',2024,'buyer','Entrust','revenue_multiple_estimate','4x_to_6x'),
    jsonb_build_object('company','Featurespace','year',2024,'buyer','Visa','amount_usd_plus',1000000000)
  ),
  'uk_pre_revenue_anchor_recommendation', jsonb_build_object(
    'conservative_seis_friendly_gbp','1_500_000_to_2_500_000',
    'base_case_recommended_gbp','2_500_000_to_4_000_000',
    'stretch_with_evidence_gbp','4_000_000_to_6_000_000',
    'series_a_with_arr_gbp','8_000_000_to_18_000_000'
  )
) WHERE code = 'SAAS_REGTECH';

INSERT INTO industry_valuation_basis (
  industry_code, business_stage, primary_method, secondary_method,
  multiple_low, multiple_mid, multiple_high,
  pre_money_anchor_low, pre_money_anchor_mid, pre_money_anchor_high,
  primary_metric, multiple_expansion_drivers, key_operational_metrics,
  uk_specific_notes, uk_discount_vs_us, typical_buyer_types,
  methodology_note, sources, confidence_level, data_year
) VALUES
('SAAS_REGTECH', 'pre_revenue', 'Berkus_Scorecard', 'Comparable_Round',
 NULL, NULL, NULL, 1500000, 3000000, 6000000,
 'qualitative_score',
 ARRAY['founder_pedigree','prior_exits','platform_built','signed_lois','regulatory_relationships'],
 jsonb_build_object('typical_round_size_gbp','250k_to_750k','seis_window_lifetime_gbp',250000,'eis_per_round_gbp',5000000),
 'UK regtech sector receives a discount given small exit pool. SEIS/EIS structuring near-mandatory for tickets under 200k.',
 0.30, ARRAY['angels','seed_funds','seis_eis_funds','founder_friends_family'],
 'Pre-revenue UK regtech anchored by Berkus + Scorecard + comparable rounds.',
 ARRAY['Beauhurst Regtech Paradox 2024','Robot Mascot UK Pre-seed Trends H1 2025','Pitchbook Q3 2025 Europe','Themis funding history'],
 'moderate', 2025),
('SAAS_REGTECH', 'early_revenue', 'ARR', 'Comparable_Round',
 3.0, 5.0, 7.0, NULL, NULL, NULL,
 'arr',
 ARRAY['nrr_above_100','contracted_multi_year','named_fi_logos','gross_margin_above_70'],
 jsonb_build_object('arr_multiple_caveat','UK private SaaS sits 15-30% below US','vertical_saas_discount_vs_general_pct',20),
 'Defensible early-revenue valuations require contracted ARR, not pipeline.',
 0.25, ARRAY['vc_seed','vc_series_a','strategic_minority'],
 'Early-revenue regtech valued on forward ARR multiple, validated against comparable rounds.',
 ARRAY['ScaleWithCFO UK SaaS Multiples 2026','SaaS Capital Index 2025','Beauhurst regtech 2024'],
 'moderate', 2025),
('SAAS_REGTECH', 'growth', 'ARR', 'EBITDA',
 4.0, 6.5, 9.0, NULL, NULL, NULL,
 'arr',
 ARRAY['nrr_above_115','rule_of_40_above_40','gross_margin_above_75','enterprise_logo_concentration_below_30'],
 jsonb_build_object('rule_of_40_premium_threshold',40,'nrr_premium_threshold_pct',120),
 'Growth-stage UK regtech should target Rule of 40 above 40 and NRR above 115.',
 0.20, ARRAY['vc_growth','pe_growth','strategic'],
 'ARR multiple becomes primary, gated by Rule of 40, NRR, gross margin, CAC payback.',
 ARRAY['SaaS Capital Index','Bessemer State of Cloud','ScaleWithCFO'],
 'strong', 2025),
('SAAS_REGTECH', 'operating', 'EBITDA', 'ARR',
 8.0, 12.0, 18.0, NULL, NULL, NULL,
 'ebitda',
 ARRAY['ebitda_margin_above_25','recurring_pct_above_85','enterprise_retention_above_95','contracted_arr_visibility'],
 jsonb_build_object('skillcast_pe_range','42_to_53','typical_strategic_premium_pct',25),
 'Mature UK regtech uses EBITDA multiple primary; ARR remains secondary check.',
 0.20, ARRAY['pe_buyout','strategic','continuation_fund'],
 'EBITDA multiple primary at maturity (8-18x reflecting growth, scale, and recurring quality).',
 ARRAY['Skillcast plc public filings','BDO PCPI','First Page Sage 2025'],
 'strong', 2025)
ON CONFLICT (industry_code, business_stage, data_year) DO NOTHING;

-- General SAAS seeds
INSERT INTO industry_valuation_basis (
  industry_code, business_stage, primary_method, secondary_method,
  multiple_low, multiple_mid, multiple_high,
  pre_money_anchor_low, pre_money_anchor_mid, pre_money_anchor_high,
  primary_metric, multiple_expansion_drivers, key_operational_metrics,
  uk_specific_notes, uk_discount_vs_us, typical_buyer_types,
  methodology_note, sources, confidence_level, data_year
) SELECT 'SAAS', 'pre_revenue', 'Berkus_Scorecard', 'Comparable_Round',
  NULL, NULL, NULL, 2000000, 4000000, 7000000,
  'qualitative_score',
  ARRAY['founder_pedigree','platform_built','traction_signals','strategic_partnerships'],
  '{}'::jsonb,
  'UK pre-seed SaaS median pre-money 3.2m 2024-25.',
  0.30, ARRAY['angels','seed_funds'],
  'Pre-revenue SaaS anchored by Berkus + Scorecard.',
  ARRAY['Pitchbook Q3 2025','Beauhurst','SaaS Capital'],
  'moderate', 2025
WHERE EXISTS (SELECT 1 FROM industries WHERE code = 'SAAS')
ON CONFLICT (industry_code, business_stage, data_year) DO NOTHING;


-- ============================================================================
-- SECTION 8 : EXTEND bm_reports FOR PRE-REVENUE OUTPUT
-- ============================================================================

ALTER TABLE bm_reports
  ADD COLUMN IF NOT EXISTS pre_revenue_analysis JSONB;

ALTER TABLE bm_reports
  ADD COLUMN IF NOT EXISTS investment_readiness_score INTEGER
    CHECK (investment_readiness_score BETWEEN 0 AND 100);

ALTER TABLE bm_reports
  ADD COLUMN IF NOT EXISTS investment_readiness_breakdown JSONB;

COMMENT ON COLUMN bm_reports.pre_revenue_analysis IS 'Pre-revenue specific output. Only populated when business_stage IN (pre_revenue, early_revenue).';
COMMENT ON COLUMN bm_reports.investment_readiness_score IS 'Investment readiness score 0-100. Pre-revenue equivalent of exit_readiness score.';


-- ============================================================================
-- SECTION 9 : CONTEXT NOTE TYPES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_context_notes' AND column_name = 'context_type'
  ) THEN
    ALTER TABLE client_context_notes DROP CONSTRAINT IF EXISTS client_context_notes_context_type_check;
    ALTER TABLE client_context_notes ADD CONSTRAINT client_context_notes_context_type_check
      CHECK (context_type IN (
        'discovery_call','follow_up_answer','advisor_observation','client_email',
        'meeting_notes','background_context','pre_revenue_context',
        'investor_feedback','pipeline_update'
      ));
  END IF;
END $$;


-- ============================================================================
-- SECTION 10 : VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_engagement_cols INTEGER;
  v_ivb_rows INTEGER;
  v_frameworks INTEGER;
  v_signals_table BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_engagement_cols
  FROM information_schema.columns
  WHERE table_name = 'bm_engagements'
    AND column_name IN ('business_stage','exit_horizon_years','target_exit_valuation','target_exit_method','exit_strategy');
  SELECT COUNT(*) INTO v_ivb_rows FROM industry_valuation_basis;
  SELECT COUNT(*) INTO v_frameworks FROM valuation_frameworks;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bm_pre_revenue_signals') INTO v_signals_table;

  RAISE NOTICE 'Verification: engagement cols=%/5, ivb rows=%, frameworks=%, signals table=%',
    v_engagement_cols, v_ivb_rows, v_frameworks, v_signals_table;

  IF v_engagement_cols < 5 OR v_ivb_rows < 4 OR v_frameworks < 7 OR NOT v_signals_table THEN
    RAISE EXCEPTION 'Migration verification failed';
  END IF;
END $$;

COMMIT;
