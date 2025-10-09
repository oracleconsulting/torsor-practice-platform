# 🔍 Debug: Assessment Data Not Showing in Dashboard

## Issue
Assessment completed successfully, data saved to `invitations.assessment_data`, but not appearing in "Advisory Skills" section of Team Management dashboard.

---

## 📊 Where to Check

### 1. **Railway Logs** (Most Important!)
The backend logs that show database operations are in Railway, not the browser:

**How to check:**
1. Go to Railway dashboard
2. Click on your `torsor-practice-platform` service
3. Click **"Deployments"** tab
4. Click the latest deployment
5. Click **"View Logs"**

**What to look for:**
```
📝 Submitting assessment for: [invite-code]
📋 Fetching invitation details...
✅ Invitation found: [email] Practice ID: [uuid]
👤 Creating/finding practice member...
✅ Practice member created: [uuid]
📊 Creating skill assessments...
➕ Inserting [number] skill assessments...
✅ Skill assessments created successfully
🎉 Assessment submission complete for: [email]
   - Practice Member ID: [uuid]
   - Skill Assessments: [number]
```

**If you see errors:**
- Look for ❌ symbols
- Note the exact error message
- Common issues:
  - RLS policy blocking insert
  - Missing SUPABASE_SERVICE_ROLE_KEY
  - Column name mismatch

---

### 2. **Supabase Database Check**
Run the queries in `SUPABASE_CHECK_ASSESSMENT_DATA.sql` to see if data exists:

#### Query 1: Check practice_members
```sql
SELECT id, name, email, role, practice_id, user_id, is_active, created_at
FROM practice_members
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:** Should show your test user
**If empty:** Backend didn't create the practice_member record

#### Query 2: Check skill_assessments count
```sql
SELECT 
  COUNT(*) as total_assessments,
  team_member_id
FROM skill_assessments
GROUP BY team_member_id;
```

**Expected Result:** Should show ~110 assessments for your practice_member_id
**If empty:** Backend didn't create the skill assessment records

#### Query 3: View actual assessments
```sql
SELECT 
  sa.id,
  s.name as skill_name,
  sa.current_level,
  sa.interest_level,
  sa.assessed_at
FROM skill_assessments sa
JOIN skills s ON s.id = sa.skill_id
ORDER BY sa.assessed_at DESC
LIMIT 10;
```

**Expected Result:** Should see your skill ratings
**If empty:** No assessments were created

---

## 🔧 Common Issues & Fixes

### Issue 1: "practice_members table is empty"
**Cause:** RLS blocking insert or missing columns

**Fix:**
```sql
-- Check if user_id constraint is the problem
SELECT * FROM practice_members WHERE email = '[your-test-email]';

-- If empty, manually create for testing:
INSERT INTO practice_members (practice_id, name, email, role, is_active)
VALUES (
  '[your-practice-id]',
  'Test User',
  '[test-email]',
  'team_member',
  true
)
RETURNING *;
```

### Issue 2: "skill_assessments table is empty"
**Cause:** Backend couldn't insert assessments

**Fix:** Check Railway logs for exact error, likely:
- Column `assessed_at` missing → Run Step 2 SQL again
- RLS blocking → Service role key not configured
- Foreign key violation → practice_member_id doesn't exist

### Issue 3: "Data in invitations but not in other tables"
**Cause:** Backend submission didn't run or failed silently

**Fix:**
1. Check Railway logs for errors
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Railway
3. Test backend endpoint manually:

```bash
# In terminal, test the endpoint directly:
curl -X POST https://torsor-practice-platform-production.up.railway.app/api/invitations/[INVITE-CODE]/submit \
  -H "Content-Type: application/json" \
  -D '{"assessmentData": []}'
```

### Issue 4: "Dashboard shows 'No team members found'"
**Possible causes:**
1. **practice_members table is empty** → Backend didn't create record
2. **Dashboard querying wrong practice_id** → Check user's practice_id matches
3. **RLS blocking read** → User can't see their own data

**Debug:**
```sql
-- Check what practice_id the user has
SELECT 
  u.id as user_id,
  u.email,
  pm.practice_id,
  pm.id as practice_member_id,
  p.name as practice_name
FROM auth.users u
LEFT JOIN practice_members pm ON pm.user_id = u.id
LEFT JOIN practices p ON p.id = pm.practice_id
WHERE u.email = '[your-email]';

-- Check if any practice_members exist at all
SELECT COUNT(*) FROM practice_members;
```

---

## 🎯 Step-by-Step Debugging Process

### Step 1: Check Railway Logs
1. Open Railway dashboard
2. Go to torsor-practice-platform service
3. View latest deployment logs
4. Search for "Submitting assessment"
5. **Look for any ❌ errors**

### Step 2: Check Database Tables
Run all queries in `SUPABASE_CHECK_ASSESSMENT_DATA.sql`

**Results interpretation:**
- ✅ **practice_members has data** → Good, backend created it
- ✅ **skill_assessments has ~110 records** → Good, assessments saved
- ❌ **Both tables empty** → Backend submission failed, check Railway logs
- ⚠️ **Only invitations has data** → Backend didn't process submission

### Step 3: Check Dashboard Query
If data exists but dashboard doesn't show it:

```sql
-- This is what the dashboard queries
SELECT 
  pm.*,
  COUNT(sa.id) as assessment_count
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
GROUP BY pm.id
ORDER BY pm.created_at DESC;
```

If this returns data but dashboard doesn't show it → Frontend issue
If this returns empty → Database issue

### Step 4: Check RLS Policies
```sql
-- Verify RLS is not blocking reads
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('practice_members', 'skill_assessments', 'skills');

-- Should show rowsecurity = true for all three
```

---

## 🚨 Quick Fix: Manual Data Entry (For Testing)

If you need to test the dashboard immediately while debugging backend:

```sql
-- 1. Create practice member manually
INSERT INTO practice_members (id, practice_id, name, email, role, is_active, created_at)
VALUES (
  gen_random_uuid(),
  '[your-practice-id]',  -- Get from practices table
  'Test User',
  'test@example.com',
  'team_member',
  true,
  NOW()
)
RETURNING *;
-- Note the returned ID

-- 2. Insert a few test assessments
INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, assessed_at)
SELECT 
  '[practice-member-id-from-above]',
  id,
  3,  -- Skill level
  4,  -- Interest level
  NOW()
FROM skills
LIMIT 10;

-- 3. Check dashboard - should now show data
```

---

## 📝 Report Back

After checking, please report:

1. **Railway Logs:** 
   - [ ] Found "Submitting assessment" log
   - [ ] Saw ✅ success messages
   - [ ] Saw ❌ error messages (copy exact error)

2. **Database Check:**
   - [ ] practice_members has record: Yes / No
   - [ ] skill_assessments has records: Yes / No (how many?)
   - [ ] invitations.assessment_data exists: Yes / No

3. **Dashboard:**
   - [ ] Shows team members: Yes / No
   - [ ] Shows skill counts: Yes / No
   - [ ] Shows "Advisory Skills" data: Yes / No

This will help pinpoint the exact issue!

