BEGIN;

-- Add pre-revenue specific services to the services table
-- These are services RPGCC delivers but weren't yet structured in the catalogue

INSERT INTO services (code, name, headline, category, price_from, price_to, price_unit, typical_duration, status, description)
SELECT
  'tax_holdco_structuring',
  'Tax & Holdco Structuring',
  'Get your holding structure right before the round',
  'tax_advisory',
  3000, 8000, 'one_off', '4-8 weeks', 'active',
  'Family Investment Company structuring, EIS/SEIS advance assurance, share-for-share exchange timing at nil value. Time-sensitive pre-revenue service.'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'tax_holdco_structuring');

INSERT INTO services (code, name, headline, category, price_from, price_to, price_unit, typical_duration, status, description)
SELECT
  'founder_ip_programme',
  'Founder IP & Knowledge Programme',
  'Institutionalise what lives in the founder''s head',
  'governance',
  2500, 6000, 'one_off', '4-6 weeks', 'active',
  'Institutionalise founder knowledge, document IP assets, file protections, clean corporate structure for investment due diligence.'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'founder_ip_programme');

INSERT INTO services (code, name, headline, category, price_from, price_to, price_unit, typical_duration, status, description)
SELECT
  'investor_pack',
  'Investor Pack & Market Evidence',
  'A credible investor pack backed by comparable data',
  'growth',
  2000, 5000, 'one_off', '2-4 weeks', 'active',
  'RPGCC-headed investor pack with comparable rounds analysis, four-method valuation triangulation, and market evidence. Increases close probability.'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'investor_pack');

INSERT INTO services (code, name, headline, category, price_from, price_to, price_unit, typical_duration, status, description)
SELECT
  'board_governance_setup',
  'Board & Governance Setup',
  'Governance that signals maturity to investors',
  'governance',
  2000, 5000, 'one_off', '3-6 weeks', 'active',
  'Independent NED sourcing with sector relevance, governance framework design, board meeting cadence setup.'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'board_governance_setup');

COMMIT;
