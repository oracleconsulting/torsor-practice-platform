# Comprehensive Assessment System Documentation

## Executive Summary

This document provides a complete overview of all assessments, metrics, data flows, and analytics in the Torsor Practice Platform. This system is designed to provide strategic insights for team optimization, role placement, succession planning, and capability development.

---

## Table of Contents

1. [All Assessments Overview](#all-assessments-overview)
2. [Metrics Being Measured](#metrics-being-measured)
3. [What We Do With The Data](#what-we-do-with-the-data)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Key Dashboards & Features](#key-dashboards--features)
6. [Database Schema Summary](#database-schema-summary)
7. [Caching & Performance](#caching--performance)

---

## All Assessments Overview

### 1. **VARK Learning Styles Assessment**
- **Purpose**: Identify individual learning preferences
- **Database Table**: `learning_preferences`
- **Key Column**: `team_member_id`
- **Data Captured**:
  - Primary learning style (Visual, Auditory, Reading/Writing, Kinesthetic)
  - Percentage breakdown for each style
  - Multimodal flag
- **Used For**:
  - Personalizing CPD recommendations
  - Team learning diversity analysis
  - Training delivery optimization

### 2. **OCEAN Personality Assessment (Big Five)**
- **Purpose**: Measure core personality traits
- **Database Table**: `personality_assessments`
- **Key Column**: `team_member_id`
- **Data Captured**:
  - Openness (0-100)
  - Conscientiousness (0-100)
  - Extraversion (0-100)
  - Agreeableness (0-100)
  - Neuroticism (0-100)
- **Used For**:
  - Team personality balance
  - Role suitability (client-facing vs technical)
  - Stress management insights

### 3. **Working Preferences Assessment**
- **Purpose**: Understand work style and environment preferences
- **Database Table**: `working_preferences`
- **Key Column**: `practice_member_id`
- **Data Captured**:
  - Communication style (Direct, Collaborative, Diplomatic, Analytical)
  - Work style (Independent, Team-oriented, Flexible, Structured)
  - Preferred environment (Office, Remote, Hybrid, Client-site)
  - Autonomy preference (1-5)
  - Pace preference (Fast-paced, Measured, Flexible)
- **Used For**:
  - Team dynamics optimization
  - Remote/hybrid work planning
  - Collaboration pairing

### 4. **Belbin Team Roles Assessment**
- **Purpose**: Identify natural team contribution style
- **Database Table**: `belbin_assessments`
- **Key Column**: `practice_member_id`
- **Data Captured**:
  - Primary role (Plant, Resource Investigator, Coordinator, Shaper, Monitor Evaluator, Teamworker, Implementer, Completer Finisher, Specialist)
  - Secondary role
  - Role strength scores (0-100 for each)
- **Used For**:
  - Team composition balance
  - Project team formation
  - Innovation vs execution capacity
  - Identifying team gaps

### 5. **Motivational Drivers Assessment**
- **Purpose**: Understand what motivates each team member
- **Database Table**: `motivational_drivers`
- **Key Column**: `practice_member_id`
- **Data Captured**:
  - Achievement score (0-100)
  - Affiliation score (0-100)
  - Autonomy score (0-100)
  - Influence/Power score (0-100)
  - Dominant driver
- **Used For**:
  - Role alignment (advisory needs high influence, technical needs autonomy)
  - Retention strategies
  - Reward system design
  - Career pathway recommendations

### 6. **Emotional Intelligence (EQ) Assessment**
- **Purpose**: Measure interpersonal and intrapersonal intelligence
- **Database Table**: `eq_assessments`
- **Key Column**: `practice_member_id`
- **Data Captured**:
  - Self-awareness score (0-100) - column: `self_awareness_score`
  - Self-management score (0-100) - column: `self_management_score`
  - Social awareness score (0-100) - column: `social_awareness_score`
  - Relationship management score (0-100) - column: `relationship_management_score`
  - Overall EQ score (0-100)
  - EQ level (Low, Moderate, High, Very High)
- **Used For**:
  - Client-facing readiness
  - Leadership potential
  - Advisory vs technical role fit
  - Training priorities (critical for low EQ in client-facing roles)

### 7. **Conflict Style Assessment**
- **Purpose**: Understand conflict resolution approaches
- **Database Table**: `conflict_style_assessments`
- **Key Column**: `practice_member_id`
- **Data Captured**:
  - Primary style (Competing, Collaborating, Compromising, Avoiding, Accommodating)
  - Secondary style
  - Style scores for all five approaches
- **Used For**:
  - Team conflict resolution capacity
  - High-stakes project staffing
  - Mediation and negotiation roles
  - Team diversity health

### 8. **Skills Assessment (111 Advisory Skills)**
- **Purpose**: Comprehensive technical and advisory skill proficiency
- **Database Table**: `skill_assessments`
- **Key Column**: `team_member_id`
- **Skills Table**: `skills` (111 skills across 14 categories)
- **Data Captured per Skill**:
  - Current level (1-5 scale)
  - Interest level (1-5 scale)
  - Target level (1-5 scale)
  - Assessed date
- **Skill Categories**:
  1. Regulatory & Compliance
  2. Audit & Assurance
  3. Tax Advisory
  4. Financial Management
  5. Governance & Risk
  6. Business Advisory
  7. Technology & Automation
  8. People & Leadership
  9. Client Relationship
  10. Technical Accounting
  11. Strategic Planning
  12. Industry Knowledge
  13. Communication & Presentation
  14. Data Analytics
- **Used For**:
  - Service line staffing
  - Gap analysis (team vs client needs)
  - Individual development plans
  - CPD resource targeting
  - Skills heatmaps and matrices
  - Single point of failure identification

### 9. **Service Line Preferences**
- **Purpose**: Understand member interests and capacity for service lines
- **Database Table**: `service_line_interests`
- **Key Column**: `practice_member_id`
- **Data Captured per Service Line**:
  - Interest rank (1 = most interested)
  - Current experience level (1-5)
  - Desired involvement percentage
  - Availability (hours/week)
- **Service Lines**:
  1. Automation & Advisory Accelerator
  2. Financial Planning & Forecasting
  3. Statutory Services
  4. Tax Optimization
  5. Cloud Accounting Transition
  6. M&A Support
  7. Management Reporting
  8. Business Partnering
  9. ESG Reporting
  10. Fractional CFO Services
- **Used For**:
  - Service line capability mapping
  - Deployment planning
  - Under/over-staffed service line identification
  - Member engagement and retention

---

## Metrics Being Measured

### Individual-Level Metrics

#### Role Suitability Scores (0-100)
1. **Advisory Suitability**
   - High EQ (especially social awareness & relationship management)
   - High Influence/Achievement motivation
   - Belbin: Coordinator, Resource Investigator, Shaper
   - Strong communication preference
   - Collaborative/diplomatic working style

2. **Technical Suitability**
   - High Conscientiousness (OCEAN)
   - High Autonomy motivation
   - Belbin: Specialist, Completer Finisher, Implementer
   - Analytical communication style
   - Independent/structured working style
   - Technical skill depth

3. **Hybrid Suitability**
   - Balance of advisory + technical scores
   - Identifies "unicorn" team members

4. **Leadership Readiness**
   - High EQ (all 4 domains ≥ 70)
   - High Influence + Achievement motivation
   - Belbin: Coordinator, Shaper
   - Collaborative conflict style
   - Conscientiousness ≥ 70
   - Experience/seniority

#### Development & Growth Metrics
- **Current Role Match %**: How well assessments align with assigned role
- **Next Role Readiness %**: Readiness for promotion/advancement
- **Career Trajectory**: Ascending, Stable, Lateral Move, Specialist Path, Leadership Track
- **Training Priority Level**: Critical, Enhancement, Excellence, None
- **Competency Gap Score**: For each role definition (gap between actual vs required)

#### Risk Flags
- **Red Flags** (Critical/High severity):
  - Low EQ in client-facing role
  - Critical skill gaps
  - Role mismatch > 30 points
  - Low conscientiousness in quality-critical roles
- **Warning Flags** (Medium/Low severity):
  - Moderate skill gaps
  - Development areas to watch
  - Team dynamic concerns

### Team-Level Metrics

#### Team Composition Health
1. **Belbin Balance Score (0-100)**
   - Coverage of all 9 Belbin roles
   - Identifies missing roles (gaps)
   - Identifies over-represented roles (overlaps)
   - Innovation capacity (has Plant?)
   - Momentum capacity (has Shaper?)
   - Quality capacity (has Completer Finisher?)

2. **Team EQ Score (0-100)**
   - Average team EQ
   - Domain-specific averages (self-awareness, relationship mgmt, etc.)
   - Client-facing readiness score
   - Count of high-EQ members (≥ 75)

3. **Motivational Alignment Score (0-100)**
   - Distribution balance of motivational drivers
   - Dominant motivator identification
   - Risk of motivational conflicts

4. **Conflict Resolution Capacity (0-100)**
   - Distribution of conflict styles
   - Diversity health (not all the same style)
   - Presence of collaborating/compromising styles

5. **Team Health Score (0-100)**
   - Composite of all above metrics
   - Weighted toward EQ and Belbin balance

#### Team Capability Metrics
- **Innovation Capacity Score**: Presence of creative Belbin roles + high Openness
- **Execution Capacity Score**: Implementer + Completer Finisher + Conscientiousness
- **Relationship Capacity Score**: High EQ + collaborative styles + affiliation motivation

#### Risk Indicators
- **Single Points of Failure**: Skills possessed by only one person
- **Capability Gaps**: Areas with no coverage
- **Succession Gaps**: Leadership pipeline weaknesses

### Service Line Metrics

#### Staffing Analysis
- **Current Team Size** per service line
- **Advisory/Technical/Hybrid %**: Distribution of role types
- **Optimal vs Actual Composition**: Gap score (0-100, 100 = perfect)
- **Understaffed/Overstaffed by N members**

#### Capability Strength
- **Client Relationship Strength (0-100)**: Based on team EQ + advisory suitability
- **Technical Depth Score (0-100)**: Based on technical suitability + skills coverage
- **Innovation Capacity (0-100)**: Plant + Resource Investigator + Openness
- **Execution Quality Score (0-100)**: Completer Finisher + Conscientiousness

#### Staffing Needs
- **Recruitment Needs**: Specific Belbin roles or skill profiles required
- **Training Priorities**: What training would close gaps most effectively
- **Rebalance Suggestions**: Move members between service lines

---

## What We Do With The Data

### 1. **Strategic Insights Dashboard** (Team Assessment Insights)
**Location**: Admin Portal → Team Management → Team Assessment Insights → Strategic Insights tab

**Features**:
- **Individual Role-Fit Analysis**: For each team member, calculates:
  - Advisory/Technical/Hybrid/Leadership scores
  - Red flags and warning flags
  - Development priorities ranked by impact
  - Training level (critical/enhancement/excellence)
  - Recommended role type
  - Current role match %
  - Succession readiness %

- **Team Composition Analysis**: Overall team health scoring:
  - Belbin balance with gap/overlap identification
  - EQ mapping and client-facing readiness
  - Motivational driver distribution
  - Conflict style diversity
  - Team health score (composite)
  - Strengths, weaknesses, recommendations

**Caching**: Results cached for 24 hours in `team_composition_insights` and `assessment_insights` tables. Click "Force Refresh" to recalculate.

**Use Cases**:
- Succession planning (identify leadership readiness)
- Role optimization (match people to best-fit roles)
- Training budget allocation (prioritize critical gaps)
- Hiring decisions (identify missing Belbin roles or skill profiles)
- Team rebalancing (move members to optimize performance)

### 2. **Individual Assessment Profiles** (NEW!)
**Location**: Admin Portal → Team Management → Individual Profiles tab

**Features**:
- Dropdown/accordion view of each team member
- **Comprehensive Profile** calculated from all 8 assessments:
  - Top strengths (ranked with evidence and scores)
  - Development areas (ranked with gap analysis)
  - Training priorities (specific, actionable)
  - Recommended roles (based on suitability scores)
  - Career trajectory
  - Next role readiness %
  - Optimal work conditions (based on preferences)
  - Personality summary
  - Team contribution style

- **Full Assessment Results Summary**:
  - EQ: All 4 domain scores + overall
  - Belbin: Primary + secondary roles with scores
  - Motivational Drivers: All 4 driver scores
  - Conflict Style: Primary + all style scores
  - Working Preferences: Communication, work style, environment, autonomy, pace
  - VARK: Learning style percentages
  - Skills Assessment: Total assessed, average level, coverage %

**Caching**: Profiles cached for 7 days in `individual_assessment_profiles` table. Click "Refresh All" to recalculate.

**Use Cases**:
- Performance reviews (holistic view of strengths/development)
- Career development conversations
- Personalized training plans
- Role changes and promotions
- Manager 1-on-1 prep

### 3. **Skills Dashboard & Heatmap**
**Location**: Team Portal → Skills Dashboard

**Features**:
- **Personal Skills Journey**: Individual progress tracking
  - Total skills assessed
  - Average skill level
  - Assessment progress %
  - CPD hours completed
  - Skills by category
  - Gap analysis

- **Skills Matrix (Heatmap)**: Visual grid of team × skills
  - Color-coded skill levels (1-5)
  - Interest level indicators
  - Skill gap highlighting (red = critical gap)
  - Filter by category, department, role
  - Click-to-edit for admins
  - Identifies single points of failure

- **Gap Analysis**: Priority matrix for development
  - X-axis: Average current skill level
  - Y-axis: Average interest level
  - Identifies high-interest, low-skill areas (quick wins)
  - Identifies low-interest, critical-skill areas (training priorities)

- **Team Intelligence**: Aggregate stats
  - Team capability score
  - Critical gaps count
  - High-interest skills count
  - Top skills by proficiency
  - Most common learning styles

**Use Cases**:
- Project staffing (who has what skills?)
- Training needs analysis
- Client proposal preparation (can we deliver X?)
- Service line capability mapping
- Skill development planning

### 4. **Team Composition Charts**
**Location**: Admin Portal → Team Assessment Insights → Team Composition tab

**Features**:
- **Communication Style Distribution**: Pie/bar chart
- **Work Style Distribution**: Visual breakdown
- **Belbin Role Distribution**: Stacked chart with member names
- **Motivational Driver Distribution**: Bar chart
- **EQ Distribution**: By level (Low/Moderate/High/Very High)
- **Conflict Style Distribution**: Team coverage
- **VARK Learning Style Distribution**: For training delivery
- **Average Personality Traits (OCEAN)**: Team averages

**Use Cases**:
- Team building exercises
- Communication strategy design
- Understanding team dynamics
- Onboarding new members (understand team norms)

### 5. **Assessment Completion Tracking**
**Location**: Admin Portal → Team Assessment Insights → Overview tab

**Features**:
- Per-member completion status for all 7 assessments
- Completion rate % per member
- Team-wide completion stats
- Visual progress bars
- Identifies who needs to complete what

**Use Cases**:
- Onboarding tracking
- Assessment campaign monitoring
- Ensuring data completeness for analytics

### 6. **CPD Activity Tracking & Recommendations**
**Integration**: Uses Skills Assessment + Learning Preferences

**Features**:
- Auto-generated CPD recommendations based on:
  - Skill gaps (low current level)
  - High interest areas
  - Learning style (VARK)
  - Service line interests
- AI-discovered CPD resources (Perplexity integration)
- CPD hours tracking
- Activity logging
- Notifications for new resources

**Use Cases**:
- Personalized CPD plans
- Compliance tracking (mandatory CPD hours)
- Development budget allocation
- Learning effectiveness (did CPD close gaps?)

### 7. **Service Line Coverage View**
**Location**: Admin Portal (via SQL view `service_line_coverage`)

**Features**:
- Matrix of members × service lines
- Shows:
  - Interest rank per member
  - Current experience level
  - Desired involvement %
  - Matching skill count
  - Skill proficiency average
- Identifies over/under-staffed service lines
- Calculates coverage gaps

**Use Cases**:
- Strategic workforce planning
- Service line launch decisions (do we have the people?)
- Deployment planning (who to assign to what)
- Balancing workload across service lines

### 8. **Role Definitions & Competency Mapping** (NEW!)
**Location**: Admin Portal → Team Management → Role Definitions tab

**Features**:
- Define competency requirements for each role:
  - Partner, Director, Manager, Assistant Manager, Senior, Junior
  - Required Belbin roles
  - Required EQ levels (per domain)
  - Required motivational drivers
  - Communication style requirements
  - Seniority level
- Auto-assign team members to roles based on system roles
- Calculate **role competency gaps** per member:
  - Shows gap between member's actual scores vs role requirements
  - Highlights specific areas to develop
  - Guides promotion readiness

**Use Cases**:
- Succession planning (who's ready for the next level?)
- Promotion decisions (objective criteria)
- Development planning (what do I need to work on for promotion?)
- Recruitment (what profile do we need for this role?)

### 9. **Gamification & Rewards** (Background System)
**Tables**: `achievements`, `milestones`, `user_achievements`, `user_points`

**Features**:
- Automatic achievement unlocking:
  - "Assessment Champion" (complete all 8 assessments)
  - "Skills Master" (assess all 111 skills)
  - "CPD Hero" (complete X hours)
  - "Early Adopter" (first to complete)
  - Category-specific achievements
- Milestone tracking:
  - Skills assessment progress
  - CPD hours progress
  - Course completions
- Points accumulation:
  - Assessment completions: 50-100 points each
  - Skills: 10 points per skill
  - CPD activities: points per hour
- Leaderboards (optional display)

**Use Cases**:
- Engagement and motivation
- Assessment completion campaigns
- Friendly competition
- Recognition and rewards

---

## Data Flow Architecture

### Assessment Data Flow

```
1. USER COMPLETES ASSESSMENT
   ↓
2. SAVED TO DATABASE (assessment-specific table)
   ↓
3. TRIGGERS:
   - Gamification: Check for unlocked achievements/milestones
   - CPD: Regenerate recommendations if skills changed
   - Profiles: Mark individual profile as stale (needs recalc)
   - Insights: Mark team insights as stale
   ↓
4. CACHE INVALIDATION (if applicable)
   - Individual profile recalculated on next view (if > 7 days old)
   - Team insights recalculated on next view (if > 24 hours old)
   ↓
5. ANALYTICS UPDATE
   - Skills Dashboard: Real-time (queries skill_assessments directly)
   - Team Composition: Uses cached insights (or recalculates)
   - Individual Profiles: Uses cached profiles (or recalculates)
```

### Caching Strategy

**Individual Assessment Profiles**:
- **Cache Duration**: 7 days
- **Cache Table**: `individual_assessment_profiles`
- **Invalidation**: Manual "Refresh All" button or age > 7 days
- **Rationale**: Assessments rarely change, computation is expensive

**Strategic Insights (Team Composition)**:
- **Cache Duration**: 24 hours
- **Cache Table**: `team_composition_insights` + `assessment_insights`
- **Invalidation**: Manual "Force Refresh" button or age > 24 hours
- **Rationale**: Team dynamics more fluid, admins want recent data

**Skills Dashboard**:
- **No Caching**: Queries `skill_assessments` directly
- **Rationale**: Real-time data critical for project staffing decisions

---

## Key Dashboards & Features

### For Team Members
1. **My Assessments Panel**: Complete pending assessments
2. **My Skills Dashboard**: Personal skills journey and CPD
3. **My Individual Profile**: See your own strengths, development areas, and recommendations
4. **CPD Recommendations**: Personalized learning resources
5. **Gamification Widget**: Achievements and points

### For Managers
1. **Direct Reports Panel**: View skills and assessments for direct reports
2. **Skills Matrix**: Team-wide skills heatmap
3. **Gap Analysis**: Priority training areas
4. **Individual Profiles**: Detailed profile for each team member (for 1-on-1s)

### For Partners/Directors (Admin)
1. **Team Assessment Insights**:
   - Overview (completion tracking)
   - Strategic Insights (role-fit analysis)
   - Team Composition (balance and health)
   - Team Dynamics (strengths and weaknesses)
   - Development Gaps (training priorities)
   - Action Plan (recommendations)

2. **Individual Profiles**: Comprehensive dropdown view of all members

3. **Role Definitions**: Define and manage role competency requirements

4. **Skills Dashboard**: Full team skills matrix and analytics

5. **Service Line Coverage**: Strategic workforce planning view

---

## Database Schema Summary

### Assessment Tables
- `learning_preferences` (VARK) - `team_member_id`
- `personality_assessments` (OCEAN) - `team_member_id`
- `working_preferences` - `practice_member_id`
- `belbin_assessments` - `practice_member_id`
- `motivational_drivers` - `practice_member_id`
- `eq_assessments` - `practice_member_id`
  - **NOTE**: EQ scores use `_score` suffix (e.g., `self_awareness_score`)
- `conflict_style_assessments` - `practice_member_id`
- `skill_assessments` - `team_member_id` (links to `skills` table)
- `service_line_interests` - `practice_member_id`

### Analytics & Insights Tables
- `individual_assessment_profiles` - Cached individual profiles (7-day cache)
- `assessment_insights` - Cached individual role-fit insights (used by Strategic Insights)
- `team_composition_insights` - Cached team analysis (24-hour cache)
- `service_line_insights` - Service line capability analysis
- `training_priorities` - Prioritized training recommendations

### Role Management Tables
- `role_definitions` - Competency requirements for each role (Partner, Director, etc.)
- `member_role_assignments` - Links members to role definitions
- `role_competency_gaps` - Calculated gaps between member and role requirements

### Gamification Tables
- `achievements` - Achievement definitions
- `milestones` - Milestone definitions
- `user_achievements` - Unlocked achievements per user
- `user_points` - Points ledger
- `points_leaderboard` - Aggregated leaderboard view

### Supporting Tables
- `practice_members` - Core member data (includes `is_test_account` flag)
- `skills` - 111 advisory skills
- `practices` - Practice/firm data
- `cpd_activities` - CPD tracking
- `cpd_recommendations` - AI-generated CPD suggestions
- `cpd_knowledge_base` - CPD resources library

---

## Caching & Performance

### Cache Invalidation Rules
1. **Never** show stale data > cache duration
2. **Always** provide manual refresh option
3. **Log** cache hits/misses for monitoring

### Performance Optimizations
- **Parallel Queries**: Fetch all assessments in parallel (Promise.all)
- **Indexed Columns**: All foreign keys and filtering columns are indexed
- **Test Account Filtering**: `.or('is_test_account.is.null,is_test_account.eq.false')` on all team queries
- **Batch Operations**: Individual profile recalculations can be batched
- **Lazy Loading**: Heavy components (SkillsMatrix, GapAnalysis) are lazy-loaded

---

## Recent Critical Fixes (November 2024)

### ✅ Fixed: EQ Assessment Column Names
**Issue**: Code was querying `eq_assessments.self_awareness` but database uses `self_awareness_score`
**Impact**: All EQ data was returning null, causing generic/identical profiles for everyone
**Fix**: Updated all queries to use `_score` suffix
**Files**: `individual-profiles-api.ts`, `TeamAssessmentInsights.tsx`, `ComprehensiveAssessmentResults.tsx`

### ✅ Fixed: Test Account Filtering
**Issue**: Test account ("Jimmy Test") was being included in all team analytics
**Impact**: Skewed team insights, skills dashboards, and heatmaps
**Fix**: Added `.or('is_test_account.is.null,is_test_account.eq.false')` to all queries
**Files**: `TeamAssessmentInsights.tsx`, `SkillsDashboardV2Page.tsx`, `individual-profiles-api.ts`

### ✅ Fixed: Null Value Handling in Profile Calculations
**Issue**: `null` values were being converted to `0` in comparisons (e.g., `null < 65` = `true`)
**Impact**: Members with missing data were flagged as low performers
**Fix**: Added explicit `=== null || === undefined` checks before all score comparisons
**Files**: `profile-calculator.ts`, `role-fit-analyzer.ts`

### ✅ Fixed: Strategic Insights Caching
**Issue**: Insights recalculated on every page load (expensive, causing slowdowns)
**Impact**: Poor performance, "generic" insights due to race conditions
**Fix**: Implemented 24-hour caching with manual "Force Refresh" option
**Files**: `TeamAssessmentInsights.tsx`

### ✅ Fixed: Individual Profiles Loading
**Issue**: Profiles not loading due to incorrect `department` column reference
**Impact**: Individual Profiles tab was blank
**Fix**: Removed `department` from SELECT statements (column doesn't exist)
**Files**: `individual-profiles-api.ts`

---

## Recommended Next Steps

### High Priority
1. ✅ **Deploy All Fixes**: Ensure all critical fixes above are deployed
2. ✅ **Run Force Refresh**: Admin should click "Force Refresh" on Strategic Insights to rebuild cache with correct EQ data
3. ✅ **Run Refresh All**: Admin should click "Refresh All" on Individual Profiles to rebuild profiles with correct data
4. **Verify Data Quality**: Admin should spot-check a few profiles to ensure EQ scores are now correct and profiles are personalized

### Medium Priority
1. **Add Service Line Preferences to Individual Profiles**: Fetch and display `service_line_interests` data in Individual Profiles (currently missing)
2. **Create Admin Tutorial**: Screen recording or guide showing how to use Strategic Insights and Individual Profiles
3. **Set Up Alerts**: Configure notifications when insights cache is stale (> 24 hours) to prompt refresh

### Low Priority / Future Enhancements
1. **Automated Cache Refresh**: Nightly job to recalculate insights automatically
2. **Trend Analysis**: Track how profiles change over time (before/after training)
3. **Predictive Analytics**: ML model to predict role success based on assessment patterns
4. **External Benchmarking**: Compare team scores to industry benchmarks

---

## Key Contacts & Resources

- **Codebase**: `/torsor-practice-platform/`
- **Database Migrations**: `/torsor-practice-platform/supabase/migrations/`
- **Assessment API**: `/torsor-practice-platform/src/lib/api/assessment-insights/`
- **Dashboards**: `/torsor-practice-platform/src/pages/accountancy/admin/` and `/team/`

---

**Document Version**: 1.0  
**Last Updated**: November 13, 2025  
**Author**: AI Assistant  
**Status**: Current (all fixes applied)

