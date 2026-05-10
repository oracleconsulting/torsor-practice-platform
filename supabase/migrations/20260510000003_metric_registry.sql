-- Add metric_set to industry_valuation_basis for registry-driven benchmark fetching
BEGIN;

ALTER TABLE industry_valuation_basis
  ADD COLUMN IF NOT EXISTS metric_set JSONB;

COMMENT ON COLUMN industry_valuation_basis.metric_set IS
  'Array of metric definitions to fetch from Perplexity for this industry x stage. Replaces hard-coded CORE_METRICS in fetch-industry-benchmarks.';

-- Seed SAAS_REGTECH pre-revenue / early-revenue metric sets
UPDATE industry_valuation_basis
SET metric_set = jsonb_build_array(
  jsonb_build_object('code','annual_recurring_revenue','name','Annual Recurring Revenue','unit','currency','higherIsBetter',true,'description','Forward-looking ARR target','perplexityHint','typical ARR levels for UK pre-seed and seed regtech / vertical SaaS, by stage and year'),
  jsonb_build_object('code','net_revenue_retention','name','Net Revenue Retention','unit','percent','higherIsBetter',true,'description','Expansion vs churn for vertical SaaS','perplexityHint','net revenue retention benchmarks for UK vertical SaaS / regtech, P25 P50 P75'),
  jsonb_build_object('code','rule_of_40','name','Rule of 40','unit','percent','higherIsBetter',true,'description','Growth + EBITDA margin','perplexityHint','rule of 40 benchmarks for B2B SaaS 2025'),
  jsonb_build_object('code','gross_margin','name','Gross Margin','unit','percent','higherIsBetter',true,'description','SaaS unit economics indicator','perplexityHint','gross margin benchmarks UK SaaS regtech 2025'),
  jsonb_build_object('code','cac_payback_months','name','CAC Payback Period','unit','months','higherIsBetter',false,'description','Months to recover sales+marketing cost','perplexityHint','CAC payback period months B2B SaaS 2025 enterprise SMB segments'),
  jsonb_build_object('code','average_contract_length','name','Average Contract Length','unit','years','higherIsBetter',true,'description','Multi-year contracts lift ARR multiple','perplexityHint','average contract length years B2B vertical SaaS UK 2025')
)
WHERE industry_code = 'SAAS_REGTECH'
  AND business_stage IN ('pre_revenue', 'early_revenue');

-- Growth + operating SAAS_REGTECH
UPDATE industry_valuation_basis
SET metric_set = jsonb_build_array(
  jsonb_build_object('code','annual_recurring_revenue','name','Annual Recurring Revenue','unit','currency','higherIsBetter',true),
  jsonb_build_object('code','arr_growth_rate','name','ARR Growth Rate','unit','percent','higherIsBetter',true),
  jsonb_build_object('code','net_revenue_retention','name','Net Revenue Retention','unit','percent','higherIsBetter',true),
  jsonb_build_object('code','gross_revenue_retention','name','Gross Revenue Retention','unit','percent','higherIsBetter',true),
  jsonb_build_object('code','rule_of_40','name','Rule of 40','unit','percent','higherIsBetter',true),
  jsonb_build_object('code','gross_margin','name','Gross Margin','unit','percent','higherIsBetter',true),
  jsonb_build_object('code','ebitda_margin','name','EBITDA Margin','unit','percent','higherIsBetter',true),
  jsonb_build_object('code','cac_payback_months','name','CAC Payback Period','unit','months','higherIsBetter',false),
  jsonb_build_object('code','magic_number','name','Magic Number','unit','ratio','higherIsBetter',true),
  jsonb_build_object('code','burn_multiple','name','Burn Multiple','unit','ratio','higherIsBetter',false)
)
WHERE industry_code = 'SAAS_REGTECH'
  AND business_stage IN ('growth', 'operating', 'mature');

-- Default operating metric set for industries without specific metric_set
UPDATE industry_valuation_basis
SET metric_set = jsonb_build_array(
  jsonb_build_object('code','revenue_per_employee','name','Revenue per Employee','unit','currency','higherIsBetter',true),
  jsonb_build_object('code','gross_margin','name','Gross Margin','unit','percent','higherIsBetter',true),
  jsonb_build_object('code','net_margin','name','Net Margin','unit','percent','higherIsBetter',true),
  jsonb_build_object('code','operating_margin','name','Operating Margin','unit','percent','higherIsBetter',true),
  jsonb_build_object('code','revenue_growth','name','Annual Revenue Growth','unit','percent','higherIsBetter',true),
  jsonb_build_object('code','employee_turnover','name','Employee Turnover Rate','unit','percent','higherIsBetter',false),
  jsonb_build_object('code','debtor_days','name','Debtor Days','unit','days','higherIsBetter',false),
  jsonb_build_object('code','client_concentration','name','Top 3 Client Concentration','unit','percent','higherIsBetter',false)
)
WHERE business_stage = 'operating'
  AND industry_code != 'SAAS_REGTECH'
  AND metric_set IS NULL;

COMMIT;
