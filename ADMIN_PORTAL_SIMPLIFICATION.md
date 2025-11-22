# Admin Portal Simplification Plan

## Problem
Current admin portal has **17 tabs** across 3 rows - too chaotic, too much duplication!

### Current Tabs (17):
1. TEAM INVITATIONS
2. MY ASSESSMENTS 
3. ADMIN DASHBOARD
4. ADVISORY SKILLS (V2)
5. TRAINING
6. MENTORING
7. ANALYTICS
8. SKILLS MANAGEMENT
9. CPD TRACKER
10. KPI MANAGEMENT (duplicate of Analytics)
11. KNOWLEDGE BASE
12. AI SETTINGS
13. ASSESSMENT INSIGHTS (SIMPLE) - duplicate
14. INDIVIDUAL PROFILES - duplicate
15. ROLE DEFINITIONS
16. SERVICE LINE PREFERENCES
17. TICKETS

## Duplicates Identified:
- **Assessments**: MY ASSESSMENTS, ASSESSMENT INSIGHTS, INDIVIDUAL PROFILES (3 tabs → 1)
- **Analytics**: ANALYTICS, KPI MANAGEMENT (2 tabs → 1)
- **Skills**: ADVISORY SKILLS, TRAINING, SKILLS MANAGEMENT (3 tabs → 1)

## Simplified Structure (6 CORE TABS):

### 1. 📊 DASHBOARD
   - Overview metrics
   - Quick actions
   - Team health at a glance
   - **Consolidates**: ADMIN DASHBOARD

### 2. 👥 TEAM & ASSESSMENTS
   - Team invitations
   - All assessment views (MY, TEAM, INDIVIDUAL)
   - Assessment insights
   - **Consolidates**: TEAM INVITATIONS, MY ASSESSMENTS, ASSESSMENT INSIGHTS, INDIVIDUAL PROFILES

### 3. 🎯 SKILLS & DEVELOPMENT
   - Advisory skills matrix
   - Skills management
   - Training recommendations
   - Mentoring hub
   - CPD tracking
   - **Consolidates**: ADVISORY SKILLS, TRAINING, SKILLS MANAGEMENT, MENTORING, CPD TRACKER

### 4. 📈 ANALYTICS & INSIGHTS
   - Analytics dashboard
   - KPI management
   - Service line preferences
   - Role definitions
   - **Consolidates**: ANALYTICS, KPI MANAGEMENT, SERVICE LINE PREFERENCES, ROLE DEFINITIONS

### 5. 📚 KNOWLEDGE & SUPPORT
   - Knowledge base
   - Tickets/support
   - **Consolidates**: KNOWLEDGE BASE, TICKETS

### 6. ⚙️ SETTINGS
   - AI settings
   - System configuration
   - **Consolidates**: AI SETTINGS

## Benefits:
✅ 17 tabs → 6 tabs (65% reduction)
✅ Single row of tabs
✅ Logical grouping
✅ Less cognitive load
✅ Better UX
✅ Easier to find things

## Implementation:
- Create sub-navigation within each tab
- Use accordions/sections for sub-features
- Keep URL params for deep linking

