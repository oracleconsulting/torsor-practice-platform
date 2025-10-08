# 🧹 Remove Mock Data - Fresh Start

## What This Does

Removes the 3 test team members (Emma Wilson, Michael Chen, Sarah Johnson) and all their associated data:
- ❌ Skill assessments (~240 records)
- ❌ Development goals
- ❌ Survey sessions
- ❌ Practice member records

## What It Keeps

- ✅ Your 85 BSG-aligned skills
- ✅ Your practice record
- ✅ Database schema and tables
- ✅ Auth users (if they exist)

---

## 🚀 How to Run

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `nwmzegonnmqzflamcxfd`

2. **Navigate to SQL Editor**
   - Left sidebar → "SQL Editor"

3. **Copy & Paste**
   - Open: `REMOVE_MOCK_DATA.sql`
   - Copy the entire file
   - Paste into SQL Editor

4. **Run**
   - Click "Run" button (or Cmd/Ctrl + Enter)

5. **Verify**
   - Should see: "Cleanup Complete!"
   - All tables show 0 records
   - Skills table shows 85 skills ✅

### Option 2: Command Line

```bash
cd torsor-practice-platform

# Set your connection string
export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# Run cleanup
psql $DATABASE_URL -f REMOVE_MOCK_DATA.sql
```

---

## ✅ What You'll See After

### In Supabase:
```
=== Removing Mock Data ===
Deleted 240 skill assessments
Deleted 0 development goals
Deleted 0 survey sessions
Deleted 3 practice members
=== Cleanup Complete! ===

practice_members: 0
skill_assessments: 0
development_goals: 0
survey_sessions: 0
skills: 85 ✅
```

### In TORSOR Team Management:
- **Advisory Skills** tab: Empty heatmap (no team members)
- **Admin Dashboard**: Shows 0/16 complete
- **Team Invitations**: Empty list (ready for your real team)

---

## 🎯 Next Steps After Cleanup

1. **Refresh TORSOR**
   - Reload the Team Management page
   - Skills matrix should be empty
   - Dashboard shows 0/16

2. **Invite First Team Member**
   - Go to "Team Invitations" tab
   - Click "New Invitation"
   - Add real team member details

3. **Test the Flow**
   - Send invitation to yourself first
   - Complete assessment
   - Verify data appears correctly

4. **Invite Rest of Team**
   - Once first one works, invite remaining 15 members

---

## 🛟 Rollback (If Needed)

If you accidentally run this and want the test data back:

```bash
# Re-populate with the original test data
psql $DATABASE_URL -f supabase/migrations/20251007_final_skills.sql
```

This will recreate Emma, Michael, and Sarah with their original skill assessments.

---

## 🎉 You're Ready!

After running this cleanup, you'll have:
- ✅ Clean database
- ✅ 85 BSG skills ready
- ✅ Portal fully functional
- ✅ Ready for real team onboarding

**Run the cleanup, then start inviting your actual 16-person team!**

