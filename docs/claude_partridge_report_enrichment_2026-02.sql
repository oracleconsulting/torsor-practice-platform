-- =============================================================================
-- Claude Partridge (CEP Developments) — Report enrichment for client meeting
-- Run in Supabase SQL Editor. Engagement ID: 12d7650b-3f84-43a1-8503-5875f0dd2e6f
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PATCH 1: Page 5 — "Before we talk" prep actions
-- -----------------------------------------------------------------------------
UPDATE discovery_reports
SET page5_next_steps = jsonb_set(
  page5_next_steps,
  '{thisWeek,tone}',
  to_jsonb(
    'This isn''t a sales conversation. It''s a chance to ask the questions you''ve been sitting on — about trusts, about gifting, about what''s possible. We''ll share what we already know from your numbers and you''ll leave with clarity on whether this is the right next step. No pressure, no commitment beyond the call.'
    || E'\n\n'
    || 'Before we talk, it helps to have three things ready: (1) your current will and details of any existing trusts, (2) a list of who you want to benefit and in what proportions, and (3) your thoughts on what to do with the Camberwell proceeds — even rough instincts help. This makes our conversation twice as productive.'
  )
)
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';

-- -----------------------------------------------------------------------------
-- PATCH 2: Page 3 — Scope clarity bullets on Phase 1 and Phase 3
-- -----------------------------------------------------------------------------
-- Phase 1: IHT Workshop — what's included / what's not
UPDATE discovery_reports
SET page3_journey = jsonb_set(
  page3_journey,
  '{phases,0,whatChanges}',
  (page3_journey->'phases'->0->'whatChanges') || '["This workshop gives you the strategy and action plan — your solicitor handles the legal drafting and trust administration, but they''ll have exactly what they need to implement"]'::jsonb
)
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';

-- Phase 3: Wealth Transfer — honest about limitations
UPDATE discovery_reports
SET page3_journey = jsonb_set(
  page3_journey,
  '{phases,2,whatChanges}',
  (page3_journey->'phases'->2->'whatChanges') || '["This framework identifies risks like beneficiary readiness and potential conflicts early — so they can be addressed before they become problems"]'::jsonb
)
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';

-- -----------------------------------------------------------------------------
-- PATCH 3: Page 2 — Strengthen succession gap with £1.9M figure
-- -----------------------------------------------------------------------------
-- First verify the index (run separately if you want to check)
-- SELECT page2_gaps->'gaps'->1->>'title' as gap1_title
-- FROM discovery_reports
-- WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';
-- Expected: "No Succession Plan for a £6.4M Estate"

-- Update shiftRequired (the field that renders) to include the £ risk
UPDATE discovery_reports
SET page2_gaps = jsonb_set(
  page2_gaps,
  '{gaps,1,shiftRequired}',
  '"A written succession plan that separates your identity from the portfolio — so stepping back becomes a choice, not a crisis. Without one, a £6.4M estate is exposed to forced sale or family dispute that could destroy £1.3M–£1.9M in value."'::jsonb
)
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';

-- ALSO update financialImpact (will now render after frontend patch)
UPDATE discovery_reports
SET page2_gaps = jsonb_set(
  page2_gaps,
  '{gaps,1,financialImpact}',
  '"A £6.4M estate with no succession framework is exposed to forced sale, mismanagement, or family dispute — any of which could destroy 20–30% of value (£1.3M–£1.9M). Without a written plan, beneficiaries face difficult decisions during emotional times, often leading to outcomes that dwarf the cost of planning."'::jsonb
)
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';

-- =============================================================================
-- VERIFY (run after patches)
-- =============================================================================
-- Page 5: has "Before we talk"
SELECT page5_next_steps->'thisWeek'->>'tone' LIKE '%Before we talk%' AS has_prep
FROM discovery_reports
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';

-- Page 3: Phase 1 and Phase 3 have extra items
SELECT
  jsonb_array_length(page3_journey->'phases'->0->'whatChanges') AS phase1_items,
  jsonb_array_length(page3_journey->'phases'->2->'whatChanges') AS phase3_items
FROM discovery_reports
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';

-- Page 2: succession gap has £1.9M
SELECT
  page2_gaps->'gaps'->1->>'shiftRequired' LIKE '%1.9M%' AS shift_has_figure,
  page2_gaps->'gaps'->1->>'financialImpact' LIKE '%1.9M%' AS impact_has_figure
FROM discovery_reports
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';
