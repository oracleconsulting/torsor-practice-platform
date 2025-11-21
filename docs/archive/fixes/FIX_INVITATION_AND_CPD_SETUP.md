# 🔧 Fix Invitation System & Add CPD Configuration

## Issues to Fix
1. ❌ **Invitations table doesn't exist** - `relation "public.invitations" does not exist`
2. ❌ **Infinite recursion in RLS** - `infinite recursion detected in policy for relation "practice_members"`
3. ❌ **No CPD configuration** - Need to add CPD hours tracking for admin

---

## 🎯 Solution: Run 3 SQL Migrations

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/nwmzegonnmqzflamcxfd/sql/new
2. You'll run 3 migrations in order

---

## Migration 1: Fix RLS Infinite Recursion

**Copy and paste this entire script:**

```sql
-- =====================================================
-- FIX: Infinite recursion in practice_members RLS
-- =====================================================

-- Drop any existing problematic policies on practice_members
DROP POLICY IF EXISTS "Users can view own practice members" ON practice_members;
DROP POLICY IF EXISTS "Users can view practice members" ON practice_members;
DROP POLICY IF EXISTS "Practice members can view themselves" ON practice_members;
DROP POLICY IF EXISTS "Practice members can view team" ON practice_members;

-- Create SECURITY DEFINER function to bypass RLS and prevent recursion
CREATE OR REPLACE FUNCTION is_practice_member(p_user_id UUID, p_practice_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  member_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM practice_members 
    WHERE user_id = p_user_id 
    AND practice_id = p_practice_id
  ) INTO member_exists;
  
  RETURN member_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_practice_ids(p_user_id UUID)
RETURNS TABLE(practice_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT pm.practice_id 
  FROM practice_members pm
  WHERE pm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;

-- Create NEW non-recursive policies
CREATE POLICY "Users can view practice_members in their practices"
ON practice_members FOR SELECT
USING (
  practice_id IN (
    SELECT get_user_practice_ids(auth.uid())
  )
);

CREATE POLICY "Users can insert practice_members in their practices"
ON practice_members FOR INSERT
WITH CHECK (
  practice_id IN (
    SELECT get_user_practice_ids(auth.uid())
  )
);

CREATE POLICY "Users can update practice_members in their practices"
ON practice_members FOR UPDATE
USING (
  practice_id IN (
    SELECT get_user_practice_ids(auth.uid())
  )
);

CREATE POLICY "Service role can manage all practice_members"
ON practice_members FOR ALL
USING (auth.role() = 'service_role');

SELECT '✅ RLS Recursion Fixed!' as status;
```

**Click "Run"** and you should see: `✅ RLS Recursion Fixed!`

---

## Migration 2: Create Invitations System

**Copy and paste this entire script:**

(See file: `torsor-practice-platform/supabase/migrations/20251008_invitations_system.sql`)

Or run this shorter version:

```sql
-- Just copy the ENTIRE contents of:
-- torsor-practice-platform/supabase/migrations/20251008_invitations_system.sql
```

**Click "Run"** and you should see: `✅ Full Invitation System Created!`

---

## Migration 3: Add CPD Configuration

**Copy and paste this entire script:**

(See file: `torsor-practice-platform/supabase/migrations/20251008_cpd_configuration.sql`)

Or run this shorter version:

```sql
-- Just copy the ENTIRE contents of:
-- torsor-practice-platform/supabase/migrations/20251008_cpd_configuration.sql
```

**Click "Run"** and you should see: `✅ CPD Configuration System Created!`

---

## ✅ Verification

After running all 3 migrations, run this query to verify:

```sql
SELECT 
  '1. Invitations table' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  '2. RLS Recursion fixed',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_practice_ids')
    THEN '✅ FIXED' ELSE '❌ NOT FIXED' END
UNION ALL
SELECT 
  '3. CPD Configuration',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'practices' AND column_name = 'cpd_total_expected_hours'
  ) THEN '✅ ADDED' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  '4. CPD Progress View',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'cpd_progress_view')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END;
```

**Expected output:**
```
✅ 1. Invitations table - EXISTS
✅ 2. RLS Recursion fixed - FIXED
✅ 3. CPD Configuration - ADDED
✅ 4. CPD Progress View - EXISTS
```

---

## 🚀 After Migrations Complete

### Test Invitation System
1. Refresh TORSOR (Cmd/Ctrl + Shift + R)
2. Go to **Team Management → Team Invitations**
3. Click **"New Invitation"**
4. Should now work without errors! 🎉

### Configure CPD Settings
1. Go to **Team Management → Admin Dashboard**
2. You'll see new CPD configuration section
3. Set your practice's CPD requirements:
   - **Total Expected CPD Hours**: e.g., 40 hours/year
   - **Determined Hours**: e.g., 20 hours (practice-mandated)
   - **Self-Allocated Hours**: e.g., 20 hours (member choice)

### Configure Resend Email
Don't forget to add your Resend API key to Railway:
```bash
VITE_RESEND_API_KEY=re_your_api_key_here
VITE_FROM_EMAIL=noreply@rpgcc.com
VITE_FROM_NAME=RPGCC Team Portal
```

---

## 📋 What This Gives You

### Invitation System
- ✅ Send email invitations to team members
- ✅ Track invitation status (pending, accepted, expired)
- ✅ Automatic reminders
- ✅ Bulk CSV import
- ✅ Event logging
- ✅ Link generation for easy onboarding

### CPD Configuration
- ✅ Set practice-wide CPD requirements
- ✅ Split between determined and self-allocated hours
- ✅ Track progress per team member
- ✅ Real-time progress dashboard
- ✅ Evidence tracking
- ✅ Verification workflow

### No More Errors
- ✅ No more `relation "public.invitations" does not exist`
- ✅ No more `infinite recursion detected in policy`
- ✅ Team invitations fully functional
- ✅ Skills matrix shows real data only
- ✅ CPD tracking linked to skills development

---

## 🆘 Troubleshooting

### If invitations still don't work:
```sql
-- Check if table exists
SELECT COUNT(*) FROM invitations;
```

### If RLS recursion persists:
```sql
-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN ('get_user_practice_ids', 'is_practice_member');
```

### If CPD fields are missing:
```sql
-- Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'practices' 
AND column_name LIKE 'cpd%';
```

---

## 🎯 Next Steps

1. ✅ Run all 3 migrations in Supabase
2. ✅ Refresh TORSOR
3. ✅ Test invitation system
4. ✅ Configure CPD settings in Admin Dashboard
5. ✅ Add Resend API key to Railway
6. ✅ Start inviting your 16-person team!

**Let's get you live for Monday! 🚀**


