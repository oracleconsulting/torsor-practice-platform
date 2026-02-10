-- =============================================================================
-- Option C: Hybrid Opportunity Surfacing — SQL patches
-- Run in Supabase SQL Editor (order: 2A → 3A → 3B)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 2A: RLS — Allow clients to read their own client-visible opportunities
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discovery_opportunities') THEN
    ALTER TABLE discovery_opportunities ENABLE ROW LEVEL SECURITY;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'RLS setup: %', SQLERRM;
END $$;

DROP POLICY IF EXISTS "clients_read_own_visible_opportunities" ON discovery_opportunities;

CREATE POLICY "clients_read_own_visible_opportunities"
ON discovery_opportunities
FOR SELECT
TO authenticated
USING (
  show_in_client_view = true
  AND engagement_id IN (
    SELECT id FROM discovery_engagements
    WHERE client_id = auth.uid()
  )
);

-- Verify
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'discovery_opportunities';

-- -----------------------------------------------------------------------------
-- PART 3A: Mark Claude Partridge's opportunities as client-visible
-- Engagement: 12d7650b-3f84-43a1-8503-5875f0dd2e6f
-- -----------------------------------------------------------------------------

UPDATE discovery_opportunities
SET show_in_client_view = true
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f'
AND severity IN ('critical', 'high');

UPDATE discovery_opportunities
SET show_in_client_view = true
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f'
AND title ILIKE '%profit extraction%';

-- Verify
SELECT title, severity, financial_impact_amount, show_in_client_view,
       quick_win IS NOT NULL AS has_quick_win,
       service_fit_limitation IS NOT NULL AS has_limitation,
       life_impact IS NOT NULL AS has_life_impact
FROM discovery_opportunities
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f'
ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END;

-- -----------------------------------------------------------------------------
-- PART 3B: Fix Page 5 next steps for Claude (reference actual journey services)
-- -----------------------------------------------------------------------------

UPDATE discovery_reports
SET destination_report = jsonb_set(
  COALESCE(destination_report, '{}'::jsonb),
  '{page5_nextSteps}',
  '{
    "headerLine": "Starting the Conversation",
    "thisWeek": {
      "action": "30-minute call to talk through your IHT exposure and what a planning workshop would actually involve",
      "tone": "This isn''t a sales conversation. It''s a chance to ask the questions you''ve been sitting on — about trusts, about gifting, about what''s possible. We''ll share what we already know from your numbers and you''ll leave with clarity on whether this is the right next step. No pressure, no commitment beyond the call.\n\nBefore we talk, have three things ready: (1) current will and trust details, (2) beneficiary list with proportions, (3) thoughts on Camberwell proceeds."
    },
    "firstStep": {
      "headline": "Start with the IHT Planning Workshop",
      "recommendation": "Your estate is £6.4M and growing. Business Property Relief doesn''t apply to property investment companies. Every year without a plan adds roughly £254k to the liability. This is the single highest-impact thing you can do right now.",
      "theirWordsEcho": "\"Inheritance planning. How to plan to pass on my wealth to my family.\"",
      "simpleCta": "£2,500 to protect your family''s inheritance"
    },
    "closingMessage": "You''ve never had a proper break. Not once. You''ve traded \"holidays and time spent with family\" for the portfolio you''ve built — and it''s been worth it. But the biggest risk to everything you''ve created isn''t a bad tenant or a market dip. It''s the £2.30M–£2.43M that could go to HMRC because the plan wasn''t in place. You told us you want to know how to pass on your wealth to your family. Let''s start there.",
    "closingLine": "Let''s talk this week.",
    "urgencyAnchor": "The estate grew 9.9% last year. That''s brilliant for your net worth — but it also means the IHT exposure grew by roughly £254k in the same period. Every month without a plan is another month of compounding liability. The conversation you''ve been meaning to have about inheritance planning? This is it."
  }'::jsonb
)
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';

-- Verify
SELECT
  destination_report->'page5_nextSteps'->>'headerLine' AS header,
  destination_report->'page5_nextSteps'->'firstStep'->>'headline' AS first_step,
  destination_report->'page5_nextSteps'->'firstStep'->>'simpleCta' AS cta
FROM discovery_reports
WHERE engagement_id = '12d7650b-3f84-43a1-8503-5875f0dd2e6f';
