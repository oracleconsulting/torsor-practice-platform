# 🚨 COMPREHENSIVE ADMIN PORTAL ISSUES - DIAGNOSIS & FIX PLAN

## Issues Reported

1. ❌ Skills assessment figures not showing in Skills Dashboard (0/111 shown)
2. ❌ Skills Heatmap showing all zeros
3. ❌ Strategic Insights showing generic/low EQ for high EQ people
4. ❌ Strategic Insights regenerating every time instead of persisting
5. ❌ Team Composition charts throwing React errors and "No team members found"
6. ❌ Individual Profiles missing skills assessments data
7. ❌ Individual Profiles missing service line preferences
8. ❌ Advisory/Technical/Leadership scores source unclear

---

## Root Causes

### Issue 1 & 2: Skills Not Showing
**Likely Cause**: The `_score` suffix issue extends to other areas. Need to check if:
- Skills dashboard is querying the right tables
- Skills heatmap is fetching data correctly
- Column names match between code and database

### Issue 3 & 4: Strategic Insights Problems
**Root Cause**: The `TeamAssessmentInsights` component is:
- Still using old column names (without `_score` suffix)
- Not using cached profiles (recalculating every time)
- The error "No team members found" suggests filtering logic is broken

**Evidence from Console**:
```
[TeamInsights] Error generating composition analysis: Error: No team members found
```

### Issue 5: Team Composition Error
**Root Cause**: React error #62 means "Minified React error" - usually a data format issue or null reference.

**Evidence from Console**:
```
[TeamAssessmentInsights] Chart rendering error
[ChartErrorBoundary] Uncaught error
```

The charts are trying to render but data format doesn't match expectations.

### Issue 6 & 7: Individual Profiles Incomplete
**Root Cause**: The `calculateIndividualProfile()` function doesn't include:
- Skills assessment results in the profile summary
- Service line preferences from assessments
- Full assessment details for display

### Issue 8: Score Sources
**Advisory/Technical/Leadership scores** come from:
- `role-fit-analyzer.ts` → `calculateAdvisorySuitability()`
- `role-fit-analyzer.ts` → `calculateTechnicalSuitability()`
- `role-fit-analyzer.ts` → `calculateLeadershipReadiness()`

These are **calculated scores** based on:
- EQ scores (weighted)
- Belbin roles
- Motivational drivers
- Communication preferences
- Conflict styles

---

## The Big Picture Problem

The `_score` suffix fix **only fixed `individual-profiles-api.ts`**, but there are **multiple other files** that also query assessment tables:

1. `TeamAssessmentInsights.tsx` - Team-level insights
2. `AdminDashboardPage.tsx` - Skills dashboard
3. `SkillsHeatmap.tsx` - Skills matrix
4. `TeamCompositionAnalyzer` - Composition analysis

**ALL of these need the same `_score` suffix fix!**

---

## Fix Plan

### Phase 1: Fix Column Names Everywhere (URGENT)
1. Update `TeamAssessmentInsights.tsx` to use `_score` suffix
2. Update skills dashboard queries
3. Update skills heatmap queries
4. Update team composition analyzer

### Phase 2: Add Missing Data to Individual Profiles
1. Include full skills assessment results
2. Include service line preferences
3. Add assessment completion status for all 7 assessments
4. Show which assessments are complete/incomplete

### Phase 3: Fix Caching & Persistence
1. Ensure strategic insights persist once calculated
2. Add "last calculated" timestamps
3. Only recalculate when explicitly requested or data changes

### Phase 4: Fix Chart Rendering
1. Validate data format before passing to charts
2. Add null checks and error boundaries
3. Ensure all data arrays are properly formatted

---

## Immediate Actions Needed

### Step 1: Run Diagnostic Query
Check if assessment data actually exists with correct column names:

```sql
-- Check EQ assessments structure
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'eq_assessments';

-- Check if data exists
SELECT COUNT(*) FROM eq_assessments;

-- Check specific user
SELECT 
  pm.name,
  eq.self_awareness_score,
  eq.self_management_score,
  eq.social_awareness_score,
  eq.relationship_management_score
FROM practice_members pm
LEFT JOIN eq_assessments eq ON eq.practice_member_id = pm.id
WHERE pm.email = 'jhoward@rpgcc.co.uk';
```

### Step 2: Identify All Files Querying Assessments
Need to update column names in:
- `TeamAssessmentInsights.tsx`
- `AdminDashboardPage.tsx`
- `team-composition-analyzer.ts`
- Any other files querying `eq_assessments`, `belbin_assessments`, `motivational_drivers`

### Step 3: Enhance Individual Profiles
Add to `IndividualProfileData` type:
```typescript
{
  skillsAssessment: {
    totalSkills: number;
    completedSkills: number;
    topSkills: Array<{name: string, level: number}>;
    skillsToImprove: Array<{name: string, currentLevel: number, targetLevel: number}>;
  };
  serviceLinePreferences: {
    preferred: string[];
    interested: string[];
    notInterested: string[];
  };
  assessmentCompletion: {
    eq: boolean;
    belbin: boolean;
    motivational: boolean;
    conflict: boolean;
    working_prefs: boolean;
    vark: boolean;
    skills: boolean;
  };
}
```

---

## Why This Keeps Happening

The fundamental issue is **inconsistent schema**:

1. Some tables were created with `_score` suffix
2. Code was written assuming no suffix
3. The codebase is large with many files querying assessments
4. Only `individual-profiles-api.ts` was fixed
5. All other files still have the bug

**Solution**: Need a **comprehensive search-and-replace** across all files that query assessment tables.

---

## Recommended Approach

Rather than fixing files one-by-one as bugs are discovered, we should:

1. **Find ALL files** that query assessment tables
2. **Update ALL column references** to use `_score` suffix
3. **Add comprehensive logging** to catch these issues early
4. **Create TypeScript interfaces** that match actual database schema
5. **Add database schema validation** on app startup

---

## Next Steps

I will:
1. Search codebase for ALL files querying assessment tables
2. Create a comprehensive fix for all column name mismatches
3. Enhance Individual Profiles with skills and service line data
4. Fix strategic insights caching
5. Fix chart rendering errors

This will require updating multiple files, but it's the only way to ensure consistency across the entire platform.

---

**IMPORTANT**: Before I proceed with the fixes, I want to confirm:
- Should I fix ALL assessment-querying files in one go?
- Do you want Individual Profiles to show the full skills breakdown?
- Should Strategic Insights cache results and only recalculate on demand?

