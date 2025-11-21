# 🔍 PROFILE CALCULATION DIAGNOSTIC GUIDE

## Current Status
The Individual Profiles page is loading, but showing 0 profiles. The latest logging update will reveal exactly where the calculation is failing.

## What We've Added

### Comprehensive Logging at Every Step:
1. **Practice-level logging** - Shows which practice is being queried
2. **Member discovery** - Shows how many members found
3. **Sequential processing** - Processes one member at a time (not parallel) so we can see progress
4. **Profile fetch logging** - Shows if profile exists or needs calculation
5. **Calculation triggering** - Shows when auto-calculation starts
6. **Step-by-step calculation** - Shows each major step (1-6)
7. **Assessment data confirmation** - Shows which assessments are loaded
8. **Database save confirmation** - Shows if save succeeds
9. **Error details** - Full stack traces if anything fails

## How to Diagnose

### Step 1: Redeploy the Application
```bash
# The latest code has been pushed to main
# Redeploy your application now
```

### Step 2: Open Individual Profiles Tab
1. Go to **Team Management** → **Individual Profiles** tab
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Clear the console
5. Refresh the page

### Step 3: Analyze the Console Output

#### ✅ SUCCESS Pattern (What You SHOULD See):
```
[IndividualProfile] 🎯 Getting all profiles for practice: a1b2c3d4-5678-90ab-cdef-123456789abc
[IndividualProfile] Found 17 active members
[IndividualProfile] Processing James Howard (6800ff5a-6a1b-4e21-a48a-1a2ac032af78)...
[IndividualProfile] 🔍 Fetching profile for member: 6800ff5a-6a1b-4e21-a48a-1a2ac032af78
[IndividualProfile] Found member: James Howard
[IndividualProfile] 🚀 No profile found for James Howard - triggering calculation...
[IndividualProfile] 🎯 Calculating profile for member: 6800ff5a-6a1b-4e21-a48a-1a2ac032af78
[IndividualProfile] Step 1: Fetching member data...
[IndividualProfile] ✅ Member data loaded: James Howard
[IndividualProfile] Step 2: Fetching all assessment data...
[IndividualProfile] ✅ Assessment data loaded: {eq: true, belbin: true, motivational: true, conflict: true, workingPrefs: true, vark: true, skills: 111}
[IndividualProfile] Step 3: Building profile object...
[IndividualProfile] ✅ Profile object built
[IndividualProfile] Step 4: Saving profile to database...
[IndividualProfile] ✅ Profile saved to database
[IndividualProfile] 🎉 Profile calculated successfully for James Howard
[IndividualProfile] ✅ Profile loaded for James Howard
... (repeats for each member)
[IndividualProfile] 🎯 Returning 17 valid profiles
[IndividualProfiles] Loaded profiles: 17
```

#### ❌ FAILURE Patterns (What to Look For):

**Pattern 1: No members found**
```
[IndividualProfile] 🎯 Getting all profiles for practice: a1b2c3d4...
[IndividualProfile] ⚠️ No active members found for practice
```
→ **Issue**: Practice ID might be wrong or members not linked properly

**Pattern 2: Member fetch fails**
```
[IndividualProfile] Processing James Howard...
[IndividualProfile] ❌ Error fetching member ...
```
→ **Issue**: Database query error, check RLS policies

**Pattern 3: Calculation starts but fails**
```
[IndividualProfile] 🎯 Calculating profile for member: ...
[IndividualProfile] Step 1: Fetching member data...
[IndividualProfile] ✅ Member data loaded: James Howard
[IndividualProfile] Step 2: Fetching all assessment data...
[IndividualProfile] ❌ Failed to calculate profile for James Howard: [error details]
```
→ **Issue**: Error during calculation (likely database permissions or missing data)

**Pattern 4: Save fails**
```
[IndividualProfile] Step 4: Saving profile to database...
[IndividualProfile] ❌ Error saving profile to database: [error]
```
→ **Issue**: RLS policy preventing INSERT/UPDATE to `individual_assessment_profiles`

**Pattern 5: Silent failure (no calculation triggered)**
```
[IndividualProfile] 🔍 Fetching profile for member: ...
[IndividualProfile] Found member: James Howard
[IndividualProfile] 📊 Found existing profile for James Howard, fetching related data...
[IndividualProfile] ⚠️ No profile returned for James Howard
```
→ **Issue**: Profile exists but can't be fetched (RLS issue)

## Expected Troubleshooting Steps

### If Pattern 4 (Save fails):
**RLS Policy Issue** - The `individual_assessment_profiles` table needs proper INSERT/UPDATE permissions.

Run this SQL in Supabase:
```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'individual_assessment_profiles';

-- Temporarily disable RLS for testing
ALTER TABLE individual_assessment_profiles DISABLE ROW LEVEL SECURITY;
```

### If Pattern 3 (Calculation fails mid-way):
**Missing Assessment Data** - Some members might not have completed all 7 assessments.

The console will show:
```
[IndividualProfile] ✅ Assessment data loaded: {eq: false, belbin: false, ...}
```

This is expected! The calculation should handle missing data gracefully with defaults.

### If Pattern 1 (No members):
**Practice ID mismatch** - Check if the user's practice_id matches member records.

Run in Supabase:
```sql
-- Check user's practice
SELECT pm.practice_id, pm.name 
FROM practice_members pm
JOIN auth.users u ON pm.user_id = u.id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- Check how many members in that practice
SELECT COUNT(*) FROM practice_members 
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
AND is_active = true
AND is_test_account IS NULL;
```

## Next Steps

After redeploying and checking console:

1. **Copy the FULL console output** (all IndividualProfile logs)
2. **Share it here** - This will show exactly where it's failing
3. I'll identify the specific issue and provide the fix

The new logging is comprehensive enough that we'll see EXACTLY where and why it's failing! 🎯

