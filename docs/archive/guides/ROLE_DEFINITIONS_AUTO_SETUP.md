# 🎯 Role Definitions Auto-Setup Guide

## Overview

This guide helps you automatically create Role Definitions that match your existing Role Management structure, and auto-assign team members to their corresponding roles.

---

## ✅ What This Does

### 1. **Deletes Old Seeded Roles**
- Removes example roles like "Audit Junior"
- Gives you a clean slate

### 2. **Creates 6 Role Definitions**
Matches your existing team structure:
- **Partner** - Leadership with strategic responsibilities
- **Director** - Senior management with department oversight
- **Manager** - Project management and team supervision
- **Assistant Manager** - Work stream leadership
- **Senior** - Experienced practitioners
- **Junior** - Entry-level professionals

### 3. **Auto-Assigns Team Members**
- Reads each person's `role` from Role Management
- Finds the matching Role Definition
- Creates an active assignment
- Excludes test accounts

### 4. **Defines Role Requirements**
Each role includes:
- ✅ Key responsibilities (what they do day-to-day)
- ✅ Required EQ scores (emotional intelligence thresholds)
- ✅ Preferred Belbin roles (team role preferences)
- ✅ Motivational drivers (achievement, influence, autonomy, affiliation)
- ✅ Communication preferences (sync/async/hybrid)
- ✅ Client-facing requirements

---

## 🚀 How To Run

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**

### Step 2: Run The Script
1. Open the file: `CREATE_ROLE_DEFINITIONS_FROM_TEAM.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**

### Step 3: Verify Results
The script automatically runs verification queries at the end:

**Query 1: Role Definitions Created**
```sql
SELECT 
  role_title,
  seniority_level,
  department,
  is_active
FROM role_definitions
ORDER BY seniority_level;
```

**Query 2: Team Member Assignments**
```sql
SELECT 
  pm.name,
  pm.role as current_role,
  rd.role_title as assigned_role_definition,
  mra.assignment_status
FROM practice_members pm
LEFT JOIN member_role_assignments mra ON mra.practice_member_id = pm.id
LEFT JOIN role_definitions rd ON rd.id = mra.role_definition_id
WHERE pm.is_test_account IS NOT TRUE;
```

---

## ✅ Expected Results

### Role Definitions Tab
You should see **6 roles**:
- Partner (Leadership)
- Director (Leadership)
- Manager (Operations)
- Assistant Manager (Operations)
- Senior (Operations)
- Junior (Operations)

### Individual Profiles Tab
Each team member will now have:
- **Role Fit Score** - How well they match their current role
- **Strengths** - Based on their assessments vs role requirements
- **Development Areas** - Gaps to work on
- **Training Priorities** - What CPD activities to focus on

---

## 🎨 Customization

After running the script, you can:

### Edit Role Definitions
1. Go to **Team Management** → **Role Definitions**
2. Click on any role
3. Edit responsibilities, requirements, or thresholds
4. Save changes

### Reassign Team Members
1. Go to **Individual Profiles**
2. View any team member
3. Their role fit will automatically recalculate against updated definitions

---

## 🔍 How It Works

### Role Matching Logic
```
practice_members.role = "Manager"
  → Finds role_definitions.role_title = "Manager"
    → Creates member_role_assignments entry
      → Individual profile calculates role fit
```

### Role Fit Calculation
The system compares:
- Team member's EQ scores vs role's minimum EQ requirements
- Team member's Belbin roles vs role's preferred Belbin roles
- Team member's motivational drivers vs role's required drivers
- Team member's communication style vs role's preferred style
- Team member's skills vs role's required skills

**Result**: 0-100 score indicating role suitability

---

## 📊 Role Requirements Breakdown

### Partner (Leadership)
- **EQ**: 75+ across all dimensions
- **Motivational**: High achievement (80), influence (75), autonomy (70)
- **Belbin**: Coordinator (primary), Shaper (secondary)
- **Communication**: Synchronous
- **Client-Facing**: Yes

### Director (Leadership)
- **EQ**: 70+ self-awareness/management, 75+ social skills
- **Motivational**: High achievement (75), influence (70), autonomy (65)
- **Belbin**: Coordinator (primary), Implementer (secondary)
- **Communication**: Synchronous
- **Client-Facing**: Yes

### Manager (Operations)
- **EQ**: 65+ across dimensions, 70+ relationship management
- **Motivational**: Balanced achievement (70), affiliation (60), autonomy (60)
- **Belbin**: Coordinator (primary), Monitor Evaluator (secondary)
- **Communication**: Hybrid
- **Client-Facing**: Yes

### Assistant Manager (Operations)
- **EQ**: 60+ across dimensions, 65+ relationship management
- **Motivational**: Moderate achievement (65), affiliation (55), autonomy (55)
- **Belbin**: Implementer (primary), Team Worker (secondary)
- **Communication**: Hybrid
- **Client-Facing**: Yes

### Senior (Operations)
- **EQ**: 55+ across all dimensions
- **Motivational**: Moderate achievement (60), balanced other drivers (50)
- **Belbin**: Implementer (primary), Specialist (secondary)
- **Communication**: Hybrid
- **Client-Facing**: No

### Junior (Operations)
- **EQ**: 50+ across all dimensions (baseline)
- **Motivational**: Moderate achievement (55), affiliation (55), lower autonomy (40)
- **Belbin**: Implementer (primary), Team Worker (secondary)
- **Communication**: Asynchronous
- **Client-Facing**: No

---

## 🚨 Troubleshooting

### Issue: "No roles showing in Role Definitions tab"
**Solution**: Make sure you ran the SQL script successfully. Check for any error messages in Supabase.

### Issue: "Team members not assigned"
**Solution**: 
1. Check that team members have a `role` set in Role Management
2. Verify the role names match exactly (Partner, Director, Manager, etc.)
3. Run the verification query to see assignment status

### Issue: "Individual profiles still empty"
**Solution**:
1. Ensure team members have completed all 7 assessments
2. Click "Refresh All" in Individual Profiles tab
3. Wait for profile calculation to complete

---

## 🎯 Next Steps

1. **Review Role Definitions**
   - Go through each role
   - Adjust responsibilities as needed
   - Fine-tune requirement thresholds

2. **Check Individual Profiles**
   - Review each team member's role fit
   - Identify development priorities
   - Plan CPD activities

3. **Use Strategic Insights**
   - Go to Team Assessment Insights
   - Review team composition analysis
   - Implement optimization recommendations

---

## ✅ Benefits

### For Admins
- ✅ Clear role expectations defined
- ✅ Objective role fit scores
- ✅ Data-driven team optimization
- ✅ Identify skills gaps and training needs

### For Team Members
- ✅ Clear understanding of role requirements
- ✅ Personalized development plans
- ✅ Objective assessment of strengths
- ✅ Targeted CPD recommendations

### For The Practice
- ✅ Better role-person fit
- ✅ Reduced turnover
- ✅ Improved team performance
- ✅ Strategic workforce planning

---

**Ready to get started?** 🚀

Open `CREATE_ROLE_DEFINITIONS_FROM_TEAM.sql` in Supabase SQL Editor and run it!

