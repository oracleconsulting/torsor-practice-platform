-- ============================================================================
-- SA INDUSTRY CHAIN TEMPLATES — Pre-built process chains by industry
-- ============================================================================
-- Migration: 20260226000004_sa_industry_chain_templates.sql
--
-- 8 industry-specific process chain templates with full question configs.
-- These are NOT shown directly to clients — they're source material that
-- gets copied to specific engagements when industry/keywords match.
--
-- SAFE: All IF NOT EXISTS / ON CONFLICT DO NOTHING. No existing data modified.
-- ============================================================================

-- 1. TEMPLATE COLUMNS
ALTER TABLE sa_process_chains
  ADD COLUMN IF NOT EXISTS is_industry_template BOOLEAN DEFAULT FALSE;

ALTER TABLE sa_process_chains
  ADD COLUMN IF NOT EXISTS industry_tags TEXT[];

ALTER TABLE sa_process_chains
  ADD COLUMN IF NOT EXISTS trigger_keywords TEXT[];

COMMENT ON COLUMN sa_process_chains.is_industry_template IS
  'TRUE = template for industry-specific chains. Not shown directly to clients.';

COMMENT ON COLUMN sa_process_chains.industry_tags IS
  'Industries this template applies to. E.g. {construction, manufacturing}';

COMMENT ON COLUMN sa_process_chains.trigger_keywords IS
  'Keywords from Stage 1 free-text answers that trigger this template suggestion.';

-- 2. Relax unique so templates (engagement_id NULL) can coexist with core chains
DROP INDEX IF EXISTS idx_sa_process_chains_unique_code;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sa_process_chains_core_code_unique
  ON sa_process_chains (chain_code)
  WHERE is_core = TRUE AND (is_industry_template IS NULL OR is_industry_template = FALSE);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sa_process_chains_template_code_unique
  ON sa_process_chains (chain_code)
  WHERE is_industry_template = TRUE;

-- 3. SEED INDUSTRY TEMPLATES (engagement_id NULL, is_core FALSE, is_industry_template TRUE)
-- Using INSERT with ON CONFLICT (chain_code) DO NOTHING via unique index inference.
-- Template 1: Stock-to-Site
INSERT INTO sa_process_chains (
  chain_code, chain_name, description, trigger_areas, process_steps,
  estimated_duration_mins, display_order, is_core, is_industry_template,
  industry_tags, trigger_keywords, question_config
) VALUES (
  'stock_to_site',
  'Stock-to-Site (Inventory & Materials)',
  'From material need to site delivery and usage tracking',
  ARRAY['inventory_stock_management', 'purchasing', 'supplier_management', 'warehouse_management'],
  ARRAY['Requirement Identified', 'Stock Check', 'Purchase Order', 'Supplier Dispatch', 'Goods Received', 'Quality Check', 'Storage/Warehouse', 'Allocated to Job/Site', 'Issued/Used', 'Wastage Tracked', 'Returns Processed', 'Reorder Triggered'],
  15, 100, FALSE, TRUE,
  ARRAY['construction', 'manufacturing', 'wholesale', 'retail', 'food_and_drink', 'trades'],
  ARRAY['stock', 'inventory', 'materials', 'warehouse', 'goods', 'storage', 'wastage', 'stock control', 'material'],
  '{"name":"Stock-to-Site (Inventory & Materials)","description":"How materials and stock move from need to use","estimatedMins":15,"sections":[{"title":"Stock Visibility","questions":[{"field":"stock_tracking_method","label":"How do you currently track stock/inventory levels?","type":"select","options":["Dedicated inventory system","Module within accounting software","Spreadsheet","Paper/whiteboard","We don''t really track it","Combination of methods"],"required":true},{"field":"stock_system_name","label":"Which system(s) do you use for stock management?","type":"text","placeholder":"e.g. Sage 200 stock module, Cin7, spreadsheet..."},{"field":"stock_accuracy","label":"If you checked stock levels right now, how accurate would they be?","type":"select","options":["Very accurate (within 5%)","Roughly right (10-20% out)","Often wrong (20-50% out)","No idea — we''d have to physically count","We don''t track quantities"],"aiAnchor":true},{"field":"stock_count_frequency","label":"How often do you do a physical stock count?","type":"select","options":["Weekly","Monthly","Quarterly","Annually","Only when there''s a problem","Never"]},{"field":"stock_discrepancy_impact","label":"What happens when stock levels are wrong? Give a recent example.","type":"textarea","placeholder":"e.g. We ordered materials we already had, delayed a job because stock showed available but wasn''t...","aiAnchor":true}]},{"title":"Ordering & Receiving","questions":[{"field":"purchase_order_process","label":"How are purchase orders created?","type":"select","options":["Formal PO system with approvals","PO raised but no approval workflow","Email/phone orders — PO raised after","No PO system — orders by email/phone","Mixed — depends who is ordering"]},{"field":"po_approval_threshold","label":"Is there an approval threshold for purchases? If so, what?","type":"text","placeholder":"e.g. Over £500 needs manager approval, over £5k needs director..."},{"field":"goods_received_process","label":"What happens when goods arrive?","type":"select","options":["Checked against PO and booked into system","Checked against PO but not system-recorded","Visually checked, delivery note signed","Received and put away — checked later","Varies by site/location"]},{"field":"invoice_matching","label":"How do you match supplier invoices to what was ordered and received?","type":"select","options":["3-way match (PO, GRN, invoice) in system","Manual comparison of PO and invoice","We trust the invoice is correct","Finance handles it without seeing delivery info","It''s a mess"],"aiAnchor":true},{"field":"ordering_bypass","label":"Do staff ever bypass the ordering process? How and why?","type":"textarea","placeholder":"e.g. Site managers buy materials directly and expense them, someone created a workaround...","aiAnchor":true}]},{"title":"Allocation & Usage","questions":[{"field":"stock_allocation_method","label":"How is stock allocated to specific jobs, projects, or sites?","type":"select","options":["System-tracked per job/project","Manually logged when issued","Estimated at job costing stage","Not tracked per job","Only tracked for high-value items"]},{"field":"wastage_tracking","label":"How do you track wastage, damage, or returns?","type":"select","options":["Logged in system with reason codes","Tracked in spreadsheet","Noted informally","We don''t track wastage","Only for significant amounts"]},{"field":"reorder_process","label":"How do you know when to reorder?","type":"select","options":["Automated reorder points in system","Someone checks and orders when low","When we run out","Bulk order at regular intervals","Supplier manages our stock levels"]},{"field":"stock_cost_visibility","label":"Can you see the true cost of materials used on each job/project?","type":"select","options":["Yes — system tracks actual cost per job","Approximately — we estimate based on budgets","Only at project end when we reconcile","No — materials are just a general overhead","We know the total spend but not per-job"],"aiAnchor":true},{"field":"biggest_stock_frustration","label":"What is your single biggest frustration with stock/inventory management?","type":"textarea","placeholder":"Be specific — what keeps going wrong?","aiAnchor":true}]}]}'::JSONB
)
ON CONFLICT DO NOTHING;

-- Template 2: Asset-to-Retire
INSERT INTO sa_process_chains (
  chain_code, chain_name, description, trigger_areas, process_steps,
  estimated_duration_mins, display_order, is_core, is_industry_template,
  industry_tags, trigger_keywords, question_config
) VALUES (
  'asset_to_retire',
  'Asset-to-Retire (Equipment & Plant)',
  'From acquisition through maintenance to disposal',
  ARRAY['asset_tracking', 'maintenance_scheduling', 'equipment_management', 'fleet_management'],
  ARRAY['Asset Acquired', 'Registered', 'Allocated/Deployed', 'Maintenance Scheduled', 'Inspections', 'Repairs', 'Utilisation Tracked', 'Depreciation', 'Decommission', 'Disposal/Sale'],
  12, 101, FALSE, TRUE,
  ARRAY['construction', 'manufacturing', 'transport', 'logistics', 'property', 'facilities', 'trades'],
  ARRAY['asset', 'equipment', 'plant', 'fleet', 'vehicle', 'machinery', 'maintenance', 'depreciation', 'hire'],
  '{"name":"Asset-to-Retire (Equipment & Plant)","description":"How you manage equipment, vehicles, and physical assets","estimatedMins":12,"sections":[{"title":"Asset Register","questions":[{"field":"asset_register_method","label":"How do you track your assets and equipment?","type":"select","options":["Dedicated asset management system","Module within accounting software","Spreadsheet","Paper records","We don''t have a central register"],"required":true},{"field":"asset_register_completeness","label":"How complete and up-to-date is your asset register?","type":"select","options":["Comprehensive and current","Mostly complete — some gaps","Partial — only high-value items","Out of date","Non-existent"],"aiAnchor":true},{"field":"asset_location_tracking","label":"Can you tell where each asset is right now?","type":"select","options":["Yes — GPS/system tracked","Yes — manually logged locations","For most items","Only if we ask around","No"]},{"field":"asset_utilisation","label":"Do you know how much each asset is actually being used vs sitting idle?","type":"select","options":["Yes — tracked by hours/usage","Roughly","No — we just deploy as needed","Some assets we''ve probably forgotten about"],"aiAnchor":true}]},{"title":"Maintenance & Compliance","questions":[{"field":"maintenance_scheduling","label":"How is preventive maintenance scheduled?","type":"select","options":["System-automated based on intervals/hours","Calendar reminders","Spreadsheet tracking","When something breaks","Operator reports issues"]},{"field":"inspection_compliance","label":"How do you track statutory inspections and certifications?","type":"select","options":["System with automated reminders","Spreadsheet with manual reminders","Calendar entries","Rely on contractors to tell us","We sometimes miss them"],"aiAnchor":true},{"field":"maintenance_cost_tracking","label":"Can you see total cost of ownership per asset (purchase + maintenance + fuel)?","type":"select","options":["Yes — system tracks all costs per asset","Partially — maintenance separate from purchase","Only repair costs","No — it''s all lumped together"],"aiAnchor":true},{"field":"biggest_asset_frustration","label":"What is your biggest frustration managing assets/equipment?","type":"textarea","aiAnchor":true}]}]}'::JSONB
)
ON CONFLICT DO NOTHING;

-- Template 3: Tender-to-Award
INSERT INTO sa_process_chains (
  chain_code, chain_name, description, trigger_areas, process_steps,
  estimated_duration_mins, display_order, is_core, is_industry_template,
  industry_tags, trigger_keywords, question_config
) VALUES (
  'tender_to_award',
  'Tender-to-Award (Estimating & Bidding)',
  'From opportunity identified to contract won',
  ARRAY['estimating', 'tender_management', 'pricing', 'bid_management'],
  ARRAY['Opportunity Identified', 'Qualify/No-Bid', 'Documents Gathered', 'Site Visit/Survey', 'Estimate Built', 'Subcontractor Quotes', 'Price Assembled', 'Internal Review', 'Submission', 'Clarifications', 'Award/Loss', 'Debrief'],
  12, 102, FALSE, TRUE,
  ARRAY['construction', 'engineering', 'infrastructure', 'facilities', 'trades'],
  ARRAY['tender', 'bid', 'estimate', 'pricing', 'contract award', 'subcontractor', 'BOQ', 'bill of quantities', 'competitive tender'],
  '{"name":"Tender-to-Award (Estimating & Bidding)","description":"How you price, bid for, and win work","estimatedMins":12,"sections":[{"title":"Opportunity & Qualification","questions":[{"field":"opportunity_tracking","label":"How do you track upcoming tender/bid opportunities?","type":"select","options":["CRM or pipeline system","Shared spreadsheet","Email folders","Word of mouth / relationships","Portal notifications (e.g. Constructionline)"],"required":true},{"field":"bid_no_bid_process","label":"Do you have a formal bid/no-bid decision process?","type":"select","options":["Yes — scoring criteria and review meeting","Informal discussion","Director decides","We bid for everything","Depends on workload"]},{"field":"tender_win_rate","label":"Roughly what percentage of tenders do you win?","type":"select","options":["Over 50%","30-50%","15-30%","Under 15%","Don''t track it"],"aiAnchor":true}]},{"title":"Estimating & Pricing","questions":[{"field":"estimating_tools","label":"What tools do you use for estimating/pricing?","type":"select","options":["Dedicated estimating software (e.g. Causeway, Buildsoft)","Spreadsheet templates","Module in accounting/ERP","From experience/gut feel","Combination"]},{"field":"historical_cost_data","label":"Can you easily access historical cost data from previous jobs when estimating?","type":"select","options":["Yes — system provides actuals vs estimates","Partially — have to dig for it","Not really — estimates are fresh each time","We know roughly from experience"],"aiAnchor":true},{"field":"subcontractor_pricing","label":"How do you manage subcontractor/supplier pricing during tenders?","type":"select","options":["Supply chain management system","Spreadsheet of preferred suppliers","Phone around each time","Rely on relationships","Subcontractors approach us"]},{"field":"estimating_accuracy","label":"How do your estimates compare to actual project costs?","type":"select","options":["Usually within 5%","Within 10-15%","Often 15-25% out","Regularly significantly over or under","We don''t compare — that''s part of the problem"],"aiAnchor":true},{"field":"biggest_estimating_frustration","label":"What is your biggest frustration with the tendering/estimating process?","type":"textarea","aiAnchor":true}]}]}'::JSONB
)
ON CONFLICT DO NOTHING;

-- Template 4: Sub-to-Settle
INSERT INTO sa_process_chains (
  chain_code, chain_name, description, trigger_areas, process_steps,
  estimated_duration_mins, display_order, is_core, is_industry_template,
  industry_tags, trigger_keywords, question_config
) VALUES (
  'sub_to_settle',
  'Sub-to-Settle (Subcontractor Management)',
  'From approved list to final account',
  ARRAY['subcontractor_management', 'supplier_management', 'contractor_compliance'],
  ARRAY['Approved List', 'Prequalification', 'Tender/Quote', 'Award', 'Onboarding', 'Insurance/Compliance', 'Work Monitored', 'Valuations', 'Payment', 'Retention', 'Final Account', 'Performance Review'],
  12, 103, FALSE, TRUE,
  ARRAY['construction', 'engineering', 'property_development', 'infrastructure'],
  ARRAY['subcontractor', 'sub-contractor', 'subbies', 'contractor management', 'CIS', 'retention', 'valuation', 'application for payment', 'final account'],
  '{"name":"Sub-to-Settle (Subcontractor Management)","description":"How you manage subcontractors from approval to final account","estimatedMins":12,"sections":[{"title":"Onboarding & Compliance","questions":[{"field":"approved_supplier_list","label":"Do you maintain an approved subcontractor/supplier list?","type":"select","options":["Yes — formal system with prequalification","Yes — spreadsheet or document","Informal — we know who we use","No formal list"],"required":true},{"field":"compliance_checks","label":"What compliance do you check before engaging a subcontractor?","type":"multiselect","options":["Insurance certificates","CSCS/competency cards","CIS registration","Health & safety policy","References","Financial checks","Right to work","None formally"]},{"field":"compliance_expiry_tracking","label":"How do you track when subcontractor compliance documents expire?","type":"select","options":["System with automated alerts","Spreadsheet with manual review","Check at start of each job","We don''t — rely on subcontractors to inform us","Only check if there''s an incident"],"aiAnchor":true}]},{"title":"Payment & CIS","questions":[{"field":"valuation_process","label":"How do subcontractors submit valuations/applications for payment?","type":"select","options":["Formal application with supporting docs","Email with breakdown","Invoice only","Verbal agreement then invoice","Varies by sub"]},{"field":"cis_management","label":"How do you manage CIS deductions and returns?","type":"select","options":["Automated through payroll/accounts system","Spreadsheet calculations","Accountant handles it","Manual calculations","Not sure it''s done correctly"],"aiAnchor":true},{"field":"retention_tracking","label":"How do you track retention amounts and release dates?","type":"select","options":["System-tracked per contract","Spreadsheet","Finance team tracks manually","We often forget until asked","We don''t hold retention"]},{"field":"biggest_subcontractor_frustration","label":"What is your biggest frustration managing subcontractors?","type":"textarea","aiAnchor":true}]}]}'::JSONB
)
ON CONFLICT DO NOTHING;

-- Template 5: Book-to-Bill
INSERT INTO sa_process_chains (
  chain_code, chain_name, description, trigger_areas, process_steps,
  estimated_duration_mins, display_order, is_core, is_industry_template,
  industry_tags, trigger_keywords, question_config
) VALUES (
  'book_to_bill',
  'Book-to-Bill (Booking & Scheduling)',
  'From enquiry through scheduling to payment',
  ARRAY['booking_scheduling', 'appointment_management', 'capacity_planning'],
  ARRAY['Enquiry', 'Availability Check', 'Booking Made', 'Confirmation Sent', 'Reminder Sent', 'Service Delivered', 'Feedback Collected', 'Invoice/Payment', 'Follow-up/Rebooking'],
  10, 104, FALSE, TRUE,
  ARRAY['hospitality', 'healthcare', 'beauty_wellness', 'professional_services', 'trades', 'education', 'fitness'],
  ARRAY['booking', 'appointment', 'scheduling', 'reservation', 'capacity', 'availability', 'no-show', 'cancellation', 'diary'],
  '{"name":"Book-to-Bill (Booking & Scheduling)","description":"How enquiries become bookings and get serviced","estimatedMins":10,"sections":[{"title":"Booking Process","questions":[{"field":"booking_method","label":"How do customers/clients book with you?","type":"multiselect","options":["Online booking system","Phone","Email","Walk-in","Through a platform (e.g. Treatwell)","Social media DMs"],"required":true},{"field":"booking_system","label":"What system manages your bookings?","type":"text","placeholder":"e.g. Calendly, Acuity, custom system, diary..."},{"field":"double_booking_risk","label":"How often do double-bookings or scheduling conflicts occur?","type":"select","options":["Never — system prevents it","Rarely","Monthly","Weekly","It''s a constant problem"],"aiAnchor":true},{"field":"no_show_handling","label":"How do you handle no-shows and late cancellations?","type":"select","options":["System-enforced policy with charges","Policy exists but rarely enforced","We call to reschedule","We absorb the cost","Significant unsolved problem"],"aiAnchor":true}]},{"title":"Capacity & Revenue","questions":[{"field":"capacity_visibility","label":"Can you see your capacity utilisation (% of available slots filled)?","type":"select","options":["Yes — real-time dashboard","Yes — but requires manual calculation","Roughly","No"],"aiAnchor":true},{"field":"pricing_variation","label":"Do you vary pricing based on demand (peak/off-peak)?","type":"select","options":["Yes — automated dynamic pricing","Yes — manual seasonal rates","No — fixed pricing","We should but don''t know how"]},{"field":"biggest_booking_frustration","label":"What is your biggest frustration with booking and scheduling?","type":"textarea","aiAnchor":true}]}]}'::JSONB
)
ON CONFLICT DO NOTHING;

-- Template 6: Order-to-Deliver
INSERT INTO sa_process_chains (
  chain_code, chain_name, description, trigger_areas, process_steps,
  estimated_duration_mins, display_order, is_core, is_industry_template,
  industry_tags, trigger_keywords, question_config
) VALUES (
  'order_to_deliver',
  'Order-to-Deliver (Fulfilment)',
  'From customer order to delivered and confirmed',
  ARRAY['order_management', 'fulfilment', 'shipping', 'warehouse_management'],
  ARRAY['Order Placed', 'Payment Confirmed', 'Order Processed', 'Picked', 'Packed', 'Dispatched', 'Tracking Sent', 'Delivered', 'Confirmation', 'Returns/Refunds'],
  12, 105, FALSE, TRUE,
  ARRAY['retail', 'wholesale', 'ecommerce', 'food_and_drink', 'manufacturing'],
  ARRAY['order', 'fulfilment', 'shipping', 'dispatch', 'delivery', 'warehouse', 'picking', 'packing', 'returns', 'ecommerce', 'online orders'],
  '{"name":"Order-to-Deliver (Fulfilment)","description":"How customer orders get fulfilled and delivered","estimatedMins":12,"sections":[{"title":"Order Processing","questions":[{"field":"order_channels","label":"Where do customer orders come from?","type":"multiselect","options":["Website/online store","Phone/email","In-store/counter","Marketplace (Amazon, eBay)","Sales rep/trade orders","EDI/automated"],"required":true},{"field":"order_system","label":"What system processes orders?","type":"text","placeholder":"e.g. Shopify, Xero, manual entry..."},{"field":"order_to_dispatch_time","label":"How long from order to dispatch typically?","type":"select","options":["Same day","Next day","2-3 days","3-5 days","Over a week","Varies wildly"]},{"field":"stock_sync_accuracy","label":"Are stock levels accurate across all sales channels?","type":"select","options":["Yes — real-time sync","Mostly — minor delays","Often out of sync","We oversell regularly","Single channel only"],"aiAnchor":true}]},{"title":"Delivery & Returns","questions":[{"field":"delivery_tracking","label":"Can customers track their delivery?","type":"select","options":["Yes — automated tracking updates","Yes — but we send manually","Carrier tracking only","No tracking available"]},{"field":"returns_process","label":"How do you handle returns and refunds?","type":"select","options":["Automated return portal","Email/phone — processed manually","In-store returns only","Ad hoc — no formal process","Returns are rare for us"],"aiAnchor":true},{"field":"delivery_cost_visibility","label":"Do you know your true cost per delivery/fulfilment?","type":"select","options":["Yes — fully tracked per order","Approximately","Only shipping cost, not handling","No — it''s a black hole"],"aiAnchor":true},{"field":"biggest_fulfilment_frustration","label":"What is your biggest frustration with fulfilment?","type":"textarea","aiAnchor":true}]}]}'::JSONB
)
ON CONFLICT DO NOTHING;

-- Template 7: Ticket-to-Resolve
INSERT INTO sa_process_chains (
  chain_code, chain_name, description, trigger_areas, process_steps,
  estimated_duration_mins, display_order, is_core, is_industry_template,
  industry_tags, trigger_keywords, question_config
) VALUES (
  'ticket_to_resolve',
  'Ticket-to-Resolve (Service & Support)',
  'From customer issue to resolution and feedback',
  ARRAY['customer_support', 'helpdesk', 'service_delivery', 'sla_management'],
  ARRAY['Issue Reported', 'Ticket Created', 'Triaged/Prioritised', 'Assigned', 'Investigation', 'Resolution', 'Customer Updated', 'Closed', 'Feedback', 'Knowledge Base Updated'],
  10, 106, FALSE, TRUE,
  ARRAY['it_services', 'msp', 'saas', 'professional_services', 'technology'],
  ARRAY['ticket', 'helpdesk', 'support', 'SLA', 'incident', 'service desk', 'issue tracking', 'customer support', 'help desk'],
  '{"name":"Ticket-to-Resolve (Service & Support)","description":"How customer issues get reported, tracked, and resolved","estimatedMins":10,"sections":[{"title":"Issue Capture & Triage","questions":[{"field":"issue_channels","label":"How do customers report issues?","type":"multiselect","options":["Ticket portal/email","Phone","Live chat","WhatsApp/SMS","In person","Social media","Account manager"],"required":true},{"field":"ticketing_system","label":"What system do you use for tracking issues?","type":"text","placeholder":"e.g. Freshdesk, Zendesk, Jira, spreadsheet..."},{"field":"sla_tracking","label":"Do you have SLAs and can you track performance against them?","type":"select","options":["Yes — automated SLA tracking with alerts","SLAs defined but tracked manually","Informal response time goals","No SLAs","Have them but regularly miss them"],"aiAnchor":true},{"field":"triage_process","label":"How are issues prioritised and assigned?","type":"select","options":["Automated rules based on type/severity","Manager reviews and assigns","First available takes it","Whoever shouts loudest gets priority","Depends on the day"]}]},{"title":"Resolution & Learning","questions":[{"field":"resolution_visibility","label":"Can you see resolution times, trends, and recurring issues?","type":"select","options":["Yes — dashboards and reports","Some reports but limited","Would have to manually compile","No visibility"],"aiAnchor":true},{"field":"knowledge_base_status","label":"Do you have a knowledge base or documented solutions for common issues?","type":"select","options":["Yes — comprehensive and maintained","Yes — but outdated","Started one, never maintained","No","It''s in people''s heads"]},{"field":"biggest_support_frustration","label":"What is your biggest frustration with handling customer issues?","type":"textarea","aiAnchor":true}]}]}'::JSONB
)
ON CONFLICT DO NOTHING;

-- Template 8: Quality-to-Certify
INSERT INTO sa_process_chains (
  chain_code, chain_name, description, trigger_areas, process_steps,
  estimated_duration_mins, display_order, is_core, is_industry_template,
  industry_tags, trigger_keywords, question_config
) VALUES (
  'quality_to_certify',
  'Quality-to-Certify (Quality & Safety)',
  'From standards and requirements to certified compliance',
  ARRAY['quality_management', 'health_safety', 'iso_certification', 'audit_compliance'],
  ARRAY['Standards Defined', 'Procedures Documented', 'Training Delivered', 'Inspections/Audits', 'Non-Conformance Raised', 'Corrective Action', 'Root Cause Analysis', 'Verification', 'Management Review', 'Certification Maintained'],
  10, 107, FALSE, TRUE,
  ARRAY['construction', 'manufacturing', 'food_and_drink', 'healthcare', 'engineering', 'facilities'],
  ARRAY['quality', 'ISO', 'health and safety', 'H&S', 'RAMS', 'method statement', 'inspection', 'non-conformance', 'NCR', 'COSHH', 'certification', 'accreditation'],
  '{"name":"Quality-to-Certify (Quality & Safety)","description":"How you manage quality standards, health & safety, and certifications","estimatedMins":10,"sections":[{"title":"Quality & Safety Management","questions":[{"field":"qms_system","label":"How do you manage quality/H&S documentation?","type":"select","options":["Dedicated QMS system","Document management system","Shared drive with folders","Paper-based","Mixed — no single system"],"required":true},{"field":"certifications_held","label":"Which certifications/accreditations do you hold?","type":"multiselect","options":["ISO 9001","ISO 14001","ISO 45001","CHAS","Constructionline","SafeContractor","BREEAM","Industry-specific","None currently"]},{"field":"incident_reporting","label":"How are quality issues, near-misses, or safety incidents reported?","type":"select","options":["Digital reporting system/app","Paper forms","Email to H&S manager","Verbally reported","Often not reported"],"aiAnchor":true},{"field":"audit_readiness","label":"If an auditor arrived tomorrow, how ready would you be?","type":"select","options":["Fully ready — everything accessible","Mostly ready — minor gaps","Would need a few days to prepare","It would be a scramble","We''d be in trouble"],"aiAnchor":true},{"field":"biggest_quality_frustration","label":"What is your biggest frustration with quality/safety management?","type":"textarea","aiAnchor":true}]}]}'::JSONB
)
ON CONFLICT DO NOTHING;
