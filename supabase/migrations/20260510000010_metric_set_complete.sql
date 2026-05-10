-- Replace metric_set seed with complete per-metric data (p25/p50/p75, targetByYear, category, whyThisMatters)
BEGIN;

UPDATE industry_valuation_basis
SET metric_set = jsonb_build_array(
  jsonb_build_object(
    'code','annual_recurring_revenue','name','Annual Recurring Revenue',
    'unit','currency','category','valuation_defining','higherIsBetter',true,
    'p25',500000,'p50',1000000,'p75',2500000,'targetByYear',3,
    'whyThisMatters','ARR is the primary valuation driver for SaaS businesses. Hitting P75 commands premium multiples.',
    'perplexityHint','typical ARR levels for UK pre-seed and seed regtech / vertical SaaS, by stage and year'
  ),
  jsonb_build_object(
    'code','net_revenue_retention','name','Net Revenue Retention',
    'unit','percent','category','valuation_defining','higherIsBetter',true,
    'p25',100,'p50',110,'p75',120,'targetByYear',3,
    'whyThisMatters','NRR above 110% shows expansion revenue outpaces churn. The strongest signal of product-market fit for investors.',
    'perplexityHint','net revenue retention benchmarks for UK vertical SaaS / regtech, P25 P50 P75'
  ),
  jsonb_build_object(
    'code','rule_of_40','name','Rule of 40',
    'unit','percent','category','valuation_defining','higherIsBetter',true,
    'p25',20,'p50',30,'p75',40,'targetByYear',4,
    'whyThisMatters','Growth rate plus margin above 40 is the benchmark PE/VC use to separate premium from average SaaS.',
    'perplexityHint','rule of 40 benchmarks for B2B SaaS 2025'
  ),
  jsonb_build_object(
    'code','gross_margin','name','Gross Margin',
    'unit','percent','category','operational','higherIsBetter',true,
    'p25',60,'p50',70,'p75',78,'targetByYear',2,
    'whyThisMatters','Gross margin above 70% confirms SaaS-grade unit economics and a scalable delivery model.',
    'perplexityHint','gross margin benchmarks UK SaaS regtech 2025'
  ),
  jsonb_build_object(
    'code','cac_payback_months','name','CAC Payback Period',
    'unit','months','category','operational','higherIsBetter',false,
    'p25',30,'p50',18,'p75',12,'targetByYear',3,
    'whyThisMatters','CAC payback under 18 months shows capital-efficient growth. Critical for fundraising credibility.',
    'perplexityHint','CAC payback period months B2B SaaS 2025 enterprise SMB segments'
  ),
  jsonb_build_object(
    'code','average_contract_length','name','Average Contract Length',
    'unit','years','category','investor_readiness','higherIsBetter',true,
    'p25',1,'p50',2,'p75',3,'targetByYear',2,
    'whyThisMatters','Multi-year contracts add 1-2x to ARR multiple and dramatically improve revenue predictability.',
    'perplexityHint','average contract length years B2B vertical SaaS UK 2025'
  )
)
WHERE industry_code = 'SAAS_REGTECH'
  AND business_stage IN ('pre_revenue', 'early_revenue');

COMMIT;
