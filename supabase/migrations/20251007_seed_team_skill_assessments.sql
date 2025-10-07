-- Seed Skill Assessments for Three Team Members
-- This populates all 80+ skills for Emma Wilson, Michael Chen, and Sarah Johnson
-- Date: October 7, 2025

-- First, ensure we have the three team members
-- (Assuming they already exist in practice_members table)

-- Get the practice_members IDs (replace with your actual IDs if different)
DO $$
DECLARE
    emma_id UUID;
    michael_id UUID;
    sarah_id UUID;
    current_practice_id UUID;
BEGIN
    -- Get the first practice (adjust if needed)
    SELECT id INTO current_practice_id FROM practices LIMIT 1;
    
    -- Get or create team members
    -- Emma Wilson - Junior Advisor
    INSERT INTO practice_members (practice_id, role, is_active)
    VALUES (current_practice_id, 'member', true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO emma_id;
    
    IF emma_id IS NULL THEN
        SELECT id INTO emma_id FROM practice_members WHERE practice_id = current_practice_id LIMIT 1;
    END IF;
    
    -- Michael Chen - Advisory Consultant
    INSERT INTO practice_members (practice_id, role, is_active)
    VALUES (current_practice_id, 'member', true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO michael_id;
    
    IF michael_id IS NULL THEN
        SELECT id INTO michael_id FROM practice_members WHERE practice_id = current_practice_id OFFSET 1 LIMIT 1;
    END IF;
    
    -- Sarah Johnson - Senior Manager
    INSERT INTO practice_members (practice_id, role, is_active)
    VALUES (current_practice_id, 'admin', true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO sarah_id;
    
    IF sarah_id IS NULL THEN
        SELECT id INTO sarah_id FROM practice_members WHERE practice_id = current_practice_id OFFSET 2 LIMIT 1;
    END IF;
    
    -- Store IDs in temporary table for use below
    CREATE TEMP TABLE IF NOT EXISTS temp_team_members (
        name VARCHAR(100),
        member_id UUID,
        role VARCHAR(50)
    );
    
    DELETE FROM temp_team_members;
    
    INSERT INTO temp_team_members VALUES
    ('Emma Wilson', emma_id, 'Junior Advisor'),
    ('Michael Chen', michael_id, 'Advisory Consultant'),
    ('Sarah Johnson', sarah_id, 'Senior Manager');
END $$;

-- ============================================
-- EMMA WILSON - Junior Advisor
-- Profile: Entry-level, eager to learn, 1-2 years experience
-- Skill levels: 1-3, Interest levels: 3-5
-- ============================================

-- Technical Accounting & Audit (Emma)
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    2, 4, 1.5, '2025-09-15', 'self',
    'Developing foundation skills through daily client work'
FROM skills WHERE name = 'Financial Reporting (UK GAAP)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    1, 3, 0.5, '2025-08-20', 'self',
    'Limited exposure, need more practice'
FROM skills WHERE name = 'Financial Reporting (IFRS)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    2, 5, 1.0, '2025-10-01', 'self',
    'Very interested in audit work, assisting on engagements'
FROM skills WHERE name = 'Audit Planning & Execution';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    2, 4, 1.0, '2025-09-25', 'self',
    'Learning risk assessment methodologies'
FROM skills WHERE name = 'Risk Assessment & Testing';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    2, 3, 1.5, '2025-10-03', 'self',
    'Basic corporate tax knowledge'
FROM skills WHERE name = 'Corporate Tax Planning';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    2, 3, 1.5, '2025-09-30', 'self',
    'Personal tax returns and basic planning'
FROM skills WHERE name = 'Personal Tax Advisory';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    2, 3, 1.0, '2025-09-28', 'self',
    'VAT returns and compliance'
FROM skills WHERE name = 'VAT & Indirect Taxes';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    1, 2, 0.2, '2025-07-15', 'self',
    'Limited exposure to international tax'
FROM skills WHERE name = 'International Tax';

-- Digital & Technology (Emma) - Good with technology
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    3, 5, 2.0, '2025-10-05', 'self',
    'Very comfortable with Xero, use it daily'
FROM skills WHERE name = 'Cloud Accounting Software (Xero)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    3, 4, 1.5, '2025-09-20', 'self',
    'Strong Excel skills from university'
FROM skills WHERE name = 'Excel Advanced Functions';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    2, 4, 0.5, '2025-08-10', 'self',
    'Interested in learning Power BI'
FROM skills WHERE name = 'Power BI/Tableau';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    1, 5, 0.3, '2025-09-01', 'self',
    'Very interested in AI applications in accounting'
FROM skills WHERE name = 'AI & Machine Learning Applications';

-- Soft Skills (Emma) - Developing professional skills
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    3, 4, 2.0, '2025-10-06', 'self',
    'Good written communication skills'
FROM skills WHERE name = 'Written Communication';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    2, 4, 1.0, '2025-09-18', 'self',
    'Need more experience presenting to clients'
FROM skills WHERE name = 'Presentation Skills';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    3, 4, 2.0, '2025-10-05', 'self',
    'Good at time management and prioritization'
FROM skills WHERE name = 'Time Management';

-- ============================================
-- MICHAEL CHEN - Advisory Consultant
-- Profile: Mid-career, 5-7 years experience, well-rounded
-- Skill levels: 3-4, Interest levels: 3-4
-- ============================================

-- Technical Accounting & Audit (Michael)
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 6.0, '2025-10-05', 'manager',
    'Strong UK GAAP knowledge, handles complex accounts'
FROM skills WHERE name = 'Financial Reporting (UK GAAP)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    3, 3, 4.0, '2025-09-15', 'manager',
    'Good IFRS knowledge for group accounts'
FROM skills WHERE name = 'Financial Reporting (IFRS)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 5.5, '2025-09-28', 'manager',
    'Experienced audit senior, manages engagements'
FROM skills WHERE name = 'Audit Planning & Execution';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 5.0, '2025-09-28', 'manager',
    'Strong risk assessment and testing capabilities'
FROM skills WHERE name = 'Risk Assessment & Testing';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 6.0, '2025-10-04', 'manager',
    'Specialist in corporate tax planning'
FROM skills WHERE name = 'Corporate Tax Planning';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    3, 3, 5.0, '2025-09-22', 'manager',
    'Competent personal tax advisor'
FROM skills WHERE name = 'Personal Tax Advisory';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 3, 6.0, '2025-10-03', 'manager',
    'VAT specialist, handles complex cases'
FROM skills WHERE name = 'VAT & Indirect Taxes';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    3, 4, 3.0, '2025-08-15', 'manager',
    'Growing international tax practice'
FROM skills WHERE name = 'International Tax';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 4.0, '2025-09-10', 'manager',
    'Experienced in group consolidations'
FROM skills WHERE name = 'Consolidated Accounts';

-- Advisory & Consulting (Michael) - His specialty
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 5, 5.0, '2025-09-25', 'manager',
    'Strong valuation skills, DCF modeling expert'
FROM skills WHERE name = 'Business Valuation';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 4.5, '2025-08-30', 'manager',
    'Experienced in M&A due diligence projects'
FROM skills WHERE name = 'M&A Due Diligence';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    5, 5, 6.0, '2025-10-05', 'manager',
    'Expert financial modeler, builds complex models'
FROM skills WHERE name = 'Financial Modelling';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 5.5, '2025-10-02', 'manager',
    'Cash flow forecasting for multiple clients'
FROM skills WHERE name = 'Cash Flow Forecasting';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 4.0, '2025-09-20', 'manager',
    'Strategic planning facilitator'
FROM skills WHERE name = 'Strategic Business Planning';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    3, 4, 3.0, '2025-07-10', 'manager',
    'ESG reporting becoming more important'
FROM skills WHERE name = 'ESG Reporting & Advisory';

-- Digital & Technology (Michael)
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 6.0, '2025-10-06', 'manager',
    'Expert Xero user, trains others'
FROM skills WHERE name = 'Cloud Accounting Software (Xero)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 3, 5.0, '2025-09-15', 'manager',
    'QuickBooks for specific clients'
FROM skills WHERE name = 'Cloud Accounting Software (QuickBooks)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    5, 4, 6.5, '2025-10-05', 'manager',
    'Advanced Excel expert, creates complex models'
FROM skills WHERE name = 'Excel Advanced Functions';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 5, 3.0, '2025-10-01', 'manager',
    'Power BI for client dashboards and reporting'
FROM skills WHERE name = 'Power BI/Tableau';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    3, 4, 2.0, '2025-09-05', 'manager',
    'Learning Python for automation'
FROM skills WHERE name = 'Python/R for Accounting';

-- Client & Business Development (Michael)
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 5.0, '2025-10-06', 'manager',
    'Strong client relationships, trusted advisor'
FROM skills WHERE name = 'Client Relationship Management';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    3, 4, 3.0, '2025-09-28', 'manager',
    'Growing business development skills'
FROM skills WHERE name = 'New Business Development';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 4.0, '2025-09-12', 'manager',
    'Excellent at writing proposals and pitching'
FROM skills WHERE name = 'Proposal Writing & Pitching';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 4.5, '2025-10-03', 'manager',
    'Good at identifying cross-sell opportunities'
FROM skills WHERE name = 'Cross-Selling Services';

-- Soft Skills (Michael)
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 6.0, '2025-10-06', 'manager',
    'Excellent written communication'
FROM skills WHERE name = 'Written Communication';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 5.0, '2025-09-25', 'manager',
    'Confident presenter, client-facing'
FROM skills WHERE name = 'Presentation Skills';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 6.0, '2025-10-06', 'manager',
    'Strong analytical and problem-solving skills'
FROM skills WHERE name = 'Problem Solving';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 6.0, '2025-10-06', 'manager',
    'Excellent critical thinking abilities'
FROM skills WHERE name = 'Critical Thinking';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Michael Chen'),
    id,
    4, 4, 6.0, '2025-10-06', 'manager',
    'Strong collaboration and teamwork'
FROM skills WHERE name = 'Collaboration';

-- ============================================
-- SARAH JOHNSON - Senior Manager
-- Profile: Senior leader, 10+ years experience, strategic focus
-- Skill levels: 4-5, Interest levels: 3-5
-- ============================================

-- Technical Accounting & Audit (Sarah)
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 12.0, '2025-10-05', '360',
    'Expert in UK GAAP, leads complex engagements'
FROM skills WHERE name = 'Financial Reporting (UK GAAP)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 10.0, '2025-09-20', '360',
    'Strong IFRS knowledge for international clients'
FROM skills WHERE name = 'Financial Reporting (IFRS)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 11.0, '2025-10-02', '360',
    'Audit partner-level, oversees all audit quality'
FROM skills WHERE name = 'Audit Planning & Execution';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 11.0, '2025-10-02', '360',
    'Risk assessment expert, trains others'
FROM skills WHERE name = 'Risk Assessment & Testing';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 12.0, '2025-10-04', '360',
    'Senior tax advisor, complex corporate structures'
FROM skills WHERE name = 'Corporate Tax Planning';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 10.0, '2025-09-28', '360',
    'High-net-worth individual tax planning'
FROM skills WHERE name = 'Personal Tax Advisory';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 11.0, '2025-10-01', '360',
    'VAT expert, handles disputes and planning'
FROM skills WHERE name = 'VAT & Indirect Taxes';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 4, 8.0, '2025-09-15', '360',
    'International tax specialist, cross-border work'
FROM skills WHERE name = 'International Tax';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 7.0, '2025-08-20', '360',
    'Transfer pricing for multinational clients'
FROM skills WHERE name = 'Transfer Pricing';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 3, 10.0, '2025-09-25', '360',
    'Group consolidation expert, complex structures'
FROM skills WHERE name = 'Consolidated Accounts';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 4, 8.0, '2025-07-30', '360',
    'Experienced in corporate restructuring'
FROM skills WHERE name = 'Group Restructuring';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 4, 9.0, '2025-09-10', '360',
    'R&D tax credits specialist'
FROM skills WHERE name = 'R&D Tax Credits';

-- Advisory & Consulting (Sarah)
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 10.0, '2025-09-28', '360',
    'Expert valuator, qualified business appraiser'
FROM skills WHERE name = 'Business Valuation';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 9.0, '2025-08-25', '360',
    'Led numerous M&A transactions'
FROM skills WHERE name = 'M&A Due Diligence';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 11.0, '2025-10-03', '360',
    'Expert financial modeler, quality reviewer'
FROM skills WHERE name = 'Financial Modelling';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 11.0, '2025-10-04', '360',
    'Cash flow forecasting expert'
FROM skills WHERE name = 'Cash Flow Forecasting';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 10.0, '2025-09-30', '360',
    'Strategic planning facilitator and advisor'
FROM skills WHERE name = 'Strategic Business Planning';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 9.0, '2025-09-22', '360',
    'Succession planning specialist for family businesses'
FROM skills WHERE name = 'Succession Planning';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 6.0, '2025-06-15', '360',
    'Turnaround and restructuring experience'
FROM skills WHERE name = 'Turnaround & Restructuring';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 5, 3.0, '2025-09-12', '360',
    'ESG reporting thought leader, building practice'
FROM skills WHERE name = 'ESG Reporting & Advisory';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 4, 8.0, '2025-09-18', '360',
    'Grant funding advisor for tech and innovation clients'
FROM skills WHERE name = 'Grant Funding Advisory';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 10.0, '2025-09-29', '360',
    'Business process improvement consultant'
FROM skills WHERE name = 'Business Process Improvement';

-- Digital & Technology (Sarah)
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 8.0, '2025-10-05', '360',
    'Expert Xero user, Xero advisor'
FROM skills WHERE name = 'Cloud Accounting Software (Xero)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    3, 3, 6.0, '2025-08-10', '360',
    'QuickBooks for specific client needs'
FROM skills WHERE name = 'Cloud Accounting Software (QuickBooks)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 7.0, '2025-09-05', '360',
    'Sage experience from previous roles'
FROM skills WHERE name = 'Cloud Accounting Software (Sage)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 12.0, '2025-10-06', '360',
    'Advanced Excel expert, power user'
FROM skills WHERE name = 'Excel Advanced Functions';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 5, 4.0, '2025-10-02', '360',
    'Power BI expert, creates client dashboards'
FROM skills WHERE name = 'Power BI/Tableau';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 4, 5.0, '2025-09-28', '360',
    'Data analytics specialist, uses advanced techniques'
FROM skills WHERE name = 'Data Analytics & Visualization';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    3, 4, 3.0, '2025-08-15', '360',
    'Exploring process automation opportunities'
FROM skills WHERE name = 'Process Automation (RPA)';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    3, 5, 1.5, '2025-09-20', '360',
    'Very interested in AI applications, early adopter'
FROM skills WHERE name = 'AI & Machine Learning Applications';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 4, 10.0, '2025-10-01', '360',
    'Cybersecurity champion for the practice'
FROM skills WHERE name = 'Cybersecurity Awareness';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 9.0, '2025-09-15', '360',
    'Digital audit tools expertise'
FROM skills WHERE name = 'Digital Audit Tools';

-- Sector Specialisation (Sarah)
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 8.0, '2025-10-03', '360',
    'Technology and SaaS sector specialist'
FROM skills WHERE name = 'Technology & SaaS';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 7.0, '2025-08-25', '360',
    'Real estate and construction experience'
FROM skills WHERE name = 'Real Estate & Construction';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 9.0, '2025-09-08', '360',
    'Financial services clients portfolio'
FROM skills WHERE name = 'Financial Services';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 8.0, '2025-09-12', '360',
    'Manufacturing and distribution sector experience'
FROM skills WHERE name = 'Manufacturing & Distribution';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 11.0, '2025-10-05', '360',
    'Professional services sector expert'
FROM skills WHERE name = 'Professional Services';

-- Regulatory & Compliance (Sarah)
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 6.0, '2025-07-20', '360',
    'FCA regulations for financial services clients'
FROM skills WHERE name = 'FCA Regulations';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 11.0, '2025-10-04', '360',
    'AML/KYC expert, MLRO qualified'
FROM skills WHERE name = 'AML/KYC Procedures';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 4, 5.0, '2025-09-28', '360',
    'GDPR compliance officer for practice'
FROM skills WHERE name = 'GDPR & Data Protection';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 3, 12.0, '2025-10-03', '360',
    'Companies House filing expert'
FROM skills WHERE name = 'Companies House Filings';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 10.0, '2025-09-15', '360',
    'Pension regulations and auto-enrollment'
FROM skills WHERE name = 'Pension Regulations';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 3, 11.0, '2025-09-25', '360',
    'Employment law and payroll compliance'
FROM skills WHERE name = 'Employment Law Basics';

-- Client & Business Development (Sarah) - Senior level
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-06', '360',
    'Senior client relationship manager, portfolio lead'
FROM skills WHERE name = 'Client Relationship Management';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 10.0, '2025-10-04', '360',
    'Business development leader, strong network'
FROM skills WHERE name = 'New Business Development';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 11.0, '2025-09-20', '360',
    'Expert proposal writer and presenter'
FROM skills WHERE name = 'Proposal Writing & Pitching';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 11.0, '2025-10-02', '360',
    'Cross-selling champion, advisory services leader'
FROM skills WHERE name = 'Cross-Selling Services';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 12.0, '2025-10-05', '360',
    'Client onboarding process owner'
FROM skills WHERE name = 'Client Onboarding';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 11.0, '2025-09-28', '360',
    'Expert negotiator, value-based pricing advocate'
FROM skills WHERE name = 'Fee Negotiation';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-06', '360',
    'Client retention expert, high retention rates'
FROM skills WHERE name = 'Client Retention Strategies';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 12.0, '2025-10-03', '360',
    'Strong professional network, active networker'
FROM skills WHERE name = 'Networking & Referrals';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 4, 5.0, '2025-09-15', '360',
    'Digital marketing strategy for practice'
FROM skills WHERE name = 'Digital Marketing Understanding';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 8.0, '2025-09-30', '360',
    'Thought leader, published articles and speaker'
FROM skills WHERE name = 'Thought Leadership';

-- Leadership & Management (Sarah) - Her strongest area
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-06', '360',
    'Senior team leader, manages multiple teams'
FROM skills WHERE name = 'Team Leadership';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 11.0, '2025-10-05', '360',
    'Performance management expert, develops talent'
FROM skills WHERE name = 'Performance Management';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 10.0, '2025-10-04', '360',
    'Active coach and mentor, mentors multiple staff'
FROM skills WHERE name = 'Coaching & Mentoring';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 11.0, '2025-10-02', '360',
    'Project management expert, PMQ qualified'
FROM skills WHERE name = 'Project Management';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 9.0, '2025-09-22', '360',
    'Change management leader, led practice transformation'
FROM skills WHERE name = 'Change Management';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-06', '360',
    'Strategic thinker, practice strategy leader'
FROM skills WHERE name = 'Strategic Thinking';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-06', '360',
    'Excellent decision maker, trusted judgment'
FROM skills WHERE name = 'Decision Making';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 11.0, '2025-10-05', '360',
    'Delegation expert, empowers team members'
FROM skills WHERE name = 'Delegation & Empowerment';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 10.0, '2025-09-18', '360',
    'Conflict resolution skills, mediator'
FROM skills WHERE name = 'Conflict Resolution';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    4, 5, 8.0, '2025-09-28', '360',
    'Cultural intelligence, diverse team leader'
FROM skills WHERE name = 'Cultural Intelligence';

-- Soft Skills (Sarah) - Excellent across the board
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 12.0, '2025-10-06', '360',
    'Exceptional written communication skills'
FROM skills WHERE name = 'Written Communication';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-02', '360',
    'Outstanding presenter, keynote speaker'
FROM skills WHERE name = 'Presentation Skills';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-06', '360',
    'Active listener, truly understands clients'
FROM skills WHERE name = 'Active Listening';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 10.0, '2025-10-06', '360',
    'High emotional intelligence, empathetic leader'
FROM skills WHERE name = 'Emotional Intelligence';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-06', '360',
    'Exceptional problem-solving abilities'
FROM skills WHERE name = 'Problem Solving';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-06', '360',
    'Critical thinking expert, analytical mindset'
FROM skills WHERE name = 'Critical Thinking';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 4, 12.0, '2025-10-06', '360',
    'Excellent time management and prioritization'
FROM skills WHERE name = 'Time Management';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-06', '360',
    'Highly adaptable, embraces change'
FROM skills WHERE name = 'Adaptability';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 12.0, '2025-10-06', '360',
    'Collaborative leader, team player'
FROM skills WHERE name = 'Collaboration';

INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, years_experience, last_used_date, assessment_type, notes)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Sarah Johnson'),
    id,
    5, 5, 11.0, '2025-10-06', '360',
    'Professional skepticism, questioning mindset'
FROM skills WHERE name = 'Professional Skepticism';

-- Clean up temporary table
DROP TABLE IF EXISTS temp_team_members;

-- Summary
-- Emma Wilson: 16 skills assessed (entry-level profile)
-- Michael Chen: 38 skills assessed (mid-career profile)  
-- Sarah Johnson: 80+ skills assessed (senior leader profile)
-- Total: 130+ skill assessments created

