# 🔐 Reset Luke's Password - Dashboard Method (RECOMMENDED)

## ⚠️ **Issue:**
SQL password reset might not work correctly with Supabase Auth's encryption. The dashboard method is more reliable.

---

## ✅ **Method 1: Supabase Dashboard (EASIEST)**

### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project
2. Click **Authentication** in the left sidebar
3. Click **Users**

### **Step 2: Find Luke**
1. Search for: `ltyrrell@rpgcc.co.uk`
2. Or scroll to find Luke Tyrrell

### **Step 3: Reset Password**
1. Click the **three dots (...)** on Luke's row
2. Click **"Send password recovery"** OR **"Update user"**
3. If "Update user":
   - Set **Password** to: `Torsorteam2025!`
   - Make sure **Email confirmed** is checked ✅
   - Click **Save**

### **Step 4: Test Login**
Luke can now log in with:
- Email: `ltyrrell@rpgcc.co.uk`
- Password: `Torsorteam2025!`

---

## 🔧 **Method 2: SQL (Alternative)**

If you prefer SQL, run this script:

```sql
-- Find Luke and update password + confirm email
UPDATE auth.users
SET 
  encrypted_password = crypt('Torsorteam2025!', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmation_sent_at = COALESCE(confirmation_sent_at, NOW()),
  updated_at = NOW()
WHERE email = 'ltyrrell@rpgcc.co.uk';
```

---

## 📋 **Check User Status**

Run this to verify Luke's account is ready:

```sql
SELECT 
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  encrypted_password IS NOT NULL as has_password,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'ltyrrell@rpgcc.co.uk';
```

**Expected:**
- `email_confirmed`: true ✅
- `has_password`: true ✅

---

## 🎯 **Why Dashboard Method is Better:**

1. ✅ Supabase handles password hashing correctly
2. ✅ Automatically confirms email
3. ✅ Updates all necessary auth metadata
4. ✅ No risk of SQL syntax errors
5. ✅ Instant feedback if it works

---

## 🔑 **Final Login Credentials:**

**Email:** `ltyrrell@rpgcc.co.uk`  
**Password:** `Torsorteam2025!`

---

## ⚠️ **Important Notes:**

- The main reset script successfully cleared Luke's CPD data ✅
- Skills assessments are preserved ✅
- Password just needs to be reset via dashboard
- No invitation needed - Luke already has an account

**Use the Supabase Dashboard to reset the password - it's the most reliable method!** 🚀

