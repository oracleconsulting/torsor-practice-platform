# 🚀 RUN THIS MIGRATION NOW

## ⚠️ Your Issue: "No Profiles Available"

This is because the database tables don't exist yet. You need to run the migration **once** to create them.

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **Step 1: Go to Supabase Dashboard**
1. Open https://supabase.com/dashboard
2. Log in to your account
3. Select your **TORSOR project**

### **Step 2: Open SQL Editor**
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button

### **Step 3: Copy the Migration**
1. Open this file on your computer:
   ```
   /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform/supabase/migrations/20251104_role_definitions_system.sql
   ```
2. Select ALL content (Cmd+A / Ctrl+A)
3. Copy it (Cmd+C / Ctrl+C)

### **Step 4: Run the Migration**
1. Go back to Supabase SQL Editor
2. Paste the migration (Cmd+V / Ctrl+V)
3. Click **"Run"** button (or press Cmd+Enter / Ctrl+Enter)
4. Wait for "Success" message (should take 2-3 seconds)

### **Step 5: Refresh Your App**
1. Go back to your TORSOR app (torsor.co.uk/team)
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Click **"INDIVIDUAL PROFILES"** tab
4. Profiles will auto-calculate (wait 30-60 seconds)

---

## ✅ What the Migration Does

Creates 4 new tables:
- `role_definitions` - Store role requirements
- `member_role_assignments` - Track who has which role  
- `individual_assessment_profiles` - Computed profiles
- `role_competency_gaps` - Gap tracking

Seeds 5 default roles:
- Audit Junior
- Audit Senior  
- Audit Manager
- Tax Advisor
- Corporate Finance Analyst

---

## 🎯 After Migration

You'll see:
- ✅ Individual profiles for all team members with assessments
- ✅ Role suitability scores (Advisory, Technical, Hybrid, Leadership)
- ✅ Top strengths with evidence
- ✅ Development areas with action plans
- ✅ Training priorities
- ✅ Career trajectories
- ✅ 5 pre-configured roles you can edit

---

## 🐛 If You Get Errors

### "relation already exists"
- Tables already created - skip to Step 5 (refresh app)

### "column does not exist"  
- Run the full migration again
- It has `IF NOT EXISTS` checks so it's safe to re-run

### Still "No Profiles Available"
- Check team members have completed assessments:
  - EQ Assessment ✅
  - Belbin Assessment ✅
  - Motivational Drivers ✅
  - At least 3 skills rated ✅
- Click "Refresh All" button
- Wait 30-60 seconds for calculation

---

## 🎊 That's It!

Once you run this migration, the "No Profiles Available" message will disappear and you'll see your team's profiles!

**Run it now!** 🚀

---

**File Location:**
```
torsor-practice-platform/supabase/migrations/20251104_role_definitions_system.sql
```

**Seniority Levels (Fixed):**
- Partner
- Director
- Manager  
- Assistant Manager
- Senior
- Junior

✅ Ready to run!

