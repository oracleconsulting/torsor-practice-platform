# Quick Guide: Populate Team Skills Data

## Issue
The Skills Matrix shows all zeros because the database doesn't have the team skills data yet.

## Solution
Run the migration against your Supabase database.

## Option 1: Via Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project: **nwmzegonnmqzflamcxfd**
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the contents of: `supabase/migrations/20251007_complete_team_skills.sql`
6. Click **Run** at the bottom right
7. Refresh your TORSOR page

## Option 2: Via Command Line

```bash
# Using psql (if you have the connection string)
psql "your-supabase-connection-string" -f supabase/migrations/20251007_complete_team_skills.sql

# OR using Supabase CLI
supabase db push
```

## What This Does

The migration will:
- ✅ Find your 3 team members (Emma, Michael, Sarah)
- ✅ Populate ALL 80 skills for each member
- ✅ Set realistic skill levels (Emma: 1-3, Michael: 3-4, Sarah: 4-5)
- ✅ Set interest levels for career development planning
- ✅ Total: 240 skill assessments created

## After Running

Once the migration completes:

1. **Refresh** your TORSOR page
2. Navigate to: **Team Management** → **Advisory Skills**
3. You should now see:
   - ✅ Emma Wilson with varying skill levels (1-3)
   - ✅ Michael Chen with mid-level skills (3-4)
   - ✅ Sarah Johnson with expert-level skills (4-5)
   - ✅ Color-coded heatmap
   - ✅ Gap analysis data
   - ✅ Team metrics

## The Names Column

The team member names are now **sticky** (frozen) when you scroll horizontally to see more skills!

## Troubleshooting

**Still showing zeros?**
- Make sure the migration ran successfully
- Check that your 3 team members exist in the `practice_members` table
- Try refreshing the page (Cmd+R or Ctrl+R)
- Check browser console for errors

**Need help?**
The migration file is at: `supabase/migrations/20251007_complete_team_skills.sql`

