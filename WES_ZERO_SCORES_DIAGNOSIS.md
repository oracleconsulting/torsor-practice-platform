# ⚠️ CRITICAL ISSUE: Role Suitability Scores Showing 0

## Problem
Wes Mason (Partner) showing:
- Advisory: 0
- Technical: 0  
- Leadership: 10

This is **clearly wrong** for a highly capable Partner with high skill scores.

## Root Cause
The advisory/technical/leadership scores are calculated by `role-fit-analyzer.ts` using:

### Advisory Score Formula (0-100):
- **25%**: EQ Social Awareness (≥70 target)
- **20%**: EQ Relationship Management (≥70 target)
- **20%**: Belbin "people roles" (Coordinator, Resource Investigator, Teamworker)
- **15%**: Motivational Influence score
- **10%**: Collaborative conflict style
- **10%**: Communication preference

### Technical Score Formula (0-100):
- **30%**: Belbin "tech roles" (Specialist, Implementer, Completer Finisher)
- **20%**: EQ Self-Management
- **20%**: Motivational Achievement
- **15%**: Motivational Autonomy
- **15%**: Attention to detail

### Leadership Score Formula (0-100):
- **30%**: EQ Relationship Management
- **20%**: EQ Social Awareness
- **25%**: Belbin "leadership roles" (Coordinator, Shaper)
- **15%**: Motivational Influence
- **10%**: Experience (based on role seniority)

## Why Wes Shows 0
**If any of these assessments are missing or null, that portion of the score = 0.**

For a Partner to show Advisory=0, Technical=0, Leadership=10, it means:
1. **EQ Assessment**: Either not completed OR data not fetched correctly
2. **Motivational Drivers**: Either not completed OR data not fetched correctly
3. **Belbin**: Possibly completed (Leadership=10 suggests some data)
4. **Skills**: Completed (you mentioned high scores)

## Immediate Diagnostic Steps

### Step 1: Check if Wes has completed all assessments
Run this query in Supabase:
```sql
-- See CHECK_WES_ASSESSMENTS.sql
```

### Step 2: If assessments ARE complete, check if data is being fetched
The issue would be in `individual-profiles-api.ts` at lines ~65-95 where it fetches assessment data.

### Step 3: Check for the EQ column name bug
We fixed this in `TeamAssessmentInsights.tsx` but may have missed it in `individual-profiles-api.ts`.

Looking at line ~70:
```typescript
eq_scores: {
  self_awareness: eqData.data.self_awareness_score ?? null,  // CORRECT
  // ...
}
```

If it says `.self_awareness` instead of `.self_awareness_score`, that's the bug.

## Quick Fix Options

### Option A: Wes needs to complete assessments
If he hasn't done EQ, Motivational Drivers, Belbin:
1. Send him the assessment links
2. Have him complete all 8 assessments
3. Click "Refresh All" on Individual Profiles

### Option B: Fix data fetching (if assessments are complete)
If assessments ARE complete but showing as 0:
1. Check `individual-profiles-api.ts` for EQ column name bug
2. Verify all assessment tables are using correct column names
3. Re-run profile calculation with fixed code

### Option C: Add fallback to Skills data
For members with incomplete assessments, we could:
- Calculate advisory/technical scores from **skills data alone**
- A Partner with high scores in client-facing skills → high advisory
- High scores in technical skills → high technical
- This would be a "backup calculation" when assessment data missing

## Recommended Solution

**Most Likely**: Wes (and possibly other Partners/Directors) haven't completed all 8 assessments yet because they're busy with client work.

**Short-term**: 
1. Run the diagnostic SQL to confirm
2. Send assessment completion reminders to incomplete members
3. Add a warning in Individual Profiles: "⚠️ Incomplete assessments - scores may be inaccurate"

**Medium-term**:
1. Implement Option C (fallback to skills data)
2. Show which assessments are missing on each profile
3. Calculate a "confidence score" based on data completeness

**Long-term**:
1. Make assessment completion mandatory for role-based insights
2. Gamify completion for senior staff
3. Show "profile completeness" percentage

---

## Next: Continuing with Phase 1.3 or Database Schema?

While you investigate Wes's assessment status, I'll continue with the next feature. Which would you prefer?

**Option A: Phase 1.3 - Cross-Assessment Insights** (Pattern Discovery)
- Shows "83% of high Openness = Plants"
- Identifies team archetypes
- Validates assessment correlations
- **Effort**: 1 week
- **Value**: Strategic insights for hiring

**Option B: Database Schema for Persistence**
- Save risk scores to database
- Track trends over time
- Enable historical analysis
- **Effort**: 3-4 days
- **Value**: Foundation for all future analytics

I recommend **Option B (Database Schema)** because:
1. It fixes the "recalculates every time" issue
2. Enables trend tracking
3. Foundation for measuring intervention effectiveness
4. Quick to implement

Should I proceed with **Option B: Database Schema**?

