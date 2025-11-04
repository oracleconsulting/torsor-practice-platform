# 🎯 Assessment Insights & Gamification System - Implementation Plan

## PART 1: STRATEGIC ASSESSMENT FRAMEWORK

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ASSESSMENT INSIGHTS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Individual      │  │  Team Analysis   │               │
│  │  Role-Fit        │  │  Composition     │               │
│  │  Scoring         │  │  Balance         │               │
│  └──────────────────┘  └──────────────────┘               │
│           │                      │                          │
│           └──────────┬───────────┘                          │
│                      ▼                                       │
│           ┌──────────────────────┐                          │
│           │  Service Line        │                          │
│           │  Optimisation        │                          │
│           └──────────────────────┘                          │
│                      │                                       │
│                      ▼                                       │
│           ┌──────────────────────┐                          │
│           │  Training Priority   │                          │
│           │  Algorithm           │                          │
│           └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Assessment Insights Storage
CREATE TABLE assessment_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id),
  
  -- Role-Fit Scoring
  role_type TEXT CHECK (role_type IN ('advisory', 'technical', 'hybrid')),
  role_fit_score DECIMAL(5,2), -- 0-100
  
  -- Individual Indicators
  belbin_primary TEXT[],
  belbin_secondary TEXT[],
  motivational_drivers JSONB, -- {achievement: 80, affiliation: 60, ...}
  eq_scores JSONB, -- {self_awareness: 75, social_awareness: 82, ...}
  conflict_style_primary TEXT,
  conflict_style_secondary TEXT,
  communication_preference TEXT,
  
  -- Calculated Scores
  advisory_suitability_score DECIMAL(5,2),
  technical_suitability_score DECIMAL(5,2),
  hybrid_suitability_score DECIMAL(5,2),
  leadership_readiness_score DECIMAL(5,2),
  
  -- Red Flags & Alerts
  red_flags JSONB[], -- [{type: 'low_eq_social', severity: 'high', message: '...'}]
  development_priorities JSONB[], -- [{area: 'relationship_building', priority: 1, ...}]
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Team Composition Analysis
CREATE TABLE team_composition_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id),
  service_line_id TEXT, -- Optional: specific service line
  
  -- Belbin Balance
  belbin_coverage JSONB, -- {coordinator: 2, implementer: 3, ...}
  belbin_gaps TEXT[],
  belbin_overlaps TEXT[],
  belbin_balance_score DECIMAL(5,2),
  
  -- Motivational Distribution
  motivational_distribution JSONB,
  motivational_alignment_score DECIMAL(5,2),
  
  -- EQ Team Mapping
  team_avg_eq DECIMAL(5,2),
  eq_domain_averages JSONB,
  client_facing_readiness_score DECIMAL(5,2),
  
  -- Conflict Style Diversity
  conflict_style_distribution JSONB,
  conflict_resolution_capacity_score DECIMAL(5,2),
  
  -- Team Health Metrics
  team_health_score DECIMAL(5,2),
  innovation_capacity_score DECIMAL(5,2),
  risk_assessment JSONB,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Line Optimization
CREATE TABLE service_line_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id),
  service_line_id TEXT NOT NULL,
  service_line_name TEXT NOT NULL,
  
  -- Capability Coverage
  technical_percentage DECIMAL(5,2),
  advisory_percentage DECIMAL(5,2),
  hybrid_percentage DECIMAL(5,2),
  
  -- Optimal vs Actual
  optimal_composition JSONB,
  actual_composition JSONB,
  composition_gap_score DECIMAL(5,2),
  
  -- Capability Gaps
  capability_gaps JSONB[],
  recruitment_needs JSONB[],
  training_priorities JSONB[],
  
  -- Risk Indicators
  single_points_of_failure JSONB[],
  succession_gaps JSONB[],
  
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## PART 2: GAMIFICATION & REWARDS SYSTEM

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   GAMIFICATION SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Achievements│  │  Milestones  │  │  Rewards     │     │
│  │  & Badges    │  │  & Quests    │  │  & Points    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            ▼                                 │
│                 ┌──────────────────────┐                    │
│                 │  Member Progress     │                    │
│                 │  Tracking            │                    │
│                 └──────────────────────┘                    │
│                            │                                 │
│                            ▼                                 │
│                 ┌──────────────────────┐                    │
│                 │  Leaderboards &      │                    │
│                 │  Recognition         │                    │
│                 └──────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Achievement Categories
CREATE TABLE achievement_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name from icon library
  color TEXT, -- Hex color code
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement Definitions (Admin-configurable)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id),
  category_id UUID REFERENCES achievement_categories(id),
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  badge_icon TEXT, -- Icon name
  badge_color TEXT, -- Badge color
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  
  -- Trigger Conditions
  trigger_type TEXT NOT NULL, -- 'assessment_complete', 'cpd_hours', 'skill_level', 'streak', 'custom'
  trigger_config JSONB NOT NULL, -- {assessment_type: 'vark', count: 1} or {cpd_hours: 10}
  
  -- Rewards
  points_awarded INTEGER DEFAULT 0,
  reward_message TEXT,
  
  -- Display & Settings
  is_secret BOOLEAN DEFAULT false, -- Hidden until unlocked
  is_repeatable BOOLEAN DEFAULT false, -- Can be earned multiple times
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Achievements (Unlocked badges)
CREATE TABLE member_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id),
  achievement_id UUID REFERENCES achievements(id),
  
  -- Unlock Details
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress_data JSONB, -- Additional context about how it was earned
  
  -- Recognition
  is_showcased BOOLEAN DEFAULT false, -- Display on profile
  is_viewed BOOLEAN DEFAULT false, -- Has member seen the unlock notification
  
  UNIQUE(member_id, achievement_id) -- Can't unlock same achievement twice (unless repeatable)
);

-- Milestones (Progress-based goals)
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id),
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'assessments', 'cpd', 'skills', 'collaboration', 'leadership'
  
  -- Progress Tracking
  goal_type TEXT NOT NULL, -- 'count', 'percentage', 'score', 'streak'
  goal_target DECIMAL(10,2), -- Target value (e.g., 40 for 40 CPD hours)
  goal_unit TEXT, -- 'hours', 'assessments', 'skills', 'days'
  
  -- Timeframe
  time_period TEXT CHECK (time_period IN ('annual', 'quarterly', 'monthly', 'weekly', 'lifetime')),
  start_date DATE,
  end_date DATE,
  
  -- Rewards
  completion_points INTEGER DEFAULT 0,
  completion_badge_id UUID REFERENCES achievements(id),
  
  -- Display
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Milestone Progress
CREATE TABLE member_milestone_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id),
  milestone_id UUID REFERENCES milestones(id),
  
  -- Progress
  current_value DECIMAL(10,2) DEFAULT 0,
  target_value DECIMAL(10,2), -- Copy of milestone goal_target
  percentage_complete DECIMAL(5,2) GENERATED ALWAYS AS (
    LEAST(100, (current_value / NULLIF(target_value, 0)) * 100)
  ) STORED,
  
  -- Status
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'expired')) DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Tracking
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(member_id, milestone_id)
);

-- Points & Leaderboard
CREATE TABLE member_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) UNIQUE,
  
  -- Points Breakdown
  total_points INTEGER DEFAULT 0,
  assessment_points INTEGER DEFAULT 0,
  cpd_points INTEGER DEFAULT 0,
  skill_points INTEGER DEFAULT 0,
  achievement_points INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  
  -- Rankings (calculated periodically)
  current_rank INTEGER,
  previous_rank INTEGER,
  
  -- Streaks
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points History (for transparency)
CREATE TABLE points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id),
  
  -- Transaction
  points_change INTEGER NOT NULL, -- Positive or negative
  points_type TEXT, -- 'assessment', 'cpd', 'skill', 'achievement', 'bonus', 'admin_adjustment'
  reason TEXT, -- Description of why points were awarded
  
  -- Reference
  reference_type TEXT, -- 'achievement', 'cpd_activity', 'assessment', 'manual'
  reference_id UUID, -- ID of the related record
  
  -- Metadata
  awarded_by UUID REFERENCES practice_members(id), -- For manual awards
  awarded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin-configurable reward rules
CREATE TABLE reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id),
  
  -- Rule Definition
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'assessment_complete', 'cpd_log', 'skill_improve', 'streak'
  event_config JSONB, -- Specific conditions
  
  -- Rewards
  points_awarded INTEGER DEFAULT 0,
  auto_award_achievement_id UUID REFERENCES achievements(id),
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Phases

### PHASE 1: Core Gamification (Week 1-2)
**Priority: HIGH**

1. **Database Setup**
   - Run migration scripts
   - Seed default achievements
   - Create default milestones

2. **Basic Achievements**
   ```typescript
   // Default achievements to seed
   - "First Steps" - Complete first assessment (Bronze)
   - "Getting Started" - Complete 3 assessments (Silver)
   - "Full Picture" - Complete all 7 assessments (Gold)
   - "CPD Beginner" - Log 5 CPD hours (Bronze)
   - "CPD Committed" - Log 20 CPD hours (Silver)
   - "CPD Champion" - Log 40 CPD hours (Gold)
   - "Skill Builder" - Improve 5 skills (Bronze)
   - "Growth Mindset" - Improve 20 skills (Silver)
   - "Consistent Learner" - 7-day streak (Bronze)
   - "Dedicated Pro" - 30-day streak (Silver)
   ```

3. **Achievement Unlock System**
   - Auto-detection triggers
   - Real-time notifications
   - Badge display on profile

### PHASE 2: Admin Configuration UI (Week 2-3)
**Priority: HIGH**

**New Admin Tab: "Rewards & Recognition"**

<function_calls>
<invoke name="write">
<parameter name="contents">// Admin UI Component Structure for Gamification

interface AdminGamificationDashboard {
  tabs: [
    'Achievements',      // Create/edit badges
    'Milestones',        // Create/edit progress goals
    'Reward Rules',      // Auto-award configuration
    'Leaderboards',      // View rankings
    'Analytics'          // Engagement metrics
  ]
}

// ACHIEVEMENTS TAB
interface AchievementBuilder {
  // Visual Designer
  badgeIcon: IconPicker;          // Choose from 500+ icons
  badgeColor: ColorPicker;        // Hex color selector
  tier: Select<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'>;
  
  // Basic Info
  name: string;
  description: string;
  category: Select<AchievementCategory>;
  
  // Trigger Configuration
  triggerType: Select<TriggerType>;
  triggerConfig: DynamicForm; // Changes based on triggerType
  
  // Example trigger configs:
  // - Assessment Complete: { assessment_type: 'vark', count: 1 }
  // - CPD Hours: { hours_target: 10, period: 'monthly' }
  // - Skill Level: { skill_id: 'xyz', target_level: 4 }
  // - Streak: { consecutive_days: 7 }
  // - Custom: { sql_query: '...' }
  
  // Rewards
  pointsAwarded: number;
  rewardMessage: string;
  
  // Settings
  isSecret: boolean;          // Hidden until unlocked
  isRepeatable: boolean;      // Can earn multiple times
  displayOrder: number;
  isActive: boolean;
}

// MILESTONES TAB
interface MilestoneBuilder {
  // Basic Info
  name: string;
  description: string;
  category: Select<'assessments' | 'cpd' | 'skills' | 'collaboration' | 'leadership'>;
  
  // Progress Configuration
  goalType: Select<'count' | 'percentage' | 'score' | 'streak'>;
  goalTarget: number;
  goalUnit: string; // 'hours', 'assessments', 'skills', 'days'
  
  // Timeframe
  timePeriod: Select<'annual' | 'quarterly' | 'monthly' | 'weekly' | 'lifetime'>;
  startDate: Date;
  endDate: Date;
  
  // Rewards
  completionPoints: number;
  completionBadgeId: Select<Achievement>;
  
  // Visual
  icon: IconPicker;
  color: ColorPicker;
  displayOrder: number;
}

// REWARD RULES TAB
interface RewardRuleBuilder {
  name: string;
  description: string;
  
  // When to trigger
  eventType: Select<'assessment_complete' | 'cpd_log' | 'skill_improve' | 'streak' | 'custom'>;
  eventConfig: DynamicForm;
  
  // What to award
  pointsAwarded: number;
  autoAwardAchievementId: Select<Achievement>;
  
  // Active/Inactive toggle
  isActive: boolean;
}

// QUICK TEMPLATES
interface QuickTemplates {
  // Pre-built achievement sets
  templates: [
    {
      name: "Assessment Completion Journey",
      achievements: [
        { name: "First Steps", trigger: "1 assessment", points: 10, tier: "bronze" },
        { name: "Making Progress", trigger: "3 assessments", points: 25, tier: "silver" },
        { name: "Almost There", trigger: "5 assessments", points: 50, tier: "gold" },
        { name: "Master Assessor", trigger: "7 assessments", points: 100, tier: "platinum" }
      ]
    },
    {
      name: "CPD Champion Path",
      milestones: [
        { name: "Q1 CPD Goal", target: 10, period: "quarterly" },
        { name: "Q2 CPD Goal", target: 10, period: "quarterly" },
        { name: "Q3 CPD Goal", target: 10, period: "quarterly" },
        { name: "Q4 CPD Goal", target: 10, period: "quarterly" },
        { name: "Annual CPD Complete", target: 40, period: "annual" }
      ]
    },
    {
      name: "Skill Development Tiers",
      achievements: [
        { name: "Skill Novice", trigger: "5 skills at level 2+", points: 20, tier: "bronze" },
        { name: "Skill Practitioner", trigger: "20 skills at level 3+", points: 50, tier: "silver" },
        { name: "Skill Expert", trigger: "50 skills at level 4+", points: 100, tier: "gold" },
        { name: "Skill Master", trigger: "100 skills at level 5", points: 250, tier: "diamond" }
      ]
    },
    {
      name: "Engagement Streaks",
      achievements: [
        { name: "Week Warrior", trigger: "7-day streak", points: 15, tier: "bronze" },
        { name: "Month Master", trigger: "30-day streak", points: 50, tier: "silver" },
        { name: "Quarter Champion", trigger: "90-day streak", points: 150, tier: "gold" },
        { name: "Year Legend", trigger: "365-day streak", points: 500, tier: "platinum" }
      ]
    }
  ]
}
```

