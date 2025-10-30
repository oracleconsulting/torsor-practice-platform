# 🚀 Individual Team Member Portal Setup Guide

## Overview
This guide will help you set up auth accounts for all 16 team members, enabling them to access their individual portals with mandatory password changes on first login.

---

## 📋 STEP 1: Add Password Change Columns to Database

**Run this in Supabase SQL Editor:**

```sql
-- Add password change tracking columns
ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ;

-- Add helper functions
CREATE OR REPLACE FUNCTION check_password_change_required(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  requires_change BOOLEAN;
BEGIN
  SELECT pm.password_change_required INTO requires_change
  FROM practice_members pm
  WHERE pm.email = user_email
  LIMIT 1;
  
  RETURN COALESCE(requires_change, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_password_changed(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE practice_members
  SET 
    password_change_required = false,
    last_password_change = NOW()
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📋 STEP 2: Get List of Team Members Without Auth Accounts

**Run this query to see who needs accounts:**

```sql
SELECT 
  pm.id AS practice_member_id,
  pm.email,
  pm.name,
  pm.role,
  CASE 
    WHEN pm.user_id IS NOT NULL THEN '✅ Has Account'
    ELSE '❌ Needs Account'
  END AS account_status
FROM practice_members pm
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1)
  AND pm.is_active = true
ORDER BY 
  CASE WHEN pm.user_id IS NULL THEN 0 ELSE 1 END,
  pm.name;
```

---

## 📋 STEP 3: Create Auth Accounts in Supabase

### Standard Password for All: `TorsorTeam2025!`

For each team member without an account:

1. Go to **Supabase Dashboard** → **Authentication** → **Users** → **Add User**
2. Enter their **email** from the list above
3. Enter password: **`TorsorTeam2025!`**
4. **Auto-confirm email**: ✅ YES
5. Click **Create User**
6. **Copy the generated user_id**

### ⚠️ IMPORTANT: Get Email Addresses from Database

**DO NOT use hardcoded email addresses!** Run this query first:

```sql
SELECT 
  pm.name,
  pm.email,
  pm.role,
  CASE 
    WHEN pm.user_id IS NOT NULL THEN '✅ Has Auth Account'
    ELSE '❌ Needs Auth Account'
  END AS "Auth Status"
FROM practice_members pm
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1)
  AND pm.is_active = true
ORDER BY pm.name;
```

**Use the actual email addresses from the `pm.email` column above.**

You'll see approximately 16 team members with their REAL email addresses. Create auth accounts for anyone showing "❌ Needs Auth Account".

---

## 📋 STEP 4: Link Auth Accounts to Practice Members

**After creating each auth account, run this for each user:**

```sql
-- Template - Replace USER_ID and EMAIL for each person
-- USE THE ACTUAL EMAIL FROM THE DATABASE QUERY ABOVE!
UPDATE practice_members
SET 
  user_id = 'PASTE_USER_ID_HERE',
  password_change_required = true,
  updated_at = NOW()
WHERE email = 'PASTE_ACTUAL_EMAIL_FROM_DATABASE_HERE'
  AND practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1);
```

**Example (using actual email from database):**
```sql
UPDATE practice_members
SET 
  user_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc',
  password_change_required = true,
  updated_at = NOW()
WHERE email = 'luke@torsor.co.uk'  -- ⬅️ USE ACTUAL EMAIL FROM DATABASE!
  AND practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1);
```

**💡 TIP:** Keep a spreadsheet to track:
- Name
- Email
- Generated user_id
- Status (Created / Linked / Tested)

---

## 📋 STEP 5: Verify All Accounts Are Linked

```sql
SELECT 
  pm.name,
  pm.email,
  pm.role,
  u.id AS user_id,
  u.email AS auth_email,
  u.email_confirmed_at,
  pm.password_change_required,
  CASE 
    WHEN pm.user_id IS NOT NULL AND u.id IS NOT NULL THEN '✅ Linked & Ready'
    WHEN pm.user_id IS NULL THEN '❌ Not Linked'
    ELSE '⚠️ Issue'
  END AS status
FROM practice_members pm
LEFT JOIN auth.users u ON pm.user_id = u.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1)
  AND pm.is_active = true
ORDER BY status, pm.name;
```

**Expected Result:** All team members should show **"✅ Linked & Ready"**

---

## 📋 STEP 6: Test Login Flow

### Test with a Team Member (e.g., Luke if he's an Assistant Manager):

1. **Go to**: `https://torsor.co.uk/auth`
2. **Email**: `[Luke's actual email from database]`
3. **Password**: `TorsorTeam2025!`
4. **Expected Flow**:
   - ✅ Login successful
   - ✅ Redirected to `/team-member` (his portal, NOT admin dashboard)
   - ✅ Orange banner appears: "Password Change Required"
   - ✅ Modal auto-opens (mandatory, cannot dismiss)
   - ✅ Enter current password: `TorsorTeam2025!`
   - ✅ Enter new password (must meet requirements)
   - ✅ Confirm new password
   - ✅ Click "Change Password"
   - ✅ Success message → Modal closes
   - ✅ Banner disappears
   - ✅ Full dashboard access

### Test with Other Team Members:

Repeat the same flow for:
- Edward (Assistant Manager)
- Azalia (Assistant Manager)
- Lambros (Senior)
- Jack (Junior)

---

## 📋 STEP 7: Send Credentials to Team Members

### Email Template:

**Subject:** Your Torsor Skills Portal Access

Hi [NAME],

Your Torsor Skills Portal account is now active! Here are your login details:

**Login URL:** https://torsor.co.uk/auth
**Email:** [THEIR_EMAIL]@ivcaccounting.co.uk
**Temporary Password:** TorsorTeam2025!

**Important:** You'll be prompted to change your password on first login for security. Please create a strong password containing:
- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number
- One special character (!@#$%^&*)

Once logged in, you'll have access to:
- ✅ Your Skills Heatmap
- ✅ CPD Tracking
- ✅ Learning & Development Resources
- ✅ Mentoring Hub
- ✅ VARK & Personality Assessments

If you have any issues logging in, please contact [ADMIN_EMAIL].

Best regards,
[YOUR_NAME]

---

## 📋 Password Requirements

All new passwords must include:
- ✅ At least **8 characters**
- ✅ One **UPPERCASE** letter
- ✅ One **lowercase** letter
- ✅ One **number** (0-9)
- ✅ One **special character** (!@#$%^&*)

**Password Strength Meter:**
- 🔴 **Weak** (< 40% score)
- 🟠 **Fair** (40-69% score)
- 🟡 **Good** (70-89% score)
- 🟢 **Strong** (90%+ score)

---

## 🔍 TROUBLESHOOTING

### Issue: User can't login
- ✅ Check user exists in Supabase Auth
- ✅ Check email is confirmed
- ✅ Check password is correct (`TorsorTeam2025!`)
- ✅ Clear browser cache and cookies

### Issue: User redirected to admin dashboard
- ✅ Check routing fix is deployed (should go to `/team-member`)
- ✅ Check user role is not 'owner', 'admin', 'partner', or 'director'
- ✅ Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Issue: Password change modal doesn't appear
- ✅ Check `password_change_required = true` in database
- ✅ Check `checkPasswordChangeRequired()` function is running
- ✅ Check user_id is correctly linked

### Issue: Password change fails
- ✅ Check new password meets all requirements
- ✅ Check `mark_password_changed()` function exists
- ✅ Check Supabase logs for errors

---

## 📊 Quick Status Check

**Run this to see overall progress:**

```sql
SELECT 
  CASE 
    WHEN pm.user_id IS NOT NULL THEN 'Has Auth Account'
    ELSE 'Needs Auth Account'
  END AS account_status,
  COUNT(*) AS count
FROM practice_members pm
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1)
  AND pm.is_active = true
GROUP BY account_status;
```

**Target:** All 16 team members should have auth accounts!

---

## ✅ CHECKLIST

- [ ] SQL columns added (`password_change_required`, `last_password_change`)
- [ ] Helper functions created (`check_password_change_required`, `mark_password_changed`)
- [ ] Auth accounts created for all 15 team members (16 total, James already has one)
- [ ] All user_ids linked to practice_members
- [ ] All accounts have `password_change_required = true`
- [ ] Tested login with Luke
- [ ] Tested login with Edward
- [ ] Tested login with Azalia
- [ ] Tested password change flow
- [ ] Credentials sent to all team members via email
- [ ] All team members confirmed successful login

---

## 🎯 SUCCESS CRITERIA

✅ All 16 team members can login with standard password
✅ All users see password change banner on first login
✅ Password change is mandatory (modal cannot be dismissed)
✅ After password change, users have full portal access
✅ Non-admin users go to `/team-member`, NOT admin dashboard
✅ No routing issues or infinite loops

---

## 📞 SUPPORT

If any team members have issues, collect:
1. Their email address
2. Error message (screenshot if possible)
3. Browser console logs (F12 → Console)
4. What step they're stuck on

Then check:
- Supabase auth logs
- practice_members.user_id is correctly linked
- password_change_required flag status

