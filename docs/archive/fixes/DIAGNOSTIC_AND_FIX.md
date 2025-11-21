# 🔧 DIAGNOSTIC & FIX GUIDE

## What I Can See in Your Screenshots:

### ✅ WORKING:
1. **Role Definitions Tab** - Shows "5 Defined Roles" ✓
2. **Tabs are visible** - Both INDIVIDUAL PROFILES and ROLE DEFINITIONS ✓
3. **Navigation works** - You can click between tabs ✓

### ❌ NOT WORKING:
1. **Individual Profiles Tab** - Shows "No Profiles Available"
2. **Tables don't exist** - Database tables haven't been created yet

---

## 🎯 THE PROBLEM

Your console shows:
```
[IndividualProfiles] Loaded profiles: 0
```

This means:
- The code is running ✓
- It's trying to fetch from database ✓  
- But tables don't exist yet ✗

---

## 🚀 THE SOLUTION (3 Steps)

### **Step 1: Open Supabase**
Go to: https://supabase.com/dashboard
- Select your TORSOR project
- Click "SQL Editor" (left sidebar)
- Click "New Query"

### **Step 2: Run This File**
Open this file I just created:
```
/Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform/COPY_THIS_TO_SUPABASE.sql
```

**Instructions:**
1. Open the file
2. Select ALL (Cmd+A)
3. Copy (Cmd+C)
4. Paste into Supabase SQL Editor (Cmd+V)
5. Click "Run" button (or Cmd+Enter)
6. **Wait for "Success. No rows returned"** ✅

### **Step 3: Check Results**
After "Success" message:
1. Refresh your TORSOR app (Cmd+Shift+R)
2. Go to Team Management
3. Click **INDIVIDUAL PROFILES** tab (orange button)
4. Wait 30-60 seconds for calculation
5. You should see team members appear!

---

## 🔍 WHAT TO EXPECT

### Before Migration:
```
No Profiles Available
Individual profiles will appear here once team members complete their assessments.
```

### After Migration:
```
Loading Individual Profiles
Analyzing assessment data for each team member...
```

Then (after 30-60 seconds):
```
[Accordion cards for each team member]
James Howard - Senior Consultant
Role Match: 85% | Strengths: 8 | Gaps: 1
```

---

## 🐛 IF YOU GET ERRORS

### Error: "relation 'role_definitions' already exists"
**Solution:** Tables are already created! 
- Skip migration
- Just refresh app (Cmd+Shift+R)
- Click INDIVIDUAL PROFILES tab
- Wait for calculation

### Error: "permission denied"
**Solution:** You need admin access to Supabase
- Check you're logged into correct account
- Verify you're in the TORSOR project
- Ask team member with admin access

### Still "No Profiles Available" after migration
**Possible causes:**
1. **No assessments completed**
   - Team members need: EQ + Belbin + Motivation + Skills
   - Check "Assessment Insights" tab to see completion status

2. **Calculation not started**
   - Click "Refresh All" button (top right)
   - Wait 30-60 seconds

3. **Browser cache**
   - Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
   - Or clear browser cache

---

## 📊 HOW TO VERIFY TABLES EXIST

In Supabase SQL Editor, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'role_definitions',
  'member_role_assignments',
  'individual_assessment_profiles',
  'role_competency_gaps'
);
```

**Expected result:**
```
role_definitions
member_role_assignments
individual_assessment_profiles
role_competency_gaps
```

If you see these 4 tables → Migration successful! ✅

---

## 🎯 QUICK CHECKLIST

- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy `COPY_THIS_TO_SUPABASE.sql` contents
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] See "Success" message
- [ ] Refresh TORSOR app (Cmd+Shift+R)
- [ ] Click INDIVIDUAL PROFILES tab
- [ ] Wait 30-60 seconds
- [ ] See team member profiles!

---

## 💡 WHY THIS HAPPENS

The Individual Profiles feature needs 4 database tables that don't exist in your database yet. This is a **one-time setup** - once you run the migration, it will work forever.

The migration is **safe to run**:
- ✅ Has `IF NOT EXISTS` checks
- ✅ Won't delete existing data
- ✅ Won't affect other tables
- ✅ Can be run multiple times safely

---

## 📞 STILL STUCK?

Check your browser console (F12 → Console tab) for errors like:
- `relation "individual_assessment_profiles" does not exist` → Need to run migration
- `no rows returned` → Migration successful, but no assessments completed yet
- `permission denied` → Database access issue

---

**File to run:** `COPY_THIS_TO_SUPABASE.sql` (I just created this for you)

**Takes:** 2-3 seconds to run

**One-time setup:** Never need to run again!

🚀 **Do it now and your profiles will appear!**

