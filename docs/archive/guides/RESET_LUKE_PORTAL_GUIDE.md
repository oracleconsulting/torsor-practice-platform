# Reset Luke Tyrrell's Portal - Quick Guide

## 🎯 **What This Script Does:**

### ✅ **Keeps (Safe):**
- ✅ All 111 skills assessment data
- ✅ User account and profile
- ✅ Practice member record

### 🗑️ **Removes (Test Data):**
- 🗑️ All CPD activities (test entries)
- 🗑️ All CPD recommendations
- 🗑️ All tickets (if any)
- 🗑️ VARK assessment (can redo)
- 🗑️ OCEAN assessment (can redo)
- 🗑️ Strengths assessment (can redo)
- 🗑️ Motivations assessment (can redo)
- 🗑️ Service line preferences (can redo)

### 🔄 **Resets:**
- 🔑 Password: `Torsorteam2025!`
- 📊 CPD hours: 0
- ✅ Assessment completion status: Reset

---

## 🚀 **How to Run:**

### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project
2. Go to **SQL Editor**

### **Step 2: Run the Migration**
1. Copy the contents of `supabase/migrations/20251104_reset_luke_tyrrell_portal.sql`
2. Paste into SQL Editor
3. Click **Run**

### **Step 3: Check the Logs**
You'll see output like:
```
📋 Found User:
  User ID: abc-123...
  Member ID: def-456...
  Name: Luke Tyrrell

📊 PREVIEW - What will happen:
  ✅ KEEP: 111 skill assessments
  🗑️  DELETE: 5 CPD activities
  🗑️  DELETE: 3 CPD recommendations
  🗑️  DELETE: 0 tickets
  🔑 UPDATE: Password to Torsorteam2025!
  🔄 RESET: All other assessments

✅ Deleted 5 CPD activities
✅ Deleted 3 CPD recommendations
✅ Deleted 0 tickets
✅ Reset assessments - ready to redo
✅ Skills assessment data preserved
✅ Password reset to: Torsorteam2025!
✅ Reset CPD hours to 0

🎉 RESET COMPLETE!

📋 Luke Tyrrell Portal Status:
  Email: Ltyrell@rpgcc.co.uk
  Password: Torsorteam2025!
  ✅ Skills Assessment: 111 assessments preserved
  ✅ CPD Activities: Cleared (0)
  ✅ Other Assessments: Ready to complete (0/7)
  ✅ CPD Hours: Reset to 0

👉 Luke can now log in and complete:
   1. VARK Assessment
   2. OCEAN Assessment
   3. Strengths Assessment
   4. Motivations Assessment
   5. Service Line Preferences
   6. AI Profile Generation
   7. CPD Planning
```

---

## 🔐 **New Login Credentials:**

**Email:** `ltyrrell@rpgcc.co.uk`  
**Password:** `Torsorteam2025!`

---

## ✅ **Verification (Optional):**

After running the script, you can verify with this query:

```sql
SELECT 
  pm.name,
  pm.email,
  pm.cpd_completed_hours,
  (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = pm.id) as skill_assessments,
  (SELECT COUNT(*) FROM cpd_activities WHERE practice_member_id = pm.id) as cpd_activities,
  i.vark_results IS NOT NULL as has_vark,
  i.ocean_results IS NOT NULL as has_ocean,
  i.assessment_complete
FROM practice_members pm
LEFT JOIN invitations i ON i.practice_member_id = pm.id
WHERE pm.email = 'ltyrrell@rpgcc.co.uk';
```

**Expected Results:**
- `skill_assessments`: 111
- `cpd_activities`: 0
- `cpd_completed_hours`: 0
- `has_vark`: false
- `has_ocean`: false
- `assessment_complete`: false

---

## 🎯 **What Luke Can Do Now:**

1. **Log in** with `Torsorteam2025!`
2. **See his skills data** (all 111 assessments intact)
3. **Complete the 7 remaining assessments:**
   - VARK Assessment
   - OCEAN Assessment
   - Strengths Assessment
   - Motivations Assessment
   - Service Line Preferences
   - Generate AI Profile
   - Start CPD Planning

4. **Fresh CPD tracking** (no test data)
5. **Full access** to all portal features

---

## ⚠️ **Important Notes:**

- ✅ This is **SAFE** - it only affects Luke's account
- ✅ All skills assessment data is **PRESERVED**
- ✅ This is a **one-way operation** - test data will be permanently deleted
- ✅ Luke will need to **log out and log back in** after the password change

---

## 🚀 **Ready to Run!**

Just paste the SQL script into Supabase SQL Editor and click Run. Luke's portal will be reset and ready for a fresh start! 🎉

