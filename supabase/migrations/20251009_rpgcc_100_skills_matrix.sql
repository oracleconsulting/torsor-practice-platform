-- =====================================================
-- RPGCC Business Services Group Skills Matrix v2.0
-- 100 Skills - Enhanced Technical Foundation
-- Date: October 9, 2025
-- =====================================================

-- Clear existing skills
TRUNCATE skills CASCADE;

-- ============================================
-- 1️⃣ Technical Accounting Fundamentals (15)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Double Entry Bookkeeping', 'Technical Accounting Fundamentals', 'Core accounting principles and journal entries', 5, 'Core Service'),
(gen_random_uuid(), 'Financial Statements Preparation', 'Technical Accounting Fundamentals', 'P&L, Balance Sheet, Cash Flow preparation', 4, 'Core Service'),
(gen_random_uuid(), 'UK GAAP Knowledge', 'Technical Accounting Fundamentals', 'FRS 102, FRS 105, micro-entity requirements', 4, 'Compliance'),
(gen_random_uuid(), 'Accruals & Prepayments', 'Technical Accounting Fundamentals', 'Period-end adjustments and cut-off', 4, 'Core Service'),
(gen_random_uuid(), 'Fixed Asset Accounting', 'Technical Accounting Fundamentals', 'Depreciation, disposals, capital allowances', 4, 'Core Service'),
(gen_random_uuid(), 'Stock Valuation', 'Technical Accounting Fundamentals', 'FIFO, AVCO, NRV assessments', 3, 'Core Service'),
(gen_random_uuid(), 'Debtor & Creditor Control', 'Technical Accounting Fundamentals', 'Reconciliations and aged analysis', 4, 'Core Service'),
(gen_random_uuid(), 'Bank Reconciliation', 'Technical Accounting Fundamentals', 'Multi-currency and complex reconciliations', 4, 'Core Service'),
(gen_random_uuid(), 'Inter-company Accounting', 'Technical Accounting Fundamentals', 'Group transactions and eliminations', 3, 'Core Service'),
(gen_random_uuid(), 'Revenue Recognition', 'Technical Accounting Fundamentals', 'UK GAAP revenue principles', 4, 'Core Service'),
(gen_random_uuid(), 'Lease Accounting', 'Technical Accounting Fundamentals', 'Operating vs finance lease treatment', 3, 'Compliance'),
(gen_random_uuid(), 'Provisions & Contingencies', 'Technical Accounting Fundamentals', 'Recognition and measurement', 3, 'Core Service'),
(gen_random_uuid(), 'Share Capital & Reserves', 'Technical Accounting Fundamentals', 'Equity transactions and dividends', 3, 'Core Service'),
(gen_random_uuid(), 'Partnership Accounting', 'Technical Accounting Fundamentals', 'LLP and partnership structures', 3, 'Core Service'),
(gen_random_uuid(), 'Trial Balance Analysis', 'Technical Accounting Fundamentals', 'Error identification and correction', 4, 'Core Service');

-- ============================================
-- 2️⃣ Cloud Accounting & Automation (12)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Xero Complete Mastery', 'Cloud Accounting & Automation', 'Full platform including projects, expenses, inventory', 4, 'Automation'),
(gen_random_uuid(), 'QuickBooks Advanced', 'Cloud Accounting & Automation', 'QBO Plus/Advanced features and apps', 3, 'Automation'),
(gen_random_uuid(), 'Sage Business Cloud', 'Cloud Accounting & Automation', 'Sage 50cloud and Sage Accounting setup', 3, 'Automation'),
(gen_random_uuid(), 'Dext (Receipt Bank)', 'Cloud Accounting & Automation', 'Automated data extraction setup', 4, 'Automation'),
(gen_random_uuid(), 'AutoEntry Configuration', 'Cloud Accounting & Automation', 'Invoice and receipt processing', 3, 'Automation'),
(gen_random_uuid(), 'Bank Feed Troubleshooting', 'Cloud Accounting & Automation', 'Complex feed issues and Open Banking', 4, 'Automation'),
(gen_random_uuid(), 'Multi-currency Accounting', 'Cloud Accounting & Automation', 'FX gains/losses and revaluation', 3, 'Core Service'),
(gen_random_uuid(), 'Payroll Integration', 'Cloud Accounting & Automation', 'Connecting payroll to accounting systems', 3, 'Automation'),
(gen_random_uuid(), 'App Ecosystem Management', 'Cloud Accounting & Automation', 'Selecting and integrating add-on apps', 3, 'Automation'),
(gen_random_uuid(), 'Data Import/Export', 'Cloud Accounting & Automation', 'CSV manipulation and bulk updates', 4, 'Automation'),
(gen_random_uuid(), 'System Migration Planning', 'Cloud Accounting & Automation', 'Moving between platforms efficiently', 3, 'Automation'),
(gen_random_uuid(), 'Accounting System Selection', 'Cloud Accounting & Automation', 'Matching systems to client needs', 4, 'Advisory');

-- ============================================
-- 3️⃣ Management Accounting & Reporting (10)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Management Pack Production', 'Management Accounting & Reporting', 'Complete monthly reporting packages', 4, 'Management Accounts'),
(gen_random_uuid(), 'KPI Framework Design', 'Management Accounting & Reporting', 'Industry-specific metrics selection', 4, 'Advisory'),
(gen_random_uuid(), 'Cash Flow Waterfall Charts', 'Management Accounting & Reporting', 'Visual cash movement analysis', 4, 'Management Accounts'),
(gen_random_uuid(), 'Budget Preparation', 'Management Accounting & Reporting', 'Annual budgeting process management', 4, 'Advisory'),
(gen_random_uuid(), 'Variance Commentary', 'Management Accounting & Reporting', 'Insightful analysis and explanations', 4, 'Management Accounts'),
(gen_random_uuid(), 'Spotlight Reporting Mastery', 'Management Accounting & Reporting', 'Advanced features and customization', 3, 'Management Accounts'),
(gen_random_uuid(), 'Syft Analytics', 'Management Accounting & Reporting', 'Alternative reporting platform skills', 2, 'Management Accounts'),
(gen_random_uuid(), 'Fathom HQ Reporting', 'Management Accounting & Reporting', 'Performance analysis tools', 2, 'Management Accounts'),
(gen_random_uuid(), 'Break-even Analysis', 'Management Accounting & Reporting', 'Contribution and margin analysis', 4, 'Advisory'),
(gen_random_uuid(), 'Dashboard Design', 'Management Accounting & Reporting', 'KPI visualization and layout', 3, 'Management Accounts');

-- ============================================
-- 4️⃣ Advisory & Consulting (12)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Three-way Forecasting', 'Advisory & Consulting', 'Integrated P&L, BS, Cash forecasts', 4, 'Forecasting'),
(gen_random_uuid(), 'Business Valuations', 'Advisory & Consulting', 'Multiple methodologies and sense-checking', 3, 'Advisory'),
(gen_random_uuid(), 'Scenario Planning', 'Advisory & Consulting', 'Sensitivity and Monte Carlo analysis', 3, 'Forecasting'),
(gen_random_uuid(), 'Working Capital Optimization', 'Advisory & Consulting', 'Cash cycle improvement strategies', 4, 'Advisory'),
(gen_random_uuid(), 'Pricing Strategy Advisory', 'Advisory & Consulting', 'Margin improvement and value pricing', 3, 'Advisory'),
(gen_random_uuid(), 'Cost Reduction Analysis', 'Advisory & Consulting', 'Identifying savings opportunities', 3, 'Advisory'),
(gen_random_uuid(), 'Investment Appraisal', 'Advisory & Consulting', 'NPV, IRR, payback analysis', 3, 'Advisory'),
(gen_random_uuid(), 'Benchmarking Interpretation', 'Advisory & Consulting', 'Turning data into actionable insights', 4, 'Advisory'),
(gen_random_uuid(), 'Profit Improvement Planning', 'Advisory & Consulting', 'Systematic profit enhancement', 4, 'Advisory'),
(gen_random_uuid(), 'Business Model Analysis', 'Advisory & Consulting', 'Understanding value creation', 3, 'Advisory'),
(gen_random_uuid(), 'Strategic Options Appraisal', 'Advisory & Consulting', 'Evaluating growth paths', 3, 'Advisory'),
(gen_random_uuid(), '365 Alignment Facilitation', 'Advisory & Consulting', 'Personal-business goal integration', 3, '365 Alignment');

-- ============================================
-- 5️⃣ Digital & AI Capabilities (10)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'ChatGPT/Claude for Accounting', 'Digital & AI Capabilities', 'AI-assisted analysis and writing', 3, 'Technology'),
(gen_random_uuid(), 'Excel Power Query', 'Digital & AI Capabilities', 'Data transformation and automation', 4, 'Technology'),
(gen_random_uuid(), 'Excel Power Pivot', 'Digital & AI Capabilities', 'Data modeling and DAX formulas', 3, 'Technology'),
(gen_random_uuid(), 'Power BI Development', 'Digital & AI Capabilities', 'Interactive dashboard creation', 2, 'Technology'),
(gen_random_uuid(), 'Python Basics for Finance', 'Digital & AI Capabilities', 'Simple automation scripts', 2, 'Technology'),
(gen_random_uuid(), 'Zapier/Make Automation', 'Digital & AI Capabilities', 'Workflow automation between apps', 3, 'Automation'),
(gen_random_uuid(), 'OCR Technology Use', 'Digital & AI Capabilities', 'Optimizing document processing', 3, 'Automation'),
(gen_random_uuid(), 'API Understanding', 'Digital & AI Capabilities', 'How systems connect and integrate', 2, 'Technology'),
(gen_random_uuid(), 'Cybersecurity Best Practices', 'Digital & AI Capabilities', 'Client data protection', 4, 'Compliance'),
(gen_random_uuid(), 'AI Prompt Engineering', 'Digital & AI Capabilities', 'Maximizing AI tool effectiveness', 3, 'Technology');

-- ============================================
-- 6️⃣ Tax & Compliance - UK Focus (10)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Corporation Tax Computation', 'Tax & Compliance - UK Focus', 'CT600 preparation and planning', 4, 'Tax'),
(gen_random_uuid(), 'Personal Tax Returns', 'Tax & Compliance - UK Focus', 'SA100 and supplementary pages', 3, 'Tax'),
(gen_random_uuid(), 'VAT Schemes & Planning', 'Tax & Compliance - UK Focus', 'Flat rate, cash accounting, margins', 4, 'Tax'),
(gen_random_uuid(), 'Making Tax Digital Compliance', 'Tax & Compliance - UK Focus', 'MTD for VAT and ITSA readiness', 4, 'Compliance'),
(gen_random_uuid(), 'Employment Allowance', 'Tax & Compliance - UK Focus', 'NIC savings optimization', 3, 'Tax'),
(gen_random_uuid(), 'R&D Tax Relief Claims', 'Tax & Compliance - UK Focus', 'SME and RDEC schemes', 3, 'Tax'),
(gen_random_uuid(), 'Capital Gains Tax Planning', 'Tax & Compliance - UK Focus', 'Business asset disposal relief', 3, 'Tax'),
(gen_random_uuid(), 'IR35 Assessment', 'Tax & Compliance - UK Focus', 'Employment status evaluation', 3, 'Compliance'),
(gen_random_uuid(), 'Construction Industry Scheme', 'Tax & Compliance - UK Focus', 'CIS compliance and verification', 3, 'Compliance'),
(gen_random_uuid(), 'Annual Investment Allowance', 'Tax & Compliance - UK Focus', 'Capital allowances maximization', 4, 'Tax');

-- ============================================
-- 7️⃣ Sector & Industry Knowledge (8)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Professional Services', 'Sector & Industry Knowledge', 'Law firms, consultancies, agencies', 4, 'Sector Specialist'),
(gen_random_uuid(), 'Technology & SaaS', 'Sector & Industry Knowledge', 'Recurring revenue and metrics', 3, 'Sector Specialist'),
(gen_random_uuid(), 'Construction & Property', 'Sector & Industry Knowledge', 'CIS, retention, stage payments', 3, 'Sector Specialist'),
(gen_random_uuid(), 'Retail & E-commerce', 'Sector & Industry Knowledge', 'Inventory, margins, online platforms', 3, 'Sector Specialist'),
(gen_random_uuid(), 'Manufacturing', 'Sector & Industry Knowledge', 'Job costing, WIP, overhead absorption', 3, 'Sector Specialist'),
(gen_random_uuid(), 'Healthcare & Care Homes', 'Sector & Industry Knowledge', 'CQC requirements, staff costs', 2, 'Sector Specialist'),
(gen_random_uuid(), 'Hospitality & Leisure', 'Sector & Industry Knowledge', 'Tips/tronc, seasonal fluctuations', 2, 'Sector Specialist'),
(gen_random_uuid(), 'Creative Industries', 'Sector & Industry Knowledge', 'Project accounting, IP valuation', 2, 'Sector Specialist');

-- ============================================
-- 8️⃣ Client Management & Development (8)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Onboarding Excellence', 'Client Management & Development', 'Smooth transition and setup', 4, 'Client Service'),
(gen_random_uuid(), 'Proactive Communication', 'Client Management & Development', 'Regular updates and check-ins', 4, 'Client Service'),
(gen_random_uuid(), 'Difficult Conversations', 'Client Management & Development', 'Handling fee increases, scope creep', 3, 'Client Service'),
(gen_random_uuid(), 'Advisory Selling', 'Client Management & Development', 'Identifying and proposing solutions', 3, 'Business Development'),
(gen_random_uuid(), 'Client Education', 'Client Management & Development', 'Teaching financial literacy', 3, 'Client Service'),
(gen_random_uuid(), 'Expectation Management', 'Client Management & Development', 'Setting realistic timelines', 4, 'Client Service'),
(gen_random_uuid(), 'Feedback Collection', 'Client Management & Development', 'Systematic satisfaction monitoring', 3, 'Client Service'),
(gen_random_uuid(), 'Referral Generation', 'Client Management & Development', 'Building referral networks', 3, 'Business Development');

-- ============================================
-- 9️⃣ Leadership & Team Skills (6)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Work Review & Feedback', 'Leadership & Team Skills', 'Quality control and coaching', 4, 'Leadership'),
(gen_random_uuid(), 'Delegation & Prioritization', 'Leadership & Team Skills', 'Effective task distribution', 3, 'Leadership'),
(gen_random_uuid(), 'Training Design & Delivery', 'Leadership & Team Skills', 'Creating learning materials', 3, 'Leadership'),
(gen_random_uuid(), 'Performance Management', 'Leadership & Team Skills', 'Goal setting and reviews', 3, 'Leadership'),
(gen_random_uuid(), 'Workflow Optimization', 'Leadership & Team Skills', 'Improving team processes', 3, 'Leadership'),
(gen_random_uuid(), 'Innovation Leadership', 'Leadership & Team Skills', 'Driving service improvement', 3, 'Leadership');

-- ============================================
-- 🔟 Communication & Soft Skills (9)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Executive Summary Writing', 'Communication & Soft Skills', 'Concise, impactful communication', 4, 'Communication'),
(gen_random_uuid(), 'Board Presentation Skills', 'Communication & Soft Skills', 'C-suite engagement', 3, 'Communication'),
(gen_random_uuid(), 'Active Listening', 'Communication & Soft Skills', 'Deep understanding of needs', 4, 'Communication'),
(gen_random_uuid(), 'Commercial Thinking', 'Communication & Soft Skills', 'Business-minded approach', 4, 'Communication'),
(gen_random_uuid(), 'Problem Structuring', 'Communication & Soft Skills', 'Breaking down complex issues', 4, 'Communication'),
(gen_random_uuid(), 'Attention to Detail', 'Communication & Soft Skills', 'Accuracy and thoroughness', 5, 'Communication'),
(gen_random_uuid(), 'Resilience & Adaptability', 'Communication & Soft Skills', 'Handling pressure and change', 4, 'Communication'),
(gen_random_uuid(), 'Professional Skepticism', 'Communication & Soft Skills', 'Constructive challenging', 3, 'Communication'),
(gen_random_uuid(), 'Empathy & EQ', 'Communication & Soft Skills', 'Client relationship management', 4, 'Communication');

-- ============================================
-- VERIFICATION
-- ============================================

-- Count skills by category
SELECT 
  category,
  COUNT(*) as skill_count
FROM skills
GROUP BY category
ORDER BY category;

-- Total count
SELECT COUNT(*) as total_skills FROM skills;

-- Verify we have 100 skills
DO $$
DECLARE
  skill_count INT;
BEGIN
  SELECT COUNT(*) INTO skill_count FROM skills;
  
  IF skill_count = 100 THEN
    RAISE NOTICE '✅ SUCCESS: 100 skills loaded correctly';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Expected 100 skills, found %', skill_count;
  END IF;
END $$;

