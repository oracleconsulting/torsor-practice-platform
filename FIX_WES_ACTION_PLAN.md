# 🔧 IMMEDIATE ACTION: Fix Wes's Zero Scores

## Problem
**Wes Mason** (Partner) shows:
- Advisory: 0
- Technical: 0  
- Leadership: 10

But his portal shows **7/7 assessments complete** ✅

## Root Cause (Most Likely)
Profile is **cached with old/incorrect data**. When he completed assessments, his profile wasn't recalculated, so it still shows zeros.

---

## ✅ SOLUTION: Force Profile Recalculation

### Step 1: Run Diagnostic (2 minutes)
In Supabase SQL Editor, run:
```
DIAGNOSE_WES_ZERO_SCORES.sql
```

**What to look for**:
- **Step 2 (EQ)**: Should show scores like 75, 80, 85
- **Step 3 (Motivational)**: Should show achievement, influence, etc. scores
- **Step 4 (Belbin)**: Should show primary/secondary roles
- **Step 7 (Current Profile)**: Check `cache_age` - if >7 days, it's stale

### Step 2: If Assessment Data EXISTS (most likely)
Run Step 9 from the diagnostic:

```sql
BEGIN;

DELETE FROM individual_assessment_profiles 
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

DELETE FROM role_competency_gaps
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

DELETE FROM assessment_insights
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

COMMIT;
```

### Step 3: Recalculate Profile in UI
1. Go to **Admin Portal** → **Team Management** → **Individual Profiles**
2. Click **"Refresh All"** button
3. Wait for profiles to recalculate (30-60 seconds)
4. Check Wes's profile again

**EXPECTED**: Advisory, Technical, Leadership should now show >0

---

## If Assessment Data is MISSING

If Steps 2-6 in the diagnostic show **no rows**, the data didn't save. This means:
1. UI shows "complete" but data never saved to database
2. Wrong table/column names (unlikely - we fixed this)
3. RLS policy blocking save (unlikely for Partners)

**Solution**: Have Wes retake the assessments that show no data.

---

## If Still Zero AFTER Recalculation

If you delete cache, click "Refresh All", and Wes **still** shows 0:

**Problem is in calculation logic**: `role-fit-analyzer.ts` is not using his assessment data correctly.

**Next debugging steps**:
1. Check browser console for errors during profile calculation
2. Add console.log in `role-fit-analyzer.ts` to see what data it receives
3. Verify EQ/Motivational data is being passed to `calculateAdvisorySuitability()`

I'll help debug this if recalculation doesn't fix it.

---

## Quick Reference: Why These Scores Matter

### Advisory Suitability Score (0-100)
**Formula**:
- 25% - EQ Social Awareness (≥70 target)
- 20% - EQ Relationship Management (≥70 target)
- 20% - Belbin "people roles" (Coordinator, Resource Investigator, Teamworker)
- 15% - Motivational Influence score
- 10% - Collaborative conflict style
- 10% - Communication preference (synchronous/hybrid)

**For a Partner**: Should be 70-90+ (high client-facing capability)

### Technical Suitability Score (0-100)
**Formula**:
- 30% - Belbin "tech roles" (Specialist, Implementer, Completer Finisher)
- 20% - EQ Self-Management
- 20% - Motivational Achievement
- 15% - Motivational Autonomy
- 15% - Attention to detail

**For a Partner**: Can be 0-100 depending on role (advisory vs technical)

### Leadership Readiness Score (0-100)
**Formula**:
- 30% - EQ Relationship Management (critical for leaders)
- 20% - EQ Social Awareness
- 25% - Belbin "leadership roles" (Coordinator, Shaper)
- 15% - Motivational Influence
- 10% - Experience (based on seniority)

**For a Partner**: Should be 80-95+ (leadership position)

---

## Timeline

**Diagnostic + Fix**: 5 minutes  
**Profile Recalculation**: 1 minute  
**Total**: ~6 minutes

---

## Files to Use
1. ✅ `DIAGNOSE_WES_ZERO_SCORES.sql` - Step-by-step diagnostic
2. ✅ `FIX_WES_PROFILES.sql` - Schema checker (if needed)
3. ✅ `WES_ZERO_SCORES_DIAGNOSIS.md` - Full technical explanation

---

## Expected Outcome

After cache deletion and recalculation:
- **Advisory**: 75-85 (high EQ, client-facing partner)
- **Technical**: 30-60 (depends on his Belbin roles)
- **Leadership**: 85-95 (Partner with high EQ and experience)

If you still see zeros, let me know and I'll dig deeper into the calculation logic!

