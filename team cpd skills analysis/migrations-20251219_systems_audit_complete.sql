-- ============================================================================
-- SYSTEMS AUDIT AI LAYER - COMPLETE THREE-STAGE SCHEMA
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: sa_engagements
-- Core engagement record linking all stages
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_engagements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    
    engagement_type TEXT NOT NULL DEFAULT 'diagnostic' 
        CHECK (engagement_type IN ('diagnostic', 'full_audit', 'implementation', 'review')),
    scope_areas TEXT[] DEFAULT ARRAY['finance', 'sales', 'operations', 'hr', 'marketing'],
    quoted_price DECIMAL(10,2),
    
    -- Stage tracking
    stage_1_completed_at TIMESTAMPTZ,
    stage_2_completed_at TIMESTAMPTZ,
    stage_3_completed_at TIMESTAMPTZ,
    stage_3_scheduled_at TIMESTAMPTZ,
    stage_3_consultant_id UUID,
    
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'stage_1_complete', 'stage_2_complete', 'stage_3_scheduled', 'stage_3_complete', 'analysis_complete', 'report_delivered', 'implementation', 'completed')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: sa_discovery_responses (Stage 1)
-- Emotional anchors, pain quantification, readiness
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_discovery_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
    
    -- Section 1: Current Pain
    systems_breaking_point TEXT,              -- Q1.1: What broke or is about to break
    operations_self_diagnosis TEXT            -- Q1.2: Controlled chaos / Manual heroics / Death by spreadsheet / Tech Frankenstein / Actually pretty good
        CHECK (operations_self_diagnosis IN ('controlled_chaos', 'manual_heroics', 'death_by_spreadsheet', 'tech_frankenstein', 'actually_good')),
    month_end_shame TEXT,                     -- Q1.3: What would embarrass you
    
    -- Section 2: Impact Quantification
    manual_hours_monthly TEXT                 -- Q2.1: Under 10 / 10-20 / 20-40 / 40-80 / 80+
        CHECK (manual_hours_monthly IN ('under_10', '10_20', '20_40', '40_80', 'over_80')),
    month_end_close_duration TEXT             -- Q2.2: 1-2 days / 3-5 days / 1-2 weeks / 2-4 weeks / ongoing
        CHECK (month_end_close_duration IN ('1_2_days', '3_5_days', '1_2_weeks', '2_4_weeks', 'ongoing')),
    data_error_frequency TEXT                 -- Q2.3: Never / Once or twice / Several times / Regularly / Don't know
        CHECK (data_error_frequency IN ('never', 'once_twice', 'several', 'regularly', 'dont_know')),
    expensive_systems_mistake TEXT,           -- Q2.4: Lost client, tax penalty, etc
    information_access_frequency TEXT         -- Q2.5 (NEW): How often can't get info in 5 mins
        CHECK (information_access_frequency IN ('never', '1_2_times', 'weekly', 'daily', 'constantly')),
    
    -- Section 3: Tech Stack (Quick signal - depth in Stage 2)
    software_tools_used TEXT[],               -- Q3.1: Multi-select
    integration_rating TEXT                   -- Q3.2: Seamless / Partial / Minimal / Non-existent
        CHECK (integration_rating IN ('seamless', 'partial', 'minimal', 'none')),
    critical_spreadsheets TEXT                -- Q3.3: None / 1-3 / 4-10 / 10-20 / Lost count
        CHECK (critical_spreadsheets IN ('none', '1_3', '4_10', '10_20', 'lost_count')),
    
    -- Section 4: Focus Areas
    broken_areas TEXT[],                      -- Q4.1: Top 3 broken areas (drives Stage 3 deep dives)
    magic_process_fix TEXT,                   -- Q4.2: One process to fix by magic
    
    -- Section 5: Readiness
    change_appetite TEXT                      -- Q5.1: Urgent / Ready / Cautious / Exploring
        CHECK (change_appetite IN ('urgent', 'ready', 'cautious', 'exploring')),
    systems_fears TEXT[],                     -- Q5.2: Multi-select fears
    internal_champion TEXT                    -- Q5.3: Who would champion
        CHECK (internal_champion IN ('founder', 'finance_manager', 'operations_manager', 'office_manager', 'it_lead', 'other')),
    
    -- Section 6: Context (NEW)
    team_size INTEGER,                        -- Q6.1
    expected_team_size_12mo INTEGER,          -- Q6.2
    revenue_band TEXT                         -- Q6.3
        CHECK (revenue_band IN ('under_250k', '250k_500k', '500k_1m', '1m_2m', '2m_5m', '5m_10m', 'over_10m')),
    industry_sector TEXT,                     -- Q6.4
    
    raw_responses JSONB,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(engagement_id)
);

-- ============================================================================
-- TABLE: sa_system_categories
-- Reference table for system categorisation
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_system_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_code TEXT NOT NULL UNIQUE,
    category_name TEXT NOT NULL,
    parent_category TEXT,
    display_order INTEGER,
    common_systems TEXT[],                    -- Pre-populated suggestions
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed system categories
INSERT INTO sa_system_categories (category_code, category_name, parent_category, display_order, common_systems) VALUES
-- Accounting & Finance
('accounting_software', 'Accounting Software', 'ACCOUNTING_FINANCE', 1, ARRAY['Xero', 'QuickBooks', 'Sage', 'FreeAgent', 'Kashflow']),
('invoicing_billing', 'Invoicing & Billing', 'ACCOUNTING_FINANCE', 2, ARRAY['Xero Invoicing', 'QuickBooks Invoicing', 'Stripe Billing', 'GoCardless']),
('expense_management', 'Expense Management', 'ACCOUNTING_FINANCE', 3, ARRAY['Pleo', 'Dext', 'Expensify', 'Spendesk', 'Soldo']),
('payment_collection', 'Payment Collection', 'ACCOUNTING_FINANCE', 4, ARRAY['GoCardless', 'Stripe', 'Square', 'PayPal', 'Worldpay']),
('bank_feeds', 'Bank Feeds & Reconciliation', 'ACCOUNTING_FINANCE', 5, ARRAY['Bank feeds via Xero/QBO', 'Plaid', 'Yapily']),
('financial_reporting', 'Financial Reporting / BI', 'ACCOUNTING_FINANCE', 6, ARRAY['Fathom', 'Spotlight Reporting', 'Futrli', 'Float', 'Syft']),
('budgeting_forecasting', 'Budgeting & Forecasting', 'ACCOUNTING_FINANCE', 7, ARRAY['Float', 'Futrli', 'Spotlight', 'Excel']),
('multi_currency', 'Multi-currency / Treasury', 'ACCOUNTING_FINANCE', 8, ARRAY['Wise Business', 'Revolut Business', 'OANDA']),

-- Sales & CRM
('crm_platform', 'CRM Platform', 'SALES_CRM', 10, ARRAY['HubSpot', 'Salesforce', 'Pipedrive', 'Zoho CRM', 'Monday CRM']),
('proposals_quotes', 'Proposals & Quotes', 'SALES_CRM', 11, ARRAY['PandaDoc', 'Qwilr', 'Better Proposals', 'Proposify']),
('e_signatures', 'E-signatures', 'SALES_CRM', 12, ARRAY['DocuSign', 'Adobe Sign', 'HelloSign', 'PandaDoc']),
('sales_enablement', 'Sales Enablement', 'SALES_CRM', 13, ARRAY['Gong', 'Chorus', 'Outreach', 'SalesLoft']),
('pipeline_reporting', 'Pipeline Reporting', 'SALES_CRM', 14, ARRAY['HubSpot Reports', 'Salesforce Reports', 'Geckoboard']),
('commission_tracking', 'Commission Tracking', 'SALES_CRM', 15, ARRAY['CaptivateIQ', 'Spiff', 'Excel']),

-- HR & Payroll
('core_hris', 'Core HR / HRIS', 'HR_PAYROLL', 20, ARRAY['BreatheHR', 'CharlieHR', 'HiBob', 'Personio', 'BambooHR']),
('payroll', 'Payroll Processing', 'HR_PAYROLL', 21, ARRAY['Gusto', 'Moorepay', 'ADP', 'Sage Payroll', 'PayFit']),
('time_attendance', 'Time & Attendance', 'HR_PAYROLL', 22, ARRAY['Deputy', 'TSheets', 'Clockify', 'When I Work']),
('holiday_management', 'Holiday Management', 'HR_PAYROLL', 23, ARRAY['Timetastic', 'BreatheHR', 'CharlieHR', 'Personio']),
('recruitment_ats', 'Recruitment / ATS', 'HR_PAYROLL', 24, ARRAY['Workable', 'Greenhouse', 'Lever', 'Teamtailor']),
('performance_management', 'Performance Management', 'HR_PAYROLL', 25, ARRAY['Lattice', '15Five', 'Culture Amp', 'Leapsome']),
('learning_development', 'Learning & Development', 'HR_PAYROLL', 26, ARRAY['360Learning', 'Docebo', 'TalentLMS']),
('employee_engagement', 'Employee Engagement', 'HR_PAYROLL', 27, ARRAY['Officevibe', 'Peakon', 'Culture Amp']),
('benefits_admin', 'Benefits Administration', 'HR_PAYROLL', 28, ARRAY['Ben', 'Thanks Ben', 'Perkbox']),

-- Operations & Project Management
('project_management', 'Project Management', 'OPERATIONS', 30, ARRAY['Asana', 'Monday.com', 'Trello', 'ClickUp', 'Notion']),
('time_tracking', 'Time Tracking', 'OPERATIONS', 31, ARRAY['Toggl', 'Harvest', 'Clockify', 'Everhour']),
('resource_planning', 'Resource Planning', 'OPERATIONS', 32, ARRAY['Float', 'Resource Guru', 'Teamwork']),
('client_portal', 'Client Portal', 'OPERATIONS', 33, ARRAY['Client Portal by HubSpot', 'Zendesk', 'Freshdesk', 'Custom']),
('task_management', 'Task Management', 'OPERATIONS', 34, ARRAY['Todoist', 'TickTick', 'Microsoft To Do']),
('document_management', 'Document Management', 'OPERATIONS', 35, ARRAY['Google Drive', 'SharePoint', 'Dropbox', 'Box']),
('workflow_automation', 'Workflow Automation', 'OPERATIONS', 36, ARRAY['Zapier', 'Make', 'Power Automate', 'n8n']),

-- Procurement & Inventory
('purchasing', 'Purchasing / Procurement', 'PROCUREMENT', 40, ARRAY['Procurify', 'Coupa', 'SAP Ariba']),
('inventory', 'Inventory Management', 'PROCUREMENT', 41, ARRAY['TradeGecko', 'Cin7', 'DEAR Systems', 'Unleashed']),
('supplier_management', 'Supplier Management', 'PROCUREMENT', 42, ARRAY['Ivalua', 'HICX', 'Excel']),
('asset_tracking', 'Asset Tracking', 'PROCUREMENT', 43, ARRAY['Asset Panda', 'Snipe-IT', 'EZOfficeInventory']),
('ap_automation', 'AP Automation', 'PROCUREMENT', 44, ARRAY['Dext', 'ApprovalMax', 'Lightyear', 'Xero Bills']),

-- Communication
('email', 'Email', 'COMMUNICATION', 50, ARRAY['Google Workspace', 'Microsoft 365', 'Outlook']),
('chat_messaging', 'Chat / Messaging', 'COMMUNICATION', 51, ARRAY['Slack', 'Microsoft Teams', 'Discord']),
('video_conferencing', 'Video Conferencing', 'COMMUNICATION', 52, ARRAY['Zoom', 'Google Meet', 'Microsoft Teams', 'Webex']),
('phone_voip', 'Phone System / VoIP', 'COMMUNICATION', 53, ARRAY['RingCentral', 'Dialpad', '8x8', 'Vonage']),
('shared_calendars', 'Shared Calendars', 'COMMUNICATION', 54, ARRAY['Google Calendar', 'Outlook Calendar', 'Calendly']),
('knowledge_base', 'Internal Wiki / Knowledge Base', 'COMMUNICATION', 55, ARRAY['Notion', 'Confluence', 'Slite', 'Guru']),

-- Marketing
('email_marketing', 'Email Marketing', 'MARKETING', 60, ARRAY['Mailchimp', 'ActiveCampaign', 'Klaviyo', 'ConvertKit']),
('marketing_automation', 'Marketing Automation', 'MARKETING', 61, ARRAY['HubSpot', 'Marketo', 'Pardot', 'ActiveCampaign']),
('social_media', 'Social Media Management', 'MARKETING', 62, ARRAY['Hootsuite', 'Buffer', 'Sprout Social', 'Later']),
('website_cms', 'Website / CMS', 'MARKETING', 63, ARRAY['WordPress', 'Webflow', 'Squarespace', 'Wix']),
('analytics', 'Analytics', 'MARKETING', 64, ARRAY['Google Analytics', 'Mixpanel', 'Amplitude', 'Heap']),
('seo_tools', 'SEO Tools', 'MARKETING', 65, ARRAY['Ahrefs', 'SEMrush', 'Moz', 'Screaming Frog']),
('advertising', 'Advertising Platforms', 'MARKETING', 66, ARRAY['Google Ads', 'Meta Ads', 'LinkedIn Ads']),

-- Compliance & Legal
('contract_management', 'Contract Management', 'COMPLIANCE', 70, ARRAY['Juro', 'ContractPodAi', 'Ironclad', 'DocuSign CLM']),
('compliance_tracking', 'Compliance Tracking', 'COMPLIANCE', 71, ARRAY['Vanta', 'Drata', 'Secureframe']),
('data_protection', 'Data Protection / GDPR', 'COMPLIANCE', 72, ARRAY['OneTrust', 'TrustArc', 'Cookiebot']),
('company_secretarial', 'Company Secretarial', 'COMPLIANCE', 73, ARRAY['Inform Direct', 'Companies House', 'Diligent']),
('legal_docs', 'Legal Document Storage', 'COMPLIANCE', 74, ARRAY['NetDocuments', 'iManage', 'SharePoint']),

-- IT & Security
('password_management', 'Password Management', 'IT_SECURITY', 80, ARRAY['1Password', 'LastPass', 'Dashlane', 'Bitwarden']),
('device_management', 'Device Management / MDM', 'IT_SECURITY', 81, ARRAY['Jamf', 'Kandji', 'Microsoft Intune']),
('backup_recovery', 'Backup & Recovery', 'IT_SECURITY', 82, ARRAY['Backblaze', 'Carbonite', 'Veeam', 'Acronis']),
('antivirus_security', 'Antivirus / Security', 'IT_SECURITY', 83, ARRAY['CrowdStrike', 'SentinelOne', 'Sophos']),
('it_support', 'IT Support / Ticketing', 'IT_SECURITY', 84, ARRAY['Freshservice', 'Zendesk', 'Jira Service Management']),
('vpn_remote', 'VPN / Remote Access', 'IT_SECURITY', 85, ARRAY['NordVPN', 'Cisco AnyConnect', 'Tailscale']),

-- Industry Specific
('booking_scheduling', 'Booking / Scheduling', 'INDUSTRY_SPECIFIC', 90, ARRAY['Calendly', 'Acuity', 'SimplyBook.me']),
('pos', 'POS / Point of Sale', 'INDUSTRY_SPECIFIC', 91, ARRAY['Square', 'Zettle', 'Lightspeed', 'Shopify POS']),
('ecommerce', 'E-commerce Platform', 'INDUSTRY_SPECIFIC', 92, ARRAY['Shopify', 'WooCommerce', 'BigCommerce']),
('psa', 'Professional Services Automation', 'INDUSTRY_SPECIFIC', 93, ARRAY['Autotask', 'ConnectWise', 'Accelo']),
('field_service', 'Field Service Management', 'INDUSTRY_SPECIFIC', 94, ARRAY['ServiceTitan', 'Jobber', 'Housecall Pro']),
('other', 'Other', 'INDUSTRY_SPECIFIC', 99, ARRAY[]::TEXT[]);

-- ============================================================================
-- TABLE: sa_system_inventory (Stage 2)
-- Detailed system cards
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_system_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,
    
    -- Basic Info
    system_name TEXT NOT NULL,
    category_code TEXT NOT NULL,
    sub_category TEXT,
    vendor TEXT,
    website_url TEXT,
    
    -- Usage
    primary_users TEXT[],                     -- Owner, Finance, Operations, Sales, HR, Admin, Everyone
    number_of_users INTEGER,
    usage_frequency TEXT                      -- Daily, Weekly, Monthly, Rarely
        CHECK (usage_frequency IN ('daily', 'weekly', 'monthly', 'rarely')),
    criticality TEXT                          -- Critical, Important, Nice to have
        CHECK (criticality IN ('critical', 'important', 'nice_to_have')),
    
    -- Cost
    pricing_model TEXT                        -- Monthly, Annual, Per user, One-time, Free
        CHECK (pricing_model IN ('monthly', 'annual', 'per_user', 'one_time', 'free')),
    monthly_cost DECIMAL(10,2),
    annual_cost DECIMAL(10,2),
    cost_trend TEXT                           -- Increasing, Stable, Decreasing, Don't know
        CHECK (cost_trend IN ('increasing', 'stable', 'decreasing', 'dont_know')),
    
    -- Integration
    integrates_with UUID[],                   -- References other sa_system_inventory records
    integrates_with_names TEXT[],             -- Denormalised for display
    integration_method TEXT                   -- Native, Zapier/Make, Custom API, Manual, None
        CHECK (integration_method IN ('native', 'zapier_make', 'custom_api', 'manual', 'none')),
    manual_transfer_required BOOLEAN DEFAULT FALSE,
    manual_hours_monthly DECIMAL(5,1),
    manual_process_description TEXT,
    
    -- Data Quality
    data_quality_score INTEGER CHECK (data_quality_score BETWEEN 1 AND 5),
    data_entry_method TEXT                    -- Single point, Duplicated, Don't know
        CHECK (data_entry_method IN ('single_point', 'duplicated', 'dont_know')),
    
    -- Satisfaction
    user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
    fit_for_purpose INTEGER CHECK (fit_for_purpose BETWEEN 1 AND 5),
    would_recommend TEXT CHECK (would_recommend IN ('yes', 'maybe', 'no')),
    
    -- Pain Points
    known_issues TEXT,
    workarounds_in_use TEXT,
    change_one_thing TEXT,
    
    -- Future
    future_plan TEXT                          -- Keep, Replace, Upgrade, Unsure
        CHECK (future_plan IN ('keep', 'replace', 'upgrade', 'unsure')),
    replacement_candidate TEXT,
    contract_end_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: sa_process_chains
-- Reference table for process chain definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_process_chains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_code TEXT NOT NULL UNIQUE,
    chain_name TEXT NOT NULL,
    description TEXT,
    trigger_areas TEXT[],                     -- Which broken_areas trigger this chain
    process_steps TEXT[],                     -- Ordered list of steps
    estimated_duration_mins INTEGER,
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed process chains
INSERT INTO sa_process_chains (chain_code, chain_name, description, trigger_areas, process_steps, estimated_duration_mins, display_order) VALUES
('quote_to_cash', 'Quote-to-Cash (Revenue)', 'From lead to cash collected', 
    ARRAY['invoicing_billing', 'payment_collection', 'quoting_proposals', 'contract_management', 'accounts_receivable'],
    ARRAY['Lead/Opportunity', 'Quote/Proposal', 'Contract/Agreement', 'Work Delivered', 'Invoice Raised', 'Invoice Sent', 'Payment Reminder', 'Payment Received', 'Reconciled', 'Debt Chase'],
    15, 1),
    
('procure_to_pay', 'Procure-to-Pay (Spending)', 'From need to payment',
    ARRAY['accounts_payable', 'expense_management', 'purchase_approvals', 'supplier_management'],
    ARRAY['Need Identified', 'Requisition', 'Approval', 'PO Raised', 'Goods/Service Received', 'Invoice Received', 'Invoice Matched', 'Approval', 'Payment Scheduled', 'Payment Made', 'Reconciled'],
    15, 2),
    
('hire_to_retire', 'Hire-to-Retire (People)', 'Full employee lifecycle',
    ARRAY['payroll_processing', 'holiday_absence', 'time_tracking', 'onboarding_offboarding', 'expense_claims'],
    ARRAY['Recruitment', 'Offer', 'Onboarding', 'Time/Attendance', 'Holiday/Absence', 'Expense Claims', 'Payroll Prep', 'Payroll Processing', 'HMRC/Pensions', 'Offboarding'],
    20, 3),
    
('record_to_report', 'Record-to-Report (Finance)', 'From transaction to insight',
    ARRAY['financial_reporting', 'month_end_close', 'cash_flow_visibility', 'budgeting_forecasting'],
    ARRAY['Transaction Entry', 'Coding/Categorisation', 'Bank Reconciliation', 'Accruals/Prepayments', 'Month-End Adjustments', 'Period Close', 'Management Accounts', 'Board Pack', 'Statutory Accounts'],
    15, 4),
    
('lead_to_client', 'Lead-to-Client (Sales & Marketing)', 'From stranger to customer',
    ARRAY['lead_management', 'crm_pipeline', 'marketing_tracking', 'client_onboarding'],
    ARRAY['Marketing Activity', 'Lead Generated', 'Lead Captured', 'Lead Qualified', 'Assigned to Sales', 'Nurture/Follow-up', 'Proposal', 'Negotiation', 'Won/Lost', 'Client Onboarded'],
    15, 5),
    
('comply_to_confirm', 'Comply-to-Confirm (Regulatory)', 'From requirement to filed',
    ARRAY['vat_tax_filings', 'statutory_compliance'],
    ARRAY['Requirement Identified', 'Deadline Tracked', 'Data Gathered', 'Submission Prepared', 'Reviewed', 'Filed', 'Confirmation Received', 'Archived'],
    10, 6);

-- ============================================================================
-- TABLE: sa_process_deep_dives (Stage 3)
-- Consultant-led deep dive responses
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_process_deep_dives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,
    chain_code TEXT NOT NULL,
    
    consultant_id UUID,
    scheduled_at TIMESTAMPTZ,
    conducted_at TIMESTAMPTZ,
    duration_mins INTEGER,
    
    -- All responses stored as JSONB for flexibility
    responses JSONB NOT NULL DEFAULT '{}',
    
    -- Key pain points extracted (for AI context)
    key_pain_points TEXT[],
    hours_identified DECIMAL(5,1),            -- Hours wasted identified in this chain
    
    notes TEXT,
    recording_url TEXT,
    
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(engagement_id, chain_code)
);

-- ============================================================================
-- TABLE: sa_findings
-- Individual audit findings
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,
    
    finding_code TEXT NOT NULL,
    source_stage TEXT NOT NULL               -- 'stage_1', 'stage_2', 'stage_3', 'ai_generated'
        CHECK (source_stage IN ('stage_1', 'stage_2', 'stage_3', 'ai_generated')),
    source_chain TEXT,                        -- Which process chain (if stage_3)
    
    category TEXT NOT NULL
        CHECK (category IN ('integration_gap', 'manual_process', 'data_silo', 'single_point_failure', 'scalability_risk', 'compliance_risk', 'cost_inefficiency', 'user_experience')),
    severity TEXT NOT NULL 
        CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT[],
    client_quote TEXT,                        -- Their exact words that support this finding
    
    -- Impact quantification
    hours_wasted_weekly DECIMAL(5,1),
    annual_cost_impact DECIMAL(12,2),
    risk_exposure TEXT,
    scalability_impact TEXT,
    
    -- Affected areas
    affected_systems TEXT[],
    affected_processes TEXT[],
    affected_roles TEXT[],
    
    -- Recommendation
    recommendation TEXT,
    estimated_fix_cost DECIMAL(10,2),
    estimated_fix_hours INTEGER,
    fix_complexity TEXT 
        CHECK (fix_complexity IN ('quick_win', 'moderate', 'significant', 'major')),
    
    -- ROI
    payback_months INTEGER,
    annual_benefit DECIMAL(12,2),
    
    status TEXT DEFAULT 'identified'
        CHECK (status IN ('identified', 'validated', 'accepted', 'in_progress', 'resolved', 'wont_fix')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(engagement_id, finding_code)
);

-- ============================================================================
-- TABLE: sa_recommendations
-- Prioritised recommendations
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,
    
    priority_rank INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    category TEXT NOT NULL
        CHECK (category IN ('quick_win', 'foundation', 'strategic', 'optimization')),
    implementation_phase TEXT
        CHECK (implementation_phase IN ('immediate', 'short_term', 'medium_term', 'long_term')),
    
    estimated_duration_days INTEGER,
    estimated_cost DECIMAL(10,2),
    internal_hours_required INTEGER,
    external_support_needed BOOLEAN DEFAULT FALSE,
    
    -- Benefits
    hours_saved_weekly DECIMAL(5,1),
    annual_cost_savings DECIMAL(12,2),
    risk_reduction TEXT,
    scalability_unlocked TEXT,
    
    -- Dependencies
    depends_on TEXT[],                        -- Other recommendation IDs
    enables TEXT[],                           -- What this unlocks
    finding_ids UUID[],                       -- Which findings this addresses
    
    -- Time Freedom Connection
    time_reclaimed_weekly DECIMAL(5,1),
    freedom_unlocked TEXT,                    -- Uses their words from time_reclaim_priority
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: sa_audit_reports
-- Generated report with approval workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_audit_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,
    
    -- Executive Summary
    headline TEXT,                            -- Under 25 words, quotable, specific numbers
    executive_summary TEXT NOT NULL,
    executive_summary_sentiment TEXT
        CHECK (executive_summary_sentiment IN ('strong_foundation', 'good_with_gaps', 'significant_issues', 'critical_attention')),
    
    -- Cost of Chaos
    total_hours_wasted_weekly DECIMAL(6,1),
    total_annual_cost_of_chaos DECIMAL(12,2),
    growth_multiplier DECIMAL(3,1),           -- e.g., 2.5 if growing from 8 to 20
    projected_cost_at_scale DECIMAL(12,2),
    cost_of_chaos_narrative TEXT,
    
    -- Scores (0-100)
    systems_count INTEGER,
    integration_score INTEGER,
    automation_score INTEGER,
    data_accessibility_score INTEGER,
    scalability_score INTEGER,
    
    -- Findings Summary
    critical_findings_count INTEGER DEFAULT 0,
    high_findings_count INTEGER DEFAULT 0,
    medium_findings_count INTEGER DEFAULT 0,
    low_findings_count INTEGER DEFAULT 0,
    
    -- Quick Wins
    quick_wins JSONB,
    
    -- Investment Summary
    total_recommended_investment DECIMAL(12,2),
    total_annual_benefit DECIMAL(12,2),
    overall_payback_months INTEGER,
    roi_ratio TEXT,                           -- e.g., "4.2:1"
    
    -- Time Freedom
    hours_reclaimable_weekly DECIMAL(5,1),
    time_freedom_narrative TEXT,              -- Uses their time_reclaim_priority words
    what_this_enables TEXT[],
    
    -- Client's Words Used
    client_quotes_used TEXT[],
    
    -- Generation Metadata
    llm_model TEXT,
    llm_tokens_used INTEGER,
    llm_cost DECIMAL(8,4),
    generation_time_ms INTEGER,
    prompt_version TEXT DEFAULT 'v2',
    
    -- Two-Gate Approval Workflow
    status TEXT DEFAULT 'generated'
        CHECK (status IN ('generating', 'generated', 'approved', 'published', 'delivered')),
    generated_at TIMESTAMPTZ,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    review_edits JSONB,                       -- Track what was changed
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(engagement_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_sa_engagements_client ON sa_engagements(client_id);
CREATE INDEX idx_sa_engagements_status ON sa_engagements(status);
CREATE INDEX idx_sa_discovery_engagement ON sa_discovery_responses(engagement_id);
CREATE INDEX idx_sa_inventory_engagement ON sa_system_inventory(engagement_id);
CREATE INDEX idx_sa_inventory_category ON sa_system_inventory(category_code);
CREATE INDEX idx_sa_deep_dives_engagement ON sa_process_deep_dives(engagement_id);
CREATE INDEX idx_sa_findings_engagement ON sa_findings(engagement_id);
CREATE INDEX idx_sa_findings_severity ON sa_findings(severity);
CREATE INDEX idx_sa_recommendations_engagement ON sa_recommendations(engagement_id);
CREATE INDEX idx_sa_reports_engagement ON sa_audit_reports(engagement_id);
CREATE INDEX idx_sa_reports_status ON sa_audit_reports(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE sa_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_discovery_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_system_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_process_deep_dives ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_audit_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using practice_id from session)
CREATE POLICY "Users can view own practice engagements" ON sa_engagements
    FOR SELECT USING (
        practice_id = current_setting('app.practice_id', true)::UUID
    );

CREATE POLICY "Users can insert own practice engagements" ON sa_engagements
    FOR INSERT WITH CHECK (
        practice_id = current_setting('app.practice_id', true)::UUID
    );

CREATE POLICY "Users can update own practice engagements" ON sa_engagements
    FOR UPDATE USING (
        practice_id = current_setting('app.practice_id', true)::UUID
    );

CREATE POLICY "Users can view own practice discovery" ON sa_discovery_responses
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can insert own practice discovery" ON sa_discovery_responses
    FOR INSERT WITH CHECK (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can update own practice discovery" ON sa_discovery_responses
    FOR UPDATE USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

-- Similar policies for other tables
CREATE POLICY "Users can view own practice inventory" ON sa_system_inventory
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can insert own practice inventory" ON sa_system_inventory
    FOR INSERT WITH CHECK (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can update own practice inventory" ON sa_system_inventory
    FOR UPDATE USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can view own practice deep dives" ON sa_process_deep_dives
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can insert own practice deep dives" ON sa_process_deep_dives
    FOR INSERT WITH CHECK (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can view own practice findings" ON sa_findings
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can view own practice recommendations" ON sa_recommendations
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can view own practice reports" ON sa_audit_reports
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can insert own practice reports" ON sa_audit_reports
    FOR INSERT WITH CHECK (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

CREATE POLICY "Users can update own practice reports" ON sa_audit_reports
    FOR UPDATE USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sa_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sa_engagements_updated
    BEFORE UPDATE ON sa_engagements FOR EACH ROW EXECUTE FUNCTION update_sa_timestamp();

CREATE TRIGGER trg_sa_discovery_updated
    BEFORE UPDATE ON sa_discovery_responses FOR EACH ROW EXECUTE FUNCTION update_sa_timestamp();

CREATE TRIGGER trg_sa_inventory_updated
    BEFORE UPDATE ON sa_system_inventory FOR EACH ROW EXECUTE FUNCTION update_sa_timestamp();

CREATE TRIGGER trg_sa_deep_dives_updated
    BEFORE UPDATE ON sa_process_deep_dives FOR EACH ROW EXECUTE FUNCTION update_sa_timestamp();

CREATE TRIGGER trg_sa_findings_updated
    BEFORE UPDATE ON sa_findings FOR EACH ROW EXECUTE FUNCTION update_sa_timestamp();

CREATE TRIGGER trg_sa_reports_updated
    BEFORE UPDATE ON sa_audit_reports FOR EACH ROW EXECUTE FUNCTION update_sa_timestamp();

-- ============================================================================
-- AUTO-CALCULATE COST OF CHAOS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_sa_cost_of_chaos()
RETURNS TRIGGER AS $$
DECLARE
    hourly_rate DECIMAL := 35.00;
    weeks_per_year INTEGER := 52;
    discovery_record RECORD;
    manual_hours_numeric DECIMAL;
BEGIN
    -- Get discovery data for growth multiplier
    SELECT * INTO discovery_record 
    FROM sa_discovery_responses 
    WHERE engagement_id = NEW.engagement_id;
    
    -- Calculate growth multiplier
    IF discovery_record.expected_team_size_12mo IS NOT NULL 
       AND discovery_record.team_size IS NOT NULL 
       AND discovery_record.team_size > 0 THEN
        NEW.growth_multiplier := discovery_record.expected_team_size_12mo::DECIMAL / discovery_record.team_size;
    ELSE
        NEW.growth_multiplier := 1.5; -- Default assumption
    END IF;
    
    -- Calculate annual cost
    IF NEW.total_hours_wasted_weekly IS NOT NULL THEN
        NEW.total_annual_cost_of_chaos := NEW.total_hours_wasted_weekly * hourly_rate * weeks_per_year;
        NEW.projected_cost_at_scale := NEW.total_annual_cost_of_chaos * NEW.growth_multiplier;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sa_reports_calculate_costs
    BEFORE INSERT OR UPDATE OF total_hours_wasted_weekly ON sa_audit_reports
    FOR EACH ROW EXECUTE FUNCTION calculate_sa_cost_of_chaos();

