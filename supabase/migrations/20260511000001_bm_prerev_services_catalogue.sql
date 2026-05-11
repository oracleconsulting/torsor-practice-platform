-- ============================================================================
-- Migration: 20260511000001_bm_prerev_services_catalogue
-- ============================================================================
-- Populates the `services` catalogue for the service codes referenced by
-- Pass 3 pre-revenue opportunity generation in PRE_REVENUE_SERVICE_MAP.
--
-- Idempotent ON CONFLICT (code) upserts.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  required_codes text[] := ARRAY[
    'three_goal_framework',
    'family_investment_company',
    'fractional_cfo',
    'cap_table_seis_eis',
    'investor_pack_preparation',
    'fractional_coo',
    'founder_ip_documentation_programme',
    'board_governance_setup'
  ];
  existing_count int;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM services
  WHERE code = ANY(required_codes);
  RAISE NOTICE 'Services catalogue: % of % required pre-revenue codes already exist', existing_count, array_length(required_codes, 1);
END $$;

INSERT INTO services (
  code, name, category, description, price_from, price_to, price_unit, typical_duration, deliverables, times_recommended, created_at, updated_at
) VALUES (
  'three_goal_framework',
  'Three-Goal Framework',
  'strategy',
  'Locks down the founder''s target exit valuation, ARR trajectory, and metric thresholds that anchor every downstream decision. Anchors the rest of the advisory engagement and protects against drift between rounds.',
  6000, 12000, 'project', '4-6 weeks',
  ARRAY[
    'Target exit valuation locked with sensitivity analysis',
    'ARR trajectory mapped to exit multiple',
    'P25 / P50 / P75 metric thresholds documented',
    'Quarterly review framework to stay on track',
    'Cap table impact modelled at each milestone'
  ],
  0, NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description,
  price_from = EXCLUDED.price_from, price_to = EXCLUDED.price_to, price_unit = EXCLUDED.price_unit,
  typical_duration = EXCLUDED.typical_duration, deliverables = EXCLUDED.deliverables,
  updated_at = NOW();

INSERT INTO services (
  code, name, category, description, price_from, price_to, price_unit, typical_duration, deliverables, times_recommended, created_at, updated_at
) VALUES (
  'family_investment_company',
  'Holdco / Family Investment Company Structuring',
  'tax_structuring',
  'Designs and implements the right corporate structure before a funding round closes. Retrospective restructuring after investment is significantly more expensive and tax-inefficient.',
  8000, 18000, 'project', '6-10 weeks',
  ARRAY[
    'Current structure review and risk assessment',
    'Holdco / FIC modelling with tax implications',
    'Share class design for founders and investors',
    'Companies House filings and registrations',
    'Coordination with personal tax advisors'
  ],
  0, NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description,
  price_from = EXCLUDED.price_from, price_to = EXCLUDED.price_to, price_unit = EXCLUDED.price_unit,
  typical_duration = EXCLUDED.typical_duration, deliverables = EXCLUDED.deliverables,
  updated_at = NOW();

INSERT INTO services (
  code, name, category, description, price_from, price_to, price_unit, typical_duration, deliverables, times_recommended, created_at, updated_at
) VALUES (
  'fractional_cfo',
  'Fractional CFO',
  'fractional_leadership',
  'Senior finance leadership on a flexible basis — typically 1-2 days per week. For pre-revenue companies, focuses on forecast credibility, fundraising support, financial discipline, and investor reporting that stands up to scrutiny.',
  4000, 8000, 'month', '6-12 months minimum',
  ARRAY[
    'Bottom-up 3-year financial model with documented assumptions',
    'Monthly management accounts with investor-grade commentary',
    'Cap table management and dilution modelling',
    'Fundraising pack: financials, comparable transactions, valuation defence',
    'Board pack preparation and investor reporting'
  ],
  0, NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description,
  price_from = EXCLUDED.price_from, price_to = EXCLUDED.price_to, price_unit = EXCLUDED.price_unit,
  typical_duration = EXCLUDED.typical_duration, deliverables = EXCLUDED.deliverables,
  updated_at = NOW();

INSERT INTO services (
  code, name, category, description, price_from, price_to, price_unit, typical_duration, deliverables, times_recommended, created_at, updated_at
) VALUES (
  'cap_table_seis_eis',
  'Cap Table Cleanup + SEIS/EIS Advance Assurance',
  'fundraising_readiness',
  'Cleans up the cap table, secures SEIS/EIS advance assurance from HMRC, and prepares the company for investor scrutiny. Without advance assurance, you are closing the round to a fraction of the angel market.',
  4500, 8500, 'project', '8-12 weeks',
  ARRAY[
    'Cap table reconciliation and cleanup',
    'Share class rationalisation',
    'SEIS / EIS advance assurance application and HMRC liaison',
    'Investor agreements review',
    'Companies House filings to align records'
  ],
  0, NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description,
  price_from = EXCLUDED.price_from, price_to = EXCLUDED.price_to, price_unit = EXCLUDED.price_unit,
  typical_duration = EXCLUDED.typical_duration, deliverables = EXCLUDED.deliverables,
  updated_at = NOW();

INSERT INTO services (
  code, name, category, description, price_from, price_to, price_unit, typical_duration, deliverables, times_recommended, created_at, updated_at
) VALUES (
  'investor_pack_preparation',
  'Investor Pack Preparation',
  'fundraising_readiness',
  'Builds the complete fundraising pack: deck, financials, market evidence, comparables, and data room. Pulls together what investors actually want to see, not what founders typically prepare.',
  6500, 14000, 'project', '6-8 weeks',
  ARRAY[
    'Investor deck with market sizing and competitive analysis',
    'Comparable transaction analysis and valuation defence',
    'Data room structured to investor expectations',
    'FAQ document anticipating diligence questions',
    'Pitch coaching and rehearsal sessions'
  ],
  0, NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description,
  price_from = EXCLUDED.price_from, price_to = EXCLUDED.price_to, price_unit = EXCLUDED.price_unit,
  typical_duration = EXCLUDED.typical_duration, deliverables = EXCLUDED.deliverables,
  updated_at = NOW();

INSERT INTO services (
  code, name, category, description, price_from, price_to, price_unit, typical_duration, deliverables, times_recommended, created_at, updated_at
) VALUES (
  'fractional_coo',
  'Fractional COO',
  'fractional_leadership',
  'Senior operational leadership on a flexible basis. For pre-revenue companies, focuses on converting verbal commitments to signed contracts, building first-customer operations, and creating the playbooks the founder will hand off later.',
  4000, 8000, 'month', '6-12 months minimum',
  ARRAY[
    'Sales pipeline management and LOI conversion playbook',
    'Customer success operations setup',
    'Onboarding playbook for early enterprise customers',
    'Operational rhythm: weekly priorities, monthly reviews',
    'Process documentation as you scale'
  ],
  0, NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description,
  price_from = EXCLUDED.price_from, price_to = EXCLUDED.price_to, price_unit = EXCLUDED.price_unit,
  typical_duration = EXCLUDED.typical_duration, deliverables = EXCLUDED.deliverables,
  updated_at = NOW();

INSERT INTO services (
  code, name, category, description, price_from, price_to, price_unit, typical_duration, deliverables, times_recommended, created_at, updated_at
) VALUES (
  'founder_ip_documentation_programme',
  'Founder IP Documentation Programme',
  'ip_protection',
  'Documents, assigns, and protects the IP that lives in founders'' heads. Essential pre-fundraise — investors will check IP ownership on day one of due diligence, and informal arrangements will stall or kill the deal.',
  5500, 11000, 'project', '8-12 weeks',
  ARRAY[
    'IP audit identifying all proprietary methods, content, and code',
    'Formal IP assignment agreements to the operating entity',
    'Invention assignment agreements for all developers and contractors',
    'Trade secret protection protocols',
    'Documentation of unique methodologies and frameworks',
    'Trademark filings where relevant'
  ],
  0, NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description,
  price_from = EXCLUDED.price_from, price_to = EXCLUDED.price_to, price_unit = EXCLUDED.price_unit,
  typical_duration = EXCLUDED.typical_duration, deliverables = EXCLUDED.deliverables,
  updated_at = NOW();

INSERT INTO services (
  code, name, category, description, price_from, price_to, price_unit, typical_duration, deliverables, times_recommended, created_at, updated_at
) VALUES (
  'board_governance_setup',
  'Board / NED Governance Setup',
  'governance',
  'Designs the right governance structure and recruits the right non-executives for a pre-Series A company. Independent board members signal maturity to investors and unlock the doors that come with the right names attached to the company.',
  5000, 12000, 'project', '10-14 weeks',
  ARRAY[
    'NED specification and competency framework',
    'Candidate sourcing and shortlisting',
    'Board structure design (size, committees, frequency)',
    'Board pack template and reporting rhythm',
    'Initial three-month board onboarding programme',
    'NED contract templates and fee structure'
  ],
  0, NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description,
  price_from = EXCLUDED.price_from, price_to = EXCLUDED.price_to, price_unit = EXCLUDED.price_unit,
  typical_duration = EXCLUDED.typical_duration, deliverables = EXCLUDED.deliverables,
  updated_at = NOW();

DO $$
DECLARE
  required_codes text[] := ARRAY[
    'three_goal_framework','family_investment_company','fractional_cfo',
    'cap_table_seis_eis','investor_pack_preparation','fractional_coo',
    'founder_ip_documentation_programme','board_governance_setup'
  ];
  found_count int;
  empty_description_count int;
BEGIN
  SELECT COUNT(*) INTO found_count
  FROM services
  WHERE code = ANY(required_codes);

  SELECT COUNT(*) INTO empty_description_count
  FROM services
  WHERE code = ANY(required_codes)
    AND (description IS NULL OR description = '' OR price_from IS NULL);

  RAISE NOTICE 'Catalogue check: % of % expected services present, % with empty description or price', found_count, array_length(required_codes, 1), empty_description_count;

  IF found_count <> array_length(required_codes, 1) THEN
    RAISE WARNING 'Some pre-revenue services are still missing from the catalogue';
  ELSIF empty_description_count > 0 THEN
    RAISE WARNING 'Some pre-revenue services have empty description or price metadata';
  ELSE
    RAISE NOTICE 'All 8 pre-revenue services present with metadata populated';
  END IF;
END $$;

COMMIT;
