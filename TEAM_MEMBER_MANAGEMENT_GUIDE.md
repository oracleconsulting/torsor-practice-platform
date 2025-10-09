# Team Member Management Guide

## ⚠️ Important: Admin Email and Invitations

### **Issue 1: Don't Invite Your Admin Email**

**Question:** "Will it cause issues if I use `jhoward@rpgcc.co.uk` for both admin login AND a team member invitation?"

**Answer:** **YES, it will cause conflicts!**

### Why This Is a Problem:

- Your admin account (`jhoward@rpgcc.co.uk`) is already an **authenticated user** in the system
- The invitation/assessment flow expects to create a **NEW user**
- Attempting to invite the same email will cause:
  - ❌ Duplicate `practice_member` records
  - ❌ Conflicting authentication states
  - ❌ Confusing which "you" is which (admin vs. team member)
  - ❌ Potential data corruption

### Best Practices:

✅ **DO:**
- Keep admin accounts separate from team member accounts
- Use a different email for testing:
  - `jhoward+test@rpgcc.co.uk` (Gmail-style alias)
  - `test@rpgcc.co.uk`
  - A personal email address

❌ **DON'T:**
- Invite your admin email as a team member
- Use the same email for multiple roles
- Try to assess yourself as both admin and team member

---

## 📊 Where Assessment Data Is Stored

### **Issue 2: Why data shows even after deleting invitation**

When someone completes a skills assessment, data is stored in **3 separate places**:

### 1. `invitations` Table
- **Purpose**: Tracks invitation lifecycle
- **Data**: `email`, `name`, `role`, `status`, `invite_code`, `assessment_data` (raw JSON)
- **Lifecycle**: Created → Sent → Accepted → (Can be deleted)
- ✅ **You deleted this** - but data persists elsewhere!

### 2. `practice_members` Table
- **Purpose**: Permanent team member record
- **Data**: `id`, `practice_id`, `name`, `email`, `role`, `created_at`
- **Lifecycle**: Created when assessment submitted → **Persists forever**
- ❌ **Still exists** - that's why you still see them!

### 3. `skill_assessments` Table
- **Purpose**: Individual skill ratings for each team member
- **Data**: `practice_member_id`, `skill_id`, `current_level`, `interest_level`, `assessed_at`
- **Count**: 110 rows per team member (one for each skill)
- **Lifecycle**: Created when assessment submitted → **Persists forever**
- ❌ **Still exists** - that's why their scores show in the matrix!

### Why Data Persists:

**This is intentional design!**
- Deleting an invitation shouldn't delete assessment data
- Prevents accidental data loss
- Separates "invitation process" from "team member data"
- Allows re-inviting without losing history

---

## 🗑️ How to Delete Team Members

### **Solution 1: Use the UI (Recommended)** ✨

The easiest way to delete team members is through the Skills Matrix interface:

1. **Open Skills Matrix & Development**
2. **Click "Manage Team (X)" button** in the top-right
3. **Find the team member** you want to remove
4. **Click "Delete" button**
5. **Confirm** the deletion (warning will list all data that will be removed)
6. ✅ **Done!** All data is permanently removed

**What Gets Deleted:**
- ✅ Practice member record
- ✅ All 110 skill assessments
- ✅ All development goals
- ✅ All survey sessions
- ✅ All CPD activities
- ✅ Related invitations

**Features:**
- Shows team member details (name, role, email, # skills assessed)
- Loading state while deleting
- Toast confirmation when done
- Automatic page reload to show updated list

---

### **Solution 2: Use SQL (Advanced)** 🔧

For more control or when UI doesn't work, use the SQL script:

**File:** `SUPABASE_DELETE_TEAM_MEMBER.sql`

#### **Option A: Step-by-Step (Safest)**

```sql
-- Step 1: Find the team member
SELECT 
    id as practice_member_id,
    name,
    email,
    role
FROM practice_members
WHERE email = 'YOUR_EMAIL_HERE';

-- Step 2: Copy the practice_member_id from results

-- Step 3: Delete skill assessments
DELETE FROM skill_assessments
WHERE practice_member_id = 'PASTE_ID_HERE';

-- Step 4: Delete practice member
DELETE FROM practice_members
WHERE id = 'PASTE_ID_HERE';

-- Step 5: Delete invitations
DELETE FROM invitations
WHERE email = 'YOUR_EMAIL_HERE';
```

#### **Option B: Quick Delete (One Command)**

```sql
-- Replace 'YOUR_EMAIL_HERE' with the email to delete
DO $$
DECLARE
    v_member_id uuid;
BEGIN
    SELECT id INTO v_member_id
    FROM practice_members
    WHERE email = 'YOUR_EMAIL_HERE'
    LIMIT 1;
    
    IF v_member_id IS NOT NULL THEN
        DELETE FROM skill_assessments WHERE practice_member_id = v_member_id;
        DELETE FROM development_goals WHERE practice_member_id = v_member_id;
        DELETE FROM survey_sessions WHERE practice_member_id = v_member_id;
        DELETE FROM cpd_activities WHERE practice_member_id = v_member_id;
        DELETE FROM practice_members WHERE id = v_member_id;
        DELETE FROM invitations WHERE email = 'YOUR_EMAIL_HERE';
        RAISE NOTICE 'Team member completely removed!';
    END IF;
END $$;
```

#### **Option C: Delete Specific Test User (Example)**

```sql
-- Delete Luke Tyrrell (test user)
DO $$
DECLARE
    v_member_id uuid;
BEGIN
    SELECT id INTO v_member_id
    FROM practice_members
    WHERE email = 'laspartnership@googlemail.com'
    LIMIT 1;
    
    IF v_member_id IS NOT NULL THEN
        DELETE FROM skill_assessments WHERE practice_member_id = v_member_id;
        DELETE FROM practice_members WHERE id = v_member_id;
        DELETE FROM invitations WHERE email = 'laspartnership@googlemail.com';
        RAISE NOTICE 'Luke Tyrrell deleted successfully!';
    END IF;
END $$;
```

---

## 📋 Common Scenarios

### Scenario 1: Test User Cleanup
**Situation:** You created a test invitation for yourself and want to remove it.

**Solution:**
1. Use the UI: Click "Manage Team" → Find your test user → Delete
2. Or use SQL Option C with your email

**Result:** All test data removed, ready to create proper invitations.

---

### Scenario 2: Incorrect Email Invited
**Situation:** You invited someone with the wrong email and they completed the assessment.

**Solution:**
1. Delete the incorrect team member using UI or SQL
2. Create a new invitation with the correct email
3. Ask them to complete the assessment again

**Note:** Assessment data cannot be transferred between emails - they need to re-complete it.

---

### Scenario 3: Departed Team Member
**Situation:** A team member has left the practice, you want to remove their data.

**Solution:**
1. Use the UI for clean removal
2. Or use SQL if you want to keep a backup first:
   ```sql
   -- Backup before deleting
   SELECT * FROM practice_members WHERE email = 'departed@practice.com';
   SELECT * FROM skill_assessments 
   WHERE practice_member_id = (SELECT id FROM practice_members WHERE email = 'departed@practice.com');
   ```

---

### Scenario 4: Bulk Delete Multiple Test Users
**Situation:** You have 5 test users and want to remove them all.

**Solution:**
Use SQL with multiple emails:

```sql
DO $$
DECLARE
    test_emails TEXT[] := ARRAY[
        'test1@practice.com',
        'test2@practice.com',
        'test3@practice.com',
        'test4@practice.com',
        'test5@practice.com'
    ];
    email TEXT;
    v_member_id uuid;
BEGIN
    FOREACH email IN ARRAY test_emails
    LOOP
        SELECT id INTO v_member_id FROM practice_members WHERE practice_members.email = email LIMIT 1;
        
        IF v_member_id IS NOT NULL THEN
            DELETE FROM skill_assessments WHERE practice_member_id = v_member_id;
            DELETE FROM practice_members WHERE id = v_member_id;
            DELETE FROM invitations WHERE invitations.email = email;
            RAISE NOTICE 'Deleted: %', email;
        END IF;
    END LOOP;
END $$;
```

---

## 🛡️ Safety Measures

### Built-in Protections:

1. **Confirmation Dialog:**
   - UI shows clear warning before deletion
   - Lists all data that will be removed
   - Requires explicit confirmation

2. **Error Handling:**
   - If deletion fails, error message shown
   - No partial deletions (all or nothing)
   - Page reloads only after successful deletion

3. **Logging:**
   - All deletions logged to console
   - Helps with debugging and auditing
   - Shows exactly what was deleted

4. **SQL Safety:**
   - Uses `IF EXISTS` checks
   - Won't error if table doesn't exist
   - Clear RAISE NOTICE messages
   - No cascade deletes by accident

---

## 🎯 Best Practices

### For Testing:

✅ **DO:**
- Use `+test` email aliases for testing (e.g., `jhoward+test@rpgcc.co.uk`)
- Create a dedicated test practice/account
- Document test users (keep a list)
- Clean up test data regularly

❌ **DON'T:**
- Use your admin email for testing
- Leave test data in production
- Forget which users are tests
- Share test credentials with real users

### For Production:

✅ **DO:**
- Keep admin accounts separate from team members
- Use real emails for team members
- Verify email before sending invitations
- Backup data before bulk deletions

❌ **DON'T:**
- Delete active team members without reason
- Use deletion as "undo" for incorrect assessments (better to re-assess)
- Delete without confirmation from team lead
- Mix test and production data

---

## 📞 Troubleshooting

### Issue: "Delete button not working"
**Possible Causes:**
- RLS policies blocking deletion
- Database connection issue

**Solution:**
1. Check browser console for errors
2. Try refreshing the page
3. Use SQL deletion as fallback

---

### Issue: "Deleted member still showing"
**Possible Causes:**
- Page not refreshed
- Caching issue

**Solution:**
1. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
2. Check database directly:
   ```sql
   SELECT * FROM practice_members WHERE email = 'deleted@email.com';
   ```
3. Re-run deletion if records still exist

---

### Issue: "Can't delete - foreign key constraint"
**Possible Causes:**
- Other tables referencing this team member

**Solution:**
1. Check which tables have references:
   ```sql
   SELECT * FROM information_schema.key_column_usage
   WHERE referenced_table_name = 'practice_members';
   ```
2. Delete from child tables first
3. Use the provided SQL script (it handles this)

---

## 🚀 Quick Reference

### Delete via UI (30 seconds)
```
Skills Matrix → Manage Team → Find Member → Delete → Confirm
```

### Delete via SQL (2 minutes)
```sql
-- Quick one-liner (replace email)
DELETE FROM skill_assessments WHERE practice_member_id IN (SELECT id FROM practice_members WHERE email = 'EMAIL');
DELETE FROM practice_members WHERE email = 'EMAIL';
DELETE FROM invitations WHERE email = 'EMAIL';
```

### Check if Deleted Successfully
```sql
-- Should return 0 rows
SELECT COUNT(*) FROM practice_members WHERE email = 'EMAIL';
SELECT COUNT(*) FROM skill_assessments WHERE practice_member_id = 'MEMBER_ID';
```

---

## ✅ Summary

**Key Takeaways:**

1. ⚠️ **Admin email ≠ Team member email** - Keep them separate!
2. 📊 **Data is in 3 places** - invitations, practice_members, skill_assessments
3. 🗑️ **UI deletion is easiest** - Use "Manage Team" button
4. 🔧 **SQL is available** - For advanced cases or automation
5. 🛡️ **Deletion is permanent** - No undo, but confirmation required
6. ✅ **Always clean up tests** - Don't leave test data in production

---

**Need Help?** Check the SQL script for more examples: `SUPABASE_DELETE_TEAM_MEMBER.sql`

