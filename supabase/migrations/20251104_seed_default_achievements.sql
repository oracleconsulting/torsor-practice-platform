-- =====================================================
-- GAMIFICATION SYSTEM - DEFAULT ACHIEVEMENTS & MILESTONES
-- Seed Script: Populate default achievements
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Create Default Achievement Categories
-- =====================================================

INSERT INTO achievement_categories (name, description, icon, color, display_order)
VALUES
  ('Assessments', 'Complete team assessments and self-discovery tools', 'ClipboardCheck', '#3B82F6', 1),
  ('CPD Learning', 'Continuous Professional Development activities', 'GraduationCap', '#10B981', 2),
  ('Skills Development', 'Improve your skills and expertise', 'TrendingUp', '#8B5CF6', 3),
  ('Engagement', 'Stay active and engaged with the platform', 'Zap', '#F59E0B', 4),
  ('Leadership', 'Leadership and team contribution achievements', 'Users', '#EF4444', 5),
  ('Special', 'Rare and special recognitions', 'Star', '#FFD700', 6)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 2: Create Assessment Achievements
-- =====================================================

-- Get the category ID for Assessments
DO $$
DECLARE
  v_assessment_cat_id UUID;
BEGIN
  SELECT id INTO v_assessment_cat_id FROM achievement_categories WHERE name = 'Assessments' LIMIT 1;
  
  INSERT INTO achievements (
    category_id, name, description, badge_icon, badge_color, tier,
    trigger_type, trigger_config, points_awarded, reward_message, is_active
  ) VALUES
    -- Bronze: First Steps
    (v_assessment_cat_id, 'First Steps', 'Complete your first assessment', 'Award', '#CD7F32', 'bronze',
     'assessment_complete', '{"count": 1}', 10, 'Great start! You''ve completed your first assessment.', true),
    
    -- Silver: Getting to Know You
    (v_assessment_cat_id, 'Getting to Know You', 'Complete 3 assessments', 'Star', '#C0C0C0', 'silver',
     'assessment_complete', '{"count": 3}', 25, 'You''re building a comprehensive profile!', true),
    
    -- Gold: Well Rounded
    (v_assessment_cat_id, 'Well Rounded', 'Complete 5 assessments', 'Medal', '#FFD700', 'gold',
     'assessment_complete', '{"count": 5}', 50, 'Excellent! Your profile is taking shape.', true),
    
    -- Platinum: Master Assessor
    (v_assessment_cat_id, 'Master Assessor', 'Complete all 7 core assessments', 'Trophy', '#E5E4E2', 'platinum',
     'assessment_complete', '{"count": 7}', 100, 'Outstanding! You''ve completed your full assessment suite.', true),
    
    -- Individual Assessment Badges
    (v_assessment_cat_id, 'Learning Styles Unlocked', 'Complete your VARK assessment', 'BookOpen', '#3B82F6', 'bronze',
     'assessment_complete', '{"assessment_type": "vark", "count": 1}', 5, 'You''ve discovered your learning style!', true),
    
    (v_assessment_cat_id, 'Personality Profiled', 'Complete your OCEAN assessment', 'User', '#8B5CF6', 'bronze',
     'assessment_complete', '{"assessment_type": "ocean", "count": 1}', 5, 'Your personality profile is complete!', true),
    
    (v_assessment_cat_id, 'Team Role Identified', 'Complete your Belbin assessment', 'Users', '#10B981', 'bronze',
     'assessment_complete', '{"assessment_type": "belbin", "count": 1}', 5, 'You''ve identified your team role!', true),
    
    (v_assessment_cat_id, 'Strengths Discovered', 'Complete your strengths assessment', 'Lightbulb', '#F59E0B', 'bronze',
     'assessment_complete', '{"assessment_type": "strengths", "count": 1}', 5, 'You''ve found your strengths!', true),
    
    (v_assessment_cat_id, 'Motivations Mapped', 'Complete your motivations assessment', 'Target', '#EF4444', 'bronze',
     'assessment_complete', '{"assessment_type": "motivations", "count": 1}', 5, 'You understand what drives you!', true),
    
    (v_assessment_cat_id, 'EQ Explorer', 'Complete your Emotional Intelligence assessment', 'Heart', '#EC4899', 'bronze',
     'assessment_complete', '{"assessment_type": "eq", "count": 1}', 5, 'You''ve explored your emotional intelligence!', true),
    
    (v_assessment_cat_id, 'Skills Assessed', 'Complete your skills assessment', 'CheckCircle', '#06B6D4', 'bronze',
     'assessment_complete', '{"assessment_type": "skills", "count": 1}', 5, 'Your skills have been assessed!', true)
  ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- STEP 3: Create CPD Achievements
-- =====================================================

DO $$
DECLARE
  v_cpd_cat_id UUID;
BEGIN
  SELECT id INTO v_cpd_cat_id FROM achievement_categories WHERE name = 'CPD Learning' LIMIT 1;
  
  INSERT INTO achievements (
    category_id, name, description, badge_icon, badge_color, tier,
    trigger_type, trigger_config, points_awarded, reward_message, is_active
  ) VALUES
    -- Bronze: CPD Beginner
    (v_cpd_cat_id, 'CPD Beginner', 'Log your first 5 CPD hours', 'BookOpen', '#CD7F32', 'bronze',
     'cpd_hours', '{"hours_target": 5}', 15, 'Great start on your CPD journey!', true),
    
    -- Silver: CPD Committed
    (v_cpd_cat_id, 'CPD Committed', 'Log 20 CPD hours', 'BookMarked', '#C0C0C0', 'silver',
     'cpd_hours', '{"hours_target": 20}', 50, 'You''re committed to continuous learning!', true),
    
    -- Gold: CPD Champion
    (v_cpd_cat_id, 'CPD Champion', 'Complete your annual 40 CPD hours', 'GraduationCap', '#FFD700', 'gold',
     'cpd_hours', '{"hours_target": 40}', 100, 'Outstanding! You''ve met your annual CPD requirement.', true),
    
    -- Platinum: CPD Superstar
    (v_cpd_cat_id, 'CPD Superstar', 'Log 60+ CPD hours in a year', 'Award', '#E5E4E2', 'platinum',
     'cpd_hours', '{"hours_target": 60}', 200, 'Exceptional commitment to professional development!', true),
    
    -- Diamond: CPD Legend
    (v_cpd_cat_id, 'CPD Legend', 'Log 100+ CPD hours', 'Trophy', '#B9F2FF', 'diamond',
     'cpd_hours', '{"hours_target": 100}', 500, 'Legendary dedication to learning!', true)
  ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- STEP 4: Create Skills Development Achievements
-- =====================================================

DO $$
DECLARE
  v_skills_cat_id UUID;
BEGIN
  SELECT id INTO v_skills_cat_id FROM achievement_categories WHERE name = 'Skills Development' LIMIT 1;
  
  INSERT INTO achievements (
    category_id, name, description, badge_icon, badge_color, tier,
    trigger_type, trigger_config, points_awarded, reward_message, is_active
  ) VALUES
    -- Bronze: Skill Builder
    (v_skills_cat_id, 'Skill Builder', 'Improve 5 skills by at least one level', 'ArrowUp', '#CD7F32', 'bronze',
     'skill_level', '{"skills_improved": 5, "min_improvement": 1}', 20, 'You''re building your skillset!', true),
    
    -- Silver: Growth Mindset
    (v_skills_cat_id, 'Growth Mindset', 'Improve 20 skills', 'TrendingUp', '#C0C0C0', 'silver',
     'skill_level', '{"skills_improved": 20, "min_improvement": 1}', 50, 'Your growth mindset is showing!', true),
    
    -- Gold: Skill Expert
    (v_skills_cat_id, 'Skill Expert', 'Reach level 4 or higher in 10 skills', 'Award', '#FFD700', 'gold',
     'skill_level', '{"skills_at_level": 10, "target_level": 4}', 100, 'You''re becoming a multi-skilled expert!', true),
    
    -- Platinum: Master Craftsperson
    (v_skills_cat_id, 'Master Craftsperson', 'Reach level 5 in 5 skills', 'Trophy', '#E5E4E2', 'platinum',
     'skill_level', '{"skills_at_level": 5, "target_level": 5}', 200, 'Mastery achieved in multiple areas!', true)
  ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- STEP 5: Create Engagement Achievements
-- =====================================================

DO $$
DECLARE
  v_engagement_cat_id UUID;
BEGIN
  SELECT id INTO v_engagement_cat_id FROM achievement_categories WHERE name = 'Engagement' LIMIT 1;
  
  INSERT INTO achievements (
    category_id, name, description, badge_icon, badge_color, tier,
    trigger_type, trigger_config, points_awarded, reward_message, is_active
  ) VALUES
    -- Bronze: Week Warrior
    (v_engagement_cat_id, 'Week Warrior', 'Log in for 7 consecutive days', 'Calendar', '#CD7F32', 'bronze',
     'streak', '{"consecutive_days": 7}', 15, 'You''ve maintained a 7-day streak!', true),
    
    -- Silver: Month Master
    (v_engagement_cat_id, 'Month Master', 'Log in for 30 consecutive days', 'CalendarCheck', '#C0C0C0', 'silver',
     'streak', '{"consecutive_days": 30}', 50, 'Impressive 30-day streak!', true),
    
    -- Gold: Quarter Champion
    (v_engagement_cat_id, 'Quarter Champion', 'Log in for 90 consecutive days', 'Flame', '#FFD700', 'gold',
     'streak', '{"consecutive_days": 90}', 150, 'You''re on fire with a 90-day streak!', true),
    
    -- Platinum: Year Legend
    (v_engagement_cat_id, 'Year Legend', 'Log in for 365 consecutive days', 'Trophy', '#E5E4E2', 'platinum',
     'streak', '{"consecutive_days": 365}', 500, 'Legendary! A full year of consistent engagement!', true)
  ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- STEP 6: Create Default Milestones
-- =====================================================

-- Annual CPD Milestone
INSERT INTO milestones (
  name, description, category, goal_type, goal_target, goal_unit,
  time_period, completion_points, icon, color, is_active
) VALUES
  ('Annual CPD Target', 'Complete 40 CPD hours this year', 'cpd', 'count', 40, 'hours',
   'annual', 100, 'Target', '#10B981', true),
  
  ('Quarterly CPD Goal', 'Complete 10 CPD hours this quarter', 'cpd', 'count', 10, 'hours',
   'quarterly', 25, 'TrendingUp', '#3B82F6', true),
  
  ('Assessment Journey', 'Complete all 7 core assessments', 'assessments', 'count', 7, 'assessments',
   'lifetime', 50, 'ClipboardCheck', '#8B5CF6', true),
  
  ('Skill Excellence', 'Achieve level 4+ in 20 skills', 'skills', 'count', 20, 'skills',
   'lifetime', 200, 'Award', '#F59E0B', true),
  
  ('Consistent Learner', 'Maintain a 30-day activity streak', 'general', 'streak', 30, 'days',
   'lifetime', 50, 'Flame', '#EF4444', true)
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_category_count INTEGER;
  v_achievement_count INTEGER;
  v_milestone_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_category_count FROM achievement_categories;
  SELECT COUNT(*) INTO v_achievement_count FROM achievements;
  SELECT COUNT(*) INTO v_milestone_count FROM milestones;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ DEFAULT GAMIFICATION DATA SEEDED';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📂 Achievement Categories: %', v_category_count;
  RAISE NOTICE '🏆 Achievements Created: %', v_achievement_count;
  RAISE NOTICE '🎯 Milestones Created: %', v_milestone_count;
  RAISE NOTICE '';
  RAISE NOTICE 'ACHIEVEMENT BREAKDOWN:';
  RAISE NOTICE '  📋 Assessments: 11 achievements';
  RAISE NOTICE '  📚 CPD Learning: 5 achievements';
  RAISE NOTICE '  📈 Skills Development: 4 achievements';
  RAISE NOTICE '  ⚡ Engagement: 4 achievements';
  RAISE NOTICE '';
  RAISE NOTICE 'MILESTONES:';
  RAISE NOTICE '  🎯 Annual CPD Target (40 hours)';
  RAISE NOTICE '  🎯 Quarterly CPD Goal (10 hours)';
  RAISE NOTICE '  🎯 Assessment Journey (7 assessments)';
  RAISE NOTICE '  🎯 Skill Excellence (20 skills at level 4+)';
  RAISE NOTICE '  🎯 Consistent Learner (30-day streak)';
  RAISE NOTICE '';
  RAISE NOTICE '➡️  Next: Implement achievement trigger engine';
END $$;

