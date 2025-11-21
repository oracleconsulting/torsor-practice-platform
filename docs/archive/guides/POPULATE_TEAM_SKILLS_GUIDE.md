# Team Skills Population Guide

## Overview

This guide explains how to populate all skills for your three team members in TORSOR to enable full testing of the Skills Matrix, Gap Analysis, and Team Metrics features.

## Team Members

1. **Emma Wilson** - Junior Advisor (EW)
   - Role: Entry-level, 1-2 years experience
   - Skill Level Range: 1-3
   - Interest Level Range: 3-5 (eager to learn)

2. **Michael Chen** - Advisory Consultant (MC)
   - Role: Mid-career, 5-7 years experience
   - Skill Level Range: 3-4
   - Interest Level Range: 3-4 (balanced)

3. **Sarah Johnson** - Senior Manager (SJ)
   - Role: Senior leader, 10+ years experience
   - Skill Level Range: 4-5
   - Interest Level Range: 3-5 (strategic focus)

## Running the Migration

### Step 1: Ensure Skills are Defined

First, make sure all 80 skills are defined in your database:

```bash
# If using Supabase CLI
supabase migration up

# Or run the skills_definitions.sql file manually
psql -h your-db-host -U your-user -d your-database -f oracle-method-portal/database/seeds/skills_definitions.sql
```

### Step 2: Run the Team Skill Assessments Migration

```bash
# Navigate to TORSOR directory
cd torsor-practice-platform

# Run the migration
psql -h your-db-host -U your-user -d your-database -f supabase/migrations/20251007_seed_team_skill_assessments.sql
```

### Step 3: Verify in TORSOR

1. Navigate to **Team Management** → **Advisory Skills**
2. Click on the **Skills Matrix** tab
3. You should now see:
   - **Emma Wilson** with 16 skills assessed (entry-level profile)
   - **Michael Chen** with 38 skills assessed (mid-career profile)
   - **Sarah Johnson** with 80+ skills assessed (complete senior profile)

### Step 4: Test Analytics Features

Now you can test all the analytics features:

#### **Skills Matrix**
- View heatmap visualization
- Filter by category
- Sort by skill gaps
- See interest levels

#### **Gap Analysis**
- View priority matrix
- Identify critical gaps
- See interest-skill mismatches
- Review business impact

#### **Development Planning**
- Create development plans
- Set target levels
- Track progress
- Assign training

#### **Team Metrics**
- View team capability scores
- See category breakdown
- Monitor succession risks
- Track development ROI

## Skill Distribution by Category

The 80 skills are distributed across 8 categories:

| Category | # of Skills | Emma | Michael | Sarah |
|----------|-------------|------|---------|-------|
| **Technical Accounting & Audit** | 12 | 8 | 9 | 12 |
| **Digital & Technology** | 12 | 4 | 5 | 10 |
| **Advisory & Consulting** | 10 | 0 | 6 | 10 |
| **Sector Specialisation** | 10 | 0 | 0 | 5 |
| **Regulatory & Compliance** | 10 | 0 | 0 | 6 |
| **Client & Business Development** | 10 | 0 | 4 | 10 |
| **Leadership & Management** | 10 | 0 | 0 | 10 |
| **Soft Skills & Communication** | 10 | 4 | 14 | 10 |
| **TOTAL** | **84** | **16** | **38** | **83** |

## Sample Data Characteristics

### Emma Wilson (Junior Advisor)
- **Focus**: Core technical skills and technology
- **Strengths**: Digital tools (Xero, Excel), written communication
- **Development Areas**: Advisory, leadership, specializations
- **Interest**: High interest in AI and audit work
- **Assessment Type**: Self-assessment

### Michael Chen (Advisory Consultant)
- **Focus**: Advisory services and client management
- **Strengths**: Financial modeling, business valuation, client relationships
- **Development Areas**: Leadership, sector specializations
- **Interest**: Balanced across technical and advisory
- **Assessment Type**: Manager assessment

### Sarah Johnson (Senior Manager)
- **Focus**: Comprehensive across all categories
- **Strengths**: Leadership, strategic skills, advisory, client development
- **Development Areas**: Emerging tech (AI, blockchain)
- **Interest**: High in ESG, AI, thought leadership, strategic areas
- **Assessment Type**: 360-degree assessment

## Expected Analytics Results

### Skills Matrix
- **Emma**: Will show many gaps (white/empty cells), opportunity for growth
- **Michael**: Balanced heatmap, some gaps in specialization
- **Sarah**: Strong heatmap, high coverage, few gaps

### Gap Analysis
- **Critical Gaps**: Emma in advisory and leadership
- **High Interest + Low Skill**: Emma in AI, Michael in ESG
- **Succession Risk**: If Sarah leaves, gaps in leadership and strategic skills

### Team Metrics
- **Overall Capability Score**: ~70-75%
- **Strongest Category**: Technical Accounting (Sarah + Michael)
- **Weakest Category**: Sector Specialization (only Sarah covered)
- **Development Priority**: Advisory skills for Emma, Leadership for Michael

## Adding More Skills Manually

If you want to add more skills to Emma or Michael, you can use the UI:

1. Go to **Team Management** → **Advisory Skills**
2. Click **Assessment** tab
3. Select team member
4. Go through categories and add skill ratings
5. Save assessment

## Customizing the Data

To customize the skill levels, edit the migration file before running it:

```sql
-- Example: Give Emma higher scores
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, ...)
SELECT 
    (SELECT member_id FROM temp_team_members WHERE name = 'Emma Wilson'),
    id,
    3,  -- Change this: 1-5 (was 2)
    5,  -- Change this: 1-5 (was 4)
    2.0, -- Years experience
    '2025-10-01', -- Last used date
    'self', -- Assessment type
    'Your notes here'
FROM skills WHERE name = 'Financial Reporting (UK GAAP)';
```

## Troubleshooting

### Issue: Migration fails with "team member not found"
**Solution**: The migration creates temporary team members. Make sure you have a practice created first.

### Issue: Skills not showing in UI
**Solution**: 
1. Check that skills are defined: `SELECT COUNT(*) FROM skills;` (should be ~80)
2. Check assessments: `SELECT COUNT(*) FROM skill_assessments;` (should be ~130)
3. Refresh the TORSOR page

### Issue: Want to reset and start over
**Solution**: 
```sql
-- Delete all skill assessments
DELETE FROM skill_assessments;

-- Re-run the migration
```

### Issue: Want all three members to have ALL skills
**Solution**: See the next section for a complete population script.

## Complete Skills Population (Optional)

If you want to populate ALL 80 skills for ALL 3 team members (240 assessments), you can modify the migration or use the Skills Assessment tool in the UI to complete the profiles.

Alternatively, you can extend the SQL migration with more INSERT statements following the same pattern for the remaining skills.

## What You Can Now Test

With this data populated, you can fully test:

✅ **Skills Matrix Visualization** - Heatmap with all three team members  
✅ **Gap Analysis** - Identify which skills are missing  
✅ **Development Planning** - Create plans to close gaps  
✅ **Team Metrics** - View capability scores and trends  
✅ **Interest vs Skill Analysis** - Find mismatches  
✅ **Succession Risk** - See impact if Sarah leaves  
✅ **Filtering & Sorting** - All filter options work  
✅ **Export Functionality** - Generate reports  
✅ **Benchmark Comparisons** - Compare against targets  

## Next Steps

1. Run the migration
2. Log into TORSOR
3. Navigate to Team Management → Advisory Skills
4. Explore all tabs:
   - Matrix
   - Assessment
   - Gap Analysis
   - Development Planning
   - Metrics
5. Test filtering, sorting, and export features
6. Review the analytics dashboards

---

**Migration File**: `supabase/migrations/20251007_seed_team_skill_assessments.sql`  
**Total Assessments**: 130+  
**Coverage**: Emma (16 skills), Michael (38 skills), Sarah (80+ skills)  
**Ready for**: Full analytics testing ✅

