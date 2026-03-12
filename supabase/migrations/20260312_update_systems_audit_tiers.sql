-- Update Systems & Process Audit service description and tiers
-- The edge function registries were updated; now sync the DB catalogue

UPDATE service_catalogue
SET 
  tagline = 'See What''s Actually Running Your Business',
  short_description = 'A comprehensive review of your operational systems, processes, and dependencies — identifying what''s documented, what''s assumed, and where the risks are.'
WHERE code = 'systems_audit';

-- Delete existing tiers for systems_audit and recreate
DELETE FROM service_tiers
WHERE service_id = (SELECT id FROM service_catalogue WHERE code = 'systems_audit');

INSERT INTO service_tiers (service_id, tier_code, tier_name, short_description, price_display, display_order, is_recommended)
SELECT 
  id,
  'the_map',
  'The Map',
  'Every process in your business documented and mapped. Who does what, what depends on whom, where the bottlenecks sit, and which tasks only exist in the founder''s head. Includes a dependency risk score showing how exposed you are if key people leave. Delivered as a visual process map with a 60-minute walkthrough.',
  '£2,000',
  1,
  true
FROM service_catalogue WHERE code = 'systems_audit'
UNION ALL
SELECT 
  id,
  'the_blueprint',
  'The Blueprint',
  'Everything in The Map, plus a prioritised delegation roadmap showing exactly which processes to hand over first, who should own them, and what training or documentation is needed. Includes time cost analysis — how many hours per week each process consumes and what those hours cost at your billing rate. A 2-hour strategy session to agree the handover sequence and build your 90-day implementation plan.',
  '£4,500',
  2,
  false
FROM service_catalogue WHERE code = 'systems_audit';
