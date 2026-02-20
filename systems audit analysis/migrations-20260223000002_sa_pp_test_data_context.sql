-- Optional: backfill "Anything to add?" context for P&P test engagement (SA Assessment Part 4).
-- Run only when the test engagement exists (id::text LIKE '80603cc0%').
-- Stage 1: add context to sa_discovery_responses.raw_responses
UPDATE sa_discovery_responses
SET raw_responses = raw_responses || '{
  "sa_operations_diagnosis_context": "It works because Maria and Priya hold everything together through sheer willpower. If either were off for a week the whole thing falls apart. That''s what scares me.",
  "sa_manual_hours_context": "Mostly Maria on invoicing reconciliation (8-10 hrs) and the Master Tracker (3-4 hrs). Priya probably spends 5+ hrs on resource allocation that should be automated. Devs waste time on Harvest entry because there''s no Monday integration.",
  "sa_month_end_duration_context": "Two weeks but Maria says it could be 5 days if the chart of accounts was fixed and Harvest-Xero sync worked. She spends most of it detective work — chasing missing receipts and matching project codes.",
  "sa_data_error_frequency_context": "The VAT penalty was the big one. But we also regularly find invoices that went to wrong Xero contacts, time logged to wrong Harvest projects. Maria catches most of it but some slip through.",
  "sa_information_access_context": "Biggest one is project profitability — literally cannot answer that without Maria spending half a day. Cash position requires checking 3 sources. Pipeline is in Sophie''s head and a spreadsheet nobody else sees.",
  "sa_integration_health_context": "Xero and Dext are technically connected but Maria disabled auto-publish after the VAT penalty. Stripe syncs but creates duplicates she has to clean. Slack integrates with nothing useful. Monday and Harvest are completely disconnected.",
  "sa_spreadsheet_count_context": "The Master Tracker is the big one — project status + resource allocation. Then Maria''s Harvest-Xero mapping sheet, Priya''s personal pipeline tracker, the holiday spreadsheet, and Maria''s ''real numbers'' sheet she uses because she doesn''t trust what Xero shows.",
  "sa_change_appetite_context": "The September payroll scare pushed us from cautious to ready. Sophie has budget approval from the board. Main constraint is not wanting to disrupt Maria during month-end — need to time implementation around the financial calendar.",
  "sa_champion_context": "Sophie will champion but Priya is the operational lead who''ll actually drive adoption. Maria needs to be involved in anything touching finance but she''s resistant to change after the VAT penalty experience.",
  "sa_growth_type_context": "We want to shift the mix — less one-off project work, more retainers for predictable revenue. But we can''t launch the retainer product without capacity visibility. It''s a chicken-and-egg problem.",
  "sa_locations_context": "Brighton office 3 days, remote 2 days for most of the team. Jake''s devs are mostly remote. Sophie wants a London hot-desk for client meetings but can''t justify cost without knowing cash runway."
}'::jsonb,
updated_at = now()
WHERE engagement_id = (
  SELECT id FROM sa_engagements WHERE id::text LIKE '80603cc0%' LIMIT 1
);

-- Stage 3: Quote-to-Cash
UPDATE sa_process_deep_dives
SET responses = responses || '{
  "quote_creation_method_context": "Sophie copies from the last similar proposal in Google Drive and edits. No template library, no pricing calculator, no version control. Takes 2-4 hours per proposal.",
  "quote_authority_context": "Priya handles retainer renewals from a template Sophie set up — same price, same scope, just re-sends. She cannot price new work or negotiate scope. If Sophie is unavailable, proposals don''t go out.",
  "invoice_lag_days_context": "Mainly because Maria waits for Sophie to confirm project milestones are complete. No automated trigger from Monday.com. Maria also batches invoicing to Tuesdays which adds artificial delay.",
  "debt_chaser_context": "Maria sends manual emails. No automation, no escalation process. She feels awkward chasing because ''they''re Sophie''s clients''. The two slow-payers have been over 60 days for months.",
  "process_documentation_status_context": "If Sophie got hit by a bus, nobody could price or send a proposal. Maria is the only person who understands the Xero to Harvest to invoice reconciliation. Priya is the only one who knows which clients are on what payment terms."
}'::jsonb,
updated_at = now()
WHERE engagement_id = (SELECT id FROM sa_engagements WHERE id::text LIKE '80603cc0%' LIMIT 1)
AND chain_code = 'quote_to_cash';

-- Stage 3: Hire-to-Retire
UPDATE sa_process_deep_dives
SET responses = responses || '{
  "contractor_access_handling_context": "The two contractors have the same Slack, Monday, and Figma access as employees. One has Harvest access to log time. No offboarding difference either — when a freelance designer finished last year their Figma access was active for 2 months.",
  "leave_pain_context": "The Google Sheet for holidays is technically Lily''s responsibility but people forget to update it. Priya found out someone was on holiday mid-project twice last quarter."
}'::jsonb,
updated_at = now()
WHERE engagement_id = (SELECT id FROM sa_engagements WHERE id::text LIKE '80603cc0%' LIMIT 1)
AND chain_code = 'hire_to_retire';

-- Stage 3: Record-to-Report
UPDATE sa_process_deep_dives
SET responses = responses || '{
  "bank_rec_frequency_context": "Weekly in theory but Maria admits it sometimes slips to fortnightly during busy periods. The Stripe transactions are the worst because of duplicate entries from the native sync.",
  "accruals_process_context": "Maria knows about accruals but says the chart of accounts is so messy she can''t do them properly. She''d need a clean COA and project-level tracking to accrue WIP, which doesn''t exist."
}'::jsonb,
updated_at = now()
WHERE engagement_id = (SELECT id FROM sa_engagements WHERE id::text LIKE '80603cc0%' LIMIT 1)
AND chain_code = 'record_to_report';
