-- =====================================================
-- BSG Skills Matrix Update
-- 85 Skills Aligned to RPGCC Business Services Group
-- =====================================================

-- Add service_line column if it doesn't exist (MUST BE BEFORE INSERT)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'skills' AND column_name = 'service_line'
    ) THEN
        ALTER TABLE skills ADD COLUMN service_line TEXT;
        CREATE INDEX idx_skills_service_line ON skills(service_line);
        RAISE NOTICE 'Added service_line column to skills table';
    ELSE
        RAISE NOTICE 'service_line column already exists';
    END IF;
END $$;

-- Clear existing skills
TRUNCATE skills CASCADE;

-- 1️⃣ Cloud Accounting & Automation (12 Skills)
INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Xero Advanced Features', 'Cloud Accounting & Automation', 'Complete platform mastery including analytics integration', 4, 'Automation'),
(gen_random_uuid(), 'QuickBooks Online Expertise', 'Cloud Accounting & Automation', 'QBO setup, customization, and optimization', 3, 'Automation'),
(gen_random_uuid(), 'Sage Cloud Configuration', 'Cloud Accounting & Automation', 'Sage platform implementation and management', 3, 'Automation'),
(gen_random_uuid(), 'Bank Feed Integration', 'Cloud Accounting & Automation', 'Setting up and troubleshooting automated bank feeds', 4, 'Automation'),
(gen_random_uuid(), 'OCR & Data Capture', 'Cloud Accounting & Automation', 'Digital invoice processing and receipt scanning', 3, 'Automation'),
(gen_random_uuid(), 'Chart of Accounts Design', 'Cloud Accounting & Automation', 'Creating efficient coding structures', 4, 'Automation'),
(gen_random_uuid(), 'Rule-Based Categorization', 'Cloud Accounting & Automation', 'Automated transaction coding setup', 3, 'Automation'),
(gen_random_uuid(), 'Xero to Spotlight/Syft', 'Cloud Accounting & Automation', 'Analytics platform integration', 3, 'Automation'),
(gen_random_uuid(), 'Dashboard Creation', 'Cloud Accounting & Automation', 'Building client monitoring dashboards', 4, 'Automation'),
(gen_random_uuid(), 'Workflow Automation', 'Cloud Accounting & Automation', 'Process automation and efficiency tools', 3, 'Automation'),
(gen_random_uuid(), 'API Integration Skills', 'Cloud Accounting & Automation', 'Connecting software platforms', 2, 'Automation'),
(gen_random_uuid(), 'Data Migration', 'Cloud Accounting & Automation', 'Moving clients between platforms', 3, 'Automation');

-- 2️⃣ Management Accounting & Reporting (10 Skills)
INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Management Accounts Production', 'Management Accounting & Reporting', 'Monthly/quarterly account preparation', 4, 'Management Accounts'),
(gen_random_uuid(), 'KPI Development & Tracking', 'Management Accounting & Reporting', 'Creating and monitoring performance metrics', 4, 'Management Accounts'),
(gen_random_uuid(), 'Cash Flow Analysis', 'Management Accounting & Reporting', 'Waterfall charts and liquidity reporting', 4, 'Management Accounts'),
(gen_random_uuid(), 'Spotlight Reporting', 'Management Accounting & Reporting', 'Advanced analytics and visualization', 3, 'Management Accounts'),
(gen_random_uuid(), 'Variance Analysis', 'Management Accounting & Reporting', 'Budget vs actual commentary', 4, 'Management Accounts'),
(gen_random_uuid(), 'Working Capital Management', 'Management Accounting & Reporting', 'Debtor/creditor/stock analysis', 3, 'Management Accounts'),
(gen_random_uuid(), 'Financial Commentary Writing', 'Management Accounting & Reporting', 'Clear explanations of performance', 4, 'Management Accounts'),
(gen_random_uuid(), 'Profitability Analysis', 'Management Accounting & Reporting', 'Margin and contribution reporting', 3, 'Management Accounts'),
(gen_random_uuid(), 'Graphical Data Presentation', 'Management Accounting & Reporting', 'Visual reporting techniques', 3, 'Management Accounts'),
(gen_random_uuid(), 'Source & Application of Funds', 'Management Accounting & Reporting', 'Fund flow statements', 3, 'Management Accounts');

-- 3️⃣ Advisory & Consulting (12 Skills)
INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Financial Forecasting', 'Advisory & Consulting', 'Building robust forecast models', 4, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Business Valuations', 'Advisory & Consulting', 'Valuation methodologies and reporting', 3, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Cash Flow Forecasting', 'Advisory & Consulting', 'Forward-looking cash planning', 4, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Scenario Modelling', 'Advisory & Consulting', 'Sensitivity and what-if analysis', 3, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Strategic Planning Facilitation', 'Advisory & Consulting', 'Leading strategy workshops', 3, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Benchmarking Analysis', 'Advisory & Consulting', 'Industry comparison and insights', 3, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Profit Extraction Strategies', 'Advisory & Consulting', 'Optimal remuneration planning', 4, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Business Case Development', 'Advisory & Consulting', 'Investment appraisal and ROI', 3, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Growth Strategy Development', 'Advisory & Consulting', 'Identifying expansion opportunities', 3, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Succession Planning Advisory', 'Advisory & Consulting', 'Exit and transition strategies', 2, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Systems & Process Review', 'Advisory & Consulting', 'Operational efficiency assessment', 3, 'Systems Audit'),
(gen_random_uuid(), '365 Alignment Methodology', 'Advisory & Consulting', 'Personal-business goal integration', 3, '365 Alignment');

-- 4️⃣ Digital & AI Capabilities (10 Skills)
INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'AI for Accounting Applications', 'Digital & AI Capabilities', 'Using ChatGPT, Claude for efficiency', 3, 'Core Capability'),
(gen_random_uuid(), 'Excel Advanced Functions', 'Digital & AI Capabilities', 'Power Query, macros, complex formulas', 4, 'Core Capability'),
(gen_random_uuid(), 'Power BI Fundamentals', 'Digital & AI Capabilities', 'Basic dashboard and report creation', 2, 'Core Capability'),
(gen_random_uuid(), 'Data Analytics', 'Digital & AI Capabilities', 'Analyzing large datasets for insights', 3, 'Core Capability'),
(gen_random_uuid(), 'Process Automation (RPA)', 'Digital & AI Capabilities', 'Identifying automation opportunities', 2, 'Automation'),
(gen_random_uuid(), 'Digital Document Management', 'Digital & AI Capabilities', 'Portal and vault systems', 3, 'Client Vault'),
(gen_random_uuid(), 'Cybersecurity Awareness', 'Digital & AI Capabilities', 'Data protection and security protocols', 3, 'Core Capability'),
(gen_random_uuid(), 'Cloud Platform Management', 'Digital & AI Capabilities', 'Microsoft 365, SharePoint administration', 3, 'Client Vault'),
(gen_random_uuid(), 'API & Webhook Configuration', 'Digital & AI Capabilities', 'System integration setup', 2, 'Core Capability'),
(gen_random_uuid(), 'AI Prompt Engineering', 'Digital & AI Capabilities', 'Effective AI tool utilization', 3, 'Core Capability');

-- 5️⃣ Tax & Compliance - UK Focus (8 Skills)
INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'UK Corporation Tax', 'Tax & Compliance (UK)', 'Corporate tax planning and compliance', 4, 'Compliance'),
(gen_random_uuid(), 'Personal Tax Planning', 'Tax & Compliance (UK)', 'Income tax and NI optimization', 3, 'Advisory/Forecasting'),
(gen_random_uuid(), 'VAT Compliance & Planning', 'Tax & Compliance (UK)', 'UK VAT regulations and schemes', 4, 'Compliance'),
(gen_random_uuid(), 'Companies House Filings', 'Tax & Compliance (UK)', 'Statutory filing requirements', 4, 'Compliance'),
(gen_random_uuid(), 'Making Tax Digital (MTD)', 'Tax & Compliance (UK)', 'MTD compliance and implementation', 4, 'Compliance'),
(gen_random_uuid(), 'R&D Tax Credits', 'Tax & Compliance (UK)', 'Identifying and claiming R&D relief', 3, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Dividend & Profit Extraction', 'Tax & Compliance (UK)', 'Tax-efficient extraction strategies', 4, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Payroll & PAYE', 'Tax & Compliance (UK)', 'UK payroll regulations', 3, 'Compliance');

-- 6️⃣ Client Management & Development (10 Skills)
INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Client Onboarding Excellence', 'Client Management & Development', 'Smooth transition and setup process', 4, 'Core Capability'),
(gen_random_uuid(), 'Proactive Client Communication', 'Client Management & Development', 'Regular touchpoints and updates', 4, 'Core Capability'),
(gen_random_uuid(), 'Meeting Facilitation', 'Client Management & Development', 'Running effective client meetings', 4, 'Core Capability'),
(gen_random_uuid(), 'Proposal Writing', 'Client Management & Development', 'Creating compelling service proposals', 3, 'Core Capability'),
(gen_random_uuid(), 'Fee Negotiation & Value Pricing', 'Client Management & Development', 'Pricing strategy and discussions', 3, 'Core Capability'),
(gen_random_uuid(), 'Cross-Selling Advisory Services', 'Client Management & Development', 'Identifying additional needs', 3, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Client Retention Strategies', 'Client Management & Development', 'Maintaining long-term relationships', 4, 'Core Capability'),
(gen_random_uuid(), 'Complaint Resolution', 'Client Management & Development', 'Managing difficult situations', 3, 'Core Capability'),
(gen_random_uuid(), 'Client Portal Training', 'Client Management & Development', 'Teaching clients to use systems', 3, 'Client Vault'),
(gen_random_uuid(), 'Referral Network Building', 'Client Management & Development', 'Developing referral sources', 3, 'Core Capability');

-- 7️⃣ Leadership & Team Skills (8 Skills)
INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Team Coaching & Development', 'Leadership & Team Skills', 'Developing junior team members', 3, 'Core Capability'),
(gen_random_uuid(), 'Delegation & Task Management', 'Leadership & Team Skills', 'Effective work distribution', 3, 'Core Capability'),
(gen_random_uuid(), 'Performance Review Skills', 'Leadership & Team Skills', 'Conducting meaningful reviews', 3, 'Core Capability'),
(gen_random_uuid(), 'Project Management', 'Leadership & Team Skills', 'Managing complex engagements', 3, 'Core Capability'),
(gen_random_uuid(), 'Quality Review & Control', 'Leadership & Team Skills', 'Maintaining service standards', 4, 'Core Capability'),
(gen_random_uuid(), 'Training Delivery', 'Leadership & Team Skills', 'Teaching technical skills', 3, 'Core Capability'),
(gen_random_uuid(), 'Resource Planning', 'Leadership & Team Skills', 'Capacity and workload management', 3, 'Core Capability'),
(gen_random_uuid(), 'Innovation & Change Leadership', 'Leadership & Team Skills', 'Driving service improvements', 3, 'Core Capability');

-- 8️⃣ Communication & Soft Skills (10 Skills)
INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Business Writing', 'Communication & Soft Skills', 'Clear, concise professional writing', 4, 'Core Capability'),
(gen_random_uuid(), 'Presentation Design & Delivery', 'Communication & Soft Skills', 'Creating and presenting to boards/owners', 3, 'Core Capability'),
(gen_random_uuid(), 'Active Listening', 'Communication & Soft Skills', 'Understanding client needs deeply', 4, 'Core Capability'),
(gen_random_uuid(), 'Emotional Intelligence', 'Communication & Soft Skills', 'Reading situations and people', 4, '365 Alignment'),
(gen_random_uuid(), 'Complex Problem Solving', 'Communication & Soft Skills', 'Breaking down complicated issues', 4, 'Core Capability'),
(gen_random_uuid(), 'Commercial Awareness', 'Communication & Soft Skills', 'Understanding business context', 4, 'Advisory/Forecasting'),
(gen_random_uuid(), 'Time Management', 'Communication & Soft Skills', 'Juggling multiple deadlines', 4, 'Core Capability'),
(gen_random_uuid(), 'Adaptability & Learning Agility', 'Communication & Soft Skills', 'Embracing new tools and methods', 4, 'Core Capability'),
(gen_random_uuid(), 'Professional Skepticism', 'Communication & Soft Skills', 'Critical thinking and validation', 3, 'Core Capability'),
(gen_random_uuid(), 'Empathy & Client Care', 'Communication & Soft Skills', 'Understanding client pressures', 4, '365 Alignment');

-- 9️⃣ Process & Efficiency (5 Skills)
INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Process Mapping', 'Process & Efficiency', 'Documenting workflows and controls', 3, 'Systems Audit'),
(gen_random_uuid(), 'Internal Controls Assessment', 'Process & Efficiency', 'Evaluating financial controls', 3, 'Systems Audit'),
(gen_random_uuid(), 'Efficiency Analysis', 'Process & Efficiency', 'Identifying bottlenecks and waste', 3, 'Systems Audit'),
(gen_random_uuid(), 'Tech Stack Optimization', 'Process & Efficiency', 'Recommending software improvements', 3, 'Systems Audit'),
(gen_random_uuid(), 'Compliance Calendar Management', 'Process & Efficiency', 'Deadline tracking and automation', 3, 'Compliance');

-- Summary
SELECT 
    '✅ BSG Skills Matrix Loaded!' as status,
    COUNT(*) as total_skills,
    COUNT(DISTINCT category) as categories,
    COUNT(DISTINCT service_line) as service_lines
FROM skills;

-- Category breakdown
SELECT 
    category,
    COUNT(*) as skill_count,
    ROUND(AVG(required_level), 1) as avg_required_level
FROM skills
GROUP BY category
ORDER BY skill_count DESC;

