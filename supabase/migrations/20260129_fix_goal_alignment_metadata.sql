-- ============================================================================
-- FIX: Goal Alignment Programme Metadata - Remove Hardcoded Examples
-- ============================================================================
-- The ROI calculation had a specific "70→40 hours" example that appears to be
-- from a previous client (Ben). Making all content generic.
-- ============================================================================

UPDATE service_line_metadata
SET 
  name = 'Goal Alignment Programme',
  display_name = 'Goal Alignment Programme',
  core_function = 'Life-first business transformation with 5-year vision, 6-month shift, and 12-week sprints',
  short_description = 'Life-first business transformation with structured accountability',
  problems_addressed = ARRAY[
    'Working long hours but no closer to the life you want',
    'Business running you instead of you running the business',
    'Success defined as exit but no structured path to get there',
    'Wanting to move from operator to investor but stuck in the weeds',
    'Clear vision but no accountability or structured pathway',
    'Making progress on the business but not on your life goals',
    'Knowing what needs to change but not having support to make it happen'
  ],
  key_deliverables = ARRAY[
    '5-Year Vision document - where you want life and business to be',
    '6-Month Shift priorities - the key changes to make this quarter',
    '12-Week Sprint plans - specific actions with deadlines',
    'Weekly accountability sessions - someone keeping you honest',
    'Progress tracking dashboard - visible momentum',
    'Life-work integration scorecard - measuring what actually matters'
  ],
  typical_timeline = '12-month programme with weekly touchpoints',
  roi_calculation_method = 'Hours reclaimed + opportunity cost. Founders typically reclaim 15-30 hours/week through better delegation and focus. That time can be reinvested in strategic work, family, or simply not burning out. The real ROI is building a business that serves your life goals, not the other way around.',
  pricing = '[{"tier": "Lite", "amount": 1500, "frequency": "annual"}, {"tier": "Growth", "amount": 4500, "frequency": "annual"}, {"tier": "Partner", "amount": 9000, "frequency": "annual"}]'::jsonb,
  updated_at = NOW()
WHERE code = '365_method';

-- Also update the timing rules to be more generic
UPDATE service_timing_rules
SET 
  ideal_timing = 'When you have a clear vision of a different future but need structure and accountability to get there',
  too_early = 'Still figuring out if the business is viable, or no clear vision of a different future',
  too_late = 'After burnout has caused irreversible damage to health or relationships'
WHERE service_code = '365_method';

-- Update the triggers to remove hardcoded examples
UPDATE service_advisory_triggers
SET 
  client_value_template = 'You described a life that looks very different from today. Getting there requires identity transformation, not just working harder. You need a structured path from where you are to where you want to be.'
WHERE service_code = '365_method' 
  AND trigger_spec->>'pattern' = 'lifestyle_transformation_detected';

UPDATE service_advisory_triggers
SET 
  client_value_template = 'Your current hours are not sustainable for the destination you described. Something structural needs to change.'
WHERE service_code = '365_method' 
  AND trigger_spec->>'question' = 'dd_owner_hours';

-- Verify the update
SELECT code, name, display_name, roi_calculation_method 
FROM service_line_metadata 
WHERE code = '365_method';

