# 🚀 Quick Migration Guide - Populate Team Skills

## The Issue You're Seeing

Your skills matrix shows mostly zeros because the data hasn't been populated yet. The migration file `20251007_create_team_and_skills.sql` will:

1. ✅ Create 3 team members (Emma, Michael, Sarah)
2. ✅ Populate ALL 80 skills for each member
3. ✅ Set realistic skill levels and interests

## Option 1: Copy & Paste in Supabase (EASIEST)

1. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/nwmzegonnmqzflamcxfd/sql

2. **Copy the entire SQL** from:
   ```
   torsor-practice-platform/supabase/migrations/20251007_create_team_and_skills.sql
   ```

3. **Paste and click "Run"**

4. **You should see**:
   ```
   Migration Complete!
   total_assessments: 240
   team_members: 3
   skills_covered: 80
   ```

5. **Refresh your TORSOR browser tab** - all skills should now be populated! 🎉

## Option 2: Use the Shell Script

```bash
cd torsor-practice-platform
./APPLY_SKILLS_MIGRATION.sh
```

Enter your Supabase password when prompted.

## Option 3: Direct psql Command

```bash
cd torsor-practice-platform
export PGPASSWORD="your_supabase_password"
psql -h aws-0-eu-central-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.nwmzegonnmqzflamcxfd \
     -d postgres \
     -f supabase/migrations/20251007_create_team_and_skills.sql
```

## After Migration

Once complete, refresh TORSOR and you'll see:

- ✅ **Emma Wilson** (Junior Advisor) - 80 skills with beginner-intermediate levels
- ✅ **Michael Chen** (Advisory Consultant) - 80 skills with intermediate-advanced levels  
- ✅ **Sarah Johnson** (Senior Manager) - 80 skills with advanced-expert levels
- ✅ Names frozen on left side during horizontal scroll
- ✅ Full analytics: skill gaps, interest areas, development planning

## Troubleshooting

**If team_members shows 0:**
- The team members didn't exist in `practice_members` table
- This new migration creates them first, then adds skills
- Safe to run multiple times (uses `DELETE` then `INSERT`)

**If you see permission errors:**
- Make sure you're using the correct Supabase password
- Or use the Supabase SQL Editor (Option 1) which is authenticated

**Check the console in your browser:**
- Should see: `✅ Loaded real data: 3 members`
- If not, the migration may not have run successfully

