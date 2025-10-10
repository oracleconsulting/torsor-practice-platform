-- =====================================================
-- RPGCC Business Services Group Skills Matrix v3.0
-- 105 Skills - Complete with Full Descriptions
-- Date: October 9, 2025
-- =====================================================

-- Clear existing skills
TRUNCATE skills CASCADE;

-- ============================================
-- 1️⃣ Technical Accounting Fundamentals (15)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Double Entry Bookkeeping', 'Technical Accounting Fundamentals', 'The foundational principle of recording financial transactions where every entry affects at least two accounts, maintaining the accounting equation balance. Practitioners must understand debits, credits, and the systematic recording of business transactions to ensure accuracy in financial records.', 5, 'Core Service'),
(gen_random_uuid(), 'Financial Statements Preparation', 'Technical Accounting Fundamentals', 'The ability to compile comprehensive financial reports including profit and loss statements, balance sheets, and cash flow statements. This involves understanding the relationships between statements, applying accounting standards, and presenting financial information clearly for stakeholder decision-making.', 4, 'Core Service'),
(gen_random_uuid(), 'UK GAAP Knowledge', 'Technical Accounting Fundamentals', 'Comprehensive understanding of UK Generally Accepted Accounting Principles including FRS 102, FRS 105, and micro-entity requirements. Practitioners must apply appropriate standards based on company size and type, ensuring compliance with statutory reporting requirements.', 4, 'Compliance'),
(gen_random_uuid(), 'Accruals & Prepayments', 'Technical Accounting Fundamentals', 'Managing period-end adjustments to ensure expenses and revenues are recorded in the correct accounting period. This involves calculating accrued expenses, deferred income, prepaid expenses, and ensuring accurate cut-off procedures for financial reporting.', 4, 'Core Service'),
(gen_random_uuid(), 'Fixed Asset Accounting', 'Technical Accounting Fundamentals', 'Managing the complete lifecycle of capital assets including initial recognition, depreciation calculations, impairment reviews, and disposal accounting. Requires understanding of capital allowances, different depreciation methods, and tax implications of asset transactions.', 4, 'Core Service'),
(gen_random_uuid(), 'Stock Valuation', 'Technical Accounting Fundamentals', 'Applying appropriate inventory valuation methods including FIFO, AVCO, and assessing net realisable value. Involves managing stock counts, understanding cost allocation, and ensuring accurate inventory reporting for manufacturing and retail clients.', 3, 'Core Service'),
(gen_random_uuid(), 'Debtor & Creditor Control', 'Technical Accounting Fundamentals', 'Managing accounts receivable and payable through reconciliations, aged analysis, and credit control procedures. This includes identifying discrepancies, managing payment terms, and maintaining accurate purchase and sales ledgers.', 4, 'Core Service'),
(gen_random_uuid(), 'Bank Reconciliation', 'Technical Accounting Fundamentals', 'Matching bank statements with accounting records, identifying timing differences, and investigating discrepancies. Includes handling multi-currency accounts, inter-bank transfers, and ensuring all transactions are accurately recorded.', 4, 'Core Service'),
(gen_random_uuid(), 'Inter-company Accounting', 'Technical Accounting Fundamentals', 'Recording and reconciling transactions between group companies, managing transfer pricing, and preparing consolidation adjustments. Requires understanding of group structures and elimination entries for consolidated reporting.', 3, 'Core Service'),
(gen_random_uuid(), 'Revenue Recognition', 'Technical Accounting Fundamentals', 'Applying UK GAAP principles for recognising income, including understanding performance obligations, variable consideration, and timing of recognition. Critical for ensuring accurate reporting of sales, services, and long-term contract revenue.', 4, 'Core Service'),
(gen_random_uuid(), 'Lease Accounting', 'Technical Accounting Fundamentals', 'Distinguishing between operating and finance leases, calculating lease liabilities and right-of-use assets. Requires understanding of lease modifications, practical expedients, and disclosure requirements under current standards.', 3, 'Compliance'),
(gen_random_uuid(), 'Provisions & Contingencies', 'Technical Accounting Fundamentals', 'Recognising and measuring uncertain liabilities, including understanding probability thresholds, best estimate calculations, and disclosure requirements. Involves professional judgment in assessing obligation timing and amount.', 3, 'Core Service'),
(gen_random_uuid(), 'Share Capital & Reserves', 'Technical Accounting Fundamentals', 'Managing equity transactions including share issues, buybacks, dividends, and reserve movements. Requires understanding of company law requirements, distributable reserves calculations, and shareholder reporting.', 3, 'Core Service'),
(gen_random_uuid(), 'Partnership Accounting', 'Technical Accounting Fundamentals', 'Handling accounts for partnerships and LLPs including profit allocation, capital accounts, current accounts, and drawings. Understanding partnership agreements and their impact on financial reporting and taxation.', 3, 'Core Service'),
(gen_random_uuid(), 'Trial Balance Analysis', 'Technical Accounting Fundamentals', 'Reviewing trial balances to identify errors, unusual balances, and areas requiring investigation. Includes understanding of control accounts, suspense accounts, and systematic error detection techniques.', 4, 'Core Service');

-- ============================================
-- 2️⃣ Cloud Accounting & Automation (12)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Xero Complete Mastery', 'Cloud Accounting & Automation', 'Expert-level proficiency in all Xero features including projects, expenses, inventory, and advanced reporting. Encompasses customisation of chart of accounts, workflow automation, and integration with third-party applications for maximum efficiency.', 4, 'Automation'),
(gen_random_uuid(), 'QuickBooks Advanced', 'Cloud Accounting & Automation', 'Comprehensive knowledge of QuickBooks Online Plus and Advanced features including custom fields, workflow automation, and advanced reporting. Includes understanding of industry-specific versions and app integration capabilities.', 3, 'Automation'),
(gen_random_uuid(), 'Sage Business Cloud', 'Cloud Accounting & Automation', 'Proficiency in Sage 50cloud and Sage Accounting platforms including setup, customisation, and migration. Understanding of Sage-specific features like invoice financing integration and advanced inventory management.', 3, 'Automation'),
(gen_random_uuid(), 'Dext (Receipt Bank)', 'Cloud Accounting & Automation', 'Expertise in automated receipt and invoice processing, including supplier rules setup, approval workflows, and integration with accounting software. Maximising extraction accuracy and minimising manual data entry.', 4, 'Automation'),
(gen_random_uuid(), 'AutoEntry Configuration', 'Cloud Accounting & Automation', 'Setting up and optimising automated data capture for invoices and receipts, including line-item extraction and multi-entity processing. Understanding OCR limitations and quality control procedures.', 3, 'Automation'),
(gen_random_uuid(), 'Bank Feed Troubleshooting', 'Cloud Accounting & Automation', 'Resolving complex bank feed issues including connection failures, duplicate transactions, and reconciliation problems. Understanding Open Banking protocols and alternative import methods when feeds fail.', 4, 'Automation'),
(gen_random_uuid(), 'Multi-currency Accounting', 'Cloud Accounting & Automation', 'Managing foreign currency transactions, exchange rate updates, and unrealised gains/losses calculations. Includes understanding of functional currency concepts and year-end revaluation procedures.', 3, 'Core Service'),
(gen_random_uuid(), 'Payroll Integration', 'Cloud Accounting & Automation', 'Connecting payroll systems with accounting software for seamless journal posting and reporting. Understanding of pension contributions, HMRC submissions, and statutory deduction handling.', 3, 'Automation'),
(gen_random_uuid(), 'App Ecosystem Management', 'Cloud Accounting & Automation', 'Evaluating, selecting, and managing add-on applications to extend accounting platform capabilities. Includes cost-benefit analysis, security assessment, and integration testing.', 3, 'Automation'),
(gen_random_uuid(), 'Data Import/Export', 'Cloud Accounting & Automation', 'Managing bulk data transfers using CSV files, including data mapping, transformation, and validation. Understanding of field requirements, error handling, and maintaining data integrity during migrations.', 4, 'Automation'),
(gen_random_uuid(), 'System Migration Planning', 'Cloud Accounting & Automation', 'Developing and executing plans to move clients between accounting platforms with minimal disruption. Includes data mapping, historical data decisions, parallel running, and user training strategies.', 3, 'Automation'),
(gen_random_uuid(), 'Accounting System Selection', 'Cloud Accounting & Automation', 'Matching appropriate platforms to client needs based on size, complexity, industry, and growth plans. Understanding of pricing models, scalability, and long-term total cost of ownership.', 4, 'Advisory');

-- ============================================
-- 3️⃣ Management Accounting & Reporting (10)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Management Pack Production', 'Management Accounting & Reporting', 'Creating comprehensive monthly reporting packages that provide actionable insights beyond statutory accounts. Includes narrative commentary, visual analytics, and forward-looking indicators tailored to management needs.', 4, 'Management Accounts'),
(gen_random_uuid(), 'KPI Framework Design', 'Management Accounting & Reporting', 'Developing industry-specific performance metrics that align with strategic objectives. Understanding leading versus lagging indicators, benchmark selection, and creating balanced scorecards for performance monitoring.', 4, 'Advisory'),
(gen_random_uuid(), 'Cash Flow Waterfall Charts', 'Management Accounting & Reporting', 'Creating visual representations of cash movements that clearly show sources and uses of funds. Includes bridge analysis between periods and identification of cash generation drivers.', 4, 'Management Accounts'),
(gen_random_uuid(), 'Budget Preparation', 'Management Accounting & Reporting', 'Facilitating annual budgeting processes including gathering assumptions, building financial models, and creating flexible budgets. Understanding of zero-based budgeting, rolling forecasts, and participative approaches.', 4, 'Advisory'),
(gen_random_uuid(), 'Variance Commentary', 'Management Accounting & Reporting', 'Analysing differences between actual and expected performance with insightful explanations. Goes beyond identifying variances to understanding root causes and recommending corrective actions.', 4, 'Management Accounts'),
(gen_random_uuid(), 'Spotlight Reporting Mastery', 'Management Accounting & Reporting', 'Advanced use of Spotlight reporting platform including custom KPIs, consolidations, and automated distribution. Understanding API connections and creating client-specific dashboard designs.', 3, 'Management Accounts'),
(gen_random_uuid(), 'Syft Analytics', 'Management Accounting & Reporting', 'Proficiency in alternative reporting platform for financial analysis and benchmarking. Understanding unique features like peer comparison and automated insight generation.', 2, 'Management Accounts'),
(gen_random_uuid(), 'Fathom HQ Reporting', 'Management Accounting & Reporting', 'Using Fathom for in-depth financial analysis, goal tracking, and performance improvement identification. Creating compelling visual reports that communicate complex financial data simply.', 2, 'Management Accounts'),
(gen_random_uuid(), 'DataRails Financial Planning', 'Management Accounting & Reporting', 'Proficiency in DataRails FP&A platform for budget management, forecasting, and financial reporting. Understanding Excel-based interface, data consolidation, and automated report generation for comprehensive financial planning and analysis.', 2, 'Management Accounts'),
(gen_random_uuid(), 'Break-even Analysis', 'Management Accounting & Reporting', 'Calculating contribution margins, break-even points, and margin of safety. Understanding cost behaviour, operating leverage, and using CVP analysis for decision-making.', 4, 'Advisory'),
(gen_random_uuid(), 'Dashboard Design', 'Management Accounting & Reporting', 'Creating intuitive visual displays of key metrics that enable quick decision-making. Understanding of design principles, colour theory, and user experience to maximise dashboard effectiveness.', 3, 'Management Accounts');

-- ============================================
-- 4️⃣ Advisory & Consulting (15)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Three-way Forecasting', 'Advisory & Consulting', 'Building integrated financial models linking profit and loss, balance sheet, and cash flow projections. Understanding the interconnections and ensuring model integrity through balance checks.', 4, 'Forecasting'),
(gen_random_uuid(), 'Business Valuations', 'Advisory & Consulting', 'Applying multiple valuation methodologies including DCF, multiples, and asset-based approaches. Understanding when each method is appropriate and how to sense-check valuations for reasonableness.', 3, 'Advisory'),
(gen_random_uuid(), 'Scenario Planning', 'Advisory & Consulting', 'Developing multiple future scenarios with probability weightings and sensitivity analysis. Using Monte Carlo simulations and stress testing to understand risk ranges and decision impacts.', 3, 'Forecasting'),
(gen_random_uuid(), 'Working Capital Optimisation', 'Advisory & Consulting', 'Analysing cash conversion cycles and implementing strategies to improve liquidity. Includes inventory management, credit term negotiation, and payment process improvement.', 4, 'Advisory'),
(gen_random_uuid(), 'Pricing Strategy Advisory', 'Advisory & Consulting', 'Helping clients optimise pricing through margin analysis, competitive positioning, and value-based pricing models. Understanding price elasticity and psychological pricing factors.', 3, 'Advisory'),
(gen_random_uuid(), 'Cost Reduction Analysis', 'Advisory & Consulting', 'Systematically identifying expense reduction opportunities without compromising quality or growth. Includes spend analysis, supplier negotiations, and process efficiency improvements.', 3, 'Advisory'),
(gen_random_uuid(), 'Investment Appraisal', 'Advisory & Consulting', 'Evaluating capital investments using NPV, IRR, and payback analysis. Understanding risk-adjusted returns, real options theory, and post-implementation reviews.', 3, 'Advisory'),
(gen_random_uuid(), 'Benchmarking Interpretation', 'Advisory & Consulting', 'Converting industry comparison data into actionable improvement plans. Understanding statistical significance, peer group selection, and avoiding misleading comparisons.', 4, 'Advisory'),
(gen_random_uuid(), 'Profit Improvement Planning', 'Advisory & Consulting', 'Developing systematic approaches to enhance profitability through revenue growth and cost optimisation. Creating implementation roadmaps with clear accountability and milestones.', 4, 'Advisory'),
(gen_random_uuid(), 'Business Model Analysis', 'Advisory & Consulting', 'Understanding how organisations create, deliver, and capture value. Identifying revenue streams, cost structures, and competitive advantages for strategic planning.', 3, 'Advisory'),
(gen_random_uuid(), 'Strategic Options Appraisal', 'Advisory & Consulting', 'Evaluating different growth strategies including organic growth, acquisitions, and partnerships. Using frameworks like Ansoff Matrix and Porter''s Generic Strategies.', 3, 'Advisory'),
(gen_random_uuid(), '365 Alignment Facilitation', 'Advisory & Consulting', 'Guiding business owners through personal and business goal integration using structured methodologies. Creating accountability systems and progress tracking mechanisms.', 3, '365 Alignment'),
(gen_random_uuid(), 'Debt Management Advisory', 'Advisory & Consulting', 'Analysing debt structures, refinancing opportunities, and covenant management. Understanding different funding sources and optimising capital structure for growth.', 3, 'Advisory'),
(gen_random_uuid(), 'Investor Relations Support', 'Advisory & Consulting', 'Preparing investor communications, board packs, and funding presentations. Understanding investor perspectives and managing stakeholder expectations effectively.', 3, 'Advisory'),
(gen_random_uuid(), 'Financial Ethics Advisory', 'Advisory & Consulting', 'Ensuring ethical considerations in financial decision-making and reporting. Understanding professional standards, conflicts of interest, and whistleblowing procedures.', 3, 'Advisory');

-- ============================================
-- 5️⃣ Digital & AI Capabilities (10)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'ChatGPT/Claude for Accounting', 'Digital & AI Capabilities', 'Leveraging AI language models for financial analysis, report writing, and client communications. Understanding prompt engineering techniques to maximise accuracy and efficiency in accounting tasks.', 3, 'Technology'),
(gen_random_uuid(), 'Excel Power Query', 'Digital & AI Capabilities', 'Automating data transformation and cleaning processes through Power Query. Building repeatable workflows for data import, manipulation, and combination from multiple sources.', 4, 'Technology'),
(gen_random_uuid(), 'Excel Power Pivot', 'Digital & AI Capabilities', 'Creating advanced data models and calculations using DAX formulas. Building interactive reports that handle large datasets beyond traditional Excel limitations.', 3, 'Technology'),
(gen_random_uuid(), 'Power BI Development', 'Digital & AI Capabilities', 'Designing interactive dashboards and reports with drill-down capabilities. Understanding data modelling, measure creation, and deployment strategies for client access.', 2, 'Technology'),
(gen_random_uuid(), 'Python Basics for Finance', 'Digital & AI Capabilities', 'Writing simple automation scripts for repetitive tasks and data analysis. Understanding libraries like pandas for data manipulation and basic financial calculations.', 2, 'Technology'),
(gen_random_uuid(), 'Zapier/Make Automation', 'Digital & AI Capabilities', 'Creating workflow automations between cloud applications without coding. Understanding trigger-action logic and building multi-step workflows for efficiency.', 3, 'Automation'),
(gen_random_uuid(), 'OCR Technology Use', 'Digital & AI Capabilities', 'Optimising optical character recognition for document processing accuracy. Understanding pre-processing techniques and quality control measures for automated data extraction.', 3, 'Automation'),
(gen_random_uuid(), 'API Understanding', 'Digital & AI Capabilities', 'Comprehending how applications communicate and share data through APIs. Basic knowledge of REST APIs, authentication methods, and integration possibilities.', 2, 'Technology'),
(gen_random_uuid(), 'Cybersecurity Best Practices', 'Digital & AI Capabilities', 'Implementing security measures to protect client data including password policies, two-factor authentication, and phishing awareness. Understanding GDPR requirements and breach procedures.', 4, 'Compliance'),
(gen_random_uuid(), 'AI Prompt Engineering', 'Digital & AI Capabilities', 'Crafting effective prompts to get optimal outputs from AI tools. Understanding context provision, output formatting, and iterative refinement techniques.', 3, 'Technology');

-- ============================================
-- 6️⃣ Tax & Compliance - UK Focus (10)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Corporation Tax Computation', 'Tax & Compliance - UK Focus', 'Preparing accurate CT600 returns including adjustments, reliefs, and group relief claims. Understanding current tax rates, payment deadlines, and interaction with accounting profits.', 4, 'Tax'),
(gen_random_uuid(), 'Personal Tax Returns', 'Tax & Compliance - UK Focus', 'Completing SA100 returns with all relevant supplementary pages. Understanding income sources, allowable deductions, and tax-efficient planning opportunities for individuals.', 3, 'Tax'),
(gen_random_uuid(), 'VAT Schemes & Planning', 'Tax & Compliance - UK Focus', 'Navigating various VAT schemes including flat rate, cash accounting, and margin schemes. Understanding partial exemption, option to tax, and international VAT issues.', 4, 'Tax'),
(gen_random_uuid(), 'Making Tax Digital Compliance', 'Tax & Compliance - UK Focus', 'Ensuring MTD compliance for VAT and preparing for Income Tax Self Assessment requirements. Understanding digital link requirements and compatible software solutions.', 4, 'Compliance'),
(gen_random_uuid(), 'Employment Allowance', 'Tax & Compliance - UK Focus', 'Maximising National Insurance savings through employment allowance claims. Understanding eligibility criteria, de minimis state aid rules, and connected company restrictions.', 3, 'Tax'),
(gen_random_uuid(), 'R&D Tax Relief Claims', 'Tax & Compliance - UK Focus', 'Identifying qualifying activities and expenditure for SME and RDEC schemes. Understanding enhanced deduction calculations and PAYE credit claims for loss-making companies.', 3, 'Tax'),
(gen_random_uuid(), 'Capital Gains Tax Planning', 'Tax & Compliance - UK Focus', 'Optimising CGT positions through timing, reliefs, and exemptions. Understanding business asset disposal relief, investors'' relief, and incorporation relief strategies.', 3, 'Tax'),
(gen_random_uuid(), 'IR35 Assessment', 'Tax & Compliance - UK Focus', 'Evaluating employment status for tax purposes using CEST and case law principles. Understanding reform implications and helping clients navigate off-payroll working rules.', 3, 'Compliance'),
(gen_random_uuid(), 'Construction Industry Scheme', 'Tax & Compliance - UK Focus', 'Managing CIS compliance including registration, verification, and monthly returns. Understanding gross payment status, subcontractor deductions, and record-keeping requirements.', 3, 'Compliance'),
(gen_random_uuid(), 'Annual Investment Allowance', 'Tax & Compliance - UK Focus', 'Maximising capital allowance claims through AIA and first-year allowances. Understanding special rate pools, short life assets, and planning around threshold changes.', 4, 'Tax');

-- ============================================
-- 7️⃣ Sector & Industry Knowledge (8)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Professional Services', 'Sector & Industry Knowledge', 'Understanding partnership structures, work in progress valuation, and lock-up management. Expertise in time recording, utilisation rates, and professional indemnity considerations.', 4, 'Sector Specialist'),
(gen_random_uuid(), 'Technology & SaaS', 'Sector & Industry Knowledge', 'Mastering recurring revenue metrics like MRR, ARR, and churn rates. Understanding deferred revenue, capitalised development costs, and SaaS-specific KPIs.', 3, 'Sector Specialist'),
(gen_random_uuid(), 'Construction & Property', 'Sector & Industry Knowledge', 'Managing stage payments, retention accounting, and CIS compliance. Understanding long-term contract accounting, variation orders, and final account negotiations.', 3, 'Sector Specialist'),
(gen_random_uuid(), 'Retail & E-commerce', 'Sector & Industry Knowledge', 'Handling inventory management, gross margin analysis, and seasonal fluctuations. Understanding online marketplace accounting, returns processing, and multi-channel reconciliation.', 3, 'Sector Specialist'),
(gen_random_uuid(), 'Manufacturing', 'Sector & Industry Knowledge', 'Applying job costing, overhead absorption, and work-in-progress valuation. Understanding variance analysis, capacity planning, and lean manufacturing principles.', 3, 'Sector Specialist'),
(gen_random_uuid(), 'Healthcare & Care Homes', 'Sector & Industry Knowledge', 'Navigating CQC compliance, staff cost management, and local authority funding. Understanding occupancy metrics, fee structures, and quality rating impacts.', 2, 'Sector Specialist'),
(gen_random_uuid(), 'Hospitality & Leisure', 'Sector & Industry Knowledge', 'Managing tronc schemes, tip distribution, and seasonal workforce planning. Understanding RevPAR metrics, food cost percentages, and event accounting.', 2, 'Sector Specialist'),
(gen_random_uuid(), 'Creative Industries', 'Sector & Industry Knowledge', 'Handling project-based accounting, intellectual property valuation, and royalty calculations. Understanding milestone billing, collaboration agreements, and grant funding.', 2, 'Sector Specialist');

-- ============================================
-- 8️⃣ Client Management & Development (10)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Onboarding Excellence', 'Client Management & Development', 'Creating smooth transitions for new clients including data migration, system setup, and expectation setting. Developing standardised processes that ensure consistent high-quality starts.', 4, 'Client Service'),
(gen_random_uuid(), 'Proactive Communication', 'Client Management & Development', 'Maintaining regular client contact through scheduled check-ins, updates, and value-added insights. Anticipating client needs and addressing concerns before they escalate.', 4, 'Client Service'),
(gen_random_uuid(), 'Difficult Conversations', 'Client Management & Development', 'Managing challenging discussions about fee increases, scope limitations, and performance issues. Using empathy and professionalism to maintain relationships while setting boundaries.', 3, 'Client Service'),
(gen_random_uuid(), 'Advisory Selling', 'Client Management & Development', 'Identifying client pain points and proposing relevant solutions without being pushy. Understanding consultative selling techniques and value demonstration methods.', 3, 'Business Development'),
(gen_random_uuid(), 'Client Education', 'Client Management & Development', 'Teaching financial literacy and business concepts to enhance client decision-making. Creating educational content and workshops that position the firm as a trusted advisor.', 3, 'Client Service'),
(gen_random_uuid(), 'Expectation Management', 'Client Management & Development', 'Setting realistic timelines and deliverables while maintaining client satisfaction. Clearly communicating project boundaries and managing scope creep diplomatically.', 4, 'Client Service'),
(gen_random_uuid(), 'Feedback Collection', 'Client Management & Development', 'Systematically gathering client satisfaction data through surveys and reviews. Converting feedback into service improvements and demonstrating responsive action.', 3, 'Client Service'),
(gen_random_uuid(), 'Referral Generation', 'Client Management & Development', 'Building systems and relationships that generate consistent referrals. Understanding referral psychology and creating memorable client experiences worth sharing.', 3, 'Business Development'),
(gen_random_uuid(), 'Client Retention Strategies', 'Client Management & Development', 'Implementing programmes to maintain long-term relationships and reduce churn. Understanding retention drivers and creating loyalty through consistent value delivery.', 3, 'Client Service'),
(gen_random_uuid(), 'Cultural Sensitivity', 'Client Management & Development', 'Adapting communication and service delivery to diverse client backgrounds. Understanding cultural differences in business practices and building inclusive relationships.', 3, 'Client Service');

-- ============================================
-- 9️⃣ Leadership & Team Skills (8)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Work Review & Feedback', 'Leadership & Team Skills', 'Providing constructive feedback that improves performance while maintaining morale. Understanding coaching techniques and creating development-focused review processes.', 4, 'Leadership'),
(gen_random_uuid(), 'Delegation & Prioritisation', 'Leadership & Team Skills', 'Effectively distributing work based on skills, capacity, and development needs. Understanding task prioritisation frameworks and avoiding delegation pitfalls.', 3, 'Leadership'),
(gen_random_uuid(), 'Training Design & Delivery', 'Leadership & Team Skills', 'Creating engaging learning experiences that transfer knowledge effectively. Understanding adult learning principles and various training delivery methods.', 3, 'Leadership'),
(gen_random_uuid(), 'Performance Management', 'Leadership & Team Skills', 'Setting clear goals, monitoring progress, and addressing underperformance fairly. Understanding motivation theories and creating accountability systems.', 3, 'Leadership'),
(gen_random_uuid(), 'Workflow Optimisation', 'Leadership & Team Skills', 'Analysing and improving team processes for maximum efficiency. Understanding bottleneck identification, process mapping, and change management.', 3, 'Leadership'),
(gen_random_uuid(), 'Innovation Leadership', 'Leadership & Team Skills', 'Fostering a culture of continuous improvement and creative problem-solving. Understanding how to encourage experimentation while managing risk.', 3, 'Leadership'),
(gen_random_uuid(), 'Conflict Resolution', 'Leadership & Team Skills', 'Mediating team disputes and finding win-win solutions. Understanding conflict sources, de-escalation techniques, and maintaining team cohesion.', 3, 'Leadership'),
(gen_random_uuid(), 'Succession Planning', 'Leadership & Team Skills', 'Developing talent pipelines and knowledge transfer strategies. Understanding skills matrices, development paths, and business continuity planning.', 3, 'Leadership');

-- ============================================
-- 🔟 Communication & Soft Skills (12)
-- ============================================

INSERT INTO skills (id, name, category, description, required_level, service_line) VALUES
(gen_random_uuid(), 'Executive Summary Writing', 'Communication & Soft Skills', 'Distilling complex financial information into concise, actionable insights for senior stakeholders. Understanding pyramid principle and using clear, jargon-free language.', 4, 'Communication'),
(gen_random_uuid(), 'Board Presentation Skills', 'Communication & Soft Skills', 'Delivering confident presentations to boards and senior management. Understanding audience needs, handling questions effectively, and using visual aids appropriately.', 3, 'Communication'),
(gen_random_uuid(), 'Active Listening', 'Communication & Soft Skills', 'Fully concentrating on speakers to understand their complete message beyond words. Recognising emotional undertones and asking clarifying questions effectively.', 4, 'Communication'),
(gen_random_uuid(), 'Commercial Thinking', 'Communication & Soft Skills', 'Approaching all situations with a business mindset focused on value creation. Understanding profit drivers, competitive dynamics, and strategic implications.', 4, 'Communication'),
(gen_random_uuid(), 'Problem Structuring', 'Communication & Soft Skills', 'Breaking complex issues into manageable components for systematic resolution. Using frameworks like issue trees and hypothesis-driven approaches.', 4, 'Communication'),
(gen_random_uuid(), 'Attention to Detail', 'Communication & Soft Skills', 'Maintaining high accuracy standards while managing multiple tasks. Understanding when perfectionism is needed versus when "good enough" is appropriate.', 5, 'Communication'),
(gen_random_uuid(), 'Resilience & Adaptability', 'Communication & Soft Skills', 'Maintaining effectiveness under pressure and adapting to changing circumstances. Understanding stress management and maintaining work-life balance.', 4, 'Communication'),
(gen_random_uuid(), 'Professional Scepticism', 'Communication & Soft Skills', 'Constructively challenging information and assumptions without being negative. Maintaining independence while building collaborative relationships.', 3, 'Communication'),
(gen_random_uuid(), 'Empathy & EQ', 'Communication & Soft Skills', 'Understanding and responding to others'' emotional states appropriately. Building trust through authentic connections and emotional awareness.', 4, 'Communication'),
(gen_random_uuid(), 'Influencing & Persuasion', 'Communication & Soft Skills', 'Building compelling arguments and gaining buy-in for recommendations. Understanding different influencing styles and adapting approach to audience.', 3, 'Communication'),
(gen_random_uuid(), 'Ethics & Integrity', 'Communication & Soft Skills', 'Maintaining high ethical standards in all professional dealings. Understanding ethical frameworks and managing conflicts of interest appropriately.', 4, 'Communication'),
(gen_random_uuid(), 'Unconscious Bias Awareness', 'Communication & Soft Skills', 'Recognising and mitigating personal biases in decision-making and interactions. Creating inclusive environments and fair assessment processes.', 3, 'Communication');

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

-- Verify we have 110 skills (15+12+10+15+10+10+8+10+8+12)
DO $$
DECLARE
  skill_count INT;
BEGIN
  SELECT COUNT(*) INTO skill_count FROM skills;
  
  IF skill_count = 110 THEN
    RAISE NOTICE '✅ SUCCESS: 110 skills loaded correctly';
    RAISE NOTICE '   - 15 Technical Accounting Fundamentals';
    RAISE NOTICE '   - 12 Cloud Accounting & Automation';
    RAISE NOTICE '   - 10 Management Accounting & Reporting';
    RAISE NOTICE '   - 15 Advisory & Consulting';
    RAISE NOTICE '   - 10 Digital & AI Capabilities';
    RAISE NOTICE '   - 10 Tax & Compliance - UK Focus';
    RAISE NOTICE '   -  8 Sector & Industry Knowledge';
    RAISE NOTICE '   - 10 Client Management & Development';
    RAISE NOTICE '   -  8 Leadership & Team Skills';
    RAISE NOTICE '   - 12 Communication & Soft Skills';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Total: 110 skills (not 105 - math was recounted!)';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Expected 110 skills, found %', skill_count;
  END IF;
END $$;

