# 🔐 Reset Luke's Password - Alternative Methods

## **Method 1: Send Password Recovery Email (EASIEST)**

### **From Supabase Dashboard:**
1. Go to **Authentication** → **Users**
2. Find `ltyrrell@rpgcc.co.uk`
3. Look for a button that says **"Send password recovery"** or **"Send reset email"**
4. Click it
5. Luke will receive an email to reset his password
6. He can set it to `Torsorteam2025!` (or anything else)

---

## **Method 2: Use Supabase SQL Editor (DIRECT)**

This should work better than the previous attempt:

```sql
-- Update Luke's password with proper Supabase encryption
UPDATE auth.users
SET 
  encrypted_password = crypt('Torsorteam2025!', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'ltyrrell@rpgcc.co.uk';

-- Verify it worked
SELECT 
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users
WHERE email = 'ltyrrell@rpgcc.co.uk';
```

---

## **Method 3: Via Your Application**

If your app has a "Forgot Password" feature:
1. Go to the login page
2. Click "Forgot Password"
3. Enter: `ltyrrell@rpgcc.co.uk`
4. Luke will get a reset email

---

## **Method 4: Use Supabase CLI (if installed)**

```bash
supabase auth users update ltyrrell@rpgcc.co.uk --password "Torsorteam2025!"
```

---

## **Method 5: Recreate the User (NUCLEAR OPTION)**

If nothing else works, you can:

1. **Delete Luke's auth user** (keep practice_members record):
```sql
DELETE FROM auth.users WHERE email = 'ltyrrell@rpgcc.co.uk';
```

2. **Re-invite him** through your admin portal
3. He'll get a fresh invitation email
4. All his data (skills, practice member record) will remain intact

---

## **🔍 Check Current State:**

Run this to see what we're working with:

```sql
SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at,
  confirmation_sent_at,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE email = 'ltyrrell@rpgcc.co.uk';
```

---

## **💡 Recommended Order:**

1. ✅ Try **"Send password recovery"** button in dashboard (if available)
2. ✅ Try **SQL update** (Method 2)
3. ✅ Try **"Forgot Password"** from login page
4. ✅ Last resort: Delete auth user and re-invite

Let me know which option you want to try! 🚀

