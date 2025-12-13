-- ============================================================================
-- SERVICE LINE METADATA & ADVISORY CONFIGURATION
-- ============================================================================
-- This schema stores the nuanced advisory logic that drives Stage 2
-- Editable via admin UI, version controlled via updated_at timestamps
-- ============================================================================

-- ============================================================================
-- CORE SERVICE LINE METADATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_line_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Service identification
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  
  -- Core description
  core_function TEXT NOT NULL,
  problems_addressed TEXT[] NOT NULL DEFAULT '{}',
  
  -- Pricing tiers (JSONB for flexibility)
  pricing JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ "tier": "Monthly", "amount": 650, "frequency": "monthly" }]
  
  -- Status
  status TEXT NOT NULL DEFAULT 'development' CHECK (status IN ('ready', 'development', 'deprecated')),
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- TIMING INTELLIGENCE
-- When to recommend, when NOT to recommend
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_timing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_code TEXT NOT NULL REFERENCES service_line_metadata(code) ON DELETE CASCADE,
  
  -- Timing guidance
  ideal_timing TEXT NOT NULL,           -- "Before raising, before major pricing decisions"
  too_early_signal TEXT,                -- "Pre-revenue with simple finances"
  too_late_signal TEXT,                 -- "After investors have lost confidence in your numbers, or after a failed DD process"
  
  -- Pre/Post milestone flags
  pre_investment BOOLEAN DEFAULT false,  -- Should be in place BEFORE raising
  post_investment BOOLEAN DEFAULT true,  -- Appropriate after raise
  
  -- Stage appropriateness
  appropriate_stages TEXT[] DEFAULT '{}',
  -- Options: 'pre_revenue', 'early_revenue', 'growth', 'established', 'scaling'
  
  -- Maximum recommendations per stage (overselling prevention)
  -- NULL means no limit
  max_services_pre_revenue INTEGER DEFAULT 2,
  max_services_early_revenue INTEGER DEFAULT 3,
  max_services_growth INTEGER DEFAULT 5,
  max_services_scale INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADVISORY TRIGGERS
-- Conditions that indicate high relevance for a service
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_advisory_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_code TEXT NOT NULL REFERENCES service_line_metadata(code) ON DELETE CASCADE,
  
  -- Trigger definition
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'assessment_response',    -- Specific answer to assessment question
    'metric_threshold',       -- Numeric threshold (e.g., team_growth > 10x)
    'pattern_detected',       -- Pattern detection result (e.g., capital_raising_detected)
    'context_flag',          -- Advisor context note flag
    'combination'            -- Multiple conditions (AND/OR)
  )),
  
  -- Trigger specification (JSONB for flexibility)
  trigger_spec JSONB NOT NULL,
  -- Examples:
  -- { "question": "sd_financial_confidence", "value": "low_confidence" }
  -- { "metric": "team_growth_multiple", "operator": ">", "value": 10 }
  -- { "pattern": "capital_raising_detected", "value": true }
  -- { "conditions": [...], "operator": "AND" }
  
  -- Impact
  relevance TEXT NOT NULL CHECK (relevance IN ('critical', 'high', 'medium', 'low')),
  timing TEXT NOT NULL CHECK (timing IN ('now', 'within_3_months', 'post_raise', 'at_scale')),
  
  -- Explanation (for auditing and report generation)
  rationale TEXT NOT NULL,              -- Why this trigger matters
  client_value_template TEXT,           -- Template for client-specific value statement
  -- e.g., "Investors will ask questions you cannot currently answer. {cfo_service} prepares you."
  
  -- Priority (for ordering when multiple triggers fire)
  priority INTEGER DEFAULT 50,
  
  -- Active flag
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTRAINDICATIONS
-- Reasons NOT to recommend a service
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_contraindications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_code TEXT NOT NULL REFERENCES service_line_metadata(code) ON DELETE CASCADE,
  
  -- Contraindication definition
  contraindication_type TEXT NOT NULL CHECK (contraindication_type IN (
    'stage_mismatch',        -- Wrong business stage
    'existing_capability',   -- Already has this covered
    'affordability',         -- Cannot afford without strain
    'timing_wrong',          -- Too early or too late
    'dependency_missing',    -- Prerequisite service not in place
    'recent_duplicate'       -- Similar service recently delivered
  )),
  
  -- Specification
  condition_spec JSONB NOT NULL,
  -- Examples:
  -- { "stage": "pre_revenue", "reason": "finances too simple" }
  -- { "assessment": "has_cfo", "value": true }
  -- { "affordability": "monthly_capacity", "operator": "<", "value": "5k_15k" }
  
  -- Impact
  severity TEXT NOT NULL CHECK (severity IN ('hard_block', 'soft_warning', 'mention_only')),
  -- hard_block: Do not recommend under any circumstances
  -- soft_warning: Recommend with explicit caveat
  -- mention_only: Note in analysis but don't prevent recommendation
  
  -- Explanation
  explanation TEXT NOT NULL,
  alternative_suggestion TEXT,          -- What to recommend instead, if anything
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VALUE CALCULATIONS
-- Templates for quantifying impact with client-specific data
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_value_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_code TEXT NOT NULL REFERENCES service_line_metadata(code) ON DELETE CASCADE,
  
  -- Calculation definition
  calculation_name TEXT NOT NULL,       -- "investment_as_percent_of_revenue"
  
  -- Input metrics required
  required_metrics TEXT[] NOT NULL,     -- ["year1_revenue", "service_price"]
  
  -- Calculation formula (pseudocode/template)
  formula TEXT NOT NULL,
  -- e.g., "(service_price * 12) / year1_revenue * 100"
  
  -- Output template
  output_template TEXT NOT NULL,
  -- e.g., "£{service_price}/month = {result}% of Year 1 revenue for complete visibility"
  
  -- Fallback if metrics unavailable
  fallback_output TEXT,
  
  -- When to use this calculation
  use_when JSONB,
  -- e.g., { "has_metric": "year1_revenue", "context": "capital_raising" }
  
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NARRATIVE TEMPLATES
-- Ready-to-use hooks for report generation
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_narrative_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_code TEXT NOT NULL REFERENCES service_line_metadata(code) ON DELETE CASCADE,
  
  -- Template identification
  template_name TEXT NOT NULL,          -- "capital_raising", "high_growth", "burnout"
  
  -- Conditions for using this template
  use_when JSONB NOT NULL,
  -- e.g., { "pattern": "capital_raising_detected", "value": true }
  
  -- The narrative hook
  hook TEXT NOT NULL,
  -- e.g., "Investors will ask about your unit economics. Right now, you cannot answer with confidence."
  
  -- Variants for different sections of the report
  executive_summary_variant TEXT,
  transformation_journey_variant TEXT,
  closing_message_variant TEXT,
  
  -- Priority (higher = prefer this template)
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- OVERSELLING RULES
-- Business rules to prevent recommending too much
-- ============================================================================

CREATE TABLE IF NOT EXISTS advisory_overselling_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Rule identification
  rule_name TEXT NOT NULL UNIQUE,
  
  -- Condition
  applies_when JSONB NOT NULL,
  -- e.g., { "stage": "pre_revenue" }
  -- e.g., { "affordability": "under_1k" }
  
  -- Constraints
  max_phase1_services INTEGER NOT NULL DEFAULT 2,
  max_total_services INTEGER,
  max_phase1_investment INTEGER,        -- £ cap
  
  -- Required service priority
  -- Which services MUST be included if recommending anything
  priority_services TEXT[],             -- ["management_accounts"]
  
  -- Excluded services
  -- Which services should NOT be recommended at this stage
  excluded_services TEXT[],             -- ["combined_advisory", "fractional_coo"]
  
  -- Explanation for report
  explanation TEXT NOT NULL,
  -- e.g., "Pre-revenue clients should focus on investor readiness, not operational scale."
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUDIT TABLE FOR STAGE 2 OUTPUTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_advisory_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES practice_members(id),
  discovery_id UUID NOT NULL REFERENCES destination_discovery(id),
  
  -- The full Stage 2 output
  advisory_output JSONB NOT NULL,
  
  -- Extracted for quick querying
  extracted_metrics JSONB,
  phase1_services TEXT[],
  phase2_services TEXT[],
  phase3_services TEXT[],
  total_phase1_investment NUMERIC,
  
  -- Overselling check results
  overselling_rules_applied TEXT[],
  services_excluded TEXT[],
  
  -- Metadata
  model_used TEXT NOT NULL,
  execution_time_ms INTEGER,
  
  -- Link to final report
  report_id UUID REFERENCES client_reports(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advisory_insights_client ON audit_advisory_insights(client_id);
CREATE INDEX IF NOT EXISTS idx_advisory_insights_discovery ON audit_advisory_insights(discovery_id);
CREATE INDEX IF NOT EXISTS idx_advisory_insights_created ON audit_advisory_insights(created_at DESC);

-- ============================================================================
-- SEED DATA: Service Line Metadata
-- ============================================================================

INSERT INTO service_line_metadata (code, name, core_function, problems_addressed, pricing, status) VALUES

('management_accounts', 'Management Accounts', 
 'Monthly financial visibility with P&L, Balance Sheet, KPIs and Cash Flow analysis',
 ARRAY[
   'Flying blind on financial performance',
   'Cannot answer investor questions with confidence',
   'Decisions based on gut not data',
   'No early warning system for cash issues',
   'Tax surprises from not knowing position'
 ],
 '[{"tier": "Monthly", "amount": 650, "frequency": "monthly"}, {"tier": "Quarterly", "amount": 1750, "frequency": "one-time"}]'::jsonb,
 'ready'),

('systems_audit', 'Systems Audit',
 'Map every operational bottleneck, integration gap, and manual workaround',
 ARRAY[
   'Manual work that compounds with scale',
   'Systems that sort of work but break under pressure',
   'No single source of truth',
   'Key person dependencies baked into processes',
   'Technical debt accumulating invisibly'
 ],
 '[{"tier": "Comprehensive", "amount": 4000, "frequency": "one-time"}]'::jsonb,
 'ready'),

('fractional_cfo', 'Fractional CFO Services',
 'Strategic financial leadership without the full-time cost',
 ARRAY[
   'No one to discuss major financial decisions with',
   'Board/investor meetings without financial confidence',
   'Cannot model scenarios for strategic decisions',
   'Pricing, margins, and unit economics unclear',
   'Cash runway and burn rate not actively managed'
 ],
 '[{"tier": "2 days/month", "amount": 4000, "frequency": "monthly"}]'::jsonb,
 'ready'),

('365_method', '365 Alignment Programme',
 'Life-first business transformation with 5-year vision, 6-month shift, and 12-week sprints',
 ARRAY[
   'Working 60-70+ hours but no closer to the life they want',
   'Business running them instead of them running the business',
   'Success defined as exit but no structured path',
   'Operator wanting to become investor but stuck in the weeds',
   'Clear vision but no accountability or structured pathway'
 ],
 '[{"tier": "Lite", "amount": 1500, "frequency": "annual"}, {"tier": "Growth", "amount": 4500, "frequency": "annual"}, {"tier": "Partner", "amount": 9000, "frequency": "annual"}]'::jsonb,
 'ready'),

('fractional_coo', 'Fractional COO Services',
 'Operational leadership to build systems that run without you',
 ARRAY[
   'Founder is the bottleneck for all decisions',
   'Team unclear on priorities or processes',
   'Hiring without clear roles or onboarding',
   'Projects start but do not complete',
   'Operational chaos masking as startup culture'
 ],
 '[{"tier": "2 days/month", "amount": 3750, "frequency": "monthly"}]'::jsonb,
 'development'),

('business_advisory', 'Business Advisory & Exit Planning',
 'Protect and maximise the value you have built',
 ARRAY[
   'Do not know what the business is worth',
   'Cannot produce due diligence documents quickly',
   'No structured exit preparation',
   'Value trapped in founder rather than business',
   'Acquirer would find skeletons in due diligence'
 ],
 '[{"tier": "Full Package", "amount": 4000, "frequency": "one-time"}]'::jsonb,
 'development'),

('automation', 'Automation Services',
 'Eliminate manual work and unlock your team capacity',
 ARRAY[
   'Staff doing repetitive data entry',
   'Information trapped in silos',
   'Manual processes causing errors',
   'No time for value-add work because of admin',
   'Systems that do not talk to each other'
 ],
 '[{"tier": "Retainer", "amount": 1500, "frequency": "monthly"}, {"tier": "Per hour", "amount": 150, "frequency": "one-time"}]'::jsonb,
 'development'),

('combined_advisory', 'Combined CFO/COO Advisory',
 'Executive partnership covering both financial and operational strategy',
 ARRAY[
   'Need both financial and operational leadership',
   'Cannot justify two separate fractional executives',
   'Strategic decisions require both perspectives',
   'Scaling requires coordinated financial and operational planning'
 ],
 '[{"tier": "Combined", "amount": 6000, "frequency": "monthly"}]'::jsonb,
 'ready'),

('benchmarking', 'Benchmarking Services',
 'External and internal benchmarking analysis',
 ARRAY[
   'No idea how performance compares to peers',
   'Cannot identify where the real gaps are',
   'Making decisions without context'
 ],
 '[{"tier": "Full Package", "amount": 3500, "frequency": "one-time"}]'::jsonb,
 'development')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  core_function = EXCLUDED.core_function,
  problems_addressed = EXCLUDED.problems_addressed,
  pricing = EXCLUDED.pricing,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================================================
-- SEED DATA: Timing Rules
-- ============================================================================

INSERT INTO service_timing_rules (service_code, ideal_timing, too_early_signal, too_late_signal, pre_investment, post_investment, appropriate_stages) VALUES

('management_accounts', 
 'Before any significant spend, hire, or raise',
 'Pre-revenue with minimal transactions (<20/month)',
 'After investors have asked questions you could not answer',
 true, true,
 ARRAY['early_revenue', 'growth', 'established', 'scaling']),

('systems_audit',
 'Before the next major growth phase or significant hire',
 'Pre-product with no operational patterns yet, or processes still being invented',
 'After the chaos has burned out key people or caused customer churn',
 true, true,
 ARRAY['early_revenue', 'growth', 'established', 'scaling']),

('fractional_cfo',
 'BEFORE raising capital, before major pricing decisions, before board formation',
 'Pre-revenue with simple finances and no imminent raise',
 'After investors have lost confidence in your numbers, or after a failed DD process',
 true, true,
 ARRAY['early_revenue', 'growth', 'established', 'scaling']),

('365_method',
 'When they have a clear transformation vision but not the structured path to get there',
 'Still figuring out if the business is viable, or no clear vision of different future',
 'After burnout has caused irreversible damage to health or relationships',
 true, true,
 ARRAY['pre_revenue', 'early_revenue', 'growth', 'established', 'scaling']),

('fractional_coo',
 'After initial funding when scaling team, typically when team exceeds 10 people',
 'Team of 1-3 with no immediate growth plans',
 'After key people have left due to operational chaos',
 false, true,
 ARRAY['growth', 'established', 'scaling']),

('business_advisory',
 '3-5 years BEFORE intended exit - preparation takes years, not months',
 'Pre-revenue or pre-product-market-fit, or no exit intentions',
 'When acquirer is already asking questions you cannot answer',
 true, true,
 ARRAY['growth', 'established', 'scaling']),

('automation',
 'After systems audit has identified specific bottlenecks, when processes are stable',
 'Processes still changing frequently, no clear bottlenecks identified',
 'After manual work has burned out staff or caused quality issues',
 false, true,
 ARRAY['growth', 'established', 'scaling']),

('combined_advisory',
 'Scaling phase with both operational and financial complexity, typically £2M+ revenue',
 'When either CFO or COO alone would suffice',
 'After misalignment between finance and operations has caused damage',
 false, true,
 ARRAY['established', 'scaling']),

('benchmarking',
 'When ready to make data-driven improvements and have stable baseline to compare',
 'Pre-revenue or still establishing baseline performance',
 'N/A',
 true, true,
 ARRAY['early_revenue', 'growth', 'established', 'scaling'])

ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Key Advisory Triggers (Critical and High only)
-- ============================================================================

-- Management Accounts triggers
INSERT INTO service_advisory_triggers (service_code, trigger_type, trigger_spec, relevance, timing, rationale, client_value_template, priority) VALUES

('management_accounts', 'pattern_detected', 
 '{"pattern": "capital_raising_detected", "value": true}'::jsonb,
 'critical', 'now',
 'Investors ask questions about unit economics, burn rate, and runway that require accurate, timely financial data',
 'Investors will ask questions you cannot currently answer. Management accounts give you the data to respond with confidence.',
 100),

('management_accounts', 'assessment_response',
 '{"question": "sd_financial_confidence", "values": ["Not at all confident", "Somewhat confident"]}'::jsonb,
 'critical', 'now',
 'Low financial confidence indicates decisions are being made without adequate data',
 'You said you''re "{response}" in your financial data. Every major decision is currently a guess.',
 95),

('management_accounts', 'metric_threshold',
 '{"metric": "operational.teamGrowthMultiple", "operator": ">", "value": 5}'::jsonb,
 'high', 'now',
 'Significant team growth means payroll becomes the largest cost centre - needs visibility',
 'Your team grows {current} to {projected}. Payroll becomes your biggest cost. You need to see where every pound goes.',
 80);

-- Systems Audit triggers
INSERT INTO service_advisory_triggers (service_code, trigger_type, trigger_spec, relevance, timing, rationale, client_value_template, priority) VALUES

('systems_audit', 'metric_threshold',
 '{"metric": "operational.teamGrowthMultiple", "operator": ">", "value": 5}'::jsonb,
 'critical', 'now',
 'What works for a small team breaks catastrophically at scale - systems need to be mapped before growth',
 'Your team grows {multiple}x. Systems that work for {current} people will collapse at {projected}.',
 100),

('systems_audit', 'assessment_response',
 '{"question": "sd_manual_work", "values": ["31-50%", "More than 50%"]}'::jsonb,
 'critical', 'now',
 'High manual work percentage compounds with scale - £40k cost becomes £400k',
 'That {percentage} manual work costs scale with headcount. £40k now becomes £{scaled_cost}k at your projected team size.',
 95),

('systems_audit', 'assessment_response',
 '{"question": "sd_founder_dependency", "values": ["Chaos - I''m essential to everything"]}'::jsonb,
 'critical', 'now',
 'Founder as single point of failure blocks scaling and creates unsellable business',
 'If you disappeared for a month, chaos. That is not a business - it is a job with employees.',
 90);

-- Fractional CFO triggers
INSERT INTO service_advisory_triggers (service_code, trigger_type, trigger_spec, relevance, timing, rationale, client_value_template, priority) VALUES

('fractional_cfo', 'pattern_detected',
 '{"pattern": "capital_raising_detected", "value": true}'::jsonb,
 'critical', 'now',
 'CFO capability needed BEFORE raising - investors need confidence in your financial leadership and data',
 'You need someone who speaks investor language in the room BEFORE you raise, not after. VCs ask questions that require a CFO to answer.',
 100),

('fractional_cfo', 'assessment_response',
 '{"question": "sd_decision_partner", "values": ["No one really - I make most decisions alone"]}'::jsonb,
 'high', 'now',
 'Major financial decisions made in isolation leads to avoidable mistakes',
 'Major decisions made alone. A CFO is not just numbers - it is a strategic partner who has seen this before.',
 85),

('fractional_cfo', 'metric_threshold',
 '{"metric": "financial.projectedRevenue", "operator": ">", "value": 5000000}'::jsonb,
 'high', 'within_3_months',
 'Financial complexity at £5M+ trajectory requires dedicated strategic finance expertise',
 'At your £{year5}M trajectory, financial decisions get complex fast. Pricing, margins, cash runway - these need more than a spreadsheet.',
 80);

-- 365 Alignment triggers
INSERT INTO service_advisory_triggers (service_code, trigger_type, trigger_spec, relevance, timing, rationale, client_value_template, priority) VALUES

('365_method', 'pattern_detected',
 '{"pattern": "lifestyle_transformation_detected", "value": true}'::jsonb,
 'critical', 'now',
 'The destination they describe requires identity transformation, not just business strategy',
 'You described {vision_summary}. Working 70 hours will not get you there. You need a structured path from operator to investor.',
 100),

('365_method', 'assessment_response',
 '{"question": "dd_owner_hours", "values": ["60-70 hours", "70+ hours"]}'::jsonb,
 'critical', 'now',
 'Burnout trajectory - more effort will not create the life they described',
 'You are working {hours}. The destination stays distant until something structural changes.',
 95),

('365_method', 'assessment_response',
 '{"question": "dd_success_definition", "values": ["Creating a business that runs profitably without me", "Building a legacy that outlasts me"]}'::jsonb,
 'critical', 'now',
 'This success definition is an identity shift, not a business goal - needs structured support',
 'You defined success as "{response}". That is not a business goal - it is a life transformation that needs a structured pathway.',
 90);

-- Business Advisory triggers
INSERT INTO service_advisory_triggers (service_code, trigger_type, trigger_spec, relevance, timing, rationale, client_value_template, priority) VALUES

('business_advisory', 'assessment_response',
 '{"question": "sd_exit_timeline", "values": ["Already exploring options", "1-3 years - actively preparing"]}'::jsonb,
 'critical', 'now',
 'Exit in 1-3 years requires preparation starting NOW - deals die in unprepared DD',
 'Exit in {timeline}. The difference between 6x and 12x at your scale is life-changing money. Preparation starts now.',
 100),

('business_advisory', 'assessment_response',
 '{"question": "sd_exit_readiness", "values": ["Probably weeks", "Honestly? Months"]}'::jsonb,
 'high', 'now',
 'Inability to produce DD documents quickly kills deals - acquirers have timelines',
 'When an acquirer asks for your data room, you have 48 hours. Right now, that would take {response}. Deals die in that gap.',
 90);

-- ============================================================================
-- SEED DATA: Contraindications
-- ============================================================================

INSERT INTO service_contraindications (service_code, contraindication_type, condition_spec, severity, explanation, alternative_suggestion) VALUES

-- Management Accounts contraindications
('management_accounts', 'stage_mismatch',
 '{"stage": "pre_revenue", "transactions_per_month": "<20"}'::jsonb,
 'soft_warning',
 'Pre-revenue with minimal transactions may not justify monthly management accounts',
 'Consider quarterly reporting until transaction volume increases'),

('management_accounts', 'existing_capability',
 '{"has_internal_finance": true, "quality": "good"}'::jsonb,
 'hard_block',
 'Already has capable internal financial reporting - would duplicate effort',
 NULL),

-- Systems Audit contraindications
('systems_audit', 'timing_wrong',
 '{"processes_stable": false, "reason": "still_pivoting"}'::jsonb,
 'hard_block',
 'Processes still being invented - audit would be obsolete within weeks',
 'Revisit systems audit once core processes have stabilised for 3+ months'),

('systems_audit', 'recent_duplicate',
 '{"months_since_last_audit": "<12"}'::jsonb,
 'soft_warning',
 'Recent systems audit completed - may not need another yet',
 'Consider implementation support for existing audit recommendations instead'),

-- Fractional CFO contraindications
('fractional_cfo', 'affordability',
 '{"monthly_capacity": "under_1k", "not_raising": true}'::jsonb,
 'hard_block',
 'Cannot afford £4k/month without strain and not raising to justify the investment',
 'Start with Management Accounts for visibility, consider CFO when raising or revenue supports'),

('fractional_cfo', 'stage_mismatch',
 '{"stage": "pre_revenue", "finances_simple": true, "not_raising": true}'::jsonb,
 'soft_warning',
 'Pre-revenue with simple finances may not need CFO-level strategic guidance yet',
 'Management Accounts provides visibility; CFO makes sense when complexity increases or raising'),

-- Fractional COO contraindications  
('fractional_coo', 'stage_mismatch',
 '{"team_size": "<5"}'::jsonb,
 'hard_block',
 'Team too small to justify COO - founder should manage directly at this stage',
 'Focus on Systems Audit to document processes; COO when team exceeds 10'),

('fractional_coo', 'existing_capability',
 '{"founder_delegation": "good", "team_autonomous": true}'::jsonb,
 'soft_warning',
 'Founder demonstrates good delegation and team operates autonomously - COO may not add value',
 NULL),

-- 365 Alignment contraindications
('365_method', 'stage_mismatch',
 '{"business_viability": "uncertain"}'::jsonb,
 'hard_block',
 'Still validating business model - transformation planning premature',
 'Focus on product-market fit first; 365 when the business model is proven'),

('365_method', 'timing_wrong',
 '{"transformation_vision": false, "lifestyle_satisfied": true}'::jsonb,
 'hard_block',
 'No transformation vision detected and satisfied with current lifestyle',
 NULL),

-- Business Advisory contraindications
('business_advisory', 'timing_wrong',
 '{"exit_timeline": ">10_years"}'::jsonb,
 'soft_warning',
 'Exit more than 10 years away - may be premature for intensive exit planning',
 'Consider lighter-touch valuation awareness; formal exit planning when timeline shortens'),

('business_advisory', 'stage_mismatch',
 '{"stage": "pre_revenue"}'::jsonb,
 'hard_block',
 'Pre-revenue - focus on building value before planning to realise it',
 'Revisit exit planning once revenue established and business model proven'),

-- Automation contraindications
('automation', 'dependency_missing',
 '{"has_systems_audit": false}'::jsonb,
 'soft_warning',
 'No systems audit completed - may automate the wrong things',
 'Systems Audit first to identify highest-impact automation opportunities'),

('automation', 'timing_wrong',
 '{"processes_changing": true}'::jsonb,
 'hard_block',
 'Processes still changing frequently - automation would need constant rework',
 'Stabilise processes first; automate when workflows are consistent'),

-- Combined Advisory contraindications
('combined_advisory', 'stage_mismatch',
 '{"revenue": "<2000000"}'::jsonb,
 'soft_warning',
 'Revenue under £2M may not justify combined executive package',
 'Consider individual fractional CFO or COO based on primary need')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Overselling Rules
-- ============================================================================

INSERT INTO advisory_overselling_rules (rule_name, applies_when, max_phase1_services, max_total_services, max_phase1_investment, priority_services, excluded_services, explanation) VALUES

('pre_revenue_cap',
 '{"stage": "pre_revenue"}'::jsonb,
 2, 3, 15000,
 ARRAY['management_accounts'],
 ARRAY['combined_advisory', 'fractional_coo', 'automation'],
 'Pre-revenue clients should focus on investor readiness. Phase 1 limited to foundation services, with others positioned for post-raise.'),

('early_revenue_cap',
 '{"stage": "early_revenue"}'::jsonb,
 3, 5, 36000,
 ARRAY['management_accounts', 'systems_audit'],
 ARRAY['combined_advisory'],
 'Early-revenue clients need visibility and systems. Fractional executives positioned for when revenue supports investment.'),

('cash_constrained_cap',
 '{"affordability": "under_1k"}'::jsonb,
 1, 2, 8000,
 ARRAY['management_accounts'],
 ARRAY['fractional_cfo', 'fractional_coo', 'combined_advisory'],
 'Cash-constrained clients need affordable foundation. Position higher-value services for after raise or revenue growth.'),

('growth_stage',
 '{"stage": "growth"}'::jsonb,
 4, 6, 60000,
 NULL,
 NULL,
 'Growth stage can support broader service suite. Prioritise based on specific pain points.'),

('scale_stage',
 '{"stage": "scaling"}'::jsonb,
 5, NULL, NULL,
 NULL,
 NULL,
 'Scaling businesses can typically support full service suite. Combined packages often make sense.')

ON CONFLICT (rule_name) DO UPDATE SET
  applies_when = EXCLUDED.applies_when,
  max_phase1_services = EXCLUDED.max_phase1_services,
  max_total_services = EXCLUDED.max_total_services,
  max_phase1_investment = EXCLUDED.max_phase1_investment,
  priority_services = EXCLUDED.priority_services,
  excluded_services = EXCLUDED.excluded_services,
  explanation = EXCLUDED.explanation;

-- ============================================================================
-- SEED DATA: Value Calculations
-- ============================================================================

INSERT INTO service_value_calculations (service_code, calculation_name, required_metrics, formula, output_template, fallback_output, use_when, priority) VALUES

('management_accounts', 'investment_as_percent_of_revenue',
 ARRAY['financial.projectedRevenue'],
 '(650 * 12) / financial.projectedRevenue[0].amount * 100',
 '£650/month represents {result}% of Year 1 revenue for complete financial visibility',
 '£650/month for complete financial visibility - a fraction of the cost of one bad decision',
 '{"has_metric": "financial.projectedRevenue"}'::jsonb,
 100),

('systems_audit', 'manual_work_cost_scaling',
 ARRAY['operational.teamSize.current', 'operational.teamSize.projected', 'operational.manualWorkPercentage'],
 'Calculate current manual work cost and projected cost at scale',
 'That {operational.manualWorkPercentage}% manual work costs £{current_cost}k now. At {operational.teamSize.projected} people, same inefficiency = £{projected_cost}k',
 'Manual work costs compound with headcount - the same inefficiency costs 10x more at 10x the team',
 '{"has_metrics": ["operational.teamSize.current", "operational.manualWorkPercentage"]}'::jsonb,
 100),

('fractional_cfo', 'valuation_impact',
 ARRAY['financial.projectedRevenue'],
 'financial.projectedRevenue[4].amount * (12 - 6) / 1000000 for infrastructure delta',
 'At £{year5_revenue}M: founder-dependent (6x) = £{low_val}M, systemised (12x) = £{high_val}M. Infrastructure delta: £{delta}M',
 'The delta between a founder-dependent and systemised business at exit is typically 6x vs 12x revenue',
 '{"has_metric": "financial.projectedRevenue", "min_value": 5000000}'::jsonb,
 100),

('365_method', 'hours_reclaimed',
 ARRAY['dd_owner_hours'],
 '(dd_owner_hours - 40) * 52',
 'From {dd_owner_hours} to 40 hours = {hours_saved} hours/year of life back. That is {days_saved} days.',
 'The journey from 70 hours to 40 hours is 1,560 hours a year - 65 days of life reclaimed',
 '{"has_metric": "dd_owner_hours"}'::jsonb,
 90),

('business_advisory', 'valuation_gap',
 ARRAY['financial.currentRevenue', 'current_multiple', 'target_multiple'],
 '(target_multiple - current_multiple) * financial.currentRevenue',
 'Moving from {current_multiple}x to {target_multiple}x on £{revenue}M = £{gap}M additional value',
 'The difference between selling founder-dependent vs systemised is typically 2-6x revenue in additional value',
 '{"has_metric": "financial.currentRevenue"}'::jsonb,
 100)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Narrative Templates
-- ============================================================================

INSERT INTO service_narrative_templates (service_code, template_name, use_when, hook, executive_summary_variant, closing_message_variant, priority) VALUES

('management_accounts', 'capital_raising',
 '{"pattern": "capital_raising_detected", "value": true}'::jsonb,
 'Investors will ask about your unit economics, burn rate, and runway. Right now, you cannot answer with confidence.',
 'Financial visibility becomes non-negotiable when raising capital.',
 'The questions VCs ask require answers you cannot currently give. That changes in Month 1.',
 100),

('management_accounts', 'scaling_team',
 '{"metric": "operational.teamGrowthMultiple", "operator": ">", "value": 10}'::jsonb,
 'Your team grows 17x. Payroll becomes your biggest cost. You need to see where every pound goes before it becomes six figures.',
 'Rapid team growth demands financial visibility at a level your current setup cannot provide.',
 'At 51 people, payroll decisions matter. You need to see them clearly.',
 90),

('systems_audit', 'high_team_growth',
 '{"metric": "operational.teamGrowthMultiple", "operator": ">", "value": 5}'::jsonb,
 'Systems that work for 3 break at 15. Build the infrastructure before you need it, not after it collapses.',
 'Your operational chaos scales with headcount unless you map and fix it first.',
 'The processes that sort of work now will catastrophically fail at scale. Map them before they break.',
 100),

('systems_audit', 'founder_dependency',
 '{"assessment": "sd_founder_dependency", "value": "chaos"}'::jsonb,
 'If you disappeared for a month, chaos. That is not a business - it is a job with employees.',
 'You are the single point of failure. That is unsellable and unscalable.',
 'Right now, the business is you. A systems audit maps what needs to exist outside your head.',
 95),

('fractional_cfo', 'capital_raising',
 '{"pattern": "capital_raising_detected", "value": true}'::jsonb,
 'You need someone who speaks investor language in the room BEFORE you raise, not after.',
 'Investor conversations require financial sophistication you do not currently have access to.',
 'VCs ask questions that need a CFO to answer. Get that capability before the meeting, not after.',
 100),

('365_method', 'burnout_with_vision',
 '{"assessment": "dd_owner_hours", "values": ["60-70 hours", "70+ hours"], "pattern": "lifestyle_transformation_detected"}'::jsonb,
 'You described school drop-offs, portfolio management, a business that runs without you. Working 70 hours will not get you there.',
 'There is a fundamental mismatch between the life you described and how you currently operate.',
 'The destination stays distant until the path changes. 365 provides the structured journey.',
 100),

('365_method', 'identity_transformation',
 '{"assessment": "dd_success_definition", "values": ["Creating a business that runs profitably without me"]}'::jsonb,
 'You have a business plan. What you do not have is a structured path to becoming the person in your 5-year vision.',
 'Success defined as "business runs without me" is an identity shift, not a business goal.',
 'That transformation - operator to investor - needs structure. It will not happen by working harder.',
 95),

('business_advisory', 'exit_1_to_3_years',
 '{"assessment": "sd_exit_timeline", "values": ["1-3 years - actively preparing"]}'::jsonb,
 'Exit in 1-3 years means preparation starts now. The difference between 6x and 12x at your scale is life-changing money.',
 'Your exit timeline requires immediate preparation - deals take years to optimise.',
 'The value gap between prepared and unprepared at exit is not incremental. It is transformational.',
 100)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get all active triggers for a service
CREATE OR REPLACE FUNCTION get_service_triggers(p_service_code TEXT)
RETURNS TABLE (
  trigger_type TEXT,
  trigger_spec JSONB,
  relevance TEXT,
  timing TEXT,
  rationale TEXT,
  client_value_template TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sat.trigger_type,
    sat.trigger_spec,
    sat.relevance,
    sat.timing,
    sat.rationale,
    sat.client_value_template
  FROM service_advisory_triggers sat
  WHERE sat.service_code = p_service_code
    AND sat.is_active = true
  ORDER BY sat.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get applicable overselling rules for a stage
CREATE OR REPLACE FUNCTION get_overselling_rules(p_stage TEXT, p_affordability TEXT DEFAULT NULL)
RETURNS TABLE (
  rule_name TEXT,
  max_phase1_services INTEGER,
  max_total_services INTEGER,
  max_phase1_investment INTEGER,
  priority_services TEXT[],
  excluded_services TEXT[],
  explanation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aor.rule_name,
    aor.max_phase1_services,
    aor.max_total_services,
    aor.max_phase1_investment,
    aor.priority_services,
    aor.excluded_services,
    aor.explanation
  FROM advisory_overselling_rules aor
  WHERE aor.is_active = true
    AND (
      aor.applies_when->>'stage' = p_stage
      OR (p_affordability IS NOT NULL AND aor.applies_when->>'affordability' = p_affordability)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE service_line_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_timing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_advisory_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contraindications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_value_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_narrative_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_overselling_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_advisory_insights ENABLE ROW LEVEL SECURITY;

-- Service metadata is readable by authenticated users
CREATE POLICY "Service metadata readable by authenticated users" ON service_line_metadata
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Audit insights readable by practice members
CREATE POLICY "Audit insights readable by practice" ON audit_advisory_insights
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM practice_members 
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can manage all advisory configuration
CREATE POLICY "Service role can manage advisory config" ON service_line_metadata
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage timing rules" ON service_timing_rules
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage triggers" ON service_advisory_triggers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage contraindications" ON service_contraindications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage value calculations" ON service_value_calculations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage narrative templates" ON service_narrative_templates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage overselling rules" ON advisory_overselling_rules
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage audit insights" ON audit_advisory_insights
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Service Metadata Schema' as type, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_line_metadata') 
            THEN 'Created' ELSE 'Failed' END as status
UNION ALL
SELECT 'Advisory Triggers Table', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_advisory_triggers') 
            THEN 'Created' ELSE 'Failed' END
UNION ALL
SELECT 'Overselling Rules Table', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'advisory_overselling_rules') 
            THEN 'Created' ELSE 'Failed' END
UNION ALL
SELECT 'Audit Insights Table', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_advisory_insights') 
            THEN 'Created' ELSE 'Failed' END;

