# Database Migration Instructions

## Issue
The application is showing these errors:
- `column cpd_activities.learnings_captured does not exist`
- `relation "public.cpd_roi_dashboard" does not exist`

## Solution
Run the migration file `20251018_add_learnings_captured.sql` on your Supabase database.

## Steps to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "+ New Query"
4. Copy and paste the contents of `supabase/migrations/20251018_add_learnings_captured.sql`
5. Click "Run" (or press Ctrl/Cmd + Enter)

### Option 2: Supabase CLI
If you have the Supabase CLI installed:
```bash
cd torsor-practice-platform
supabase db push
```

### Option 3: psql Command Line
If you have direct database access:
```bash
psql <your-database-connection-string> < supabase/migrations/20251018_add_learnings_captured.sql
```

## What This Migration Does
1. ✅ Adds `learnings_captured` column to `cpd_activities` table
2. ✅ Creates full-text search index on learnings for better search performance
3. ✅ Fixes `cpd_roi_dashboard` view to use correct column names:
   - `hours` → `hours_claimed`
   - `member_id` → `practice_member_id`
   - `team_member_skills` → `skill_assessments`
4. ✅ Adds COALESCE to prevent NULL aggregation errors

## Verification
After running the migration, refresh your browser and:
1. Your "Excel advanced CPD - 2 hours" activity should appear in Recent CPD Activities
2. The Skills Impact tab should load without errors
3. All text should be clearly readable (dark backgrounds)

## Files Changed
- `supabase/migrations/20251018_add_learnings_captured.sql` (NEW)
- `src/components/accountancy/team/CPDOverview.tsx` (UPDATED - contrast fixes)
- `src/pages/accountancy/team/CPDSkillsBridgePage.tsx` (UPDATED - tabs)

